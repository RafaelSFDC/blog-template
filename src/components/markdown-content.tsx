import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string | undefined | null
  className?: string
}

const styles = {
  h1: 'font-serif leading-[1.08] tracking-tight text-balance font-extrabold mb-6 text-4xl text-foreground',
  h2: 'font-serif leading-[1.08] tracking-tight text-balance font-extrabold mb-4 text-3xl text-foreground',
  h3: 'mb-3 text-xl font-bold text-foreground',
  p: 'mb-4 leading-relaxed text-muted-foreground',
  a: 'text-primary underline-offset-4 hover:underline',
  ul: 'mb-4 list-disc space-y-2 pl-6 text-muted-foreground',
  ol: 'mb-4 list-decimal space-y-2 pl-6 text-muted-foreground',
  li: 'leading-relaxed',
  blockquote: 'my-4 border-l-4 border-primary pl-4 italic text-muted-foreground',
  code: 'rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-primary',
  pre: 'mb-4 overflow-x-auto rounded-lg border border-border bg-muted p-4',
  table: 'w-full border-collapse mb-4',
  th: 'border border-border bg-muted p-2 text-left text-foreground',
  td: 'border border-border p-2 text-muted-foreground',
  img: 'max-w-full h-auto rounded-lg my-4',
  hr: 'my-8 border-border',
  strong: 'font-semibold text-foreground',
}

export function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  if (!content) return null

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              className={styles.a}
              target={
                href?.startsWith('http://') || href?.startsWith('https://')
                  ? '_blank'
                  : undefined
              }
              rel={
                href?.startsWith('http://') || href?.startsWith('https://')
                  ? 'noopener noreferrer'
                  : undefined
              }
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),
          code: ({ className, children }) => {
            const isCodeBlock = className?.includes('language-')
            if (isCodeBlock) {
              return (
                <pre className={styles.pre}>
                  <code className="text-sm font-mono text-muted-foreground">
                    {children}
                  </code>
                </pre>
              )
            }
            return <code className={styles.code}>{children}</code>
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <table className={styles.table}>{children}</table>
          ),
          th: ({ children }) => <th className={styles.th}>{children}</th>,
          td: ({ children }) => <td className={styles.td}>{children}</td>,
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              width={1200}
              height={675}
              loading="lazy"
              className={styles.img}
            />
          ),
          hr: () => <hr className={styles.hr} />,
          strong: ({ children }) => (
            <strong className={styles.strong}>{children}</strong>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
