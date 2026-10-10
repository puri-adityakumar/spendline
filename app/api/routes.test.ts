import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const work = mkdtempSync(join(tmpdir(), "spendline-api-"));
symlinkSync(join(process.cwd(), "ledger"), join(work, "ledger"));
process.chdir(work);

const auth = await import("./auth/route.ts");
const runs = await import("./runs/route.ts");
const run = await import("./runs/[id]/route.ts");

const post = (body: unknown) => new Request("http://local/api", { method: "POST", body: JSON.stringify(body) });
const poll = async (id: string) => (await run.GET(new Request("http://local/api"), { params: Promise.resolve({ id }) })).json();

test("POST /api/auth sets the session cookie for the right password and 401s otherwise", async () => {
  const password = randomUUID();
  process.env.ADMIN_PASSWORD = password;
  const ok = await auth.POST(post({ password }));
  assert.equal(ok.status, 204);
  assert.match(ok.headers.get("set-cookie") ?? "", /^spendline_session=[0-9a-f]+; HttpOnly; Path=\//);

  const wrong = await auth.POST(post({ password: `${password}x` }));
  assert.equal(wrong.status, 401);
  assert.equal(typeof (await wrong.json()).error, "string");
});

for (const mode of ["investigate", "fix"]) {
  test(`a ${mode} run polls through the contract with the 503 then the outbox`, async () => {
    const { id } = await (await runs.POST(post({ mode }))).json();
    assert.equal(typeof id, "string");

    const seen = [];
    for (let i = 0; i < 7; i++) seen.push(await poll(id));
    assert.deepEqual(
      seen.map((s) => `${s.step}:${s.status}`),
      ["plan:done", "ingest:done", "trace:done", "reconcile:done", "act:error", "act:done", "verify:done"],
    );
    const [first, next] = seen.filter((s) => s.step === "act");
    assert.deepEqual(first, { id, step: "act", status: "error", detail: "Alert tool returned 503", findings: first.findings, outbox: null });
    assert.deepEqual(
      { status: next.status, detail: next.detail, outbox: next.outbox },
      { status: "done", detail: "Wrote outbox/alert.md", outbox: "outbox/alert.md" },
    );
    assert.deepEqual(await poll(id), seen.at(-1));
  });
}

test("overlapping polls advance one step each", async () => {
  const { id } = await (await runs.POST(post({ mode: "investigate" }))).json();
  const seen = await Promise.all(Array.from({ length: 7 }, () => poll(id)));
  assert.deepEqual(
    seen.map((s) => `${s.step}:${s.status}`).sort(),
    ["act:done", "act:error", "ingest:done", "plan:done", "reconcile:done", "trace:done", "verify:done"],
  );
});

test("bad mode is 400 and an unknown run is 404", async () => {
  assert.equal((await runs.POST(post({ mode: "other" }))).status, 400);
  assert.equal((await run.GET(new Request("http://local/api"), { params: Promise.resolve({ id: "missing" }) })).status, 404);
});
