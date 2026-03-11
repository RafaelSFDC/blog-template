import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { PageContent } from "#/components/cms/PageContent";
import { getPublishedPageBySlug } from "#/server/page-actions";

const getPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }) => {
    setResponseHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    const page = await getPublishedPageBySlug(data);
    if (!page) {
      throw notFound();
    }

    return page;
  });

export const Route = createFileRoute("/_public/$")({
  loader: ({ params }) => getPageBySlug({ data: params._splat || "" }),
  head: ({ loaderData }) => {
    const page = loaderData as
      | {
          title: string;
          metaTitle?: string | null;
          excerpt?: string | null;
          metaDescription?: string | null;
          ogImage?: string | null;
        }
      | undefined;

    if (!page) {
      return {};
    }

    const title = page.metaTitle || page.title;
    const description = page.metaDescription || page.excerpt || "Custom page";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(page.ogImage ? [{ property: "og:image", content: page.ogImage }] : []),
      ],
    };
  },
  component: CmsPage,
});

function CmsPage() {
  const page = Route.useLoaderData();

  return (
    <PageContent
      title={page.title}
      description={page.excerpt}
      content={page.content}
    />
  );
}
