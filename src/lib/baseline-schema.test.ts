import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const baseline = readFileSync(
  join(process.cwd(), "supabase", "baseline.sql"),
  "utf8",
).toLowerCase();

const expectedTables = [
  "hospitals",
  "profiles",
  "departments",
  "doctors",
  "doctor_schedules",
  "appointments",
  "queues",
  "tokens",
  "notifications",
  "ai_conversations",
  "ai_messages",
  "symptom_assessments",
];

describe("Supabase baseline", () => {
  it.each(expectedTables)("defines and protects %s", (table) => {
    expect(baseline).toContain(`create table if not exists public.${table}`);
    expect(baseline).toContain(
      `alter table public.${table} enable row level security`,
    );
  });

  it("does not grant blanket access to public tables", () => {
    expect(baseline).toContain(
      "revoke all on all tables in schema public from public, anon, authenticated",
    );
  });
});
