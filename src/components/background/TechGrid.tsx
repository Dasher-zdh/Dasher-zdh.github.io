import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useAdaptiveQuality } from '../../hooks/useAdaptiveQuality'

interface TechGridProps {
  className?: string
  /** Adds the slow teal scan sweep. */
  scan?: boolean
}

/**
 * Animated tech grid backdrop (xuqiu.txt §1 动态网格背景).
 *
 * Uses CSS gradients (no canvas) so it costs the compositor almost nothing:
 *  • two layered linear-gradients form the grid lines
 *  • a slow transform drift creates the movement
 *  • a linear-gradient sweep creates the teal scan light
 *  • hover raises the line brightness locally
 *
 * The drift and the sweep are *continuous* — they cost a frame every frame
 * for the whole life of the page. When the machine cannot keep up (see
 * `useAdaptiveQuality`) the sweep is dropped and the drift is slowed, so the
 * grid never starves the interface of frames.
 */
export function TechGrid({ className, scan = true }: TechGridProps) {
  const reduced = usePrefersReducedMotion()
  const quality = useAdaptiveQuality()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => el.removeEventListener('pointermove', onPointerMove)
  }, [reduced])

  const showScan = scan && !reduced && quality !== 'low'

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden="true"
      data-scan={showScan ? 'on' : 'off'}
      data-quality={quality}
    >
      <div className="tech-grid__lines" />
      {showScan && <div className="tech-grid__scan" />}
      {scan && <div className="tech-grid__spotlight" />}
    </div>
  )
}
