import { useEffect, useRef } from 'react'
import type { QualityTier } from '../../hooks/useAdaptiveQuality'

interface DotWaveProps {
  className?: string
  reduced: boolean
  quality: QualityTier
}

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches

const FRAME_INTERVAL = 1000 / 30

interface WavePalette {
  base: [number, number, number]
  crest: [number, number, number]
  horizon: string
  isLight: boolean
}

function readPalette(): WavePalette {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  if (isLight) {
    return {
      base: [2, 132, 199],     // #0284c7 ocean sky
      crest: [14, 116, 144],   // #0e7490 deep cyan
      horizon: 'rgba(2, 132, 199, 0.14)',
      isLight: true,
    }
  }
  return {
    base: [56, 189, 248],      // #38bdf8 ice blue
    crest: [224, 242, 254],    // #e0f2fe frost highlight
    horizon: 'rgba(56, 189, 248, 0.16)',
    isLight: false,
  }
}

function makeDotSprite(rgb: [number, number, number], crisp: boolean): HTMLCanvasElement {
  const SIZE = 24
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const sctx = c.getContext('2d')
  if (sctx) {
    const half = SIZE / 2
    const g = sctx.createRadialGradient(half, half, 0, half, half, half)
    const [r, gCol, b] = rgb
    if (crisp) {
      g.addColorStop(0, `rgba(${r}, ${gCol}, ${b}, 1)`)
      g.addColorStop(0.32, `rgba(${r}, ${gCol}, ${b}, 0.72)`)
      g.addColorStop(0.65, `rgba(${r}, ${gCol}, ${b}, 0.14)`)
      g.addColorStop(1, `rgba(${r}, ${gCol}, ${b}, 0)`)
    } else {
      g.addColorStop(0, `rgba(${r}, ${gCol}, ${b}, 1)`)
      g.addColorStop(0.28, `rgba(${r}, ${gCol}, ${b}, 0.7)`)
      g.addColorStop(0.6, `rgba(${r}, ${gCol}, ${b}, 0.18)`)
      g.addColorStop(1, `rgba(${r}, ${gCol}, ${b}, 0)`)
    }
    sctx.fillStyle = g
    sctx.fillRect(0, 0, SIZE, SIZE)
  }
  return c
}

/**
 * Perspective dot-matrix wave ("Winter Sea" / 冬海) for the Hero Banner.
 *
 * Performance & accessibility:
 *  - Pre-rendered radial sprites blitted with drawImage (no per-dot arc paths)
 *  - Quality-scaled grid density and ~30fps frame cap (~15fps on low tier)
 *  - Pauses off-screen (IntersectionObserver) and when tab is hidden
 *  - Renders a single static frame when reduced-motion or coarse pointer is active
 */
