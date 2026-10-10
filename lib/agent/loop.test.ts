import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { advance, createRun } from "./loop.ts";
import { loadRun, runsDir, saveRun, snapshot, type Dirs, type RunState } from "./state.ts";

function workspace(): Dirs {
  return { ledger: join(process.cwd(), "ledger"), work: mkdtempSync(join(tmpdir(), "spendline-")) };
}

async function drain(state: RunState, root: Dirs): Promise<RunState[]> {
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

test("snapshot carries only the contract fields", () => {
  assert.deepEqual(Object.keys(snapshot(createRun("fix"))).sort(), ["detail", "findings", "id", "outbox", "status", "step"]);
});
