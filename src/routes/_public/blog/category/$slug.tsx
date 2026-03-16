import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { FolderOpen } from "lucide-react";
import { getPublishedCategoryBySlug } from "#/server/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildBreadcrumbJsonLd, buildCanonicalUrl, buildPublicSeo } from "#/lib/seo";
import { normalizePage } from "#/lib/pagination";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { getRedirectByPath } from "#/server/redirect-actions";

type CategoryPageLoaderData = NonNullable<
  Awaited<ReturnType<typeof getPublishedCategoryBySlug>>
> & {
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
  page: number;
};

export const Route = createFileRoute("/_public/blog/category/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: async ({ params, deps }) => {
    const page = deps.page;
    const [data, site] = await Promise.all([
      getPublishedCategoryBySlug(params.slug, page),
      getSeoSiteData(),
    ]);

    if (!data) {
      const redirectMatch = await getRedirectByPath(`/blog/category/${params.slug}`);
      if (redirectMatch) {
        throw redirect({
          href: redirectMatch.destinationPath,
          statusCode: redirectMatch.statusCode,
        });
      }
      throw notFound();
    }

    return { ...data, site, page };
  },
  head: ({ loaderData }) => {
    const data = loaderData as CategoryPageLoaderData | undefined;
    if (!data) {
      return {};
    }

    const page = data.page || 1;
    const links: Array<{ rel: "prev" | "next"; href: string }> = [];

    if (data.pagination.hasPreviousPage) {
      links.push({
        rel: "prev",
        href: buildCanonicalUrl(
          data.site.siteUrl,
          `/blog/category/${data.category.slug}${page - 1 > 1 ? `?page=${page - 1}` : ""}`,
        ),
      });
    }

    if (data.pagination.hasNextPage) {
      links.push({
        rel: "next",
        href: buildCanonicalUrl(
          data.site.siteUrl,
          `/blog/category/${data.category.slug}?page=${page + 1}`,
        ),
      });
    }

    return buildPublicSeo({
      site: data.site,
      path: `/blog/category/${data.category.slug}${page > 1 ? `?page=${page}` : ""}`,
      title:
        page > 1
          ? `${data.category.name} - Page ${page} | ${data.site.blogName}`
          : `${data.category.name} | ${data.site.blogName}`,
      description:
        data.category.description ||
        (page > 1
          ? `Browse page ${page} of published stories in ${data.category.name}.`
          : `Browse every published story in ${data.category.name}.`),
      image: data.site.defaultOgImage,
      indexable: data.site.robotsIndexingEnabled && !data.category.seoNoIndex && page === 1,
      links,
      jsonLd: [
        buildBreadcrumbJsonLd(data.site.siteUrl, [
          { name: "Stories", path: "/blog" },
          { name: data.category.name, path: `/blog/category/${data.category.slug}` },
        ]),
      ],
    });
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category, posts, pagination } =
    Route.useLoaderData() as CategoryPageLoaderData;

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="Category Archive"
          title={category.name}
          description={
            category.description ||
            `Published stories filed under ${category.name}.`
          }
        />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post: Post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No published stories yet"
            description="This category exists, but it does not have public posts yet."
          />
        )}

        <Newsletter />

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/blog/category/$slug"
          search={{}}
          params={{ slug: category.slug }}
        />
      </div>
    </main>
  );
}
