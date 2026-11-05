import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DownloadSimple } from '@phosphor-icons/react/dist/icons/DownloadSimple'
import { X } from '@phosphor-icons/react/dist/icons/X'
import { ShareNetwork } from '@phosphor-icons/react/dist/icons/ShareNetwork'
import { Check } from '@phosphor-icons/react/dist/icons/Check'
import type { Post } from '../../data/posts'
import { site } from '../../data/site'
import './poster-modal.css'

interface PosterModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
}

/**
 * Draws a pixel-perfect, crisp Canvas snapshot poster for the article.
 * Includes obsidian rock black card, procedural generative pattern, metadata, and site stamp.
 */
export function PosterModal({ post, isOpen, onClose }: PosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High DPI scaling (2x for ultra retina crispness)
    const W = 640
    const H = 880
    const dpr = 2
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    // Background — obsidian deep rock black
    ctx.fillStyle = '#0a0a0c'
    ctx.fillRect(0, 0, W, H)

    // Outer subtle card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1
    roundRect(ctx, 24, 24, W - 48, H - 48, 16)
    ctx.stroke()

    // Inner card background
    ctx.fillStyle = '#111114'
    roundRect(ctx, 25, 25, W - 50, H - 50, 15)
    ctx.fill()

    // Top Artwork Banner (Visual Area)
    const artH = 260
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, 40, 40, W - 80, artH, 12)
    ctx.clip()

    // Gradient inside visual banner
    const bgGrad = ctx.createLinearGradient(40, 40, W - 40, 40 + artH)
    bgGrad.addColorStop(0, '#1c1c22')
    bgGrad.addColorStop(0.5, '#131316')
    bgGrad.addColorStop(1, '#0c0c0e')
    ctx.fillStyle = bgGrad
    ctx.fillRect(40, 40, W - 80, artH)

    // Generative vector rings / geometric visual
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(W / 2, 40 + artH / 2, 130, 50, -0.3, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.beginPath()
    ctx.ellipse(W / 2, 40 + artH / 2, 90, 80, 0.4, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.beginPath()
    ctx.arc(W / 2, 40 + artH / 2, 8, 0, Math.PI * 2)
    ctx.fill()

    // HUD Sci-Fi Text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText('POST // SNAPSHOT', 56, 68)
    ctx.fillText(`CATEGORY : ${post.category.toUpperCase()}`, 56, 40 + artH - 20)
    ctx.restore()

    // Metadata Tag & Category
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px "JetBrains Mono", monospace'
    ctx.fillText(post.category, 44, 345)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText(`·  ${post.date}  ·  ${post.readTime} MIN READ`, 110, 345)

    // Article Title (Multi-line wrap)
    ctx.fillStyle = '#edf0f2'
    ctx.font = 'bold 28px "IBM Plex Sans", -apple-system, sans-serif'
    const titleLines = wrapText(ctx, post.title, W - 88)
    let textY = 390
    titleLines.forEach((line) => {
      ctx.fillText(line, 44, textY)
      textY += 38
    })

    // Article Excerpt
    ctx.fillStyle = '#9da3ab'
    ctx.font = '15px "IBM Plex Sans", -apple-system, sans-serif'
    const excerptLines = wrapText(ctx, post.excerpt, W - 88).slice(0, 3)
    textY += 12
    excerptLines.forEach((line) => {
      ctx.fillText(line, 44, textY)
      textY += 24
    })

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(44, H - 140)
    ctx.lineTo(W - 44, H - 140)
    ctx.stroke()

    // Footer Author Info & Site Brand
    ctx.fillStyle = '#edf0f2'
    ctx.font = 'bold 16px "IBM Plex Sans", sans-serif'
    ctx.fillText(site.author, 44, H - 98)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText(site.titleEn.toUpperCase(), 44, H - 76)
    ctx.fillText('blog.uvsd.cn', 44, H - 56)

    // Simple Stylized QR Code Visual Matrix (Self-contained, offline-capable)
    drawMockQR(ctx, W - 124, H - 120, 80)
  }, [isOpen, post])

  const downloadPoster = () => {
    if (!canvasRef.current) return
    setDownloading(true)
    const link = document.createElement('a')
    link.download = `${post.slug}-snapshot.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    setTimeout(() => setDownloading(false), 800)
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback */
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="poster-modal" role="dialog" aria-modal="true" aria-label="生成文章海报">
          <motion.div
            className="poster-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="poster-modal__dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          >
            <div className="poster-modal__header">
              <h3 className="poster-modal__title">文章分享卡片</h3>
              <button
                type="button"
                className="poster-modal__close"
                onClick={onClose}
                aria-label="关闭"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="poster-modal__preview">
              <canvas
                ref={canvasRef}
                style={{ width: '100%', maxWidth: '360px', height: 'auto', borderRadius: '12px' }}
              />
            </div>

            <div className="poster-modal__actions">
              <button
                type="button"
                className="btn btn--primary poster-modal__btn"
                onClick={downloadPoster}
              >
                <DownloadSimple size={16} weight="bold" />
                <span>{downloading ? '导出中...' : '下载高清海报'}</span>
              </button>

              <button
                type="button"
                className="btn btn--ghost poster-modal__btn"
                onClick={copyUrl}
              >
                {copied ? <Check size={16} weight="bold" /> : <ShareNetwork size={16} />}
                <span>{copied ? '链接已复制' : '复制文章链接'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split('')
  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function drawMockQR(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x, y, size, size, 8)
  ctx.fill()

  // Inner dark border
  ctx.fillStyle = '#0a0a0c'
  const pad = 6
  const s = size - pad * 2
  const cols = 9
  const cell = s / cols

  // QR corner finder patterns
  drawFinder(ctx, x + pad, y + pad, cell * 3)
  drawFinder(ctx, x + pad + cell * 6, y + pad, cell * 3)
  drawFinder(ctx, x + pad, y + pad + cell * 6, cell * 3)

  // Pseudo-random data modules
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if (
        (r < 3 && c < 3) ||
        (r < 3 && c >= 6) ||
        (r >= 6 && c < 3) ||
        (r === 4 && c === 4)
      ) {
        continue
      }
      if ((r * 7 + c * 13) % 3 === 0) {
        ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell, cell)
      }
    }
  }
}

function drawFinder(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number) {
  ctx.fillRect(x, y, sz, sz)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + sz * 0.2, y + sz * 0.2, sz * 0.6, sz * 0.6)
  ctx.fillStyle = '#0a0a0c'
  ctx.fillRect(x + sz * 0.35, y + sz * 0.35, sz * 0.3, sz * 0.3)
}
