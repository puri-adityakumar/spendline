import { LinkIcon, WaypointsIcon } from "lucide-react"

import { Card, CardHint, CardTitle } from "@/components/ui/card"

const runwayFields = ["price", "COGS", "revenue", "cash"] as const

function RunwayCard({ name }: { name: "leaky" | "capped" }) {
  return (
    <Card>
      <CardTitle className="capitalize">{name}</CardTitle>
      <CardHint className="mt-1">Runway slot. Empty cells are a pass.</CardHint>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {runwayFields.map((field) => (
          <div key={field}>
            <dt className="text-xs text-muted-foreground">{field}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">—</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export default function EvidencePage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Evidence</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The only savings sentence is trace B minus trace A. These figures are the committed neatlogs compare, not a guess.
        </p>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <WaypointsIcon className="size-3.5" />
            Trace A
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">3,671 tokens</p>
          <CardHint className="mt-1">c1d34e8341c9d1a6291d1552cd2b9d4b · claude-opus-4.6 · reported cost $0.000000</CardHint>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <WaypointsIcon className="size-3.5" />
            Trace B
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">1,448 tokens</p>
          <CardHint className="mt-1">5e723ee0c57b481a316ee7546cc4a331 · nova-lite · trace B minus trace A is −2,223 tokens</CardHint>
        </Card>
      </section>
      <Card>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LinkIcon className="size-3.5" />
          Entire
        </div>
        <p className="mt-2 text-base font-medium">Checkpoint link</p>
        <CardHint className="mt-1">Empty slot. A real commit SHA is required before this becomes a link.</CardHint>
        <p className="mt-3 text-sm text-muted-foreground">Graph excerpt: empty slot.</p>
      </Card>
      <section className="grid gap-3 md:grid-cols-2">
        <RunwayCard name="leaky" />
        <RunwayCard name="capped" />
      </section>
      <p className="text-xs text-muted-foreground">
        cfo input path: evidence/cfo-input.csv. No shared Page. Runway cells stay empty until a real figure is supplied.
      </p>
    </main>
  )
}
