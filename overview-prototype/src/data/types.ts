/** Content types for the Overview modules. */

/* ------------------------------------------------------------- plan ------ */

export interface PersonalisedPlanContent {
  eyebrow: string
  /** Rendered bold, e.g. "Sarah's". */
  ownerLine: string
  /** Rendered in the dimmer weight under the owner line. */
  titleLine: string
  /** Mobile shows the long programme name, desktop the short one. */
  titleLineCompact: string
  description: string
  inclusions: string[]
  /** Count folded into the "+ n more" row. */
  moreCount: number
  ctaLabel: string
}

/* ---------------------------------------------------- health metrics ----- */

export interface BiomarkersMetric {
  label: string
  /** 0–100 score shown in the dial. */
  score: number
  caption: string
  /** Copy for the locked / no-data state. */
  emptyCaption: string
}

export interface BiologicalAgeMetric {
  label: string
  age: number
  caption: string
  emptyCaption: string
  /** Fraction of the ring that is filled, 0–1. */
  progress: number
}

/* ------------------------------------------------------------ tasks ------ */

export interface OnboardingTask {
  id: string
  title: string
  description: string
  ctaLabel: string
}

/* ----------------------------------------------------- next actions ------ */

export type NextActionType =
  | 'biomarker'
  | 'document'
  | 'video'
  | 'latest-result'
  | 'historical-result'

/** Drives the eyebrow dot colour only — the container stays identical. */
export type NextActionStatus = 'pending' | 'monitor' | 'new'

export type NextActionTarget =
  | 'insight-drawer'
  | 'doc-page'
  | 'doc-video-page'
  | 'result-page'
  | 'reports-page'

export interface TrendPoint {
  label: string
  value: number
  /** Colour band the point sits in. */
  band: 'optimal' | 'watch' | 'out-of-range'
}

/** Payload for the biomarker variant's chart. */
export interface TrendMedia {
  kind: 'trend'
  points: TrendPoint[]
  axisLabels: number[]
  calloutLabel: string
}

/** Payload for the latest-result variant's embedded panel card. */
export interface PanelMedia {
  kind: 'panel'
  eyebrow: string
  title: string
  /** Completion ring, 0–1. */
  progress: number
}

/** Variants whose artwork is purely illustrative take no payload. */
export interface IllustrationMedia {
  kind: 'document' | 'video' | 'reports'
  /** Only used by the reports illustration. */
  count?: number
}

export type NextActionMediaContent = TrendMedia | PanelMedia | IllustrationMedia

export interface NextAction {
  id: string
  type: NextActionType
  status: NextActionStatus
  eyebrow: string
  title: string
  media: NextActionMediaContent
  ctaLabel: string
  ctaTarget: NextActionTarget
  dismissible: boolean
  /** The cream / filled-CTA treatment used by "latest results arrived". */
  emphasis?: boolean
}

/* ------------------------------------------------------ daily health ----- */

export interface DailyHealthContent {
  title: string
  description: string
  ctaLabel: string
  metrics: {
    id: string
    label: string
    value: string
    unit?: string
    /** Normalised 0–1 samples for the mini chart. */
    samples: number[]
    chart: 'line' | 'bars'
  }[]
}

/* ------------------------------------------------------- action plan ----- */

export type ActionPlanFormat = 'in-person' | 'online'

export type ActionPlanMedia =
  | 'consult'
  | 'pathology'
  | 'dexa'
  | 'mri'
  | 'physical'
  | 'nutrition'

export interface ActionPlanItem {
  id: string
  title: string
  description: string
  tag: string
  format: ActionPlanFormat
  /** Clinic name shown on mobile for in-person items. */
  venue?: string
  ctaLabel: 'Book' | 'View'
  /** Filled CTA — the next thing to do. */
  ctaEmphasis?: boolean
  media: ActionPlanMedia
  /** Renders the padlock badge on the thumbnail. */
  locked?: boolean
}

/* -------------------------------------------------------- navigation ----- */

export type NavIcon =
  | 'overview'
  | 'biomarkers'
  | 'plan'
  | 'services'
  | 'more'
  | 'dot'

export interface NavItem {
  id: string
  label: string
  icon: NavIcon
  active?: boolean
}
