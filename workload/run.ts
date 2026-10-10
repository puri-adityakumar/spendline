import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { flush, init, shutdown } from "neatlogs";
import { applyFix, labelAgreement, readConfig, writeConfig } from "../lib/tools/workload.ts";
import { litellmChat, runWorkload, type WorkloadRun } from "../lib/workload.ts";
import { TICKETS } from "./tickets.ts";

const tag = process.argv[2];
if (tag !== "before" && tag !== "after") {
  console.error("usage: node workload/run.ts before|after");
  process.exit(1);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const configPath = `${root}workload/config.json`;
const runPath = (t: string) => `${root}evidence/runs/${t}.json`;

if (tag === "after" && !existsSync(runPath("before"))) {
  console.error("Run trace A first: npm run workload:before");
  process.exit(1);
}

let config = readConfig(configPath);
if (tag === "after") {
  config = applyFix(config);
  writeConfig(configPath, config);
}

await init({ workflowName: "spendline-investigator", endpoint: "https://ingest.neatlogs.com", tags: [tag] });
try {
  const run = await runWorkload(tag, config, litellmChat(), TICKETS);
  writeFileSync(runPath(tag), `${JSON.stringify(run, null, 2)}\n`);
  console.log(`Trace ${tag === "before" ? "A" : "B"} (${tag}): ${run.traceId}`);
  console.log(`classify_model=${config.classify_model} max_retries=${config.max_retries} draft calls=${run.draftCalls}`);
  if (tag === "after") {
    const before = JSON.parse(readFileSync(runPath("before"), "utf8")) as WorkloadRun;
    const { agree, total } = labelAgreement(before.labels, run.labels);
    console.log(`Intent labels match trace A on ${agree} of ${total} tickets`);
  }
} finally {
  await flush();
  await shutdown();
}
