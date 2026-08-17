import { COOKIE_NAME } from "@shared/const";
import { dailyDigestDraftSchema, dailyDigestIdSchema } from "./digestSchemas";
import {
  getDailyDigestById,
  getCurrentDailyDigest,
  deleteWorkspaceHoverCard,
  listWorkspaceCards,
  listWorkspaceHoverCards,
  publishDailyDigest,
  saveDailyDigestDraft,
  saveWorkspaceCard,
  saveWorkspaceHoverCard,
  submitDailyDigestForReview,
} from "./db";
import { canPerformDigestAction, digestTransitionMessage, type DigestAction, type DigestLifecycleStatus } from "./digestLifecycle";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, editorProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { resolveLinkPreview } from "./workspaceLinks";
import { workspaceCardSchema, workspaceHoverCardIdSchema, workspaceHoverCardSchema, workspaceImageUploadSchema } from "./workspaceSchemas";

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
