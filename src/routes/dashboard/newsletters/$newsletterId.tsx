import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Button } from "#/components/ui/button";
import {
  getNewsletterCampaignAction,
  listNewsletterDeliveriesAction,
} from "#/server/newsletter-actions";

export const Route = createFileRoute("/dashboard/newsletters/$newsletterId")({
  loader: async ({ params }) => {
    const newsletterId = Number(params.newsletterId);
    const [campaign, deliveries] = await Promise.all([
      getNewsletterCampaignAction({ data: newsletterId }),
      listNewsletterDeliveriesAction({ data: newsletterId }),
    ]);

    return { campaign, deliveries };
  },
  component: NewsletterDetailPage,
});

function NewsletterDetailPage() {
  const { campaign, deliveries } = Route.useLoaderData();

  if (!campaign) {
    return null;
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title={campaign.subject}
        description="Campaign execution timeline and delivery summary."
        icon={Mail}
        iconLabel="Campaign Detail"
      >
        <Button asChild variant="ghost">
          <Link to="/dashboard/newsletters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Status" value={campaign.status} />
        <Metric label="Recipients" value={campaign.totalRecipients} />
        <Metric label="Sent" value={campaign.sentCount} />
        <Metric label="Failed" value={campaign.failedCount} />
      </div>

      <div className="mt-8 rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold">Deliveries</h2>
        </div>
        <div className="divide-y">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{delivery.subscriberEmail}</p>
                <p className="text-xs text-muted-foreground">
                  Attempts {delivery.attemptCount}
                  {delivery.lastError ? ` • ${delivery.lastError}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-bold uppercase text-primary">
                  {delivery.status}
                </span>
                <span>Sent {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : "-"}</span>
                <span>Opened {delivery.openedAt ? new Date(delivery.openedAt).toLocaleString() : "-"}</span>
                <span>Clicked {delivery.clickedAt ? new Date(delivery.clickedAt).toLocaleString() : "-"}</span>
              </div>
            </div>
          ))}
          {deliveries.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              No deliveries yet. Queue this campaign or wait for the scheduled job.
            </div>
          ) : null}
        </div>
      </div>
    </DashboardPageContainer>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
