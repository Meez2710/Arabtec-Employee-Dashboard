import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const router = readFileSync(resolve(root, "server/routers.ts"), "utf8");

/**
 * Every `name: someProcedure … .query(|.mutation(` in the router, sliced at the
 * next declaration so a procedure can never be attributed the following one's
 * kind or guard.
 */
type Procedure = { name: string; guard: string; kind: "query" | "mutation" };

function allProcedures(): Procedure[] {
  const declaration = /(\w+):\s*(\w+Procedure)\b/g;
  const found: Array<{ name: string; guard: string; start: number }> = [];
  for (const match of router.matchAll(declaration)) {
    found.push({ name: match[1], guard: match[2], start: match.index ?? 0 });
  }
  return found.flatMap((entry, index) => {
    const body = router.slice(entry.start, found[index + 1]?.start ?? router.length);
    const kind = body.includes(".mutation(") ? "mutation" : body.includes(".query(") ? "query" : null;
    return kind ? [{ name: entry.name, guard: entry.guard, kind }] : [];
  });
}

function procedures(kind: "mutation" | "query") {
  return allProcedures().filter(entry => entry.kind === kind);
}

describe("Workspace API authorization", () => {
  it("guards every mutation; only signing out is public", () => {
    const unguarded = procedures("mutation").filter(entry => entry.guard === "publicProcedure");
    expect(unguarded.map(entry => entry.name)).toEqual(["logout"]);
  });

  it("keeps publishing behind content.publish, not merely behind sign-in", () => {
    const byName = Object.fromEntries(procedures("mutation").map(entry => [entry.name, entry.guard]));
    for (const name of ["publishItem", "unpublishItem", "approveItem", "bulkAction"]) {
      expect(byName[name]).toBe("contentPublishProcedure");
    }
    for (const name of ["saveItem", "archiveItem", "restoreItem", "duplicateItem", "uploadImage"]) {
      expect(byName[name]).toBe("contentWriteProcedure");
    }
    expect(byName.setUserRole).toBe("peopleProcedure");
    expect(byName.saveSection).toBe("sectionsProcedure");
    expect(byName.saveLayout).toBe("layoutProcedure");
  });

  it("exposes only published content and the reader's own state without a session", () => {
    const publicQueries = procedures("query").filter(entry => entry.guard === "publicProcedure").map(entry => entry.name).sort();
    // listCards is filtered to live, unexpired items at the data layer.
    expect(publicQueries).toEqual(["getCapabilities", "listCards", "listHoverCards", "listSections", "me"]);
    const db = readFileSync(resolve(root, "server/db.ts"), "utf8");
    expect(db).toContain("cards.filter(card => isEmployeeVisible(card, now))");
  });

  it("never lets an employee acknowledge something they cannot see", () => {
    expect(router).toContain("const visible = await listWorkspaceCards();");
    expect(router).toContain("if (!visible.some(card => card.id === input.id))");
  });

  it("stops an administrator from changing their own access level", () => {
    expect(router).toContain("You cannot change your own access level");
  });

  it("keeps the console off an enumerable id", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    expect(app).toContain('path="/admin/1618"');
    expect(app).toContain('<Redirect to="/admin" />');
    expect(app).not.toMatch(/component=\{ManageWorkspace\}[\s\S]{0,40}1618/);
  });

  it("does not ship a development seed or auth bypass into production paths", () => {
    const seed = readFileSync(resolve(root, "server/devSeed.ts"), "utf8");
    expect(seed).toContain('process.env.NODE_ENV !== "production"');
    expect(seed).toContain('process.env.WORKSPACE_DEV_SEED === "1"');
    const context = readFileSync(resolve(root, "server/_core/context.ts"), "utf8");
    expect(context).not.toContain("WORKSPACE_DEV_SEED");
    expect(context).not.toMatch(/role:\s*["']admin["']/);
  });
});
