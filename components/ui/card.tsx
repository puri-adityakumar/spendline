import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Card({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-size={size}
      className={cn(
        "rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10",
        size === "sm" ? "p-3" : "p-4",
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-medium", className)} {...props} />
}

export function CardHint({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />
}
