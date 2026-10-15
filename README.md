# dsh-aura

**让 AI 的对话不再只有文字——用图表、表格、卡片把信息"画"出来。**

`dsh-aura` 是一个 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 插件：当 agent（AI 助手）需要展示结构化信息时，它会把内容渲染成漂亮的视觉组件，直接嵌入对话流。

```
💬 用户: 用图表展示上证指数近7日走势
🤖 agent: [调用 aura_render]
📊 对话流中出现：折线趋势图 + 指标卡片（antd/ECharts 渲染）
```

## 为什么用

- **Agent 结果更直观**：数字对比、趋势走势、流程步骤、层级结构——从"文字描述"变成"一眼看懂"的组件
- **Agent 自动触发**：不需要用户指定组件，agent 依据内容自动选择最合适的呈现方式
- **随对话常驻**：组件渲染在每个 Turn 的尾部（DSH 的 turn-tail 位置），**不随工具调用折叠**，刷新页面不消失、历史可回看
- **多入口兼容**：飞书/DSH GUI 同一会话——飞书看文字摘要，GUI 看完整视觉组件

## 支持的组件（8 种）

| 场景 | 组件 | 视觉 |
|---|---|---|
| 关键指标（涨跌/数值） | metric_card | 指标卡片 |
| 多维度对比 | comparison_table | 数据表格 |
| 流程/步骤/阶段 | step_bar | 步骤条 |
| 多维判断/风险 | insight_cards | 洞察卡片 |
| 信息/新闻列表 | article_list | 条目列表 |
| 走势/趋势/时序 | trend_chart | 折线/柱状/面积图 |
| 层级/思维导图 | data_tree | 树状图 |
| 事件时间线 | timeline | 时间线（垂直/水平） |

## 快速开始

### 版本要求

| 依赖 | 要求 |
|---|---|
| DeepSeek Harness (DSH) | `>=0.1.2-rc.1 <0.3.0`（**实测兼容 0.1.2 ~ 0.2.0-rc.2**） |
| Node.js | ≥ 22（dsh 要求） |

> **DSH 0.2.0 起的行为变化**：工具调用会归入 Turn 的「工作过程」（process disclosure），
> 完成后自动折叠。Aura 组件渲染在 **Turn 尾部**（`conversation.chat.turnTail`，属
> `TURN_PROCESS_INDEPENDENT_KINDS` 白名单），**不随过程折叠**、常驻可见。

> 本插件的 `@deepseek-ai/*` 全部声明为 **peerDependencies**（宿主提供）。经
> `dsh plugin add` 装入 profile 后，运行时从 **DSH 宿主共享层**解析这些依赖——
> 与宿主 dsh 版本天然一致，无本地副本混淆。请勿把 `node_modules/` 提交进发布物
> （`files` 白名单已排除）。

### 安装

```bash
# 本地开发 / 从源码
dsh plugin --profile web add /path/to/dsh-aura

# 从 GitHub（发布后）
dsh plugin --profile web add github:clawdwan/dsh-aura
```

重启 dsh web 后生效。安装前可运行自检确认与宿主兼容：

```bash
node check-tool.mjs   # 报告 dsh-tools 解析源/版本 + schema 编译 + execute 冒烟
```

### 使用

安装后 agent 自动获得 `aura_render` 工具。**无需配置**——在对话里自然表达即可：

- "用表格对比这几家公司"
- "展示下这周的走势"
- "把这个流程画成步骤图"

agent 会判断内容是否需要视觉化，并选择合适的组件。


## 侧边面板（0.2.0+）

除对话流内嵌组件外，agent 还可把卡片推送到**会话右侧面板**（常驻、可反复更新）：

| 工具 | 用途 | 场景 |
|---|---|---|
| `aura_render` | 对话流内嵌 | 叙事型：一次性的结果解释 |
| `aura_panel` | 右侧面板 | 状态型：行情监控、任务看板、持续指标 |

**面板卡片可带按钮**（`actions`）——点击后指令回到当前会话，agent 处理后更新面板，形成交互闭环。

## 技术概览（面向开发者）

`dsh-aura` 是一个标准 DSH 静态插件包，包含两部分：

- **工具端**（host）：`aura_render` 工具，接收 `{ text, components[] }` 结构化数据
- **渲染端**（browser）：读取工具结果，把组件数据渲染成 React 组件（antd v6 + ECharts）

构建产物（`client/dist/`）随仓库提供，安装即可用，无需本地构建。

### 组件 data 契约

每个组件接收 `{ title, data }`，data 结构见下表：

| 组件 | data 结构 |
|---|---|
| metric_card | `{ metrics: [{label, value, change?, size?}] }` |
| comparison_table | `{ headers: string[], rows: string[][] }` |
| step_bar | `{ steps: [{label, description?, badge?}] }` |
| insight_cards | `{ cards: [{title, rating, body, level?}] }` |
| article_list | `{ articles: [{title, summary?, url?, source?}] }` |
| trend_chart | `{ chart_type: 'line'\|'bar'\|'area', series: [{name, data:[{x,y}]}], unit? }` |
| data_tree | `{ root: {label, value?, children} }` |
| timeline | `{ events: [{time, title, description?, color?}], orientation? }` |

## 开发

```bash
npm install          # 安装依赖
npm run bundle       # 构建 client 半（tsdown → client/dist/client.js）
node check-tool.mjs  # 安装前自检（避免启动崩溃）
npm run watch        # 开发热重建
```

## 变更记录

各版本的重要变更见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可

Apache-2.0
