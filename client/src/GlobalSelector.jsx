/**
 * aura-dsh / client / src / GlobalSelector.jsx
 * 全局圈选层（P1）：按 ⌘⌥S 后覆盖整个视口，可圈选任意区域
 * （对话流、aura 面板、其他侧边栏插件内容）。
 *
 * 与面板内 SelectionLayer 的分工：
 *   - 面板内圈选：精确（有 aura 卡片数据），通过面板「圈选提问」按钮进入
 *   - 全局圈选（本组件）：通用（适配器 + 通用 DOM 兜底），通过快捷键进入
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RadialMenu from './RadialMenu';
// 注意：DSH 的 client 插件用自定义 __ModuleLoader__，不支持动态 import()，
// 必须静态 import（打包进 bundle）。
import { domToCanvas } from 'modern-screenshot';
import { collectHits, createDefaultAdapters } from './selection/adapters';

const RADIAL_OPTIONS = [
  // 扇区按「使用频率 + 语义分组」排布：
  //   上=给出操作（执行）· 右上=整理并推送（产出）· 右下=解释这段（基础）
  //   左下=质疑（验证）· 左上=查来源（验证）
  { label: '给出操作', prompt: '基于圈选内容，给出可直接执行的操作（命令/步骤/代码），并说明预期结果。', color: 'var(--dsw-static-deepseek-500, #4176e6)', icon: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 2 4 9h3l-.5 5L12 7H9z"/></g> },
  { label: '整理并推送', prompt: '请提炼圈选内容的要点，并**结合最近几轮对话的上下文**，整理成合适的卡片推送到右侧面板（按内容选择便签/指标/表格/洞察/HTML 报告等形态）。', color: 'var(--dsw-alias-state-success-primary, #1f9d55)', icon: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12V3M5 6l3-3 3 3M3 14h10"/></g> },
  { label: '解释这段', prompt: '请解释圈选的这部分内容（它是什么、含义、作用）。', color: 'var(--dsw-alias-label-secondary, #646a73)', icon: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/></g> },
  { label: '质疑', prompt: '请对圈选的这部分内容提出质疑：有哪些问题、反例或不确定之处？', color: 'var(--dsw-alias-state-warning-primary, #d7771c)', icon: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4.5"/><circle cx="8" cy="11.5" r=".6" fill="currentColor" stroke="none"/></g> },
  { label: '查来源', prompt: '请核查圈选内容的来源与依据：出自哪里、是否准确、有无可验证的出处。', color: 'var(--dsw-alias-state-info-primary, #6b4fd8)', icon: <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4"/><path d="M10.5 10.5 14 14"/></g> },
];

/** 判断圈选区域是否包含"视觉类"内容（图表/图形/iframe）→ 需要截图 */
function needsVisualCapture(rect) {
  const points = [
    [rect.left + 4, rect.top + 4],
    [rect.right - 4, rect.top + 4],
    [rect.left + 4, rect.bottom - 4],
    [rect.right - 4, rect.bottom - 4],
    [(rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2],
  ];
  const debug = [];
  for (const [x, y] of points) {
    const stack = typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)];
    for (const el of stack) {
      if (!el || el.closest?.('.aura-global-select')) continue;
      const tag = (el.tagName || '').toLowerCase();
      const cls = typeof el.className === 'string' ? el.className.split(' ')[0] : '';
      debug.push(`${tag}${cls ? `.${cls}` : ''}`);
      if (tag === 'canvas' || tag === 'svg' || tag === 'iframe') {
        return { visual: true, debug: debug.slice(0, 8).join(' > ') };
      }
      if (typeof el.querySelector === 'function' && el.querySelector('canvas, svg, iframe')) {
        return { visual: true, debug: `容器含视觉元素 ${debug.slice(0, 6).join(' > ')}` };
      }
      if (el.closest?.('.aura-chart, .aura-graph, .aura-html-card')) {
        return { visual: true, debug: `命中视觉容器 ${debug.slice(0, 6).join(' > ')}` };
      }
    }
  }
  return { visual: false, debug: debug.slice(0, 8).join(' > ') || '无可识别层' };
}

