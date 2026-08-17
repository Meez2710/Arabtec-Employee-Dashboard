import { asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyDigestEntries, dailyDigests, type InsertUser, users, workspaceCards, workspaceContentHistory, workspaceHoverCards } from "../drizzle/schema";
import type { DailyDigestDraftInput } from "./digestSchemas";
import type { WorkspaceCardInput, WorkspaceHoverCardInput } from "./workspaceSchemas";
import { resolvePublishStatus, type WorkspaceContentAction, type WorkspaceContentStatus } from "./workspaceLifecycle";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
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
  textFields.forEach(field => { if (user[field] === undefined) return; const normalized = user[field] ?? null; values[field] = normalized; updateSet[field] = normalized; });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function listWorkspaceOwners() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).orderBy(asc(users.name));
}

function isEmployeeVisible(card: typeof workspaceCards.$inferSelect, now = new Date()) {
  const scheduledLive = card.status === "scheduled" && card.scheduledFor && card.scheduledFor.getTime() <= now.getTime();
  const live = card.status === "published" || scheduledLive;
  return card.active === 1 && live && (!card.expiresAt || card.expiresAt.getTime() > now.getTime());
}

export async function listWorkspaceCards() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const cards = await db.select().from(workspaceCards).orderBy(asc(workspaceCards.sortOrder), desc(workspaceCards.updatedAt));
  return cards.filter(card => isEmployeeVisible(card, now));
}

export type ManagedWorkspaceItem = typeof workspaceCards.$inferSelect & {
  ownerName: string | null;
  ownerEmail: string | null;
  reviewOverdue: boolean;
};

export async function listManagedWorkspaceItems(): Promise<ManagedWorkspaceItem[]> {
  const db = await getDb();
  if (!db) return [];
  const cards = await db.select().from(workspaceCards).orderBy(desc(workspaceCards.updatedAt));
  const ownerIds = Array.from(new Set(cards.flatMap(card => card.ownerUserId ? [card.ownerUserId] : [])));
  const owners = ownerIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ownerIds)) : [];
  const ownerMap = new Map(owners.map(owner => [owner.id, owner]));
  const now = new Date();
  return cards.map(card => ({ ...card, ownerName: card.ownerUserId ? ownerMap.get(card.ownerUserId)?.name ?? null : null, ownerEmail: card.ownerUserId ? ownerMap.get(card.ownerUserId)?.email ?? null : null, reviewOverdue: Boolean(card.reviewBy && card.reviewBy.getTime() < now.getTime() && !["archived", "unpublished"].includes(card.status)) }));
}

export async function getWorkspaceItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(workspaceCards).where(eq(workspaceCards.id, id)).limit(1))[0];
}

async function addWorkspaceHistory(workspaceCardId: number, action: WorkspaceContentAction | "created" | "updated" | "expired", actorUserId: number | null, fromStatus?: string | null, toStatus?: string | null, note?: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.insert(workspaceContentHistory).values({ workspaceCardId, action, actorUserId, fromStatus: fromStatus ?? null, toStatus: toStatus ?? null, note: note ?? null });
}

function itemFields(input: WorkspaceCardInput) {
  return { slot: input.slot, eyebrow: input.eyebrow, title: input.title, body: input.body, linkUrl: input.linkUrl ?? null, imageUrl: input.imageUrl ?? null, imageMode: input.imageMode, sortOrder: input.sortOrder, scheduledFor: input.scheduledFor ?? null, expiresAt: input.expiresAt ?? null, reviewBy: input.reviewBy ?? null, ownerUserId: input.ownerUserId ?? null };
}

/** Saves editorial fields only. Publication always requires the dedicated confirmed action. */
export async function saveWorkspaceItem(input: WorkspaceCardInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const fields = itemFields(input);
  if (input.id) {
    const existing = await getWorkspaceItemById(input.id);
    if (!existing) return undefined;
    if (["published", "scheduled"].includes(existing.status)) {
      const result = await db.insert(workspaceCards).values({ ...fields, active: 0, status: "draft", createdByUserId: userId, updatedByUserId: userId, ownerUserId: fields.ownerUserId ?? existing.ownerUserId ?? userId });
      const revisionId = Number(result[0].insertId);
      await addWorkspaceHistory(revisionId, "duplicate", userId, null, "draft", `Private revision created from live item ${existing.id}; the live item remains unchanged until this revision is confirmed for publication`);
      return getWorkspaceItemById(revisionId);
    }
    await db.update(workspaceCards).set({ ...fields, updatedByUserId: userId }).where(eq(workspaceCards.id, input.id));
    await addWorkspaceHistory(input.id, "updated", userId, existing.status, existing.status, "Editorial fields updated");
    return getWorkspaceItemById(input.id);
  }
  const result = await db.insert(workspaceCards).values({ ...fields, active: 0, status: "draft", createdByUserId: userId, updatedByUserId: userId, ownerUserId: fields.ownerUserId ?? userId });
  const id = Number(result[0].insertId);
  await addWorkspaceHistory(id, "created", userId, null, "draft", "Item created as draft");
  return getWorkspaceItemById(id);
}

