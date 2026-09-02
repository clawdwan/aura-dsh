/**
 * aura-dsh / client / src / components / DataTree.jsx
 * 思维导图/树干图 —— ECharts tree 版（orient: 'LR' 左→右）。
 * 数据：{ root: { label, value?, children: [{ label, value?, children... }] } }
 * ECharts tree data 格式：{ name, value?, children: [...] }
 */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TreeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TreeChart, TooltipComponent, CanvasRenderer]);

/** 转换 Aura tree 数据 → ECharts tree data（label→name, value 保留） */
function toEchartsTree(node) {
  if (!node) return { name: '?' };
  const out = { name: node.label ?? '?', value: node.value };
  if (node.children && node.children.length > 0) {
    out.children = node.children.map(toEchartsTree);
  }
  return out;
}

function buildOption(data) {
  const treeData = toEchartsTree(data?.root || { label: '?' });
  return {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [{
      type: 'tree',
      orient: 'LR',
      symbolSize: 8,
      initialTreeDepth: -1,
      data: [treeData],
      left: 8,
      right: 60,
      top: 16,
      bottom: 16,
      label: { position: 'right', verticalAlign: 'middle', align: 'left', fontSize: 12 },
      leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
      lineStyle: { color: 'rgba(128,128,128,0.4)', width: 1.5 },
      emphasis: { focus: 'descendant' },
    }],
  };
}

export default function DataTree({ title, data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(buildOption(data), true);
  }, [data]);

  return (
    <div style={{ margin: '4px 0' }}>
      {title ? <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div> : null}
      <div ref={ref} style={{ width: '100%', height: 320 }} />
    </div>
  );
}
