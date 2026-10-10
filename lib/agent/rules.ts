import type { Badge, Ledger, LedgerRow } from "../ledger/types.ts";

export const STEPS = ["plan", "ingest", "trace", "reconcile", "act", "verify"] as const;
export type Step = (typeof STEPS)[number];

type FindingRule = {
  fixture: boolean;
  matches: (ledger: Ledger) => (row: LedgerRow, index: number) => boolean;
};

function mostExpensiveModel(ledger: Ledger): string {
  return ledger.priceCard.reduce((a, b) => (b.outputUsdPerMtok > a.outputUsdPerMtok ? b : a)).model;
}

function repeatsEarlierRequest(ledger: Ledger): (row: LedgerRow, index: number) => boolean {
  return (row, index) => ledger.rows.findIndex((r) => r.requestId === row.requestId) < index;
}

export const FINDING_RULES: Record<Badge, FindingRule> = {
  retry: {
    fixture: false,
    matches: () => (row) => row.attempt > 1,
  },
  "expensive-model": {
    fixture: false,
    matches: (ledger) => {
      const model = mostExpensiveModel(ledger);
      return (row) => row.model === model;
    },
  },
  "untracked-key": {
    fixture: true,
    matches: (ledger) => (row) => row.keyId !== ledger.manifest.liveNeatlogsKeyId,
  },
  duplicate: {
    fixture: true,
    matches: repeatsEarlierRequest,
  },
};
