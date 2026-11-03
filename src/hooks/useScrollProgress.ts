import { useEffect, useRef } from 'react'

/**
 * Scroll progress of an element's content region, 0..1.
 *
 * xuqiu.txt §10 阅读进度条 + the `reading-progress-architecture` article:
 * use a rAF-throttled passive scroll listener rather than doing layout reads
 * inline in the scroll handler.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const ticking = useRef(false)
  const progress = useRef(0)

  useEffect(() => {
    const target = ref.current
    const bar = barRef.current
    if (!target) return

    const update = () => {
      const rect = target.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = rect.height - viewport
      const scrolled = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      progress.current = scrolled
      if (bar) {
        bar.style.transform = `scaleX(${scrolled})`
      }
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (ticking.current) cancelAnimationFrame(0)
    }
  }, [])

  return { ref, barRef }
}
