import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scroll restoration that behaves like a real site (xuqiu.txt §9):
 *  • a new page starts at the top
 *  • going *back* restores the previous scroll position
 *  • "尽可能恢复之前的浏览状态"
 */
export function ScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const currentKey = useRef(location.key)

  useEffect(() => {
    const onScroll = () => {
      positions.current.set(currentKey.current, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      positions.current.set(currentKey.current, window.scrollY)
    }
  }, [])

  useEffect(() => {
    if (navType === 'POP') {
      const saved = positions.current.get(location.key)
      if (saved !== undefined) {
        window.scrollTo({ top: saved, behavior: 'auto' })
        currentKey.current = location.key
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
    currentKey.current = location.key
  }, [location, navType])

  return null
}
