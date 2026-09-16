import { arcPath, polarPoint } from '../../lib/geometry'

/**
 * Thin ring used by the Biological Age card and, in a warm gradient, by the
 * Next Actions result panel.
 */
export function ProgressRing({
  progress,
  size = 168,
  thickness = 2,
  trackColor = 'rgba(255, 255, 255, 0.14)',
  valueColor = 'rgba(255, 255, 255, 0.85)',
  showHandle = true,
  gradient,
}: {
  progress: number
  size?: number
  thickness?: number
  trackColor?: string
  valueColor?: string
  showHandle?: boolean
  /** Two stops, used instead of `valueColor` when provided. */
  gradient?: [string, string]
}) {
  const cx = size / 2
  const cy = size / 2
  const radius = cx - thickness / 2 - 1
  const start = -200
  const sweep = 320
  const clamped = Math.min(Math.max(progress, 0), 1)
  const valueEnd = start + sweep * clamped
  const handle = polarPoint(cx, cy, radius, valueEnd)
  const gradientId = `ring-${Math.round(clamped * 1000)}-${size}`

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {gradient ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
      ) : null}
      {/* Stroke goes through `style` so callers can pass a CSS variable. */}
      <path
        d={arcPath(cx, cy, radius, start, start + sweep)}
        style={{ stroke: trackColor }}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      {clamped > 0 ? (
        <path
          d={arcPath(cx, cy, radius, start, valueEnd)}
          style={{ stroke: gradient ? `url(#${gradientId})` : valueColor }}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
      ) : null}
      {showHandle && clamped > 0 ? (
        <circle
          cx={handle.x}
          cy={handle.y}
          r={thickness * 1.4}
          style={{ fill: gradient ? gradient[1] : valueColor }}
        />
      ) : null}
    </svg>
  )
}
