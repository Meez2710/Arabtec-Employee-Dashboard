/**
 * Africa/Cairo is the Workspace's only business timezone.
 *
 * Every "today", "this week", "overdue", and "expired" decision is made in Cairo
 * regardless of where the viewer or the server sits, so that a site engineer in
 * Cairo and a reviewer abroad always agree on which calendar day it is.
 */
export const WORKSPACE_TIME_ZONE = "Africa/Cairo";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WORKSPACE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type CairoParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function cairoParts(date: Date): CairoParts {
  const parts = partsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value ?? "0");
  // Intl renders midnight as hour 24 in some engines; normalise it to 0.
  const hour = read("hour") % 24;
  return { year: read("year"), month: read("month"), day: read("day"), hour, minute: read("minute"), second: read("second") };
}

/** The Cairo calendar day of an instant, as `YYYY-MM-DD`. */
export function cairoDateKey(date: Date = new Date()): string {
  const { year, month, day } = cairoParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Offset of Africa/Cairo from UTC in minutes at the given instant (handles DST). */
export function cairoOffsetMinutes(date: Date = new Date()): number {
  const { year, month, day, hour, minute, second } = cairoParts(date);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** The instant at which the given Cairo calendar day begins. */
export function cairoStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = cairoParts(date);
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0);
  // Resolve the offset at the candidate instant, then correct once for a DST boundary.
  const firstGuess = new Date(naive - cairoOffsetMinutes(date) * 60000);
  const corrected = new Date(naive - cairoOffsetMinutes(firstGuess) * 60000);
  return corrected;
}

export function cairoEndOfDay(date: Date = new Date()): Date {
  return new Date(cairoStartOfDay(date).getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * The Cairo working week. Egypt's week runs Sunday to Saturday, so a briefing
 * published on Sunday morning covers Sunday through Saturday.
 */
export function cairoWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = cairoStartOfDay(date);
  const weekday = new Date(start.getTime() + cairoOffsetMinutes(start) * 60000).getUTCDay(); // 0 = Sunday
  const weekStart = new Date(start.getTime() - weekday * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start: weekStart, end: weekEnd };
}

/** True when the instant falls on the same Cairo calendar day as the reference. */
export function isSameCairoDay(a: Date, b: Date = new Date()): boolean {
  return cairoDateKey(a) === cairoDateKey(b);
}

export function isWithinCairoWeek(value: Date, reference: Date = new Date()): boolean {
  const { start, end } = cairoWeekRange(reference);
  return value.getTime() >= start.getTime() && value.getTime() <= end.getTime();
}

/** The hour of day in Cairo, 0-23. Drives the greeting so it matches the office, not the device. */
export function cairoHour(date: Date = new Date()): number {
  return cairoParts(date).hour;
}

/** Locale-aware date label rendered in Cairo, for both server and client use. */
export function formatCairoDate(value: Date, locale: "en" | "ar", options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  // Western Arabic numerals in the Arabic locale keep figures comparable across both views.
  const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  return new Intl.DateTimeFormat(tag, { timeZone: WORKSPACE_TIME_ZONE, ...options }).format(value);
}
