import { smoothPath, type Point } from '../../lib/geometry'
import { useElementSize } from '../../lib/useElementSize'
import type { TrendMedia } from '../../data/types'
import './TrendChart.css'

const bandColor: Record<string, string> = {
  optimal: 'var(--positive)',
  watch: 'var(--warning)',
  'out-of-range': 'var(--negative)',
}

const bandStop: Record<string, string> = {
  optimal: '#4bb07a',
  watch: '#e5b53c',
  'out-of-range': '#e2504b',
}

const PAD = { top: 18, bottom: 6, left: 4, right: 10 }

/**
 * The biomarker trend used by the "improving / declining biomarkers" Next
 * Action: a banded curve, two reference lines and the latest-value callout.
 */
export function TrendChart({ media }: { media: TrendMedia }) {
  const { ref, width, height } = useElementSize<HTMLDivElement>()
  const { points, axisLabels, calloutLabel } = media

  const values = points.map((point) => point.value)
  const min = Math.min(...values, ...axisLabels)
  const max = Math.max(...values, ...axisLabels)
  const span = max - min || 1
  const headroom = span * 0.2

  const plotWidth = Math.max(width - PAD.left - PAD.right, 1)
  const plotHeight = Math.max(height - PAD.top - PAD.bottom, 1)

  const scaleX = (index: number) =>
    PAD.left + (index / Math.max(points.length - 1, 1)) * plotWidth

  const scaleY = (value: number) => {
    const ratio = (value - (min - headroom)) / (span + headroom * 2)
    return PAD.top + plotHeight * (1 - ratio)
  }

  const plotted: Point[] = points.map((point, index) => ({
    x: scaleX(index),
    y: scaleY(point.value),
  }))

  const ready = width > 0 && height > 0
  const last = plotted[plotted.length - 1]

  return (
    <div className="trend-chart">
      <div className="trend-chart__plot" ref={ref}>
        {ready ? (
          <>
            <svg
              className="trend-chart__svg"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                  {points.map((point, index) => (
                    <stop
                      key={`stop-${index}`}
                      offset={`${(index / Math.max(points.length - 1, 1)) * 100}%`}
                      stopColor={bandStop[point.band]}
                    />
                  ))}
                </linearGradient>
              </defs>

              {axisLabels.map((value) => (
                <line
                  key={`row-${value}`}
                  x1={0}
                  x2={width}
                  y1={scaleY(value)}
                  y2={scaleY(value)}
                  className="trend-chart__grid"
                />
              ))}

              {points.map((point, index) =>
                point.label ? (
                  <line
                    key={`col-${index}`}
                    x1={scaleX(index)}
                    x2={scaleX(index)}
                    y1={0}
                    y2={height}
                    className="trend-chart__grid"
                  />
                ) : null,
              )}

              <path
                d={smoothPath(plotted)}
                stroke="url(#trend-stroke)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {plotted.map((point, index) => (
                <circle
                  key={`dot-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  style={{ fill: bandColor[points[index].band] }}
                />
              ))}
            </svg>

            {axisLabels.map((value) => (
              <span
                key={`y-${value}`}
                className="trend-chart__y-label"
                style={{ top: scaleY(value) }}
              >
                {value}
              </span>
            ))}

            <span
              className="trend-chart__callout"
              style={{ left: last.x, top: Math.max(last.y - 30, 0) }}
            >
              {calloutLabel}
            </span>

            {points.map((point, index) =>
              point.label ? (
                <span
                  key={`x-${index}`}
                  className="trend-chart__x-label"
                  style={{ left: scaleX(index) }}
                >
                  {point.label}
                </span>
              ) : null,
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
