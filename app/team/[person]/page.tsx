import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatTokens, teamById, usdFromCents } from "@/lib/ledger/screen"

export function PersonScreen({ personId }: { personId: string }) {
  const team = teamById(personId)

  if (!team) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Unknown team</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{formatTokens(team.rows)} invoice rows</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{team.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {formatTokens(team.tokens)} tokens, {usdFromCents(team.costCents)} from ledger/invoices.csv.
          </p>
        </div>
        <Link href={`/investigate?team=${team.id}`}>
          <Button type="button">Investigate</Button>
        </Link>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Rows</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatTokens(team.rows)}</dd>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Tokens</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatTokens(team.tokens)}</dd>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Cost</dt>
          <dd className="text-xl font-semibold tabular-nums">{usdFromCents(team.costCents)}</dd>
        </div>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.models.map((model) => (
            <TableRow key={model.model}>
              <TableCell className="whitespace-nowrap font-mono text-xs">{model.model}</TableCell>
              <TableCell className="tabular-nums">{formatTokens(model.rows)}</TableCell>
              <TableCell className="tabular-nums">{formatTokens(model.tokens)}</TableCell>
              <TableCell className="tabular-nums">{usdFromCents(model.costCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.days.map((day) => (
            <TableRow key={day.day}>
              <TableCell className="whitespace-nowrap tabular-nums">{day.day}</TableCell>
              <TableCell className="tabular-nums">{formatTokens(day.rows)}</TableCell>
              <TableCell className="tabular-nums">{formatTokens(day.tokens)}</TableCell>
              <TableCell className="tabular-nums">{usdFromCents(day.costCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}

export default async function PersonPage({ params }: { params: Promise<{ person: string }> }) {
  const { person } = await params
  return <PersonScreen personId={person} />
}
