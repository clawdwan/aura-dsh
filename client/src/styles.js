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

/* ---- metric_card（自渲染：数字格式由 kind 决定） ---- */
.aura-metric-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.aura-metric-item {
  flex: 1 1 110px;
  min-width: 100px;
}
.aura-metric-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  line-height: 1.2;
  margin-bottom: 2px;
  white-space: nowrap;
}
.aura-metric-value {
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.15;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.aura-metric-change {
  font-size: 13px;
  font-weight: 600;
}

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
/* ---- insight_cards：Play 风（左侧强调色条 + 极淡底，不再用 Alert 的满色块） ---- */
.aura-insight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.aura-insight-item {
  position: relative;
  padding: 10px 12px 11px 14px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.055);
  border-left: 3px solid var(--aura-insight-accent, var(--dsw-static-deepseek-500, #4176e6));
}
.aura-insight-item--info {
  --aura-insight-accent: var(--dsw-static-deepseek-500, #4176e6);
}
.aura-insight-item--warning {
  --aura-insight-accent: #d4820a;
}
.aura-insight-item--positive {
  --aura-insight-accent: #1f9d55;
}
.aura-insight-item--negative {
  --aura-insight-accent: #cf3b3b;
}
.aura-insight-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.aura-insight-title {
  font-size: 15.5px;
  font-weight: 620;
  line-height: 1.45;
}
.aura-insight-rating {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-weight: 700;
  opacity: 0.7;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(128, 128, 128, 0.13);
  white-space: nowrap;
}
.aura-insight-body {
  font-size: 14.5px;
  line-height: 1.72;
  margin-top: 5px;
  opacity: 0.94;
}

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
  /* 圈选层（.aura-select-layer，position:absolute; inset:0）依赖此定位祖先 */
  position: relative;
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
  position: relative;
  font-size: 12px;
  opacity: 0.55;
  padding: 4px 0;
}
.aura-panel-empty-state {
  position: relative; padding: 16px 12px; line-height: 1.6; }
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

/* ---- Play 风：antd 组件的统一样式覆盖 ---- */
/* 卡片：去边框 + 轻阴影（Play 风靠层次而不是描边） */
.aura-panel .ant-card,
.aura-turn-tail .ant-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}
/* 卡片标题：小号大写 + 字距（与 Graph 的 tag 一致） */
.aura-panel .ant-card-head,
.aura-turn-tail .ant-card-head {
  min-height: auto;
  padding: 0 14px;
  border-bottom: none;
}
.aura-panel .ant-card-head-title,
.aura-turn-tail .ant-card-head-title {
  padding: 12px 0 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  opacity: 0.55;
}
.aura-panel .ant-card-small > .ant-card-body,
.aura-turn-tail .ant-card-small > .ant-card-body {
  padding: 8px 14px 12px;
}
/* 指标：数值粗体、标签小号大写 */
.aura-panel .ant-statistic-title,
.aura-turn-tail .ant-statistic-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 2px;
}
.aura-panel .ant-statistic-content,
.aura-turn-tail .ant-statistic-content {
  font-weight: 600;
  letter-spacing: -0.01em;
}
/* 表格：无外框、表头小号大写、行分割线极淡 */
.aura-panel .ant-table,
.aura-turn-tail .ant-table {
  background: transparent;
}
.aura-panel .ant-table-thead > tr > th,
.aura-turn-tail .ant-table-thead > tr > th {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
  padding-top: 4px !important;
  padding-bottom: 6px !important;
}
.aura-panel .ant-table-tbody > tr > td,
.aura-turn-tail .ant-table-tbody > tr > td {
  border-bottom-color: rgba(128, 128, 128, 0.12);
}
/* 标签（Tag）：描边胶囊化 */
.aura-panel .ant-tag,
.aura-turn-tail .ant-tag {
  border-radius: 999px;
  padding-inline: 8px;
}
/* Play 风补充（原 theme token 改为 CSS，避免 token 名不合法导致渲染异常） */
.aura-panel .ant-table-tbody > tr > td,
.aura-turn-tail .ant-table-tbody > tr > td {
  padding-top: 9px;
  padding-bottom: 9px;
}
.aura-panel .ant-list-item,
.aura-turn-tail .ant-list-item {
  padding: 8px 0;
}
.aura-panel .ant-steps .ant-steps-item-icon,
.aura-turn-tail .ant-steps .ant-steps-item-icon {
  width: 22px;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
}
.aura-panel .ant-timeline .ant-timeline-item,
.aura-turn-tail .ant-timeline .ant-timeline-item {
  padding-bottom: 14px;
}
/* ---- 骨架屏（卡片待填充态） ---- */
.aura-skeleton {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 2px 0 4px;
}
.aura-skeleton-line {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    rgba(128, 128, 128, 0.1) 25%,
    rgba(128, 128, 128, 0.2) 37%,
    rgba(128, 128, 128, 0.1) 63%
  );
  background-size: 400% 100%;
  animation: aura-shimmer 1.4s ease infinite;
}
@keyframes aura-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .aura-skeleton-line { animation: none; }
}
/* ---- 出场动画（默认开；时长由 renderComponent 按组件类型注入 --aura-anim-dur） ---- */
@keyframes aura-fade-up {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: none; }
}
.aura-anim-in {
  animation: aura-fade-up var(--aura-anim-dur, 0.5s) cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: opacity, transform;
}
/* 列表/表格/卡片组：子项错峰浮现 */
@keyframes aura-item-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: none; }
}
.aura-anim-in .ant-table-tbody > tr,
.aura-anim-in .ant-list-item,
.aura-anim-in .ant-timeline-item,
.aura-anim-in .ant-alert {
  animation: aura-item-in calc(var(--aura-anim-dur, 0.5s) * 0.85) cubic-bezier(0.22, 1, 0.36, 1) both;
}
.aura-anim-in .ant-table-tbody > tr:nth-child(1), .aura-anim-in .ant-list-item:nth-child(1),
.aura-anim-in .ant-timeline-item:nth-child(1), .aura-anim-in .ant-alert:nth-child(1) { animation-delay: 0.06s; }
.aura-anim-in .ant-table-tbody > tr:nth-child(2), .aura-anim-in .ant-list-item:nth-child(2),
.aura-anim-in .ant-timeline-item:nth-child(2), .aura-anim-in .ant-alert:nth-child(2) { animation-delay: 0.16s; }
.aura-anim-in .ant-table-tbody > tr:nth-child(3), .aura-anim-in .ant-list-item:nth-child(3),
.aura-anim-in .ant-timeline-item:nth-child(3), .aura-anim-in .ant-alert:nth-child(3) { animation-delay: 0.26s; }
.aura-anim-in .ant-table-tbody > tr:nth-child(4), .aura-anim-in .ant-list-item:nth-child(4),
.aura-anim-in .ant-timeline-item:nth-child(4), .aura-anim-in .ant-alert:nth-child(4) { animation-delay: 0.36s; }
.aura-anim-in .ant-table-tbody > tr:nth-child(n+5), .aura-anim-in .ant-list-item:nth-child(n+5),
.aura-anim-in .ant-timeline-item:nth-child(n+5), .aura-anim-in .ant-alert:nth-child(n+5) { animation-delay: 0.44s; }
@media (prefers-reduced-motion: reduce) {
  .aura-anim-in, .aura-anim-in .ant-table-tbody > tr, .aura-anim-in .ant-list-item,
  .aura-anim-in .ant-timeline-item, .aura-anim-in .ant-alert {
    animation: none !important;
  }
}
/* ---- 图表「笔刷画出」动画（clip-path 从左到右揭露） ---- */
.aura-chart-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 6px;
}
.aura-chart-draw {
  animation: aura-draw-x 1.5s cubic-bezier(0.33, 0, 0.2, 1) both;
  will-change: clip-path;
}
@keyframes aura-draw-x {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
@media (prefers-reduced-motion: reduce) {
  .aura-chart-draw { animation: none; }
}
/* ---- graph：节点逐个落下 + 连线生长（Play 风的「画出来」） ---- */
@keyframes aura-node-drop {
  0% { opacity: 0; transform: translateY(-9px) scale(0.94); }
  60% { opacity: 1; }
  100% { opacity: 1; transform: none; }
}
/* 动画加在内层节点 div 上：外层由 React Flow 用 transform 定位，内层动画不会冲突 */
.aura-graph-canvas .aura-graph-node {
  animation: aura-node-drop 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
/* 连线：stroke-dashoffset 从"未画出"到"画出"，像笔刷生长 */
@keyframes aura-edge-grow {
  from { stroke-dashoffset: 2400; }
  to { stroke-dashoffset: 0; }
}
.aura-graph-canvas .react-flow__edge-path {
  stroke-dasharray: 2400;
  animation: aura-edge-grow 0.75s cubic-bezier(0.33, 0, 0.2, 1) both;
  animation-delay: 0.9s;   /* 等节点基本落完，线再依次生长 */
}
.aura-graph-canvas .react-flow__edge-text,
.aura-graph-canvas .react-flow__edge-textbg {
  animation: aura-fade-up 0.4s ease-out both;
  animation-delay: 1.35s;
}

/* ---- step_bar：步骤依次点亮 ---- */
@keyframes aura-step-in {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: none; }
}
.aura-anim-in .ant-steps-item {
  animation: aura-step-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.aura-anim-in .ant-steps-item:nth-child(1) { animation-delay: 0.05s; }
.aura-anim-in .ant-steps-item:nth-child(2) { animation-delay: 0.2s; }
.aura-anim-in .ant-steps-item:nth-child(3) { animation-delay: 0.35s; }
.aura-anim-in .ant-steps-item:nth-child(4) { animation-delay: 0.5s; }
.aura-anim-in .ant-steps-item:nth-child(n+5) { animation-delay: 0.62s; }

@media (prefers-reduced-motion: reduce) {
  .aura-graph-canvas .aura-graph-node,
  .aura-graph-canvas .react-flow__edge-path,
  .aura-anim-in .ant-steps-item { animation: none !important; }
}
/* ---- 面板工具栏（圈选提问入口） ---- */
.aura-panel-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.08);
  margin-bottom: 2px;
}
.aura-panel-tool {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
  background: transparent;
  color: inherit;
  transition: border-color 0.15s, color 0.15s;
}
.aura-panel-tool:hover { border-color: var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.4)); }
.aura-panel-tool--active {
  border-color: var(--dsw-static-deepseek-500, #4176e6);
  color: var(--dsw-static-deepseek-500, #4176e6);
}
.aura-panel-tool-hint { font-size: 11px; opacity: 0.6; }

/* ---- 圈选层 ---- */
.aura-select-layer {
  position: absolute;
  inset: 0;
  z-index: 30;
  cursor: crosshair;
  background: rgba(0, 0, 0, 0.02);
  user-select: none;
}
.aura-select-layer--done { cursor: default; }
.aura-select-box {
  position: absolute;
  border: 1.5px dashed var(--dsw-static-deepseek-500, #4176e6);
  background: rgba(86, 134, 254, 0.1);
  border-radius: 4px;
  pointer-events: none;
}
.aura-select-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  pointer-events: none;
  white-space: nowrap;
}

/* ---- 圈选浮层（就地提问） ---- */
.aura-select-popover {
  position: absolute;
  z-index: 40;
  width: min(300px, 92%);
  padding: 10px;
  border-radius: 10px;
  background: var(--dsw-alias-bg-base, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}
.aura-select-popover-title { font-size: 11px; font-weight: 600; margin-bottom: 6px; opacity: 0.75; }
.aura-select-input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.25));
  background: transparent;
  color: inherit;
  resize: vertical;
}
.aura-select-actions { display: flex; gap: 6px; margin-top: 8px; }
.aura-select-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.25));
  background: transparent;
  color: inherit;
}
.aura-select-btn--primary {
  background: var(--dsw-static-deepseek-500, #4176e6);
  border-color: transparent;
  color: #fff;
}
.aura-select-btn:disabled { opacity: 0.6; cursor: default; }
.aura-select-error {
  margin-top: 6px;
  font-size: 11px;
  color: #cf1322;
  background: rgba(207, 19, 34, 0.06);
  border: 1px solid rgba(207, 19, 34, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
  word-break: break-all;
}
/* ---- HTML 富文档卡片（沙箱 iframe） ---- */
.aura-html-card {
  width: 100%;
  border: 1px solid rgba(128, 128, 128, 0.12);
  border-radius: 10px;
  background: transparent;
  display: block;
  overflow: hidden;
}
.aura-html-empty {
  padding: 16px;
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
  border: 1px dashed rgba(128, 128, 128, 0.25);
  border-radius: 10px;
}
/* ---- 面板加载中（会话历史异步加载的兜底） ---- */
.aura-panel-loading-state {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px;
}
.aura-panel-loading-text {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 4px;
}
.aura-panel-diag {
  margin-top: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
  font-size: 11px;
  opacity: 0.75;
  line-height: 1.6;
}
/* ---- 径向菜单（圈选后的饼状提问） ---- */
.aura-radial {
  position: absolute;
  z-index: 45;
  animation: aura-radial-in 0.15s ease-out both;
  touch-action: none;
}
@keyframes aura-radial-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.aura-radial svg { display: block; overflow: visible; }
.aura-radial-sector {
  fill: var(--aura-surface, rgba(128,128,128,0.08));
  stroke: var(--aura-border, rgba(128,128,128,0.18));
  stroke-width: 1;
  transition: fill 0.12s ease, stroke 0.12s ease;
  cursor: pointer;
}
.aura-radial-sector.is-active {
  fill: var(--aura-accent-soft, #e4edfd);
  stroke: var(--aura-accent, #4176e6);
  stroke-width: 1.5;
}
.aura-radial-label {
  font-size: 11.5px;
  fill: var(--aura-text, #1f2329);
  pointer-events: none;
  transition: fill 0.12s ease, font-weight 0.12s ease;
}
.aura-radial-label.is-active {
  fill: var(--aura-accent-strong, #4868b2);
  font-weight: 700;
}
.aura-radial-center {
  fill: var(--aura-surface-2, rgba(128,128,128,0.12));
  stroke: var(--aura-border, rgba(128,128,128,0.18));
  stroke-width: 1;
  transition: fill 0.12s ease, stroke 0.12s ease;
  cursor: pointer;
}
.aura-radial-center.is-active {
  fill: var(--aura-accent-soft, #e4edfd);
  stroke: var(--aura-accent, #4176e6);
  stroke-width: 1.5;
}
.aura-radial-center-label {
  font-size: 10.5px;
  fill: var(--aura-text-2, #646a73);
  pointer-events: none;
  transition: fill 0.12s ease;
}
.aura-radial-center-label.is-active {
  fill: var(--aura-accent-strong, #4868b2);
  font-weight: 700;
}
`;
export default auraCss;
