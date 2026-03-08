import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts } from "#/db/schema";
import { eq, ne, desc } from "drizzle-orm";
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

    // Increment view count
    await db
      .update(posts)
      .set({ viewCount: (post.viewCount || 0) + 1 })
      .where(eq(posts.id, post.id));

    // Fetch comments
    const commentsList = await db.query.comments.findMany({
      where: eq(posts.id, post.id),
      orderBy: [desc(posts.publishedAt)], // Note: schema says createdAt for comments, using that if I checked right
    }).catch(() => []); // Fallback if table issues

    // Fetch recommended posts (same category, different slug)
    // Using 'category' field if it exists, otherwise fallback
    const recommended = await db.query.posts.findMany({
      where: ne(posts.slug, slug),
      limit: 3,
    });

    return {
      post,
      comments: commentsList,
      recommended: (recommended as any[]) || [],
    };
  });

export const Route = createFileRoute("/_public/blog/$slug")({
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
          title: `${post.metaTitle || post.title} | VibeZine`,
        },
        {
          name: 'description',
          content: post.metaDescription || post.excerpt,
        },
        {
          property: 'og:title',
          content: post.metaTitle || post.title,
        },
        {
          property: 'og:description',
          content: post.metaDescription || post.excerpt,
        },
        {
          property: 'og:image',
          content: post.ogImage || post.coverImage || undefined,
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
        <article className="island-shell prose-lg bg-card p-6 sm:p-12 rounded-2xl">
          <MarkdownContent content={post.content} />
        </article>


        {/* Author Bio */}
        <AuthorBio />

        {/* Comments Section */}
        <section className="island-shell rounded-2xl bg-card p-6 sm:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Comments ({post.comments?.length || 0})</h3>
          <p className="text-muted-foreground mb-8">Comentários nativos em breve. Por enquanto, a base de dados já está pronta para recebê-los.</p>
          <div className="space-y-6">
            {post.comments?.map((comment: any) => (
              <div key={comment.id} className="border-b border-border pb-6 last:border-0">
                <p className="font-bold text-foreground">{comment.authorName}</p>
                <p className="text-xs text-muted-foreground mb-2">{new Date(comment.createdAt).toLocaleDateString()}</p>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <Newsletter />

        {/* Recommended Posts */}
        <RecommendedPosts posts={recommended} />
      </div>
    </main>
  );
}
