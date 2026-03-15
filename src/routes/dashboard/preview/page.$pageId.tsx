import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageEditorialPreview } from "#/components/dashboard/editorial-preview";
import { buildPagePreviewDraft } from "#/lib/editorial-preview";
import { getPagePreviewData } from "#/server/page-actions";

export const Route = createFileRoute("/dashboard/preview/page/$pageId")({
  loader: async ({ params }) => {
    const pageId = Number(params.pageId);
    if (!Number.isFinite(pageId)) {
      throw notFound();
    }

    return getPagePreviewData({ data: { pageId } });
  },
  component: PagePreviewPage,
});

function PagePreviewPage() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <PageEditorialPreview draft={buildPagePreviewDraft(data)} />
    </div>
  );
}
