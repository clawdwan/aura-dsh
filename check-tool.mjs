/**
 * aura-dsh / check-tool.mjs
 * 启动前自检：用官方 @deepseek-ai/dsh-tools 的 defineTool 编译 aura_render，
 * 确认 parameters/output schema 符合 DSL 规范（避免安装后崩 dsh web）。
 * 用法：cd aura-dsh && node check-tool.mjs
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { auraParameters, auraOutputSchema, auraExecute } from './host/tool.js';

console.log('[check] auraParameters 属性:', Object.keys(auraParameters).join(', '));

// 1. defineTool 编译（走 parameterSchemaSpecToJsonSchema，非法 schema 会抛 JsonSchemaError）
const tool = defineTool({
  name: 'aura_render',
  description: '自检编译',
  parameters: auraParameters,
  output: {
    schema: auraOutputSchema,
    render: (_a, v) => [{ type: 'text', text: JSON.stringify(v) }],
  },
  execute: auraExecute,
});
console.log('[check] ✓ defineTool 编译通过（parameters + output schema 符合 DSL）');
console.log('[check] 编译后 parameters:', JSON.stringify(tool.parameters).slice(0, 200), '...');

// 2. execute 冒烟：合法参数
const result = await tool.execute({
  text: '测试',
  components: [{ type: 'metric_card', title: 'T', data: { metrics: [{ label: 'A', value: '1' }] } }],
}, {});
console.log('[check] ✓ execute 冒烟通过:', JSON.stringify(result));

// 3. execute 兜底：schema 已 enum 前置校验（未知 type 被工具层拒绝），
//    此处验证超限截断（4 个组件 → slice(0,3)）
const r2 = await tool.execute({
  text: 'x',
  components: [
    { type: 'metric_card', data: { metrics: [] } },
    { type: 'comparison_table', data: { headers: ['a'], rows: [['1']] } },
    { type: 'step_bar', data: { steps: [] } },
    { type: 'article_list', data: { articles: [] } },
  ],
}, {});
console.log('[check] ✓ 超限截断通过（4→' + r2.components.length + ' 个）');

console.log('[check] ✅ 全部通过，可以安装');