/** 截取圈选区域（浏览器 API；iframe 内容截不到，会成为空白） */
async function captureSelection(rect) {
  // 圈选层覆盖全屏，elementFromPoint 会命中它自身 → 用 elementsFromPoint 跳过
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const stack = typeof document.elementsFromPoint === 'function'
    ? document.elementsFromPoint(cx, cy)
    : [document.elementFromPoint(cx, cy)];
  const hitEl = stack.find((el) => el && !el.closest?.('.aura-global-select')) ?? null;

  // 优先：圈选区域内若有 <canvas>（趋势图等），直接 toDataURL —— 瞬间完成
  const canvasInRect = (() => {
    if (!hitEl) return null;
    const scope = hitEl.closest?.('[data-aura-card-id], .aura-panel, section, article') ?? hitEl;
    for (const c of scope.querySelectorAll?.('canvas') ?? []) {
      const r = c.getBoundingClientRect();
      if (rect.left < r.right && rect.right > r.left && rect.top < r.bottom && rect.bottom > r.top) return c;
    }
    return null;
  })();
  if (canvasInRect) {
    try {
      const url = canvasInRect.toDataURL('image/png');
      if (url.startsWith('data:image')) {
        return { base64: url.split(',')[1] ?? null, debug: `canvas 直出 ${canvasInRect.width}x${canvasInRect.height}` };
      }
    } catch { /* 污染的画布退回 DOM 截图 */ }
  }

  // 兜底：截取圈选中心所在容器（比 body 小、更快）
  const container = hitEl?.closest?.('[data-aura-card-id], .aura-panel, section, article')
    ?? document.body;
  const box = container.getBoundingClientRect();
  const canvas = await domToCanvas(container, { scale: 1 });
  const sx = Math.max(0, Math.round(rect.left - box.left));
  const sy = Math.max(0, Math.round(rect.top - box.top));
  // 注意：rect 是 {left,top,right,bottom}，没有 width/height 字段
  const w = Math.max(1, Math.min(Math.round(rect.right - rect.left), canvas.width - sx));
  const h = Math.max(1, Math.min(Math.round(rect.bottom - rect.top), canvas.height - sy));

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, sx, sy, w, h, 0, 0, w, h);
  const url = out.toDataURL('image/png');
  const base64 = url.startsWith('data:image') ? url.split(',')[1] : null;
  return {
    base64,
    debug: `容器=${container.tagName.toLowerCase()}${container.dataset?.auraCardId ? '#' + container.dataset.auraCardId : ''}`
      + ` canvas=${canvas.width}x${canvas.height} crop=(${sx},${sy},${w},${h})`,
  };
}

/**
 * 把命中结果拼成提问上下文。
 * 原则（P1.5）：
 *   - 只给「精确锚点」：行级文本 + 卡片 id / turn 号
 *   - 不重复完整消息内容（agent 在当前会话里有上下文记忆）
 *   - 无 id 的内容退回行级文本 + 语义容器
 */
function buildContext({ hits, rect, question, hasImage, shotDebug }) {
  const lines = [];
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  lines.push('【圈选提问】');
  lines.push('');
  lines.push(`✂️ 圈选范围：视口内 x ${Math.round((rect.left / vw) * 100)}%~${Math.round((rect.right / vw) * 100)}%，`
    + `y ${Math.round((rect.top / vh) * 100)}%~${Math.round((rect.bottom / vh) * 100)}%`);
  lines.push('');
  lines.push('✨ 命中内容（用户关注的具体元素，精确锚点）：');
  if (hits.length === 0) {
    lines.push('- （未识别到可读内容，请结合问题与圈选位置作答）');
  } else {
    for (const hit of hits.slice(0, 6)) {
      const where = hit.turn ? `turn ${hit.turn}` : (hit.cardId ? `卡片 ${hit.cardId}` : hit.label);
      const body = Array.isArray(hit.lines) && hit.lines.length
        ? hit.lines.map((l) => `「${l}」`).join(' ')
        : (hit.text ? `「${hit.text}」` : '');
      lines.push(`- ${where}${body ? `：${body}` : ''}`);
    }
    if (hits.length > 6) lines.push(`- …另有 ${hits.length - 6} 处`);
  }
  lines.push('');
  if (hasImage) {
    lines.push('');
    lines.push('📷 已附圈选区域截图（视觉参考：布局/颜色/图形；iframe 内容在截图中为空白）。');
  }
  if (shotDebug) {
    lines.push('');
    lines.push(`【截图诊断（临时）】${shotDebug}`);
  }
  lines.push(`❓ 问题：${question}`);
  lines.push('');
  lines.push('【说明】');
  lines.push('- 「命中内容」引用的文字来自当前会话/页面，可直接结合上下文理解，无需重复贴出全文。');
  lines.push('- 需要更新数据/图表时，可调用 aura_panel 更新右侧面板。');
  return lines.join('\n');
}

/**
 * @param {object} props
 * @param {(text: string) => Promise<{ok?: boolean}>} props.send - 发送到当前会话
 * @param {() => string | undefined} props.getSessionId - 当前会话 id
 */
