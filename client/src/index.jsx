/**
 * aura-dsh / client / src / index.jsx
 * 候选2 静态插件（tsdown 构建）的 client 半入口。
 * 导出 cordis client 插件 { name, inject, apply }：
 *  - name:    插件名（构建后由包清单 dsh.client 声明为主，此处导出作约定）
 *  - inject:  依赖服务 ['slots']（keyed 渲染器注册表）
 *  - apply:   注册 tool.call.toolview keyed 渲染器（key='aura_render'）
 *
 * 样式：auraCss 字符串 + <style data-plugin-css> 运行时注入
 * （官方 dsh-client-ui-tool 同款模式，见其 lib/client.js 的 css 注入）。
 * 注册模式与 define/client-body.js 完全一致。
 */
import auraCss from './styles';
import AuraToolRow from './AuraToolRow';
import AuraTurnTail from './AuraTurnTail';
import { auraDefinition } from './auraDefinition';

// 运行时注入 <style>（幂等：已注入则跳过；页面刷新后 bundle 重载会重新注入）
const AURA_CSS_TAG = 'data-plugin-css="dsh-aura"';
if (typeof document !== 'undefined' && !document.querySelector(`style[${AURA_CSS_TAG}]`)) {
  const tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-aura';
  tag.dataset.pluginCss = 'dsh-aura';
  tag.textContent = auraCss;
  document.head.appendChild(tag);
}

export const name = 'aura-client';

export const inject = ['slots', 'uiConversation'];

export function apply(ctx) {
  ctx.slots.inject('tool.call.toolview', () =>
    ctx.slots.register({ name: 'tool.call.toolview', key: 'aura_render' }, AuraToolRow)
  );
  // 把 aura_render 调用聚合成 turn 数据（供 turnTail 渲染）
  ctx.uiConversation.events.register(auraDefinition);
  // turnTail：在 turn 尾部渲染组件（不随工作过程折叠）
  ctx.slots.inject('conversation.chat.turnTail', () =>
    ctx.slots.register({ name: 'conversation.chat.turnTail', id: 'dsh-aura' }, AuraTurnTail)
  );
}
