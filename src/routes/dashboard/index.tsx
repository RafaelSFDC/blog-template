import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { posts, user } from '#/db/schema'
import { count, desc } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'
import { FileText, Users, Eye, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'

const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  
  const [postCount] = await db.select({ value: count() }).from(posts)
  const [userCount] = await db.select({ value: count() }).from(user)
  const latestPosts = await db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(5)

  return {
    postCount: postCount.value,
    userCount: userCount.value,
    latestPosts
  }
})

export const Route = createFileRoute('/dashboard/')({
  loader: () => getDashboardStats(),
  component: DashboardOverview,
})

function DashboardOverview() {
  const { postCount, userCount, latestPosts } = Route.useLoaderData()

  const stats = [
    { label: 'Total Posts', value: postCount, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Authors', value: userCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Avg. Reading Time', value: '~5 min', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Performance', value: 'High', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-10">
      <header className="island-shell rounded-3xl p-8 sm:p-10">
        <p className="island-kicker mb-4 text-primary">Overview</p>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">Admin Dashboard</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
          Welcome back. Here is a snapshot of your publication's current performance and status.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="island-shell flex items-center gap-5 rounded-2xl p-6 bg-card border-3 border-border/50 shadow-zine-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <h3 className="display-title text-2xl text-foreground">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="display-title text-2xl uppercase tracking-tight text-foreground">Recent Activity</h2>
            <Button asChild variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-primary">
              <Link to="/dashboard/posts" className="flex items-center gap-2 no-underline">
                View All <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="island-shell divide-y-2 divide-border/10 rounded-3xl bg-card border-3 border-border/50 overflow-hidden">
            {latestPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors group">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{post.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Updated {new Date(post.updatedAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className={post.publishedAt ? "text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-2 py-1 rounded-md" : "text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md"}>
                     {post.publishedAt ? 'Live' : 'Draft'}
                   </span>
                   <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <Link to="/dashboard/posts/$postId/edit" params={{ postId: String(post.id) }} className="no-underline text-muted-foreground hover:text-primary">
                        <Pencil size={14} />
                      </Link>
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
           <h2 className="display-title text-2xl uppercase tracking-tight text-foreground px-2">Quick Actions</h2>
           <div className="grid gap-4">
              <Link to="/dashboard/posts/new" className="island-shell group flex items-center justify-between rounded-2xl bg-primary p-6 text-primary-foreground no-underline shadow-zine-sm transition-all hover:scale-[1.02] active:scale-95">
                 <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                       <Plus size={20} strokeWidth={3} />
                    </div>
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest opacity-80">Content</p>
                       <h3 className="display-title text-xl">New Story</h3>
                    </div>
                 </div>
                 <ArrowRight size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link to="/dashboard/settings" className="island-shell group flex items-center justify-between rounded-2xl bg-card border-3 border-border/50 p-6 text-foreground no-underline transition-all hover:border-primary/50 hover:bg-muted/50">
                 <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                       <Settings size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">General</p>
                       <h3 className="display-title text-xl">Blog Settings</h3>
                    </div>
                 </div>
                 <ArrowRight size={20} className="text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
              </Link>
           </div>
        </section>
      </div>
    </div>
  )
}

import { Pencil, Settings } from 'lucide-react'
