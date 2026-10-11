import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="grid min-w-0 gap-1">
      <p className="text-xs text-muted-foreground sm:hidden">Swipe sideways to see every column.</p>
      <div className="relative w-full max-w-full overflow-x-auto rounded-lg border">
        <table className={cn("w-full min-w-[40rem] caption-bottom text-sm", className)} {...props} />
      </div>
    </div>
  )
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("sticky top-0 bg-muted/95 backdrop-blur-sm [&_tr]:border-b", className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b transition-colors", className)} {...props} />
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn("h-9 px-3 text-left align-middle text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-3 py-2 align-middle", className)} {...props} />
}
