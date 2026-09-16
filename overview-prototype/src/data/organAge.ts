/**
 * Organ Age readings and their particle clouds.
 *
 * The point clouds in `organClouds.json` are sampled from the Particle Organs
 * reference's own generators (`samplePts` over its `clouds`), so the figure in
 * the card is that file's picture rather than a redraw of it. Each point
 * carries the position, radius, opacity (already on the reference's twenty-step
 * 5% grid), ink index and drift phase the reference's 2D painter reads.
 */

import raw from './organClouds.json'

export interface OrganPointSet {
  /** x, y, z triples (or x, y pairs for strays). */
  xyz: number[]
  r: number[]
  a: number[]
  /** Ink index: 0 = ink, 1 = mid, 2 = highlight. */
  k: number[]
  /** Per-point drift/twinkle phase. */
  s: number[]
}

export interface OrganCloud {
  label: string
  organIdx: number
  reading: { name: string; delta: number } | null
  /** The heart beats; everything else breathes. */
  beat: boolean
  cloud: OrganPointSet
  strays: OrganPointSet
}

const data = raw as unknown as {
  chrono: number
  inks: { dark: string[]; light: string[]; lightLift2D: number }
  organs: OrganCloud[]
}

/** The demo member's chronological age, as the reference sets it. */
export const chronoAge = data.chrono

/** The reference's three inks per theme, plus the light theme's alpha lift. */
export const organInks = data.inks

export const organClouds: OrganCloud[] = data.organs

export interface OrganReading {
  id: string
  /** Name that travels with the card: "Biological age", "Heart age"… */
  name: string
  /** Short name for the tight mobile caption. */
  shortName: string
  age: number
  delta: number
  status: string
  cloud: OrganCloud
}

/** The reference's own wording for the gap to your chronological age. */
function statusFor(delta: number): string {
  if (delta === 0) return 'Aligned with your age'
  const years = Math.abs(delta)
  return `${years} ${years === 1 ? 'year' : 'years'} ${delta < 0 ? 'younger' : 'older'}`
}

export const organReadings: OrganReading[] = organClouds.map((cloud) => {
  const delta = cloud.reading?.delta ?? 0
  const name = cloud.reading?.name ?? `${cloud.label} age`
  return {
    id: cloud.label.toLowerCase(),
    name,
    // The organ's own name, which is what the caption wants next to the age:
    // the body reading is "Biological age" but it is the body you are looking at.
    shortName: cloud.label,
    age: chronoAge + delta,
    delta,
    status: statusFor(delta),
    cloud,
  }
})

/**
 * The carousel leads with the body — which is the biological age reading — and
 * then walks the organs, as the reference's card does.
 */
export const defaultOrganIndex = 0
