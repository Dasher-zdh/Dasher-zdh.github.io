import { useMemo } from 'react'
import { motion } from 'motion/react'
import { posts } from '../data/posts'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { PostCard } from '../components/ui/PostCard'
import './archive.css'

export default function ArchivePage() {
  const reduced = usePrefersReducedMotion()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof posts>()
    for (const post of [...posts].sort((a, b) => b.date.localeCompare(a.date))) {
      const year = post.date.slice(0, 4)
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(post)
    }
    return [...map.entries()]
  }, [])

  return (
    <div className="archive">
      <header className="page-header">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          文章归档
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
          按时间倒序排列的全部 {posts.length} 篇文章
        </motion.p>
      </header>

      {grouped.map(([year, yearPosts], gi) => (
        <section key={year} className="archive__year">
          <div className="archive__year-head">
            <h2 className="archive__year-label mono">{year}</h2>
            <span className="archive__year-count">{yearPosts.length} 篇</span>
            <span className="archive__year-rule" aria-hidden="true" />
          </div>

          <div className="archive__list">
            {yearPosts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={reduced ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.34,
                  delay: reduced ? 0 : gi * 0.05 + i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <PostCard post={post} index={0} variant="compact" animateIn={false} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
