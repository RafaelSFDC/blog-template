import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Hash } from "lucide-react";
import { getPublishedTagBySlug } from "#/server/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildCanonicalUrl, buildPublicSeo } from "#/lib/seo";
import { normalizePage } from "#/lib/pagination";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { getRedirectByPath } from "#/server/redirect-actions";

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
    const page = loaderData.page || 1;
    const links = [];

    if (loaderData.pagination.hasPreviousPage) {
      links.push({
        rel: "prev",
        href: buildCanonicalUrl(
          loaderData.site.siteUrl,
          `/blog/tag/${loaderData.tag.slug}${page - 1 > 1 ? `?page=${page - 1}` : ""}`,
        ),
      });
    }

    if (loaderData.pagination.hasNextPage) {
      links.push({
        rel: "next",
        href: buildCanonicalUrl(
          loaderData.site.siteUrl,
          `/blog/tag/${loaderData.tag.slug}?page=${page + 1}`,
        ),
      });
    }

    return buildPublicSeo({
      site: loaderData.site,
      path: `/blog/tag/${loaderData.tag.slug}${page > 1 ? `?page=${page}` : ""}`,
      title:
        page > 1
          ? `#${loaderData.tag.name} - Page ${page} | ${loaderData.site.blogName}`
          : `#${loaderData.tag.name} | ${loaderData.site.blogName}`,
      description:
        page > 1
          ? `Browse page ${page} of stories tagged with ${loaderData.tag.name}.`
          : `Published stories tagged with ${loaderData.tag.name}.`,
      image: loaderData.site.defaultOgImage,
      links,
    });
  },
  component: TagPage,
});

function TagPage() {
  const { tag, posts, pagination } = Route.useLoaderData();

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
            {posts.map((post) => (
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
