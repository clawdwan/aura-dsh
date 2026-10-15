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
    description: "操作类型：'upsert'（新增/更新卡片）、'remove'（移除单张）、'clear'（清空面板）",
  },
  card: {
    type: 'object',
    additionalProperties: true,
    description: "卡片对象（action='upsert' 时必填）：{ id, type, title?, data?, actions?: [{id,label,prompt}] }。"
      + "type 与 data 契约同 aura_render；actions[].prompt 是点击按钮后注入会话的指令文本。"
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
function normalizeCard(raw) {
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
  return {
    id,
    type: safeType,
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
    ...(raw.data && typeof raw.data === 'object' ? { data: raw.data } : {}),
    ...(actions ? { actions } : {}),
    ...(raw.collapsed === true ? { collapsed: true } : {}),
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

    if (action === 'clear') {
      const cards = store.clear(sessionId);
      return { text: note || '已清空侧边面板', sessionId, action, cards };
    }

    if (action === 'remove') {
      const cardId = typeof args?.card?.id === 'string' ? args.card.id : null;
      if (!cardId) {
        return { text: `${note}（remove 需要 card.id，未执行）`, sessionId, action, cards: store.list(sessionId) };
      }
      const cards = store.remove(sessionId, cardId);
      return { text: note || `已移除卡片 ${cardId}`, sessionId, action, cards };
    }

    // action === 'upsert'
    const card = normalizeCard(args?.card);
    if (!card) {
      return { text: `${note}（card.id 缺失，未执行）`, sessionId, action, cards: store.list(sessionId) };
    }
    const cards = store.upsert(sessionId, card);
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
