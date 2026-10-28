/**
 * aura-dsh / host / panel-store.js
 * 侧边面板状态存储（按 sessionId 命名空间）。
 *
 * 设计要点（v0.7 决策）：
 *  - 面板内容跟 session 走：每个 sessionId 一份卡片表
 *  - upsert 语义：同 id 覆盖（agent 反复推送同一张卡片即为"更新"）
 *  - **持久化**：落到 ~/.dsh/aura-panels/<sessionId>.json（防抖写盘、懒加载）
 *    → 刷新 / 主实例重启后卡片仍在
 *  - **上限 20**：普通卡超过 20 张时淘汰最早的（persist 卡不占名额、不淘汰）
 *  - **dismissed**：标记隐藏（不渲染），数据保留，agent 可恢复
 *  - **persist**：常驻（跨刷新/重启保留，不参与淘汰）
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** 普通卡上限（persist 卡不计入） */
const MAX_CARDS = 20;
/** 写盘防抖（ms） */
const PERSIST_DEBOUNCE = 500;

/**
 * @typedef {object} PanelCard
 * @property {string} id
 * @property {string} type
 * @property {string} [title]
 * @property {object} [data]
 * @property {Array<{id:string,label:string,prompt:string}>} [actions]
 * @property {boolean} [collapsed]
 * @property {boolean} [persist]    - 常驻：不参与上限淘汰、跨刷新/重启保留
 * @property {boolean} [dismissed]  - 隐藏：不渲染（数据保留，可恢复）
 */

/** 持久化目录：~/.dsh/aura-panels */
function panelDir() {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
  return join(dshHome, 'aura-panels');
}

/** 单个 session 的持久化文件 */
function panelFile(sessionId) {
  return join(panelDir(), `${String(sessionId).replace(/[^\w.-]/g, '_')}.json`);
}

export function createPanelStore() {
  /** @type {Map<string, Map<string, PanelCard>>} sessionId → (cardId → card) */
  const bySession = new Map();
  /** @type {Set<(sessionId: string, cards: PanelCard[]) => void>} */
  const listeners = new Set();
  /** 已在内存或磁盘加载过的 session */
  const loaded = new Set();
  /** session → 写盘定时器 */
  const pendingWrites = new Map();

  /** 全部卡片（含 dismissed），插入顺序 */
  const list = (sessionId) => [...(bySession.get(sessionId)?.values() ?? [])];

  /** 渲染用卡片（排除 dismissed） */
  const visible = (sessionId) => list(sessionId).filter((c) => !c.dismissed);

  /** 通知订阅者（异常隔离） */
  function emit(sessionId) {
    const cards = visible(sessionId);
    for (const fn of listeners) {
      try { fn(sessionId, cards); } catch { /* 忽略监听器错误 */ }
    }
  }

  /** 从磁盘加载（每个 session 只加载一次；内存已有数据则以内存为准） */
  async function ensureLoaded(sessionId) {
    if (!sessionId || loaded.has(sessionId)) return;
    loaded.add(sessionId);
    try {
      const raw = await readFile(panelFile(sessionId), 'utf8');
      const parsed = JSON.parse(raw);
      const cards = Array.isArray(parsed?.cards) ? parsed.cards : [];
      const map = new Map();
      for (const card of cards) {
        if (card?.id) map.set(card.id, card);
      }
      if (!bySession.has(sessionId) || bySession.get(sessionId).size === 0) {
        bySession.set(sessionId, map);
        emit(sessionId);
      }
    } catch {
      // 文件不存在 / 解析失败：从空开始
    }
  }

  /** 防抖写盘 */
  function scheduleSave(sessionId) {
    const prev = pendingWrites.get(sessionId);
    if (prev) clearTimeout(prev);
    const timer = setTimeout(() => {
      pendingWrites.delete(sessionId);
      const cards = list(sessionId);
      const payload = JSON.stringify({ version: 1, cards, savedAt: Date.now() });
      mkdir(panelDir(), { recursive: true })
        .then(() => writeFile(panelFile(sessionId), payload, 'utf8'))
        .catch((err) => console.error('[aura-panel] 持久化失败:', err?.message ?? err));
    }, PERSIST_DEBOUNCE);
    pendingWrites.set(sessionId, timer);
  }

  /** 淘汰：普通卡超过 MAX_CARDS 时移除最早的（persist 不淘汰） */
  function prune(sessionId) {
    const map = bySession.get(sessionId);
    if (!map) return;
    const normals = [...map.values()]
      .filter((c) => !c.persist)
      .sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0));
    const overflow = normals.length - MAX_CARDS;
    if (overflow <= 0) return;
    for (let i = 0; i < overflow; i += 1) map.delete(normals[i].id);
  }

  return {
    /** 写入/覆盖一张卡片（persist / dismissed 随字段生效） */
    upsert(sessionId, card) {
      if (!sessionId || !card?.id) return list(sessionId);
      if (!bySession.has(sessionId)) bySession.set(sessionId, new Map());
      bySession.get(sessionId).set(card.id, { ...card, updatedAt: Date.now() });
      prune(sessionId);
      scheduleSave(sessionId);
      emit(sessionId);
      return list(sessionId);
    },

    /** 移除一张卡片 */
    remove(sessionId, cardId) {
      bySession.get(sessionId)?.delete(cardId);
      scheduleSave(sessionId);
      emit(sessionId);
      return list(sessionId);
    },

    /** 清空该 session 的面板（同时清盘，避免刷新后旧卡回来） */
    clear(sessionId) {
      bySession.delete(sessionId);
      scheduleSave(sessionId);
      emit(sessionId);
      return [];
    },

    /** 隐藏一张卡片（数据保留） */
    dismiss(sessionId, cardId) {
      const map = bySession.get(sessionId);
      const card = map?.get(cardId);
      if (card) map.set(cardId, { ...card, dismissed: true, updatedAt: Date.now() });
      scheduleSave(sessionId);
      emit(sessionId);
      return list(sessionId);
    },

    /** 恢复一张被隐藏的卡片 */
    restore(sessionId, cardId) {
      const map = bySession.get(sessionId);
      const card = map?.get(cardId);
      if (card) map.set(cardId, { ...card, dismissed: false, updatedAt: Date.now() });
      scheduleSave(sessionId);
      emit(sessionId);
      return list(sessionId);
    },

    list,
    /** 渲染用：排除 dismissed */
    visible,

    /** 订阅变更；返回取消订阅函数 */
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** 懒加载磁盘状态（幂等） */
    ensureLoaded,

    /** session 回收时清理（供上层调用） */
    dropSession(sessionId) {
      bySession.delete(sessionId);
      loaded.delete(sessionId);
      const timer = pendingWrites.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        pendingWrites.delete(sessionId);
      }
    },
  };
}

export default createPanelStore;
