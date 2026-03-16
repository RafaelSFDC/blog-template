import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  items?: Array<{
    label: string;
    href?: string;
  }>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const trail = items?.length
    ? items
    : [{ label: "Stories", href: "/blog" }];

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
      {trail.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? (
            <a
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < trail.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}
        </span>
      ))}
    </nav>
  );
}
