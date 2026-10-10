"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Ledger" },
  { href: "/investigate", label: "Investigate" },
  { href: "/evidence", label: "Evidence" },
  { href: "/login", label: "Login" },
]

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          <span
            className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl"
            style={{ fontFamily: "var(--font-museo-moderno), sans-serif" }}
          >
            Spendline
          </span>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">Team token ledger</span>
        </Link>
        <nav className="ml-auto flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-2.5 sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </nav>
      </div>
    </header>
  )
}
