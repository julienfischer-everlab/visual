# Particle Organs — Organ Age concept

A living particle-anatomy prototype for Everlab: a single WebGL particle system (~9,000 points) morphs between ten anatomical silhouettes, explored through eighteen switchable experience modes with three themes. Everything ships as **one self-contained HTML file** — no build step, no dependencies, no external requests.

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

    Its organ card reads as product, not instrument: the list is sentence case in the page's own face with no dividers, led by a **Body** row carrying the whole-body age — a real selection like any other row, not a caption — and the selected organ is highlighted where it sits rather than hoisted to the top. The card also drops the warm organ ground for the same surface its siblings use — see below.
8. **Desktop V1** — the V2 dashboard turned toward the body. The hero's second figure is health coverage rather than biological age, the coverage tile goes (it would say the same thing twice) and steps takes the whole left column, its week drawn as strokes rather than blocks. The width that frees up goes to the organ card, retitled *How your body is ageing*, where the selected row sits on a filled pill and the age reads as a tag under the number. Wears `m2 b2` plus a `b3` marker.
9. **Mobile** — bento layout with the mini organ carousel, metrics carousel, the signal insight sheet, and the organ-age sheet
10. **Mobile V2** — the same bento re-laid out to the design: biomarkers and biological age as a pair of figures at the top, health coverage beside a week of steps below, then organ age wide and shallow beneath them — its name and tag down the left, the organ standing in the right half. Wears `m5` plus a `v2` marker.
11. **Mobile V1** — the bento folded down to two blocks. The hero is a plain card carrying biomarkers and health coverage as two figures, with the meter beneath doing the work the dial used to. Below it, steps and organ age stand side by side and close the same way: label, value, visual, a rounded status tag, then the dots — same sizes on both, so the two carousels read as one control. Wears `m5 v2` plus a `v3` marker.

