# Aura

> **Beyond the Chat Box.**
>
> An interaction layer for human–agent collaboration on DeepSeek Harness.
>
> **Less typing. More doing.**

Aura explores a more direct way for humans to work with AI agents — one that goes beyond typing prompts and reading text replies.

Select content to express your intent. Let agents respond with structured, visual, and rich content. Turn useful parts of a conversation into reusable work artifacts.

## Why Aura?

AI agents can reason, research, and generate content. Yet the way we interact with them is still largely built around text boxes and chat messages.

This creates unnecessary friction:

- **Expressing intent takes effort.** Users often have to describe the context before asking what they actually want to know.
- **Text is not always the best interface.** Complex information can be easier to understand through a chart, a structured card, or a rich document.
- **Useful results get buried.** Valuable insights disappear into long conversation histories, leaving users to organize and preserve them manually.

Aura explores a different approach: make interaction more contextual, make results more expressive, and let users decide what is worth keeping.

## Core Experiences

### 1. Interact with Context

Select a piece of content and invoke a radial menu to tell the agent what to do with it.

Instead of copying text into a new prompt, Aura combines the selected content with your chosen intent to construct a contextual request.

Available actions include:

- **Interpret** — Understand the meaning, reasoning, or implications of selected content.
- **Challenge** — Question assumptions and examine potential weaknesses.
- **Suggest Actions** — Explore possible next steps.
- **Check Sources** — Examine the evidence and sources behind a claim.
- **Curate & Push** — Organize useful conversation content into a reusable artifact.

The goal is simple: express intent directly where it arises, without repeatedly reconstructing the context.

### 2. See What Matters

Not every answer should be a wall of text.

Aura enables agents to present information through structured visual components and rich content, making complex results easier to scan, compare, and understand.

Supported component types include:

- Metric cards
- Comparison tables
- Step indicators
- Insight cards
- Lists
- Trend charts
- Tree diagrams
- Timelines
- Relationship graphs
- Rich HTML documents

The goal is not to decorate AI responses. It is to give information a form that better fits its purpose.

### 3. Keep What's Useful

A useful conversation should be able to produce something more durable than another chat message.

With **Curate & Push**, an agent can organize relevant conversation content into cards or rich HTML documents and send them to Aura's sidebar workspace.

Aura currently provides **a single main tab** for managing pushed content.

Depending on the supported card lifecycle operations, you can:

- **Keep important content.** Pin selected cards so they remain available.
- **Let temporary content go.** Temporary cards can be hidden as the conversation grows.
- **Remove unwanted content.** Dismiss cards you no longer need.
- **Take content elsewhere.** Export card content to Markdown for reuse in other tools.

Markdown export includes card content such as text, supported basic styling, and chart data. It is designed to preserve reusable content, not necessarily reproduce every visual detail of the original HTML.

## How It Works

Aura connects user intent, agent capabilities, and the presentation of results.

1. **Select** — Identify the content you want to work with.
2. **Choose an action** — Express your intent through the radial menu.
3. **Process** — Aura combines the selected content and chosen intent into a contextual request for the agent.
4. **Present** — The agent responds through text, visual components, or rich documents.
5. **Curate** — Push useful results into the sidebar, manage their lifecycle, and export them when needed.

This is a conceptual model rather than a mandatory workflow. Individual capabilities can be used whenever they are useful.

## Example Use Cases

### Research and Analysis

Select a claim in an agent-generated report, challenge its assumptions, or check the evidence behind it. Push useful findings into cards for later reference.

### Reading and Learning

Select an unfamiliar concept and ask the agent to interpret it in context. Turn a long explanation into a structured visual summary.

### Turning Conversations into Work Artifacts

After exploring a topic through conversation, ask the agent to organize the important conclusions into a card or rich document. Keep it in the sidebar or export it as Markdown.

These are examples of possible workflows, not guarantees that every task is fully automated.

## Getting Started

Aura runs within DeepSeek Harness (DSH) and relies on its host environment and agent capabilities.

### Prerequisites

- A compatible DeepSeek Harness installation.
- A supported environment for loading and running DSH plugins.

### Installation

### Installation

**Version requirements**

| Dependency | Requirement |
| --- | --- |
| DeepSeek Harness | `>=0.2.0 <0.3.0`（0.2.0 recommended; older versions degrade selection/sidebar behavior） |
| Node.js | ≥ 22 |

```bash
# From GitHub (pinned version recommended)
dsh plugin --profile web add github:clawdwan/aura-dsh#v0.8.9

# From source
dsh plugin --profile web add /path/to/aura-dsh
```

