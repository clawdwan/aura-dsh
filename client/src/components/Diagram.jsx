/**
 * aura-dsh / client / src / components / Diagram.jsx
 * 声明式图组件 —— mermaid 版。
 *
 * 数据：{ title?, code: '<mermaid 文本>', kind?: 'flowchart'|'sequence'|... }
 * agent 直接给 mermaid 文本（零结构化成本），本组件只负责「文本 → SVG」。
 *
 * 边界（严守渲染层定位）：
 *  - 不解释图的语义，不做交互（点击/拖拽）——那是探索型图（后续 ECharts graph）的事
 *  - 主题通过 token 映射，不硬编码颜色
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { theme as antdTheme } from 'antd';

let initialized = false;

/** 基于 antd design token 生成 mermaid 主题。
 *  取色策略：主色系做点缀（节点/演员淡蓝底 + 蓝边），文字/背景用中性色，
 *  避免"全灰"的呆板，也避免"全蓝"的花哨。 */
function themeFromToken(tk) {
  const t = tk ?? {};
  const fallback = (v, f) => (v && String(v).trim() ? v : f);
  return {
    background: fallback(t.colorBgContainer, 'transparent'),
    // 节点：淡色底 + 主色边框
    primaryColor: fallback(t.colorPrimaryBg, 'rgba(22,119,255,0.08)'),
    primaryBorderColor: fallback(t.colorPrimaryBorder, 'rgba(22,119,255,0.35)'),
    primaryTextColor: fallback(t.colorText, '#1f2329'),
    // 连线：主色系的柔化版
    lineColor: fallback(t.colorPrimaryBorder, 'rgba(22,119,255,0.35)'),
    secondaryColor: fallback(t.colorFillTertiary, 'rgba(0,0,0,0.04)'),
    tertiaryColor: fallback(t.colorFillQuaternary, 'rgba(0,0,0,0.02)'),
    secondaryTextColor: fallback(t.colorTextSecondary, '#4a4f57'),
    tertiaryTextColor: fallback(t.colorTextTertiary, '#8a8f99'),
    edgeLabelBackground: fallback(t.colorBgContainer, 'transparent'),
    // 分组
    clusterBkg: fallback(t.colorFillQuaternary, 'rgba(0,0,0,0.02)'),
    clusterBorder: fallback(t.colorBorderSecondary, 'rgba(0,0,0,0.1)'),
    // 字体
    fontFamily: fallback(t.fontFamily, 'inherit'),
    fontSize: '11px',
    // 时序图
    actorBkg: fallback(t.colorPrimaryBg, 'rgba(22,119,255,0.06)'),
    actorBorder: fallback(t.colorPrimaryBorder, 'rgba(22,119,255,0.3)'),
    actorTextColor: fallback(t.colorText, '#1f2329'),
    actorLineColor: fallback(t.colorBorderSecondary, 'rgba(0,0,0,0.12)'),
    signalColor: fallback(t.colorPrimary, '#1677ff'),
    signalTextColor: fallback(t.colorText, '#1f2329'),
    labelBoxBkgColor: fallback(t.colorPrimaryBg, 'rgba(22,119,255,0.06)'),
    labelBoxBorderColor: fallback(t.colorPrimaryBorder, 'rgba(22,119,255,0.3)'),
    labelTextColor: fallback(t.colorText, '#1f2329'),
    loopTextColor: fallback(t.colorText, '#1f2329'),
    noteBkgColor: fallback(t.colorWarningBg, 'rgba(250,173,20,0.1)'),
    noteBorderColor: fallback(t.colorWarningBorder, 'rgba(250,173,20,0.4)'),
    noteTextColor: fallback(t.colorText, '#1f2329'),
  };
}

export default function Diagram({ title, data }) {
  const { token } = antdTheme.useToken();
  const rawId = useId();
  const renderId = `aura-diagram-${String(rawId).replace(/[^a-zA-Z0-9]/g, '')}`;
  const hostRef = useRef(null);
  const lastTokenRef = useRef(null);
  const [error, setError] = useState(null);

  const code = typeof data?.code === 'string' ? data.code.trim() : '';
  // 可选：agent 显式指定 kind 时用作兜底（mermaid 一般能从文本推断）
  const kind = typeof data?.kind === 'string' ? data.kind : undefined;

  useEffect(() => {
    if (!code) return undefined;
    let cancelled = false;

    (async () => {
      try {
        // token 变化（切主题）时也重新初始化
        if (!initialized || lastTokenRef.current !== token) {
          lastTokenRef.current = token;
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            themeVariables: themeFromToken(token),
            flowchart: { htmlLabels: false, curve: 'basis', nodeSpacing: 40, rankSpacing: 50, padding: 12, useMaxWidth: true },
            sequence: {
              useMaxWidth: true,
              mirrorActors: false,        // 不再在底部镜像演员（省一半高度）
              actorMargin: 36,
              boxMargin: 8,
              messageMargin: 32,
              noteMargin: 8,
              diagramMarginX: 8,
              diagramMarginY: 8,
            },
          });
          initialized = true;
        }
        // 每次渲染用唯一 id，避免 mermaid 内部节点 id 冲突
        const source = kind && !/^\s*(flowchart|graph|sequenceDiagram|classDiagram|erDiagram|stateDiagram|gantt|pie|journey|mindmap|timeline)/m.test(code)
          ? `${kind}\n${code}`
          : code;
        const { svg } = await mermaid.render(`${renderId}-${Date.now()}`, source);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();

    return () => { cancelled = true; };
  }, [code, kind, renderId, token]);

  if (!code) {
    return <div className="aura-diagram-empty">（该图无内容）</div>;
  }

  return (
    <figure className="aura-diagram">
      {title ? <figcaption className="aura-diagram-title">{title}</figcaption> : null}
      {error ? (
        <div className="aura-diagram-error">
          <div>⚠️ mermaid 渲染失败</div>
          <pre>{error}</pre>
          <details>
            <summary>源码</summary>
            <pre>{code}</pre>
          </details>
        </div>
      ) : (
        <div ref={hostRef} className="aura-diagram-svg" />
      )}
    </figure>
  );
}
