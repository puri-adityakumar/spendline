import { readFileSync, writeFileSync } from "node:fs";
import type { WorkloadConfig } from "../workload.ts";

export const FIX_PATCH: Partial<WorkloadConfig> = { classify_model: "nova-micro", max_retries: 0 };

export function applyFix(config: WorkloadConfig): WorkloadConfig {
  return { ...config, ...FIX_PATCH };
}

export function readConfig(path: string): WorkloadConfig {
  return JSON.parse(readFileSync(path, "utf8")) as WorkloadConfig;
}

export function writeConfig(path: string, config: WorkloadConfig): void {
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
}

export function labelAgreement(before: Record<string, string>, after: Record<string, string>): { agree: number; total: number } {
  const ids = Object.keys(before);
  return { agree: ids.filter((id) => after[id] === before[id]).length, total: ids.length };
}