Restart `dsh web` after installation. Run `npm run check` first to verify host compatibility.

### Quick Start

Once Aura is installed:

1. Open a conversation in DeepSeek Harness.
2. Select a piece of content and open the radial menu.
3. Choose an available contextual action.
4. Ask the agent to organize useful content and push it to the sidebar.
5. Manage or export the resulting cards as needed.

### Quick Start

Once Aura is installed:

1. Open a conversation in DeepSeek Harness.
2. Press `⌘⌥S` (macOS) / `Ctrl+Alt+S` (Windows) to enter selection mode, then drag to select content.
3. The radial menu appears with five actions: **Interpret / Challenge / Suggest Actions / Check Sources / Curate & Push** (center circle = cancel).
4. Choose an action; Aura builds a contextual request and sends it to the agent.
5. "Curate & Push" sends cards to the sidebar, which auto-opens when closed (a skeleton card is shown while the agent generates).

## For Developers

Aura is an interaction and presentation layer built for DeepSeek Harness. It extends the existing agent experience rather than replacing the underlying agent runtime.

Its capabilities span three areas:

| Area | Responsibility |
| --- | --- |
| Contextual interaction | Connect selected content and user intent to agent requests. |
| Rich presentation | Render structured components and rich HTML content. |
| Sidebar workspace | Organize pushed cards, manage their lifecycle, and export reusable content. |

### Rendering Components

Aura supports a collection of structured visual components for agent-generated content.

### Rendering Components

Aura supports 10 structured components: `metric_card`, `comparison_table`, `step_bar`, `insight_cards`, `article_list`, `trend_chart`, `graph`, `data_tree`, `timeline`, `html`.

See [docs/COMPONENTS.md](docs/COMPONENTS.md) for data schemas and usage rules.

### Sidebar and Card Lifecycle

The sidebar provides a single main tab for organizing and managing pushed cards and rich documents.

### Sidebar and Card Lifecycle

- **Single main tab**; each conversation has its own panel state (isolated by session).
- Up to **20 non-pinned cards**; the oldest is evicted first when over the limit.
- **Pin (⚑)**: user action to keep a card permanently — pin state is set only by the user, never by the agent.
- **Dismiss (×)**: silently hidden (localStorage, per session); host data is retained.
- Pushed cards are persisted to `~/.dsh/aura-panels/<sessionId>.json`.

### Markdown Export

- Export a single card (↧ on the card) or all cards (button at the top).
- Conversion: structured components → Markdown tables/lists; HTML cards → HTML-to-Markdown (headings/tables/lists preserved, suitable for tools like Feishu docs).
- Limitation: HTML card styling is not fully reproduced; iframe content is not captured in screenshots.

### Development and Extension

```
client/   # browser half: panel, radial menu, selection adapters, components
host/     # host half: aura_render / aura_panel tools, panel store
scripts/  # build & wrap scripts
```

```bash
npm run bundle        # build the client bundle
npm run check         # host compatibility check
npm run test:registry # registry schema test
```

Aura is installed as a DSH plugin bundle (see `cordis.patch.yml`); `@deepseek-ai/*` are peerDependencies provided by the host.

For implementation details, refer to the source code and the relevant technical documentation.

## Product Vision

Aura starts as a DeepSeek Harness plugin, but the question it explores is broader:

**What should human–agent interaction look like when it is no longer limited to a chat box?**

We believe the future of agent interaction should make it easier to express intent, understand results, and work with agents through contextual actions and richer interfaces.

Cross-task, cross-application, desktop-level, and operating-system-level interaction are potential directions for future exploration — not capabilities Aura currently claims to provide.

Read [VISION.md](VISION.md) for the full product vision and design principles.

## Current Scope

Aura is currently a plugin for DeepSeek Harness.

It is not an independent agent runtime, a complete knowledge-management system, or an operating-system-level agent platform. Its current capabilities depend on the host environment and the underlying agent.

We aim to prioritize improvements that reduce interaction friction and make agent outputs more useful in real work.

## Contributing

Contributions, feedback, and ideas are welcome.

If you are interested in contextual interaction, rich agent interfaces, or new ways for humans and agents to collaborate, explore the project and share your thoughts.

### Contributing

Contributions, feedback, and ideas are welcome — open an issue or a pull request on [GitHub](https://github.com/clawdwan/aura-dsh).

## License

## License

MIT © clawdwan. See [LICENSE](LICENSE).

---

**Aura — Beyond the Chat Box.**

*Less typing. More doing.*
