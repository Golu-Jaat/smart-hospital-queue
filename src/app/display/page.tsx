"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { announceToken, playChime } from "@/lib/sound";
import Link from "next/link";

type QueueRoom = {
  queueId: string;
  roomNumber: string;
  doctorName: string;
  departmentName: string;
  hospitalName: string;
  hospitalId: string;
  departmentId: string;
  currentTokenNumber: number;
  currentTokenId?: string;
  patientName?: string;
  status: string;
  lastUpdated?: number;
};

type UpcomingToken = {
  id: string;
  tokenNumber: number;
  doctorName: string;
  roomNumber: string;
  patientName: string;
  departmentName: string;
};

export default function WaitingRoomDisplayPage() {
  const [rooms, setRooms] = useState<QueueRoom[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingToken[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<"en" | "hi">("en");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [recentCallId, setRecentCallId] = useState<string | null>(null);

  const soundEnabledRef = useRef(soundEnabled);
  const voiceLangRef = useRef(voiceLang);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    // 1. Fetch hospitals & departments for filters
    const { data: hospData } = await supabase.from("hospitals").select("id, name");
    if (hospData) setHospitals(hospData);

    const { data: deptData } = await supabase.from("departments").select("id, name");
    if (deptData) setDepartments(deptData);

    // 2. Fetch active queues
    const today = new Date().toISOString().split("T")[0];
    const { data: queuesData } = await supabase
      .from("queues")
      .select(
        "id, current_token_number, status, hospital_id, department_id, doctors(room_number, profiles(full_name)), hospitals(name), departments(name)"
      )
      .eq("queue_date", today);

    // 3. Fetch active called & waiting tokens
    const { data: tokensData } = await supabase
      .from("tokens")
      .select("id, queue_id, token_number, status, profiles(full_name), queues(doctor_id, doctors(room_number, profiles(full_name)), departments(name))")
      .in("status", ["called", "waiting"])
      .order("token_number", { ascending: true });

    if (queuesData) {
      const roomList: QueueRoom[] = queuesData.map((q: any) => {
        const activeToken = tokensData?.find(
          (t: any) => t.queue_id === q.id && t.status === "called"
        );

        const docProfiles = (q as any)?.doctors?.profiles;
        const docProfile = Array.isArray(docProfiles)
          ? docProfiles[0]?.full_name
          : docProfiles?.full_name;

        const patientProfiles = (activeToken as any)?.profiles;
        const patientProfile = Array.isArray(patientProfiles)
          ? patientProfiles[0]?.full_name
          : patientProfiles?.full_name;

        return {
          queueId: q.id,
          roomNumber: q.doctors?.room_number || "OPD",
          doctorName: docProfile || "Doctor",
          departmentName: q.departments?.name || "General",
          hospitalName: q.hospitals?.name || "Smart Hospital",
          hospitalId: q.hospital_id,
          departmentId: q.department_id,
          currentTokenNumber: activeToken ? activeToken.token_number : q.current_token_number,
          currentTokenId: activeToken?.id,
          patientName: patientProfile,
          status: q.status,
        };
      });
      setRooms(roomList);
    }

    if (tokensData) {
      const waitingList: UpcomingToken[] = tokensData
        .filter((t: any) => t.status === "waiting")
        .slice(0, 10)
        .map((t: any) => {
          const pName = Array.isArray(t.profiles)
            ? t.profiles[0]?.full_name
            : t.profiles?.full_name || "Patient";

          const queueObj = Array.isArray(t.queues) ? t.queues[0] : t.queues;
          const docObj = Array.isArray(queueObj?.doctors) ? queueObj?.doctors[0] : queueObj?.doctors;
          const docProf = Array.isArray(docObj?.profiles) ? docObj?.profiles[0]?.full_name : docObj?.profiles?.full_name;

          return {
            id: t.id,
            tokenNumber: t.token_number,
            doctorName: docProf || "Doctor",
            roomNumber: docObj?.room_number || "OPD",
            patientName: pName,
            departmentName: queueObj?.departments?.name || "General",
          };
        });
      setUpcoming(waitingList);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Supabase Realtime Subscription for instant sound & screen flash
    const channel = supabase
      .channel("tv_display_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tokens" },
        async (payload: any) => {
          fetchData();
          if (payload.new && payload.new.status === "called") {
            const tokenNum = payload.new.token_number;
            setRecentCallId(payload.new.id);

            // Fetch doctor details for speech announcement
            const { data: queueInfo } = await supabase
              .from("queues")
              .select("doctors(room_number, profiles(full_name)), departments(name)")
              .eq("id", payload.new.queue_id)
              .single();

            const docObj = Array.isArray((queueInfo as any)?.doctors) ? (queueInfo as any)?.doctors[0] : (queueInfo as any)?.doctors;
            const docName = Array.isArray(docObj?.profiles) ? docObj?.profiles[0]?.full_name : docObj?.profiles?.full_name || "";
            const roomNum = docObj?.room_number || "";

            if (soundEnabledRef.current) {
              announceToken({
                tokenNumber: tokenNum,
                doctorName: docName,
                roomNumber: roomNum,
                lang: voiceLangRef.current,
              });
            } else {
              playChime();
            }

            setTimeout(() => setRecentCallId(null), 8000);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedHospital !== "all" && r.hospitalId !== selectedHospital) return false;
    if (selectedDept !== "all" && r.departmentId !== selectedDept) return false;
    return true;
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleEnableAudio = () => {
    playChime();
    setSoundEnabled(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between select-none">
      {/* Top Banner & TV Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-blue-500/30 shadow-lg">
            🏥
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              SMART HOSPITAL
              <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                OPD LIVE DISPLAY
              </span>
            </h1>
            <p className="text-xs text-slate-400">Queue & Token Live Status Board</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Hospital Filter */}
          {hospitals.length > 1 && (
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Voice Language Toggle */}
          <button
            onClick={() => setVoiceLang((prev) => (prev === "en" ? "hi" : "en"))}
            className="bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 rounded-lg px-3 py-2 font-medium flex items-center gap-1.5 transition"
            title="Switch Speech Language"
          >
            <span>🌐</span>
            <span>{voiceLang === "en" ? "Voice: English" : "Voice: हिंदी"}</span>
          </button>

          {/* Audio Enable Button */}
          {!soundEnabled ? (
            <button
              onClick={handleEnableAudio}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 animate-bounce shadow-lg shadow-amber-500/20"
            >
              <span>🔈</span>
              <span>Enable Audio</span>
            </button>
          ) : (
            <button
              onClick={() => setSoundEnabled(false)}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
            >
              <span>🔊</span>
              <span>Audio Active</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 rounded-lg px-3 py-2 font-medium transition"
            title="Toggle Fullscreen"
          >
            ⛶ Fullscreen
          </button>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Exit ✕
          </Link>
        </div>

        {/* Live Clock */}
        <div className="text-right bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
          <p className="text-xl font-bold font-mono text-emerald-400 leading-none">
            {currentTime}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wide">
            {currentDate}
          </p>
        </div>
      </header>

      {/* Main Grid: Active Consultation Rooms */}
      <main className="flex-1 p-6">
        {filteredRooms.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🏥</span>
            <h2 className="text-2xl font-bold text-slate-300">No Active OPD Queues Today</h2>
            <p className="text-slate-500 text-sm mt-2">
              Queues created by hospital staff will appear here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room) => {
              const isNewlyCalled = room.currentTokenId && room.currentTokenId === recentCallId;

              return (
                <div
                  key={room.queueId}
                  className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-2xl ${
                    isNewlyCalled
                      ? "bg-gradient-to-b from-blue-900/90 to-indigo-950 border-blue-400 shadow-blue-500/40 ring-4 ring-blue-500/50 scale-105"
                      : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Room Number & Dept Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        {room.departmentName}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 leading-snug">
                        {room.doctorName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Room</span>
                      <span className="text-2xl font-black text-blue-400 font-mono">
                        {room.roomNumber}
                      </span>
                    </div>
                  </div>

                  {/* Giant Token Display */}
                  <div className="my-6 py-5 px-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center shadow-inner">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                      Now Serving Token
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`text-6xl font-black tracking-tight font-mono ${
                          room.currentTokenNumber > 0 ? "text-amber-400" : "text-slate-600"
                        }`}
                      >
                        {room.currentTokenNumber > 0 ? `#${room.currentTokenNumber}` : "—"}
                      </span>
                    </div>
                    {room.patientName && (
                      <p className="text-sm font-medium text-slate-300 mt-2 truncate">
                        👤 {room.patientName}
                      </p>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Consultation
                    </span>
                    <span className="text-blue-400 font-semibold">Please Proceed →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Bar: Next in Line Marquee & Emergency Helpline */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
        {/* Next Patients Queue */}
        <div className="flex items-center gap-3 flex-1 min-w-[300px] overflow-hidden">
          <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px] flex-shrink-0">
            Next In Line
          </span>
          {upcoming.length === 0 ? (
            <span className="text-slate-500">No waiting patients in queue</span>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
              {upcoming.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex-shrink-0"
                >
                  <span className="font-bold text-amber-400 font-mono">#{u.tokenNumber}</span>
                  <span className="text-slate-300 font-medium">{u.patientName}</span>
                  <span className="text-slate-500 text-[10px]">({u.roomNumber})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Assistance Helpline */}
        <div className="flex items-center gap-4 text-right flex-shrink-0">
          <span className="text-slate-500 hidden sm:inline">
            Need help? Contact reception desk
          </span>
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg font-bold">
            🚨 Emergency: 108 / 112
          </span>
        </div>
      </footer>
    </div>
  );
}
