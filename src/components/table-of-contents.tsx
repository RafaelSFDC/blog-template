import { useMemo } from "react";
import { Hash, List as ListIcon } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    // Basic regex to find H2 and H3 headings from markdown or simple HTML
    // This is a simplification; in a real scenario, you'd use a parser or DOM query
    const h2h3Regex = /<h([23])[^>]*>(.*?)<\/h[23]>|## (.*)|### (.*)/g;
    const foundHeadings: TOCItem[] = [];
    let match;

    while ((match = h2h3Regex.exec(content)) !== null) {
      const level = match[1] ? parseInt(match[1]) : match[3] ? 2 : 3;
      const text = (match[2] || match[3] || match[4] || "")
        .trim()
        .replace(/[*_#]/g, "");
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      if (text) {
        foundHeadings.push({ id, text, level });
      }
    }
    return foundHeadings;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="bg-card border shadow-sm rounded-md px-4 py-3 sm:px-6 ">
      <div className="mb-6 flex items-center gap-3 border-b border-border pb-4 text-foreground">
        <ListIcon className="h-5 w-5" />
        <h2 className="display-title text-xl font-bold tracking-tight">
          Neste artigo
        </h2>
      </div>
      <ul className="space-y-3">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 1.5}rem` }}
            className="group flex items-start gap-2"
          >
            <Hash className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-40 text-primary" />
            <a
              href={`#${heading.id}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
