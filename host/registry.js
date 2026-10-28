/**
 * aura-dsh / host / registry.js
 * 组件注册表（迁移自 aura/components/README.md）。
 * 作为展示决策依据注入 aura_render 工具说明。
 * 只含核心 5 组件（comparison_table / metric_card / step_bar / insight_cards / article_list）。
 */

export const REGISTRY = [
  {
    type: 'metric_card',
    label: '数据卡片',
    description: '单个数据卡片的网格排列，每张卡有标签+数值+变化量',
    best_for: ['关键指标', '涨跌展示', '数量对比'],
    input_shape: 'list_of_label_value_pairs_with_change',
    data_schema: '{ metrics: [{ label, value, change?, size?, kind? }] }（kind 决定数字表现：amount=金额/市值→千分位+滚动；count=计数、year=年份、ratio=比率、index=指数点位→原样显示不滚动；缺省=原样显示。value 用字符串原样传）',
    downgrade_to: 'comparison_table',
    category: 'display',
  },
  {
    type: 'comparison_table',
    label: '对比表格',
    description: '多行多列数据对比，适合公司对比、指标拆解、清单',
    best_for: ['多目标对比', '维度拆解', '清单', '映射关系'],
    input_shape: 'rows_with_headers',
    data_schema: '{ headers: string[], rows: string[][] }',
    downgrade_to: null,
    category: 'display',
  },
  {
    type: 'step_bar',
    label: '步骤条',
    description: '水平流程/层级展示，适合产业链、流程步骤、阶段划分',
    best_for: ['流程展示', '层级结构', '上下游关系', '阶段划分'],
    input_shape: 'ordered_list_of_items_with_descriptions',
    data_schema: '{ steps: [{ label, description?, badge? }] }',
    downgrade_to: 'comparison_table',
    category: 'structure',
  },
  {
    type: 'insight_cards',
    label: '洞察卡片组',
    description: '多个独立判断卡片的组合，每张卡片有标题+评级+正文',
    best_for: ['多维度评估', '风险分析', '结论展示', '清单判断'],
    input_shape: 'list_of_titled_items_with_ratings',
    data_schema: '{ cards: [{ title, rating, body, level? }] }',
    downgrade_to: 'comparison_table',
    category: 'analysis',
  },
  {
    type: 'article_list',
    label: '文章列表',
    description: '多条信息/新闻条目的结构化列表',
    best_for: ['新闻聚合', '信息条目', '要点清单'],
    input_shape: 'list_of_articles',
    data_schema: '{ articles: [{ title, summary?, url?, source?, importance? }] }',
    downgrade_to: 'comparison_table',
    category: 'display',
  },
  {
    type: 'trend_chart',
    label: '趋势图',
    description: '时间序列数据可视化（折线/柱状/面积），适合走势、趋势、时序对比',
    best_for: ['走势趋势', '时间序列', '涨跌曲线', '对比趋势'],
    input_shape: 'time_series_data',
    data_schema: '{ chart_type: "line"|"bar"|"area", series: [{ name, data: [{x, y}] }], unit?, highlight? }',
    downgrade_to: 'comparison_table',
    category: 'display',
  },
  {
    type: 'graph',
    label: '关系图',
    description: '现代交互式关系图（节点+连线，自动层次布局，可缩放平移），适合架构、依赖、调用链、实体关系；节点用界面同款样式渲染',
    best_for: ['架构关系', '依赖拓扑', '调用链', '实体关系网', '流程节点'],
    input_shape: 'graph_nodes_edges',
    data_schema: '{ direction?: "TB"|"LR", nodes: [{ id, label, tag?, kind? }], edges: [{ source, target, label? }] }（tag 是小号大写标签，如 "BUILD"/"PLAN"；kind 取 primary(暖橙强调)/accent(淡色)/muted(虚线弱化)）',
    downgrade_to: 'data_tree',
    category: 'display',
  },
  {
    type: 'data_tree',
    label: '树干图',
    description: 'SVG 贝塞尔层级数据树，适合有层级归属的信息展示（思维导图）',
    best_for: ['层级数据', '参数归属', '企业结构', '产业链细分', '风险传导'],
    input_shape: 'nested_tree_with_root_and_children',
    data_schema: '{ root: { label, value?, children: [{ label, children... }] } }',
    downgrade_to: 'stat_grid',
    category: 'structure',
  },
  {
    type: 'timeline',
    label: '时间线',
    description: '按时间顺序展示事件序列',
    best_for: ['事件序列', '历史回顾', '时间锚定', '演进过程'],
    input_shape: 'ordered_events_with_time',
    data_schema: '{ events: [{ time|date, title, description?, color? }] }',
    downgrade_to: 'comparison_table',
    category: 'structure',
  },
  {
    type: 'html',
    label: 'HTML 富文档',
    description: 'agent 直接生成的 HTML，在沙箱 iframe 中渲染（安全隔离、跟随主题），适合调研报告、长文档、富排版、自由布局',
    best_for: ['调研报告', '长文档', '富排版', '自由布局', '自定义布局'],
    input_shape: 'html_document',
    data_schema: '{ html: string, height?: number }。'
      + '【优先结构化组件】能用 comparison_table/insight_cards/metric_card 表达时不要用 html（参数更简单、不易转义失败）；'
      + '【安全】HTML 属性一律用单引号（class=\'a-h1\'），避免 JSON 双引号转义出错；'
      + '【长度】单卡 html 建议 ≤ 6000 字符，超长请拆成多张卡分别 upsert；'
      + '【必须】用预设结构类写骨架，禁止写死颜色/字号/自创卡片样式：'
      + "<div class='a-h1'>标题</div><div class='a-kpi'><div><b>2021</b><span>成立</span></div></div>"
      + "<h3 class='a-h2'>小节</h3><table class='a-table'><tr><th>键</th><td>值</td></tr></table>"
      + "<p>正文</p><span class='a-chip'>A级</span><span class='a-chip a-chip--ok'>已核实</span>"
      + "<span class='a-chip a-chip--bad'>已落标</span><span class='a-chip a-chip--warn'>待确认</span>"
      + "<div class='a-note'>提示</div><div class='a-warn'>警告</div>"
      + "<div class='a-ok'>正向</div><div class='a-bad'>负向</div><blockquote class='a-quote'>引用</blockquote>"
      + "<ul class='a-list'><li>条目</li></ul>。"
      + '可用类：a-card/a-kpi/a-h1/a-h2/a-table/a-chip/a-note/a-warn/a-ok/a-bad/a-quote/a-list/a-muted/a-accent/a-dim。'
      + '需要颜色时用 var(--aura-text|--aura-text-2|--aura-accent|--aura-surface|--aura-border)',
    downgrade_to: 'comparison_table',
    category: 'content',
  },
];


/** 降级链：某组件不支持时降级到哪 */
export function downgradeOf(type) {
  const hit = REGISTRY.find((r) => r.type === type);
  return hit?.downgrade_to ?? 'comparison_table';
}

/** 生成注入工具说明的 registry 文本 */
export function registryPrompt() {
  return REGISTRY.map(
    (r) =>
      `- ${r.type}: ${r.description}（适用: ${r.best_for.join('/')}）→ data: ${r.data_schema}`
  ).join('\n');
}
