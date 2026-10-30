# Aura — 面向 DeepSeek Harness 的人机协作交互插件

[English](README.en.md) | [中文](README.md)

![DSH](https://img.shields.io/badge/DSH-0.2.0%2B-blue)
![License](https://img.shields.io/github/license/clawdwan/aura-dsh)
![Stars](https://img.shields.io/github/stars/clawdwan/aura-dsh)

> **Beyond the Chat Box.**
>
> 一个面向 DeepSeek Harness 的人机协作交互层。
>
> **Less typing. More doing.**

Aura 希望探索一种更直接的人与 Agent 协作方式——不再局限于输入提示词、阅读文字回复。

圈选内容，直接表达意图；让 Agent 用结构化、可视化或富文档的形式呈现结果；把对话中真正有价值的信息沉淀为可复用的工作成果。

## 为什么需要 Aura？

AI Agent 已经能够进行推理、研究和内容生成，但我们与它们交互的方式，仍然主要围绕输入框和聊天消息展开。

这带来了一些不必要的摩擦：

- **表达意图需要额外成本。** 用户往往需要先描述上下文，再提出真正想解决的问题。
- **文字不总是最合适的呈现方式。** 复杂信息可能更适合用图表、结构化卡片或富文档表达。
- **有价值的结果容易被淹没。** 重要结论散落在漫长的对话历史中，用户还需要手动整理和保存。

Aura 希望探索另一种方式：让交互更贴近上下文，让结果拥有更合适的表达形式，并由用户决定什么值得保留。

## 核心体验

### 1. 围绕上下文展开交互

圈选一段内容，通过环形菜单告诉 Agent 接下来要做什么。

Aura 将用户选中的内容与所选择的意图结合，构造相应的上下文请求，而不必让用户把原文重新复制到提示词中。

当前设计包含以下动作：

- **解读**：理解选中内容的含义、推理过程或潜在影响。
- **质疑**：审视观点的前提，发现可能存在的漏洞。
- **给出操作**：探索可以采取的下一步行动。
- **检查来源**：检查论点背后的证据和信息来源。
- **整理推送**：把对话中有价值的内容整理为可复用的成果。

目标很简单：在意图产生的地方直接表达意图，减少反复重建上下文的成本。

### 2. 让重要信息更容易理解

不是每个回答都应该是一大段文字。

Aura 支持 Agent 通过结构化可视化组件和富内容呈现信息，让复杂结果更容易浏览、比较和理解。

组件类型包括：

- 指标卡片
- 对比表格
- 步骤条
- 洞察卡片
- 列表
- 趋势图
- 树状图
- 时间线
- 关系图
- HTML 富文档

我们追求的不是给 AI 回复添加装饰，而是让信息拥有更适合其用途的表达形式。

### 3. 沉淀有价值的成果

一次有价值的对话，应该能够产出比聊天消息更持久的成果。

通过**整理推送**，Agent 可以把对话中的相关内容整理成卡片或 HTML 富文档，并推送到 Aura 的侧边栏空间。

Aura 当前提供**单一主 Tab**，用于集中管理推送的内容。

根据具体内容的生命周期操作，用户可以：

- **保留重要内容**：将重要卡片设为常驻，方便后续查看。
- **管理临时内容**：随着对话增长，临时卡片可以按既定规则隐藏。
- **清理不再需要的内容**：关闭或移除不需要的卡片。
- **导出并继续使用**：将卡片内容导出为 Markdown，带到其他工具中继续使用。

Markdown 导出包含卡片中的文字、支持的基础样式和图表数据。它的目标是保留可复用的内容，而不是保证完整复现原始 HTML 的全部视觉效果。

## 工作方式

Aura 将用户意图、Agent 能力与结果呈现连接起来。

1. **圈选内容**：找到想要处理的信息。
2. **选择动作**：通过环形菜单表达意图。
3. **执行任务**：Aura 将选中内容与用户意图组合成上下文请求，交给 Agent。
4. **呈现结果**：Agent 以文字、可视化组件或富文档等形式响应。
5. **整理复用**：将有价值的结果推送到侧边栏，管理其生命周期，并在需要时导出。

这是一种概念性的交互模型，不要求每次使用都经过全部步骤。用户可以根据实际任务单独使用其中的能力。

## 使用场景

### 研究与分析

圈选 Agent 生成的报告中的某个观点，进一步质疑其假设，或检查背后的证据。把有价值的发现推送为卡片，方便后续查看。

### 阅读与学习

圈选不熟悉的概念，让 Agent 结合上下文进行解读；也可以把较长的解释整理为结构化的可视化摘要。

### 将对话转化为工作成果

围绕一个主题完成探索后，让 Agent 将重要结论整理成卡片或富文档，保留在侧边栏中，或导出为 Markdown。

以上是可能的使用方式，不代表所有任务都已实现全自动化。

## 开始使用

Aura 运行在 DeepSeek Harness（DSH）中，依赖宿主环境及其 Agent 能力。

### 环境要求

- 已安装兼容版本的 DeepSeek Harness。
- 当前环境支持加载和运行 DSH 插件。

### 安装

**版本要求**

| 依赖 | 要求 |
| --- | --- |
| DeepSeek Harness | `>=0.2.0 <0.3.0`（推荐 0.2.0；更低版本会降级圈选/侧边栏行为） |
| Node.js | ≥ 22 |

**安装方式一：桌面版（推荐，无需终端）**

1. 打开 DeepSeek Harness → 侧边栏 **插件**
2. 右上角 **添加插件**
3. 输入 `github:clawdwan/aura-dsh#v0.8.10`（或本地目录路径）
4. 安装完成页点 **立即启用**（若关闭，可在「已安装插件」中再打开开关）
5. **完全退出并重开 DeepSeek Harness**（桌面端无热加载）

> 注意：桌面版运行的是 `desktop` profile。**不要**用全局 `dsh plugin --profile desktop` 管理它（会报 "managed exclusively by the Electron application"），桌面端请走 app 内的「插件」页。

**安装方式二：独立 Web 版（需要 CLI）**

```bash
# 从 GitHub（钉版本更稳）
dsh plugin --profile web add github:clawdwan/aura-dsh#v0.8.10

# 从源码
dsh plugin --profile web add /path/to/aura-dsh
```

重启 `dsh web` 后生效。安装前可运行 `npm run check` 自检与宿主兼容性。

### 快速上手

安装 Aura 后：

1. 在 DeepSeek Harness 中打开一个对话。
2. 按 `⌘⌥S`（macOS）/ `Ctrl+Alt+S`（Windows）进入圈选模式，拖动选中内容。
3. 环形菜单出现，包含五个动作：**解读 / 质疑 / 给出操作 / 检查来源 / 整理推送**（中心圆 = 取消）。
4. 选择动作后，Aura 构造上下文请求并交给 Agent。
5. 「整理推送」会把卡片推送到侧边栏；侧边栏关闭时会自动展开（生成期间显示骨架卡）。

> **Linux 用户注意**：快捷键默认未绑定（DSH 对 Linux 的快捷键组合校验较严），请在
> 「设置 → 快捷键」中手动把「Aura 圈选提问」绑定到 `Ctrl+Alt+S` 或你习惯的组合。

## 开发者文档

Aura 是构建在 DeepSeek Harness 之上的交互与呈现层。它增强现有的 Agent 使用体验，而不是替代底层 Agent 运行时。

当前能力主要包括三个方面：

| 模块 | 作用 |
| --- | --- |
| 上下文交互 | 将用户圈选的内容与意图转换为 Agent 请求。 |
| 富内容呈现 | 渲染结构化组件和 HTML 富内容。 |
| 侧边栏工作空间 | 集中管理推送的卡片，管理内容生命周期，并导出可复用成果。 |

### 可视化组件

Aura 支持 10 种结构化组件：`metric_card`、`comparison_table`、`step_bar`、`insight_cards`、`article_list`、`trend_chart`、`graph`、`data_tree`、`timeline`、`html`。

数据结构与使用规则见 [docs/COMPONENTS.md](docs/COMPONENTS.md)。

### 侧边栏与卡片生命周期

- **单一主 Tab**；每个会话有独立的面板状态（按会话隔离）。
- 非常驻卡片上限 **20 张**，超出时淘汰最早的一张。
- **常驻（⚑）**：用户手动操作，设为常驻后不参与淘汰——常驻状态只能由用户设置，Agent 不能设置。
- **关闭（×）**：静默隐藏（localStorage，按会话）；宿主数据保留。
- 推送的卡片持久化到 `~/.dsh/aura-panels/<sessionId>.json`。

### Markdown 导出

- 支持导出单张卡片（卡片上的 ↧）或全部卡片（顶部按钮）。
- 转换规则：结构化组件 → Markdown 表格/列表；HTML 卡 → HTML 转 Markdown（保留标题/表格/列表结构，适合飞书等工具）。
- 限制：HTML 卡的样式不会完全复现；iframe 内容不会出现在截图中。

### 开发与扩展

```
client/   # 浏览器侧：面板、环形菜单、圈选适配器、组件
host/     # 宿主侧：aura_render / aura_panel 工具、面板存储
scripts/  # 构建与包装脚本
```

```bash
npm run bundle        # 构建 client 产物
npm run check         # 宿主兼容自检
npm run test:registry # 组件 registry schema 测试
```

Aura 以 DSH 插件 bundle 形式安装（见 `cordis.patch.yml`）；`@deepseek-ai/*` 为宿主提供的 peerDependencies。

> `react` / `react-dom` 由 DSH 宿主提供（隐式依赖，不在插件 dependencies 中）；pnpm 可能提示 peer warning，属预期行为。

具体实现请以源代码和对应技术文档为准。

## 产品愿景

Aura 从一个 DeepSeek Harness 插件出发，但它探索的问题更广泛：

**当人与 Agent 的交互不再局限于聊天框时，协作应该是什么样子？**

我们希望未来的人机交互能够更直接地表达意图、更有效地理解结果，并通过上下文动作和丰富的界面与 Agent 协作。

跨任务、跨应用、桌面级乃至操作系统级的交互，都可能成为未来的探索方向，但它们不是 Aura 当前已经具备的能力。

完整的产品理念与设计原则请参阅 [VISION.md](VISION.md)。

## 当前能力边界

Aura 当前是一个运行于 DeepSeek Harness 的插件。

它不是独立的 Agent 运行时、完整的知识管理系统，也不是操作系统级的 Agent 平台。当前能力依赖宿主环境及底层 Agent 所提供的功能。

我们会优先探索那些能够减少交互摩擦、让 Agent 输出在真实工作中更有用的改进。

## 参与贡献

欢迎对项目提出建议、反馈和贡献。

如果你关注上下文交互、丰富的 Agent 界面，或人与 Agent 协作方式的演进，欢迎了解项目并分享想法。

### 参与贡献

欢迎反馈、建议与贡献——可以在 [GitHub](https://github.com/clawdwan/aura-dsh) 提 Issue 或 Pull Request。

## 许可证

Apache-2.0 © clawdwan。详见 [LICENSE](LICENSE)。

---

**Aura — Beyond the Chat Box.**

*Less typing. More doing.*
