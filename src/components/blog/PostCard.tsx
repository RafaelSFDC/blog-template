import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  publishedAt: Date | null
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group island-shell block overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-(--sea-ink-soft) font-medium">
        <span>{post.publishedAt ? format(post.publishedAt, 'MMM dd, yyyy') : 'Draft'}</span>
        <span className="h-1 w-1 rounded-full bg-(--line)" />
        <span className="text-(--lagoon-deep)">Blog Post</span>
      </div>
      <h3 className="mb-2 text-xl font-bold text-(--sea-ink) group-hover:text-(--lagoon-deep) transition-colors">
        {post.title}
      </h3>
      <p className="m-0 text-sm leading-relaxed text-(--sea-ink-soft) line-clamp-2">
        {post.excerpt}
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-(--lagoon-deep) transition-transform group-hover:translate-x-1">
        Read More
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  )
}
