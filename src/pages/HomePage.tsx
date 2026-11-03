import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight'
import { Sparkle } from '@phosphor-icons/react/dist/icons/Sparkle'
import { Hero } from '../components/hero/Hero'
import { ProfileCard } from '../components/profile/ProfileCard'
import { TagCloud } from '../components/tags/TagCloud'
import { Timeline } from '../components/timeline/Timeline'
import { ReadingLeaderboard } from '../components/ui/ReadingLeaderboard'
import { PostCard } from '../components/ui/PostCard'
import { useInView } from '../hooks/useInView'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { posts } from '../data/posts'
import './home.css'

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const { ref: listRef, inView: listInView } = useInView<HTMLDivElement>({
    threshold: 0.05,
  })
  const { ref: featRef, inView: featInView } = useInView<HTMLDivElement>({
    threshold: 0.08,
  })
  const reduced = usePrefersReducedMotion()

  const latest = posts.slice(0, 6)
  const featured = posts.filter((p) => p.featured).slice(0, 3)

  const filtered = activeTag
    ? posts.filter((p) => p.tags.includes(activeTag))
    : latest

  return (
    <div className="home-layout">
      {/* =================================================================
          CENTER MAIN CONTENT (自适应宽度 minmax(0, 1fr))
          ================================================================= */}
      <div className="home-main">
        {/* Hero 主视觉 (300~360px) */}
        <Hero />

        {/* 最新文章 (三列 Grid: repeat(3, minmax(0, 1fr))) */}
        <section className="section home-section">
          <div className="section__head">
            <div>
              <h2 className="section__title">最新文章</h2>
              <p className="section__sub">
                {activeTag
                  ? `已筛选标签：#${activeTag} · ${filtered.length} 篇`
                  : '最近的技术笔记与工程实践'}
              </p>
            </div>
            <Link to="/posts" className="section__more">
              全部文章
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div ref={listRef} className="article-grid">
            <AnimatePresence mode="popLayout">
              {filtered.map((post, i) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  index={i}
                  animateIn={listInView}
                />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="home__empty">
              <p>没有匹配的文章</p>
              <button type="button" onClick={() => setActiveTag(null)}>
                清除筛选
              </button>
            </div>
          )}
        </section>

        {/* 精选推荐 (三列横向卡片) */}
        <section className="section home-section">
          <div className="section__head">
            <div className="home-featured-head">
              <Sparkle size={18} weight="fill" className="home-featured-icon" aria-hidden="true" />
              <div>
                <h2 className="section__title">精选推荐</h2>
                <p className="section__sub">高阅读量与重点架构文章</p>
              </div>
            </div>
          </div>
          <div ref={featRef} className="featured-grid">
            {featured.map((post, i) => (
              <PostCard
                key={post.slug}
                post={post}
                index={i}
                variant="featured"
                animateIn={featInView}
              />
            ))}
          </div>
        </section>
      </div>

      {/* =================================================================
          RIGHT SIDEBAR (固定宽度 290px sticky)
          依次展示：1. 个人资料卡 2. 热门标签 3. 近期动态 4. 阅读排行榜
          ================================================================= */}
      <aside className="home-right-rail" aria-label="侧边信息栏">
        <div className="home-right-rail__inner">
          {/* 1. 个人资料卡 */}
          <ProfileCard />

          {/* 2. 热门标签 */}
          <div className="home-widget">
            <div className="home-widget__header">
              <h3 className="home-widget__title">热门标签</h3>
              {activeTag && (
                <button
                  type="button"
                  className="home-widget__clear mono"
                  onClick={() => setActiveTag(null)}
                >
                  重置
                </button>
              )}
            </div>
            <TagCloud
              active={activeTag}
              onSelect={(t) => setActiveTag(t === activeTag ? null : t)}
              limit={16}
            />
          </div>

          {/* 3. 阅读排行榜 Top 5 */}
          <div className="home-widget">
            <ReadingLeaderboard />
          </div>

          {/* 4. 近期动态 Timeline */}
          <div className="home-widget">
            <div className="home-widget__header">
              <h3 className="home-widget__title">近期动态</h3>
            </div>
            <Timeline />
          </div>
        </div>
      </aside>

      {/* ---- Reduced-motion note for screen readers ---- */}
      {!reduced && (
        <p className="sr-only">
          本页使用了滚动入场动画与视差效果。若系统启用了减少动态效果，这些动画会自动关闭。
        </p>
      )}
    </div>
  )
}
