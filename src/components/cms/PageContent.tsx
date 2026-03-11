import { MarkdownContent } from "#/components/markdown-content";
import { SiteHeader } from "#/components/SiteHeader";

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

        <article className="bg-card border shadow-sm prose-lg rounded-md p-6 sm:p-12">
          <MarkdownContent content={content} />
        </article>
      </div>
    </main>
  );
}
