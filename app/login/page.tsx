"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

async function postPassword(password: string) {
  const body = { password }
  // POST /api/auth sets the httpOnly session cookie.
  return fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export function LoginScreen() {
  const [password, setPassword] = useState("")
  const [note, setNote] = useState("One shared password. A wrong password stays on this form.")
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNote("Checking the password.")
    const response = await postPassword(password)
    if (response.status === 204) {
      window.location.assign("/")
      return
    }
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    setNote("One shared password. A wrong password stays on this form.")
    setError(payload?.error ?? "Wrong password")
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">One shared password. No user table.</p>
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block text-xs text-muted-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{note}</p>
        )}
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return <LoginScreen />
}
