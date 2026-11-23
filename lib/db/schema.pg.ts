import { pgTable, text, integer, bigint, index, customType } from 'drizzle-orm/pg-core';
import type { Policy, RouteResult } from '../types';

/** JSON stored as TEXT, exactly like the SQLite schema's `text(..., { mode: 'json' })`. */
const jsonText = <T>() => customType<{ data: T; driverData: string }>({
  dataType: () => 'text',
  toDriver: (v) => JSON.stringify(v),
  fromDriver: (v) => JSON.parse(v),
});

export const requests = pgTable('requests', {
  id: text('id').primaryKey(), channel: text('channel').notNull(), author: text('author').notNull(),
  text: text('text').notNull(), tag: text('tag').notNull(), sortOrder: integer('sort_order').notNull(),
});
export const decisions = pgTable('decisions', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  requestId: text('request_id'), requestText: text('request_text').notNull(),
  modelId: text('model_id').notNull(),
  result: jsonText<RouteResult>()('result').notNull(),
  answer: text('answer').notNull(), createdAt: text('created_at').notNull(),
}, (t) => [index('decisions_owner_idx').on(t.ownerId, t.createdAt)]);
export const ratings = pgTable('ratings', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(), ownerId: text('owner_id').notNull(),
  decisionId: text('decision_id').notNull().references(() => decisions.id),
  modelId: text('model_id').notNull(), value: integer('value').notNull(), createdAt: text('created_at').notNull(),
}, (t) => [index('ratings_owner_idx').on(t.ownerId, t.modelId)]);
export const ownerPolicies = pgTable('owner_policies', {
  ownerId: text('owner_id').primaryKey(),
  policy: jsonText<Policy>()('policy').notNull(), updatedAt: text('updated_at').notNull(),
});
export const kv = pgTable('kv', { key: text('key').primaryKey(), value: text('value').notNull() });
export const rateEvents = pgTable('rate_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(), ownerId: text('owner_id').notNull(), kind: text('kind').notNull(), at: bigint('at', { mode: 'number' }).notNull(),
}, (t) => [index('rate_idx').on(t.ownerId, t.kind, t.at)]);
