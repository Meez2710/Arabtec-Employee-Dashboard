import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const userRoles = ["user", "editor", "admin"] as const;
export const digestStatuses = ["draft", "in_review", "approved", "published"] as const;
export const digestAudiences = ["employees", "owners", "joiners"] as const;
export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity"] as const;
export const workspaceImageModes = ["none", "upload", "link_preview"] as const;

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

/** Reusable public dashboard cards managed by an Admin. File bytes stay in S3; this table stores metadata and destinations only. */
export const workspaceCards = mysqlTable("workspaceCards", {
  id: int("id").autoincrement().primaryKey(),
  slot: mysqlEnum("slot", workspaceCardSlots).notNull().unique(),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WorkspaceCard = typeof workspaceCards.$inferSelect;
