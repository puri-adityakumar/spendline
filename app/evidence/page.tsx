import { readFileSync } from "node:fs"
import { join } from "node:path"

import { FileTextIcon, LinkIcon, WaypointsIcon } from "lucide-react"

import { Card, CardHint, CardTitle } from "@/components/ui/card"
import compare from "@/evidence/compare.json"

const runwayFields = ["price", "COGS", "revenue", "cash"] as const

type Scenario = "leaky" | "capped"

function readEvidence(file: string): string {
  return readFileSync(join(process.cwd(), "evidence", file), "utf8")
}

const usd = (cells: number[]) => (cells.length ? `$${cells.reduce((total, cell) => total + cell, 0).toFixed(2)}` : "—")

function runway(scenario: Scenario): Record<(typeof runwayFields)[number], string> {
  const [header, ...lines] = readEvidence("cfo-input.csv").trim().split(/\r?\n/)
  const columns = header.split(",")
  const rows = lines
    .map((line) => Object.fromEntries(line.split(",").map((cell, i) => [columns[i], cell])))
    .filter((row) => row.scenario === scenario)
  const numbers = (column: string) => rows.filter((row) => row[column] !== "").map((row) => Number(row[column]))
  const paying = rows.filter((row) => row.customers !== "" && row.price_usd !== "")
  return {
    price: usd(numbers("price_usd").slice(-1)),
    COGS: usd(numbers("inference_cogs_usd")),
    revenue: usd(paying.map((row) => Number(row.customers) * Number(row.price_usd))),
    cash: usd(numbers("starting_cash_usd").slice(0, 1)),
  }
}

function RunwayCard({ name }: { name: Scenario }) {
  const values = runway(name)
  return (
    <Card>
      <CardTitle className="capitalize">{name}</CardTitle>
      <CardHint className="mt-1">From evidence/cfo-input.csv, three months. A dash is a cell nobody has supplied.</CardHint>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {runwayFields.map((label) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{values[label]}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function TraceCard({ label, run }: { label: string; run: typeof compare.before }) {
  return (
    <Card>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <WaypointsIcon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{run.totalTokens.toLocaleString("en-US")} tokens</p>
      <CardHint className="mt-1 break-all font-mono">{run.traceId}</CardHint>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">classify_model</dt>
          <dd className="font-mono text-xs">{run.classify_model}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">max_retries</dt>
          <dd className="tabular-nums">{run.max_retries}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Draft calls</dt>
          <dd className="tabular-nums">{run.draftCalls}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Spans</dt>
          <dd className="tabular-nums">{run.spans}</dd>
        </div>
      </dl>
    </Card>
  )
}

export default function EvidencePage() {
  const { before, after, labelsAgree, labelsTotal } = compare
  const tokenDelta = after.totalTokens - before.totalTokens
  const graph = readEvidence("entire-graph.txt").split("\n").slice(1, 10).join("\n")

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Evidence</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The only savings sentence is trace B minus trace A. These figures are the committed neatlogs compare, not a guess.
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        <TraceCard label="Trace A · before" run={before} />
        <TraceCard label="Trace B · after" run={after} />
      </section>
      <Card>
        <CardTitle>
          Trace B minus trace A: {tokenDelta.toLocaleString("en-US")} tokens
        </CardTitle>
        <CardHint className="mt-1">
          Intent labels in trace B match trace A on {labelsAgree} of {labelsTotal} tickets. neatlogs reported $
          {(after.totalCostUsd - before.totalCostUsd).toFixed(6)} cost for these LiteLLM model names, so the saving is stated in tokens.
          Workflow spendline-investigator, trace investigate-waste. Source: evidence/compare.md.
        </CardHint>
      </Card>
      <Card>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LinkIcon className="size-3.5" />
          Entire
        </div>
        <p className="mt-2 text-base font-medium">Checkpoint link</p>
        <CardHint className="mt-1">No checkpoint yet. The link needs a real commit SHA with an Entire-Checkpoint trailer.</CardHint>
        <p className="mt-3 text-xs text-muted-foreground">entire graph impact --repo . --symbol advance</p>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">{graph}</pre>
      </Card>
      <section className="grid gap-3 md:grid-cols-2">
        <RunwayCard name="leaky" />
        <RunwayCard name="capped" />
      </section>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileTextIcon className="size-3.5" />
        cfo input path: evidence/cfo-input.csv. Data API with an OpenAPI spec at /api/cfo/openapi.json.
      </p>
    </main>
  )
}
