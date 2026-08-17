import { z } from "zod";

export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity"] as const;
export const workspaceImageModes = ["none", "upload", "link_preview"] as const;
const workspaceImageUrlSchema = z.union([z.string().url().max(2048), z.string().regex(/^\/manus-storage\//).max(2048)]);

export const workspaceCardSchema = z.object({
  slot: z.enum(workspaceCardSlots),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().max(800),
  linkUrl: z.string().url().max(2048).nullable().optional(),
  imageUrl: workspaceImageUrlSchema.nullable().optional(),
  imageMode: z.enum(workspaceImageModes).default("none"),
  sortOrder: z.number().int().min(0).max(99).default(0),
  active: z.boolean().default(true),
});

/** A repeatable hover disclosure attached to a dashboard section. For new joiners, use eyebrow for department and title for job title. */
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

export type WorkspaceCardInput = z.infer<typeof workspaceCardSchema>;
export type WorkspaceHoverCardInput = z.infer<typeof workspaceHoverCardSchema>;
