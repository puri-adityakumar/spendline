# Evidence

What each file here proves. Spend numbers on the Spendline screens come from a fixture ledger, not a real bill. The only measured saving is trace B minus trace A.

| File | Proves | How it is made |
| --- | --- | --- |
| `runs/before.json` | Trace A ran: its neatlogs trace id, the leaky config, and the intent labels it produced | `npm run workload:before` |
| `runs/after.json` | Trace B ran after one config patch, with its trace id and labels | `npm run workload:fix` |
| `compare.md` | The agent improved: tokens and cost for A and B from neatlogs, and that B's intent labels match A's | `npm run workload:compare` |
| `cfo-input.csv` | cfo.ai input: monthly inference COGS for the `leaky` and `capped` scenarios | `npm run cfo:csv` |
| `entire-graph.txt` | Entire graph output for a symbol in this repo | `entire graph impact --repo . --symbol <fn>` |

Files that are not here yet have not been produced. Nothing in this folder is hand-written numbers.

Recovery evidence lives in neatlogs rather than a file: an `investigate` run's `act` step trace shows the `alert` TOOL span failing with 503, and the next `act` trace writes `outbox/alert.md`.
