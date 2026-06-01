<p align="center">
  <a href="./README.md">English</a> · <b>中文</b>
</p>

<h1 align="center">MyBlog</h1>

<p align="center">
  <b>基于 React + Vite + Tailwind CSS 的现代个人技术博客</b>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> · <a href="#技术栈">技术栈</a> · <a href="#快速开始">快速开始</a> · <a href="#撰写文章">撰写文章</a>
</p>

## 功能特性

- ⚡ Vite 8 极速开发服务器和优化构建
- 🎨 Tailwind CSS v4 暗色模式支持
- 📝 Markdown 文章 + 代码语法高亮（react-syntax-highlighter）
- 🌐 中英文语言切换（基于 localStorage）
- 📱 完全响应式设计
- 🚀 GitHub Actions 自动部署到 GitHub Pages

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19 |
| 构建工具 | Vite 8 |
| 语言 | TypeScript 6 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| Markdown | react-markdown + remark-gfm |
| 代码高亮 | react-syntax-highlighter（精简版） |

## 项目结构

```
client/
├── src/
│   ├── components/       # 可复用 UI 组件
│   ├── content/posts/    # Markdown 文章 (*.md)
│   │   └── en/           # 英文文章
│   ├── i18n/             # 国际化 (zh/en)
│   ├── pages/            # 路由页面
│   ├── services/         # 数据层 (posts.ts)
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── vite.config.ts        # Vite 配置
└── vite-plugin-posts-index.ts  # 构建时索引生成器
```

## 快速开始

```bash
cd client
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
```

## 撰写文章

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

### Frontmatter 字段

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

## 部署

### GitHub Pages

推送到 `main` 分支，GitHub Actions 自动部署。

### Vercel

1. 在 [vercel.com](https://vercel.com) 导入仓库
2. 设置 **Root Directory** 为 `client`
3. 部署

## License

[MIT](./LICENSE)
