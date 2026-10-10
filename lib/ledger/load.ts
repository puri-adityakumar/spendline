import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { InvoiceRow, Ledger, LedgerRow, Manifest, PersonId, PriceCardRow } from "./types.ts";

const PEOPLE: readonly PersonId[] = ["maya-chen", "jonah-patel", "priya-shah", "sam-ortiz", "alex-kim"];

function parseCsv(text: string, header: string): string[][] {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  if (head !== header) throw new Error(`Unexpected CSV header: ${head}`);
  return lines.map((line, i) => {
    const cells = line.split(",");
    if (cells.length !== header.split(",").length) throw new Error(`Malformed CSV row ${i + 2}: ${line}`);
    return cells;
  });
}

function cents(usd: string): number {
  return Math.round(Number(usd) * 100);
}

function personId(value: string): PersonId {
  if (!PEOPLE.includes(value as PersonId)) throw new Error(`Unknown person_id: ${value}`);
  return value as PersonId;
}

export function loadLedger(dir = join(process.cwd(), "ledger")): Ledger {
  const rows: LedgerRow[] = parseCsv(
    readFileSync(join(dir, "people.csv"), "utf8"),
    "request_id,person_id,day,operation,model,key_id,attempt,tokens,billed_usd,traced_usd",
  ).map(([requestId, person, day, operation, model, keyId, attempt, tokens, billed, traced]) => ({
    requestId,
    personId: personId(person),
    day,
    operation,
    model,
    keyId,
    attempt: Number(attempt),
    tokens: Number(tokens),
    billedCents: cents(billed),
    tracedCents: cents(traced),
  }));

  const priceCard: PriceCardRow[] = parseCsv(
    readFileSync(join(dir, "price-card.csv"), "utf8"),
    "model,input_usd_per_mtok,output_usd_per_mtok",
  ).map(([model, input, output]) => ({
    model,
    inputUsdPerMtok: Number(input),
    outputUsdPerMtok: Number(output),
  }));

  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Manifest;
  return { rows, priceCard, manifest };
}

export function loadInvoices(dir = join(process.cwd(), "ledger")): InvoiceRow[] {
  return parseCsv(
    readFileSync(join(dir, "invoices.csv"), "utf8"),
    "team,occurred_at,model,prompt_tokens,completion_tokens,total_tokens,cost_usd",
  ).map(([team, occurredAt, model, prompt, completion, total, cost]) => ({
    team,
    occurredAt,
    model,
    promptTokens: Number(prompt),
    completionTokens: Number(completion),
    totalTokens: Number(total),
    costUsd: Number(cost),
  }));
}
