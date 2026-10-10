import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runWorkload, type litellmChat } from "../workload.ts";
import { TICKETS } from "../../workload/tickets.ts";
import { advance, createRun, type Env } from "./loop.ts";
import { loadRun, runsDir, saveRun, snapshot, type RunState } from "./state.ts";

type Chat = ReturnType<typeof litellmChat>;

function fakeChat(calls: string[] = []): Chat {
  return {
    create: async ({ model }: { model: string }) => {
      calls.push(model);
      return { choices: [{ message: { content: "billing" } }] };
    },
  } as unknown as Chat;
}

function workspace(): Env {
  const work = mkdtempSync(join(tmpdir(), "spendline-"));
  return {
    ledger: join(process.cwd(), "ledger"),
    work,
    workload: join(process.cwd(), "workload"),
    evidence: join(work, "evidence"),
    chat: () => fakeChat(),
  };
}

async function drain(state: RunState, root: Env): Promise<RunState[]> {
  const seen: RunState[] = [];
  while (!state.finished) {
    state = await advance(state, root);
    seen.push(state);
  }
  return seen;
}

test("steps run in order with one 503 recovery on act", async () => {
  const root = workspace();
  const seen = await drain(createRun("investigate"), root);
  assert.deepEqual(
    seen.map((s) => `${s.step}:${s.status}`),
    ["plan:done", "ingest:done", "trace:done", "reconcile:done", "act:error", "act:done", "verify:done"],
  );
  const act = seen.filter((s) => s.step === "act").map((s) => ({ status: s.status, detail: s.detail, outbox: s.outbox }));
  assert.deepEqual(act, [
    { status: "error", detail: "Alert tool returned 503", outbox: null },
    { status: "done", detail: "Wrote outbox/alert.md", outbox: "outbox/alert.md" },
  ]);
  assert.equal(existsSync(join(root.work, "outbox/alert.md")), true);
});

test("Priya and Sam are not labeled", async () => {
  const seen = await drain(createRun("investigate"), workspace());
  const people = new Set(seen.at(-1)!.findings.map((f) => f.personId));
  assert.deepEqual([...people].sort(), ["alex-kim", "jonah-patel", "maya-chen"]);
});

test("a run resumes from saved JSON at the same step after a crash", async () => {
  const root = workspace();
  const dir = runsDir(root.work);
  let state = createRun("investigate");
  for (let i = 0; i < 5; i++) state = await advance(state, root);
  assert.equal(`${state.step}:${state.status}`, "act:error");
  saveRun(state, dir);

  const resumed = await advance(loadRun(state.id, dir)!, root);
  assert.deepEqual(
    { step: resumed.step, status: resumed.status, detail: resumed.detail },
    { step: "act", status: "done", detail: "Wrote outbox/alert.md" },
  );
});

test("a step that throws becomes an error snapshot and the next poll retries it", async () => {
  const root = workspace();
  let state = await advance(createRun("investigate"), root);
  state = await advance(state, { ...root, ledger: join(root.work, "missing") });
  assert.deepEqual({ step: state.step, status: state.status }, { step: "ingest", status: "error" });
  assert.match(state.detail, /^ingest failed: /);
  state = await advance(state, root);
  assert.deepEqual({ step: state.step, status: state.status }, { step: "ingest", status: "done" });
});

test("the workload spends 1 + max_retries drafts per ticket on the configured classify model", async () => {
  const calls: string[] = [];
  const run = await runWorkload("before", { classify_model: "claude-opus-4.6", max_retries: 2 }, fakeChat(calls), TICKETS);
  assert.equal(run.draftCalls, 18);
  assert.equal(calls.filter((m) => m === "claude-opus-4.6").length, 6);
  assert.equal(calls.filter((m) => m === "claude-haiku").length, 18);
});

test("fix mode reruns the patched workload as trace B and verifies labels against trace A", async () => {
  const env = workspace();
  const before = await runWorkload("before", { classify_model: "claude-opus-4.6", max_retries: 2 }, fakeChat(), TICKETS);
  mkdirSync(join(env.evidence, "runs"), { recursive: true });
  writeFileSync(join(env.evidence, "runs", "before.json"), JSON.stringify(before));

  const seen = await drain(createRun("fix"), env);
  assert.deepEqual(
    seen.map((s) => `${s.step}:${s.status}`),
    ["plan:done", "ingest:done", "trace:done", "reconcile:done", "act:done", "verify:done"],
  );
  const final = seen.at(-1)!;
  assert.deepEqual(final.fixRun!.config, { classify_model: "nova-lite", max_retries: 0 });
  assert.equal(final.fixRun!.draftCalls, 6);
  assert.equal(final.detail, `Intent labels match trace A (${before.traceId}) on 6 of 6 tickets`);
});

test("fix mode without trace A stops at verify", async () => {
  const env = workspace();
  let state = createRun("fix");
  for (let i = 0; i < 6; i++) state = await advance(state, env);
  assert.deepEqual(
    { step: state.step, status: state.status, detail: state.detail },
    { step: "verify", status: "error", detail: "Trace A missing. Run npm run workload:before first." },
  );
});

test("snapshot carries only the contract fields", () => {
  assert.deepEqual(Object.keys(snapshot(createRun("fix"))).sort(), ["detail", "findings", "id", "outbox", "status", "step"]);
});
