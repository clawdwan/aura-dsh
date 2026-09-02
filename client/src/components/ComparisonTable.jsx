/**
 * aura-dsh / client / src / components / ComparisonTable.jsx
 * 组件：comparison_table（对比表格）—— antd Table 版（降配：分页/排序/筛选全关）。
 * data 结构：{ headers: string[], rows: string[][] }
 * 单元格经 dangerouslySetInnerHTML 渲染（支持富文本，与 viewer.html v-html 一致）。
 */
import React from 'react';
import Card from 'antd/es/card';
import Table from 'antd/es/table';

export default function ComparisonTable({ title, data }) {
  const headers = data?.headers || [];
  const rows = data?.rows || [];
  const columns = headers.map((h, ci) => ({
    title: h,
    dataIndex: `c${ci}`,
    key: `c${ci}`,
    render: (_, record) => <span dangerouslySetInnerHTML={{ __html: record[`c${ci}`] ?? '' }} />,
  }));
  const dataSource = rows.map((row, ri) => {
    const record = { key: ri };
    row.forEach((cell, ci) => { record[`c${ci}`] = cell; });
    return record;
  });
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }} styles={{ body: { padding: '8px 12px' } }}>
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
      />
    </Card>
  );
}
