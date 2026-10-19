/**
 * aura-dsh / client / src / auraTheme.js
 * Play 风的 antd 主题配置 —— 统一面板/对话流里所有 antd 组件的外观。
 *
 * 设计语言（与 Graph 组件的 Play 风一致）：
 *  - 圆角 8~10px、轻阴影（克制、不堆叠边框）
 *  - 强调色 = DeepSeek 品牌蓝（--dsw-static-deepseek-500 的值）
 *  - 小标签：大写 + 字距（见 styles.js 的 .aura-* 覆盖）
 */

/** DeepSeek 品牌蓝（与 DSH 色阶 token 对齐） */
export const AURA_ACCENT = '#4176e6';
export const AURA_ACCENT_SOFT = '#edf3fe';

export const auraTheme = {
  // 只配置确认合法的 token；其余视觉细节统一交给 styles.js 的 CSS 覆盖（更稳、不受 antd token 名变动影响）
  token: {
    colorPrimary: AURA_ACCENT,
    colorLink: AURA_ACCENT,
    borderRadius: 8,
    borderRadiusLG: 10,
    fontSize: 13,
    lineHeight: 1.5,
  },
  components: {
    Card: {
      paddingLG: 14,
      colorBorderSecondary: 'transparent',
    },
    Alert: {
      paddingContentHorizontal: 12,
    },
    Table: {
      headerBg: 'transparent',
    },
  },
};

export default auraTheme;