export default function GlobalSelector({ send, getSessionId }) {
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState(null);
  const [hits, setHits] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const startRef = useRef(null);
  const inputRef = useRef(null);
  const adaptersRef = useRef(createDefaultAdapters());

  const reset = useCallback(() => {
    setRect(null);
    setHits(null);
    setMenuPos(null);
    setCustomMode(false);
    setQuestion('');
    setError(null);
    setActive(false);
  }, []);

  // 快捷键 / 外部指令进入
  useEffect(() => {
    const onEnter = () => {
      if (!getSessionId?.()) {
        console.warn('[aura-global-select] 没有当前会话，忽略');
        return;
      }
      setActive(true);
      setRect(null);
      setHits(null);
      setMenuPos(null);
      setCustomMode(false);
    };
    window.addEventListener('aura:enter-select', onEnter);
    return () => window.removeEventListener('aura:enter-select', onEnter);
  }, [getSessionId]);

  // Esc 退出
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); reset(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, reset]);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY };
    setRect({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!startRef.current) return;
    const s = startRef.current;
    setRect({
      left: Math.min(s.x, e.clientX),
      top: Math.min(s.y, e.clientY),
      width: Math.abs(e.clientX - s.x),
      height: Math.abs(e.clientY - s.y),
    });
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!startRef.current) return;
    const s = startRef.current;
    startRef.current = null;
    const sel = {
      left: Math.min(s.x, e.clientX),
      top: Math.min(s.y, e.clientY),
      width: Math.abs(e.clientX - s.x),
      height: Math.abs(e.clientY - s.y),
    };
    if (sel.width < 12 || sel.height < 12) { setRect(null); return; }
    const selAbs = {
      left: sel.left,
      top: sel.top,
      right: sel.left + sel.width,
      bottom: sel.top + sel.height,
    };
    const found = collectHits(adaptersRef.current, selAbs);
    setRect(sel);
    setHits(found);
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const submit = useCallback(async (textOverride) => {
    if (busy) return;
    const q = String(textOverride ?? question).trim();
    if (!q) { inputRef.current?.focus(); return; }
    if (!hits) return;
    setBusy(true);
    setError(null);
    try {
      const sel = {
        left: rect.left, top: rect.top,
        right: rect.left + rect.width, bottom: rect.top + rect.height,
      };
      // 视觉类内容（图表/图形/iframe）额外截一张图，作为视觉补充
      let image = null;
      const visualCheck = needsVisualCapture(sel);
      let shotDebug = visualCheck.visual ? '' : '未检测到视觉元素';
      if (visualCheck.visual) {
        try {
          const shot = await captureSelection(sel);
          if (shot?.base64) {
            image = { mediaType: 'image/png', data: shot.base64, name: 'selection.png' };
            shotDebug = `截图成功 ${Math.round(shot.base64.length / 1024)}KB ${shot.debug}`;
          } else {
            shotDebug = `截图返回空 ${shot?.debug ?? ''}`;
          }
        } catch (err) {
          shotDebug = `截图失败：${String(err?.message ?? err).slice(0, 160)}`;
        }
      }
      const ctx = buildContext({
        hits,
        rect: sel,
        question: q,
        hasImage: Boolean(image),
        shotDebug: `视觉=${visualCheck.visual}；${shotDebug}；层=${visualCheck.debug}`,
      });
      const res = await send?.(ctx, image);
      if (res?.ok === false) throw new Error(res?.error?.message ?? '发送失败');
      reset();
    } catch (err) {
      console.error('[aura-global-select] 发送失败:', err?.message ?? err);
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }, [busy, question, hits, rect, send, reset]);

  if (!active) return null;

  return (
    <div
      className="aura-global-select"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {!hits ? (
        <div className="aura-global-select-hint">
          {rect
            ? '松开鼠标完成圈选（Esc 退出）'
            : '拖拽圈选要提问的区域（Esc 退出）'}
        </div>
      ) : null}

      {rect ? (
        <div
          className="aura-global-select-box"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ) : null}

      {/* 命中卡片 → 径向菜单；「自定义」→ 输入框 */}
      {hits && hits.length > 0 && menuPos && !customMode ? (
        <RadialMenu
          position={menuPos}
          options={RADIAL_OPTIONS}
          onSelect={(opt) => submit(opt.prompt)}
          onCustom={() => setCustomMode(true)}
          onCancel={reset}
        />
      ) : null}

      {hits && (hits.length === 0 || customMode) ? (
        <div
          className="aura-global-select-popover"
          style={{ left: Math.min(rect.left, 240), top: Math.min(rect.top + rect.height + 10, window.innerHeight - 180) }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="aura-global-select-title">
            {hits.length === 0
              ? '没有识别到可读内容（仍可提问）'
              : `命中 ${hits.length} 处内容`}
          </div>
          <textarea
            ref={inputRef}
            className="aura-select-input"
            rows={3}
            placeholder="想问什么？Enter 发送，Shift+Enter 换行，Esc 取消"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              if (e.key === 'Escape') { e.preventDefault(); reset(); }
            }}
          />
          {error ? <div className="aura-select-error">{error}</div> : null}
          <div className="aura-select-actions">
            <button type="button" className="aura-select-btn aura-select-btn--primary" disabled={busy} onClick={() => submit()}>
              {busy ? '发送中…' : '发送'}
            </button>
            <button type="button" className="aura-select-btn" onClick={reset}>取消</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
