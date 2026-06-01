import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n/useTranslation";

/**
 * 页脚组件
 */
export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinkGroups = [
    {
      title: t("footer.nav"),
      links: [
        { label: t("nav.home"), href: "/" },
        { label: t("nav.posts"), href: "/posts" },
        { label: t("footer.aboutGroup"), href: "/categories" },
        { label: t("nav.tags"), href: "/tags" },
      ],
    },
    {
      title: t("footer.aboutGroup"),
      links: [
        { label: t("footer.aboutUs"), href: "/about" },
        { label: t("footer.contact"), href: "/contact" },
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
      ],
    },
    {
      title: t("footer.social"),
      links: [
        { label: "GitHub", href: "https://github.com" },
        { label: "Twitter", href: "https://twitter.com" },
        { label: t("footer.rss"), href: "/rss" },
      ],
    },
  ];

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===== 主要内容区域 ===== */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* 品牌信息 */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </span>
                <span className="text-gradient">MyBlog</span>
              </Link>
              <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
                {t("footer.brand")}
              </p>
            </div>

            {/* 链接分组 */}
            {footerLinkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 底部版权信息 ===== */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {currentYear} MyBlog. {t("footer.copyright")}
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {t("footer.builtWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
