import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { createServerFn } from "@tanstack/react-start";
import { newsletters } from "#/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "#/components/ui/button";
import { requireAdminSession } from "#/lib/admin-auth";
import { format } from "date-fns";
import { Mail, Plus, Trash2, Download } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState } from "#/components/dashboard/EmptyState";

const getNewsletters = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const { db } = await import("#/db/index");
  return db.query.newsletters.findMany({
    orderBy: desc(newsletters.createdAt),
  });
});

const deleteNewsletter = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    await db.delete(newsletters).where(eq(newsletters.id, id));
    return { success: true };
  });

const exportSubscribers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    const allSubscribers = await db.query.subscribers.findMany();

    const header = "ID,Email,Status,CreatedAt\n";
    const rows = allSubscribers
      .map(
        (s: {
          id: number;
          email: string;
          status: string;
          createdAt: Date | null;
        }) =>
          `${s.id},"${s.email}",${s.status},${s.createdAt ? s.createdAt.toISOString() : ""}`,
      )
      .join("\n");

    return header + rows;
  },
);

export const Route = createFileRoute("/dashboard/newsletters/")({
  loader: () => getNewsletters(),
  component: NewsletterIndexPage,
});

function NewsletterIndexPage() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      setDeleting(id);
      await deleteNewsletter({ data: id });
      navigate({ to: "." }); // Refresh
    } catch (err) {
      alert("Failed to delete newsletter.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Newsletters"
        description="Connect directly with your audience through curated email campaigns."
        icon={Mail}
        iconLabel="Marketing & Growth"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              const csv = await exportSubscribers();
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
            }}
          >
            <Download className="mr-2 h-5 w-5" />
            Export CSV
          </Button>
          <Button asChild variant="default" size="lg">
            <Link
              to="/dashboard/newsletters/new"
              search={{ fromId: undefined } as any}
            >
              <Plus className="h-5 w-5" />
              New Campaign
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="mt-0 space-y-4">
        {data.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No campaigns yet"
            description="Start your first newsletter campaign to engage your subscribers."
            action={
              <Button asChild variant="outline">
                <Link
                  to="/dashboard/newsletters/new"
                  search={{ fromId: undefined } as any}
                >
                  Create First Campaign
                </Link>
              </Button>
            }
          />
        ) : (
          data.map((item: any) => (
            <div
              key={item.id}
              className="bg-card border shadow-sm group flex flex-col items-start justify-between gap-4 rounded-[1.6rem] p-6 transition-all hover:bg-muted/50 sm:flex-row sm:items-center sm:p-8"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                    item.status === "sent"
                      ? "bg-green-500/10 text-green-500"
                      : item.status === "sending"
                        ? "bg-blue-500/10 text-blue-500 animate-pulse"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  <Mail className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {item.subject}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === "sent"
                          ? "bg-green-500/10 text-green-500"
                          : item.status === "failed"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-muted-foreground/10"
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(item.createdAt!), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.status === "draft" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/dashboard/newsletters/new`}
                      search={{ fromId: item.id } as any}
                    >
                      Edit
                    </Link>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {(item.status === "sent" || item.status === "failed") && (
                  <Button variant="default" size="sm">
                    View Results
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPageContainer>
  );
}
