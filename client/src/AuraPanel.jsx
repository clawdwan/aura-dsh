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
import SelectionLayer from './SelectionLayer';
import { buildSelectionContext } from './selection-context';

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


/**
 * 从 tool/call 节点解析 aura_panel 调用参数（action + card）。
 * 面板状态改为「重放历史调用」而不是「取最后一次结果」：
 * host 的 panel-store 是纯内存，主实例重启后清空，最后一次结果只含新卡；
 * 而调用参数在会话历史里是完整的（upsert/remove/clear 可直接重放）。
 */
function extractPanelAction(node) {
  const name = node?.data?.root?.name ?? node?.data?.name ?? node?.data?.call?.name;
  if (name !== 'aura_panel') return null;
  const raw = node?.data?.root?.arguments ?? node?.data?.arguments;
  if (typeof raw !== 'string') return null;
  try {
    const args = JSON.parse(raw);
    const action = typeof args?.action === 'string' ? args.action : null;
    if (!action) return null;
    return { action, card: args?.card ?? null };
  } catch {
    return null;
  }
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


/** 卡片级错误边界：单个组件崩溃时只影响该卡片，不让整个面板空白。 */
class CardBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error('[aura-panel] 卡片渲染失败:', error?.message ?? error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="aura-panel-error">
          ⚠️ 该卡片渲染失败：{String(this.state.error?.message ?? this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}


/** 骨架屏：卡片结构已声明、数据尚未就绪时的占位（Play 风：灰条 + shimmer 流光）。
 *  触发方式（两种）：
 *   ① 显式：card.pending === true
 *   ② 隐式：card.data 缺失或为空对象（agent 先推结构、后填数据）
 */
function CardSkeleton({ type }) {
  const rowCount = type === 'comparison_table' ? 4 : type === 'metric_card' ? 2 : 3;
  const widths = [92, 66, 80, 52];
  return (
    <div className="aura-skeleton" aria-busy="true" aria-label="加载中">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div key={i} className="aura-skeleton-line" style={{ width: `${widths[i % widths.length]}%` }} />
      ))}
    </div>
  );
}

/** 判定卡片是否处于「待填充」状态。 */
function isPendingCard(card) {
  if (!card) return false;
  if (card.pending === true) return true;
  const d = card.data;
  if (d === undefined || d === null) return true;
  return typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length === 0;
}

