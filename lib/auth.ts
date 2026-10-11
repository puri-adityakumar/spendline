import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "spendline_session";

const digest = (value: string) => createHash("sha256").update(value).digest();
const sessionToken = (expected: string) => createHmac("sha256", expected).update(SESSION_COOKIE).digest("hex");

export function sessionFor(password: string, expected: string): string | null {
  if (!timingSafeEqual(digest(password), digest(expected))) return null;
  return sessionToken(expected);
}

export function hasSession(request: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const cookie = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const value = cookie?.slice(SESSION_COOKIE.length + 1) ?? "";
  return timingSafeEqual(digest(value), digest(sessionToken(expected)));
}

export function bearerMatches(request: Request, expected: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(digest(token), digest(expected));
}
