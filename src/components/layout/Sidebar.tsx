import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { House } from '@phosphor-icons/react/dist/icons/House'
import { Article } from '@phosphor-icons/react/dist/icons/Article'
import { ClockCounterClockwise } from '@phosphor-icons/react/dist/icons/ClockCounterClockwise'
import { Hash } from '@phosphor-icons/react/dist/icons/Hash'
import { User } from '@phosphor-icons/react/dist/icons/User'
import { SidebarSimple } from '@phosphor-icons/react/dist/icons/SidebarSimple'
import { navItems, site, socialLinks } from '../../data/site'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './sidebar.css'

const iconMap = {
  House,
  Article,
  ClockCounterClockwise,
  Hash,
  User,
} as const

export function Sidebar() {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Publish the collapsed state so the content shell can follow the rail's
  // width. Doing it through a root attribute keeps the value in CSS, where
  // the width transition already lives, instead of re-rendering the tree.
  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = collapsed ? 'true' : 'false'
    return () => {
      delete document.documentElement.dataset.sidebarCollapsed
    }
  }, [collapsed])

  return (
    <>
      <button
        type="button"
        className="sidebar__mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="打开导航菜单"
        aria-expanded={mobileOpen}
      >
        <SidebarSimple size={24} weight="bold" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className="sidebar"
        data-collapsed={collapsed}
        data-mobile-open={mobileOpen}
        aria-label="主导航"
      >
        <div className="sidebar__brand">
          <a href="/" className="sidebar__logo" aria-label={`${site.title} 首页`}>
            <span className="sidebar__logo-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="32" height="32">
                <path
                  d="M16 3 L27 27 L16 21 L5 27 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="sidebar__logo-path"
                />
              </svg>
            </span>
            <span className="sidebar__brand-text">
              <strong className="sidebar__brand-title">{site.title}</strong>
              <span className="sidebar__brand-sub mono">{site.titleEn}</span>
            </span>
          </a>

          <button
            type="button"
            className="sidebar__collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? '展开导航栏' : '收起导航栏'}
            aria-pressed={collapsed}
          >
            <SidebarSimple
              size={20}
              weight="bold"
              className="sidebar__collapse-icon"
            />
          </button>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__section-label mono">导航</span>
          <ul className="sidebar__list">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className="sidebar__link"
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="sidebar__active-bg"
                            transition={
                              reduced
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 380, damping: 32 }
                            }
                          />
                        )}
                        <span className="sidebar__indicator" aria-hidden="true" />
                        <span className="sidebar__icon">
                          <Icon size={20} weight="regular" aria-hidden="true" />
                        </span>
                        <span className="sidebar__label">{item.label}</span>
                        {collapsed && (
                          <span className="sidebar__tooltip" role="tooltip">
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__section-label mono">社交</span>
          <ul className="sidebar__socials">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  className="sidebar__social"
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                  aria-label={s.label}
                  title={s.label}
                >
                  <SocialIcon name={s.icon} />
                </a>
              </li>
            ))}
          </ul>
          <span className="sidebar__version mono">v1.0 · 2026</span>
        </div>
      </aside>
    </>
  )
}

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    GithubLogo:
      'M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.72c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z',
    TwitterLogo:
      'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.96 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z',
    Rss: 'M4 11a9 9 0 0 1 9 9h3A12 12 0 0 0 4 8v3Zm0-6a15 15 0 0 1 15 15h3A18 18 0 0 0 4 2v3Zm1.5 12a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
    Envelope:
      'M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2.2.5 6.8 5.1 6.8-5.1H5.2ZM19 7.4l-6.4 4.8a1 1 0 0 1-1.2 0L5 7.4v10.1h14V7.4Z',
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d={paths[name] ?? ''} fill="currentColor" />
    </svg>
  )
}
