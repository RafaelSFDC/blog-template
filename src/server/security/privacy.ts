import { createServerFn } from "@tanstack/react-start";
import { eq, or } from "drizzle-orm";
import { db } from "#/db/index";
import {
  account,
  comments,
  media,
  newsletterConsents,
  pageViews,
  posts,
  session,
  subscriberEvents,
  subscribers,
  subscriptions,
  user,
} from "#/db/schema";
import { requireSession } from "#/server/auth/session";

async function exportCurrentUserDataImpl() {
  const sessionData = await requireSession();
  const userId = sessionData.user.id;
  const email = sessionData.user.email;

  const [profile, subscriptionRows, postRows, commentRows, subscriber, consents, pageViewRows] =
    await Promise.all([
      db.query.user.findFirst({ where: eq(user.id, userId) }),
      db.query.subscriptions.findMany({ where: eq(subscriptions.userId, userId) }),
      db.query.posts.findMany({ where: eq(posts.authorId, userId) }),
      db.query.comments.findMany({ where: eq(comments.authorId, userId) }),
      db.query.subscribers.findFirst({ where: eq(subscribers.email, email) }),
      db.query.newsletterConsents.findMany({ where: eq(newsletterConsents.email, email) }),
      db.query.pageViews.findMany({
        where: eq(pageViews.visitorId, userId),
      }),
    ]);

  const subscriberEventRows = subscriber
    ? await db.query.subscriberEvents.findMany({
        where: eq(subscriberEvents.subscriberId, subscriber.id),
      })
    : [];

  return {
    exportedAt: new Date().toISOString(),
    profile,
    subscriptions: subscriptionRows,
    posts: postRows,
    comments: commentRows,
    newsletter: {
      subscriber,
      consents,
      events: subscriberEventRows,
    },
    analytics: {
      pageViews: pageViewRows,
    },
  };
}

async function deleteCurrentUserDataImpl() {
  const sessionData = await requireSession();
  const userId = sessionData.user.id;
  const [currentUser, authoredPosts, ownedMedia] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        email: true,
        role: true,
      },
    }),
    db.query.posts.findMany({
      where: eq(posts.authorId, userId),
      columns: {
        id: true,
      },
    }),
    db.query.media.findMany({
      where: eq(media.ownerId, userId),
      columns: {
        id: true,
      },
    }),
  ]);

  if (!currentUser) {
    throw new Error("User not found");
  }

  if (currentUser.role !== "reader") {
    throw new Error("Editorial accounts require admin transfer before deletion.");
  }

  if (authoredPosts.length > 0 || ownedMedia.length > 0) {
    throw new Error("Your account still owns content and must be handled by an administrator.");
  }

  await db.transaction(async (tx: typeof db) => {
    await tx.delete(comments).where(eq(comments.authorId, userId));
    await tx.delete(pageViews).where(eq(pageViews.visitorId, userId));
    await tx.delete(subscriptions).where(eq(subscriptions.userId, userId));

    const subscriber = await tx.query.subscribers.findFirst({
      where: eq(subscribers.email, currentUser.email),
    });

    if (subscriber) {
      await tx.delete(subscriberEvents).where(eq(subscriberEvents.subscriberId, subscriber.id));
      await tx.delete(newsletterConsents).where(
        or(
          eq(newsletterConsents.subscriberId, subscriber.id),
          eq(newsletterConsents.email, currentUser.email),
        ),
      );
      await tx.delete(subscribers).where(eq(subscribers.id, subscriber.id));
    } else {
      await tx.delete(newsletterConsents).where(eq(newsletterConsents.email, currentUser.email));
    }

    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(session).where(eq(session.userId, userId));
    await tx.delete(user).where(eq(user.id, userId));
  });

  return { success: true as const };
}

export const exportCurrentUserData = createServerFn({ method: "GET" }).handler(async () => {
  return exportCurrentUserDataImpl();
});

export const deleteCurrentUserData = createServerFn({ method: "POST" }).handler(async () => {
  return deleteCurrentUserDataImpl();
});
