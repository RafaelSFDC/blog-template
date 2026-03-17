import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { SetupIncompleteNotice } from "#/components/dashboard/setup-incomplete-notice";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { StatusBadge } from "#/components/ui/status-badge";
import { authClient } from "#/lib/auth-client";
import { getEditorialStatusCopy, getEditorialStatusTone } from "#/lib/editorial-workflow";
import { bulkUpdatePosts, deletePost, getDashboardPosts } from "#/server/actions/post-actions";
import { getSetupStatusForDashboard } from "#/server/actions/setup-actions";
import type { SetupStatus } from "#/types/system";

type DashboardPost = Awaited<ReturnType<typeof getDashboardPosts>>[number];
type DashboardPostStatusFilter =
  | "all"
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived";
type DashboardPostVisibilityFilter = "all" | "mine" | "team";
type DashboardPostBulkAction =
  | "request_review"
  | "move_to_draft"
  | "publish"
  | "schedule"
  | "archive"
  | "delete";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export const Route = createFileRoute("/dashboard/posts/")({
  loader: async () => {
    const [posts, setup] = await Promise.all([
      getDashboardPosts({ data: {} }),
      getSetupStatusForDashboard(),
    ]);
    return { posts, setup };
  },
  component: PostsManagementPage,
});

function PostsManagementPage() {
  const { posts: initialPosts, setup } = Route.useLoaderData() as {
    posts: DashboardPost[];
    setup: SetupStatus | null;
  };
  const { data: session } = authClient.useSession();
  const [postList, setPostList] = useState<DashboardPost[]>(initialPosts);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DashboardPostStatusFilter>("all");
  const [visibility, setVisibility] = useState<DashboardPostVisibilityFilter>(
    session?.user.role === "author" ? "mine" : "all",
  );
  const [bulkAction, setBulkAction] = useState<DashboardPostBulkAction>("request_review");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);

  const authorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of postList) {
      if (post.authorId && post.authorName) {
        seen.set(post.authorId, post.authorName);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [postList]);

  async function refresh(filters?: {
    query?: string;
    status?: DashboardPostStatusFilter;
    visibility?: DashboardPostVisibilityFilter;
  }) {
    setLoading(true);
    try {
      const next = await getDashboardPosts({
        data: {
          query: filters?.query ?? (query || undefined),
          status: filters?.status && filters.status !== "all" ? filters.status : undefined,
          visibility:
            filters?.visibility && filters.visibility !== "all"
              ? filters.visibility
              : undefined,
        },
      });
      setPostList(next);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this post? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await deletePost({ data: { id } });
      toast.success("Post deleted successfully");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the post");
    }
  }

  async function handleBulkAction() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one post");
      return;
    }

    try {
      await bulkUpdatePosts({
        data: {
          ids: selectedIds,
          action: bulkAction,
          scheduledFor: bulkAction === "schedule" && scheduledFor ? new Date(scheduledFor) : undefined,
        },
      });
      toast.success("Bulk action applied");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run bulk action");
    }
  }

  function toggleSelected(id: number, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((currentId) => currentId !== id),
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? postList.map((post) => post.id) : []);
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Editorial Queue"
        description="Filter the newsroom, review drafts, and run operational actions across posts."
        icon={FileText}
        iconLabel="Content Library"
      >
        <Button asChild variant="default" size="default">
          <Link
            to="/dashboard/posts/new"
            className="flex items-center gap-2 no-underline"
          >
            <Plus size={20} strokeWidth={3} />
            New Post
          </Link>
        </Button>
      </DashboardHeader>

      <SetupIncompleteNotice setup={setup} area="posts" />

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr,0.8fr,0.8fr,auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Search by title, slug, or author"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as DashboardPostStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {session?.user.role !== "author" ? (
          <Select
            value={visibility}
            onValueChange={(value) => setVisibility(value as DashboardPostVisibilityFilter)}
          >
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All posts</SelectItem>
                <SelectItem value="mine">Mine</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}
          <Button type="button" onClick={() => void refresh({ query, status, visibility })} disabled={loading}>
            {loading ? "Filtering..." : "Apply"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[auto,1fr,auto]">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Checkbox
              checked={postList.length > 0 && selectedIds.length === postList.length}
              onCheckedChange={(checked) => toggleSelectAll(checked === true)}
            />
            <span className="text-sm font-medium">Select all</span>
          </label>
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr,auto,auto]">
            <Select
              value={bulkAction}
              onValueChange={(value) => setBulkAction(value as DashboardPostBulkAction)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="request_review">Submit for review</SelectItem>
                <SelectItem value="move_to_draft">Move to draft</SelectItem>
                <SelectItem value="publish">Publish</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            {bulkAction === "schedule" ? (
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
              />
            ) : null}
            <Button type="button" variant="outline" onClick={() => void handleBulkAction()}>
              Run Bulk Action
            </Button>
          </div>
        </div>

        {authorOptions.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Authors in queue: {authorOptions.map((author) => author.name).join(", ")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4">
        {postList.length > 0 ? (
          postList.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex min-w-0 flex-1 gap-4">
                  <Checkbox
                    checked={selectedIds.includes(post.id)}
                    onCheckedChange={(checked) => toggleSelected(post.id, checked === true)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge variant={getEditorialStatusTone(post.status)}>
                        {getEditorialStatusCopy(post.status)}
                      </StatusBadge>
                      {post.reviewRequestedAt ? (
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                          Review requested {dateFormatter.format(new Date(post.reviewRequestedAt))}
                        </span>
                      ) : null}
                      {post.scheduledAt ? (
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                          Scheduled {dateFormatter.format(new Date(post.scheduledAt))}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="wrap-break-word text-2xl font-black text-foreground line-clamp-1">
                      {post.title}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">/{post.slug}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{post.authorName || "Editorial Team"}</span>
                      {post.editorOwnerName ? <span>Editor: {post.editorOwnerName}</span> : null}
                      <span>
                        Updated {dateFormatter.format(new Date(post.updatedAt || Date.now()))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="flex items-center gap-2 no-underline"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/dashboard/posts/$postId/edit"
                      params={{ postId: String(post.id) }}
                      className="flex items-center gap-2 no-underline"
                    >
                      <Pencil size={16} />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete(post.id)}
                  >
                    <Trash2 size={16} />
                    <span className="ml-2 hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={FileText}
            title="No stories found"
            description="Try adjusting the editorial filters or create a new story."
            action={
              <Button asChild variant="default">
                <Link to="/dashboard/posts/new">Create New Post</Link>
              </Button>
            }
          />
        )}
      </div>
    </DashboardPageContainer>
  );
}

