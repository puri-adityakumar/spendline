import { FINDING_RULES } from "../agent/rules.ts";
import type { Badge, Finding, Ledger, PersonId, PersonTotals, Reconciliation } from "./types.ts";

const usd = (cents: number) => cents / 100;

export function reconcile(ledger: Ledger): Reconciliation {
  const totals = new Map<PersonId, PersonTotals>();
  for (const row of ledger.rows) {
    const t = totals.get(row.personId) ?? { personId: row.personId, tokens: 0, billedUsd: 0, tracedUsd: 0 };
    t.tokens += row.tokens;
    t.billedUsd += row.billedCents;
    t.tracedUsd += row.tracedCents;
    totals.set(row.personId, t);
  }
  const people = [...totals.values()].map((t) => ({ ...t, billedUsd: usd(t.billedUsd), tracedUsd: usd(t.tracedUsd) }));

  const findings: Finding[] = [];
  for (const [badge, rule] of Object.entries(FINDING_RULES) as [Badge, (typeof FINDING_RULES)[Badge]][]) {
    const matches = rule.matches(ledger);
    const byPerson = new Map<PersonId, number>();
    ledger.rows.forEach((row, i) => {
      if (matches(row, i)) byPerson.set(row.personId, (byPerson.get(row.personId) ?? 0) + row.billedCents);
    });
    for (const [personId, amount] of byPerson) {
      findings.push({ personId, badge, title: "", amountUsd: usd(amount), fixture: rule.fixture });
    }
  }
  return { people, findings };
}
