import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'sanzang-theme'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage unavailable (private mode) — fall through to default */
  }
  return 'dark' // xuqiu.txt §13: 默认主题必须是暗黑科技风
}

/**
 * Theme state, persisted to localStorage (xuqiu.txt §13: 保存用户主题选择).
 * The `data-theme` attribute on <html> drives all colour tokens.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, setTheme, toggle }
}
