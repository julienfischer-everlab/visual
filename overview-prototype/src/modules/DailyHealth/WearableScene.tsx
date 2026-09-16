import { smoothPath } from '../../lib/geometry'
import type { DailyHealthContent } from '../../data/types'
import './WearableScene.css'

type Metric = DailyHealthContent['metrics'][number]

function MiniChart({ metric }: { metric: Metric }) {
  const width = 68
  const height = 22

  if (metric.chart === 'bars') {
    const gap = 2
    const barWidth = (width - gap * (metric.samples.length - 1)) / metric.samples.length
    return (
      <svg className="wearable-chart" viewBox={`0 0 ${width} ${height}`} fill="none">
        {metric.samples.map((sample, index) => (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={height - Math.max(sample * height, 2)}
            width={barWidth}
            height={Math.max(sample * height, 2)}
            rx={barWidth / 2}
            fill="rgba(255, 255, 255, 0.82)"
          />
        ))}
      </svg>
    )
  }

  const points = metric.samples.map((sample, index) => ({
    x: (index / Math.max(metric.samples.length - 1, 1)) * width,
    y: height - sample * (height - 3) - 1.5,
  }))

  return (
    <svg className="wearable-chart" viewBox={`0 0 ${width} ${height}`} fill="none">
      <path
        d={smoothPath(points)}
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * The photographic band with the wearable readouts sitting on top of it.
 * The landscape is drawn rather than loaded so the prototype stays
 * self-contained.
 */
export function WearableScene({ metrics }: { metrics: Metric[] }) {
  const [primary, secondary, tertiary] = metrics

  return (
    <div className="wearable-scene">
      <div className="wearable-scene__sky" />
      <div className="wearable-scene__sun" />
      <div className="wearable-scene__dune wearable-scene__dune--far" />
      <div className="wearable-scene__dune wearable-scene__dune--near" />

      <div className="wearable-scene__widgets">
        {primary ? (
          <div className="wearable-tile">
            <span className="wearable-tile__label">{primary.label}</span>
            <span className="wearable-tile__value">
              {primary.value}
              {primary.unit ? <em>{primary.unit}</em> : null}
            </span>
            <MiniChart metric={primary} />
          </div>
        ) : null}

        <div className="wearable-scene__stack">
          {secondary ? (
            <div className="wearable-tile wearable-tile--compact">
              <span className="wearable-tile__label">{secondary.label}</span>
              <span className="wearable-tile__value">{secondary.value}</span>
              <MiniChart metric={secondary} />
            </div>
          ) : null}
          {tertiary ? (
            <div className="wearable-tile wearable-tile--pill">
              <span className="wearable-tile__value">
                {tertiary.value}
                {tertiary.unit ? <em>{tertiary.unit}</em> : null}
              </span>
              <span className="wearable-tile__label">{tertiary.label}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
