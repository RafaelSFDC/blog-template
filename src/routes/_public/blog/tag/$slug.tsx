import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Hash } from "lucide-react";
import { getPublishedTagBySlug } from "#/server/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";

export const Route = createFileRoute("/_public/blog/tag/$slug")({
  loader: async ({ params }) => {
    const [data, site] = await Promise.all([
      getPublishedTagBySlug(params.slug),
      getSeoSiteData(),
    ]);

    if (!data) {
      throw notFound();
    }

    return { ...data, site };
  },
  head: ({ loaderData }) =>
    buildPublicSeo({
      site: loaderData.site,
      path: `/blog/tag/${loaderData.tag.slug}`,
      title: `#${loaderData.tag.name} | ${loaderData.site.blogName}`,
      description: `Published stories tagged with ${loaderData.tag.name}.`,
      image: loaderData.site.defaultOgImage,
    }),
  component: TagPage,
});

function TagPage() {
  const { tag, posts } = Route.useLoaderData();

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
      </div>
    </main>
  );
}
