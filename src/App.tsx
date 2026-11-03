import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ScrollRestoration } from './components/layout/ScrollRestoration'
import { Starfield } from './components/background/Starfield'
import { TechGrid } from './components/background/TechGrid'
import { Preloader } from './components/layout/Preloader'
import { useTheme } from './hooks/useTheme'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import HomePage from './pages/HomePage'
import './styles/global.css'
import './styles/tokens.css'
import './styles/background.css'
import './styles/layout.css'

/* Route-level code splitting — only the page being visited is downloaded. */
const PostsPage = lazy(() => import('./pages/PostsPage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const TagsPage = lazy(() => import('./pages/TagsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const reduced = usePrefersReducedMotion()

  return (
    <>
      <a href="#main" className="skip-link">
        跳到主内容
      </a>

      {/* Ambient background (xuqiu.txt §1) */}
      <div className="bg-shell" aria-hidden="true">
        <div className="bg-shell__base" />
        <div className="bg-shell__stars">
          <Starfield density={0.85} pointerStrength={0.8} />
        </div>
        <div className="bg-shell__grid">
          <TechGrid />
        </div>
        <div className="bg-shell__vignette" />
      </div>

      <Preloader />

      <Sidebar />

      <div className="shell">
        <TopBar theme={theme} onToggleTheme={toggle} />
        <ScrollRestoration />

        <main id="main" className="shell__main">
          {/* `mode="wait"` would hold the new route hostage until the old
              page's exit animation finished. If the exit is ever starved (a
              background tab, a throttled frame budget) the new page would
              never mount at all. The default mode lets the incoming page
              render immediately while the outgoing one fades out.

              While the outgoing page is still mounted it must not contribute
              to layout height, or the document would briefly contain two full
              pages stacked on top of each other. That doubles the scroll
              range, so any scroll position the user picks gets clamped, and
              the page jumps when the old route finally unmounts. `position:
              absolute` takes the exiting page out of flow; `useIsPresent`
              lets it know it is on its way out. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
              }
              className="shell__page"
            >
              <PageBoundary>
                <Suspense fallback={<PageFallback />}>
                  <Routes location={location}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/posts" element={<PostsPage />} />
                    <Route path="/posts/:slug" element={<PostDetailPage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/tags" element={<TagsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </PageBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="shell__footer">
          <div className="shell__footer-inner">
            <span className="mono">© 2026 三藏の博客</span>
            <span className="shell__footer-sep" aria-hidden="true">
              ·
            </span>
            <span>Built with React · Motion · Vite</span>
          </div>
        </footer>
      </div>
    </>
  )
}

/** Minimal placeholder shown while a lazily-loaded route resolves. */
function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-label="页面加载中">
      <span className="page-fallback__bar" />
      <span className="page-fallback__bar" />
      <span className="page-fallback__bar" />
    </div>
  )
}

/**
 * Takes a page out of the document flow while it is exiting.
 *
 * An exiting route stays mounted for the length of its exit animation. If it
 * stays in flow the document briefly holds two full pages, which doubles the
 * scroll range — the browser clamps the scroll position, and the page jumps
 * when the old route finally unmounts. `useIsPresent` flips to false exactly
 * when the exit starts, so the outgoing page can be absolutely positioned
 * while it fades.
 *
 * The wrapper is always a <div>; only its class changes. Returning a fragment
 * in one branch and a div in the other would change the element type, which
 * makes React unmount and remount the whole page subtree — killing the exit
 * animation and resetting every bit of page state.
 */
function PageBoundary({ children }: { children: React.ReactNode }) {
  const isPresent = useIsPresent()

  return (
    <div
      className={isPresent ? 'shell__page-body' : 'shell__page-exiting'}
      aria-hidden={isPresent ? undefined : true}
    >
      {children}
    </div>
  )
}
