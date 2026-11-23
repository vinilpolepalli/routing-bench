import { NextResponse, type NextRequest } from 'next/server';

const UID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Issues the httpOnly owner cookie on first contact and exposes it to the same request. */
export function middleware(req: NextRequest) {
  const cur = req.cookies.get('lr_uid')?.value;
  if (cur && UID_RE.test(cur)) return NextResponse.next();
  const uid = crypto.randomUUID();
  const headers = new Headers(req.headers);
  const rest = (headers.get('cookie') ?? '').split(/;\s*/).filter((c) => c && !c.startsWith('lr_uid='));
  headers.set('cookie', [...rest, `lr_uid=${uid}`].join('; '));
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set('lr_uid', uid, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === 'production' && process.env.LR_INSECURE_COOKIE !== '1' });
  return res;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
