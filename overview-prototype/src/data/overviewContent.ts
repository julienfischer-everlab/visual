/**
 * Mock content for the Overview prototype, transcribed from the supplied
 * references. Modules read from here so copy can change without touching
 * layout code.
 */

import type {
  ActionPlanItem,
  BiologicalAgeMetric,
  BiomarkersMetric,
  DailyHealthContent,
  NavItem,
  NextAction,
  OnboardingTask,
  PersonalisedPlanContent,
} from './types'

export const member = {
  firstName: 'Julien',
}

export const personalisedPlan: PersonalisedPlanContent = {
  eyebrow: 'Next step',
  ownerLine: "Sarah's",
  titleLine: 'Everlab Plan',
  titleLineCompact: 'Personalised Health Program',
  description:
    'Here are the services your Everlab doctor has recommended, brought together into a customised plan to support your health goals.',
  inclusions: [
    'Hormone Balance Panel',
    'Weight Management Program (GLP-1)',
    'Thyroid & Energy Check',
  ],
  moreCount: 6,
  ctaLabel: 'Review my plan',
}

export const biomarkersMetric: BiomarkersMetric = {
  label: 'Health Insights',
  score: 75,
  caption: 'Biomarkers',
  emptyCaption: 'You have no data yet',
}

export const biologicalAgeMetric: BiologicalAgeMetric = {
  label: 'Biological Age',
  age: 42,
  caption: '8 years younger',
  emptyCaption: 'You have no data yet',
  progress: 0.62,
}

export const onboardingTasks: OnboardingTask[] = [
  {
    id: 'task-onboarding',
    title: 'Book your onboarding',
    description: 'Small description',
    ctaLabel: 'Book',
  },
  {
    id: 'task-consult-1',
    title: 'Book your onboarding consult',
    description: 'Small description',
    ctaLabel: 'Book',
  },
  {
    id: 'task-consult-2',
    title: 'Book your onboarding consult',
    description: 'Small description',
    ctaLabel: 'Book',
  },
]

export const tasksTotalCount = 12

export const nextActions: NextAction[] = [
  {
    id: 'action-latest-result',
    type: 'latest-result',
    status: 'pending',
    eyebrow: 'Pending action',
    title: 'Your latest results just arrived, take a look.',
    media: {
      kind: 'panel',
      eyebrow: 'Protocol Lite',
      title: 'Advanced Blood Panel',
      progress: 0.72,
    },
    ctaLabel: 'See results',
    ctaTarget: 'result-page',
    dismissible: true,
    emphasis: true,
  },
  {
    id: 'action-document',
    type: 'document',
    status: 'new',
    eyebrow: 'New document',
    title: 'A new document has been published.',
    media: { kind: 'document' },
    ctaLabel: 'See results',
    ctaTarget: 'doc-page',
    dismissible: true,
  },
  {
    id: 'action-biomarker',
    type: 'biomarker',
    status: 'monitor',
    eyebrow: 'To monitor',
    title: "Your ApoB is above the optimal range. Let's take action.",
    media: {
      kind: 'trend',
      axisLabels: [130, 90],
      calloutLabel: '146 mg/dL',
      points: [
        { label: '2023', value: 84, band: 'optimal' },
        { label: '', value: 92, band: 'optimal' },
        { label: '2023', value: 90, band: 'optimal' },
        { label: '', value: 104, band: 'watch' },
        { label: '2024', value: 122, band: 'watch' },
        { label: '', value: 133, band: 'out-of-range' },
        { label: '2026', value: 146, band: 'out-of-range' },
      ],
    },
    ctaLabel: 'See insight',
    ctaTarget: 'insight-drawer',
    dismissible: true,
  },
  {
    id: 'action-historical',
    type: 'historical-result',
    status: 'new',
    eyebrow: 'New document',
    title: '24 historical results have arrived in your account, all in one place.',
    media: { kind: 'reports', count: 24 },
    ctaLabel: 'See results',
    ctaTarget: 'reports-page',
    dismissible: true,
  },
  {
    id: 'action-video',
    type: 'video',
    status: 'new',
    eyebrow: 'New document',
    title: 'A new video has been published.',
    media: { kind: 'video' },
    ctaLabel: 'See results',
    ctaTarget: 'doc-video-page',
    dismissible: true,
  },
]

export const nextActionsTotalCount = 12

