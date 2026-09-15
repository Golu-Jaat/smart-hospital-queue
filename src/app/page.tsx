"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const featurePills = [
  { id: "queue", icon: "🏥", label: "Smart OPD Queue", highlight: "Zero Waiting Fatigue" },
  { id: "ai", icon: "🤖", label: "AI Symptom Triage", highlight: "AI Department Routing" },
  { id: "tv", icon: "📢", label: "Live TV Broadcast", highlight: "Voice-Announced Turns" },
  { id: "qr", icon: "🎫", label: "Digital Passes", highlight: "Verifiable QR Token Passes" },
  { id: "priority", icon: "🚨", label: "Emergency Triage", highlight: "Senior & Emergency Fast-Track" },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [quickTokenId, setQuickTokenId] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // 3D Parallax Mouse Tracking on Card
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Typewriter effect logic
  useEffect(() => {
    const currentWord = featurePills[activeTab].highlight;

    const handleType = () => {
      if (!isDeleting) {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        setTypingSpeed(75);

        if (displayText === currentWord) {
          // Pause at full word
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        setTypingSpeed(40);

        if (displayText === "") {
          setIsDeleting(false);
          setLoopNum((prev) => prev + 1);
          setActiveTab((prev) => (prev + 1) % featurePills.length);
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, activeTab, typingSpeed, loopNum]);

  // Handle 3D Parallax on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 18;
    const rotateY = (x / rect.width) * 18;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTokenId.trim()) return;
    router.push(`/patient/queue/${quickTokenId.trim()}`);
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-slate-50 selection:bg-blue-500 selection:text-white dark:bg-slate-950 transition-colors">
      <Navbar />

      {/* Ambient 3D Mesh Lighting Glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-600/12 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-3d" />
      <div className="absolute top-72 right-10 w-[450px] h-[450px] bg-purple-500/15 dark:bg-indigo-600/12 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-3d" style={{ animationDelay: "3s" }} />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-3 pb-16 pt-8 sm:px-4 sm:pb-20 sm:pt-12 lg:grid-cols-12 lg:gap-8 lg:py-20">
        {/* Left Column: Ultra-Professional Interactive Hero */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Interactive Feature Category Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {featurePills.map((pill, idx) => (
              <button
                key={pill.id}
                onClick={() => {
                  setActiveTab(idx);
                  setIsDeleting(false);
                  setDisplayText("");
                }}
                className={`flex max-w-full shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  activeTab === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500"
                }`}
              >
                <span>{pill.icon}</span>
                <span className="whitespace-nowrap">{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Main Professional Kinetic Heading */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Cloud Real-Time Synchronization Active</span>
            </div>

            <h1 className="text-3xl font-black leading-[1.12] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Smart Hospital AI Queue for{" "}
              <span className="mt-2 block min-h-20 break-words bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text font-mono text-2xl font-black leading-tight text-transparent [overflow-wrap:anywhere] dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 sm:min-h-24 sm:text-4xl lg:text-5xl">
                {displayText}
                <span className="ml-1 inline-block h-7 w-1 animate-pulse bg-blue-600 align-middle dark:bg-blue-400 sm:h-10" />
              </span>
            </h1>
          </div>

          {/* Interactive Feature Tags Inside Subtitle */}
          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
            A unified healthcare platform engineered to streamline hospital OPD workflows with{" "}
            <span className="inline-block bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-semibold text-sm mx-1">
              ⚡ Zero Waiting
            </span>
            ,{" "}
            <span className="inline-block bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-semibold text-sm mx-1">
              📢 Live TV Speech
            </span>
            , and{" "}
            <span className="inline-block bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold text-sm mx-1">
              🎫 Digital QR Passes
            </span>
            .
          </p>

          {/* Quick Token Live Search / Jump Bar */}
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-2.5">
            <form onSubmit={handleQuickTrack} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="hidden pl-2 text-lg sm:inline">🔍</span>
              <input
                type="text"
                value={quickTokenId}
                onChange={(e) => setQuickTokenId(e.target.value)}
                placeholder="Enter Token ID to Track Live (e.g. 14)..."
                className="min-w-0 w-full flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder-slate-400 dark:text-white sm:px-2 sm:py-0"
              />
              <button
                type="submit"
                className="w-full flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 sm:w-auto sm:hover:scale-105"
              >
                Track Live →
              </button>
            </form>
          </div>

          {/* Primary Quick Portals */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/patient/dashboard"
              prefetch={false}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 active:scale-95 sm:w-auto sm:hover:scale-105"
            >
              Get OPD Token →
            </Link>
            <Link
              href="/display"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:w-auto sm:hover:scale-105"
            >
              <span>📺 TV Waiting Hall Display</span>
            </Link>
            <Link
              href="/ai-assistant"
              className="w-full rounded-2xl bg-slate-100 px-4 py-3.5 text-center text-xs font-semibold text-slate-700 transition hover:text-blue-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white sm:w-auto"
            >
              🎙️ Voice AI
            </Link>
          </div>

          {/* Live Trust Metrics */}
          <div className="grid max-w-lg grid-cols-1 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800/80 sm:grid-cols-3 sm:gap-4">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">0 sec</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">WebSocket Delay</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">100%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cloud Real-Time</p>
            </div>
            <div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">Hindi + EN</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Voice Announce</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Holographic Token Card with Mouse-Tracking Parallax */}
        <div
          className="lg:col-span-5 perspective-1000"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="preserve-3d cursor-pointer"
          >
            {/* Hologram 3D Pass */}
            <div className="hologram-card rounded-3xl border border-white/60 bg-gradient-to-br from-white via-slate-50/95 to-blue-50/60 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/80 dark:from-slate-850 dark:via-slate-800 dark:to-slate-900 sm:p-8">
              <div className="flex flex-col gap-3 border-b border-dashed border-slate-200 pb-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30">
                    🏥
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Smart OPD Live Pass</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Apollo Multi-Specialty Hospital</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                  ● LIVE SERVING
                </span>
              </div>

              {/* 3D Giant Token Counter Box */}
              <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Your Token Number</p>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white animate-pulse sm:text-6xl">
                    #14
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-amber-400">
                  <span>🔔 Proceed to <strong>Room 102</strong></span>
                  <span>•</span>
                  <span>Dr. Sharma (Cardiology)</span>
                </div>
              </div>

              {/* Live Wait Estimation Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Ahead of You</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">1 Patient</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Est. Wait Time</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">~6 mins</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  3D Holographic Pass Active
                </span>
                <span className="font-mono text-slate-400">OPD-PASS-2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Feature Cards Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for High-Volume Healthcare
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Explore core real-time modules powering queue management across hospitals
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Patient Live Queue",
              desc: "Real-time token positions, countdown wait estimates, and digital QR verification pass.",
              icon: "📱",
              href: "/patient/dashboard",
              color: "hover:border-blue-500",
            },
            {
              title: "Doctor Cabin Suite",
              desc: "Instant 1-click token call, emergency triage fast-track, and broadcast delay controls.",
              icon: "👨‍⚕️",
              href: "/doctor/dashboard",
              color: "hover:border-indigo-500",
            },
            {
              title: "Waiting Room TV Screen",
              desc: "Fullscreen kiosk display with synthesized chimes and Hindi/English voice announcements.",
              icon: "📺",
              href: "/display",
              color: "hover:border-purple-500",
            },
            {
              title: "Voice Symptom AI",
              desc: "Speak symptoms via microphone in Hindi or English for intelligent department routing.",
              icon: "🎙️",
              href: "/ai-assistant",
              color: "hover:border-pink-500",
            },
          ].map((card, idx) => (
            <Link
              key={idx}
              href={card.href}
              prefetch={
                !card.href.startsWith("/patient") &&
                !card.href.startsWith("/doctor")
              }
              className={`card-3d-hover p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${card.color} shadow-sm group block`}
            >
              <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {card.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Explore</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
