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
| Biomarkers | ON / OFF | ON shows the biomarker score and biological age. OFF keeps both cards at exactly the same size and position and shows the locked "You have no data yet" state — no layout shift. |
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
│   │                              BiologicalAgeCard, MetricCard (shared shell)
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
  { id: 'tasks-to-complete', ... },
  { id: 'next-actions', ... },
  { id: 'daily-health', ... },
  { id: 'action-plan', ... },
]
```

- **Move Next Actions above Tasks** → move that line up.
- **Hide Daily Health** → add `visible: false` to its entry.

`Overview.tsx` wraps each entry in a slot that owns the section rhythm and the
desktop grid placement, so no module knows about its neighbours and removing
one cannot break spacing. On desktop, `personalised-plan`, `health-metrics` and
`tasks-to-complete` opt into the two-column top region via
`[data-module="…"]` rules in `pages/Overview.css`; everything else is full
width.

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

### Notes

- Service photography is stood in for with gradient + SVG artwork
  (`components/media/Thumbnail.tsx`), so the prototype is fully self-contained
  and has no remote image dependencies. Swap these for real imagery later.
- The everlab logo is the repository's `Logo mark+type.svg`, drawn as a mask so
  it inherits the current text colour in both themes.
- Inter is loaded from Google Fonts as a stand-in for Suisse Int'l, which the
  font stack prefers when available.
