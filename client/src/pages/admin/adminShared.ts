import type { WorkspaceCapability } from "@shared/workspaceCapabilities";
import type { CardSize, ResourceType, Severity, WorkspaceSlot } from "@/lib/workspaceContent";

export const slots: WorkspaceSlot[] = ["announcement", "week_ahead", "new_joiner", "company_news", "activity", "industry_watch", "opportunity", "resource"];
export const cardSizes: CardSize[] = ["1x1", "2x1", "1x2"];
export const severities: Severity[] = ["normal", "important", "critical"];
export const resourceTypes: ResourceType[] = ["policy", "form", "handbook", "template", "contact"];

export type Status = "draft" | "in_review" | "approved" | "scheduled" | "published" | "unpublished" | "archived";

export type EditorDraft = {
  id?: number;
  slot: WorkspaceSlot;
  eyebrow: string; title: string; body: string;
  eyebrowAr: string; titleAr: string; bodyAr: string;
  linkUrl: string; imageUrl: string; imageAlt: string; imageAltAr: string;
  imageMode: "none" | "upload" | "link_preview";
  cardSize: CardSize;
  severity: Severity;
  requiresAck: boolean;
  eventStart: string; eventEnd: string;
  location: string; locationAr: string;
  functionArea: string; functionAreaAr: string;
  closingDate: string;
  sourceName: string; sourceNameAr: string;
  resourceType: ResourceType | "";
  sortOrder: number;
  status: Status;
  scheduledFor: string; expiresAt: string; reviewBy: string;
  ownerUserId: number | null;
};

export const blankDraft = (): EditorDraft => ({
  slot: "announcement",
  eyebrow: "", title: "", body: "",
  eyebrowAr: "", titleAr: "", bodyAr: "",
  linkUrl: "", imageUrl: "", imageAlt: "", imageAltAr: "",
  imageMode: "none", cardSize: "1x1", severity: "normal", requiresAck: false,
  eventStart: "", eventEnd: "", location: "", locationAr: "", functionArea: "", functionAreaAr: "",
  closingDate: "", sourceName: "", sourceNameAr: "", resourceType: "", sortOrder: 0, status: "draft",
  scheduledFor: "", expiresAt: "", reviewBy: "", ownerUserId: null,
});

/** If the editor leaves the short tag empty, use the section name so the server still receives a value. */
export function resolvedEyebrow(eyebrow: string, sectionLabel: string) {
  const trimmed = eyebrow.trim();
  return trimmed || sectionLabel.trim() || "Update";
}

/**
 * `datetime-local` inputs are timezone-naive. The console runs on Cairo time, so
 * we render the Cairo wall clock into the input and read it back as Cairo.
 */
const cairoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

export function toDateInput(value?: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = cairoFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${String(Number(read("hour")) % 24).padStart(2, "0")}:${read("minute")}`;
}

/** Matches exactly what a `datetime-local` control produces. */
const dateInputPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function fromDateInput(value: string): Date | null {
  if (!value || !dateInputPattern.test(value)) return null;
  const naive = new Date(`${value}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;
  const probe = new Date(naive.getTime());
  const offset = offsetMinutesAt(probe);
  const corrected = new Date(naive.getTime() - offset * 60000);
  const settled = new Date(naive.getTime() - offsetMinutesAt(corrected) * 60000);
  return settled;
}

function offsetMinutesAt(date: Date): number {
  const parts = cairoFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour") % 24, read("minute"), 0);
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

export const statusLabel = (status: string) => status.replace(/_/g, " ");
export const slotLabel = (slot: string) => slot.replace(/_/g, " ");

export function statusTone(status: string): "neutral" | "success" | "info" | "important" {
  if (status === "published") return "success";
  if (status === "scheduled" || status === "in_review") return "important";
  if (status === "approved") return "info";
  return "neutral";
}

export type ConsoleSection = "overview" | "content" | "layout" | "media" | "people" | "sections" | "audit" | "settings";

export const consoleSections: Array<{ key: ConsoleSection; label: string; capability: WorkspaceCapability }> = [
  { key: "overview", label: "Overview", capability: "console.view" },
  { key: "content", label: "Content", capability: "console.view" },
  { key: "layout", label: "Layout", capability: "layout.manage" },
  { key: "media", label: "Media", capability: "console.view" },
  { key: "sections", label: "Sections", capability: "sections.manage" },
  { key: "people", label: "People & access", capability: "people.manage" },
  { key: "audit", label: "Audit log", capability: "audit.view" },
  { key: "settings", label: "Settings", capability: "settings.manage" },
];
