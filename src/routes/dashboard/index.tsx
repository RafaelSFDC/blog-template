import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { QuickAction } from "#/components/dashboard/QuickAction";
import { DashboardSection } from "#/components/dashboard/DashboardSection";
import { Button } from "#/components/ui/button";
import { StatCard } from "#/components/ui/stat-card";
import { StatusBadge } from "#/components/ui/status-badge";
import { db } from "#/db/index";
import { posts, contactMessages, newsletters, subscribers } from "#/db/schema";
import { requireDashboardAccess } from "#/lib/admin-auth";
import { count, desc, eq, sql } from "drizzle-orm";
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
import { getEditorialStatusCopy } from "#/lib/editorial-workflow";

type PostRow = typeof posts.$inferSelect;

const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireDashboardAccess();
    const isAuthor = session.user.role === "author";
    const canReadMessages =
      session.user.role === "admin" ||
      session.user.role === "super-admin" ||
      session.user.role === "editor";

    const [
      [postCount],
      [unreadMessages],
      [totalViews],
      [activeSubscribers],
      [sentCampaigns],
      latestPosts,
      popularPosts,
    ] = await Promise.all([
      isAuthor
        ? db.select({ value: count() }).from(posts).where(eq(posts.authorId, session.user.id))
        : db.select({ value: count() }).from(posts),
      canReadMessages
        ? db
            .select({ value: count() })
            .from(contactMessages)
            .where(eq(contactMessages.status, "new"))
        : Promise.resolve([{ value: 0 }]),
      isAuthor
        ? db
            .select({ value: sql<number>`sum(${posts.viewCount})` })
            .from(posts)
            .where(eq(posts.authorId, session.user.id))
        : db
            .select({ value: sql<number>`sum(${posts.viewCount})` })
            .from(posts),
      db
        .select({ value: count() })
        .from(subscribers)
        .where(eq(subscribers.status, "active")),
      db
        .select({ value: count() })
        .from(newsletters)
        .where(eq(newsletters.status, "sent")),
      isAuthor
        ? db
            .select()
            .from(posts)
            .where(eq(posts.authorId, session.user.id))
            .orderBy(desc(posts.updatedAt))
            .limit(5)
        : db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(5),
      isAuthor
        ? db
            .select()
            .from(posts)
            .where(eq(posts.authorId, session.user.id))
            .orderBy(desc(posts.viewCount))
            .limit(5)
        : db.select().from(posts).orderBy(desc(posts.viewCount)).limit(5),
    ]);

    return {
      postCount: postCount.value || 0,
      unreadMessages: unreadMessages.value || 0,
      totalViews: Number(totalViews.value) || 0,
      activeSubscribers: activeSubscribers.value || 0,
      sentCampaigns: sentCampaigns.value || 0,
      latestPosts,
      popularPosts,
    };
  },
);

export const Route = createFileRoute("/dashboard/")({
  loader: () => getDashboardStats(),
  component: DashboardOverview,
});

function DashboardOverview() {
  const {
    postCount,
    unreadMessages,
    totalViews,
    activeSubscribers,
    sentCampaigns,
    latestPosts,
    popularPosts,
  } =
    Route.useLoaderData() as {
      postCount: number;
      unreadMessages: number;
      totalViews: number;
      activeSubscribers: number;
      sentCampaigns: number;
      latestPosts: PostRow[];
      popularPosts: PostRow[];
    };

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
      label: "Active Subscribers",
      value: activeSubscribers,
      icon: Mail,
    },
    {
      label: "Sent Campaigns",
      value: sentCampaigns,
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
              className="font-semibold  tracking-wider text-muted-foreground hover:text-primary"
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
          <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-md overflow-hidden">
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
                      post.updatedAt || post.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    variant={post.status === "published" ? "success" : post.status === "in_review" ? "warning" : "default"}
                  >
                    {getEditorialStatusCopy(post.status)}
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
            <div className="bg-card border shadow-sm divide-y divide-border/10 rounded-md overflow-hidden">
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
