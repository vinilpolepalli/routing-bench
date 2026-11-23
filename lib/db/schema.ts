import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import type { Policy, RouteResult } from '../types';

export const requests = sqliteTable('requests', {
  id: text('id').primaryKey(), channel: text('channel').notNull(), author: text('author').notNull(),
  text: text('text').notNull(), tag: text('tag').notNull(), sortOrder: integer('sort_order').notNull(),
});
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  requestId: text('request_id'), requestText: text('request_text').notNull(),
  modelId: text('model_id').notNull(),
  result: text('result', { mode: 'json' }).$type<RouteResult>().notNull(),
  answer: text('answer').notNull(), createdAt: text('created_at').notNull(),
}, (t) => [index('decisions_owner_idx').on(t.ownerId, t.createdAt)]);
export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }), ownerId: text('owner_id').notNull(),
  decisionId: text('decision_id').notNull().references(() => decisions.id),
  modelId: text('model_id').notNull(), value: integer('value').notNull(), createdAt: text('created_at').notNull(),
}, (t) => [index('ratings_owner_idx').on(t.ownerId, t.modelId)]);
export const ownerPolicies = sqliteTable('owner_policies', {
  ownerId: text('owner_id').primaryKey(),
  policy: text('policy', { mode: 'json' }).$type<Policy>().notNull(), updatedAt: text('updated_at').notNull(),
});
export const kv = sqliteTable('kv', { key: text('key').primaryKey(), value: text('value').notNull() });
export const rateEvents = sqliteTable('rate_events', {
  id: integer('id').primaryKey({ autoIncrement: true }), ownerId: text('owner_id').notNull(), kind: text('kind').notNull(), at: integer('at').notNull(),
}, (t) => [index('rate_idx').on(t.ownerId, t.kind, t.at)]);
