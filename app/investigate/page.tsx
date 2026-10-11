"use client"

import { CheckIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHint, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const steps = ["plan", "ingest", "trace", "reconcile", "act", "verify"] as const

type RunMode = "investigate" | "fix"
type RunStatus = "pending" | "active" | "done" | "error"

type Finding = {
  personId: string
  badge: "retry" | "expensive-model" | "untracked-key" | "duplicate"
  title: string
  amountUsd: number
  fixture: boolean
}

type RunSnapshot = {
  id: string
  step: (typeof steps)[number]
  status: RunStatus
  detail: string
  findings: Finding[]
  outbox: string | null
}

type LogEntry = { snapshot: RunSnapshot; traceId: string | null }

const POLL_GAP_MS = 600

async function errorFrom(response: Response, fallback: string): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  return new Error(payload?.error ?? fallback)
}

async function startRun(mode: RunMode): Promise<{ id: string }> {
  const body = { mode: mode === "fix" ? "fix" : "investigate" } as const
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await errorFrom(response, `POST /api/runs returned ${response.status}`)
  return (await response.json()) as { id: string }
}

async function readRun(id: string): Promise<LogEntry> {
  const response = await fetch(`/api/runs/${id}`)
  if (!response.ok) throw await errorFrom(response, `GET /api/runs/${id} returned ${response.status}`)
  return { snapshot: (await response.json()) as RunSnapshot, traceId: response.headers.get("x-neatlogs-trace-id") }
}

// Verify is the last step. A step that errors twice in a row will not recover by polling again,
// and the first act error is the expected 503 that the next poll recovers from.
function isTerminal(log: LogEntry[]): boolean {
  const [previous, last] = log.slice(-2).map((entry) => entry.snapshot)
  if (!last) return false
  if (last.step === "verify") return true
  return last.status === "error" && previous?.status === "error" && previous.step === last.step
}

const person = (id: string) => id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")

function FindingsTable({ findings }: { findings: Finding[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Finding</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {findings.map((finding) => (
          <TableRow key={`${finding.personId}-${finding.badge}`}>
            <TableCell className="whitespace-nowrap font-medium">{person(finding.personId)}</TableCell>
            <TableCell>
              <Badge variant="destructive">{finding.badge}</Badge>
            </TableCell>
            <TableCell className="tabular-nums">${finding.amountUsd.toFixed(2)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{finding.fixture ? "fixture" : "ledger"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function RunLog({ log }: { log: LogEntry[] }) {
  return (
    <ol className="space-y-2">
      {log.map(({ snapshot, traceId }, index) => (
        <li key={index} className="grid gap-1 rounded-lg p-3 text-sm ring-1 ring-foreground/10 sm:grid-cols-[6rem_4rem_1fr]">
          <span className="font-medium">{snapshot.step}</span>
          <span className={snapshot.status === "error" ? "text-destructive" : "text-muted-foreground"}>{snapshot.status}</span>
          <span className="min-w-0">
            <span className="break-words">{snapshot.detail}</span>
            {traceId ? <span className="mt-0.5 block break-all font-mono text-xs text-muted-foreground">trace {traceId}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function InvestigateScreen({
  snapshot,
  mode,
  team,
  error,
  onRun,
  log = [],
  running = false,
}: {
  snapshot: RunSnapshot | null
  mode: RunMode
  team?: string | null
  error?: string | null
  onRun?: (mode: RunMode) => void
  log?: LogEntry[]
  running?: boolean
}) {
  const stepIndex = snapshot ? steps.indexOf(snapshot.step) : -1
  const needsLogin = error === "Sign in to start a run"

  return (
    <main className="mx-auto grid w-full min-w-0 max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_1fr]">
      <ol className="space-y-3">
        {steps.map((step, index) => {
          const done = snapshot ? index < stepIndex || (index === stepIndex && snapshot.status === "done") : false
          const active = snapshot ? index === stepIndex && snapshot.status !== "done" : false
          const failed = active && snapshot?.status === "error"
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              <span
                className={
                  done
                    ? "flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : failed
                      ? "flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      : "flex size-7 items-center justify-center rounded-full border-2 border-border text-muted-foreground"
                }
              >
                {done ? <CheckIcon className="size-3.5" /> : failed ? "!" : active ? <Loader2Icon className="size-3.5 animate-spin" /> : index + 1}
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
              Runs call POST /api/runs and poll GET /api/runs/:id, one step per poll. Each step is a neatlogs trace.
              {team ? ` Team ${team}.` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={running} onClick={() => onRun?.("investigate")}>
              Run investigate
            </Button>
            <Button type="button" disabled={running} onClick={() => onRun?.("fix")}>
              Run fix
            </Button>
          </div>
        </div>
        <Card size="sm">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="capitalize">{snapshot?.step ?? "Idle"}</CardTitle>
            <Badge variant={snapshot?.status === "error" ? "destructive" : snapshot?.status === "done" ? "default" : "secondary"}>
              {snapshot?.status ?? mode}
            </Badge>
          </div>
          <CardHint className="mt-2">{error ?? snapshot?.detail ?? "No run yet."}</CardHint>
          {needsLogin ? (
            <Link href="/login" className="mt-2 inline-block text-sm underline underline-offset-4">
              Sign in
            </Link>
          ) : null}
          {snapshot?.outbox ? <p className="mt-2 font-mono text-xs">{snapshot.outbox}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "fix" ? '{ mode: "fix" }' : '{ mode: "investigate" }'}
          </p>
        </Card>
        {snapshot && snapshot.findings.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Findings</h2>
            <FindingsTable findings={snapshot.findings} />
          </section>
        ) : null}
        {log.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Run log</h2>
            <RunLog log={log} />
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default function InvestigatePage() {
  const [mode, setMode] = useState<RunMode>("investigate")
  const [team, setTeam] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const generation = useRef(0)

  useEffect(() => {
    setTeam(new URLSearchParams(window.location.search).get("team"))
    return () => {
      generation.current++
    }
  }, [])

  async function onRun(nextMode: RunMode) {
    const current = ++generation.current
    setMode(nextMode)
    setError(null)
    setLog([])
    setRunning(true)
    try {
      const { id } = await startRun(nextMode)
      const entries: LogEntry[] = []
      while (current === generation.current && !isTerminal(entries)) {
        entries.push(await readRun(id))
        if (current === generation.current) setLog([...entries])
        await new Promise((resolve) => window.setTimeout(resolve, POLL_GAP_MS))
      }
    } catch (cause: unknown) {
      if (current === generation.current) setError(cause instanceof Error ? cause.message : "Run failed")
    } finally {
      if (current === generation.current) setRunning(false)
    }
  }

  return (
    <InvestigateScreen
      snapshot={log.at(-1)?.snapshot ?? null}
      mode={mode}
      team={team}
      error={error}
      onRun={onRun}
      log={log}
      running={running}
    />
  )
}
