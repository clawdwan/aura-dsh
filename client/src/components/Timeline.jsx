/**
 * aura-dsh / client / src / components / Timeline.jsx
 * 时间线组件 —— antd Timeline 版（v6 支持 orientation: 'horizontal'）。
 * 数据：{ events: [{ time|date, title|text, description?, color?: positive|negative|neutral }], orientation?: 'vertical'|'horizontal' }
 */
import React from 'react';
import Card from 'antd/es/card';
import Timeline from 'antd/es/timeline';

const DOT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#4f8cff',
};

export default function TimelineViz({ title, data }) {
  const events = data?.events || [];
  const orientation = data?.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  if (events.length === 0) {
    return <div className="aura-fallback">（时间线为空）</div>;
  }
  const items = events.map((e) => ({
    color: DOT_COLORS[e.color] || DOT_COLORS.neutral,
    children: (
      <div>
        {e.time || e.date ? <div style={{ fontSize: 11, opacity: 0.7 }}>{e.time || e.date}</div> : null}
        <div style={{ fontWeight: 600 }}>{e.title || e.text}</div>
        {e.description ? <div style={{ fontSize: 12, opacity: 0.7 }}>{e.description}</div> : null}
      </div>
    ),
  }));
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }} styles={{ body: { padding: '12px 16px' } }}>
      <Timeline orientation={orientation} items={items} />
    </Card>
  );
}
