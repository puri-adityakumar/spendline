import { CircleDollarSignIcon, CoinsIcon, ScanSearchIcon, TriangleAlertIcon } from "lucide-react"

import { DailyChart } from "@/components/daily-chart"
import { SpendBars } from "@/components/spend-bars"
import { StatsCards } from "@/components/stats-cards"
import { headline, people, usd } from "@/lib/fixtures"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">14-day team ledger</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Five people, fixture rows. The screen headline is the demo story, not the 3-month ingest file.
        </p>
      </div>
      <StatsCards
        stats={[
          { label: "Tokens", value: headline.tokens, hint: "Across the team", icon: CoinsIcon },
          { label: "Billed", value: usd(headline.billedUsd), hint: "Invoice total", icon: CircleDollarSignIcon },
          { label: "Traced", value: usd(headline.tracedUsd), hint: "Matched to a key", icon: ScanSearchIcon },
          { label: "Unexplained", value: usd(headline.unexplainedUsd), hint: "Billed minus traced", icon: TriangleAlertIcon },
        ]}
      />
      <SpendBars />
      <DailyChart />
      <section className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/95 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Person</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
              <th className="px-3 py-2 font-medium">Billed</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Traced</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-t">
                <td className="px-3 py-2">
                  <a href={`/team/${person.id}`} className="font-medium underline-offset-4 hover:underline">
                    {person.name}
                  </a>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{person.role}</td>
                <td className="px-3 py-2 tabular-nums">{person.tokens}</td>
                <td className="px-3 py-2 tabular-nums">{usd(person.billedUsd)}</td>
                <td className="hidden px-3 py-2 tabular-nums sm:table-cell">{usd(person.tracedUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
