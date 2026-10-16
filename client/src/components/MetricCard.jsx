/**
 * aura-dsh / client / src / components / MetricCard.jsx
 * 组件：metric_card（指标卡）—— antd 版（样板验证）。
 * data 结构：{ metrics?: MetricItem[] } 或 { items?: MetricItem[] }
 * MetricItem: { label, value, change?, size?: 'large' }
 * 涨跌判断：change 以 '+' 开头 → positive（绿），'-' 开头 → negative（红）。
 * 实现：antd Card + Statistic（子路径导入，见 P0 验证结论）。
 * 风格：暂用 antd 默认（token 映射后置）。
 */
import React from 'react';
import Card from 'antd/es/card';
import Statistic from 'antd/es/statistic';

const UP = '#3f8600';
const DOWN = '#cf1322';

/** 数字滚动动画（easeOutCubic）——把目标值解析成数字后从 0 滚上去。 */
function useCountUp(target, duration = 1100) {
  const numeric = React.useMemo(() => {
    if (typeof target === 'number') return target;
    const n = parseFloat(String(target ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }, [target]);
  const [value, setValue] = React.useState(numeric === null ? target : 0);

  React.useEffect(() => {
    if (numeric === null) { setValue(target); return undefined; }
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
  }, [numeric, target, duration]);

  return value;
}

export default function MetricCard({ title, data }) {
  const items = data?.metrics || data?.items || [];
  return (
    <Card size="small" title={title} style={{ margin: '4px 0' }}
      styles={{ body: { display: 'flex', gap: 16, flexWrap: 'wrap' } }}>
      {items.map((m) => {
        const chg = String(m.change || '');
        const color = chg.startsWith('+') ? UP : chg.startsWith('-') ? DOWN : undefined;
        return (
          <StatisticWithCountUp
            key={m.label}
            label={m.label}
            value={m.value}
            color={color}
            large={m.size === 'large'}
            change={m.change}
          />
        );
      })}
    </Card>
  );
}

/** 单个指标（带动画） */
function StatisticWithCountUp({ label, value, color, large, change }) {
  const animated = useCountUp(value, 1100);
  const chg = String(change || '');
  const chgColor = chg.startsWith('+') ? UP : chg.startsWith('-') ? DOWN : color;
  // 精度跟随原值的小数位（避免滚动过程中出现 2,174.6255770556145 这类浮点尾巴）
  const decimals = React.useMemo(() => {
    const m = String(value ?? '').match(/\.(\d+)/);
    return m ? m[1].length : 0;
  }, [value]);
  return (
    <Statistic
      title={label}
      value={animated}
      precision={decimals}
      groupSeparator=","
      valueStyle={{ fontSize: large ? 26 : 20, color, fontWeight: 600 }}
      suffix={change ? <span style={{ fontSize: 13, color: chgColor }}>{change}</span> : undefined}
      styles={{ root: { flex: 1, minWidth: 120 } }}
    />
  );
}

