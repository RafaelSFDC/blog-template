import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { toast } from "sonner";
import { PageEditorScreen } from "#/components/dashboard/page-editor-screen";
import { normalizePageSubmission } from "#/lib/editorial-form-utils";
import { isPuckPageContent } from "#/lib/puck";
import { getPageById, updatePage } from "#/server/page-actions";

export const Route = createFileRoute("/dashboard/pages/$pageId/edit")({
  loader: async ({ params }) => {
    const id = Number(params.pageId);
    if (!Number.isFinite(id)) {
      throw notFound();
    }

    const page = await getPageById({ data: id });
    if (!page) {
      throw notFound();
    }

    return page;
  },
  component: EditPagePage,
});

function EditPagePage() {
  const page = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <PageEditorScreen
      title="Edit Page"
      description="Update a static page in your publication."
      icon={Library}
      iconLabel="Static Content"
      initialValues={{
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt || "",
        content: page.content,
        metaTitle: page.metaTitle || "",
        metaDescription: page.metaDescription || "",
        ogImage: page.ogImage || "",
        seoNoIndex: page.seoNoIndex || false,
        isPremium: page.isPremium || false,
        teaserMode: page.teaserMode || "excerpt",
        status: page.status as "draft" | "published" | "private",
        isHome: page.isHome || false,
        useVisualBuilder: isPuckPageContent(page.content),
      }}
      storageKey={`page-editor-${page.id}`}
      submitLabel="Save Changes"
      submitErrorMessage="Could not update page"
      entityId={page.id}
      initialRevisions={page.revisions || []}
      onSubmit={async (values) => {
        await updatePage({
          data: {
            id: page.id,
            ...normalizePageSubmission(values),
          },
        });
        toast.success("Page updated successfully");
        await navigate({ to: "/dashboard/pages" });
      }}
      onCancel={() => void navigate({ to: "/dashboard/pages" })}
    />
  );
}
