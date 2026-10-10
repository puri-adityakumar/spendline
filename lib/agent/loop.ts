import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadInvoices, loadLedger } from "../ledger/load.ts";
import { reconcile } from "../ledger/reconcile.ts";
import { AlertUnavailable, sendAlert } from "../tools/alert.ts";
import { costRollup } from "../tools/neatlogs.ts";
import { applyFix, labelAgreement, readConfig } from "../tools/workload.ts";
import { litellmChat, runWorkload, type WorkloadRun } from "../workload.ts";
import { TICKETS } from "../../workload/tickets.ts";
import { STEPS, type Step } from "./rules.ts";
import { defaultDirs, type Dirs, type RunMode, type RunState, type StepStatus } from "./state.ts";

export type Env = Dirs & { workload: string; evidence: string; chat: typeof litellmChat };

export function defaultEnv(): Env {
  return { ...defaultDirs(), workload: join(process.cwd(), "workload"), evidence: join(process.cwd(), "evidence"), chat: litellmChat };
}

type Outcome = { status: Extract<StepStatus, "done" | "error">; detail: string } & Partial<
  Pick<RunState, "findings" | "outbox" | "alertAttempts" | "fixRun">
>;

type StepHandler = (state: RunState, env: Env) => Promise<Outcome>;

const DAY_MS = 24 * 60 * 60 * 1000;

const HANDLERS: Record<Step, StepHandler> = {
  plan: async (state) => ({
    status: "done",
    detail:
      state.mode === "fix"
        ? "Plan: ingest, trace, reconcile, patch the workload config and rerun it as trace B, verify against trace A."
        : "Plan: ingest, trace, reconcile, act, verify.",
  }),
  ingest: async (_state, env) => {
    const invoices = loadInvoices(env.ledger);
    const { rows } = loadLedger(env.ledger);
    const teams = new Set(invoices.map((r) => r.team)).size;
    const people = new Set(rows.map((r) => r.personId)).size;
    return {
      status: "done",
      detail: `Loaded ${invoices.length} invoice rows for ${teams} teams and ${rows.length} ledger rows for ${people} people`,
    };
  },
  trace: async () => {
    const to = new Date();
    const rows = await costRollup(new Date(to.getTime() - 30 * DAY_MS).toISOString(), to.toISOString());
    if (rows === null) return { status: "done", detail: "NEATLOGS_TOKEN or NEATLOGS_PROJECT_ID unset. Trace readback skipped." };
    const traces = rows.reduce((n, r) => n + r.traceCount, 0);
    const cost = rows.reduce((n, r) => n + r.totalCostUsd, 0);
    return { status: "done", detail: `neatlogs: ${traces} traces, $${cost.toFixed(2)} in the last 30 days` };
  },
  reconcile: async (_state, env) => {
    const { findings } = reconcile(loadLedger(env.ledger));
    return { status: "done", detail: `${findings.length} findings`, findings };
  },
  act: async (state, env) => {
    const alertAttempts = state.alertAttempts + 1;
    try {
      const path = await sendAlert(state.alertAttempts, state.findings, env.work);
      return { status: "done", detail: `Wrote ${path}`, outbox: path, alertAttempts };
    } catch (error) {
      if (error instanceof AlertUnavailable) return { status: "error", detail: error.message, alertAttempts };
      throw error;
    }
  },
  verify: async (state, env) => {
    const flagged = state.findings.filter((f) => f.personId === "priya-shah" || f.personId === "sam-ortiz");
    if (!state.outbox || !existsSync(join(env.work, state.outbox))) return { status: "error", detail: "Outbox file missing" };
    if (flagged.length > 0) return { status: "error", detail: "Normal spenders were flagged" };
    return { status: "done", detail: `Verified ${state.outbox} and ${state.findings.length} findings` };
  },
};

const FIX_HANDLERS: Partial<Record<Step, StepHandler>> = {
  act: async (_state, env) => {
    const config = applyFix(readConfig(join(env.workload, "config.json")));
    const fixRun = await runWorkload("after", config, env.chat(), TICKETS);
    return {
      status: "done",
      detail: `Trace B ${fixRun.traceId}: classify_model ${config.classify_model}, max_retries ${config.max_retries}`,
      fixRun,
    };
  },
  verify: async (state, env) => {
    const beforePath = join(env.evidence, "runs", "before.json");
    if (!existsSync(beforePath)) return { status: "error", detail: "Trace A missing. Run npm run workload:before first." };
    const before = JSON.parse(readFileSync(beforePath, "utf8")) as WorkloadRun;
    const { agree, total } = labelAgreement(before.labels, state.fixRun!.labels);
    return {
      status: agree === total ? "done" : "error",
      detail: `Intent labels match trace A (${before.traceId}) on ${agree} of ${total} tickets`,
    };
  },
};

export function ownsRootTrace(state: RunState): boolean {
  return state.mode === "fix" && STEPS[state.stepIndex] === "act";
}

export function createRun(mode: RunMode): RunState {
  return {
    id: randomUUID(),
    mode,
    stepIndex: 0,
    step: STEPS[0],
    status: "pending",
    detail: "",
    findings: [],
    outbox: null,
    alertAttempts: 0,
    fixRun: null,
    finished: false,
  };
}

async function runStep(step: Step, state: RunState, env: Env): Promise<Outcome> {
  const handler = (state.mode === "fix" && FIX_HANDLERS[step]) || HANDLERS[step];
  try {
    return await handler(state, env);
  } catch (error) {
    return { status: "error", detail: `${step} failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function advance(state: RunState, env = defaultEnv()): Promise<RunState> {
  if (state.finished) return state;
  const step = STEPS[state.stepIndex];
  const outcome = await runStep(step, state, env);
  const nextIndex = outcome.status === "done" ? state.stepIndex + 1 : state.stepIndex;
  return {
    ...state,
    ...outcome,
    step,
    stepIndex: nextIndex,
    finished: nextIndex === STEPS.length,
  };
}
