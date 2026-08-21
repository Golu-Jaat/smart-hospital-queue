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

  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("en-IN");

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors relative overflow-hidden">
      <Navbar />

      {/* Ambient background light */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float-3d" />

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {/* 3D Floating AI Core Orb */}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30 transform transition-transform ${
              isListening ? "scale-110 animate-pulse-ring" : "animate-float-3d"
            }`}>
              🤖
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                AI Symptom Assistant
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">v2.0</span>
              </h1>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Describe your symptoms or speak using microphone for department triage.
              </p>
            </div>
          </div>
          {/* Language Selector for Speech */}
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => setVoiceLang("en-IN")}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                voiceLang === "en-IN"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setVoiceLang("hi-IN")}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                voiceLang === "hi-IN"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>

        {!apiKey && (
          <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3">
            <p className="text-amber-800 dark:text-amber-300 text-xs">
              ℹ️ Using Local Medical Rule Evaluator (Emergency detection & intelligent department triage active).
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-2xl text-sm animate-pulse">
                  Thinking & evaluating medical guidelines...
                </div>
              </div>
            )}
          </div>

          {/* Voice Listening Active Banner */}
          {isListening && (
            <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center justify-between text-xs text-red-500 font-semibold animate-pulse">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Listening in {voiceLang === "hi-IN" ? "हिंदी" : "English"}... Speak your symptoms now
              </span>
              <span>🎙️ Active</span>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex items-center gap-2">
            {/* Mic Button */}
            <button
              onClick={startVoiceInput}
              disabled={loading}
              title={`Click to Speak (${voiceLang === "hi-IN" ? "Hindi" : "English"})`}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center text-lg ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse shadow-lg shadow-red-500/30"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200"
              }`}
            >
              🎙️
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              placeholder={
                voiceLang === "hi-IN"
                  ? "अपने लक्षण लिखें या 🎙️ माइक दबाकर बोलें..."
                  : "Type symptoms or press 🎙️ mic to speak..."
              }
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 shadow-sm transition"
            >
              Send
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">
          This AI assistant is for OPD navigation only. It cannot diagnose or treat emergencies.
        </p>
      </section>
    </main>
  );
}
