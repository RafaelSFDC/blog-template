import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { type InferSelectModel } from "drizzle-orm";
import { Activity, Globe, Plus, Webhook } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "#/components/dashboard/DataTable";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DeleteButton } from "#/components/dashboard/DeleteButton";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Button } from "#/components/ui/button";
import { webhooks as webhooksSchema } from "#/server/db/schema";
import { cn } from "#/lib/utils";
import {
  deleteDashboardWebhook,
  getDashboardWebhooks,
  toggleDashboardWebhook,
} from "#/server/actions/dashboard/webhooks";

type WebhookType = InferSelectModel<typeof webhooksSchema>;

export const Route = createFileRoute("/dashboard/webhooks/")({
  loader: () => getDashboardWebhooks(),
  component: WebhooksPage,
});

function WebhooksPage() {
  const initialWebhooks = Route.useLoaderData();
  const [list, setList] = useState<WebhookType[]>(initialWebhooks);

  const handleDelete = useCallback(async (id: number) => {
    await deleteDashboardWebhook({ data: id });
    setList((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleToggle = useCallback(async (id: number, isActive: boolean) => {
    await toggleDashboardWebhook({ data: { id, isActive } });
    setList((prev) => prev.map((w) => (w.id === id ? { ...w, isActive } : w)));
  }, []);

  const columns = useMemo<ColumnDef<WebhookType>[]>(
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
            <DeleteButton
              onConfirm={() => handleDelete(row.original.id)}
              title="Delete webhook?"
              description="This webhook endpoint will be removed permanently. This action cannot be undone."
            />
          </div>
        ),
      },
    ],
    [handleDelete, handleToggle],
  );

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Webhooks"
        description="Notify external services when posts are published."
        icon={Webhook}
        iconLabel="Integrations"
      >
        <Button asChild variant="default" size="default">
          <Link to="/dashboard/webhooks/new">
            <Plus size={20} className="mr-2" strokeWidth={3} />
            New Webhook
          </Link>
        </Button>
      </DashboardHeader>

      {list.length > 0 ? (
        <DataTable
          columns={columns}
          data={list}
          searchKey="name"
          searchPlaceholder="Search webhooks..."
        />
      ) : (
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Create your first endpoint to notify automation tools and external services when content is published."
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard/webhooks/new">Create your first webhook</Link>
            </Button>
          }
        />
      )}

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
    </DashboardPageContainer>
  );
}

