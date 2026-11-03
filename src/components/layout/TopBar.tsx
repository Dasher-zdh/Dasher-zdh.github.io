import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/icons/MagnifyingGlass'
import { Moon } from '@phosphor-icons/react/dist/icons/Moon'
import { Sun } from '@phosphor-icons/react/dist/icons/Sun'
import { X } from '@phosphor-icons/react/dist/icons/X'
import { Clock } from '@phosphor-icons/react/dist/icons/Clock'
import { ArrowUpRight } from '@phosphor-icons/react/dist/icons/ArrowUpRight'
import { useSearch, HIGHLIGHT_OPEN, HIGHLIGHT_CLOSE } from '../../hooks/useSearch'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './topbar.css'

interface TopBarProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

/** Renders the excerpt with the matched substring wrapped in <mark>. */
function Highlighted({ text }: { text: string }) {
  // Format is: ...before «match» after...
  const segments = text.split(HIGHLIGHT_OPEN)
  return (
    <>
      {segments.map((segment, i) => {
        const closeIdx = segment.indexOf(HIGHLIGHT_CLOSE)
        if (closeIdx === -1) {
          return <span key={i}>{segment}</span>
        }
        const match = segment.slice(0, closeIdx)
        const after = segment.slice(closeIdx + HIGHLIGHT_CLOSE.length)
        return (
          <span key={i}>
            <mark className="topbar__mark">{match}</mark>
            {after}
          </span>
        )
      })}
    </>
  )
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const { query, setQuery, results, history, pushHistory, clearHistory } = useSearch()
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()

  // ---- Ctrl/Cmd+K to open, Esc to close (xuqiu.txt §3) ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), reduced ? 0 : 120)
      return () => window.clearTimeout(t)
    }
  }, [open, reduced])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const goToPost = (slug: string) => {
    pushHistory(query)
    setOpen(false)
    setQuery('')
    navigate(`/posts/${slug}`)
  }

  const hasQuery = query.trim().length > 0

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__spacer" />

        <div className="topbar__search" ref={containerRef}>
          <button
            type="button"
            className="topbar__search-trigger"
            onClick={() => setOpen((o) => !o)}
            aria-label="搜索文章"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <MagnifyingGlass size={18} weight="regular" aria-hidden="true" />
            <span className="topbar__search-placeholder">搜索文章…</span>
            <kbd className="topbar__kbd mono">⌘K</kbd>
          </button>

          {/* The panel is unmounted immediately on close rather than relying on
              an exit animation to finish. If the frame budget is starved (a
              background tab, a slow device) an exit animation can stall
              forever, which would leave the panel stuck open and swallow the
              Escape key. A CSS transition on the closing state gives the same
              visual result without the dependency. */}
          {open && (
            <motion.div
              className="topbar__panel"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              }
              role="dialog"
              aria-label="搜索"
            >
                <div className="topbar__panel-input">
                  <MagnifyingGlass size={18} aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索标题、摘要或标签…"
                    aria-label="搜索关键词"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {hasQuery && (
                    <button
                      type="button"
                      className="topbar__clear"
                      onClick={() => setQuery('')}
                      aria-label="清除搜索"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="topbar__close"
                    onClick={() => setOpen(false)}
                    aria-label="关闭搜索面板"
                  >
                    ESC
                  </button>
                </div>

                <div className="topbar__panel-body">
                  {!hasQuery && history.length > 0 && (
                    <section className="topbar__history">
                      <header className="topbar__panel-section">
                        <Clock size={14} aria-hidden="true" />
                        <span>最近搜索</span>
                        <button
                          type="button"
                          className="topbar__history-toggle"
                          onClick={() => setShowHistory((s) => !s)}
                          aria-expanded={showHistory}
                        >
                          {showHistory ? '收起' : '展开'}
                        </button>
                        <button
                          type="button"
                          className="topbar__history-clear"
                          onClick={clearHistory}
                        >
                          清空
                        </button>
                      </header>
                      <AnimatePresence initial={false}>
                        {showHistory && (
                          <motion.ul
                            className="topbar__history-list"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {history.map((h) => (
                              <li key={h}>
                                <button
                                  type="button"
                                  className="topbar__history-item"
                                  onClick={() => setQuery(h)}
                                >
                                  <Clock size={13} aria-hidden="true" />
                                  {h}
                                </button>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </section>
                  )}

                  {hasQuery && results.length === 0 && (
                    <div className="topbar__empty">
                      <svg
                        viewBox="0 0 64 64"
                        width="56"
                        height="56"
                        aria-hidden="true"
                        className="topbar__empty-art"
                      >
                        <circle cx="28" cy="28" r="16" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                        <line x1="40" y1="40" x2="52" y2="52" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
                        <circle cx="28" cy="28" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
                      </svg>
                      <p className="topbar__empty-title">没有找到「{query}」</p>
                      <p className="topbar__empty-desc">换个关键词试试，或搜索标签、分类。</p>
                      <button
                        type="button"
                        className="topbar__empty-clear"
                        onClick={() => setQuery('')}
                      >
                        清除搜索
                      </button>
                    </div>
                  )}

                  {results.length > 0 && (
                    <ul className="topbar__results">
                      {results.map((hit, i) => (
                        <motion.li
                          key={hit.post.slug}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduced ? 0 : 0.22,
                            delay: reduced ? 0 : i * 0.035,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <button
                            type="button"
                            className="topbar__result"
                            onClick={() => goToPost(hit.post.slug)}
                          >
                            <span className="topbar__result-category mono">
                              {hit.post.category}
                            </span>
                            <span className="topbar__result-title">
                              <Highlighted text={hit.title} />
                            </span>
                            <span className="topbar__result-excerpt">
                              <Highlighted text={hit.excerpt} />
                            </span>
                            <ArrowUpRight
                              size={16}
                              className="topbar__result-arrow"
                              aria-hidden="true"
                            />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
            </motion.div>
          )}
        </div>

        <button
          type="button"
          className="topbar__theme"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗黑主题'}
          title={theme === 'dark' ? '切换到亮色主题' : '切换到暗黑主题'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="topbar__theme-icon"
            >
              {theme === 'dark' ? (
                <Moon size={18} weight="fill" aria-hidden="true" />
              ) : (
                <Sun size={18} weight="fill" aria-hidden="true" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  )
}
