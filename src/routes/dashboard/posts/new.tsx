import { usePostHog } from "@posthog/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { PostEditorScreen } from "#/components/dashboard/post-editor-screen";
import { normalizePostSubmission } from "#/lib/editorial-form-utils";
import { createPost } from "#/server/post-actions";

export const Route = createFileRoute("/dashboard/posts/new")({
  component: NewPostPage,
});

function NewPostPage() {
  const navigate = useNavigate();
  const posthog = usePostHog();

  return (
    <PostEditorScreen
      title="Write New Post"
      description="Draft and publish directly from your control panel."
      icon={FileText}
      iconLabel="Editorial Dashboard"
      initialValues={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
        seoNoIndex: false,
        isPremium: false,
        commentsEnabled: true,
        teaserMode: "excerpt",
        status: "draft",
        publishedAt: new Date().toISOString().slice(0, 16),
        editorOwnerId: "",
        categoryIds: [],
        tagIds: [],
      }}
      storageKey="post-editor"
      submitLabel="Create Draft"
      submitErrorMessage="Could not create this post. Check the slug and try again."
      onSubmit={async (values) => {
        const normalizedPost = normalizePostSubmission(values);
        if (!normalizedPost) {
          toast.error("Add a title or slug so the post URL can be generated.");
          return;
        }

        await createPost({
          data: normalizedPost,
        });

        posthog.capture("post_created", {
          title: normalizedPost.title,
          slug: normalizedPost.slug,
          status: normalizedPost.status,
          is_premium: normalizedPost.isPremium,
        });

        toast.success("Post created successfully!");
        await navigate({ to: "/dashboard" });
      }}
      onCancel={() => void navigate({ to: "/dashboard" })}
    />
  );
}
