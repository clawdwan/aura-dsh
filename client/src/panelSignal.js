/**
 * aura-dsh / client / src / panelSignal.js
 * 面板「事件驱动」信号层：订阅当前会话的事件流，检测 aura_panel 推送并触发打开。
 *
 * 设计原则（为未来多 tab 留口子）：
 *   - 本模块只负责「发现推送/历史」并产出语义事件，不假设只有一个面板 tab
 *   - 打开哪个 tab 由注入的 resolveTargets 决定，默认返回 [tabKind]
 *     未来若一个会话要开多个 aura tab，只需换一个 resolveTargets
 *   - 打开动作由 openTargets 注入，默认逐 kind 调 sidebarRight.openTab
 *
 * 关键行为：
 *   - change.kind === 'replace'  → 进入/切到该会话的首帧（历史）。只用于"恢复"：
 *                                  历史里出现过 aura_panel 才打开一次（不会反复弹）
 *   - change.kind === 'append'   → 实时新事件。tool/call 且 name === 'aura_panel'
 *                                  → 打开目标 tab（用户手动关掉后，下一条新推送仍会打开）
 *   - change.kind === 'prepend' / 'settle-assistant' → 忽略
 */

export const DEFAULT_SIGNAL_CONFIG = {
  /** 默认目标 tab kind（单 tab 场景） */
  tabKind: 'aura-panel',
  /** 历史恢复：进入会话时若发现历史里有 aura_panel 调用，是否自动打开一次 */
  restoreOnHistory: true,
};

/** 会话 retain 的来源标记（DSH 允许 controllerOperation / gateway） */
const RETAIN_SOURCE = 'controllerOperation';

/** 判断某个 tab 记录是否是我们关心的 kind（兼容 kind/type/id 字段差异） */
function tabMatches(record, kind) {
  if (!record) return false;
  const value = record.kind ?? record.type ?? record.id;
  if (typeof value !== 'string') return false;
  return value === kind || value.includes(kind);
}

/** 该会话当前是否已打开某个目标 tab */
function isTargetOpen(sidebarRight, sessionId, kind) {
  try {
    const tabs = sidebarRight?.tabsIn?.(sessionId) ?? [];
    return Array.isArray(tabs) && tabs.some((t) => tabMatches(t, kind));
  } catch (err) {
    console.error('[aura-signal] tabsIn 失败:', err?.message ?? err);
    return false;
  }
}

/** 从事件窗口里找 aura_panel 的 tool/call */
function hasPanelCall(entries) {
  if (!Array.isArray(entries)) return false;
  for (const entry of entries) {
    const event = entry?.event;
    if (event?.type === 'tool/call' && event.data?.name === 'aura_panel') return true;
  }
  return false;
}

/**
 * 创建事件驱动信号控制器。
 *
 * @param {object} deps
 * @param {object} deps.sessions     - ctx.sessions（需 retain(id)）
 * @param {object} deps.sidebarRight - ctx.sidebarRight（需 mounted / tabsIn / openTab）
 * @param {object} [deps.config]
 * @param {(event: object) => string[]} [deps.resolveTargets]
 *        把一次推送映射为要打开的 tab kind 列表（默认 [tabKind]）。未来多 tab 只换这里。
 * @param {(targets: string[], sessionId: string) => void} [deps.openTargets]
 *        打开动作（默认逐个 openTab 并跳过已打开的）。
 * @param {(err: unknown, where: string) => void} [deps.onError]
 *        错误处理（默认 console.error，不再静默）。
 */
