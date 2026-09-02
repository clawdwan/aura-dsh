/**
 * aura-dsh / host / tool.js
 * aura_render 工具定义（host 半）—— 候选2 静态 cordis 插件包的 host 主入口。
 *
 * 标准 cordis 插件形态：export { apply, inject, name }（对照参考实现
 * @deepseek-ai/dsh-tool-ask-user/lib/index.js 的 name/inject/apply 三段式）。
 *
 * 参数 schema 规范（重要，2026-08-31 修复）：
 * DSH 静态插件（ctx.tools.register(defineTool(...))）的参数 schema 用
 * 【属性映射模式】（property map）—— 顶层是 { 属性名: 值schema }，
 * 属性级 required 是【布尔 true】（不是数组），嵌套对象递归同构。
 * 不是 raw JSON Schema（{type:'object', properties, required:['x']}）。
 * 依据：dsh-tools 的 parameterSchemaSpecToJsonSchema / runSchemaCompiler
 * （@deepseek-ai/dsh-tools/lib/index.js:599-647，属性 required 必须为 true）。
 * 动态插件（候选1 harness.defineTool）是另一套 raw 模式，两者不同。
 */

import { defineTool } from '@deepseek-ai/dsh-tools';
import { repairComponentsJson } from './json-repair.js';
import { registryPrompt, downgradeOf } from './registry.js';

const name = 'aura-render-host';
const inject = ['tools'];

const COMPONENT_TYPES = ['comparison_table', 'metric_card', 'step_bar', 'insight_cards', 'article_list', 'trend_chart', 'data_tree', 'timeline'];

/** aura_render 参数 schema（property map 模式，符合 dsh-tools DSL）。 */
export const auraParameters = {
  text: {
    type: 'string',
    required: true,
    description: '精简文字总结（2-3句），不要重复组件中已有的数据',
  },
  components: {
    type: 'array',
    required: true,
    description: '视觉组件数组（最多 3 个，超出自动截断）',
    items: {
      type: 'object',
      additionalProperties: true,
      properties: {
        type: {
          type: 'string',
          required: true,
          enum: COMPONENT_TYPES,
          description: '组件类型：comparison_table(多维表格) / metric_card(关键指标) / step_bar(流程层级) / insight_cards(多维判断) / article_list(信息条目)',
        },
        title: {
          type: 'string',
          description: '组件标题',
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: '组件数据，结构取决于 type',
        },
      },
    },
  },
};

/** aura_render 输出 schema（value schema 模式）。 */
export const auraOutputSchema = {
  type: 'object',
  additionalProperties: true,
};

/** aura_render 执行逻辑（独立导出供自检/测试）。 */
export async function auraExecute(args, exec) {
  // 参数已是对象（工具层已 parse），但 data 字段可能是畸形字符串 → 兜底修复
  let components = Array.isArray(args.components) ? args.components : [];
  if (typeof args.components === 'string') {
    const repaired = repairComponentsJson(args.components);
    if (repaired) components = repaired.components;
  }
  // 逐组件校验：未知 type 降级为 comparison_table（schema enum 已前置校验，此为防御兜底）
  components = components
    .filter((c) => c && typeof c === 'object' && c.type)
    .map((c) => {
      if (!COMPONENT_TYPES.includes(c.type)) {
        return { ...c, type: downgradeOf(c.type), downgradedFrom: c.type };
      }
      return c;
    })
    .slice(0, 3);
  return { text: typeof args.text === 'string' ? args.text : '', components };
}

function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'aura_render',
    description: [
      '将内容以视觉组件形式渲染进对话流。当你有结构化数据需要呈现（表格/指标/流程/洞察/列表）时调用。',
      '组件注册表（按内容类型选择最合适的，最多 3 个）：',
      registryPrompt(),
      '选择规则：',
      '1) 多行多列对比数据 → comparison_table（最常用）',
      '2) 关键指标集合 → metric_card（single value + change）',
      '3) 流程/层级/阶段 → step_bar',
      '4) 多维度判断/风险/结论 → insight_cards',
      '5) 多条信息条目 → article_list',
      '6) 时间序列走势/趋势 → trend_chart（chart_type: line/bar/area，series: [{name, data:[{x,y}]}]）',
      '7) 层级归属/思维导图 → data_tree（root: {label, children}）',
      '8) 时间顺序事件 → timeline（events: [{time, title}]）',
      '规则：data 必须填满关键字段；text 字段写精简总结（2-3 句）不复述组件数据；数据不匹配 schema 时降级为文字。',
    ].join('\n'),
    parameters: auraParameters,
    output: {
      schema: auraOutputSchema,
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    async execute(args, exec) {
      return auraExecute(args, exec);
    },
  }));
}

export { apply, inject, name };
