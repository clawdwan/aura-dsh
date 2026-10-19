/**
 * aura-dsh / host / panel-store.js
 * 侧边面板状态存储（按 sessionId 命名空间）。
 *
 * 设计要点：
 *  - 面板内容跟 session 走（用户决策 1）：每个 sessionId 一份卡片表
 *  - upsert 语义：同 id 覆盖（agent 反复推送同一张卡片即为"更新"）
 *  - 变更通过 onChange 通知（供后续推送到 client；通道待 V2 实现）
 *  - 纯内存 + 可选持久化钩子（当前不落盘，会话结束即回收）
 */

/**
 * @typedef {object} PanelCard
 * @property {string} id          - 卡片唯一 id（upsert 的键）
 * @property {string} type        - 组件类型（复用 aura 的 8 种）
 * @property {string} [title]     - 卡片标题
 * @property {object} [data]      - 组件 data（契约同 aura_render）
 * @property {Array<{id:string,label:string,prompt:string}>} [actions] - 按钮
 * @property {boolean} [collapsed]
 */

export function createPanelStore() {
  /** @type {Map<string, Map<string, PanelCard>>} sessionId → (cardId → card) */
  const bySession = new Map();
  /** @type {Set<(sessionId: string, cards: PanelCard[]) => void>} */
  const listeners = new Set();

  /** 当前 session 的卡片列表（插入顺序）。 */
  const list = (sessionId) => [...(bySession.get(sessionId)?.values() ?? [])];

  /** 通知订阅者（异常隔离：单个监听器出错不影响其他）。 */
  function emit(sessionId) {
    const cards = list(sessionId);
    for (const fn of listeners) {
      try { fn(sessionId, cards); } catch { /* 忽略监听器错误 */ }
    }
  }

  return {
    /** 写入/覆盖一张卡片。 */
    upsert(sessionId, card) {
      if (!sessionId || !card?.id) return list(sessionId);
      if (!bySession.has(sessionId)) bySession.set(sessionId, new Map());
      bySession.get(sessionId).set(card.id, { ...card, updatedAt: Date.now() });
      emit(sessionId);
      return list(sessionId);
    },

    /** 移除一张卡片。 */
    remove(sessionId, cardId) {
      bySession.get(sessionId)?.delete(cardId);
      emit(sessionId);
      return list(sessionId);
    },

    /** 清空该 session 的面板。 */
    clear(sessionId) {
      bySession.delete(sessionId);
      emit(sessionId);
      return [];
    },

    list,

    /** 订阅变更；返回取消订阅函数。 */
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** session 回收时清理（供上层调用）。 */
    dropSession(sessionId) {
      bySession.delete(sessionId);
    },
  };
}

export default createPanelStore;
