# dsh-aura

**让 AI 的回答不再只有文字——用图表、表格、看板把信息"画"出来。**

`dsh-aura` 是 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 的展示层插件。它给 agent 提供**两个展示空间**，按内容性质分工：

| 空间 | 工具 | 特性 | 适合 |
|---|---|---|---|
| **对话流**（内嵌） | `aura_render` | 紧随消息、随对话滚动 | 一次性解释、讨论中的示意、回答里配一张图 |
| **会话右侧面板** | `aura_panel` | 常驻、可反复更新、可带按钮 | 行情监控、任务看板、持续指标、调研报告 |

```
💬 用户: 分析一下这几家公司，并把关键指标放到面板上
🤖 agent: [aura_panel 推指标卡] + [回复里 aura_render 一张对比表]
📊 右侧面板常驻指标卡（可随新数据刷新）｜对话流里是一次性对比表
```

## 为什么用

- **两个空间分工**：叙事型结论进对话流，状态型数据进面板——讨论过程与结果沉淀互不干扰
- **Agent 自动触发**：不需要用户指定组件，agent 依据内容选择最合适的呈现方式
- **对话流常驻**：组件渲染在 Turn 尾部（`conversation.chat.turnTail`），**不随工具调用折叠**，刷新可回看
- **面板可交互**：卡片可带按钮，点击把指令发回会话，形成「操作 → 处理 → 更新」闭环
- **统一视觉**：Play 风格（实心块、双层文字、语义色条）；HTML 富文档也走同一套 Token，跟随明暗主题
- **多入口兼容**：飞书/DSH GUI 同一会话——飞书看文字摘要，GUI 看完整视觉组件

## 支持的组件（10 种）

| 场景 | 组件 | 视觉 |
|---|---|---|
| 关键指标（涨跌/数值） | `metric_card` | 指标卡片（金额类数字滚动 + 千分位） |
| 多维度对比 | `comparison_table` | 数据表格 |
| 流程/步骤/阶段 | `step_bar` | 步骤条 |
| 多维判断/风险 | `insight_cards` | 洞察卡片（左侧语义色条） |
| 信息/新闻列表 | `article_list` | 条目列表 |
| 走势/趋势/时序 | `trend_chart` | 折线/柱状/面积图（ECharts） |
| 层级/思维导图 | `data_tree` | 树状图 |
| 事件时间线 | `timeline` | 时间线（垂直/水平） |
| 关系/依赖/架构 | `graph` | 节点 + 连线（React Flow，可缩放拖拽） |
| 调研报告/长文档/富排版 | `html` | 沙箱 iframe 渲染任意 HTML（预设类 + Token，跟随主题、高度自适应） |

## 快速开始

### 版本要求

| 依赖 | 要求 |
|---|---|
| DeepSeek Harness (DSH) | `>=0.1.2-rc.1 <0.3.0`（实测兼容 0.1.2 ~ 0.2.0-rc.2） |
| Node.js | ≥ 22（dsh 要求） |

> **DSH 0.2.0 起**：工具调用会归入 Turn 的「工作过程」并在完成后折叠。Aura 组件渲染在
> **Turn 尾部**（属 `TURN_PROCESS_INDEPENDENT_KINDS` 白名单），不随过程折叠、常驻可见。

> 所有 `@deepseek-ai/*` 均为 **peerDependencies**（宿主提供）。经 `dsh plugin add` 装入
> profile 后从宿主共享层解析，与宿主版本天然一致；`node_modules/` 不进发布物。

### 安装

```bash
# 本地开发 / 从源码
dsh plugin --profile web add /path/to/aura-dsh

# 从 GitHub（钉版本更稳）
dsh plugin --profile web add github:clawdwan/aura-dsh#v0.8.4
```

重启 dsh web 后生效。安装前可运行自检确认与宿主兼容：

```bash
node check-tool.mjs   # dsh-tools 解析源/版本 + schema 编译 + execute 冒烟
```

### 使用

安装后 agent 自动获得两个工具，**无需配置**，自然表达即可：

