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
3. **Desktop** — the Everlab dashboard with the organ-age card in situ
4. **Mobile (Hero carousel)** — iPhone frame, swipeable hero cards
5. **Card flip** — frosted rotating card carousel (backdrop-blur, per-card Y rotation)
6. **Mobile (Hero static)** — bento layout with the mini organ carousel, metrics carousel (ApoB / heart rate / steps / sleep), side-by-side Overview frame, and the organ-age bottom sheets
7. **Grid** — full-screen 3×3 anatomical plate, all organs alive with per-organ flow

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
