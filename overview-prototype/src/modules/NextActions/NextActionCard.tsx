import { Button } from '../../components/Button'
import { DismissButton } from '../../components/DismissButton'
import type { NextAction } from '../../data/types'
import { useNavigate, type NavigationTarget } from '../../prototype/NavigationContext'
import { NextActionMedia } from './NextActionMedia'
import './NextActionCard.css'

/**
 * One container for every Next Actions notification. The `type` selects the
 * artwork and the CTA destination; the frame, eyebrow, title, dismiss and CTA
 * are shared so all five variants stay visually consistent.
 */
export function NextActionCard({
  action,
  onDismiss,
}: {
  action: NextAction
  onDismiss?: (id: string) => void
}) {
  const navigate = useNavigate()
  const { id, type, status, eyebrow, title, media, ctaLabel, ctaTarget, dismissible, emphasis } =
    action

  return (
    <article
      className="next-action"
      data-type={type}
      data-status={status}
      data-emphasis={emphasis ? 'true' : 'false'}
    >
      <div className="next-action__header">
        <span className="next-action__eyebrow">
          <span className="next-action__dot" />
          {eyebrow}
        </span>
        {dismissible ? (
          <DismissButton label={`Dismiss: ${title}`} onClick={() => onDismiss?.(id)} />
        ) : null}
      </div>

      <h3 className="next-action__title">{title}</h3>

      <div className="next-action__media" data-media={media.kind}>
        <NextActionMedia media={media} />
      </div>

      <Button
        variant={emphasis ? 'primary' : 'secondary'}
        size="md"
        block
        className="next-action__cta"
        onClick={() => navigate(ctaTarget as NavigationTarget)}
      >
        {ctaLabel}
      </Button>
    </article>
  )
}
