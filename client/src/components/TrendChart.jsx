/**
 * aura-dsh / client / src / components / TrendChart.jsx
 * 趋势图组件 —— ECharts 版（echarts/core 按需）。
 * 数据：{ title, unit, chart_type: 'line'|'bar'|'area',
 *         series: [{ name, data: [{x, y}] }], dataPoints?: [{date, value}], highlight? }
 */
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

/** 归一化 series：[{name, points:[{x,y}]}] */
function normalizeSeries(data) {
  const list = [];
  if (Array.isArray(data?.series)) {
    for (const s of data.series) {
      const points = Array.isArray(s?.data)
        ? s.data.map((p) => ({ x: p?.x ?? p?.date ?? '', y: Number(p?.y ?? p?.value ?? NaN) }))
        : [];
      if (points.length > 0) list.push({ name: s?.name ?? '', points });
    }
  }
  if (list.length === 0 && Array.isArray(data?.dataPoints)) {
    const points = data.dataPoints.map((p) => ({ x: p?.date ?? p?.x ?? '', y: Number(p?.value ?? p?.y ?? NaN) }));
    if (points.length > 0) list.push({ name: '', points });
  }
  return list;
}

function buildOption(data) {
  const series = normalizeSeries(data);
  const chartType = data?.chart_type ?? 'line';
  const unit = data?.unit ?? '';
  const categories = series[0]?.points.map((p) => p.x) ?? [];
  return {
    // 画出动画：折线从左到右展开（录屏友好）
    animation: true,
    animationDuration: 1400,
    animationEasing: 'cubicOut',
    animationThreshold: 2000,
    grid: { left: 44, right: 16, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis' },
    legend: series.length > 1 ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 } : undefined,
    xAxis: { type: 'category', data: categories, axisTick: { show: false } },
    yAxis: { type: 'value', name: unit, scale: true },
    series: series.map((s) => ({
      name: s.name,
      type: chartType === 'bar' ? 'bar' : 'line',
      data: s.points.map((p) => p.y),
      smooth: chartType !== 'bar',
      showSymbol: s.points.length <= 20,
      areaStyle: chartType === 'area' ? { opacity: 0.15 } : undefined,
    })),
  };
}

export default function TrendChart({ title, data }) {
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
      {title ? <div className="aura-chart-title">{title}</div> : null}
      {/* clip-path 遮罩：让整张图（线+点+坐标区）像笔刷一样从左到右画出 */}
      <div className="aura-chart-draw">
        <div ref={ref} style={{ width: '100%', height: 240 }} />
      </div>
    </div>
  );
}
