import type { InvoiceRow } from "./ledger/types.ts";

export const SCENARIOS = ["leaky", "capped"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const CFO_HEADER = [
  "month",
  "scenario",
  "customers",
  "price_usd",
  "inference_cogs_usd",
  "other_cost_usd",
  "starting_cash_usd",
] as const;

export type MonthlyUsage = { month: string; team: string; model: string; requests: number; tokens: number; costUsd: number };

export type ScenarioRow = {
  month: string;
  scenario: Scenario;
  customers: number | null;
  priceUsd: number | null;
  inferenceCogsUsd: number | null;
  otherCostUsd: number | null;
  startingCashUsd: number | null;
};

const cents = (usd: number) => Math.round(usd * 100) / 100;
const micros = (usd: number) => Math.round(usd * 1e6) / 1e6;

export function monthlyUsage(invoices: InvoiceRow[]): MonthlyUsage[] {
  const groups = new Map<string, MonthlyUsage>();
  for (const row of invoices) {
    const month = row.occurredAt.slice(0, 7);
    const key = `${month}|${row.team}|${row.model}`;
    const g = groups.get(key) ?? { month, team: row.team, model: row.model, requests: 0, tokens: 0, costUsd: 0 };
    g.requests += 1;
    g.tokens += row.totalTokens;
    g.costUsd += row.costUsd;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, costUsd: micros(g.costUsd) }))
    .sort((a, b) => a.month.localeCompare(b.month) || a.team.localeCompare(b.team) || a.model.localeCompare(b.model));
}

export function scenarioRows(invoices: InvoiceRow[]): ScenarioRow[] {
  const cogs = new Map<string, number>();
  for (const row of invoices) {
    const month = row.occurredAt.slice(0, 7);
    cogs.set(month, (cogs.get(month) ?? 0) + row.costUsd);
  }
  return [...cogs.keys()].sort().flatMap((month) =>
    SCENARIOS.map((scenario) => ({
      month,
      scenario,
      customers: null,
      priceUsd: null,
      inferenceCogsUsd: scenario === "leaky" ? cents(cogs.get(month)!) : null,
      otherCostUsd: null,
      startingCashUsd: null,
    })),
  );
}

export function scenarioCsv(rows: ScenarioRow[]): string {
  const cell = (v: number | string | null) => (v === null ? "" : String(v));
  const lines = rows.map((r) =>
    [r.month, r.scenario, r.customers, r.priceUsd, r.inferenceCogsUsd, r.otherCostUsd, r.startingCashUsd].map(cell).join(","),
  );
  return `${[CFO_HEADER.join(","), ...lines].join("\n")}\n`;
}