/** Compatibility wrapper retained for existing non-console imports. It never bypasses the publish confirmation action. */
export async function saveWorkspaceCard(input: WorkspaceCardInput, userId: number) { return saveWorkspaceItem(input, userId); }

async function transitionWorkspaceItem(id: number, action: WorkspaceContentAction, actorUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await getWorkspaceItemById(id);
  if (!existing) return undefined;
  const now = new Date();
  let nextStatus: WorkspaceContentStatus = existing.status as WorkspaceContentStatus;
  let changes: Record<string, unknown> = { updatedByUserId: actorUserId };
  if (action === "publish") {
    nextStatus = resolvePublishStatus(existing.scheduledFor, now);
    changes = { ...changes, status: nextStatus, active: nextStatus === "published" ? 1 : 0, publishedAt: nextStatus === "published" ? now : null };
  }
  if (action === "unpublish") { nextStatus = "unpublished"; changes = { ...changes, status: nextStatus, active: 0 }; }
  if (action === "archive") { nextStatus = "archived"; changes = { ...changes, status: nextStatus, active: 0, archivedByUserId: actorUserId, archivedAt: now }; }
  if (action === "restore") { nextStatus = "draft"; changes = { ...changes, status: nextStatus, active: 0, archivedByUserId: null, archivedAt: null }; }
  if (action === "submit") { nextStatus = "in_review"; changes = { ...changes, status: nextStatus, active: 0 }; }
  if (action === "approve") { nextStatus = "approved"; changes = { ...changes, status: nextStatus, active: 0 }; }
  await db.update(workspaceCards).set(changes).where(eq(workspaceCards.id, id));
  await addWorkspaceHistory(id, action, actorUserId, existing.status, nextStatus, action === "publish" ? (nextStatus === "scheduled" ? "Confirmed for scheduled release" : "Confirmed for immediate publication") : null);
  return getWorkspaceItemById(id);
}

export async function publishWorkspaceItem(id: number, userId: number) { return transitionWorkspaceItem(id, "publish", userId); }
export async function unpublishWorkspaceItem(id: number, userId: number) { return transitionWorkspaceItem(id, "unpublish", userId); }
export async function archiveWorkspaceItem(id: number, userId: number) { return transitionWorkspaceItem(id, "archive", userId); }
export async function restoreWorkspaceItem(id: number, userId: number) { return transitionWorkspaceItem(id, "restore", userId); }
export async function submitWorkspaceItemForReview(id: number, userId: number) { return transitionWorkspaceItem(id, "submit", userId); }
export async function approveWorkspaceItem(id: number, userId: number) { return transitionWorkspaceItem(id, "approve", userId); }

export async function duplicateWorkspaceItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const source = await getWorkspaceItemById(id);
  if (!source) return undefined;
  const result = await db.insert(workspaceCards).values({ slot: source.slot, eyebrow: source.eyebrow, title: `Copy of ${source.title}`.slice(0, 180), body: source.body, linkUrl: source.linkUrl, imageUrl: source.imageUrl, imageMode: source.imageMode, sortOrder: source.sortOrder, active: 0, status: "draft", expiresAt: source.expiresAt, reviewBy: source.reviewBy, ownerUserId: source.ownerUserId ?? userId, createdByUserId: userId, updatedByUserId: userId });
  const copyId = Number(result[0].insertId);
  await addWorkspaceHistory(copyId, "duplicate", userId, null, "draft", `Duplicated from item ${id}`);
  return getWorkspaceItemById(copyId);
}

export async function getWorkspaceItemHistory(id: number) {
  const db = await getDb();
  if (!db) return [];
  const history = await db.select().from(workspaceContentHistory).where(eq(workspaceContentHistory.workspaceCardId, id)).orderBy(desc(workspaceContentHistory.createdAt));
  const actorIds = Array.from(new Set(history.flatMap(entry => entry.actorUserId ? [entry.actorUserId] : [])));
  const actors = actorIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, actorIds)) : [];
  const actorMap = new Map(actors.map(actor => [actor.id, actor]));
  return history.map(entry => ({ ...entry, actorName: entry.actorUserId ? actorMap.get(entry.actorUserId)?.name ?? null : null, actorEmail: entry.actorUserId ? actorMap.get(entry.actorUserId)?.email ?? null : null }));
}

