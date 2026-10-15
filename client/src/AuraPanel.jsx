/**
 * aura-dsh / client / src / AuraPanel.jsx
 * 右侧面板（rightbar tab body）：渲染 agent 通过 aura_panel 工具推送的卡片。
 *
 * 数据来源（无需新建推送通道）：
 *   aura_panel 的每次调用都是会话事件（tool-result 节点），其返回值携带完整卡片列表。
 *   面板用 useChat 的选择器遍历会话节点 → 取**最后一次** aura_panel 调用的 cards 作为当前状态。
 *   （会话切换天然隔离；刷新/重开面板状态自动恢复）
 *
 * 交互：卡片 actions[].prompt → ctx.conversation.send（官方 scope-addressed 发送，落到当前会话）。
 */
import React, { useMemo } from 'react';
import { renderComponent } from './AuraToolRow';

/**
 * 从会话节点提取 aura_panel 的返回值 {cards}。
 * 节点模型：kind === 'tool-call'，调用与结果在 node.data.root 内（官方惯例）。
 * 同时兼容 tool-result / content 等历史形态。
 */
function extractPanelResult(node) {
  if (!node || typeof node !== 'object') return null;

  // ① 官方形态：tool-call 节点 → data.root（ToolCallBlock，含 phase / content / result）
  const root = node.data?.root ?? (node.kind === 'tool-call' ? node.data : undefined);
  if (root) {
    const name = root.name ?? root.call?.name ?? root.data?.name;
    if (name === 'aura_panel') {
      const blocks = [
        ...(Array.isArray(root.content) ? root.content : []),
        ...(Array.isArray(root.result?.content) ? root.result.content : []),
        ...(Array.isArray(root.data?.content) ? root.data.content : []),
      ];
      const parsed = parseBlocks(blocks);
      if (parsed) return parsed;
      // 有些形态直接给结构化 result
      if (root.result?.value) return root.result.value;
      if (root.value) return root.value;
    }
  }

  // ② 历史形态：tool-result 节点 + content
  const name2 = node.call?.name ?? node.data?.call?.name ?? node.data?.name;
  if (name2 === 'aura_panel') {
    const blocks = [
      ...(Array.isArray(node.content) ? node.content : []),
      ...(Array.isArray(node.data?.content) ? node.data.content : []),
    ];
    const parsed = parseBlocks(blocks);
    if (parsed) return parsed;
  }
  return null;
}

/** 从 ContentBlock 数组里解析出 JSON 负载。 */
function parseBlocks(blocks) {
  for (const block of blocks) {
    if (block?.type === 'text' && typeof block.text === 'string') {
      try { return JSON.parse(block.text); } catch { /* 非 JSON 跳过 */ }
    }
    if (block?.type === 'json' && block.value) return block.value;
    if (block?.value && typeof block.value === 'object' && Array.isArray(block.value.cards)) return block.value;
  }
  return null;
}

export default function AuraPanel(props) {
  const { useChat, __auraSend } = props;
  const [sendingId, setSendingId] = React.useState(null);
  const [lastResult, setLastResult] = React.useState(null);

  const handleAction = React.useCallback(async (action) => {
    if (typeof __auraSend !== 'function') {
      setLastResult('❌ 未注入发送函数');
      return;
    }
    setSendingId(action.id);
    setLastResult('发送中…');
    try {
      const res = await __auraSend(action.prompt ?? action.label);
      console.log('[aura-panel] send 返回:', JSON.stringify(res));
      setLastResult(res?.ok ? '✅ 已发送' : `⚠️ 返回：${JSON.stringify(res)?.slice(0, 120)}`);
    } catch (e) {
      console.error('[aura-panel] send 失败:', e?.message ?? e);
      setLastResult(`❌ ${e?.message ?? e}`);
    } finally {
      setSendingId(null);
    }
  }, [__auraSend]);


  // 选择器返回"最后一次 aura_panel 调用的卡片列表"；用 eq 比较避免引用抖动导致重渲染。
  const EMPTY = useMemo(() => [], []);
  const cards = useChat
    ? useChat(
        (snapshot) => {
          const nodes = snapshot?.nodes?.values?.() ?? [];
          let found = null;
          for (const node of nodes) {
            const r = extractPanelResult(node);
            if (r) found = r;
          }
          const list = Array.isArray(found?.cards) ? found.cards : null;
          return list ?? EMPTY;
        },
        (a, b) => a === b || (a.length === b.length && a.every((x, i) => x?.id === b[i]?.id)),
      )
    : EMPTY;

  if (cards.length === 0) {
    return (
      <div className="aura-panel-empty-state">
        面板暂无卡片。agent 调用 <code>aura_panel</code> 推送后会显示在这里。
      </div>
    );
  }

  return (
    <div className="aura-panel">
      {cards.map((card) => {
        const actions = Array.isArray(card.actions) ? card.actions : [];
        return (
          <section key={card.id} className="aura-panel-card">
            {card.title ? <h4 className="aura-panel-card-title">{card.title}</h4> : null}
            <div className="aura-panel-card-body">
              {card.data
                ? renderComponent({ type: card.type, data: card.data })
                : <div className="aura-panel-empty">（该卡片暂无数据）</div>}
            </div>
            {lastResult ? <div className="aura-panel-result">{lastResult}</div> : null}
            {actions.length > 0 ? (
              <div className="aura-panel-actions">
                {actions.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="aura-panel-btn"
                    disabled={sendingId === a.id}
                    onClick={() => handleAction(a)}
                  >
                    {sendingId === a.id ? '发送中…' : a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
