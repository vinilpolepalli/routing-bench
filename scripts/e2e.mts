/** Smoke test against a running server: homepage 200, route a seeded request, rate it. */
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const jar: string[] = [];
async function call(path: string, init?: RequestInit) {
  const res = await fetch(base + path, { ...init, headers: { ...(init?.headers ?? {}), cookie: jar.join('; '), 'content-type': 'application/json' } });
  for (const c of res.headers.getSetCookie?.() ?? []) jar.push(c.split(';')[0]);
  return res;
}
const home = await call('/');
if (home.status !== 200) throw new Error(`home ${home.status}`);
const html = await home.text();
if (!html.includes('Routing') ) throw new Error('home missing heading');
const dec = await call('/api/decisions', { method: 'POST', body: JSON.stringify({ requestId: 'req-refund' }) });
if (dec.status !== 201) throw new Error(`decision ${dec.status}: ${await dec.text()}`);
const d = await dec.json();
if (!d.result?.chosen?.model?.id || !d.answer?.includes('Simulated answer')) throw new Error('decision shape');
const rate = await call('/api/ratings', { method: 'POST', body: JSON.stringify({ decisionId: d.id, value: 1 }) });
if (rate.status !== 200) throw new Error(`rating ${rate.status}`);
const again = await call('/api/decisions', { method: 'POST', body: JSON.stringify({ requestId: 'req-refund' }) });
if (again.status !== 201) throw new Error('second route failed');
const d2 = await again.json();
if (d2.result.observedSample < 1) throw new Error('rating not folded into routing');
console.log('e2e pass', d.id);
