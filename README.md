# ✨ Lumina - Premium Blog Template

A premium, high-performance blog template built with **TanStack Start**, **Drizzle ORM**, and **Tailwind CSS**.

![Blog Hero](/demo-neon.svg)

## ✨ Features

- **🚀 Performance-First**: Built with TanStack Start for lightning-fast SSR and streaming.
- 🎨 Premium Design: Modern, responsive UI with "Lumina" elegant aesthetics.
- **📝 Markdown Support**: Write your posts in Markdown with full GFM support.
- **🗄️ Database-Backed**: Simple and robust SQLite/Drizzle ORM integration.
- **🔐 Authentication**: Better Auth pre-configured for future admin dashboard expansion.
- **🌗 Dark Mode**: Full Dark/Light mode support with `next-themes`.
- **📱 Responsive**: Perfectly optimized for mobile, tablet, and desktop.

## 🛠️ Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file (copy from `.env.example`):

```bash
DATABASE_URL="sqlite.db"
BETTER_AUTH_SECRET="your_secret_here"
```

### 3. Database Setup

Seed the database with sample posts:

```bash
pnpm tsx seed.ts
```

### 4. Run Development Server

```bash
pnpm dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to see your blog in action!

### Local Media Development

- `pnpm dev` uses local uploads by default when the Cloudflare `STORAGE` binding is not present.
- `pnpm dev:cf` is the path for validating Cloudflare bindings like D1 and R2 in the Worker runtime.
- `R2_PUBLIC_URL` is optional. If absent, media can still be served through `/api/media/:filename`.

### SEO Settings

The dashboard settings page now controls:

- public `siteUrl`
- default meta title and description
- default Open Graph image
- robots indexing toggle
- optional Twitter/X handle

## 📖 Project Structure

- `src/routes`: File-based routing (Home, Blog List, Post Details).
- `src/components`: Reusable UI components (PostCard, MarkdownRenderer).
- `src/db`: Database schema and Drizzle configuration.
- `src/styles.css`: Global styles and design tokens.

## 📄 License

This project is open-source and available under the MIT License.
