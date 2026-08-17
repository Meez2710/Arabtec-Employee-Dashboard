import { COOKIE_NAME } from "@shared/const";
import { dailyDigestDraftSchema, dailyDigestIdSchema } from "./digestSchemas";
import {
  getDailyDigestById,
  getCurrentDailyDigest,
  approveWorkspaceItem,
  archiveWorkspaceItem,
  bulkSaveWorkspaceHoverCards,
  deleteWorkspaceHoverCard,
  duplicateWorkspaceItem,
  getWorkspaceItemById,
  getWorkspaceItemHistory,
  listManagedWorkspaceItems,
  listWorkspaceOwners,
  listWorkspaceCards,
  listWorkspaceHoverCards,
  publishDailyDigest,
  publishWorkspaceItem,
  restoreWorkspaceItem,
  saveDailyDigestDraft,
  saveWorkspaceCard,
  saveWorkspaceItem,
  saveWorkspaceHoverCard,
  submitWorkspaceItemForReview,
  submitDailyDigestForReview,
  unpublishWorkspaceItem,
} from "./db";
import { canPerformDigestAction, digestTransitionMessage, type DigestAction, type DigestLifecycleStatus } from "./digestLifecycle";
import { canPerformWorkspaceAction, workspaceTransitionMessage, type WorkspaceContentAction, type WorkspaceContentStatus } from "./workspaceLifecycle";
import { isReviewReminderEmailConfigured } from "./reviewReminders";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, editorProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { resolveLinkPreview } from "./workspaceLinks";
import { workspaceCardSchema, workspaceEmployeeBulkSchema, workspaceHoverCardIdSchema, workspaceHoverCardSchema, workspaceImageUploadSchema, workspaceItemIdSchema, workspacePublishItemSchema } from "./workspaceSchemas";

function requireDigest<T>(digest: T | undefined): T {
  if (!digest) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Daily digest data is unavailable" });
  return digest;
}

async function requirePermittedDigestAction(id: number, action: DigestAction) {
  const digest = await getDailyDigestById(id);
  if (!digest) throw new TRPCError({ code: "NOT_FOUND", message: "Daily digest not found" });
  const status = digest.status as DigestLifecycleStatus;
  if (!canPerformDigestAction(status, action)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: digestTransitionMessage(status, action) });
  }
  return digest;
}

