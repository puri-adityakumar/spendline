# Logs

Aditya signs ~aditya, dhirenderchoudhary signs ~dhirender, the cloud agent signs ~agent.

## Frontend

Owner: Aditya

- [x] Shell and tokens
- [x] Login
- [x] Dashboard
- [x] Person page
- [x] Investigate player
- [x] Evidence slots
- [ ] Phase 4 hook swap
- [ ] README
- [ ] Demo

## Backend

Owner: dhirenderchoudhary

- [x] Reconcile test
- [x] Auth and poll
- [x] Agent loop and 503
- [x] neatlogs hello
- [x] Trace A
- [x] Trace B
- [x] Entire
- [x] cfo csv

## Changesets

2026-10-10 — Added docs/IDEA.md, docs/LOGS.md, and AGENTS.md from the project context. ~agent

2026-10-10 — Added the 3-month, 5-team fixture ledger and neatlogs replay script. ~agent

2026-10-10 — Added fixture screens for login, the team ledger, person pages, the investigate player, and evidence slots. Tests read lib/fixtures.ts. ~agent

2026-10-11 — Added the backend: person ledger generator, reconcile with tests, agent step loop with 503 recovery, auth and run routes, and neatlogs init with per-step WORKFLOW traces. ~dhirender

2026-10-11 — Hardened the backend: per-run poll queue, step errors become retryable snapshots, alert 503 is an errored TOOL span, state and outbox use tmp on Vercel, x-neatlogs-trace-id header. ~dhirender

2026-10-11 — Agent ingest now reads invoices.csv too, added neatlogs traces get, route-level contract tests, and ledger README notes for people.csv. ~dhirender

2026-10-11 — Added cfo.ai inputs: evidence/cfo-input.csv (leaky COGS from invoices.csv, other cells blank until supplied) and a bearer-token API with an OpenAPI spec at /api/cfo/openapi.json. ~dhirender

2026-10-11 — Added the trace A/B workload on the hackathon LiteLLM key (classify + draft, one fix patch, compare.md from neatlogs), wired "Run fix" to rerun it as trace B, and added hackathon.md and evidence/README.md. ~dhirender

2026-10-11 — Ran trace A (claude-opus-4.6, 2 retries, 3671 tokens) and trace B (nova-lite, 0 retries, 1448 tokens) on the LiteLLM key. A first trace B on nova-micro changed one intent label and was rejected. Hello trace sent. ~dhirender

2026-10-11 — Enabled Entire for the repo with commit linking always and Cursor agent hooks. ~agent

2026-10-11 — Login posts to POST /api/auth. Env names for the LiteLLM key, neatlogs project, and cfo token are listed in .env.example. Values stay in .env.local. ~agent

2026-10-11 — Five UI passes on the fixture screens: narrow tables scroll inside the page, a wrong password is an alert, ledger names stay underlined, the footer no longer clips, and a swipe hint shows when columns sit off-screen. ~agent