- 「用表格对比这几家公司」→ 对话流里出现对比表
- 「把这周的走势画出来」→ 折线图
- 「盯着这几个指标，放面板上随时更新」→ 右侧面板常驻卡片
- 「整理一份调研报告」→ 面板里的 HTML 富文档 / 多个组件卡

## 对话流组件（`aura_render`）

```json
{
  "text": "一句话总结（2-3 句，不复述组件数据）",
  "components": [
    { "type": "trend_chart", "title": "近 7 日走势", "data": { "chart_type": "line", "series": [] } }
  ]
}
```

- 单次最多 3 个组件（超出截断）
- 组件渲染在 Turn 尾部，**不随工作过程折叠**

## 侧边面板（`aura_panel`，0.2.0+）

把卡片推送到**会话右侧面板**（常驻、可反复更新）：

```json
{ "action": "upsert", "card": { "id": "market", "type": "metric_card", "title": "行情", "data": {} } }
```

| action | 说明 |
|---|---|
| `upsert` | 新增或覆盖同 id 卡片 |
| `remove` | 移除单张（`{ id }`） |
| `clear` | 清空面板 |

**能力清单**

- **卡片按钮**（`actions`）：点击后指令回到当前会话，agent 处理后更新面板
- **骨架屏**：`pending: true` 或不给 `data` → 面板先显示骨架，随后逐个 `upsert` 填充
- **实时更新**：面板订阅会话事件，同 id 的 upsert 会立即刷新（无需刷新页面）
- **自动打开**：事件驱动——agent 推送卡片时自动打开面板；历史回放不会反复弹
- **出场动画**（尊重系统「减少动态效果」）：流程图节点逐个落下 + 连线生长、折线笔刷画出、
  列表/表格子项错峰；数字滚动仅用于金额类（`kind: "amount"`），年份/计数/比率/指数保持静止
- **多 tab**：卡片可带 `tab`（频道键，缺省 `main`）与 `tabTitle`；同一会话可把
  行情/调研/任务分到不同 tab，各自独立展示与过滤
- **持久化**：面板状态落盘 `~/.dsh/aura-panels/<sessionId>.json`，刷新/重启后卡片仍在
- **生命周期标记**：`persist: true` 常驻（跨刷新/重启保留）、`dismissed: true` 隐藏；
  普通卡最多 20 张，超出淘汰最早的（常驻卡不占名额）
- **圈选提问**：
  · **面板内**：顶部「🔍 圈选提问」→ 圈选面板卡片（精确到行/单元格，含卡片数据）
  · **全局**：按 **`⌘⌥S`**（macOS）/ `Ctrl+Alt+S`（Windows，可在 DSH「设置 → 快捷键」自定义）
    → 覆盖全屏的圈选层，**可圈选页面任意区域**（对话流 / 面板 / 其他侧边栏插件）
  松开后弹出**径向菜单**（解释这段 / 为什么这样 / 有什么问题 / 怎么改进，鼠标方向选中，
  中心圆自定义）；上下文只给「精确锚点」（行级文本 + turn 号 / 卡片 id），不重复完整消息。
  `Esc` 退出

### HTML 卡（`type: "html"`）

用于结构化组件表达不了的场景（调研报告、长文档、自由布局）：

```json
{ "id": "report", "type": "html", "title": "调研速览", "data": { "html": "<div class='a-h1'>标题</div>" } }
```

- **安全**：`sandbox="allow-scripts"`（不含 `allow-same-origin`），与宿主页面隔离
- **预设结构类**（推荐，颜色/字号/圆角由插件统一）：
  `a-card` `a-kpi` `a-h1` `a-h2` `a-table` `a-chip` `a-note` `a-warn` `a-ok` `a-bad` `a-quote` `a-list` `a-muted` `a-accent` `a-dim`
  及其语义变体 `a-chip--ok/--bad/--warn/--muted`、`a-text-ok/bad/warn/accent`（行内/表格内）
