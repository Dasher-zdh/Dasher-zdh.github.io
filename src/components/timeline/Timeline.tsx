import { motion } from 'motion/react'
import { timeline } from '../../data/site'
import { useInView } from '../../hooks/useInView'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './timeline.css'

/**
 * Recent-activity timeline (xuqiu.txt §8):
 *  • the line draws downward as it enters view
 *  • nodes appear in chronological order
 *  • the newest node breathes softly
 *  • hovering a node highlights its card
 */
export function Timeline() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 })
  const reduced = usePrefersReducedMotion()

  return (
    <div ref={ref} className="timeline">
      <span
        className="timeline__line"
        style={{
          transform: inView && !reduced ? 'scaleY(1)' : 'scaleY(0)',
        }}
        aria-hidden="true"
      />

      {timeline.map((item, i) => {
        const isLatest = i === 0
        return (
          <motion.article
            key={item.id}
            className="timeline__item"
            initial={reduced ? false : { opacity: 0, x: -14 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: reduced ? 0 : 0.4,
              delay: reduced ? 0 : i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="timeline__node" data-latest={isLatest} aria-hidden="true">
              <span className="timeline__node-dot" />
              {isLatest && !reduced && <span className="timeline__node-pulse" />}
            </span>

            <div className="timeline__card">
              <div className="timeline__meta">
                <time className="mono" dateTime={item.date}>
                  {item.date}
                </time>
                <span className="timeline__tag">{item.tag}</span>
              </div>
              <h3 className="timeline__title">{item.title}</h3>
              <p className="timeline__desc">{item.desc}</p>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
