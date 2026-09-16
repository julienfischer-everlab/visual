import { ProgressRing } from '../../components/media/ProgressRing'
import { biologicalAgeMetric } from '../../data/overviewContent'
import { usePrototype } from '../../prototype/PrototypeContext'
import { MetricCard } from './MetricCard'

/** Biological Age — the thin ring and the age readout. */
export function BiologicalAgeCard() {
  const { biomarkers } = usePrototype()
  const { label, age, caption, emptyCaption, progress } = biologicalAgeMetric

  return (
    <MetricCard
      label={label}
      tone="bio"
      hasData={biomarkers}
      caption={biomarkers ? caption : emptyCaption}
    >
      <div className="metric-card__ring">
        <ProgressRing
          progress={biomarkers ? progress : 0}
          size={168}
          thickness={2}
          showHandle={biomarkers}
        />
      </div>
      {biomarkers ? <span className="metric-card__value">{age}</span> : null}
    </MetricCard>
  )
}
