import logoUrl from '../assets/everlab-logo.svg'
import './Logo.css'

/**
 * The everlab mark + type. Drawn as a mask so the logo picks up the current
 * text colour and works on both the light and dark Overview.
 */
export function Logo({ width = 104 }: { width?: number }) {
  return (
    <span
      className="logo"
      role="img"
      aria-label="everlab"
      style={{
        width,
        height: (width / 124) * 24,
        maskImage: `url(${logoUrl})`,
        WebkitMaskImage: `url(${logoUrl})`,
      }}
    />
  )
}
