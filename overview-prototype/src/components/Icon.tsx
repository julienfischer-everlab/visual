/** Single icon set for the prototype. Every glyph inherits `currentColor`. */

export type IconName =
  | 'calendar'
  | 'close'
  | 'lock'
  | 'chevron-left'
  | 'chevron-right'
  | 'pin'
  | 'video'
  | 'arrow-up-right'
  | 'play'
  | 'panel'
  | 'overview'
  | 'biomarkers'
  | 'plan'
  | 'services'
  | 'more'
  | 'dot'

interface IconProps {
  name: IconName
  size?: number
  /** Stroke width for the line glyphs. */
  strokeWidth?: number
  className?: string
}

const paths: Record<IconName, (strokeWidth: number) => React.ReactNode> = {
  calendar: (w) => (
    <>
      <rect x="3" y="4.75" width="14" height="12.25" rx="2.5" strokeWidth={w} />
      <path d="M3 8.5h14M7 3v3M13 3v3" strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  close: (w) => (
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" strokeWidth={w} strokeLinecap="round" />
  ),
  lock: (w) => (
    <>
      <rect x="4.25" y="8.75" width="11.5" height="8" rx="2.2" strokeWidth={w} />
      <path d="M7.25 8.75V6.9a2.75 2.75 0 015.5 0v1.85" strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  'chevron-left': (w) => (
    <path
      d="M12 4.5L6.5 10l5.5 5.5"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chevron-right': (w) => (
    <path
      d="M8 4.5L13.5 10 8 15.5"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pin: (w) => (
    <>
      <path
        d="M10 17.5s5.5-5.05 5.5-9.05a5.5 5.5 0 10-11 0c0 4 5.5 9.05 5.5 9.05z"
        strokeWidth={w}
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.25" r="1.9" strokeWidth={w} />
    </>
  ),
  video: (w) => (
    <>
      <rect x="2.5" y="5" width="11" height="10" rx="2.4" strokeWidth={w} />
      <path
        d="M13.5 9.2l3.2-2.1a.6.6 0 01.93.5v4.8a.6.6 0 01-.93.5L13.5 10.8z"
        strokeWidth={w}
        strokeLinejoin="round"
      />
    </>
  ),
  'arrow-up-right': (w) => (
    <path
      d="M6.5 13.5l7-7M7.6 6.5h5.9v5.9"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  play: () => <path d="M7.5 5.5l7 4.5-7 4.5z" fill="currentColor" stroke="none" />,
  panel: (w) => (
    <>
      <rect x="3" y="4" width="14" height="12" rx="2.4" strokeWidth={w} />
      <path d="M12.4 4v12" strokeWidth={w} />
    </>
  ),
  overview: (w) => (
    <>
      <path
        d="M3.5 8.6l6.5-5 6.5 5V16a1.2 1.2 0 01-1.2 1.2H4.7A1.2 1.2 0 013.5 16z"
        strokeWidth={w}
        strokeLinejoin="round"
      />
      <path d="M8 17.2v-4.6h4v4.6" strokeWidth={w} strokeLinejoin="round" />
    </>
  ),
  biomarkers: (w) => (
    <path
      d="M2.5 12.5c1.6 0 2.1-5 3.7-5s2.1 8 3.8 8 2.2-6.5 3.8-6.5 1.9 3.5 3.7 3.5"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  plan: (w) => (
    <path
      d="M4 6h12M4 10h12M4 14h7"
      strokeWidth={w}
      strokeLinecap="round"
    />
  ),
  services: (w) => (
    <>
      <rect x="3.25" y="3.25" width="6" height="6" rx="1.6" strokeWidth={w} />
      <rect x="10.75" y="3.25" width="6" height="6" rx="1.6" strokeWidth={w} />
      <rect x="3.25" y="10.75" width="6" height="6" rx="1.6" strokeWidth={w} />
      <rect x="10.75" y="10.75" width="6" height="6" rx="1.6" strokeWidth={w} />
    </>
  ),
  more: () => (
    <>
      <circle cx="4.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  dot: (w) => <circle cx="10" cy="10" r="5.25" strokeWidth={w} />,
}

export function Icon({ name, size = 20, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name](strokeWidth)}
    </svg>
  )
}
