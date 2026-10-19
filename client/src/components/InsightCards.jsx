/**
 * aura-dsh / client / src / components / InsightCards.jsx
 * 组件：insight_cards（多维判断/风险卡片组）—— Play 风格。
 * data 结构：{ cards: InsightCard[] }
 * InsightCard: { title, rating, body, level? }
 * level: 'info'|'warning'|'positive'|'negative' → 左侧强调色
 */
import React from 'react';
import Card from 'antd/es/card';

const LEVELS = new Set(['info', 'warning', 'positive', 'negative']);

export default function InsightCards({ title, data }) {
  const cards = data?.cards || [];
  return (
    <Card
      size="small"
      title={title}
      style={{ margin: '4px 0' }}
      styles={{ body: { padding: '10px 12px' } }}
    >
      <div className="aura-insight-list">
        {cards.map((c, i) => {
          const level = LEVELS.has(c.level) ? c.level : 'info';
          return (
            <div key={c.title ?? i} className={`aura-insight-item aura-insight-item--${level}`}>
              <div className="aura-insight-head">
                <span className="aura-insight-title">{c.title}</span>
                {c.rating ? <span className="aura-insight-rating">{c.rating}</span> : null}
              </div>
              {c.body ? <div className="aura-insight-body">{c.body}</div> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
