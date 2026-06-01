<h1 align="center">MyBlog</h1>

<p align="center">
  <b>A modern personal tech blog built with React + Vite + Tailwind CSS</b>
</p>

<p align="center">
  <a href="#features">Features</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#getting-started">Getting Started</a> · <a href="#writing-posts">Writing Posts</a>
</p>

---

<details open>
<summary><b>🇬🇧 English</b></summary>

A modern personal tech blog. All articles are managed as Markdown files with YAML frontmatter, deployed via GitHub Pages.

### Features

- ⚡ Vite 8 for instant dev server and optimized builds
- 🎨 Tailwind CSS v4 with dark mode support
- 📝 Markdown articles with syntax highlighting (react-syntax-highlighter)
- 🌐 Chinese/English language switching (localStorage-based)
- 📱 Fully responsive design
- 🚀 GitHub Pages deployment via GitHub Actions

### Getting Started

```bash
cd client
npm install
npm run dev      # Start dev server
npm run build    # Build for production
```

### Writing Posts

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

</details>

<details>
<summary><b>🇨🇳 中文</b></summary>

一个现代化的个人技术博客。所有文章以 Markdown 文件管理，使用 YAML frontmatter，部署在 GitHub Pages。

### 功能特性

- ⚡ Vite 8 极速开发服务器和优化构建
- 🎨 Tailwind CSS v4 暗色模式支持
- 📝 Markdown 文章 + 代码语法高亮（react-syntax-highlighter）
- 🌐 中英文语言切换（基于 localStorage）
- 📱 完全响应式设计
- 🚀 GitHub Actions 自动部署到 GitHub Pages

### 快速开始

```bash
cd client
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
```

### 撰写文章

在 `client/src/content/posts/` 下创建 Markdown 文件：

```markdown
---
title: "文章标题"
date: 2026-01-01
slug: your-post-slug
tags: [React, TypeScript]
category: 技术
excerpt: 文章摘要
lang: zh
---

# 正文内容...
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期 (YYYY-MM-DD) |
| `slug` | ✅ | URL 友好的标识符 |
| `tags` | ❌ | 标签数组 |
| `category` | ❌ | 文章分类 |
| `excerpt` | ❌ | 简短描述 |
| `lang` | ❌ | 语言：`zh` 或 `en`（默认 `zh`） |
| `cover` | ❌ | 封面图片 URL |

</details>

---

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

## Deployment

### GitHub Pages

Push to `main` branch triggers automatic deployment via GitHub Actions.

### Vercel

1. Import repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Deploy

## License

[MIT](./LICENSE)
