<p align="center">
  <b>English</b> · <a href="./README.zh.md">中文</a>
</p>

<h1 align="center">MyBlog</h1>

<p align="center">
  <b>A modern personal tech blog built with React + Vite + Tailwind CSS</b>
</p>

<p align="center">
  <a href="#features">Features</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#getting-started">Getting Started</a> · <a href="#writing-posts">Writing Posts</a>
</p>

## Features

- ⚡ Vite 8 for instant dev server and optimized builds
- 🎨 Tailwind CSS v4 with dark mode support
- 📝 Markdown articles with syntax highlighting (react-syntax-highlighter)
- 🌐 Chinese/English language switching (localStorage-based)
- 📱 Fully responsive design
- 🚀 GitHub Pages deployment via GitHub Actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Markdown | react-markdown + remark-gfm |
| Code Highlight | react-syntax-highlighter (light build) |

## Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── content/posts/    # Markdown articles (*.md)
│   │   └── en/           # English articles
│   ├── i18n/             # Internationalization (zh/en)
│   ├── pages/            # Route pages
│   ├── services/         # Data layer (posts.ts)
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── vite.config.ts        # Vite configuration
└── vite-plugin-posts-index.ts  # Build-time index generator
```

## Getting Started

```bash
cd client
npm install
npm run dev      # Start dev server
npm run build    # Build for production
```

## Writing Posts

Create a Markdown file in `client/src/content/posts/`:

```markdown
---
title: "Your Post Title"
date: 2026-01-01
slug: your-post-slug
tags: [React, TypeScript]
category: Tech
excerpt: A brief description of your post.
lang: zh
---

# Your content here...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Post title |
| `date` | ✅ | Publication date (YYYY-MM-DD) |
| `slug` | ✅ | URL-friendly identifier |
| `tags` | ❌ | Array of tags |
| `category` | ❌ | Post category |
| `excerpt` | ❌ | Short description |
| `lang` | ❌ | Language: `zh` or `en` (default: `zh`) |
| `cover` | ❌ | Cover image URL |

## Deployment

### GitHub Pages

Push to `main` branch triggers automatic deployment via GitHub Actions.

### Vercel

1. Import repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Deploy

## License

[MIT](./LICENSE)
