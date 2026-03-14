import { createServerFn } from "@tanstack/react-start";
import { and, eq, lte, ne } from "drizzle-orm";
import { notFound } from "@tanstack/react-router";
import { db } from "#/db/index";
import { postCategories, posts, postTags } from "#/db/schema";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  getFriendlyDbError,
  postServerSchema,
  normalizeSlug,
} from "#/lib/cms-schema";
import { triggerWebhook } from "#/lib/webhooks";
import {
  getSlugConflictMessage,
  hasConflictingSlug,
  resolvePostPublishedAt,
  shouldTriggerPublishedWebhook,
} from "#/server/post-domain";

async function assertPostSlugAvailable(slug: string, currentPostId?: number) {
  const existing = await db.query.posts.findFirst({
    where:
      currentPostId === undefined
        ? eq(posts.slug, slug)
        : and(eq(posts.slug, slug), ne(posts.id, currentPostId)),
    columns: {
      id: true,
    },
  });

  if (hasConflictingSlug(existing?.id, currentPostId)) {
    throw new Error(getSlugConflictMessage("Post"));
  }
}

export const getPostForEdit = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession();

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
      with: {
        postCategories: true,
        postTags: true,
      },
    });

    if (!post) {
      throw notFound();
    }

    return post;
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postServerSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireAdminSession();
    const slug = normalizeSlug(data.slug, data.title);

    if (!slug) {
      throw new Error("Post slug could not be generated");
    }

    const publishedAt = resolvePostPublishedAt(data.status, data.publishedAt);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await db.transaction(async (tx: any) => {
        const [inserted] = await tx
          .insert(posts)
          .values({
            title: data.title,
            slug,
            excerpt: data.excerpt,
            content: data.content,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogImage: data.ogImage,
            authorId: session.user.id,
            isPremium: data.isPremium,
            status: data.status,
            publishedAt,
            updatedAt: new Date(),
          })
          .returning({ id: posts.id });

        await tx.delete(postCategories).where(eq(postCategories.postId, inserted.id));
        if (data.categoryIds.length > 0) {
          await tx
            .insert(postCategories)
            .values(data.categoryIds.map((categoryId) => ({ postId: inserted.id, categoryId })));
        }

        await tx.delete(postTags).where(eq(postTags.postId, inserted.id));
        if (data.tagIds.length > 0) {
          await tx
            .insert(postTags)
            .values(data.tagIds.map((tagId) => ({ postId: inserted.id, tagId })));
        }

        return inserted;
      });

      if (shouldTriggerPublishedWebhook(undefined, data.status)) {
        try {
          await triggerWebhook("post.published", {
            id: created.id,
            title: data.title,
            slug,
            excerpt: data.excerpt,
          });
        } catch (error) {
          console.error("Post created, but webhook delivery failed:", error);
        }
      }

      return created;
    } catch (error) {
      throw new Error(
        getFriendlyDbError(error, "Post") ||
          (error instanceof Error ? error.message : "Could not create post"),
      );
    }
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    postServerSchema.safeExtend({ id: postServerSchema.shape.id.unwrap() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();

    const existingPost = await db.query.posts.findFirst({
      where: eq(posts.id, data.id),
      columns: {
        id: true,
        status: true,
        publishedAt: true,
      },
    });

    if (!existingPost) {
      throw notFound();
    }

    const slug = normalizeSlug(data.slug, data.title);
    if (!slug) {
      throw new Error("Post slug could not be generated");
    }

    const publishedAt = resolvePostPublishedAt(
      data.status,
      data.publishedAt,
      existingPost.publishedAt,
    );

    try {
      await assertPostSlugAvailable(slug, data.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.transaction(async (tx: any) => {
        await tx
          .update(posts)
          .set({
            title: data.title,
            slug,
            excerpt: data.excerpt,
            content: data.content,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogImage: data.ogImage,
            isPremium: data.isPremium,
            status: data.status,
            publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, data.id));

        await tx.delete(postCategories).where(eq(postCategories.postId, data.id));
        if (data.categoryIds.length > 0) {
          await tx
            .insert(postCategories)
            .values(data.categoryIds.map((categoryId) => ({ postId: data.id, categoryId })));
        }

        await tx.delete(postTags).where(eq(postTags.postId, data.id));
        if (data.tagIds.length > 0) {
          await tx
            .insert(postTags)
            .values(data.tagIds.map((tagId) => ({ postId: data.id, tagId })));
        }
      });

      if (shouldTriggerPublishedWebhook(existingPost.status as never, data.status)) {
        try {
          await triggerWebhook("post.published", {
            id: data.id,
            title: data.title,
            slug,
            excerpt: data.excerpt,
          });
        } catch (error) {
          console.error("Post updated, but webhook delivery failed:", error);
        }
      }

      return { ok: true as const };
    } catch (error) {
      throw new Error(
        getFriendlyDbError(error, "Post") ||
          (error instanceof Error ? error.message : "Could not update post"),
      );
    }
  });

export async function publishScheduledPosts(now = new Date()) {
  const duePosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
    })
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.publishedAt, now)));

  if (duePosts.length === 0) {
    return { count: 0, publishedIds: [] as number[] };
  }

  const publishedIds: number[] = [];

  for (const post of duePosts) {
    await db
      .update(posts)
      .set({
        status: "published",
        updatedAt: now,
      })
      .where(eq(posts.id, post.id));

    await triggerWebhook("post.published", {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
    });

    publishedIds.push(post.id);
  }

  return { count: publishedIds.length, publishedIds };
}
