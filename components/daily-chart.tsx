import { Card, CardTitle } from "@/components/ui/card"
import { dailyBilled, usd } from "@/lib/fixtures"

export function DailyChart() {
  const max = Math.max(...dailyBilled)

  return (
    <Card>
      <CardTitle>Billed by day</CardTitle>
      <div className="mt-4 flex h-44 items-end gap-1.5 sm:gap-2">
        {dailyBilled.map((amount, index) => (
          <div key={index} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
            <div
              data-day-billed={amount}
              title={`Day ${index + 1}: ${usd(amount)}`}
              className="w-full rounded-sm bg-primary transition-all duration-500"
              style={{ height: `${Math.max((amount / max) * 100, 8)}%` }}
            />
            <span className="text-center font-mono text-[10px] text-muted-foreground tabular-nums">{index + 1}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
