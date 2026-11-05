import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight'
import { Clock } from '@phosphor-icons/react/dist/icons/Clock'
import { Eye } from '@phosphor-icons/react/dist/icons/Eye'
import type { Post } from '../../data/posts'
import { getPostViews } from '../../services/views'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { CoverArt } from '../visuals/CoverArt'
import { TiltCard } from './TiltCard'
import './post-card.css'

interface PostCardProps {
  post: Post
  /** Stagger index for list entrance. */
  index?: number
  variant?: 'default' | 'compact' | 'featured'
  animateIn?: boolean
}

function formatDate(iso: string) {
  return iso.replace(/-/g, '.')
}

function PostCardBase({ post, index = 0, variant = 'default', animateIn = true }: PostCardProps) {
  const reduced = usePrefersReducedMotion()
  const displayViews = getPostViews(post.slug, post.views)

  return (
    <motion.article
      className="post-card"
      data-variant={variant}
      initial={animateIn && !reduced ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              duration: 0.38,
              delay: Math.min(index * 0.06, 0.45),
              ease: [0.22, 1, 0.36, 1],
            }
      }
    >
      <TiltCard className="post-card__tilt" max={2}>
        <Link
          to={`/posts/${post.slug}`}
          className="post-card__link"
          aria-label={`阅读文章：${post.title}`}
        >
          <div className="post-card__media">
            {post.cover.image ? (
              <img
                src={post.cover.image}
                alt={post.title}
                className="post-card__cover"
                loading="lazy"
              />
            ) : (
              <CoverArt
                className="post-card__cover"
                hue={post.cover.hue}
                hue2={post.cover.hue2}
                pattern={post.cover.pattern}
                seed={post.slug}
              />
            )}
            <span className="post-card__category">{post.category}</span>
          </div>

          <div className="post-card__body">
            <h3 className="post-card__title">{post.title}</h3>
            <p className="post-card__excerpt">{post.excerpt}</p>

            <div className="post-card__meta">
              <time className="post-card__date mono" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              <span className="post-card__dot" aria-hidden="true">
                ·
              </span>
              <span className="post-card__meta-item">
                <Eye size={12} aria-hidden="true" />
                {displayViews.toLocaleString('en-US')}
              </span>
              <span className="post-card__dot" aria-hidden="true">
                ·
              </span>
              <span className="post-card__meta-item">
                <Clock size={12} aria-hidden="true" />
                {post.readTime} 分钟
              </span>
            </div>
          </div>

          <span className="post-card__arrow" aria-hidden="true">
            <ArrowRight size={16} weight="bold" />
          </span>
        </Link>
      </TiltCard>
    </motion.article>
  )
}

export const PostCard = memo(PostCardBase)
