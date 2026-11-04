import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Copy } from '@phosphor-icons/react/dist/icons/Copy'
import { Check } from '@phosphor-icons/react/dist/icons/Check'
import { CaretUp } from '@phosphor-icons/react/dist/icons/CaretUp'
import { CaretDown } from '@phosphor-icons/react/dist/icons/CaretDown'
import { ArrowsOut } from '@phosphor-icons/react/dist/icons/ArrowsOut'
import { ArrowsIn } from '@phosphor-icons/react/dist/icons/ArrowsIn'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './code-block.css'

interface CodeBlockProps {
  lang: string
  code: string
}

/**
 * IDE-style code block (xuqiu.txt §10 代码块):
 *  • toolbar with micro-interactions
 *  • copy button shows a spring success state
 *  • expand / collapse toggle with smooth animation
 *  • interactive line click highlight
 *  • full-screen immersion inspect (rendered via React Portal directly into document.body)
 */
export function CodeBlock({ lang, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const reduced = usePrefersReducedMotion()

  const lines = code.split('\n')
  const lineCount = lines.length
  const isLong = lineCount > 12

  // Esc closes fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* fallback */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = (isFs: boolean) => (
    <div className={`code-block ${isFs ? 'code-block--fullscreen' : ''}`} data-expanded={expanded}>
      <div className="code-block__toolbar">
        <span className="code-block__lang mono">{lang}</span>
        <span className="code-block__lines mono">{lineCount} lines</span>

        <div className="code-block__actions">
          {isLong && !isFs && (
            <button
              type="button"
              className="code-block__btn"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? '折叠代码' : '展开代码'}
              title={expanded ? '折叠代码' : '展开代码'}
            >
              {expanded ? (
                <CaretUp size={15} aria-hidden="true" />
              ) : (
                <CaretDown size={15} aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            className="code-block__btn"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={isFs ? '退出全屏' : '全屏代码'}
            title={isFs ? '退出全屏 (Esc)' : '全屏放大'}
          >
            {isFs ? (
              <ArrowsIn size={15} aria-hidden="true" />
            ) : (
              <ArrowsOut size={15} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={`code-block__btn ${copied ? 'code-block__btn--copied' : ''}`}
            onClick={copy}
            aria-label={copied ? '已复制' : '复制代码'}
            title="复制代码"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? 'done' : 'copy'}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
                className="code-block__icon"
                data-copied={copied}
              >
                {copied ? (
                  <Check size={14} weight="bold" aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
            <span className="code-block__btn-label">
              {copied ? '已复制' : '复制'}
            </span>
          </button>
        </div>
      </div>

      <motion.pre
        className="code-block__pre"
        initial={false}
        animate={{
          height: isFs || expanded ? 'auto' : 180,
          opacity: 1,
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ overflow: isFs ? 'auto' : 'hidden' }}
      >
        <code>
          {lines.map((line, i) => (
            <span
              key={i}
              className={`code-block__line ${activeLine === i ? 'code-block__line--active' : ''}`}
              onClick={() => setActiveLine(activeLine === i ? null : i)}
            >
              <span className="code-block__num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="code-block__text">{line || ' '}</span>
            </span>
          ))}
        </code>
      </motion.pre>

      {isLong && !expanded && !isFs && (
        <button
          type="button"
          className="code-block__fade"
          onClick={() => setExpanded(true)}
          aria-label="展开完整代码"
        >
          <span className="mono">展开完整代码 ({lineCount} 行)</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Normal in-flow code block */}
      {renderContent(false)}

      {/* Fullscreen modal rendered directly to body via portal to break out of stacking context */}
      {fullscreen &&
        createPortal(
          <div className="code-block__portal-wrap" role="dialog" aria-modal="true" aria-label="全屏代码查看">
            <div
              className="code-block__backdrop"
              onClick={() => setFullscreen(false)}
              aria-hidden="true"
            />
            {renderContent(true)}
          </div>,
          document.body,
        )}
    </>
  )
}
