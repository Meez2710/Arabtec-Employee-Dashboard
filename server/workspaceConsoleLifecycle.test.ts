import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canPerformWorkspaceAction, resolvePublishStatus } from "./workspaceLifecycle";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const app = read("client/src/App.tsx");
// The console is a multi-screen control plane now, so policy is checked across
// the whole console surface rather than one page file.
const consoleFiles = ["client/src/pages/ManageWorkspace.tsx", ...readdirSync(resolve(root, "client/src/pages/admin")).map(name => `client/src/pages/admin/${name}`)];
const consolePage = consoleFiles.map(read).join("\n");
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

  it("is a control plane rather than one long page, with an overview that surfaces what needs attention", () => {
    expect(app).toContain('path="/admin/:section"');
    for (const screen of ["Overview.tsx", "ContentDesk.tsx", "LayoutComposer.tsx", "SimpleSections.tsx", "AdminShell.tsx"]) {
      expect(existsSync(resolve(root, "client/src/pages/admin", screen))).toBe(true);
    }
    for (const signal of ["Expired but still live", "Review overdue", "Going live today", "Expiring this week", "Missing Arabic", "Image without a description"]) {
      expect(consolePage).toContain(signal);
    }
  });

  it("offers search, filter, sort, and bulk actions on the content queue", () => {
    expect(consolePage).toContain("Search by title, section, or owner");
    expect(consolePage).toContain("Action priority");
    expect(consolePage).toContain("Needs attention");
    expect(consolePage).toContain("onBulk");
  });

  it("lets the home be rearranged with buttons and the keyboard, not a hidden press-and-hold", () => {
    const composer = read("client/src/pages/admin/LayoutComposer.tsx");
    expect(composer).toContain("Move ${row.title} earlier");
    expect(composer).toContain("Move ${row.title} later");
    expect(composer).toContain("draggable");
    // A 2-second hold as the only way to move a card is not an affordance.
    expect(composer).not.toMatch(/setTimeout\([^)]*2000/);
  });

  it("previews the employee view at each breakpoint in both languages", () => {
    expect(consolePage).toContain('data-width={previewWidth}');
    for (const control of ["Desktop", "Tablet", "Mobile"]) expect(consolePage).toContain(control);
    expect(consolePage).toContain("عرض بالعربية");
  });

  it("blocks publication until the section template, alt text, and schedule are valid", () => {
    const gates = read("shared/publishReadiness.ts");
    expect(gates).toContain("requiredFieldsBySlot");
    expect(gates).toContain('field: "imageAlt"');
    expect(gates).toContain("The expiry time must come after the go-live time.");
    // The console mirrors the gates; the server is what enforces them.
    expect(router).toContain("evaluatePublishReadiness");
    expect(consolePage).toContain("Cannot publish yet");
  });

  it("confirms destructive and bulk actions before running them", () => {
    expect(consolePage).toContain("window.confirm(\"Archive this item?");
    expect(consolePage).toMatch(/window\.confirm\(`\$\{action === "archive" \? "Archive" : "Unpublish"\}/);
  });

  it("records publish-grade actions in a global audit log", () => {
    expect(router).toContain("recordAudit");
    for (const action of ["content.published", "content.unpublished", "content.archived", "people.role_changed", "layout.updated"]) {
      expect(router).toContain(action);
    }
    expect(consolePage).toContain("Audit log");
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
