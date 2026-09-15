export type DoctorSchedule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
};

const indiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const indiaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function getIndiaDate(now = new Date()) {
  const parts = Object.fromEntries(
    indiaDateFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getScheduleDay(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function getAvailableSlots(
  schedules: DoctorSchedule[],
  date: string,
  consultationMinutes: number,
  now = new Date(),
) {
  if (!date || consultationMinutes < 1) return [];

  const dayOfWeek = getScheduleDay(date);
  const currentIndiaDate = getIndiaDate(now);
  const currentIndiaMinutes = timeToMinutes(indiaTimeFormatter.format(now));
  const slotLength = Math.max(consultationMinutes, 5);
  const slots = new Set<string>();

  schedules
    .filter(
      (schedule) => schedule.is_active && schedule.day_of_week === dayOfWeek,
    )
    .forEach((schedule) => {
      const start = timeToMinutes(schedule.start_time);
      const end = timeToMinutes(schedule.end_time);

      for (let cursor = start; cursor + slotLength <= end; cursor += slotLength) {
        if (date === currentIndiaDate && cursor <= currentIndiaMinutes) continue;
        slots.add(minutesToTime(cursor));
      }
    });

  return [...slots].sort();
}

export function formatSlot(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}
