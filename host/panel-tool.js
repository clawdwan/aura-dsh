/**
 * aura-dsh / host / panel-tool.js
 * `aura_panel` 工具：agent 把卡片推送到会话右侧面板（跟 session 归属）。
 *
 * 与 `aura_render` 的分工：
 *   aura_render → 对话流内嵌（叙事型：这次的结果）
 *   aura_panel  → 右侧面板（状态型：常驻、可反复更新）
 *
 * sessionId 来源：exec.agent.session.id（DSH 工具执行上下文里的 caller agent）。
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { COMPONENT_TYPES } from './tool.js';

/** 参数 schema（property map 模式，与 aura_render 一致）。 */
export const panelParameters = {
  text: {
    type: 'string',
    required: true,
    description: '一句话说明这次面板操作（对话流里可见）',
  },
  action: {
    type: 'string',
    required: true,
    description: "操作类型：'upsert'（新增/更新卡片，固定普通卡）、'remove'（移除单张）、'clear'（清空面板）、'pin'（用户点 ⚑ 时把卡片设为常驻）",
  },
  cardId: {
    type: 'string',
    description: "action='pin' 时必填：要设为常驻的卡片 id",
  },
  card: {
    type: 'object',
    additionalProperties: true,
    description: "卡片对象（action='upsert' 时必填）：{ id, type, title?, data?, actions?, pending? }。"
      + "⚠️ tool 参数必须是合法 JSON：字符串内部不得出现未转义的双引号；"
      + "HTML 内容一律用单引号属性（class='a-h1'）；单卡内容过长时拆成多张卡分别 upsert；"
      + "内容能用结构化组件表达时优先用 comparison_table/insight_cards/metric_card，html 仅用于长文档/富排版。"
      + "pending=true 或省略 data 时，面板显示骨架屏占位（适合多卡片任务：先推结构再填数据）。"
      + "type 与 data 契约同 aura_render；actions[].prompt 是点击按钮后注入会话的指令文本。"
      + "注意：persist（常驻）只能由用户通过卡片 ⚑ 按钮设置（action='pin'），agent 推卡一律为普通卡、传 persist 会被忽略；dismissed=true 表示隐藏（不渲染、数据保留）；"
      + "tab 是面板内频道键（如 'market'/'research'，缺省 'main'），tabTitle 是该频道显示名；"
      + "同一会话可在多个 tab 里分别组织内容。"
      + "action='remove' 时只需 { id }。",
  },
};

/** 输出 schema。 */
export const panelOutputSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    text: { type: 'string' },
    sessionId: { type: 'string' },
    action: { type: 'string' },
    cards: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
};

/** 校验并规整卡片（未知 type 降级为文字说明，避免渲染端崩溃）。 */
function normalizeCard(raw, persistOverride = false) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null;
  if (!id) return null;
  const type = typeof raw.type === 'string' ? raw.type : 'comparison_table';
  const safeType = COMPONENT_TYPES.includes(type) ? type : 'comparison_table';
  const actions = Array.isArray(raw.actions)
    ? raw.actions
      .filter((a) => a && typeof a === 'object' && typeof a.label === 'string')
      .slice(0, 5)
      .map((a, i) => ({
        id: typeof a.id === 'string' && a.id ? a.id : `action-${i}`,
        label: a.label,
        prompt: typeof a.prompt === 'string' ? a.prompt : a.label,
      }))
    : undefined;
  // 多 tab 路由：tab 是频道键（缺省 main），tabTitle 是该频道显示名
  const tabKey = typeof raw.tab === 'string' && raw.tab.trim() ? raw.tab.trim() : 'main';
  const tabTitle = typeof raw.tabTitle === 'string' && raw.tabTitle.trim() ? raw.tabTitle.trim() : undefined;
  return {
    id,
    type: safeType,
    tab: tabKey,
    ...(tabTitle ? { tabTitle } : {}),
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
    ...(raw.data && typeof raw.data === 'object' ? { data: raw.data } : {}),
    ...(actions ? { actions } : {}),
    ...(raw.collapsed === true ? { collapsed: true } : {}),
    ...(raw.pending === true ? { pending: true } : {}),
    // 注意：persist 只能由用户通过 ⚑（action='pin'）设置，
    // agent 的 upsert 一律忽略 persist → 固定普通卡
    ...(persistOverride === true ? { persist: true } : {}),
    ...(raw.dismissed === true ? { dismissed: true } : {}),
    ...(safeType !== type ? { downgradedFrom: type } : {}),
  };
}

