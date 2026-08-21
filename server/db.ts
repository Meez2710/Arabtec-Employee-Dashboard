import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { dailyDigestEntries, dailyDigests, type InsertUser, users, workspaceAcknowledgements, workspaceCards, workspaceContentHistory, workspaceHoverCards, workspaceSections } from "../drizzle/schema";
import type { DailyDigestDraftInput } from "./digestSchemas";
import type { WorkspaceCardInput, WorkspaceHoverCardInput, WorkspaceLayoutInput, WorkspaceSectionInput, WorkspaceSlot } from "./workspaceSchemas";
import { resolvePublishStatus, type WorkspaceContentAction, type WorkspaceContentStatus } from "./workspaceLifecycle";
import { ENV } from "./_core/env";
import { cairoWeekRange, isSameCairoDay } from "./workspaceTime";
import { devSeedCards, isDevSeedEnabled } from "./devSeed";

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
  // Local development only, and only when there is nothing real to show.
  if (!db) return isDevSeedEnabled() ? devSeedCards().filter(card => isEmployeeVisible(card)) : [];
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
  if (!db) {
    if (!isDevSeedEnabled()) return [];
    return devSeedCards().map(card => ({ ...card, ownerName: null, ownerEmail: null, reviewOverdue: false }));
  }
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
  return {
    slot: input.slot, eyebrow: input.eyebrow, title: input.title, body: input.body,
    eyebrowAr: input.eyebrowAr ?? null, titleAr: input.titleAr ?? null, bodyAr: input.bodyAr ?? null,
    linkUrl: input.linkUrl ?? null, imageUrl: input.imageUrl ?? null, imageMode: input.imageMode,
    imageAlt: input.imageAlt ?? null, imageAltAr: input.imageAltAr ?? null,
    cardSize: input.cardSize, severity: input.severity, requiresAck: input.requiresAck ? 1 : 0,
    eventStart: input.eventStart ?? null, eventEnd: input.eventEnd ?? null,
    location: input.location ?? null, locationAr: input.locationAr ?? null,
    functionArea: input.functionArea ?? null, functionAreaAr: input.functionAreaAr ?? null,
    closingDate: input.closingDate ?? null,
    sourceName: input.sourceName ?? null, sourceNameAr: input.sourceNameAr ?? null,
    resourceType: input.resourceType ?? null,
    sortOrder: input.sortOrder, scheduledFor: input.scheduledFor ?? null,
    expiresAt: input.expiresAt ?? null, reviewBy: input.reviewBy ?? null,
    ownerUserId: input.ownerUserId ?? null,
  };
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
  const { id: _sourceId, createdAt: _createdAt, updatedAt: _updatedAt, publishedAt: _publishedAt, archivedAt: _archivedAt, archivedByUserId: _archivedBy, reviewReminderSentAt: _reminderSent, scheduledFor: _scheduledFor, ...carried } = source;
  const result = await db.insert(workspaceCards).values({ ...carried, title: `Copy of ${source.title}`.slice(0, 180), active: 0, status: "draft", ownerUserId: source.ownerUserId ?? userId, createdByUserId: userId, updatedByUserId: userId });
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

/* ------------------------------------------------------------------------- *
 * Sections, layout, acknowledgements, people, and the console overview.
 * ------------------------------------------------------------------------- */

/** Shipped defaults. Seeded once; admins own the labels and order afterwards. */
const defaultSections: Array<{ slot: WorkspaceSlot; labelEn: string; labelAr: string; defaultSize: "1x1" | "2x1" | "1x2"; sortOrder: number }> = [
  { slot: "announcement", labelEn: "Announcements", labelAr: "الإعلانات", defaultSize: "2x1", sortOrder: 0 },
  { slot: "week_ahead", labelEn: "This week", labelAr: "هذا الأسبوع", defaultSize: "1x2", sortOrder: 1 },
  { slot: "new_joiner", labelEn: "New joiners", labelAr: "المنضمون الجدد", defaultSize: "1x1", sortOrder: 2 },
  { slot: "company_news", labelEn: "Company news", labelAr: "أخبار الشركة", defaultSize: "2x1", sortOrder: 3 },
  { slot: "activity", labelEn: "Activities", labelAr: "الأنشطة", defaultSize: "1x1", sortOrder: 4 },
  { slot: "industry_watch", labelEn: "Industry watch", labelAr: "متابعة القطاع", defaultSize: "1x1", sortOrder: 5 },
  { slot: "opportunity", labelEn: "Internal opportunities", labelAr: "الفرص الداخلية", defaultSize: "1x1", sortOrder: 6 },
  { slot: "resource", labelEn: "Policies & resources", labelAr: "السياسات والموارد", defaultSize: "1x1", sortOrder: 7 },
];

export type WorkspaceSectionRecord = { slot: WorkspaceSlot; labelEn: string; labelAr: string; enabled: boolean; defaultSize: "1x1" | "2x1" | "1x2"; sortOrder: number };

