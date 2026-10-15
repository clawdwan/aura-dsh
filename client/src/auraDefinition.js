/**
 * aura-dsh / client / src / auraDefinition.js
 * 会话事件定义：把每个 turn 里的 aura_render 调用聚合成 turn 级数据，
 * 供 conversation.chat.turnTail 渲染（不随工作过程折叠）。
 *
 * 数据流（对齐官方 deliverables 的 ConversationNodeDefinition 用法）：
 *   turn/start            → start()  建 State {turn, calls: []}
 *   tool/call(aura_render)→ update() 追加 {callId, arguments}
 *   buildLocationData()   → 发布 {kind:'turn', turn, key:'aura', value:{calls}}
 *   turnTail 渲染          → props.turn.data.get('aura') 读取
 */

/** 从工具入参解析出 {text, components}（aura_render 的 arguments 即组件负载）。 */
function parseArgs(argsRaw) {
  if (typeof argsRaw !== 'string') {
    return argsRaw && typeof argsRaw === 'object' ? argsRaw : null;
  }
  try {
    return JSON.parse(argsRaw);
  } catch {
    return null;
  }
}

export const auraDefinition = {
  kind: 'aura',

  /** 匹配本定义关心的事件：turn 开始建上下文，aura_render 调用更新。 */
  match(event) {
    if (event.type === 'turn/start') {
      return { id: String(event.data.turn), role: 'start' };
    }
    if (event.type === 'tool/call' && event.data?.name === 'aura_render') {
      return { id: String(event.data.turn), role: 'update' };
    }
    return null;
  },

  /** 最早的 start 匹配 → 初始 State。 */
  start(_context, match) {
    return { turn: match.event.data.turn, calls: [] };
  },

  /** 后续匹配 → 累积 State。 */
  update(context, match) {
    const ev = match.event;
    if (ev.type !== 'tool/call' || ev.data?.name !== 'aura_render') return context.state;
    const payload = parseArgs(ev.data.arguments);
    return {
      ...context.state,
      calls: [...context.state.calls, {
        callId: String(ev.data.callId ?? ''),
        seq: ev.seq,
        text: typeof payload?.text === 'string' ? payload.text : '',
        components: Array.isArray(payload?.components) ? payload.components : [],
      }],
    };
  },

  /** 发布到 turn 定位数据：turnTail 通过 props.turn.data.get('aura') 读取。 */
  buildLocationData(context, scope, previous) {
    if (scope !== 'turn' || context.state === undefined) return null;
    const { turn, calls } = context.state;
    if (previous?.kind === 'turn' && previous.turn === turn && previous.key === 'aura'
      && previous.value?.calls === calls) {
      return previous;
    }
    return { kind: 'turn', turn, key: 'aura', value: { calls } };
  },
};

export default auraDefinition;
