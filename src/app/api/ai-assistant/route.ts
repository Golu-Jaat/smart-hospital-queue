import { supabase } from "@/lib/supabase";
import { assessSymptoms } from "@/lib/ai";

export const runtime = "nodejs";

type GeminiResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type AssistantRequest = {
  message?: unknown;
};

type DepartmentRow = {
  name: string | null;
};

const defaultDepartments =
  "General Medicine, Cardiology, Orthopedics, Pediatrics, Dermatology";
const defaultGeminiModel = "gemini-3.6-flash";
const departmentCacheTtlMs = 5 * 60 * 1000;
const aiTimeoutMs = 2500;

let cachedDepartments: { value: string; expiresAt: number } | null = null;

function buildLocalResponse(patientMessage: string) {
  const result = assessSymptoms(patientMessage);
  const useHindi = /[\u0900-\u097F]/.test(patientMessage);

  if (result.needs_emergency_care) {
    if (useHindi) {
      return [
        "Aapke symptoms urgent medical attention ke ho sakte hain.",
        "",
        "Recommended department: Emergency",
        `Reason: ${result.reason}`,
        "",
        "Kripya abhi 108 / 112 par call karein ya nearest emergency care me jayein. OPD appointment ka wait na karein.",
        "",
        "Disclaimer: Main doctor nahi hoon.",
      ].join("\n");
    }

    return [
      "Your symptoms may need urgent medical attention.",
      "",
      "Recommended department: Emergency",
      `Reason: ${result.reason}`,
      "",
      "Please call 108 / 112 or go to the nearest emergency care now. Do not wait for an OPD appointment.",
      "",
      "Disclaimer: I am not a doctor.",
    ].join("\n");
  }

  if (useHindi) {
    return [
      "Samjha. Aapke symptoms ke basis par OPD consultation better rahega.",
      "",
      `Recommended department: ${result.recommended_department}`,
      `Reason: ${result.reason}`,
      `Urgency: ${result.urgency.toUpperCase()}`,
      "",
      "Next step: Is department me appointment book karein ya queue join karein. Agar breathing problem, chest pain, behoshi, heavy bleeding, confusion, ya symptoms severe ho jayein to turant 108 / 112 call karein.",
      "",
      "Disclaimer: Main doctor nahi hoon.",
    ].join("\n");
  }

  return [
    "I understand. Based on what you shared, this is best routed through OPD consultation.",
    "",
    `Recommended department: ${result.recommended_department}`,
    `Reason: ${result.reason}`,
    `Urgency: ${result.urgency.toUpperCase()}`,
    "",
    "Next step: Book an appointment or join the queue for this department. If symptoms become severe, especially breathing difficulty, chest pain, fainting, heavy bleeding, or confusion, call 108 / 112 immediately.",
    "",
    "Disclaimer: I am not a doctor.",
  ].join("\n");
}

function aiUnavailableResponse(patientMessage: string, model: string, debug?: unknown) {
  return Response.json({
    message: buildLocalResponse(patientMessage),
    fallback: true,
    ...(process.env.NODE_ENV === "development"
      ? {
          debug: {
            model,
            geminiError: debug,
          },
        }
      : {}),
  });
}

async function getDepartmentList() {
  if (cachedDepartments && cachedDepartments.expiresAt > Date.now()) {
    return cachedDepartments.value;
  }

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 800),
  );

  const departmentsRequest = supabase
    .from("departments")
    .select("name")
    .eq("is_active", true)
    .returns<DepartmentRow[]>()
    .then(({ data }) => data);

  const departments = await Promise.race([departmentsRequest, timeout]);
  const value =
    departments
      ?.map((department) => department.name)
      .filter((name): name is string => Boolean(name))
      .join(", ") || defaultDepartments;

  cachedDepartments = {
    value,
    expiresAt: Date.now() + departmentCacheTtlMs,
  };

  return value;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;

  let body: AssistantRequest;
  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patientMessage = typeof body.message === "string" ? body.message.trim() : "";

  if (!patientMessage) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  if (!apiKey) {
    return aiUnavailableResponse(patientMessage, model, "AI service is not configured.");
  }

  const deptList = await getDepartmentList();

  const prompt = `You are Smart Hospital's OPD navigation assistant.
Available departments: ${deptList}.

Respond in the patient's language. Keep it warm, clear, and useful.

Format:
1. Start with a short acknowledgement.
2. Recommend exactly one department from the available list.
3. Give a brief reason.
4. Ask 1-2 important follow-up questions only if needed.
5. Give safe next steps for OPD booking/queue.
6. If symptoms sound urgent, clearly tell them to call 108/112 or go to emergency care now.

Safety rules:
- Do not diagnose diseases.
- Do not prescribe medicines, dosages, or treatment.
- Do not claim certainty.
- End with: "Disclaimer: I am not a doctor."

Patient says: ${patientMessage}`;

  let response: Response | null;
  try {
    response = await Promise.race([
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: { maxOutputTokens: 450 },
          }),
        },
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), aiTimeoutMs)),
    ]);
  } catch (error) {
    return aiUnavailableResponse(
      patientMessage,
      model,
      error instanceof Error ? error.message : error,
    );
  }

  if (!response) {
    return aiUnavailableResponse(patientMessage, model, "AI response timeout");
  }

  const data = (await Promise.race([
    response.json(),
    new Promise<GeminiResponse>((resolve) =>
      setTimeout(
        () => resolve({ error: { message: "AI response timeout" } }),
        aiTimeoutMs,
      ),
    ),
  ])) as GeminiResponse;
  const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!response.ok || data.error || !assistantMessage || assistantMessage.length < 80) {
    if (process.env.AI_DEBUG === "true") {
      console.warn("Gemini API failed", {
        status: response.status,
        model,
        error: data.error,
      });
    }
    return aiUnavailableResponse(patientMessage, model, {
      status: response.status,
      error: data.error,
    });
  }

  return Response.json({ message: assistantMessage });
}
