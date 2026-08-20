import { COOKIE_NAME } from "@shared/const";
import { dailyDigestDraftSchema, dailyDigestIdSchema } from "./digestSchemas";
import {
  acknowledgeWorkspaceItem,
  countWorkspaceAcknowledgements,
  getWorkspaceOverview,
  listAcknowledgedItemIds,
  listWorkspaceSections,
  saveWorkspaceLayout,
  saveWorkspaceSection,
  updateUserRole,
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
import { adminProcedure, editorProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { auditProcedure, consoleProcedure, contentPublishProcedure, contentWriteProcedure, layoutProcedure, peopleProcedure, sectionsProcedure } from "./procedures";
import { listAuditLog } from "./audit";
import { recordAudit } from "./audit";
import { roleCapabilities } from "./roles";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { resolveLinkPreview } from "./workspaceLinks";
import { evaluatePublishReadiness, workspaceBulkActionSchema, workspaceCardSchema, workspaceEmployeeBulkSchema, workspaceHoverCardIdSchema, workspaceHoverCardSchema, workspaceImageUploadSchema, workspaceItemIdSchema, workspaceLayoutSchema, workspacePublishItemSchema, workspaceRoleSchema, workspaceSectionSchema, type WorkspaceSlot } from "./workspaceSchemas";

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
    /* ---- Employee-facing (public) ---- */
    listCards: publicProcedure.query(() => listWorkspaceCards()),
    listHoverCards: publicProcedure.query(() => listWorkspaceHoverCards()),
    listSections: publicProcedure.query(() => listWorkspaceSections()),

    /* ---- Employee-facing (signed in) ---- */
    listAcknowledged: protectedProcedure.query(({ ctx }) => listAcknowledgedItemIds(ctx.user.id)),
    acknowledgeItem: protectedProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      const item = await getWorkspaceItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "That notice is no longer available." });
      if (item.requiresAck !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "That notice does not ask for acknowledgement." });
      // Acknowledging something the employee cannot see would be meaningless.
      const visible = await listWorkspaceCards();
      if (!visible.some(card => card.id === input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "That notice is no longer available." });
      await acknowledgeWorkspaceItem(input.id, ctx.user.id);
      return { acknowledged: true } as const;
    }),

    /* ---- Console: read ---- */
    getCapabilities: publicProcedure.query(({ ctx }) => ({ role: ctx.user?.role ?? null, capabilities: roleCapabilities(ctx.user?.role) })),
    getOverview: consoleProcedure.query(() => getWorkspaceOverview()),
    listManagedItems: consoleProcedure.query(() => listManagedWorkspaceItems()),
    listOwners: consoleProcedure.query(() => listWorkspaceOwners()),
    getReminderConfiguration: consoleProcedure.query(() => ({ emailConfigured: isReviewReminderEmailConfigured(), sender: process.env.WORKSPACE_REMINDER_FROM ?? null })),
    getItemHistory: consoleProcedure.input(workspaceItemIdSchema).query(({ input }) => getWorkspaceItemHistory(input.id)),
    getAcknowledgementCount: consoleProcedure.input(workspaceItemIdSchema).query(({ input }) => countWorkspaceAcknowledgements(input.id)),
    listAuditLog: auditProcedure.query(() => listAuditLog()),

    /* ---- Console: content ---- */
    saveItem: contentWriteProcedure.input(workspaceCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) imageUrl = (await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null }))).imageUrl;
      const before = input.id ? await getWorkspaceItemById(input.id) : null;
      const saved = await saveWorkspaceItem({ ...input, imageUrl }, ctx.user.id);
      await recordAudit({ entity: "workspace_card", entityId: saved?.id ?? null, action: input.id ? "content.updated" : "content.created", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `${input.id ? "Updated" : "Created"} “${input.title}”`, before, after: saved });
      return saved;
    }),
    publishItem: contentPublishProcedure.input(workspacePublishItemSchema).mutation(async ({ ctx, input }) => {
      const item = await requirePermittedWorkspaceAction(input.id, "publish");
      // The console mirrors these gates, but the server is what enforces them.
      const { blockers } = evaluatePublishReadiness({ ...item, slot: item.slot as WorkspaceSlot });
      if (blockers.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `This item is not ready to publish: ${blockers.map(blocker => blocker.message).join(" ")}` });
      }
      const published = await publishWorkspaceItem(input.id, ctx.user.id);
      await recordAudit({ entity: "workspace_card", entityId: input.id, action: published?.status === "scheduled" ? "content.scheduled" : "content.published", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `${published?.status === "scheduled" ? "Scheduled" : "Published"} “${item.title}”`, before: item, after: published });
      return published;
    }),
    unpublishItem: contentPublishProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      const item = await requirePermittedWorkspaceAction(input.id, "unpublish");
      const result = await unpublishWorkspaceItem(input.id, ctx.user.id);
      await recordAudit({ entity: "workspace_card", entityId: input.id, action: "content.unpublished", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Unpublished “${item.title}”`, before: item, after: result });
      return result;
    }),
    archiveItem: contentWriteProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      const item = await requirePermittedWorkspaceAction(input.id, "archive");
      const result = await archiveWorkspaceItem(input.id, ctx.user.id);
      await recordAudit({ entity: "workspace_card", entityId: input.id, action: "content.archived", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Archived “${item.title}”`, before: item, after: result });
      return result;
    }),
    restoreItem: contentWriteProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      const item = await requirePermittedWorkspaceAction(input.id, "restore");
      const result = await restoreWorkspaceItem(input.id, ctx.user.id);
      await recordAudit({ entity: "workspace_card", entityId: input.id, action: "content.restored", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Restored “${item.title}” as a draft`, before: item, after: result });
      return result;
    }),
    duplicateItem: contentWriteProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "duplicate");
      return duplicateWorkspaceItem(input.id, ctx.user.id);
    }),
    submitItemForReview: contentWriteProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "submit");
      return submitWorkspaceItemForReview(input.id, ctx.user.id);
    }),
    approveItem: contentPublishProcedure.input(workspaceItemIdSchema).mutation(async ({ ctx, input }) => {
      await requirePermittedWorkspaceAction(input.id, "approve");
      return approveWorkspaceItem(input.id, ctx.user.id);
    }),
    bulkAction: contentPublishProcedure.input(workspaceBulkActionSchema).mutation(async ({ ctx, input }) => {
      const applied: number[] = [];
      const skipped: Array<{ id: number; reason: string }> = [];
      for (const id of input.ids) {
        const item = await getWorkspaceItemById(id);
        if (!item) { skipped.push({ id, reason: "No longer available" }); continue; }
        if (!canPerformWorkspaceAction(item.status as WorkspaceContentStatus, input.action)) {
          skipped.push({ id, reason: workspaceTransitionMessage(item.status as WorkspaceContentStatus, input.action) });
          continue;
        }
        if (input.action === "archive") await archiveWorkspaceItem(id, ctx.user.id);
        else await unpublishWorkspaceItem(id, ctx.user.id);
        applied.push(id);
      }
      await recordAudit({ entity: "workspace_card", action: `content.bulk_${input.action}`, actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Bulk ${input.action} applied to ${applied.length} item${applied.length === 1 ? "" : "s"}` });
      return { applied, skipped };
    }),

    /* ---- Console: layout, sections, people ---- */
    saveLayout: layoutProcedure.input(workspaceLayoutSchema).mutation(async ({ ctx, input }) => {
      const updated = await saveWorkspaceLayout(input, ctx.user.id);
      await recordAudit({ entity: "layout", action: "layout.updated", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Reordered ${updated} card${updated === 1 ? "" : "s"} on the employee home` });
      return { updated };
    }),
    saveSection: sectionsProcedure.input(workspaceSectionSchema).mutation(async ({ ctx, input }) => {
      const result = await saveWorkspaceSection(input, ctx.user.id);
      await recordAudit({ entity: "section", action: "section.updated", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `${input.enabled ? "Enabled" : "Disabled"} the ${input.labelEn} section` });
      return result;
    }),
    setUserRole: peopleProcedure.input(workspaceRoleSchema).mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own access level. Ask another administrator." });
      }
      const result = await updateUserRole(input.userId, input.role);
      await recordAudit({ entity: "user", entityId: input.userId, action: "people.role_changed", actorUserId: ctx.user.id, actorLabel: ctx.user.name ?? ctx.user.email, summary: `Set access for account ${input.userId} to ${input.role}` });
      return result;
    }),

    /* ---- Legacy compatibility ---- */
    saveCard: contentWriteProcedure.input(workspaceCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) {
        const preview = await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null, title: null }));
        imageUrl = preview.imageUrl;
      }
      return saveWorkspaceCard({ ...input, imageUrl }, ctx.user.id);
    }),
    saveHoverCard: contentWriteProcedure.input(workspaceHoverCardSchema).mutation(async ({ ctx, input }) => {
      let imageUrl = input.imageUrl ?? null;
      if (input.imageMode === "link_preview" && input.linkUrl && !imageUrl) {
        const preview = await resolveLinkPreview(input.linkUrl).catch(() => ({ imageUrl: null, title: null }));
        imageUrl = preview.imageUrl;
      }
      return saveWorkspaceHoverCard({ ...input, imageUrl }, ctx.user.id);
    }),
    bulkSaveEmployeeHoverCards: contentWriteProcedure.input(workspaceEmployeeBulkSchema).mutation(async ({ ctx, input }) => {
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
    deleteHoverCard: contentWriteProcedure.input(workspaceHoverCardIdSchema).mutation(({ input }) => deleteWorkspaceHoverCard(input.id)),
    uploadImage: contentWriteProcedure.input(workspaceImageUploadSchema).mutation(async ({ ctx, input }) => {
      const raw = input.base64.replace(/^data:[^;]+;base64,/, "");
      const bytes = Buffer.from(raw, "base64");
      if (bytes.length > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Images must be 5 MB or smaller" });
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType === "image/png" ? "png" : "webp";
      return storagePut(`workspace-cards/${ctx.user.id}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}.${extension}`, bytes, input.mimeType);
    }),
  }),
});

export type AppRouter = typeof appRouter;
