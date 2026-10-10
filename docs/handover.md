# Spendline handover

For a new Cloud Agent on `https://github.com/puri-adityakumar/spendline`. Research only. Do not build this inside `github.com/puri-adityakumar/CRM-merge`. That cloud agent is bound to CRM-merge only.

Team: Typobros. Window: code after **10 Oct 2026, 12:30 IST**. Submit **12 Oct 2026, 19:00–23:55 IST** as a quote post on X (public repo + demo ≤ 3 minutes). This note was written **10 Oct 2026, ~21:45 IST**.

---

## 1. Goal and rules

**Spendline** shows how a fictional five-person team spent tokens and dollars over 14 days, then an agent explains the gaps, survives one failed action, applies one real fix, and proves it with two neatlogs traces.

Our dashboard is the team ledger. neatlogs is the receipt for the investigation. Do not rebuild neatlogs Analytics, Investigate, or Fixes inside Spendline.

Home headline the UI must be able to show: **8.1M tokens, $237 billed, $188 traced, $49 unexplained.**

| Person | Role | Tokens | Billed | Traced | Story |
| --- | --- | --- | --- | --- | --- |
| Maya Chen | Support | 4.2M | $86 | $84 | Retry loop on `support_draft`. Live workload: trace A retries, trace B does not. |
| Jonah Patel | Backend | 1.1M | $64 | $63 | `intent_classify` on an expensive model. Live fix swaps the model. |
| Priya Shah | Growth | 0.9M | $11 | $11 | Normal. Agent must not flag her. |
| Sam Ortiz | Data | 0.5M | $8 | $8 | Normal. |
| Alex Kim | Ops | 1.4M | $68 | $22 | Untracked key ($19) plus a duplicate line ($27). Ledger only. No external company API. |

The only sentence that claims a real saving is neatlogs trace B minus trace A. Alex's $49 is a fixture finding. Say "fixture" on screen.

### Rules that constrain the build

