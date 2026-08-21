"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { assessSymptoms } from "@/lib/ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am Smart Hospital AI Assistant. Please describe your symptoms and I will help you find the right department and doctor. Note: I am not a doctor and cannot diagnose you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    console.log("Gemini API Key loaded:", key ? "YES" : "NO - MISSING");
    setApiKey(key);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    const emergencyKeywords = [
      "chest pain",
      "heart attack",
      "stroke",
      "unconscious",
      "breathing",
      "severe bleeding",
      "overdose",
      "seizure",
    ];
    const isEmergency = emergencyKeywords.some((kw) =>
      userMessage.toLowerCase().includes(kw),
    );

    if (isEmergency) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "EMERGENCY ALERT: Your symptoms suggest a medical emergency.\n\n1. Call emergency services immediately (108/112)\n2. Go to the nearest Emergency Department\n3. Do NOT wait for an appointment\n\nThis AI cannot handle emergencies. Please seek immediate medical care!",
        },
      ]);
      setLoading(false);
      return;
    }

    const runFallbackAssessment = () => {
      const result = assessSymptoms(userMessage);
      const fallbackText = `Based on your symptoms, we recommend visiting the **${result.recommended_department}** department.\n\n` +
        `• **Reason:** ${result.reason}\n` +
        `• **Urgency:** ${result.urgency.toUpperCase()}\n` +
        `• **Suggested Next Step:** Go to the Doctors section to book an appointment or join the queue.\n\n` +
        `*Disclaimer: I am an AI assistant and not a medical doctor. For urgent conditions, please visit the emergency room immediately.*`;
      return fallbackText;
    };

    if (!apiKey) {
      const fallbackResponse = runFallbackAssessment();
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: fallbackResponse,
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: departments } = await supabase
        .from("departments")
        .select("name")
        .eq("is_active", true);

      const deptList =
        departments?.map((d) => d.name).join(", ") || "General Medicine, Cardiology, Orthopedics, Pediatrics, Dermatology";

      const prompt = `You are a helpful hospital AI assistant. Available departments: ${deptList}.
Rules:
1. Ask about symptoms, duration, and severity if needed.
2. Recommend a suitable department from the available list.
3. NEVER diagnose a disease or prescribe specific medicines/dosages.
4. For emergency signs, immediately advise calling 108/112 or visiting the nearest emergency care.
5. Keep responses concise, clear, and reassuring.
6. End with: "Disclaimer: I am not a doctor."
Respond in the same language as the patient.

Patient says: ${userMessage}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: { maxOutputTokens: 1024 },
          }),
        },
      );

      const data = await response.json();

      if (data.error || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Use intelligent rule-based fallback if API quota or key fails
        const fallbackMessage = runFallbackAssessment();
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: fallbackMessage,
          },
        ]);
      } else {
        const assistantMessage = data.candidates[0].content.parts[0].text;
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      }
    } catch (err) {
      console.error("Fetch error, using fallback:", err);
      const fallbackMessage = runFallbackAssessment();
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: fallbackMessage,
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">AI Assistant</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Describe your symptoms to get department guidance.
        </p>

        {!apiKey && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">
              API key missing! Add NEXT_PUBLIC_GEMINI_API_KEY in .env.local and
              restart server.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-lg text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              placeholder="Describe your symptoms..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-blue-700 px-4 py-2 text-white text-sm hover:bg-blue-800 disabled:bg-slate-300"
            >
              Send
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">
          This AI assistant is for navigation only. It cannot diagnose or treat
          medical conditions.
        </p>
      </section>
    </main>
  );
}
