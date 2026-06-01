import type { Post, PostListItem } from "../types";

/* ===== Vite 批量导入 Markdown 文章（仅用于详情页按需加载） ===== */
const modules = import.meta.glob("../content/posts/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

/* ===== slug → 文件路径映射（构建时由 vite-plugin-posts-index 生成） ===== */
let slugMap: Record<string, string> | null = null;

async function getSlugMap(): Promise<Record<string, string>> {
  if (slugMap) return slugMap;
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}content/posts/slug-map.json`);
    if (resp.ok) {
      slugMap = await resp.json();
      return slugMap!;
    }
  } catch { /* fallback */ }
  // fallback: 从 modules 推断
  slugMap = {};
  for (const [key] of Object.entries(modules)) {
    const parts = key.split("/");
    const fileName = parts[parts.length - 1].replace(/\.md$/, "");
    slugMap[fileName] = key.replace("../content/posts/", "").replace(/\.md$/, "");
  }
  return slugMap;
}

/* 解析 YAML frontmatter（统一 CRLF 换行符） */
function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };

  const frontmatter: Record<string, unknown> = {};
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
    frontmatter[key] = val;
  });

  return { frontmatter, content: match[2] };
}

/**
 * 获取所有文章列表 — 优先读 index.json（~1KB），fallback 全量解析
 */
export async function getPosts(lang: string = "zh"): Promise<{ items: PostListItem[] }> {
  // 优先从 index.json 获取（构建时生成，~1KB vs 全量 ~40KB）
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}content/posts/index.json`);
    if (resp.ok) {
      const allPosts: PostListItem[] = await resp.json();
      const filtered = lang === "all" ? allPosts : allPosts.filter((p) => p.lang === lang);
      return { items: filtered };
    }
  } catch { /* fallback: 从 modules 解析 */ }

  // fallback：全量解析（开发模式 index.json 未生成时）
  const entries = Object.entries(modules);
  const posts: PostListItem[] = [];

  for (const [, loader] of entries) {
    const raw = await loader();
    const { frontmatter } = parseFrontmatter(raw);
    const postLang = (frontmatter.lang as string) || "zh";
    if (lang !== "all" && postLang !== lang) continue;
    posts.push({
      id: frontmatter.slug as string,
      slug: frontmatter.slug as string,
      title: frontmatter.title as string,
      excerpt: (frontmatter.excerpt as string) || "",
      coverUrl: (frontmatter.cover as string) || undefined,
      category: (frontmatter.category as string) || "未分类",
      tags: (frontmatter.tags as string[]) || [],
      author: { name: "MyBlog" },
      createdAt: frontmatter.date as string,
      viewCount: 0,
      readingTime: 0,
      lang: postLang,
    });
  }

  posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return { items: posts };
}

/**
 * 根据 slug 获取文章详情 — 通过 slug-map.json O(1) 查找
 */
export async function getPostBySlug(
  slug: string,
  lang: string = "zh",
): Promise<{ data: Post | null }> {
  const map = await getSlugMap();

  // 按语言优先选择文件路径
  let filePath: string | undefined;
  if (lang === "en") {
    // 优先找 en/ 目录下的版本
    const candidate = map[slug];
    if (candidate?.startsWith("en/")) {
      filePath = candidate;
    } else {
      // fallback: 遍历 modules 找 en/ 路径
      for (const [key] of Object.entries(modules)) {
        const parts = key.split("/");
        const fileName = parts[parts.length - 1].replace(/\.md$/, "");
        if (fileName === slug && key.includes("/en/")) {
          filePath = key.replace("../content/posts/", "").replace(/\.md$/, "");
          break;
        }
      }
    }
  } else {
    // zh：优先根目录（非 en/）版本
    const candidate = map[slug];
    if (candidate && !candidate.startsWith("en/")) {
      filePath = candidate;
    } else {
      // fallback
      for (const [key] of Object.entries(modules)) {
        const parts = key.split("/");
        const fileName = parts[parts.length - 1].replace(/\.md$/, "");
        if (fileName === slug && !key.includes("/en/")) {
          filePath = key.replace("../content/posts/", "").replace(/\.md$/, "");
          break;
        }
      }
    }
  }

  if (!filePath) return { data: null };

  const key = `../content/posts/${filePath}.md`;
  const loader = modules[key];
  if (!loader) return { data: null };

  const raw = await loader();
  const { frontmatter, content } = parseFrontmatter(raw);

  return {
    data: {
      id: frontmatter.slug as string,
      slug: frontmatter.slug as string,
      title: frontmatter.title as string,
      content,
      excerpt: (frontmatter.excerpt as string) || "",
      cover_image: (frontmatter.cover as string) || null,
      category: { name: (frontmatter.category as string) || "未分类" },
      tags: ((frontmatter.tags as string[]) || []).map((t: string) => ({
        id: t,
        name: t,
      })),
      author: { username: "MyBlog", avatar: null },
      created_at: frontmatter.date as string,
      view_count: 0,
      author_id: 0,
    },
  };
}
