import type { Lang } from "@/i18n";

export const fmtTime = (ms: number, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "th" ? "th-TH-u-ca-gregory" : "en-GB", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(ms));
