import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Funnel } from '@phosphor-icons/react/dist/icons/Funnel'
import { PostCard } from '../components/ui/PostCard'
import { TagCloud } from '../components/tags/TagCloud'
import { posts, categories } from '../data/posts'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './posts.css'

export default function PostsPage() {
  const [category, setCategory] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const reduced = usePrefersReducedMotion()

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (category && p.category !== category) return false
        if (tag && !p.tags.includes(tag)) return false
        return true
      }),
    [category, tag],
  )

  const clear = () => {
    setCategory(null)
    setTag(null)
  }

  return (
    <div className="posts-page">
      <header className="page-header">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          全部文章
        </motion.h1>
        <motion.p
          className="page-header__sub"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0 : 0.4,
            delay: reduced ? 0 : 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          共 {posts.length} 篇 · 记录前端架构、性能优化与工程实践
        </motion.p>
      </header>

      <section className="posts-page__filters" aria-label="筛选文章">
        <div className="posts-page__filter-row">
          <span className="posts-page__filter-label">
            <Funnel size={14} aria-hidden="true" />
            分类
          </span>
          <div className="posts-page__chips">
            <button
              type="button"
              className="posts-page__chip"
              data-active={category === null}
              onClick={() => setCategory(null)}
            >
              全部
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className="posts-page__chip"
                data-active={category === c}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="posts-page__filter-row">
          <span className="posts-page__filter-label">标签</span>
          <TagCloud active={tag} onSelect={setTag} limit={12} animateIn={false} />
        </div>
      </section>

      <div className="posts-page__count">
        <span className="mono">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </span>
        {(category || tag) && (
          <button type="button" className="posts-page__clear" onClick={clear}>
            清除筛选
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${category ?? 'all'}-${tag ?? 'all'}`}
          className="grid grid--2"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {filtered.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="posts-page__empty">
          <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
            <rect
              x="12"
              y="20"
              width="56"
              height="40"
              rx="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.35"
            />
            <line x1="22" y1="33" x2="58" y2="33" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <line x1="22" y1="42" x2="50" y2="42" stroke="currentColor" strokeWidth="2" opacity="0.35" />
            <line x1="22" y1="51" x2="44" y2="51" stroke="currentColor" strokeWidth="2" opacity="0.22" />
          </svg>
          <h2>这里还没有文章</h2>
          <p>试试切换分类或标签，或者清除全部筛选条件。</p>
          <button type="button" onClick={clear}>
            查看全部文章
          </button>
        </div>
      )}
    </div>
  )
}
