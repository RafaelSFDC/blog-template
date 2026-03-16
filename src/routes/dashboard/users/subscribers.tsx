import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DataTable } from "#/components/dashboard/DataTable";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Users, Download, CheckCircle2, Clock3, Ban } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  exportDashboardSubscribersCsv,
  getDashboardSubscribers,
} from "#/server/dashboard/subscribers";

export const Route = createFileRoute("/dashboard/users/subscribers")({
  loader: () => getDashboardSubscribers(),
  component: SubscribersPage,
});

type SubscriberRow = Awaited<ReturnType<typeof getDashboardSubscribers>>[number];

function SubscribersPage() {
  const subs = Route.useLoaderData();

  const handleExport = async () => {
    try {
      const result = await exportDashboardSubscribersCsv();

      if (result?.data) {
        // Create a Blob from the CSV String
        const blob = new Blob([result.data], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);

        // Create an invisible link to trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", result.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        toast.error(result?.error || "Failed to export subscribers.");
      }
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("An error occurred during export.");
    }
  };

  const columns = useMemo<ColumnDef<SubscriberRow>[]>(
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
          const status = row.getValue("status") as SubscriberRow["status"];
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-xs uppercase ${
                status === "active"
                  ? "bg-green-500/10 text-green-600"
                  : status === "pending"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-destructive/10 text-destructive"
              }`}
            >
              {status === "active" && <CheckCircle2 size={12} />}
              {status === "pending" && <Clock3 size={12} />}
              {(status === "unsubscribed" || status === "bounced" || status === "complained") && <Ban size={12} />}
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
    <DashboardPageContainer>
      <DashboardHeader
        title="Subscribers"
        description="Manage your newsletter audience and export active subscriber data when needed."
        icon={Users}
        iconLabel="Audience"
      >
        <Button
          onClick={handleExport}
          disabled={subs.length === 0}
          variant="default"
          size="lg"
          className="whitespace-nowrap"
        >
          <Download size={18} />
          Export CSV ({subs.length})
        </Button>
      </DashboardHeader>

      {subs.length > 0 ? (
        <DataTable
          columns={columns}
          data={subs}
          searchKey="email"
          searchPlaceholder="Search subscribers..."
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No subscribers yet"
          description="Subscriber records will appear here as readers join your newsletter."
        />
      )}
    </DashboardPageContainer>
  );
}
