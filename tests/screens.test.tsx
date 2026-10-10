import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import HomePage from "../app/page"
import EvidencePage from "../app/evidence/page"
import { LoginScreen } from "../app/login/page"
import { PersonScreen } from "../app/team/[person]/page"
import { InvestigateScreen } from "../app/investigate/page"
import { invoiceScreen } from "../lib/ledger/screen"

const teamIds = ["support", "backend", "growth", "data", "ops"] as const

describe("dashboard", () => {
  const ledger = invoiceScreen()
  const html = renderToStaticMarkup(<HomePage />)

  it("shows the invoice file totals", () => {
    expect(ledger.rows).toBe(8032)
    expect(ledger.tokens).toBe(21270693)
    expect(ledger.costCents).toBe(4109)
    expect(ledger.start).toBe("2026-07-01")
    expect(ledger.end).toBe("2026-09-30")
    expect(html).toContain("21,270,693")
    expect(html).toContain("$41.09")
    expect(html).toContain("8,032")
    expect(html).not.toContain("8.1M")
    expect(html).not.toContain("$237")
    expect(html).not.toContain("$188")
    expect(html).not.toContain("$49")
    expect(html).not.toContain("Maya")
  })

  it("links the five invoice teams", () => {
    expect(ledger.teams.map((team) => team.id).sort()).toEqual([...teamIds].sort())
    for (const id of teamIds) {
      expect(html).toContain(`/team/${id}`)
    }
    for (const name of ["Support", "Backend", "Growth", "Data", "Ops"]) {
      expect(html).toContain(name)
    }
  })

  it("renders monthly bars that sum to the invoice cost", () => {
    const amounts = [...html.matchAll(/data-month-cents="(\d+)"/g)].map((match) => Number(match[1]))
    expect(amounts).toEqual(ledger.months.map((month) => month.costCents))
    expect(amounts.reduce((sum, value) => sum + value, 0)).toBe(4109)
  })
})

describe("login", () => {
  it("renders one password field and posts { password }", () => {
    const html = renderToStaticMarkup(<LoginScreen />)
    expect(html.match(/type="password"/g)).toHaveLength(1)
    expect(html).toContain('name="password"')
    expect(html).toContain('method="post"')
    expect(html).toContain('action="/api/auth/form"')
    const source = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8")
    expect(source).toContain('fetch("/api/auth"')
    expect(source).toContain("JSON.stringify(body)")
    expect(source).toContain("password")
  })
})

describe("team page", () => {
  it("shows invoice columns for a team and the team total", () => {
    const html = renderToStaticMarkup(<PersonScreen personId="support" />)
    for (const column of ["model", "rows", "tokens", "cost", "day"]) {
      expect(html.toLowerCase()).toContain(column)
    }
    const support = invoiceScreen().teams.find((team) => team.id === "support")
    expect(support).toBeTruthy()
    expect(html).toContain("Support")
    expect(html).toContain("/investigate?team=support")
    expect(html).not.toContain("Maya")
    expect(html).not.toContain("fixture")
  })

  it("covers every invoice row across the five teams", () => {
    const ledger = invoiceScreen()
    expect(ledger.teams.reduce((sum, team) => sum + team.rows, 0)).toBe(8032)
    expect(ledger.teams.reduce((sum, team) => sum + team.tokens, 0)).toBe(21270693)
    expect(ledger.costCents).toBe(4109)
    for (const team of ledger.teams) {
      expect(team.costCents).toBe(Math.round(team.costUsd * 100))
    }
  })
})

describe("investigate player", () => {
  it("starts idle and posts a real run", () => {
    const html = renderToStaticMarkup(<InvestigateScreen snapshot={null} mode="investigate" />)
    expect(html).toContain("Run fix")
    expect(html).toContain("Run investigate")
    expect(html).toContain("mode:")
    for (const step of ["plan", "ingest", "trace", "reconcile", "act", "verify"]) {
      expect(html).toContain(step)
    }
    expect(html).not.toContain("Maya")
    expect(html).not.toContain("Alex")
    expect(html).not.toContain("$49")
    const source = readFileSync(new URL("../app/investigate/page.tsx", import.meta.url), "utf8")
    expect(source).toContain('fetch("/api/runs"')
    expect(source).toContain("fetch(`/api/runs/${id}`)")
    expect(source).toContain('mode: "fix"')
    expect(source).toContain('{ mode: "fix" }')
  })
})

describe("evidence slots", () => {
  const html = renderToStaticMarkup(<EvidencePage />)

  it("labels trace, Entire, and runway slots", () => {
    expect(html).toContain("Trace A")
    expect(html).toContain("Trace B")
    expect(html).toContain("Entire")
    expect(html).toContain("leaky")
    expect(html).toContain("capped")
    for (const field of ["price", "COGS", "revenue", "cash"]) {
      expect(html).toContain(field)
    }
    expect(html.toLowerCase()).toContain("trace b minus trace a")
    expect(html).toContain("3,671")
    expect(html).toContain("1,448")
    expect(html).not.toContain("Alex")
    expect(html).not.toContain("$49")
    expect(html.toLowerCase()).not.toContain("fixture")
  })
})
