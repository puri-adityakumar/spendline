import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { labelAgreement } from "../lib/tools/workload.ts";
import { getTrace, type TraceSummary } from "../lib/tools/neatlogs.ts";
import type { WorkloadRun } from "../lib/workload.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const readRun = (tag: string) => JSON.parse(readFileSync(`${root}evidence/runs/${tag}.json`, "utf8")) as WorkloadRun;

function fromCli(traceId: string): TraceSummary {
  const projectId = process.env.NEATLOGS_PROJECT_ID;
  if (!projectId) throw new Error("Set NEATLOGS_TOKEN and NEATLOGS_PROJECT_ID, or NEATLOGS_PROJECT_ID with a logged-in neatlogs CLI");
  const profile = process.env.NEATLOGS_PROFILE ?? "setup-https---app-neatlogs-com";
  const { NEATLOGS_API_KEY: _key, NEATLOGS_TOKEN: _token, ...env } = process.env;
  env.PATH = (env.PATH ?? "")
    .split(delimiter)
    .filter((dir) => !dir.endsWith(join("node_modules", ".bin")))
    .join(delimiter);
  const out = execFileSync(
    "neatlogs",
    ["--host", "https://app.neatlogs.com", "--profile", profile, "--project", projectId, "traces", "get", traceId],
    { env, encoding: "utf8" },
  );
  return (JSON.parse(out) as { data: TraceSummary }).data;
}

async function summary(traceId: string): Promise<TraceSummary> {
  return (await getTrace(traceId)) ?? fromCli(traceId);
}

const before = readRun("before");
const after = readRun("after");
const [a, b] = [await summary(before.traceId), await summary(after.traceId)];
const { agree, total } = labelAgreement(before.labels, after.labels);
const usd = (n: number) => `$${n.toFixed(6)}`;

const rows: [string, string, string][] = [
  ["Trace id", a.traceId, b.traceId],
  ["Tag", before.tag, after.tag],
  ["classify_model", before.config.classify_model, after.config.classify_model],
  ["max_retries", String(before.config.max_retries), String(after.config.max_retries)],
  ["Draft calls", String(before.draftCalls), String(after.draftCalls)],
  ["Spans", String(a.spansCount), String(b.spansCount)],
  ["totalTokens", String(a.totalTokens), String(b.totalTokens)],
  ["totalCostUsd", usd(a.totalCostUsd), usd(b.totalCostUsd)],
];

const md = `# Trace A vs trace B

Workflow \`spendline-investigator\`, trace \`investigate-waste\`. Numbers are from neatlogs \`GET /api/v1/public/traces/:id\`.

| | Trace A (before) | Trace B (after) |
| --- | --- | --- |
${rows.map((r) => `| ${r.join(" | ")} |`).join("\n")}

Intent labels in trace B match trace A on ${agree} of ${total} tickets.

Trace B minus trace A: ${b.totalTokens - a.totalTokens} tokens, ${usd(b.totalCostUsd - a.totalCostUsd)}.
${a.totalCostUsd === 0 && b.totalCostUsd === 0 ? "\nneatlogs reported no cost for these LiteLLM model names, so the saving is stated in tokens only.\n" : ""}`;

const side = (run: WorkloadRun, t: TraceSummary) => ({
  traceId: t.traceId,
  ...run.config,
  draftCalls: run.draftCalls,
  spans: t.spansCount,
  totalTokens: t.totalTokens,
  totalCostUsd: t.totalCostUsd,
});

writeFileSync(`${root}evidence/compare.md`, md);
writeFileSync(
  `${root}evidence/compare.json`,
  `${JSON.stringify({ before: side(before, a), after: side(after, b), labelsAgree: agree, labelsTotal: total }, null, 2)}\n`,
);
console.log(md);
