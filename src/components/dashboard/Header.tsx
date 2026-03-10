import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconLabel?: string;
  children?: ReactNode;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  icon: Icon,
  iconLabel,
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "bg-card border shadow-sm flex flex-wrap items-end justify-between gap-6 rounded-3xl p-8 sm:p-10 bg-card border border-border shadow-md mb-8",
        className,
      )}
    >
      <div className="flex-1 min-w-[280px]">
        {iconLabel || Icon ? (
          <div className="mb-4 flex items-center gap-2 text-primary">
            {Icon && <Icon size={20} strokeWidth={3} />}
            {iconLabel && (
              <p className="island-kicker mb-0 font-black uppercase tracking-widest text-xs">
                {iconLabel}
              </p>
            )}
          </div>
        ) : null}
        <h1 className="text-4xl text-foreground sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-muted-foreground font-medium text-lg leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-4">{children}</div>
      )}
    </header>
  );
}
