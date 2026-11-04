import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { marked } from 'marked'
import { ArrowLeft } from '@phosphor-icons/react/dist/icons/ArrowLeft'
import { Clock } from '@phosphor-icons/react/dist/icons/Clock'
import { Eye } from '@phosphor-icons/react/dist/icons/Eye'
import { CalendarBlank } from '@phosphor-icons/react/dist/icons/CalendarBlank'
import { CaretRight } from '@phosphor-icons/react/dist/icons/CaretRight'
import { getPost, relatedPosts, type ArticleBlock } from '../data/posts'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { CoverArt } from '../components/visuals/CoverArt'
import { Lightbox, type LightboxImage } from '../components/ui/Lightbox'
import { CodeBlock } from '../components/ui/CodeBlock'
import { PostCard } from '../components/ui/PostCard'
import './post-detail.css'

interface TocEntry {
  id: string
  text: string
  level: 2 | 3
}

export default function PostDetailPage() {
  const { slug = '' } = useParams()
  const post = getPost(slug)
  const reduced = usePrefersReducedMotion()
  const { ref: articleRef, barRef } = useScrollProgress<HTMLElement>()
  const [activeId, setActiveId] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(true)
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(
    null,
  )

  const toc = useMemo<TocEntry[]>(() => {
    if (!post) return []
    return post.body
      .filter(
        (b): b is Extract<ArticleBlock, { type: 'h2' | 'h3' }> =>
          b.type === 'h2' || b.type === 'h3',
      )
      .map((b) => ({ id: b.id, text: b.text, level: b.type === 'h2' ? 2 : 3 }))
  }, [post])

  const images = useMemo<LightboxImage[]>(
    () =>
      post
        ? post.body
            .filter((b): b is Extract<ArticleBlock, { type: 'image' }> => b.type === 'image')
            .map((b) => ({
              caption: b.caption,
              hue: b.hue,
              hue2: b.hue2,
              pattern: b.pattern,
            }))
        : [],
    [post],
  )

  // Highlight the section currently being read (xuqiu.txt §10 目录导航).
  useEffect(() => {
    if (!toc.length) return
    setActiveId(toc[0].id)

    const updateActiveHeading = () => {
      const topOffset = 160 // header height + comfortable offset
      let currentId = toc[0].id
      for (const item of toc) {
        const el = document.getElementById(item.id)
        if (el) {
          const top = el.getBoundingClientRect().top
          if (top <= topOffset) {
            currentId = item.id
          } else {
            break
          }
        }
      }
      setActiveId(currentId)
    }

    window.addEventListener('scroll', updateActiveHeading, { passive: true })
    updateActiveHeading()
    return () => window.removeEventListener('scroll', updateActiveHeading)
  }, [toc])

  if (!post) {
    return (
      <div className="post-detail__missing">
        <h1>文章不存在</h1>
        <p>这篇文章可能已被移动或删除。</p>
        <Link to="/posts" className="btn btn--primary">
          返回文章列表
        </Link>
      </div>
    )
  }

  const related = relatedPosts(post.slug, 3)

  return (
    <article ref={articleRef as React.RefObject<HTMLElement>} className="post-detail">
      {/* ---- Reading progress bar (xuqiu.txt §10) ---- */}
      <div className="post-detail__progress" aria-hidden="true">
        <div ref={barRef} className="post-detail__progress-fill" />
      </div>

      <div className="post-detail__layout">
        <div className="post-detail__content">
          <Link to="/posts" className="post-detail__back">
            <ArrowLeft size={16} aria-hidden="true" />
            返回列表
          </Link>

          {/* ---- Title first ---- */}
          <motion.header
            className="post-detail__header"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="post-detail__meta-top">
              <span className="post-detail__category">{post.category}</span>
              {post.tags.map((t) => (
                <Link key={t} to="/tags" className="post-detail__tag">
                  #{t}
                </Link>
              ))}
            </div>

            <h1 className="post-detail__title">{post.title}</h1>
            <p className="post-detail__excerpt">{post.excerpt}</p>

            <div className="post-detail__meta">
              <time className="post-detail__meta-item" dateTime={post.date}>
                <CalendarBlank size={14} aria-hidden="true" />
                {post.date.replace(/-/g, '.')}
              </time>
              <span className="post-detail__meta-item">
                <Clock size={14} aria-hidden="true" />
                {post.readTime} 分钟阅读
              </span>
              <span className="post-detail__meta-item">
                <Eye size={14} aria-hidden="true" />
                {post.views.toLocaleString('en-US')} 阅读
              </span>
            </div>
          </motion.header>

          {/* ---- Cover fades in after the title ---- */}
          <motion.div
            className="post-detail__cover"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {post.cover.image ? (
              <img
                src={post.cover.image}
                alt={post.title}
                className="post-detail__cover-img"
              />
            ) : (
              <CoverArt
                className="post-detail__cover-art"
                hue={post.cover.hue}
                hue2={post.cover.hue2}
                pattern={post.cover.pattern}
                seed={post.slug}
                detailed
              />
            )}
          </motion.div>

          {/* ---- Body: sections fade in as they scroll ---- */}
          <div ref={articleRef as React.RefObject<HTMLDivElement>} className="post-detail__body">
            {post.body.map((block, i) => (
              <Block
                key={i}
                block={block}
                index={i}
                images={images}
                onImageClick={(index) => setLightbox({ images, index })}
              />
            ))}
          </div>

          {/* ---- Related ---- */}
          <section className="post-detail__related">
            <h2 className="section__title">相关文章</h2>
            <div className="grid grid--3">
              {related.map((p, i) => (
                <PostCard key={p.slug} post={p} index={i} variant="compact" />
              ))}
            </div>
          </section>
        </div>

        {/* ---- TOC (sticky) ---- */}
        {toc.length > 0 && (
          <aside className="post-detail__toc" aria-label="文章目录">
            <button
              type="button"
              className="post-detail__toc-toggle"
              onClick={() => setTocOpen((o) => !o)}
              aria-expanded={tocOpen}
            >
              <span>目录</span>
              <CaretRight
                size={14}
                className="post-detail__toc-caret"
                data-open={tocOpen}
                aria-hidden="true"
              />
            </button>

            {tocOpen && (
              <nav className="post-detail__toc-nav">
                <ul>
                  {toc.map((entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="post-detail__toc-link"
                        data-level={entry.level}
                        data-active={activeId === entry.id}
                        onClick={(e) => {
                          e.preventDefault()
                          const el = document.getElementById(entry.id)
                          el?.scrollIntoView({
                            behavior: reduced ? 'auto' : 'smooth',
                            block: 'start',
                          })
                          setActiveId(entry.id)
                        }}
                      >
                        <span className="post-detail__toc-indicator" aria-hidden="true" />
                        {entry.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
        )}
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((s) => (s ? { ...s, index: i } : s))}
        />
      )}
    </article>
  )
}

/** Renders one content block, with scroll-triggered fade-in. */
function Block({
  block,
  index,
  images,
  onImageClick,
}: {
  block: ArticleBlock
  index: number
  images: LightboxImage[]
  onImageClick: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const motionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
        transition: {
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1] as const,
          delay: Math.min(index % 3, 2) * 0.04,
        },
      }

  return (
    <motion.div ref={ref} className="post-detail__block" {...motionProps}>
      {block.type === 'p' && (
        <p
          className="post-detail__p"
          dangerouslySetInnerHTML={{ __html: marked.parseInline(block.text) as string }}
        />
      )}

      {block.type === 'h2' && (
        <h2 id={block.id} className="post-detail__h2">
          <span className="post-detail__h-marker" aria-hidden="true" />
          {block.text}
        </h2>
      )}

      {block.type === 'h3' && (
        <h3 id={block.id} className="post-detail__h3">
          {block.text}
        </h3>
      )}

      {block.type === 'quote' && (
        <blockquote
          className="post-detail__quote"
          dangerouslySetInnerHTML={{ __html: marked.parseInline(block.text) as string }}
        />
      )}

      {block.type === 'list' && (
        <ul className="post-detail__list">
          {block.items.map((item, idx) => (
            <li
              key={idx}
              dangerouslySetInnerHTML={{ __html: marked.parseInline(item) as string }}
            />
          ))}
        </ul>
      )}

      {block.type === 'code' && (
        <CodeBlock lang={block.lang} code={block.code} />
      )}

      {block.type === 'image' && (
        <figure className="post-detail__figure">
          <button
            type="button"
            className="post-detail__figure-btn"
            onClick={() =>
              onImageClick(images.findIndex((i) => i.caption === block.caption))
            }
            aria-label={`放大查看图片：${block.caption}`}
          >
            <CoverArt
              className="post-detail__figure-art"
              hue={block.hue}
              hue2={block.hue2}
              pattern={block.pattern}
              seed={`${block.caption}`}
              detailed
            />
          </button>
          <figcaption className="post-detail__figcaption">{block.caption}</figcaption>
        </figure>
      )}
    </motion.div>
  )
}
