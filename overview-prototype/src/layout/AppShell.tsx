import type { ReactNode } from 'react'
import { BottomNavigation } from '../modules/BottomNavigation/BottomNavigation'
import { Sidebar } from '../modules/Sidebar/Sidebar'
import { usePrototype } from '../prototype/PrototypeContext'
import './AppShell.css'

/**
 * Product chrome around the page: the tab bar on mobile, the navigation rail
 * on desktop. The wrapper is the responsive container every module queries,
 * so the layout switches on the width of the app itself — not the browser —
 * and behaves identically in the phone frame and at full width.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isNewUser } = usePrototype()

  return (
    <div className="app-viewport" data-new-user={isNewUser ? 'true' : 'false'}>
      <div className="app-shell">
        <Sidebar />
        <main className="app-shell__main">{children}</main>
        <BottomNavigation />
      </div>
    </div>
  )
}
