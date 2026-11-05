import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useCountUp } from '../../hooks/useCountUp'
import { useInView } from '../../hooks/useInView'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { site, stats, socialLinks } from '../../data/site'
import { getTotalViews } from '../../data/posts'
import { Magnetic } from '../ui/Magnetic'
import './profile-card.css'

/**
 * Profile card (xuqiu.txt §6):
 *  • rotating teal ring around the avatar
 *  • breathing online-status dot
 *  • count-up statistics that trigger once on first view
 *  • social icons that lift and brighten on hover
 */
export function ProfileCard() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 })
  const reduced = usePrefersReducedMotion()

  return (
    <motion.div
      ref={ref}
      className="profile"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="profile__avatar-wrap">
        <span className="profile__ring" aria-hidden="true" />
        <span className="profile__avatar" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="100%" height="100%">
            <defs>
              <linearGradient id="avatar-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#avatar-fill)" />
            <path
              d="M32 14 L48 48 L32 39 L16 48 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="profile__status" aria-hidden="true" />
        <span className="sr-only">在线</span>
      </div>

      <h2 className="profile__name">{site.author}</h2>
      <p className="profile__title">{site.authorTitle}</p>
      <p className="profile__bio">
        前端工程师，专注交互与性能。用代码测量美，用工程约束自由。
      </p>

      <dl className="profile__stats">
        {stats.map((stat, i) => {
          const val = stat.key === 'reads' ? getTotalViews() : stat.value
          return (
            <div key={stat.key} className="profile__stat">
              <dt className="profile__stat-label">{stat.label}</dt>
              <dd className="profile__stat-value mono">
                <CountUp value={val} start={inView} duration={1400 + i * 120} />
              </dd>
            </div>
          )
        })}
      </dl>

      <SocialRow />
    </motion.div>
  )
}

function SocialRow() {
  const icons: Record<string, string> = {
    GithubLogo:
      'M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.72c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z',
    TwitterLogo:
      'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.96 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z',
    Rss: 'M4 11a9 9 0 0 1 9 9h3A12 12 0 0 0 4 8v3Zm0-6a15 15 0 0 1 15 15h3A18 18 0 0 0 4 2v3Zm1.5 12a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
    Envelope:
      'M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2.2.5 6.8 5.1 6.8-5.1H5.2ZM19 7.4l-6.4 4.8a1 1 0 0 1-1.2 0L5 7.4v10.1h14V7.4Z',
  }

  return (
    <div className="profile__socials">
      {socialLinks.map((l) => (
        <Magnetic key={l.label} strength={0.4}>
          <a
            href={l.href}
            className="profile__social"
            target={l.href.startsWith('http') ? '_blank' : undefined}
            rel={l.href.startsWith('http') ? 'noreferrer noopener' : undefined}
            aria-label={l.label}
            title={l.label}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d={icons[l.icon]} fill="currentColor" />
            </svg>
          </a>
        </Magnetic>
      ))}
    </div>
  )
}

/**
 * Count-up number. Triggers once when `start` flips true and never replays.
 */
function CountUp({
  value,
  start,
  duration,
}: {
  value: number
  start: boolean
  duration: number
}) {
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLSpanElement | null>(null)

  const displayed = useCountUp(value, { start, duration })

  useEffect(() => {
    if (!mounted) setMounted(true)
  }, [mounted])

  return (
    <span ref={ref} className="profile__count">
      {displayed.toLocaleString('en-US')}
    </span>
  )
}
