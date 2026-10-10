"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

function postPassword(password: string) {
  const body = { password }
  // BACKEND: connect POST /api/auth here
  return body
}

export function LoginScreen() {
  const [password, setPassword] = useState("")
  const [note, setNote] = useState("Pages render without a cookie until auth is connected.")

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = postPassword(password)
    setNote(`Held locally as { password }. ${body.password.length} characters. No request was sent.`)
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
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return <LoginScreen />
}
