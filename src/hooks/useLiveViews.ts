import { useState, useEffect } from 'react'
import { fetchPostViews, recordPostView, getLocalDelta } from '../services/views'

/**
 * Hook to retrieve and increment live views for a specific post.
 * Synchronizes base markdown count with cloud busuanzi hits and local session visits.
 */
export function useLiveViews(slug: string, initialViews: number) {
  const [views, setViews] = useState<number>(() => initialViews + getLocalDelta(slug))

  useEffect(() => {
    let active = true

    // 1. Increment on page load (with 10-minute session debounce)
    recordPostView(slug)

    // 2. Fetch live count asynchronously
    fetchPostViews(slug, initialViews).then((live) => {
      if (active) {
        setViews(live)
      }
    })

    return () => {
      active = false
    }
  }, [slug, initialViews])

  return views
}
