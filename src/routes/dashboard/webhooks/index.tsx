import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { createServerFn } from "@tanstack/react-start";
import { webhooks } from "#/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminSession } from "#/lib/admin-auth";
import { Button } from "#/components/ui/button";
import { Webhook, Plus, Trash2, Activity, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "#/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";

const getWebhooks = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const { db } = await import("#/db/index");
  return db.query.webhooks.findMany({
    orderBy: [desc(webhooks.createdAt)],
  });
});

const deleteWebhook = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    await db.delete(webhooks).where(eq(webhooks.id, id));
    return { success: true };
  });

const toggleWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; isActive: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    await db
      .update(webhooks)
      .set({ isActive: data.isActive })
      .where(eq(webhooks.id, data.id));
    return { success: true };
  });

export const Route = createFileRoute("/dashboard/webhooks/")({
  loader: () => getWebhooks(),
  component: WebhooksPage,
});

function WebhooksPage() {
  const initialWebhooks = Route.useLoaderData();
  const [list, setList] = useState(initialWebhooks);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    await deleteWebhook({ data: id });
    setList(list.filter((w: any) => w.id !== id));
  }

  async function handleToggle(id: number, isActive: boolean) {
    await toggleWebhook({ data: { id, isActive } });
    setList(list.map((w: any) => (w.id === id ? { ...w, isActive } : w)));
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <div className="flex items-center gap-3 font-bold text-foreground">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  webhook.isActive
                    ? "bg-success shadow-[0_0_8px_oklch(0.72_0.19_150/0.5)]"
                    : "bg-muted-foreground/30",
                )}
              />
              {webhook.name}
            </div>
          );
        },
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground font-mono max-w-[200px] truncate">
            {row.getValue("url")}
          </div>
        ),
      },
      {
        accessorKey: "event",
        header: "Event",
        cell: ({ row }) => (
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-wider">
            {row.getValue("event")}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const webhook = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle(webhook.id, !webhook.isActive)}
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                webhook.isActive
                  ? "text-success hover:text-success/80"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {webhook.isActive ? "Active" : "Disabled"}
            </Button>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 size={18} />
            </Button>
          </div>
        ),
      },
    ],
    [list],
  );

  return (
    <div className="space-y-10">
      <DashboardHeader
        title="Webhooks"
        description="Notify external services when posts are published."
        icon={Webhook}
        iconLabel="Integrations"
      >
        <Button asChild variant="default" size="default">
          <a href="/dashboard/webhooks/new">
            <Plus size={20} className="mr-2" strokeWidth={3} />
            New Webhook
          </a>
        </Button>
      </DashboardHeader>

      <DataTable
        columns={columns}
        data={list}
        searchKey="name"
        searchPlaceholder="Filter webhooks..."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="border shadow-sm rounded-md bg-muted/50 p-6 border-border/30">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            External Integrations
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Use webhooks to connect with services like Zapier, Make.com, n8n, or
            your own custom notification bots.
          </p>
        </div>
        <div className="border shadow-sm rounded-md bg-muted/50 p-6 border-border/30">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Verification
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            The payload includes the post title, slug, excerpt, and ID. If a
            secret is provided, it will be sent in the{" "}
            <code>X-Webhook-Secret</code> header.
          </p>
        </div>
      </div>
    </div>
  );
}
