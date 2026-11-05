import { useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'
import './comments.css'

interface CommentsProps {
  slug: string
}

/**
 * Giscus GitHub Discussions Comment Widget.
 * Loads lazily and adapts cleanly to both obsidian dark and light themes.
 */
export function Comments({ slug }: CommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear previous widget
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'

    // Only load Giscus if client is in real domain or enabled
    // Repository: Dasher-zdh/Dasher-zdh.github.io
    script.setAttribute('data-repo', 'Dasher-zdh/Dasher-zdh.github.io')
    script.setAttribute('data-repo-id', 'R_kgDONq2vEg')
    script.setAttribute('data-category', 'General')
    script.setAttribute('data-category-id', 'DIC_kwDONq2vEs4CmFw4')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
    script.setAttribute('data-lang', 'zh-CN')
    script.setAttribute('data-loading', 'lazy')

    container.appendChild(script)
  }, [slug, theme])

  return (
    <section className="post-comments" aria-label="评论与讨论">
      <div className="post-comments__header">
        <h2 className="section__title">读者讨论</h2>
        <span className="post-comments__badge mono">Powered by GitHub Discussions</span>
      </div>
      <div ref={containerRef} className="post-comments__container">
        <div className="post-comments__placeholder">
          <span>畅所欲言：支持 GitHub 账号登录留言与表情互动</span>
        </div>
      </div>
    </section>
  )
}
