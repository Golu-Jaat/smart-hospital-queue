'use client';

function persistTheme(isDark: boolean) {
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  document.cookie = `theme=${encodeURIComponent(theme)}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    persistTheme(nextDark);
  };

  return (
    <button
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
