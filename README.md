# Particle Organs — Organ Age concept

A living particle-anatomy prototype for Everlab: a single WebGL particle system (~9,000 points) morphs between nine organ silhouettes, explored through fourteen switchable experience modes with three themes. Everything ships as **one self-contained HTML file** — no build step, no dependencies, no external requests.

**Live:** https://particle-organs.vercel.app

## Run

Serve `index.html` from any static server (or just open the file):

```bash
python3 -m http.server 8734
```

## What's inside

| Path | Purpose |
|---|---|
| `index.html` | The entire prototype: engine, all modes, themes, UI |
| `docs/design-spec.md` | Design spec with the full source embedded |
| `docs/working-notes.md` | Conventions, design reasoning, and the traps already hit |
| `social-video/organ-age-teaser.mp4` | 1350×1920 · 12s seamless-loop teaser (30fps H.264, X-ready) |

## Experience modes (version dropdown, top bar)

The dropdown is grouped by what a mode is for: **Concept**, then the two
product surfaces — **Biomarkers page** and **Overview page**, each listing its
desktop versions then its mobile ones — then **Library**.

**Concept** — the full-bleed explorations

1. **Card Nav** — full-bleed organ with a bottom card carousel
2. **Pill Nav** — hero organ, rolling per-digit age odometer, instrument gauge, pill chips
3. **Card flip** — frosted rotating card carousel (backdrop-blur, per-card Y rotation)
4. **Grid** — full-screen 3x3 anatomical plate, all organs alive with per-organ flow
5. **Immersive experience (modal)** — organ age as a lab instrument: an asymmetric data grid, the particle organ in the right half with drawn annotations, and a footer dock of miniature organs that selects the channel

**Biomarkers page** — the dashboard and the bento, desktop then mobile. The
group names the page, so each entry says only platform and version. The newest
of each pair is labelled **V1**: the label is what the design is called now,
while the code keeps the marker class it was built under (`b3`, `v3`) — mode
indices and marker names are internal and renaming them would rewire the
renderer.

6. **Desktop** — the Everlab dashboard with the organ-age card in situ; the card expands into the organ-age modal
7. **Desktop V2** — the same dashboard, re-proportioned: the biomarker card carries the distribution range at its foot, the stat pair is swapped for the steps and health-coverage cards, and a records row, an Other chip and a search field sit under the grid. The hero sizes itself off its content, so nothing spills onto the rows below, and the organ card takes its height from the left column — landscape, not standing up. It wears `m2`'s styles plus a marker class, so there is one dashboard, not two — the class is still `b2` in code, since `v2` already marks the mobile page.

    Its organ card reads as product, not instrument: the list is sentence case in the page's own face with no dividers, led by a **Body** row carrying the whole-body age, and the selected organ is highlighted where it sits rather than hoisted to the top. The card also drops the warm organ ground for the same surface its siblings use — see below.
8. **Desktop V1** — the V2 dashboard turned toward the body. The hero's second figure is health coverage rather than biological age, the coverage tile goes (it would say the same thing twice) and steps takes the whole left column, its week drawn as strokes rather than blocks. The width that frees up goes to the organ card, retitled *How your body is ageing*, where the selected row sits on a filled pill and the age reads as a tag under the number. Wears `m2 b2` plus a `b3` marker.
9. **Mobile** — bento layout with the mini organ carousel, metrics carousel, the signal insight sheet, and the organ-age sheet
10. **Mobile V2** — the same bento re-laid out to the design: biomarkers and biological age as a pair of figures at the top, health coverage beside a week of steps below, then organ age wide and shallow beneath them — its name and tag down the left, the organ standing in the right half. Wears `m5` plus a `v2` marker.
11. **Mobile V1** — the bento folded down to two blocks. The hero is a plain card carrying biomarkers and health coverage as two figures, with the meter beneath doing the work the dial used to. Below it, steps and organ age stand side by side and close the same way: label, value, visual, a rounded status tag, then the dots — same sizes on both, so the two carousels read as one control. Wears `m5 v2` plus a `v3` marker.

**Overview page** — the same two platforms.

12. **Desktop** — the Everlab product shell: sidebar, plan card, the two gauges, tasks, a next-actions rail and the action-plan grid. The organ card opens the organ-age modal over the page
13. **Mobile** — the Overview frame on its own screen

Both desktop sidebars move between **Overview** and **Biomarkers**.

### The organ in situ

The dashboard card's particle size rides on the card's own width, so a narrow
window thinned the organ to near-invisible dots while the gauge and list stayed
put — the card read as empty. The in-situ size now has a floor, so the organ
holds its density from about 1150px of window upward.

Mode 5, the original bento, is no longer offered on its own — every mobile
variant wears its styles, so it stays in `MODES` (renumbering would rewire the
renderer) but sits in a group the dropdown does not list.

