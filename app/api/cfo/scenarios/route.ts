import { bearerMatches } from "../../../../lib/auth.ts";
import { scenarioRows } from "../../../../lib/cfo.ts";
import { loadInvoices } from "../../../../lib/ledger/load.ts";

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.CFO_API_TOKEN;
  if (!expected || !bearerMatches(request, expected)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ data: scenarioRows(loadInvoices()) });
}
