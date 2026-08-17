import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyDigestEntries, dailyDigests, type InsertUser, users, workspaceCards, workspaceHoverCards } from "../drizzle/schema";
import type { DailyDigestDraftInput } from "./digestSchemas";
import type { WorkspaceCardInput, WorkspaceHoverCardInput } from "./workspaceSchemas";
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

export async function listWorkspaceCards() {
  const db = await getDb();
  if (!db) return [];
  const cards = await db.select().from(workspaceCards).orderBy(asc(workspaceCards.sortOrder));
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

export async function listWorkspaceHoverCards() {
  const db = await getDb();
  if (!db) return [];
  const cards = await db.select().from(workspaceHoverCards).orderBy(asc(workspaceHoverCards.parentSlot), asc(workspaceHoverCards.sortOrder));
  return cards.filter(card => card.active === 1);
}

export async function saveWorkspaceHoverCard(input: WorkspaceHoverCardInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { id, ...card } = input;
  const values = { ...card, linkUrl: card.linkUrl ?? null, imageUrl: card.imageUrl ?? null, active: card.active ? 1 : 0, updatedByUserId: userId };
  if (id) {
    await db.update(workspaceHoverCards).set(values).where(eq(workspaceHoverCards.id, id));
    return (await db.select().from(workspaceHoverCards).where(eq(workspaceHoverCards.id, id)).limit(1))[0];
  }
  const result = await db.insert(workspaceHoverCards).values(values);
  return (await db.select().from(workspaceHoverCards).where(eq(workspaceHoverCards.id, Number(result[0].insertId))).limit(1))[0];
}

export async function bulkSaveWorkspaceHoverCards(inputs: WorkspaceHoverCardInput[], userId: number) {
  const saved = [];
  for (const input of inputs) {
    const card = await saveWorkspaceHoverCard(input, userId);
    if (card) saved.push(card);
  }
  return saved;
}

export async function deleteWorkspaceHoverCard(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(workspaceHoverCards).where(eq(workspaceHoverCards.id, id));
  return true;
}

function currentDigestDate() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureDailyDigest() {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(dailyDigests).orderBy(desc(dailyDigests.updatedAt)).limit(1);
  return existing[0];
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