/** Never throws: with no database the employee site still renders the shipped defaults. */
export async function listWorkspaceSections(): Promise<WorkspaceSectionRecord[]> {
  const fallback = defaultSections.map(section => ({ ...section, enabled: true }));
  const db = await getDb();
  if (!db) return fallback;
  const rows = await db.select().from(workspaceSections).orderBy(asc(workspaceSections.sortOrder));
  if (rows.length === 0) return fallback;
  const bySlot = new Map(rows.map(row => [row.slot, row]));
  return defaultSections.map(section => {
    const row = bySlot.get(section.slot);
    if (!row) return { ...section, enabled: true };
    return { slot: row.slot as WorkspaceSlot, labelEn: row.labelEn, labelAr: row.labelAr, enabled: row.enabled === 1, defaultSize: row.defaultSize as "1x1" | "2x1" | "1x2", sortOrder: row.sortOrder };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveWorkspaceSection(input: WorkspaceSectionInput, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const values = { slot: input.slot, labelEn: input.labelEn, labelAr: input.labelAr, enabled: input.enabled ? 1 : 0, defaultSize: input.defaultSize, sortOrder: input.sortOrder, updatedByUserId: userId };
  await db.insert(workspaceSections).values(values).onDuplicateKeyUpdate({ set: { labelEn: values.labelEn, labelAr: values.labelAr, enabled: values.enabled, defaultSize: values.defaultSize, sortOrder: values.sortOrder, updatedByUserId: userId } });
  return (await db.select().from(workspaceSections).where(eq(workspaceSections.slot, input.slot)).limit(1))[0];
}

/** Applies an ordered layout in one pass. Position is per-item, so two cards can never claim one slot. */
export async function saveWorkspaceLayout(input: WorkspaceLayoutInput, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  let updated = 0;
  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    await db.update(workspaceCards)
      .set({ sortOrder: index, cardSize: item.cardSize, updatedByUserId: userId })
      .where(eq(workspaceCards.id, item.id));
    updated += 1;
  }
  return updated;
}

export async function acknowledgeWorkspaceItem(workspaceCardId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(workspaceAcknowledgements)
    .where(and(eq(workspaceAcknowledgements.workspaceCardId, workspaceCardId), eq(workspaceAcknowledgements.userId, userId)))
    .limit(1);
  if (existing.length > 0) return true;
  await db.insert(workspaceAcknowledgements).values({ workspaceCardId, userId });
  return true;
}

/** The ids this employee has already acknowledged, so the UI never re-asks. */
export async function listAcknowledgedItemIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: workspaceAcknowledgements.workspaceCardId }).from(workspaceAcknowledgements).where(eq(workspaceAcknowledgements.userId, userId));
  return rows.map(row => row.id);
}

export async function countWorkspaceAcknowledgements(workspaceCardId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: workspaceAcknowledgements.id }).from(workspaceAcknowledgements).where(eq(workspaceAcknowledgements.workspaceCardId, workspaceCardId));
  return rows.length;
}

export async function updateUserRole(userId: number, role: typeof users.$inferSelect["role"]) {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export type WorkspaceOverview = {
  counts: { published: number; scheduled: number; drafts: number; inReview: number; archived: number };
  needsAttention: {
    reviewOverdue: ManagedWorkspaceItem[];
    goingLiveToday: ManagedWorkspaceItem[];
    expiringThisWeek: ManagedWorkspaceItem[];
    expiredStillLive: ManagedWorkspaceItem[];
    missingArabic: ManagedWorkspaceItem[];
    missingImageAlt: ManagedWorkspaceItem[];
  };
  lastPublishedAt: Date | null;
};

/**
 * One screen's worth of "what needs me now", computed in Africa/Cairo.
 * Everything here is derived, never stored, so it cannot go stale.
 */
export async function getWorkspaceOverview(now = new Date()): Promise<WorkspaceOverview> {
  const items = await listManagedWorkspaceItems();
  const week = cairoWeekRange(now);
  const live = (item: ManagedWorkspaceItem) => item.status === "published" || item.status === "scheduled";

  const published = items.filter(item => item.status === "published");
  const lastPublishedAt = published.reduce<Date | null>((latest, item) => {
    if (!item.publishedAt) return latest;
    return !latest || item.publishedAt.getTime() > latest.getTime() ? item.publishedAt : latest;
  }, null);

  return {
    counts: {
      published: published.length,
      scheduled: items.filter(item => item.status === "scheduled").length,
      drafts: items.filter(item => item.status === "draft").length,
      inReview: items.filter(item => item.status === "in_review").length,
      archived: items.filter(item => item.status === "archived").length,
    },
    needsAttention: {
      reviewOverdue: items.filter(item => item.reviewOverdue),
      goingLiveToday: items.filter(item => item.status === "scheduled" && item.scheduledFor && isSameCairoDay(item.scheduledFor, now)),
      expiringThisWeek: items.filter(item => live(item) && item.expiresAt && item.expiresAt.getTime() > now.getTime() && item.expiresAt.getTime() <= week.end.getTime()),
      expiredStillLive: items.filter(item => item.status === "published" && item.active === 1 && item.expiresAt && item.expiresAt.getTime() <= now.getTime()),
      missingArabic: items.filter(item => live(item) && (!item.titleAr?.trim() || !item.bodyAr?.trim())),
      missingImageAlt: items.filter(item => live(item) && Boolean(item.imageUrl) && !item.imageAlt?.trim()),
    },
    lastPublishedAt,
  };
}
