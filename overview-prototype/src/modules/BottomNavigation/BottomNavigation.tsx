import { Icon } from '../../components/Icon'
import { bottomNavItems } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import './BottomNavigation.css'

/** Mobile tab bar. Hidden at the desktop breakpoint, where the sidebar takes over. */
export function BottomNavigation() {
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {bottomNavItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bottom-nav__item"
          data-active={item.active ? 'true' : 'false'}
          onClick={() => navigate('nav', item.label)}
        >
          <Icon name={item.icon} size={20} strokeWidth={1.4} />
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
