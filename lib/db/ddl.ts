/** Bootstrap DDL. SQLITE_DDL runs statement-by-statement on local dev; PG_DDL mirrors it for Postgres. JSON stays TEXT. */
export const SQLITE_DDL = [
  `CREATE TABLE IF NOT EXISTS "requests" ("id" TEXT PRIMARY KEY, "channel" TEXT NOT NULL, "author" TEXT NOT NULL, "text" TEXT NOT NULL, "tag" TEXT NOT NULL, "sort_order" INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "decisions" ("id" TEXT PRIMARY KEY, "owner_id" TEXT NOT NULL, "request_id" TEXT, "request_text" TEXT NOT NULL, "model_id" TEXT NOT NULL, "result" TEXT NOT NULL, "answer" TEXT NOT NULL, "created_at" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "decisions_owner_idx" ON "decisions" ("owner_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "ratings" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "owner_id" TEXT NOT NULL, "decision_id" TEXT NOT NULL REFERENCES "decisions"("id"), "model_id" TEXT NOT NULL, "value" INTEGER NOT NULL, "created_at" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "ratings_owner_idx" ON "ratings" ("owner_id", "model_id")`,
  `CREATE TABLE IF NOT EXISTS "owner_policies" ("owner_id" TEXT PRIMARY KEY, "policy" TEXT NOT NULL, "updated_at" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "kv" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "rate_events" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "owner_id" TEXT NOT NULL, "kind" TEXT NOT NULL, "at" INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "rate_idx" ON "rate_events" ("owner_id", "kind", "at")`,
];
export const PG_DDL = [
  `CREATE TABLE IF NOT EXISTS "requests" ("id" TEXT PRIMARY KEY, "channel" TEXT NOT NULL, "author" TEXT NOT NULL, "text" TEXT NOT NULL, "tag" TEXT NOT NULL, "sort_order" INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "decisions" ("id" TEXT PRIMARY KEY, "owner_id" TEXT NOT NULL, "request_id" TEXT, "request_text" TEXT NOT NULL, "model_id" TEXT NOT NULL, "result" TEXT NOT NULL, "answer" TEXT NOT NULL, "created_at" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "decisions_owner_idx" ON "decisions" ("owner_id", "created_at")`,
  `CREATE TABLE IF NOT EXISTS "ratings" ("id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "owner_id" TEXT NOT NULL, "decision_id" TEXT NOT NULL REFERENCES "decisions"("id"), "model_id" TEXT NOT NULL, "value" INTEGER NOT NULL, "created_at" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "ratings_owner_idx" ON "ratings" ("owner_id", "model_id")`,
  `CREATE TABLE IF NOT EXISTS "owner_policies" ("owner_id" TEXT PRIMARY KEY, "policy" TEXT NOT NULL, "updated_at" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "kv" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "rate_events" ("id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, "owner_id" TEXT NOT NULL, "kind" TEXT NOT NULL, "at" BIGINT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "rate_idx" ON "rate_events" ("owner_id", "kind", "at")`,
];
