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
import { DashboardSection } from "#/components/dashboard/DashboardSection";
import { QuickAction } from "#/components/dashboard/QuickAction";

function DashboardOverview() {
  const { postCount, unreadMessages, totalViews, latestPosts, popularPosts } =
    Route.useLoaderData();

  const stats = [
    {
      label: "Total Posts",
      value: postCount,
      icon: FileText,
    },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: Mail,
    },
    {
      label: "Total Post Views",
      value: totalViews,
      icon: Eye,
    },
    {
      label: "Platform Status",
      value: "High",
      icon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      to: "/dashboard/posts/new",
      label: "Content",
      title: "New Story",
      icon: Plus,
      variant: "primary" as const,
    },
    {
      to: "/dashboard/messages",
      label: "Inbox",
      title: "Messages",
      icon: Inbox,
      badge: unreadMessages,
    },
    {
      to: "/dashboard/settings",
      label: "General",
      title: "Settings",
      icon: Settings,
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
          />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <DashboardSection
          title="Recent Activity"
          className="lg:col-span-2"
          action={
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
          }
        >
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
        </DashboardSection>

        <div className="space-y-8">
          <DashboardSection title="Popular Posts">
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
          </DashboardSection>

          <DashboardSection title="Quick Actions">
            <div className="grid gap-4">
              {quickActions.map((action) => (
                <QuickAction key={action.to} {...action} />
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>
    </DashboardPageContainer>
  );
}
