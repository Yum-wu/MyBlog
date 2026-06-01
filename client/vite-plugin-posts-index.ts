import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  tags: string[];
  lang: string;
  cover?: string;
}

/* 解析 YAML frontmatter（复用 posts.ts 的简易解析） */
function parseFrontmatter(raw: string): Record<string, unknown> {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta: Record<string, unknown> = {};
  match[1].split("\n").forEach((line) => {
    const sep = line.indexOf(":");
    if (sep === -1) return;
    const key = line.slice(0, sep).trim();
    let val: unknown = line.slice(sep + 1).trim();
    if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));
    }
    if (typeof val === "string") val = val.replace(/^["']|["']$/g, "");
    meta[key] = val;
  });
  return meta;
}

/* 递归扫描 posts 目录（含 en/ 子目录），提取 frontmatter */
function scanPosts(postsDir: string): PostMeta[] {
  const posts: PostMeta[] = [];

  function walk(dir: string, lang: string) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        // 子目录视为该语言
        walk(fullPath, file);
      } else if (file.endsWith(".md")) {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const fm = parseFrontmatter(raw);
        posts.push({
          slug: (fm.slug as string) || file.replace(/\.md$/, ""),
          title: (fm.title as string) || "",
          date: (fm.date as string) || "",
          category: (fm.category as string) || "",
          excerpt: (fm.excerpt as string) || "",
          tags: Array.isArray(fm.tags)
            ? fm.tags
            : typeof fm.tags === "string"
              ? [fm.tags]
              : [],
          lang: (fm.lang as string) || lang,
          cover: (fm.cover as string) || undefined,
        });
      }
    }
  }

  walk(postsDir, "zh");
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

/* 将 posts 数据写入 index.json 和 slug-map.json */
function writeIndex(postsDir: string, posts: PostMeta[]) {
  const outPath = path.join(postsDir, "index.json");
  fs.writeFileSync(outPath, JSON.stringify(posts, null, 2), "utf-8");

  // slug → 相对路径映射（供详情页 O(1) 查找）
  const slugMap: Record<string, string> = {};

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith(".md")) {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const fm = parseFrontmatter(raw);
        const slug = (fm.slug as string) || file.replace(/\.md$/, "");
        // 存相对路径：en/xxx 或 xxx
        const rel = path.relative(postsDir, fullPath).replace(/\\/g, "/");
        slugMap[slug] = rel.replace(/\.md$/, "");
      }
    }
  }

  walk(postsDir);
  const mapPath = path.join(postsDir, "slug-map.json");
  fs.writeFileSync(mapPath, JSON.stringify(slugMap, null, 2), "utf-8");
}

/**
 * Vite 插件：构建时生成 posts/index.json + slug-map.json
 *
 * - buildStart / closeBundle：写入构建产物
 * - configureServer：dev 模式下 watch 文件变更自动重生成
 */
export function postsIndex(): Plugin {
  let postsDir: string;

  return {
    name: "posts-index",

    configResolved(config) {
      postsDir = path.resolve(config.root, "src/content/posts");
    },

    buildStart() {
      const posts = scanPosts(postsDir);
      writeIndex(postsDir, posts);
      console.log(`[posts-index] generated index.json (${posts.length} posts)`);
    },

    configureServer(server) {
      // dev 启动时先生成一次
      const posts = scanPosts(postsDir);
      writeIndex(postsDir, posts);
      console.log(`[posts-index] generated index.json (${posts.length} posts)`);

      // watch .md 文件变更（含子目录）
      server.watcher.add(path.join(postsDir, "**/*.md"));
      server.watcher.on("change", (filePath) => {
        if (!filePath.endsWith(".md")) return;
        const updated = scanPosts(postsDir);
        writeIndex(postsDir, updated);
        console.log(`[posts-index] regenerated index.json (${updated.length} posts)`);
      });
    },
  };
}
