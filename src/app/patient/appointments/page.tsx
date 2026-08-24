"use client";

import { useState, useEffect, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";

type Doctor = {
  id: string;
  specialization: string;
  room_number: string;
  average_consultation_minutes: number;
  hospital_id: string;
  department_id: string;
  profiles: { full_name: string };
  departments: { name: string };
  hospitals: { name: string };
};

type Appointment = {
  id: string;
  appointment_date: string;
  slot_start: string;
  status: string;
  doctors: { specialization: string; profiles: { full_name: string } };
  departments: { name: string };
};

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorId = searchParams.get("doctorId");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (doctorId) {
      const { data: doc } = await supabase
        .from("doctors")
        .select("*, profiles(full_name), departments(name), hospitals(name)")
        .eq("id", doctorId)
        .single();
      setDoctor(doc);
    }

    if (user) {
      const { data: appts } = await supabase
        .from("appointments")
        .select(
          "*, doctors(specialization, profiles(full_name)), departments(name)",
        )
        .eq("patient_id", user.id)
        .order("appointment_date", { ascending: false });
      setAppointments(appts || []);
    }

    setLoading(false);
  };

  const handleBook = async () => {
    setBooking(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !doctor) {
      setError("Please login first");
      setBooking(false);
      return;
    }

    const { error: bookError } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctor.id,
      department_id: doctor.department_id,
      appointment_date: date,
      slot_start: time,
      slot_end: time,
      status: "pending",
    });

    if (bookError) {
      setError(bookError.message);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      const isForToday = date === todayStr;

      // Find or auto-initialize queue for doctor
      let { data: queue } = await supabase
        .from("queues")
        .select("id, current_token_number")
        .eq("doctor_id", doctor.id)
        .eq("status", "active")
        .eq("queue_date", date)
        .maybeSingle();

      // If queue doesn't exist for today, automatically start it
      if (!queue && isForToday) {
        const { data: newQueue } = await supabase
          .from("queues")
          .insert({
            doctor_id: doctor.id,
            hospital_id: doctor.hospital_id,
            department_id: doctor.department_id,
            queue_date: date,
            current_token_number: 0,
            status: "active",
          })
          .select("id, current_token_number")
          .single();

        queue = newQueue;
      }

      if (queue) {
        // Count existing tokens in this queue to get accurate sequential number
        const { count: tokenCount } = await supabase
          .from("tokens")
          .select("*", { count: "exact", head: true })
          .eq("queue_id", queue.id);

        const newToken = (tokenCount || 0) + 1;

        const { data: tokenData } = await supabase
          .from("tokens")
          .insert({
            queue_id: queue.id,
            patient_id: user.id,
            token_number: newToken,
            priority: "normal",
            status: "waiting",
            joined_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Notification send karo
        await supabase.from("notifications").insert({
          patient_id: user.id,
          message: `Your token #${newToken} has been generated successfully! You can track live queue status.`,
          type: "token_booked",
          is_read: false,
        });

        setSuccess(`Appointment confirmed! Token #${newToken} generated.`);

        if (tokenData?.id) {
          router.push(`/patient/queue/${tokenData.id}`);
          return;
        }
      } else {
        setSuccess(`Appointment booked for ${date}! Your token will be activated on the appointment date.`);
      }
      setDate("");
      setTime("");
      fetchData();
    }
    setBooking(false);
  };

  const docFullName = Array.isArray(doctor?.profiles)
    ? doctor?.profiles[0]?.full_name
    : doctor?.profiles?.full_name || doctor?.specialization || "Doctor";

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">My Appointments</h1>

      {doctor && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-slate-800 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Book Appointment — {docFullName}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {doctor.specialization} • {doctor.departments?.name} •{" "}
            {doctor.hospitals?.name} • Room {doctor.room_number}
          </p>

          {error && <p className="mt-3 text-red-600 dark:text-red-400 text-sm">{error}</p>}
          {success && <p className="mt-3 text-green-600 dark:text-green-400 text-sm">{success}</p>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300 mb-1 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2"
              />
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={booking || !date || !time}
            className="mt-4 w-full rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-800 disabled:bg-slate-300 sm:w-auto"
          >
            {booking ? "Booking..." : "Confirm Appointment"}
          </button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Previous Appointments
        </h2>
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No appointments yet.</p>
        ) : (
          <div className="grid gap-4">
            {appointments.map((a) => {
              const docObj = a.doctors as any;
              const docName = Array.isArray(docObj?.profiles)
                ? docObj?.profiles[0]?.full_name
                : docObj?.profiles?.full_name || docObj?.specialization || "Doctor";

              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {docName}
                    </h3>
                    <p className="break-words text-sm text-slate-500 dark:text-slate-400">
                      {a.departments?.name} • {a.appointment_date} •{" "}
                      {a.slot_start}
                    </p>
                  </div>
                  <span
                    className={`w-full rounded-full px-3 py-1 text-center text-xs font-semibold sm:w-auto ${
                      a.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : a.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : a.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      <Suspense fallback={<p className="p-8 text-slate-500 dark:text-slate-400">Loading...</p>}>
        <AppointmentsContent />
      </Suspense>
    </main>
  );
}
