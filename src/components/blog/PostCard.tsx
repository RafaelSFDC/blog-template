import { Link } from "@tanstack/react-router";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  coverImage?: string | null;
  category?: string | null;
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
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="bg-card border shadow-sm group block overflow-hidden rounded-md p-6 transition-all hover:-translate-y-2 hover:shadow-2xl"
    >
      {post.coverImage && (
        <div className="relative mb-6 aspect-video overflow-hidden rounded-md border border-border">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}
      <div className="mb-4 inline-block rounded border border-primary bg-muted px-3 py-1 text-xs font-bold text-primary">
        {post.category || "General"}
      </div>
      <h3 className="mb-3 text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </h3>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {post.excerpt}
      </p>
    </Link>
  );
}
