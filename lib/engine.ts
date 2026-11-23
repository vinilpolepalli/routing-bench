import type { Classification, ModelProfile, ModelScore, Policy, RouteResult } from './types';
import { MODELS } from './models.ts';

export { MODELS };

const URGENT = /\b(asap|urgent|blocked|outage|down|incident|p0|p1)\b/i;
const CODE = /```|\b(function|error|exception|stack trace|sql|regex|deploy|migration|query|merge)\b/i;
const SIMPLE = /\b(summari[sz]e|tl;?dr|list|rewrite|draft|format|invite)\b/i;
const MULTI = /\b(compare|weigh|trade-?off|options|recommendation|explain why)\b/i;

/** Transparent heuristic classifier. Labeled in the UI as a heuristic, not an ML model. */
export function classify(text: string): Classification {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const questions = (text.match(/\?/g) || []).length;
  let c = 0.22 + Math.min(0.28, words.length / 250);
  const features: string[] = [`${words.length} words`];
  if (CODE.test(text)) { c += 0.24; features.push('technical or code content'); }
  if (MULTI.test(text)) { c += 0.16; features.push('multi-factor reasoning'); }
  if (questions > 1) { c += 0.08; features.push(`${questions} distinct questions`); }
  if (URGENT.test(text)) { c += 0.05; features.push('urgency marker (latency still priced)'); }
  if (SIMPLE.test(text) && !CODE.test(text) && !MULTI.test(text)) { c -= 0.12; features.push('simple transform'); }
  c = Math.min(1, Math.max(0, c));
  const estTokens = Math.max(64, Math.round(words.length * 1.4) * 4 + 400); // request + fixed answer budget
  return { complexity: Math.round(c * 100) / 100, estTokens, features };
}

/** Score every model for one classification. observed is avg rating (-1..1) per model id from this owner's past ratings. */
export function route(text: string, policy: Policy, observed: Record<string, { avg: number; n: number }>): RouteResult {
  const cl = classify(text);
  const raw = MODELS.map((m) => {
    const costUsd = (cl.estTokens / 1000) * m.costPer1k;
    const match = 1 - Math.abs(cl.complexity - m.sweetSpot);
    let qualityFit = m.quality * (0.55 + 0.45 * match);
    const obs = observed[m.id];
    // Shrink the observed adjustment toward 0 with few samples; cap at +-4 points of fit.
    const observedAdj = obs && obs.n > 0 ? Math.max(-0.04, Math.min(0.04, obs.avg * 0.06 * (obs.n / (obs.n + 3)))) : null;
    if (observedAdj) qualityFit += observedAdj;
    const notes: string[] = [];
    notes.push(`complexity ${cl.complexity} vs sweet spot ${m.sweetSpot}`);
    if (observedAdj) notes.push(`your past ratings nudged fit ${observedAdj > 0 ? '+' : ''}${(observedAdj * 100).toFixed(1)}pts`);
    if (cl.estTokens / 1000 > m.contextK * 0.8) notes.push(`near ${m.contextK}k context limit`);
    return { model: m, costUsd, latencyMs: m.latencyMs, qualityFit, observedAdj, notes, complexity: cl.complexity };
  });
  const maxCost = Math.max(...raw.map((r) => r.costUsd));
  const maxLat = Math.max(...raw.map((r) => r.latencyMs));
  const wSum = policy.quality + policy.cost + policy.latency || 1;
  const w = { quality: policy.quality / wSum, cost: policy.cost / wSum, latency: policy.latency / wSum };
  const candidates: ModelScore[] = raw
    .map(({ complexity: _c, ...r }) => ({
      ...r,
      score: Math.round((w.quality * r.qualityFit - w.cost * (r.costUsd / maxCost) - w.latency * (r.latencyMs / maxLat)) * 1000) / 1000,
    }))
    .sort((a, b) => b.score - a.score);
  const margin = candidates.length > 1 ? Math.round((candidates[0].score - candidates[1].score) * 1000) / 1000 : 1;
  const obsN = Object.values(observed).reduce((s, o) => s + o.n, 0);
  return { classification: cl, chosen: candidates[0], candidates, margin, policy: { quality: w.quality, cost: w.cost, latency: w.latency }, observedSample: obsN };
}

const OPENERS: Record<string, string> = {
  summarize: 'Here is a three-bullet summary of the thread',
  draft: 'Here is a draft reply',
  rewrite: 'Here is a firmer but warmer rewrite',
  code: 'Walked through the code path',
  incident: 'Triage steps for the blocked deploy',
  analysis: 'Comparison of the two options',
  schedule: 'Proposed slot and invite text',
};

/** Deterministic simulated answer. The UI labels it as simulated; no real model is called anywhere in this demo. */
export function simulatedAnswer(text: string, tag: string, model: ModelProfile): string {
  const opener = OPENERS[tag] ?? 'Here is a first pass';
  const depth = model.id === 'apex' ? 'with edge cases and a verification checklist' : model.id === 'mid' ? 'with the main tradeoffs called out' : 'kept short';
  return `[Simulated answer - this demo never calls a real model. Routed to profile "${model.label}" (${model.tier}).]\n\n${opener}, ${depth}. In a production coworker this is where the ${model.label} response would stream in; here the point under test is the routing decision above, not the text.`;
}
