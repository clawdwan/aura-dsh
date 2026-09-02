/**
 * aura-dsh / scripts / wrap-client.mjs
 * 把 tsdown 的 CJS 原始产物包装成 DSH client 模块系统要求的格式：
 *   window.__ModuleLoader__.load({ id: '<包名>', factory: (require) => { <CJS 内容> } })
 * 依据：@deepseek-ai/dsh-client-modules README（lazy CJS model）
 *   —— 执行 bundle 只注册 factory；materialization 时 factory(require) → exports。
 * 用法：cd aura-dsh && node scripts/wrap-client.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'client/dist/client.raw.cjs');
const OUT = join(ROOT, 'client/dist/client.js');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const pkgId = pkg.name; // 'dsh-aura'

let raw = readFileSync(RAW, 'utf8');
// 去掉 tsdown CJS 产物尾部的 sourceMappingURL（保留无妨，但保持干净）
raw = raw.replace(/\/\/# sourceMappingURL=.*\n?$/, '');

// 官方产物结构参照：window.__ModuleLoader__.load({ id, factory: (require) => { var module={exports:{}}; var exports=module.exports; ...; return module.exports } })
// tsdown CJS 产物内部已用 exports / module.exports；包装时提供 module/exports 骨架并 return。
const wrapped = [
  'window.__ModuleLoader__.load({',
  `  id: ${JSON.stringify(pkgId)},`,
  '  factory: (require) => {',
  '    var module = { exports: {} };',
  '    var exports = module.exports;',
  '    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
  raw,
  '    return module.exports;',
  '  }',
  '});',
  '',
].join('\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, wrapped);
console.log(`[wrap] ${pkgId} client bundle → ${OUT} (${wrapped.length} bytes)`);
console.log('[wrap] 开头:', wrapped.slice(0, 120).replace(/\n/g, ' '));
