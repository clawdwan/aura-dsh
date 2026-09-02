/**
 * aura-dsh / host / json-repair.js
 * 移植自 aura/agent.js（2026-06-24）的 JSON 截断/畸形修复逻辑。
 * 纯函数，无依赖。供 aura_render 工具在 execute 时修复 agent 传入的 components JSON。
 *
 * 修复策略（4 级）：
 *   1. 清洗不可见字符 + 直接 parse
 *   2. 括号不平衡修复（{ [ 多删少补）
 *   3. 提取最后一个完整对象截断补全
 *   4. 部分修复：提取 text + components 数组逐段解析
 */

/** 清洗控制字符 */
function cleanControlChars(raw) {
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** 括号计数（跳过字符串内） */
function countBrackets(s) {
  let ob = 0, cb = 0, oa = 0, ca = 0, inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') ob++; if (ch === '}') cb++;
    if (ch === '[') oa++; if (ch === ']') ca++;
  }
  return { ob, cb, oa, ca };
}

/** 补全未闭合括号 */
function closeBrackets(s) {
  const stack = [];
  let inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' || ch === ']') stack.pop();
  }
  let out = s;
  while (stack.length > 0) {
    const opener = stack.pop();
    out += opener === '{' ? '}' : ']';
  }
  return out;
}

/** 修复 components 数组内部的括号问题（多余/缺少的 { }） */
function fixBracesInComponents(compsJson) {
  const { ob, cb, oa, ca } = countBrackets(compsJson);
  if (ob === cb && oa === ca) return compsJson;

  let result = compsJson;
  // Remove extra } from anywhere (from the end first)
  if (cb > ob) {
    let extra = cb - ob;
    let acc = '';
    let inStr = false, esc = false;
    for (let i = result.length - 1; i >= 0 && extra > 0; i--) {
      const ch = result[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '}') { extra--; continue; }
      acc = result[i] + acc;
    }
    if (extra === 0) result = result.substring(0, result.length - acc.length) + acc;
  }
  // Remove extra ]
  if (ca > oa) {
    let extra = ca - oa;
    let acc = '';
    let inStr = false, esc = false;
    for (let i = result.length - 1; i >= 0 && extra > 0; i--) {
      const ch = result[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === ']') { extra--; continue; }
      acc = result[i] + acc;
    }
    if (extra === 0) result = result.substring(0, result.length - acc.length) + acc;
  }
  // Add missing } or ]
  const bal = countBrackets(result);
  while (bal.cb < bal.ob) { result += '}'; bal.cb++; }
  while (bal.ca < bal.oa) { result += ']'; bal.ca++; }
  return result;
}

/** 逐个提取组件对象（部分修复时兜底） */
function extractComponentsOneByOne(compsJson) {
  const components = [];
  let inStr = false, esc = false, depth = 0, start = -1;
  for (let i = 0; i < compsJson.length; i++) {
    const ch = compsJson[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          const obj = JSON.parse(compsJson.substring(start, i + 1));
          if (obj.type) components.push(obj);
        } catch (e) { /* skip malformed */ }
        start = -1;
      }
    }
  }
  if (components.length === 0) {
    let searchPos = 0;
    while ((searchPos = compsJson.indexOf('"type":', searchPos)) !== -1) {
      const objStart = compsJson.lastIndexOf('{', searchPos);
      if (objStart < 0) { searchPos++; continue; }
      let d = 0, inS = false, esC = false;
      for (let j = objStart; j < compsJson.length; j++) {
        const c = compsJson[j];
        if (esC) { esC = false; continue; }
        if (c === '\\') { esC = true; continue; }
        if (c === '"') { inS = !inS; continue; }
        if (inS) continue;
        if (c === '{') d++;
        if (c === '}') { d--; if (d === 0) {
          try {
            const obj = JSON.parse(compsJson.substring(objStart, j + 1));
            if (obj.type) components.push(obj);
          } catch (e) { /* skip */ }
          searchPos = j + 1;
          break;
        }}
      }
      searchPos++;
    }
  }
  return components;
}

/**
 * 修复 agent 传入的 components JSON 文本 → {text, components[]}
 * @param {string} raw - 原始 JSON 字符串（来自 LLM 工具调用参数）
 * @returns {{text: string, components: any[]}|null}
 */
