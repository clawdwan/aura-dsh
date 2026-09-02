/**
 * aura-dsh / client / src / components / ArticleList.jsx
 * 组件：article_list（信息/新闻条目列表）—— antd List 版。
 * data 结构：{ articles?: ArticleItem[] } 或 { items?: ArticleItem[] }
 * ArticleItem: { title?|text?, url?, summary?, source? }
 */
import React from 'react';
import Card from 'antd/es/card';
import List from 'antd/es/list';

export default function ArticleList({ title, data }) {
  const items = data?.articles || data?.items || [];
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }} styles={{ body: { padding: '8px 12px' } }}>
      <List
        size="small"
        dataSource={items}
        renderItem={(a) => (
          <List.Item style={{ padding: '6px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                  {a.title || a.text}
                </a>
              ) : (
                <div style={{ fontWeight: 600 }}>{a.title || a.text}</div>
              )}
              {a.summary ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{a.summary}</div> : null}
            </div>
            {a.source ? <div style={{ fontSize: 11, opacity: 0.5, marginLeft: 8, whiteSpace: 'nowrap' }}>{a.source}</div> : null}
          </List.Item>
        )}
      />
    </Card>
  );
}
