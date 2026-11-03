import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { TrendUp } from '@phosphor-icons/react/dist/icons/TrendUp'
import { Eye } from '@phosphor-icons/react/dist/icons/Eye'
import { posts, type Post } from '../../data/posts'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './reading-leaderboard.css'

export function ReadingLeaderboard() {
  const reduced = usePrefersReducedMotion()

  // Top 5 posts sorted by views
  const topPosts = [...posts]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <div className="leaderboard__title-wrap">
          <TrendUp size={16} className="leaderboard__icon" aria-hidden="true" />
          <h3 className="leaderboard__title">阅读排行榜</h3>
        </div>
        <span className="leaderboard__badge mono">TOP 5</span>
      </div>

      <ol className="leaderboard__list">
        {topPosts.map((post: Post, i: number) => {
          const rank = i + 1
          return (
            <motion.li
              key={post.slug}
              className="leaderboard__item"
              initial={reduced ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduced ? 0 : 0.35,
                delay: reduced ? 0 : i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link to={`/posts/${post.slug}`} className="leaderboard__link">
                <span className="leaderboard__rank mono" data-rank={rank}>
                  0{rank}
                </span>
                <div className="leaderboard__info">
                  <h4 className="leaderboard__post-title">{post.title}</h4>
                  <div className="leaderboard__meta">
                    <span className="leaderboard__views">
                      <Eye size={12} aria-hidden="true" />
                      {post.views.toLocaleString('en-US')} 阅
                    </span>
                    <span className="leaderboard__cat">{post.category}</span>
                  </div>
                </div>
              </Link>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