- **主题 Token**：`var(--aura-text | --aura-text-2 | --aura-surface | --aura-border | --aura-accent | --aura-radius | --aura-gap)`
  —— 换风格只需改 Token 层，结构类不用动
- **上下文自适应**：语义类写在 `b/span/td` 等行内位置时自动降级为文字色，不会撑高行高
- **高度自适应**：忽略 `data.height`，按内容撑开（长内容交给外层面板滚动）
- **约定**：HTML 属性用**单引号**（`class='a-h1'`），避免 JSON 双引号转义失败；单卡 ≤ 6000 字符

## 技术概览（面向开发者）

`dsh-aura` 是标准 DSH 静态插件包：

- **host 半**（`host/`）：注册两个工具——`aura_render`（对话流）与 `aura_panel`（面板 + 卡片存储）
- **browser 半**（`client/`）：工具结果渲染器（antd v6 + ECharts + React Flow）、右侧面板 tab、
  圈选层、面板信号层（`panelSignal.js`，订阅会话事件驱动面板打开）

构建产物（`client/dist/`）随仓库提供，安装即用，无需本地构建。

### 组件 data 契约

每个组件接收 `{ title, data }`：

| 组件 | data 结构 |
|---|---|
| metric_card | `{ metrics: [{label, value, change?, size?, kind?}] }`（`kind: amount` 触发千分位+滚动） |
| comparison_table | `{ headers: string[], rows: string[][] }` |
| step_bar | `{ steps: [{label, description?, badge?}] }` |
| insight_cards | `{ cards: [{title, rating, body, level?}] }` |
| article_list | `{ articles: [{title, summary?, url?, source?}] }` |
| trend_chart | `{ chart_type: 'line'\|'bar'\|'area', series: [{name, data:[{x,y}]}], unit? }` |
| data_tree | `{ root: {label, value?, children} }` |
| timeline | `{ events: [{time, title, description?, color?}], orientation? }` |
| graph | `{ direction?: 'TB'\|'LR', nodes: [{id, label, tag?, kind?}], edges: [{source, target, label?}] }` |
| html | `{ html: string }`（使用预设类，见下节） |

## 开发

```bash
npm install          # 安装依赖
npm run bundle       # 构建 client 半（tsdown → client/dist/client.js）
node check-tool.mjs  # 安装前自检（避免启动崩溃）
npm run watch        # 开发热重建
```

**分支约定**：日常开发在 `panel` 分支；发版时打 tag 并 `--no-ff` 合并到 `main`。

## 版本记录

| 版本 | 主题 |
|---|---|
| 0.2.0 | 侧边交互面板（`aura_panel` + 按钮闭环） |
| 0.3.0 | `graph` 组件 + Play 风视觉 + 骨架屏 + 出场动画（移除 mermaid，体积 16.2MB→1.4MB） |
| 0.4.0 | `html` 卡片 + 圈选提问 + 洞察卡视觉重做 + 数字语义（`kind`） |
| 0.5.0 | HTML 设计系统（Token + 预设结构类）+ 事件驱动面板打开 + 面板稳定性修复 |
| 0.6.0 | 面板多 tab + 圈选快捷键（⌘⌥S）+ 径向菜单 + 来源 turn 追溯修复 |
| 0.7.0 | 圈选精确命中 + 上下文精确与完整 + 面板持久化 + persist/dismissed 标记 |
| 0.8.0 | 全局圈选（⌘⌥S 任意区域）+ 适配器协议 + 行级精确（表格行/代码块/段落）+ 简洁上下文 |
| 0.8.1 | 径向菜单 5 个通用操作（图标分色）+ 卡片折叠/静默关闭 + 抖动修复 |
| 0.8.2 | 视觉类圈选自动截图（canvas 直出 + DOM 兜底，随提问以图片发送） |
| 0.8.3 | 面板回退单一 main tab + 截图尺寸阈值 + 工具参数 JSON 约束强化 |
| 0.8.4 | 径向菜单 6 扇区 + 中心取消 + 视觉/动画打磨 |

详细变更见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可

Apache-2.0
