import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MarkdownContent } from '@/components/markdown-content'
import { format } from 'date-fns'

const getPostBySlug = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    })

    if (!post) {
      throw notFound()
    }

    return post
  })

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => getPostBySlug({ data: params.slug }),
  component: PostDetail,
})

function PostDetail() {
  const post: any = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-20 pt-14">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-(--lagoon-deep)">
            <span>Blog Post</span>
            <span className="h-1 w-1 rounded-full bg-(--line)" />
            <span>{post.publishedAt ? format(new Date(post.publishedAt), 'MMMM dd, yyyy') : 'Draft'}</span>
          </div>
          <h1 className="display-title mb-6 text-4xl font-bold leading-tight text-(--sea-ink) sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-(--sea-ink-soft)">
            {post.excerpt}
          </p>
        </header>

        <div className="island-shell mb-12 overflow-hidden rounded-3xl border-(--line) shadow-2xl">
           <img 
            src="/blog_hero_image_1772952577328.png" 
            alt={post.title} 
            className="h-full w-full object-cover"
          />
        </div>

        <div className="blog-content">
          <MarkdownContent content={post.content} />
        </div>

        <footer className="mt-16 border-t border-(--line) pt-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-(--line)">
               {/* Placeholder for author image */}
               <div className="flex h-full w-full items-center justify-center bg-(--chip-bg) text-(--sea-ink)">
                 {post.authorId ? 'A' : 'U'}
               </div>
            </div>
            <div>
              <p className="text-sm font-bold text-(--sea-ink)">
                Published by {post.authorId || 'Anonymous'}
              </p>
              <p className="text-xs text-(--sea-ink-soft)">
                Digital Strategist & Web Developer
              </p>
            </div>
          </div>
        </footer>
      </article>
    </main>
  )
}
