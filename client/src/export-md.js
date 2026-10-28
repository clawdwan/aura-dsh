/**
 * aura-dsh / client / src / export-md.js
 * 把面板卡片转成 Markdown（面向飞书云文档/其他软件阅读，保留结构）。
 *
 * 结构映射：
 *   metric_card      → 列表（指标：值（变化））
 *   comparison_table → md 表格
 *   insight_cards    → 列表（[评级] 标题：正文）
 *   article_list     → 列表
 *   trend_chart      → 数据表
 *   html             → HTML → Markdown（h1/h2/table/list/p）
 *   其他             → 简化列表
 */

/** 转义 md 内联特殊字符（保留中文） */
function esc(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

/** metric_card */
function metricToMd(card) {
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  for (const m of card.data?.metrics ?? []) {
    const change = m.change ? `（${esc(m.change)}）` : '';
    lines.push(`- **${esc(m.label ?? '')}**：${esc(m.value ?? '')}${change}`);
  }
  return lines.join('\n');
}

/** comparison_table */
function tableToMd(card) {
  const headers = card.data?.headers ?? [];
  const rows = card.data?.rows ?? [];
  if (!headers.length && !rows.length) return `### ${esc(card.title ?? card.id)}\n\n（空表格）`;
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  if (headers.length) {
    lines.push(`| ${headers.map(esc).join(' | ')} |`);
    lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
  }
  for (const row of rows) {
    lines.push(`| ${(Array.isArray(row) ? row : [row]).map(esc).join(' | ')} |`);
  }
  return lines.join('\n');
}

/** insight_cards */
function insightToMd(card) {
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  for (const c of card.data?.cards ?? []) {
    const rating = c.rating ? `[${esc(c.rating)}] ` : '';
    lines.push(`- **${rating}${esc(c.title ?? '')}**：${esc(c.body ?? '')}`);
  }
  return lines.join('\n');
}

/** article_list */
function articleToMd(card) {
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  for (const a of card.data?.articles ?? []) {
    const src = a.source ? `（${esc(a.source)}）` : '';
    const url = a.url ? `[链接](${a.url})` : '';
    lines.push(`- **${esc(a.title ?? '')}**${src}：${esc(a.summary ?? '')} ${url}`.trim());
  }
  return lines.join('\n');
}

/** trend_chart → 数据表 */
function chartToMd(card) {
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  const series = card.data?.series ?? [];
  for (const s of series) {
    lines.push(`**${esc(s.name ?? '系列')}**${card.data?.unit ? `（${esc(card.data.unit)}）` : ''}`, '');
    lines.push('| x | y |');
    lines.push('| --- | --- |');
    for (const p of s.data ?? []) lines.push(`| ${esc(p.x)} | ${esc(p.y)} |`);
    lines.push('');
  }
  return lines.join('\n');
}

/** 其他结构化类型：简化列表 */
function listToMd(card) {
  const lines = [`### ${esc(card.title ?? card.id)}`, ''];
  const d = card.data ?? {};
  const pick = d.steps ?? d.events ?? d.root?.children ?? d.nodes ?? [];
  if (Array.isArray(pick)) {
    for (const it of pick) {
      const label = it.label ?? it.title ?? it.time ?? it.name ?? JSON.stringify(it);
      lines.push(`- ${esc(label)}`);
    }
  } else {
    lines.push('```json', JSON.stringify(d, null, 2), '```');
  }
  return lines.join('\n');
}

/** HTML → Markdown（html 卡：面向飞书阅读，保留结构） */
function htmlToMd(html) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  } catch {
    return html;
  }
  const root = doc.body.firstElementChild ?? doc.body;
  const out = [];
  const textOf = (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

  const walk = (el) => {
    for (const node of el.childNodes ?? []) {
      if (node.nodeType === 3) {
        const t = node.textContent?.replace(/\s+/g, ' ').trim();
        if (t) out.push(t);
        continue;
      }
      if (node.nodeType !== 1) continue;
      const tag = node.tagName.toLowerCase();
      const cls = typeof node.className === 'string' ? node.className : '';
      if (cls.includes('a-h1')) { out.push(`# ${textOf(node)}`, ''); continue; }
      if (cls.includes('a-h2') || tag === 'h3') { out.push(`## ${textOf(node)}`, ''); continue; }
      if (tag === 'table') {
        const trs = [...node.querySelectorAll('tr')];
        if (trs.length) {
          const cells = (tr) => [...tr.children].map((c) => textOf(c));
          out.push(`| ${cells(trs[0]).join(' | ')} |`);
          out.push(`| ${cells(trs[0]).map(() => '---').join(' | ')} |`);
          for (const tr of trs.slice(1)) out.push(`| ${cells(tr).join(' | ')} |`);
          out.push('');
        }
        continue;
      }
      if (tag === 'ul' || tag === 'ol') {
        for (const li of node.querySelectorAll(':scope > li')) out.push(`- ${textOf(li)}`);
        out.push('');
        continue;
      }
      if (cls.includes('a-note') || cls.includes('a-warn') || cls.includes('a-quote')) {
        out.push(`> ${textOf(node)}`, '');
        continue;
      }
      if (tag === 'p') { out.push(textOf(node), ''); continue; }
      if (tag === 'br') { out.push(''); continue; }
      if (['div', 'section', 'span'].includes(tag)) { walk(node); continue; }
      out.push(textOf(node), '');
    }
  };
  walk(root);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** 单卡 → md 片段 */
export function cardToMd(card) {
  if (!card) return '';
  const type = card.type ?? 'comparison_table';
  switch (type) {
    case 'metric_card': return metricToMd(card);
    case 'comparison_table': return tableToMd(card);
    case 'insight_cards': return insightToMd(card);
    case 'article_list': return articleToMd(card);
    case 'trend_chart': return chartToMd(card);
    case 'html': return `### ${esc(card.title ?? card.id)}\n\n${htmlToMd(card.data?.html ?? '')}`;
    default: return listToMd(card);
  }
}

/** 多卡 → 完整 md 文档 */
export function cardsToMd(cards, { sessionId } = {}) {
  const head = ['# Aura 面板导出', ''];
  if (sessionId) head.push(`> 会话：${sessionId}`, '');
  head.push(`> 导出时间：${new Date().toLocaleString()}`, '');
  const bodies = (cards ?? []).map((c, i) => `## ${i + 1}. ${c.title ?? c.id}\n\n${cardToMd(c)}`);
  return [...head, ...bodies].join('\n\n');
}

/** 触发浏览器下载 .md */
export function downloadMd(filename, content) {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.error('[aura-export] 下载失败:', err?.message ?? err);
    return false;
  }
}
