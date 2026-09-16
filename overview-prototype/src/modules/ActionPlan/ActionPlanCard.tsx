import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Tag } from '../../components/Tag'
import { Thumbnail } from '../../components/media/Thumbnail'
import type { ActionPlanItem } from '../../data/types'
import { useNavigate } from '../../prototype/NavigationContext'
import './ActionPlanCard.css'

/**
 * One service in the action plan. The same component is the mobile row and
 * the desktop card — only the container query changes the arrangement.
 */
export function ActionPlanCard({ item }: { item: ActionPlanItem }) {
  const navigate = useNavigate()
  const { title, description, tag, format, venue, ctaLabel, ctaEmphasis, media, locked } = item
  const formatLabel = format === 'online' ? 'Online video call' : 'In person'

  return (
    <article className="plan-item">
      <div className="plan-item__head">
        <div className="plan-item__thumb">
          <Thumbnail media={media} radius={8} locked={locked} />
        </div>

        <div className="plan-item__headings">
          <h3 className="plan-item__title">{title}</h3>
          <p className="plan-item__description">{description}</p>
          <span className="plan-item__tag">
            <Tag label={tag} />
          </span>
        </div>
      </div>

      <div className="plan-item__footer">
        <span className="plan-item__location">
          <Icon name={format === 'online' ? 'video' : 'pin'} size={14} strokeWidth={1.4} />
          <span className="plan-item__location-label plan-item__location-label--compact">
            {venue ? <u>{venue}</u> : formatLabel}
          </span>
          <span className="plan-item__location-label plan-item__location-label--wide">
            {formatLabel}
          </span>
        </span>

        <Button
          variant={ctaEmphasis ? 'primary' : 'secondary'}
          size="sm"
          className="plan-item__cta"
          onClick={() => navigate(ctaLabel === 'Book' ? 'booking-flow' : 'service-detail', title)}
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  )
}
