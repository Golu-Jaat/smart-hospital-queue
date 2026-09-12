"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Doctor = {
  id: string;
  specialization: string;
  room_number: string;
  average_consultation_minutes: number;
  display_name: string;
  departments: { name: string };
  hospitals: { name: string };
};

function DoctorsContent() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hospitalId = searchParams.get("hospitalId");

  useEffect(() => {
    const fetchDoctors = async () => {
      let query = supabase
        .from("doctors")
        .select("*, departments(name), hospitals(name)")
        .eq("is_active", true);

      if (hospitalId) {
        query = query.eq("hospital_id", hospitalId);
      }

      const { data } = await query;
      setDoctors(data || []);
      setLoading(false);
    };
    fetchDoctors();
  }, [hospitalId]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Find Doctor</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Select a doctor to book appointment or get token.
      </p>

      {loading ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">Loading...</p>
      ) : doctors.length === 0 ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">No doctors found.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <button
              key={d.id}
              onClick={() =>
                router.push(`/patient/appointments?doctorId=${d.id}`)
              }
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-left hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition"
            >
              <h2 className="font-semibold text-slate-950 dark:text-white">
                {d.display_name || d.specialization || "Doctor"}
              </h2>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{d.specialization}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {d.departments?.name}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d.hospitals?.name}</p>
              <div className="mt-3 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>Room: {d.room_number || "N/A"}</span>
                <span>Avg: {d.average_consultation_minutes} min</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PatientDoctorsPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <Suspense fallback={<p className="p-8 text-slate-500 dark:text-slate-400">Loading...</p>}>
        <DoctorsContent />
      </Suspense>
    </main>
  );
}
