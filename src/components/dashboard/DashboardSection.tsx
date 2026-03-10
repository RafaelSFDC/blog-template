import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className=" text-2xl font-medium tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex shrink-0 items-center gap-3">{action}</div>
        )}
      </div>
      {children}
    </section>
  );
}
