import { type HTMLAttributes } from 'react'

interface StrapiImageProps extends HTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
  className?: string
}

export function StrapiImage({ src, alt, className, ...props }: StrapiImageProps) {
  if (!src) return null

  // If the src is a relative path from Strapi, you might need to prefix it with the Strapi URL
  // but for this template, we'll assume it's either absolute or handled by the loader.
  const imageUrl = src.startsWith('/') ? src : src

  return (
    <img
      src={imageUrl}
      alt={alt || ''}
      className={className}
      loading="lazy"
      {...props}
    />
  )
}
