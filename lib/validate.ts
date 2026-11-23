import type { Policy } from './types';

export const DEFAULT_POLICY: Policy = { quality: 0.5, cost: 0.3, latency: 0.2 };

export const POLICY_PRESETS: Record<string, Policy> = {
  'quality-first': { quality: 0.85, cost: 0.075, latency: 0.075 },
  balanced: { quality: 0.5, cost: 0.3, latency: 0.2 },
  'cost-first': { quality: 0.2, cost: 0.6, latency: 0.2 },
};

const clamp01 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function parsePolicy(body: unknown): Policy | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.preset === 'string' && POLICY_PRESETS[b.preset]) return POLICY_PRESETS[b.preset];
  if ('quality' in b || 'cost' in b || 'latency' in b) {
    const p = { quality: clamp01(b.quality), cost: clamp01(b.cost), latency: clamp01(b.latency) };
    return p.quality + p.cost + p.latency > 0 ? p : null;
  }
  return null;
}

export function parseRouteBody(body: unknown): { requestId?: string; text?: string } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const out: { requestId?: string; text?: string } = {};
  if (typeof b.requestId === 'string' && b.requestId.length <= 64) out.requestId = b.requestId;
  if (typeof b.text === 'string') {
    const t = b.text.trim();
    if (!t || t.length > 4000) return null;
    out.text = t;
  }
  return out.requestId || out.text ? out : null;
}

export function parseRatingBody(body: unknown): { decisionId: string; value: 1 | -1 } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.decisionId !== 'string' || b.decisionId.length > 64) return null;
  if (b.value !== 1 && b.value !== -1) return null;
  return { decisionId: b.decisionId, value: b.value };
}
