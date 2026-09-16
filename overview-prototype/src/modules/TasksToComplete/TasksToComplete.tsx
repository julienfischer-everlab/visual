import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { SectionHeader } from '../../components/SectionHeader'
import { onboardingTasks, tasksTotalCount } from '../../data/overviewContent'
import { useNavigate } from '../../prototype/NavigationContext'
import './TasksToComplete.css'

/** Onboarding tasks with their Book CTAs. */
export function TasksToComplete() {
  const navigate = useNavigate()

  return (
    <div className="tasks">
      <SectionHeader
        title="Tasks to complete"
        actionLabel="See all"
        count={tasksTotalCount}
        onAction={() => navigate('tasks-page')}
      />

      <ul className="tasks__list">
        {onboardingTasks.map((task) => (
          <li key={task.id} className="tasks__item">
            <span className="tasks__icon">
              <Icon name="calendar" size={20} strokeWidth={1.4} />
            </span>
            <span className="tasks__copy">
              <span className="tasks__title">{task.title}</span>
              <span className="tasks__description">{task.description}</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="tasks__cta"
              onClick={() => navigate('booking-flow', task.title)}
            >
              {task.ctaLabel}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
