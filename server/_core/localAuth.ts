import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request } from "express";
import { timingSafeEqual } from "node:crypto";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function sameSecret(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requestKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    const key = requestKey(req);
    const now = Date.now();
    const previous = attempts.get(key);
    const state = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : previous;
    if (state.count >= MAX_ATTEMPTS) {
      res.status(429).json({ error: "Too many sign-in attempts. Try again in 15 minutes." });
      return;
    }

    if (!ENV.adminEmail || !ENV.adminPassword) {
      res.status(503).json({ error: "Administrator login is not configured." });
      return;
    }

    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!sameSecret(email, ENV.adminEmail) || !sameSecret(password, ENV.adminPassword)) {
      attempts.set(key, { ...state, count: state.count + 1 });
      res.status(401).json({ error: "Incorrect email or password." });
      return;
    }

    attempts.delete(key);
    const openId = `local:${email}`;
    await db.upsertUser({
      openId,
      name: ENV.adminName,
      email,
      loginMethod: "password",
      role: "admin",
      lastSignedIn: new Date(),
    });
    const token = await sdk.createSessionToken(openId, { name: ENV.adminName, expiresInMs: ONE_YEAR_MS });
    res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
    res.json({ ok: true });
  });
}
