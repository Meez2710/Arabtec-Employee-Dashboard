import { z } from "zod";

export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity"] as const;
export const workspaceImageModes = ["none", "upload", "link_preview"] as const;

export const workspaceCardSchema = z.object({
  slot: z.enum(workspaceCardSlots),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().max(800),
  linkUrl: z.string().url().max(2048).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  imageMode: z.enum(workspaceImageModes).default("none"),
  sortOrder: z.number().int().min(0).max(99).default(0),
  active: z.boolean().default(true),
});

export const workspaceImageUploadSchema = z.object({
  filename: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(64).max(7_000_000),
});

export type WorkspaceCardInput = z.infer<typeof workspaceCardSchema>;
