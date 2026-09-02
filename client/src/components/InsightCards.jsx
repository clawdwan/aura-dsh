/**
 * aura-dsh / client / src / components / InsightCards.jsx
 * 组件：insight_cards（多维判断/风险卡片组）—— antd Card + Alert + Tag 版。
 * data 结构：{ cards: InsightCard[] }
 * InsightCard: { title, rating, body, level? }
 * level: 'info'|'warning'|'positive'|'negative' → Alert type 映射。
 */
import React from 'react';
import Card from 'antd/es/card';
import Alert from 'antd/es/alert';
import Tag from 'antd/es/tag';

const LEVEL_TO_TYPE = {
  info: 'info',
  warning: 'warning',
  positive: 'success',
  negative: 'error',
};

export default function InsightCards({ title, data }) {
  const cards = data?.cards || [];
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' } }}>
      {cards.map((c) => (
        <Alert
          key={c.title}
          type={LEVEL_TO_TYPE[c.level] || 'info'}
          message={
            <span>
              {c.title}
              {c.rating ? <Tag style={{ marginLeft: 8 }}>{c.rating}</Tag> : null}
            </span>
          }
          description={c.body}
          showIcon={false}
        />
      ))}
    </Card>
  );
}
