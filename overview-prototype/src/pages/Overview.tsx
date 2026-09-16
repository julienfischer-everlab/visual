import { visibleOverviewModules } from '../modules/overviewModules'
import './Overview.css'

/**
 * The Overview page is only a container: it walks the module list and wraps
 * each entry in a slot that owns the section rhythm and the desktop grid
 * placement. All content and styling lives inside the modules themselves.
 */
export function Overview() {
  const modules = visibleOverviewModules()

  return (
    <div className="overview-page">
      <div className="overview-page__modules">
        {modules.map(({ id, label, Component }) => (
          <section
            key={id}
            className="overview-page__module"
            data-module={id}
            aria-label={label}
          >
            <Component />
          </section>
        ))}
      </div>
    </div>
  )
}
