# Sunset illustrations

Three line drawings in the same style, drawn as SVG with black ink and orange
accents and no background, so they take on whatever surface they sit on.

| File | Scene |
| --- | --- |
| [`beach-umbrella.svg`](beach-umbrella.svg) | Striped beach umbrella and two sun loungers by the sea |
| [`coastal-drive.svg`](coastal-drive.svg) | Off-road car on a cliff road with a guard rail |
| [`picnic-sunset.svg`](picnic-sunset.svg) | Picnic under a tree: basket, oranges, bottle and book on a checked blanket |

All three use a 640 × 360 view box and scale freely. Each SVG has a
transparent PNG beside it at 2× size (1280 × 720).

## Weekend escape

A second set in [`weekend-escape/`](weekend-escape/), drawn as open vignettes
with no frame, after an A-frame cabin reference: leafy tuft trees, ink grass
clumps, rocky ground, and orange glass lit from inside.

| File | Scene |
| --- | --- |
| [`a-frame-cabin`](weekend-escape/a-frame-cabin.svg) | A-frame cabin with a deck and two loungers above a lake |
| [`bell-tent-camp`](weekend-escape/bell-tent-camp.svg) | Bell tent, campfire and string lights by a lake |
| [`camper-van-coast`](weekend-escape/camper-van-coast.svg) | Camper van with a surfboard on a clifftop over the sea |

These use a 960 × 640 view box; the PNGs are 1920 × 1280.

- Ink: `#111111`
- Orange: `#FF5A1F` (sun, sun glints, umbrella stripes, tail lights, oranges)

They work on light backgrounds. The black ink won't show on dark ones.

## Editing

The SVGs are generated. Change [`build.py`](build.py) (first set) or
[`weekend.py`](weekend.py) (weekend escape) and rebuild, then re-export the
PNGs:

```sh
python3 illustrations/build.py
python3 illustrations/weekend.py
node illustrations/export-png.js   # needs Playwright with Chromium
```

The Python scripts need only the standard library. The colours, the frame and the
stroke weights are set at the top of the script. Lines behind a foreground
object (the sea behind the car, the blanket under the basket) are hidden with
clip paths, so the shapes stay simple paths that design tools can open.
