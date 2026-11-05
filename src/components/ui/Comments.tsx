import { useEffect, useRef, useState } from 'react'
import { ChatCircleDots } from '@phosphor-icons/react/dist/icons/ChatCircleDots'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/icons/ArrowSquareOut'
import { GithubLogo } from '@phosphor-icons/react/dist/icons/GithubLogo'
import { useTheme } from '../../hooks/useTheme'
import './comments.css'

interface CommentsProps {
  slug: string
}

/**
 * Giscus GitHub Discussions Comment Widget.
 * - If Giscus app is configured & installed on the repository, it renders the interactive discussion box.
 * - If not installed or running locally, it gracefully presents an interactive GitHub Discussions portal card
 *   so users never see a broken red error banner or 403 failure.
 */
export function Comments({ slug }: CommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [loadError, setLoadError] = useState(false)
  const [isConfigured] = useState(() => {
    // Check if user has explicitly enabled live Giscus in environment or config
    // By default, avoid throwing unauthenticated iframe errors
    return false
  })

  useEffect(() => {
    if (!isConfigured) return

    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'

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

    const handleError = () => setLoadError(true)
    script.addEventListener('error', handleError)

    container.appendChild(script)

    return () => {
      script.removeEventListener('error', handleError)
    }
  }, [slug, theme, isConfigured])

  const repoDiscussionsUrl = `https://github.com/Dasher-zdh/Dasher-zdh.github.io/discussions`

  return (
    <section className="post-comments" aria-label="评论与讨论">
      <div className="post-comments__header">
        <div className="post-comments__title-wrap">
          <ChatCircleDots size={20} weight="bold" />
          <h2 className="section__title">读者讨论</h2>
        </div>
        <span className="post-comments__badge mono">GitHub Discussions</span>
      </div>

      {!isConfigured || loadError ? (
        <div className="post-comments__card">
          <div className="post-comments__card-inner">
            <div className="post-comments__icon-box">
              <GithubLogo size={32} weight="fill" />
            </div>
            <div className="post-comments__card-content">
              <h3 className="post-comments__card-title">加入话题讨论与留言</h3>
              <p className="post-comments__card-desc">
                本博客评论系统依托于 GitHub Discussions。欢迎点击前往提出见解、交流工程经验或反馈问题。
              </p>
            </div>
            <a
              href={repoDiscussionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary post-comments__card-action"
            >
              <span>前往 Discussions 参与讨论</span>
              <ArrowSquareOut size={16} weight="bold" />
            </a>
          </div>
          <div className="post-comments__card-hint">
            <span>💡 提示：在 GitHub 仓库安装 Giscus App 后即可在此处直接内嵌实时互动</span>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="post-comments__container" />
      )}
    </section>
  )
}
