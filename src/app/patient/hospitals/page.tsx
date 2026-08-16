"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Hospital = {
  id: string;
  name: string;
  type: string;
  city: string;
  address: string;
  contact_phone: string;
};

export default function PatientHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHospitals = async () => {
      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setHospitals(data || []);
      setLoading(false);
    };
    fetchHospitals();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-950">Select Hospital</h1>
        <p className="mt-2 text-slate-600">
          Choose a hospital to book appointment or get token.
        </p>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading...</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((h) => (
              <button
                key={h.id}
                onClick={() =>
                  router.push(`/patient/doctors?hospitalId=${h.id}`)
                }
                className="rounded-lg border border-slate-200 bg-white p-5 text-left hover:border-blue-300 hover:shadow-md transition"
              >
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${h.type === "government" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {h.type}
                </span>
                <h2 className="mt-3 font-semibold text-slate-950">{h.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {h.city} • {h.address}
                </p>
                <p className="mt-1 text-sm text-slate-500">{h.contact_phone}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
