import { useState } from 'react'
import { OrganParticles } from '../../components/media/OrganParticles'
import { organReadings, defaultOrganIndex } from '../../data/organAge'
import { usePrototype } from '../../prototype/PrototypeContext'
import { MetricCard } from './MetricCard'
import './OrganAgeCard.css'

/**
 * Organ Age — the particle organ from the Organ Age concept, at mini-card
 * size. As in that reference the carousel leads with the body, which is the
 * biological age reading, and then walks the organs; tapping the card or a dot
 * moves through them.
 */
export function OrganAgeCard() {
  const { biomarkers, theme } = usePrototype()
  const [index, setIndex] = useState(defaultOrganIndex)
  const reading = organReadings[index]

  const advance = () => setIndex((prev) => (prev + 1) % organReadings.length)

  return (
    <MetricCard
      label="Organ Age"
      tone="organ"
      hasData={biomarkers}
      caption={
        biomarkers ? (
          <span className="organ-card__reading">
            <span className="organ-card__age">{reading.age}</span>
            <span className="organ-card__status">
              {reading.shortName} · {reading.status}
            </span>
          </span>
        ) : (
          'You have no data yet'
        )
      }
      headerEnd={
        <span className="organ-card__dots">
          {organReadings.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="organ-card__dot"
              data-active={i === index ? 'true' : 'false'}
              aria-label={item.name}
              onClick={() => setIndex(i)}
            />
          ))}
        </span>
      }
    >
      <OrganParticles
        organ={reading.cloud}
        inkSet={theme}
        fill={0.55}
        dot={2.1}
        alpha={biomarkers ? 1 : 0.45}
        className="organ-card__cloud"
      />
      {biomarkers ? (
        <button
          type="button"
          className="organ-card__advance"
          aria-label={`${reading.name}. Show the next reading`}
          onClick={advance}
        />
      ) : null}
    </MetricCard>
  )
}
