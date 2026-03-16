import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { PostEditorScreen } from "#/components/dashboard/post-editor-screen";
import { normalizePostSubmission } from "#/lib/editorial-form-utils";
import { getPostForEdit, updatePost } from "#/server/post-actions";

export const Route = createFileRoute("/dashboard/posts/$postId/edit")({
  loader: ({ params }) => {
    const id = Number(params.postId);
    if (!Number.isFinite(id)) {
      throw notFound();
    }

    return getPostForEdit({ data: { id } });
  },
  component: EditPostPage,
});

function EditPostPage() {
  const post = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <PostEditorScreen
      title="Edit Post"
      description="Refine the story and keep your publication up to date."
      icon={FileText}
      iconLabel="Editorial Dashboard"
      initialValues={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        ogImage: post.ogImage || "",
        seoNoIndex: post.seoNoIndex || false,
        isPremium: post.isPremium || false,
        teaserMode: post.teaserMode || "excerpt",
        status: post.status as "draft" | "in_review" | "published" | "scheduled" | "archived",
        publishedAt: post.publishedAt
          ? new Date(post.publishedAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        editorOwnerId: post.editorOwnerId || "",
        categoryIds:
          post.postCategories?.map((item: { categoryId: number }) => item.categoryId) ||
          [],
        tagIds: post.postTags?.map((item: { tagId: number }) => item.tagId) || [],
      }}
      storageKey={`post-editor-${post.id}`}
      submitLabel="Save Changes"
      submitErrorMessage="Could not update this post. Check the slug and try again."
      previewOptions={{
        coverImage: post.coverImage,
      }}
      entityId={post.id}
      initialRevisions={post.revisions || []}
      initialWorkflow={post.workflow}
      onSubmit={async (values) => {
        const normalizedPost = normalizePostSubmission(values);
        if (!normalizedPost) {
          toast.error("Add a title or slug so the post URL can be generated.");
          return;
        }

        await updatePost({
          data: {
            id: post.id,
            ...normalizedPost,
          },
        });

        toast.success("Post updated successfully!");
        await navigate({ to: "/dashboard" });
      }}
      onCancel={() => void navigate({ to: "/dashboard" })}
    />
  );
}
