import { useEffect, useState } from 'react'
import { targetLabels, useLastRoute } from './NavigationContext'
import './RouteNote.css'

/**
 * Prototype-only readout of where the last CTA would navigate. It stands in
 * for the pages the references point at (insight drawer, document page,
 * result page, reports page) until those exist.
 */
export function RouteNote() {
  const lastRoute = useLastRoute()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!lastRoute) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 2200)
    return () => window.clearTimeout(timer)
  }, [lastRoute])

  if (!lastRoute || !visible) return null

  return (
    <div className="route-note" role="status">
      <span className="route-note__arrow">CTA →</span>
      {targetLabels[lastRoute.target]}
      {lastRoute.detail ? <em>{lastRoute.detail}</em> : null}
    </div>
  )
}
