import { getDb } from '@/lib/db';
import { ownerId, readJson, json } from '@/lib/http';
import { parsePolicy } from '@/lib/validate';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Save this owner's routing policy (weights or a named preset). */
export async function PUT(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const policy = parsePolicy(body.body);
  if (!policy) return json({ error: 'Provide preset (quality-first|balanced|cost-first) or quality/cost/latency weights' }, 400);
  const db = await getDb();
  await db.tx(async (c) => {
    await c.orm.delete(c.t.ownerPolicies).where(eq(c.t.ownerPolicies.ownerId, owner));
    await c.orm.insert(c.t.ownerPolicies).values({ ownerId: owner, policy, updatedAt: new Date().toISOString() });
  });
  return json({ ok: true, policy });
}
