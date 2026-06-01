import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { getPostBySlug } from "../services/posts";
import type { Post } from "../types";
import { Spinner } from "../components/common/Loading";
import { formatSmartTime } from "../utils/formatDate";
import { useTranslation } from "../i18n/useTranslation";

/* ===== 语法高亮 — 按需动态加载（只注册 10 种语言，~200KB vs 原 1725KB） ===== */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let highlighterModule: any = null;
let highlighterStyle: Record<string, React.CSSProperties> | null = null;

/** 只注册博客实际用到的语言 */
async function loadHighlighter() {
  if (highlighterModule) return;

  const [lightMod, styleMod] = await Promise.all([
    import("react-syntax-highlighter/dist/esm/light"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);

  const Prism = lightMod.default;

  // 按需注册语言（总数 ~10 种，vs 全量 290+）
  const langs = await Promise.all([
    import("react-syntax-highlighter/dist/esm/languages/prism/python"),
    import("react-syntax-highlighter/dist/esm/languages/prism/typescript"),
    import("react-syntax-highlighter/dist/esm/languages/prism/javascript"),
    import("react-syntax-highlighter/dist/esm/languages/prism/bash"),
    import("react-syntax-highlighter/dist/esm/languages/prism/yaml"),
    import("react-syntax-highlighter/dist/esm/languages/prism/json"),
    import("react-syntax-highlighter/dist/esm/languages/prism/sql"),
    import("react-syntax-highlighter/dist/esm/languages/prism/docker"),
    import("react-syntax-highlighter/dist/esm/languages/prism/markup"),
  ]);

  for (const mod of langs) {
    Prism.registerLanguage(mod.default.name, mod.default);
  }

  highlighterModule = Prism;
  highlighterStyle = styleMod.oneDark;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [ready, setReady] = useState(highlighterModule !== null);

  useEffect(() => {
    if (highlighterModule) return;
    let cancelled = false;
    loadHighlighter().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  if (!ready || !highlighterModule || !highlighterStyle) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-200">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <highlighterModule language={language || "text"} style={highlighterStyle}>
      {code}
    </highlighterModule>
  );
}

/**
 * Markdown 渲染器组件
 */
function MarkdownContent({ content }: { content: string }) {
  const components: Components = useMemo(
    () => ({
      code(props) {
        const { children, className, ...rest } = props;
        const match = /language-(\w+)/.exec(className || "");
        const codeStr = String(children).replace(/\n$/, "");
        if (match) {
          return <CodeBlock language={match[1]} code={codeStr} />;
        }
        return (
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-pink-600 dark:bg-neutral-800 dark:text-pink-400" {...rest}>
            {children}
          </code>
        );
      },
    }),
    [],
  );

  return (
    <article
      className="prose prose-neutral dark:prose-invert max-w-none"
      translate="no"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}

/**
 * 文章详情页
 */
export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useTranslation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPostBySlug(slug, lang).then(({ data }) => {
      setPost(data);
      setLoading(false);
    });
  }, [slug, lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="md" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-2 text-neutral-500">{t("notFound.description")}</p>
        <Link to="/" className="mt-6 inline-block text-primary-600 hover:underline">
          {t("notFound.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <time dateTime={post.created_at}>{formatSmartTime(post.created_at, lang)}</time>
          {post.category && (
            <>
              <span>·</span>
              <span>{post.category.name}</span>
            </>
          )}
        </div>
        {post.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag: { id: string; name: string }) => (
              <span
                key={tag.id}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <MarkdownContent content={post.content} />
    </div>
  );
}
