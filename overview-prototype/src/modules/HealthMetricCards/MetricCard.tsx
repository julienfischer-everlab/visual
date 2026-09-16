import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import './MetricCard.css'

/**
 * Shared shell for the health metric cards. The locked state swaps the card's
 * content only — label, size, radius and position are identical, so turning
 * Biomarkers off introduces no layout shift.
 */
export function MetricCard({
  label,
  tone,
  hasData,
  children,
  caption,
  headerEnd,
}: {
  label: string
  /** `organ` follows the page surface; `insight` carries its own ground. */
  tone: 'insight' | 'organ'
  hasData: boolean
  /** The dial / particle artwork plus the value. */
  children: ReactNode
  caption: ReactNode
  /** Controls opposite the label, e.g. the organ carousel dots. Replaced by
      the padlock while the card is locked. */
  headerEnd?: ReactNode
}) {
  return (
    <article
      className={`metric-card metric-card--${tone}`}
      data-state={hasData ? 'ready' : 'locked'}
    >
      <div className="metric-card__header">
        <span className="metric-card__label">{label}</span>
        {hasData ? (
          headerEnd
        ) : (
          <span className="metric-card__lock" aria-label="No data yet">
            <Icon name="lock" size={14} strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="metric-card__body">{children}</div>

      <div className="metric-card__foot">
        <p className="metric-card__caption">{caption}</p>
      </div>
    </article>
  )
}
