import {
  Monitor,
  Smartphone,
  Tablet,
  MousePointer2,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--info)",
  "var(--chart-5)",
];

interface StatItem {
  date: string;
  count: number;
}

export interface AnalyticsChartsData {
  totalViews: number;
  viewsPerDay: StatItem[];
  topPages: { pathname: string; count: number }[];
  browsers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
}

function getDeviceIcon(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName === "mobile") return <Smartphone size={14} />;
  if (normalizedName === "tablet") return <Tablet size={14} />;
  return <Monitor size={14} />;
}

export function AnalyticsCharts({ data }: { data: AnalyticsChartsData }) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="display-title flex items-center gap-2 text-xl uppercase tracking-tight text-foreground">
            <TrendingUp className="text-primary" size={20} /> Traffic Over Time
          </h2>
        </div>
        <div className="h-[400px] rounded-xl border bg-card p-6 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.viewsPerDay}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontWeight: 700,
                  fill: "var(--muted-foreground)",
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontWeight: 700,
                  fill: "var(--muted-foreground)",
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "3px solid var(--border)",
                  backgroundColor: "var(--card)",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ fontWeight: 800, color: "var(--primary)" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={4}
                dot={{
                  r: 6,
                  fill: "var(--primary)",
                  strokeWidth: 2,
                  stroke: "var(--card)",
                }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="display-title flex items-center gap-2 px-2 text-xl uppercase tracking-tight text-foreground">
          <Smartphone className="text-primary" size={20} /> Devices
        </h2>
        <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border bg-card p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.devices}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {data.devices.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 w-full space-y-2">
            {data.devices.map((device) => (
              <div
                key={device.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 font-bold">
                  {getDeviceIcon(device.name || "")}
                  <span className="capitalize">{device.name || "Unknown"}</span>
                </div>
                <span className="font-black text-primary">{device.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lg:col-span-2 space-y-6">
        <h2 className="display-title flex items-center gap-2 px-2 text-xl uppercase tracking-tight text-foreground">
          <MousePointer2 className="text-primary" size={20} /> Popular
          Destinations
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="divide-y divide-border/10">
            {data.topPages.map((page, idx) => (
              <div
                key={page.pathname}
                className="group flex items-center justify-between p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 gap-4 pr-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold uppercase tracking-wider text-primary">
                    {idx + 1}
                  </span>
                  <p className="truncate text-sm font-bold text-foreground">
                    {page.pathname}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-foreground">
                      {page.count}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Views
                    </span>
                  </div>
                  <div className="h-8 w-1 select-none overflow-hidden rounded-full bg-primary/20 text-transparent">
                    .
                    <div
                      className="h-full bg-primary"
                      style={{
                        height: `${data.topPages[0]?.count ? (page.count / data.topPages[0].count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="display-title px-2 text-xl uppercase tracking-tight text-foreground">
          Key Browsers
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card p-2 shadow-sm">
          <div className="divide-y divide-border/10">
            {data.browsers.map((browser) => (
              <div
                key={browser.name}
                className="flex items-center justify-between p-4"
              >
                <span className="text-xs font-bold text-foreground">
                  {browser.name || "Unknown"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-info"
                      style={{
                        width: `${data.totalViews > 0 ? (browser.count / data.totalViews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {data.totalViews > 0
                      ? Math.round((browser.count / data.totalViews) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
