import './Illustrations.css'

/** Stacked sheets with a coral header — the "new document published" artwork. */
export function DocumentIllustration() {
  return (
    <div className="illo illo--document" aria-hidden="true">
      <div className="illo-sheet illo-sheet--back" />
      <div className="illo-sheet illo-sheet--front">
        <div className="illo-sheet__banner" />
        <div className="illo-sheet__lines">
          <span />
          <span />
          <span />
          <span className="is-short" />
        </div>
        <svg className="illo-sheet__spark" viewBox="0 0 34 14" fill="none">
          <path
            d="M1 11.5l6-5.5 4.5 3.5L18 2l5 4.5 5-4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

/** Gold tile with a play affordance — the "new video published" artwork. */
export function VideoIllustration() {
  return (
    <div className="illo illo--video" aria-hidden="true">
      <div className="illo-sheet illo-sheet--back" />
      <div className="illo-video">
        <span className="illo-video__play">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M6 4.2l6 3.8-6 3.8z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  )
}

/** Fanned lab reports — the "historical results arrived" artwork. */
export function ReportsIllustration() {
  return (
    <div className="illo illo--reports" aria-hidden="true">
      <div className="illo-report illo-report--third" />
      <div className="illo-report illo-report--second" />
      <div className="illo-report illo-report--first">
        <div className="illo-report__head">
          <span className="illo-report__brand" />
          <span className="illo-report__meta" />
        </div>
        <div className="illo-report__rows">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} style={{ width: `${88 - (index % 4) * 14}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
