import path from 'node:path';
import { sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as sqliteSchema from './schema';
import * as pgSchema from './schema.pg';
import { PG_DDL, SQLITE_DDL } from './ddl';
import { seedIfEmpty } from './seed';

export type Schema = typeof sqliteSchema;
type Orm = BetterSQLite3Database<Schema>;

/**
 * Data-layer handle. SQLite (routingbench.db) is the default; Postgres is used when DATABASE_URL is a postgres URL.
 * The Postgres tables/ORM are typed as their SQLite twins: both builders share the awaited API the app
 * uses (never .all/.get/.run). Always query through `t` (driver-specific tables), and `await` every query.
 */
export interface Db {
  kind: 'sqlite' | 'postgres';
  orm: Orm;
  t: Schema;
  /** Runs fn atomically (SQLite: serialized manual BEGIN/COMMIT on the single connection). Nested calls join. */
  tx<T>(fn: (c: Db) => Promise<T>): Promise<T>;
}

const PG_URL = /^postgres(ql)?:\/\//i;
const g = globalThis as unknown as { __rbdb?: Promise<Db> };

async function openSqlite(file: string): Promise<Db> {
  const [{ default: Database }, { drizzle }] = await Promise.all([
    import('better-sqlite3'), import('drizzle-orm/better-sqlite3'),
  ]);
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const orm = drizzle(sqlite, { schema: sqliteSchema });
  for (const stmt of SQLITE_DDL) orm.run(sql.raw(stmt));
  let chain: Promise<unknown> = Promise.resolve();
  const c: Db = {
    kind: 'sqlite', orm, t: sqliteSchema,
    tx(fn) {
      const run = chain.then(async () => {
        orm.run(sql`BEGIN`);
        try { const r = await fn(inner); orm.run(sql`COMMIT`); return r; } catch (e) { orm.run(sql`ROLLBACK`); throw e; }
      });
      chain = run.catch(() => undefined);
      return run;
    },
  };
  const inner: Db = { ...c, tx: (fn) => fn(inner) }; // already inside the transaction
  return c;
}

async function openPg(url: string): Promise<Db> {
  const [{ default: postgres }, { drizzle }] = await Promise.all([import('postgres'), import('drizzle-orm/postgres-js')]);
  const client = postgres(url, { max: 5, onnotice: () => {} });
  try {
    // Advisory lock so concurrently starting instances don't race on CREATE TABLE IF NOT EXISTS.
    await client.begin(async (q) => {
      await q`SELECT pg_advisory_xact_lock(7316402)`;
      for (const stmt of PG_DDL) await q.unsafe(stmt);
    });
  } catch (e) { await client.end({ timeout: 1 }).catch(() => {}); throw e; }
  const mk = (orm: Orm): Db => ({
    kind: 'postgres', orm, t: pgSchema as unknown as Schema,
    tx: (fn) => (orm as unknown as { transaction: (f: (tx: Orm) => Promise<never>) => Promise<never> })
      .transaction((tx) => fn(mk(tx)) as Promise<never>),
  });
  const db = mk(drizzle(client, { schema: pgSchema }) as unknown as Orm);
  try { await seedIfEmpty(db); } catch (e) { await client.end({ timeout: 1 }).catch(() => {}); throw e; }
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__rbdb) {
    const url = process.env.DATABASE_URL;
    const open = async () => {
      if (url && PG_URL.test(url)) return openPg(url);
      const db = await openSqlite(url ? url.replace(/^file:/, '') : path.resolve(process.cwd(), 'routingbench.db'));
      await seedIfEmpty(db);
      return db;
    };
    g.__rbdb = open().catch((e) => { g.__rbdb = undefined; throw e; }); // allow retry after a failed open
  }
  return g.__rbdb;
}
