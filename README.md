# dsh-aura

Aura 通用展示层插件 —— 静态 cordis 插件包（dual-face：一个包同时承载 host 半与 browser 半）。

- **host 半**：`aura_render` 工具（`host/tool.js`，标准 cordis 插件 `{ apply, inject, name }`），把结构化数据按 **8 类组件**渲染进对话流，schema 不匹配时降级为文字。
- **browser 半**：`tool.call.toolview` keyed 渲染器（`client/src/`），读取工具结果 `{ text, components[] }` 分派 React 组件。

## 组件（8 种，antd v6 + ECharts 实现）

| 组件 | 实现 | data 结构 |
|---|---|---|
| metric_card | antd Statistic + Card | `{ metrics: [{label, value, change?, size?}] }` |
| comparison_table | antd Table（降配） | `{ headers: string[], rows: string[][] }` |
| step_bar | antd Steps | `{ steps: [{label, description?, badge?}] }` |
| insight_cards | antd Card + Alert + Tag | `{ cards: [{title, rating, body, level?}] }` |
| article_list | antd List | `{ articles: [{title, summary?, url?, source?}] }` |
| trend_chart | ECharts（line/bar/area） | `{ chart_type, series: [{name, data:[{x,y}]}], unit? }` |
| data_tree | ECharts tree（orient LR） | `{ root: {label, value?, children} }` |
| timeline | antd Timeline（垂直/水平） | `{ events: [{time, title, description?, color?}], orientation? }` |

- 风格：**antd/ECharts 默认**（`--dsw-*` token 映射为后置项）
- 体积：8 组件 bundle gzip **~708KB**（antd 依赖树 + echarts 已打包；本地加载无感，网络端需 React.lazy 分割）

## 目录结构

```
aura-dsh/
├── host/                 # host 半（包主入口 = host/tool.js）
│   ├── tool.js           # aura_render 工具定义（cordis 插件）
│   ├── json-repair.js    # JSON 修复纯函数
│   └── registry.js       # 8 组件注册表 + 降级链
├── client/
│   ├── src/              # browser 半源码（组件 + AuraToolRow + styles）
│   └── dist/client.js    # 构建产物（exports["./client"] 指向它）
├── cordis.patch.yml      # profile bundle 插入层
├── package.json
└── README.md
```

## 安装

包必须能被 profile 目录解析（`~/.dsh/profiles/web`），两种路由任选其一：

### 路由 1（推荐）：`dsh plugin add`

```bash
dsh plugin --profile web add /Users/sifangwan/dsh-workspace/aura-dsh
# 或已发布后：dsh plugin --profile web add dsh-aura
```

`dsh plugin` 检测 `dsh.bundle.patch` 自动加入 profile bundles，**无需手改配置**。重启 dsh web 生效（client 半需先构建）。

### 路由 2：手动 insert

```yaml
- insert:
    - id: aura-render
      name: dsh-aura
```

追加到 `~/.dsh/profiles/web/cordis.patch.yml` 后重启。

## 开发

```bash
pnpm bundle          # tsdown → client/dist/client.js（含 antd/echarts 依赖树打包）
pnpm check           # host 半语法自检
pnpm test:registry   # 注册表一致性
node check-tool.mjs  # 安装前自检（defineTool 编译 + execute 冒烟，避免启动崩）
```

**构建要点**（P0 验证定案）：
- **子路径导入**（`antd/es/xxx`、`echarts/core`）——主入口摇树失败（820KB vs 351KB）
- **alwaysBundle 正则**覆盖依赖树（`antd|echarts|rc-*|@rc-component|@ant-design`），react 保持 external（DSH shell 提供）
- **define `process.env.NODE_ENV`** —— antd/echarts 引用 process，浏览器无此全局，构建时替换

## 加载机制（静态包 host/client 两半）

一个 loader 条目 = 一个包，两半共用包名：host 半 = 包主入口导出 cordis 插件；client 半 = `dsh.client` + `exports["./client"]`（dsh-client-modules 自动发现）；bundle 层 = `dsh.bundle.patch`。

## 验证

1. GUI 对话中让 agent 调 `aura_render` → 对话流出现 antd/ECharts 组件卡片
2. 刷新页面卡片常驻（静态插件）；飞书发消息 → GUI 同会话可见