export default function AuraPanel(props) {
  const { useChat, __auraSend, tabKey = 'main' } = props;
  const [sendingId, setSendingId] = React.useState(null);
  const [lastResult, setLastResult] = React.useState(null);
  const [selecting, setSelecting] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    // 会话历史是异步加载的：短暂窗口内没卡片先显示"加载中"，避免误报"暂无卡片"
    const timer = setTimeout(() => setHydrated(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // 快捷键（⌘⌥S / Ctrl+Alt+S）进入圈选：多 tab 同时挂载时只让可见的那个响应
  React.useEffect(() => {
    console.log('[aura-panel] mounted, tabKey =', tabKey);
    const onEnter = () => {
      const el = panelRef.current;
      if (!el) {
        console.warn('[aura-panel] enter-select: 面板未挂载');
        return;
      }
      const rect = el.getBoundingClientRect();
      console.log('[aura-panel] enter-select 收到, 尺寸=', Math.round(rect.width), 'x', Math.round(rect.height));
      if (rect.width <= 1 || rect.height <= 1) return;
      setSelecting(true);
    };
    window.addEventListener('aura:enter-select', onEnter);
    return () => window.removeEventListener('aura:enter-select', onEnter);
  }, []);
  const panelRef = React.useRef(null);
  const cardsRef = React.useRef([]);
  const nodesRef = React.useRef([]);

  // 会话节点（供圈选提问时做来源追溯；与卡片选择器分开，避免互相影响引用稳定性）
  const liveNodes = useChat ? useChat((snapshot) => snapshot?.nodes?.values?.() ?? []) : [];
  nodesRef.current = liveNodes;

  /** 圈选提问：拼上下文 → 发到当前会话（消息在对话流可见） */
  const handleInquiry = React.useCallback(async ({ cards: hitCards, rect, question, fineHits }) => {
    if (typeof __auraSend !== 'function') throw new Error('未注入发送函数');
    // SelectionLayer 只拿得到 DOM 上的 id/title，这里用 id 从完整卡片列表补全 type/data
    const full = hitCards.map((h) => cardsRef.current.find((c) => c.id === h.id) ?? h);
    const ctx = buildSelectionContext({
      cards: full,
      rect,
      question,
      fineHits: fineHits ?? [],
      nodes: nodesRef.current,
      panelWidth: panelRef.current?.offsetWidth,
      panelHeight: panelRef.current?.offsetHeight,
    });
    const res = await __auraSend(ctx);
    if (!res?.ok) throw new Error(res?.error?.message ?? '发送失败');
  }, [__auraSend]);

  const handleAction = React.useCallback(async (action) => {
    if (typeof __auraSend !== 'function') {
      setLastResult('❌ 未注入发送函数');
      return;
    }
    setSendingId(action.id);
    setLastResult('发送中…');
    try {
      const res = await __auraSend(action.prompt ?? action.label);
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
  const EMPTY_DIAG = useMemo(() => ({ cards: EMPTY, nodeCount: 0, panelNodes: 0 }), [EMPTY]);
  const state = useChat
    ? useChat(
        (snapshot) => {
          let nodes = [];
          try { nodes = snapshot?.nodes?.values?.() ?? []; } catch { nodes = []; }
          let panelNodes = 0;
          const byId = new Map();
          let lastResultCards = null;
          for (const node of nodes) {
            try {
              const name = node?.data?.root?.name ?? node?.data?.name ?? node?.data?.call?.name;
              if (name === 'aura_panel') panelNodes += 1;
              // 优先：重放调用参数（不依赖 host 内存态，重启后也能恢复）
              const act = extractPanelAction(node);
              if (act) {
                if (act.action === 'clear') {
                  byId.clear();
                } else if (act.action === 'remove') {
                  const id = act.card?.id;
                  if (id) byId.delete(id);
                } else if (act.action === 'upsert' && act.card?.id) {
                  byId.set(act.card.id, { ...act.card, tab: act.card.tab ?? 'main' });
                }
                continue;
              }
              // 兜底：只有 result 的历史形态，用最后一次结果的 cards
              const r = extractPanelResult(node);
              if (r) lastResultCards = r.cards;
            } catch { /* 单个节点解析失败不影响其它 */ }
          }
          let list = [...byId.values()];
          if (list.length === 0 && Array.isArray(lastResultCards)) list = lastResultCards;
          return { cards: list, nodeCount: nodes.length, panelNodes };
        },
        (a, b) =>
          a === b
          || (a.nodeCount === b.nodeCount
            && a.panelNodes === b.panelNodes
            && JSON.stringify(a.cards) === JSON.stringify(b.cards)),
      )
    : EMPTY_DIAG;
  // 防御：useChat 在会话未就绪时可能返回 undefined，这里兜底成空状态，避免渲染崩溃
  const safeState = state && typeof state === 'object' ? state : EMPTY_DIAG;
  const allCards = Array.isArray(safeState.cards) ? safeState.cards : EMPTY;
  // 多 tab：本面板只展示归属当前 tabKey 的卡片（缺省 main）
  const cards = useMemo(
    () => allCards.filter((c) => (c?.tab ?? 'main') === tabKey),
    [allCards, tabKey],
  );
  const diag = {
    nodeCount: Number.isFinite(safeState.nodeCount) ? safeState.nodeCount : 0,
    panelNodes: Number.isFinite(safeState.panelNodes) ? safeState.panelNodes : 0,
  };
  cardsRef.current = cards;

  if (cards.length === 0) {
    if (!hydrated) {
      return (
        <div className="aura-panel-loading-state" ref={panelRef}>
          <div className="aura-skeleton-line" style={{ width: '72%' }} />
          <div className="aura-skeleton-line" style={{ width: '88%' }} />
          <div className="aura-skeleton-line" style={{ width: '60%' }} />
          <span className="aura-panel-loading-text">正在读取面板… · v0.4.0 diag</span>
        </div>
      );
    }
    return (
      <div className="aura-panel-empty-state" ref={panelRef}>
        面板暂无卡片。agent 调用 <code>aura_panel</code> 推送后会显示在这里。
        <div className="aura-panel-diag">
          [v0.4.0 diag] 会话节点 {diag.nodeCount} 个 · aura_panel 节点 {diag.panelNodes} 个
          {diag.panelNodes > 0 ? '（有节点但没解析出卡片）' : '（未收到 aura_panel 事件）'}
        </div>
      </div>
    );
  }

  return (
    <div className="aura-panel" ref={panelRef}>
      <div className="aura-panel-toolbar">
        <button
          type="button"
          className={`aura-panel-tool${selecting ? ' aura-panel-tool--active' : ''}`}
          onClick={() => setSelecting((v) => !v)}
        >
          {selecting ? '✕ 退出圈选' : '🔍 圈选提问'}
        </button>
        {selecting ? <span className="aura-panel-tool-hint">在面板上拖拽圈选要提问的区域</span> : null}
      </div>
      {cards.map((card) => {
        const actions = Array.isArray(card.actions) ? card.actions : [];
        return (
          <section
            key={card.id}
            className="aura-panel-card"
            data-aura-card-id={card.id}
            data-aura-card-title={card.title ?? card.id}
          >
            {card.title ? <h4 className="aura-panel-card-title">{card.title}</h4> : null}
            <div className="aura-panel-card-body">
              <CardBoundary>
                {isPendingCard(card)
                  ? <CardSkeleton type={card.type} />
                  : renderComponent({ type: card.type, data: card.data })}
              </CardBoundary>
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
      <SelectionLayer
        active={selecting}
        containerRef={panelRef}
        onInquiry={handleInquiry}
        onCancel={() => setSelecting(false)}
      />
    </div>
  );
}
