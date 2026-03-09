import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/index";
import { posts, comments, appSettings } from "#/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";
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
import { useState } from "react";

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

    // If not published and not admin, hide it
    if (post.status !== 'published' && session?.user?.role !== 'admin') {
      throw notFound();
    }

    const isSubscribed = session?.user?.id ? await db.query.user.findFirst({
        where: eq(user.id, session.user.id)
    }).then((u: any) => u?.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > new Date()) : false

    const hasAccess = !post.isPremium || isSubscribed || session?.user?.role === 'admin'

    // Truncate content if no access
    if (post.isPremium && !hasAccess) {
        // Keep first 500 characters or so for the preview
        post.content = post.content.substring(0, 500) + '...'
    }

    // Fetch blog settings for SEO
    const settings = await db.select().from(appSettings);
    const settingsObj: Record<string, string> = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    const blogName = settingsObj["blogName"] || "VibeZine";

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
      where: and(ne(posts.slug, slug), eq(posts.status, 'published')),
      limit: 3,
    });

    // Fetch Stripe Price ID from settings
    const stripePriceId = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, 'stripePriceId')
    }).then((s: { key: string; value: string; updatedAt: Date | null } | undefined) => s?.value)

    return {
      post,
      comments: commentsList,
      recommended: (recommended as any[]) || [],
      hasAccess,
      stripePriceId,
      blogName,
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
    const data = loaderData as any
    const post = data?.post
    const blogName = data?.blogName || 'VibeZine'
    
    if (!post) {
      return {
        meta: [{ title: `Post Not Found | ${blogName}` }],
      }
    }

    const title = `${post.metaTitle || post.title} | ${blogName}`
    const description = post.metaDescription || post.excerpt
    const image = post.ogImage || post.coverImage || undefined

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: image },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
      ],
    }
  },
  component: PostDetail,
});

function PostDetail() {
  const { post, comments, recommended, hasAccess, stripePriceId }: any = Route.useLoaderData();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [subscribing, setSubscribing] = useState(false)

  async function handleSubscribe() {
    if (!stripePriceId) {
        alert('O checkout do Stripe ainda não foi configurado pelo administrador.')
        return
    }

    try {
        setSubscribing(true)
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            body: JSON.stringify({ priceId: stripePriceId }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (response.status === 401) {
            // Redirect to login if not authenticated
            window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`
            return
        }

        const data = await response.json()
        if (data.url) {
            window.location.href = data.url
        } else {
            throw new Error('No checkout URL received')
        }
    } catch (error) {
        console.error('Checkout error:', error)
        alert('Ocorreu um erro ao iniciar o checkout. Tente novamente.')
    } finally {
        setSubscribing(false)
    }
  }

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
            <Paywall onSubscribe={handleSubscribe} isLoading={subscribing} />
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
