import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export function PaginationNav(props: {
  currentPage: number;
  totalPages: number;
  to: string;
  search: Record<string, unknown>;
  params?: Record<string, string>;
}) {
  const { currentPage, totalPages, to, search, params } = props;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4 shadow-sm">
      <Button
        asChild
        variant="outline"
        disabled={currentPage <= 1}
      >
        <Link
          to={to}
          params={params}
          search={{
            ...search,
            page: currentPage > 2 ? currentPage - 1 : currentPage === 2 ? undefined : undefined,
          }}
        >
          Previous
        </Link>
      </Button>

      <p className="text-sm font-bold text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <Button
        asChild
        variant="outline"
        disabled={currentPage >= totalPages}
      >
        <Link
          to={to}
          params={params}
          search={{
            ...search,
            page: currentPage < totalPages ? currentPage + 1 : totalPages,
          }}
        >
          Next
        </Link>
      </Button>
    </nav>
  );
}
