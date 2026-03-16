import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { toast } from "sonner";
import { PageEditorScreen } from "#/components/dashboard/page-editor-screen";
import { normalizePageSubmission } from "#/lib/editorial-form-utils";
import { createPage } from "#/server/page-actions";

export const Route = createFileRoute("/dashboard/pages/new")({
  component: NewPagePage,
});

function NewPagePage() {
  const navigate = useNavigate();

  return (
    <PageEditorScreen
      title="New Page"
      description="Create a static page for your publication."
      icon={Library}
      iconLabel="Static Content"
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
        teaserMode: "excerpt",
        status: "draft",
        isHome: false,
        useVisualBuilder: false,
      }}
      storageKey="page-editor"
      submitLabel="Create Page"
      submitErrorMessage="Could not create page"
      onSubmit={async (values) => {
        await createPage({
          data: normalizePageSubmission(values),
        });
        toast.success("Page created successfully");
        await navigate({ to: "/dashboard/pages" });
      }}
      onCancel={() => void navigate({ to: "/dashboard/pages" })}
    />
  );
}
