import { useState, useEffect } from 'react'
import { getPostViews, recordAndGetPostView } from '../services/views'

/**
 * Hook to retrieve and increment live views for an article.
 * Guarantees monotonic increase (never decreases or drops).
 */
export function useLiveViews(slug: string, initialViews: number) {
  const [views, setViews] = useState<number>(() => getPostViews(slug, initialViews))

  useEffect(() => {
    // Record view immediately on mount and sync state
    const next = recordAndGetPostView(slug, initialViews)
    setViews(next)
  }, [slug, initialViews])

  return views
}
