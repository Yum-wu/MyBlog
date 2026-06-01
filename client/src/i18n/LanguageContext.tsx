import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import zh from "./locales/zh";
import en from "./locales/en";
import type { Locale } from "./locales/zh";

export type Lang = "zh" | "en";

const STORAGE_KEY = "blog-lang";

const locales: Record<Lang, Locale> = { zh, en };

function getInitialLang(): Lang {
  /* 1. localStorage 优先 */
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;
  /* 2. 浏览器语言 */
  if (navigator.language.startsWith("zh")) return "zh";
  return "en";
}

export interface LanguageContextValue {
  lang: Lang;
  locale: Locale;
  setLang: (lang: Lang) => void;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: "zh",
  locale: zh,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    document.documentElement.lang = newLang === "zh" ? "zh-CN" : "en";
  }, []);

  /* 初始化时同步 HTML lang 属性 */
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, locale: locales[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
