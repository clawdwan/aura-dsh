/**
 * aura-dsh / client / src / RadialMenu.jsx
 * 圈选后的径向菜单（饼状 / pie menu）。
 *
 * 命中规则：**只看角度**（Math.atan2），径向距离只用于区分「中心圆」与外部；
 * 鼠标拖多远都能选中当前方向的扇区，最小半径 28px 防中心抖动。
 *
 * 交互：
 *   - 鼠标移动到某扇区 → 高亮（停留 150ms 后允许确认，防误触）
 *   - 点击/松开 → 选中该扇区（直接发送常用问题）
 *   - 移入中心圆 → 高亮「自定义」→ 点击展开文本输入
 *   - 点击外部 / Esc → 取消
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const RADIAL_DEFAULTS = {
  /** 外环半径（px） */
  outerRadius: 110,
  /** 中心圆半径（px） */
  centerRadius: 40,
  /** 判定为"有效方向"的最小半径（px），小于它视为在中心附近 */
  minRadius: 28,
  /** 高亮停留多久后才允许选中（ms） */
  confirmDelay: 150,
};

/** 极坐标 → 笛卡尔（角度以度为单位，0° = 正右，顺时针为正） */
function polar(cx, cy, radius, degree) {
  const rad = (degree * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** 生成环形扇区路径 */
function sectorPath(cx, cy, inner, outer, startDeg, endDeg) {
  const p1 = polar(cx, cy, outer, startDeg);
  const p2 = polar(cx, cy, outer, endDeg);
  const p3 = polar(cx, cy, inner, endDeg);
  const p4 = polar(cx, cy, inner, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

/**
 * @param {object} props
 * @param {{x:number,y:number}} props.position - 菜单中心（相对定位祖先）
 * @param {Array<{label:string,prompt:string}>} props.options - 扇区选项（3–6 个）
 * @param {(option:object) => void} props.onSelect
 * @param {() => void} props.onCustom
 * @param {() => void} props.onCancel
 * @param {object} [props.config]
 */
export default function RadialMenu({ position, options, onSelect, onCustom, onCancel, config }) {
  const cfg = { ...RADIAL_DEFAULTS, ...(config ?? {}) };
  const { outerRadius, centerRadius, minRadius, confirmDelay } = cfg;
  const size = outerRadius * 2 + 24;
  const cx = size / 2;
  const cy = size / 2;

  const [hover, setHover] = useState(null); // 扇区索引 | 'center' | null
  const hoverSince = useRef(0);
  const rootRef = useRef(null);

  const count = Math.max(options?.length ?? 0, 1);
  const step = 360 / count;
  // 扇区从正上方开始（-90° 为 12 点方向），顺时针排列
  const startBase = -90 - step / 2;

  /** 由鼠标位置算出命中项 */
  const hitTest = useCallback((e) => {
    const el = rootRef.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const mx = e.clientX - box.left - size / 2;
    const my = e.clientY - box.top - size / 2;
    const dist = Math.hypot(mx, my);
    if (dist <= centerRadius) return 'center';
    if (dist < minRadius) return null;
    const deg = (Math.atan2(my, mx) * 180) / Math.PI; // -180~180
    for (let i = 0; i < count; i += 1) {
      const a = startBase + i * step;
      const b = a + step;
      // 归一化到与 deg 同区间比较
      const norm = (v) => ((v % 360) + 360) % 360;
      const d = norm(deg);
      const lo = norm(a);
      const hi = norm(b);
      const inside = lo <= hi ? d >= lo && d < hi : d >= lo || d < hi;
      if (inside) return i;
    }
    return null;
  }, [centerRadius, count, minRadius, size, startBase, step]);

  const commit = useCallback((target) => {
    if (target === null || target === undefined) return;
    if (target === 'center') { onCustom?.(); return; }
    const option = options?.[target];
    if (option) onSelect?.(option);
  }, [onCustom, onSelect, options]);

  const handleMove = useCallback((e) => {
    const next = hitTest(e);
    if (next !== hover) {
      setHover(next);
      hoverSince.current = performance.now();
    }
  }, [hitTest, hover]);

  const handleClick = useCallback((e) => {
    const target = hitTest(e);
    if (target === null) { onCancel?.(); return; }
    // 停留确认：避免鼠标掠过时误选
    if (performance.now() - hoverSince.current < confirmDelay) return;
    commit(target);
  }, [commit, confirmDelay, hitTest, onCancel]);

  // Esc 取消
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel?.(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const active = (i) => hover === i;

  return (
    <div
      ref={rootRef}
      className="aura-radial"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        width: size,
        height: size,
      }}
      onPointerMove={handleMove}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleClick}
      role="menu"
      aria-label="圈选提问选项"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 不透明圆形底：避免半透明色叠在卡片上发闷 */}
        <circle cx={cx} cy={cy} r={outerRadius + 3} className="aura-radial-base" />
        {options?.map((opt, i) => {
          const a = startBase + i * step;
          const b = a + step;
          const mid = (a + b) / 2;
          const labelPos = polar(cx, cy, (outerRadius + centerRadius) / 2 + 6, mid);
          return (
            <g key={opt.label}>
              <path
                d={sectorPath(cx, cy, centerRadius + 6, outerRadius, a + 1, b - 1)}
                className={`aura-radial-sector${active(i) ? ' is-active' : ''}`}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                className={`aura-radial-label${active(i) ? ' is-active' : ''}`}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {opt.label}
              </text>
            </g>
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={centerRadius}
          className={`aura-radial-center${hover === 'center' ? ' is-active' : ''}`}
        />
        <text
          x={cx}
          y={cy}
          className={`aura-radial-center-label${hover === 'center' ? ' is-active' : ''}`}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          自定义
        </text>
      </svg>
    </div>
  );
}
