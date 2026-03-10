import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

interface SiteHeaderProps {
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export function SiteHeader({
  title,
  description,
  badge,
  className,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "bg-card border shadow-sm rounded-md p-8 sm:p-12",
        className,
      )}
    >
      {badge && (
        <Badge variant="default" className="mb-4">
          {badge}
        </Badge>
      )}
      <h1 className="text-4xl font-medium text-foreground sm:text-5xl md:text-6xl mb-4">
        {title}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground font-bold leading-tight">
        {description}
      </p>
    </header>
  );
}
