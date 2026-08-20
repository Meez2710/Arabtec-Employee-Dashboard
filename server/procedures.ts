import { TRPCError } from "@trpc/server";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { publicProcedure } from "./_core/trpc";
import { capabilityDeniedMessage, roleHasCapability, type WorkspaceCapability } from "./roles";

/**
 * Capability-guarded procedure.
 *
 * Authorisation is enforced here, on the server, for every mutation. The console
 * hides controls a role cannot use, but hiding is a courtesy — this is the check.
 */
export function capabilityProcedure(capability: WorkspaceCapability) {
  return publicProcedure.use(async opts => {
    const user = opts.ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    if (!roleHasCapability(user.role, capability)) {
      throw new TRPCError({ code: "FORBIDDEN", message: capabilityDeniedMessage(capability, user.role) });
    }
    return opts.next({ ctx: { ...opts.ctx, user } });
  });
}

export const consoleProcedure = capabilityProcedure("console.view");
export const contentWriteProcedure = capabilityProcedure("content.write");
export const contentPublishProcedure = capabilityProcedure("content.publish");
export const layoutProcedure = capabilityProcedure("layout.manage");
export const sectionsProcedure = capabilityProcedure("sections.manage");
export const peopleProcedure = capabilityProcedure("people.manage");
export const settingsProcedure = capabilityProcedure("settings.manage");
export const auditProcedure = capabilityProcedure("audit.view");
