import { z } from "zod";

export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity", "week_ahead", "resource"] as const;
export const workspaceSlotDisplayOrder = ["announcement", "week_ahead", "new_joiner", "company_news", "activity", "industry_watch", "opportunity", "resource"] as const;
export const workspaceImageModes = ["none", "upload", "link_preview"] as const;
export const workspaceCardSizes = ["1x1", "2x1", "1x2"] as const;
export const workspaceSeverities = ["normal", "important", "critical"] as const;
export const workspaceResourceTypes = ["policy", "form", "handbook", "template", "contact"] as const;
export const workspaceContentStatuses = ["draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"] as const;

export type WorkspaceSlot = typeof workspaceCardSlots[number];

const workspaceImageUrlSchema = z.union([z.string().url().max(2048), z.string().regex(/^\/manus-storage\//).max(2048)]);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const workspaceCardSchema = z.object({
  id: z.number().int().positive().optional(),
  slot: z.enum(workspaceCardSlots),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().max(4000),
  eyebrowAr: optionalText(80),
  titleAr: optionalText(180),
  bodyAr: optionalText(4000),
  linkUrl: z.string().url().max(2048).nullable().optional(),
  imageUrl: workspaceImageUrlSchema.nullable().optional(),
  imageMode: z.enum(workspaceImageModes).default("none"),
  imageAlt: optionalText(220),
  imageAltAr: optionalText(220),
  cardSize: z.enum(workspaceCardSizes).default("1x1"),
  severity: z.enum(workspaceSeverities).default("normal"),
  requiresAck: z.boolean().default(false),
  eventStart: z.date().nullable().optional(),
  eventEnd: z.date().nullable().optional(),
  location: optionalText(160),
  locationAr: optionalText(160),
  functionArea: optionalText(120),
  functionAreaAr: optionalText(120),
  closingDate: z.date().nullable().optional(),
  sourceName: optionalText(160),
  sourceNameAr: optionalText(160),
  resourceType: z.enum(workspaceResourceTypes).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).default(0),
  active: z.boolean().default(true),
  status: z.enum(workspaceContentStatuses).default("draft"),
  scheduledFor: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  reviewBy: z.date().nullable().optional(),
  ownerUserId: z.number().int().positive().nullable().optional(),
});

export const workspaceItemIdSchema = z.object({ id: z.number().int().positive() });
export const workspacePublishItemSchema = workspaceItemIdSchema.extend({ confirmed: z.literal(true) });

// Publish gates live in shared/ so the console and the server enforce the same rules.
export { evaluatePublishReadiness, requiredFieldsBySlot } from "@shared/publishReadiness";
export type { PublishBlocker, PublishCandidate } from "@shared/publishReadiness";

/** A repeatable accessible disclosure attached to a dashboard section. */
export const workspaceHoverCardSchema = z.object({
  id: z.number().int().positive().optional(),
  parentSlot: z.enum(workspaceCardSlots),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().max(800),
  linkUrl: z.string().url().max(2048).nullable().optional(),
  imageUrl: workspaceImageUrlSchema.nullable().optional(),
  imageMode: z.enum(workspaceImageModes).default("none"),
  sortOrder: z.number().int().min(0).max(99).default(0),
  active: z.boolean().default(true),
});

export const workspaceHoverCardIdSchema = z.object({ id: z.number().int().positive() });
export const workspaceEmployeeBulkSchema = z.object({
  cards: z.array(workspaceHoverCardSchema.omit({ id: true }).extend({ clientId: z.string().uuid(), parentSlot: z.literal("new_joiner") })).min(1).max(25),
});

export const workspaceImageUploadSchema = z.object({
  filename: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(64).max(7_000_000),
});

export const workspaceLayoutSchema = z.object({
  items: z.array(z.object({
    id: z.number().int().positive(),
    sortOrder: z.number().int().min(0).max(99),
    cardSize: z.enum(workspaceCardSizes),
  })).max(200),
});

export const workspaceSectionSchema = z.object({
  slot: z.enum(workspaceCardSlots),
  labelEn: z.string().trim().min(1).max(80),
  labelAr: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
  defaultSize: z.enum(workspaceCardSizes),
  sortOrder: z.number().int().min(0).max(99),
});

export const workspaceRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["user", "viewer", "editor", "publisher", "admin"]),
});

export const workspaceBulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
  action: z.enum(["archive", "unpublish"]),
});

export type WorkspaceCardInput = z.infer<typeof workspaceCardSchema>;
export type WorkspaceHoverCardInput = z.infer<typeof workspaceHoverCardSchema>;
export type WorkspaceLayoutInput = z.infer<typeof workspaceLayoutSchema>;
export type WorkspaceSectionInput = z.infer<typeof workspaceSectionSchema>;
