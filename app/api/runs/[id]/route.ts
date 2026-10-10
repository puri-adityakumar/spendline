import { after } from "next/server.js";
import { flush, trace } from "neatlogs";
import { advance, ownsRootTrace } from "../../../../lib/agent/loop.ts";
import { loadRun, saveRun, snapshot, type RunSnapshot } from "../../../../lib/agent/state.ts";

type Polled = { body: RunSnapshot; traceId: string | null } | null;

const queues = new Map<string, Promise<Polled>>();

async function poll(id: string): Promise<Polled> {
  const run = loadRun(id);
  if (!run) return null;
  if (run.finished) return { body: snapshot(run), traceId: null };
  if (ownsRootTrace(run)) {
    const next = await advance(run);
    saveRun(next);
    return { body: snapshot(next), traceId: next.fixRun?.traceId ?? null };
  }
  return trace(
    { name: "agent-step", kind: "WORKFLOW", sessionId: run.id, input: { mode: run.mode, stepIndex: run.stepIndex } },
    async (span) => {
      const next = await advance(run);
      saveRun(next);
      return { body: snapshot(next), traceId: span.spanContext().traceId };
    },
  );
}

function enqueue(id: string): Promise<Polled> {
  const job = (queues.get(id) ?? Promise.resolve(null)).then(() => poll(id));
  const tail = job.catch(() => null);
  queues.set(id, tail);
  tail.then(() => queues.get(id) === tail && queues.delete(id));
  return job;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const polled = await enqueue(id);
  if (!polled) return Response.json({ error: "Run not found" }, { status: 404 });
  if (process.env.VERCEL) after(() => flush());
  const headers: Record<string, string> = polled.traceId ? { "x-neatlogs-trace-id": polled.traceId } : {};
  return Response.json(polled.body, { headers });
}
