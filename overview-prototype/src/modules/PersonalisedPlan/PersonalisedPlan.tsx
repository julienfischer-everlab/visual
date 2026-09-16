import { Button } from '../../components/Button'
import { Thumbnail } from '../../components/media/Thumbnail'
import { personalisedPlan } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import './PersonalisedPlan.css'

const previewMedia = ['dexa', 'consult', 'nutrition'] as const

/**
 * The brown "next step" card: the plan an Everlab doctor has recommended,
 * its inclusions, and the review CTA.
 */
export function PersonalisedPlan() {
  const navigate = useNavigate()
  const {
    eyebrow,
    ownerLine,
    titleLine,
    titleLineCompact,
    description,
    inclusions,
    moreCount,
    ctaLabel,
  } = personalisedPlan

  return (
    <article className="plan-card">
      <div className="plan-card__top">
        <span className="plan-card__eyebrow">{eyebrow}</span>
        <div className="plan-card__previews">
          {previewMedia.map((media) => (
            <Thumbnail key={media} media={media} radius={6} className="plan-card__preview" />
          ))}
        </div>
      </div>

      <h2 className="plan-card__title">
        <span className="plan-card__title-owner">{ownerLine}</span>
        {/* Both names ship; the container query picks one, so a manual
            browser resize behaves the same as the viewport toggle. */}
        <span className="plan-card__title-program plan-card__title-program--compact">
          {titleLineCompact}
        </span>
        <span className="plan-card__title-program plan-card__title-program--wide">
          {titleLine}
        </span>
      </h2>

      <div className="plan-card__bottom">
        <p className="plan-card__description">{description}</p>

        <ul className="plan-card__inclusions">
          {inclusions.map((inclusion) => (
            <li key={inclusion} className="plan-card__inclusion">
              {inclusion}
            </li>
          ))}
          {moreCount > 0 ? (
            <li className="plan-card__inclusion plan-card__inclusion--more">
              + {moreCount} more
            </li>
          ) : null}
        </ul>

        <Button
          variant="onBrand"
          size="lg"
          block
          className="plan-card__cta"
          onClick={() => navigate('plan-page')}
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  )
}
