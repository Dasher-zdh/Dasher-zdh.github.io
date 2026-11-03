import { useEffect, useState } from 'react'

/**
 * Adaptive quality tiers.
 *
 * The background effects (starfield canvas, grid drift, scan sweep) are
 * decorative but they are *continuous* — they cost a frame every frame, all
 * day. On a machine that cannot keep up, they do not just look worse: they
 * starve the UI of frames, so a 300ms sidebar collapse takes two seconds and
 * the page feels broken.
 *
 * xuqiu.txt §16.2 asks for the particle count to be controlled on low-end
 * devices, and §16.4 to stop loops that are off-page. This hook generalises
 * that: it watches the real frame rate and steps the decorative layer down
 * until the browser can keep up again.
 */
export type QualityTier = 'high' | 'medium' | 'low'

const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high']

/** Frame budget per tier, in ms. */
const TIER_FRAME_BUDGET: Record<QualityTier, number> = {
  high: 22, // ~45fps or better
  medium: 34, // ~30fps
  low: Infinity, // anything goes — keep the UI responsive
}

/**
 * A single frame this long means the browser is already dropping frames for
 * interactive content. Drop to the lowest tier immediately rather than
 * waiting for the rolling average to catch up.
 */
const PANIC_FRAME_MS = 150
const SAMPLE_WINDOW = 20
const RECOVERY_STREAK = 60 // ~2-3 seconds of sustained smooth frames
const WARMUP_MS = 2000 // give initial page load 2s to settle before degrading

/* -------------------------------------------------------------------------
   Shared store
   -------------------------------------------------------------------------
   Every consumer watches the *same* frame rate, so there is one observer and
   one answer. Two independent observers would each install their own rAF
   loop, double the measurement cost, and could disagree about the tier. */

type Listener = (tier: QualityTier) => void

let currentTier: QualityTier = 'high'
const listeners = new Set<Listener>()
let observerCount = 0
let rafId = 0
let samples: number[] = []
let last = 0
let startTime = 0
let goodStreak = 0

const notify = () => {
  for (const listener of listeners) listener(currentTier)
}

const setTier = (next: QualityTier) => {
  if (currentTier === next) return
  currentTier = next
  notify()
}

const degrade = () => {
  const idx = TIER_ORDER.indexOf(currentTier)
  if (idx <= 0) return
  setTier(TIER_ORDER[idx - 1])
  samples = []
  goodStreak = 0
}

const tick = (now: number) => {
  rafId = requestAnimationFrame(tick)
  if (!last) {
    last = now
    startTime = now
    return
  }
  const delta = now - last
  last = now

  // Ignore absurd deltas caused by tab switches or debugger pauses.
  if (delta > 1000) return

  // Don't degrade during initial warmup (page load / asset decoding).
  if (now - startTime < WARMUP_MS) return

  if (delta >= PANIC_FRAME_MS) {
    degrade()
    return
  }

  samples.push(delta)
  if (samples.length > SAMPLE_WINDOW) samples.shift()
  if (samples.length < SAMPLE_WINDOW) return

  const sorted = [...samples].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  if (median > TIER_FRAME_BUDGET[currentTier]) {
    degrade()
    return
  }

  // Recovery: the current tier is comfortable, and the next tier up would
  // also be comfortable. Require a sustained window before stepping up.
  const idx = TIER_ORDER.indexOf(currentTier)
  if (idx < TIER_ORDER.length - 1) {
    if (median <= TIER_FRAME_BUDGET[TIER_ORDER[idx + 1]]) {
      goodStreak += 1
      if (goodStreak >= RECOVERY_STREAK) {
        setTier(TIER_ORDER[idx + 1])
        samples = []
        goodStreak = 0
      }
    } else {
      goodStreak = 0
    }
  }
}

const startObserver = () => {
  if (rafId) return
  last = 0
  samples = []
  goodStreak = 0
  rafId = requestAnimationFrame(tick)
}

const stopObserver = () => {
  if (!rafId) return
  cancelAnimationFrame(rafId)
  rafId = 0
}

/**
 * Watches the real frame rate and reports the quality tier the decorative
 * background should render at.
 *
 * Degradation is eager (one long frame is enough) and recovery is slow
 * (a sustained window of good frames), so the tier does not oscillate.
 */
export function useAdaptiveQuality(): QualityTier {
  const [tier, setLocalTier] = useState<QualityTier>(currentTier)

  useEffect(() => {
    const listener: Listener = (next) => setLocalTier(next)
    listeners.add(listener)
    observerCount += 1
    startObserver()

    // A consumer may have mounted after the tier already moved.
    listener(currentTier)

    return () => {
      listeners.delete(listener)
      observerCount -= 1
      if (observerCount <= 0) {
        observerCount = 0
        stopObserver()
      }
    }
  }, [])

  return tier
}
