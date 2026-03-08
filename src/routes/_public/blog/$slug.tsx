import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts, comments } from "#/db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { MarkdownContent } from "#/components/markdown-content";
import { BlogHero } from "#/components/blog-hero";
import { RecommendedPosts } from "#/components/recommended-posts";
import { TableOfContents } from "#/components/table-of-contents";
import { AuthorBio } from "#/components/author-bio";
import { SocialSharing } from "#/components/social-sharing";
import { Newsletter } from "#/components/blog/newsletter";
import { CommentForm } from "#/components/blog/comment-form";
import { Paywall } from "#/components/blog/paywall";
import { auth } from "#/lib/auth";
import { user } from "#/db/schema";

const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    // @ts-ignore - access the request from context if available in current start version
    const request = (globalThis as any).getRequest?.() 

    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });

    if (!post) {
      throw notFound();
    }

    const session = await auth.api.getSession({
        headers: (request as Request).headers
    })

    const isSubscribed = session?.user?.id ? await db.query.user.findFirst({
        where: eq(user.id, session.user.id)
    }).then((u: any) => u?.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > new Date()) : false

    const hasAccess = !post.isPremium || isSubscribed || session?.user?.role === 'admin'

    // Truncate content if no access
    if (post.isPremium && !hasAccess) {
        // Keep first 500 characters or so for the preview
        post.content = post.content.substring(0, 500) + '...'
    }

    // Increment view count
    await db
      .update(posts)
      .set({ viewCount: (post.viewCount || 0) + 1 })
      .where(eq(posts.id, post.id));

    // Fetch comments
    const commentsList = await db.query.comments.findMany({
      where: eq(comments.postId, post.id),
      orderBy: [desc(comments.createdAt)],
    }).catch(() => []);

    // Fetch recommended posts (same category, different slug)
    const recommended = await db.query.posts.findMany({
      where: ne(posts.slug, slug),
      limit: 3,
    });

    return {
      post,
      comments: commentsList,
      recommended: (recommended as any[]) || [],
      hasAccess,
    };
  });

const addComment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      postId: number;
      authorName: string;
      authorEmail?: string;
      content: string;
    }) => data
  )
  .handler(async ({ data }) => {
    await db.insert(comments).values({
      postId: data.postId,
      authorName: data.authorName,
      authorEmail: data.authorEmail || null,
      content: data.content,
      status: "pending",
    });

    return { success: true };
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
  const { post, comments, recommended, hasAccess }: any = Route.useLoaderData();
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
        <article className="island-shell prose-lg bg-card p-6 sm:p-12 rounded-2xl relative overflow-hidden">
          <MarkdownContent content={post.content} />
          {!hasAccess && (
            <Paywall onSubscribe={() => {
                // Redirect to checkout API or open pricing
                window.location.href = '/api/stripe/checkout' 
                // Note: Simplified for now, usually you'd POST with a priceId
            }} />
          )}
        </article>


        {/* Author Bio */}
        <AuthorBio />

        {/* Comments Section */}
        <section className="island-shell rounded-2xl bg-card p-6 sm:p-12">
          <h3 className="text-2xl font-bold text-foreground mb-6 uppercase tracking-tight">
            Leave a Comment
          </h3>
          <div className="mb-10 border-b border-border pb-10">
            <CommentForm
              onSubmit={async (data) => {
                await addComment({ data: { ...data, postId: post.id } });
              }}
            />
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-6 uppercase tracking-tight">
            Discussion ({comments?.length || 0})
          </h3>
          <div className="space-y-6">
            {comments?.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-black text-foreground uppercase text-sm tracking-wide">
                      {comment.authorName}
                    </p>
                    <span className="text-xs text-muted-foreground opacity-50">•</span>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground font-bold italic">
                Be the first to share your thoughts on this story.
              </p>
            )}
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
