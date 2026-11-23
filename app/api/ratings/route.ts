import { getDb } from '@/lib/db';
import { ownerId, rateHit, readJson, tooMany, json } from '@/lib/http';
import { getOwnedDecision, observedQuality } from '@/lib/repo';
import { parseRatingBody } from '@/lib/validate';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Record (or replace) this owner's rating of one of their routed decisions. */
export async function POST(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const input = parseRatingBody(body.body);
  if (!input) return json({ error: 'Provide decisionId and value 1 or -1' }, 400);
  const lim = await rateHit(owner, 'rate', 120);
  if (!lim.ok) return tooMany(lim.retryAfter);

  const decision = await getOwnedDecision(owner, input.decisionId);
  if (!decision) return json({ error: 'Unknown decision for this owner' }, 404);
  const db = await getDb();
  await db.tx(async (c) => {
    await c.orm.delete(c.t.ratings).where(and(eq(c.t.ratings.ownerId, owner), eq(c.t.ratings.decisionId, input.decisionId)));
    await c.orm.insert(c.t.ratings).values({
      ownerId: owner, decisionId: input.decisionId, modelId: decision.modelId, value: input.value, createdAt: new Date().toISOString(),
    });
  });
  return json({ ok: true, observed: await observedQuality(owner) });
}
