import { getDb } from '@/lib/db';
import { ownerId, rateHit, readJson, tooMany, json } from '@/lib/http';
import { route, simulatedAnswer } from '@/lib/engine';
import { observedQuality, getPolicy } from '@/lib/repo';
import { DEFAULT_POLICY, parseRouteBody } from '@/lib/validate';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Route one inbox request (or free text) to a model profile; persists the decision for this owner. */
export async function POST(req: Request) {
  const owner = await ownerId();
  const parsed = readJson(req);
  const body = await parsed;
  if (!body.ok) return body.res;
  const input = parseRouteBody(body.body);
  if (!input) return json({ error: 'Provide requestId (seeded inbox item) or text (1-4000 chars)' }, 400);
  const lim = await rateHit(owner, 'route', 30);
  if (!lim.ok) return tooMany(lim.retryAfter);

  const db = await getDb();
  let text = input.text ?? '';
  let requestId: string | null = null;
  if (input.requestId) {
    const r = (await db.orm.select().from(db.t.requests).where(eq(db.t.requests.id, input.requestId)))[0];
    if (!r) return json({ error: 'Unknown requestId' }, 404);
    text = r.text;
    requestId = r.id;
  }
  const policy = (await getPolicy(owner)) ?? DEFAULT_POLICY;
  const observed = await observedQuality(owner);
  const result = route(text, policy, observed);
  const answer = simulatedAnswer(text, input.requestId ? (await db.orm.select().from(db.t.requests).where(eq(db.t.requests.id, input.requestId)))[0].tag : 'custom', result.chosen.model);
  const id = crypto.randomUUID();
  await db.orm.insert(db.t.decisions).values({
    id, ownerId: owner, requestId, requestText: text,
    modelId: result.chosen.model.id, result, answer, createdAt: new Date().toISOString(),
  });
  return json({ id, requestId, result, answer }, 201);
}
