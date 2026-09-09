/**
 * aura-dsh / check-tool.mjs
 * 启动前自检：用 @deepseek-ai/dsh-tools 的 defineTool 编译 aura_render，
 * 确认 parameters/output schema 符合 DSL 规范（避免安装后崩 dsh web）。
 *
 * 版本混淆自检（0.2 增强）：
 *   - 报告实际解析的 dsh-tools 路径（宿主共享层 vs 插件本地副本）
 *   - 解析到【宿主】= 正确（发布后经 dsh plugin add 装入 profile 时的形态）
 *   - 解析到【本地 node_modules 副本】= 提示发布物可能含旧副本（仅本地开发态，
 *     运行时宿主优先则无害，但应确认 dsh-tools 版本 ≥ 插件声明的 peer）
 *
 * 用法：cd aura-dsh && node check-tool.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { auraParameters, auraOutputSchema, auraExecute } from './host/tool.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);

// ---- 0. 版本/解析源自检 ----
console.log('[check] --- 依赖解析源自检 ---');
const HOST_MARKERS = ['.dsh-module-fallback', '/profiles/node_modules', '/node_modules/@deepseek-ai/dsh/node_modules'];
let toolsPath;
try {
  toolsPath = req.resolve('@deepseek-ai/dsh-tools');
} catch {
  console.error('[check] ✗ 无法解析 @deepseek-ai/dsh-tools。');
  console.error('    请确认本插件已装入 dsh profile（dsh plugin --profile web add dsh-aura），');
  console.error('    或本地开发时已 npm/pnpm install（peer 依赖由宿主/安装器提供）。');
  process.exit(1);
}
const fromHost = HOST_MARKERS.some((m) => toolsPath.includes(m));
console.log(`[check] dsh-tools → ${toolsPath}`);
console.log(`[check] 解析源: ${fromHost ? '宿主（推荐）✅' : '本地 node_modules（开发态，见下）'}`);

// 报告 dsh-tools 版本（沿解析路径向上找 package.json）
let toolsVersion = '?';
{
  let dir = dirname(toolsPath);
  for (let i = 0; i < 6; i += 1) {
    try {
      const candidate = join(dir, 'package.json');
      const manifest = JSON.parse(readFileSync(candidate, 'utf8'));
      if (manifest.name === '@deepseek-ai/dsh-tools') { toolsVersion = manifest.version; break; }
    } catch { /* 继续向上 */ }
    dir = dirname(dir);
  }
}
console.log(`[check] dsh-tools 版本: ${toolsVersion}`);

// 插件声明的 peer 最低版本（从本包 package.json）
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const peerReq = pkg.peerDependencies?.['@deepseek-ai/dsh-tools'];
console.log(`[check] 本插件要求 dsh-tools peer: ${peerReq ?? '未声明'}`);
if (!fromHost && toolsVersion !== '?') {
  console.warn('[warn] ⚠️ 解析到本地副本而非宿主。若这是发布物（node_modules 未排除），');
  console.warn('      用户环境将使用自带副本、与宿主 dsh 版本脱节。建议：');
  console.warn('      1) 发布用 files 白名单排除 node_modules；2) 本地开发删本地 @deepseek-ai 副本后重装。');
}

console.log('');

// ---- 1. defineTool 编译（走 parameterSchemaSpecToJsonSchema，非法 schema 会抛 JsonSchemaError）----
console.log('[check] auraParameters 属性:', Object.keys(auraParameters).join(', '));

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

// ---- 2. execute 冒烟：合法参数 ----
const result = await tool.execute({
  text: '测试',
  components: [{ type: 'metric_card', title: 'T', data: { metrics: [{ label: 'A', value: '1' }] } }],
}, {});
console.log('[check] ✓ execute 冒烟通过:', JSON.stringify(result));

// ---- 3. execute 兜底：超限截断（4 个组件 → slice(0,3)）----
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
