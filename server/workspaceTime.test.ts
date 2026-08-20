import { describe, expect, it } from "vitest";
import { cairoDateKey, cairoOffsetMinutes, cairoStartOfDay, cairoWeekRange, formatCairoDate, isSameCairoDay, isWithinCairoWeek } from "@shared/workspaceTime";

describe("Africa/Cairo business time", () => {
  it("rolls the calendar day at Cairo midnight, not UTC midnight", () => {
    // 21:30 UTC in August is 00:30 the next day in Cairo (UTC+3 under DST).
    expect(cairoDateKey(new Date("2026-08-20T21:30:00Z"))).toBe("2026-08-21");
    expect(cairoDateKey(new Date("2026-08-20T20:30:00Z"))).toBe("2026-08-20");
  });

  it("tracks the Egyptian daylight-saving offset", () => {
    expect(cairoOffsetMinutes(new Date("2026-08-20T12:00:00Z"))).toBe(180);
    expect(cairoOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(120);
  });

  it("starts the day at Cairo midnight", () => {
    expect(cairoStartOfDay(new Date("2026-08-20T12:00:00Z")).toISOString()).toBe("2026-08-19T21:00:00.000Z");
    expect(cairoStartOfDay(new Date("2026-01-15T12:00:00Z")).toISOString()).toBe("2026-01-14T22:00:00.000Z");
  });

  it("runs the working week Sunday to Saturday", () => {
    const { start, end } = cairoWeekRange(new Date("2026-08-20T09:00:00Z")); // a Thursday
    expect(cairoDateKey(start)).toBe("2026-08-16"); // Sunday
    expect(cairoDateKey(end)).toBe("2026-08-22"); // Saturday
    expect(isWithinCairoWeek(new Date("2026-08-18T06:00:00Z"), new Date("2026-08-20T09:00:00Z"))).toBe(true);
    expect(isWithinCairoWeek(new Date("2026-08-24T06:00:00Z"), new Date("2026-08-20T09:00:00Z"))).toBe(false);
  });

  it("compares days in Cairo regardless of the runtime timezone", () => {
    expect(isSameCairoDay(new Date("2026-08-20T21:30:00Z"), new Date("2026-08-21T05:00:00Z"))).toBe(true);
    expect(isSameCairoDay(new Date("2026-08-20T18:00:00Z"), new Date("2026-08-21T05:00:00Z"))).toBe(false);
  });

  it("renders Arabic dates with Western numerals so figures stay comparable", () => {
    const label = formatCairoDate(new Date("2026-08-20T22:30:00Z"), "ar", { day: "numeric", month: "long", year: "numeric" });
    expect(label).toContain("21");
    expect(label).toMatch(/[؀-ۿ]/);
    expect(label).not.toMatch(/[٠-٩]/); // no Eastern Arabic numerals
  });
});
