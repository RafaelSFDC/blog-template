import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { MarkdownContent } from "#/components/markdown-content";
import { BlogHero } from "#/components/blog-hero";
import { RecommendedPosts } from "#/components/recommended-posts";
import { TableOfContents } from "#/components/table-of-contents";
import { AuthorBio } from "#/components/author-bio";
import { SocialSharing } from "#/components/social-sharing";
import { Newsletter } from "#/components/blog/newsletter";

const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });

    if (!post) {
      throw notFound();
    }

    // Fetch recommended posts (same category, different slug)
    const recommended = await db.query.posts.findMany({
      where: and(
        eq(posts.category, post.category || "General"),
        ne(posts.slug, slug),
      ),
      limit: 3,
    });

    return {
      post,
      recommended: (recommended as any[]) || [],
    };
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getPostBySlug({ data: params.slug }),
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return {
        meta: [{ title: 'Post Not Found | VibeZine' }],
      }
    }

    return {
      meta: [
        {
          title: `${post.title} | VibeZine`,
        },
        {
          name: 'description',
          content: post.excerpt,
        },
        {
          property: 'og:title',
          content: post.title,
        },
        {
          property: 'og:description',
          content: post.excerpt,
        },
        {
          property: 'og:image',
          content: post.coverImage ?? undefined,
        },
        {
          property: 'og:type',
          content: 'article',
        },
      ],
    }
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, recommended }: any = Route.useLoaderData();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="pb-20 pt-10">
      <div className="page-wrap flex flex-col gap-8 sm:gap-12">
        {/* Post Hero */}
        <BlogHero post={post} />

        {/* Social Sharing */}
        <div className="island-shell rounded-2xl bg-card p-4 sm:p-6">
          <SocialSharing url={currentUrl} title={post.title} />
        </div>

        {/* Table of Contents */}
        <TableOfContents content={post.content} />

        {/* Main Article Content */}
        <article className="blog-content island-shell prose-lg bg-card p-6 sm:p-12 rounded-2xl">
          <MarkdownContent content={post.content} />
        </article>

        {/* Tags */}
        {post.tags && (
          <div className="island-shell flex flex-wrap gap-2 p-6 sm:p-8 bg-card rounded-2xl">
            <span className="mr-2 text-xs font-bold uppercase tracking-widest text-(--sea-ink-soft)">
              Tags
            </span>
            {post.tags.split(",").map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-(--line) px-4 py-1.5 text-xs font-bold text-(--sea-ink-soft) transition-all hover:bg-(--lagoon-deep) hover:text-white hover:-translate-y-0.5"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio */}
        <AuthorBio />

        {/* Newsletter */}
        <Newsletter />

        {/* Recommended Posts */}
        <RecommendedPosts posts={recommended} />
      </div>
    </main>
  );
}
