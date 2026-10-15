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
.aura-panel-empty,
.aura-panel-empty-state {
  font-size: 12px;
  opacity: 0.55;
  padding: 4px 0;
}
.aura-panel-empty-state { padding: 16px 12px; line-height: 1.6; }
`;
export default auraCss;
