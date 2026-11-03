import { useEffect, useMemo, useState } from 'react'
import { posts, type Post } from '../data/posts'

export interface SearchHit {
  post: Post
  /** Title with the match wrapped in highlight sentinels. */
  title: string
  /** Excerpt with the match wrapped in highlight sentinels. */
  excerpt: string
  score: number
  matchedIn: 'title' | 'excerpt' | 'tag'
}

const HISTORY_KEY = 'sanzang-search-history'
const MAX_HISTORY = 6

/**
 * Sentinels used to mark the matched substring so the renderer can wrap it in
 * <mark> without dangerouslySetInnerHTML.
 */
export const HIGHLIGHT_OPEN = '«'
export const HIGHLIGHT_CLOSE = '»'

function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,，、。/·|]+/)
    .filter(Boolean)
}

function highlight(text: string, query: string): string {
  const q = query.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    text.slice(0, idx) +
    HIGHLIGHT_OPEN +
    text.slice(idx, idx + q.length) +
    HIGHLIGHT_CLOSE +
    text.slice(idx + q.length)
  )
}

/**
 * Client-side full-text search over posts.
 *
 * Small corpus → a simple scoring pass over title/excerpt/tags is enough;
 * no external index, no network. Keeps the payload tiny.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>(readHistory)

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      /* ignore */
    }
  }, [history])

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const tokens = tokenize(q)
    const hits: SearchHit[] = []

    for (const post of posts) {
      const title = post.title.toLowerCase()
      const excerpt = post.excerpt.toLowerCase()
      const tags = post.tags.join(' ').toLowerCase()
      const category = post.category.toLowerCase()

      let score = 0
      let matchedIn: SearchHit['matchedIn'] = 'excerpt'

      if (title.includes(q)) {
        score += 100
        matchedIn = 'title'
      } else if (tags.includes(q)) {
        score += 60
        matchedIn = 'tag'
      } else if (category.includes(q)) {
        score += 40
      }

      for (const token of tokens) {
        if (title.includes(token)) score += 30
        if (tags.includes(token)) score += 14
        if (excerpt.includes(token)) score += 8
        if (category.includes(token)) score += 6
      }

      if (score > 0) {
        hits.push({
          post,
          score,
          matchedIn,
          title: highlight(post.title, q),
          excerpt: highlight(post.excerpt, q),
        })
      }
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, 8)
  }, [query])

  const pushHistory = (term: string) => {
    const t = term.trim()
    if (!t) return
    setHistory((prev) => [t, ...prev.filter((x) => x !== t)].slice(0, MAX_HISTORY))
  }

  const clearHistory = () => setHistory([])

  return { query, setQuery, results, history, pushHistory, clearHistory }
}
