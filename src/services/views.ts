/**
 * Cloud & Local Hybrid Views Service
 *
 * - Persistent Cloud Counter via Busuanzi JSONP (cross-visitor, zero-backend, free, HTTPS)
 * - Local storage delta cache for offline resilience and immediate UI updates
 * - Per-article visit debouncing (prevents duplicate counting on refresh within 10 minutes)
 */

const STORAGE_PREFIX = 'zdh_post_views_'
const VISITED_PREFIX = 'zdh_visited_'

export interface ViewsData {
  views: number
  isRealtime: boolean
}

/**
 * Fetch cloud views or return local fallback + base
 */
export async function fetchPostViews(slug: string, baseViews: number): Promise<number> {
  const localDelta = getLocalDelta(slug)
  try {
    const cloudViews = await fetchBusuanziPagePv(slug)
    if (typeof cloudViews === 'number' && cloudViews > 0) {
      return baseViews + cloudViews + localDelta
    }
  } catch {
    // Ignore network error and fallback gracefully
  }
  return baseViews + localDelta
}

/**
 * Increment view count for this post (once per session/10min)
 */
export function recordPostView(slug: string): boolean {
  if (typeof window === 'undefined') return false
  const visitedKey = `${VISITED_PREFIX}${slug}`
  const lastVisited = Number(sessionStorage.getItem(visitedKey) || 0)
  const now = Date.now()

  // Prevent counting multiple times if refreshed within 10 minutes
  if (lastVisited && now - lastVisited < 10 * 60 * 1000) {
    return false
  }

  sessionStorage.setItem(visitedKey, String(now))

  // Save local delta
  const key = `${STORAGE_PREFIX}${slug}`
  const currentDelta = Number(localStorage.getItem(key) || 0)
  localStorage.setItem(key, String(currentDelta + 1))
  return true
}

export function getLocalDelta(slug: string): number {
  if (typeof window === 'undefined') return 0
  const key = `${STORAGE_PREFIX}${slug}`
  return Number(localStorage.getItem(key) || 0)
}

/**
 * Busuanzi JSONP requester for cloud counts
 */
function fetchBusuanziPagePv(_slug: string): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)

    const callbackName = `bsz_callback_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve(null)
    }, 2500)

    const cleanup = () => {
      window.clearTimeout(timeout)
      delete (window as unknown as Record<string, unknown>)[callbackName]
      const script = document.getElementById(callbackName)
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
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
