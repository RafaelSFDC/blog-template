import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteHeader } from "#/components/SiteHeader";
import { Newsletter } from "#/components/blog/newsletter";
import { PostCard, type Post } from "#/components/blog/PostCard";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { FolderOpen } from "lucide-react";
import { getPublishedCategoryBySlug } from "#/server/taxonomy-actions";
import { getSeoSiteData } from "#/server/seo-actions";
import { buildPublicSeo } from "#/lib/seo";

export const Route = createFileRoute("/_public/blog/category/$slug")({
  loader: async ({ params }) => {
    const [data, site] = await Promise.all([
      getPublishedCategoryBySlug(params.slug),
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
      path: `/blog/category/${loaderData.category.slug}`,
      title: `${loaderData.category.name} | ${loaderData.site.blogName}`,
      description:
        loaderData.category.description ||
        `Browse every published story in ${loaderData.category.name}.`,
      image: loaderData.site.defaultOgImage,
    }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, posts } = Route.useLoaderData();

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
            {posts.map((post) => (
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
      </div>
    </main>
  );
}
