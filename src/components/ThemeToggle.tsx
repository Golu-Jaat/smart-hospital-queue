'use client';

import { useTheme } from "next-themes";

function persistThemeCookie(theme: "dark" | "light") {
  document.cookie = `theme=${encodeURIComponent(theme)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const isDark =
      resolvedTheme === "dark" ||
      (!resolvedTheme && document.documentElement.classList.contains("dark"));
    const nextTheme = isDark ? "light" : "dark";
    persistThemeCookie(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg leading-none flex items-center justify-center cursor-pointer"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <span className="dark:hidden" aria-hidden="true">🌙</span>
      <span className="hidden dark:inline" aria-hidden="true">☀️</span>
    </button>
  );
}
