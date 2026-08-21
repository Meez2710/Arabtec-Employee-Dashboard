import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = { openId: string; name: string };
export type AuthenticatedUser = User & { taskUid?: string; isCron?: boolean };

function requireSessionSecret() {
  if (ENV.cookieSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

class StandaloneSessionService {
  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}) {
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    return new SignJWT({ openId, name: options.name || "Workspace user" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
      .sign(requireSessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, requireSessionSecret(), { algorithms: ["HS256"] });
      if (typeof payload.openId !== "string" || typeof payload.name !== "string") return null;
      return { openId: payload.openId, name: payload.name };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
    const session = await this.verifySession(token);
    if (!session) throw ForbiddenError("Invalid session cookie");
    const user = await db.getUserByOpenId(session.openId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
}

export const sdk = new StandaloneSessionService();
