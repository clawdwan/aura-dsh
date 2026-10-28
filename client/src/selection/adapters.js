/**
 * aura-dsh / client / src / selection / adapters.js
 * 圈选适配器协议：把「圈中的 DOM 元素」翻译成可提问的上下文。
 *
 * 设计目标（P1）：
 *   - 圈选层不再硬编码 aura 卡片选择器
 *   - 每个适配器声明「哪些元素可圈」+「怎么描述」
 *   - 通用 DOM 适配器兜底，任何区域都能圈
 *
 * 未来拆出 dsh-select-ask 时，这份协议可以直接搬走。
 */

/**
 * @typedef {object} SelectionHit
 * @property {string} adapterId   - 命中的适配器 id
 * @property {string} label       - 人类可读标签（卡片名 / 元素名）
 * @property {string} [text]      - 精确命中的文本片段
 * @property {unknown} [data]     - 结构化数据（如 aura 卡片 data）
 * @property {string} [cardId]    - aura 卡片 id（其他适配器可缺省）
 * @property {{left:number,top:number,right:number,bottom:number}} rect - 视口坐标
 */

/**
 * @typedef {object} SelectAdapter
 * @property {string} id
 * @property {string} [selector]  - 可圈选元素的 CSS 选择器（generic 适配器可省略）
 * @property {(el: Element) => {label:string, text?:string, data?:unknown, cardId?:string} | null} describe
 */

/** aura 面板卡片适配器：卡片容器带 data-aura-card-id / data-aura-card-title */
export function createAuraCardAdapter() {
  return {
    id: 'aura-card',
    selector: '[data-aura-card-id]',
    describe(el, sel) {
      const cardId = el?.dataset?.auraCardId;
      if (!cardId) return null;
      const lines = extractLines(sel, el);
      return {
        label: el.dataset.auraCardTitle || cardId,
        cardId,
        lines,
      };
    },
  };
}

/**
 * 通用 DOM 适配器：任何可见元素都可圈（兜底）。
 * 命中优先级低——只有在没有其它适配器命中时才用。
 */
export function createGenericDomAdapter() {
  return {
    id: 'generic-dom',
    selector: null,
    describe(el) {
      if (!el || el === document.body || el === document.documentElement) return null;
      // 通用 DOM 拿不到消息边界：压缩空白 + 只取首段 + 截断，避免把多轮内容拼在一起
      const raw = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!raw) return null;
      const tag = (el.tagName || 'unknown').toLowerCase();
      const firstChunk = raw.length > 150 ? `${raw.slice(0, 150)}…` : raw;
      return { label: tag, text: firstChunk };
    },
  };
}

/**
 * 对话流适配器：DSH 对话节点带 data-chat-node-key / data-chat-turn，
 * 可精确定位到单个节点（而不是把整轮内容拼在一起）。
 */
export function createConversationAdapter() {
  return {
    id: 'conversation',
    selector: '[data-chat-node-key]',
    describe(el, sel) {
      const nodeKey = el?.dataset?.chatNodeKey;
      if (!nodeKey) return null;
      const turn = el.dataset.chatTurn;
      const lines = extractLines(sel, el);
      return {
        label: turn ? `对话节点（turn ${turn}）` : '对话节点',
        turn,
        lines,
      };
    },
  };
}

/** 默认适配器集合（aura 优先，对话流次之，通用兜底） */
export function createDefaultAdapters() {
  return [createAuraCardAdapter(), createConversationAdapter(), createGenericDomAdapter()];
}

/**
 * 提取圈选矩形内的「行级文本」。
 * 原理：遍历 root 下的文本节点 → 用 Range.getClientRects() 得到每行矩形 →
 * 与圈选矩形相交的行，用 caretRangeFromPoint 取该行的起止字符 → 拼成行文本。
 *
 * @param {{left:number,top:number,right:number,bottom:number}} sel
 * @param {Element} [root] - 限定范围（缺省整页）
 * @param {number} [maxLines=6]
 * @returns {string[]}
 */
