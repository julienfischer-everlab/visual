import type { ReactNode } from 'react'
import './SectionHeader.css'

interface SectionHeaderProps {
  title: string
  /** "See all" style link. */
  actionLabel?: string
  /** Orange count pill next to the action. */
  count?: number
  onAction?: () => void
  /** Carousel arrows or any other trailing control (desktop). */
  trailing?: ReactNode
}

export function SectionHeader({
  title,
  actionLabel,
  count,
  onAction,
  trailing,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      <div className="section-header__end">
        {actionLabel ? (
          <button type="button" className="section-header__action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {count !== undefined ? <span className="count-badge">{count}</span> : null}
        {trailing}
      </div>
    </div>
  )
}
