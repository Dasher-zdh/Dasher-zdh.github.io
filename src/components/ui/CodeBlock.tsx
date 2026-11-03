import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Copy } from '@phosphor-icons/react/dist/icons/Copy'
import { Check } from '@phosphor-icons/react/dist/icons/Check'
import { CaretUp } from '@phosphor-icons/react/dist/icons/CaretUp'
import { CaretDown } from '@phosphor-icons/react/dist/icons/CaretDown'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './code-block.css'

interface CodeBlockProps {
  lang: string
  code: string
}

/**
 * IDE-style code block (xuqiu.txt §10 代码块):
 *  • toolbar appears on hover
 *  • copy button shows a success state with an animated icon swap
 *  • block can be expanded / collapsed
 */
export function CodeBlock({ lang, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const reduced = usePrefersReducedMotion()

  const lineCount = code.split('\n').length
  const isLong = lineCount > 12

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard API unavailable (insecure context) — fall back to a temp node.
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* nothing else we can do */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="code-block" data-expanded={expanded}>
      <div className="code-block__toolbar">
        <span className="code-block__lang mono">{lang}</span>
        <span className="code-block__lines mono">{lineCount} lines</span>

        <div className="code-block__actions">
          {isLong && (
            <button
              type="button"
              className="code-block__btn"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? '折叠代码' : '展开代码'}
              aria-expanded={expanded}
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
            onClick={copy}
            aria-label={copied ? '已复制' : '复制代码'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? 'done' : 'copy'}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
                className="code-block__icon"
                data-copied={copied}
              >
                {copied ? (
                  <Check size={15} weight="bold" aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
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
          height: expanded ? 'auto' : 180,
          opacity: 1,
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ overflow: 'hidden' }}
      >
        <code>
          {code.split('\n').map((line, i) => (
            <span key={i} className="code-block__line">
              <span className="code-block__num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="code-block__text">{line || ' '}</span>
            </span>
          ))}
        </code>
      </motion.pre>

      {isLong && !expanded && (
        <button
          type="button"
          className="code-block__fade"
          onClick={() => setExpanded(true)}
          aria-label="展开完整代码"
        >
          <span className="mono">展开完整代码</span>
        </button>
      )}
    </div>
  )
}
