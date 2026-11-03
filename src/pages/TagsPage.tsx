import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TagCloud } from '../components/tags/TagCloud'
import { PostCard } from '../components/ui/PostCard'
import { posts } from '../data/posts'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export default function TagsPage() {
  const [active, setActive] = useState<string | null>(null)
  const reduced = usePrefersReducedMotion()

  const filtered = useMemo(
    () => (active ? posts.filter((p) => p.tags.includes(active)) : posts),
    [active],
  )

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of posts) {
      for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1)
    }
    return map
  }, [])

  return (
    <div className="tags-page">
      <header className="page-header">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          标签索引
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
          共 {tagCounts.size} 个标签 · 点击标签筛选文章
        </motion.p>
      </header>

      <section className="tags-page__cloud">
        <TagCloud active={active} onSelect={setActive} />
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={active ?? 'all'}
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
          <h2>这个标签下还没有文章</h2>
          <button type="button" onClick={() => setActive(null)}>
            查看全部文章
          </button>
        </div>
      )}
    </div>
  )
}
