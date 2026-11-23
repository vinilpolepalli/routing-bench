import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { and, eq, gt, lt } from 'drizzle-orm';
import { getDb } from './db';

export const MAX_BODY = 20 * 1024;
export const UID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const json = (body: unknown, status = 200, headers?: Record<string, string>) => NextResponse.json(body, { status, headers });

/** Owner id comes from the httpOnly lr_uid cookie, which middleware guarantees exists and is well formed. */
export async function ownerId(): Promise<string> {
  const v = (await cookies()).get('lr_uid')?.value ?? '';
  if (!UID_RE.test(v)) throw new Error('missing owner cookie');
  return v;
}

export async function readJson(req: Request): Promise<{ ok: true; body: unknown } | { ok: false; res: NextResponse }> {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BODY) return { ok: false, res: json({ error: 'Request body exceeds 20KB' }, 413) };
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY) return { ok: false, res: json({ error: 'Request body exceeds 20KB' }, 413) };
  if (!text.trim()) return { ok: true, body: {} };
  try { return { ok: true, body: JSON.parse(text) }; } catch { return { ok: false, res: json({ error: 'Invalid JSON' }, 400) }; }
}

/** Sliding-window limiter persisted in the database so it survives restarts. Returns seconds to wait when denied. */
export async function rateHit(owner: string, kind: string, limit: number, windowMs = 3600_000): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const db = await getDb();
  return db.tx(async ({ orm: tx, t }) => {
    const now = Date.now();
    await tx.delete(t.rateEvents).where(lt(t.rateEvents.at, now - 24 * 3600_000));
    const rows = await tx.select({ at: t.rateEvents.at }).from(t.rateEvents)
      .where(and(eq(t.rateEvents.ownerId, owner), eq(t.rateEvents.kind, kind), gt(t.rateEvents.at, now - windowMs))).orderBy(t.rateEvents.at);
    if (rows.length >= limit) return { ok: false as const, retryAfter: Math.max(1, Math.ceil((rows[0].at + windowMs - now) / 1000)) };
    await tx.insert(t.rateEvents).values({ ownerId: owner, kind, at: now });
    return { ok: true as const };
  });
}
export const tooMany = (retryAfter: number) => json({ error: 'Rate limit exceeded', retryAfterSeconds: retryAfter }, 429, { 'Retry-After': String(retryAfter) });
