import type { AnalyticsDashboardData } from "#/server/analytics-dashboard";

function formatValue(value: number, suffix?: string) {
  return `${value}${suffix ?? ""}`;
}

function SectionCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number; suffix?: string }>;
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-black tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3"
          >
            <span className="text-sm font-semibold text-muted-foreground">{item.label}</span>
            <span className="text-lg font-black text-foreground">
              {formatValue(item.value, item.suffix)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FunnelCard({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ label: string; value: number }>;
}) {
  const peak = steps[0]?.value || 1;

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-black tracking-tight text-foreground">{title}</h2>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-muted-foreground">{step.label}</span>
              <span className="font-black text-foreground">{step.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${peak > 0 ? Math.max((step.value / peak) * 100, 4) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  const peak = rows[0]?.count || 1;

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-black tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-muted-foreground">{row.label}</span>
              <span className="font-black text-foreground">{row.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-info"
                style={{
                  width: `${peak > 0 ? Math.max((row.count / peak) * 100, 6) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsCharts({ data }: { data: AnalyticsDashboardData }) {
  if (!data.sections) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Analytics data is unavailable right now. Try again in a moment.
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <SectionCard title="Activation / Onboarding" items={data.sections.activation.cards} />
      <FunnelCard title="Activation Funnel" steps={data.sections.activation.funnel} />
      <BreakdownCard
        title="Where setup is getting stuck"
        rows={data.sections.activation.breakdown}
      />
      <SectionCard title="Acquisition / Marketing" items={data.sections.acquisition.cards} />
      <FunnelCard title="Acquisition Funnel" steps={data.sections.acquisition.funnel} />
      <BreakdownCard
        title="Lumina CTA sources"
        rows={data.sections.acquisition.breakdown}
      />
      {data.sections.acquisition.secondaryBreakdown?.length ? (
        <BreakdownCard
          title="Beta request sources"
          rows={data.sections.acquisition.secondaryBreakdown}
        />
      ) : null}
      <SectionCard title="Monetization" items={data.sections.monetization.cards} />
      <BreakdownCard
        title="Checkout entry sources"
        rows={data.sections.monetization.breakdown}
      />
      {data.sections.monetization.secondaryBreakdown?.length ? (
        <BreakdownCard
          title="Pricing selection sources"
          rows={data.sections.monetization.secondaryBreakdown}
        />
      ) : null}
      <BreakdownCard
        title="Newsletter subscriber sources"
        rows={data.sections.publication.breakdown}
      />
      <FunnelCard title="Monetization Funnel" steps={data.sections.monetization.funnel} />
      <SectionCard title="Newsletter / Publication" items={data.sections.publication.cards} />
      <SectionCard title="Retention / Operations" items={data.sections.operations.cards} />
      {data.sections.operations.breakdown?.length ? (
        <BreakdownCard
          title="Account upgrade prompt sources"
          rows={data.sections.operations.breakdown}
        />
      ) : null}
    </div>
  );
}
