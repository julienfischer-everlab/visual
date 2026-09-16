/**
 * The Overview composition.
 *
 * This array is the single source of truth for which modules render and in
 * what order. "Move Next Actions above Tasks" is a line move here; "hide
 * Daily Health" is `visible: false`. No module knows about its neighbours.
 */

import type { ComponentType } from 'react'

import { Header } from './Header/Header'
import { PersonalisedPlan } from './PersonalisedPlan/PersonalisedPlan'
import { HealthMetricCards } from './HealthMetricCards/HealthMetricCards'
import { TasksToComplete } from './TasksToComplete/TasksToComplete'
import { NextActions } from './NextActions/NextActions'
import { DailyHealth } from './DailyHealth/DailyHealth'
import { ActionPlan } from './ActionPlan/ActionPlan'

export type OverviewModuleId =
  | 'header'
  | 'personalised-plan'
  | 'health-metrics'
  | 'tasks-to-complete'
  | 'next-actions'
  | 'daily-health'
  | 'action-plan'

export interface OverviewModuleDefinition {
  id: OverviewModuleId
  /** Human label, used by the prototype panel and by these notes. */
  label: string
  Component: ComponentType
  /** Set to false to drop the module from the page. */
  visible?: boolean
}

export const overviewModules: OverviewModuleDefinition[] = [
  { id: 'header', label: 'Header', Component: Header },
  { id: 'personalised-plan', label: 'Personalised Health Program', Component: PersonalisedPlan },
  { id: 'health-metrics', label: 'Health metrics', Component: HealthMetricCards },
  { id: 'next-actions', label: 'Your next actions', Component: NextActions },
  { id: 'daily-health', label: 'Daily health', Component: DailyHealth },
  { id: 'action-plan', label: 'Your action plan', Component: ActionPlan },
  // Onboarding tasks sit at the foot of the page, under the plan.
  { id: 'tasks-to-complete', label: 'Tasks to complete', Component: TasksToComplete },
]

export function visibleOverviewModules(): OverviewModuleDefinition[] {
  return overviewModules.filter((module) => module.visible !== false)
}
