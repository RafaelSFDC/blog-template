import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Archive } from "lucide-react";
import { normalizePage } from "#/lib/pagination";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildPublicSeo,
} from "#/lib/seo";
import { getArchivePosts } from "#/server/public-discovery";
import { getSeoSiteData } from "#/server/seo-actions";

type ArchiveLoaderData = Awaited<ReturnType<typeof getArchivePosts>> & {
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
};

export const Route = createFileRoute("/_public/blog/archive/$year/")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: async ({ params, deps }) => {
    const year = Number(params.year);
    if (!Number.isInteger(year)) {
      throw notFound();
    }

    const [archive, site] = await Promise.all([
      getArchivePosts(year, undefined, deps.page),
      getSeoSiteData(),
    ]);

    return { ...archive, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as ArchiveLoaderData | undefined;
    if (!data) {
      return {};
    }

    return buildPublicSeo({
      site: data.site,
      path: `/blog/archive/${data.year}${data.pagination.currentPage > 1 ? `?page=${data.pagination.currentPage}` : ""}`,
      title: `${data.year} Archive | ${data.site.blogName}`,
      description: `Published stories from ${data.year}.`,
      image: data.site.defaultOgImage,
      indexable: data.site.robotsIndexingEnabled && data.pagination.currentPage === 1,
      jsonLd: [
        buildOrganizationJsonLd(data.site),
        buildBreadcrumbJsonLd(data.site.siteUrl, [
          { name: "Stories", path: "/blog" },
          { name: `${data.year} Archive`, path: `/blog/archive/${data.year}` },
        ]),
      ],
    });
  },
  component: YearArchivePage,
});

function YearArchivePage() {
  const { posts, pagination, year } = Route.useLoaderData() as ArchiveLoaderData;

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="Year Archive"
          title={`${year}`}
          description={`Published stories from ${year}.`}
        />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Archive}
            title="No stories in this archive"
            description="No published posts were found for this year."
          />
        )}

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/blog/archive/$year"
          search={{}}
          params={{ year: String(year) }}
        />

        <Newsletter />
      </div>
    </main>
  );
}
