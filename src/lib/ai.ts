export type UrgencyLevel = "normal" | "urgent" | "emergency";

export type SymptomAssessment = {
  urgency: UrgencyLevel;
  recommended_department: string;
  reason: string;
  needs_emergency_care: boolean;
  next_action: "show_available_doctors" | "seek_emergency_care";
};

const emergencyPatterns = [
  "chest pain",
  "difficulty breathing",
  "severe bleeding",
  "unconscious",
  "stroke",
  "seizure",
  "poison",
];

const departmentRules: Array<{ keywords: string[]; department: string; reason: string }> = [
  {
    keywords: ["bone", "joint", "fracture", "back pain", "knee", "shoulder"],
    department: "Orthopedics",
    reason: "Symptoms may be appropriate for musculoskeletal evaluation.",
  },
  {
    keywords: ["skin", "rash", "itching", "acne"],
    department: "Dermatology",
    reason: "Skin-related symptoms are commonly reviewed by dermatology.",
  },
  {
    keywords: ["child", "baby", "infant", "pediatric"],
    department: "Pediatrics",
    reason: "Child health concerns should be routed to pediatric care.",
  },
  {
    keywords: ["heart", "palpitation", "blood pressure"],
    department: "Cardiology",
    reason: "Heart and blood-pressure symptoms may need cardiology review.",
  },
  {
    keywords: ["fever", "cough", "cold", "headache", "stomach"],
    department: "General Medicine",
    reason: "General symptoms can start with general medicine evaluation.",
  },
];

export function assessSymptoms(message: string): SymptomAssessment {
  const normalizedMessage = message.toLowerCase();
  const emergencyMatch = emergencyPatterns.some((pattern) =>
    normalizedMessage.includes(pattern),
  );

  if (emergencyMatch) {
    return {
      urgency: "emergency",
      recommended_department: "Emergency",
      reason:
        "Emergency-like symptoms need immediate medical evaluation instead of routine appointment booking.",
      needs_emergency_care: true,
      next_action: "seek_emergency_care",
    };
  }

  const matchedRule = departmentRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(keyword)),
  );

  return {
    urgency: "normal",
    recommended_department: matchedRule?.department || "General Medicine",
    reason:
      matchedRule?.reason ||
      "A general medicine visit can collect details and route you further if needed.",
    needs_emergency_care: false,
    next_action: "show_available_doctors",
  };
}
