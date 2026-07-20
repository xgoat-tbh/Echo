import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'echo_theme'

export function useTheme() {
  const [isLight, setIsLight] = useState(() => localStorage.getItem(STORAGE_KEY) === 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight)
    localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark')
  }, [isLight])

  const toggle = useCallback(() => setIsLight(p => !p), [])

  return { isLight, toggle }
}