12. **Desktop V3** — V1's dashboard with its insight header lifted onto a ground of its own: the hero, steps and organ cards sit inside one `#1c0505` panel on `#280707` cards, over a page that stays light. Wears `m2 b2 b3` plus a `b4` marker.
13. **Mobile V3** — the same idea on the phone: the status bar, the title and the bento share one coloured region running to the screen edges, and the records list below it sits on white. The two are layers rather than sections — see below. Wears `m5 v2 v3` plus a `v4` marker.
14. **Mobile V6** — V5 with the biomarkers folded into the hero. The header carousel gains a slide in front of the organs: the total where the age sits, the three ranges under it in place of the younger/older caption, and the arc reading the distribution instead of an age scale — the meter's own proportions in the meter's own colours, revealed left to right once the slide lands. It is not an organ, so it sits at index −1 rather than inside `MB`, and the silhouette and its halo give way as the swipe carries it in. The card it came from leaves the body: it is in the hero now, not below it. Wears `m5 v2 v3 v4 v5 v6` plus a `v7` marker.
15. **Desktop V5** — Desktop V1 reading the organ the way the phone does. The organ card carries Mobile V5's stack — the arc, then the age at the size the phone sets it, then the difference in words directly under the number — and that difference stops being a tag: a pill is a status, and V5's whole point is that the figure states the verdict while the words only spell it out, in the same grey whichever way the delta runs. The hero says what the phone's hero says, figure for figure: biomarkers, then the count of the panel still untested rather than health coverage — coverage has a tile of its own further down — and the card's one action, *Get test*, held at the right by an auto margin. The steps card already read the same on both. The page is two even columns: biomarkers over the pair on the left, the organ alone on the right. V1 gave the organ the wider half and folded the pair into one full-width tile, because coverage had moved into its hero; V5's hero carries untested instead, so coverage takes its own tile back and the two stand side by side in the phone's order — coverage, then steps. The organ list holds its longest row on one line at the narrower card by taking a larger share of it (51%, against V1's 46%), and the organ takes what is left. The halo is a dark-theme thing on both platforms: it is light thrown on a surface, and on the pale ground it read as a coloured stain sitting on the page rather than as light, so the light theme carries none. The phone's light sits on the card too: the same stop list, the geometry scaled off the card's width the way the phone's is off the screen's, and the same slow breath. It is centred on the organ rather than on the card, since the list has the left half and a light centred on the card would sit beside the thing it is lighting. Its colour is the phone's — green while the organ reads younger, orange once it reads older — taken here from the eased warmth the cloud is already tinted by rather than from a carousel position. The card's corner carries the phone's share button in place of the expand arrows. Its own eyebrow reads *Biological age*, at the biomarker card's size and in its grey, so the two titles on the row are one thing said twice rather than two treatments. The organ is drawn a fifth larger than the other dashboards and sits 64px lower in the card, and the stack follows it down by less than it moved — 48px for the arc, 24px for the age and its caption — so the three close on each other as they fall. Those are transforms rather than margins: `resize()` bottom-aligns the stack off its own `offsetHeight`, and a margin would grow that height and shunt the block back up by what it was just given. The cards are the phone's cards exactly: 5% white, which paints `#0d0d0d` — a card that lifts off the page rather than standing on it. A wash is a relationship to what is behind it, so two pages can only share a card colour if they share a ground; the dashboard's `#0d0d0c` goes black here, the way the phone's body is black on this page. Thirteen levels, invisible in itself, and it is what makes the two identical. The canvas clears to the same value, or the organ would sit on a visible rectangle. Wears `m2 b2 b3` plus a `b5` marker.

**Overview page** — the same two platforms.

15. **Desktop** — the Everlab product shell: sidebar, plan card, the two gauges, tasks, a next-actions rail and the action-plan grid. The organ card opens the organ-age modal over the page
16. **Mobile** — the Overview frame on its own screen

Both desktop sidebars move between **Overview** and **Biomarkers**.

### The organ in situ

The dashboard card's particle size rides on the card's own width, so a narrow
window thinned the organ to near-invisible dots while the gauge and list stayed
put — the card read as empty. The in-situ size now has a floor, so the organ
holds its density from about 1150px of window upward.

Mode 5, the original bento, is no longer offered on its own — every mobile
variant wears its styles, so it stays in `MODES` (renumbering would rewire the
renderer) but sits in a group the dropdown does not list.

### Two layers, not two sections

Mobile V3's body is a foreground layer over the coloured header, not the
next thing down the page. The header pins to the top of the scroller and the
body rides over it with rounded top corners and a higher `z-index`, so the body
moves at the scroll's own rate while the header stays put. What recedes is the
header's *content*: it translates at a quarter of the scroll and fades to zero
by the time the body has covered it — scroll-linked throughout, no animation to
trigger and nothing that scales or bounces. Under reduced motion the fade stays
and the translate goes.

The layer takes the theme: white in light, `#0d0d0c` in the dark themes, with
the records reading normally on either. The *header* does not — it keeps
`#1c0505` in every theme, and so does the phone's own ground, so the safe area
above the header can never show a lighter strip behind the status bar. That is
the one place a light theme is named explicitly rather than left to source
order: `body.light.m5 #phone` paints the phone white and ties with the V3 rule
on specificity.

### The body

Biological age gets a silhouette of its own, in the same language as the
organs: the upper half of a body — head, neck, shoulders, chest, the arms
entering and leaving through the frame — cropped at the waist and turned a
little off-axis so it reads three-quarter rather than pinned flat.

Two things in the pipeline are new for it. `buildCloud` takes an optional
density function, so the sampler can be pulled toward the skull, the heart and
the lungs and away from the arms: the systems inside are *density*, never drawn
shapes, and it still reads as one object. The same function thins the sampling
toward the frame's foot, so the waist dissolves out of view instead of ending
on the bright rule that edge-biased sampling would otherwise leave at a cut.
And `tf.yaw` turns a cloud about the vertical at build time, which is where the
three-quarter comes from.

Everything else it inherits: shell bias, depth from thickness, ambient strays,
idle drift, the breathing pulse, and a flow preset of its own — circulation out
from the heart.

It is a selection, not a decoration. **Body** is the last entry in `PILL`, so
wherever an organ can be picked in the product — the desktop organ card, the
mini card on the phone, the immersive modal's channel dock, the organ library —
Body is there, and picking it puts the silhouette on the hero the same way an
organ goes there. It is deliberately *not* in the concept carousel: those nine
cards are the organs. `CARDS` therefore stops at nine, and the two places that
read it by the live organ index go through `cardFor()`, which falls back to the
Body row rather than off the end of the array when a body selection survives a
mode switch. The nine-cell overview grid stays nine for the same reason its
layout is 3×3.

### Mobile V4: the header is the organ

V4 is V3 re-hung, not redrawn — the same cards, the same spacing, the same
interactions, in a different hierarchy.

The organ leaves the bento and becomes the header's own content: no card, no
ground, no radius, no padding, one large silhouette on black with generous space
around it. The header reads top to bottom as three bands: the organ, the arc and
age, then the name strip — no labels over the silhouette at all. The arc and
odometer are the dashboard's own, moved here rather than copied, so they keep
animating in step with everything else. The odometer's column masks its own top
and bottom so the roll reads as a drum, which means the column has to grow with
the type: at 57px, the 64px column the smaller digits sat in left the mask eating
them. The canvas clears to the header colour so there is no rectangle to see
against it.

Two soft edges frame the band. At the top of the header sits a very light
elliptical wash that carries the same verdict as the silhouette — green while
the organ reads younger, orange-red once it reads older — blending from one to
the next as the swipe crosses between organs. At the foot of the band, the last
40px is a progressive blur that fades to the header colour, so the silhouette's
legs dissolve into the header instead of ending on the crop. That belongs to the
body alone — every other organ is a compact shape sitting well inside the
canvas, and softening a foot it does not have only veils the drawing — so the
band rides a strength the carousel sets, full on the body and gone a step away.

The header content slides up at a fraction of the scroll and fades out by the
time the body has covered it, and the organ recedes with it: the silhouette is
drawn down to nine tenths of its size across that same span, a multiplier on the
zoom uniform rather than on the camera's own eased value, so scrolling and the
morph between organs are never fighting over one number. The pair below the hero
stands 222px tall on a 96px chart — the visual is the only part of the tile with
slack in it, so it is what gives way when the card comes down; coverage and steps
are one rule in one grid row, so they cannot drift apart.

The light itself is a circle whose centre sits above the screen: only its bottom
third is ever on one, which is what makes it read as a wash coming from off the
top edge rather than a disc placed in the header. Its stops approximate a
gaussian, because three stops ramping linearly to zero leave a Mach band exactly
where the ramp stops — the eye reads the break in the slope, not in the value,
so a gradient that reaches zero at its boundary still draws an arc there.

That clear colour snaps to the theme rather than riding the eased crossfade
value every other page uses. Elsewhere the canvas covers its whole card, so a
frame or two of mismatch is invisible; here it is a box *inside* the header, and
a value short of its target draws a visible rectangle on it.

**The organ morphs; nothing about it slides.** V1-V3 draw the two neighbouring
clouds side by side and crossfade them. V4 instead binds one organ into the
shader's A slot and its neighbour into B and drives `uP` off the swipe, so it
runs the same particle morph a mode change does: the silhouette breaks apart and
reforms as the next one, in place, with the per-particle stagger and the outward
puff at half-way coming free. One draw call, no pan.

But not under the finger, and not on the strips' clock. The text tracks the drag
1:1 and settles in 480ms; the cloud holds whatever the swipe picked up, starts
only on the release, and takes 3000ms to gather. The words land while the organ
is still arriving, which is what makes it read as one thing becoming another
rather than as a slide changing.

**One progress value drives the rest.** The carousel rubber-bands at the ends,
snaps past a threshold and honours a flick;
V4 hangs the composition off that same `d`. The tags are the only thing that
travels — half a card, or they would fly off a static organ — the age tag at
0.82x and the status tag at 0.68x, fading a little ahead of the morph with 3-4px
of downward drift. They answer the pointer on top of that, at those same
relative rates, so the pair keeps its depth even when nothing is being dragged.

Its drag is not 1:1 with the card, though, where V1-V3's is. Their slides
travel a whole card, so dividing the drag by the card is exactly the finger;
V4's do not — the name strip steps 138px, the age 118px, the silhouette not at
all until the release — so the same division read about three times heavier
than it looked. One slide is 52% of a card here, committing at a third of
that, with a lighter flick to match.

The age is the name strip's twin: one element per organ, travelling the same
way at about half the rate and crossfading rather than rolling. It is *not* the
dashboard's odometer — that reads as a drum, which is right for a value ticking
over in place and wrong for a carousel — so on V4 the odometer stays where it
is and the age gets a strip of its own, with the gap in words underneath it.

At rest that strip is one number. Its neighbours are not dimmed, they are
absent: the ramp reaches zero a little short of a full step, so there is nothing
to read until a finger moves the carousel and the next age arrives with the
swipe. The blur runs the same curve — heaviest as a number appears, gone by the
time it reaches the centre.

**The name strip is the carousel's only cue.** The active organ's name sits
centred and sharp at the foot of the header, its neighbours out toward the edges
under real blur rather than grey — grey reads as disabled, blur reads as further
away. The softening is progressive, staying light through the middle of a step
and only arriving at the edges, so a neighbour is a legible name set back rather
than a smear. It runs the same progress at its own rate. There are no dots: a
second indicator under it only competed with it.

The body is V2's three cards — health coverage and steps as the pair, and the
hero with biomarkers beside a third reading of its own: how many of the panel
are still untested. That figure takes the label's grey rather than the card's
ink, because it counts what is missing. V2 keeps biological age there and V3
keeps coverage; each is its own element, so none of them had to be rewritten.
A rounded secondary button sits at the card's top right. Three things on a
287px row is tight, and nothing there shrinks or wraps — a wrapped eyebrow
drops its figure out of line with the one beside it — so the room comes from
the eyebrows, half a point smaller and tighter here than elsewhere, and from a
row closed up from 40px to 18.

**Mobile V5** is V4 with the dark theme's two grounds swapped: the header takes
the lifted grey and the body takes the black, so the hero recedes and the
content sits forward. Everything else — the morph, the strips, the physics, the
whole light theme — is V4's. It wears every V4 class and adds a marker of its
own.

Its header also darkens as the body rises over it, from that grey down to almost
black, reaching the bottom of its range exactly as the body reaches the top of
the screen. The organ's canvas clears to the header, so the renderer reads the
same number the CSS does rather than a constant — otherwise a grey rectangle
surfaces on the darkening ground half way through.

Release runs a timed curve, 480ms on `cubic-bezier(.22, 1, .36, 1)`, instead of
the exponential chase the other pages use, so it reads as one deliberate
movement with a long tail. A new drag cancels it. Arrow keys and the pagination
dots run the same glide.

That header is a neutral page surface rather than a coloured block — `#ececea`
under a white sheet in light, `#1a1a19` under `#0d0d0c` in the dark themes — so
unlike V3, which keeps the organ's burgundy and the dark theme's ink on it
whatever the page is set to, V4 simply takes the theme. Both readings are said
with two ids, because the rules they override are written against `#phone` and
an id beats any number of classes.

One thing had to change for it. `pixScale` clamps the dot size on the dashboard
because a sub-pixel particle disappears; the phone had no floor, because a
bright 1px dot on burgundy still glows. Dark ink on light grey does not — the
organ came out as a whisper — so V4 takes the same floor. That is the only
reason the dot size differs between the mobile versions.

Everything else moves down into the body, in one column: **Biomarkers** full
width with the health-coverage block removed, then a two-up of **Signal** and
**Activity**. That is the whole page — coverage does not appear on V4 at all,
and the cards are a 4% wash on the body rather than a surface of their own. The
header is `#000`, the body `#111`, so the black hero reads as its own space
under the body's rounded shoulder; the transition and the layered parallax
scroll are V3's, untouched.

None of this is a second copy. The nodes are the ones every other page uses, so
V4 takes them on the way in and hands them back on the way out, leaving a
comment node standing in each gap — a placeholder cannot go stale the way a
recorded sibling can, and the organ card in particular moves on its own
schedule. V1, V2, V3 and every desktop page lay out to the pixel after a V4
round trip.

### Charts do not animate in

The mini charts used to draw themselves as each slide landed. They are static
now: a slide arrives already drawn, and every mark renders its final state
without help — the dash pattern is the whole path, so at offset 0 the line reads
solid, and nothing is left to fire.
### The organ mini card

Label, title, status: three lines, then the visual, then the dots. The status
is a line of type in its own colour rather than a chip — the same on the phone
and on the dashboard.

The measure is the card's, not the slide's: **Biological age** is pinned and
only the name, the organ and its tag travel with the swipe. The carousel leads
with the body's own age — *Body, 6 years younger* — and then walks the organs.
`PILL` keeps Body last so the nine organs hold the indices everything else is
written against; the reading order is a lookup, `MB_ORDER`, and the carousel
walks `MB`. Slide 0 is the body, and it carries the body silhouette.

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

17. **Library** — behind a left nav: **Organ Library** (every organ isolated on its own tile, the master component each surface mounts) and **Milestones** (Baseline, Treatment, Ongoing, Nutrition, Activity, Medication, Supplements). Every tile reports its dot count and downloads as PNG, JPG or SVG.

## Tweaks (top bar)

- **Mode** — Colour (the burgundy the concept is designed in), Dark, or Light.
- **Biomarkers**, **Activity**, **Biological age** — each of the three cards can
  be put in an *Empty* state on its own, desktop and mobile at once; the age
  card also has a *Partial*.

  The other two are designed. The **age** card keeps its organ and says what is
  missing under it, one line and one action centred across the card, with no
  eyebrow — the sentence names the card. What it shows is the body, and only the
  body: there is no organ to pick when there is no age, so the carousel is off
  and every route into a different one is closed at `selectPill`, with the
  swipe's own drag stopped where it starts. The organ takes back the height the
  gauge, the age and the names give up and then gives a fifth of its size to the
  message; the 150px the message reserves is the same number `resize()` takes
  off the canvas, so the two can never overlap. **Activity** keeps its eyebrow —
  its sentence does not name the card the way the age card's does — and centres
  *Connect your variables* and a *Connect* action on the card itself rather than
  on what the eyebrow leaves, which would sit low by half a label.
  **Biomarkers** keeps its distribution and takes the reading out of it: blurred
  and drained of colour, the band is a shape rather than a result — the real
  widths under the blur, enough to say what the card will hold without stating a
  figure nobody has yet.

  *Partial* is the middle case: some organs have been read and some have not.
  An untested one shows a dash wherever its age would be — the list, the strip,
  the odometer, which gets an element of its own rather than a wheel for a
  character that is not a digit — and when it is the one on screen the
  silhouette goes grey, the halo goes with it, and the arc and the caption say
  nothing at all. An indicator resting on a reading nobody has taken is worse
  than no indicator. The rules are
  named by the card rather than by where it sits — V4's hero layout borrows the
  hero and the steps tile out of the bento — and they sit last in the sheet
  carrying the phone's id, because what they switch off was switched on by rules
  that carry one.

Chronological age, the organ-card tint, density, particle size, flow and voxels
are no longer exposed: they stay where the design landed. `CHRONO` is a constant
now rather than a control.

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
