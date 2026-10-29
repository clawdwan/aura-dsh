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
import { cardToMd, cardsToMd, downloadMd } from './export-md';

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


/** 本浏览器内持久化「已关闭卡片」集合（按会话隔离，静默无消息） */
function loadHiddenIds(sessionId) {
  try {
    const raw = localStorage.getItem(`aura-hidden:${sessionId}`);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch { return new Set(); }
}
function saveHiddenIds(sessionId, ids) {
  try {
    localStorage.setItem(`aura-hidden:${sessionId}`, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

/**
 * 从事件流窗口提取面板卡片：取**最后一条** aura_panel 的 tool/result 里的 cards。
 * 事件流（eventSource.entries）含被折叠的 tool/call 与 tool/result，
 * 而 useChat 的渲染节点不含，因此面板状态以事件流为准。
 */
function extractCardsFromEvents(win) {
  const entries = Array.isArray(win?.entries) ? win.entries : [];
  let lastCards = null;
  for (const entry of entries) {
    const ev = entry?.event;
    if (!ev || ev.type !== 'tool/result') continue;
    const blocks = Array.isArray(ev.data?.message?.content) ? ev.data.message.content : [];
    const text = blocks.filter((b) => b?.type === 'text').map((b) => b.text).join('');
    if (!text || !text.includes('cards')) continue;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.cards)) lastCards = parsed.cards;
    } catch { /* 非 JSON 结果忽略 */ }
  }
  return lastCards;
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
  // 字段名在不同 DSH 版本/形态下可能是 arguments / input / args；值可能是 JSON 字符串或对象
  const raw = node?.data?.root?.arguments
    ?? node?.data?.root?.input
    ?? node?.data?.root?.args
    ?? node?.data?.arguments
    ?? node?.data?.call?.arguments;
  if (raw === undefined || raw === null) return null;
  let args = raw;
  if (typeof raw === 'string') {
    try { args = JSON.parse(raw); } catch { return null; }
  }
  if (!args || typeof args !== 'object') return null;
  const action = typeof args?.action === 'string' ? args.action : null;
  if (!action) return null;
  return { action, card: args?.card ?? null };
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
  const { useChat, __auraSend, __auraSubscribeEvents, tabKey = 'main' } = props;
  const [sendingId, setSendingId] = React.useState(null);
  const [lastResult, setLastResult] = React.useState(null);
  const [selecting, setSelecting] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    // 会话历史是异步加载的：短暂窗口内没卡片先显示"加载中"，避免误报"暂无卡片"
    const timer = setTimeout(() => setHydrated(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // 面板内圈选：只走顶部「圈选提问」按钮；快捷键已交给全局圈选层（GlobalSelector）
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
      panelCards: cardsRef.current ?? [],
      nodes: nodesRef.current,
      panelWidth: panelRef.current?.offsetWidth,
      panelHeight: panelRef.current?.offsetHeight,
    });
    const res = await __auraSend(ctx);
    if (!res?.ok) throw new Error(res?.error?.message ?? '发送失败');
  }, [__auraSend]);

  /** 设为常驻卡：发一条简短指令给 agent（client 无法直接改 host 状态） */
  const handlePinCard = React.useCallback((card) => {
    if (!card?.id) return;
    if (typeof __auraSend === 'function') {
      __auraSend(`[面板操作] 把卡片「${card.id}」设为 persist=true（常驻，不参与淘汰），不要解释，直接调用 aura_panel 完成。`)
        .catch((err) => console.warn('[aura-panel] 常驻设置失败:', err?.message ?? err));
    }
  }, [__auraSend]);

  /** 导出单张卡片为 .md */
  const handleExportCard = React.useCallback((card) => {
    if (!card) return;
    const md = cardToMd(card);
    const safe = String(card.title ?? card.id ?? 'card').replace(/[\\/:*?"<>|]/g, '_');
    const ok = downloadMd(safe, `## ${card.title ?? card.id}\n\n${md}`);
    if (!ok) console.warn('[aura-panel] 单卡导出失败');
  }, []);

  /** 导出面板全部卡片为 .md（用 cardsRef 避免 TDZ：cards 定义在后面） */
  const handleExportAll = React.useCallback(() => {
    const list = cardsRef.current ?? [];
    if (!list.length) return;
    const md = cardsToMd(list, { sessionId: props?.sessionId });
    const ok = downloadMd(`aura-panel-${Date.now()}`, md);
    if (!ok) console.warn('[aura-panel] 全部导出失败');
  }, [props?.sessionId]);

  /** 折叠状态（本地，不持久） */
  const [collapsedIds, setCollapsedIds] = React.useState(() => new Set());
  const handleToggleCollapse = React.useCallback((cardId) => {
    if (!cardId) return;
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId); else next.add(cardId);
      return next;
    });
  }, []);

  /**
   * 关闭卡片：本地隐藏 + localStorage 持久化（静默，不发消息）。
   * 刷新/重开页面后仍保持隐藏（按 sessionId 隔离，仅本浏览器）。
   */
  const [hiddenIds, setHiddenIds] = React.useState(() => loadHiddenIds(props?.sessionId));
  const handleDismissCard = React.useCallback((cardId) => {
    if (!cardId) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      saveHiddenIds(props?.sessionId, next);
      return next;
    });
  }, [props?.sessionId]);

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
  const EMPTY_DIAG = useMemo(() => ({ cards: EMPTY, nodeCount: 0, panelNodes: 0, replayed: 0, firstKeys: null }), [EMPTY]);
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
          // 诊断：重放/兜底计数 + 第一个 aura_panel 节点的 root 字段名
          let firstKeys = null;
          for (const node of nodes) {
            const name = node?.data?.root?.name ?? node?.data?.name ?? node?.data?.call?.name;
            if (name === 'aura_panel') {
              const holder = node?.data?.root ?? node?.data ?? {};
              try { firstKeys = Object.keys(holder).join(','); } catch { firstKeys = 'err'; }
              break;
            }
          }
          return { cards: list, nodeCount: nodes.length, panelNodes, replayed: byId.size, firstKeys };
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
  // 事件流兜底：useChat 的 nodes 不含折叠的 tool 节点时，改用 eventSource 的最新 tool/result
  const [eventCards, setEventCards] = React.useState(null);
  const [eventInfo, setEventInfo] = React.useState(null);
  React.useEffect(() => {
    if (typeof __auraSubscribeEvents !== 'function') return undefined;
    const sid = props?.sessionId;
    if (!sid) return undefined;
    let sub = null;
    let alive = true;
    const refresh = () => {
      if (!alive) return;
      try {
        const win = sub?.get?.() ?? null;
        const found = extractCardsFromEvents(win);
        const info = {
          entries: Array.isArray(win?.entries) ? win.entries.length : 0,
          cards: Array.isArray(found) ? found.length : 0,
        };
        setEventInfo(info);
        // 只在卡片数量变化时打印（事件流每次变化都会 refresh，全打会刷屏）
        if (info.cards !== lastCardsCountRef.current) {
          lastCardsCountRef.current = info.cards;
          console.log('[aura-panel] 卡片数变化:', info);
        }
        if (Array.isArray(found) && found.length > 0) setEventCards(found);
      } catch { /* ignore */ }
    };
    try {
      sub = __auraSubscribeEvents(sid, refresh);
      refresh();
    } catch { /* ignore */ }
    return () => {
      alive = false;
      try { sub?.dispose?.(); } catch { /* ignore */ }
    };
  }, [__auraSubscribeEvents, props?.sessionId]);

  // 数据源优先级：事件流（含折叠的 tool/result）> useChat 渲染节点
  const sourceCards = useMemo(() => {
    if (Array.isArray(eventCards) && eventCards.length > 0) return eventCards;
    return allCards;
  }, [eventCards, allCards]);
  // 单 main 面板：展示所有未隐藏的卡片（忽略 card.tab；多 tab 后续再做）
  // 排序：批次间新→旧（最新批次在顶部），**同一次推送的批次内保持正序**（1→2→3 可读）
  const cards = useMemo(() => {
    const list = sourceCards.filter((c) => !c?.dismissed && !hiddenIds.has(c?.id));
    // 先按时间升序，再把"时间相近（<600ms）"的卡片归为同一批
    const sorted = [...list].sort((a, b) => (a?.updatedAt ?? 0) - (b?.updatedAt ?? 0));
    const groups = [];
    for (const c of sorted) {
      const last = groups[groups.length - 1];
      if (last && ((c?.updatedAt ?? 0) - (last[0]?.updatedAt ?? 0)) < 600) last.push(c);
      else groups.push([c]);
    }
    // 批次倒序（新批在顶），批内保持升序
    return groups.reverse().flat();
  }, [sourceCards, hiddenIds]);

  // 新到达的卡片（加 is-new 做闪烁高亮，1.5s 后移除）
  const [flashCardId, setFlashCardId] = React.useState(null);

  // 卡片生成中的骨架占位（用户点发送后立即出现，卡片到达后消失）
  const [pendingEnter, setPendingEnter] = React.useState(null); // { x, y, width, height }
  React.useEffect(() => {
    const onPending = (e) => {
      const detail = e?.detail ?? null;
      // 面板可能刚被打开（有展开动画）：等它可见后再落骨架，否则飞入动画看不见
      let tries = 0;
      const showWhenVisible = () => {
        const open = Boolean(document.querySelector('[data-sidebar-right-open]'));
        console.log('[aura-panel] pending 收到，面板可见=', open, 'tries=', tries);
        if (open || tries >= 20) {
          pendingSinceRef.current = Date.now();
          setPendingEnter(detail);
          console.log('[aura-panel] 骨架卡显示');
          return;
        }
        tries += 1;
        setTimeout(showWhenVisible, 80);
      };
      showWhenVisible();
    };
    window.addEventListener('aura:card-pending', onPending);
    // 兜底：侧边栏刚打开时事件可能早于本组件挂载，挂载后读一次全局变量
    // 只接受「本会话 + 10s 内」的 pending（避免切会话时看到别的会话的残留骨架）
    try {
      const p = window.__auraPendingCard;
      const sid = props?.sessionId ?? null;
      const fresh = p && typeof p.ts === 'number' && (Date.now() - p.ts) < 10000;
      const sameSession = p && (!p.sessionId || !sid || p.sessionId === sid);
      if (fresh && sameSession) onPending({ detail: p });
      else if (p) delete window.__auraPendingCard;
    } catch { /* ignore */ }
    return () => window.removeEventListener('aura:card-pending', onPending);
  }, []);

  // 新卡片出现时滚动到它（多个卡片时定位到最新推送的那张）
  const lastLatestIdRef = React.useRef(null);
  React.useEffect(() => {
    if (!cards.length) return;
    const latest = cards.reduce((a, b) => ((b?.updatedAt ?? 0) > (a?.updatedAt ?? 0) ? b : a), cards[0]);
    if (!latest?.id || latest.id === lastLatestIdRef.current) return;
    lastLatestIdRef.current = latest.id;
    // 骨架卡至少展示 400ms（批量推卡时卡到达太快，否则骨架一闪而过看不见）
    const elapsed = Date.now() - (pendingSinceRef.current || 0);
    if (pendingSinceRef.current && elapsed < 400) {
      setTimeout(() => setPendingEnter(null), 400 - elapsed);
    } else {
      setPendingEnter(null);
    }
    try { delete window.__auraPendingCard; } catch { /* ignore */ }
    // 新卡到达：闪烁高亮 1.5s
    setFlashCardId(latest.id);
    const timer = setTimeout(() => setFlashCardId(null), 1500);
    // 等一帧让卡片渲染完成（高度确定）再滚：
    // 新卡追加在列表末尾，直接滚到面板底部即可让它完整进入视口
    const raf = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(() => {
        // 逆序展示（最新在顶部）→ 新卡定位到面板顶部
        const scrollPanelToTop = () => {
          const panel = document.querySelector('.aura-panel');
          if (panel) panel.scrollTop = 0;
          else document.querySelector(`[data-aura-card-id="${latest.id}"]`)?.scrollIntoView?.({ block: 'start' });
        };
        scrollPanelToTop();
        setTimeout(scrollPanelToTop, 300);
        setTimeout(scrollPanelToTop, 900);
      })
      : null;
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [cards]);
  cardsRef.current = cards;

  const diag = {
    nodeCount: Number.isFinite(safeState.nodeCount) ? safeState.nodeCount : 0,
    panelNodes: Number.isFinite(safeState.panelNodes) ? safeState.panelNodes : 0,
    replayed: Number.isFinite(safeState.replayed) ? safeState.replayed : 0,
    firstKeys: safeState.firstKeys ?? null,
  };
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
          会话节点 {diag.nodeCount} 个 · aura_panel 节点 {diag.panelNodes} 个
        </div>
      </div>
    );
  }

  return (
    <div className="aura-panel" ref={panelRef}>
      <div className="aura-panel-toolbar">
        {selecting ? (
          <span className="aura-panel-tool-hint">在面板上拖拽圈选要提问的区域（Esc 退出）</span>
        ) : (
          <button
            type="button"
            className="aura-panel-tool"
            onClick={handleExportAll}
            disabled={cards.length === 0}
          >
            ⬇ 全部导出
          </button>
        )}
      </div>
      {pendingEnter ? (
        <div
          className="aura-panel-card aura-card aura-panel-card--pending"
          style={{
            // 骨架卡从圈选位置飞入（相对面板的偏移量用 CSS 变量传给动画）
            '--aura-enter-x': `${(pendingEnter.x ?? 0)}px`,
            '--aura-enter-y': `${(pendingEnter.y ?? 0)}px`,
          }}
        >
          <div className="aura-panel-card-head">
            <span className="aura-panel-card-title aura-pending-title">AI 正在生成卡片…</span>
          </div>
          <div className="aura-pending-skeleton">
            <span className="aura-pending-bar" style={{ width: '72%' }} />
            <span className="aura-pending-bar" style={{ width: '88%' }} />
            <span className="aura-pending-bar" style={{ width: '54%' }} />
          </div>
        </div>
      ) : null}
      {cards.map((card) => {
        const actions = Array.isArray(card.actions) ? card.actions : [];
        return (
          <section
            key={card.id}
            className={`aura-panel-card${flashCardId === card.id ? ' is-new' : ''}`}
            data-aura-card-id={card.id}
            data-aura-card-title={card.title ?? card.id}
          >
            <div className="aura-panel-card-head">
              {card.title ? <h4 className="aura-panel-card-title">{card.title}</h4> : <span />}
              <div className="aura-panel-card-actions">
                {card.persist ? null : (
                  <button
                    type="button"
                    className="aura-panel-card-action"
                    title="设为常驻卡（不参与 20 张上限淘汰）"
                    onClick={() => handlePinCard(card)}
                  >
                    ⚑
                  </button>
                )}
                <button
                  type="button"
                  className="aura-panel-card-action"
                  title="导出这张卡片（Markdown）"
                  onClick={() => handleExportCard(card)}
                >
                  ↧
                </button>
                <button
                  type="button"
                  className="aura-panel-card-action"
                  title={collapsedIds.has(card.id) ? '展开' : '折叠'}
                  onClick={() => handleToggleCollapse(card.id)}
                >
                  {collapsedIds.has(card.id) ? '▸' : '▾'}
                </button>
                <button
                  type="button"
                  className="aura-panel-card-action"
                  title="关闭这张卡片（持久移除）"
                  onClick={() => handleDismissCard(card.id)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="aura-panel-card-body" hidden={collapsedIds.has(card.id)}>
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
