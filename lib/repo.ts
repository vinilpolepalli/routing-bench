import { and, desc, eq } from 'drizzle-orm';
import { getDb } from './db';
import type { DecisionView, InboxRequest, Policy } from './types';

export async function loadInbox(): Promise<InboxRequest[]> {
  const { orm, t } = await getDb();
  return orm.select().from(t.requests).orderBy(t.requests.sortOrder);
}

export async function seedNote(): Promise<string> {
  const { orm, t } = await getDb();
  return (await orm.select().from(t.kv).where(eq(t.kv.key, 'seedNote')))[0]?.value ?? '';
}

export async function listDecisions(owner: string): Promise<DecisionView[]> {
  const { orm, t } = await getDb();
  const ds = await orm.select().from(t.decisions).where(eq(t.decisions.ownerId, owner)).orderBy(desc(t.decisions.createdAt));
  const rs = await orm.select().from(t.ratings).where(eq(t.ratings.ownerId, owner));
  const byDecision = new Map(rs.map((r) => [r.decisionId, r.value]));
  return ds.map((d) => ({
    id: d.id, requestId: d.requestId, requestText: d.requestText,
    channel: '', author: '', result: d.result, answer: d.answer,
    rating: byDecision.get(d.id) ?? null, createdAt: d.createdAt,
  }));
}

export async function getPolicy(owner: string): Promise<Policy | null> {
  const { orm, t } = await getDb();
  return (await orm.select().from(t.ownerPolicies).where(eq(t.ownerPolicies.ownerId, owner)))[0]?.policy ?? null;
}

/** Average rating per model for this owner: feeds the router's observed-fit nudge. */
export async function observedQuality(owner: string): Promise<Record<string, { avg: number; n: number }>> {
  const { orm, t } = await getDb();
  const rs = await orm.select().from(t.ratings).where(eq(t.ratings.ownerId, owner));
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const r of rs) {
    (acc[r.modelId] ??= { sum: 0, n: 0 });
    acc[r.modelId].sum += r.value; acc[r.modelId].n += 1;
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.n, n: v.n }]));
}

export async function getOwnedDecision(owner: string, id: string) {
  const { orm, t } = await getDb();
  return (await orm.select().from(t.decisions).where(and(eq(t.decisions.id, id), eq(t.decisions.ownerId, owner))))[0];
}
