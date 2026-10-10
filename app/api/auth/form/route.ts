import { SESSION_COOKIE, sessionFor } from "../../../../lib/auth.ts";

// Native form submit, used before the login page hydrates. The JSON API stays on POST /api/auth.
export async function POST(request: Request): Promise<Response> {
  const expected = process.env.ADMIN_PASSWORD;
  const form = await request.formData().catch(() => null);
  const password = form?.get("password");
  const session = expected && typeof password === "string" ? sessionFor(password, expected) : null;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  if (!session) return new Response(null, { status: 303, headers: { Location: "/login?error=1" } });
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": `${SESSION_COOKIE}=${session}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`,
    },
  });
}
