/**
 * aura-dsh / client / src / SelectionLayer.jsx
 * 面板圈选提问层（MVP-1）。
 *
 * 交互：点面板顶部「圈选提问」→ 进入圈选模式（十字光标）→ 在面板上拖拽画框
 *      → 命中检测（矩形 ∩ 卡片）→ 浮层输入问题 → 回调 onInquiry。
 *
 * 设计要点：
 *  - 圈选层覆盖整个面板（absolute inset-0），只在 active 时可交互
 *  - 命中检测用 getBoundingClientRect 的矩形相交（不要求完全包含）
 *  - 浮层输入框就地弹出（不跳对话区），提交后由父组件拼上下文发到会话
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RadialMenu from './RadialMenu';

/** 径向菜单的通用四问（缺省选项） */
/**
 * 圈选精确命中：卡片内"有语义"的子元素选择器。
 * 覆盖自定义组件（aura-*）与 antd 组件（ant-*）的项级元素。
 */
const FINE_SELECTORS = [
  '.aura-metric-item',
  '.aura-insight-item',
  '.aura-article-item',
  '.aura-step-item',
  '.aura-timeline-event',
  '.ant-list-item',
  '.ant-steps-item',
  '.ant-timeline-item',
  'li', 'blockquote',
];

/** rect 包含判断 */
function rectContains(outer, inner) {
  return outer.left <= inner.left + 1 && outer.top <= inner.top + 1
    && outer.right >= inner.right - 1 && outer.bottom >= inner.bottom - 1;
}

/**
 * 收集圈选矩形命中的卡片内子元素。
 * 策略：
 *   1. 表格行 <tr>：水平覆盖率 ≥ 60%（或完整框住）即视为"整行"，
 *      单元格文本以 " / " 连接成一条
 *   2. 未被整行覆盖的行，其 <td>/<th> 若完整框住 → 单独一条（单元格级）
 *   3. 其余项级元素（aura-* / ant-* / li 等），按 DOM 顺序
 */
function collectFineHits(containerEl, selAbs) {
  const hits = [];
  if (!containerEl || !selAbs) return hits;

  const inSel = (r) => selAbs.left < r.right && selAbs.right > r.left && selAbs.top < r.bottom && selAbs.bottom > r.top;
  const fullyIn = (r) => selAbs.left <= r.left + 2 && selAbs.top <= r.top + 2
    && selAbs.right >= r.right - 2 && selAbs.bottom >= r.bottom - 2;
  /** 水平覆盖率（圈选与元素宽度的重叠比例） */
  const widthRatio = (r) => {
    const overlap = Math.min(selAbs.right, r.right) - Math.max(selAbs.left, r.left);
    return r.width > 0 ? Math.max(0, overlap) / r.width : 0;
  };

  for (const card of containerEl.querySelectorAll('[data-aura-card-id]')) {
    const cr = card.getBoundingClientRect();
    if (!inSel({ left: cr.left, top: cr.top, right: cr.right, bottom: cr.bottom })) continue;
    const cardId = card.dataset.auraCardId;
    const cardTitle = card.dataset.auraCardTitle || cardId;

    // 1) 表格行（覆盖大部分宽度即整行）
    const coveredRows = new Set();
    for (const tr of card.querySelectorAll('tr')) {
      const r = tr.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || !inSel({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })) continue;
      if (!fullyIn(r) && widthRatio(r) < 0.6) continue;
      const cells = [...tr.querySelectorAll('td,th')]
        .map((td) => (td.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      if (!cells.length) continue;
      coveredRows.add(tr);
      hits.push({ cardId, cardTitle, text: cells.join(' / '), order: r.top, domIndex: hits.length });
    }

    // 2) 未被整行覆盖的单元格（完整框住才算）
    for (const cell of card.querySelectorAll('td,th')) {
      const tr = cell.closest('tr');
      if (tr && coveredRows.has(tr)) continue;
      const r = cell.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || !fullyIn(r)) continue;
      const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      hits.push({ cardId, cardTitle, text: text.slice(0, 120), order: r.top, domIndex: hits.length });
    }

    // 3) 其他项级元素
    for (const el of card.querySelectorAll(FINE_SELECTORS.join(','))) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || !inSel({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })) continue;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      hits.push({ cardId, cardTitle, text: text.slice(0, 120), order: r.top, domIndex: hits.length });
    }
  }

  // 按阅读顺序（自上而下、自左而右）
  hits.sort((a, b) => (a.order - b.order) || (a.domIndex - b.domIndex));
  return hits.map(({ cardId, cardTitle, text }) => ({ cardId, cardTitle, text }));
}

const RADIAL_OPTIONS = [
  { label: '解释这段', prompt: '请解释圈选的这部分内容。' },
  { label: '为什么这样', prompt: '为什么会出现这样的情况？' },
  { label: '有什么问题', prompt: '这里有什么潜在问题或风险？' },
  { label: '怎么改进', prompt: '可以怎么改进？' },
];

