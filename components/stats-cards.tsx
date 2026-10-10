import type { LucideIcon } from "lucide-react"

import { Card, CardHint } from "@/components/ui/card"

export type Stat = {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <stat.icon className="size-3.5" />
            <span>{stat.label}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
          <CardHint className="mt-1">{stat.hint}</CardHint>
        </Card>
      ))}
    </section>
  )
}
