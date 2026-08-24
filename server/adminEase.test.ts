import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvedEyebrow } from "../client/src/pages/admin/adminShared";

const root = resolve(import.meta.dirname, "..");

describe("admin ease-of-use", () => {
  it("fills an empty short tag from the section name", () => {
    expect(resolvedEyebrow("", "Announcement")).toBe("Announcement");
    expect(resolvedEyebrow("  People and Culture  ", "Announcement")).toBe("People and Culture");
  });

  it("keeps the console sign-out control and compact photo preview", () => {
    const shell = readFileSync(resolve(root, "client/src/pages/admin/AdminShell.tsx"), "utf8");
    const desk = readFileSync(resolve(root, "client/src/pages/admin/ContentDesk.tsx"), "utf8");
    const copy = readFileSync(resolve(root, "client/src/lib/consoleCopy.ts"), "utf8");
    const css = readFileSync(resolve(root, "client/src/pages/admin/adminEase.css"), "utf8");
    expect(shell).toContain("onSignOut");
    expect(copy).toContain('t("Sign out"');
    expect(desk).toContain("adm__image-row");
    expect(desk).toContain("c.editor.moreOptions");
    expect(css).toContain("max-inline-size: 144px");
  });
});
