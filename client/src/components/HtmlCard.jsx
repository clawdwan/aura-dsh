/**
 * aura-dsh / client / src / components / HtmlCard.jsx
 * HTML 富文档卡片：把 agent 生成的任意 HTML 放进沙箱 iframe 渲染。
 *
 * 安全：
 *  - sandbox="allow-scripts"（不给 allow-same-origin）→ 与宿主页面跨域隔离
 *  - 无 allow-top-navigation / allow-popups，防止劫持外层页面
 *
 * 主题：从宿主读取 DSH 的 CSS 变量，注入 iframe 内，让报告能跟随明暗主题
 * （agent 应该用 var(--aura-*) 而不是写死颜色）。
 *
 * 高度：iframe 内用 ResizeObserver 回报内容高度，宿主自适应（也可用 data.height 固定）。
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

/** 从宿主页面读一组 CSS 变量，拼成 iframe 的 :root 规则 */
function themeVars() {
  if (typeof window === 'undefined') return '';
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  /** 从 :root 或 body 读 CSS 变量（DSH 主题变量可能挂在任一处） */
  const read = (name) => root.getPropertyValue(name).trim() || body.getPropertyValue(name).trim() || '';
  const pick = (name, fallback) => read(name) || fallback;

  // 语义化短名（agent 写 HTML 时最自然会用的名字）+ 中性 fallback（读不到也是浅色 Play 风）
  const text = pick('--dsw-alias-label-primary', '#1f2329');
  const text2 = pick('--dsw-alias-label-secondary', '#646a73');
  const text3 = pick('--dsw-alias-label-tertiary', '#8f959e');
  // 面板里的底色要极淡：组件卡几乎无底色，这里统一压到 4% 左右
  const bg1 = 'rgba(128, 128, 128, 0.035)';
  const bg2 = 'rgba(128, 128, 128, 0.055)';
  const base = pick('--dsw-alias-bg-base', 'transparent');
  const border1 = 'rgba(128, 128, 128, 0.16)';
  const border2 = 'rgba(128, 128, 128, 0.10)';
  const accent = pick('--dsw-static-deepseek-500', '#4176e6');
  const accentSoft = pick('--dsw-static-deepseek-100', '#e4edfd');
  const accent700 = pick('--dsw-static-deepseek-600', '#4868b2');

  return `
  /* 语义化短名（推荐 agent 使用） */
  --aura-text: ${text};
  --aura-text-2: ${text2};
  --aura-text-3: ${text3};
  --aura-surface: ${bg1};
  --aura-surface-2: ${bg2};
  --aura-bg: ${base};
  --aura-border: ${border2};
  --aura-border-strong: ${border1};
  --aura-accent: ${accent};
  --aura-accent-soft: ${accentSoft};
  --aura-accent-strong: ${accent700};
  --aura-ok: #1f9d55;
  --aura-warn: #d4820a;
  --aura-bad: #cf3b3b;
  /* 设计 token（未来换风格只改这里） */
  --aura-radius: 10px;
  --aura-radius-sm: 6px;
  --aura-gap: 8px;
  --aura-gap-lg: 14px;
  --aura-font: 13.5px;
  --aura-font-sm: 12.5px;
  --aura-font-xs: 10px;
  --aura-line: 1.66;
  /* 原始 token 名（兼容） */
  --aura-static-deepseek-100: ${accentSoft};
  --aura-static-deepseek-500: ${accent};
  --aura-static-deepseek-600: ${accent700};
  --aura-alias-label-primary: ${text};
  --aura-alias-label-secondary: ${text2};
  --aura-alias-bg-base: ${base};
  --aura-alias-bg-l1: ${bg1};
  --aura-alias-bg-l2: ${bg2};
  --aura-alias-border-l1: ${border1};
  --aura-alias-border-l2: ${border2};
`;
}

