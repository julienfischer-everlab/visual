import { member } from '../../data/overviewContent'
import './Header.css'

export function Header() {
  return (
    <header className="overview-header">
      <h1 className="overview-header__greeting">
        Welcome back, <span className="overview-header__name">{member.firstName}</span>
      </h1>
    </header>
  )
}
