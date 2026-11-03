import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './preloader.css'

/**
 * Brand preloader (xuqiu.txt §14): the logo is drawn stroke-by-stroke, then
 * the site fades in. Kept deliberately short — no long loading animation.
 */
export function Preloader() {
  const reduced = usePrefersReducedMotion()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), reduced ? 120 : 1250)
    return () => window.clearTimeout(t)
  }, [reduced])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label="正在加载"
        >
          <svg
            className="preloader__logo"
            viewBox="0 0 64 64"
            width="72"
            height="72"
            aria-hidden="true"
          >
            <path
              d="M32 8 L56 56 L32 44 L8 56 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
              pathLength={1}
              className="preloader__path"
            />
            <path
              d="M32 18 L46 47 L32 40 L18 47 Z"
              fill="currentColor"
              opacity="0.16"
              className="preloader__fill"
            />
          </svg>
          <span className="preloader__text mono">SANZANG.DEV</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
