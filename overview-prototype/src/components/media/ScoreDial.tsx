import { arcPath } from '../../lib/geometry'

/**
 * The half-dial behind the Health Insights score. Rendered on the orange
 * card, so it draws in white at two opacities.
 */
export function ScoreDial({
  progress,
  size = 200,
  thickness = 12,
}: {
  /** 0–1. */
  progress: number
  size?: number
  thickness?: number
}) {
  const width = size
  const height = size * 0.58
  const cx = width / 2
  const cy = height - thickness / 2 - 2
  const radius = cx - thickness / 2 - 2

  const start = -90
  const end = 90
  const valueEnd = start + (end - start) * Math.min(Math.max(progress, 0), 1)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d={arcPath(cx, cy, radius, start, end)}
        stroke="rgba(0, 0, 0, 0.28)"
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      {/* A zero-length arc would still paint its round cap as a dot. */}
      {progress > 0 ? (
        <path
          d={arcPath(cx, cy, radius, start, valueEnd)}
          stroke="rgba(255, 255, 255, 0.92)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}
