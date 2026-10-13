# ProgressTimeline

A reusable, responsive step timeline: a dark card with dots, connectors and
labels that sizes itself to its parent, scrolls when the steps don't fit and
asks the host to open a full view when the user wants everything. It has no
dependencies and no framework.

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
    onShowAll: detail => openFullTimeline(detail),   // the edge buttons; the host owns the full view
  });
  tl.update({ current: 'slot' });   // new props; same current keeps the user's scroll position
  tl.destroy();
</script>
```

| Option | Default | |
|---|---|---|
| `steps` | `[]` | `{ id, label }` in order |
| `current` | `null` | id of the step in progress. `null` (or an unknown id) means not started |
| `complete` | `false` | every step done: all completed, end-aligned |
| `minSegment` | `128` | minimum centre-to-centre distance between dots, in px |
| `edge` | `128` | the safe area kept at each side for fades and buttons |
| `label` | `'Progress'` | accessible name prefix |
| `onShowAll` | `null` | `({ direction: 'start' \| 'end', currentIndex, current, complete, steps, mode }) => void` |

The root also dispatches a bubbling `progress-timeline:show-all` event with the
same `detail`, for hosts that prefer events. Methods: `update(props)`,
`setCurrent(id)`, `scrollToCurrent(smooth)`, `getState()`, `destroy()`. The
layout functions are exported as `ProgressTimeline.computeLayout`,
`.targetOffset` and `.edgeState`.

## Sizing

The card is `width: 100%` of its parent and `min-width: 0`, so it follows
whatever box it's placed in: a grid cell, a flex child or a modal. A
`ResizeObserver` measures its real width `W` and lays it out again whenever
that changes. No viewport media queries are involved.

With `E` the edge (128) and `m` the minimum segment, the space where dots rest
is `A = W − 2E`.

1. **Compact or regular.** The regular layout needs both edge areas plus two
   readable steps, each a column at least `m` wide. Below
   `W = 2E + 2m` (512px by default; 448 with `m = 96`) it can't hold them, so it
   switches to the compact layout. The breakpoint comes from those numbers, not
   from a device width.
2. **All steps fit** when `(N − 1) · m ≤ A`. They're spread evenly across `A`:
   segment `A / (N − 1)`, first dot at `x = E`, last dot at `x = W − E`. Nothing
   scrolls.
3. **Otherwise** the segment is exactly `m`, never less, so the most steps are
   readable. The track is `2E + (N − 1) · m` wide and scrolls by
   `max = track − W`.

Each step owns a column as wide as its segment (capped at 256px when there is
room to spare), centred on its dot. Its label is the column minus 8px on each
side. That works out to 112px at the default 128, and 14px type wraps to at most
three lines inside it. One step is centred.

## Positioning

A dot sits at `x = E + i · seg − offset`, where `offset` is the scroller's
`scrollLeft`, from `0` to `max`. `hl` is half a label's width.

- **Beginning** (not started, or the first step current): `offset = 0`. The
  first dot is on the left safe line, 128px in.
- **End** (the last step current, or complete): `offset = max`. The last dot is
  on the right safe line. That end has no fade, so its label is allowed into
  the safe area. The same goes for the first label at the beginning.
- **In between**, two bounds keep the current and next labels clear of the
  fades:
  - `hi = c·seg − hl`. Scroll any further and the current label slides under
    the left fade.
  - `lo = (c+1)·seg + hl − A`. Scroll any less and the next label slides under
    the right fade.

  From those bounds:
  - If there's room for three columns (`hi − seg ≥ lo`), it rests at
    `hi − seg`. The previous step stays fully clear as context, and all the
    remaining width goes to upcoming steps.
  - Otherwise it rests at `hi`. The current step sits at the left of the clear
    zone and the rest of the room goes to upcoming steps.
  - If the next step is the last one, it shows the end instead (`max`). The
    right fade would otherwise cover it.
  - Clamped to `0…max` so no empty track ever shows. When the end is less than
    a label's width away (and the current step stays clear there), it snaps to
    the end rather than fading out a sliver.
  - A final nudge of a few px keeps a dot from sitting under an edge button's
    centre, which would otherwise hide the button. It is never allowed to break
    the current/next rule.
- **Compact:** two columns of `(W − 88) / 2` between 44px edges. Current and
  next fill them. At the end it shows previous and current; when complete, the
  last two.

**Browsing.** Swiping, trackpad scrolling, mouse dragging and the keyboard all
move the track without touching progress. A drag's own release click is
swallowed so it doesn't activate anything underneath.
- **Re-renders:** `update()` with the same current keeps the user's position.
- **Resizing:** the position is kept in segment units and clamped to the new
  range.
- **A new current step** clears that and scrolls the current and next steps
  into view (instantly with reduced motion).

## Overflow

- **Fades.** A 128px gradient (44px in compact) into the card's colour shows
  only on a side the track runs past: the start once `offset > 0`, the end
  while `offset < max`. Both update on every scroll frame.
- **Buttons.** A 28px circular chevron sits centred in each edge area on the
  line, at `x = 64` and `x = W − 64` (22 in compact).
  - It shows only when its side overflows and an actual connector is beneath
    its centre. A dot, the 4px gaps around a dot, or bare track past the last
    dot don't count.
  - It fades and scales in and out over 180ms.
  - Hidden buttons get `visibility: hidden`, `pointer-events: none`,
    `tabindex="-1"` and `aria-hidden`, so they can't be clicked or focused. If
    a focused button hides, focus moves to the track.
  - Clicking calls `onShowAll` with which side was used. The component has no
    modal: the host decides what "show all" opens.
- **Clipping.** Everything is clipped to the card's 24px corners
  (`overflow: hidden` on the root): the track, the fades and the buttons.

## States and styling

- **Dots.** Every dot is 14px.
  - Completed: solid, with a check cut out.
  - Current: solid, with a soft repeating ripple. With
    `prefers-reduced-motion` the ripple becomes a still 4px ring.
  - Upcoming: dim.
- **Connectors.** 2px, stopping 4px short of each dot. They're solid up to
  the current step and faint after it.
- **Labels.** 14px. The current label is white at weight 500; the others are
  regular and muted.

## Accessibility

- **List.** The steps are an `<ol>`, and the current step has
  `aria-current="step"`. Each item reads "Step 3 of 10: Pick a clinic, in
  progress" (or "completed" / "not started") through visually hidden text.
- **Track.** When it scrolls, the track is a focusable, named group:
  - Arrow keys move one segment.
  - Page Up and Page Down move one clear zone.
  - Home and End jump to the ends.
  - A focus ring shows inside the card's corners.
- **Buttons.** They're real `<button>`s labelled "Show all 10 steps, including
  later ones" (or "earlier ones").
- **Announcements.** A polite live region announces progress changes.

## Validation

```
NODE_PATH=$(npm root -g) node test/validate.js
```

The suite mounts the component in `test/fixture.html`, measures the rendered
geometry and asserts the rules above.

**Matrix.** It covers:
- Widths 240–1600, including either side of the breakpoint (511, 512).
- 1–25 steps.
- Not started, first, second, middle, second-to-last, last and complete.
- Short and long labels, including an unbroken word.
- Minimum segments of 96, 128 and 160.

**Interactions.** It checks:
- Mouse drag, and the drag click being swallowed.
- Trackpad scrolling.
- Touch swipe on a touch device.
- Keyboard: tab order skipping hidden buttons, arrows, Home and End, and Enter
  on a visible button.
- Re-renders keeping position, and resizes clamping it.
- Progress changes bringing the current and next steps into view.
- Reduced motion.
- A parent resized live across the breakpoint.
