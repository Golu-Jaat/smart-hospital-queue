import { createHmac } from "node:crypto";
import { supabase } from "@/lib/supabase";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
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
const defaultGeminiModel = "gemini-3.1-flash-lite";
const departmentCacheTtlMs = 5 * 60 * 1000;
const aiTimeoutMs = 5000;
const rateLimitWindowMs = 60 * 1000;
const maxRequestsPerWindow = 12;
const maxMessageLength = 2000;

type RateLimitEntry = { count: number; resetAt: number };
type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const localRateLimits = new Map<string, RateLimitEntry>();

let cachedDepartments: { value: string; expiresAt: number } | null = null;

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function getRateLimitKey(request: Request) {
  const salt =
    process.env.AI_RATE_LIMIT_SALT ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY ||
    "smartqueue-local-rate-limit";

  return createHmac("sha256", salt)
    .update(getClientAddress(request))
    .digest("hex");
}

function checkLocalRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = localRateLimits.get(key);

  if (!existing || existing.resetAt <= now) {
    localRateLimits.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= maxRequestsPerWindow,
    retryAfterSeconds: Math.max(
      Math.ceil((existing.resetAt - now) / 1000),
      1,
    ),
  };
}

async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  const key = getRateLimitKey(request);

  if (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = createAdminSupabaseClient();
      const { data, error } = await adminClient.rpc("consume_ai_rate_limit", {
        rate_limit_key: key,
      });
      const result = (
        data as Array<{ allowed: boolean; retry_after_seconds: number }> | null
      )?.[0];

      if (!error && result) {
        return {
          allowed: result.allowed,
          retryAfterSeconds: result.retry_after_seconds,
        };
      }
    } catch (error) {
      console.error("Distributed AI rate limit unavailable", error);
    }
  }

  return checkLocalRateLimit(key);
}

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

  let departments: DepartmentRow[] | null = null;
  try {
    const { data } = await supabase
      .from("departments")
      .select("name")
      .eq("is_active", true)
      .abortSignal(AbortSignal.timeout(800))
      .returns<DepartmentRow[]>();
    departments = data;
  } catch {
    departments = null;
  }
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
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_000) {
    return Response.json({ error: "Request body is too large." }, { status: 413 });
  }

  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

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

  if (patientMessage.length > maxMessageLength) {
    return Response.json(
      { error: `Message must be ${maxMessageLength} characters or fewer.` },
      { status: 413 },
    );
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiTimeoutMs);
  let response: Response;
  let data: GeminiResponse;
  try {
    response = await fetch(
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
          generationConfig: {
            maxOutputTokens: 450,
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: controller.signal,
      },
    );
    data = (await response.json()) as GeminiResponse;
  } catch (error) {
    return aiUnavailableResponse(
      patientMessage,
      model,
      controller.signal.aborted
        ? "AI response timeout"
        : error instanceof Error
          ? error.message
          : error,
    );
  } finally {
    clearTimeout(timeout);
  }
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
