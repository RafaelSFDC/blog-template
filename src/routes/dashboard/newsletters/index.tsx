import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { desc, eq, type InferSelectModel } from "drizzle-orm";
import { format } from "date-fns";
import { Download, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DeleteButton } from "#/components/dashboard/DeleteButton";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Button } from "#/components/ui/button";
import { newsletters, subscribers } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";

type Newsletter = InferSelectModel<typeof newsletters>;
type SubscriberRow = typeof subscribers.$inferSelect;

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

export const Route = createFileRoute("/dashboard/newsletters/")({
  loader: () => getNewsletters(),
  component: NewsletterIndexPage,
});

const exportSubscribers = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    const allSubscribers = (await db.query.subscribers.findMany()) as SubscriberRow[];

    const header = "ID,Email,Status,CreatedAt\n";
    const rows = allSubscribers
      .map(
        (s) =>
          `${s.id},"${s.email}",${s.status},${s.createdAt ? (typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString()) : ""}`,
      )
      .join("\n");

    return header + rows;
  },
);

function NewsletterIndexPage() {
  const initialCampaigns = Route.useLoaderData() as Newsletter[];
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(id: number) {
    try {
      setDeleting(id);
      await deleteNewsletter({ data: id });
      setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    } catch {
      toast.error("Failed to delete campaign.");
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
              try {
                const csv = await exportSubscribers();
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {
                toast.error("Failed to export subscribers.");
              }
            }}
          >
            <Download className="mr-2 h-5 w-5" />
            Export CSV
          </Button>
          <Button asChild variant="default" size="lg">
            <Link
              to="/dashboard/newsletters/new"
              search={{ fromId: undefined }}
            >
              <Plus className="h-5 w-5" />
              New Campaign
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="mt-0 space-y-4">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No campaigns yet"
            description="Start your first newsletter campaign to engage your subscribers."
            action={
              <Button asChild variant="outline">
                <Link
                  to="/dashboard/newsletters/new"
                  search={{ fromId: undefined }}
                >
                  Create First Campaign
                </Link>
              </Button>
            }
          />
        ) : (
          campaigns.map((item: Newsletter) => (
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
                      search={{ fromId: item.id }}
                    >
                      Edit
                    </Link>
                  </Button>
                )}
                <DeleteButton
                  onConfirm={() => handleDelete(item.id)}
                  isLoading={deleting === item.id}
                  title="Delete campaign?"
                  description="This newsletter campaign will be permanently removed."
                />
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPageContainer>
  );
}
