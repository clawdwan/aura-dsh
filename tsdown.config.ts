/**
 * aura-dsh / tsdown.config.ts
 * client 半构建：client/src/index.jsx → CJS 原始产物（client/dist/client.raw.cjs），
 * 再由 scripts/wrap-client.mjs 包装成 DSH 要求的 window.__ModuleLoader__.load 格式。
 * - format: ['cjs']：DSH client 模块系统要求 CJS factory（见 dsh-client-modules README）
 * - react/react-dom 由 app-shell 静态注册（registerStatic），不打包（external）
 * - antd/echarts 及依赖树打进 bundle（DSH shell 不提供）—— P0 验证定案：
 *   必须子路径导入 + alwaysBundle 正则覆盖依赖树（否则浏览器 require('antd') 失败）
 * - css.inject: false：样式由 index.jsx 运行时注入（auraCss 字符串）
 */
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'client.raw': 'client/src/index.jsx',
  },
  format: ['cjs'],
  outDir: 'client/dist',
  clean: true,
  css: {
    inject: false,
  },
  // antd/echarts 代码引用 process.env.NODE_ENV，浏览器无 process → 构建时替换
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  // DSH 模块加载器只加载 client.js（不含额外 chunk），
  // 因此内联所有动态导入，避免产物被拆成加载不到的文件
  outputOptions: {
    inlineDynamicImports: true,
  },
  deps: {
    // DSH shell 提供的基础（react 等）保持 external；antd/echarts 依赖树必须打包
    neverBundle: [
      'react',
      'react-dom',
      '@deepseek-ai/dsh-client-runtime',
      '@deepseek-ai/dsh-client-locale',
      '@deepseek-ai/dsh-client-ui-tool',
      '@deepseek-ai/dsh-client-ui-slots',
      '@deepseek-ai/dsh-api-remotes',
      '@deepseek-ai/cordis',
    ],
    alwaysBundle: [/^(antd|echarts|@xyflow|@dagrejs|graphlib|d3|khroma|dompurify|cytoscape|stylis|ts-dedent|marked|@iconify|elkjs|katex|roughjs|uuid|micromark|mdast|unist|vfile|rc-|@rc-component|@ant-design|@babel\/runtime|modern-screenshot)/],
  },
});
