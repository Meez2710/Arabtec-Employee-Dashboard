/**
 * Workspace V1 is intentionally impersonal until an authenticated employee identity exists.
 * The greeting is based only on the viewer's local time and the visible date.
 */
export function getWelcomeMessage(date: Date = new Date()) {
  const hour = date.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  return { greeting, dateLabel };
}
