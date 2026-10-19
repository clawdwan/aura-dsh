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
import React from 'react';
import auraCss from './styles';
import AuraToolRow from './AuraToolRow';
import AuraTurnTail from './AuraTurnTail';
import { auraDefinition } from './auraDefinition';
import AuraPanel from './AuraPanel';
import { createPanelAutoOpen } from './panelAutoOpen';

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

export const inject = ['slots', 'uiConversation', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.session', 'conversation', 'sessions'];

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

  // ==== SPIKE V1：右侧栏 tab ====
  try {
    ctx.sidebarRightTabs.register({
      id: 'dsh-aura-panel',
      kind: 'aura-panel',
      priority: 'extension',
      multiple: false,
      keepMounted: true,
      title: () => 'Aura 面板',
    });
    ctx.slots.inject('sidebar.right.pane.tab', () => {
      const AuraPanelBody = (props) => (
        <AuraPanel
          key={props?.sessionId}
          {...props}
          __auraSend={(t) => {
            const sid = props?.sessionId;
            if (!sid) return Promise.reject(new Error('aura: 面板缺少 sessionId'));
            // 用全局 RPC（不依赖 session scope）：session/prompt
            // 直接传 SessionPromptRequest 字段（client 侧 remote 由框架包信封；
            // 外壳 {request:{...}} 会被判 gateway/input-invalid）
            return ctx.remote.session.prompt({
              requestId: `aura-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              sessionId: sid,
              mode: 'queue',
              content: [{ type: 'text', text: t }],
            });
          }}
        />
      );
      return ctx.slots.register({ name: 'sidebar.right.pane.tab', key: 'dsh-aura-panel' }, AuraPanelBody);
    });
    // 面板自动打开：策略集中在 panelAutoOpen.js（间隔/开关/是否按历史卡片打开都可配），
    // 便于后续整体替换（例如改 host 推送或提示而非打开）。
    ctx.effect(() => {
      const controller = createPanelAutoOpen({
        sidebarRight: ctx.sidebarRight,
        sessions: ctx.sessions,
        tabKind: 'aura-panel',
      });
      controller.start();
      return () => controller.stop();
    });
  } catch (e) {
    console.error('[aura-spike] rightbar 注册失败:', e?.message ?? e);
  }
}
