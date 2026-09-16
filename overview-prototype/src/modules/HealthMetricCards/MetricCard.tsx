import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import './MetricCard.css'

/**
 * Shared shell for the two health metric cards. The locked state swaps the
 * card's content only — label, size, radius and position are identical, so
 * turning Biomarkers off introduces no layout shift.
 */
export function MetricCard({
  label,
  tone,
  hasData,
  children,
  caption,
}: {
  label: string
  tone: 'insight' | 'bio'
  hasData: boolean
  /** The dial / ring artwork plus the value. */
  children: ReactNode
  caption: string
}) {
  return (
    <article
      className={`metric-card metric-card--${tone}`}
      data-state={hasData ? 'ready' : 'locked'}
    >
      <div className="metric-card__header">
        <span className="metric-card__label">{label}</span>
        {hasData ? null : (
          <span className="metric-card__lock" aria-label="No data yet">
            <Icon name="lock" size={14} strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="metric-card__body">{children}</div>

      <p className="metric-card__caption">{caption}</p>
    </article>
  )
}