export default function HtmlCard({ data }) {
  const html = typeof data?.html === 'string' ? data.html : '';
  const fixedHeight = typeof data?.height === 'number' && data.height > 0 ? data.height : null;
  const [height, setHeight] = useState(fixedHeight ?? 180);
  const frameRef = useRef(null);

  const srcdoc = useMemo(() => {
    const vars = themeVars();
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root {
${vars}
}
html, body { margin: 0; padding: 0; }
body {
  padding: 12px 14px;
  font-family: -apple-system, "PingFang SC", system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: var(--aura-alias-label-primary, #1f2329);
  background: transparent;
  overflow: visible;
}
a { color: var(--aura-static-deepseek-500, #4176e6); }
h1, h2, h3, h4 { margin: 0.6em 0 0.4em; line-height: 1.3; }
h1 { font-size: 18px; }
h2 { font-size: 15px; }
h3 { font-size: 13.5px; }
p, ul, ol, table { margin: 0.5em 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid var(--aura-alias-border-l2, rgba(128,128,128,.3)); padding: 5px 8px; text-align: left; }
th { background: var(--aura-alias-bg-l2, rgba(128,128,128,.08)); font-weight: 600; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
pre { background: var(--aura-alias-bg-l2, rgba(128,128,128,.08)); padding: 10px; border-radius: 8px; overflow: auto; }
blockquote { margin: 0.6em 0; padding-left: 10px; border-left: 3px solid var(--aura-static-deepseek-300, #b7c8fe); color: var(--aura-alias-label-secondary, #646a73); }
img { max-width: 100%; }
/* ===== aura-html 结构类（agent 写 HTML 时应使用这些类，不要自己设计样式） ===== */
.a-card {
  background: transparent;
  border: 1px solid var(--aura-border);
  border-radius: var(--aura-radius);
  padding: 12px;
}
.a-kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: var(--aura-gap);
  margin: 0 0 var(--aura-gap-lg);
}
.a-kpi > div {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
}
.a-kpi b {
  display: block;
  font-size: 15.5px;
  font-weight: 620;
  color: var(--aura-text);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.a-kpi span {
  display: block;
  margin-top: 3px;
  font-size: var(--aura-font-xs);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--aura-text-2);
  opacity: 0.9;
}
.a-h1 { font-size: 19px; font-weight: 650; margin: 0 0 4px; line-height: 1.35; }
.a-h2 {
  font-size: 13.5px;
  font-weight: 620;
  margin: 18px 0 7px;
  padding-left: 8px;
  border-left: 3px solid var(--aura-accent);
  line-height: 1.45;
}
.a-table { width: 100%; border-collapse: collapse; font-size: var(--aura-font-sm); }
.a-table th,
.a-table td {
  border-bottom: 1px solid var(--aura-border);
  padding: 7px 9px;
  line-height: 1.6;
  text-align: left;
  vertical-align: top;
}
.a-table th {
  width: 110px;
  color: var(--aura-text-2);
  font-weight: 500;
  white-space: nowrap;
  background: var(--aura-surface);
}
.a-table tr:last-child th,
.a-table tr:last-child td { border-bottom: none; }
.a-chip {
  display: inline-block;
  font-size: var(--aura-font-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.45;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--aura-accent-soft);
  color: var(--aura-accent-strong);
  margin: 2px 5px 2px 0;
  vertical-align: middle;
  white-space: nowrap;
}
/* 语义色 chip（用类而不是内联样式） */
.a-chip--ok {
  background: rgba(31, 157, 85, 0.12);
  color: #1a7f45;
}
.a-chip--bad {
  background: rgba(207, 59, 59, 0.10);
  color: #b13434;
}
.a-chip--warn {
  background: rgba(212, 130, 10, 0.12);
  color: #9a6208;
}
.a-chip--muted {
  background: rgba(128, 128, 128, 0.12);
  color: var(--aura-text-2);
}
.a-note {
  background: color-mix(in srgb, var(--aura-accent-soft) 55%, transparent);
  border-radius: var(--aura-radius);
  padding: 9px 11px;
  font-size: var(--aura-font-sm);
  margin: 8px 0;
}
.a-warn {
  background: rgba(212, 130, 10, 0.08);
  border: 1px solid rgba(212, 130, 10, 0.26);
  border-radius: var(--aura-radius);
  padding: 9px 11px;
  font-size: var(--aura-font-sm);
  margin: 8px 0;
}
.a-ok {
  background: rgba(31, 157, 85, 0.08);
  border: 1px solid rgba(31, 157, 85, 0.26);
  border-radius: var(--aura-radius);
  padding: 9px 11px;
  font-size: var(--aura-font-sm);
  margin: 8px 0;
}
.a-bad {
  background: rgba(207, 59, 59, 0.07);
  border: 1px solid rgba(207, 59, 59, 0.25);
  border-radius: var(--aura-radius);
  padding: 9px 11px;
  font-size: var(--aura-font-sm);
  margin: 8px 0;
}
.a-quote {
  border-left: 3px solid var(--aura-border-strong);
  padding-left: 10px;
  color: var(--aura-text-2);
  margin: 8px 0;
}
.a-list { padding-left: 18px; margin: 4px 0 8px; }
.a-list li { margin: 5px 0; line-height: 1.7; }
.a-muted { color: var(--aura-text-2); }
.a-accent { color: var(--aura-accent); }
.a-dim { font-size: 11.5px; color: var(--aura-text-2); }

</style>
</head>
<body>
${html}
<script>
(function () {
  function report() {
    try {
      var h = Math.ceil(document.documentElement.scrollHeight);
      parent.postMessage({ __auraHtmlHeight: true, height: h }, '*');
    } catch (e) { /* ignore */ }
  }
  if (window.ResizeObserver) new ResizeObserver(report).observe(document.documentElement);
  window.addEventListener('load', report);
  setTimeout(report, 60);
})();
</script>
</body>
</html>`;
  }, [html]);

  // 监听 iframe 的内容高度回报
  useEffect(() => {
    if (fixedHeight) return undefined;
    const onMessage = (e) => {
      const d = e.data;
      if (!d || d.__auraHtmlHeight !== true || typeof d.height !== 'number') return;
      // 只接受来自本 iframe 的消息
      if (frameRef.current && e.source !== frameRef.current.contentWindow) return;
      setHeight(Math.min(Math.max(Math.ceil(d.height), 80), 4000));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [fixedHeight]);

  if (!html) {
    return <div className="aura-html-empty">（html 卡内容为空）</div>;
  }

  return (
    <iframe
      ref={frameRef}
      className="aura-html-card"
      title="aura-html"
      sandbox="allow-scripts"
      srcDoc={srcdoc}
      style={fixedHeight ? { height: `${fixedHeight}px` } : { height: `${height}px` }}
    />
  );
}
