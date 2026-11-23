export function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="label">{title}</h2>{right}</div>
      {children}
    </section>
  );
}
export const btn = 'rounded-ctl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50';
export const btn2 = 'rounded-ctl border border-line bg-white px-3 py-2 text-sm text-ink hover:border-accent hover:text-accent disabled:opacity-50';
export const input = 'w-full rounded-ctl border border-line bg-white px-3 py-2 text-sm tabular-nums text-ink';
