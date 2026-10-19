/**
 * aura-dsh / client / src / components / MetricCard.jsx
 * 组件：metric_card（指标卡）。
 *
 * MetricItem: { label, value, change?, size?: 'large', kind? }
 *   kind: 'amount' | 'count' | 'year' | 'ratio' | 'index'（缺省 = 不滚动、无千分位）
 *
 * 数字表现由语义决定，不靠客户端猜：
 *   - kind='amount'（金额/市值/营收）→ 千分位 + 从 0 滚动
 *   - 其他 / 缺省 → 原样显示（年份 2026 不会变 2,026，也不会滚动）
 *
 * 这样 agent 只需在「金额类」标 amount，其余不用管；漏标时行为保守可预测。
 */
import React from 'react';
import Card from 'antd/es/card';

const UP = '#3f8600';
const DOWN = '#cf1322';

/** 金额格式化：保留原小数位 + 千分位 */
function formatAmount(n, decimals) {
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 数字滚动（easeOutCubic）；enabled=false 时直接返回原值 */
function useCountUp(target, duration = 1100, enabled = true) {
  const numeric = React.useMemo(() => {
    if (typeof target === 'number') return target;
    const n = parseFloat(String(target ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }, [target]);

  const [value, setValue] = React.useState(enabled && numeric !== null ? 0 : target);

  React.useEffect(() => {
    if (!enabled || numeric === null) { setValue(target); return undefined; }
    if (typeof window === 'undefined') { setValue(numeric); return undefined; }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) { setValue(numeric); return undefined; }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(numeric * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(numeric);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric, target, duration, enabled]);

  return value;
}

export default function MetricCard({ title, data }) {
  const items = data?.metrics || data?.items || [];
  return (
    <Card
      size="small"
      title={title}
      style={{ margin: '4px 0' }}
      styles={{ body: { padding: '12px 14px' } }}
    >
      <div className="aura-metric-grid">
        {items.map((m, i) => (
          <MetricItem key={m.label ?? i} m={m} />
        ))}
      </div>
    </Card>
  );
}

function MetricItem({ m }) {
  const isAmount = m.kind === 'amount';
  const raw = m.value;
  const animated = useCountUp(raw, 1100, isAmount);

  // 小数位跟随原值（避免浮点尾巴）
  const decimals = React.useMemo(() => {
    const match = String(raw ?? '').match(/\.(\d+)/);
    return match ? match[1].length : 0;
  }, [raw]);

  const display = isAmount ? formatAmount(Number(animated), decimals) : String(raw ?? '');
  const chg = String(m.change || '');
  const chgColor = chg.startsWith('+') ? UP : chg.startsWith('-') ? DOWN : undefined;

  return (
    <div className="aura-metric-item">
      <div className="aura-metric-label">{m.label}</div>
      <div className="aura-metric-value" style={{ fontSize: m.size === 'large' ? 26 : 20 }}>
        {display}
        {chg ? <span className="aura-metric-change" style={{ color: chgColor }}>{chg}</span> : null}
      </div>
    </div>
  );
}