export function DotWave({ className, reduced, quality }: DotWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
    let rafId = 0
    let running = false
    let visible = true
    let lastTime = 0
    let lastFrame = 0
    let elapsed = 0

    let palette = readPalette()
    let baseSprite = makeDotSprite(palette.base, palette.isLight)
    let crestSprite = makeDotSprite(palette.crest, palette.isLight)

    const rebuildSprites = () => {
      palette = readPalette()
      baseSprite = makeDotSprite(palette.base, palette.isLight)
      crestSprite = makeDotSprite(palette.crest, palette.isLight)
    }

    const getGridDims = () => {
      const q = qualityRef.current
      if (q === 'low') return { cols: 38, rows: 14 }
      if (q === 'medium') return { cols: 54, rows: 20 }
      return { cols: 68, rows: 26 }
    }

    const renderFrame = (timeSec: number) => {
      if (width <= 0 || height <= 0) return
      ctx.clearRect(0, 0, width, height)

      const { cols, rows } = getGridDims()

      // Horizon sits around 34% from top; wave fills downward to bottom edge
      const horizonY = height * 0.34
      const seaSpanY = height * 0.72
      // Shift perspective focus toward the right-center so the wave opens up cleanly
      const centerX = width * 0.64

      // Subtle horizon glow band
      const hGrad = ctx.createLinearGradient(width * 0.25, horizonY, width, horizonY)
      hGrad.addColorStop(0, 'transparent')
      hGrad.addColorStop(0.55, palette.horizon)
      hGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = hGrad
      ctx.fillRect(width * 0.25, horizonY - 1, width * 0.75, 2)

      // Draw far-to-near so nearer, brighter dots layer naturally over distant ones
      for (let r = 0; r < rows; r++) {
        // v in (0..1]: 0 = far horizon, 1 = foreground
        const v = (r + 1) / rows
        // Non-linear depth distribution so distant rows compress toward the horizon
        const depthCurve = Math.pow(v, 1.75)
        const baseY = horizonY + depthCurve * seaSpanY

        // Perspective scale grows from far to near
        const scale = 0.28 + depthCurve * 0.92
        // Row spread widens slightly with perspective
        const rowWidth = width * (0.86 + depthCurve * 0.34)
        const startX = centerX - rowWidth * 0.56

        // Depth fade: fades softly near the horizon and very bottom edge
        const horizonFade = Math.min(1, v * 2.4)
        const bottomFade = v > 0.88 ? 1 - (v - 0.88) / 0.2 : 1
        const depthAlpha = horizonFade * bottomFade

        const worldZ = (1 - v) * 6.5

        for (let c = 0; c < cols; c++) {
          const u = c / (cols - 1)
          const x = startX + u * rowWidth

          // Skip dots well outside canvas bounds
          if (x < -16 || x > width + 16) continue

          // Layered organic sea waves
          const wx = (u - 0.5) * 9.5
          const wave1 = Math.sin(wx * 1.15 - timeSec * 1.05 + worldZ * 0.85)
          const wave2 = Math.cos(wx * 0.65 + worldZ * 1.35 - timeSec * 0.72)
          const wave3 = Math.sin((wx + worldZ) * 0.55 + timeSec * 0.48)
          const hNorm = (wave1 * 0.52 + wave2 * 0.32 + wave3 * 0.16) // ~[-1, 1]

          const amp = (8 + depthCurve * 24)
          const y = baseY - hNorm * amp

          // Crest factor in [0, 1] for bright white/ice highlights on wave peaks
          const crest = Math.max(0, Math.min(1, (hNorm + 0.15) / 1.15))
          const crestBoost = crest * crest

          const alphaBase = palette.isLight ? 0.30 : 0.26
          const alphaPeak = palette.isLight ? 0.65 : 0.72
          const alpha = depthAlpha * (alphaBase + crestBoost * alphaPeak)

          if (alpha < 0.02) continue

          const radius = (1.1 + scale * 1.85 + crestBoost * 1.1)
          const spriteSize = radius * 4.4

          // Draw base ice-blue dot
          ctx.globalAlpha = Math.min(1, alpha)
          ctx.drawImage(
            baseSprite,
            x - spriteSize / 2,
            y - spriteSize / 2,
            spriteSize,
            spriteSize,
          )

          // Add luminous crest highlight on high wave peaks
          if (crestBoost > 0.35) {
            ctx.globalAlpha = Math.min(1, alpha * (crestBoost - 0.35) * 1.35)
            ctx.drawImage(
              crestSprite,
              x - spriteSize / 2,
              y - spriteSize / 2,
              spriteSize,
              spriteSize,
            )
          }
        }
      }
      ctx.globalAlpha = 1
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderFrame(elapsed * 0.001)
    }

    const loop = (time: number) => {
      if (!running) return
      const interval = qualityRef.current === 'low' ? FRAME_INTERVAL * 2 : FRAME_INTERVAL
      if (time - lastFrame >= interval) {
        const dt = Math.min(time - lastTime, 100)
        lastTime = time
        lastFrame = time
        elapsed += dt
        renderFrame(elapsed * 0.001)
      }
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

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const mo = new MutationObserver(() => {
      rebuildSprites()
      renderFrame(elapsed * 0.001)
    })
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    resize()

    if (allowMotion) {
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
        ro.disconnect()
        mo.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }

    // Reduced motion or coarse pointer: render static frame at an expressive phase
    renderFrame(1.8)
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [reduced, quality])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
