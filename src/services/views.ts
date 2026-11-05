/**
 * Robust Monotonic Views Service
 *
 * Guarantees:
 * 1. Strictly Monotonic: View counts ONLY increase and NEVER decrease or fluctuate.
 * 2. Unified Source of Truth: PostCard, ReadingLeaderboard, PostDetailPage and ProfileCard
 *    all share the exact same consistent count.
 * 3. Zero-Lag Local-First: Updates immediately on view; does not flicker or drop when
 *    third-party network services (like Busuanzi or Adblock) fail or 502.
 * 4. Session Debounce: Prevents accidental multiple increments on fast refresh (10min window).
 */

import { posts } from '../data/posts'

const STORAGE_MAX_PREFIX = 'zdh_views_max_'
const STORAGE_DELTA_PREFIX = 'zdh_post_views_'
const SESSION_VISITED_PREFIX = 'zdh_visited_'

/**
 * Gets the current stable, monotonic view count for an article.
 * Guarantees views >= baseViews and never drops.
 */
export function getPostViews(slug: string, baseViews: number): number {
  if (typeof window === 'undefined') return baseViews
  const maxKey = `${STORAGE_MAX_PREFIX}${slug}`
  const deltaKey = `${STORAGE_DELTA_PREFIX}${slug}`

  const savedMax = Number(localStorage.getItem(maxKey) || 0)
  const savedDelta = Number(localStorage.getItem(deltaKey) || 0)

  const current = Math.max(baseViews, baseViews + savedDelta, savedMax)
  // Ensure the max cache is always updated
  if (current > savedMax) {
    try {
      localStorage.setItem(maxKey, String(current))
    } catch {
      /* ignore storage errors */
    }
  }
  return current
}

/**
 * Increments the view count by 1 on article visit (debounced by 10 minutes).
 * Returns the new guaranteed view count.
 */
export function recordAndGetPostView(slug: string, baseViews: number): number {
  if (typeof window === 'undefined') return baseViews

  const visitedKey = `${SESSION_VISITED_PREFIX}${slug}`
  const lastVisited = Number(sessionStorage.getItem(visitedKey) || 0)
  const now = Date.now()

  let currentViews = getPostViews(slug, baseViews)

  // Increment if not visited in this session / 10min
  if (!lastVisited || now - lastVisited > 10 * 60 * 1000) {
    sessionStorage.setItem(visitedKey, String(now))
    const deltaKey = `${STORAGE_DELTA_PREFIX}${slug}`
    const nextDelta = Number(localStorage.getItem(deltaKey) || 0) + 1
    localStorage.setItem(deltaKey, String(nextDelta))

    currentViews = Math.max(currentViews + 1, baseViews + nextDelta)
    localStorage.setItem(`${STORAGE_MAX_PREFIX}${slug}`, String(currentViews))
  }

  // Trigger optional background cloud ping (does not block or downgrade local count)
  syncCloudCounter(slug, currentViews).catch(() => {})

  return currentViews
}

/**
 * Calculates total site views dynamically across all posts,
 * reflecting every read increment accurately.
 */
export function getTotalSiteViews(): number {
  return posts.reduce((sum, p) => sum + getPostViews(p.slug, p.views), 0)
}

/**
 * Optional cloud sync via busuanzi/endpoint that strictly only updates upwards.
 */
async function syncCloudCounter(slug: string, currentLocalMax: number): Promise<void> {
  if (typeof window === 'undefined') return

  const cloudPv = await fetchBusuanziPagePv()
  if (typeof cloudPv === 'number' && cloudPv > 0) {
    const post = posts.find((p) => p.slug === slug)
    const base = post ? post.views : 0
    const candidate = base + cloudPv
    if (candidate > currentLocalMax) {
      localStorage.setItem(`${STORAGE_MAX_PREFIX}${slug}`, String(candidate))
    }
  }
}

function fetchBusuanziPagePv(): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)

    const callbackName = `bsz_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const timer = window.setTimeout(() => {
      cleanup()
      resolve(null)
    }, 2000)

    const cleanup = () => {
      window.clearTimeout(timer)
      delete (window as unknown as Record<string, unknown>)[callbackName]
      const el = document.getElementById(callbackName)
      if (el && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }

    ;(window as unknown as Record<string, (res: { page_pv?: number }) => void>)[callbackName] = (res) => {
      cleanup()
      if (res && typeof res.page_pv === 'number') {
        resolve(res.page_pv)
      } else {
        resolve(null)
      }
    }

    const script = document.createElement('script')
    script.id = callbackName
    script.src = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callbackName}`
    script.referrerPolicy = 'no-referrer-when-downgrade'
    script.onerror = () => {
      cleanup()
      resolve(null)
    }

    document.head.appendChild(script)
  })
}
