# spendline

Spendline explains where a team's LLM spend goes. An agent reconciles the ledger, recovers from a failed alert, applies one config fix, and proves the fix with a before and after pair of neatlogs traces.

## Screens

- `/` and `/team/[team]` read `ledger/invoices.csv` (five teams, July through September 2026).
- `/login` posts `{ "password" }` to `/api/auth`. A 204 sets the `spendline_session` cookie.
- `/investigate` posts `{ "mode" }` to `/api/runs` and polls `GET /api/runs/:id`, one agent step per poll, until `verify`. Starting a run needs the session cookie. "Run investigate" shows the alert 503, the recovery, and the findings. "Run fix" reruns the patched workload on LiteLLM as a new trace B and checks its intent labels against trace A.
- `/evidence` reads `evidence/compare.json`, `evidence/entire-graph.txt`, and `evidence/cfo-input.csv`.

## Run

```bash
npm install
cp .env.example .env.local   # fill in the values
npm test
npm run build && npm start
```

Env names: `ADMIN_PASSWORD`, `NEATLOGS_API_KEY`, `NEATLOGS_PROJECT_ID`, `NEATLOGS_TOKEN` (optional read token), `NEATLOGS_WRITE_KEY` (only for `ledger/replay_traces.py`), `LITELLM_API_KEY`, `CFO_API_TOKEN`.

Trace A and trace B:

```bash
npm run workload:before   # trace A, tag before
npm run workload:fix      # one config patch, trace B, tag after
npm run workload:compare  # evidence/compare.md and compare.json from neatlogs
```

## Evidence

- `evidence/compare.md`. Trace A vs trace B from neatlogs.
- `evidence/entire-graph.txt`. `entire graph impact` for the agent loop's `advance`.
- `evidence/cfo-input.csv`. cfo.ai input. The same data is served at `/api/cfo/usage` and `/api/cfo/scenarios`, with the spec at `/api/cfo/openapi.json`.
- `evidence/README.md`. What each file proves.
- `hackathon.md`. The build log.

The only saving claimed is trace B minus trace A: 2,223 fewer tokens with the same intent label on 6 of 6 tickets.
