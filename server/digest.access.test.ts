import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function contextFor(role: AuthenticatedUser["role"]): TrpcContext {
  return {
    user: {
      id: 11,
      openId: `role-${role}`,
      name: "Role check",
      email: "role@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("digest access control", () => {
  it("rejects a standard Workspace user before any digest data is accessed", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.digest.getCurrent()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
