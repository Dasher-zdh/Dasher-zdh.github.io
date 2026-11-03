import { useMemo } from 'react'
import { motion } from 'motion/react'
import { posts } from '../../data/posts'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './tag-cloud.css'

interface TagCloudProps {
  active?: string | null
  onSelect?: (tag: string | null) => void
  limit?: number
  animateIn?: boolean
}

/**
 * Tag cloud (xuqiu.txt §7):
 *  • hover → background shifts, tag lifts, teal border fades in
 *  • active tag keeps the highlight
 *  • click → slight scale feedback
 */
export function TagCloud({
  active = null,
  onSelect,
  limit,
  animateIn = true,
}: TagCloudProps) {
  const reduced = usePrefersReducedMotion()

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of posts) {
      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    const list = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }))
    return limit ? list.slice(0, limit) : list
  }, [limit])

  const max = tags[0]?.count ?? 1

  return (
    <motion.div
      className="tag-cloud"
      initial={animateIn && !reduced ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {tags.map(({ tag, count }, i) => {
        const isActive = active === tag
        return (
          <motion.button
            key={tag}
            type="button"
            className="tag-cloud__tag"
            data-active={isActive}
            initial={animateIn && !reduced ? { opacity: 0, scale: 0.9 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduced ? 0 : 0.3,
              delay: reduced ? 0 : i * 0.035,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileTap={reduced ? undefined : { scale: 0.94 }}
            onClick={() => onSelect?.(isActive ? null : tag)}
            aria-pressed={isActive}
          >
            <span className="tag-cloud__hash" aria-hidden="true">
              #
            </span>
            {tag}
            <span className="tag-cloud__count mono">{count}</span>
            <span
              className="tag-cloud__weight"
              style={{ opacity: 0.35 + (count / max) * 0.3 }}
              aria-hidden="true"
            />
          </motion.button>
        )
      })}
    </motion.div>
  )
}
