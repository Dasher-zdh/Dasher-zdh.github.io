import { useEffect, useRef, useState } from 'react'

/**
 * Counts up to `value` once, when the element first enters the viewport.
 *
 * xuqiu.txt §6: 数字只在首次进入可视区域时触发，不要在每次滚动时重新播放。
 */
export function useCountUp(
  value: number,
  { duration = 1600, decimals = 0, start = false }: { duration?: number; decimals?: number; start?: boolean } = {},
) {
  const [display, setDisplay] = useState(start ? 0 : value)
  const rafRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!start || doneRef.current) return
    doneRef.current = true

    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      // easeOutExpo — fast start, gentle settle
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const current = value * eased
      setDisplay(
        decimals > 0
          ? Number(current.toFixed(decimals))
          : Math.round(current),
      )
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, decimals, start])

  return display
}
