export const money = (n: number) => (n < 0.01 ? '$' + n.toFixed(4) : '$' + n.toFixed(2));
export const ms = (n: number) => (n < 1000 ? `${Math.round(n)}ms` : `${(n / 1000).toFixed(1)}s`);
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
