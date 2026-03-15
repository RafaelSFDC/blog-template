import { SiteHeader } from "#/components/SiteHeader";
import { Paywall } from "#/components/blog/paywall";
import { Render } from "@puckeditor/core";
import { config } from "./puck.config";
import { MarkdownContent } from "#/components/markdown-content";
import { parsePuckData } from "#/lib/puck";

interface PageContentProps {
  title: string;
  description?: string | null;
  content: string;
  showPaywall?: boolean;
  onSubscribe?: () => void;
  isSubscribing?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}

export function PageContent({
  title,
  description,
  content,
  showPaywall = false,
  onSubscribe,
  isSubscribing = false,
  ctaHref,
  ctaLabel,
}: PageContentProps) {
  const puckData = parsePuckData(content);

  return (
    <main className="page-wrap pb-20 pt-10">
      <div className="flex flex-col gap-10">
        <SiteHeader
          title={title}
          description={
            description?.trim() ||
            "A custom page managed from the publication dashboard."
          }
        />

        <article
          className={
            puckData
              ? "w-full"
              : "bg-card border shadow-sm prose-lg rounded-md p-6 sm:p-12"
          }
        >
          {puckData ? (
            <Render config={config} data={puckData} />
          ) : (
            <MarkdownContent content={content} />
          )}
          {showPaywall ? (
            <Paywall
              onSubscribe={onSubscribe}
              isLoading={isSubscribing}
              ctaHref={ctaHref}
              ctaLabel={ctaLabel}
            />
          ) : null}
        </article>
      </div>
    </main>
  );
}
