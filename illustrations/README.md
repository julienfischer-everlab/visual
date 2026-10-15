# Sunset illustrations

Three line drawings in the same style, drawn as SVG with black ink and orange
accents and no background, so they take on whatever surface they sit on.

| File | Scene |
| --- | --- |
| [`beach-umbrella.svg`](beach-umbrella.svg) | Striped beach umbrella and two sun loungers by the sea |
| [`coastal-drive.svg`](coastal-drive.svg) | Off-road car on a cliff road with a guard rail |
| [`picnic-sunset.svg`](picnic-sunset.svg) | Picnic under a tree: basket, oranges, bottle and book on a checked blanket |

All three use a 640 × 360 view box and scale freely.

- Ink: `#111111`
- Orange: `#FF5A1F` (sun, sun glints, umbrella stripes, tail lights, oranges)

They work on light backgrounds. The black ink won't show on dark ones.

## Editing

The SVGs are generated. Change [`build.py`](build.py) and rebuild:

```sh
python3 illustrations/build.py
```

It needs only the Python standard library. The colours, the frame and the
stroke weights are set at the top of the script. Lines behind a foreground
object (the sea behind the car, the blanket under the basket) are hidden with
clip paths, so the shapes stay simple paths that design tools can open.
