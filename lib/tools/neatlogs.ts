import { span } from "neatlogs";

const COST_URL = "https://app.neatlogs.com/api/v1/public/analytics/cost";

export type CostRow = { group: string; traceCount: number; totalCostUsd: number; totalTokens: number };

export const costRollup = span(
  { kind: "TOOL", toolName: "neatlogs-cost", name: "neatlogs-cost" },
  async (from: string, to: string): Promise<CostRow[] | null> => {
    const token = process.env.NEATLOGS_TOKEN;
    const projectId = process.env.NEATLOGS_PROJECT_ID;
    if (!token || !projectId) return null;
    const res = await fetch(COST_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "x-project-id": projectId, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, filters: { workflowNames: ["spendline-investigator"] } }),
    });
    if (!res.ok) throw new Error(`neatlogs cost API returned ${res.status}`);
    const body = (await res.json()) as { data: { rows: CostRow[] } };
    return body.data.rows;
  },
);
