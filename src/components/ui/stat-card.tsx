import * as React from "react"
import { cn } from "#/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface StatCardProps extends React.ComponentProps<"div"> {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  iconClassName?: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-5 p-6",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
          iconClassName,
        )}
      >
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-foreground truncate">
          {value}
        </h3>
      </div>
    </div>
  )
}

export { StatCard }
