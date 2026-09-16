import { BiologicalAgeCard } from './BiologicalAgeCard'
import { BiomarkersCard } from './BiomarkersCard'
import './HealthMetricCards.css'

/**
 * The two-up health metric row. Both cards keep their size and position in
 * every state, so this module can be reordered without affecting the rest of
 * the page.
 */
export function HealthMetricCards() {
  return (
    <div className="health-metrics">
      <BiomarkersCard />
      <BiologicalAgeCard />
    </div>
  )
}
