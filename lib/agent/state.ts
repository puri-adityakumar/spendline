import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Finding } from "../ledger/types.ts";
import type { WorkloadRun } from "../workload.ts";
import type { Step } from "./rules.ts";

export type RunMode = "investigate" | "fix";
export type StepStatus = "pending" | "active" | "done" | "error";

export type RunState = {
  id: string;
  mode: RunMode;
  stepIndex: number;
  step: Step;
  status: StepStatus;
  detail: string;
  findings: Finding[];
  outbox: string | null;
  alertAttempts: number;
  fixRun: WorkloadRun | null;
  finished: boolean;
};

export type RunSnapshot = Pick<RunState, "id" | "step" | "status" | "detail" | "findings" | "outbox">;

export function snapshot({ id, step, status, detail, findings, outbox }: RunState): RunSnapshot {
  return { id, step, status, detail, findings, outbox };
}

export type Dirs = { ledger: string; work: string };

export function defaultDirs(): Dirs {
  return { ledger: join(process.cwd(), "ledger"), work: process.env.VERCEL ? tmpdir() : process.cwd() };
}

export function runsDir(work = defaultDirs().work): string {
  return join(work, ".spendline", "runs");
}

export function saveRun(state: RunState, dir = runsDir()): void {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${state.id}.json`);
  writeFileSync(`${file}.tmp`, JSON.stringify(state, null, 2));
  renameSync(`${file}.tmp`, file);
}

export function loadRun(id: string, dir = runsDir()): RunState | null {
  if (!/^[\w-]+$/.test(id)) return null;
  try {
    return JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")) as RunState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
