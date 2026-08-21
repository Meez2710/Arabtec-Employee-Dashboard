import { and, desc, eq, inArray } from "drizzle-orm";
import { users, workspaceAuditLog } from "../drizzle/schema";
import { getDb } from "./db";

export type AuditEntity = "workspace_card" | "section" | "layout" | "user" | "settings";

type RecordAuditInput = {
  entity: AuditEntity;
  entityId?: number | null;
  action: string;
  actorUserId?: number | null;
  actorLabel?: string | null;
  summary?: string | null;
  before?: unknown;
  after?: unknown;
};

/** Fields worth diffing. Timestamps that change on every write are noise, not signal. */
const auditableFields = [
  "slot", "eyebrow", "title", "body", "eyebrowAr", "titleAr", "bodyAr",
  "linkUrl", "imageUrl", "imageAlt", "imageAltAr", "cardSize", "severity",
  "requiresAck", "eventStart", "eventEnd", "location", "functionArea",
  "closingDate", "sourceName", "resourceType", "sortOrder", "status",
  "active", "scheduledFor", "expiresAt", "reviewBy", "ownerUserId",
] as const;

function snapshot(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const field of auditableFields) {
    if (!(field in source)) continue;
    const raw = source[field];
    picked[field] = raw instanceof Date ? raw.toISOString() : raw;
  }
  return JSON.stringify(picked);
}

/** Append-only. A failure to write audit must never break the action it describes. */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(workspaceAuditLog).values({
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      actorLabel: input.actorLabel ?? null,
      summary: input.summary ? input.summary.slice(0, 400) : null,
      beforeJson: snapshot(input.before),
      afterJson: snapshot(input.after),
    });
  } catch (error) {
    console.warn("[Audit] Entry could not be written:", error);
  }
}

export async function listAuditLog(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  const entries = await db.select().from(workspaceAuditLog).orderBy(desc(workspaceAuditLog.createdAt)).limit(limit);
  const actorIds = Array.from(new Set(entries.flatMap(entry => (entry.actorUserId ? [entry.actorUserId] : []))));
  const actors = actorIds.length
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, actorIds))
    : [];
  const actorMap = new Map(actors.map(actor => [actor.id, actor]));
  return entries.map(entry => ({
    ...entry,
    actorName: entry.actorUserId ? actorMap.get(entry.actorUserId)?.name ?? null : null,
    actorEmail: entry.actorUserId ? actorMap.get(entry.actorUserId)?.email ?? null : null,
  }));
}

export async function listAuditForEntity(entity: AuditEntity, entityId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workspaceAuditLog)
    .where(and(eq(workspaceAuditLog.entity, entity), eq(workspaceAuditLog.entityId, entityId)))
    .orderBy(desc(workspaceAuditLog.createdAt))
    .limit(limit);
}
