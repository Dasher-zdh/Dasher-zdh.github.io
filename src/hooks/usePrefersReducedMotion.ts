import { useEffect, useState } from 'react'

/**
 * Tracks `prefers-reduced-motion: reduce`.
 *
 * xuqiu.txt §16.7–16.8: when the user asks for reduced motion, parallax,
 * particles and complex entrance animations must be disabled — but the final
 * rendered state must still be the *readable* one (see `accessible-motion`).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
