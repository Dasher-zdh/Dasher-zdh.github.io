import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'zdh_reading_pos_'

/**
 * Persists the reader's scroll position for a specific post.
 * Offers a non-intrusive banner to restore position on return visits.
 */
export function useReadingMemory(slug: string) {
  const [restored, setRestored] = useState(false)
  const [savedPosition, setSavedPosition] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return
    const key = `${STORAGE_PREFIX}${slug}`
    const raw = localStorage.getItem(key)
    if (raw) {
      const pos = Number(raw)
      // Only prompt if scrolled past 300px
      if (pos > 300) {
        setSavedPosition(pos)
      }
    }

    // Debounced save
    let timeout: number
    const onScroll = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        const top = window.scrollY
        if (top > 250) {
          localStorage.setItem(key, String(Math.round(top)))
        }
      }, 500)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timeout)
    }
  }, [slug])

  const restore = () => {
    if (savedPosition) {
      window.scrollTo({ top: savedPosition, behavior: 'smooth' })
      setSavedPosition(null)
      setRestored(true)
    }
  }

  const dismiss = () => {
    setSavedPosition(null)
  }

  return { savedPosition, restore, dismiss, restored }
}
