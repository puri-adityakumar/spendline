import { Card, CardTitle } from "@/components/ui/card"
import { invoiceScreen, usdFromCents } from "@/lib/ledger/screen"

export function DailyChart() {
  const months = invoiceScreen().months
  const max = Math.max(...months.map((month) => month.costCents))

  return (
    <Card>
      <CardTitle>Cost by month</CardTitle>
      <div className="mt-4 flex h-44 items-end gap-3">
        {months.map((month) => (
          <div key={month.key} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
            <div
              data-month-cents={month.costCents}
              title={`${month.label}: ${usdFromCents(month.costCents)}`}
              className="w-full rounded-sm bg-primary transition-all duration-500"
              style={{ height: `${Math.max(max === 0 ? 0 : (month.costCents / max) * 100, 8)}%` }}
            />
            <span className="text-center font-mono text-[10px] text-muted-foreground">{month.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
