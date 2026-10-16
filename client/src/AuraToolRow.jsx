/**
 * aura-dsh / client / src / AuraToolRow.jsx
 * tool.call.toolview keyed 渲染器（key='aura_render'）。
 * 职责：从 props.block 读取工具结果 → 解析 {text, components[]} → 按 type 分派组件。
 *
 * 数据路径（与 define/client-body.js 完全一致）：
 *  1. block.content 数组（ToolResultNode 的标准结果载体）：
 *     {type:'text', text}   → 取 text
 *     {type:'json', value}  → 字符串原样 / 对象 JSON.stringify
 *     循环内后者覆盖前者（取最后一个匹配块）。
 *  2. 兜底旧路径：block.result.value ?? block.result ?? block.output。
 *  3. 运行中（RunningToolCall）保底：block.call.argsRaw JSON.parse。
 *  解析结果 {text, components}；components 为空 → 降级为 fallback 文本。
 */
import React from 'react';
import MetricCard from './components/MetricCard';
import ComparisonTable from './components/ComparisonTable';
import StepBar from './components/StepBar';
import InsightCards from './components/InsightCards';
import ArticleList from './components/ArticleList';
import TrendChart from './components/TrendChart';
import Diagram from './components/Diagram';
import Graph from './components/Graph';
import DataTree from './components/DataTree';
import Timeline from './components/Timeline';

/** 按 comp.type 分派到 8 个组件；未知类型降级为 JSON fallback。 */
export function renderComponent(comp) {
  switch (comp?.type) {
    case 'metric_card':
      return <MetricCard key={comp.title || 'm'} title={comp.title} data={comp.data} />;
    case 'comparison_table':
      return <ComparisonTable key={comp.title || 't'} title={comp.title} data={comp.data} />;
    case 'step_bar':
      return <StepBar key={comp.title || 's'} title={comp.title} data={comp.data} />;
    case 'insight_cards':
      return <InsightCards key={comp.title || 'i'} title={comp.title} data={comp.data} />;
    case 'article_list':
      return <ArticleList key={comp.title || 'a'} title={comp.title} data={comp.data} />;
    case 'trend_chart':
      return <TrendChart key={comp.title || 'c'} title={comp.title} data={comp.data} />;
    case 'graph':
      return <Graph key={comp.title || 'g'} title={comp.title} data={comp.data} />;
    case 'diagram':
      return <Diagram key={comp.title || 'd'} title={comp.title} data={comp.data} />;
    case 'data_tree':
      return <DataTree key={comp.title || 'd'} title={comp.title} data={comp.data} />;
    case 'timeline':
      return <Timeline key={comp.title || 'l'} title={comp.title} data={comp.data} />;
    default:
      return <div className="aura-fallback">{JSON.stringify(comp?.data || comp)}</div>;
  }
}

/**
 * @param props ToolCallOwnerProps: {callId, toolName, block, cwd, openFile, inspect}
 * block 是 ToolCallBlock = RunningToolCall | ToolResultNode
 */
export default function AuraToolRow(props) {
  const block = props?.block;
  let raw = null;
  if (block && Array.isArray(block.content)) {
    for (const c of block.content) {
      if (c && c.type === 'text' && typeof c.text === 'string') raw = c.text;
      else if (c && c.type === 'json') raw = typeof c.value === 'string' ? c.value : JSON.stringify(c.value);
    }
  }
  // 兜底：旧路径（兼容其他 block 形态）
  if (raw === null) raw = block?.result?.value ?? block?.result ?? block?.output ?? null;
  if (raw === null && typeof block?.call?.argsRaw === 'string') {
    // 运行中：从调用参数提取（极少用，保底）
    try {
      const a = JSON.parse(block.call.argsRaw);
      raw = a;
    } catch {
      /* ignore */
    }
  }
  // 解析结果 {text, components}
  let result = null;
  if (typeof raw === 'string') {
    try {
      result = JSON.parse(raw);
    } catch {
      result = { text: raw, components: [] };
    }
  } else if (raw && typeof raw === 'object') {
    result = raw;
  }
  const text = typeof result?.text === 'string' ? result.text : '';
  const components = Array.isArray(result?.components) ? result.components : [];

  if (components.length === 0) {
    return <div className="aura-fallback">{text || '（无视觉组件）'}</div>;
  }
  return (
    <div>
      {text ? <div className="aura-fallback">{text}</div> : null}
      {components.map(renderComponent)}
    </div>
  );
}
