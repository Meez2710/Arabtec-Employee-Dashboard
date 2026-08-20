import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canPerformWorkspaceAction, resolvePublishStatus } from "./workspaceLifecycle";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const app = read("client/src/App.tsx");
const consolePage = read("client/src/pages/ManageWorkspace.tsx");
const router = read("server/routers.ts");
const schemas = read("server/workspaceSchemas.ts");
const db = read("server/db.ts");
const reminder = read("server/reviewReminders.ts");

describe("Workspace administrator console lifecycle", () => {
  it("uses the discoverable /admin route without removing the administrator server guard", () => {
    expect(app).toContain('path="/admin"');
    expect(app).not.toContain("/_admin/workspace-content-7c9f");
    // The console guard is now capability-based, which is stricter than the
    // previous single admin check: publishing needs `content.publish`, which
    // an editor does not hold.
    expect(router).toContain("listManagedItems: consoleProcedure");
    expect(router).toContain("publishItem: contentPublishProcedure");
    expect(router).not.toContain("listManagedItems: publicProcedure");
    expect(router).not.toContain("publishItem: publicProcedure");
  });

  it("requires an explicit confirmed publish action and keeps archive non-destructive", () => {
    expect(router).toContain("workspacePublishItemSchema");
    expect(schemas).toContain("confirmed: z.literal(true)");
    expect(consolePage).toContain("Confirm and publish");
    expect(consolePage).toContain("Confirm schedule");
    expect(db).toContain('nextStatus = "archived"');
    expect(db).toContain("restoreWorkspaceItem");
    expect(db).toContain('["published", "scheduled"].includes(existing.status)');
    expect(db).toContain("Private revision created from live item");
    expect(db).not.toContain("deleteWorkspaceCard");
  });

  it("supports a non-technical list-first workflow, activity history, and actual employee preview", () => {
    expect(consolePage).toContain("All content");
    expect(consolePage).toContain("New item");
    expect(consolePage).toContain("Preview as employee");
    expect(consolePage).toContain("<Home previewItems={previewItems}");
    expect(consolePage).toContain("Item history");
    expect(consolePage).toContain("Review overdue");
  });

  it("extends the digest-style lifecycle with safe schedule, unpublish, archive, and restore transitions", () => {
    expect(canPerformWorkspaceAction("draft", "publish")).toBe(true);
    expect(canPerformWorkspaceAction("published", "unpublish")).toBe(true);
    expect(canPerformWorkspaceAction("archived", "restore")).toBe(true);
    expect(canPerformWorkspaceAction("archived", "publish")).toBe(false);
    expect(resolvePublishStatus(new Date("2099-01-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z"))).toBe("scheduled");
    expect(resolvePublishStatus(new Date("2025-01-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z"))).toBe("published");
  });

  it("keeps overdue reviews visible and makes email delivery opt-in until a sender is configured", () => {
    expect(reminder).toContain("isReviewReminderEmailConfigured");
    expect(reminder).toContain("emailConfigured: false");
    expect(reminder).toContain("RESEND_API_KEY");
    expect(reminder).toContain("WORKSPACE_REMINDER_FROM");
  });
});
