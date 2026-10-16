/**
 * aura-dsh / client / src / components / Graph.jsx
 * 现代关系图组件 —— React Flow + @dagrejs/dagre 自动布局。
 *
 * 数据：{ title?, direction?: 'TB'|'LR', nodes: [{id, label, kind?}], edges: [{source, target, label?}] }
 *
 * 特点：
 *  - 节点是 **HTML/CSS**（不是 SVG 基础形状）→ 可用与 app 一致的现代视觉（Play 风）
 *  - 交互：画布缩放/平移，节点悬停上浮
 *  - 布局：@dagrejs/dagre 自动层次排布
 *  - agent 输出结构化 {nodes, edges}
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow, ReactFlowProvider, useReactFlow, Background, BackgroundVariant, Controls, Handle, Position, MarkerType,
} from '@xyflow/react';
import { theme as antdTheme } from 'antd';
import dagreImport from '@dagrejs/dagre';

// dagre 是 CJS 包：打包后 default 可能被包一层（{ default: exports }），这里做兼容
const dagre = dagreImport?.graphlib ? dagreImport : (dagreImport?.default ?? dagreImport);


const NODE_W = 156;
const NODE_H = 46;

/** 自定义节点：纯 HTML/CSS，视觉由 auraCss 控制（不用 React Flow 默认样式）。 */
function AuraNode({ data }) {
  return (
    <div className={`aura-graph-node${data?.kind ? ` aura-graph-node--${data.kind}` : ''}`}>
      <Handle type="target" position={Position.Top} className="aura-graph-handle" />
      {data?.tag ? <span className="aura-graph-node-tag">{data.tag}</span> : null}
      <span className="aura-graph-node-label">{data?.label}</span>
      <Handle type="source" position={Position.Bottom} className="aura-graph-handle" />
    </div>
  );
}

const nodeTypes = { aura: AuraNode };

/** 用 dagre 计算层次布局（返回带 position 的 React Flow 节点）。 */
function layoutWithDagre(nodes, edges, direction) {
  if (nodes.length === 0) return { nodes: [], edges };
  // dagre 不可用时回退：按纵向顺序简单堆叠（图仍可见，只是不精美）
  if (!dagre?.graphlib?.Graph) {
    console.warn('[aura-graph] dagre 不可用，使用简易布局回退');
    return {
      nodes: nodes.map((n, i) => ({ ...n, position: { x: 0, y: i * (NODE_H + 26) } })),
      edges,
    };
  }
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction === 'LR' ? 'LR' : 'TB', nodesep: 22, ranksep: 36, marginx: 6, marginy: 6 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);
  return {
    nodes: nodes.map((n) => {
      const p = g.node(n.id);
      return {
        ...n,
        position: {
          x: (p?.x ?? 0) - NODE_W / 2,
          y: (p?.y ?? 0) - NODE_H / 2,
        },
      };
    }),
    edges,
  };
}

export default function Graph({ title, data }) {
  const { token } = antdTheme.useToken();
  // 用 antd token 注入 CSS 变量（antd 的 colorPrimary 才是可靠品牌蓝；
  // DSH 的 --dsw-alias-brand-primary 是"对比前景色"，主色节点会变黑）
  const vars = {
    '--aura-graph-bg': token.colorBgContainer,
    '--aura-graph-bg-subtle': token.colorFillQuaternary,
    '--aura-graph-border': token.colorBorderSecondary,
    '--aura-graph-border-strong': token.colorBorder,        // 可见边框（标准边框色）
    '--aura-graph-line': token.colorBorder,
    '--aura-graph-text': token.colorText,
    '--aura-graph-muted': token.colorTextTertiary,
    '--aura-graph-node-fg-alt': token.colorText,            // 浅底节点用的深色前景
    '--aura-graph-text-secondary': token.colorTextSecondary,
    '--aura-graph-primary': token.colorPrimary,
    '--aura-graph-primary-bg': token.colorPrimaryBg,
    '--aura-graph-primary-border': token.colorPrimaryBorder,
    '--aura-graph-radius': `${token.borderRadius ?? 8}px`,
    // Play 风：默认节点用"主题最重的色"做实心块（浅色主题=近黑，深色主题=近白，自动适配）
    '--aura-graph-node-bg': token.colorText,
    '--aura-graph-node-fg': token.colorBgContainer,
    // 强调色 = DeepSeek 品牌蓝系（DSH 内置色阶 token，带硬编码兜底）
    '--aura-graph-accent': 'var(--dsw-static-deepseek-500, #4176e6)',        // 实心块（白字对比 ~4.7:1）
    '--aura-graph-accent-soft': 'var(--dsw-static-deepseek-100, #e4edfd)',   // 浅底（配深字）
    '--aura-graph-accent-border': 'var(--dsw-static-deepseek-400, #7aaaff)', // 边框
    '--aura-graph-dot': token.colorFillSecondary ?? 'rgba(0,0,0,0.12)',
  };
  const { flowNodes, flowEdges, height } = useMemo(() => {
    const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
    const rawEdges = Array.isArray(data?.edges) ? data.edges : [];
    const direction = data?.direction;

    const rfNodes = rawNodes
      .filter((n) => n && n.id !== undefined && n.id !== null)
      .map((n) => ({
        id: String(n.id),
        type: 'aura',
        draggable: false,
        data: { label: String(n.label ?? n.id), kind: n.kind, tag: n.tag ? String(n.tag) : undefined },
        position: { x: 0, y: 0 },
      }));

    const idSet = new Set(rfNodes.map((n) => n.id));
    const rfEdges = rawEdges
      .filter((e) => e && idSet.has(String(e.source)) && idSet.has(String(e.target)))
      .map((e, i) => ({
        id: String(e.id ?? `e-${i}`),
        source: String(e.source),
        target: String(e.target),
        label: e.label ? String(e.label) : undefined,
        type: 'default',   // 默认贝塞尔曲线（Play 风的柔和连线）
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      }));

    const laid = layoutWithDagre(rfNodes, rfEdges, direction);
    // 依据节点纵向跨度估算画布高度（避免固定高度造成大片空白或裁切）
    const ys = laid.nodes.map((n) => n.position.y);
    const span = ys.length ? Math.max(...ys) - Math.min(...ys) + NODE_H : NODE_H;
    return {
      flowNodes: laid.nodes,
      flowEdges: laid.edges,
      height: Math.min(520, Math.max(180, span + 64)),
    };
  }, [data]);

  if (flowNodes.length === 0) {
    return <div className="aura-graph-empty">（该图无节点）</div>;
  }

  return (
    <figure className="aura-graph">
      {title ? <figcaption className="aura-graph-title">{title}</figcaption> : null}
      <ReactFlowProvider>
        <GraphCanvas nodes={flowNodes} edges={flowEdges} height={height} vars={vars} />
      </ReactFlowProvider>
    </figure>
  );
}

/** 画布内层：容器尺寸变化时重新 fitView（面板宽度可拖拽，必须自适应）。 */
function GraphCanvas({ nodes, edges, height, vars }) {
  const { fitView } = useReactFlow();
  const boxRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try { fitView({ padding: 0.12, duration: 0 }); } catch { /* 忽略瞬时错误 */ }
      });
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [fitView]);

  return (
    <div ref={boxRef} className="aura-graph-canvas" style={{ height, ...vars }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.4} color="var(--aura-graph-dot, rgba(0,0,0,0.14))" />
        <Controls showInteractive={false} className="aura-graph-controls" />
      </ReactFlow>
    </div>
  );
}
