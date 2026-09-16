import { BiomarkersCard } from './BiomarkersCard'
import { OrganAgeCard } from './OrganAgeCard'
import './HealthMetricCards.css'

/**
 * The two-up health metric row: the biomarker score and the organ age. Both
 * cards keep their size and position in every state, so this module can be
 * reordered without affecting the rest of the page.
 */
export function HealthMetricCards() {
  return (
    <div className="health-metrics">
      <BiomarkersCard />
      <OrganAgeCard />
    </div>
  )
}
