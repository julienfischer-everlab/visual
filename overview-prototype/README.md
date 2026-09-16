# Everlab Overview — responsive prototype

A faithful rebuild of the supplied Overview design (mobile + desktop, light +
dark), built as independent modules so the page composition, module order and
product states can be changed without rebuilding the page.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
```

## Prototype controls

A floating **Prototype tweaks** panel (bottom right) sits outside the product
UI and exposes:

| Control | Values | Effect |
| --- | --- | --- |
| Viewport | Mobile / Desktop | Mobile renders the app inside a fixed 402 × 853 iPhone frame; Desktop drops the frame and fills `100vw / 100vh`. |
| Biomarkers | ON / OFF | ON shows the biomarker score and the organ age reading. OFF keeps both cards at exactly the same size and position and shows the locked "You have no data yet" state — no layout shift. |
| New user | Yes / No | Flips `isNewUser` in prototype state (and `data-new-user` on the app root). The UI is intentionally unchanged until the new-user Overview is defined. |
| Theme | Light / Dark | Both themes from the references. |

CTAs are wired to a `navigate(target)` stand-in for routing: clicking one shows
a small note naming the destination the references call for (insight drawer,
document page, document/video page, result page, reports page, booking flow…).

## Architecture

```
src/
├── App.tsx                        prototype stage: frame vs. full viewport
├── layout/AppShell.tsx            product chrome + the responsive container
├── pages/Overview.tsx             renders the module list, owns placement only
├── modules/
│   ├── overviewModules.ts         ← the Overview composition (order + visibility)
│   ├── Header/
│   ├── PersonalisedPlan/
│   ├── HealthMetricCards/         HealthMetricCards, BiomarkersCard,
│   │                              OrganAgeCard, MetricCard (shared shell)
│   ├── TasksToComplete/
│   ├── NextActions/               NextActions, NextActionCard, NextActionMedia
│   ├── DailyHealth/               DailyHealth, WearableScene
│   ├── ActionPlan/                ActionPlan, ActionPlanCard
│   ├── BottomNavigation/          mobile tab bar
│   └── Sidebar/                   desktop navigation rail
├── components/                    Button, Tag, Icon, SectionHeader, Logo,
│                                  DismissButton, media/ (dials, chart, artwork)
├── data/                          overviewContent.ts + types.ts (all copy)
├── prototype/                     PrototypeContext, PrototypeControls,
│                                  DeviceFrame, NavigationContext, RouteNote
└── styles/                        tokens.css (design tokens), base.css
```

### Changing the composition

`src/modules/overviewModules.ts` is the single source of truth for what renders
and in what order:

```ts
export const overviewModules: OverviewModuleDefinition[] = [
  { id: 'header', label: 'Header', Component: Header },
  { id: 'personalised-plan', ... },
  { id: 'health-metrics', ... },
  { id: 'next-actions', ... },
  { id: 'daily-health', ... },
  { id: 'action-plan', ... },
  { id: 'tasks-to-complete', ... },   // moved to the foot of the page
]
```

- **Move Next Actions above Tasks** → move that line up.
- **Hide Daily Health** → add `visible: false` to its entry.

`Overview.tsx` wraps each entry in a slot that owns the section rhythm and the
desktop grid placement, so no module knows about its neighbours and removing
one cannot break spacing. The bento — the plan card and the metric pair under
it — closes to the 8px card-to-card gap, while the sections below keep the
page's section rhythm; both come off the same slot rule, so a module carries
its spacing when it moves. On desktop, `personalised-plan` and
`health-metrics` opt into the two-column bento via `[data-module="…"]` rules in
`pages/Overview.css` and match heights; everything else is full width.

### Responsiveness

The breakpoint is a **container query**, not a media query.
`layout/AppShell.css` declares `container: overview / inline-size` on the app
wrapper and every module uses:

```css
@container overview (min-width: 1024px) { … }
```

That means the mobile layout renders at its true breakpoint inside the 402px
phone frame (nothing is scaled), and the same components lay out as desktop
when the app fills the window. Resizing the browser across 1024px in Desktop
mode switches the layout exactly as the toggle does. A mid-range rule at 640px
caps the mobile composition's measure instead of stretching it.

### Next Actions card system

One container component with variants, driven by data rather than five
hardcoded cards (`data/types.ts`):

```ts
type NextActionType =
  | 'biomarker'          // CTA → insight drawer
  | 'document'           // CTA → document page
  | 'video'              // CTA → document / video page
  | 'latest-result'      // CTA → result page
  | 'historical-result'  // CTA → reports page
```

Each action carries `{ type, status, eyebrow, title, media, ctaLabel,
ctaTarget, dismissible, emphasis }`. `NextActionCard` renders the shared frame
(eyebrow + status dot, title, media slot, dismiss, CTA); `NextActionMedia`
swaps the artwork for the type — trend chart, embedded result panel, document,
video or report stack. `emphasis` is the cream card + filled CTA used by
"latest results arrived". Adding a sixth notification type means adding a
variant to `NextActionMedia`, not a new card.

### Organ Age card

The second metric card is the Organ Age reading from the Particle Organs /
Organ Age concept (`everlab-visual-lite`), at mini-card size. It is that
file's own figure, not a redraw: `src/data/organClouds.json` holds point
clouds sampled through the reference's `samplePts` over its own `clouds`, so
each point carries the position, radius, opacity (already on the reference's
twenty-step 5% grid), ink index and drift phase its painter reads.
`components/media/OrganParticles.tsx` paints them on a canvas with the
reference's rules — the cloud breathes and the heart beats on its pulse, each
dot drifts on its seeded phase and twinkles, a dot at the front of the volume
is drawn a fifth larger than one behind it, and dots are bucketed by
ink × opacity step and filled as paths.

The card follows the page surface rather than carrying its own ground: white
on the light Overview, near-black on the dark one, painted in the reference's
ink set for that ground (its light inks with the measured 2.4× alpha lift, or
its three dark inks). As in the reference's card the carousel leads with the
body — which is the biological age reading — and then walks the organs; tap
the card or a dot to move through Body, Heart, Brain, Lungs and Kidney. The
ages are the reference's own table: chronological age 40 with its per-organ
deltas.

To ship another organ, re-run the extraction against the reference with that
organ's label added — the clouds for the other five (cells, bone, gut, liver,
nerves) and the iris and fingerprint exist in that file already.

### Notes

- Service photography is stood in for with gradient + SVG artwork
  (`components/media/Thumbnail.tsx`), so the prototype is fully self-contained
  and has no remote image dependencies. Swap these for real imagery later.
- The everlab logo is the repository's `Logo mark+type.svg`, drawn as a mask so
  it inherits the current text colour in both themes.
- Inter is loaded from Google Fonts as a stand-in for Suisse Int'l, which the
  font stack prefers when available.
