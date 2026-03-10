import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts, contactMessages } from "#/db/schema";
import { count, desc, sql, eq } from "drizzle-orm";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  FileText,
  Eye,
  TrendingUp,
  Plus,
  ArrowRight,
  Mail,
  Settings,
  Pencil,
  Inbox,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { StatCard } from "#/components/ui/stat-card";
import { StatusBadge } from "#/components/ui/status-badge";

type PostRow = typeof posts.$inferSelect;

const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdminSession();

    const [postCount] = await db.select({ value: count() }).from(posts);
    const [unreadMessages] = await db
      .select({ value: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, "new"));
    const [totalViews] = await db
      .select({ value: sql<number>`sum(${posts.viewCount})` })
      .from(posts);

    const latestPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.updatedAt))
      .limit(5);
    const popularPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.viewCount))
      .limit(5);

    return {
      postCount: postCount.value,
      unreadMessages: unreadMessages.value,
      totalViews: totalViews.value || 0,
      latestPosts,
      popularPosts,
    };
  },
);

export const Route = createFileRoute("/dashboard/")({
  loader: () => getDashboardStats(),
  component: DashboardOverview,
});

import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";

function DashboardOverview() {
  const { postCount, unreadMessages, totalViews, latestPosts, popularPosts } =
    Route.useLoaderData();

  const stats = [
    {
      label: "Total Posts",
      value: postCount,
      icon: FileText,
      iconClassName: "bg-info/10 text-info",
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: Mail,
      iconClassName: "bg-destructive/10 text-destructive",
    },
    {
      label: "Total Post Views",
      value: totalViews,
      icon: Eye,
      iconClassName: "bg-warning/10 text-warning-foreground",
    },
    {
      label: "Platform Status",
      value: "High",
      icon: TrendingUp,
      iconClassName: "bg-success/10 text-success",
    },
  ];

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Editorial Dashboard"
        description="Welcome back. Here is a snapshot of your publication's current performance and status."
        icon={TrendingUp}
        iconLabel="Overview"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="display-title text-2xl uppercase tracking-tight text-foreground">
              Recent Activity
            </h2>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
            >
              <Link
                to="/dashboard/posts"
                className="flex items-center gap-2 no-underline"
              >
                View All <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-xl overflow-hidden">
            {latestPosts.map((post: PostRow) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 font-bold">
                    Updated{" "}
                    {new Date(
                      post.updatedAt || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    variant={post.publishedAt ? "success" : "warning"}
                  >
                    {post.publishedAt ? "Live" : "Draft"}
                  </StatusBadge>
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      to="/dashboard/posts/$postId/edit"
                      params={{ postId: String(post.id) }}
                      className="no-underline text-muted-foreground hover:text-primary"
                    >
                      <Pencil size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="display-title text-2xl uppercase tracking-tight text-foreground px-2">
            Popular Posts
          </h2>
          <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-xl overflow-hidden">
            {popularPosts.map((post: PostRow) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 group"
              >
                <div className="min-w-0 pr-4 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {post.title}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {post.viewCount} views
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
              </div>
            ))}
          </div>

          <h2 className="display-title text-2xl uppercase tracking-tight text-foreground px-2 pt-4">
            Quick Actions
          </h2>
          <div className="grid gap-4">
            <Link
              to="/dashboard/posts/new"
              className="group flex items-center justify-between rounded-xl bg-primary p-6 text-primary-foreground no-underline shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">
                    Content
                  </p>
                  <h3 className="display-title text-xl">New Story</h3>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </Link>

            <Link
              to="/dashboard/messages"
              className="bg-card border shadow-sm group flex items-center justify-between rounded-xl border-border/50 p-6 text-foreground no-underline transition-all hover:border-rose-500/50 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
                  <Inbox size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Inbox
                  </p>
                  <h3 className="display-title text-xl">Messages</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadMessages > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground shadow-sm">
                    {unreadMessages}
                  </span>
                )}
                <ArrowRight
                  size={20}
                  className="text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>

            <Link
              to="/dashboard/settings"
              className="bg-card border shadow-sm group flex items-center justify-between rounded-xl border-border/50 p-6 text-foreground no-underline transition-all hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Settings size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    General
                  </p>
                  <h3 className="display-title text-xl text-primary">
                    Settings
                  </h3>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
        </section>
      </div>
    </DashboardPageContainer>
  );
}
