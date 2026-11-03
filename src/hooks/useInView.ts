import { useEffect, useRef, useState } from 'react'

/**
 * Reports whether the element is in the viewport.
 *
 * xuqiu.txt §11 + §16.3: entrance animations fire on scroll via
 * IntersectionObserver, and the observer is disconnected after the first hit so
 * the animation never replays on the way back up.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver support → show content rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      }
    }, options)

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, inView }
}
