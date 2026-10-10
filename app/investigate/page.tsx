"use client"

import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHint, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { investigateSnapshots, people, runSteps, usd, type RunSnapshot } from "@/lib/fixtures"

function startRun(mode: "investigate" | "fix"): { mode: "investigate" | "fix" } {
  const body: { mode: "investigate" | "fix" } = mode === "fix" ? { mode: "fix" } : { mode: "investigate" }
  // BACKEND: connect POST /api/runs here
  return body
}

function readRun(id: string, index: number): RunSnapshot {
  // BACKEND: connect GET /api/runs/:id here
  const snapshot = investigateSnapshots[index] ?? investigateSnapshots[0]
  return snapshot.id === id ? snapshot : investigateSnapshots[0]
}

export function InvestigateScreen({
  snapshotIndex,
  mode,
  person,
  onRunFix,
}: {
  snapshotIndex: number
  mode: "investigate" | "fix"
  person?: string | null
  onRunFix?: () => void
}) {
  const snapshot = readRun("run-fixture", snapshotIndex)
  const stepIndex = runSteps.indexOf(snapshot.step)

  return (
    <main className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_1fr]">
      <ol className="space-y-3">
        {runSteps.map((step, index) => {
          const done = index < stepIndex || (index === stepIndex && snapshot.status === "done")
          const active = index === stepIndex && snapshot.status !== "done"
          const error = active && snapshot.status === "error"
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              <span
                className={
                  done
                    ? "flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : error
                      ? "flex size-7 items-center justify-center rounded-full bg-destructive text-white"
                      : active
                        ? "flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-ring/30"
                        : "flex size-7 items-center justify-center rounded-full border-2 border-border text-muted-foreground"
                }
              >
                {done ? <CheckIcon className="size-3.5" /> : error ? "!" : active ? <Loader2Icon className="size-3.5 animate-spin" /> : index + 1}
              </span>
              <span className={active || done ? "text-foreground" : "text-muted-foreground"}>{step}</span>
            </li>
          )
        })}
      </ol>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Investigate</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Local player. The person query is UI only. The run covers the whole team.
            </p>
          </div>
          <Button type="button" onClick={onRunFix}>
            Run fix
          </Button>
        </div>
        <Card size="sm">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="capitalize">{snapshot.step}</CardTitle>
            <Badge variant={snapshot.status === "error" ? "destructive" : snapshot.status === "done" ? "default" : "secondary"}>
              {snapshot.status}
            </Badge>
          </div>
          <CardHint className="mt-2">{snapshot.detail}</CardHint>
          {snapshot.outbox ? <p className="mt-2 font-mono text-xs">{snapshot.outbox}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Local body {mode === "fix" ? '{ mode: "fix" }' : '{ mode: "investigate" }'}
            {person ? ` · person ${person}` : ""}
          </p>
        </Card>
        <Card>
          <CardTitle>Findings</CardTitle>
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fixture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.findings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Findings appear after reconcile.
                    </TableCell>
                  </TableRow>
                ) : (
                  snapshot.findings.map((finding) => {
                    const name = people.find((personRow) => personRow.id === finding.personId)?.name ?? finding.personId
                    return (
                      <TableRow key={`${finding.personId}-${finding.badge}`}>
                        <TableCell>{name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{finding.badge}</Badge>
                        </TableCell>
                        <TableCell>{finding.title}</TableCell>
                        <TableCell className="tabular-nums">{usd(finding.amountUsd)}</TableCell>
                        <TableCell>{finding.fixture ? "fixture" : "—"}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default function InvestigatePage() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<"investigate" | "fix">("investigate")
  const [person, setPerson] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPerson(params.get("person"))
    const at = params.get("at")
    if (at !== null && at !== "") {
      const next = Number(at)
      if (!Number.isNaN(next)) {
        setIndex(Math.min(Math.max(next, 0), investigateSnapshots.length - 1))
        setPinned(true)
      }
    }
  }, [])

  useEffect(() => {
    if (pinned || index >= investigateSnapshots.length - 1) return
    const timer = window.setTimeout(() => setIndex((value) => value + 1), 900)
    return () => window.clearTimeout(timer)
  }, [index, pinned])

  return (
    <InvestigateScreen
      snapshotIndex={index}
      mode={mode}
      person={person}
      onRunFix={() => {
        const body = startRun("fix")
        setMode(body.mode)
        setIndex(0)
        setPinned(false)
      }}
    />
  )
}
