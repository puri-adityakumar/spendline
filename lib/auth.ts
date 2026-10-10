import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "spendline_session";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function sessionFor(password: string, expected: string): string | null {
  if (!timingSafeEqual(digest(password), digest(expected))) return null;
  return createHmac("sha256", expected).update(SESSION_COOKIE).digest("hex");
}
