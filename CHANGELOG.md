# Changelog

本项目所有重要变更记录于此。版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.8.8] — 2026-10-29

### 新增

- **卡片 ⚑ 手动常驻**：普通卡右上角新增 ⚑（点击发简短指令让 agent 设 `persist=true`）；
  默认推卡为普通卡（不参与常驻），需要长期保留时由用户手动置顶
- **骨架卡最少展示 400ms**：批量推卡时卡片到达过快，骨架一闪而过；改为至少显示 400ms

### 修复

- **骨架卡会话隔离**：全局事件会广播给所有会话的 AuraPanel 实例 → 增加
  `detail.sessionId === props.sessionId` 过滤（`__auraSessionId` 已确认返回当前会话）
- **跨会话残留骨架**：`__auraPendingCard` 增加 `sessionId` + `ts`；挂载兜底只接受
  「本会话 + 10s 内」，切回其他会话不再看到残留骨架
- **面板崩溃**：补上 `pendingSinceRef` 声明（上轮只插了使用点）
- **事件窗口日志刷屏**：改为只在卡片数变化时打印

## [0.8.7] — 2026-10-29

### 新增

- **骨架卡占位**：用户点「整理并推送」后，面板顶部立即出现骨架卡
  （"AI 正在生成卡片…" + 脉冲骨架条），不等 agent 生成完成——即时反馈
- **卡片飞入动画**：骨架卡从左侧滑入（0.5s 缓动，固定小位移）
- **新卡内框线闪烁**：卡片到达后，卡片**内部**圆角框线蓝色高亮 1.5s 后恢复

### 修复

- 骨架卡样式与真实卡对齐：复用 `.aura-card` 的圆角框线（此前一个有无框线不一致）
- 闪烁位置修正：作用于卡片内部框线（`.aura-html-card` / `.aura-card` 的
  `border-color`），不再用外层 section 的 `box-shadow`

## [0.8.6] — 2026-10-29

### 变更

- **卡片改为逆序展示**：新 → 旧（`updatedAt` 降序，最新卡片在顶部）；
  推卡后自动定位到顶部的卡片。后续可扩展为可配置（localStorage / 设置项）
- **推卡后自动展开侧边栏**：仅在侧边栏关闭时展开并定位 Aura 面板；
  已打开则不动（不切换用户当前 tab）

### 修复

- **对话流圈选触发慢截图**：视觉检测的容器 canvas 检查增加与圈选区的
  rect 相交判断（大容器不再把页面别处图表误判为视觉类）
- **对话流推送后未滚到底**：滚动容器改为 `[data-conversation-scroll]`，
  首选 `scrollTop = scrollHeight`（`scrollIntoView` 降为兜底）
- **侧边栏状态误判**：改用 `[data-sidebar-right-open]` 语义属性
  （关闭时 DSH 只把 dock 用 transform 移出，列宽仍在）
- **侧边栏关闭时推卡不展开**：`defaultOpen` 会因 `isTargetOpen` 跳过，
  改为 trigger 确认关闭后直接 `openTab`
- **html 卡下方巨大空白**：iframe 高度测量改用 `document.body.scrollHeight`
  （`documentElement` 默认 100% 会被 iframe 自身高度污染成正反馈）
- **自定义输入框跑到页面左侧**：定位的 `left` 不再限制 ≤240，
  改为视口内 clamp（跟随圈选位置）
- **命中范围过宽**：小元素（文件行/文本片段）须中心点落在圈选区内；
  大元素（卡片/容器）用 15% 重叠比例

## [0.8.5] — 2026-10-19

### 新增

- **Markdown 导出**：卡片右上角 ↧（单张）+ 面板顶部「全部导出」
  · 新增 `client/src/export-md.js`：metric/table/insight/article/chart → 结构化 md
  · html 卡 → HTML→Markdown（保留标题/表格/列表/引用，面向飞书云文档阅读）
  · 下载为 .md 文件
- **侧边栏文件/文档适配器**（无 id 语义容器）
  · `createFileAdapter`：读官方文件浏览器的 `data-files-path` → 上下文给路径
    （agent 可用 read 读内容，形成闭环）
  · `createDocAdapter`：读 `data-document-markdown` / `data-code-block-content`
  · 适配器优先级：aura 卡片 > 对话流 > file > doc > generic
  · 仅只读官方 DOM 标记，不改 DSH 与官方插件

