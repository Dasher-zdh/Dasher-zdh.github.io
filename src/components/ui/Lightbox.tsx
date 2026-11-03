import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { X } from '@phosphor-icons/react/dist/icons/X'
import { CaretLeft } from '@phosphor-icons/react/dist/icons/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/icons/CaretRight'
import { ArrowsOutSimple } from '@phosphor-icons/react/dist/icons/ArrowsOutSimple'
import { Minus } from '@phosphor-icons/react/dist/icons/Minus'
import { Plus } from '@phosphor-icons/react/dist/icons/Plus'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { CoverArt } from '../visuals/CoverArt'
import type { CoverPattern } from '../../data/posts'
import './lightbox.css'

export interface LightboxImage {
  caption: string
  hue: number
  hue2: number
  pattern: CoverPattern
}

interface LightboxProps {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/**
 * Image lightbox (xuqiu.txt §10 图片预览):
 *  • backdrop dims in
 *  • image scales from its origin to centre
 *  • ESC closes, ←/→ navigate, wheel zooms, buttons zoom
 */
export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const reduced = usePrefersReducedMotion()
  const [zoom, setZoom] = useState(1)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)

  const current = images[index]

  const close = useCallback(() => {
    setZoom(1)
    onClose()
  }, [onClose])

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return
      const next = (index + delta + images.length) % images.length
      setZoom(1)
      onIndexChange(next)
    },
    [index, images.length, onIndexChange],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(3, z + 0.25))
      else if (e.key === '-') setZoom((z) => Math.max(1, z - 0.25))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  // Prevent the page behind the lightbox from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const onWheel = (e: React.WheelEvent) => {
    if (!e.deltaY) return
    setZoom((z) => Math.min(3, Math.max(1, z - e.deltaY * 0.0015)))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    originRef.current = { x: e.clientX, y: e.clientY }
    setOrigin({ x: e.clientX, y: e.clientY })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || zoom <= 1) return
    const o = originRef.current
    if (!o) return
    setOrigin({ x: e.clientX - o.x, y: e.clientY - o.y })
  }

  const onPointerUp = () => {
    dragging.current = false
    originRef.current = null
  }

  if (!current) return null

  return (
    <motion.div
      className="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={current.caption}
      onClick={close}
    >
      <motion.button
        type="button"
        className="lightbox__close"
        onClick={close}
        aria-label="关闭预览"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduced ? 0 : 0.12 }}
      >
        <X size={20} weight="bold" aria-hidden="true" />
      </motion.button>

      {images.length > 1 && (
        <>
          <motion.button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="上一张图片"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : 0.14 }}
          >
            <CaretLeft size={24} weight="bold" aria-hidden="true" />
          </motion.button>
          <motion.button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="下一张图片"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : 0.14 }}
          >
            <CaretRight size={24} weight="bold" aria-hidden="true" />
          </motion.button>
        </>
      )}

      <motion.figure
        className="lightbox__figure"
        initial={{ opacity: 0, scale: 0.86, y: 16 }}
        animate={{ opacity: 1, scale: zoom, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 220, damping: 26 }
        }
        style={origin ? { x: origin.x, y: origin.y } : undefined}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <CoverArt
          className="lightbox__art"
          hue={current.hue}
          hue2={current.hue2}
          pattern={current.pattern}
          seed={`${current.caption}-${index}`}
          detailed
        />
        <figcaption className="lightbox__caption">{current.caption}</figcaption>
      </motion.figure>

      <div className="lightbox__controls" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          disabled={zoom <= 1}
          aria-label="缩小"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span className="lightbox__zoom mono">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          disabled={zoom >= 3}
          aria-label="放大"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          aria-label="重置缩放"
        >
          <ArrowsOutSimple size={16} aria-hidden="true" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="lightbox__counter mono" aria-live="polite">
          {index + 1} / {images.length}
        </div>
      )}
    </motion.div>
  )
}
