import { describe, expect, it } from "vitest";
import { roleCapabilities, roleHasCapability, workspaceCapabilities } from "./roles";

describe("Workspace role capabilities", () => {
  it("keeps publishing away from editors and viewers", () => {
    expect(roleHasCapability("editor", "content.write")).toBe(true);
    expect(roleHasCapability("editor", "content.publish")).toBe(false);
    expect(roleHasCapability("viewer", "content.write")).toBe(false);
    expect(roleHasCapability("viewer", "console.view")).toBe(true);
    expect(roleHasCapability("publisher", "content.publish")).toBe(true);
  });

  it("reserves people, sections, and settings for administrators", () => {
    for (const capability of ["people.manage", "sections.manage", "settings.manage"] as const) {
      expect(roleHasCapability("publisher", capability)).toBe(false);
      expect(roleHasCapability("admin", capability)).toBe(true);
    }
  });

  it("gives the default employee role no console access at all", () => {
    expect(roleCapabilities("user")).toHaveLength(0);
    expect(roleHasCapability("user", "console.view")).toBe(false);
    expect(roleHasCapability(null, "console.view")).toBe(false);
    expect(roleHasCapability(undefined, "content.publish")).toBe(false);
  });

  it("grants an administrator every declared capability", () => {
    expect([...roleCapabilities("admin")].sort()).toEqual([...workspaceCapabilities].sort());
  });

  it("is monotonic: each console role is a superset of the one below it", () => {
    const viewer = new Set(roleCapabilities("viewer"));
    const editor = new Set(roleCapabilities("editor"));
    const publisher = new Set(roleCapabilities("publisher"));
    const admin = new Set(roleCapabilities("admin"));
    for (const capability of viewer) expect(editor.has(capability)).toBe(true);
    for (const capability of editor) expect(publisher.has(capability)).toBe(true);
    for (const capability of publisher) expect(admin.has(capability)).toBe(true);
  });
});