### 修复

- **折线图图例与横轴重叠**：图例从底部移到顶部，grid.top 留出图例空间
- **图例文字重叠**：宽度 90→120 + `legend.tooltip`（hover 显示完整系列名）
- **命中范围过宽**：小元素（文件行/文本片段）须中心点落在圈选区内；
  大元素（卡片/容器）用 15% 重叠比例，避免相邻行边缘沾边被误收
- **导出 TDZ**：`handleExportAll` 改用 `cardsRef`（cards 定义在函数之后导致面板崩溃）

## [0.8.4] — 2026-10-19

### 变更

- **径向菜单改为 6 扇区 + 中心取消**：
  · 外圈：给出操作 / 整理并推送 / 解释这段 / 质疑 / 查来源 / 自定义
  · 中心圆改为「取消」（点击退出；原为自定义输入，自定义移入外圈）
- **交互与视觉打磨**：
  · 中心加「×」图标（与外圈风格统一）；高亮与外圈一致（浅蓝底 + 蓝字）
  · 扇区各自白底（去掉白色圆底），中心与外圈间 10px 透明 gap，外圈选项间无缝
  · 中心半径 34（更协调）；扇区高亮用透明蓝渐变（不发灰）+ 0.08s 跟手
  · 出现动画改弹性曲线（0.18s）
  · 去掉高亮加粗（消除文字/图标抖动）；字号统一 13px

### 修复

- **点空白清掉圈选框**：菜单出现后 `onPointerDown` 直接返回，不再开始新圈选
- **点空白取消菜单**：取消只走中心圆或 Esc（避免误触）

## [0.8.3] — 2026-10-19

### 变更

- **面板回退为单一 main tab**：cordis 的 `slots.inject` 只能在 effect 同步上下文
  调用，动态注册多 tab 在事件回调中会被忽略 → 移除 market/research/tasks 预注册，
  所有卡片统一进入 main 面板（忽略 `card.tab`）；多 tab 需要后续另行设计

### 修复

- **对话流截图慢（6-7s）**：小图标 SVG 被识别为视觉类 → 触发大容器 DOM 截图；
  改为只认大面积视觉元素（`canvas≥200x100` / `svg≥240x120` / `iframe≥200x120`
  或容器内大 canvas），对话流文本不再触发截图
- **工具参数 JSON 转义失败**：强化工具描述——参数必须是合法 JSON、HTML 属性
  一律单引号、长内容拆卡、优先结构化组件（html 仅长文档/富排版）

## [0.8.2] — 2026-10-19

### 新增

- **视觉类圈选自动截图**：圈选图表/图形/iframe 区域时自动截取该区域，
  以图片形式随提问发送（文字锚点 + 截图为视觉补充）
  · **canvas 直出**：趋势图等 `<canvas>` 直接 `toDataURL`，瞬间完成
  · **DOM 截图兜底**：非 canvas 的视觉区域用 modern-screenshot 截容器后裁剪
  · **视觉检测**：`elementsFromPoint` 遍历层栈 + 容器子元素检查
    （修复此前被卡片容器 div 挡住、break 太早的问题）

### 修复

- **canvas 圈选无径向菜单**：折线图无文本节点，命中被空过滤清空 → 只显示输入框；
  改为有 cardId/turn 也算有效命中
- **截图裁剪宽高 NaN**：`rect` 只有 `left/top/right/bottom`，改用差值计算
- **截图容器检测**：`elementFromPoint` 命中圈选层自身 → 改用 `elementsFromPoint` 跳过
- **modern-screenshot 模块解析失败**：DSH `__ModuleLoader__` 不支持动态 import
  与外部依赖 → 改静态 import 并加入 `alwaysBundle` 内联进 bundle

## [0.8.1] — 2026-10-19

### 变更

- **径向菜单改为 5 个通用操作**（按意图分组）：
  · 上=给出操作（可执行命令/步骤）· 右上=整理并推送（提炼要点 + 推送卡片）
  · 右下=解释这段 · 左下=质疑 · 左上=查来源
  · 每个扇区独立 SVG 图标 + 颜色；文字 13px
