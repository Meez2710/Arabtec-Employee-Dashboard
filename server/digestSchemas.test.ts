import { describe, expect, it } from "vitest";
import { dailyDigestDraftSchema } from "./digestSchemas";

const validDraft = {
  id: 1,
  title: "Introductory demo digest",
  introduction: "Demo content used only to validate the digest input shape.",
  digestDate: "2026-08-20",
  scheduledFor: new Date("2026-08-20T06:00:00.000Z"),
  recipientCount: 382,
  entries: [
    {
      category: "Introductory demo",
      headline: "Demo entry",
      summary: "This text exists only to validate the digest input shape.",
      audience: "employees" as const,
      sortOrder: 0,
    },
  ],
};

describe("dailyDigestDraftSchema", () => {
  it("accepts a bounded, publishable digest draft", () => {
    expect(dailyDigestDraftSchema.parse(validDraft)).toMatchObject({
      title: "Introductory demo digest",
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
