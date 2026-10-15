# Changelog

本项目所有重要变更记录于此。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.3] — 2026-10-15

### 修复

- **DSH 0.2.0 下组件卡片被折叠隐藏**：0.2.0 起工具调用归入 Turn 的「工作过程」
  （process disclosure），完成后折叠，导致此前挂载在工具行内的卡片不可见。
  组件改渲染到 **Turn 尾部**（`conversation.chat.turnTail`）——该节点在
  `TURN_PROCESS_INDEPENDENT_KINDS` 白名单内，**不随过程折叠**。

### 新增

- `client/src/auraDefinition.js`：会话事件定义（`ConversationNodeDefinition` 契约：
  `match` / `start` / `update` / `buildLocationData`），把 Turn 内的 `aura_render`
  调用聚合为该 Turn 的数据（`key: 'aura'`）。
- `client/src/AuraTurnTail.jsx`：turn-tail 渲染器，渲染本 Turn 产出的全部组件。
- README 补充 DSH 0.2 兼容说明与渲染位置说明。

### 变更

- `client/src/index.jsx`：`inject` 增加 `uiConversation`；注册事件定义与 turnTail slot。
- `client/src/AuraToolRow.jsx`：导出 `renderComponent` 供 turnTail 复用
  （`tool.call.toolview` 保留——工具行内仍可展开查看调用参数与结果）。

## [0.1.2] — 2026-10-12

### 变更

- `@deepseek-ai/dsh-tools` peer 依赖收敛为 `>=0.1.2-rc.1 <0.3.0-0`（覆盖 DSH 0.1.2 ~ 0.2.x）。

## [0.1.1] — 2026-10-12

### 变更

- 放宽 `@deepseek-ai/dsh-tools` peer 范围以兼容 DSH 0.2。

## [0.1.0] — 2026-09-02

首个公开发布（`clawdwan/aura-dsh`）。

### 新增

- `aura_render` 工具 + `tool.call.toolview` 渲染器。
- 8 种展示组件（antd v6 + ECharts 实现）：`metric_card` / `comparison_table` /
  `step_bar` / `insight_cards` / `article_list` / `trend_chart` / `data_tree` / `timeline`。
- 静态 cordis 插件包（host 半 + browser 半同包）。

## [0.1.0] 之前（开发历史，未单独发版）

- 项目自 OpenClaw 迁移到 DSH 平台，定位为「通用展示层插件」（不含内容规划）。
- 组件实现由手写 SVG 换为 **antd v6 + ECharts**（8 组件全库化）；
  构建要点：子路径导入（`antd/es/*`）、`alwaysBundle` 覆盖依赖树、
  `define` 替换 `process.env.NODE_ENV`。
- 本仓库自 0.1.0 起独立；更早的开发历史保留在作者本地工作区。
