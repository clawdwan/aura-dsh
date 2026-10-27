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
import { createPanelSignal } from './panelSignal';

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

export const inject = ['slots', 'uiConversation', 'sidebarRightTabs', 'sidebarRight', 'remote', 'remote.session', 'conversation', 'sessions', 'shortcuts'];

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

  // ==== 右侧栏面板：多 tab（按卡片 tab 字段动态注册） ====
  try {
    // tabKey -> 注册清理函数；main 复用既有 kind 'aura-panel' 以兼容已保存布局
    const registeredTabs = new Map();
    const kindOf = (tabKey) => (tabKey === 'main' ? 'aura-panel' : `aura-panel:${tabKey}`);
    const idOf = (tabKey) => (tabKey === 'main' ? 'dsh-aura-panel' : `dsh-aura-panel:${tabKey}`);

    const makeSend = (props) => (t) => {
      const sid = props?.sessionId;
      if (!sid) return Promise.reject(new Error('aura: 面板缺少 sessionId'));
      return ctx.remote.session.prompt({
        requestId: `aura-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionId: sid,
        mode: 'queue',
        content: [{ type: 'text', text: t }],
      });
    };

    const makePanelBody = (tabKey) => (props) => (
      <AuraPanel
        key={`${props?.sessionId}:${tabKey}`}
        {...props}
        tabKey={tabKey}
        __auraSend={makeSend(props)}
      />
    );

    /** 幂等注册一个 tab 类型及其 body；返回其 kind */
    const ensureTab = (rawTabKey, rawTitle) => {
      const tabKey = typeof rawTabKey === 'string' && rawTabKey.trim() ? rawTabKey.trim() : 'main';
      const kind = kindOf(tabKey);
      if (registeredTabs.has(tabKey)) return kind;
      const id = idOf(tabKey);
      const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : undefined;
      try {
        const disposeTab = ctx.sidebarRightTabs.register({
          id,
          kind,
          priority: 'extension',
          multiple: false,
          keepMounted: true,
          title: () => title ?? (tabKey === 'main' ? 'Aura 面板' : tabKey),
        });
        const disposeInject = ctx.slots.inject('sidebar.right.pane.tab', () =>
          ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id }, makePanelBody(tabKey))
        );
        registeredTabs.set(tabKey, () => {
          try { disposeInject?.(); } catch { /* ignore */ }
          try { disposeTab?.(); } catch { /* ignore */ }
        });
      } catch (err) {
        console.error('[aura-panel] tab 注册失败:', tabKey, err?.message ?? err);
      }
      return kind;
    };

    // 默认 main tab 始终存在
    ensureTab('main');

    // 事件驱动打开：按推送卡片的 tab 字段路由到对应 tab（没有则先注册）
    ctx.effect(() => {
      const signal = createPanelSignal({
        sessions: ctx.sessions,
        sidebarRight: ctx.sidebarRight,
        config: { tabKind: kindOf('main'), restoreOnHistory: true },
        resolveTargets: (event) => {
          let card = null;
          try {
            card = JSON.parse(event?.data?.arguments ?? '{}')?.card ?? null;
          } catch { card = null; }
          const tabKey = card?.tab ?? 'main';
          const kind = ensureTab(tabKey, card?.tabTitle);
          return [kind];
        },
      });
      const stop = signal.start();
      try {
        window.__auraProbe = () => signal.probe();
      } catch { /* ignore */ }
      return () => {
        try { stop?.(); } catch { /* ignore */ }
        try { delete window.__auraProbe; } catch { /* ignore */ }
        for (const dispose of registeredTabs.values()) {
          try { dispose?.(); } catch { /* ignore */ }
        }
        registeredTabs.clear();
      };
    });

    // 快捷键：⌥S（Mac）/ Alt+S → 进入圈选提问
    // 由 DSH 快捷键系统注册，用户可在「设置 → 快捷键」里改键
    try {
      const disposeShortcut = ctx.shortcuts.register({
        id: 'aura-selection',
        label: () => 'Aura 圈选提问',
        aliases: ['aura-select', 'selection-ask'],
        // ShortcutProfile = `${runtime}:${platform}`，platform 取 macos|windows|linux。
        // 注意：Web 端只允许「3+ 修饰键」或「primary(⌘/Ctrl)+alt|shift」的组合——
        // 单 Alt+字母会被浏览器/输入法占用，DSH 会拒绝（Unsupported Web shortcut）。
        // 因此用 ⌘⌥S（Mac）/ Ctrl+Alt+S（Win/Linux），用 primary 自动跨平台。
        // 只声明 macos / windows 的默认键：
        // Web 端 isWebBindingAllowed 对 linux 走固定白名单（自定义组合一律拒绝），
        // 声明 linux 默认会导致整个注册抛错；linux 用户可在设置里自行绑定。
        defaults: {
          'web:macos': { code: 'KeyS', modifiers: ['primary', 'alt'] },
          'desktop:macos': { code: 'KeyS', modifiers: ['primary', 'alt'] },
          'web:windows': { code: 'KeyS', modifiers: ['primary', 'alt'] },
          'desktop:windows': { code: 'KeyS', modifiers: ['primary', 'alt'] },
        },
        regions: ['page'],
        modals: [],
        resolve: () => ({
          status: 'handled',
          run() {
            try {
              window.dispatchEvent(new CustomEvent('aura:enter-select'));
            } catch (err) {
              console.error('[aura-shortcut] 派发失败:', err?.message ?? err);
            }
          },
        }),
      });
      ctx.effect(() => () => {
        try { disposeShortcut?.(); } catch { /* ignore */ }
      });
      console.log('[aura-shortcut] 已注册 ⌥S / Alt+S（可在 DSH 设置里改）');
    } catch (err) {
      console.error('[aura-shortcut] 注册失败:', err?.message ?? err);
    }
  } catch (e) {
    console.error('[aura-spike] rightbar 注册失败:', e?.message ?? e);
  }
}