export function extractLines(sel, root, maxLines = 6) {
  const lines = [];
  if (!sel) return lines;
  const scope = root ?? document.body;
  if (!scope) return lines;
  const caretAt = (x, y) => {
    if (typeof document.caretRangeFromPoint === 'function') {
      return document.caretRangeFromPoint(x, y);
    }
    if (typeof document.caretPositionFromPoint === 'function') {
      const pos = document.caretPositionFromPoint(x, y);
      if (!pos) return null;
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
    return null;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && lines.length < maxLines) {
    const raw = node.textContent;
    if (raw && raw.trim()) {
      const parent = node.parentElement;
      if (parent && !parent.closest('.aura-global-select')) {
        const range = document.createRange();
        range.selectNodeContents(node);
        let rects = [];
        try { rects = [...range.getClientRects()]; } catch { rects = []; }
        for (const rect of rects) {
          if (rect.width < 2 || rect.height < 2) continue;
          if (!(sel.left < rect.right && sel.right > rect.left && sel.top < rect.bottom && sel.bottom > rect.top)) continue;
          const y = rect.top + rect.height / 2;
          const startR = caretAt(rect.left + 2, y);
          const endR = caretAt(rect.right - 2, y);
          let text = '';
          if (startR && endR) {
            try {
              const r = document.createRange();
              r.setStart(startR.startContainer, startR.startOffset);
              r.setEnd(endR.endContainer, endR.endOffset ?? endR.startOffset);
              text = r.toString().replace(/\s+/g, ' ').trim();
            } catch { text = ''; }
          }
          // 退回：caretRangeFromPoint 不可用/失败时，用该文本节点内容（截断）
          if (!text) {
            text = raw.replace(/\s+/g, ' ').trim().slice(0, 200);
          }
          if (text.length >= 2 && !seen.has(text)) {
            seen.add(text);
            lines.push(text);
            if (lines.length >= maxLines) break;
          }
        }
      }
    }
    node = walker.nextNode();
  }
  return lines;
}

/**
 * 收集圈选矩形内的命中（视口坐标）。
 * 策略：
 *   1. 逐个适配器扫描其 selector（aura 卡片等结构化元素）
 *   2. 若某区域没有结构化命中，用 elementsFromPoint 取通用 DOM（兜底）
 *   3. 同一适配器内取最深层（面积最小、互不包含）
 *
 * @param {SelectAdapter[]} adapters
 * @param {{left:number,top:number,right:number,bottom:number}} sel - 视口坐标
 * @returns {SelectionHit[]}
 */
export function collectHits(adapters, sel) {
  const hits = [];
  const covered = []; // 已被结构化命中的区域（避免通用适配器重复）

  const inSel = (r) => sel.left < r.right && sel.right > r.left && sel.top < r.bottom && sel.bottom > r.top;
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, area: r.width * r.height };
  };
  const contains = (outer, inner) => outer.left <= inner.left + 1 && outer.top <= inner.top + 1
    && outer.right >= inner.right - 1 && outer.bottom >= inner.bottom + 1;

  for (const adapter of adapters) {
    if (!adapter?.selector || typeof adapter.describe !== 'function') continue;
    let els = [];
    try { els = [...document.querySelectorAll(adapter.selector)]; } catch { els = []; }
    const candidates = [];
    for (const el of els) {
      const rect = rectOf(el);
      if (rect.area < 16 || !inSel(rect)) continue;
      const described = adapter.describe(el, sel);
      if (!described) continue;
      candidates.push({ el, rect, described });
    }
    // 同适配器内去重：保留最深层（面积最小、互不包含）
    candidates.sort((a, b) => a.rect.area - b.rect.area);
    const kept = [];
    for (const c of candidates) {
      const overlapped = kept.some((k) => contains(k.rect, c.rect) || contains(c.rect, k.rect));
      if (!overlapped) kept.push(c);
    }
    for (const c of kept) {
      hits.push({
        adapterId: adapter.id,
        label: c.described.label,
        text: c.described.text,
        lines: c.described.lines,
        turn: c.described.turn,
        data: c.described.data,
        cardId: c.described.cardId,
        rect: { left: c.rect.left, top: c.rect.top, right: c.rect.right, bottom: c.rect.bottom },
      });
      covered.push(c.rect);
    }
  }

  // 通用兜底：elementsFromPoint 取圈选区域内的文本元素
  if (hits.length === 0) {
    const generic = adapters.find((a) => a.id === 'generic-dom');
    if (generic) {
      const points = [
        [sel.left + 2, sel.top + 2],
        [sel.right - 2, sel.top + 2],
        [sel.left + 2, sel.bottom - 2],
        [sel.right - 2, sel.bottom - 2],
        [(sel.left + sel.right) / 2, (sel.top + sel.bottom) / 2],
      ];
      const seen = new Set();
      /** 取「有直接文本」的最小元素（避免命中把多段内容拼在一起的容器 div） */
      const pickLeaf = (stack) => {
        let fallback = null;
        for (const node of stack) {
          if (!node || node.closest?.('.aura-global-select')) continue;
          if (!fallback) fallback = node;
          // 直接文本节点（不算子元素文本）——说明这个元素本身承载文字
          let direct = '';
          for (const child of node.childNodes ?? []) {
            if (child.nodeType === 3) direct += child.textContent ?? '';
          }
          direct = direct.replace(/\s+/g, ' ').trim();
          if (direct.length >= 4) return node;
        }
        return fallback;
      };
      for (const [x, y] of points) {
        // elementsFromPoint 返回「从上到下」的所有层；跳过圈选层自身（覆盖全屏，
        // 否则命中的永远是圈选提示 div）
        const stack = typeof document.elementsFromPoint === 'function'
          ? document.elementsFromPoint(x, y)
          : [document.elementFromPoint(x, y)];
        const el = pickLeaf(stack);
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const described = generic.describe(el);
        if (!described) continue;
        const r = el.getBoundingClientRect();
        hits.push({
          adapterId: generic.id,
          label: described.label,
          text: described.text,
          rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
        });
      }
    }
  }

  return hits;
}
