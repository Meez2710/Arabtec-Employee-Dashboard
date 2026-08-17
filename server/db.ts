import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyDigestEntries, dailyDigests, type InsertUser, users, workspaceCards } from "../drizzle/schema";
import type { DailyDigestDraftInput } from "./digestSchemas";
import type { WorkspaceCardInput } from "./workspaceSchemas";
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

const starterWorkspaceCards = [
  { slot: "new_joiner" as const, eyebrow: "New to Arabtec", title: "Mohamed Tarek", body: "Site Engineer · Project Delivery. Mohamed brings five years of construction and site-execution experience. Give him a warm Arabtec welcome.", linkUrl: null, imageUrl: "/manus-storage/arabtec-new-joiner-supporting_a59391ca.jpg", imageMode: "upload" as const, sortOrder: 0, active: 1 },
  { slot: "company_news" as const, eyebrow: "Project update", title: "Marina Tower reaches its next delivery milestone", body: "The delivery team has completed its next critical package and is preparing the handover sequence.", linkUrl: "https://www.arabtec.com", imageUrl: "/manus-storage/arabtec-onboarding-roadmap_05a4b024.jpg", imageMode: "upload" as const, sortOrder: 1, active: 1 },
  { slot: "announcement" as const, eyebrow: "Safety", title: "Updated site induction reminder", body: "Complete the updated induction reminder before Wednesday’s safety briefing.", linkUrl: null, imageUrl: null, imageMode: "none" as const, sortOrder: 2, active: 1 },
  { slot: "activity" as const, eyebrow: "Activities", title: "Employee Sports Day", body: "Building connections beyond the workplace.", linkUrl: null, imageUrl: "/manus-storage/arabtec-onboarding-community_f74340e9.jpg", imageMode: "upload" as const, sortOrder: 3, active: 1 },
  { slot: "industry_watch" as const, eyebrow: "Market intelligence", title: "Construction market outlook", body: "Relevant industry signals for project, commercial, and site teams.", linkUrl: "https://www.arabtec.com", imageUrl: null, imageMode: "none" as const, sortOrder: 4, active: 1 },
  { slot: "opportunity" as const, eyebrow: "Internal opportunity", title: "Planning Engineer", body: "Cairo · Projects · Internal move. Applications close 21 August.", linkUrl: null, imageUrl: null, imageMode: "none" as const, sortOrder: 5, active: 1 },
];

async function ensureWorkspaceCards() {
  const db = await getDb();
  if (!db) return [];
  const existing = await db.select().from(workspaceCards).limit(1);
  if (existing.length > 0) return db.select().from(workspaceCards).orderBy(asc(workspaceCards.sortOrder));
  await db.insert(workspaceCards).values(starterWorkspaceCards);
  return db.select().from(workspaceCards).orderBy(asc(workspaceCards.sortOrder));
}

export async function listWorkspaceCards() {
  const cards = await ensureWorkspaceCards();
  return cards.filter(card => card.active === 1);
}

export async function saveWorkspaceCard(input: WorkspaceCardInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const values = { ...input, linkUrl: input.linkUrl ?? null, imageUrl: input.imageUrl ?? null, active: input.active ? 1 : 0, updatedByUserId: userId };
  const existing = await db.select().from(workspaceCards).where(eq(workspaceCards.slot, input.slot)).limit(1);
  if (existing[0]) await db.update(workspaceCards).set(values).where(eq(workspaceCards.slot, input.slot));
  else await db.insert(workspaceCards).values(values);
  return (await db.select().from(workspaceCards).where(eq(workspaceCards.slot, input.slot)).limit(1))[0];
}

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
