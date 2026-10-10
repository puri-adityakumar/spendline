import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { personById, usd } from "@/lib/fixtures"

export function PersonScreen({ personId }: { personId: string }) {
  const person = personById(personId)

  if (!person) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Unknown person</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{person.role}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{person.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{person.story}</p>
        </div>
        <Link href={`/investigate?person=${person.id}`}>
          <Button type="button">Investigate</Button>
        </Link>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Tokens</dt>
          <dd className="text-xl font-semibold tabular-nums">{person.tokens}</dd>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Billed</dt>
          <dd className="text-xl font-semibold tabular-nums">{usd(person.billedUsd)}</dd>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-foreground/10">
          <dt className="text-xs text-muted-foreground">Traced</dt>
          <dd className="text-xl font-semibold tabular-nums">{usd(person.tracedUsd)}</dd>
        </div>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Billed</TableHead>
            <TableHead>Traced</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {person.rows.map((row, index) => (
            <TableRow key={`${row.day}-${row.key}-${index}`}>
              <TableCell className="tabular-nums">{row.day}</TableCell>
              <TableCell className="font-mono text-xs">{row.model}</TableCell>
              <TableCell className="font-mono text-xs">{row.key}</TableCell>
              <TableCell className="tabular-nums">{row.tokens}</TableCell>
              <TableCell className="tabular-nums">{usd(row.billedUsd)}</TableCell>
              <TableCell className="tabular-nums">{usd(row.tracedUsd)}</TableCell>
              <TableCell>
                <Badge variant={row.badge}>{row.note}</Badge>
              </TableCell>
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
