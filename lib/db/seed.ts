import { sql } from 'drizzle-orm';
import requestsJson from '../../data/requests.json';
import type { Db } from './index';

/** Explicit seed: data/requests.json -> shared sample inbox. Guarded + advisory-locked so first boots don't double-seed. */
export async function seedIfEmpty(db: Db) {
  await db.tx(async (c) => {
    const tx = c.orm;
    if (c.kind === 'postgres') await (tx as unknown as { execute(q: unknown): Promise<unknown> }).execute(sql`SELECT pg_advisory_xact_lock(7316401)`);
    const existing = await tx.select({ id: c.t.requests.id }).from(c.t.requests).limit(1);
    if (existing.length) return;
    const rows = requestsJson as { note: string; requests: { id: string; channel: string; author: string; text: string; tag: string }[] };
    for (const [i, r] of rows.requests.entries()) {
      await tx.insert(c.t.requests).values({ id: r.id, channel: r.channel, author: r.author, text: r.text, tag: r.tag, sortOrder: i });
    }
    await tx.insert(c.t.kv).values({ key: 'seedNote', value: rows.note });
  });
}