### The organ mini card

Label, title, status: three lines, then the visual, then the dots. The status
is a line of type in its own colour rather than a chip — the same on the phone
and on the dashboard.

The measure is the card's, not the slide's: **Biological age** is pinned and
only the name, the organ and its tag travel with the swipe. The carousel leads
with the body's own age — *Body, 6 years younger* — and then walks the organs,
so its index runs one ahead of `PILL`: slide 0 is the body, slide *i+1* is
`PILL[i]`. There is no whole-body silhouette, so slide 0 carries no organ.

### The two mini cards

Both swipe, by pointer or touch, and are steerable from their dots. **Health
coverage** runs the 64% dial, screenings that have fallen due (cancer
screening, skin check), the questionnaire prompt and the report upload;
**Steps** runs the week of steps, heart rate, sleep score and time asleep.

They share one skeleton — label, value, a fixed-height `.hiViz` visual on the
baseline, dots on the card's bottom edge — so the pair lines up whatever slide
each is showing. The markup is identical wherever a card appears, so the
desktop and mobile copies behave the same; the desktop hero adds two quiet
arrows in the card's top-right corner and shrinks the dots to a marker.

**Library** — the component workbench

14. **Library** — behind a left nav: **Organ Library** (every organ isolated on its own tile, the master component each surface mounts) and **Milestones** (Baseline, Treatment, Ongoing, Nutrition, Activity, Medication, Supplements). Every tile reports its dot count and downloads as PNG, JPG or SVG.

## Tweaks (top bar)

- **Your age** — chronological age, 30 to 40. Everything quoted against it follows:
  the arc scale is redrawn around the new centre, and the organ list, spatial and
  grid cards, the immersive panel and every organ-age modal re-render.
- **Mode** — Colour (the burgundy the concept is designed in), Dark, or Light.
- **Organ card** — whether the organ stands on the page's own card surface or
  takes a colour of its own, `#280707`. The tint is the organ's ground rather
  than the page's surface, so it is the same in every theme, and the organ
  keeps its dark ink on it — the light theme's near-black would vanish into it.
  It applies to every biomarker page, desktop and mobile.

Density, particle size, flow and voxels are no longer exposed: they stay where
the design landed.

## The organ ground

`#220606` is the one background the organ ever sits on. It is `--bg`, and every
surface that carries an organ resolves to it: the full-bleed concepts, the
in-situ dashboard card, the mobile mini-organ card, the overview's organ cards,
the immersive page and its surround, the library, and the organ-age modal in
both dresses. The WebGL context clears to the same value (`0.133, 0.024, 0.024`)
in every mode, so the canvas never leaves a seam against the surface behind it.

**From V2 on, the organ stands on the card instead.** On desktop V2 and V3 and
on mobile V2 and V3, the organ card takes the same surface as its sibling cards
— `#252522` in the dark themes — so it reads as part of the page rather than a
window onto the concept. The rule that
matters still holds — the canvas clears to whatever the organ is standing on —
so `paintFrame` picks its triple from the surface (dashboard card, phone card,
or the organ ground) rather than from one constant, and there is still no seam.

The mobile device backdrops and the desktop product shell keep their own near
black — the phone frame and the dashboard chrome cover them entirely.

## Engine notes

- Raw WebGL1 point sprites; one shared shader handles morphing (organ-local
  stagger + curved trajectories), edge-biased silhouette sampling, warm/green
  age halos, feeding ambient attraction, voxel mode, and theme re-inking.
- Per-organ static GPU buffers allow many live organs at once (Grid, Card flip).
- Organ silhouettes are drawn as 2D canvas paths and sampled — see
  `drawBrain`, `drawNeuron`, `drawHeart`, … in the source.
- `makeOrganView(host, organIdx, opts)` is the master component for a lone
  organ: it mounts a canvas, draws from the shared `pts2D` cloud, and every
  instance runs off one shared rAF, skipping any whose host is off-screen.
  It reproduces the engine's own motion — the shader's idle drift, the
  heartbeat/breathing pulse, and the ambient matter that spirals in and is
  absorbed — and the organ's own internal flow — so an isolated organ moves the
  way it does in the concept.
