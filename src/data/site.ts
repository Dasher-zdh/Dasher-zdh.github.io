/**
 * Site-level content. Single source of truth for anything rendered in more
 * than one place (nav labels, profile card, footer, SEO).
 */

export const site = {
  title: '冬海の博客',
  titleEn: 'zdh Dev Journal',
  tagline: '在代码与宇宙之间，记录工程实践的每一次跃迁。',
  description:
    '个人技术博客，聚焦前端架构、性能优化、可视化与 AI 工程实践。深空科技风，含完整交互动画系统。',
  author: '冬海',
  authorTitle: 'Frontend Engineer · Creative Technologist',
  url: 'https://blog.uvsd.cn',
  email: 'donghaiad@163.com',
  location: 'Chengdu, China',
} as const

export const navItems = [
  { to: '/', label: '首页', icon: 'House', hint: '返回首页' },
  { to: '/posts', label: '文章', icon: 'Article', hint: '浏览全部文章' },
  { to: '/archive', label: '归档', icon: 'ClockCounterClockwise', hint: '按时间归档' },
  { to: '/about', label: '关于', icon: 'User', hint: '关于冬海' },
] as const

export const socialLinks = [
  { label: 'GitHub', icon: 'GithubLogo', href: 'https://github.com/Dasher-zdh' },
  { label: 'Twitter', icon: 'TwitterLogo', href: 'https://twitter.com' },
  { label: 'RSS', icon: 'Rss', href: '/rss.xml' },
  { label: 'Email', icon: 'Envelope', href: 'mailto:donghaiad@163.com' },
] as const

export const stats = [
  { key: 'posts', label: '文章', value: 128 },
  { key: 'reads', label: '阅读量', value: 486_320 },
  { key: 'projects', label: '开源项目', value: 24 },
  { key: 'years', label: '写码年头', value: 7 },
] as const

export const timeline = [
  {
    id: 't1',
    date: '2026-10-28',
    title: '博客 2.0 上线',
    desc: '全新深空科技风重构，含粒子星空、视差 Hero 与全局路由转场。',
    tag: '本站',
  },
  {
    id: 't2',
    date: '2026-09-14',
    title: '开源 Motion Kit',
    desc: '把常用的动效封装成可组合的 React hooks，GitHub 1.2k star。',
    tag: '开源',
  },
  {
    id: 't3',
    date: '2026-08-02',
    title: '关于 Canvas 渲染管线',
    desc: '一篇关于粒子系统性能预算的长文，被多个技术周刊转载。',
    tag: '文章',
  },
  {
    id: 't4',
    date: '2026-06-19',
    title: '成为前端周报特约作者',
    desc: '开始每周一篇的工程实践专栏。',
    tag: '里程碑',
  },
] as const
