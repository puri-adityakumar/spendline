# Spendline

Plan for the Typobros build in [puri-adityakumar/spendline](https://github.com/puri-adityakumar/spendline). Facts are from [docs/handover.md](handover.md) and the execution split recorded 10 Oct 2026. CRM-merge is out of scope.

## Project

Spendline is the team ledger for a fictional five-person team over 14 days. An agent explains spend gaps, survives one failed tool call, applies one real fix, and proves it with two neatlogs traces.

Team: Aditya Kumar Puri (labeled Aditya on slices) and dhirenderchoudhary. The cloud agent implements on their branches. Phases are in the execution split below.

Home headline the UI must be able to show: **8.1M tokens, $237 billed, $188 traced, $49 unexplained.**

| Person | id | Role | Tokens | Billed | Traced | Story |
| --- | --- | --- | --- | --- | --- | --- |
| Maya Chen | `maya-chen` | Support | 4.2M | $86 | $84 | Retry loop on `support_draft`. Trace A retries, trace B does not. |
| Jonah Patel | `jonah-patel` | Backend | 1.1M | $64 | $63 | `intent_classify` on an expensive model. Live fix swaps the model. |
| Priya Shah | `priya-shah` | Growth | 0.9M | $11 | $11 | Normal. The agent must not flag her. |
| Sam Ortiz | `sam-ortiz` | Data | 0.5M | $8 | $8 | Normal. |
| Alex Kim | `alex-kim` | Ops | 1.4M | $68 | $22 | Untracked key ($19) plus a duplicate line ($27). Ledger only. Both rows are fixture. |

The only sentence that may claim a real saving is neatlogs trace B minus trace A. Alex's gap is a fixture finding and the screen says "fixture". Team billed minus traced is $49. Alex's two lines are $19 and $27. Those are different quantities (open conflict). Do not treat them as the same number.

Dashboard is the ledger. neatlogs is the receipt. Do not rebuild neatlogs Analytics, Investigate, or Fixes inside Spendline.

Code is written after **10 Oct 2026, 12:30 IST**, in this repo. Submission is a quote post on X on **12 Oct 2026**: public repo plus a demo of at most 3 minutes. Quote the official neatlogs post. Tag `#neatHack` while building. Weights: agent 30%, three tools 25%, demo 20%, building in public 15%, usefulness 10%. One track: an agent that finishes a task (plan, tools, state, context, execution, recovery, verification, iteration).

The quote-post clock this plan uses is stated in Phase 4 only.

## User workflows

| Route | What the person sees |
| --- | --- |
| `/login` | Centered card, one password field. Posts `{ "password": string }` to `POST /api/auth`. `204` sets httpOnly cookie `spendline_session`. `401` returns `{ "error": string }` and stays on the form. No user table. |
| `/` | Header (MuseoModerno wordmark, nav, light theme), four stat cards, five person rows linking to `/team/[person]`, person bars, 14-day billed bars. |
| `/team/[person]` | Days, models, keys, anomaly badges, button "Investigate". The button may link to `/investigate?person=` plus the contract id. The backend runs the whole team and may ignore `person`. |
| `/investigate` | Steps in order `plan`, `ingest`, `trace`, `reconcile`, `act`, `verify`. Findings table. First `act` snapshot is `status: "error"`, `detail: "Alert tool returned 503"`. Next snapshot is `status: "done"`, `detail: "Wrote outbox/alert.md"`, `outbox: "outbox/alert.md"`. Button "Run fix" uses `{ "mode": "fix" }`. |
| `/evidence` | Trace A/B numbers, neatlogs links or trace ids, Entire checkpoint link, graph excerpt, cfo CSV or shared Page, runway cards for `leaky` and `capped` (price, COGS, revenue, cash). |

Until Phase 4 the UI reads `lib/fixtures.ts`. Pages render with no cookie. The investigate view is a local player on a timer that emits the `GET /api/runs/:id` object. Phase 4 swaps that player to the poll. Upload is not the home page. A file picker on `/investigate` is optional and secondary.

Badge variants: `destructive` for the four findings, `outline` for normal, `default` for fixed after trace B. On the person page, `destructive` on the anomaly and `secondary` on normal. Priya and Sam have no `destructive` badge. Alex's anomaly rows show "fixture".

Findings the agent may emit: `retry`, `expensive-model`, `untracked-key`, `duplicate`. Priya and Sam are absent. Alex's two rows have `fixture: true`, with `amountUsd` 19 and 27. Finding shape: `{ "personId", "badge", "title", "amountUsd", "fixture" }`. Leave `title` unchecked until a human writes it.

Shared HTTP contract:

- `POST /api/auth` body `{ "password": string }` → `204` and httpOnly cookie `spendline_session`, or `401` `{ "error": string }`.
- `POST /api/runs` body `{ "mode": "investigate" | "fix" }` → `{ "id": string }`.
- `GET /api/runs/:id` → `{ "id", "step", "status", "detail", "findings", "outbox" }`. One snapshot per request. Do not hold one request open for the whole run (Vercel Hobby proxied timeout 120s; function max 300s).
- `step`: `plan`, `ingest`, `trace`, `reconcile`, `act`, `verify`. `status`: `pending`, `active`, `done`, `error`.

The hard-constraint poll sentence is the shorter `{ step, status, detail }`. Slices quote the contract above. That is not a ruling that the shorter payload is wrong.

Agent loop: plan → ingest → trace → reconcile → act → verify. Labels are code in `lib/agent/rules.ts`. The model only writes prose. State is JSON and must resume after a crash. `lib/tools/alert.ts`: the first call returns 503, then the next span writes `outbox/alert.md`. Do not assert the body of that file.

Demo, at most 3 minutes, in this order: team dashboard, one person, agent recovery (503 then `outbox/alert.md`), neatlogs traces (their traces list, the waste span tree, the cheaper run), Entire link, runway. For neatlogs, Entire, and cfo.ai the demo covers architecture, implementation, runtime, reasoning, and result.

## Tech stack

Next.js 16, React 19, Tailwind 4, shadcn `^4.13.0` style `base-nova`, Base UI (`@base-ui/react`) not Radix, lucide icons. No `tailwind.config.js`. PostCSS is `@tailwindcss/postcss` only. Colors are oklch. Hue 155 is the green. `--chart-2` is the blue accent. Shadow declarations stay out of this plan until Conflict 6 is answered. Do not copy CRM-merge `globals.css`.

Fonts: Manrope (`--font-sans`), Geist Mono (`--font-mono`), Georgia (`--font-serif`). `--font-heading` is the sans font. MuseoModerno weights 400–700 as `--font-museo-moderno` for the wordmark only. Default theme `light`, `enableSystem={false}`. Numbers use `tabular-nums`. `--spacing` is `0.25rem`. `--radius` is `0.5rem`.

API routes on Vercel are the backend. No second hosted backend. `neatlogs-cli@0.2.0` needs Node 22 or 24. Git ≥ 2.36.

## Tools

Crustdata is not used. Alex's gap is explained from the ledger. No external company API. No OpenRouter, Anthropic, OpenAI, Google, or AWS billing or usage APIs. The decision is a synthetic ledger plus live neatlogs traces.

### neatlogs

Investigation receipt. Signup at [app.neatlogs.com](https://app.neatlogs.com). No card. Guide: [neatlogs setup](https://neatlogs.com/hackathon/neatlogs-setup-guide.html). Rules source: [neatlogs.com/hackathon](https://neatlogs.com/hackathon).

- Ingest: `neatlogs` npm, `init({ apiKey: NEATLOGS_API_KEY, workflowName: "spendline-investigator" })`, wrap the model client, `flush()` / `shutdown()` before a short script exits. [TypeScript SDK](https://docs.neatlogs.com/sdk/typescript). The `nlw_` key is HTTP ingest only and 401s in `init()`.
- One trace per investigation: `trace({ name: "investigate-waste", kind: "WORKFLOW" })`. Tags `before` / `after` are tags, not part of the workflow name.
- Read back: Node 22 or 24, `neatlogs-cli@0.2.0`, profile host `https://app.neatlogs.com`, device login, `traces list|get|export`. [traces CLI](https://docs.neatlogs.com/cli/commands/traces).
- Cost rollup: `POST https://app.neatlogs.com/api/v1/public/analytics/cost` with Bearer `NEATLOGS_TOKEN`, header `x-project-id`, body `{ from, to }`. Rows: `group`, `traceCount`, `totalCostUsd`, `totalTokens`. [cost API](https://docs.neatlogs.com/api-reference/endpoints/analytics/post_api_v1_public_analytics_cost).
- Env names only: `NEATLOGS_API_KEY` (ingest), `NEATLOGS_TOKEN` (read; do not set it equal to a different ingest key in the same process), `NEATLOGS_PROJECT_ID`.
- MCP is optional: [https://ingest.neatlogs.com/mcp](https://ingest.neatlogs.com/mcp). [MCP docs](https://docs.neatlogs.com/integrations/mcp).
- On camera: their traces list, the waste run's span tree, the cheaper run (about twenty seconds). Spendline pages stay the team view. [Traces UI](https://docs.neatlogs.com/docs/features/traces).
- Evidence: two traces of workflow `spendline-investigator`, plus `evidence/compare.md` (`totalCostUsd`, `totalTokens`), trace ids, screenshots, and `neatlogs traces export` markdown.
- Unconfirmed: a public unauthenticated trace URL. Ship screenshots and trace ids. If cost API `group` is not per model, sum span tokens and multiply by `ledger/price-card.csv` once rates exist. Do not invent rates.

### Entire

Checkpoints and code graph. Guide: [hack.entire.io/neathacks-2026](https://hack.entire.io/neathacks-2026/). No card. GitHub device login. [Cursor agent](https://docs.entire.io/agents/cursor).

CLI 0.11.x via [https://entire.io/install.sh](https://entire.io/install.sh) into `~/.local/bin`. Then `entire enable --agent cursor`, `entire plugin install graph`, `entire graph init-agents --repo .`. `.entire/settings.json` has `"commit_linking": "always"` and is committed. `.cursor/hooks.json` comes from `entire agent add cursor`. Commit from a shell so hooks run.

Inspect: `entire checkpoint list`, `entire checkpoint explain HEAD`. Graph: `entire graph impact --repo . --symbol <fn>`, `entire graph commit`. Commit stdout to `evidence/entire-graph.txt`. Use a symbol that exists in this repo. Do not invent one.

Evidence: `Entire-Checkpoint` trailer, pushed checkpoint refs, `evidence/entire-graph.txt`, and `https://entire.io/gh/puri-adityakumar/spendline/commit/FULL_SHA` plus the checkpoint id. Use a real SHA only.

Cursor transcripts have no token counts. Spend numbers come from neatlogs and the fixture ledger. Entire does not run on Vercel. The site displays the link and the committed graph text.

### cfo.ai

Runway scenarios. The hackathon path [cfo.ai/neathacks](https://cfo.ai/neathacks) requires a card, then cancel under Settings → Billing. This team cannot add a card. Do not enter payment details. Do not invent a cfo.ai URL.

At start time, spend at most 15 minutes on [cfo.ai/start](https://cfo.ai/start). If a no-card workspace opens, upload `evidence/cfo-input.csv` (`.csv`, at most 50 MB) and ask Ari for price, COGS, revenue, margin, runway, and two scenarios (`leaky` vs `capped`). Share the Page. [CSV](https://docs.cfo.ai/integrations/connect-and-sync-data). [Share](https://docs.cfo.ai/dashboards/share-pages-and-scenarios).

If MCP connects ([https://api.cfo.ai/mcp](https://api.cfo.ai/mcp), browser OAuth): `edit_scenarios` / `edit_table_blocks`, then `inspect_table_blocks`. [MCP](https://docs.cfo.ai/integrations/mcp-server).

If signup wants a card, stop. Keep the CSV and a runway panel on `/evidence`. A human may say in Discord that the card blocked cfo.ai. A card wall is a finished attempt.

CSV columns: `month, scenario, customers, price_usd, inference_cogs_usd, other_cost_usd, starting_cash_usd`. Do not invent cell values.

### Wrapped inference key

Wrap whichever client is called so neatlogs sees tokens and model. No keys are in the repo.

- Resolved from [neatlogs.com/hackathon/models](https://neatlogs.com/hackathon/models): the hackathon LiteLLM key. It is OpenAI-compatible at `https://litellm.vision.aivar.app/v1`, so the client is `wrapOpenAI`. Models: `nova-micro`, `nova-lite`, `nova-pro`, `nova-2-lite`, `claude-haiku`, `claude-sonnet-4.6`, `claude-opus-4.6`. One $20 budget per team over 30 days.
- Bedrock is not on the hackathon AWS accounts, per the same page.
- Env name only: `LITELLM_API_KEY`. That key is an inference key, not a billing integration.

## Project structure

Root `app/`, not `src/app/`. Where the handover still shows `src/app/` or `src/components/`, that is CRM-merge's layout. Working assumption: `components.json` points at `app/globals.css`. That conflict is still open. Do not copy `src/`.

Two branches off `main`. No shared phase 0 commit is required to start.

| Branch | Owner | Files |
| --- | --- | --- |
| `ui/screens` | Aditya | `app/` pages, `app/layout.tsx`, `app/globals.css`, `components/**`, `lib/fixtures.ts` |
| `agent/backend` | dhirenderchoudhary | `lib/**` except `lib/fixtures.ts`, `app/api/**`, `workload/**`, `ledger/**`, `evidence/**`, `outbox/**` |

`package.json` is the one expected merge conflict. Either side may add only the dependencies that side needs, and leaves the other side's entries in place. Do not add a test-runner name as if one were already agreed.

The frontend reads `lib/fixtures.ts` until the Phase 4 join, then swaps the fetch in one hook. The backend never imports `components/`. The frontend never imports the agent loop.

```text
spendline/
  app/                         # frontend pages: layout, globals.css, login, page, team/[person], investigate, evidence
  app/api/auth/route.ts        # backend
  app/api/runs/route.ts        # backend
  app/api/runs/[id]/route.ts   # backend
  components/                  # frontend: site-header, stats-cards, spend-bars, daily-chart, findings-table, run-log, providers, ui/
  lib/fixtures.ts              # frontend; the UI reads this until Phase 4
  lib/                         # backend except fixtures: auth, ledger/{types,load,reconcile}, agent/{loop,state,rules}, tools/{neatlogs,alert,workload}, utils
  workload/                    # backend: run.ts, config.json (classify_model, max_retries), golden.ts
  ledger/                      # backend: generate.ts, invoices.csv, price-card.csv, manifest.json
  evidence/                    # backend: compare.md, entire-graph.txt, cfo-input.csv, README.md
  outbox/.gitkeep              # backend; alert.md appears after recovery
```

Labels stay in `lib/agent/rules.ts`. `ledger/manifest.json` records which `key_id` is the live neatlogs key. `workload/config.json` fields are `classify_model` and `max_retries`. Price-card columns are `model, input_usd_per_mtok, output_usd_per_mtok`.

## Prerequisites

Phase 1 needs no API key and no shared phase 0 commit.

Mock ingest committed in `ledger/`:

- Three months, 2026-07-01 through 2026-09-30. Five teams: Support, Backend, Growth, Data, Ops. Seed `20260701` in `ledger/generate.py`. This fixture is not a real bill.
- `ledger/invoices.csv` is what the agent ingests. Columns: `team`, `occurred_at`, `model`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost_usd`.
- `ledger/price-card.csv` columns: `model`, `input_usd_per_mtok`, `output_usd_per_mtok`. Rates are short-context prices from https://developers.openai.com/api/docs/pricing read on 2026-10-10. Models: `gpt-6-luna`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6.1-sol`, `gpt-5.6-sol`, `gpt-6-astra`.
- `ledger/traces.jsonl` is one neatlogs HTTP trace per invoice row. Shape: https://docs.neatlogs.com/sdk/http-injection. `ledger/replay_traces.py` posts them only when `NEATLOGS_WRITE_KEY` is set.
- The five-person screen headline (8.1M tokens, $237 billed, $188 traced, $49 unexplained) is still the demo story in Project. It is not the sum of this ledger.
- `lib/fixtures.ts` still matches `GET /api/runs/:id` for the screens. The UI reads that module. The agent ingests the CSVs.

Do not invent an API key, a generator seed, an LLM provider, a `--shadow-*` string, an `ADMIN_PASSWORD`, a bad-row rule, a threshold, a price-card rate, a finding `title`, a model id, a retry count, golden classify labels, a person URL slug, a Vercel project name, a public trace URL, or a cfo.ai cell value.

`.env.example` lists names only, and only after Aditya says who may add that file. Never commit a secret. Names already fixed, with no values: `ADMIN_PASSWORD`, `NEATLOGS_API_KEY`, `NEATLOGS_TOKEN`, `NEATLOGS_PROJECT_ID`, `LITELLM_API_KEY`, `CFO_API_TOKEN`.

Later slices that need a human, named on the phase that owns them: neatlogs signup and device login, Entire device login, who may commit `.entire/settings.json` and `.cursor/hooks.json`, the inference key and `classify_model` / `max_retries`, Conflict 3 before trace B, the 15-minute cfo.ai attempt, who may merge onto `main`, and who may edit root `README.md`.

## Phases

Phases are not days. Each phase has two tracks, Aditya and dhirenderchoudhary, and neither track waits on the other. The only order inside a phase is one person's own sequence. Phase 4 is the join. A Blocker line blocks only the part it names. Skip a slice that is still on its Blocker line, and say which blocker, instead of borrowing the other branch.

### Phase 1 — fixtures and reconcile

Unblocked. No API key.

| Aditya (`ui/screens`) | dhirenderchoudhary (`agent/backend`) |
| --- | --- |
| **`sat-screens` — login and dashboard.** Files: `app/layout.tsx`, `app/globals.css`, `app/login/page.tsx`, `app/page.tsx`, `components/site-header.tsx`, `components/stats-cards.tsx`, `components/spend-bars.tsx`, `components/daily-chart.tsx`, `components/providers.tsx`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/sonner.tsx`, `lib/fixtures.ts`, and `package.json` only as the known conflict file. `/login` is a centered card with one password field that posts `{ "password": string }` to `/api/auth`. `/` shows the header, four stat cards, five person rows linking to `/team/[person]`, person bars, and 14 daily billed bars. Data comes only from `lib/fixtures.ts`. Pages render with no cookie. No ledger CSV. No API. No module under `app/` or `components/` imports `lib/agent/**`. Assert the headline (8.1M, $237, $188, $49), the five contract ids, that the 14 daily bars sum to 237, and the login post body. Do not assert the `[person]` slug, a per-day series, a shadow string, or a password value. Write the assertion before the slice counts as done. Verify on `ui/screens` only. Scaffold files the split does not list wait until Aditya names who may add them. A missing shell is not a failure of the assertion. Do not add `--shadow-*` until Conflict 6 is answered. | **`sat-ledger` — types, load, reconcile.** Files: `lib/ledger/types.ts`, `lib/ledger/load.ts`, `lib/ledger/reconcile.ts`, `ledger/generate.ts`, `ledger/invoices.csv`, `ledger/price-card.csv`, `ledger/manifest.json`. Reconcile emits the four findings and does not emit Priya or Sam. The first unit test asserts `maya-chen` / `retry` (4.2M, billed 86, traced 84), `jonah-patel` / `expensive-model` (1.1M, billed 64, traced 63), and two `alex-kim` rows: `untracked-key` with `amountUsd` 19 and `duplicate` with `amountUsd` 27, both `fixture: true`. Assert `personId` and `badge` on every finding. Assert `amountUsd` and `fixture` on Alex's two rows only. Leave `title` unchecked. Write that test before `reconcile.ts` counts as done. It does not call neatlogs, an LLM, or cfo.ai. Load quarantines one bad row only after a human defines that rule. The generator reads a seed it is given. Verify the four-findings test on `agent/backend` only. Do not open the UI and do not import `components/`. No test-runner script is named. |

### Phase 2 — screens on fixtures, auth and agent loop

Aditya's sequence is his own: `sun-person`, then `sun-investigate`, then `mon-evidence`. dhirenderchoudhary's sequence is his own: `sun-api`, then `sun-agent`.

| Aditya (`ui/screens`) | dhirenderchoudhary (`agent/backend`) |
| --- | --- |
| **`sun-person` — person page.** Files: `app/team/[person]/page.tsx`, `components/ui/table.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `lib/fixtures.ts`. Columns: day, model, key, tokens, billed, traced. `destructive` on that person's anomaly, `secondary` on normal. Priya and Sam have no `destructive` badge. Alex's anomaly rows show "fixture". Button label is "Investigate". Renders from fixtures with no cookie and no `lib/agent/**` import. The slug is Conflict 9. Do not invent it. Verify all five people on `ui/screens` only. Do not call the API. | **`sun-api` — auth and poll.** Files: `app/api/auth/route.ts`, `app/api/runs/route.ts`, `app/api/runs/[id]/route.ts`, `lib/auth.ts`. Password is read from `ADMIN_PASSWORD` at request time. No user table. `POST /api/auth` returns 204 with httpOnly `spendline_session`, or 401 `{ "error": string }`. `POST /api/runs` returns `{ "id": string }` for `investigate` and for `fix`. `GET /api/runs/:id` returns the contract object, one snapshot per request. Assert the first `act` body and the next snapshot match the contract strings. The password value is not in the assertion. The alert path needs no API key. Do not assert the body of `outbox/alert.md`. Verify with HTTP requests on `agent/backend` only. Do not render a page. **Blocker:** a human sets `ADMIN_PASSWORD` in the environment before the auth assertion can pass. Do not invent it. Do not commit it. The alert poll does not wait on that password. |
| **`sun-investigate` — local run player.** Files: `app/investigate/page.tsx`, `components/findings-table.tsx`, `components/run-log.tsx`, `components/ui/progress.tsx`, `components/ui/badge.tsx`, `components/ui/table.tsx`, `lib/fixtures.ts`. A timer emits the GET contract in step order. Findings use `destructive` for the four findings. "Run fix" uses `{ "mode": "fix" }` locally. Assert the 503 snapshot and the following done snapshot, that Priya and Sam are omitted, and that both Alex rows are `fixture: true` with amounts 19 and 27. No import of `lib/agent/**`. Verify on `ui/screens` only. Do not require `agent/backend`. | **`sun-agent` — loop, state, alert recovery.** Files: `lib/agent/loop.ts`, `lib/agent/state.ts`, `lib/agent/rules.ts`, `lib/tools/alert.ts`, `outbox/.gitkeep`, and `outbox/alert.md` only as the file the tool writes. State resumes after a crash at the same step. First `alert` call returns 503. The next span writes `outbox/alert.md`. Findings badges come from rules, not from model text. Assert step order, crash resume from saved JSON, 503 then the outbox file, and that Priya and Sam are not labeled. Do not assert the file body. Do not require a live model call. Verify on `agent/backend` only. Do not open `/investigate` and do not start trace B. |
| **`mon-evidence` — evidence page from slots.** Files: `app/evidence/page.tsx`, `lib/fixtures.ts`, `components/stats-cards.tsx`. Fixture slots, not live secrets: trace A numbers, trace B numbers, neatlogs links or trace ids, Entire checkpoint link, graph excerpt, cfo CSV path or shared Page, runway cards for `leaky` and `capped` with price, COGS, revenue, and cash. Real figures replace slots only in Phase 4, and only from files dhirenderchoudhary has actually committed or a shared Page a human has. Missing cfo account still shows the runway panel and the CSV. Copy says "fixture" where the ledger gap is shown. The savings sentence slot is trace B minus trace A only. No savings sentence uses Alex or the $49 headline. Renders from fixtures with no cookie. Empty cfo cells are a pass. Do not invent a Page URL. Do not wait for Phase 3. | No third slice in this phase. Do not wait on Aditya's screens, and do not block them. |

### Phase 3 — traces, Entire, and cfo.ai

Aditya keeps the screens on fixtures and does not wait. He has no new slice in this phase.

dhirenderchoudhary's trace sequence is his own: `sat-neatlogs-hello`, then `sun-trace-a`, then `sun-trace-b`. Hello stays before trace A. Trace B stays after trace A. Trace B still waits on Aditya's one-knob vs two-knob answer (Conflict 3). That answer is not a wait on Aditya's Phase 3 track, because Aditya has no Phase 3 slice.

Also his, and not in front of the traces: `sat-entire-enable`, then `sun-entire-graph`. `sun-cfo` does not block the traces, the graph, or Aditya's screens.

| Aditya (`ui/screens`) | dhirenderchoudhary (`agent/backend`) |
| --- | --- |
| No new slice. Screens stay on fixtures. He does not wait on traces, Entire, or cfo.ai, and those slices do not wait on a new screen. | **`sat-neatlogs-hello`.** No new path. Do not commit a key. A scratch script, if one is required, sits under a backend-owned path and reads `NEATLOGS_API_KEY` from the environment. `neatlogs doctor --probe` succeeds, then one wrapped call whose workflow is `spendline-investigator`. This hello trace is not the `before` trace and not the `after` trace. **Blocker:** a human signs up at app.neatlogs.com (no card), completes device login, and puts the project key in the environment. Do not invent the key. |
| | **`sun-trace-a` — before.** Files: `workload/run.ts`, `workload/config.json`, `workload/golden.ts`, `lib/tools/neatlogs.ts`. One trace tagged `before`, name `investigate-waste`, workflow `spendline-investigator`. Retries are present on `support_draft`. The classify call uses the expensive model the human named. No `after` trace, no `evidence/compare.md`, no config patch. **Blocker:** a human names the provider and places the inference key in the environment, and supplies `classify_model`, `max_retries`, and any golden classify labels. Do not invent the provider, the key, the model id, the retry count, or the labels. Also waits on hello. |
| | **`sun-trace-b` — after, then compare.** Files: `workload/config.json`, `workload/run.ts`, `lib/tools/workload.ts`, `evidence/compare.md`. One config patch, then one trace tagged `after` under the same workflow name and the same trace name. `evidence/compare.md` records `totalCostUsd` and `totalTokens` for A and for B. The only savings sentence is trace B minus trace A. It does not mention Alex. Do not start this slice in the same run as trace A. **Blocker:** Conflict 3. Until Aditya says whether the one patch changes both `max_retries` and `classify_model` or a single knob, do not edit `workload/config.json` and do not run trace B. |
| | **`sat-entire-enable` — first checkpoint.** `"commit_linking": "always"` in `.entire/settings.json`, hooks present, one checkpoint from `entire checkpoint list` and `entire checkpoint explain HEAD`. Those two settings files are not in either side's file list. **Blocker:** a human completes Entire GitHub device login. Do not commit `.entire/settings.json` or `.cursor/hooks.json` until Aditya says who may add those two files. A missing checkpoint is not a screens failure or a ledger failure. |
| | **`sun-entire-graph`.** Commit stdout of `entire graph impact --repo . --symbol <fn>` at `evidence/entire-graph.txt`. The explained HEAD commit carries an `Entire-Checkpoint` trailer. The site does not run Entire. **Blocker:** `sat-entire-enable`. |
| | **`sun-cfo`.** File: `evidence/cfo-input.csv`. At most 15 minutes on [cfo.ai/start](https://cfo.ai/start). Header row is exactly `month, scenario, customers, price_usd, inference_cogs_usd, other_cost_usd, starting_cash_usd`. Both scenario names `leaky` and `capped` appear. File is 50 MB or smaller. Do not assert dollar cells this brief does not contain. If the human has not supplied rows, the done check is the header and the two scenario names only. If signup wants a card, stop. **Blocker:** a human sits the 15-minute attempt. Do not block trace A, trace B, the graph, or the UI on this slice. |

### Phase 4 — join

This is the join. Aditya's sequence is `mon-merge`, then `mon-readme`, then `mon-demo-post`. dhirenderchoudhary supplies the trace ids, the Entire link, and the runway numbers. He does not open a new slice for that supply. `mon-merge` needs both branches.

Quote-post deadline for this phase: **19:00–20:30 IST on 12 Oct 2026**, not at 23:30. The official close in Conflicts (19:00–23:55 IST) is not a second slot.

| Aditya (`ui/screens` for the hook swap; the post is not a code slice) | dhirenderchoudhary (`agent/backend`) |
| --- | --- |
| **`mon-merge` — swap the fixture hook for fetch.** Files: the fixture hook inside `app/` or `components/`, and `lib/fixtures.ts` only as the module being replaced at the call site. Do not import `lib/agent/**`. Do not edit `app/api/**` on this branch. The player reads `GET /api/runs/:id`. Login posts to `/api/auth` and a 204 redirects into the app. A 401 stays on the form. "Run fix" posts `{ "mode": "fix" }`. Component props stay unchanged. The Phase 1 and Phase 2 screen assertions still pass when the data source is the API instead of the timer. This slice is the exception to verify-alone: a later agent needs the API from `agent/backend` and the pages from `ui/screens`. **Blocker:** Aditya says who may merge onto `main` before that merge commit. The hook swap on `ui/screens` can be checked against a running API without that merge. | No new slice. He supplies the trace ids, the Entire link (`https://entire.io/gh/puri-adityakumar/spendline/commit/FULL_SHA` plus the checkpoint id, real SHA only), and the runway numbers when the evidence slots take real figures. He does not open `/evidence` to do that supply. |
| **`mon-readme`.** Root `README.md` is not in either side's file list. It says how to run, lists env names only, indexes `evidence/compare.md`, `evidence/entire-graph.txt`, `evidence/cfo-input.csv`, and `evidence/README.md`, and contains the checkpoint link once a real SHA exists. Neither README contains a secret. Neither claims a saving except trace B minus trace A. **Blocker:** Aditya says who may edit root `README.md`. The link waits on a real commit SHA and a real checkpoint id. | `evidence/README.md` is his, under `evidence/**`. It says what each evidence file proves. That file does not wait on the root README owner. |
| **`mon-demo-post`.** No files. Recording is 3:00 or shorter and includes every demo beat, including the runway panel when cfo.ai stopped at the card. The quote post is inside 19:00–20:30 IST on 12 Oct 2026, with the public repo and the demo. `#neatHack` if fewer than four posts exist. **Blocker:** a human counts existing `#neatHack` posts, records the demo, and publishes the quote. The count is unspecified. Do not invent a Vercel project name. Do not record or publish it from this plan. | Same supply as the merge row: trace ids, Entire link, and runway numbers for the demo. Posting is not his code slice. |