async function requirePermittedWorkspaceAction(id: number, action: WorkspaceContentAction) {
  const item = await getWorkspaceItemById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace item not found" });
  const status = item.status as WorkspaceContentStatus;
  if (!canPerformWorkspaceAction(status, action)) throw new TRPCError({ code: "BAD_REQUEST", message: workspaceTransitionMessage(status, action) });
  return item;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  digest: router({
    getCurrent: editorProcedure.query(async () => requireDigest(await getCurrentDailyDigest())),
    saveDraft: editorProcedure.input(dailyDigestDraftSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedDigestAction(input.id, "save");
      return requireDigest(await saveDailyDigestDraft(input, ctx.user.id));
    }),
    submitForReview: editorProcedure.input(dailyDigestIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedDigestAction(input.id, "submit");
      return requireDigest(await submitDailyDigestForReview(input.id, ctx.user.id));
    }),
    publish: adminProcedure.input(dailyDigestIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedDigestAction(input.id, "publish");
      return requireDigest(await publishDailyDigest(input.id, ctx.user.id));
    }),
  }),
  workspace: router({
    listCards: publicProcedure.query(() => listWorkspaceCards()),
    listHoverCards: publicProcedure.query(() => listWorkspaceHoverCards()),
    listManagedItems: adminProcedure.query(() => listManagedWorkspaceItems()),
    listOwners: adminProcedure.query(() => listWorkspaceOwners()),
    getReminderConfiguration: adminProcedure.query(() => ({ emailConfigured: isReviewReminderEmailConfigured(), sender: process.env.WORKSPACE_REMINDER_FROM ?? null })),
    getItemHistory: adminProcedure.input(workspaceItemIdSchema).query(({ input }) => getWorkspaceItemHistory(input.id)),
    saveItem: adminProcedure.input(workspaceCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) imageUrl = (await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null }))).imageUrl;
      return saveWorkspaceItem({ ...input, imageUrl }, ctx.user.id);
    }),
    publishItem: adminProcedure.input(workspacePublishItemSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "publish");
      return publishWorkspaceItem(input.id, ctx.user.id);
    }),
    unpublishItem: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "unpublish");
      return unpublishWorkspaceItem(input.id, ctx.user.id);
    }),
    archiveItem: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "archive");
      return archiveWorkspaceItem(input.id, ctx.user.id);
    }),
    restoreItem: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "restore");
      return restoreWorkspaceItem(input.id, ctx.user.id);
    }),
    duplicateItem: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "duplicate");
      return duplicateWorkspaceItem(input.id, ctx.user.id);
    }),
    submitItemForReview: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "submit");
      return submitWorkspaceItemForReview(input.id, ctx.user.id);
    }),
    approveItem: adminProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "approve");
      return approveWorkspaceItem(input.id, ctx.user.id);
    }),
    saveCard: adminProcedure.input(workspaceCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) {
        const preview = await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null, title: null }));
        imageUrl = preview.imageUrl;
      }
      return saveWorkspaceCard({ ...input, imageUrl }, ctx.user.id);
    }),
    saveHoverCard: adminProcedure.input(workspaceHoverCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) {
        const preview = await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null, title: null }));
        imageUrl = preview.imageUrl;
      }
      return saveWorkspaceHoverCard({ ...input, imageUrl }, ctx.user.id);
    }),
    bulkSaveEmployeeHoverCards: adminProcedure.input(workspaceEmployeeBulkSchema).mutation(async ({ ctx, input }) => {
      const cards: Array<{ clientId: string; card: Parameters<typeof saveWorkspaceHoverCard>[0] }> = [];
      const failures: Array<{ clientId: string; message: string }> = [];
      for (const inputCard of input.cards) {
        try {
          const { clientId, ...card } = inputCard;
          let imageUrl = card.imageUrl ?? null;
          if (card.imageMode === "link_preview" && card.linkUrl && !imageUrl) {
            const preview = await resolveLinkPreview(card.linkUrl).catch(() => ({ imageUrl: null, title: null }));
            imageUrl = preview.imageUrl;
          }
          cards.push({ clientId, card: { ...card, imageUrl } });
        } catch (error) {
          failures.push({ clientId: inputCard.clientId, message: error instanceof Error ? error.message : "Could not prepare this employee card." });
        }
      }
      const saved = [];
      for (const item of cards) {
        try {
          const card = await saveWorkspaceHoverCard(item.card, ctx.user.id);
          if (card) saved.push({ clientId: item.clientId, card });
          else failures.push({ clientId: item.clientId, message: "The employee card was not saved." });
        } catch (error) {
          failures.push({ clientId: item.clientId, message: error instanceof Error ? error.message : "The employee card could not be saved." });
        }
      }
      return { created: saved.length, cards: saved, failures };
    }),
    deleteHoverCard: adminProcedure.input(workspaceHoverCardIdSchema).mutation(({ input }) => deleteWorkspaceHoverCard(input.id)),
    uploadImage: adminProcedure.input(workspaceImageUploadSchema).mutation(async ({ ctx, input }) => {
      const raw = input.base64.replace(/^data:[^;]+;base64,/, "");
      const bytes = Buffer.from(raw, "base64");
      if (bytes.length > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Images must be 5 MB or smaller" });
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType === "image/png" ? "png" : "webp";
      return storagePut(`workspace-cards/${ctx.user.id}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}.${extension}`, bytes, input.mimeType);
    }),
  }),
});

export type AppRouter = typeof appRouter;
