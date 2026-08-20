import type { WorkspaceLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";
import { cairoHour, formatCairoDate, WORKSPACE_TIME_ZONE } from "@shared/workspaceTime";

export type WorkspaceSlot =
  | "announcement" | "week_ahead" | "new_joiner" | "company_news"
  | "activity" | "industry_watch" | "opportunity" | "resource";

export type CardSize = "1x1" | "2x1" | "1x2";
export type Severity = "normal" | "important" | "critical";
export type ResourceType = "policy" | "form" | "handbook" | "template" | "contact";

/** The shape the employee surfaces consume, whether from the API or a console preview. */
export type WorkspaceItem = {
  id: number;
  slot: WorkspaceSlot;
  eyebrow: string;
  title: string;
  body: string;
  eyebrowAr?: string | null;
  titleAr?: string | null;
  bodyAr?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageAltAr?: string | null;
  cardSize?: CardSize;
  sortOrder?: number;
  severity?: Severity;
  requiresAck?: number | boolean;
  eventStart?: Date | string | null;
  eventEnd?: Date | string | null;
  location?: string | null;
  locationAr?: string | null;
  functionArea?: string | null;
  functionAreaAr?: string | null;
  closingDate?: Date | string | null;
  sourceName?: string | null;
  sourceNameAr?: string | null;
  resourceType?: ResourceType | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

/** The item as one locale sees it, with an honest flag when Arabic is missing. */
export type LocalisedItem = {
  id: number;
  slot: WorkspaceSlot;
  eyebrow: string;
  title: string;
  body: string;
  imageAlt: string | null;
  location: string | null;
  functionArea: string | null;
  sourceName: string | null;
  translationPending: boolean;
  source: WorkspaceItem;
};

const trimmed = (value?: string | null) => (typeof value === "string" && value.trim() ? value.trim() : null);

/**
 * Arabic falls back to English rather than rendering blank, and says so.
 * A blank card is worse than an English one; silence is the failure mode we removed.
 */
export function localiseItem(item: WorkspaceItem, locale: WorkspaceLocale): LocalisedItem {
  if (locale === "en") {
    return {
      id: item.id, slot: item.slot, eyebrow: item.eyebrow, title: item.title, body: item.body,
      imageAlt: trimmed(item.imageAlt),
      location: trimmed(item.location), functionArea: trimmed(item.functionArea), sourceName: trimmed(item.sourceName),
      translationPending: false, source: item,
    };
  }
  const titleAr = trimmed(item.titleAr);
  const bodyAr = trimmed(item.bodyAr);
  return {
    id: item.id,
    slot: item.slot,
    eyebrow: trimmed(item.eyebrowAr) ?? item.eyebrow,
    title: titleAr ?? item.title,
    body: bodyAr ?? item.body,
    imageAlt: trimmed(item.imageAltAr) ?? trimmed(item.imageAlt),
    location: trimmed(item.locationAr) ?? trimmed(item.location),
    functionArea: trimmed(item.functionAreaAr) ?? trimmed(item.functionArea),
    sourceName: trimmed(item.sourceNameAr) ?? trimmed(item.sourceName),
    translationPending: !titleAr || !bodyAr,
    source: item,
  };
}

export function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: Date | string | null | undefined, locale: WorkspaceLocale, options?: Intl.DateTimeFormatOptions): string | null {
  const date = toDate(value);
  return date ? formatCairoDate(date, locale, options) : null;
}

export function formatDateTime(value: Date | string | null | undefined, locale: WorkspaceLocale): string | null {
  return formatDate(value, locale, { dateStyle: "medium", timeStyle: "short" });
}

/** "Updated 3 minutes ago" style stamp, always resolved against Cairo. */
export function formatRelative(value: Date | string | null | undefined, locale: WorkspaceLocale): string | null {
  const date = toDate(value);
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return relative.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return relative.format(-days, "day");
  return formatCairoDate(date, locale, { dateStyle: "medium" });
}

export function sectionLabel(slot: WorkspaceSlot, locale: WorkspaceLocale): string {
  return copy.sections[slot]?.[locale] ?? slot.replace(/_/g, " ");
}

export function severityOf(item: WorkspaceItem): Severity {
  return item.severity ?? "normal";
}

export function requiresAcknowledgement(item: WorkspaceItem): boolean {
  return item.requiresAck === 1 || item.requiresAck === true;
}

/** Items that should interrupt the reader: critical, or explicitly asking for acknowledgement. */
export function isActionable(item: WorkspaceItem): boolean {
  return severityOf(item) === "critical" || requiresAcknowledgement(item);
}

export function sizeClass(item: WorkspaceItem): string {
  const size = item.cardSize ?? "1x1";
  return size === "2x1" ? "is-2x1" : size === "1x2" ? "is-1x2" : "is-1x1";
}

/** The date this item is "about", which differs by template. */
export function primaryDate(item: WorkspaceItem): Date | null {
  return toDate(item.eventStart) ?? toDate(item.publishedAt) ?? toDate(item.createdAt);
}

/**
 * Home order is the order an admin arranged in the layout composer.
 * Recency only breaks ties, so saving a layout actually changes the page.
 */
export function sortByLayout(a: WorkspaceItem, b: WorkspaceItem): number {
  const bySlot = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  return bySlot !== 0 ? bySlot : sortByRecency(a, b);
}

export function sortByRecency(a: WorkspaceItem, b: WorkspaceItem): number {
  const left = toDate(a.publishedAt) ?? toDate(a.createdAt);
  const right = toDate(b.publishedAt) ?? toDate(b.createdAt);
  return (right?.getTime() ?? 0) - (left?.getTime() ?? 0);
}

export function matchesQuery(item: LocalisedItem, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [item.eyebrow, item.title, item.body, item.source.location, item.source.sourceName, item.source.functionArea]
    .filter(Boolean).join(" ").toLocaleLowerCase();
  return haystack.includes(query.trim().toLocaleLowerCase());
}

/** Links that leave the intranet get an explicit affordance rather than a surprise. */
export function isExternal(url?: string | null): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export { WORKSPACE_TIME_ZONE };

/**
 * Impersonal, time-of-day greeting plus the Cairo date.
 * Deliberately not personalised: Workspace V1 has no authenticated employee profile,
 * and an invented name is worse than none.
 */
export function formatCairoGreeting(locale: WorkspaceLocale, now: Date = new Date()): { greeting: string; dateLabel: string } {
  const hour = cairoHour(now);
  const greeting = hour < 12 ? copy.home.goodMorning[locale] : hour < 18 ? copy.home.goodAfternoon[locale] : copy.home.goodEvening[locale];
  return { greeting, dateLabel: formatCairoDate(now, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
}
