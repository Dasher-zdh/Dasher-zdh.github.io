import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight'
import { Code } from '@phosphor-icons/react/dist/icons/Code'
import { Compass } from '@phosphor-icons/react/dist/icons/Compass'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useAdaptiveQuality } from '../../hooks/useAdaptiveQuality'
import { Magnetic } from '../ui/Magnetic'
import { DotWave } from './DotWave'
import './hero.css'

export function Hero() {
  const reduced = usePrefersReducedMotion()
  const quality = useAdaptiveQuality()

  return (
    <section className="hero-banner" data-quality={quality} aria-label="首页主视觉">
      {/* Background layer 1: Cosmic Nebulas */}
      <div className="hero-banner__nebula" aria-hidden="true" />

      {/* Background layer 2: Static micro starfield */}
      <div className="hero-banner__stars" aria-hidden="true" />

      {/* Background layer 3: Winter sea perspective dot wave */}
      <div className="hero-banner__wave" aria-hidden="true">
        <DotWave reduced={reduced} quality={quality} />
      </div>

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
          <Magnetic strength={0.32}>
            <Link to="/posts" className="btn btn--primary">
              <Compass size={17} weight="bold" aria-hidden="true" />
              <span>开始阅读</span>
              <ArrowRight size={16} className="btn__arrow" aria-hidden="true" />
            </Link>
          </Magnetic>

          <Magnetic strength={0.24}>
            <Link to="/about" className="btn btn--ghost">
              <Code size={17} aria-hidden="true" />
              <span>关于我</span>
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  )
}
