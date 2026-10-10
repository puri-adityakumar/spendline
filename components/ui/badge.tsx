import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 items-center rounded-4xl px-2 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-white",
        outline: "border border-border text-foreground",
        ghost: "text-foreground",
        link: "text-primary underline-offset-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-badge={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}
