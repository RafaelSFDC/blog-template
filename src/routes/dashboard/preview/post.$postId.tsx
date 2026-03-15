import { createFileRoute, notFound } from "@tanstack/react-router";
import { PostEditorialPreview } from "#/components/dashboard/editorial-preview";
import { buildPostPreviewDraft } from "#/lib/editorial-preview";
import { getPostPreviewData } from "#/server/post-actions";

export const Route = createFileRoute("/dashboard/preview/post/$postId")({
  loader: async ({ params }) => {
    const postId = Number(params.postId);
    if (!Number.isFinite(postId)) {
      throw notFound();
    }

    return getPostPreviewData({ data: { postId } });
  },
  component: PostPreviewPage,
});

function PostPreviewPage() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <PostEditorialPreview
        draft={buildPostPreviewDraft(data, {
          categories: data.categories,
          tags: data.tags,
          authorName: data.authorName,
          coverImage: data.coverImage,
        })}
      />
    </div>
  );
}
