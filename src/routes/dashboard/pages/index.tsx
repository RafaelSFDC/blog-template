import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { SetupIncompleteNotice } from "#/components/dashboard/setup-incomplete-notice";
import { Library, Plus, Pencil, Trash2, House } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deletePage, getPages } from "#/server/page-actions";
import { getSetupStatusForDashboard } from "#/server/actions/system/setup-actions";
import type { SetupStatus } from "#/types/system";

type DashboardPage = Awaited<ReturnType<typeof getPages>>[number];

export const Route = createFileRoute("/dashboard/pages/")({
  loader: async () => {
    const [pages, setup] = await Promise.all([getPages(), getSetupStatusForDashboard()]);
    return { pages, setup };
  },
  component: PagesManagementPage,
});

function PagesManagementPage() {
  const { pages, setup } = Route.useLoaderData() as {
    pages: DashboardPage[];
    setup: SetupStatus | null;
  };
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this page? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePage({ data: { id } });
      await router.invalidate();
      toast.success("Page deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete page");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Pages"
        description="Create and maintain static pages for your publication."
        icon={Library}
        iconLabel="Static Content"
      >
        <Button asChild variant="default">
          <Link to="/dashboard/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </DashboardHeader>

      <SetupIncompleteNotice setup={setup} area="pages" />

      <div className="grid gap-4">
        {pages.length > 0 ? (
          pages.map((page: DashboardPage) => (
            <article
              key={page.id}
              className="bg-card border shadow-sm rounded-xl border-border/50 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                      {page.status}
                    </span>
                    {page.isHome && (
                      <span className="rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-green-600">
                        Homepage
                      </span>
                    )}
                  </div>
                  <h2 className="display-title text-2xl text-foreground">
                    {page.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    /{page.slug}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={page.isHome ? "/" : `/${page.slug}`} target="_blank" rel="noreferrer">
                      <House size={16} />
                      <span className="ml-2 hidden sm:inline">View</span>
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/dashboard/pages/$pageId/edit"
                      params={{ pageId: String(page.id) }}
                    >
                      <Pencil size={16} />
                      <span className="ml-2 hidden sm:inline">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === page.id}
                    onClick={() => void handleDelete(page.id)}
                  >
                    <Trash2 size={16} />
                    <span className="ml-2 hidden sm:inline">
                      {deletingId === page.id ? "Deleting…" : "Delete"}
                    </span>
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={Library}
            title="No pages yet"
            description="Create your first Home, About, or Contact page."
            action={
              <Button asChild variant="default">
                <Link to="/dashboard/pages/new">Create First Page</Link>
              </Button>
            }
          />
        )}
      </div>
    </DashboardPageContainer>
  );
}
