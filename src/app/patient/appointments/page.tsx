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
  display_name: string;
  departments: { name: string };
  hospitals: { name: string };
};

type Appointment = {
  id: string;
  appointment_date: string;
  slot_start: string;
  status: string;
  doctors: { specialization: string; display_name: string };
  departments: { name: string };
};

type BookingResult = {
  appointment_id: string;
  queue_id: string;
  token_id: string;
  token_number: number;
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
        .select("*, departments(name), hospitals(name)")
        .eq("id", doctorId)
        .single();
      setDoctor(doc);
    }

    if (user) {
      const { data: appts } = await supabase
        .from("appointments")
        .select(
          "*, doctors(specialization, display_name), departments(name)",
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

    if (!doctor) {
      setError("Please login first");
      setBooking(false);
      return;
    }

    const { data, error: bookError } = await supabase.rpc(
      "book_appointment_atomic",
      {
        requested_doctor_id: doctor.id,
        requested_date: date,
        requested_slot_start: time,
      },
    );

    if (bookError) {
      setError(
        /already has an appointment/i.test(bookError.message)
          ? "That time slot was just booked. Please choose another time."
          : bookError.message,
      );
      setBooking(false);
      return;
    }

    const result = (data as BookingResult[] | null)?.[0];
    if (!result?.token_id) {
      setError("Booking completed without a queue token. Please contact support.");
      setBooking(false);
      return;
    }

    setSuccess(
      `Appointment confirmed. Token #${result.token_number} generated.`,
    );
    setDate("");
    setTime("");
    router.push(`/patient/queue/${result.token_id}`);
    setBooking(false);
  };

  const docFullName = doctor?.display_name || doctor?.specialization || "Doctor";

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
              const docName =
                a.doctors?.display_name || a.doctors?.specialization || "Doctor";

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
