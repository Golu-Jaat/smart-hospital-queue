'use client';

import { useLayoutEffect, useState } from 'react';

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function persistTheme(isDark: boolean) {
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  document.cookie = `theme=${encodeURIComponent(theme)}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  useLayoutEffect(() => {
    const nextDark = getInitialDarkMode();
    persistTheme(nextDark);
    setIsDark(nextDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    persistTheme(nextDark);
    setIsDark(nextDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg leading-none flex items-center justify-center cursor-pointer"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