/**
 * 生成 execute 函数（注入 panel store）。
 * @param {ReturnType<import('./panel-store.js').createPanelStore>} store
 */
export function createPanelExecute(store) {
  return async function panelExecute(args, exec) {
    const sessionId = exec?.agent?.session?.id;
    if (!sessionId) {
      return { text: '（无法定位当前会话，面板未更新）', action: args?.action ?? '', cards: [] };
    }
    const action = typeof args?.action === 'string' ? args.action : 'upsert';
    const note = typeof args?.text === 'string' ? args.text : '';

    // 懒加载磁盘状态（刷新/重启后恢复）
    try { await store.ensureLoaded?.(sessionId); } catch { /* 忽略 */ }

    if (action === 'clear') {
      const cards = store.clear(sessionId);
      return { text: note || '已清空侧边面板', sessionId, action, cards };
    }

    if (action === 'remove') {
      const cardId = typeof args?.card?.id === 'string' ? args.card.id : null;
      if (!cardId) {
        return { text: `${note}（remove 需要 card.id，未执行）`, sessionId, action, cards: store.visible ? store.visible(sessionId) : store.list(sessionId) };
      }
      const cards = store.remove(sessionId, cardId);
      return { text: note || `已移除卡片 ${cardId}`, sessionId, action, cards };
    }

    // action === 'pin'（用户点 ⚑：把已有卡片设为常驻）
    if (action === 'pin') {
      const cardId = typeof args?.cardId === 'string' ? args.cardId.trim() : null;
      if (!cardId) {
        return { text: `${note}（cardId 缺失，未执行）`, sessionId, action, cards: store.visible ? store.visible(sessionId) : store.list(sessionId) };
      }
      const existing = store.list ? store.list(sessionId).find((c) => c.id === cardId) : null;
      if (!existing) {
        return { text: `${note}（卡片 ${cardId} 不存在）`, sessionId, action, cards: store.visible ? store.visible(sessionId) : store.list(sessionId) };
      }
      store.upsert(sessionId, normalizeCard({ ...existing, persist: true }, true));
      const cards = store.visible ? store.visible(sessionId) : store.list(sessionId);
      return { text: `${note}（已设为常驻：${cardId}）`, sessionId, action, cards };
    }

    // action === 'upsert'（agent 推卡：固定普通卡，忽略 persist）
    const card = normalizeCard(args?.card, false);
    if (!card) {
      return { text: `${note}（card.id 缺失，未执行）`, sessionId, action, cards: store.visible ? store.visible(sessionId) : store.list(sessionId) };
    }
    store.upsert(sessionId, card);
    const cards = store.visible ? store.visible(sessionId) : store.list(sessionId);
    return {
      text: note || `已更新面板卡片「${card.title ?? card.id}」`,
      sessionId,
      action,
      cards,
    };
  };
}

/** 注册 aura_panel 工具（由 host/tool.js 的 apply 调用）。 */
export function registerPanelTool(ctx, store) {
  ctx.tools.register(defineTool({
    name: 'aura_panel',
    description: [
      '把卡片推送到会话的右侧面板（常驻展示，与对话流内嵌的 aura_render 分工不同）。',
      '适用：需要长期跟踪/反复更新的内容（行情监控、任务看板、持续指标）。',
      '不适用：一次性的结果解释（那用 aura_render 渲染进对话流）。',
      "action='upsert' 新增或更新卡片（同 id 覆盖）；'remove' 移除单张；'clear' 清空面板。",
      '卡片可带 actions（按钮）：用户点击后会把 prompt 作为一条消息发回当前会话，可用于"点击刷新/深入分析"等交互。',
    ].join(' '),
    parameters: panelParameters,
    output: {
      schema: panelOutputSchema,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    execute: createPanelExecute(store),
  }));
}

export default registerPanelTool;
