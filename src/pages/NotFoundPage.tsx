import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export default function NotFoundPage() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="notfound">
      <motion.div
        className="notfound__code mono"
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        404
      </motion.div>

      <motion.h1
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduced ? 0 : 0.4,
          delay: reduced ? 0 : 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        这条路径通向虚空
      </motion.h1>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduced ? 0 : 0.4,
          delay: reduced ? 0 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        你要找的页面不存在，或者已经被移动了。
      </motion.p>

      <motion.div
        className="notfound__actions"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduced ? 0 : 0.4,
          delay: reduced ? 0 : 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Link to="/" className="btn btn--primary">
          <span>回到首页</span>
        </Link>
        <Link to="/posts" className="btn btn--ghost">
          浏览文章
        </Link>
      </motion.div>
    </div>
  )
}
