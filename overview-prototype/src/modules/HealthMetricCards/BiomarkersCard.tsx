import { ScoreDial } from '../../components/media/ScoreDial'
import { biomarkersMetric } from '../../data/overviewContent'
import { usePrototype } from '../../prototype/PrototypeContext'
import { MetricCard } from './MetricCard'

/** Health Insights — the biomarker score dial. */
export function BiomarkersCard() {
  const { biomarkers } = usePrototype()
  const { label, score, caption, emptyCaption } = biomarkersMetric

  return (
    <MetricCard
      label={label}
      tone="insight"
      hasData={biomarkers}
      caption={biomarkers ? caption : emptyCaption}
    >
      <div className="metric-card__art">
        <div className="metric-card__dial">
          <ScoreDial progress={biomarkers ? score / 100 : 0} />
        </div>
        {biomarkers ? <span className="metric-card__value">{score}</span> : null}
      </div>
    </MetricCard>
  )
}
