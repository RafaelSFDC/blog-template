# Setup Cloudflare

## Storage

- The official production media backend is the `STORAGE` R2 binding in `wrangler.jsonc`.
- Configure a public bucket domain with `R2_PUBLIC_URL` when you want direct CDN-style asset URLs.
- If `R2_PUBLIC_URL` is omitted, the app can still serve media through `/api/media/:filename`.

## SEO

Set these values in the dashboard settings before production launch:

- `siteUrl`
- default meta title
- default meta description
- default Open Graph image
- robots indexing enabled
- optional Twitter/X handle

These values are used by:

- root metadata
- canonical links
- category/tag archive pages
- `rss.xml`
- `sitemap.xml`
