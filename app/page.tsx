import { CircleDollarSignIcon, CoinsIcon, Rows3Icon, UsersIcon } from "lucide-react"

import { DailyChart } from "@/components/daily-chart"
import { SpendBars } from "@/components/spend-bars"
import { StatsCards } from "@/components/stats-cards"
import { formatTokens, invoiceScreen, usdFromCents } from "@/lib/ledger/screen"

export default function HomePage() {
  const ledger = invoiceScreen()

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Invoice ledger</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {formatTokens(ledger.rows)} rows from {ledger.start} through {ledger.end}. Totals come from ledger/invoices.csv.
        </p>
      </div>
      <StatsCards
        stats={[
          { label: "Tokens", value: formatTokens(ledger.tokens), hint: "Sum of total_tokens", icon: CoinsIcon },
          { label: "Cost", value: usdFromCents(ledger.costCents), hint: "Sum of cost_usd", icon: CircleDollarSignIcon },
          { label: "Rows", value: formatTokens(ledger.rows), hint: "Invoice lines", icon: Rows3Icon },
          { label: "Teams", value: String(ledger.teams.length), hint: "From the team column", icon: UsersIcon },
        ]}
      />
      <SpendBars />
      <DailyChart />
      <section className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/95 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Rows</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
              <th className="px-3 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {ledger.teams.map((team) => (
              <tr key={team.id} className="border-t">
                <td className="px-3 py-2">
                  <a href={`/team/${team.id}`} className="font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                    {team.name}
                  </a>
                </td>
                <td className="px-3 py-2 tabular-nums">{formatTokens(team.rows)}</td>
                <td className="px-3 py-2 tabular-nums">{formatTokens(team.tokens)}</td>
                <td className="px-3 py-2 tabular-nums">{usdFromCents(team.costCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
