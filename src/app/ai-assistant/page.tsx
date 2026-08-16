"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { assessSymptoms, type SymptomAssessment } from "@/lib/ai";

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [assessment, setAssessment] = useState<SymptomAssessment | null>(null);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">AI assistant</h1>
        <p className="mt-2 text-slate-600">
          Describe symptoms to get safe department navigation. This is not a diagnosis.
        </p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Example: I have fever and cough since yesterday"
            className="min-h-36 w-full rounded-lg border border-slate-300 px-4 py-3"
          />
          <button
            onClick={() => setAssessment(assessSymptoms(message))}
            disabled={!message.trim()}
            className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Check department guidance
          </button>
        </div>
        {assessment && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">
              Recommended department: {assessment.recommended_department}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{assessment.reason}</p>
            {assessment.needs_emergency_care && (
              <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
                Please seek immediate emergency medical care.
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
