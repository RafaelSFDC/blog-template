import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { BarChart3, Download, Mail, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Button } from "#/components/ui/button";
import {
  deleteNewsletterCampaignAction,
  exportSubscribersCsv,
  getNewsletterIndexData,
} from "#/server/newsletter-actions";

export const Route = createFileRoute("/dashboard/newsletters/")({
  loader: () => getNewsletterIndexData(),
  component: NewsletterIndexPage,
});

function NewsletterIndexPage() {
  const initial = Route.useLoaderData();
  const [campaigns, setCampaigns] = useState(initial.campaigns);
  const stats = initial.stats;

  async function handleExport() {
    try {
      const csv = await exportSubscribersCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export subscribers.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteNewsletterCampaignAction({ data: id });
      setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
    } catch {
      toast.error("Failed to delete campaign.");
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Newsletters"
        description="Operate campaigns with queue-based delivery, tracking, and subscriber exports."
        icon={Mail}
        iconLabel="Distribution"
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={() => void handleExport()}>
            <Download className="mr-2 h-4 w-4" />
            Export Subscribers
          </Button>
          <Button asChild size="lg">
            <Link to="/dashboard/newsletters/new" search={{ fromId: undefined }}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active Subscribers" value={stats.activeSubscribers} />
        <StatCard label="Sent Campaigns" value={stats.sentCampaigns} />
        <StatCard label="Avg Open Rate" value={`${Math.round(stats.averageOpenRate * 100)}%`} />
        <StatCard label="Avg Click Rate" value={`${Math.round(stats.averageClickRate * 100)}%`} />
      </div>

      <div className="mt-8 space-y-4">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No campaigns yet"
            description="Create your first campaign to start sending tracked newsletter issues."
            action={
              <Button asChild variant="outline">
                <Link to="/dashboard/newsletters/new" search={{ fromId: undefined }}>
                  Create Campaign
                </Link>
              </Button>
            }
          />
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                      {campaign.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Segment: {campaign.segment.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{campaign.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {campaign.preheader || "No preheader defined yet."}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Created {format(new Date(campaign.createdAt), "MMM d, yyyy HH:mm")}</span>
                    <span>Recipients {campaign.totalRecipients}</span>
                    <span>Sent {campaign.sentCount}</span>
                    <span>Failed {campaign.failedCount}</span>
                    <span>Opened {campaign.openCount}</span>
                    <span>Clicked {campaign.clickCount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/newsletters/$newsletterId" params={{ newsletterId: String(campaign.id) }}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Details
                    </Link>
                  </Button>
                  {campaign.status === "draft" || campaign.status === "scheduled" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dashboard/newsletters/new" search={{ fromId: campaign.id }}>
                        Edit
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(campaign.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPageContainer>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}
