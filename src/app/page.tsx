"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const dynamicHighlights = [
  "Zero Waiting Fatigue ⏱️",
  "Real-Time OPD Queue 🏥",
  "AI Symptom Assistant 🤖",
  "Live TV Voice Announcements 📢",
  "Digital QR Token Passes 🎫",
];

export default function HomePage() {
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % dynamicHighlights.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden relative">
      <Navbar />

      {/* Ambient 3D Glowing Background Light Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-float-3d" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-indigo-500/15 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-float-3d" style={{ animationDelay: "3s" }} />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Kinetic Text & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
            Next-Gen Smart Hospital Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Smart Hospital AI Queue for{" "}
            <span className="block mt-2 animate-shimmer-text font-mono text-3xl sm:text-5xl font-black h-16 sm:h-20 transition-all duration-300">
              {dynamicHighlights[highlightIndex]}
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
            Eliminate chaotic hospital waiting rooms. Book OPD appointments, track live token queues with real-time wait estimation, get voice-announced turns on waiting hall TVs, and download verifiable QR passes.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/patient/dashboard"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Get Live Token Now →
            </Link>
            <Link
              href="/display"
              className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-blue-500 rounded-2xl font-bold text-sm shadow-sm transition-all hover:scale-105"
            >
              📺 Open TV Display
            </Link>
            <Link
              href="/ai-assistant"
              className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>🎙️ Voice Symptom AI</span>
            </Link>
          </div>

          {/* Trust stats pill */}
          <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 max-w-lg">
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">0 sec</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">WebSocket Sync</p>
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

        {/* Right Column: 3D Floating Token Showcase Card */}
        <div className="lg:col-span-5 perspective-1000">
          <div className="preserve-3d animate-float-3d">
            {/* Main Holographic 3D Pass */}
            <div className="hologram-card rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-slate-700/80 bg-gradient-to-br from-white/90 via-slate-50/90 to-blue-50/50 dark:from-slate-850/95 dark:via-slate-800/95 dark:to-slate-900/95 shadow-2xl backdrop-blur-xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-md">
                    🏥
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Smart OPD Pass</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">City General Hospital</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                  ● LIVE SERVING
                </span>
              </div>

              {/* 3D Giant Token Counter Box */}
              <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-xl" />
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Your Token Number</p>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-6xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white animate-pulse">
                    #14
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
                  <span>🔔 Proceed to <strong>Room 102</strong></span>
                  <span>•</span>
                  <span>Dr. Sharma</span>
                </div>
              </div>

              {/* Wait Estimation Pills */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400">Ahead of You</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">1 Patient</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-slate-500 dark:text-slate-400">Est. Wait</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">~6 mins</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Bilingual Voice Sync Active
                </span>
                <span className="font-mono text-slate-400">PASS-2026-X94</span>
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
