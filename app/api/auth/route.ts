import { SESSION_COOKIE, sessionFor } from "../../../lib/auth.ts";

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return Response.json({ error: "ADMIN_PASSWORD is not set" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const session = typeof body?.password === "string" ? sessionFor(body.password, expected) : null;
  if (!session) return Response.json({ error: "Wrong password" }, { status: 401 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `${SESSION_COOKIE}=${session}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}` },
  });
}
