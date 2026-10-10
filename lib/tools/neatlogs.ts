import { span } from "neatlogs";

const API = "https://app.neatlogs.com/api/v1/public";

export type CostRow = { group: string; traceCount: number; totalCostUsd: number; totalTokens: number };

export const costRollup = span(
  { kind: "TOOL", toolName: "neatlogs-cost", name: "neatlogs-cost" },
  async (from: string, to: string): Promise<CostRow[] | null> => {
    const token = process.env.NEATLOGS_TOKEN;
    const projectId = process.env.NEATLOGS_PROJECT_ID;
    if (!token || !projectId) return null;
    const res = await fetch(`${API}/analytics/cost`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "x-project-id": projectId, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, filters: { workflowNames: ["spendline-investigator"] } }),
    });
    if (!res.ok) throw new Error(`neatlogs cost API returned ${res.status}`);
    const body = (await res.json()) as { data: { rows: CostRow[] } };
    return body.data.rows;
  },
);

export type TraceSummary = {
  traceId: string;
  status: string;
  workflowName: string | null;
  spansCount: number;
  totalTokens: number;
  totalCostUsd: number;
};

export const getTrace = span(
  { kind: "TOOL", toolName: "neatlogs-trace", name: "neatlogs-trace" },
  async (traceId: string): Promise<TraceSummary | null> => {
    const token = process.env.NEATLOGS_TOKEN;
    const projectId = process.env.NEATLOGS_PROJECT_ID;
    if (!token || !projectId) return null;
    const res = await fetch(`${API}/traces/${encodeURIComponent(traceId)}`, {
      headers: { Authorization: `Bearer ${token}`, "x-project-id": projectId },
    });
    if (!res.ok) throw new Error(`neatlogs trace API returned ${res.status}`);
    return ((await res.json()) as { data: TraceSummary }).data;
  },
);
