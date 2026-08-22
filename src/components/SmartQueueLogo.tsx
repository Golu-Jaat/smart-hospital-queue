"use client";

export type LogoVariant = "pulse-cross" | "smart-shield" | "infinity-flow" | "token-hex";

interface SmartQueueLogoProps {
  size?: number;
  className?: string;
  variant?: LogoVariant;
}

export function SmartQueueLogo({
  size = 36,
  className = "",
  variant = "pulse-cross",
}: SmartQueueLogoProps) {
  // Concept 2: Smart Shield & Q-Pass
  if (variant === "smart-shield") {
    return (
      <div
        className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 duration-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Shield Base */}
          <path
            d="M50 8L86 22V50C86 72 70.5 90.5 50 96C29.5 90.5 14 72 14 50V22L50 8Z"
            fill="url(#shieldGrad)"
          />
          {/* Glowing Inner Shield */}
          <path
            d="M50 16L78 27V49C78 67 65.5 82 50 87C34.5 82 22 67 22 49V27L50 16Z"
            fill="#0f172a"
            fillOpacity="0.4"
          />
          {/* Medical Cross Center */}
          <path
            d="M44 32H56V44H68V56H56V68H44V56H32V44H44V32Z"
            fill="url(#glowGrad)"
            filter="url(#glowEffect)"
          />
          {/* Dynamic Fast-Track Arrow (Q Tail) */}
          <circle cx="70" cy="70" r="9" fill="#10b981" />
          <path d="M68 66L74 70L68 74" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // Concept 3: Infinity Flow Ring
  if (variant === "infinity-flow") {
    return (
      <div
        className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 duration-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="centerPlusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Continuous Orbit Track */}
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="url(#flowGrad1)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="170 55"
          />
          {/* Medical Plus Center */}
          <rect x="43" y="28" width="14" height="44" rx="7" fill="url(#centerPlusGrad)" />
          <rect x="28" y="43" width="44" height="14" rx="7" fill="url(#centerPlusGrad)" />
          <circle cx="50" cy="50" r="5" fill="white" />
          {/* Orbiting Sync Particle */}
          <circle cx="86" cy="38" r="5" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  // Concept 4: 3D Hologram Token Hexagon
  if (variant === "token-hex") {
    return (
      <div
        className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 duration-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          <defs>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Hexagon Body */}
          <polygon
            points="50,6 88,27 88,73 50,94 12,73 12,27"
            fill="url(#hexGrad)"
            stroke="url(#borderGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Inner Token Circle */}
          <circle cx="50" cy="50" r="26" fill="#1e3a8a" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
          {/* Glowing Medical Plus */}
          <rect x="45" y="34" width="10" height="32" rx="5" fill="#38bdf8" />
          <rect x="34" y="45" width="32" height="10" rx="5" fill="#38bdf8" />
          <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
          {/* Top Token ID LED */}
          <circle cx="50" cy="18" r="3" fill="#10b981" />
        </svg>
      </div>
    );
  }

  // Concept 1: Modern Pulse-Cross (Default)
  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform hover:scale-105 duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          <linearGradient id="crossGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="pulseGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Box */}
        <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#crossGrad1)" />

        {/* Hospital Medical Cross Base */}
        <rect x="42" y="22" width="16" height="56" rx="8" fill="white" />
        <rect x="22" y="42" width="56" height="16" rx="8" fill="white" />

        {/* Futuristic Real-Time ECG Heartbeat & Queue Wave */}
        <path
          d="M18 50H34L40 34L48 64L56 42L62 50H82"
          stroke="url(#pulseGrad1)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active Real-Time Signal Dot */}
        <circle cx="80" cy="20" r="5" fill="#10b981" />
        <circle cx="80" cy="20" r="7" stroke="#34d399" strokeWidth="2" opacity="0.6" />
      </svg>
    </div>
  );
}
