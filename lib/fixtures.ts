// Screen fixture for the 14-day demo story.
// Agents: this is not ledger/invoices.csv. The 3-month ingest file is a different dataset.
// The UI reads this module until a later change points the player at GET /api/runs/:id.

export type FindingBadge = "retry" | "expensive-model" | "untracked-key" | "duplicate"

export type Finding = {
  personId: string
  badge: FindingBadge
  title: string
  amountUsd: number
  fixture: boolean
}

export type RunStep = "plan" | "ingest" | "trace" | "reconcile" | "act" | "verify"
export type RunStatus = "pending" | "active" | "done" | "error"

export type RunSnapshot = {
  id: string
  step: RunStep
  status: RunStatus
  detail: string
  findings: Finding[]
  outbox: string | null
}

export type RowBadge = "destructive" | "secondary"

export type LedgerRow = {
  day: number
  model: string
  key: string
  tokens: string
  billedUsd: number
  tracedUsd: number
  badge: RowBadge
  note: string
}

export type Person = {
  id: string
  name: string
  role: string
  tokens: string
  billedUsd: number
  tracedUsd: number
  story: string
  rows: LedgerRow[]
}

export const headline = {
  tokens: "8.1M",
  billedUsd: 237,
  tracedUsd: 188,
  unexplainedUsd: 49,
}

export const dailyBilled = [16, 18, 15, 20, 14, 17, 19, 12, 18, 21, 15, 16, 18, 18]

export const runSteps: RunStep[] = ["plan", "ingest", "trace", "reconcile", "act", "verify"]

export const findings: Finding[] = [
  {
    personId: "maya-chen",
    badge: "retry",
    title: "Retry loop on support_draft",
    amountUsd: 2,
    fixture: false,
  },
  {
    personId: "jonah-patel",
    badge: "expensive-model",
    title: "intent_classify on an expensive model",
    amountUsd: 1,
    fixture: false,
  },
  {
    personId: "alex-kim",
    badge: "untracked-key",
    title: "Untracked key",
    amountUsd: 19,
    fixture: true,
  },
  {
    personId: "alex-kim",
    badge: "duplicate",
    title: "Duplicate line",
    amountUsd: 27,
    fixture: true,
  },
]

export const people: Person[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    role: "Support",
    tokens: "4.2M",
    billedUsd: 86,
    tracedUsd: 84,
    story: "Retry loop on support_draft",
    rows: [
      { day: 3, model: "gpt-5.6-luna", key: "sk-support", tokens: "1.4M", billedUsd: 28, tracedUsd: 28, badge: "secondary", note: "normal" },
      { day: 8, model: "gpt-5.6-luna", key: "sk-support", tokens: "2.1M", billedUsd: 42, tracedUsd: 40, badge: "destructive", note: "retry support_draft" },
      { day: 12, model: "gpt-5.6-luna", key: "sk-support", tokens: "0.7M", billedUsd: 16, tracedUsd: 16, badge: "secondary", note: "normal" },
    ],
  },
  {
    id: "jonah-patel",
    name: "Jonah Patel",
    role: "Backend",
    tokens: "1.1M",
    billedUsd: 64,
    tracedUsd: 63,
    story: "intent_classify on an expensive model",
    rows: [
      { day: 4, model: "gpt-6-luna", key: "sk-backend", tokens: "0.4M", billedUsd: 12, tracedUsd: 12, badge: "secondary", note: "normal" },
      { day: 9, model: "gpt-6-astra", key: "sk-backend", tokens: "0.5M", billedUsd: 40, tracedUsd: 39, badge: "destructive", note: "intent_classify" },
      { day: 11, model: "gpt-5.6-terra", key: "sk-backend", tokens: "0.2M", billedUsd: 12, tracedUsd: 12, badge: "secondary", note: "normal" },
    ],
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    role: "Growth",
    tokens: "0.9M",
    billedUsd: 11,
    tracedUsd: 11,
    story: "Normal. Not flagged.",
    rows: [
      { day: 2, model: "gpt-6-luna", key: "sk-growth", tokens: "0.3M", billedUsd: 4, tracedUsd: 4, badge: "secondary", note: "normal" },
      { day: 6, model: "gpt-6-luna", key: "sk-growth", tokens: "0.4M", billedUsd: 4, tracedUsd: 4, badge: "secondary", note: "normal" },
      { day: 13, model: "gpt-5.6-luna", key: "sk-growth", tokens: "0.2M", billedUsd: 3, tracedUsd: 3, badge: "secondary", note: "normal" },
    ],
  },
  {
    id: "sam-ortiz",
    name: "Sam Ortiz",
    role: "Data",
    tokens: "0.5M",
    billedUsd: 8,
    tracedUsd: 8,
    story: "Normal. Not flagged.",
    rows: [
      { day: 5, model: "gpt-6.1-sol", key: "sk-data", tokens: "0.2M", billedUsd: 3, tracedUsd: 3, badge: "secondary", note: "normal" },
      { day: 10, model: "gpt-6-luna", key: "sk-data", tokens: "0.3M", billedUsd: 5, tracedUsd: 5, badge: "secondary", note: "normal" },
    ],
  },
  {
    id: "alex-kim",
    name: "Alex Kim",
    role: "Ops",
    tokens: "1.4M",
    billedUsd: 68,
    tracedUsd: 22,
    story: "Untracked key and a duplicate line. Both rows are fixture.",
    rows: [
      { day: 7, model: "gpt-6.1-sol", key: "sk-ops", tokens: "0.6M", billedUsd: 22, tracedUsd: 22, badge: "secondary", note: "traced" },
      { day: 7, model: "gpt-6-astra", key: "sk-ops-untracked", tokens: "0.4M", billedUsd: 19, tracedUsd: 0, badge: "destructive", note: "fixture untracked key" },
      { day: 14, model: "gpt-5.6-sol", key: "sk-ops-dup", tokens: "0.4M", billedUsd: 27, tracedUsd: 0, badge: "destructive", note: "fixture duplicate" },
    ],
  },
]

const settledFindings = findings

export const investigateSnapshots: RunSnapshot[] = [
  { id: "run-fixture", step: "plan", status: "active", detail: "Reading the 14-day ledger", findings: [], outbox: null },
  { id: "run-fixture", step: "ingest", status: "active", detail: "Loading fixture rows", findings: [], outbox: null },
  { id: "run-fixture", step: "trace", status: "active", detail: "Trace ids are still empty slots", findings: [], outbox: null },
  { id: "run-fixture", step: "reconcile", status: "done", detail: "Reconciled four findings", findings: settledFindings, outbox: null },
  { id: "run-fixture", step: "act", status: "error", detail: "Alert tool returned 503", findings: settledFindings, outbox: null },
  { id: "run-fixture", step: "act", status: "done", detail: "Wrote outbox/alert.md", findings: settledFindings, outbox: "outbox/alert.md" },
  { id: "run-fixture", step: "verify", status: "done", detail: "Checked the outbox line on fixtures", findings: settledFindings, outbox: "outbox/alert.md" },
]

export function personById(id: string) {
  return people.find((person) => person.id === id)
}

export function usd(amount: number) {
  return `$${amount}`
}
