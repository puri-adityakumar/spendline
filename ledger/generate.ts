import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const seedArg = process.argv[2];
if (!seedArg || !/^\d+$/.test(seedArg)) {
  console.error("usage: node ledger/generate.ts <seed>");
  process.exit(1);
}

let state = Number(seedArg) >>> 0;
function rand(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function split(total: number, parts: number): number[] {
  const weights = Array.from({ length: parts }, () => 0.5 + rand());
  const sum = weights.reduce((a, b) => a + b, 0);
  const out = weights.map((w) => Math.floor((total * w) / sum));
  out[parts - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

const DAYS = Array.from({ length: 14 }, (_, i) => `2026-09-${String(17 + i).padStart(2, "0")}`);
const LIVE_KEY = "key-live";
const ALEX_OTHER_KEY = "key-ops-2";

type Row = {
  requestId: string;
  personId: string;
  day: string;
  operation: string;
  model: string;
  keyId: string;
  attempt: number;
  tokens: number;
  billedCents: number;
  tracedCents: number;
};

function rowsFor(personId: string, operation: string, model: string, days: string[], attempt: number): Row[] {
  return days.map((day, i) => ({
    requestId: `${personId}-${day}-${attempt}-${i}`,
    personId,
    day,
    operation,
    model,
    keyId: LIVE_KEY,
    attempt,
    tokens: 0,
    billedCents: 0,
    tracedCents: 0,
  }));
}

function fill(rows: Row[], tokens: number, billedCents: number, tracedCents: number): Row[] {
  const t = split(tokens, rows.length);
  const b = split(billedCents, rows.length);
  const gap = split(billedCents - tracedCents, rows.length);
  return rows.map((r, i) => ({ ...r, tokens: t[i], billedCents: b[i], tracedCents: b[i] - gap[i] }));
}

const maya = fill(
  [
    ...rowsFor("maya-chen", "support_draft", "gpt-5.6-sol", DAYS, 1),
    ...rowsFor("maya-chen", "support_draft", "gpt-5.6-sol", DAYS.filter((_, i) => i % 3 === 0), 2),
  ],
  4_200_000,
  8600,
  8400,
);
const jonah = fill(rowsFor("jonah-patel", "intent_classify", "gpt-6-astra", DAYS, 1), 1_100_000, 6400, 6300);
const priya = fill(rowsFor("priya-shah", "campaign_copy", "gpt-5.6-luna", DAYS, 1), 900_000, 1100, 1100);
const sam = fill(rowsFor("sam-ortiz", "sql_explain", "gpt-6-luna", DAYS, 1), 500_000, 800, 800);

const alexDupTokens = 20_000;
const alexDupCents = 900;
const alexDupCopies = 3;
const alexTokens = split(1_400_000 - alexDupTokens * (alexDupCopies + 1), 13 + 5);
const alexBase = rowsFor("alex-kim", "incident_summary", "gpt-5.6-terra", DAYS, 1);
const alexBilled = [alexDupCents, ...split(2200 - alexDupCents, 13)];
alexBase.forEach((r, i) => {
  r.tokens = i === 0 ? alexDupTokens : alexTokens[i - 1];
  r.billedCents = alexBilled[i];
  r.tracedCents = alexBilled[i];
});
const untrackedBilled = split(1900, 5);
const alexUntracked = rowsFor("alex-kim", "incident_summary", "gpt-5.6-terra", DAYS.slice(4, 9), 1).map((r, i) => ({
  ...r,
  requestId: `${r.requestId}-k2`,
  keyId: ALEX_OTHER_KEY,
  tokens: alexTokens[13 + i],
  billedCents: untrackedBilled[i],
  tracedCents: 0,
}));
const alexDuplicates = Array.from({ length: alexDupCopies }, () => ({ ...alexBase[0], tracedCents: 0 }));

const rows = [...maya, ...jonah, ...priya, ...sam, ...alexBase, ...alexUntracked, ...alexDuplicates].sort(
  (a, b) => a.day.localeCompare(b.day) || a.personId.localeCompare(b.personId),
);

const usd = (cents: number) => (cents / 100).toFixed(2);
const csv = [
  "request_id,person_id,day,operation,model,key_id,attempt,tokens,billed_usd,traced_usd",
  ...rows.map((r) =>
    [r.requestId, r.personId, r.day, r.operation, r.model, r.keyId, r.attempt, r.tokens, usd(r.billedCents), usd(r.tracedCents)].join(","),
  ),
].join("\n");

const dir = fileURLToPath(new URL(".", import.meta.url));
writeFileSync(`${dir}people.csv`, `${csv}\n`);
writeFileSync(`${dir}manifest.json`, `${JSON.stringify({ fixture: true, seed: Number(seedArg), liveNeatlogsKeyId: LIVE_KEY }, null, 2)}\n`);
console.log(`Wrote ${rows.length} rows to ledger/people.csv`);
