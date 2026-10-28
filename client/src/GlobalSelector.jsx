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
import { collectHits, createDefaultAdapters } from './selection/adapters';

const RADIAL_OPTIONS = [
  { label: '解释这段', prompt: '请解释圈选的这部分内容。' },
  { label: '为什么这样', prompt: '为什么会出现这样的情况？' },
  { label: '有什么问题', prompt: '这里有什么潜在问题或风险？' },
  { label: '怎么改进', prompt: '可以怎么改进？' },
];

/** 把命中结果拼成提问上下文 */
function buildContext({ hits, rect, question }) {
  const lines = [];
  lines.push('【圈选提问】');
  lines.push('');
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const range = `截图坐标 x ${Math.round((rect.left / vw) * 100)}%~${Math.round((rect.right / vw) * 100)}%，`
    + `y ${Math.round((rect.top / vh) * 100)}%~${Math.round((rect.bottom / vh) * 100)}%`;
  lines.push(`✂️ 圈选范围：视口内 ${range}`);
  lines.push('');
  lines.push('✨ 命中内容（用户关注的具体元素）：');
  if (hits.length === 0) {
    lines.push('- （未识别到可读内容，请结合问题与圈选位置作答）');
  } else {
    for (const hit of hits.slice(0, 10)) {
      const kindNote = hit.adapterId === 'aura-card' ? '（aura 卡片）' : '';
      lines.push(`- ${hit.label}${kindNote}${hit.text ? `：${hit.text}` : ''}`);
    }
    if (hits.length > 10) lines.push(`- …另有 ${hits.length - 10} 条`);
  }
  lines.push('');
  lines.push(`❓ 问题：${question}`);
  lines.push('');
  lines.push('【回答要求】');
  lines.push('- 命中内容是用户关注的具体锚点；若上下文不足以判断，请说明缺什么信息。');
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
      const ctx = buildContext({
        hits,
        rect: {
          left: rect.left, top: rect.top,
          right: rect.left + rect.width, bottom: rect.top + rect.height,
        },
        question: q,
      });
      const res = await send?.(ctx);
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
