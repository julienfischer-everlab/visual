import { Icon } from './Icon'
import './DismissButton.css'

/** The small × in the corner of a dismissible card. */
export function DismissButton({
  label = 'Dismiss',
  onClick,
}: {
  label?: string
  onClick?: () => void
}) {
  return (
    <button type="button" className="dismiss-button" aria-label={label} onClick={onClick}>
      <Icon name="close" size={16} strokeWidth={1.4} />
    </button>
  )
}
