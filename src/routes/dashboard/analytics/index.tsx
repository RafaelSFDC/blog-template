import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getAnalyticsStats } from "#/server/analytics-actions";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import {
  BarChart3,
  Users,
  Eye,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import { StatCard } from "#/components/ui/stat-card";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/dashboard/analytics/")({
  loader: () => getAnalyticsStats(),
  component: AnalyticsDashboard,
});

const LazyAnalyticsCharts = lazy(() =>
  import("./-analytics-charts-client").then((module) => ({
    default: module.AnalyticsCharts,
  })),
);

interface StatItem {
  date: string;
  count: number;
}

interface AnalyticsData {
  isConfigured: boolean;
  totalViews: number;
  totalVisitors: number;
  viewsPerDay: StatItem[];
  topPages: { pathname: string; count: number }[];
  browsers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
}

function AnalyticsDashboard() {
  const data = Route.useLoaderData() as AnalyticsData;
  const isHydrated = useHydrated();

  const stats = [
    {
      label: "Total Views",
      value: data.totalViews,
      icon: Eye,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Unique Visitors",
      value: data.totalVisitors,
      icon: Users,
      iconClassName: "bg-success/10 text-success",
    },
    {
      label: "Avg. Views/Visitor",
      value:
        data.totalVisitors > 0
          ? (data.totalViews / data.totalVisitors).toFixed(1)
          : 0,
      icon: ArrowUpRight,
      iconClassName: "bg-info/10 text-info",
    },
  ];

  if (!data.isConfigured) {
    return (
      <DashboardPageContainer>
        <DashboardHeader
          title="Analytics Intelligence"
          description="Monitor your audience growth and content performance in real-time."
          icon={BarChart3}
          iconLabel="Analytics"
        />

        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card border rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mb-6">
            <Globe size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">
            Analytics Not Configured
          </h2>
          <p className="text-muted-foreground max-w-md mb-8 font-medium">
            PostHog environment variables are missing. Please configure{" "}
            <code className="bg-muted px-1 rounded">
              POSTHOG_PERSONAL_API_KEY
            </code>{" "}
            and{" "}
            <code className="bg-muted px-1 rounded">
              VITE_POSTHOG_PROJECT_ID
            </code>{" "}
            in your <code className="bg-muted px-1 rounded">.env</code> file to
            see analytics data.
          </p>
          <div className="grid gap-4 w-full max-w-sm">
            <div className="bg-muted/50 p-4 rounded-xl text-left border text-xs font-mono break-all">
              <span className="text-muted-foreground block mb-1 font-sans font-bold uppercase tracking-widest text-[10px]">
                Required Variables:
              </span>
              POSTHOG_PERSONAL_API_KEY=ph_...
              <br />
              VITE_POSTHOG_PROJECT_ID=...
              <br />
              VITE_POSTHOG_HOST=https://app.posthog.com
            </div>
          </div>
        </div>
      </DashboardPageContainer>
    );
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Analytics Intelligence"
        description="Monitor your audience growth, content performance, and technical metrics in real-time."
        icon={BarChart3}
        iconLabel="Analytics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            iconClassName={stat.iconClassName}
          />
        ))}
      </div>

      {isHydrated ? (
        <Suspense fallback={<AnalyticsChartsSkeleton />}>
          <LazyAnalyticsCharts data={data} />
        </Suspense>
      ) : (
        <AnalyticsChartsSkeleton />
      )}
    </DashboardPageContainer>
  );
}

function AnalyticsChartsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 rounded bg-muted" />
        <div className="h-[340px] rounded-lg bg-muted/50" />
      </section>
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-24 rounded bg-muted" />
        <div className="h-[340px] rounded-lg bg-muted/50" />
      </section>
      <section className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-44 rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 h-5 w-28 rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>
    </div>
  );
}
