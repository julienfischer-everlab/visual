# ProgressTimeline

A reusable, responsive horizontal step timeline: a dark card with dots,
connectors and labels that sizes itself to its parent and scrolls when the
steps don't fit. It keeps the full timeline at every width and places the
current step automatically. It has no dependencies and no framework.

```
progress-timeline.js    the component (classic script or CommonJS)
progress-timeline.css   its styles; theme through the --pt-* custom properties
demo.html               a playground: demo controls live here, not in the component
test/fixture.html       a bare page the validator mounts the component in
test/validate.js        the browser validation suite (Playwright)
```

## Use

```html
<link rel="stylesheet" href="progress-timeline.css">
<script src="progress-timeline.js"></script>
<div id="where"></div>
<script>
  const tl = new ProgressTimeline(document.getElementById('where'), {
    steps: [{ id: 'details', label: 'Confirm your details' }, { id: 'clinic', label: 'Pick a clinic' } /* ... */],
    current: 'clinic',    // the step in progress; null = not started
    complete: false,      // true = every step done
    minSegment: 128,      // px between neighbouring dots, never less (default 128)
    label: 'Deep assessment',
  });
  tl.update({ current: 'slot' });   // new props; the same current keeps the user's scroll position
  tl.destroy();
</script>
```

| Option | Default | |
|---|---|---|
| `steps` | `[]` | `{ id, label }` in order |
| `current` | `null` | id of the step in progress. `null` (or an unknown id) means not started |
| `complete` | `false` | every step done |
| `minSegment` | `128` | minimum centre-to-centre distance between dots, in px |
| `edge` | `128` | the edge safe area at each side, for the fades and arrows |
| `label` | `'Progress'` | accessible name prefix |
| `onArrow` | `null` | optional: `({ direction: 'start' \| 'end', offset, currentIndex }) => void` after an arrow scrolls |

**Events and methods.** The root also dispatches a bubbling
`progress-timeline:arrow` event with the same `detail`. The methods are
`update(props)`, `setCurrent(id)`, `scrollToCurrent(smooth)`, `getState()` and
`destroy()`.

**Pure functions.** The layout is exported as
`ProgressTimeline.computeLayout`, `.targetOffset` and `.edgeState`, so it can be
tested without a browser.

## Sizing

The card is `width: 100%` of its parent and `min-width: 0`, so it follows
whatever box it sits in. A `ResizeObserver` measures its real width `W` and
lays it out again whenever that changes. No viewport media queries are
involved.

Definitions:
- `E` is the edge area (128px, or `W / 2` if the card is narrower than 256px).
- `m` is the minimum segment.
- The usable width is `W − 2E`.

Rules:
- **The full timeline at every width.** There is no two-step layout, and the
  segments never drop below `m`.
- **All steps fit** when `(N − 1) · m ≤ usable`. They stretch across the
  usable width: segment `usable / (N − 1)`, first dot 128px from the left, last
  dot 128px from the right. Nothing scrolls.
- **Otherwise** the segment is exactly `m` and the track scrolls. Partial steps
  overflow at the edges, under the fades.
- **Wide or narrow.** The width is wide when the usable width holds at least
  two minimum increments (`usable ≥ 2m`, so `W ≥ 512` by default). Below that it
  is narrow. The breakpoint comes from those numbers, not from a device width.

Each step owns a column as wide as its segment (capped at 256px), centred on
its dot. Its label is the column minus 8px on each side, at 14px, and wraps to
at most three lines.

## Positioning

A dot sits at `x = pad + i · seg − offset`, where `offset` is the scroller's
`scrollLeft`. Automatic positioning happens only when the current state
changes, and on a resize the user hasn't overridden by browsing.

**Wide** (`pad = 128`):
- **First step** (or not started): its dot 128px from the left edge, with the
  rest of the timeline extending right.
- **Intermediate steps:**
  1. Place the current dot at 40% of the width.
  2. If the next step's label would run under the right fade, slide the track
     on so the next step shows fully.
  3. Never slide so far that the current label goes under the left fade. The
     current step stays readable first.
  4. At 40%, the previous step stays in view on the left as context.
