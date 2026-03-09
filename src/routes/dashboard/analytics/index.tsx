import { createFileRoute } from '@tanstack/react-router'
import { getAnalyticsStats } from '#/server/analytics-actions'
import { DashboardHeader } from '#/components/dashboard/Header'
import { DashboardPageContainer } from '#/components/dashboard/DashboardPageContainer'
import { BarChart3, Users, Eye, ArrowUpRight, Monitor, Smartphone, Tablet, Globe, MousePointer2, TrendingUp } from 'lucide-react'
import { StatCard } from '#/components/ui/stat-card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

export const Route = createFileRoute('/dashboard/analytics/')({
  loader: () => getAnalyticsStats(),
  component: AnalyticsDashboard,
})

const COLORS = [
  'var(--primary)',
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--chart-5)',
];

interface StatItem {
  date: string;
  count: number;
}

interface AnalyticsData {
  totalViews: number;
  totalVisitors: number;
  viewsPerDay: StatItem[];
  topPages: { pathname: string; count: number }[];
  browsers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
}

function AnalyticsDashboard() {
  const data = Route.useLoaderData() as AnalyticsData
  
  const stats = [
    { label: 'Total Views', value: data.totalViews, icon: Eye, iconClassName: 'bg-primary/10 text-primary' },
    { label: 'Unique Visitors', value: data.totalVisitors, icon: Users, iconClassName: 'bg-success/10 text-success' },
    { label: 'Avg. Views/Visitor', value: data.totalVisitors > 0 ? (data.totalViews / data.totalVisitors).toFixed(1) : 0, icon: ArrowUpRight, iconClassName: 'bg-info/10 text-info' },
  ]

  const getDeviceIcon = (name: string) => {
    const n = name?.toLowerCase();
    if (n === 'mobile') return <Smartphone size={14} />;
    if (n === 'tablet') return <Tablet size={14} />;
    return <Monitor size={14} />;
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

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="display-title text-xl uppercase tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} /> Traffic Over Time
            </h2>
          </div>
          <div className="bg-card border shadow-sm rounded-xl p-6 h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.viewsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '3px solid var(--border)', backgroundColor: 'var(--card)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 800, color: 'var(--primary)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="display-title text-xl uppercase tracking-tight text-foreground px-2 flex items-center gap-2">
             <Smartphone className="text-primary" size={20} /> Devices
          </h2>
          <div className="bg-card border shadow-sm rounded-xl p-6 h-[400px] flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.devices}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {data.devices.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" />
                </PieChart>
             </ResponsiveContainer>
             <div className="w-full mt-4 space-y-2">
                {data.devices.map((device) => (
                  <div key={device.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-bold">
                       {getDeviceIcon(device.name || '')}
                       <span className="capitalize">{device.name || 'Unknown'}</span>
                    </div>
                    <span className="font-black text-primary">{device.count}</span>
                  </div>
                ))}
             </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
           <h2 className="display-title text-xl uppercase tracking-tight text-foreground px-2 flex items-center gap-2">
              <MousePointer2 className="text-primary" size={20} /> Popular Destinations
           </h2>
           <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-xl overflow-hidden">
             {data.topPages.map((page, idx: number) => (
               <div key={page.pathname} className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                     <span className="shrink-0 w-6 h-6 rounded bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider flex items-center justify-center">
                        {idx + 1}
                     </span>
                     <p className="font-bold text-sm text-foreground truncate">{page.pathname}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                       <span className="text-sm font-black text-foreground">{page.count}</span>
                       <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Views</span>
                    </div>
                    <div className="h-8 w-1 bg-primary/20 rounded-full overflow-hidden text-transparent select-none">.
                       <div 
                         className="h-full bg-primary" 
                         style={{ height: `${data.topPages[0]?.count ? (page.count / data.topPages[0].count) * 100 : 0}%` }} 
                       />
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </section>

        <section className="space-y-6">
           <h2 className="display-title text-xl uppercase tracking-tight text-foreground px-2 flex items-center gap-2">
              <Globe className="text-primary" size={20} /> Key Browsers
           </h2>
           <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-xl overflow-hidden p-2">
              {data.browsers.map((browser) => (
                <div key={browser.name} className="flex items-center justify-between p-4">
                   <span className="font-bold text-xs text-foreground">{browser.name || 'Unknown'}</span>
                   <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div                           className="h-full bg-info" 
                          style={{ width: `${data.totalViews > 0 ? (browser.count / data.totalViews) * 100 : 0}%` }}
                        />
                      </div>
                       <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8 text-right">
                        {data.totalViews > 0 ? Math.round((browser.count / data.totalViews) * 100) : 0}%
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </DashboardPageContainer>
  )
}
