# Ledger fixture

This is not a real bill. The rows are a seeded fixture for Spendline.

## What is here

- `invoices.csv` is what the agent ingests. Columns: `team`, `occurred_at`, `model`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost_usd`.
- `price-card.csv` columns: `model`, `input_usd_per_mtok`, `output_usd_per_mtok`.
- `traces.jsonl` is one neatlogs HTTP trace per invoice row.
- `generate.py` rebuilds those files. Seed `20260701`. Range 2026-07-01 through 2026-09-30. Teams: Support, Backend, Growth, Data, Ops.
- `replay_traces.py` posts the JSONL only when `NEATLOGS_WRITE_KEY` is set. With no key it prints a line and exits without sending.

## Five-person story

The screens and the reconcile step use a second, smaller fixture for the five-person demo team. It is separate from the 3-month team ledger above.

- `people.csv` has 14 days (2026-09-17 through 2026-09-30) for `maya-chen`, `jonah-patel`, `priya-shah`, `sam-ortiz`, and `alex-kim`. Columns: `request_id`, `person_id`, `day`, `operation`, `model`, `key_id`, `attempt`, `tokens`, `billed_usd`, `traced_usd`.
- `manifest.json` records `liveNeatlogsKeyId`, the key whose calls neatlogs traces. Rows on any other key are untracked.
- `generate.ts` rebuilds both files from a seed: `npm run ledger:generate` (seed `20260701`). Totals are 8.1M tokens, $237 billed, $188 traced.

The agent ingests `invoices.csv` and `people.csv`. Reconcile reads `people.csv`. A repeated `request_id` is a duplicate line, `attempt` above 1 is a retry, and the price card's highest output rate is the expensive model.

## Prices

Short-context USD per 1M tokens, read from the OpenAI pricing page on 2026-10-10:

https://developers.openai.com/api/docs/pricing

Models: `gpt-6-luna`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6.1-sol`, `gpt-5.6-sol`, `gpt-6-astra`.

## neatlogs shape

Docs: https://docs.neatlogs.com/sdk/http-injection

Each line is one body for `POST https://ingest.neatlogs.com/v1/trace`. Root `name` is `spendline-investigator`. Root `project` is `spendline`. The child is `kind: "LLM"` with `model`, `tokens`, `start`, `end`, and `attributes["neatlogs.llm.provider"]`. The team is `metadata.team`. `attributes["neatlogs.end_user.id"]` is on the root only. No span ids are sent. Each trace is one small POST, under the 50 MB limit.

neatlogs analytics queries cannot span more than 30 days (https://docs.neatlogs.com/cli/workflows). This file covers three months. Query it in 30-day windows after a replay.

A write key (`nlw_…`) is the HTTP ingest credential. It is not the project key used by `init()`. No key is stored in this repo.
