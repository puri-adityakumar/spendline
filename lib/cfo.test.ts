import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { monthlyUsage, scenarioCsv, scenarioRows } from "./cfo.ts";
import { loadInvoices } from "./ledger/load.ts";

const invoices = loadInvoices();

test("monthly usage covers every invoice row and the ledger total", () => {
  const usage = monthlyUsage(invoices);
  assert.equal(usage.reduce((n, u) => n + u.requests, 0), 8032);
  assert.equal(Math.round(usage.reduce((n, u) => n + u.costUsd, 0) * 100) / 100, 41.09);
  assert.deepEqual([...new Set(usage.map((u) => u.month))], ["2026-07", "2026-08", "2026-09"]);
});

test("leaky COGS comes from the ledger and capped stays empty until trace B", () => {
  const rows = scenarioRows(invoices);
  assert.deepEqual(
    rows.map((r) => [r.month, r.scenario, r.inferenceCogsUsd]),
    [
      ["2026-07", "leaky", 13.7],
      ["2026-07", "capped", null],
      ["2026-08", "leaky", 13.58],
      ["2026-08", "capped", null],
      ["2026-09", "leaky", 13.81],
      ["2026-09", "capped", null],
    ],
  );
  assert.equal(rows.some((r) => r.customers !== null || r.priceUsd !== null || r.otherCostUsd !== null || r.startingCashUsd !== null), false);
});

test("committed evidence/cfo-input.csv is current", () => {
  const committed = readFileSync("evidence/cfo-input.csv", "utf8");
  assert.equal(committed, scenarioCsv(scenarioRows(invoices)));
  assert.equal(committed.split("\n")[0], "month,scenario,customers,price_usd,inference_cogs_usd,other_cost_usd,starting_cash_usd");
});
