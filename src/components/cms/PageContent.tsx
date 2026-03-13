import { SiteHeader } from "#/components/SiteHeader";
import { Render } from "@puckeditor/core";
import { config } from "./puck.config";
import { MarkdownContent } from "#/components/markdown-content";

interface PageContentProps {
  title: string;
  description?: string | null;
  content: string;
}

export function PageContent({
  title,
  description,
  content,
}: PageContentProps) {
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

        <article className={(() => {
          const isPuck = content.startsWith('{"content":') || content.startsWith('{"root":');
          return isPuck ? "w-full" : "bg-card border shadow-sm prose-lg rounded-md p-6 sm:p-12";
        })()}>
          {(() => {
            const isPuck = content.startsWith('{"content":') || content.startsWith('{"root":');
            if (isPuck) {
              try {
                return <Render config={config} data={JSON.parse(content)} />;
              } catch (e) {
                return <div className="text-destructive p-4 border border-destructive rounded-md">Error rendering visual content: {String(e)}</div>;
              }
            }
            return <MarkdownContent content={content} />;
          })()}
        </article>
      </div>
    </main>
  );
}
