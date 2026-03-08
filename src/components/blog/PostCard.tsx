import { Link } from '@tanstack/react-router'

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  publishedAt: Date | null
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

export const cardThemes = [
  { cover: 'bg-secondary', badge: 'Design', action: 'text-primary', avatar: 'bg-primary' },
  { cover: 'bg-accent', badge: 'Culture', action: 'text-primary', avatar: 'bg-primary' },
  { cover: 'bg-sky', badge: 'Tech', action: 'text-secondary', avatar: 'bg-secondary' },
  { cover: 'bg-primary', badge: 'Edgy', action: 'text-accent', avatar: 'bg-accent' },
  { cover: 'bg-grape', badge: 'Vibe', action: 'text-accent', avatar: 'bg-accent' },
]

export function PostCard({ post }: { post: Post }) {
  const theme = cardThemes[post.id % cardThemes.length]

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="toy-button group block overflow-hidden rounded-lg p-5 no-underline shadow-zine hover:shadow-zine-hover border-3 border-border bg-card"
    >
      <div className={`relative mb-5 h-52 overflow-hidden rounded-md border-3 border-border ${theme.cover}`}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgb(0_0_0/10%)_25%,transparent_25%,transparent_50%,rgb(0_0_0/10%)_50%,rgb(0_0_0/10%)_75%,transparent_75%,transparent)] bg-size-[20px_20px]" />
        <div className="absolute left-4 top-4 rounded-md border-2 border-border bg-background px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
          {theme.badge}
        </div>
        <div className="absolute bottom-3 right-4 text-4xl opacity-90 drop-shadow-md">⚡</div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
        <span>{post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : 'Draft'}</span>
      </div>

      <h3 className="display-title mb-2 text-2xl leading-none text-foreground font-extrabold transition-colors group-hover:text-primary uppercase tracking-tighter">
        {post.title}
      </h3>
      <p className="m-0 line-clamp-3 text-sm font-bold leading-tight text-muted-foreground">
        {post.excerpt}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-8 w-8 rounded-md border-2 border-border shadow-zine-sm ${theme.avatar}`} />
          <span className="text-xs font-black text-foreground uppercase tracking-tighter">Vibe Studio</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-black ${theme.action} transition-transform group-hover:translate-x-1`}>
          Read!
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
      </div>
    </Link>
  )
}
