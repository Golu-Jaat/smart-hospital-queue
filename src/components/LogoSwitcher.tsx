"use client";

import { useState, useEffect } from "react";
import { SmartQueueLogo, LogoVariant } from "./SmartQueueLogo";

const LOGO_OPTIONS: { id: LogoVariant; title: string; subtitle: string; icon: string }[] = [
  {
    id: "pulse-cross",
    title: "1. Pulse-Cross",
    subtitle: "ECG Wave + Sync Beacon",
    icon: "🏥",
  },
  {
    id: "smart-shield",
    title: "2. Smart Shield",
    subtitle: "Security + Fast-Track Pass",
    icon: "🛡️",
  },
  {
    id: "infinity-flow",
    title: "3. Infinity Flow",
    subtitle: "360° Zero Waiting Loop",
    icon: "♾️",
  },
  {
    id: "token-hex",
    title: "4. Token Hexagon",
    subtitle: "3D Digital Hologram Pass",
    icon: "🎴",
  },
];

export function LogoSwitcher() {
  const [selectedVariant, setSelectedVariant] = useState<LogoVariant>("pulse-cross");

  useEffect(() => {
    const saved = localStorage.getItem("selected_logo_variant") as LogoVariant;
    if (saved && ["pulse-cross", "smart-shield", "infinity-flow", "token-hex"].includes(saved)) {
      setSelectedVariant(saved);
    }
  }, []);

  const handleSelect = (variant: LogoVariant) => {
    setSelectedVariant(variant);
    localStorage.setItem("selected_logo_variant", variant);
    window.dispatchEvent(new Event("logoChanged"));
  };

  return (
    <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Interactive Brand Logo Switcher (Live Test)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click on any logo concept below to preview it live in the Navbar & UI!
          </p>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full">
          Active: {selectedVariant.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LOGO_OPTIONS.map((opt) => {
          const isSelected = selectedVariant === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3 ${
                isSelected
                  ? "bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10 scale-102 ring-2 ring-blue-500/30"
                  : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex-shrink-0">
                <SmartQueueLogo variant={opt.id} size={36} />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold truncate ${
                    isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {opt.title}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {opt.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
