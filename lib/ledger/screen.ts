import { loadInvoices } from "./load.ts"
import type { InvoiceRow } from "./types.ts"

export type ModelRollup = {
  model: string
  rows: number
  tokens: number
  costUsd: number
  costCents: number
}

export type DayRollup = {
  day: string
  rows: number
  tokens: number
  costUsd: number
  costCents: number
}

export type TeamRollup = {
  id: string
  name: string
  rows: number
  tokens: number
  costUsd: number
  costCents: number
  models: ModelRollup[]
  days: DayRollup[]
}

export type MonthRollup = {
  key: string
  label: string
  rows: number
  tokens: number
  costUsd: number
  costCents: number
}

export type InvoiceScreen = {
  rows: number
  tokens: number
  costUsd: number
  costCents: number
  start: string
  end: string
  teams: TeamRollup[]
  months: MonthRollup[]
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function teamId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-")
}

function monthLabel(key: string): string {
  const month = Number(key.slice(5, 7))
  return `${MONTHS[month - 1]} ${key.slice(0, 4)}`
}

function build(rows: InvoiceRow[]): InvoiceScreen {
  const teams = new Map<string, TeamRollup>()
  const months = new Map<string, MonthRollup>()
  let tokens = 0
  let costUsd = 0
  let start = rows[0]?.occurredAt.slice(0, 10) ?? ""
  let end = start

  for (const row of rows) {
    const day = row.occurredAt.slice(0, 10)
    tokens += row.totalTokens
    costUsd += row.costUsd
    const cents = row.costUsd
    if (day < start) start = day
    if (day > end) end = day

    const id = teamId(row.team)
    let team = teams.get(id)
    if (!team) {
      team = { id, name: row.team, rows: 0, tokens: 0, costUsd: 0, costCents: 0, models: [], days: [] }
      teams.set(id, team)
    }
    team.rows += 1
    team.tokens += row.totalTokens
    team.costUsd += cents

    let model = team.models.find((item) => item.model === row.model)
    if (!model) {
      model = { model: row.model, rows: 0, tokens: 0, costUsd: 0, costCents: 0 }
      team.models.push(model)
    }
    model.rows += 1
    model.tokens += row.totalTokens
    model.costUsd += cents

    let bucket = team.days.find((item) => item.day === day)
    if (!bucket) {
      bucket = { day, rows: 0, tokens: 0, costUsd: 0, costCents: 0 }
      team.days.push(bucket)
    }
    bucket.rows += 1
    bucket.tokens += row.totalTokens
    bucket.costUsd += cents

    const monthKey = day.slice(0, 7)
    let month = months.get(monthKey)
    if (!month) {
      month = { key: monthKey, label: monthLabel(monthKey), rows: 0, tokens: 0, costUsd: 0, costCents: 0 }
      months.set(monthKey, month)
    }
    month.rows += 1
    month.tokens += row.totalTokens
    month.costUsd += cents
  }

  const round = (amount: number) => Math.round(amount * 100)
  const teamList = [...teams.values()]
  for (const team of teamList) {
    team.costCents = round(team.costUsd)
    for (const model of team.models) model.costCents = round(model.costUsd)
    for (const day of team.days) day.costCents = round(day.costUsd)
    team.models.sort((a, b) => b.costUsd - a.costUsd || a.model.localeCompare(b.model))
    team.days.sort((a, b) => a.day.localeCompare(b.day))
  }
  teamList.sort((a, b) => b.costUsd - a.costUsd || a.name.localeCompare(b.name))
  const monthList = [...months.values()].sort((a, b) => a.key.localeCompare(b.key))
  for (const month of monthList) month.costCents = round(month.costUsd)

  return {
    rows: rows.length,
    tokens,
    costUsd,
    costCents: round(costUsd),
    start,
    end,
    teams: teamList,
    months: monthList,
  }
}

let cached: InvoiceScreen | null = null

export function invoiceScreen(): InvoiceScreen {
  if (!cached) cached = build(loadInvoices())
  return cached
}

export function teamById(id: string): TeamRollup | null {
  return invoiceScreen().teams.find((team) => team.id === id) ?? null
}

export function usdFromCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export function formatTokens(tokens: number): string {
  return tokens.toLocaleString("en-US")
}
