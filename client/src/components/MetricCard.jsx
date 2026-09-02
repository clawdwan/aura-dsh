/**
 * aura-dsh / client / src / components / MetricCard.jsx
 * 组件：metric_card（指标卡）—— antd 版（样板验证）。
 * data 结构：{ metrics?: MetricItem[] } 或 { items?: MetricItem[] }
 * MetricItem: { label, value, change?, size?: 'large' }
 * 涨跌判断：change 以 '+' 开头 → positive（绿），'-' 开头 → negative（红）。
 * 实现：antd Card + Statistic（子路径导入，见 P0 验证结论）。
 * 风格：暂用 antd 默认（token 映射后置）。
 */
import React from 'react';
import Card from 'antd/es/card';
import Statistic from 'antd/es/statistic';

const UP = '#3f8600';
const DOWN = '#cf1322';

export default function MetricCard({ title, data }) {
  const items = data?.metrics || data?.items || [];
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }}
      styles={{ body: { display: 'flex', gap: 16, flexWrap: 'wrap' } }}>
      {items.map((m) => {
        const chg = String(m.change || '');
        const color = chg.startsWith('+') ? UP : chg.startsWith('-') ? DOWN : undefined;
        return (
          <Statistic
            key={m.label}
            title={m.label}
            value={m.value}
            valueStyle={{ fontSize: m.size === 'large' ? 26 : 20, color, fontWeight: 600 }}
            suffix={m.change ? <span style={{ fontSize: 13, color }}>{m.change}</span> : undefined}
            styles={{ root: { flex: 1, minWidth: 120 } }}
          />
        );
      })}
    </Card>
  );
}
