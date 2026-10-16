/**
 * aura-dsh / client / src / styles.js
 * Aura 组件样式（从 styles.css 迁移为 JS 字符串，官方 dsh-client-ui-tool 同款注入模式）。
 */
const auraCss = `/* ============================================================
 * aura-dsh / client / src / styles.css
 * Aura 展示层样式（迁移自 define/client-body.js 的 styles.insert 字符串，
 * 逐条保持一致：类名、明暗主题 token、涨跌红绿、flex 布局）。
 *
 * 注入方式：由 index.jsx \`import './styles.css'\` 引入，tsdown 打包时
 * 会把 CSS 内联进 client 包并以 <style data-plugin-css> 注入（官方
 * SkillRow.module.css 同款模式），无需运行时手动 styles.insert。
 * ============================================================ */

.aura-card {
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 4px 0;
  background: var(--dsw-surface, transparent);
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}
.aura-card + .aura-card { margin-top: 8px; }

.aura-title {
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 8px;
}

/* ---- metric_card ---- */
.aura-metric-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.aura-metric {
  flex: 1 1 140px;
  min-width: 120px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
}
.aura-metric .label { font-size: 12px; opacity: 0.7; }
.aura-metric .value { font-size: 16px; font-weight: 700; }
.aura-metric .value.positive { color: #22c55e; }
.aura-metric .value.negative { color: #ef4444; }
.aura-metric .change { font-size: 12px; }
.aura-metric .change.positive { color: #22c55e; }
.aura-metric .change.negative { color: #ef4444; }

/* ---- comparison_table ---- */
.aura-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.aura-table th,
.aura-table td {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
  text-align: left;
}
.aura-table th { font-weight: 650; opacity: 0.8; }

/* ---- step_bar ---- */
.aura-steps {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
}
.aura-step {
  flex: 1;
  min-width: 110px;
  padding: 8px 10px;
}
.aura-step .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4f8cff;
  margin-bottom: 4px;
}
.aura-step .label { font-weight: 650; }
.aura-step .desc { font-size: 12px; opacity: 0.7; }
.aura-step-arrow {
  align-self: center;
  opacity: 0.4;
  padding: 0 2px;
}

/* ---- insight_cards ---- */
.aura-insight {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.08);
  margin-bottom: 6px;
}
.aura-insight .rating { font-size: 12px; font-weight: 650; opacity: 0.8; }
.aura-insight .body { font-size: 12px; margin-top: 2px; opacity: 0.85; }

/* ---- article_list ---- */
.aura-article {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.aura-article:last-child { border-bottom: none; }
.aura-article .t { font-weight: 600; flex: 1; min-width: 0; }
.aura-article .s { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.aura-article .src { font-size: 11px; opacity: 0.5; white-space: nowrap; }

/* ---- fallback（纯文本 / 未匹配组件） ---- */
.aura-fallback {
  font-size: 12px;
  opacity: 0.6;
  padding: 4px 0;
}
/* ---- turnTail（Turn 尾部的组件展示区，不随工作过程折叠） ---- */
.aura-turn-tail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 6px 0 2px;
}
.aura-turn-tail-item > * + * { margin-top: 4px; }
.aura-turn-tail .aura-fallback { margin-bottom: 2px; }
/* ---- 侧边面板（rightbar tab） ---- */
.aura-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 12px 18px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}
.aura-panel-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.aura-panel-card-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  opacity: 0.75;
}
.aura-panel-card-body > * { margin: 0 !important; }
.aura-panel-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: -2px;
}
.aura-panel-btn {
  font-size: 12px;
  line-height: 18px;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: inherit;
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));
  transition: background 0.15s, border-color 0.15s;
}
.aura-panel-result {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
  word-break: break-all;
}
.aura-panel-btn:disabled { opacity: 0.6; cursor: default; }
.aura-panel-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover-solid, rgba(128, 128, 128, 0.08));
  border-color: var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.4));
}
.aura-panel-error {
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--dsw-alias-state-warn-label, #ad6800);
  background: var(--dsw-alias-bg-l1, rgba(250, 173, 20, 0.08));
  border: 1px solid var(--dsw-alias-border-l2, rgba(250, 173, 20, 0.25));
}
.aura-panel-empty,
.aura-panel-empty-state {
  font-size: 12px;
  opacity: 0.55;
  padding: 4px 0;
}
.aura-panel-empty-state { padding: 16px 12px; line-height: 1.6; }
/* ---- diagram（mermaid 声明式图） ---- */
.aura-diagram {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aura-diagram-title {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.75;
}
.aura-diagram-svg {
  overflow-x: auto;
  border-radius: 6px;
}
.aura-diagram-svg svg {
  max-width: 100%;
  height: auto;
}
.aura-diagram-error {
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));
  background: var(--dsw-alias-bg-l1, rgba(128, 128, 128, 0.04));
}
.aura-diagram-error pre {
  margin: 6px 0 0;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  opacity: 0.8;
}
.aura-diagram-error details { margin-top: 6px; }
.aura-diagram-empty { font-size: 12px; opacity: 0.55; }
/* ---- diagram 精修（覆盖 mermaid 生成的 SVG） ---- */
.aura-diagram-svg svg {
  overflow: visible;
}
.aura-diagram-svg svg .node rect,
.aura-diagram-svg svg .node polygon,
.aura-diagram-svg svg .node circle,
.aura-diagram-svg svg .node ellipse {
  rx: 6px;
  ry: 6px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
}
.aura-diagram-svg svg .nodeLabel {
  font-weight: 500;
}
.aura-diagram-svg svg .edgePath path,
.aura-diagram-svg svg .flowchart-link {
  stroke-width: 1.1px;
}
.aura-diagram-svg svg .actor {
  rx: 6px;
  ry: 6px;
}
.aura-diagram-svg svg .messageLine0,
.aura-diagram-svg svg .messageLine1 {
  stroke-width: 1.1px;
}
.aura-diagram-svg svg .actor-line {
  stroke-dasharray: 3 3;
  opacity: 0.5;
}
.aura-diagram-svg svg .cluster rect {
  rx: 8px;
  ry: 8px;
}
/* ---- graph（React Flow 关系图） ---- */
.aura-graph { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.aura-graph-title { font-size: 12px; font-weight: 600; opacity: 0.75; }
.aura-graph-canvas {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--dsw-alias-bg-base, transparent);
}
.aura-graph-empty { font-size: 12px; opacity: 0.55; }

/* 节点：Play 风 —— 高对比实心块 + 双层文字 + 大圆角 */
.aura-graph-node {
  min-width: 116px;
  max-width: 208px;
  padding: 9px 15px 10px;
  border-radius: 10px;
  text-align: left;
  color: var(--aura-graph-node-fg, #fff);
  background: var(--aura-graph-node-bg, #262626);
  border: 1px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.10), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.aura-graph-node:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.08);
}
/* 小标签：大写 + 字距（Play 风的精致感来源） */
.aura-graph-node-tag {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.68;
  margin-bottom: 3px;
  line-height: 1;
}
/* 主标题：粗体 */
.aura-graph-node-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.005em;
}

/* 语义变体 */
.aura-graph-node--primary {
  background: var(--aura-graph-accent, #4176e6);
  color: #fff;
  box-shadow: 0 3px 10px rgba(65, 118, 230, 0.28), 0 1px 2px rgba(0, 0, 0, 0.08);
}
.aura-graph-node--accent {
  background: var(--aura-graph-accent-soft, rgba(86, 134, 254, 0.12));
  color: var(--aura-graph-node-fg-alt, #1f2329);      /* 浅底配深字 */
  border-color: var(--aura-graph-accent-border, rgba(86, 134, 254, 0.45));
}
.aura-graph-node--muted {
  /* 实底 + 主文字色：保证可读；"次级"由【虚线边框 + 无阴影】表达，而不是靠"淡" */
  background: var(--aura-graph-bg, #fff);
  color: var(--aura-graph-text, #1f2329);
  border: 1px dashed var(--aura-graph-border-strong, rgba(0, 0, 0, 0.22));
  box-shadow: none;
}
.aura-graph-node--muted .aura-graph-node-tag { opacity: 0.6; }
.aura-graph-node--muted .aura-graph-node-label { font-weight: 600; }

/* 手柄（连线锚点）：默认 CSS 已定位，这里只做视觉淡化 */
.aura-graph-handle {
  opacity: 0;
  width: 1px;
  height: 1px;
  border: 0;
  background: transparent;
}

/* 边：用主题 token 覆盖 React Flow 的默认颜色 */
.aura-graph-canvas .react-flow {
  --xy-edge-stroke-default: var(--aura-graph-line, rgba(0, 0, 0, 0.32));
  --xy-edge-stroke-width-default: 1.2;
  --xy-edge-stroke-selected-default: var(--dsw-alias-brand-primary, #1677ff);
  --xy-attribution-background-color-default: transparent;
}
.aura-graph-canvas .react-flow__edge-path {
  stroke: var(--aura-graph-line, rgba(0, 0, 0, 0.3));
  stroke-width: 1.3;
}
.aura-graph-canvas .react-flow__arrowhead {
  fill: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.28));
}
.aura-graph-canvas .react-flow__edge-text {
  font-size: 10px;
  fill: var(--dsw-alias-label-tertiary, #8a8f99);
}
.aura-graph-canvas .react-flow__edge-textbg { fill: var(--dsw-alias-bg-base, #fff); }
.aura-graph-canvas .react-flow__attribution { display: none; }

/* 缩放控件：低调化 */
.aura-graph-canvas .react-flow__controls {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  overflow: hidden;
}
.aura-graph-canvas .react-flow__controls-button {
  width: 20px;
  height: 20px;
  background: var(--dsw-alias-bg-base, #fff);
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  color: var(--dsw-alias-label-secondary, #4a4f57);
}
.aura-graph-canvas .react-flow__controls-button:hover {
  background: var(--dsw-alias-bg-l1, rgba(0, 0, 0, 0.03));
}
.aura-graph-canvas .react-flow__controls-button svg { fill: currentColor; }

/* ---- React Flow 基础样式（内联自 @xyflow/react/dist/style.css） ---- */
/* this gets exported as style.css and can be used for the default theming */
/* these are the necessary styles for React/Svelte Flow, they get used by base.css and style.css */
.react-flow {
  direction: ltr;

  --xy-edge-stroke-default: #b1b1b7;
  --xy-edge-stroke-width-default: 1;
  --xy-edge-stroke-selected-default: #555;

  --xy-connectionline-stroke-default: #b1b1b7;
  --xy-connectionline-stroke-width-default: 1;

  --xy-attribution-background-color-default: rgba(255, 255, 255, 0.5);

  --xy-minimap-background-color-default: #fff;
  --xy-minimap-mask-background-color-default: rgba(240, 240, 240, 0.6);
  --xy-minimap-mask-stroke-color-default: transparent;
  --xy-minimap-mask-stroke-width-default: 1;
  --xy-minimap-node-background-color-default: #e2e2e2;
  --xy-minimap-node-stroke-color-default: transparent;
  --xy-minimap-node-stroke-width-default: 2;

  --xy-background-color-default: transparent;
  --xy-background-pattern-dots-color-default: #91919a;
  --xy-background-pattern-lines-color-default: #eee;
  --xy-background-pattern-cross-color-default: #e2e2e2;
  background-color: var(--xy-background-color, var(--xy-background-color-default));
  --xy-node-color-default: inherit;
  --xy-node-border-default: 1px solid #1a192b;
  --xy-node-background-color-default: #fff;
  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);
  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #1a192b;
  --xy-node-border-radius-default: 3px;

  --xy-handle-background-color-default: #1a192b;
  --xy-handle-border-color-default: #fff;

  --xy-selection-background-color-default: rgba(0, 89, 220, 0.08);
  --xy-selection-border-default: 1px dotted rgba(0, 89, 220, 0.8);

  --xy-controls-button-background-color-default: #fefefe;
  --xy-controls-button-background-color-hover-default: #f4f4f4;
  --xy-controls-button-color-default: inherit;
  --xy-controls-button-color-hover-default: inherit;
  --xy-controls-button-border-color-default: #eee;
  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);

  --xy-edge-label-background-color-default: #ffffff;
  --xy-edge-label-color-default: inherit;
  --xy-resize-background-color-default: #3367d9;
}
.react-flow.dark {
  --xy-edge-stroke-default: #3e3e3e;
  --xy-edge-stroke-width-default: 1;
  --xy-edge-stroke-selected-default: #727272;

  --xy-connectionline-stroke-default: #b1b1b7;
  --xy-connectionline-stroke-width-default: 1;

  --xy-attribution-background-color-default: rgba(150, 150, 150, 0.25);

  --xy-minimap-background-color-default: #141414;
  --xy-minimap-mask-background-color-default: rgba(60, 60, 60, 0.6);
  --xy-minimap-mask-stroke-color-default: transparent;
  --xy-minimap-mask-stroke-width-default: 1;
  --xy-minimap-node-background-color-default: #2b2b2b;
  --xy-minimap-node-stroke-color-default: transparent;
  --xy-minimap-node-stroke-width-default: 2;

  --xy-background-color-default: #141414;
  --xy-background-pattern-dots-color-default: #555;
  --xy-background-pattern-lines-color-default: #333;
  --xy-background-pattern-cross-color-default: #333;
  --xy-node-color-default: #f8f8f8;
  --xy-node-border-default: 1px solid #3c3c3c;
  --xy-node-background-color-default: #1e1e1e;
  --xy-node-group-background-color-default: rgba(240, 240, 240, 0.25);
  --xy-node-boxshadow-hover-default: 0 1px 4px 1px rgba(255, 255, 255, 0.08);
  --xy-node-boxshadow-selected-default: 0 0 0 0.5px #999;

  --xy-handle-background-color-default: #bebebe;
  --xy-handle-border-color-default: #1e1e1e;

  --xy-selection-background-color-default: rgba(200, 200, 220, 0.08);
  --xy-selection-border-default: 1px dotted rgba(200, 200, 220, 0.8);

  --xy-controls-button-background-color-default: #2b2b2b;
  --xy-controls-button-background-color-hover-default: #3e3e3e;
  --xy-controls-button-color-default: #f8f8f8;
  --xy-controls-button-color-hover-default: #fff;
  --xy-controls-button-border-color-default: #5b5b5b;
  --xy-controls-box-shadow-default: 0 0 2px 1px rgba(0, 0, 0, 0.08);

  --xy-edge-label-background-color-default: #141414;
  --xy-edge-label-color-default: #f8f8f8;
}
.react-flow__background {
  background-color: var(--xy-background-color-props, var(--xy-background-color, var(--xy-background-color-default)));
  pointer-events: none;
  z-index: -1;
}
.react-flow__container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.react-flow__pane {
  z-index: 1;
  touch-action: none;
}
.react-flow__pane.draggable {
    cursor: grab;
  }
.react-flow__pane.dragging {
    cursor: grabbing;
  }
.react-flow__pane.selection {
    cursor: pointer;
  }
.react-flow__viewport {
  transform-origin: 0 0;
  z-index: 2;
  pointer-events: none;
}
.react-flow__renderer {
  z-index: 4;
}
.react-flow__selection {
  z-index: 6;
}
.react-flow__nodesselection-rect:focus,
.react-flow__nodesselection-rect:focus-visible {
  outline: none;
}
.react-flow__edge-path {
  stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
  stroke-width: var(--xy-edge-stroke-width, var(--xy-edge-stroke-width-default));
  fill: none;
}
.react-flow__connection-path {
  stroke: var(--xy-connectionline-stroke, var(--xy-connectionline-stroke-default));
  stroke-width: var(--xy-connectionline-stroke-width, var(--xy-connectionline-stroke-width-default));
  fill: none;
}
.react-flow .react-flow__edges {
  position: absolute;
}
.react-flow .react-flow__edges svg {
    overflow: visible;
    position: absolute;
    pointer-events: none;
  }
.react-flow__edge {
  pointer-events: visibleStroke;
}
.react-flow__edge.selectable {
    cursor: pointer;
  }
.react-flow__edge.animated path {
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
  }
.react-flow__edge.animated path.react-flow__edge-interaction {
    stroke-dasharray: none;
    animation: none;
  }
.react-flow__edge.inactive {
    pointer-events: none;
  }
.react-flow__edge.selected,
  .react-flow__edge:focus,
  .react-flow__edge:focus-visible {
    outline: none;
  }
.react-flow__edge.selected .react-flow__edge-path,
  .react-flow__edge.selectable:focus .react-flow__edge-path,
  .react-flow__edge.selectable:focus-visible .react-flow__edge-path {
    stroke: var(--xy-edge-stroke-selected, var(--xy-edge-stroke-selected-default));
  }
.react-flow__edge-textwrapper {
    pointer-events: all;
  }
.react-flow__edge .react-flow__edge-text {
    pointer-events: none;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
  }
/* Arrowhead marker styles - use CSS custom properties as default */
.react-flow__arrowhead polyline {
  stroke: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
}
.react-flow__arrowhead polyline.arrowclosed {
  fill: var(--xy-edge-stroke, var(--xy-edge-stroke-default));
}
.react-flow__connection {
  pointer-events: none;
}
.react-flow__connection .animated {
    stroke-dasharray: 5;
    animation: dashdraw 0.5s linear infinite;
  }
svg.react-flow__connectionline {
  z-index: 1001;
  overflow: visible;
  position: absolute;
}
.react-flow__nodes {
  pointer-events: none;
  transform-origin: 0 0;
}
.react-flow__node {
  position: absolute;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  pointer-events: all;
  transform-origin: 0 0;
  box-sizing: border-box;
  cursor: default;
}
.react-flow__node.selectable {
    cursor: pointer;
  }
.react-flow__node.draggable {
    cursor: grab;
    pointer-events: all;
  }
.react-flow__node.draggable.dragging {
      cursor: grabbing;
    }
.react-flow__nodesselection {
  z-index: 3;
  transform-origin: left top;
  pointer-events: none;
}
.react-flow__nodesselection-rect {
    position: absolute;
    pointer-events: all;
    cursor: grab;
  }
.react-flow__handle {
  position: absolute;
  pointer-events: none;
  min-width: 5px;
  min-height: 5px;
  width: 6px;
  height: 6px;
  background-color: var(--xy-handle-background-color, var(--xy-handle-background-color-default));
  border: 1px solid var(--xy-handle-border-color, var(--xy-handle-border-color-default));
  border-radius: 100%;
}
.react-flow__handle.connectingfrom {
    pointer-events: all;
  }
.react-flow__handle.connectionindicator {
    pointer-events: all;
    cursor: crosshair;
  }
.react-flow__handle-bottom {
    top: auto;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 50%);
  }
.react-flow__handle-top {
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
  }
.react-flow__handle-left {
    top: 50%;
    left: 0;
    transform: translate(-50%, -50%);
  }
.react-flow__handle-right {
    top: 50%;
    right: 0;
    transform: translate(50%, -50%);
  }
.react-flow__edgeupdater {
  cursor: move;
  pointer-events: all;
}
.react-flow__pane.selection .react-flow__panel {
  pointer-events: none;
}
.react-flow__panel {
  position: absolute;
  z-index: 5;
  margin: 15px;
}
.react-flow__panel.top {
    top: 0;
  }
.react-flow__panel.bottom {
    bottom: 0;
  }
.react-flow__panel.top.center, .react-flow__panel.bottom.center {
      left: 50%;
      transform: translateX(-15px) translateX(-50%);
    }
.react-flow__panel.left {
    left: 0;
  }
.react-flow__panel.right {
    right: 0;
  }
.react-flow__panel.left.center, .react-flow__panel.right.center {
      top: 50%;
      transform: translateY(-15px) translateY(-50%);
    }
.react-flow__attribution {
  font-size: 10px;
  background: var(--xy-attribution-background-color, var(--xy-attribution-background-color-default));
  padding: 2px 3px;
  margin: 0;
}
.react-flow__attribution a {
    text-decoration: none;
    color: #999;
  }
@keyframes dashdraw {
  from {
    stroke-dashoffset: 10;
  }
}
.react-flow__edgelabel-renderer {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
  left: 0;
  top: 0;
}
.react-flow__viewport-portal {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.react-flow__minimap {
  background: var(
    --xy-minimap-background-color-props,
    var(--xy-minimap-background-color, var(--xy-minimap-background-color-default))
  );
}
.react-flow__minimap-svg {
    display: block;
  }
.react-flow__minimap-mask {
    fill: var(
      --xy-minimap-mask-background-color-props,
      var(--xy-minimap-mask-background-color, var(--xy-minimap-mask-background-color-default))
    );
    stroke: var(
      --xy-minimap-mask-stroke-color-props,
      var(--xy-minimap-mask-stroke-color, var(--xy-minimap-mask-stroke-color-default))
    );
    stroke-width: var(
      --xy-minimap-mask-stroke-width-props,
      var(--xy-minimap-mask-stroke-width, var(--xy-minimap-mask-stroke-width-default))
    );
  }
.react-flow__minimap-node {
    fill: var(
      --xy-minimap-node-background-color-props,
      var(--xy-minimap-node-background-color, var(--xy-minimap-node-background-color-default))
    );
    stroke: var(
      --xy-minimap-node-stroke-color-props,
      var(--xy-minimap-node-stroke-color, var(--xy-minimap-node-stroke-color-default))
    );
    stroke-width: var(
      --xy-minimap-node-stroke-width-props,
      var(--xy-minimap-node-stroke-width, var(--xy-minimap-node-stroke-width-default))
    );
  }
.react-flow__background-pattern.dots {
    fill: var(
      --xy-background-pattern-color-props,
      var(--xy-background-pattern-color, var(--xy-background-pattern-dots-color-default))
    );
  }
.react-flow__background-pattern.lines {
    stroke: var(
      --xy-background-pattern-color-props,
      var(--xy-background-pattern-color, var(--xy-background-pattern-lines-color-default))
    );
  }
.react-flow__background-pattern.cross {
    stroke: var(
      --xy-background-pattern-color-props,
      var(--xy-background-pattern-color, var(--xy-background-pattern-cross-color-default))
    );
  }
.react-flow__controls {
  display: flex;
  flex-direction: column;
  box-shadow: var(--xy-controls-box-shadow, var(--xy-controls-box-shadow-default));
}
.react-flow__controls.horizontal {
    flex-direction: row;
  }
.react-flow__controls-button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 26px;
    width: 26px;
    padding: 4px;
    border: none;
    background: var(--xy-controls-button-background-color, var(--xy-controls-button-background-color-default));
    border-bottom: 1px solid
      var(
        --xy-controls-button-border-color-props,
        var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default))
      );
    color: var(
      --xy-controls-button-color-props,
      var(--xy-controls-button-color, var(--xy-controls-button-color-default))
    );
    cursor: pointer;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
  }
.react-flow__controls-button svg {
      width: 100%;
      max-width: 12px;
      max-height: 12px;
      fill: currentColor;
    }
.react-flow__edge.updating .react-flow__edge-path {
      stroke: #777;
    }
.react-flow__edge-text {
    font-size: 10px;
  }
.react-flow__node.selectable:focus,
  .react-flow__node.selectable:focus-visible {
    outline: none;
  }
.react-flow__node-input,
.react-flow__node-default,
.react-flow__node-output,
.react-flow__node-group {
  padding: 10px;
  border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
  width: 150px;
  font-size: 12px;
  color: var(--xy-node-color, var(--xy-node-color-default));
  text-align: center;
  border: var(--xy-node-border, var(--xy-node-border-default));
  background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
}
.react-flow__node-input.selectable:hover, .react-flow__node-default.selectable:hover, .react-flow__node-output.selectable:hover, .react-flow__node-group.selectable:hover {
      box-shadow: var(--xy-node-boxshadow-hover, var(--xy-node-boxshadow-hover-default));
    }
.react-flow__node-input.selectable.selected,
    .react-flow__node-input.selectable:focus,
    .react-flow__node-input.selectable:focus-visible,
    .react-flow__node-default.selectable.selected,
    .react-flow__node-default.selectable:focus,
    .react-flow__node-default.selectable:focus-visible,
    .react-flow__node-output.selectable.selected,
    .react-flow__node-output.selectable:focus,
    .react-flow__node-output.selectable:focus-visible,
    .react-flow__node-group.selectable.selected,
    .react-flow__node-group.selectable:focus,
    .react-flow__node-group.selectable:focus-visible {
      box-shadow: var(--xy-node-boxshadow-selected, var(--xy-node-boxshadow-selected-default));
    }
.react-flow__node-group {
  background-color: var(--xy-node-group-background-color, var(--xy-node-group-background-color-default));
}
.react-flow__nodesselection-rect,
.react-flow__selection {
  background: var(--xy-selection-background-color, var(--xy-selection-background-color-default));
  border: var(--xy-selection-border, var(--xy-selection-border-default));
}
.react-flow__nodesselection-rect:focus,
  .react-flow__nodesselection-rect:focus-visible,
  .react-flow__selection:focus,
  .react-flow__selection:focus-visible {
    outline: none;
  }
.react-flow__controls-button:hover {
      background: var(
        --xy-controls-button-background-color-hover-props,
        var(--xy-controls-button-background-color-hover, var(--xy-controls-button-background-color-hover-default))
      );
      color: var(
        --xy-controls-button-color-hover-props,
        var(--xy-controls-button-color-hover, var(--xy-controls-button-color-hover-default))
      );
    }
.react-flow__controls-button:disabled {
      pointer-events: none;
    }
.react-flow__controls-button:disabled svg {
        fill-opacity: 0.4;
      }
.react-flow__controls-button:last-child {
    border-bottom: none;
  }
.react-flow__controls.horizontal .react-flow__controls-button {
    border-bottom: none;
    border-right: 1px solid
      var(
        --xy-controls-button-border-color-props,
        var(--xy-controls-button-border-color, var(--xy-controls-button-border-color-default))
      );
  }
.react-flow__controls.horizontal .react-flow__controls-button:last-child {
    border-right: none;
  }
.react-flow__resize-control {
  position: absolute;
}
.react-flow__resize-control.left,
.react-flow__resize-control.right {
  cursor: ew-resize;
}
.react-flow__resize-control.top,
.react-flow__resize-control.bottom {
  cursor: ns-resize;
}
.react-flow__resize-control.top.left,
.react-flow__resize-control.bottom.right {
  cursor: nwse-resize;
}
.react-flow__resize-control.bottom.left,
.react-flow__resize-control.top.right {
  cursor: nesw-resize;
}
/* handle styles */
.react-flow__resize-control.handle {
  width: 5px;
  height: 5px;
  border: 1px solid #fff;
  border-radius: 1px;
  background-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
  translate: -50% -50%;
}
.react-flow__resize-control.handle.left {
  left: 0;
  top: 50%;
}
.react-flow__resize-control.handle.right {
  left: 100%;
  top: 50%;
}
.react-flow__resize-control.handle.top {
  left: 50%;
  top: 0;
}
.react-flow__resize-control.handle.bottom {
  left: 50%;
  top: 100%;
}
.react-flow__resize-control.handle.top.left {
  left: 0;
}
.react-flow__resize-control.handle.bottom.left {
  left: 0;
}
.react-flow__resize-control.handle.top.right {
  left: 100%;
}
.react-flow__resize-control.handle.bottom.right {
  left: 100%;
}
/* line styles */
.react-flow__resize-control.line {
  border-color: var(--xy-resize-background-color, var(--xy-resize-background-color-default));
  border-width: 0;
  border-style: solid;
}
.react-flow__resize-control.line.left,
.react-flow__resize-control.line.right {
  width: 1px;
  transform: translate(-50%, 0);
  top: 0;
  height: 100%;
}
.react-flow__resize-control.line.left {
  left: 0;
  border-left-width: 1px;
}
.react-flow__resize-control.line.right {
  left: 100%;
  border-right-width: 1px;
}
.react-flow__resize-control.line.top,
.react-flow__resize-control.line.bottom {
  height: 1px;
  transform: translate(0, -50%);
  left: 0;
  width: 100%;
}
.react-flow__resize-control.line.top {
  top: 0;
  border-top-width: 1px;
}
.react-flow__resize-control.line.bottom {
  border-bottom-width: 1px;
  top: 100%;
}
.react-flow__edge-textbg {
  fill: var(--xy-edge-label-background-color, var(--xy-edge-label-background-color-default));
}
.react-flow__edge-text {
  fill: var(--xy-edge-label-color, var(--xy-edge-label-color-default));
}

`;
export default auraCss;
