# Trace A vs trace B

Workflow `spendline-investigator`, trace `investigate-waste`. Numbers are from neatlogs `GET /api/v1/public/traces/:id`.

| | Trace A (before) | Trace B (after) |
| --- | --- | --- |
| Trace id | c1d34e8341c9d1a6291d1552cd2b9d4b | 5e723ee0c57b481a316ee7546cc4a331 |
| Tag | before | after |
| classify_model | claude-opus-4.6 | nova-lite |
| max_retries | 2 | 0 |
| Draft calls | 18 | 6 |
| Spans | 49 | 25 |
| totalTokens | 3671 | 1448 |
| totalCostUsd | $0.000000 | $0.000000 |

Intent labels in trace B match trace A on 6 of 6 tickets.

Trace B minus trace A: -2223 tokens, $0.000000.

neatlogs reported no cost for these LiteLLM model names, so the saving is stated in tokens only.
