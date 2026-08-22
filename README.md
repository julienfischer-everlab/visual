# Particle Organs — Organ Age concept

A living particle-anatomy prototype for Everlab: a single WebGL particle system (~9,000 points) morphs between nine organ silhouettes, explored through seven switchable experience modes with three themes. Everything ships as **one self-contained HTML file** — no build step, no dependencies, no external requests.

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
| `social-video/organ-age-teaser.mp4` | 1350×1920 · 12s seamless-loop teaser (30fps H.264, X-ready) |

## Experience modes (version dropdown, top bar)

1. **Card Nav** — full-bleed organ with a bottom card carousel
2. **Pill Nav** — hero organ, rolling per-digit age odometer, instrument gauge, pill chips
3. **Desktop (biomarker)** — the Everlab dashboard with the organ-age card in situ
4. **Mobile (Hero carousel)** — iPhone frame, swipeable hero cards
5. **Card flip** — frosted rotating card carousel (backdrop-blur, per-card Y rotation)
6. **Mobile (biomarkers)** — bento layout with the mini organ carousel, metrics carousel (ApoB / heart rate / steps / sleep), the signal insight sheet, and the full-screen organ-age modal
7. **Mobile (overview)** — the Overview frame on its own screen
8. **Grid** — full-screen 3×3 anatomical plate, all organs alive with per-organ flow
9. **Library** — an internal component workbench behind a left nav: **Organ Library** (every organ isolated on its own tile, the master component each surface mounts, with the health systems it serves) and **Milestones** (Baseline, Treatment, Ongoing, Nutrition, Activity, Medication and Supplements, each a standalone object). Every tile reports the dot count that visual is actually made of.
10. **Immersive experience (modal)** — organ age as a lab instrument: pill channels, an asymmetric data grid, the particle organ floating in the right half with drawn annotations, and a ~1s morph between organs
11. **Desktop (organ age)** — the organ-age modal as a centred desktop card: header, the organ held dead centre, status badge, name, description and the organ carousel along the bottom

## Tweaks (top bar)

- **Density / Particles size** sliders
- **Flow** — per-organ internal streams (vascular, airflow, peristalsis, neural impulses on the neuron)
- **Voxels** — square data-cell render mode
- **Theme cycle** — burgundy dark → warm light (`#F4EFED`) → pure black

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
  bottom sheet inside the phone frames, a centred card on its own desktop page.
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
