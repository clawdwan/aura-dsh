/**
 * aura-dsh / client / src / selection-context.js
 * 把「面板圈选提问」拼成发给 agent 的 Markdown 上下文。
 *
 * 上下文分四部分（按重要性）：
 *   1. 命中卡片（卡片级上下文：id / type / title / 完整 data）
 *   2. 圈选范围（面板内相对位置，帮助 agent 理解"你圈的是哪块"）
 *   3. 来源追溯（可选）：该卡片由哪一轮的 aura_panel 调用生成，那轮的用户消息与工具调用
 *   4. 用户问题
 *
 * 追溯说明：卡片 id 出现在 aura_panel 的 tool/result 里；该 result 所属的 turn
 * 提供了"当时用户在问什么、agent 调了哪些工具"。这些都是会话里已有的数据。
 */

/**
 * 从会话节点里找"包含该卡片 id 的 aura_panel 调用"，并回溯其 turn 号。
 * turn 取法：命中节点自身的 location.turn 优先；缺失时向前找最近的带 turn 的节点
 * （DSH 的 ConversationLocation 形如 {turn?, step?}，部分节点可能只有 session 归属）。
 */
function traceSource(nodes, cardId) {
  const list = Array.isArray(nodes) ? nodes : [];
  const turnOf = (node) => {
    // DSH 的 ConversationLocation 形如：
    //   { kind:'step'|'turn'|'session', turn: {turn:N,...} | undefined, step: {turn:N,step:N,...} | undefined }
    // 注意 location.turn 是 **Turn 对象**而不是数字，需要取 .turn。
    const loc = node?.location;
    const raw = loc?.turn ?? loc?.step?.turn ?? node?.data?.turn ?? node?.data?.root?.turn;
    if (Number.isFinite(raw)) return raw;                 // 已经是数字
    if (raw && typeof raw === 'object' && Number.isFinite(raw.turn)) return raw.turn; // Turn 对象
    return undefined;
  };

  let hit = -1;
  for (let i = 0; i < list.length; i += 1) {
    const node = list[i];
    if (!node) continue;
    let raw = '';
    try { raw = JSON.stringify(node.data ?? node); } catch { raw = ''; }
    if (!raw.includes(cardId)) continue;
    if (node.kind !== 'tool-call' && node.kind !== 'tool-result') continue;
    const name = node.data?.root?.name ?? node.data?.call?.name ?? node.data?.name;
    if (name && name !== 'aura_panel') continue;
    hit = i;
    break;
  }
  if (hit < 0) return null;

  // 命中节点自身优先，其次向前回溯最近的 turn
  let turn = turnOf(list[hit]);
  for (let i = hit; turn === undefined && i >= 0; i -= 1) turn = turnOf(list[i]);

  return { turn, tool: 'aura_panel' };
}

/** 从 turn 的节点里取用户消息与工具调用摘要。 */
function turnDigest(nodes, turn) {
  if (turn === undefined || turn === null) return null;
  const nodeTurn = (n) => {
    const loc = n?.location;
    const raw = loc?.turn ?? loc?.step?.turn ?? n?.data?.turn;
    if (Number.isFinite(raw)) return raw;
    if (raw && typeof raw === 'object' && Number.isFinite(raw.turn)) return raw.turn;
    return undefined;
  };
  const list = (Array.isArray(nodes) ? nodes : []).filter((n) => nodeTurn(n) === turn);
  const userMsg = list
    .filter((n) => n.kind === 'user')
    .map((n) => (n.data?.message?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join(''))
    .filter(Boolean)
    .join(' / ');
  const tools = list
    .filter((n) => n.kind === 'tool-call')
    .map((n) => n.data?.root?.name ?? n.data?.call?.name ?? n.data?.name)
    .filter((x) => x && x !== 'aura_panel');
  return {
    userMsg: userMsg.slice(0, 160),
    tools: [...new Set(tools)].slice(0, 6),
  };
}

/** 把卡片数据压成紧凑的展示（避免超长）。 */
function compactData(data, maxChars = 2400) {
  try {
    const s = JSON.stringify(data);
    if (s.length <= maxChars) return s;
    return `${s.slice(0, maxChars)}…（已截断，原文 ${s.length} 字符）`;
  } catch {
    return String(data);
  }
}

/**
 * 构建圈选提问的上下文 Markdown。
 * @param {{cards: Array, rect: object, question: string, nodes: Array, panelWidth?: number, panelHeight?: number}} p
 */
export function buildSelectionContext({ cards, rect, question, fineHits, nodes, panelWidth, panelHeight }) {
  const w = panelWidth || 1;
  const h = panelHeight || 1;
  const pct = (v, base) => `${Math.round((v / base) * 100)}%`;

  const lines = [];
  lines.push('【面板圈选提问】');
  lines.push('');
  lines.push(`📊 命中卡片（${cards.length} 张）：${cards.map((c) => `「${c.title ?? c.id}」(${c.type ?? '?'}, id:${c.id})`).join('、')}`);
  if (rect) {
    lines.push(
      `✂️ 圈选范围：面板内 x ${pct(rect.left, w)}~${pct(rect.left + rect.width, w)}，` +
      `y ${pct(rect.top, h)}~${pct(rect.top + rect.height, h)}`,
    );
  }
  // 精确命中（圈选到的卡片内具体元素）
  const hits = Array.isArray(fineHits) ? fineHits.filter((h) => h && h.text) : [];
  if (hits.length) {
    lines.push('');
    lines.push('✨ 命中内容（圈选到的具体元素）：');
    const MAX = 8;
    for (const h of hits.slice(0, MAX)) {
      lines.push(`- 「${h.cardTitle ?? h.cardId}」· ${h.text}`);
    }
    if (hits.length > MAX) lines.push(`- …另有 ${hits.length - MAX} 条`);
  }

  lines.push(`❓ 问题：${question}`);
  lines.push('');
  lines.push('【卡片数据】');
  for (const c of cards) {
    lines.push(`- 「${c.title ?? c.id}」(${c.type}):`);
    lines.push('```json');
    lines.push(compactData(c.data));
    lines.push('```');
  }

  // 来源追溯（尽力而为）
  const traces = [];
  for (const c of cards) {
    const t = traceSource(nodes, c.id);
    if (!t) continue;
    const digest = turnDigest(nodes, t.turn);
    traces.push({ id: c.id, ...t, ...(digest ?? {}) });
  }
  if (traces.length) {
    lines.push('');
    lines.push('【来源（自动追溯）】');
    for (const t of traces) {
      const where = Number.isFinite(t.turn) ? `turn #${t.turn}` : '本会话';
      lines.push(`- 「${t.id}」：由 ${where} 的 ${t.tool} 调用生成`);
      if (t.userMsg) lines.push(`  · 该轮用户说：「${t.userMsg}」`);
      if (t.tools?.length) lines.push(`  · 该轮工具：${t.tools.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('【回答要求】');
  lines.push('- 请针对上面命中的卡片与圈选范围作答（明确引用是哪张卡/哪个区间）。');
  lines.push('- 解释性结论直接回答；若需要更新数据/图表，可调用 aura_panel 更新右侧面板。');
  return lines.join('\n');
}

export default buildSelectionContext;
