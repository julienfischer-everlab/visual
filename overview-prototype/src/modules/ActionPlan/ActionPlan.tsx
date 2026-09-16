import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { SectionHeader } from '../../components/SectionHeader'
import { actionPlan, actionPlanFooterCta } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import { ActionPlanCard } from './ActionPlanCard'
import './ActionPlan.css'

/** The recommended services: a list on mobile, a grid on desktop. */
export function ActionPlan() {
  const navigate = useNavigate()

  return (
    <div className="action-plan">
      <SectionHeader title="Your action plan" />

      <ul className="action-plan__list">
        {actionPlan.map((item) => (
          <li key={item.id} className="action-plan__item">
            <ActionPlanCard item={item} />
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        size="md"
        block
        className="action-plan__timeline"
        onClick={() => navigate('timeline-page')}
      >
        {actionPlanFooterCta}
        <Icon name="arrow-up-right" size={16} strokeWidth={1.5} />
      </Button>
    </div>
  )
}
