import Button from "../components/common/Button";
import { useTranslation } from "../i18n/useTranslation";

/**
 * 404 页面
 */
export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* 404 大字 */}
      <h1 className="text-8xl sm:text-9xl font-bold text-gradient">404</h1>

      {/* 提示文字 */}
      <h2 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {t("notFound.title")}
      </h2>
      <p className="mt-2 max-w-md text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {t("notFound.desc")}
      </p>

      {/* 操作按钮 */}
      <div className="mt-8 flex gap-3">
        <Button variant="primary" onClick={() => (window.location.href = "/")}>
          {t("notFound.backHome")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
        >
          {t("notFound.goBack")}
        </Button>
      </div>
    </div>
  );
}
