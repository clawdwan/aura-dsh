/**
 * aura-dsh / client / src / AuraTurnTail.jsx
 * conversation.chat.turnTail 渲染器：把本 turn 的 aura_render 组件渲染在 turn 尾部。
 *
 * 为什么用 turnTail（而非 tool.call.toolview）：
 *   DSH 0.2.0 起，工具调用归入 Turn 的“工作过程”（process disclosure），
 *   完成后会被折叠；turn-tail 在 TURN_PROCESS_INDEPENDENT_KINDS 白名单内，
 *   不随过程折叠 —— 组件因此常驻可见（与官方 deliverables / schedule 同机制）。
 *
 * 数据来源：auraDefinition 将本 Turn 的 aura_render 调用聚合后发布到
 *   turn 数据（key='aura'），此处通过 props.turn.data.get('aura') 读取。
 */
import React from 'react';
import { renderComponent } from './AuraToolRow';

export default function AuraTurnTail(props) {
  const data = props?.turn?.data?.get?.('aura');
  const calls = Array.isArray(data?.calls) ? data.calls : [];
  const renderable = calls.filter((c) => Array.isArray(c.components) && c.components.length > 0);
  if (renderable.length === 0) return null;

  return (
    <div className="aura-turn-tail">
      {renderable.map((c) => (
        <div key={c.callId || String(c.seq)} className="aura-turn-tail-item">
          {c.text ? <div className="aura-fallback">{c.text}</div> : null}
          {c.components.map((comp, i) => renderComponent({ ...comp, key: `${c.callId}-${i}` }))}
        </div>
      ))}
    </div>
  );
}
