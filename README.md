# Routing Bench

Independent demo: route workspace-style questions across three illustrative model profiles with explicit cost, latency and quality tradeoffs, the problem a model-agnostic Slack AI coworker solves.

- Transparent heuristic complexity classifier (no ML, no black box)
- Per-request scoring of every profile: quality fit, estimated cost, estimated latency, under your routing policy (quality-first / balanced / cost-first)
- Simulated answers, clearly labeled; no real model is ever called
- Your ratings persist and nudge future routes (observed fit, shrinkage-capped)
- Real persisted state per anonymous browser cookie: decisions, ratings, policy

Stack: Next.js 15, drizzle-orm, SQLite locally, Postgres (Neon) in production via DATABASE_URL.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run typecheck
BASE_URL=http://localhost:3000 npm run e2e   # with the dev server running
```

Demo built by Vinil Polepalli. Not affiliated with or endorsed by OpenTag.

## Deployment

Production deploys run on Vercel from the main branch, with the database on Neon Postgres connected through the Vercel integration.
