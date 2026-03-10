import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "#/lib/utils";

interface QuickActionProps {
  to: string;
  label: string;
  title: string;
  icon: LucideIcon;
  variant?: "primary" | "card";
  badge?: number;
  className?: string;
}

export function QuickAction({
  to,
  label,
  title,
  icon: Icon,
  variant = "card",
  badge,
  className,
}: QuickActionProps) {
  const isPrimary = variant === "primary";

  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center justify-between rounded-md p-6 no-underline shadow-sm transition-all hover:scale-[1.02] active:scale-95",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border/50 text-foreground hover:border-primary/50 hover:bg-muted/50",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
            isPrimary
              ? "bg-white/20"
              : "bg-muted group-hover:bg-primary/10 group-hover:text-primary",
          )}
        >
          <Icon size={20} strokeWidth={isPrimary ? 3 : 2.5} />
        </div>
        <div>
          <p
            className={cn(
              "text-xs tracking-widest",
              isPrimary ? "opacity-80" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <h3
            className={cn(
              "text-xl",
              isPrimary ? "font-medium" : "display-title",
            )}
          >
            {title}
          </h3>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground shadow-sm">
            {badge}
          </span>
        )}
        <ArrowRight
          size={20}
          className={cn(
            "transition-opacity opacity-40 group-hover:opacity-100",
            !isPrimary && "text-muted-foreground",
          )}
        />
      </div>
    </Link>
  );
}
