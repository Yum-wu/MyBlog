import { useContext } from "react";
import { LanguageContext, type Lang } from "./LanguageContext";
import type { Locale } from "./locales/zh";

/**
 * 翻译 hook
 *
 * 用法：
 *   const { t, lang } = useTranslation();
 *   t("nav.home")        → "首页" / "Home"
 *   t("post.minutes")    → "分钟" / "min"
 */
export function useTranslation() {
  const { lang, locale, setLang } = useContext(LanguageContext);

  /**
   * 按 dot-path 从 locale 对象取值
   * 支持简单插值：t("key", { name: "xxx" }) → 替换 {name}
   */
  function t(key: string, params?: Record<string, string>): string {
    const parts = key.split(".");
    let val: unknown = locale;
    for (const p of parts) {
      if (val && typeof val === "object" && p in val) {
        val = (val as Record<string, unknown>)[p];
      } else {
        /* key 不存在时返回 key 本身（方便调试） */
        return key;
      }
    }
    let result = typeof val === "string" ? val : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
      }
    }
    return result;
  }

  return { t, lang, locale, setLang } as {
    t: (key: string, params?: Record<string, string>) => string;
    lang: Lang;
    locale: Locale;
    setLang: (lang: Lang) => void;
  };
}
