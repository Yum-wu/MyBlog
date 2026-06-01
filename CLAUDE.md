# MyBlog 项目规范

## 构建命令

```bash
cd client
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npx tsc -b --noEmit  # 类型检查
```

## 项目架构

React 19 + Vite 8 + Tailwind CSS v4 SPA，部署到 GitHub Pages。

- 文章源码：`client/src/content/posts/*.md`（中文）、`client/src/content/posts/en/*.md`（英文）
- i18n：`client/src/i18n/locales/{zh,en}.ts`
- 数据层：`client/src/services/posts.ts`（读 index.json，详情用 slug-map.json）
- 构建插件：`client/vite-plugin-posts-index.ts`（生成 index.json + slug-map.json）

## 提交规则

- 推送前必须类型检查通过：`npx tsc -b --noEmit`
- 构建必须通过：`npm run build`
- CI 失败→立即修；部署未完成→等待
- 用 `gh run watch` 监控 CI

## Vite 注意事项

- Vite 8 + Rolldown：`import.meta.glob` 用 `query: "?raw"` 而不是 `as: "raw"`
- `modulePreload: false` 已禁用（避免预加载懒加载 chunk）
- highlight.js 用 light build + 按需注册语言（9 种），不用全量 build

## 文章 Frontmatter

```yaml
---
title: "标题"
date: 2026-01-01
slug: your-post-slug  # 必须与文件名一致
tags: [React, TypeScript]
category: 技术
excerpt: 摘要
lang: zh  # zh 或 en
---
```

## 自主纠错

- 简单任务：基于现有知识直接做
- 第 1 次失败 → 调整方案再做
- 第 2 次失败 → 强制搜索官方文档和高星项目
- 搜索结论存 memory，避免重复搜索
