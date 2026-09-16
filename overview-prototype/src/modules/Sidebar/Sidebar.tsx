import { Icon } from '../../components/Icon'
import { Logo } from '../../components/Logo'
import {
  sidebarPrimaryNav,
  sidebarSecondaryNav,
  sidebarTertiaryNav,
} from '../../data/overviewContent'
import type { NavItem } from '../../data/types'
import { useNavigate } from '../../prototype/NavigationContext'
import './Sidebar.css'

function NavList({ items }: { items: NavItem[] }) {
  const navigate = useNavigate()

  return (
    <ul className="sidebar__list">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="sidebar__item"
            data-active={item.active ? 'true' : 'false'}
            onClick={() => navigate('nav', item.label)}
          >
            <Icon name={item.icon} size={16} strokeWidth={1.3} />
            <span>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Desktop navigation rail. Only rendered at the desktop breakpoint. */
export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Logo width={96} />
        <button type="button" className="sidebar__collapse" aria-label="Collapse sidebar">
          <Icon name="panel" size={18} strokeWidth={1.4} />
        </button>
      </div>

      <NavList items={sidebarPrimaryNav} />

      <div className="sidebar__foot">
        <NavList items={sidebarSecondaryNav} />
        <hr className="sidebar__divider" />
        <NavList items={sidebarTertiaryNav} />
      </div>
    </aside>
  )
}