- **面板卡片交互**：标题行右侧 [▾ 折叠] [× 关闭]（悬浮显示）
  · 折叠为本地状态；关闭为静默隐藏（localStorage 按会话持久，刷新后保持）
- **去掉面板顶部「圈选提问」按钮**（快捷键 ⌘⌥S 统一为全局圈选）

### 修复

- 折叠卡片时上方卡片右边框抖动（`.aura-panel` 加 `scrollbar-gutter: stable`）
- 径向菜单图标尺寸爆炸（`<svg>` 嵌套无宽高被撑满 → 改用 `<g>` 路径）
- 空命中污染上下文（无文本的 turn/id 条目被过滤）

## [0.8.0] — 2026-10-19

### 新增

- **全局圈选**：`⌘⌥S` 打开覆盖全屏的圈选层，可圈选**页面任意区域**——
  对话流、aura 面板、其他侧边栏插件内容
- **圈选适配器协议**（`client/src/selection/adapters.js`）：
  · aura 卡片适配器（`data-aura-card-id`）
  · 对话流适配器（`data-chat-node-key` + `data-chat-turn`）
  · 通用 DOM 兜底（`elementsFromPoint`，穿透圈选层自身）
  优先级：aura 卡片 > 对话流节点 > 通用 DOM
- **行级精确命中**：矩形圈选后按语义元素提取**行级文本**
  · 表格行 `<tr>`：整行聚合（单元格以「 / 」连接）
  · 代码块 `<pre>`：整体提取（不再被语法高亮拆成 token 碎片）
  · 列表项 `<li>` / 段落 `<p>` / 标题 / 引用 各自成条
  · 文本节点兜底（`caretRangeFromPoint` 取行首尾）
- **简洁上下文**：圈选上下文只给「精确锚点」（行级文本 + turn 号 / 卡片 id），
  不重复完整消息内容——agent 在当前会话已有上下文记忆

### 变更

- 面板内圈选保留（面板「圈选提问」按钮，精确到卡片数据）
- 快捷键 `⌘⌥S` 改为触发**全局圈选**（不再触发面板内圈选，避免两个圈选层冲突）

## [0.7.0] — 2026-10-19

### 新增

- **圈选精确命中**：上下文新增「✨ 命中内容」，圈选到卡片内的具体元素
  （指标项 / 表格整行 / 洞察卡 / 条目等），表格整行以「 / 」连接单元格
- **上下文精确与完整并重**：命中内容是"精确锚点"，同时保留完整卡片数据，
  并新增「面板其他卡片（相关上下文）」段与强化后的回答要求
- **面板持久化**：面板状态落盘 `~/.dsh/aura-panels/<sessionId>.json`（防抖写盘、
  懒加载），刷新 / 主实例重启后卡片仍在
- **卡片生命周期标记**：
  · `persist: true` 常驻（跨刷新/重启保留，不参与上限淘汰）
  · `dismissed: true` 隐藏（不渲染，数据保留，可恢复）
- **普通卡上限 20 张**：超出淘汰最早的（persist 卡不占名额）

### 修复

- **卡片刷新后消失**：`useChat` 的渲染节点把工具调用折叠了，读不到 tool/result；
  面板改为从 `eventSource.entries`（完整事件流）读取卡片
- **径向菜单出屏/滚动偏移**：改为 `position: fixed` + 视口坐标 + 边缘 8px 收敛
- **圈选按钮高度跳动**：固定 26px 高（emoji 字形行高不同导致）
- **圆选层坐标作用域**：`selAbs` 与 `cards` 的 TDZ 崩溃

## [0.6.0] — 2026-10-19

### 新增

- **面板多 tab**：卡片支持 `tab` 频道键（缺省 `main`）与 `tabTitle` 显示名；
  按卡片 tab 动态注册独立 tab（`aura-panel:<key>`），同一会话可把行情/调研/任务
  分别组织在不同 tab 里，各自独立过滤与展示
- **圈选快捷键**：`⌘⌥S`（macOS）/ `Ctrl+Alt+S`（Windows）直接进入圈选模式，
  经 DSH 快捷键系统注册，可在「设置 → 快捷键」中自定义；`Esc` 退出
