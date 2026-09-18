# Hidden Signals

An interaction prototype for Everlab: a wall of biomarker names covering the
screen like fog on glass, with larger orange condition words hidden underneath.
Dragging a finger or cursor wipes the fog away, exposes what the data may be
pointing toward, and the fog closes back over about a second behind the
gesture, so nothing underneath is ever legible except where you are touching.

Open `index.html` directly in a browser — no server or build step. The page is
self-contained: no CDN scripts, external stylesheets, remote images, or network
calls of any kind.

## The composition

The app fills an iPhone frame at the internal size the brief specifies,
402 × 853. The frame scales to fit the viewport (down on small screens, up to
1.18× on large ones) while the composition inside stays fixed, so the layout is
identical everywhere.

## How the reveal works

Three layers, composited each frame onto the visible canvas:

| Layer | What it is |
| --- | --- |
| Hidden | Nine condition words (`CARDIOVASCULAR` … `BONE DENSITY`), auto-fitted to the screen width and distributed down its height, on an opaque near-black ground |
| Mask | A half-resolution canvas the brush stamps into, and time erodes |
| Fog | An opaque haze plus ~390 metric names, drawn straight onto the visible canvas |

Each frame the fog is drawn, the mask is punched through it with
`destination-out`, and the hidden layer is slid in beneath the resulting holes
with `destination-over`. The top layer is the mask, as the brief asks — not a
set of per-element hover states.

One typeface carries the whole piece — wall, condition words and copy are all
set in the same mono stack, declared once as `--mono` and read back by the
canvas code so CSS and JS cannot drift apart.

Every name on the wall is set at one size (10px, one weight, one tracking).
Depth is carried entirely by opacity and by how far a row drifts under parallax
— rows are skewed toward the far, near-invisible end, so the field stays quiet
and the few forward rows read as surface. Setting the type once per frame
rather than per item is also most of why the wall is cheap to draw.

Two details matter to how it feels:

- **The mask is cubed before use.** Canvas compositing can only multiply
  alpha, so a power is the only curve available, and it has to be a steep one.
  Erosion on its own (`destination-out` with a flat alpha) decays fast but
  never reaches zero: after a broad wipe it left a wide, low-alpha wash that
  made every hidden word faintly legible at once — measurably, up to 16/255 of
  orange still spread across the screen a second and a half later. Drawing the
  mask into itself twice with `destination-in` cubes its alpha, which leaves
  the opened core untouched and takes that wash to nothing inside a second.
  The brush gradient's stops are the cube roots of the falloff wanted on
  screen, so the curve there is the feather.
- **Stamps are spaced by distance, not by frame.** The brush lays a soft sprite
  down every 5px along the interpolated path, so a wipe deposits the same
  amount of clearing at 30fps as at 120fps. A held, still finger is the one
  exception and clears at a rate set by elapsed time.

A 60 × 128 downscale of the mask is read back once per frame. Metric names
sample it to fade where the signal is coming through, and to drift a few pixels
away from the brush; condition words sample it across their width to brighten
and bloom as they are exposed. When nothing is open, none of that work runs and
the frame is just the fog.

## The sequence

1. `Your body holds millions of signals.` holds on black for ~1.5s.
2. The wall fades in as the line leaves.
3. If the screen is untouched, one short brush graze runs across it — enough to
   suggest the gesture, not enough to give a word away — repeating every 9s
   until the first real interaction.
4. Once roughly a quarter of the screen has been uncovered, `LOOK CLOSER.`
   fades in near the bottom, then away.

## Input

Pointer events cover mouse, touch and pen. Pressing gives a full-strength
brush; on desktop, moving without pressing gives a much weaker one, so the
surface answers the cursor before anyone thinks to drag. A lifted finger leaves
the glass; a cursor stays on it.

`prefers-reduced-motion` shortens the opening, drops the wall in without a
crossfade, and suppresses the hint stroke.

## Verification

Checked headlessly in Chromium at each stage of the sequence: opening copy,
wall, hint graze, an active wipe, a held press, and full recovery — with no
console or page errors, and the frame centred and fully on-screen at iPhone
and Pixel viewport sizes.

Concealment is measured rather than eyeballed: the test wipes the entire
screen in a serpentine, then samples the canvas for warmth (`r - b`) as the
fog closes. Untouched it reads 0 everywhere; after a full-screen wipe it is
back to 0 within 1.5s.

Frame cost is dominated by two full-size canvas blits. Under headless software
rasterisation the page runs around 30fps; on a GPU-composited canvas, which is
what any real device gives it, that work is far cheaper.
