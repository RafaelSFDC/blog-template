import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { eq } from "drizzle-orm";
import { publicCommentSchema } from "#/schemas/editorial";

export type CreatePendingCommentInput = Parameters<typeof publicCommentSchema.parse>[0];

export async function createPendingComment(input: CreatePendingCommentInput) {
  const data = publicCommentSchema.parse(input);

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, data.postId),
    columns: {
      id: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const [created] = await db
    .insert(comments)
    .values({
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      content: data.content,
      status: "pending",
    })
    .returning();

  return created;
}
