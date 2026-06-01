import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

/* 初始化 dayjs 插件 */
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

/**
 * 动态切换 dayjs locale
 */
export function setDayjsLocale(lang: "zh" | "en") {
  dayjs.locale(lang === "zh" ? "zh-cn" : "en");
}

/**
 * 格式化日期为相对时间（如"3小时前" / "3 hours ago"）
 */
export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

/**
 * 格式化日期为绝对时间
 */
export function formatAbsoluteTime(
  date: string | Date,
  format: string = "YYYY年M月D日 HH:mm"
): string {
  return dayjs(date).format(format);
}

/**
 * 智能格式化日期：7天内显示相对时间，超过7天显示绝对时间
 */
export function formatSmartTime(date: string | Date, lang: "zh" | "en" = "zh"): string {
  const diffDays = dayjs().diff(dayjs(date), "day");
  if (diffDays < 7) {
    return formatRelativeTime(date);
  }
  if (lang === "en") {
    if (diffDays < 365) {
      return formatAbsoluteTime(date, "MMM D, HH:mm");
    }
    return formatAbsoluteTime(date, "MMM D, YYYY");
  }
  /* 中文格式 */
  if (diffDays < 365) {
    return formatAbsoluteTime(date, "M月D日 HH:mm");
  }
  return formatAbsoluteTime(date, "YYYY年M月D日");
}

/**
 * 格式化日期为简短格式
 */
export function formatShortDate(date: string | Date, lang: "zh" | "en" = "zh"): string {
  if (lang === "en") return dayjs(date).format("MMM D");
  return dayjs(date).format("M月D日");
}

export { dayjs };
