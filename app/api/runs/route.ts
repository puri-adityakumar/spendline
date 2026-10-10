import { createRun } from "../../../lib/agent/loop.ts";
import { saveRun, type RunMode } from "../../../lib/agent/state.ts";

const MODES: readonly RunMode[] = ["investigate", "fix"];

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { mode?: unknown } | null;
  const mode = body?.mode as RunMode;
  if (!MODES.includes(mode)) return Response.json({ error: 'mode must be "investigate" or "fix"' }, { status: 400 });
  const run = createRun(mode);
  saveRun(run);
  return Response.json({ id: run.id });
}
