# Implementation notes

- `lib/engine.ts`: classify() is a keyword/length heuristic (labeled as such in the UI). route() scores every profile: qualityFit = quality * (0.55 + 0.45 * sweet-spot match), plus a shrinkage-capped nudge from the owner's observed ratings; score = normalized policy-weighted sum of fit, cost, latency. simulatedAnswer() returns a clearly labeled stub; the routing decision is the artifact under test.
- Persistence: seeded shared sample inbox (`requests` table, fictional messages); per-owner `decisions`, `ratings`, `owner_policies` keyed by the httpOnly `lr_uid` cookie set in `middleware.ts`. SQLite locally (`routingbench.db`), Postgres when `DATABASE_URL` is a postgres URL; bootstrap DDL in `lib/db/ddl.ts`, seeding in `lib/db/seed.ts` with an advisory lock against concurrent first boots.
- API: POST /api/decisions (rate-limited 30/hr/owner), POST /api/ratings (120/hr), PUT /api/policy. Bodies capped at 20KB; inputs validated in `lib/validate.ts`.
- Truthful semantics: model profiles are illustrative (lib/models.ts says so); answers are simulated; shared seeded inbox vs per-owner state is disclosed in the footer; no external calls anywhere.
