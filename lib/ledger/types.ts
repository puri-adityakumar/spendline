export type PersonId = "maya-chen" | "jonah-patel" | "priya-shah" | "sam-ortiz" | "alex-kim";

export type Badge = "retry" | "expensive-model" | "untracked-key" | "duplicate";

export type InvoiceRow = {
  team: string;
  occurredAt: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
};

export type LedgerRow = {
  requestId: string;
  personId: PersonId;
  day: string;
  operation: string;
  model: string;
  keyId: string;
  attempt: number;
  tokens: number;
  billedCents: number;
  tracedCents: number;
};

export type PriceCardRow = {
  model: string;
  inputUsdPerMtok: number;
  outputUsdPerMtok: number;
};

export type Manifest = {
  fixture: true;
  seed: number;
  liveNeatlogsKeyId: string;
};

export type Ledger = {
  rows: LedgerRow[];
  priceCard: PriceCardRow[];
  manifest: Manifest;
};

export type PersonTotals = {
  personId: PersonId;
  tokens: number;
  billedUsd: number;
  tracedUsd: number;
};

export type Finding = {
  personId: PersonId;
  badge: Badge;
  title: string;
  amountUsd: number;
  fixture: boolean;
};

export type Reconciliation = {
  people: PersonTotals[];
  findings: Finding[];
};
