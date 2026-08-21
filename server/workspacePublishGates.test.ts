import { describe, expect, it } from "vitest";
import { evaluatePublishReadiness, type PublishCandidate } from "./workspaceSchemas";

const base: PublishCandidate = { slot: "announcement", title: "Site induction change", body: "All site staff report to gate 2 from Sunday." };
const messages = (list: Array<{ message: string }>) => list.map(entry => entry.message).join(" ");

describe("Publish readiness gates", () => {
  it("passes a complete announcement", () => {
    const { blockers } = evaluatePublishReadiness({ ...base, titleAr: "تغيير", bodyAr: "نص" });
    expect(blockers).toHaveLength(0);
  });

  it("blocks an empty title or message", () => {
    expect(evaluatePublishReadiness({ ...base, title: "  " }).blockers.some(b => b.field === "title")).toBe(true);
    expect(evaluatePublishReadiness({ ...base, body: "" }).blockers.some(b => b.field === "body")).toBe(true);
  });

  it("requires the fields each section template depends on", () => {
    expect(messages(evaluatePublishReadiness({ ...base, slot: "opportunity" }).blockers)).toContain("Location");
    expect(messages(evaluatePublishReadiness({ ...base, slot: "activity" }).blockers)).toContain("Location");
    expect(messages(evaluatePublishReadiness({ ...base, slot: "industry_watch" }).blockers)).toContain("Source");
    expect(messages(evaluatePublishReadiness({ ...base, slot: "resource" }).blockers)).toContain("Resource type");
    expect(evaluatePublishReadiness({ ...base, slot: "week_ahead", eventStart: new Date("2099-01-01") }).blockers).toHaveLength(0);
  });

  it("requires alt text whenever an image is attached", () => {
    expect(evaluatePublishReadiness({ ...base, imageUrl: "https://example.com/a.jpg" }).blockers.some(b => b.field === "imageAlt")).toBe(true);
    expect(evaluatePublishReadiness({ ...base, imageUrl: "https://example.com/a.jpg", imageAlt: "Gate 2" }).blockers).toHaveLength(0);
  });

  it("rejects an expiry that precedes go-live or has already passed", () => {
    const scheduledFor = new Date("2099-01-02T00:00:00Z");
    const expiresAt = new Date("2099-01-01T00:00:00Z");
    expect(evaluatePublishReadiness({ ...base, scheduledFor, expiresAt }).blockers.some(b => b.field === "expiresAt")).toBe(true);
    expect(evaluatePublishReadiness({ ...base, expiresAt: new Date("2000-01-01T00:00:00Z") }).blockers.some(b => b.field === "expiresAt")).toBe(true);
  });

  it("warns about missing Arabic without blocking publication", () => {
    const { blockers, warnings } = evaluatePublishReadiness(base);
    expect(blockers).toHaveLength(0);
    expect(warnings.map(warning => warning.field).sort()).toEqual(["bodyAr", "titleAr"]);
  });
});
