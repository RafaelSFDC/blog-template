import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PaginationNav } from "#/components/blog/PaginationNav";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { AuthorBio } from "#/components/author-bio";
import { FileText } from "lucide-react";
import { normalizePage } from "#/lib/pagination";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildPersonJsonLd,
  buildPaginatedPath,
  buildPublicSeo,
  resolvePublicIndexability,
} from "#/lib/seo";
import { getAuthorPageBySlug } from "#/server/public-discovery";
import { getSeoSiteData } from "#/server/seo-actions";

type AuthorPageLoaderData = NonNullable<Awaited<ReturnType<typeof getAuthorPageBySlug>>> & {
  site: Awaited<ReturnType<typeof getSeoSiteData>>;
  page: number;
};

export const Route = createFileRoute("/_public/author/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: normalizePage(search.page),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: async ({ params, deps }) => {
    const [data, site] = await Promise.all([
      getAuthorPageBySlug(params.slug, deps.page),
      getSeoSiteData(),
    ]);

    if (!data) {
      throw notFound();
    }

    return { ...data, site, page: deps.page };
  },
  head: ({ loaderData }) => {
    const data = loaderData as AuthorPageLoaderData | undefined;
    if (!data) {
      return {};
    }

    return buildPublicSeo({
      site: data.site,
      path: buildPaginatedPath({
        path: `/author/${data.author.publicAuthorSlug}`,
        page: data.page,
      }),
      title:
        data.author.authorSeoTitle ||
        `${data.author.name} | ${data.site.blogName}`,
      description:
        data.author.authorSeoDescription ||
        data.author.authorBio ||
        data.author.authorHeadline ||
        `Stories by ${data.author.name}`,
      image: data.author.image || data.site.defaultOgImage,
      type: "profile",
      indexable: resolvePublicIndexability({
        site: data.site,
        currentPage: data.page,
      }),
      jsonLd: [
        buildOrganizationJsonLd(data.site),
        buildPersonJsonLd({
          site: data.site,
          author: {
            name: data.author.name,
            slug: data.author.publicAuthorSlug || data.author.id,
            bio: data.author.authorBio,
            headline: data.author.authorHeadline,
            image: data.author.image,
          },
        }),
        buildBreadcrumbJsonLd(data.site.siteUrl, [
          { name: "Stories", path: "/blog" },
          { name: data.author.name, path: `/author/${data.author.publicAuthorSlug}` },
        ]),
      ],
    });
  },
  component: AuthorArchivePage,
});

function AuthorArchivePage() {
  const { author, posts, pagination } = Route.useLoaderData() as AuthorPageLoaderData;

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        <SiteHeader
          badge="Author Archive"
          title={author.name}
          description={author.authorBio || author.authorHeadline || `Published stories by ${author.name}.`}
        />

        <AuthorBio
          author={{
            name: author.name,
            image: author.image,
            bio: author.authorBio || undefined,
            role: author.authorHeadline || "Contributor",
          }}
        />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post as Post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No published stories yet"
            description="This author profile is live, but there are no public posts yet."
          />
        )}

        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          to="/author/$slug"
          search={{}}
          params={{ slug: author.publicAuthorSlug || author.id }}
        />

        <Newsletter />
      </div>
    </main>
  );
}
