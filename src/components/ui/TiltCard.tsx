import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { usePointerPosition } from '../../hooks/usePointerPosition'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees. Spec caps this at 3 (xuqiu.txt §12). */
  max?: number
  /** Enables the teal edge glow that follows the pointer. */
  glow?: boolean
}

/**
 * Subtle 3D tilt + pointer-tracking edge glow (xuqiu.txt §12).
 *
 * Constraints honoured:
 *  • max 3° of rotation
 *  • no large cursor-following light orb — only a faint edge highlight
 *  • completely disabled on coarse pointers and under reduced motion
 */
export function TiltCard({ children, className, max = 3, glow = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const pointer = usePointerPosition(!reduced)

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 220, damping: 26, mass: 0.4 })
  const sy = useSpring(py, { stiffness: 220, damping: 26, mass: 0.4 })

  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max])

  // Edge highlight position (percentage of the card box).
  const glowX = useTransform(sx, (v) => `${50 + v * 60}%`)
  const glowY = useTransform(sy, (v) => `${50 + v * 60}%`)
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(220px circle at ${x} ${y}, rgba(255,255,255,0.08), transparent 70%)`,
  )

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleLeave = () => {
    px.set(0)
    py.set(0)
  }

  if (reduced || !pointer) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`tilt ${className ?? ''}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div
        className="tilt__inner"
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
      >
        {glow && (
          <motion.span
            className="tilt__glow"
            aria-hidden="true"
            style={{ background: glowBackground }}
          />
        )}
        {children}
      </motion.div>
    </div>
  )
}
