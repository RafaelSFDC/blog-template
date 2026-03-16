import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Globe, TrendingUp } from "lucide-react";
import { z } from "zod";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { StatCard } from "#/components/ui/stat-card";
import { Button } from "#/components/ui/button";
import { analyticsRangeSchema } from "#/lib/analytics-events";
import { useHydrated } from "#/hooks/use-hydrated";
import { getAnalyticsStats } from "#/server/analytics-actions";
import type { AnalyticsDashboardData } from "#/server/analytics-dashboard";

export const Route = createFileRoute("/dashboard/analytics/")({
  validateSearch: z.object({
    range: analyticsRangeSchema.optional(),
  }),
  loaderDeps: ({ search }) => ({
    range: search.range ?? "30d",
  }),
  loader: ({ deps }) => getAnalyticsStats({ data: deps.range }),
  component: AnalyticsDashboard,
});

const LazyAnalyticsCharts = lazy(() =>
  import("./-analytics-charts-client").then((module) => ({
    default: module.AnalyticsCharts,
  })),
);

function AnalyticsDashboard() {
  const data = Route.useLoaderData() as AnalyticsDashboardData & { error?: string };
  const search = Route.useSearch();
  const isHydrated = useHydrated();

  if (!data.isConfigured) {
    return (
      <DashboardPageContainer>
        <DashboardHeader
          title="Growth Analytics"
          description="Track activation, acquisition, monetization, newsletter health, and launch operations."
          icon={BarChart3}
          iconLabel="Analytics"
        />

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <Globe size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            PostHog not configured
          </h2>
          <p className="mb-8 mt-2 max-w-md text-muted-foreground">
            Add <code className="rounded bg-muted px-1">POSTHOG_PERSONAL_API_KEY</code> and{" "}
            <code className="rounded bg-muted px-1">VITE_POSTHOG_PROJECT_ID</code> to unlock the product analytics dashboard.
          </p>
        </div>
      </DashboardPageContainer>
    );
  }

  const stats = [
    {
      label: "Setup completion",
      value: `${data.summary?.setup_completion_rate ?? 0}%`,
      icon: TrendingUp,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Marketing to beta",
      value: `${data.summary?.marketing_to_beta_rate ?? 0}%`,
      icon: TrendingUp,
      iconClassName: "bg-info/10 text-info",
    },
    {
      label: "Marketing to CTA",
      value: `${data.summary?.marketing_to_cta_rate ?? 0}%`,
      icon: TrendingUp,
      iconClassName: "bg-warning/10 text-warning",
    },
    {
      label: "Checkout completion",
      value: `${data.summary?.checkout_completion_rate ?? 0}%`,
      icon: TrendingUp,
      iconClassName: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Growth Analytics"
        description="Activation, acquisition, monetization, newsletter signals, and launch operations in one operational view."
        icon={BarChart3}
        iconLabel="Analytics"
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        {data.rangeOptions.map((option) => (
          <Button
            key={option.value}
            asChild
            variant={(search.range ?? "30d") === option.value ? "default" : "outline"}
            size="sm"
          >
            <Link to="/dashboard/analytics" search={{ range: option.value }}>
              {option.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

      {data.error ? (
        <div className="mb-8 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning-foreground">
          {data.error}
        </div>
      ) : null}

      {isHydrated ? (
        <Suspense fallback={<AnalyticsDashboardSkeleton />}>
          <LazyAnalyticsCharts data={data} />
        </Suspense>
      ) : (
        <AnalyticsDashboardSkeleton />
      )}
    </DashboardPageContainer>
  );
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <section key={index} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 h-5 w-40 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div key={rowIndex} className="h-12 rounded-lg bg-muted/50" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
