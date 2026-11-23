import type { Config } from 'tailwindcss';
/*
 * Palette rationale: Lane Risk Desk is a disruption tool, so the brand accent is deep crimson (#9f1239,
 * hover #881337): risk-desk character, outside the indigo/violet band, not cream/serif/sage, and distinct
 * from the sibling demos (navy / teal / bronze). Ground is near-white with hairlines. Green and red appear
 * only to signal cost-delta direction and corridor status, never as decoration.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#fbfbfc', ink: '#16181d', mute: '#596070', line: '#e3e5ea', wash: '#f3f4f6',
        accent: { DEFAULT: '#9f1239', hover: '#881337' },
        good: '#166534', bad: '#b91c1c', caution: '#9a3412', watch: '#854d0e',
      },
      borderRadius: { card: '10px', ctl: '8px' },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
