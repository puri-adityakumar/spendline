# neatHack build log

## Project

Spendline. An agent that explains where a team's LLM spend goes, recovers from a failed action, applies one config fix, and proves the fix with a before and after pair of neatlogs traces.

The problem: teams see one LLM bill but not which workflow, person, or retry loop produced it.

## Team

Typobros: Aditya Kumar Puri (screens) and dhirenderchoudhary (backend and agent).

## Stack

- Next.js 16 API routes as the only backend. TypeScript, Node 22.18+.
- Agent loop: plan, ingest, trace, reconcile, act, verify. One step per `GET /api/runs/:id`, state saved as JSON after each step.
- neatlogs TypeScript SDK 1.1.28. Workflow `spendline-investigator`. Every poll is a WORKFLOW trace, tools are TOOL spans, model calls go through `wrapOpenAI`.
- LiteLLM hackathon key (OpenAI-compatible) for the workload: `claude-opus-4.6`, `claude-haiku`, `nova-micro`.
- cfo.ai: `evidence/cfo-input.csv` and a bearer-token API with an OpenAPI spec at `/api/cfo/openapi.json`.
- Entire CLI 0.11.4 with the graph plugin, enabled for Claude Code with local settings. `evidence/entire-graph.txt` is `entire graph impact --repo . --symbol advance`.

## Build log

### 2026-10-11

Completed:

- Backend on branch `agent/backend`, PR #2. Ledger generator and reconcile, agent loop with alert 503 recovery, auth and run routes, neatlogs tracing, cfo.ai CSV and API.
- Tests that ran: `node --test "lib/**/*.test.ts" "app/**/*.test.ts"`, 22 passing. `next build` passes.
- `neatlogs doctor --local` (7/7) and `--probe` (17/17) pass.
- Ran the production server and drove one investigate run over HTTP. Its 7 step traces are in neatlogs under session `b582ce9e-a1cd-42d3-8354-e3f916deb548`. The recovery step is trace `ce93a4a3303e3185f2d48018bf041efb`: status ERROR, the `alert` TOOL span failed with 503, and the next trace `dbd626760030293a939aa2902ffa9b78` wrote `outbox/alert.md`. Read back with `neatlogs traces get` and `traces spans list`.
- Workload for trace A and trace B (`npm run workload:before`, `workload:fix`, `workload:compare`). Checked the span tree in neatlogs against a local stand-in for the LiteLLM API: one `investigate-waste` root, `intent_classify` and `support_draft` chains, LLM spans with model and token counts.

Failures and fixes:

- Per-trace tags set as a span attribute are dropped once a trace has child spans. Tags now come from `init({ tags })` in the workload script.
- neatlogs reports `totalCostUsd` 0 for the LiteLLM model names. `compare.md` states the saving in tokens when that happens.
- `npm run` puts the SDK's own `neatlogs` binary ahead of `neatlogs-cli` on PATH. The compare script strips `node_modules/.bin` before calling the CLI.
- Rounding each usage group to cents drifted the cfo.ai total by $0.02. Usage rows keep invoice precision now.

- Entire: logged in, enabled for Claude Code (`entire enable --agent claude-code --local`), graph plugin v0.4.0 installed, and `evidence/entire-graph.txt` committed. `entire checkpoint list` shows 0 checkpoints, because the agent hooks only fire in a session started after `enable`.

- Trace A and trace B on the LiteLLM key, numbers from neatlogs (`evidence/compare.md`):
  - Trace A `c1d34e8341c9d1a6291d1552cd2b9d4b`: `claude-opus-4.6`, 2 draft retries, 18 draft calls, 3671 tokens.
  - Trace B `5e723ee0c57b481a316ee7546cc4a331`: `nova-lite`, no retries, 6 draft calls, 1448 tokens. Intent labels match trace A on 6 of 6 tickets.
  - Trace B minus trace A: 2223 fewer tokens. neatlogs shows $0 cost for these model names, so the saving is in tokens.
- The first fix used `nova-micro`. Its trace B `a9eea768f79e2e6acb5fbd2a6f6daea7` changed T-104 ("can't log in, reset email never arrives") from account to bug, so verification failed. A classify-only check showed `nova-lite`, `nova-2-lite` and `claude-haiku` all keep 6 of 6. The patch moved to `nova-lite`.
- Hello trace `91c05234e2ff013f80cb6fe775fc4c2f`: one wrapped `nova-micro` call under `spendline-investigator`.
- Failure: the first trace A run (`0f9b02d2d1762f1b7faee342da93c4e8`) reached neatlogs but crashed saving its result, because `evidence/runs/` did not exist. The script now creates it.

Planned, not done:

- An Entire checkpoint from a fresh agent session, with its `Entire-Checkpoint` trailer.
- The cfo.ai business plan (pricing, costs, revenue, runway) as a shared Page.

## Demo

Not recorded yet. Local run: `npm install`, put `NEATLOGS_API_KEY` and `ADMIN_PASSWORD` in `.env.local`, `npm run build && npm start`, then `POST /api/runs` with `{"mode":"investigate"}` and poll `GET /api/runs/:id`.

## Known limitations and next steps

- On Vercel, run state and the outbox live in `/tmp`, which instances do not share.
- The agent's in-server fix run (trace B through "Run fix") cannot carry the `after` tag. The scripted `npm run workload:fix` does.
- `capped` COGS in the cfo.ai CSV stays empty until trace B gives a measured saving.

## Submission

Confirmed from neatlogs.com/hackathon on 2026-10-11:

- Quote the official neatlogs post on X with team, name, project, public repo, and demo. Window opens Mon 12 Oct 7:00 PM IST, planned close 11:55 PM IST, final cutoff on Discord.
- Demo of 3 minutes or less covering neatlogs, Entire, and cfo.ai: architecture, implementation, runtime, reasoning, result.
- Evidence: before and after runs with numbers, neatlogs trace links or screenshots, Entire checkpoints or graph output, a cfo.ai business plan, a recovery run, `#neatHack` posts, commits dated in the window.

Outstanding: an Entire checkpoint, the cfo.ai plan, the demo video, `#neatHack` posts, and the quote post.
