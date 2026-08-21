import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Ordered least to most capable. `user` is the default non-console role retained from V1. */
export const userRoles = ["user", "editor", "admin", "viewer", "publisher"] as const;
export const digestStatuses = ["draft", "in_review", "approved", "published"] as const;
export const digestAudiences = ["employees", "owners", "joiners"] as const;
export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity", "week_ahead", "resource"] as const;
/** Display order on the employee home. Kept separate from the enum so slots can be reordered without an ALTER. */
export const workspaceSlotDisplayOrder = ["announcement", "week_ahead", "new_joiner", "company_news", "activity", "industry_watch", "opportunity", "resource"] as const;
export const workspaceCardSizes = ["1x1", "2x1", "1x2"] as const;
export const workspaceSeverities = ["normal", "important", "critical"] as const;
/** Editorial hierarchy tier for the News Grid Hierarchy layout. Additive alongside cardSize/severity — see shared/workspaceDisplayTier.ts. */
export const workspaceDisplayTiers = ["lead", "standard", "brief"] as const;
export const workspaceResourceTypes = ["policy", "form", "handbook", "template", "contact"] as const;
export const workspaceImageModes = ["none", "upload", "link_preview"] as const;
/** Extends the digest model with scheduled, unpublished, and archived Workspace-specific states. */
export const workspaceContentStatuses = ["draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"] as const;

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** A bounded daily-digest release reviewed by Editors and published by Admins. */
export const dailyDigests = mysqlTable("dailyDigests", {
  id: int("id").autoincrement().primaryKey(),
  digestDate: varchar("digestDate", { length: 10 }).notNull().unique(),
  title: varchar("title", { length: 140 }).notNull(),
  introduction: text("introduction").notNull(),
  status: mysqlEnum("status", digestStatuses).default("draft").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  recipientCount: int("recipientCount").default(0).notNull(),
  updatedByUserId: int("updatedByUserId"),
  publishedByUserId: int("publishedByUserId"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Ordered editorial blocks that make up a daily digest. */
export const dailyDigestEntries = mysqlTable("dailyDigestEntries", {
  id: int("id").autoincrement().primaryKey(),
  digestId: int("digestId").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  headline: varchar("headline", { length: 180 }).notNull(),
  summary: text("summary").notNull(),
  audience: mysqlEnum("audience", digestAudiences).default("employees").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Employee-facing Workspace items, using the digest-style publishing lifecycle and safe archive state. */
export const workspaceCards = mysqlTable("workspaceCards", {
  id: int("id").autoincrement().primaryKey(),
  slot: mysqlEnum("slot", workspaceCardSlots).notNull(),
  eyebrow: varchar("eyebrow", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  linkUrl: varchar("linkUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  imageMode: mysqlEnum("imageMode", workspaceImageModes).default("none").notNull(),
  imageAlt: varchar("imageAlt", { length: 220 }),
  /** Arabic editorial fields. Null means "not translated yet" and is surfaced to admins, never blank to employees. */
  eyebrowAr: varchar("eyebrowAr", { length: 80 }),
  titleAr: varchar("titleAr", { length: 180 }),
  bodyAr: text("bodyAr"),
  imageAltAr: varchar("imageAltAr", { length: 220 }),
  /** Home layout: grid footprint of this card. */
  cardSize: mysqlEnum("cardSize", workspaceCardSizes).default("1x1").notNull(),
  /** News Grid Hierarchy: editorial-prominence tier, independent of cardSize footprint. Additive, nullable, no default — missing means "standard", resolved in code via tierOf() so existing rows are unaffected until an admin sets it explicitly. */
  displayTier: mysqlEnum("displayTier", workspaceDisplayTiers),
  /** Announcement template: severity drives the priority rail; acknowledgement is opt-in per item. */
  severity: mysqlEnum("severity", workspaceSeverities).default("normal").notNull(),
  requiresAck: int("requiresAck").default(0).notNull(),
  /** Dated templates: week ahead, activity, new joiner start date. */
  eventStart: timestamp("eventStart"),
  eventEnd: timestamp("eventEnd"),
  /** Activity and opportunity. */
  location: varchar("location", { length: 160 }),
  locationAr: varchar("locationAr", { length: 160 }),
  /** Opportunity function/discipline, new joiner department. */
  functionArea: varchar("functionArea", { length: 120 }),
  functionAreaAr: varchar("functionAreaAr", { length: 120 }),
  closingDate: timestamp("closingDate"),
  /** Industry watch publication, resource owning department. */
  sourceName: varchar("sourceName", { length: 160 }),
  sourceNameAr: varchar("sourceNameAr", { length: 160 }),
  resourceType: mysqlEnum("resourceType", workspaceResourceTypes),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: int("active").default(1).notNull(),
  status: mysqlEnum("status", workspaceContentStatuses).default("draft").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  expiresAt: timestamp("expiresAt"),
  reviewBy: timestamp("reviewBy"),
  ownerUserId: int("ownerUserId"),
  createdByUserId: int("createdByUserId"),
  archivedByUserId: int("archivedByUserId"),
  archivedAt: timestamp("archivedAt"),
  reviewReminderSentAt: timestamp("reviewReminderSentAt"),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Immutable operational history for changes that affect an employee-facing Workspace item. */
export const workspaceContentHistory = mysqlTable("workspaceContentHistory", {
  id: int("id").autoincrement().primaryKey(),
  workspaceCardId: int("workspaceCardId").notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 24 }),
  toStatus: varchar("toStatus", { length: 24 }),
  actorUserId: int("actorUserId"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Repeatable detail disclosures displayed within a parent Workspace section. */
export const workspaceHoverCards = mysqlTable("workspaceHoverCards", {
  id: int("id").autoincrement().primaryKey(),
  parentSlot: mysqlEnum("parentSlot", workspaceCardSlots).notNull(),
  eyebrow: varchar("eyebrow", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  linkUrl: varchar("linkUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  imageMode: mysqlEnum("imageMode", workspaceImageModes).default("none").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: int("active").default(1).notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Employee-visible section registry: enable/disable, bilingual labels, default card footprint. */
export const workspaceSections = mysqlTable("workspaceSections", {
  id: int("id").autoincrement().primaryKey(),
  slot: mysqlEnum("slot", workspaceCardSlots).notNull().unique(),
  labelEn: varchar("labelEn", { length: 80 }).notNull(),
  labelAr: varchar("labelAr", { length: 80 }).notNull(),
  enabled: int("enabled").default(1).notNull(),
  defaultSize: mysqlEnum("defaultSize", workspaceCardSizes).default("1x1").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Append-only record of every publish-grade mutation, across all entities. */
export const workspaceAuditLog = mysqlTable("workspaceAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  entity: varchar("entity", { length: 40 }).notNull(),
  entityId: int("entityId"),
  action: varchar("action", { length: 40 }).notNull(),
  actorUserId: int("actorUserId"),
  actorLabel: varchar("actorLabel", { length: 200 }),
  summary: varchar("summary", { length: 400 }),
  beforeJson: text("beforeJson"),
  afterJson: text("afterJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** One row per employee per acknowledged notice. */
export const workspaceAcknowledgements = mysqlTable("workspaceAcknowledgements", {
  id: int("id").autoincrement().primaryKey(),
  workspaceCardId: int("workspaceCardId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WorkspaceCard = typeof workspaceCards.$inferSelect;
export type WorkspaceHoverCard = typeof workspaceHoverCards.$inferSelect;
export type WorkspaceSection = typeof workspaceSections.$inferSelect;
export type WorkspaceAuditEntry = typeof workspaceAuditLog.$inferSelect;
