'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      applyDark()
      setIsDark(true)
    }
  }, [])

  const applyDark = () => {
    document.body.style.backgroundColor = '#0f172a'
    document.body.style.color = '#f8fafc'
    document.querySelectorAll('.card-bg').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '#1e293b'
      ;(el as HTMLElement).style.color = '#f8fafc'
    })
  }

  const applyLight = () => {
    document.body.style.backgroundColor = '#f8fafc'
    document.body.style.color = '#0f172a'
    document.querySelectorAll('.card-bg').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '#ffffff'
      ;(el as HTMLElement).style.color = '#0f172a'
    })
  }

  const toggleTheme = () => {
    if (isDark) {
      applyLight()
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      applyDark()
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-100 transition text-lg"
      title="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
