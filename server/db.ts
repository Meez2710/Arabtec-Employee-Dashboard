import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyDigestEntries, dailyDigests, type InsertUser, users } from "../drizzle/schema";
import type { DailyDigestDraftInput } from "./digestSchemas";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    if (user[field] === undefined) return;
    const normalized = user[field] ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const starterEntries = [
  {
    category: "People Ops",
    headline: "Four people join us this month",
    summary: "The welcome strip, role details, and first-week information are prepared for the Thursday digest.",
    audience: "employees" as const,
    sortOrder: 0,
  },
  {
    category: "Projects",
    headline: "Marina Tower reaches level 40",
    summary: "A concise progress note with the next safety and access milestones for site teams.",
    audience: "employees" as const,
    sortOrder: 1,
  },
  {
    category: "HSE",
    headline: "500 days without a lost-time incident",
    summary: "The milestone is included with a practical reminder about site induction and PPE readiness.",
    audience: "employees" as const,
    sortOrder: 2,
  },
];

function currentDigestDate() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureDailyDigest() {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(dailyDigests).orderBy(desc(dailyDigests.updatedAt)).limit(1);
  if (existing[0]) return existing[0];

  await db.insert(dailyDigests).values({
    digestDate: currentDigestDate(),
    title: "Thursday welcome digest",
    introduction: "Four incoming joiners, clear preparation actions, and a concise company update for the week ahead.",
    status: "draft",
    scheduledFor: new Date(new Date().setUTCHours(6, 0, 0, 0)),
    recipientCount: 382,
  });

  const digest = (await db.select().from(dailyDigests).orderBy(desc(dailyDigests.createdAt)).limit(1))[0];
  if (!digest) return undefined;
  await db.insert(dailyDigestEntries).values(starterEntries.map(entry => ({ ...entry, digestId: digest.id })));
  return digest;
}

export async function getCurrentDailyDigest() {
  const db = await getDb();
  if (!db) return undefined;
  const digest = await ensureDailyDigest();
  if (!digest) return undefined;
  const entries = await db.select().from(dailyDigestEntries).where(eq(dailyDigestEntries.digestId, digest.id)).orderBy(asc(dailyDigestEntries.sortOrder));
  return { ...digest, entries };
}

export async function getDailyDigestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyDigests).where(eq(dailyDigests.id, id)).limit(1);
  return result[0];
}

export async function saveDailyDigestDraft(input: DailyDigestDraftInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(dailyDigests).set({
    title: input.title,
    introduction: input.introduction,
    digestDate: input.digestDate,
    scheduledFor: input.scheduledFor,
    recipientCount: input.recipientCount,
    status: "draft",
    updatedByUserId: userId,
  }).where(eq(dailyDigests.id, input.id));

  await db.delete(dailyDigestEntries).where(eq(dailyDigestEntries.digestId, input.id));
  await db.insert(dailyDigestEntries).values(input.entries.map(entry => ({ ...entry, digestId: input.id })));
  return getCurrentDailyDigest();
}

export async function submitDailyDigestForReview(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(dailyDigests).set({ status: "in_review", updatedByUserId: userId }).where(eq(dailyDigests.id, id));
  return getCurrentDailyDigest();
}

export async function publishDailyDigest(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(dailyDigests).set({
    status: "published",
    publishedByUserId: userId,
    publishedAt: new Date(),
  }).where(eq(dailyDigests.id, id));
  return getCurrentDailyDigest();
}
