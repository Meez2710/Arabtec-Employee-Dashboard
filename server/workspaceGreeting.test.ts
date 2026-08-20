import { describe, expect, it } from "vitest";
import { formatCairoGreeting } from "../client/src/lib/workspaceContent";

describe("workspace greeting", () => {
  it("shows an impersonal time-aware greeting and date without an employee name", () => {
    // 08:00 UTC is 11:00 in Cairo — still morning.
    const result = formatCairoGreeting("en", new Date("2026-08-17T08:00:00Z"));
    expect(result.greeting).toBe("Good morning");
    expect(result.dateLabel).toContain("2026");
    expect(result).not.toHaveProperty("name");
  });

  it("reads the clock in Cairo rather than on the reader's device", () => {
    // 21:00 UTC in August is midnight in Cairo, so it is already the next day
    // and no longer "evening" of the 17th for the office.
    expect(formatCairoGreeting("en", new Date("2026-08-17T21:00:00Z")).dateLabel).toContain("18");
    // 06:00 UTC is 09:00 Cairo.
    expect(formatCairoGreeting("en", new Date("2026-08-17T06:00:00Z")).greeting).toBe("Good morning");
    // 14:00 UTC is 17:00 Cairo.
    expect(formatCairoGreeting("en", new Date("2026-08-17T14:00:00Z")).greeting).toBe("Good afternoon");
    // 17:00 UTC is 20:00 Cairo.
    expect(formatCairoGreeting("en", new Date("2026-08-17T17:00:00Z")).greeting).toBe("Good evening");
  });

  it("greets Arabic readers in Arabic with a Cairo date", () => {
    const result = formatCairoGreeting("ar", new Date("2026-08-17T08:00:00Z"));
    expect(result.greeting).toBe("صباح الخير");
    expect(result.dateLabel).toMatch(/[؀-ۿ]/);
  });
});
