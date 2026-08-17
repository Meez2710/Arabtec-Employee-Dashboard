/**
 * Workspace V1 is intentionally impersonal until an authenticated employee identity exists.
 * The greeting is based only on the viewer's local time and the visible date.
 */
export function getWelcomeMessage(localeOrDate: "en" | "ar" | Date = "en", providedDate?: Date) {
  const locale = localeOrDate instanceof Date ? "en" : localeOrDate;
  const date = localeOrDate instanceof Date ? localeOrDate : providedDate ?? new Date();
  const hour = date.getHours();
  const greeting = locale === "ar"
    ? hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء الخير"
    : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  return { greeting, dateLabel };
}
