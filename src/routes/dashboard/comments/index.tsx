import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Check, X, MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { StatusBadge } from "#/components/ui/status-badge";
import { DeleteButton } from "#/components/dashboard/DeleteButton";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import {
  bulkModerateDashboardComments,
  deleteDashboardComment,
  getDashboardComments,
  updateDashboardCommentStatus,
} from "#/server/actions/dashboard/comments";

export const Route = createFileRoute("/dashboard/comments/")({
  loader: () => getDashboardComments(),
  component: CommentsPage,
});

type CommentRow = Awaited<ReturnType<typeof getDashboardComments>>[number];
type CommentBulkAction = "approve" | "spam" | "pending" | "delete";

function CommentsPage() {
  const initialComments = Route.useLoaderData();
  const [commentsList, setCommentsList] = useState<CommentRow[]>(initialComments);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<CommentBulkAction>("approve");

  const handleStatus = useCallback(async (
    id: number,
    status: "approved" | "spam" | "pending",
  ) => {
    await updateDashboardCommentStatus({ data: { id, status } });
    setCommentsList((current: CommentRow[]) =>
      current.map((comment: CommentRow) =>
        comment.id === id ? { ...comment, status } : comment,
      ),
    );
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await deleteDashboardComment({ data: id });
    setCommentsList((current: CommentRow[]) =>
      current.filter((comment: CommentRow) => comment.id !== id),
    );
  }, []);

  const handleBulkAction = useCallback(async () => {
    if (selectedIds.length === 0) {
      return;
    }

    await bulkModerateDashboardComments({
      data: {
        ids: selectedIds,
        action: bulkAction,
      },
    });

    if (bulkAction === "delete") {
      setCommentsList((current) =>
        current.filter((comment: CommentRow) => !selectedIds.includes(comment.id)),
      );
    } else {
      const nextStatus =
        bulkAction === "approve"
          ? "approved"
          : bulkAction === "spam"
            ? "spam"
            : "pending";
      setCommentsList((current) =>
        current.map((comment: CommentRow) =>
          selectedIds.includes(comment.id) ? { ...comment, status: nextStatus } : comment,
        ),
      );
    }

    setSelectedIds([]);
  }, [bulkAction, selectedIds]);

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Comments"
        description="Moderate discussions and manage feedback across your publication."
        icon={MessageSquare}
        iconLabel="Community Management"
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[auto,1fr,auto]">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={commentsList.length > 0 && selectedIds.length === commentsList.length}
            onCheckedChange={(checked) =>
              setSelectedIds(checked === true ? commentsList.map((comment) => comment.id) : [])
            }
          />
          <span className="text-sm font-medium">Select all</span>
        </label>
        <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as CommentBulkAction)}>
          <SelectTrigger>
            <SelectValue placeholder="Bulk action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="spam">Mark as spam</SelectItem>
            <SelectItem value="pending">Move to pending</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={() => void handleBulkAction()}>
          Run Bulk Action
        </Button>
      </div>

      <div className="grid gap-6">
        {commentsList.length > 0 ? (
          commentsList.map((comment: CommentRow) => (
            <div
              key={comment.id}
              className="bg-card border shadow-sm rounded-xl p-6 border-border/10 hover:border-border transition-colors group"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-3">
                  <Checkbox
                    checked={selectedIds.includes(comment.id)}
                    onCheckedChange={(checked) =>
                      setSelectedIds((current) =>
                        checked === true
                          ? [...current, comment.id]
                          : current.filter((id) => id !== comment.id),
                      )
                    }
                  />
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

