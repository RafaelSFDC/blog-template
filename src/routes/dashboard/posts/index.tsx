import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useState } from "react";
import { useRouter, useLoaderData } from "@tanstack/react-router";
import { FileText, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { deletePost, getDashboardPosts } from "#/server/post-actions";

type DashboardPost = Awaited<ReturnType<typeof getDashboardPosts>>[number];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export const Route = createFileRoute("/dashboard/posts/")({
  loader: () => getDashboardPosts(),
  component: PostsManagementPage,
});

import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";

function PostsManagementPage() {
  const postList = useLoaderData({ from: "/dashboard/posts/" }) as DashboardPost[];
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Delete this post? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePost({ data: { id } });
      await router.invalidate();
      toast.success("Post deleted successfully");
    } catch {
      toast.error("Could not delete the post. Try again in a few seconds.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Manage Posts"
        description="Create drafts, edit published articles, and maintain your blog archive."
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

      <div className="grid gap-4">
        {postList.length > 0 ? (
          postList.map((post: DashboardPost) => (
            <article
              key={post.id}
              className="bg-card border shadow-sm hover:border-primary/30 transition-all group overflow-hidden rounded-xl p-5 sm:p-6 border-border/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={
                        post.publishedAt
                          ? "rounded-md bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border border-green-500/20"
                          : "rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-500/20"
                      }
                    >
                      {post.publishedAt ? "Published" : "Draft"}
                    </span>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    {post.publishedAt
                      ? dateFormatter.format(new Date(post.publishedAt))
                      : "Last updated " +
                          dateFormatter.format(
                            new Date(post.updatedAt || Date.now()),
                          )}
                    </p>
                    {post.authorName ? (
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                        {post.authorName}
                      </p>
                    ) : null}
                  </div>
                  <h2 className="display-title wrap-break-word text-2xl text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {post.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    /{post.slug}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-10 border hover:border-primary hover:text-primary transition-all"
                  >
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="no-underline flex items-center gap-2"
                    >
                      <Eye size={16} />
                      <span className="hidden sm:inline">View</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-10 border hover:border-primary hover:text-primary transition-all"
                  >
                    <Link
                      to="/dashboard/posts/$postId/edit"
                      params={{ postId: String(post.id) }}
                      className="no-underline flex items-center gap-2"
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
                    disabled={deletingId === post.id}
                    className="rounded-lg h-10 bg-destructive/5 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                    <span className="ml-2 hidden sm:inline">
                      {deletingId === post.id ? "Deleting…" : "Delete"}
                    </span>
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={FileText}
            title="No Stories Shared Yet"
            description="Your content archive is empty. Begin your blog journey by creating your first post."
            action={
              <Button asChild variant="default">
                <Link to="/dashboard/posts/new">Create First Post</Link>
              </Button>
            }
          />
        )}
      </div>
    </DashboardPageContainer>
  );
}
