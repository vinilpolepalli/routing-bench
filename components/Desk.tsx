'use client';
import { useState } from 'react';
import { btn, btn2, input, Panel } from './ui';
import { money, ms, pct, fmtDate } from '@/lib/format';
import type { DecisionView, InboxRequest, ModelProfile, Policy, RouteResult } from '@/lib/types';

const PRESETS: { id: string; label: string }[] = [
  { id: 'quality-first', label: 'Quality first' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'cost-first', label: 'Cost first' },
];

function Rationale({ result }: { result: RouteResult }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-ctl border border-line">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead><tr className="label border-b border-line bg-[#fafafa]">
          <th className="px-3 py-2 font-semibold">Profile</th><th className="px-3 py-2 text-right font-semibold">Est. cost</th>
          <th className="px-3 py-2 text-right font-semibold">Est. latency</th><th className="px-3 py-2 text-right font-semibold">Quality fit</th>
          <th className="px-3 py-2 text-right font-semibold">Score</th><th className="px-3 py-2 font-semibold">Why</th>
        </tr></thead>
        <tbody>{result.candidates.map((c, i) => (
          <tr key={c.model.id} className={`border-b border-line last:border-0 ${i === 0 ? 'bg-accent/5' : ''}`}>
            <td className="px-3 py-2 font-medium">{c.model.label} <span className="text-mute">({c.model.tier})</span>{i === 0 && <span className="ml-1 rounded bg-accent px-1 text-[9px] uppercase text-white">routed</span>}</td>
            <td className="px-3 py-2 text-right tabular-nums">{money(c.costUsd)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{ms(c.latencyMs)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{pct(c.qualityFit)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{c.score.toFixed(3)}</td>
            <td className="px-3 py-2 text-mute">{c.notes.join('; ')}</td>
          </tr>
        ))}</tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-mute">
        Complexity {result.classification.complexity} ({result.classification.features.join(', ')}), about {result.classification.estTokens} tokens.
        Margin over runner-up {result.margin.toFixed(3)}. Policy weights: quality {pct(result.policy.quality)}, cost {pct(result.policy.cost)}, latency {pct(result.policy.latency)}.
        {result.observedSample > 0 ? ` ${result.observedSample} of your past ratings were folded in.` : ' No ratings from you yet, so fits are profile-based only.'}
      </p>
    </div>
  );
}

export default function Desk({ inbox, decisions: initialDecisions, initialPolicy, models, observed }: {
  inbox: InboxRequest[]; decisions: DecisionView[]; initialPolicy: Policy; models: ModelProfile[];
  observed: Record<string, { avg: number; n: number }>;
}) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const [pending, setPending] = useState(inbox);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const activePreset = PRESETS.find((p) => p.id === presetOf(initialPolicy))?.id ?? 'custom';
  const [preset, setPreset] = useState(activePreset);

  function presetOf(p: Policy) {
    if (p.quality === 0.85) return 'quality-first';
    if (p.cost === 0.6) return 'cost-first';
    if (p.quality === 0.5) return 'balanced';
    return 'custom';
  }

  async function call(url: string, init: RequestInit) {
    const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
    return body;
  }

  async function routeOne(key: string, payload: object, meta?: InboxRequest) {
    setBusy(key); setError('');
    try {
      const d = await call('/api/decisions', { method: 'POST', body: JSON.stringify(payload) });
      const view: DecisionView = {
        id: d.id, requestId: d.requestId, requestText: meta?.text ?? (payload as { text?: string }).text ?? '',
        channel: meta?.channel ?? '#custom', author: meta?.author ?? 'You',
        result: d.result, answer: d.answer, rating: null, createdAt: new Date().toISOString(),
      };
      setDecisions((ds) => [view, ...ds]);
      if (meta) setPending((ps) => ps.filter((r) => r.id !== meta.id));
      setOpen(d.id);
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  async function rate(id: string, value: 1 | -1) {
    try {
      await call('/api/ratings', { method: 'POST', body: JSON.stringify({ decisionId: id, value }) });
      setDecisions((ds) => ds.map((d) => (d.id === id ? { ...d, rating: value } : d)));
    } catch (e) { setError((e as Error).message); }
  }

  async function applyPreset(id: string) {
    setPreset(id); setError('');
    try { await call('/api/policy', { method: 'PUT', body: JSON.stringify({ preset: id }) }); }
    catch (e) { setError((e as Error).message); setPreset(activePreset); }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <Panel title="Routing policy" right={<span className="text-[11px] text-mute">applies to new routes</span>}>
          <div className="flex flex-wrap gap-2">{PRESETS.map((p) => (
            <button key={p.id} className={preset === p.id ? btn : btn2} onClick={() => applyPreset(p.id)}>{p.label}</button>
          ))}</div>
          <p className="mt-3 text-[11px] text-mute">Profiles: {models.map((m) => `${m.label} (${m.tier}, ${money(m.costPer1k)}/1k, ${ms(m.latencyMs)})`).join(' · ')}. Illustrative values, not any real provider's pricing.</p>
        </Panel>
        <Panel title={`Inbox (${pending.length} unrouted)`}>
          {pending.length === 0 && <p className="text-sm text-mute">All seeded requests routed. Add your own below.</p>}
          <ul className="space-y-3">{pending.map((r) => (
            <li key={r.id} className="rounded-ctl border border-line p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-mute"><span>{r.channel} · {r.author} · {r.tag}</span>
                <button className={btn2} disabled={busy === r.id} onClick={() => routeOne(r.id, { requestId: r.id }, r)}>{busy === r.id ? 'Routing…' : 'Route'}</button></div>
              <p className="text-sm text-ink">{r.text}</p>
            </li>
          ))}</ul>
        </Panel>
        <Panel title="Route your own message">
          <textarea className={input} rows={3} maxLength={4000} placeholder="Paste any workspace-style question…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-2 flex justify-end"><button className={btn} disabled={!text.trim() || busy === 'custom'} onClick={() => { const t = text.trim(); setText(''); routeOne('custom', { text: t }); }}>{busy === 'custom' ? 'Routing…' : 'Route it'}</button></div>
        </Panel>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div>
        <Panel title={`Routed decisions (${decisions.length})`} right={Object.keys(observed).length > 0 ? <span className="text-[11px] text-mute">your ratings shape future routes</span> : undefined}>
          {decisions.length === 0 && <p className="text-sm text-mute">Nothing routed yet. Route an inbox item to see the full rationale.</p>}
          <ul className="space-y-3">{decisions.map((d) => (
            <li key={d.id} className="rounded-ctl border border-line p-3">
              <button className="w-full text-left" onClick={() => setOpen(open === d.id ? null : d.id)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{d.result.chosen.model.label} <span className="font-normal text-mute">({d.result.chosen.model.tier})</span></span>
                  <span className="text-[11px] tabular-nums text-mute">{money(d.result.chosen.costUsd)} · {ms(d.result.chosen.latencyMs)} · {fmtDate(d.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-mute">{d.channel} · {d.author}: {d.requestText}</p>
              </button>
              {open === d.id && (
                <div className="mt-2">
                  <Rationale result={d.result} />
                  <pre className="mt-2 whitespace-pre-wrap rounded-ctl border border-line bg-[#fafafa] p-3 text-xs text-ink">{d.answer}</pre>
                  <div className="mt-2 flex items-center gap-2 text-xs text-mute">Rate this answer:
                    <button className={d.rating === 1 ? btn : btn2} onClick={() => rate(d.id, 1)}>Good</button>
                    <button className={d.rating === -1 ? btn : btn2} onClick={() => rate(d.id, -1)}>Poor</button>
                  </div>
                </div>
              )}
            </li>
          ))}</ul>
        </Panel>
      </div>
    </div>
  );
}
