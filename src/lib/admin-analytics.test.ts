import { describe, expect, it } from "vitest";
import { getDateDaysAgo } from "./admin-analytics";

describe("admin analytics date range", () => {
  it("uses the India calendar date before subtracting days", () => {
    const now = new Date("2026-09-13T20:00:00Z");

    expect(getDateDaysAgo(0, now)).toBe("2026-09-14");
    expect(getDateDaysAgo(29, now)).toBe("2026-08-16");
  });
});
