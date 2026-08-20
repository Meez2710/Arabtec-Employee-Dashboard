import { describe, expect, it } from "vitest";
import { fromDateInput, toDateInput } from "../client/src/pages/admin/adminShared";

/**
 * `datetime-local` inputs are timezone-naive. The console presents and reads
 * them as Cairo wall-clock time, so a scheduled go-live means what the admin
 * typed regardless of where the browser or the server sits.
 */
describe("console Cairo datetime round-trip", () => {
  const cases: Array<[string, string]> = [
    ["2026-08-20T09:00:00.000Z", "2026-08-20T12:00"], // summer, UTC+3
    ["2026-01-15T09:00:00.000Z", "2026-01-15T11:00"], // winter, UTC+2
    ["2026-08-20T21:30:00.000Z", "2026-08-21T00:30"], // crosses Cairo midnight
    ["2026-12-31T22:00:00.000Z", "2027-01-01T00:00"], // crosses the year in Cairo
  ];

  it("renders an instant as the Cairo wall clock", () => {
    for (const [iso, expected] of cases) {
      expect(toDateInput(new Date(iso))).toBe(expected);
    }
  });

  it("reads the entered wall clock back as the same instant", () => {
    for (const [iso, input] of cases) {
      expect(fromDateInput(input)?.toISOString()).toBe(iso);
    }
  });

  it("treats empty input as no date rather than the epoch", () => {
    expect(toDateInput(null)).toBe("");
    expect(toDateInput(undefined)).toBe("");
    expect(fromDateInput("")).toBeNull();
    expect(fromDateInput("not-a-date")).toBeNull();
  });
});