Source: [neatlogs.com/hackathon](https://neatlogs.com/hackathon).

- One track: an agent that finishes a task (plan, tools, state, context, execution, recovery, verification, iteration).
- All code written inside the window. New repo. No files copied from CRM-merge. Ideas and this document may exist beforehand.
- Required tools: **neatlogs, Entire, and cfo.ai**, each with a clear role. Demo covers all three: architecture, implementation, runtime, reasoning, result.
- Weights: agent 30%, the three tools 25%, demo 20%, building in public 15%, usefulness 10%.
- Video ≤ 3 minutes. Quote the official neatlogs post. First 50 quotes get engagement. Tag `#neatHack` while building.

### Evidence checklist

| Required | Artifact |
| --- | --- |
| Before/after with numbers | Two neatlogs traces of workflow `spendline-investigator`, plus `evidence/compare.md` (`totalCostUsd`, `totalTokens`) |
| neatlogs used | Trace ids, screenshots, `neatlogs traces export` markdown |
| Entire used | `Entire-Checkpoint` trailer, pushed checkpoint refs, `evidence/entire-graph.txt`, link `https://entire.io/gh/puri-adityakumar/spendline/commit/FULL_SHA` plus checkpoint id |
| cfo.ai used | Shared Page if an account exists; otherwise `evidence/cfo-input.csv` and a runway panel. See the card blocker below. |
| Recovery | One trace where a tool returns 503 and the next span writes `outbox/alert.md` |
| Building in public | `#neatHack` posts |
| Code in window | Commits on `spendline` dated inside the window |

---

## 2. Project tree

```text
spendline/
  README.md                         # how to run, env vars, evidence index, checkpoint link
  package.json                      # Next.js 16, React 19, Tailwind 4, shadcn base-nova
  components.json                   # style base-nova, css src/app/globals.css, lucide
  postcss.config.mjs                # @tailwindcss/postcss only
  tsconfig.json
  .env.example                      # names only, no secrets
  .gitignore
  AGENTS.md                         # entire-graph managed block plus Spendline notes
  .entire/settings.json             # commit_linking always; committed
  .cursor/hooks.json                # written by `entire agent add cursor`
  app/
    layout.tsx                      # fonts, ThemeProvider, header shell
    globals.css                     # re-created tokens from section 4
    login/page.tsx                  # password form
    page.tsx                        # team dashboard
    team/[person]/page.tsx          # one member
    investigate/page.tsx            # agent run + findings
    evidence/page.tsx               # judges: links and runway
    api/auth/route.ts               # check ADMIN_PASSWORD, set httpOnly cookie
    api/runs/route.ts               # POST start investigation
    api/runs/[id]/route.ts          # GET poll { step, status, detail }
  components/
    site-header.tsx                 # wordmark, nav, theme toggle
    stats-cards.tsx                 # billed, traced, gap, tokens
    spend-bars.tsx                  # horizontal bars by person
    daily-chart.tsx                 # 14-day billed bars
    findings-table.tsx              # anomaly rows + badges
    run-log.tsx                     # step list, same pattern as import progress
    providers.tsx                   # next-themes + sonner
    ui/                             # shadcn: button, card, badge, table, progress, sonner
  lib/
    auth.ts                         # cookie name, password compare
    ledger/types.ts                 # invoice row type
    ledger/load.ts                  # parse CSVs, quarantine bad rows
    ledger/reconcile.ts             # price-card math, four labels, thresholds
    agent/loop.ts                   # plan → ingest → trace → reconcile → act → verify
    agent/state.ts                  # JSON state, resume after crash
    agent/rules.ts                  # labels are code; the model only writes prose
    tools/neatlogs.ts               # cost POST + traces get
    tools/alert.ts                  # first call 503, then write outbox
    tools/workload.ts               # patch config and rerun
    utils.ts                        # cn()
  workload/
    run.ts                          # classify + draft, neatlogs wrap, reads config
    config.json                     # classify_model, max_retries
    golden.ts                       # expected classify labels
  ledger/
    generate.ts                     # seeded generator, run during the hackathon
    invoices.csv                    # generated fixture committed for the demo
    price-card.csv                  # model, input_usd_per_mtok, output_usd_per_mtok
    manifest.json                   # which key_id is the live neatlogs key
  outbox/.gitkeep                   # alert.md appears after recovery
  evidence/
    compare.md                      # trace A vs B numbers
    entire-graph.txt                # stdout of entire graph impact
    cfo-input.csv                   # month, scenario, customers, price, cogs, cash
    README.md                       # what each file proves
```

Poll payload: `{ step, status, detail }`. The page polls. Do not hold one request open for the whole run (Vercel Hobby proxied timeout is 120s; function max is 300s). [Vercel limits](https://vercel.com/docs/limits).

---

## 3. Providers and tools

### neatlogs (required)

Sign up at [app.neatlogs.com](https://app.neatlogs.com). No card. Paid plans are free for the event. Guide: [neatlogs-setup-guide](https://neatlogs.com/hackathon/neatlogs-setup-guide.html).

| Use | How |
| --- | --- |
| Ingest | `npm install neatlogs`. `await init({ apiKey: process.env.NEATLOGS_API_KEY, workflowName: "spendline-investigator" })`. Wrap the model client. `await flush()` / `shutdown()` before a short script exits. Project API key, not the `nlw_` HTTP key. [TypeScript SDK](https://docs.neatlogs.com/sdk/typescript) |
| One trace per investigation | `trace({ name: "investigate-waste", kind: "WORKFLOW" })`. Tag `before` / `after`. Do not put the tag in the workflow name. |
| Read back | CLI: Node 22 or 24, `npm install --global neatlogs-cli@0.2.0`, `neatlogs profile set work --host https://app.neatlogs.com`, `neatlogs auth login --device`, `neatlogs traces list --limit 5`, `neatlogs traces get <id> --json`, `neatlogs traces export <id> --format markdown`. [traces CLI](https://docs.neatlogs.com/cli/commands/traces) |
| Cost rollup | `POST https://app.neatlogs.com/api/v1/public/analytics/cost` with Bearer `NEATLOGS_TOKEN`, header `x-project-id`, body `{ "from", "to" }`. Rows: `group`, `traceCount`, `totalCostUsd`, `totalTokens`. [cost API](https://docs.neatlogs.com/api-reference/endpoints/analytics/post_api_v1_public_analytics_cost) |
| MCP (optional) | `https://ingest.neatlogs.com/mcp`, `Authorization: Bearer` project key. `search_traces`, `get_trace_context`. [MCP](https://docs.neatlogs.com/integrations/mcp) |

Env: `NEATLOGS_API_KEY` (ingest), `NEATLOGS_TOKEN` (read; do not set it equal to a different ingest key in the same process), `NEATLOGS_PROJECT_ID`.

On camera: their traces list, the waste run's span tree, the cheaper run. About twenty seconds. Our pages stay the team view. [Traces UI](https://docs.neatlogs.com/docs/features/traces).

**Unconfirmed:** public unauthenticated trace URL. Ship screenshots plus trace ids. `group` on the cost API may not be per model. If so, sum span tokens and multiply by `price-card.csv`.

### Entire (required)

Guide: [hack.entire.io/neathacks-2026](https://hack.entire.io/neathacks-2026/). No card. Sign in with GitHub.

```bash
curl -fsSL https://entire.io/install.sh | bash   # ~/.local/bin, CLI 0.11.x
entire login --device
cd spendline
entire enable --agent cursor
entire plugin install graph
entire graph init-agents --repo .
```

Set `"commit_linking": "always"` in `.entire/settings.json`. Commit from a shell so hooks run. Git ≥ 2.36 (this VM has 2.43).

Inspect: `entire checkpoint list`, `entire checkpoint explain HEAD`. Graph: `entire graph impact --repo . --symbol <fn>`, `entire graph commit`. Commit the stdout to `evidence/entire-graph.txt`.

Cursor transcripts have **no token counts**. Do not quote Entire as spend. [Cursor agent](https://docs.entire.io/agents/cursor).

Checkpoint link for the submission: `https://entire.io/gh/puri-adityakumar/spendline/commit/FULL_SHA`.

Entire does not run on Vercel. The site only displays the link and the committed graph text.

### cfo.ai (required by the rules, blocked by a card)

Hackathon path [cfo.ai/neathacks](https://cfo.ai/neathacks) requires a card, then cancel in Settings → Billing. This team cannot add a card.

What the agent should still do:

1. Spend at most 15 minutes on [cfo.ai/start](https://cfo.ai/start). If a no-card workspace opens, upload `evidence/cfo-input.csv` (`.csv`, ≤ 50 MB) as a data source and ask Ari for price, COGS, revenue, margin, runway, two scenarios (leaky vs capped). Share the Page. [CSV](https://docs.cfo.ai/integrations/connect-and-sync-data), [share](https://docs.cfo.ai/dashboards/share-pages-and-scenarios).
2. If MCP connects (`https://api.cfo.ai/mcp`, browser OAuth): `edit_scenarios` / `edit_table_blocks` on a Scenario, then `inspect_table_blocks`. [MCP](https://docs.cfo.ai/integrations/mcp-server).
3. If signup wants a card, stop. Keep the CSV and a runway panel on `/evidence`. Say in Discord that the card blocked cfo.ai. Do not invent a cfo.ai URL.

CSV columns: `month, scenario, customers, price_usd, inference_cogs_usd, other_cost_usd, starting_cash_usd`.

### LLM

Wrap whichever client you call so neatlogs sees tokens and model.

- Prefer Amazon Bedrock only if hackathon credits are actually on the account (`wrapBedrock`).
- Else one OpenRouter or Anthropic **inference** key (`wrapOpenRouterAgent` or `wrapAnthropic`).

Env: `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY`. That key is not a billing integration.

### Do not use

| Do not | Why |
| --- | --- |
| OpenRouter, Anthropic, OpenAI, Google, or AWS **billing / usage** APIs | Decision: synthetic ledger plus live neatlogs traces. Those APIs are daily, admin-keyed, or lag hours. |
| Crustdata | Optional. Not required to judge. An earlier idea (enrich Alex's key domain via `POST /company/enrich`) is **dropped**. Explain his gap from the ledger. |
| cfo.ai card / paid checkout | No card. Do not enter payment details. |
| CRM-merge source files | Hackathon forbids prewritten code. Re-type tokens. Do not copy `src/`. |
| Entire as the cost meter | Cursor checkpoints omit tokens. |
| A second hosted backend | API routes on Vercel are the backend. |
| neatlogs `nlw_` key in `init()` | 401. That key is HTTP ingest only. |

### Auth env

`ADMIN_PASSWORD` — one shared password, httpOnly cookie, no user table.

---

## 4. Design system (CRM-merge)

There is **no `tailwind.config.js`**. Tailwind v4. Tokens live in `src/app/globals.css`. shadcn config: `components.json` (`style: base-nova`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`). Primitives are **Base UI** (`@base-ui/react`), not Radix. Package `shadcn` `^4.13.0`.

Colors are **oklch**, not hex. Do not invent hex. Shadow color is the only `hsl` value.

### Light (`:root` in `src/app/globals.css`)

| Token | Value |
| --- | --- |
| `--background` | `oklch(0.9900 0.004 155)` |
| `--foreground` | `oklch(0 0 0)` |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0 0 0)` |
| `--popover` | `oklch(0.9900 0.004 155)` |
| `--primary` / `--primary-foreground` | `oklch(0.48 0.12 155)` / `oklch(1 0 0)` |
| `--secondary` | `oklch(0.9400 0.01 155)` |
| `--muted` | `oklch(0.9700 0.006 155)` |
| `--muted-foreground` | `oklch(0.4400 0.01 155)` |
| `--accent` | `oklch(0.9400 0.01 155)` |
| `--destructive` | `oklch(0.6300 0.1900 23.0300)` |
| `--border` | `oklch(0.9200 0.004 155)` |
| `--input` | `oklch(0.9400 0.004 155)` |
| `--ring` | `oklch(0.48 0.12 155)` |
| `--chart-1` | `oklch(0.6500 0.15 155)` |
| `--chart-2` | `oklch(0.5500 0.2200 264.5300)` |
| `--chart-3` | `oklch(0.7200 0.02 155)` |
| `--chart-4` | `oklch(0.9200 0.01 155)` |
| `--chart-5` | `oklch(0.5600 0 0)` |
| `--sidebar` | `oklch(0.9900 0.004 155)` |
| `--sidebar-primary` | `oklch(0.48 0.12 155)` |
| `--radius` | `0.5rem` |

Hue **155** is the green. `--chart-2` is the blue accent (`264.53`).

### Dark (`.dark` in the same file)

| Token | Value |
| --- | --- |
| `--background` | `oklch(0.12 0.010 155)` |
| `--foreground` | `oklch(1 0 0)` |
| `--card` | `oklch(0.1400 0.010 155)` |
| `--popover` | `oklch(0.1800 0.010 155)` |
| `--primary` / `--primary-foreground` | `oklch(0.72 0.16 155)` / `oklch(0.12 0.010 155)` |
| `--secondary` | `oklch(0.2500 0.012 155)` |
| `--muted` | `oklch(0.2300 0.012 155)` |
| `--muted-foreground` | `oklch(0.7200 0.02 155)` |
| `--accent` | `oklch(0.3200 0.012 155)` |
| `--destructive` | `oklch(0.6900 0.2000 23.9100)` |
| `--destructive-foreground` | `oklch(0 0 0)` |
| `--border` | `oklch(0.2600 0.012 155)` |
| `--input` | `oklch(0.3200 0.012 155)` |
| `--ring` | `oklch(0.72 0.16 155)` |
| `--chart-1` | `oklch(0.7500 0.16 155)` |
| `--chart-2` | `oklch(0.5800 0.2100 260.8400)` |
| `--chart-3` | `oklch(0.5600 0.02 155)` |
| `--chart-4` | `oklch(0.4400 0 0)` |
| `--chart-5` | `oklch(0.9200 0.01 155)` |
| `--sidebar` | `oklch(0.1800 0.010 155)` |

### Radius, type, shadow, spacing

From `@theme inline` and `:root` in `src/app/globals.css`:

- `--radius-sm` `calc(var(--radius) * 0.6)` through `--radius-4xl` `* 2.6`. Base `--radius: 0.5rem`.
- Fonts: `--font-sans: Manrope`, `--font-mono: Geist Mono`, `--font-serif: Georgia`, `--font-heading` = sans. Loaded in `src/app/layout.tsx` via `next/font/google`: Manrope, Geist Mono, MuseoModerno weights `400,500,600,700` as `--font-museo-moderno`.
- Wordmark (`src/components/site-header.tsx`): `text-xl sm:text-2xl font-semibold tracking-[-0.03em]`, family `var(--font-museo-moderno)`.
- Page title (`src/app/import-flow.tsx`): `text-2xl font-semibold tracking-tight sm:text-3xl`.
- Body: `font-sans`, `letter-spacing: var(--tracking-normal)` which is `0em`.
- Numbers: `tabular-nums`.
- `--spacing: 0.25rem`.
- Shadow recipe: color `hsl(0 0% 0%)`, opacity `0.18`, blur `2px`, spread `0`, offset `0 1px`. `--shadow-2xs` and `--shadow-xs` use opacity `0.09`. `--shadow-2xl` uses `0.45`. Full strings are in `globals.css` lines 121–128 (light) and 177–184 (dark). Same values in both themes.

### shadcn components in this repo

| File | What is customized |
| --- | --- |
| `src/components/ui/button.tsx` | Base UI button. Variants: default, outline, secondary, ghost, destructive, link. Default height `h-8`, `text-sm font-medium`, `rounded-lg`, hover `bg-primary/80`. Sizes xs `h-6`, sm `h-7`, lg `h-9`, icon `size-8`. |
| `src/components/ui/badge.tsx` | `h-5`, `rounded-4xl`, `text-xs font-medium`, `px-2`. Variants: default, secondary, destructive, outline, ghost, link. |
| `src/components/ui/card.tsx` | `rounded-xl`, `ring-1 ring-foreground/10`, padding `--card-spacing` = `spacing(4)`, `data-size=sm` uses `spacing(3)`. Title `text-base font-medium`, sm title `text-sm`. Footer `border-t bg-muted/50`. |
| `src/components/ui/progress.tsx` | Track `h-1 rounded-full bg-muted`. Indicator `bg-primary`. Label `text-sm font-medium`. Value `text-sm text-muted-foreground tabular-nums`. |
| `src/components/ui/table.tsx` | Stock shadcn table. Preview uses a raw `<table>` inside it. |
| `src/components/ui/sonner.tsx` | Icons from lucide. CSS vars `--normal-bg: var(--popover)`, `--normal-border: var(--border)`, radius `var(--radius)`. |
| `src/lib/utils.ts` | `cn` = `twMerge(clsx())`. |

App pieces, not the primitive layer:

- `src/components/stats-cards.tsx` — `grid grid-cols-2 lg:grid-cols-4 gap-3`. Card `size="sm"`. Label `text-xs text-muted-foreground` plus a `size-3.5` lucide icon. Value `text-2xl font-semibold tracking-tight tabular-nums`. Hint `text-xs text-muted-foreground`.
- `src/components/horizontal-bar-chart.tsx` — label `w-24 sm:w-32 text-xs`. Track `h-4 rounded-sm bg-muted`. Fill `bg-primary transition-all duration-500`.
- `src/components/site-header.tsx` — `sticky top-0 z-40 h-14 border-b border-border/80 bg-background/80 backdrop-blur-md`. Inner `max-w-6xl px-4 sm:px-6`. Ghost icon button toggles theme.
- `src/components/providers.tsx` — `ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}`. Toaster `richColors closeButton position="top-center"`.
- `src/app/page.tsx` — column `min-h-full bg-background`. Footer `border-t text-xs text-muted-foreground`.
- `src/app/import-flow.tsx` — page `max-w-6xl gap-6 px-4 py-8 sm:px-6`. Stepper: active/done `bg-primary text-primary-foreground`, active also `ring-2 ring-ring/30`, pending `border-2 border-border text-muted-foreground`. Mobile circles `size-9`, desktop `size-7` in a `w-32` rail.
- `src/components/upload-zone.tsx` — `rounded-xl border border-dashed bg-muted/30 px-6 py-14`. Drag `border-primary bg-primary/5`. Icon circle `size-12 rounded-full ring-1 ring-border`.
- `src/components/preview-table.tsx` — `max-h-[calc(100dvh-17rem)] overflow-auto rounded-lg border`. Header `sticky bg-muted/95 backdrop-blur-sm`. Empty cell `—`.
- `src/components/import-progress.tsx` — activity list in `rounded-lg border`. Done: `CheckIcon text-primary`. Active: `Loader2Icon animate-spin` and `bg-muted/50`. Pending: empty circle `border-border`. Indeterminate bar uses `animate-shimmer`.
- `src/app/results-section.tsx` — section `space-y-6`. H2 `text-lg font-semibold` with `CheckCircle2Icon size-4 text-primary`.

### Icons

`lucide-react`. Used: `MoonIcon`, `SunIcon`, `LayersIcon`, `CheckCircle2Icon`, `SkipForwardIcon`, `FileStackIcon`, `CheckIcon`, `Loader2Icon`, `ClockIcon`, `AlertCircleIcon`, `FileSpreadsheetIcon`, `UploadIcon`, `RotateCcwIcon`, `SearchIcon`, `CircleCheckIcon`, `InfoIcon`, `TriangleAlertIcon`, `OctagonXIcon`.

### Motion

`src/app/globals.css`: `@keyframes shimmer` translates X from `-100%` to `400%`. Utility `animate-shimmer` is `1.5s ease-in-out infinite`. `prefers-reduced-motion: reduce` disables it and sets `opacity: 0.3`. Also `tw-animate-css` and `transition-all` / `transition-colors` / `duration-500` on bars and buttons. Spinner: `animate-spin`.

### Recreate in Spendline

1. `npx shadcn@latest init` with Tailwind v4, style **base-nova**, base color neutral. Do not copy CRM-merge files.
2. Re-type the `:root` and `.dark` blocks above into `app/globals.css`, plus the shimmer keyframes.
3. Add Manrope, Geist Mono, and MuseoModerno in `layout.tsx` the same way. Default theme `light`.
4. Add button, card, badge, table, progress, sonner. Match the class strings above by hand.
5. Build stats cards, bars, header, and the progress activity list as new components.

---

## 5. Screens

| Route | What to reuse | Content |
| --- | --- | --- |
| `/login` | Centered card, primary button, muted hint | One password field. Cookie gate. |
| `/` | Header, 4 stat cards, horizontal bars, page title | Team totals and five rows. A row links to `/team/[person]`. Daily bar chart uses the same `bg-primary` bar as `horizontal-bar-chart.tsx`. |
| `/team/[person]` | Card, table, badges | Days, models, keys. Badge `destructive` on the anomaly, `secondary` on normal. Button "Investigate". |
| `/investigate` | Import-progress activity list, stepper, dashed upload zone only if you reload a CSV | Live steps via poll. Findings table. Badges: retry, expensive model, untracked key, duplicate. The 503 step, then the outbox line. Button runs the workload fix. |
| `/evidence` | Stats cards + outline buttons | Trace A/B numbers, neatlogs links, Entire checkpoint link, graph excerpt, cfo CSV or shared Page, runway (price, COGS, revenue, cash). |

Upload is not the home page. The fixture CSV is already in the repo. A file picker on `/investigate` is optional and secondary.

Anomaly badges: `destructive` for the four findings, `outline` for "normal", `default` for "fixed" after trace B.

---

## 6. Build order

Remaining: Saturday night, Sunday, Monday until the quote post. Submit **Monday 19:00–20:30 IST**, not 23:30.

**Saturday night**

- Empty `spendline` repo, design tokens, login, dashboard with the five hardcoded rows (CSV can land an hour later).
- `entire enable`, first checkpoint, neatlogs hello trace (`doctor --probe` then one wrapped call).
- Generator + `reconcile.ts` unit checks for the four anomalies and one bad row.

**Sunday**

- Workload with the real retry and the expensive classify model. Trace A.
- Agent loop, 503 recovery, config patch, trace B, `evidence/compare.md`.
- `entire graph impact` output committed.
- 15-minute cfo.ai attempt, then the CSV either uploaded or left in `evidence/`.
- Person page and investigate log hooked to the poll API.

**Monday**

- Evidence page, README, demo ≤ 3:00 (team dashboard, one person, agent recovery, neatlogs traces, Entire link, runway).
- `#neatHack` if fewer than four posts exist.
- Quote post early in the window.

Split: one person owns `app/` and `components/`. The other owns `lib/`, `workload/`, `ledger/`. Agree the poll payload first.

### Risks

| Risk | What to do |
| --- | --- |
| cfo.ai wants a card | Stop. CSV + runway panel. Do not block Sunday on it. |
| Entire checkpoint missing | `commit_linking: always`. Commit from the shell. `entire checkpoint explain HEAD`. |
| Cost API `group` is not per model | Sum tokens. Use `price-card.csv`. |
| Vercel cuts a long POST | Poll `GET /api/runs/[id]`. |
| Fixture mistaken for a real bill | Label it. Savings sentence uses trace B − trace A only. |
| Copying CRM-merge | Re-type the tokens. Judges can see file history. |
| Commits on CRM-merge | Wrong repo. This handover is not the build. |
