import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`bg-card border shadow-sm flex flex-col items-center justify-center rounded-xl py-12 text-center border-dashed  ${className || ""}`}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground font-medium max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
