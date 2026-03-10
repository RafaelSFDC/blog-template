import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { subscribers } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import { Users, Download, CheckCircle2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";

const getSubscribers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  const { db } = await import("#/db/index");
  return db.query.subscribers.findMany({
    orderBy: [desc(subscribers.createdAt)],
  });
});

const exportSubscribersCSV = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();
    const { db } = await import("#/db/index");
    const allSubscribers = await db.query.subscribers.findMany({
      orderBy: [desc(subscribers.createdAt)],
    });

    if (allSubscribers.length === 0) {
      return { data: null, error: "No subscribers found" };
    }

    // Generate CSV Header
    const headers = ["Email", "Status", "Subscribed At"];

    // Generate CSV Rows
    const rows = allSubscribers.map((sub: any) => [
      sub.email,
      sub.status,
      sub.createdAt.toISOString(),
    ]);

    // Combine headers and rows, handle escaping for CSV format
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) =>
        row
          .map((value: any) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return { data: csvContent, count: allSubscribers.length };
  },
);

export const Route = createFileRoute("/dashboard/users/subscribers")({
  loader: () => getSubscribers(),
  component: SubscribersPage,
});

function SubscribersPage() {
  const subs = Route.useLoaderData();

  const handleExport = async () => {
    try {
      const result = await exportSubscribersCSV();

      if (result?.data) {
        // Create a Blob from the CSV String
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);

        // Create an invisible link to trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `vibe-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(result?.error || "Failed to export subscribers.");
      }
    } catch (e) {
      console.error("Export failed:", e);
      alert("An error occurred during export.");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email Address",
        cell: ({ row }) => (
          <div className="font-bold text-foreground">
            {row.getValue("email")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-xs uppercase ${
                status === "active"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {status === "active" && <CheckCircle2 size={12} />}
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date Subscribed",
        cell: ({ row }) => (
          <div className="font-medium text-muted-foreground">
            {format(new Date(row.getValue("createdAt")), "MMM d, yyyy h:mm a")}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-10">
      <header className="bg-card border shadow-sm rounded-xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Users size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Audience</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">
            Subscribers
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Manage your newsletter audience and export your list.
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={subs.length === 0}
          variant="default"
          size="lg"
          className="whitespace-nowrap rounded-xl font-bold"
        >
          <Download size={18} />
          Export CSV ({subs.length})
        </Button>
      </header>

      <DataTable
        columns={columns}
        data={subs}
        searchKey="email"
        searchPlaceholder="Filter subscribers..."
      />
    </div>
  );
}
