import { describe, expect, it } from "vitest";
import { workspaceEmployeeBulkSchema, workspaceHoverCardSchema } from "./workspaceSchemas";

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

  it("accepts a controlled batch of employee hover cards", () => {
    const result = workspaceEmployeeBulkSchema.parse({
      cards: [
        { clientId: "4cbbc12d-5796-41b1-bdc6-b12bc96b00e1", parentSlot: "new_joiner", eyebrow: "Project Delivery", title: "Site Engineer", body: "Employee profile one", imageMode: "upload", imageUrl: "https://cdn.example.com/one.jpg", sortOrder: 0, active: true },
        { clientId: "8a74b038-b430-4ddb-864c-1bb7f06b7b3c", parentSlot: "new_joiner", eyebrow: "Commercial", title: "Cost Engineer", body: "Employee profile two", imageMode: "upload", imageUrl: "https://cdn.example.com/two.jpg", sortOrder: 1, active: true },
      ],
    });
    expect(result.cards).toHaveLength(2);
  });
});
