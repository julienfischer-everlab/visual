import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { SectionHeader } from '../../components/SectionHeader'
import { nextActions, nextActionsTotalCount } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import { NextActionCard } from './NextActionCard'
import './NextActions.css'

/**
 * Horizontal carousel of notification cards. Cards come from data, so a new
 * notification type only needs a variant in `NextActionCard`, never a change
 * here.
 */
export function NextActions() {
  const navigate = useNavigate()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const actions = nextActions.filter((action) => !dismissed.includes(action.id))

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const width = track.clientWidth || 1
    setPageCount(Math.max(Math.ceil(track.scrollWidth / width), 1))
    setPage(Math.round(track.scrollLeft / width))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure, actions.length])

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.86, behavior: 'smooth' })
  }

  if (actions.length === 0) return null

  return (
    <div className="next-actions">
      <SectionHeader
        title="Your next actions"
        actionLabel="See all"
        count={nextActionsTotalCount}
        onAction={() => navigate('tasks-page')}
        trailing={
          <div className="next-actions__arrows">
            <button
              type="button"
              className="next-actions__arrow"
              aria-label="Previous"
              onClick={() => scrollByPage(-1)}
            >
              <Icon name="chevron-left" size={16} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              className="next-actions__arrow"
              aria-label="Next"
              onClick={() => scrollByPage(1)}
            >
              <Icon name="chevron-right" size={16} strokeWidth={1.6} />
            </button>
          </div>
        }
      />

      <div className="next-actions__track hide-scrollbar" ref={trackRef} onScroll={measure}>
        {actions.map((action) => (
          <div className="next-actions__slide" key={action.id}>
            <NextActionCard
              action={action}
              onDismiss={(id) => setDismissed((prev) => [...prev, id])}
            />
          </div>
        ))}
      </div>

      <div className="next-actions__dots" aria-hidden="true">
        {Array.from({ length: pageCount }).map((_, index) => (
          <span
            key={index}
            className="next-actions__dot"
            data-active={index === page ? 'true' : 'false'}
          />
        ))}
      </div>
    </div>
  )
}