/** Idempotently turns due schedules live and retires expired employee-facing items. */
export async function sweepWorkspacePublicationLifecycle(now = new Date()) {
  const db = await getDb();
  if (!db) return { published: 0, expired: 0 };
  const cards = await db.select().from(workspaceCards);
  let published = 0; let expired = 0;
  for (const card of cards) {
    if (card.status === "scheduled" && card.scheduledFor && card.scheduledFor.getTime() <= now.getTime()) {
      await db.update(workspaceCards).set({ status: "published", active: 1, publishedAt: now }).where(eq(workspaceCards.id, card.id));
      await addWorkspaceHistory(card.id, "publish", null, "scheduled", "published", "Scheduled release reached its go-live time"); published += 1;
    }
    if (card.status === "published" && card.expiresAt && card.expiresAt.getTime() <= now.getTime()) {
      await db.update(workspaceCards).set({ status: "unpublished", active: 0 }).where(eq(workspaceCards.id, card.id));
      await addWorkspaceHistory(card.id, "expired", null, "published", "unpublished", "Item expired automatically"); expired += 1;
    }
  }
  return { published, expired };
}

export async function listOverdueWorkspaceReviewItems(now = new Date()) {
  const items = await listManagedWorkspaceItems();
  return items.filter(item => item.reviewOverdue && !item.reviewReminderSentAt && Boolean(item.ownerEmail));
}

export async function markWorkspaceReviewReminderSent(id: number, sentAt = new Date()) {
  const db = await getDb();
  if (!db) return;
  await db.update(workspaceCards).set({ reviewReminderSentAt: sentAt }).where(eq(workspaceCards.id, id));
  await addWorkspaceHistory(id, "updated", null, null, null, "Overdue review reminder sent to the assigned owner");
}

export async function listWorkspaceHoverCards() {
  const db = await getDb();
  if (!db) return [];
  return (await db.select().from(workspaceHoverCards).orderBy(asc(workspaceHoverCards.parentSlot), asc(workspaceHoverCards.sortOrder))).filter(card => card.active === 1);
}

export async function saveWorkspaceHoverCard(input: WorkspaceHoverCardInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { id, ...card } = input;
  const values = { ...card, linkUrl: card.linkUrl ?? null, imageUrl: card.imageUrl ?? null, active: card.active ? 1 : 0, updatedByUserId: userId };
  if (id) { await db.update(workspaceHoverCards).set(values).where(eq(workspaceHoverCards.id, id)); return (await db.select().from(workspaceHoverCards).where(eq(workspaceHoverCards.id, id)).limit(1))[0]; }
  const result = await db.insert(workspaceHoverCards).values(values);
  return (await db.select().from(workspaceHoverCards).where(eq(workspaceHoverCards.id, Number(result[0].insertId))).limit(1))[0];
}

export async function bulkSaveWorkspaceHoverCards(inputs: WorkspaceHoverCardInput[], userId: number) {
  const saved = []; for (const input of inputs) { const card = await saveWorkspaceHoverCard(input, userId); if (card) saved.push(card); } return saved;
}

/** Legacy action is retained for migration compatibility; the new console archives primary items instead. */
export async function deleteWorkspaceHoverCard(id: number) {
  const db = await getDb(); if (!db) return false; await db.delete(workspaceHoverCards).where(eq(workspaceHoverCards.id, id)); return true;
}

async function ensureDailyDigest() {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(dailyDigests).orderBy(desc(dailyDigests.updatedAt)).limit(1))[0];
}

export async function getCurrentDailyDigest() {
  const db = await getDb(); if (!db) return undefined;
  const digest = await ensureDailyDigest(); if (!digest) return undefined;
  const entries = await db.select().from(dailyDigestEntries).where(eq(dailyDigestEntries.digestId, digest.id)).orderBy(asc(dailyDigestEntries.sortOrder));
  return { ...digest, entries };
}

export async function getDailyDigestById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(dailyDigests).where(eq(dailyDigests.id, id)).limit(1))[0]; }

export async function saveDailyDigestDraft(input: DailyDigestDraftInput, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  await db.update(dailyDigests).set({ title: input.title, introduction: input.introduction, digestDate: input.digestDate, scheduledFor: input.scheduledFor, recipientCount: input.recipientCount, status: "draft", updatedByUserId: userId }).where(eq(dailyDigests.id, input.id));
  await db.delete(dailyDigestEntries).where(eq(dailyDigestEntries.digestId, input.id));
  await db.insert(dailyDigestEntries).values(input.entries.map(entry => ({ ...entry, digestId: input.id })));
  return getCurrentDailyDigest();
}

export async function submitDailyDigestForReview(id: number, userId: number) { const db = await getDb(); if (!db) return undefined; await db.update(dailyDigests).set({ status: "in_review", updatedByUserId: userId }).where(eq(dailyDigests.id, id)); return getCurrentDailyDigest(); }
export async function publishDailyDigest(id: number, userId: number) { const db = await getDb(); if (!db) return undefined; await db.update(dailyDigests).set({ status: "published", publishedByUserId: userId, publishedAt: new Date() }).where(eq(dailyDigests.id, id)); return getCurrentDailyDigest(); }