- **径向菜单**：圈选命中卡片后在鼠标松开处弹出饼状四问（解释这段 / 为什么这样 /
  有什么问题 / 怎么改进），命中只看角度（`atan2`）+ 最小半径 28px，扇区 hover 高亮、
  停留 150ms 防误触；中心圆进入自定义提问
- **圈选问题带卡片名**：问题自动改写为「针对『卡片名』中圈选的这部分：<问题>」，
  避免「为什么会出现这样的情况」这类过泛问法

### 修复

- **新 tab 的 slot body 不注册**：`ctx.slots.inject` 只在 effect 上下文生效，此前在
  事件回调里注册导致 `aura-panel:market` 等新 tab 的 body 永不挂载（改为待注册队列）
- **圈选层定位错乱**：`.aura-panel` 缺 `position: relative`，圈选层相对外层定位，
  看不到十字光标；空态/加载态同样补齐
- **短按快捷键无响应**：`regions` 缺 `editable`（焦点在输入框时不触发）；
  `offsetParent` 对 fixed/absolute 元素恒为 null，改为尺寸判断
- **空态无法圈选**：`panelRef` 此前只挂在正常渲染分支，空态/加载态补挂
- **来源追溯 turn 丢失**：DSH 的 `node.location.turn` 是 **Turn 对象**（`{turn:N,...}`）
  而非数字，直接 `Number.isFinite` 判断恒为 false；改为取 `.turn` 并兜底 `loc.step.turn`

### 视觉

- 径向菜单极简：去掉全部描边，只留白圆 + 柔和阴影；扇区静止透明，hover 才填色；
  中心圆用浅灰底区分（跟随明暗主题）

## [0.5.0] — 2026-10-19

### 新增

- **HTML 卡片设计系统**：`html` 卡从"agent 自由发挥"升级为「Token + 预设结构类」三层体系
  · Token 层：`--aura-text / --aura-text-2 / --aura-surface / --aura-border / --aura-accent /
    --aura-radius / --aura-gap / --aura-font*`（未来换风格只改这一层）
  · 结构类：`a-card / a-kpi / a-h1 / a-h2 / a-table / a-chip / a-note / a-warn / a-ok / a-bad /
    a-quote / a-list / a-muted / a-accent / a-dim`，agent 只写结构不写样式
  · 语义变体：`a-chip--ok/--bad/--warn/--muted`、`a-text-ok/bad/warn/accent`（行内）
  · 上下文自适应：语义块（`a-ok` 等）用在 `b/span/td` 等行内位置时**自动降级为文字色**，
    不再撑高行高或压叠
- **事件驱动面板打开**：订阅当前会话事件流，`append` 中出现 `aura_panel` 的 `tool/call`
  即打开面板（有新内容才打扰）；`replace`（进入会话首帧）只用于历史恢复，不会因回放反复弹
- **面板 tab 多目标预留**：信号层只产出"有推送"事件，打开哪个 tab 由注入的
  `resolveTargets` 决定（默认 `['aura-panel']`），未来一个会话开多个 aura tab 无需改信号层

### 修复

- **面板渲染崩溃**：诊断版本把选择器返回值从数组改成对象后未防御 `useChat` 返回
  `undefined`，导致 `state.cards` 抛错、面板整体空白（刷新也不恢复）
- **新会话面板永不出现**：`tabsIn()` 实际签名为 `tabsIn(sessionId)`（此前无参调用恒为空）；
  且策略先依赖 `sessions.binding(id)` 判断有无卡片，拿不到就 return，导致 `openTab` 从未被调用
- **当前会话读不到**：`ctx.sidebarRight` 对外面是 `mounted`，`onScreen` 只存在于内部控制器
- **html 卡 JSON 转义失败**：长 HTML 里的双引号属性需转义为 `\"`，模型易漏导致
  `tool input is invalid JSON`；改为要求属性一律用单引号（`class='a-h1'`），并限制单卡 ≤ 6000 字符
- **html 卡固定高度引入内部滚动条**：改为忽略 `data.height`，始终按内容自适应
  （长内容交给外层面板滚动）
- **chip 上下行重叠**：`.a-chip` 未设行高，inline-block 高度溢出；补 `line-height` 与垂直间距

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