- **Dot density is calibrated, not computed.** What the eye reads as density is
  the *gap* between dots. Rendered area (`cl.area * cl.s^2 * DOT_DENSITY`) is
  only a proxy for it, and it fails on a shape made of strokes: a neuron's
  dendrites are barely wider than the gap, so its dots queue along each branch
  instead of spreading over a surface, and the visual reads ~25% thinner than a
  solid organ at the same area density (measured: 3.21px nearest-neighbour vs
  2.38-2.73px for the others). Edge-biased sampling pulls the same way. So
  `dotTarget` measures instead of predicting: `dotGap` returns the exact mean
  nearest-neighbour distance (an x-sorted sweep, linear in practice), and the
  count is iterated until that gap sits on `DOT_GAP`. The *mean*, not the
  median — along a dendrite the dots pair up, so the median looks healthy while
  the runs between pairs are the holes the eye picks out. Spacing goes as
  1/sqrt(N) over a surface and as 1/N along a line, so it iterates to
  convergence rather than assuming one correction lands; a neuron takes four
  passes, a liver one or two. Result: 2.0% spread across all nine organs, from
  12.6% with the nerve far outside it.
  `cloudIdx` uses a fractional stride for the same reason — stepping by
  `ceil()` only ever yields 8650/1, /2, /3 …, so the reachable counts jump in
  coarse increments and no density target can land between them. Index k stays
  the same particle across clouds, which is what lets a morph lerp pairwise.
  `dotTarget` also records `cl._k`, how much a shape needs over what its area
  suggests, so `shapeTarget(cl, base)` carries the same correction into the
  surfaces that ask for a flat count (the mobile sheets and carousels).
- **The organ-age modal** (`makeSheet`) is one component in two dresses: a
  bottom sheet inside the phone frames (capped at 600px wide), and — with
  `overlay: true` — a centred card opened over the desktop overview. Changing
  channel slides the copy 32px in the direction of travel while it crossfades,
  and the organ itself never moves.
  The channels advance on their own every 3s while it is open and wrap from the
  last back to the first; any manual move — arrow, card tap or swipe — restarts
  that clock, so it never pulls a card out from under you. Reduced motion turns
  it off.
  Both mount a single `makeOrganView`, so swiping the carousel does not move the
  organ — the cards travel, the organ stays dead centre and `morphTo` dissolves
  one silhouette into the next (verified: the lit centroid holds at 0.497-0.502
  of canvas width across the whole transition). Badge and status dot share one
  scale: amber older, green younger, neutral on par.
- Milestone visuals are standalone objects, built exactly like an organ: one
  silhouette through `buildCloud`, one `makeOrganView`, its own flow preset.
  Nothing about them is special-cased.
  The Library and the Overview card are instances of it.
- **Asset export.** Every `makeOrganView` instance can render itself as a
  transparent PNG, no smaller than 1920px on either side. `paint(px, W, H, t,
  rk)` is the renderer, independent of any one canvas: `rk` scales the dot
  radius with the surface. `exportCanvas(minSide)` keeps the live tile's
  proportions and scales by the single factor `k = minSide / min(w, h)`, so
  nothing is cropped or padded and the export is dot-for-dot the frame on
  screen — verified by counting `arc()` calls on both surfaces and comparing
  normalised positions. It replays `view._lastT`, the timestamp of the last
  painted frame, so the asset is the frame the viewer was looking at. The
  download control sits in the top-right of each visual and opens a format
  picker; pass `dl: false` to suppress it.
  - **PNG** and **JPG** come off `exportCanvas`. PNG keeps a transparent
    ground; JPG has no alpha, so it gets the tile's own background stack
    (`groundStack` walks the ancestors).
  - **SVG** comes off `exportSVG`, which runs the *same* `paint()` against
    `svgSink()` — a duck-typed stand-in for a 2D context that records
    `<circle>` elements instead of drawing arcs. One code path, so the vector
    file can never drift from the screen. `rgba()` is split into `fill` +
    `fill-opacity` for tools that will not parse it in an attribute.

  In every format the theme decides the ink, so a light-mode asset is a
  different image. Saving goes through the Artifact `downloads` capability when
  the page runs as an artifact, and falls back to an `<a download>` when it
  does not. Note that `svg` is in the capability's *extended* extension set and
  can come back `extension_not_enabled`; the button surfaces that and points at
  PNG/JPG.
- **Dot edges are soft.** A solid `arc()` has a hard rim the moment the dot is
  big enough to see it — which is exactly what an export or a large tile shows.
  `dot2D` lays a faint halo under a slightly smaller core so the edge falls away
  the way the shader's own `smoothstep` does. Sub-pixel dots and SVG output keep
  the single disc: there is nothing to soften at 1px, and a vector edge is crisp
  by nature.
- The mobile bottom sheets and small cards use lightweight 2D-canvas particle
  renderers sampled from the same clouds, so several organs can animate
  independently of the WebGL context.

## Deploy

The current production deploy is Vercel (`vercel --prod` from the repo root —
`index.html` is the site). Any static host works.

## Social video

`organ-age-teaser.mp4` is the final rendered asset (the one-off render
pipeline — a deterministic frame-by-frame composition page + ffmpeg assembly —
was scratch tooling and is not part of this export). The composition reused the
engine's silhouette + sampling code, so it can be rebuilt from `index.html` if
a re-render is ever needed.
