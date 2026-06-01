'use client'
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = saved !== null ? saved === 'true' : prefersDark
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  function toggle() {
    const newVal = !isDark
    setIsDark(newVal)
    localStorage.setItem('darkMode', String(newVal))
    document.documentElement.classList.toggle('dark', newVal)
  }

  return { isDark, toggle, mounted }
}
