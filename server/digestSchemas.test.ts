import { describe, expect, it } from "vitest";
import { dailyDigestDraftSchema } from "./digestSchemas";

const validDraft = {
  id: 1,
  title: "Thursday welcome digest",
  introduction: "Four incoming joiners, clear preparation actions, and the weekly company update.",
  digestDate: "2026-08-20",
  scheduledFor: new Date("2026-08-20T06:00:00.000Z"),
  recipientCount: 382,
  entries: [
    {
      category: "People Ops",
      headline: "Four people join us this month",
      summary: "The joiner strip and welcome note are ready for review.",
      audience: "employees" as const,
      sortOrder: 0,
    },
  ],
};

describe("dailyDigestDraftSchema", () => {
  it("accepts a bounded, publishable digest draft", () => {
    expect(dailyDigestDraftSchema.parse(validDraft)).toMatchObject({
      title: "Thursday welcome digest",
      recipientCount: 382,
    });
  });

  it("rejects a digest without any reviewable entries", () => {
    expect(() => dailyDigestDraftSchema.parse({ ...validDraft, entries: [] })).toThrow();
  });

  it("rejects invalid operational dates", () => {
    expect(() => dailyDigestDraftSchema.parse({ ...validDraft, digestDate: "20/08/2026" })).toThrow();
  });
});
