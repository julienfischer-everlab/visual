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
  way it does in the concept. Dot counts run at a constant density measured in
  *rendered* area (`cl.area * cl.s^2 * DOT_DENSITY`) — every cloud is scaled to
  fit its frame, so silhouette area alone would give shapes with a bigger
  bounding box more dots per visible pixel. Every visual carries the same dots
  per unit of form.
- Milestone visuals are standalone objects, built exactly like an organ: one
  silhouette through `buildCloud`, one `makeOrganView`, its own flow preset.
  Nothing about them is special-cased.
  The Library and the Overview card are instances of it.
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
