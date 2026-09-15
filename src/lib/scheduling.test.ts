import { describe, expect, it } from "vitest";
import {
  formatSlot,
  getAvailableSlots,
  getIndiaDate,
  getScheduleDay,
  type DoctorSchedule,
} from "./scheduling";

const mondaySchedule: DoctorSchedule = {
  day_of_week: 1,
  start_time: "09:00:00",
  end_time: "10:00:00",
  max_patients: 4,
  is_active: true,
};

describe("scheduling", () => {
  it("maps a calendar date to the database day number", () => {
    expect(getScheduleDay("2026-09-14")).toBe(1);
    expect(getScheduleDay("2026-09-20")).toBe(0);
  });

  it("generates aligned slots within active schedule hours", () => {
    expect(
      getAvailableSlots(
        [mondaySchedule],
        "2026-09-21",
        15,
        new Date("2026-09-14T03:50:00Z"),
      ),
    ).toEqual(["09:00", "09:15", "09:30", "09:45"]);
  });

  it("removes elapsed slots for today's India time", () => {
    expect(
      getAvailableSlots(
        [mondaySchedule],
        "2026-09-14",
        15,
        new Date("2026-09-14T03:50:00Z"),
      ),
    ).toEqual(["09:30", "09:45"]);
  });

  it("ignores inactive or wrong-day schedules", () => {
    expect(
      getAvailableSlots(
        [
          { ...mondaySchedule, is_active: false },
          { ...mondaySchedule, day_of_week: 2 },
        ],
        "2026-09-21",
        15,
      ),
    ).toEqual([]);
  });

  it("formats India dates and readable appointment times", () => {
    expect(getIndiaDate(new Date("2026-09-13T20:00:00Z"))).toBe(
      "2026-09-14",
    );
    expect(formatSlot("09:05")).toBe("9:05 AM");
    expect(formatSlot("13:30")).toBe("1:30 PM");
  });
});
