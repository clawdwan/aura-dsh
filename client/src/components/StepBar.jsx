/**
 * aura-dsh / client / src / components / StepBar.jsx
 * 组件：step_bar（步骤条）—— antd Steps 版。
 * data 结构：{ steps: StepItem[] }
 * StepItem: { label, badge?, description? | desc? }
 */
import React from 'react';
import Card from 'antd/es/card';
import Steps from 'antd/es/steps';

export default function StepBar({ title, data }) {
  const steps = data?.steps || [];
  const items = steps.map((s, i) => ({
    title: s.label,
    description: s.description || s.desc,
    icon: s.badge ? <span style={{ fontSize: 12, fontWeight: 600 }}>{s.badge}</span> : undefined,
  }));
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }} styles={{ body: { padding: '12px 16px' } }}>
      <Steps size="small" current={steps.length - 1} status="process" items={items} />
    </Card>
  );
}
