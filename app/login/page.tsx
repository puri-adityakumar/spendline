import { redirect } from "next/navigation"

import { LoginScreen } from "./login-screen"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; password?: string | string[] }>
}) {
  const params = await searchParams
  // Drop a password that an old GET submit left in the query string.
  if (params.password) redirect("/login?error=1")
  const failed = params.error === "1" || (Array.isArray(params.error) && params.error.includes("1"))
  return <LoginScreen initialError={failed ? "Wrong password" : null} />
}
