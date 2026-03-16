import { Link } from "@tanstack/react-router";
import { buildResponsiveMediaSet, getMediaFallbackLabel } from "#/lib/media";

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  coverImage?: string | null;
  category?: string | null;
  authorName?: string | null;
  snippet?: string;
}

export const cardThemes = [
  {
    cover: "bg-zinc-100",
    badge: "Design",
    action: "text-primary",
    avatar: "bg-primary",
  },
  {
    cover: "bg-zinc-100",
    badge: "Culture",
    action: "text-primary",
    avatar: "bg-primary",
  },
  {
    cover: "bg-zinc-100",
    badge: "Tech",
    action: "text-secondary",
    avatar: "bg-secondary",
  },
  {
    cover: "bg-zinc-100",
    badge: "Modern",
    action: "text-accent",
    avatar: "bg-accent",
  },
  {
    cover: "bg-zinc-100",
    badge: "Lumina",
    action: "text-accent",
    avatar: "bg-accent",
  },
];

export function PostCard({ post }: { post: Post }) {
  const media = buildResponsiveMediaSet(post.coverImage);

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="bg-card border shadow-sm group block overflow-hidden rounded-md p-6 transition-all hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative mb-6 aspect-video overflow-hidden rounded-md border border-border bg-muted">
        {media?.src ? (
          <img
            src={media.src}
            srcSet={media.srcSet}
            sizes={media.sizes}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-linear-to-br from-primary/15 via-background to-secondary/20 p-4">
            <span className="rounded-md border border-border bg-background/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-foreground">
              {getMediaFallbackLabel(post.title, post.category)}
            </span>
          </div>
        )}
      </div>
      <div className="mb-4 inline-block rounded border border-primary bg-muted px-3 py-1 text-xs font-bold text-primary">
        {post.category || "General"}
      </div>
      <h3 className="mb-3 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {post.snippet || post.excerpt}
      </p>
    </Link>
  );
}
