import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import HomePage from "../app/page"
import EvidencePage from "../app/evidence/page"
import { LoginScreen } from "../app/login/page"
import { PersonScreen } from "../app/team/[person]/page"
import { InvestigateScreen } from "../app/investigate/page"
import { dailyBilled, investigateSnapshots, people } from "../lib/fixtures"

const peopleIds = ["maya-chen", "jonah-patel", "priya-shah", "sam-ortiz", "alex-kim"] as const

describe("dashboard", () => {
  const html = renderToStaticMarkup(<HomePage />)

  it("shows the screen headline", () => {
    expect(html).toContain("8.1M")
    expect(html).toContain("$237")
    expect(html).toContain("$188")
    expect(html).toContain("$49")
  })

  it("links the five people", () => {
    for (const id of peopleIds) {
      expect(html).toContain(`/team/${id}`)
    }
    expect(html).toContain("Maya Chen")
    expect(html).toContain("Jonah Patel")
    expect(html).toContain("Priya Shah")
    expect(html).toContain("Sam Ortiz")
    expect(html).toContain("Alex Kim")
  })

  it("renders 14 daily bars that sum to 237", () => {
    expect(dailyBilled).toHaveLength(14)
    expect(dailyBilled.reduce((sum, value) => sum + value, 0)).toBe(237)
    const amounts = [...html.matchAll(/data-day-billed="(\d+)"/g)].map((match) => Number(match[1]))
    expect(amounts).toEqual(dailyBilled)
  })
})

describe("login", () => {
  it("renders one password field and posts { password }", () => {
    const html = renderToStaticMarkup(<LoginScreen />)
    expect(html.match(/type="password"/g)).toHaveLength(1)
    expect(html).toContain('name="password"')
    const source = readFileSync(new URL("../app/login/page.tsx", import.meta.url), "utf8")
    expect(source).toContain("BACKEND: connect POST /api/auth here")
    expect(source).toContain("password")
  })
})

describe("person page", () => {
  it("shows the ledger columns", () => {
    const html = renderToStaticMarkup(<PersonScreen personId="maya-chen" />)
    for (const column of ["day", "model", "key", "tokens", "billed", "traced"]) {
      expect(html.toLowerCase()).toContain(column)
    }
    expect(html).toContain("Investigate")
    expect(html).toContain("/investigate?person=maya-chen")
  })

  it("marks anomalies destructive and normal rows secondary", () => {
    const maya = renderToStaticMarkup(<PersonScreen personId="maya-chen" />)
    const jonah = renderToStaticMarkup(<PersonScreen personId="jonah-patel" />)
    const priya = renderToStaticMarkup(<PersonScreen personId="priya-shah" />)
    const sam = renderToStaticMarkup(<PersonScreen personId="sam-ortiz" />)
    const alex = renderToStaticMarkup(<PersonScreen personId="alex-kim" />)

    expect(maya).toContain('data-badge="destructive"')
    expect(maya).toContain("support_draft")
    expect(jonah).toContain('data-badge="destructive"')
    expect(jonah).toContain("intent_classify")
    expect(priya).not.toContain('data-badge="destructive"')
    expect(priya).toContain('data-badge="secondary"')
    expect(sam).not.toContain('data-badge="destructive"')
    expect(sam).toContain('data-badge="secondary"')
    expect(alex).toContain('data-badge="destructive"')
    expect(alex).toContain("fixture")
    expect(alex).toContain("$19")
    expect(alex).toContain("$27")
  })

  it("knows all five contract ids", () => {
    expect(people.map((person) => person.id)).toEqual([...peopleIds])
  })
})

describe("investigate player", () => {
  const actError = investigateSnapshots.findIndex(
    (snapshot) => snapshot.step === "act" && snapshot.status === "error",
  )
  const actDone = investigateSnapshots.findIndex(
    (snapshot) => snapshot.step === "act" && snapshot.status === "done",
  )

  it("emits the 503 snapshot and then the outbox snapshot", () => {
    expect(actError).toBeGreaterThanOrEqual(0)
    expect(actDone).toBeGreaterThan(actError)
    const errorHtml = renderToStaticMarkup(
      <InvestigateScreen snapshotIndex={actError} mode="investigate" />,
    )
    const doneHtml = renderToStaticMarkup(
      <InvestigateScreen snapshotIndex={actDone} mode="investigate" />,
    )
    expect(errorHtml).toContain("Alert tool returned 503")
    expect(errorHtml).toContain("act")
    expect(doneHtml).toContain("Wrote outbox/alert.md")
    expect(doneHtml).toContain("outbox/alert.md")
    for (const step of ["plan", "ingest", "trace", "reconcile", "act", "verify"]) {
      expect(errorHtml).toContain(step)
    }
  })

  it("omits Priya and Sam and keeps Alex fixture amounts", () => {
    const html = renderToStaticMarkup(
      <InvestigateScreen snapshotIndex={actDone} mode="investigate" />,
    )
    expect(html).not.toContain("priya-shah")
    expect(html).not.toContain("sam-ortiz")
    expect(html).not.toContain("Priya Shah")
    expect(html).not.toContain("Sam Ortiz")
    expect(html).toContain("untracked-key")
    expect(html).toContain("duplicate")
    expect(html).toContain("retry")
    expect(html).toContain("expensive-model")
    expect(html).toContain("$19")
    expect(html).toContain("$27")
    expect(html).toContain("fixture")
  })

  it("uses mode fix locally and names the future run routes", () => {
    const html = renderToStaticMarkup(
      <InvestigateScreen snapshotIndex={0} mode="investigate" />,
    )
    expect(html).toContain("Run fix")
    const source = readFileSync(new URL("../app/investigate/page.tsx", import.meta.url), "utf8")
    expect(source).toContain("BACKEND: connect POST /api/runs here")
    expect(source).toContain("BACKEND: connect GET /api/runs/:id here")
    expect(source).toContain('mode: "fix"')
    expect(source).toContain("{ mode: \"fix\" }")
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
    expect(html).not.toContain("Alex")
    expect(html).not.toContain("$49")
  })
})
