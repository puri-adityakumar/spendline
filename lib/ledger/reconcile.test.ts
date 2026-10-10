import assert from "node:assert/strict";
import { test } from "node:test";
import { loadLedger } from "./load.ts";
import { reconcile } from "./reconcile.ts";

const { people, findings } = reconcile(loadLedger());

test("person totals match the demo story", () => {
  const byId = Object.fromEntries(people.map((p) => [p.personId, p]));
  assert.deepEqual(byId["maya-chen"], { personId: "maya-chen", tokens: 4_200_000, billedUsd: 86, tracedUsd: 84 });
  assert.deepEqual(byId["jonah-patel"], { personId: "jonah-patel", tokens: 1_100_000, billedUsd: 64, tracedUsd: 63 });
});

test("reconcile emits exactly the four findings", () => {
  assert.deepEqual(
    findings.map((f) => `${f.personId}/${f.badge}`).sort(),
    ["alex-kim/duplicate", "alex-kim/untracked-key", "jonah-patel/expensive-model", "maya-chen/retry"],
  );
});

test("Alex's rows are fixture findings for $19 and $27", () => {
  const alex = findings.filter((f) => f.personId === "alex-kim").map(({ badge, amountUsd, fixture }) => ({ badge, amountUsd, fixture }));
  assert.deepEqual(
    alex.sort((a, b) => a.badge.localeCompare(b.badge)),
    [
      { badge: "duplicate", amountUsd: 27, fixture: true },
      { badge: "untracked-key", amountUsd: 19, fixture: true },
    ],
  );
});

test("Priya and Sam are not flagged", () => {
  assert.equal(findings.some((f) => f.personId === "priya-shah" || f.personId === "sam-ortiz"), false);
});
