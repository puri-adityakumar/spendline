"use client"

import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHint, CardTitle } from "@/components/ui/card"

const steps = ["plan", "ingest", "trace", "reconcile", "act", "verify"] as const

type RunStatus = "pending" | "active" | "done" | "error"

type RunSnapshot = {
  id: string
  step: (typeof steps)[number]
  status: RunStatus
  detail: string
  outbox: string | null
}

async function startRun(mode: "investigate" | "fix"): Promise<{ id: string }> {
  const body = { mode: mode === "fix" ? "fix" : "investigate" } as const
  const response = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `POST /api/runs returned ${response.status}`)
  }
  return (await response.json()) as { id: string }
}

async function readRun(id: string): Promise<RunSnapshot> {
  const response = await fetch(`/api/runs/${id}`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `GET /api/runs/${id} returned ${response.status}`)
  }
  return (await response.json()) as RunSnapshot
}

export function InvestigateScreen({
  snapshot,
  mode,
  team,
  error,
  onRun,
}: {
  snapshot: RunSnapshot | null
  mode: "investigate" | "fix"
  team?: string | null
  error?: string | null
  onRun?: (mode: "investigate" | "fix") => void
}) {
  const stepIndex = snapshot ? steps.indexOf(snapshot.step) : -1

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
              Runs call POST /api/runs and poll GET /api/runs/:id. The invoice file is the ledger those runs read.
              {team ? ` Team ${team}.` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onRun?.("investigate")}>
              Run investigate
            </Button>
            <Button type="button" onClick={() => onRun?.("fix")}>
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
          {snapshot?.outbox ? <p className="mt-2 font-mono text-xs">{snapshot.outbox}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "fix" ? '{ mode: "fix" }' : '{ mode: "investigate" }'}
          </p>
        </Card>
      </div>
    </main>
  )
}

export default function InvestigatePage() {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null)
  const [mode, setMode] = useState<"investigate" | "fix">("investigate")
  const [team, setTeam] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTeam(params.get("team"))
  }, [])

  useEffect(() => {
    if (!runId) return
    let stopped = false
    const timer = window.setInterval(() => {
      void readRun(runId)
        .then((next) => {
          if (stopped) return
          setSnapshot(next)
          if (next.step === "verify" && next.status === "done") {
            window.clearInterval(timer)
          }
        })
        .catch((cause: unknown) => {
          if (stopped) return
          setError(cause instanceof Error ? cause.message : "Run poll failed")
        })
    }, 700)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [runId])

  async function onRun(nextMode: "investigate" | "fix") {
    setMode(nextMode)
    setError(null)
    setSnapshot(null)
    try {
      const created = await startRun(nextMode)
      setRunId(created.id)
      setSnapshot(await readRun(created.id))
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Run failed")
    }
  }

  return <InvestigateScreen snapshot={snapshot} mode={mode} team={team} error={error} onRun={onRun} />
}