function repairComponentsJson(raw) {
  const cleaned = cleanControlChars(raw);

  // Level 1: direct parse
  try { const o = JSON.parse(cleaned); if (o && Array.isArray(o.components)) return o; } catch (e) { /* next */ }

  // Level 2: bracket-balance repair
  try {
    let fixed = cleaned;
    const { ob, cb, oa, ca } = countBrackets(fixed);
    if (cb > ob) {
      let extra = cb - ob, acc = '', inS = false, esC = false;
      for (let i = fixed.length - 1; i >= 0 && extra > 0; i--) {
        const ch = fixed[i];
        if (esC) { esC = false; continue; }
        if (ch === '\\') { esC = true; continue; }
        if (ch === '"') { inS = !inS; continue; }
        if (inS) continue;
        if (ch === '}' && extra > 0) { extra--; continue; }
        acc = fixed[i] + acc;
      }
      if (extra === 0) fixed = fixed.substring(0, fixed.length - acc.length) + acc;
    }
    if (ca > oa) {
      let extra = ca - oa, acc = '', inS = false, esC = false;
      for (let i = fixed.length - 1; i >= 0 && extra > 0; i--) {
        const ch = fixed[i];
        if (esC) { esC = false; continue; }
        if (ch === '\\') { esC = true; continue; }
        if (ch === '"') { inS = !inS; continue; }
        if (inS) continue;
        if (ch === ']' && extra > 0) { extra--; continue; }
        acc = fixed[i] + acc;
      }
      if (extra === 0) fixed = fixed.substring(0, fixed.length - acc.length) + acc;
    }
    fixed = closeBrackets(fixed);
    const o = JSON.parse(fixed);
    if (o && Array.isArray(o.components)) return o;
  } catch (e) { /* next */ }

  // Level 3: truncation repair — keep last complete object
  try {
    const lastComplete = cleaned.lastIndexOf('"}');
    if (lastComplete > 0) {
      let fixed = cleaned.slice(0, lastComplete + 2) + '\n]}';
      fixed = closeBrackets(fixed);
      const o = JSON.parse(fixed);
      if (o && Array.isArray(o.components)) return o;
    }
  } catch (e) { /* next */ }

  // Level 4: partial repair — text + components one-by-one
  try {
    const result = { text: '', components: [] };
    const textMatch = cleaned.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (textMatch) {
      result.text = textMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
    } else {
      result.text = cleaned.substring(0, 200);
    }
    const compStart = cleaned.indexOf('"components"');
    if (compStart > 0) {
      const afterComps = cleaned.substring(compStart + '"components"'.length);
      const arrayStart = afterComps.indexOf('[');
      if (arrayStart >= 0) {
        let i = arrayStart, bracketDepth = 0, inStr4 = false, esc4 = false;
        for (; i < afterComps.length; i++) {
          const ch = afterComps[i];
          if (esc4) { esc4 = false; continue; }
          if (ch === '\\') { esc4 = true; continue; }
          if (ch === '"') { inStr4 = !inStr4; continue; }
          if (inStr4) continue;
          if (ch === '[') bracketDepth++;
          if (ch === ']') { bracketDepth--; if (bracketDepth < 0) break; }
        }
        if (bracketDepth <= 0 && i <= afterComps.length) {
          let compsJson = afterComps.substring(arrayStart, bracketDepth < 0 ? i + 1 : i);
          compsJson = fixBracesInComponents(compsJson);
          compsJson = compsJson.replace(/\]\]\}\}\}/g, ']]}}').replace(/\}\}\}/g, (match, offset) => {
            let inS = false, escC = false, depth = 0;
            for (let k = 0; k < offset; k++) {
              const c = compsJson[k];
              if (escC) { escC = false; continue; }
              if (c === '\\') { escC = true; continue; }
              if (c === '"') { inS = !inS; continue; }
              if (inS) continue;
              if (c === '{') depth++; if (c === '}') depth--;
            }
            return depth === 1 ? '}}' : match;
          });
          try {
            result.components = JSON.parse(compsJson);
          } catch (e) {
            result.components = extractComponentsOneByOne(compsJson);
          }
        }
      }
    }
    if (result.text && (result.components.length > 0 || cleaned.length < 100)) return result;
  } catch (e) { /* give up */ }

  return null;
}

export { repairComponentsJson, fixBracesInComponents, extractComponentsOneByOne };
