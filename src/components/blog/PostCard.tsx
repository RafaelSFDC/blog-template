import { Link } from '@tanstack/react-router'

interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  publishedAt: Date | null
  coverImage?: string | null
  category?: string | null
}


export const cardThemes = [
  { cover: 'bg-zinc-100', badge: 'Design', action: 'text-primary', avatar: 'bg-primary' },
  { cover: 'bg-zinc-100', badge: 'Culture', action: 'text-primary', avatar: 'bg-primary' },
  { cover: 'bg-zinc-100', badge: 'Tech', action: 'text-secondary', avatar: 'bg-secondary' },
  { cover: 'bg-zinc-100', badge: 'Edgy', action: 'text-accent', avatar: 'bg-accent' },
  { cover: 'bg-zinc-100', badge: 'Vibe', action: 'text-accent', avatar: 'bg-accent' },
]

export function PostCard({ post }: { post: Post }) {
  const theme = cardThemes[post.id % cardThemes.length]

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="toy-button group block overflow-hidden rounded-[32px] p-6 no-underline shadow-zine hover:shadow-zine-hover border-4 border-border bg-card transition-all"
    >
      <div className={`relative mb-6 aspect-16/10 w-full overflow-hidden rounded-[24px] border-[3px] border-border ${theme.cover}`}>
        {post.coverImage ? (
          <img 
            src={post.coverImage} 
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgb(0_0_0/5%)_25%,transparent_25%,transparent_50%,rgb(0_0_0/5%)_50%,rgb(0_0_0/5%)_75%,transparent_75%,transparent)] bg-size-[20px_20px]" />
        )}
      </div>

      <div className="mb-4">
        <span className="inline-block rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-primary">
          {post.category || theme.badge}
        </span>
      </div>

      <h3 className="mb-3 text-2xl font-black leading-tight text-foreground transition-colors group-hover:text-primary tracking-tight">
        {post.title}
      </h3>
      
      <p className="line-clamp-3 text-base font-bold leading-relaxed text-muted-foreground/80">
        {post.excerpt}
      </p>
    </Link>
  )
}
