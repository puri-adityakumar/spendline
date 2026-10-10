import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { span } from "neatlogs";
import type { Finding } from "../ledger/types.ts";

export const OUTBOX_PATH = "outbox/alert.md";

export class AlertUnavailable extends Error {
  constructor() {
    super("Alert tool returned 503");
  }
}

export const sendAlert = span(
  { kind: "TOOL", toolName: "alert", name: "alert" },
  async (attempt: number, findings: Finding[], root: string): Promise<string> => {
    if (attempt === 0) throw new AlertUnavailable();
    const lines = findings.map(
      (f) => `- ${f.personId}: ${f.badge}, $${f.amountUsd.toFixed(2)}${f.fixture ? " (fixture)" : ""}`,
    );
    mkdirSync(join(root, "outbox"), { recursive: true });
    writeFileSync(join(root, OUTBOX_PATH), `# Spendline alert\n\n${lines.join("\n")}\n`);
    return OUTBOX_PATH;
  },
);
