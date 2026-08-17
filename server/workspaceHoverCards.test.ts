import { describe, expect, it } from "vitest";
import { workspaceHoverCardSchema } from "./workspaceSchemas";

describe("workspace hover-card content contract", () => {
  it("accepts repeatable employee metadata with a secure link and image source", () => {
    const card = workspaceHoverCardSchema.parse({
      parentSlot: "new_joiner",
      eyebrow: "Project Delivery",
      title: "Site Engineer",
      body: "A concise employee hover disclosure.",
      linkUrl: "https://www.arabtec.com",
      imageUrl: "https://cdn.example.com/employee.jpg",
      imageMode: "upload",
      sortOrder: 0,
      active: true,
    });
    expect(card.parentSlot).toBe("new_joiner");
    expect(card.title).toBe("Site Engineer");
  });

  it("rejects an invalid external destination", () => {
    expect(() => workspaceHoverCardSchema.parse({ parentSlot: "company_news", eyebrow: "Update", title: "Title", body: "Text", linkUrl: "not-a-url" })).toThrow();
  });
});
