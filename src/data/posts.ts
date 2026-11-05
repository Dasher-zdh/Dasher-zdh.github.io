/**
 * Post loader — automatically reads and parses all Markdown files from `/src/posts/*.md`
 * using Vite's `import.meta.glob`.
 */
import * as yaml from 'js-yaml'
import { marked } from 'marked'

export type CoverPattern =
  | 'grid'
  | 'orbit'
  | 'wave'
  | 'circuit'
  | 'layer'
  | 'security'
  | 'cloud'
  | 'ai'
  | 'editor'

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  date: string
  readTime: number
  views: number
  featured?: boolean
  cover: {
    image?: string
    hue: number
    hue2: number
    pattern: CoverPattern
  }
  body: ArticleBlock[]
}

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string; id: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; caption: string; hue: number; hue2: number; pattern: CoverPattern }

// Automatically load all .md files in src/posts/ as raw strings
const mdModules = import.meta.glob('../posts/*.md', { query: '?raw', eager: true }) as Record<
  string,
  { default: string }
>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  try {
    const data = (yaml.load(match[1]) as Record<string, any>) || {}
    return { data, content: match[2] }
  } catch {
    return { data: {}, content: raw }
  }
}

function parseMarkdownToBlocks(content: string): ArticleBlock[] {
  const tokens = marked.lexer(content)
  const blocks: ArticleBlock[] = []

  for (const token of tokens) {
    if (token.type === 'paragraph') {
      const imgMatch = token.text.match(/^!\[(.*?)\]\(pattern:\/\/([a-z]+)\?hue=(\d+)&hue2=(\d+)\)$/)
      if (imgMatch) {
        blocks.push({
          type: 'image',
          caption: imgMatch[1],
          pattern: imgMatch[2] as CoverPattern,
          hue: Number(imgMatch[3]),
          hue2: Number(imgMatch[4]),
        })
      } else {
        blocks.push({ type: 'p', text: token.text })
      }
    } else if (token.type === 'heading') {
      const id = slugify(token.text)
      if (token.depth === 2) {
        blocks.push({ type: 'h2', text: token.text, id })
      } else {
        blocks.push({ type: 'h3', text: token.text, id })
      }
    } else if (token.type === 'blockquote') {
      blocks.push({ type: 'quote', text: token.text })
    } else if (token.type === 'list') {
      const items = token.items.map((it: any) => it.text)
      blocks.push({ type: 'list', items })
    } else if (token.type === 'code') {
      blocks.push({ type: 'code', lang: token.lang || 'text', code: token.text })
    }
  }

  return blocks
}

function loadAllPosts(): Post[] {
  const loaded: Post[] = []

  for (const [filepath, mod] of Object.entries(mdModules)) {
    const raw = mod.default
    const { data, content } = parseFrontmatter(raw)
    const filename = filepath.split('/').pop()?.replace(/\.md$/, '') || ''
    const slug = data.slug || filename

    const body = parseMarkdownToBlocks(content)

    // Default pattern based on category
    let defaultPattern: CoverPattern = 'orbit'
    const cat = data.category || '技术'
    if (cat.includes('性能')) defaultPattern = 'wave'
    else if (cat.includes('架构')) defaultPattern = 'circuit'
    else if (cat.includes('可视化') || cat.includes('Canvas') || cat.includes('WebGL')) defaultPattern = 'layer'
    else if (cat.includes('AI')) defaultPattern = 'ai'
    else if (cat.includes('安全')) defaultPattern = 'security'

    loaded.push({
      slug,
      title: data.title || filename,
      excerpt: data.excerpt || content.slice(0, 120).replace(/[#*`>\n]/g, '') + '...',
      category: data.category || '随笔',
      tags: Array.isArray(data.tags) ? data.tags : [],
      date: data.date || new Date().toISOString().slice(0, 10),
      readTime: Number(data.readTime) || Math.max(1, Math.round(content.length / 400)),
      views: Number(data.views) || 3500,
      featured: Boolean(data.featured),
      cover: {
        image: data.image || data.coverImage || undefined,
        pattern: (data.pattern as CoverPattern) || defaultPattern,
        hue: Number(data.hue) || 172,
        hue2: Number(data.hue2) || 198,
      },
      body,
    })
  }

  // Sort newest first by date
  return loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const posts: Post[] = loadAllPosts()

/**
 * Calculates total views dynamically across all posts.
 */
export function getTotalViews(): number {
  return posts.reduce((sum, p) => sum + p.views, 0)
}

export const categories = Array.from(new Set(posts.map((p) => p.category)))
export const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort()

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function relatedPosts(slug: string, limit = 3): Post[] {
  const current = getPost(slug)
  if (!current) return posts.slice(0, limit)
  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score:
        p.tags.filter((t) => current.tags.includes(t)).length * 2 +
        (p.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.post)
}
