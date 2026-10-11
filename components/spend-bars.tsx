import Link from "next/link"

import { Card, CardTitle } from "@/components/ui/card"
import { invoiceScreen, usdFromCents } from "@/lib/ledger/screen"

export function SpendBars() {
  const teams = invoiceScreen().teams
  const max = Math.max(...teams.map((team) => team.costCents))

  return (
    <Card>
      <CardTitle>Cost by team</CardTitle>
      <ul className="mt-4 space-y-3">
        {teams.map((team) => (
          <li key={team.id}>
            <Link
              href={`/team/${team.id}`}
              className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 sm:grid-cols-[8rem_1fr_auto]"
            >
              <span className="truncate text-xs">{team.name}</span>
              <span className="h-4 overflow-hidden rounded-sm bg-muted">
                <span
                  className="block h-4 rounded-sm bg-primary transition-all duration-500"
                  style={{ width: `${max === 0 ? 0 : (team.costCents / max) * 100}%` }}
                />
              </span>
              <span className="text-xs tabular-nums">{usdFromCents(team.costCents)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
