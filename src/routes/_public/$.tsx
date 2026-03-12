import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { PageContent } from "#/components/cms/PageContent";
import { getPublishedPageBySlug } from "#/server/page-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";
import { getRedirectByPath } from "#/server/redirect-actions";

const getPageBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data }) => {
    setResponseHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    const page = await getPublishedPageBySlug(data);
    if (!page) {
      const redirectMatch = await getRedirectByPath(`/${data}`);
      if (redirectMatch) {
        throw redirect({
          href: redirectMatch.destinationPath,
          statusCode: redirectMatch.statusCode,
        });
      }
      throw notFound();
    }

    return page;
  });

export const Route = createFileRoute("/_public/$")({
  loader: async ({ params }) => {
    const [page, site] = await Promise.all([
      getPageBySlug({ data: params._splat || "" }),
      getSeoSiteData(),
    ]);

    return { page, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as
      | {
          page: {
            slug: string;
            title: string;
            metaTitle?: string | null;
            excerpt?: string | null;
            metaDescription?: string | null;
            ogImage?: string | null;
          };
          site: Awaited<ReturnType<typeof getSeoSiteData>>;
        }
      | undefined;
    const page = data?.page;
    const site = data?.site;

    if (!page || !site) {
      return {};
    }

    return buildPublicSeo({
      site,
      path: page.slug === "" ? "/" : `/${page.slug}`,
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || site.blogDescription,
      image: page.ogImage || site.defaultOgImage,
    });
  },
  component: CmsPage,
});

function CmsPage() {
  const { page } = Route.useLoaderData();

  return (
    <PageContent
      title={page.title}
      description={page.excerpt}
      content={page.content}
    />
  );
}
