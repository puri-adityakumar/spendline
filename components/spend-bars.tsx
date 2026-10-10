import Link from "next/link"

import { Card, CardTitle } from "@/components/ui/card"
import { people, usd } from "@/lib/fixtures"

export function SpendBars() {
  const max = Math.max(...people.map((person) => person.billedUsd))

  return (
    <Card>
      <CardTitle>Billed by person</CardTitle>
      <ul className="mt-4 space-y-3">
        {people.map((person) => (
          <li key={person.id}>
            <Link
              href={`/team/${person.id}`}
              className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 sm:grid-cols-[8rem_1fr_auto]"
            >
              <span className="truncate text-xs">{person.name}</span>
              <span className="h-4 overflow-hidden rounded-sm bg-muted">
                <span
                  className="block h-4 rounded-sm bg-primary transition-all duration-500"
                  style={{ width: `${(person.billedUsd / max) * 100}%` }}
                />
              </span>
              <span className="text-xs tabular-nums">{usd(person.billedUsd)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
