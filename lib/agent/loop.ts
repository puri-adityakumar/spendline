import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadLedger } from "../ledger/load.ts";
import { reconcile } from "../ledger/reconcile.ts";
import { AlertUnavailable, sendAlert } from "../tools/alert.ts";
import { costRollup } from "../tools/neatlogs.ts";
import { STEPS, type Step } from "./rules.ts";
import { defaultDirs, type Dirs, type RunMode, type RunState, type StepStatus } from "./state.ts";

type Outcome = { status: Extract<StepStatus, "done" | "error">; detail: string } & Partial<
  Pick<RunState, "findings" | "outbox" | "alertAttempts">
>;

type StepHandler = (state: RunState, dirs: Dirs) => Promise<Outcome>;

const DAY_MS = 24 * 60 * 60 * 1000;

const HANDLERS: Record<Step, StepHandler> = {
  plan: async (state) => ({
    status: "done",
    detail:
      state.mode === "fix"
        ? "Plan: ingest, trace, reconcile, act, verify. The workload patch waits on Conflict 3."
        : "Plan: ingest, trace, reconcile, act, verify.",
  }),
  ingest: async (_state, dirs) => {
    const { rows } = loadLedger(dirs.ledger);
    return { status: "done", detail: `Loaded ${rows.length} ledger rows for ${new Set(rows.map((r) => r.personId)).size} people` };
  },
  trace: async () => {
    const to = new Date();
    const rows = await costRollup(new Date(to.getTime() - 30 * DAY_MS).toISOString(), to.toISOString());
    if (rows === null) return { status: "done", detail: "NEATLOGS_TOKEN or NEATLOGS_PROJECT_ID unset. Trace readback skipped." };
    const traces = rows.reduce((n, r) => n + r.traceCount, 0);
    const cost = rows.reduce((n, r) => n + r.totalCostUsd, 0);
    return { status: "done", detail: `neatlogs: ${traces} traces, $${cost.toFixed(2)} in the last 30 days` };
  },
  reconcile: async (_state, dirs) => {
    const { findings } = reconcile(loadLedger(dirs.ledger));
    return { status: "done", detail: `${findings.length} findings`, findings };
  },
  act: async (state, dirs) => {
    const alertAttempts = state.alertAttempts + 1;
    try {
      const path = await sendAlert(state.alertAttempts, state.findings, dirs.work);
      return { status: "done", detail: `Wrote ${path}`, outbox: path, alertAttempts };
    } catch (error) {
      if (error instanceof AlertUnavailable) return { status: "error", detail: error.message, alertAttempts };
      throw error;
    }
  },
  verify: async (state, dirs) => {
    const flagged = state.findings.filter((f) => f.personId === "priya-shah" || f.personId === "sam-ortiz");
    if (!state.outbox || !existsSync(join(dirs.work, state.outbox))) return { status: "error", detail: "Outbox file missing" };
    if (flagged.length > 0) return { status: "error", detail: "Normal spenders were flagged" };
    return { status: "done", detail: `Verified ${state.outbox} and ${state.findings.length} findings` };
  },
};

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
    finished: false,
  };
}

async function runStep(step: Step, state: RunState, dirs: Dirs): Promise<Outcome> {
  try {
    return await HANDLERS[step](state, dirs);
  } catch (error) {
    return { status: "error", detail: `${step} failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function advance(state: RunState, dirs = defaultDirs()): Promise<RunState> {
  if (state.finished) return state;
  const step = STEPS[state.stepIndex];
  const outcome = await runStep(step, state, dirs);
  const nextIndex = outcome.status === "done" ? state.stepIndex + 1 : state.stepIndex;
  return {
    ...state,
    ...outcome,
    step,
    stepIndex: nextIndex,
    finished: nextIndex === STEPS.length,
  };
}
