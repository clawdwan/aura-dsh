# Changelog

本项目所有重要变更记录于此。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.4.0] — 2026-10-19

### 新增

- **html 卡片类型**：agent 可直接生成 HTML（`type: "html"`, `data: { html, height? }`），
  在**沙箱 iframe** 中渲染（`sandbox="allow-scripts"`，不含 `allow-same-origin`，与宿主页面隔离）。
  适合调研报告、长文档、富排版、自由布局等「结构化组件表达不了」的场景。
  · 主题跟随：从宿主读取 DSH CSS 变量注入 iframe（报告里用 `var(--aura-*)` 即可跟随明暗主题）
  · 高度自适应：iframe 内 `ResizeObserver` → `postMessage` 回报内容高度
- **圈选提问（MVP-1）**：面板顶部「🔍 圈选提问」→ 拖拽圈选卡片 → 就地浮层输入问题
  → 自动拼接上下文（命中卡片 + 圈选范围 + 完整卡片数据 + 来源追溯 + 回答要求）→ 发到当前会话。
  回答在对话流，agent 可自行决定是否用 `aura_panel` 更新面板（双轨：解释进对话流、数据留面板）。

### 改进

- **insight_cards 视觉重做**：不再用 antd `Alert` 的满色块（蓝底蓝框、报表感），改为 Play 风
  —— 左侧 3px 语义色条（info 蓝 / warning 橙 / positive 绿 / negative 红）+ 极淡底 +
  深色标题 + 小号大写胶囊标签；标题 15.5px、正文 14.5px/opacity 0.94/行高 1.72。

### 修复

- **面板同 id 更新不刷新**：`useChat` 的 eq 只比较卡片 id，导致对同一 id 的 upsert
  （更新 data、骨架屏填数据）被判为"无变化"而不重渲染，必须手动刷新页面。改为全量内容比较。
- **首次打开会话右侧无面板 tab**：`ensurePanelOpen` 此前只在插件启动后执行一次，切换/新建会话
  不会重跑。改为在「插件启动」与「切换到另一个会话」两个时机幂等补开（不再轮询，避免用户主动
  收起后又被强制弹出）。
- **切会话时面板数据不刷新**：`AuraPanel` 增加 `key={sessionId}`，会话切换时强制重挂载重新订阅。
- **圈选上下文缺卡片数据**：命中卡片时只能拿到 DOM 上的 id/title，上下文里 `type`/`data` 为
  undefined；改为用 id 从完整卡片列表回填。
- **面板空态误报**：会话历史异步加载的窗口期内显示"正在读取面板…"骨架，而不是"暂无卡片"。

## [0.3.0] — 2026-10-16

### 新增

- **graph 组件**（React Flow + @dagrejs/dagre）：节点 + 边的现代关系图。
  Play 风视觉——实心块 + 双层文字（大写小标签 + 粗体标题）+ 大圆角 + 点阵背景 + 贝塞尔曲线；
  四种节点变体（`default` / `primary`(品牌蓝实心) / `accent`(淡蓝底) / `muted`(虚线次级)）。
- **骨架屏**：`aura_panel` 的卡片支持 `pending: true`（或省略 `data`）→ 面板渲染骨架占位
  （灰条 + shimmer 流光）。适合多卡片任务「先声明结构、再逐个填数据」，让等待过程可见。
- **出场动画**（默认开启，尊重 `prefers-reduced-motion`）：
  · graph：节点逐个落下（错峰 0.13s/个）+ 连线 `stroke-dashoffset` 生长
  · trend_chart：`clip-path` 遮罩笔刷效果（线 + 点 + 坐标区一起从左到右画出）
  · metric_card：数字从 0 滚到目标值（easeOutCubic，精度跟随原值小数位）
  · comparison_table / article_list / timeline / insight_cards / step_bar：子项错峰淡入
- **视觉统一**：所有 antd 组件经 `ConfigProvider` 统一主题（Play 风）——圆角、轻阴影、
  卡片去边框、标题小号大写 + 字距、标签胶囊化、表头大写等。

### 变更 / 修复

- **移除 mermaid 依赖**（bundle 16.2MB → 1.4MB）：撤掉 `diagram` 组件；声明式图
  （时序图/ER 图等）留待后续按需以专门组件覆盖。`dagre` → `@dagrejs/dagre`（去掉 lodash）。
- **组件白名单改为从注册表派生**（`COMPONENT_TYPES = REGISTRY.map(r => r.type)`），
  根治「新增组件却因白名单未同步而被降级为表格」的问题。
- **面板卡片级错误边界**：单个组件渲染失败只影响该卡片，不再让整个面板空白。
- **修复面板自动打开**：去掉 `sessionStorage` 的「只开一次」记忆（会导致刷新/后续会话看不到面板），
  改为检查 tab 当前状态后幂等补开。
- **Graph 画布自适应**：`ResizeObserver` → `fitView`，拖动侧边栏宽度时图形跟随缩放。

## [0.2.0] — 2026-10-15

### 新增

- **侧边交互面板**：新增 `aura_panel` 工具，agent 可把卡片推送到会话**右侧面板**（常驻展示、可反复更新），
  与对话流内嵌的 `aura_render` 分工——前者是状态型（监控/看板），后者是叙事型（一次性解释）。
- **面板卡片按钮（actions）**：点击后经 `ctx.remote.session.prompt` 把指令发回**当前会话**，
  形成「按钮 → session 消息 → agent 处理 → 面板更新」的交互闭环。
- 面板数据基于**会话事件重放**（读会话节点还原卡片状态）：会话切换天然隔离、刷新/重开自动恢复。

### 变更

- 客户端 `inject` 增加 `sidebarRightTabs` / `sidebarRight` / `remote` / `remote.session` / `conversation` / `sessions`。
- 面板以右侧栏 tab 形式注册（`sidebarRightTabs.register` + `sidebar.right.pane.tab`，key 用 definition 的 `id`）。

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
