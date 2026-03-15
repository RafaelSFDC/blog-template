import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { comments, posts } from "#/db/schema";
import { eq, desc } from "drizzle-orm";
import { Check, X, MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { requireCommentModerationAccess } from "#/lib/editorial-access";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { StatusBadge } from "#/components/ui/status-badge";
import { DeleteButton } from "#/components/dashboard/DeleteButton";
import { Button } from "#/components/ui/button";
import { commentStatusUpdateSchema, recordIdSchema } from "#/lib/cms-schema";

const getComments = createServerFn({ method: "GET" }).handler(async () => {
  await requireCommentModerationAccess();
  return await db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      postTitle: posts.title,
      postId: posts.id,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt));
});

const updateCommentStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => commentStatusUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    await requireCommentModerationAccess();
    await db
      .update(comments)
      .set({ status: data.status })
      .where(eq(comments.id, data.id));
    return { success: true };
  });

const deleteComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordIdSchema.parse({ id: input }))
  .handler(async ({ data }) => {
    await requireCommentModerationAccess();
    await db.delete(comments).where(eq(comments.id, data.id));
    return { success: true };
  });

export const Route = createFileRoute("/dashboard/comments/")({
  loader: () => getComments(),
  component: CommentsPage,
});

type CommentRow = Awaited<ReturnType<typeof getComments>>[number];

function CommentsPage() {
  const initialComments = Route.useLoaderData();
  const [commentsList, setCommentsList] = useState<CommentRow[]>(initialComments);

  const handleStatus = useCallback(async (
    id: number,
    status: "approved" | "spam" | "pending",
  ) => {
    await updateCommentStatus({ data: { id, status } });
    setCommentsList((current: CommentRow[]) =>
      current.map((comment: CommentRow) =>
        comment.id === id ? { ...comment, status } : comment,
      ),
    );
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await deleteComment({ data: id });
    setCommentsList((current: CommentRow[]) =>
      current.filter((comment: CommentRow) => comment.id !== id),
    );
  }, []);

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Comments"
        description="Moderate discussions and manage feedback across your publication."
        icon={MessageSquare}
        iconLabel="Community Management"
      />

      <div className="grid gap-6">
        {commentsList.length > 0 ? (
          commentsList.map((comment: CommentRow) => (
            <div
              key={comment.id}
              className="bg-card border shadow-sm rounded-xl p-6 border-border/10 hover:border-border transition-colors group"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground uppercase tracking-wider text-sm">
                      {comment.authorName}
                    </span>
                    <StatusBadge
                      variant={
                        comment.status === "approved"
                          ? "success"
                          : comment.status === "spam"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {comment.status.charAt(0).toUpperCase() +
                        comment.status.slice(1)}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    on{" "}
                    <span className="text-primary italic">
                      &quot;{comment.postTitle}&quot;
                    </span>{" "}
                    •{" "}
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className="text-foreground leading-relaxed mt-3 border-l-3 border-primary/20 pl-4 py-1 italic">
                    &quot;{comment.content}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                  {comment.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatus(comment.id, "approved")}
                      title="Approve"
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {comment.status !== "spam" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatus(comment.id, "spam")}
                      title="Mark as Spam"
                    >
                      <X size={16} />
                    </Button>
                  )}
                  <DeleteButton
                    onConfirm={() => handleDelete(comment.id)}
                    title="Delete Comment?"
                    description="This will permanently delete the comment. This action cannot be undone."
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="When readers participate, their thoughts will appear here."
          />
        )}
      </div>
    </DashboardPageContainer>
  );
}
