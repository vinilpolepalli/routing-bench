# Routing Bench

Independent demo: a Slack-style triage desk where incoming questions are answered by multiple model profiles (fast-cheap, balanced, strong). The desk shows per-request routing decisions with cost, latency and quality tradeoffs, plus why the router picked each model.

Stack: Next.js 15, Drizzle ORM. SQLite locally; Postgres when DATABASE_URL is set. Demo data is fictional sample data. Not affiliated with OpenTag.
