import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase rounded-md border px-2 py-1",
  {
    variants: {
      variant: {
        success:
          "bg-success/10 text-success border-success/20",
        warning:
          "bg-warning/10 text-warning-foreground border-warning/20",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        info: "bg-info/10 text-info border-info/20",
        default:
          "bg-muted text-muted-foreground border-border/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface StatusBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  className,
  variant = "default",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { StatusBadge, statusBadgeVariants }
