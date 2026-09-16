import { ProgressRing } from '../../components/media/ProgressRing'
import { TrendChart } from '../../components/media/TrendChart'
import {
  DocumentIllustration,
  ReportsIllustration,
  VideoIllustration,
} from '../../components/media/Illustrations'
import type { NextActionMediaContent } from '../../data/types'
import './NextActionMedia.css'

/**
 * The interchangeable middle of a Next Action card. Every variant fills the
 * same slot, which is what keeps one container component across all five
 * notification types.
 */
export function NextActionMedia({ media }: { media: NextActionMediaContent }) {
  switch (media.kind) {
    case 'trend':
      return <TrendChart media={media} />
    case 'panel':
      return (
        <div className="action-panel">
          <div className="action-panel__copy">
            <span className="action-panel__eyebrow">{media.eyebrow}</span>
            <span className="action-panel__title">{media.title}</span>
          </div>
          <div className="action-panel__ring">
            <ProgressRing
              progress={media.progress}
              size={44}
              thickness={3.5}
              trackColor="var(--line-strong)"
              gradient={['#f0a06a', '#d1451c']}
              showHandle={false}
            />
          </div>
        </div>
      )
    case 'document':
      return <DocumentIllustration />
    case 'video':
      return <VideoIllustration />
    case 'reports':
      return <ReportsIllustration />
    default:
      return null
  }
}
