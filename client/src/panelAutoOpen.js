/**
 * aura-dsh / client / src / panelAutoOpen.js
 * 「什么时候自动打开 Aura 面板」的策略模块。
 *
 * 设计目标：策略与 React 组件解耦，便于后续整体替换或改成可配置。
 *   - 所有可调参数集中在 DEFAULT_CONFIG
 *   - 数据来源、打开动作都通过参数注入（换成订阅/提示/其他 tab 都不用改这里的使用方式）
 *
 * 当前策略（v2）：
 *   每 intervalMs 检查一次当前会话：
 *     · 会话变了 → 重置状态（允许新会话重新自动打开）
 *     · tab 已经开着 → 记录为已打开，不再动作
 *     · tab 没开、且本会话还没自动开过 → 请求打开一次（最多 maxAttempts 次）
 *   用户手动收起后不会再被打开（openedFor 已记录），直到切到另一个会话。
 */

export const DEFAULT_CONFIG = {
  /** 总开关 */
  enabled: true,
  /** 检测间隔（毫秒） */
  intervalMs: 1500,
  /** 会话已有卡片时是否自动打开 */
  openOnHistory: true,
  /** 单次检查的成本保护：事件数超过这个值时只做前缀扫描 */
  maxEntriesScan: 5000,
  /** 每个会话最多尝试打开几次（约 intervalMs * maxAttempts 秒后放弃，避免无限打扰） */
  maxAttempts: 8,
};

/** 读取当前会话 id（sidebarRight.onScreen 是 ObservableSnapshot） */
function readScreenSession(sidebarRight) {
  try {
    return sidebarRight?.onScreen?.getSnapshot?.() ?? undefined;
  } catch {
    return undefined;
  }
}

/** 指定会话的 tab 列表里是否已有 aura 面板（tabsIn 需要 sessionId） */
function isAuraTabOpen(sidebarRight, sessionId, tabKind) {
  if (!sessionId) return false;
  try {
    const tabs = sidebarRight?.tabsIn?.(sessionId) ?? [];
    return (
      Array.isArray(tabs)
      && tabs.some((tab) => {
        const kind = tab?.kind ?? tab?.type ?? tab?.id;
        return kind === tabKind || String(kind).includes(tabKind);
      })
    );
  } catch {
    return false;
  }
}

/**
 * 探查某会话里 aura_panel 是否已经推过卡片。
 * 返回：{ known: boolean, count: number }
 *   known=false 表示当前拿不到该会话的事件源（例如尚未 retain），调用方应稍后重试。
 *
 * 未来若改用其他数据源（如 host 推送 / panel-store API），只需替换这个函数。
 */
function probePanelCards(sessions, sessionId, config) {
  if (!sessionId) return { known: false, count: 0 };
  try {
    const source = sessions?.binding?.(sessionId)?.eventSource;
    const entries = source?.getSnapshot?.()?.entries;
    if (!Array.isArray(entries)) return { known: false, count: 0 };
    const limit = Math.min(entries.length, config.maxEntriesScan);
    let count = 0;
    for (let i = 0; i < limit; i += 1) {
      const event = entries[i]?.event;
      if (!event) continue;
      if (event.type === 'tool/call' && event.data?.name === 'aura_panel') count += 1;
    }
    return { known: true, count };
  } catch {
    return { known: false, count: 0 };
  }
}

/**
 * 创建自动打开控制器。
 * @param {object} deps
 * @param {object} deps.sidebarRight - ctx.sidebarRight（需 tabsIn / openTab / onScreen）
 * @param {object} deps.sessions     - ctx.sessions（需 binding(id)）
 * @param {string} [deps.tabKind]    - 面板的 tab kind/id，默认 'aura-panel'
 * @param {object} [deps.config]     - 覆盖 DEFAULT_CONFIG 的配置
 * @returns {{ start: () => void, stop: () => void, probe: () => object }}
 */
export function createPanelAutoOpen({ sidebarRight, sessions, tabKind = 'aura-panel', config } = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...(config ?? {}) };
  let timer = null;
  let lastSid;
  /** 本会话是否已经自动打开过（或用户已经打开过） */
  let openedFor = null;

  const reset = () => {
    lastSid = undefined;
    openedFor = null;
  };

  let attempts = 0;

  const tick = () => {
    if (!cfg.enabled) return;
    const sid = readScreenSession(sidebarRight);
    if (!sid) return; // onScreen 未就绪 → 下个 tick 再看

    if (sid !== lastSid) {
      lastSid = sid;
      openedFor = null; // 切会话 → 允许重新自动打开
      attempts = 0;
    }

    if (isAuraTabOpen(sidebarRight, sid, tabKind)) {
      openedFor = sid; // 已经开着 → 记录，用户之后收起就不再打扰
      attempts = 0;
      return;
    }
    if (openedFor === sid) return;   // 本会话已自动开过，用户收起后不打扰
    if (attempts >= cfg.maxAttempts) return;

    // 首次进入某会话：直接请求打开一次（不依赖能否读到历史卡片——
    // 之前依赖 sessions.binding(id) 判断，拿不到就永不打开，是根本 bug）
    attempts += 1;
    try {
      sidebarRight?.openTab?.(tabKind);
    } catch {
      /* 打开失败，下个 tick 重试（受 maxAttempts 限制） */
    }
  };

  return {
    start() {
      if (timer) return;
      tick();
      timer = setInterval(tick, cfg.intervalMs);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      reset();
    },
    /** 供调试/未来策略使用：返回当前探查结果 */
    probe() {
      const sid = readScreenSession(sidebarRight);
      return { sessionId: sid, ...probePanelCards(sessions, sid, cfg), openedFor };
    },
  };
}

export default createPanelAutoOpen;
