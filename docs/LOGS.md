# Logs

Aditya signs ~aditya, dhirenderchoudhary signs ~dhirender, the cloud agent signs ~agent.

## Frontend

Owner: Aditya

- [ ] Shell and tokens
- [ ] Login
- [ ] Dashboard
- [ ] Person page
- [ ] Investigate player
- [ ] Evidence slots
- [ ] Phase 4 hook swap
- [ ] README
- [ ] Demo

## Backend

Owner: dhirenderchoudhary

- [x] Reconcile test
- [x] Auth and poll
- [x] Agent loop and 503
- [ ] neatlogs hello
- [ ] Trace A
- [ ] Trace B
- [ ] Entire
- [ ] cfo csv

## Changesets

2026-10-10 — Added docs/IDEA.md, docs/LOGS.md, and AGENTS.md from the project context. ~agent

2026-10-10 — Added the 3-month, 5-team fixture ledger and neatlogs replay script. ~agent

2026-10-11 — Added the backend: person ledger generator, reconcile with tests, agent step loop with 503 recovery, auth and run routes, and neatlogs init with per-step WORKFLOW traces. ~dhirender

2026-10-11 — Hardened the backend: per-run poll queue, step errors become retryable snapshots, alert 503 is an errored TOOL span, state and outbox use tmp on Vercel, x-neatlogs-trace-id header. ~dhirender
