import { describe, expect, it } from "vitest";
import { getWelcomeMessage } from "../client/src/config/currentEmployee";

describe("getWelcomeMessage", () => {
  it("shows an impersonal time-aware greeting and date without an employee name", () => {
    const result = getWelcomeMessage(new Date("2026-08-17T08:00:00"));
    expect(result.greeting).toBe("Good morning");
    expect(result.dateLabel).toContain("2026");
    expect(result).not.toHaveProperty("name");
  });
});
