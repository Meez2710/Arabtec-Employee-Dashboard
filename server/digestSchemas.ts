import { z } from "zod";

export const digestAudienceSchema = z.enum(["employees", "owners", "joiners"]);

export const digestEntrySchema = z.object({
  category: z.string().trim().min(2).max(80),
  headline: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(3).max(360),
  audience: digestAudienceSchema,
  sortOrder: z.number().int().min(0).max(20),
});

export const dailyDigestDraftSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(5).max(140),
  introduction: z.string().trim().min(10).max(900),
  digestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledFor: z.coerce.date().nullable(),
  recipientCount: z.number().int().min(0).max(100_000),
  entries: z.array(digestEntrySchema).min(1).max(8),
});

export const dailyDigestIdSchema = z.object({
  id: z.number().int().positive(),
});

export type DailyDigestDraftInput = z.infer<typeof dailyDigestDraftSchema>;