- **Final step** (or complete): its dot 128px from the right edge, with earlier
  steps extending left.
- **Clamping.** The result is always clamped to `0 … max`, the track's real
  limits, so no blank space ever shows.

**Narrow** (`pad = W / 2`):
- The current step centres at 50% in every state, first and last included.
  The first step before starting, the last when complete.
- Half the width of padding before the first dot and after the last is what
  lets the end steps centre.
- Neighbouring steps stay on the same overflowing, scrollable track.

**Browsing.** Swiping, trackpad scrolling, mouse dragging, the arrows and the
keyboard all move the track without touching progress, and nothing snaps back.
- **Re-renders:** `update()` with the same current keeps the position.
- **Resizing:** the position is kept in segment units and clamped to the new
  limits.
- **A new current state** applies automatic positioning again, with a smooth
  scroll (instant with reduced motion).

## Overflow, fades and arrows

- **Fades.**
  - The left fade shows only when earlier content overflows (`offset > 0`).
  - The right fade shows only when later content overflows
    (`offset < max`).
  - Both are 128px gradients into the card's colour, updated on every scroll
    frame.
- **Arrows.**
  - They are 28px circles with small chevrons, centred 64px from their edges
    and on the line.
  - An arrow shows only when its edge overflows and a connector passes
    beneath its centre. A dot, the 4px gaps around it, or bare track past the
    last dot don't count.
  - They appear and disappear with a 180ms fade and a slight scale.
  - Each click smoothly scrolls one actual segment, clamped at the ends.
    Clicks made in quick succession add up.
  - Hidden arrows get `visibility: hidden`, `pointer-events: none`,
    `tabindex="-1"` and `aria-hidden`. If a focused arrow hides, focus moves to
    the track.
- **Clipping.** The track, fades and arrows are all clipped to the card's 24px
  corners.

## States and styling

- **Dots.** Every dot is 14px.
  - Completed: solid, with a check cut out.
  - Current: solid, with a subtle repeating ripple, never larger. With
    `prefers-reduced-motion` the ripple is a static ring.
  - Upcoming: dim.
- **Connectors.** 2px, 4px clear of each dot. They're solid up to the current
  step and faint after it.
- **Labels.** 14px. The current label is white at weight 500; the others are
  regular and muted.
- **No step count.** There is no separate step count under the timeline.

## Accessibility

- **List.** The steps are an `<ol>`, and the current step has
  `aria-current="step"`. Each item reads "Step 3 of 10: Pick a clinic, in
  progress" (or "completed" / "not started") through visually hidden text.
- **Track.** When it scrolls, the track is a focusable, named group:
  - Arrow keys move one segment.
  - Page Up and Page Down move one usable width.
  - Home and End jump to the ends.
  - A focus ring shows inside the card's corners.
- **Arrows.** They're real `<button>`s labelled "Scroll to earlier steps" and
  "Scroll to later steps".
- **Announcements.** A polite live region announces progress changes.
- **Reduced motion.** Scrolling becomes instant and the ripple becomes a
  static ring.

## Validation

```
NODE_PATH=$(npm root -g) node test/validate.js
```

The suite mounts the component in `test/fixture.html`, measures the rendered
geometry and asserts the rules above.

**Matrix.** It covers:
- Widths 240–1600, either side of the 512px wide/narrow line.
- 1–25 steps.
- Not started, first, second, middle, second-to-last, last and complete.
- Short and long labels, including an unbroken word.
- Minimum segments of 96, 128 and 160.

**Interactions.** It checks:
- Mouse drag, and the drag's own click being swallowed.
- Trackpad scrolling.
- Touch swipe.
- Keyboard: tab order skipping hidden arrows, arrows, Home and End, and Enter
  on an arrow.
- Arrow navigation: one segment per click, smooth, quick clicks adding up,
  clamped at the end, instant with reduced motion, and in narrow mode.
- Re-renders keeping position, and resizes clamping it.
- Progress changes repositioning.
- Reduced motion.
- A parent resized live across the line.