/** 两矩形是否相交 */
function intersects(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export default function SelectionLayer({ active, containerRef, onInquiry, onCancel }) {
  const [rect, setRect] = useState(null);        // 正在画的选框 { left, top, width, height }
  const [hits, setHits] = useState(null);        // 命中卡片 [{ id, title }]
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // 径向菜单：位置（相对面板中心点）与「自定义」输入模式
  const [menuPos, setMenuPos] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [fineHits, setFineHits] = useState(null);
  const startRef = useRef(null);                 // 起点（相对容器）
  const inputRef = useRef(null);

  // 进入圈选模式时聚焦输入（若已有浮层）
  useEffect(() => {
    if (!active) {
      setRect(null);
      setHits(null);
      setQuestion('');
    }
  }, [active]);

  // Esc 直接退出圈选模式
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, onCancel]);

  /** 把鼠标事件转成相对容器的坐标 */
  const toLocal = useCallback((e) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }, [containerRef]);

  const handlePointerDown = useCallback((e) => {
    if (!active || hits) return;                 // 已有结果时不重复圈选
    e.preventDefault();
    const p = toLocal(e);
    startRef.current = p;
    setRect({ left: p.x, top: p.y, width: 0, height: 0 });
  }, [active, hits, toLocal]);

  const handlePointerMove = useCallback((e) => {
    if (!startRef.current || hits) return;
    const p = toLocal(e);
    const s = startRef.current;
    setRect({
      left: Math.min(s.x, p.x),
      top: Math.min(s.y, p.y),
      width: Math.abs(p.x - s.x),
      height: Math.abs(p.y - s.y),
    });
  }, [hits, toLocal]);

  const handlePointerUp = useCallback((e) => {
    if (!startRef.current || hits) return;
    const p = toLocal(e);
    const s = startRef.current;
    const sel = {
      left: Math.min(s.x, p.x),
      top: Math.min(s.y, p.y),
      width: Math.abs(p.x - s.x),
      height: Math.abs(p.y - s.y),
    };
    startRef.current = null;

    // 太小的框视为误操作
    if (sel.width < 12 || sel.height < 12) {
      setRect(null);
      return;
    }

    // 命中检测：面板内所有带 data-aura-card-id 的卡片
    const box = containerRef.current?.getBoundingClientRect();
    // 注意：selAbs 必须在 if 块外定义——collectFineHits 也要用它
    const selAbs = box
      ? {
        left: sel.left + box.left,
        top: sel.top + box.top,
        right: sel.left + box.left + sel.width,
        bottom: sel.top + box.top + sel.height,
      }
      : null;
    const found = [];
    if (selAbs) {
      containerRef.current.querySelectorAll('[data-aura-card-id]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (intersects(selAbs, { left: r.left, top: r.top, right: r.right, bottom: r.bottom })) {
          found.push({
            id: el.dataset.auraCardId,
            title: el.dataset.auraCardTitle || el.dataset.auraCardId,
          });
        }
      });
    }
    setRect(sel);
    setHits(found);
    setFineHits(found.length > 0 && selAbs ? collectFineHits(containerRef.current, selAbs) : null);
    if (found.length === 0) {
      // 没命中卡片 → 提示后自动退出
      setTimeout(() => { setRect(null); setHits(null); }, 1200);
      return;
    }
    // 命中卡片 → 在鼠标松开处弹出径向菜单（只看方向，不看半径）
    // 用视口坐标（e.clientX/clientY）：菜单是 position:fixed，避免面板滚动导致偏移
    setMenuPos({ x: e.clientX, y: e.clientY });
    setCustomMode(false);
  }, [hits, toLocal, containerRef]);

  const resetSelection = useCallback(() => {
    setRect(null);
    setHits(null);
    setQuestion('');
    setError(null);
    setMenuPos(null);
    setCustomMode(false);
  }, []);

  const submit = useCallback(async (textOverride) => {
    if (!hits?.length || busy) return;
    const raw = String(textOverride ?? question).trim();
    if (!raw) { inputRef.current?.focus(); return; }
    // 径向菜单/自定义输入的问题带上命中卡片名，避免「为什么会这样」这类过泛问法
    const q = hits.length === 1
      ? `针对「${hits[0].title ?? hits[0].id}」中圈选的这部分：${raw}`
      : raw;
    setBusy(true);
    setError(null);
    try {
      await onInquiry?.({ cards: hits, rect, question: q, fineHits: fineHits ?? [] });
      setRect(null);
      setHits(null);
      setQuestion('');
      onCancel?.();   // 发送后退出圈选模式（一次提问即完成）
    } catch (e) {
      console.error('[aura-select] 发送失败:', e);
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [hits, busy, question, rect, onInquiry]);

  if (!active) return null;

  return (
    <div
      className={`aura-select-layer${hits ? ' aura-select-layer--done' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="button"
      tabIndex={-1}
      aria-label="圈选提问"
    >
      {rect ? (
        <div
          className="aura-select-box"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ) : (
        <div className="aura-select-hint">拖拽圈选要提问的区域（Esc 退出）</div>
      )}

      {/* 命中卡片 → 径向菜单（鼠标松开处）；「自定义」→ 下面的输入浮层 */}
      {hits && hits.length > 0 && menuPos && !customMode ? (
        <RadialMenu
          position={menuPos}
          options={RADIAL_OPTIONS}
          onSelect={(opt) => submit(opt.prompt)}
          onCustom={() => setCustomMode(true)}
          onCancel={resetSelection}
        />
      ) : null}

      {hits && (hits.length === 0 || customMode) ? (
        <div
          className="aura-select-popover"
          style={{ left: Math.min(rect.left, 240), top: Math.min(rect.top + rect.height + 10, 320) }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="aura-select-popover-title">
            {hits.length === 0
              ? '没有命中卡片，请重新圈选'
              : `命中 ${hits.length} 张卡：${hits.map((h) => h.title).join('、')}`}
          </div>
          {hits.length > 0 ? (
            <>
              <textarea
                ref={inputRef}
                className="aura-select-input"
                rows={2}
                placeholder="你想问什么？（例如：这段为什么突然跳升）"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
                }}
              />
              {error ? <div className="aura-select-error">❌ {error}</div> : null}
              <div className="aura-select-actions">
                <button type="button" className="aura-select-btn aura-select-btn--primary" disabled={busy} onClick={submit}>
                  {busy ? '发送中…' : '发送'}
                </button>
                <button type="button" className="aura-select-btn" onClick={() => onCancel?.()}>
                  取消
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
