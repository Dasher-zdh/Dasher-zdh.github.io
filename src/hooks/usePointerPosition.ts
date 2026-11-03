import { useEffect, useRef, useState } from 'react'

export interface MousePosition {
  /** Normalised -1..1 relative to the viewport centre. */
  x: number
  y: number
  /** Raw client coordinates. */
  clientX: number
  clientY: number
}

/**
 * Tracks the pointer with rAF throttling (xuqiu.txt §12, §16.4).
 *
 * Returns a null position on touch devices so callers can skip mouse-only
 * effects (3D tilt, cursor glow) entirely on mobile.
 */
export function usePointerPosition(enabled = true): MousePosition | null {
  const [pos, setPos] = useState<MousePosition | null>(null)
  const frame = useRef(0)
  const latest = useRef<MousePosition | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const isCoarse =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    if (isCoarse) return

    const onMove = (e: PointerEvent) => {
      latest.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
        clientX: e.clientX,
        clientY: e.clientY,
      }
      if (!frame.current) {
        frame.current = requestAnimationFrame(() => {
          frame.current = 0
          if (latest.current) setPos(latest.current)
        })
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame.current) cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [enabled])

  return pos
}
