import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight'
import { Code } from '@phosphor-icons/react/dist/icons/Code'
import { Compass } from '@phosphor-icons/react/dist/icons/Compass'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { usePointerPosition } from '../../hooks/usePointerPosition'
import { useAdaptiveQuality } from '../../hooks/useAdaptiveQuality'
import './hero.css'

export function Hero() {
  const reduced = usePrefersReducedMotion()
  const pointer = usePointerPosition(!reduced)
  const quality = useAdaptiveQuality()

  // Subtle parallax offsets
  const px = pointer?.x ?? 0
  const py = pointer?.y ?? 0
  const planetOffset = { x: px * -12, y: py * -8 }
  const starOffset = { x: px * -4, y: py * -4 }

  return (
    <section className="hero-banner" data-quality={quality} aria-label="首页主视觉">
      {/* Background layer 1: Cosmic Nebulas */}
      <div className="hero-banner__nebula" aria-hidden="true" />

      {/* Background layer 2: Static micro starfield with parallax */}
      <motion.div
        className="hero-banner__stars"
        style={reduced ? undefined : { x: starOffset.x, y: starOffset.y }}
        aria-hidden="true"
      />

      {/* Background layer 3: Space Station / Planet Visual (Right side) */}
      <motion.div
        className="hero-banner__visual"
        style={reduced ? undefined : { x: planetOffset.x, y: planetOffset.y }}
        aria-hidden="true"
      >
        <svg
          className="hero-banner__planet-svg"
          viewBox="0 0 520 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="planet-grad" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#3ff2df" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#16d8c5" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#0a4645" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#04121a" stopOpacity="0.95" />
            </radialGradient>
            <radialGradient id="atmosphere-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16d8c5" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#16d8c5" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3ff2df" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#16d8c5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="ray-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#16d8c5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Atmosphere halo */}
          <circle cx="340" cy="170" r="145" fill="url(#atmosphere-glow)" />

          {/* Background orbital rings */}
          <ellipse
            cx="340"
            cy="170"
            rx="185"
            ry="64"
            stroke="url(#ring-grad)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            transform="rotate(-24 340 170)"
            opacity="0.4"
          />
          <ellipse
            cx="340"
            cy="170"
            rx="155"
            ry="48"
            stroke="url(#ring-grad)"
            strokeWidth="2"
            transform="rotate(-24 340 170)"
            opacity="0.75"
          />

          {/* Planet Body */}
          <circle cx="340" cy="170" r="102" fill="url(#planet-grad)" />

          {/* Foreground planetary ring slice */}
          <path
            d="M 160 216 A 155 48 0 0 0 495 142"
            stroke="url(#ring-grad)"
            strokeWidth="2.4"
            fill="none"
            transform="rotate(-24 340 170)"
          />

          {/* Sci-Fi HUD Coordinates & Telemetry */}
          <g className="hero-banner__hud" opacity="0.65" fontFamily="var(--font-mono)">
            <circle cx="340" cy="170" r="126" stroke="#16d8c5" strokeWidth="0.6" strokeDasharray="2 4" />
            <line x1="200" y1="170" x2="480" y2="170" stroke="#16d8c5" strokeWidth="0.4" strokeDasharray="3 3" />
            <line x1="340" y1="30" x2="340" y2="310" stroke="#16d8c5" strokeWidth="0.4" strokeDasharray="3 3" />

            {/* Target Reticles */}
            <circle cx="270" cy="115" r="5" stroke="#3ff2df" strokeWidth="0.8" fill="none" />
            <circle cx="270" cy="115" r="1.5" fill="#3ff2df" />
            <text x="282" y="119" fill="#16d8c5" fontSize="9" letterSpacing="0.1em">ORBIT // 42.8°N</text>

            <rect x="375" y="220" width="76" height="18" rx="3" stroke="#16d8c5" strokeWidth="0.6" fill="#060a0f" fillOpacity="0.75" />
            <text x="382" y="233" fill="#9aaab5" fontSize="8" letterSpacing="0.08em">WARP ENGINE: OK</text>
          </g>
        </svg>
      </motion.div>

      {/* Hero Content (Left) */}
      <div className="hero-banner__content">
        <motion.div
          className="hero-banner__kicker mono"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        >
          <span className="hero-banner__kicker-dot" aria-hidden="true" />
          <span>FRONTEND ENGINEER · CREATIVE TECHNOLOGIST</span>
        </motion.div>

        <motion.h1
          className="hero__title hero-banner__title"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.08 }}
        >
          <span className="hero-banner__title-line1">在代码与宇宙之间</span>
          <span className="hero-banner__title-line2">记录每一次跃迁</span>
        </motion.h1>

        <motion.p
          className="hero-banner__sub"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.16 }}
        >
          在代码与宇宙之间，记录工程实践的每一次跃迁。探索图形渲染、架构设计与系统性能的前沿边界。
        </motion.p>

        <motion.div
          className="hero-banner__actions"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.24 }}
        >
          <Link to="/posts" className="btn btn--primary">
            <Compass size={17} weight="bold" aria-hidden="true" />
            <span>开始阅读</span>
            <ArrowRight size={16} className="btn__arrow" aria-hidden="true" />
          </Link>
          <Link to="/about" className="btn btn--ghost">
            <Code size={17} aria-hidden="true" />
            <span>关于我</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