export function createPanelSignal({
  sessions,
  sidebarRight,
  config,
  resolveTargets,
  openTargets,
  onError,
} = {}) {
  const cfg = { ...DEFAULT_SIGNAL_CONFIG, ...(config ?? {}) };
  const fail = (err, where) => {
    if (typeof onError === 'function') onError(err, where);
    else console.error(`[aura-signal] ${where}:`, err?.message ?? err);
  };

  let currentSessionId;
  let reference = null;
  let unsubscribe = null;

  const defaultResolve = () => [cfg.tabKind];
  const resolve = typeof resolveTargets === 'function' ? resolveTargets : defaultResolve;

  const defaultOpen = (targets, sessionId) => {
    const unique = [...new Set((targets ?? []).filter((t) => typeof t === 'string' && t))];
    for (const kind of unique) {
      if (isTargetOpen(sidebarRight, sessionId, kind)) continue;
      try {
        sidebarRight?.openTab?.(kind);
      } catch (err) {
        fail(err, `openTab(${kind})`);
      }
    }
  };
  const open = typeof openTargets === 'function' ? openTargets : defaultOpen;

  /**
 * 右侧栏是否已展开（DOM 判断）。
 * dockkit 的列容器：[data-dockkit-column] 从左到右排列，最后一个即右侧栏。
 * 判断失败时保守返回 true（视为已展开）→ 不强制打开，避免再次出现"强行弹出"。
 */
function isRightbarOpen() {
  try {
    const cols = [...document.querySelectorAll('[data-dockkit-column]')];
    if (!cols.length) return true;
    const right = cols[cols.length - 1];
    return right.getBoundingClientRect().width > 60;
  } catch {
    return true;
  }
}

const trigger = (event, sessionId) => {
    let targets;
    try {
      targets = resolve(event);
    } catch (err) {
      fail(err, 'resolveTargets');
      return;
    }
    if (!Array.isArray(targets) || targets.length === 0) return;
    // 侧边栏已打开（任一 pane 可见）→ 不动：不展开、也不切换用户当前 tab
    if (isRightbarOpen()) return;
    try {
      open(targets, sessionId);
    } catch (err) {
      fail(err, 'openTargets');
    }
  };

  const detach = () => {
    try { unsubscribe?.(); } catch (err) { fail(err, 'unsubscribe'); }
    unsubscribe = null;
    try { reference?.release?.(); } catch (err) { fail(err, 'release'); }
    reference = null;
    currentSessionId = undefined;
  };

  const attach = (sessionId) => {
    detach();
    if (!sessionId) return;
    currentSessionId = sessionId;

    let source;
    try {
      reference = sessions?.retain?.(sessionId, { source: RETAIN_SOURCE });
      source = reference?.binding?.eventSource;
    } catch (err) {
      fail(err, 'retain');
      return;
    }
    if (!source?.subscribe) {
      fail(new Error('eventSource 不可用'), `attach(${sessionId})`);
      return;
    }

    const handler = () => {
      try {
        const win = source.getSnapshot?.();
        const change = win?.change;
        if (!change || typeof change.kind !== 'string') return;

        if (change.kind === 'append') {
          for (const entry of change.entries ?? []) {
            const event = entry?.event;
            if (event?.type === 'tool/call' && event.data?.name === 'aura_panel') {
              trigger(event, sessionId);
            }
          }
          return;
        }

        if (change.kind === 'replace' && cfg.restoreOnHistory) {
          // 进入/切到该会话的首帧：历史里出现过面板推送才恢复一次（不会反复弹）
          if (hasPanelCall(win?.entries)) {
            trigger({ type: 'restore', data: {} }, sessionId);
          }
        }
        // prepend / settle-assistant：忽略
      } catch (err) {
        fail(err, 'handler');
      }
    };

    try {
      unsubscribe = source.subscribe(handler);
    } catch (err) {
      fail(err, 'subscribe');
      return;
    }

    // 订阅建立后先主动跑一次：覆盖"订阅前首帧已经到过"的情况
    handler();
  };

  return {
    /** 开始监听当前在屏会话；会话变化时自动切换订阅 */
    start() {
      let lastSid;
      const sync = () => {
        try {
          const sid = sidebarRight?.mounted?.getSnapshot?.() ?? undefined;
          if (sid === lastSid) return;
          lastSid = sid;
          attach(sid);
        } catch (err) {
          fail(err, 'mounted.sync');
        }
      };
      sync();
      let unsubMounted;
      try {
        unsubMounted = sidebarRight?.mounted?.subscribe?.(sync);
      } catch (err) {
        fail(err, 'mounted.subscribe');
      }
      return () => {
        try { unsubMounted?.(); } catch (err) { fail(err, 'mounted.unsubscribe'); }
        detach();
      };
    },
    /** 停止并释放当前会话引用 */
    stop() {
      detach();
    },
    /** 供调试：当前订阅的会话与引用状态 */
    probe() {
      return {
        sessionId: currentSessionId,
        subscribed: typeof unsubscribe === 'function',
        retained: Boolean(reference),
      };
    },
  };
}

export default createPanelSignal;
