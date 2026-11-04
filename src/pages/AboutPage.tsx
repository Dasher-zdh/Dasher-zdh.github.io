import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight'
import { MapPin } from '@phosphor-icons/react/dist/icons/MapPin'
import { Envelope } from '@phosphor-icons/react/dist/icons/Envelope'
import { Clock } from '@phosphor-icons/react/dist/icons/Clock'
import { ProfileCard } from '../components/profile/ProfileCard'
import { Timeline } from '../components/timeline/Timeline'
import { TagCloud } from '../components/tags/TagCloud'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { site } from '../data/site'
import './about.css'

export default function AboutPage() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="about">
      <header className="page-header">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          关于
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
          {site.description}
        </motion.p>
      </header>

      <div className="about__layout">
        <aside className="about__aside">
          <ProfileCard />

          <dl className="about__facts">
            <div className="about__fact">
              <dt>
                <MapPin size={14} aria-hidden="true" />
                坐标
              </dt>
              <dd>{site.location}</dd>
            </div>
            <div className="about__fact">
              <dt>
                <Envelope size={14} aria-hidden="true" />
                联系
              </dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            <div className="about__fact">
              <dt>
                <Clock size={14} aria-hidden="true" />
                时区
              </dt>
              <dd>UTC+8</dd>
            </div>
          </dl>
        </aside>

        <div className="about__main">
          <section className="about__section">
            <h2 className="section__title">我做了什么</h2>
            <p className="about__lead">
              我是冬海，一个把「动效」当作工程问题来解的前端工程师。
            </p>
            <p className="about__p">
              大多数人做动画时依赖直觉——调一个时长，看看顺不顺。这个博客里的每一篇文章几乎都在做同一件事：
              把主观感受换成可度量的指标，然后讨论在约束下怎么做。
            </p>
            <p className="about__p">
              粒子系统的帧预算、设计令牌的层级结构、滚动监听的节流方式、
              无障碍降级后的终态一致性——这些题目看起来琐碎，但它们共同决定了一个产品是「精致」还是「廉价」。
            </p>
          </section>

          <section className="about__section">
            <h2 className="section__title">本站用到的技术</h2>
            <div className="about__stack">
              {[
                { name: 'React 19', desc: '并发渲染与服务端组件的心智模型' },
                { name: 'Motion', desc: '布局动画、手势与滚动驱动动画' },
                { name: 'TypeScript', desc: '把设计令牌与组件契约都变成类型' },
                { name: 'Canvas 2D', desc: '粒子系统的渲染管线与性能预算' },
                { name: 'CSS Grid', desc: '命名区域驱动的响应式布局' },
                { name: 'IntersectionObserver', desc: '滚动触发与视口感知' },
              ].map((tech, i) => (
                <motion.div
                  key={tech.name}
                  className="about__stack-item"
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                  transition={{
                    duration: reduced ? 0 : 0.36,
                    delay: reduced ? 0 : (i % 3) * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <strong>{tech.name}</strong>
                  <span>{tech.desc}</span>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="about__section">
            <h2 className="section__title">标签分布</h2>
            <TagCloud animateIn={false} />
          </section>

          <section className="about__section">
            <h2 className="section__title">近期动态</h2>
            <Timeline />
          </section>

          <section className="about__cta">
            <h2>想聊聊这些话题？</h2>
            <p>性能优化、动效系统、设计工程化——随时来信。</p>
            <a href={`mailto:${site.email}`} className="btn btn--primary">
              <span>发邮件给我</span>
              <ArrowRight size={18} className="btn__arrow" aria-hidden="true" />
            </a>
            <Link to="/posts" className="btn btn--ghost">
              先读读文章
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
