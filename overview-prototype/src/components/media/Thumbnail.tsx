import type { ActionPlanMedia } from '../../data/types'
import { Icon } from '../Icon'
import './Thumbnail.css'

/**
 * Stand-in for the service photography in the references. Each key gets its
 * own gradient + light SVG detail so the six Action Plan rows stay visually
 * distinct without shipping remote images.
 */
export function Thumbnail({
  media,
  radius = 10,
  locked = false,
  className = '',
}: {
  media: ActionPlanMedia
  radius?: number
  locked?: boolean
  className?: string
}) {
  return (
    <div
      className={`thumb thumb--${media} ${className}`.trim()}
      style={{ borderRadius: radius }}
      aria-hidden="true"
    >
      <div className="thumb__scene">{detail[media]}</div>
      {locked ? (
        <span className="thumb__lock">
          <Icon name="lock" size={12} strokeWidth={1.6} />
        </span>
      ) : null}
    </div>
  )
}

const detail: Record<ActionPlanMedia, React.ReactNode> = {
  consult: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <circle cx="38" cy="42" r="14" fill="rgba(255,255,255,0.22)" />
      <path d="M14 100c0-18 11-30 24-30s24 12 24 30z" fill="rgba(255,255,255,0.16)" />
      <rect x="66" y="26" width="26" height="48" rx="4" fill="rgba(255,255,255,0.12)" />
    </svg>
  ),
  pathology: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <circle cx="70" cy="30" r="26" fill="rgba(255,255,255,0.14)" />
      <circle cx="26" cy="72" r="34" fill="rgba(0,0,0,0.14)" />
    </svg>
  ),
  dexa: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <path d="M-4 66C18 44 36 80 60 56s28-30 48-18v72H-4z" fill="rgba(255,255,255,0.16)" />
      <circle cx="30" cy="28" r="18" fill="rgba(255,255,255,0.12)" />
    </svg>
  ),
  mri: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <g stroke="rgba(226,226,226,0.7)" strokeWidth="2.2" fill="none">
        <path d="M63 22c-13-6-29-2-34 10-9 3-13 13-9 21-4 7-1 17 8 20 3 8 14 12 22 8 10 4 21-2 23-12 8-5 10-16 4-23 1-11-6-21-14-24z" />
        <path d="M46 30c-4 6-2 12 2 15-5 4-5 12 0 16-3 6 0 13 6 15" />
        <path d="M60 34c4 5 3 11-1 14 5 4 6 12 1 16" />
      </g>
    </svg>
  ),
  physical: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <path d="M0 78c16-6 26-26 40-30s30 6 44-4v56H0z" fill="rgba(255,255,255,0.18)" />
      <circle cx="64" cy="26" r="16" fill="rgba(255,255,255,0.14)" />
    </svg>
  ),
  nutrition: (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <circle cx="34" cy="60" r="22" fill="rgba(255,255,255,0.14)" />
      <circle cx="68" cy="38" r="16" fill="rgba(255,255,255,0.1)" />
      <circle cx="72" cy="74" r="12" fill="rgba(0,0,0,0.18)" />
    </svg>
  ),
}
