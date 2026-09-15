import { describe, expect, it } from "vitest";
import { assessSymptoms } from "./ai";

describe("local medical rule evaluator", () => {
  it("routes emergency language away from routine booking", () => {
    const result = assessSymptoms("Severe chest pain and difficulty breathing");

    expect(result.urgency).toBe("emergency");
    expect(result.needs_emergency_care).toBe(true);
    expect(result.next_action).toBe("seek_emergency_care");
  });

  it.each([
    ["My knee and shoulder hurt", "Orthopedics"],
    ["There is an itchy skin rash", "Dermatology"],
    ["My child has been unwell", "Pediatrics"],
    ["I have blood pressure concerns", "Cardiology"],
    ["I have fever and cough", "General Medicine"],
  ])("routes %s to %s", (message, department) => {
    expect(assessSymptoms(message).recommended_department).toBe(department);
  });

  it("uses general medicine when no specific rule matches", () => {
    expect(assessSymptoms("I do not feel well")).toMatchObject({
      urgency: "normal",
      recommended_department: "General Medicine",
      next_action: "show_available_doctors",
    });
  });
});
