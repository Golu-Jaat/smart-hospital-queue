"use client";

interface SmartQueueLogoProps {
  size?: number;
  className?: string;
  variant?: "pulse-cross" | "smart-shield" | "infinity-flow" | "token-hex";
}

export function SmartQueueLogo({
  size = 36,
  className = "",
  variant = "pulse-cross",
}: SmartQueueLogoProps) {
  if (variant === "smart-shield") {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
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
            fillOpacity="0.35"
          />
          {/* Glowing Cross + Q Tail */}
          <path
            d="M44 32H56V44H68V56H56V68H44V56H32V44H44V32Z"
            fill="url(#glowGrad)"
          />
          {/* Dynamic Fast-Track Arrow */}
          <circle cx="68" cy="68" r="7" fill="#10b981" />
          <path d="M66 65L71 68L66 71" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (variant === "infinity-flow") {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Continuous Loop Track */}
          <circle cx="50" cy="50" r="38" stroke="url(#flowGrad1)" strokeWidth="8" strokeLinecap="round" strokeDasharray="180 50" />
          {/* Medical Plus Center */}
          <rect x="44" y="28" width="12" height="44" rx="6" fill="#3b82f6" />
          <rect x="28" y="44" width="44" height="12" rx="6" fill="#10b981" />
          <circle cx="50" cy="50" r="4" fill="white" />
        </svg>
      </div>
    );
  }

  // Default: Modern Pulse-Cross (Healthcare Cross + High-Speed Queue Wave)
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container with subtle glow */}
        <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#crossGrad)" />

        {/* Hospital Medical Cross Base */}
        <rect x="42" y="22" width="16" height="56" rx="8" fill="white" />
        <rect x="22" y="42" width="56" height="16" rx="8" fill="white" />

        {/* Futuristic Real-Time Heartbeat / Queue Wave */}
        <path
          d="M18 50H34L40 34L48 64L56 42L62 50H82"
          stroke="url(#pulseGrad)"
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
