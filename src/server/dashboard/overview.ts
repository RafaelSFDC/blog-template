import { createServerFn } from "@tanstack/react-start";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { contactMessages, newsletters, posts, subscribers } from "#/db/schema";
import { requireDashboardAccess } from "#/lib/admin-auth";

export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
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
        : db.select({ value: sql<number>`sum(${posts.viewCount})` }).from(posts),
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
