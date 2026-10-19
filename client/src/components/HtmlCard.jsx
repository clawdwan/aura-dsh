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
  const cs = getComputedStyle(document.documentElement);
  const names = [
    '--dsw-static-deepseek-50', '--dsw-static-deepseek-100', '--dsw-static-deepseek-300',
    '--dsw-static-deepseek-400', '--dsw-static-deepseek-450', '--dsw-static-deepseek-500',
    '--dsw-static-deepseek-600',
    '--dsw-alias-label-primary', '--dsw-alias-label-secondary', '--dsw-alias-label-tertiary',
    '--dsw-alias-bg-base', '--dsw-alias-bg-l1', '--dsw-alias-bg-l2',
    '--dsw-alias-border-l1', '--dsw-alias-border-l2',
  ];
  const decls = names
    .map((n) => {
      const v = cs.getPropertyValue(n).trim();
      // 把 DSH 的变量名映射成更短的 --aura-* 供报告使用
      return v ? `  ${n.replace('--dsw-', '--aura-')}: ${v};` : '';
    })
    .filter(Boolean)
    .join('\n');
  return decls;
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
