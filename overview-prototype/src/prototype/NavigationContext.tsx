/**
 * Stand-in for routing.
 *
 * Modules call `navigate(target)` on their CTAs exactly as they would in the
 * product; the prototype resolves that to a note about where the CTA leads,
 * so the mapping from the references can be checked without building the
 * destination pages yet.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type NavigationTarget =
  | 'insight-drawer'
  | 'doc-page'
  | 'doc-video-page'
  | 'result-page'
  | 'reports-page'
  | 'plan-page'
  | 'tasks-page'
  | 'booking-flow'
  | 'service-detail'
  | 'connect-device'
  | 'timeline-page'
  | 'biomarkers-page'
  | 'nav'

export const targetLabels: Record<NavigationTarget, string> = {
  'insight-drawer': 'Insight detail — drawer',
  'doc-page': 'Document page',
  'doc-video-page': 'Document / video page',
  'result-page': 'Result page',
  'reports-page': 'Reports page',
  'plan-page': 'Plan page',
  'tasks-page': 'All tasks',
  'booking-flow': 'Booking flow',
  'service-detail': 'Service detail',
  'connect-device': 'Connect a device',
  'timeline-page': 'Full timeline',
  'biomarkers-page': 'Biomarkers page',
  nav: 'Navigation',
}

interface NavigationValue {
  navigate: (target: NavigationTarget, detail?: string) => void
  lastRoute: { target: NavigationTarget; detail?: string; key: number } | null
}

const NavigationContext = createContext<NavigationValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [lastRoute, setLastRoute] = useState<NavigationValue['lastRoute']>(null)

  const navigate = useCallback((target: NavigationTarget, detail?: string) => {
    setLastRoute({ target, detail, key: Date.now() })
  }, [])

  const value = useMemo(() => ({ navigate, lastRoute }), [navigate, lastRoute])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigate() {
  const context = useContext(NavigationContext)
  return context?.navigate ?? (() => {})
}

export function useLastRoute() {
  return useContext(NavigationContext)?.lastRoute ?? null
}
