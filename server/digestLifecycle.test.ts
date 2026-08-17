import { describe, expect, it } from "vitest";
import { canPerformDigestAction } from "./digestLifecycle";

describe("daily digest lifecycle", () => {
  it("allows Editors to save a draft and submit it for review", () => {
    expect(canPerformDigestAction("draft", "save")).toBe(true);
    expect(canPerformDigestAction("draft", "submit")).toBe(true);
  });

  it("permits publishing only after review", () => {
    expect(canPerformDigestAction("draft", "publish")).toBe(false);
    expect(canPerformDigestAction("in_review", "publish")).toBe(true);
  });

  it("prevents changes to a published digest", () => {
    expect(canPerformDigestAction("published", "save")).toBe(false);
    expect(canPerformDigestAction("published", "submit")).toBe(false);
    expect(canPerformDigestAction("published", "publish")).toBe(false);
  });
});
