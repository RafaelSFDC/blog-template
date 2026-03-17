import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Hash } from "lucide-react";
import { getPublishedTagBySlug } from "#/server/actions/content/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import {
  buildBreadcrumbJsonLd,
  buildPaginatedPath,
  buildPaginationLinks,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { normalizePage } from "#/lib/pagination";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { getRedirectByPath } from "#/server/actions/content/redirect-actions";

type TagPageLoaderData = NonNullable<
  Awaited<ReturnType<typeof getPublishedTagBySlug>>
> & {
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
  page: number;
};

export const Route = createFileRoute("/_public/blog/tag/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: async ({ params, deps }) => {
    const [data, site] = await Promise.all([
      getPublishedTagBySlug(params.slug, deps.page),
      getSeoSiteData(),
    ]);

    if (!data) {
      const redirectMatch = await getRedirectByPath(`/blog/tag/${params.slug}`);
      if (redirectMatch) {
        throw redirect({
          href: redirectMatch.destinationPath,
          statusCode: redirectMatch.statusCode,
        });
      }
      throw notFound();
    }

    return { ...data, site, page: deps.page };
  },
  head: ({ loaderData }) => {
    const data = loaderData as TagPageLoaderData | undefined;
    if (!data) {
      return {};
    }

    const page = data.page || 1;
    const links = buildPaginationLinks({
      siteUrl: data.site.siteUrl,
      path: `/blog/tag/${data.tag.slug}`,
      currentPage: page,
      hasPreviousPage: data.pagination.hasPreviousPage,
      hasNextPage: data.pagination.hasNextPage,
    });

    return buildPublicSeo({
      site: data.site,
      path: buildPaginatedPath({
        path: `/blog/tag/${data.tag.slug}`,
        page,
      }),
      title:
        page > 1
          ? `#${data.tag.name} - Page ${page} | ${data.site.blogName}`
          : `#${data.tag.name} | ${data.site.blogName}`,
      description:
        page > 1
          ? `Browse page ${page} of stories tagged with ${data.tag.name}.`
          : `Published stories tagged with ${data.tag.name}.`,
      image: data.site.defaultOgImage,
      indexable: resolvePublicIndexability({
        site: data.site,
        seoNoIndex: data.tag.seoNoIndex,
        currentPage: page,
      }),
      links,
      jsonLd: [
        buildBreadcrumbJsonLd(data.site.siteUrl, [
          { name: "Stories", path: "/blog" },
          { name: `#${data.tag.name}`, path: `/blog/tag/${data.tag.slug}` },
        ]),
      ],
    });
  },
  component: TagPage,
});

function TagPage() {
  const { tag, posts, pagination } = Route.useLoaderData() as TagPageLoaderData;

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="Tag Archive"
          title={`#${tag.name}`}
          description={`Published stories tagged with ${tag.name}.`}
        />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Hash}
            title="No published stories yet"
            description="This tag exists, but it does not have public posts yet."
          />
        )}

        <Newsletter />

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/blog/tag/$slug"
          search={{}}
          params={{ slug: tag.slug }}
        />
      </div>
    </main>
  );
}
