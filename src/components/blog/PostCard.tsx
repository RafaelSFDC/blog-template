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

const cardThemes = [
  { cover: 'bg-mint', badge: 'Design', action: 'text-coral', avatar: 'bg-coral' },
  { cover: 'bg-lemon', badge: 'Theory', action: 'text-sky', avatar: 'bg-sky' },
  { cover: 'bg-sky', badge: 'Tech', action: 'text-mint', avatar: 'bg-mint' },
  { cover: 'bg-coral', badge: 'Toys', action: 'text-lemon', avatar: 'bg-lemon' },
  { cover: 'bg-grape', badge: 'Lifestyle', action: 'text-lemon', avatar: 'bg-lemon' },
]

export function PostCard({ post }: { post: Post }) {
  const theme = cardThemes[post.id % cardThemes.length]

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="toy-button glass-card group block overflow-hidden rounded-[2.2rem] p-5 no-underline shadow-toy hover:shadow-toy-hover"
    >
      <div className={`relative mb-5 h-52 overflow-hidden rounded-[1.6rem] border-4 border-white ${theme.cover}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255_/_55%),transparent_58%)]" />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
          {theme.badge}
        </div>
        <div className="absolute bottom-3 right-4 text-4xl opacity-75">✨</div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-(--sea-ink-soft)">
        <span>{post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : 'Draft'}</span>
      </div>

      <h3 className="display-title mb-2 text-2xl leading-tight text-(--sea-ink) transition-[transform,opacity] group-hover:text-coral">
        {post.title}
      </h3>
      <p className="m-0 line-clamp-3 text-sm leading-relaxed text-(--sea-ink-soft)">
        {post.excerpt}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-9 w-9 rounded-full border-2 border-white ${theme.avatar}`} />
          <span className="text-xs font-bold text-(--sea-ink-soft)">Playful Author</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-black ${theme.action} transition-[transform,opacity] group-hover:translate-x-1`}>
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
