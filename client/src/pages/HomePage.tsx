import { useEffect, useState } from "react";
import PostList from "../components/post/PostList";
import * as postService from "../services/posts";
import type { PostListItem } from "../types";
import { useTranslation } from "../i18n/useTranslation";

/**
 * 首页
 */
export default function HomePage() {
  const { t, lang } = useTranslation();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    postService.getPosts(lang).then((res) => {
      setPosts(res.items);
      setLoading(false);
    });
  }, [lang]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("home.title")}
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {t("home.subtitle")}
        </p>
      </div>

      <PostList
        posts={posts}
        loading={loading}
      />
    </div>
  );
}
