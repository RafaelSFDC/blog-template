import { RichText } from './rich-text'
import { Quote } from './quote'

import type { IRichText } from './rich-text'
import type { IQuote } from './quote'

// Union type of all block types
export type Block = IRichText | IQuote

interface BlockRendererProps {
  blocks: Array<Block>
}

/**
 * BlockRenderer - Renders dynamic content blocks
 *
 * Usage:
 * ```tsx
 * <BlockRenderer blocks={article.blocks} />
 * ```
 */
export function BlockRenderer({ blocks }: Readonly<BlockRendererProps>) {
  if (!blocks || blocks.length === 0) return null

  const renderBlock = (block: Block) => {
    switch (block.__component) {
      case 'shared.rich-text':
        return <RichText {...block} />
      case 'shared.quote':
        return <Quote {...block} />
      default:
        // Log unknown block types in development
        console.warn('Unknown block type:', (block as any).__component)
        return null
    }
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <div key={`${block.__component}-${block.id}-${index}`}>
          {renderBlock(block)}
        </div>
      ))}
    </div>
  )
}
