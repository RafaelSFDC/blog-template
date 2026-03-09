import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  coverImage?: string | null
  category?: string | null
}

interface RecommendedPostsProps {
  posts: Post[]
}

export function RecommendedPosts({ posts }: RecommendedPostsProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="bg-card border shadow-sm flex items-center justify-between rounded-2xl bg-accent px-4 py-3 sm:px-6 transition-transform hover:-translate-y-1">
        <div>
          <h2 className="display-title text-2xl font-bold text-foreground sm:text-3xl">
            Também pode gostar
          </h2>
        </div>
        <Button asChild variant="outline" size="sm" className="hidden sm:flex">
          <Link
            to="/blog"
            search={{ q: '', category: '' }}
            className="flex items-center gap-2 rounded-full border border-foreground bg-background px-5 py-2 text-xs font-black text-foreground transition-all hover:bg-foreground hover:text-background"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="bg-card border shadow-sm group block overflow-hidden rounded-2xl bg-card p-6 transition-all hover:-translate-y-2 hover:shadow-2xl"
          >
            {post.coverImage && (
              <div className="relative mb-6 aspect-video overflow-hidden rounded-xl border border-border">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            )}
            <div className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
              {post.category || 'General'}
            </div>
            <h3 className="mb-3 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {post.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
