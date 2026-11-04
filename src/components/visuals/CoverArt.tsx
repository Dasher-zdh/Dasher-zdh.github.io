import { useMemo } from 'react'
import type { CoverPattern } from '../../data/posts'

interface CoverArtProps {
  hue: number
  hue2: number
  pattern: CoverPattern
  seed?: string
  className?: string
  /** Renders at higher fidelity for the hero / featured slots. */
  detailed?: boolean
}

/** Deterministic PRNG so a given slug always produces the same artwork. */
function makeRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Locally generated cover artwork.
 *
 * Rendering art as SVG rather than fetching images keeps the site fully
 * offline-capable, gives every post a deterministic identity, and keeps the
 * payload small (xuqiu.txt §14 skeleton/failure states need a real fallback).
 */
export function CoverArt({
  hue,
  hue2,
  pattern,
  seed = 'cover',
  className,
  detailed = false,
}: CoverArtProps) {
  const uid = useMemo(
    () => `cv${Math.abs(hash(seed))}-${pattern}`,
    [seed, pattern],
  )

  const shapes = useMemo(() => {
    const rnd = makeRandom(seed)
    const count = detailed ? 22 : 14
    return Array.from({ length: count }, (_, i) => ({
      i,
      x: rnd() * 100,
      y: rnd() * 100,
      r: 0.4 + rnd() * 1.6,
      o: 0.15 + rnd() * 0.55,
      rot: rnd() * 360,
    }))
  }, [seed, detailed])

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#18181c" />
          <stop offset="55%" stopColor="#131316" />
          <stop offset="100%" stopColor="#0c0c0e" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="72%" cy="18%" r="70%">
          <stop offset="0%" stopColor={`hsl(${hue} 80% 55%)`} stopOpacity="0.16" />
          <stop offset="100%" stopColor={`hsl(${hue} 80% 55%)`} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={`hsl(${hue} 85% 65%)`} stopOpacity="0" />
          <stop offset="50%" stopColor={`hsl(${hue} 90% 70%)`} stopOpacity="0.7" />
          <stop offset="100%" stopColor={`hsl(${hue2} 85% 65%)`} stopOpacity="0" />
        </linearGradient>
        <pattern
          id={`${uid}-micro`}
          width="6.25"
          height="6.25"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0.6" cy="0.6" r="0.35" fill={`hsl(${hue} 70% 70%)`} opacity="0.22" />
        </pattern>
      </defs>

      <rect width="100" height="100" fill={`url(#${uid}-bg)`} />
      <rect width="100" height="100" fill={`url(#${uid}-glow)`} />

      {pattern === 'grid' && (
        <g stroke={`hsl(${hue} 60% 70%)`} strokeWidth="0.16" opacity="0.34">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="100" />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 12.5} x2="100" y2={i * 12.5} />
          ))}
        </g>
      )}

      {pattern === 'orbit' && (
        <g fill="none" stroke={`hsl(${hue} 70% 68%)`} strokeWidth="0.3" opacity="0.5">
          <ellipse cx="50" cy="52" rx="38" ry="16" transform="rotate(-18 50 52)" />
          <ellipse cx="50" cy="52" rx="28" ry="30" transform="rotate(24 50 52)" />
          <ellipse cx="50" cy="52" rx="16" ry="42" transform="rotate(-42 50 52)" />
          <circle cx="50" cy="52" r="9" fill={`hsl(${hue} 85% 62%)`} opacity="0.24" stroke="none" />
        </g>
      )}

      {pattern === 'wave' && (
        <g fill="none" stroke={`url(#${uid}-line)`} strokeWidth="0.42" opacity="0.62">
          {[0, 1, 2, 3].map((k) => (
            <path
              key={k}
              d={`M-6 ${26 + k * 16} Q 25 ${10 + k * 16} 50 ${30 + k * 16} T 106 ${26 + k * 16}`}
            />
          ))}
        </g>
      )}

      {pattern === 'circuit' && (
        <g stroke={`hsl(${hue} 70% 66%)`} strokeWidth="0.34" fill="none" opacity="0.55">
          {Array.from({ length: 7 }, (_, i) => {
            const y = 12 + i * 13
            const mid = 20 + ((i * 29) % 60)
            return (
              <path
                key={i}
                d={`M-4 ${y} H ${mid} L ${mid + 10} ${y + (i % 2 ? 13 : -13)} H 104`}
              />
            )
          })}
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={8 + ((i * 37) % 88)} cy={12 + ((i * 53) % 78)} r="1.1" fill={`hsl(${hue2} 85% 68%)`} stroke="none" opacity="0.8" />
          ))}
        </g>
      )}

      {pattern === 'layer' && (
        <g fill="none" stroke={`hsl(${hue} 70% 68%)`} strokeWidth="0.3" opacity="0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={i}
              d={`M-6 ${74 - i * 13} Q 30 ${62 - i * 13} 52 ${72 - i * 13} T 106 ${70 - i * 13}`}
              opacity={0.9 - i * 0.13}
            />
          ))}
        </g>
      )}

      {/* Cyber Security / Shield Pattern */}
      {pattern === 'security' && (
        <g fill="none" stroke={`hsl(${hue} 85% 65%)`} opacity="0.75">
          {/* Shield outline */}
          <path
            d="M50 16 L76 26 C76 56 50 78 50 82 C50 78 24 56 24 26 Z"
            strokeWidth="0.8"
            fill={`hsl(${hue} 90% 50%)`}
            fillOpacity="0.1"
          />
          <path
            d="M50 24 L70 32 C70 54 50 72 50 74 C50 72 30 54 30 32 Z"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
            opacity="0.6"
          />
          {/* Terminal / Lock core */}
          <circle cx="50" cy="46" r="6" strokeWidth="0.6" fill={`hsl(${hue2} 90% 60%)`} fillOpacity="0.25" />
          <path d="M50 52 L50 60" strokeWidth="0.8" />
          <line x1="38" y1="36" x2="62" y2="36" strokeWidth="0.3" opacity="0.5" />
          <line x1="42" y1="64" x2="58" y2="64" strokeWidth="0.3" opacity="0.5" />
        </g>
      )}

      {/* Cloud / Kubernetes Cluster Pattern */}
      {pattern === 'cloud' && (
        <g fill="none" stroke={`hsl(${hue} 80% 68%)`} opacity="0.7">
          {/* Cloud silhouette */}
          <path
            d="M32 64 C22 64 16 56 18 47 C20 38 29 36 34 38 C38 28 50 26 58 32 C64 26 76 28 78 37 C85 39 88 47 84 55 C88 61 82 64 74 64 Z"
            strokeWidth="0.6"
            strokeDasharray="3 1.5"
            fill={`hsl(${hue} 80% 45%)`}
            fillOpacity="0.08"
          />
          {/* Cluster nodes / hexagons */}
          {[
            { cx: 50, cy: 46, r: 9 },
            { cx: 34, cy: 52, r: 6.5 },
            { cx: 66, cy: 52, r: 6.5 },
            { cx: 50, cy: 33, r: 5.5 },
          ].map((n, i) => (
            <g key={i}>
              <polygon
                points={Array.from({ length: 6 }, (_, j) => {
                  const angle = (j * 60 * Math.PI) / 180
                  return `${n.cx + n.r * Math.cos(angle)},${n.cy + n.r * Math.sin(angle)}`
                }).join(' ')}
                strokeWidth="0.45"
                fill={`hsl(${hue2} 80% 60%)`}
                fillOpacity="0.18"
              />
              <circle cx={n.cx} cy={n.cy} r="1.2" fill={`hsl(${hue} 95% 70%)`} stroke="none" />
            </g>
          ))}
          {/* Node links */}
          <line x1="34" y1="52" x2="50" y2="46" strokeWidth="0.35" strokeDasharray="1 1" />
          <line x1="66" y1="52" x2="50" y2="46" strokeWidth="0.35" strokeDasharray="1 1" />
          <line x1="50" y1="33" x2="50" y2="46" strokeWidth="0.35" strokeDasharray="1 1" />
        </g>
      )}

      {/* AI / Neural Network & Chip Pattern */}
      {pattern === 'ai' && (
        <g fill="none" opacity="0.8">
          {/* Central AI Chip */}
          <rect
            x="36"
            y="36"
            width="28"
            height="28"
            rx="4"
            stroke={`hsl(${hue} 90% 65%)`}
            strokeWidth="0.7"
            fill={`hsl(${hue} 90% 45%)`}
            fillOpacity="0.15"
          />
          <rect
            x="42"
            y="42"
            width="16"
            height="16"
            rx="2"
            stroke={`hsl(${hue2} 85% 65%)`}
            strokeWidth="0.4"
          />
          {/* Neural synaptic nodes */}
          {[
            { x: 18, y: 24 },
            { x: 22, y: 76 },
            { x: 80, y: 26 },
            { x: 82, y: 72 },
            { x: 50, y: 16 },
            { x: 50, y: 84 },
          ].map((pt, i) => (
            <g key={i}>
              <line
                x1={pt.x}
                y1={pt.y}
                x2="50"
                y2="50"
                stroke={`hsl(${hue} 75% 60%)`}
                strokeWidth="0.3"
                opacity="0.5"
                strokeDasharray="2 1.5"
              />
              <circle cx={pt.x} cy={pt.y} r="2.2" stroke={`hsl(${hue2} 90% 70%)`} strokeWidth="0.5" fill={`hsl(${hue} 90% 50%)`} fillOpacity="0.4" />
            </g>
          ))}
          {/* Chip pins */}
          {[-6, 0, 6].map((offset, i) => (
            <g key={i} stroke={`hsl(${hue} 85% 65%)`} strokeWidth="0.4" opacity="0.7">
              <line x1={50 + offset} y1="36" x2={50 + offset} y2="30" />
              <line x1={50 + offset} y1="64" x2={50 + offset} y2="70" />
              <line x1="36" y1={50 + offset} x2="30" y2={50 + offset} />
              <line x1="64" y1={50 + offset} x2="70" y2={50 + offset} />
            </g>
          ))}
        </g>
      )}

      {/* Frontend / Code Editor & Interface Pattern */}
      {pattern === 'editor' && (
        <g fill="none" opacity="0.8">
          {/* Editor window frame */}
          <rect
            x="14"
            y="20"
            width="72"
            height="60"
            rx="5"
            stroke={`hsl(${hue} 80% 65%)`}
            strokeWidth="0.7"
            fill={`hsl(${hue} 85% 15%)`}
            fillOpacity="0.25"
          />
          {/* Title bar */}
          <line x1="14" y1="31" x2="86" y2="31" stroke={`hsl(${hue} 70% 60%)`} strokeWidth="0.4" />
          <circle cx="21" cy="25.5" r="1.5" fill="#f87171" opacity="0.85" />
          <circle cx="27" cy="25.5" r="1.5" fill="#fbbf24" opacity="0.85" />
          <circle cx="33" cy="25.5" r="1.5" fill="#34d399" opacity="0.85" />
          {/* Code lines */}
          <line x1="22" y1="39" x2="44" y2="39" stroke={`hsl(${hue2} 90% 75%)`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="47" y1="39" x2="62" y2="39" stroke={`hsl(${hue} 80% 70%)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <line x1="28" y1="46" x2="68" y2="46" stroke={`hsl(${hue} 90% 70%)`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="28" y1="53" x2="52" y2="53" stroke={`hsl(${hue2} 85% 70%)`} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          <line x1="34" y1="60" x2="60" y2="60" stroke={`hsl(${hue} 95% 80%)`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="28" y1="67" x2="42" y2="67" stroke={`hsl(${hue2} 90% 75%)`} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="22" y1="73" x2="32" y2="73" stroke={`hsl(${hue} 70% 65%)`} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* Star dust */}
      <g>
        {shapes.map((s) => (
          <circle
            key={s.i}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.5}
            fill="#fff"
            opacity={s.o * 0.7}
          />
        ))}
      </g>

      <rect width="100" height="100" fill={`url(#${uid}-micro)`} opacity="0.5" />
    </svg>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}
