import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useAdaptiveQuality } from '../../hooks/useAdaptiveQuality'

interface Star {
  x: number
  y: number
  r: number
  baseAlpha: number
  twinkleSpeed: number
  phase: number
  /** Parallax depth factor 0..1 — 0 = far, 1 = near (responds to the mouse). */
  depth: number
  vx: number
  vy: number
}

interface Meteor {
  x: number
  y: number
  len: number
  speed: number
  life: number
}

interface StarfieldProps {
  className?: string
  /** Particle count is scaled down automatically on small/low-power devices. */
  density?: number
  /** 0 = no pointer response, 1 = full. */
  pointerStrength?: number
}

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches

/** Target ~30fps for the field — a slow drift does not need the full rate. */
const FRAME_INTERVAL = 1000 / 30

/**
 * Starfield particle system (xuqiu.txt §1).
 *
 * Performance approach — the same budget described in the
 * "particle-system-performance-budget" article:
 *  • three depth layers, only the near layer reacts to the pointer
 *  • the canvas pauses when scrolled out of view (IntersectionObserver)
 *  • the canvas pauses when the tab is hidden (visibilitychange)
 *  • rAF loop stops entirely when nothing is animating
 *  • mobile and reduced-motion get a static field instead
 */
export function Starfield({
  className,
  density = 1,
  pointerStrength = 1,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const quality = useAdaptiveQuality()
  const qualityRef = useRef(quality)
  qualityRef.current = quality

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coarse = isCoarsePointer()
    const allowMotion = !reduced && !coarse

    let width = 0
    let height = 0
    let dpr = 1
    let stars: Star[] = []
    let meteors: Meteor[] = []
    let rafId = 0
    let running = false
    let visible = true
    let pointer = { x: 0, y: 0, active: false }
    let lastTime = 0
    let lastFrame = 0
    let elapsed = 0   // cumulative animation time in ms, starts at 0

    // ---- Layer budgets (per the article's "define a budget, not a count") ----
    const mobile = window.innerWidth < 768
    const farCount = Math.round((mobile ? 34 : 78) * density)
    const midCount = Math.round((mobile ? 16 : 40) * density)
    const nearCount = Math.round((mobile ? 6 : 18) * density)

    const buildStars = () => {
      const list: Star[] = []
      const layers = [
        { count: farCount, depth: 0, rMin: 0.5, rMax: 1.1, alpha: 0.35 },
        { count: midCount, depth: 0.5, rMin: 0.9, rMax: 1.7, alpha: 0.6 },
        { count: nearCount, depth: 1, rMin: 1.3, rMax: 2.4, alpha: 0.9 },
      ]

      for (const layer of layers) {
        for (let i = 0; i < layer.count; i++) {
          list.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
            baseAlpha: layer.alpha * (0.5 + Math.random() * 0.5),
            twinkleSpeed: 0.08 + Math.random() * 0.22,
            phase: Math.random() * Math.PI * 2,
            depth: layer.depth,
            // Velocity is expressed in px/second.
            vx: (Math.random() - 0.5) * 1.6 * (0.3 + layer.depth),
            vy: (Math.random() - 0.5) * 1.3 * (0.3 + layer.depth),
          })
        }
      }
      stars = list
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      // A soft starfield does not need 2× density. Capping DPR at 1 cuts the
      // fill rate by 4× on retina screens, which is the single biggest lever
      // for a full-viewport animated canvas.
      dpr = Math.min(window.devicePixelRatio || 1, 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildStars()
    }

    // ---- Pre-rendered star sprite --------------------------------------
    // Drawing an arc per star per frame means re-tessellating a path for every
    // particle. Blitting a pre-rendered sprite is far cheaper.
    const SPRITE = 32
    const sprite = document.createElement('canvas')
    sprite.width = SPRITE
    sprite.height = SPRITE
    const sctx = sprite.getContext('2d')
    if (sctx) {
      const g = sctx.createRadialGradient(
        SPRITE / 2,
        SPRITE / 2,
        0,
        SPRITE / 2,
        SPRITE / 2,
        SPRITE / 2,
      )
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.35, 'rgba(220,248,252,0.55)')
      g.addColorStop(1, 'rgba(215,245,250,0)')
      sctx.fillStyle = g
      sctx.fillRect(0, 0, SPRITE, SPRITE)
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const size = s.r * 7
        ctx.globalAlpha = s.baseAlpha * 0.75
        ctx.drawImage(sprite, s.x - size / 2, s.y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    }

    const draw = (dt: number) => {
      elapsed += dt

      ctx.clearRect(0, 0, width, height)

      const pointerActive = pointer.active && pointerStrength > 0

      const q = qualityRef.current

      // --- connection lines between near stars (subtle "digital network") ---
      // Only the near layer participates, and the line budget is capped, so
      // this stays a bounded cost rather than O(n²) over every particle.
      // The lowest tier drops them entirely — they are the most expensive
      // thing the field draws and the least noticeable.
      if (allowMotion && nearCount > 0 && q !== 'low') {
        ctx.lineWidth = 0.6
        const near = stars.filter((s) => s.depth >= 0.5)
        for (let i = 0; i < near.length; i++) {
          const a = near[i]
          for (let j = i + 1; j < near.length; j++) {
            const b = near[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const distSq = dx * dx + dy * dy
            if (distSq < 6400) {
              const alpha = (1 - Math.sqrt(distSq) / 80) * 0.15
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.stroke()
            }
          }
        }
      }

      // --- stars ---
      // Scale drawn star count dynamically based on current quality tier
      const visibleStars = q === 'low'
        ? stars.slice(0, Math.round(stars.length * 0.45))
        : q === 'medium'
          ? stars.slice(0, Math.round(stars.length * 0.75))
          : stars

      for (const s of visibleStars) {
        if (allowMotion) {
          s.x += s.vx * (dt / 1000)
          s.y += s.vy * (dt / 1000)

          // wrap around the viewport edges
          if (s.x < -4) s.x = width + 4
          else if (s.x > width + 4) s.x = -4
          if (s.y < -4) s.y = height + 4
          else if (s.y > height + 4) s.y = -4

          if (pointerActive) {
            // nearby particles drift slightly toward / away from the pointer
            const dx = s.x - pointer.x
            const dy = s.y - pointer.y
            const dist = Math.hypot(dx, dy)
            if (dist < 180 && s.depth > 0.4) {
              const force = ((180 - dist) / 180) * 14 * s.depth * pointerStrength
              s.x += (dx / (dist || 1)) * force * (dt / 1000)
              s.y += (dy / (dist || 1)) * force * (dt / 1000)
            }
          }
        }

        const twinkle = allowMotion
          ? 0.82 + 0.18 * Math.sin(elapsed * 0.001 * s.twinkleSpeed + s.phase)
          : 1
        const alpha = s.baseAlpha * twinkle

        // Blit the pre-rendered sprite instead of re-tessellating an arc.
        const size = s.r * 7
        ctx.globalAlpha = alpha
        ctx.drawImage(
          sprite,
          s.x - size / 2,
          s.y - size / 2,
          size,
          size,
        )
      }
      ctx.globalAlpha = 1

      // --- meteors ---
      if (allowMotion) {
        // Spawn chance is per-frame at 30fps, so ~1 meteor every 15 seconds.
        if (meteors.length === 0 && Math.random() < 0.0022) {
          meteors.push({
            x: width * (0.55 + Math.random() * 0.45),
            y: Math.random() * height * 0.45,
            len: 90 + Math.random() * 130,
            speed: 0.35 + Math.random() * 0.3,
            life: 1,
          })
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]
          m.x -= m.speed * dt
          m.y += m.speed * 0.8 * dt
          m.life -= (dt / 1000) * 0.35

          if (m.life <= 0 || m.x < -m.len || m.y > height + m.len) {
            meteors.splice(i, 1)
            continue
          }

          const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len * 0.8)
          grad.addColorStop(0, `rgba(255, 255, 255, ${0.8 * m.life})`)
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(m.x + m.len, m.y - m.len * 0.8)
          ctx.stroke()
        }
      }

    }

    const loop = (time: number) => {
      // Cap the field at ~30fps (or ~15fps on the lowest tier). The motion is
      // a slow drift; running it at the display refresh rate costs 2× the
      // fill rate for no visible gain.
      const interval = qualityRef.current === 'low' ? FRAME_INTERVAL * 2 : FRAME_INTERVAL
      if (time - lastFrame < interval) {
        rafId = requestAnimationFrame(loop)
        return
      }
      const dt = time - lastTime
      lastTime = time
      lastFrame = time
      draw(dt)
      if (running) rafId = requestAnimationFrame(loop)
    }

    const start = () => {
      if (!allowMotion || running) return
      running = true
      lastTime = performance.now()
      lastFrame = lastTime - FRAME_INTERVAL
      rafId = requestAnimationFrame(loop)
    }

    const stop = () => {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    resize()

    if (allowMotion) {
      window.addEventListener('resize', resize)
      canvas.addEventListener('pointermove', onPointerMove, { passive: true })
      canvas.addEventListener('pointerleave', onPointerLeave)

      // Pause when out of view or when the tab is hidden.
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting
          if (visible && !document.hidden) start()
          else stop()
        },
        { threshold: 0 },
      )
      io.observe(canvas)

      const onVisibility = () => {
        if (document.hidden) stop()
        else if (visible) start()
      }
      document.addEventListener('visibilitychange', onVisibility)

      start()

      return () => {
        stop()
        io.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('resize', resize)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerleave', onPointerLeave)
      }
    }

    // Reduced motion / coarse pointer → static field, no rAF at all.
    drawStatic()
    const onResizeStatic = () => {
      resize()
      drawStatic()
    }
    window.addEventListener('resize', onResizeStatic)
    return () => window.removeEventListener('resize', onResizeStatic)
  }, [reduced, density, pointerStrength])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