export const dailyHealth: DailyHealthContent = {
  title: 'See your daily health in context',
  description:
    'Connect Apple Watch, Garmin or Oura so your sleep, heart rate and activity sit alongside your results.',
  ctaLabel: 'Connect a device',
  metrics: [
    {
      id: 'heart-rate',
      label: 'Heart rate',
      value: '72',
      unit: 'bpm',
      chart: 'bars',
      samples: [0.35, 0.6, 0.45, 0.8, 0.5, 0.7, 0.4, 0.62, 0.3, 0.55],
    },
    {
      id: 'steps',
      label: 'Steps',
      value: '8,789',
      chart: 'line',
      samples: [0.2, 0.35, 0.3, 0.5, 0.45, 0.68, 0.6, 0.82, 0.74, 0.9],
    },
    {
      id: 'hrv',
      label: 'HRV',
      value: '82',
      unit: 'ms',
      chart: 'line',
      samples: [0.4, 0.5, 0.42, 0.62, 0.55, 0.7, 0.6],
    },
  ],
}

export const actionPlan: ActionPlanItem[] = [
  {
    id: 'plan-onboarding-consult',
    title: 'Onboarding Consult',
    description:
      'Speak with an Everlab doctor about trends from your existing data, and gaps in your screening.',
    tag: 'Protocol',
    format: 'online',
    ctaLabel: 'Book',
    ctaEmphasis: true,
    media: 'consult',
  },
  {
    id: 'plan-pathology',
    title: 'Pathology Test',
    description:
      'Visit an Everlab or partner clinic to complete your pathology tests.',
    tag: 'Protocol',
    format: 'in-person',
    venue: 'Quantum Therapy Sydney',
    ctaLabel: 'Book',
    ctaEmphasis: true,
    media: 'pathology',
  },
  {
    id: 'plan-dexa',
    title: 'Dexa Scan',
    description:
      'Visit an Everlab or partner clinic to get your full body composition scan.',
    tag: 'Protocol',
    format: 'in-person',
    venue: 'Quantum Therapy Sydney',
    ctaLabel: 'View',
    media: 'dexa',
  },
  {
    id: 'plan-mri',
    title: 'MRI Scan',
    description:
      'Title of the event lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dol...',
    tag: 'Protocol',
    format: 'in-person',
    venue: 'Quantum Therapy Sydney',
    ctaLabel: 'Book',
    ctaEmphasis: true,
    media: 'mri',
  },
  {
    id: 'plan-physical',
    title: 'Physical Assessment',
    description:
      'A 90 minute longevity focused physical assessment to guide your exercise plan.',
    tag: 'Protocol',
    format: 'in-person',
    venue: 'Quantum Therapy Sydney',
    ctaLabel: 'View',
    media: 'physical',
  },
  {
    id: 'plan-nutrition',
    title: 'Nutrition Review',
    description:
      'Transform your health data into actionable insights with an Accredited Practising Dietitian.',
    tag: 'Protocol',
    format: 'online',
    ctaLabel: 'View',
    media: 'nutrition',
    locked: true,
  },
]

export const actionPlanFooterCta = 'See full timeline'

export const bottomNavItems: NavItem[] = [
  { id: 'nav-overview', label: 'Overview', icon: 'overview', active: true },
  { id: 'nav-biomarkers', label: 'Biomarkers', icon: 'biomarkers' },
  { id: 'nav-plan', label: 'Plan', icon: 'plan' },
  { id: 'nav-services', label: 'Services', icon: 'services' },
  { id: 'nav-more', label: 'More', icon: 'more' },
]

/** Desktop sidebar, matching the reference's named items plus its placeholders. */
export const sidebarPrimaryNav: NavItem[] = [
  { id: 'side-overview', label: 'Overview', icon: 'dot', active: true },
  { id: 'side-biomarkers', label: 'Biomarkers', icon: 'dot' },
  { id: 'side-plan', label: 'Plan', icon: 'dot' },
  { id: 'side-menu-1', label: 'Menu', icon: 'dot' },
  { id: 'side-menu-2', label: 'Menu', icon: 'dot' },
  { id: 'side-menu-3', label: 'Menu', icon: 'dot' },
]

export const sidebarSecondaryNav: NavItem[] = [
  { id: 'side-menu-4', label: 'Menu', icon: 'dot' },
  { id: 'side-menu-5', label: 'Menu', icon: 'dot' },
]

export const sidebarTertiaryNav: NavItem[] = [
  { id: 'side-menu-6', label: 'Menu', icon: 'dot' },
  { id: 'side-menu-7', label: 'Menu', icon: 'dot' },
  { id: 'side-menu-8', label: 'Menu', icon: 'dot' },
]
