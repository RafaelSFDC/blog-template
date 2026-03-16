import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import { StatusBadge } from "#/components/ui/status-badge";
import { BlogHero } from "#/components/blog-hero";
import { MarkdownContent } from "#/components/markdown-content";
import { TableOfContents } from "#/components/table-of-contents";
import { PageContent } from "#/components/cms/PageContent";
import { useDebounce } from "#/hooks/use-debounce";
import {
  getEditorialStatusCopy,
} from "#/lib/editorial-preview";
import { cn } from "#/lib/utils";
import { Eye, Globe, Lock, Search } from "lucide-react";
import type { PagePreviewDraft, PostPreviewDraft } from "#/types/editorial";

function PreviewChrome({
  permalink,
  children,
  badges,
}: {
  permalink: string;
  badges: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border bg-background">
      <div className="border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Eye className="h-4 w-4" />
            Live Preview
          </div>
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 shrink-0" />
          <code className="truncate">{permalink}</code>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function SeoSnapshot({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search className="h-4 w-4 text-primary" />
        SEO preview
      </div>
      <p className="line-clamp-2 text-lg font-semibold text-primary">
        {title}
      </p>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
        {description}
      </p>
    </section>
  );
}

function PremiumPreviewNotice() {
  return (
    <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
      <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
        <Lock className="h-4 w-4 text-primary" />
        Premium preview
      </div>
      <p>
        This article is marked as premium. Readers without access will only see
        the limited preview and paywall flow.
      </p>
    </div>
  );
}

export function PostEditorialPreview({
  draft,
  className,
}: {
  draft: PostPreviewDraft;
  className?: string;
}) {
  const previewDraft = useDebounce(draft, 160);
  const title = previewDraft.title.trim() || "Untitled post";
  const excerpt =
    previewDraft.excerpt.trim() ||
    "Add a short summary so readers understand the editorial angle of this story.";
  const metaTitle = previewDraft.metaTitle.trim() || title;
  const metaDescription = previewDraft.metaDescription.trim() || excerpt;
  const publishedAt =
    previewDraft.status === "published" || previewDraft.status === "scheduled"
      ? previewDraft.publishedAt || new Date().toISOString()
      : null;

  return (
    <PreviewChrome
      permalink={previewDraft.permalink}
      badges={
        <>
          <StatusBadge variant="info">
            {getEditorialStatusCopy(previewDraft.status)}
          </StatusBadge>
          {previewDraft.isPremium ? (
            <Badge variant="outline" className="border-primary/20 text-primary">
              Premium
            </Badge>
          ) : null}
        </>
      }
    >
      <div className={cn("w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8", className)}>
        <div className="flex flex-col gap-6">
          <SeoSnapshot title={metaTitle} description={metaDescription} />

          <BlogHero
            post={{
              title,
              excerpt,
              coverImage: previewDraft.coverImage || previewDraft.ogImage || null,
              category: previewDraft.categoryNames[0] || null,
              publishedAt,
              readingTime: previewDraft.readingTime,
              authorName: previewDraft.authorName,
            }}
          />

          <TableOfContents content={previewDraft.content} />

          <article className="relative overflow-hidden rounded-md border bg-card p-6 shadow-sm sm:p-10">
            <MarkdownContent
              content={
                previewDraft.content.trim() ||
                "Start writing to see the post body render here."
              }
            />
            {previewDraft.isPremium ? <PremiumPreviewNotice /> : null}
          </article>
        </div>
      </div>
    </PreviewChrome>
  );
}

export function PageEditorialPreview({
  draft,
  className,
}: {
  draft: PagePreviewDraft;
  className?: string;
}) {
  const previewDraft = useDebounce(draft, 160);
  const title = previewDraft.title.trim() || "Untitled page";
  const description =
    previewDraft.excerpt.trim() ||
    "This page preview uses the same content presentation as the public site.";
  const metaTitle = previewDraft.metaTitle.trim() || title;
  const metaDescription = previewDraft.metaDescription.trim() || description;

  return (
    <PreviewChrome
      permalink={previewDraft.permalink}
      badges={
        <>
          <StatusBadge variant="info">
            {getEditorialStatusCopy(previewDraft.status)}
          </StatusBadge>
          {previewDraft.isHome ? (
            <Badge variant="outline" className="border-primary/20 text-primary">
              Homepage
            </Badge>
          ) : null}
        </>
      }
    >
      <div className={cn("w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8", className)}>
        <div className="flex flex-col gap-6">
          <SeoSnapshot title={metaTitle} description={metaDescription} />
          <PageContent
            title={title}
            description={description}
            content={
              previewDraft.content.trim() ||
              "Start writing to see the page body render here."
            }
          />
        </div>
      </div>
    </PreviewChrome>
  );
}
