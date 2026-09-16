import { Button } from '../../components/Button'
import { dailyHealth } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import { WearableScene } from './WearableScene'
import './DailyHealth.css'

/**
 * Wearable / daily health context card. Reads as one card: the scene with the
 * live metrics, then the connect prompt.
 */
export function DailyHealth() {
  const navigate = useNavigate()
  const { title, description, ctaLabel, metrics } = dailyHealth

  return (
    <article className="daily-health">
      <div className="daily-health__scene">
        <WearableScene metrics={metrics} />
      </div>

      <div className="daily-health__copy">
        <h2 className="daily-health__title">{title}</h2>
        <p className="daily-health__description">{description}</p>
        <Button
          variant="secondary"
          size="md"
          className="daily-health__cta"
          onClick={() => navigate('connect-device')}
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  )
}
