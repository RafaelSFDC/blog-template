import { Calendar, Clock, Tag, User } from "lucide-react";
import { postDateFormatter } from "#/lib/utils";
import { Breadcrumbs } from "#/components/breadcrumbs";
import { buildResponsiveMediaSet, getMediaFallbackLabel } from "#/lib/media";

interface BlogHeroProps {
  post: {
    slug?: string;
    title: string;
    excerpt: string;
    coverImage?: string | null;
    category?: string | null;
    categorySlug?: string | null;
    publishedAt?: Date | string | null;
    readingTime?: number | null;
    authorName?: string | null;
    authorSlug?: string | null;
  };
}

export function BlogHero({ post }: BlogHeroProps) {
  const media = buildResponsiveMediaSet(post.coverImage);
  const crumbs = [
    { label: "Stories", href: "/blog" },
    ...(post.category && post.categorySlug
      ? [{ label: post.category, href: `/blog/category/${post.categorySlug}` }]
      : []),
    { label: post.title },
  ];

  return (
    <header className="bg-card border shadow-sm rounded-md px-4 py-3 sm:px-6 text-center sm:text-left">
      <Breadcrumbs items={crumbs} />

      {/* Metadata Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold  text-muted-foreground sm:justify-start">
        {post.category && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <Tag className="h-3 w-3" />
            {post.category}
          </div>
        )}
        <div className="flex items-center gap-1.5 border-l border-border pl-4">
          <Calendar className="h-3 w-3" />
          <span>
            {post.publishedAt
              ? postDateFormatter.format(new Date(post.publishedAt))
              : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 border-l border-border pl-4">
          <User className="h-3 w-3" />
          <span>{post.authorSlug ? <a href={`/author/${post.authorSlug}`}>{post.authorName || "Editorial Team"}</a> : post.authorName || "Editorial Team"}</span>
        </div>
        {post.readingTime && (
          <div className="hidden items-center gap-1.5 border-l border-border pl-4 sm:flex">
            <Clock className="h-3 w-3" />
            <span>{post.readingTime} min read</span>
          </div>
        )}
      </div>

      <h1 className="leading-[1.08] tracking-tight text-balance font-extrabold mb-6 text-4xl text-foreground sm:text-5xl lg:text-7xl">
        {post.title}
      </h1>

      <p className="mb-12 text-xl font-medium leading-relaxed text-muted-foreground sm:text-2xl">
        {post.excerpt}
      </p>

      {/* Hero Image */}
      <div className="relative mb-16 aspect-video overflow-hidden rounded-md border border-border shadow-2xl bg-muted">
        {media?.src ? (
          <img
            src={media.src}
            srcSet={media.srcSet}
            sizes="100vw"
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-linear-to-br from-primary/10 via-background to-secondary/20 p-6">
            <span className="rounded-md border border-border bg-background/80 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-foreground">
              {getMediaFallbackLabel(post.title, post.category)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
