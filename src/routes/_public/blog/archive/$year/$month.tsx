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
  buildPaginatedPath,
  buildOrganizationJsonLd,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { getArchivePosts } from "#/server/public-discovery";
import { getSeoSiteData } from "#/server/seo-actions";

type ArchiveLoaderData = Awaited<ReturnType<typeof getArchivePosts>> & {
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
};

function getMonthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const Route = createFileRoute("/_public/blog/archive/$year/$month")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: async ({ params, deps }) => {
    const year = Number(params.year);
    const month = Number(params.month);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw notFound();
    }

    const [archive, site] = await Promise.all([
      getArchivePosts(year, month, deps.page),
      getSeoSiteData(),
    ]);

    return { ...archive, site };
  },
  head: ({ loaderData }) => {
    const data = loaderData as ArchiveLoaderData | undefined;
    if (!data || !data.month) {
      return {};
    }

    const monthLabel = getMonthLabel(data.year, data.month);

    return buildPublicSeo({
      site: data.site,
      path: buildPaginatedPath({
        path: `/blog/archive/${data.year}/${String(data.month).padStart(2, "0")}`,
        page: data.pagination.currentPage,
      }),
      title: `${monthLabel} Archive | ${data.site.blogName}`,
      description: `Published stories from ${monthLabel}.`,
      image: data.site.defaultOgImage,
      indexable: resolvePublicIndexability({
        site: data.site,
        currentPage: data.pagination.currentPage,
      }),
      jsonLd: [
        buildOrganizationJsonLd(data.site),
        buildBreadcrumbJsonLd(data.site.siteUrl, [
          { name: "Stories", path: "/blog" },
          { name: `${data.year} Archive`, path: `/blog/archive/${data.year}` },
          { name: monthLabel, path: `/blog/archive/${data.year}/${String(data.month).padStart(2, "0")}` },
        ]),
      ],
    });
  },
  component: MonthArchivePage,
});

function MonthArchivePage() {
  const { posts, pagination, year, month } = Route.useLoaderData() as ArchiveLoaderData;
  const monthLabel = month ? getMonthLabel(year, month) : `${year}`;

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="Monthly Archive"
          title={monthLabel}
          description={`Published stories from ${monthLabel}.`}
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
            description="No published posts were found for this month."
          />
        )}

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/blog/archive/$year/$month"
          search={{}}
          params={{ year: String(year), month: String(month).padStart(2, "0") }}
        />

        <Newsletter />
      </div>
    </main>
  );
}
