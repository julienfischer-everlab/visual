# Particle Organs — Organ Age concept

A living particle-anatomy prototype for Everlab: a single WebGL particle system (~9,000 points) morphs between ten anatomical silhouettes, explored through eighteen switchable experience modes with three themes. Everything ships as **one self-contained HTML file** — no build step, no dependencies, no external requests.

**Live:** https://particle-organs.vercel.app

## Run

Serve `index.html` from any static server (or just open the file):

```bash
python3 -m http.server 8734
```

## On a phone

`/phone` opens **Mobile V6** full screen, for carrying the design on the device
it is a design for: the mock-up's shell, bezel, side buttons and drawn status
bar are the phone's own job, so they go and the page fills the viewport, safe
areas included. `vercel.json` rewrites that path to `index.html`; anywhere
without the rewrite, `?phone` on the URL does the same. Add `&bar` to keep the
tweak row, for trying the empty states on the device.

The flag cannot be a class added at load: `setMode` writes `body.className`
whole, so it lives in the set `setMode` reads, beside the card states.

V5 lifts the drawn status strip out of the flow and gives `#mHeadIn` 39px to
stand in for it. Full screen has no strip to lift, so that room reserves
nothing and the page would open on a band of empty black: it goes to zero, the
device's own bar sits in the safe-area inset `#phone` pads for, and the title
keeps the 16px every other layout gives it. The override is written beside the
V5 rule rather than in the full-screen block, which the cascade puts above it.

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

The dropdown carries four entries here — **Desktop**, **Tablet**, **Mobile**
and **Archive** — and the three designs are named for what they are rather
than for how many came before them. The version number was the menu carrying
its own history, which is what the archive is for; in code they are still
`b5`, `tabM` and `v8`, since marker names are internal and renaming them would
rewire the renderer. The archive keeps its own **Desktop** — the original
dashboard — so the same word means the current design at the top level and the
first one inside the archive.

Fourteen versions in one list read as history rather than as a choice, and the
ones that are current were the hardest to find in it. So the menu shows what is
current and folds every version they came from into the one Archive entry,
where they are reached from a second select in the bar. Nothing
about the modes changed to do it — `MODES` is still append-only, each version
keeps its index, its class chain and its hash, and only the way in is re-hung.
`#m13` still opens Desktop V1 exactly as it did, with the dropdown reading
*Archive* and the archive select naming the version. Everything below is still
in the build; the numbering is the mode index, not the menu.

6. **Desktop** — the Everlab dashboard with the organ-age card in situ; the card expands into the organ-age modal
7. **Desktop V2** — the same dashboard, re-proportioned: the biomarker card carries the distribution range at its foot, the stat pair is swapped for the steps and health-coverage cards, and a records row, an Other chip and a search field sit under the grid. The hero sizes itself off its content, so nothing spills onto the rows below, and the organ card takes its height from the left column — landscape, not standing up. It wears `m2`'s styles plus a marker class, so there is one dashboard, not two — the class is still `b2` in code, since `v2` already marks the mobile page.

    Its organ card reads as product, not instrument: the list is sentence case in the page's own face with no dividers, led by a **Body** row carrying the whole-body age — a real selection like any other row, not a caption — and the selected organ is highlighted where it sits rather than hoisted to the top. The card also drops the warm organ ground for the same surface its siblings use — see below.
8. **Desktop V1** — the V2 dashboard turned toward the body. The hero's second figure is health coverage rather than biological age, the coverage tile goes (it would say the same thing twice) and steps takes the whole left column, its week drawn as strokes rather than blocks. The width that frees up goes to the organ card, retitled *How your body is ageing*, where the selected row sits on a filled pill and the age reads as a tag under the number. Wears `m2 b2` plus a `b3` marker.
9. **Mobile** — bento layout with the mini organ carousel, metrics carousel, the signal insight sheet, and the organ-age sheet
10. **Mobile V2** — the same bento re-laid out to the design: biomarkers and biological age as a pair of figures at the top, health coverage beside a week of steps below, then organ age wide and shallow beneath them — its name and tag down the left, the organ standing in the right half. Wears `m5` plus a `v2` marker.
11. **Mobile V1** — the bento folded down to two blocks. The hero is a plain card carrying biomarkers and health coverage as two figures, with the meter beneath doing the work the dial used to. Below it, steps and organ age stand side by side and close the same way: label, value, visual, a rounded status tag, then the dots — same sizes on both, so the two carousels read as one control. Wears `m5 v2` plus a `v3` marker.

12. **Desktop V3** — V1's dashboard with its insight header lifted onto a ground of its own: the hero, steps and organ cards sit inside one `#1c0505` panel on `#280707` cards, over a page that stays light. Wears `m2 b2 b3` plus a `b4` marker.
13. **Mobile V3** — the same idea on the phone: the status bar, the title and the bento share one coloured region running to the screen edges, and the records list below it sits on white. The two are layers rather than sections — see below. Wears `m5 v2 v3` plus a `v4` marker.
14. **Mobile V6** — V5 with the biomarkers folded into the hero, and the whole reading 16px higher: the visual by the uniform, the arc and the age strip by their own offsets, the caption travelling with the number it hangs from, the name strip staying where it is. The header carousel gains a slide in front of the organs: the total where the age sits — a fifth smaller than the age, being a count rather than a reading — the three ranges under it in place of the younger/older caption, and the arc reading the optimal share instead of an age scale, revealed left to right once the slide lands. One band rather than three: the whole distribution in the meter's colours put a run of amber and a run of red across the top of the page under a headline count, which is three verdicts on a slide that is not making one. The split belongs to the bar beneath the counts; up here the reading is how far the green reaches, and everything past it stays unlit rather than being called something. It runs to the same figure as the fill rising through the body on this slide, off the same constant, so the two cannot drift apart. It is not an organ, so it sits at index −1 rather than inside `MB`, and its halo gives way as the swipe carries it in. The header is the backdrop the body rises over, not a surface to be scrolled: a swipe up belongs to the content under it, so the header keeps the horizontal axis — the carousel's — and gives up the vertical one. `touch-action` settles the finger; a trackpad has no gesture for it to honour, so the wheel is turned away by the same rule. The gesture belongs to the surface rather than to the card drawn on it: on the hero layouts the carousel *is* the header, so the whole of it takes the swipe — the title row, the silhouette, the arc, the figure, the caption and the names — and only what is meant to be pressed keeps its press. Elsewhere the card is a tile among others and keeps the gesture to itself. The first slide shows the **human body** and the second the **iris**, so that step changes the figure and nothing around it; the iris is drawn a twentieth smaller than the body's rule gives it, blended in over the swipe. Every slide names itself as an age — the organ's own name plus the word — except the entry that already carries a name of its own and the biomarker slide, which is a count rather than a reading. Two places write that strip, so the rule lives in one. The body is drawn a third larger than the organs and rides down by what it grew, on both of its slides — the scale only comes back out on the step to the first organ, where the framing was going to change anyway. The organs ride down too, by less: nothing zoomed them, but the hero has been lifted for the body's sake and it left them a quarter of the canvas above its centre. Every slide's mass now sits on the same line, so the carousel stops stepping up and down as it goes.
15. **Mobile V7** — Mobile V6 again, as somewhere to diverge from. It is an index and a marker class, not a copy of anything: the class chain is cumulative, so `m20` wears every rule V6 wears and starts differing the moment something is written against `v8`. Wears `m5 v2 v3 v4 v5 v6 v7` plus a `v8` marker.

On the biomarker slide the body is a **vessel being filled**, not a body being coloured. Below the front the particles are dense and at full strength; they do not change colour, because the two they are drawn from say nothing about the reading. The front stops at the **optimal share** rather than covering the figure: how high it reaches is the reading, 81 of 124 being two thirds of a body and not all of it. Above it the cloud does not simply dim — nearly every particle in the volume goes, and what stays is the shell. The edge attribute each particle already carries runs high on the silhouette and low deep inside, so keeping by it leaves an edge nobody drew: the body is still legibly there, visible the way glass is, by its rim rather than by an outline, The empty half reads as a container rather than as the same body dimmed because of how little of it is left, not because anything is tinted. The handover is a band a tenth of the body deep, because a fill in a silhouette fails at exactly one place — a visible horizontal edge — and the particles the lottery took fade back in across it rather than switching on. The strays that sit outside the silhouette stay, since a vessel drawn to the pixel would stop being a particle system. Leaving that slide the fill drains over a span of its own, slower than it arrived — it used to ride the morph's curve directly, and that curve spends most of itself in the first fifth of a three-second dissolve, so the fill left and the particles came back inside half a second and then nothing happened for two and a half more: a flip, not a fade. The fill rises on the same cue and over the same span as the arc's sweep — they are one reveal of one reading, and running them on two clocks left the body still filling long after the meter had finished. The cue is the release: the arc is a reading rather than a scrubbable control, so it commits with the swipe and then fills at its own pace instead of waiting out the silhouette's three-second dissolve. The three ranges below carry the split, so the body itself never needs to carry three readings; the counts live in one object that both the legend and the fill height are read from, since a number typed into the markup and a number typed into the shader would be two places to change one fact. Neither does it morph under the finger: the strips track the drag, the silhouette holds the slide the swipe picked up and only breaks apart on the release, which is the physics every other step of the carousel already had. V6 opens on that slide and holds it against the five-second cycle, since it is the page's headline. The card it came from leaves the body: it is in the hero now, not below it. Wears `m5 v2 v3 v4 v5 v6` plus a `v7` marker.
15. **Desktop V5** — Desktop V1 reading the organ the way the phone does. The organ card carries Mobile V5's stack — the arc, then the age at the size the phone sets it, then the difference in words directly under the number — and that difference stops being a tag: a pill is a status, and V5's whole point is that the figure states the verdict while the words only spell it out, in the same grey whichever way the delta runs. The hero says what the phone's hero says, figure for figure: biomarkers, then the count of the panel still untested rather than health coverage — coverage has a tile of its own further down — and the card's one action, *Get test*, held at the right by an auto margin. The steps card already read the same on both. The page is two even columns: biomarkers over the pair on the left, the organ alone on the right. V1 gave the organ the wider half and folded the pair into one full-width tile, because coverage had moved into its hero; V5's hero carries untested instead, so coverage takes its own tile back and the two stand side by side in the phone's order — coverage, then steps. The organ list holds its longest row on one line at the narrower card by taking a larger share of it (51%, against V1's 46%), and the organ takes what is left. The dot that starts each row sits on the eyebrow's own left rule rather than a row's padding in from it -- nothing else on the card stands on that line, so the inset read as a misalignment. It became a negative margin, which sends the highlight the other way: the selected row bleeds off the card's left edge as a band across the row, rather than a pill floating inside a column. The halo is a dark-theme thing on both platforms: it is light thrown on a surface, and on the pale ground it read as a coloured stain sitting on the page rather than as light, so the light theme carries none. The phone's light sits on the card too: the same stop list, the geometry scaled off the card's width the way the phone's is off the screen's, and the same slow breath. It is centred on the organ rather than on the card, since the list has the left half and a light centred on the card would sit beside the thing it is lighting. Its colour is the phone's — green while the organ reads younger, orange once it reads older — taken here from the eased warmth the cloud is already tinted by rather than from a carousel position. The card's corner carries the phone's share button in place of the expand arrows. Its own eyebrow reads *Biological age*, at the biomarker card's size and in its grey, so the two titles on the row are one thing said twice rather than two treatments. The organ is drawn a fifth larger than the other dashboards and sits 64px lower in the card, and the stack follows it down by less than it moved — 48px for the arc, 24px for the age and its caption — so the three close on each other as they fall. Those are transforms rather than margins: `resize()` bottom-aligns the stack off its own `offsetHeight`, and a margin would grow that height and shunt the block back up by what it was just given. The cards are the phone's cards exactly: 6% white, which paints `#0f0f0f` — a card that lifts off the page rather than standing on it. A wash is a relationship to what is behind it, so two pages can only share a card colour if they share a ground; the dashboard's `#0d0d0c` goes black here, the way the phone's body is black on this page. Thirteen levels, invisible in itself, and it is what makes the two identical. The canvas clears to the same value, or the organ would sit on a visible rectangle. Wears `m2 b2 b3` plus a `b5` marker.

15. **Tablet** — Desktop V5 in a frame two hundred pixels narrower, and a page rather than a state of one. It was a tweak on V5 first, which is what a shell looks like before you try to link to it: a design you cannot open on its own, cannot put beside its siblings in the menu, and cannot point anyone at. A page costs one index and one class chain — it wears every rule V5 wears plus the `tabM` marker the layout is written against — and buys all three back. One thing has to give at that width: the organ card cannot hold the list and the organ side by side, and halving the organ to keep ten rows would be keeping the least of the card. So the list goes and the card reads the way the phone's hero does — the organ centred with the whole width, arrows either side of the number, and the names on the floor of the card with their neighbours showing, cropped by the card's edge rather than shortened. Nothing is lost: every reading the list held is one arrow away, and the one the card is showing is the one it was already showing large. The strip and the arrows count by the same sequence the phone's carousel does, so the organ ages collapse to a single *Organ age* slide when they are unread, exactly as they do there. Everything else is the same page tightened — a narrower rail, a shorter page margin, the left column stacked one-up because half of a narrower page is not two cards wide, one row of filter chips that scrolls rather than wraps, and a table that drops the sparkline, the one column that says least at a glance. Coverage and steps stay side by side as they are on the desktop — stacking them was the obvious move and the wrong one, since the pair is one row of two readings taken together rather than two cards that happen to be adjacent.

    The card's carousel is the phone's, not a pager: one slot per reading placed every frame off a continuous position, so a step is the whole strip travelling and its neighbours softening rather than three labels swapping text. The arrows move it, and so does a drag on the card — tracking the finger 1:1, deciding its axis once so the page keeps its vertical scroll, resisting at both ends, and committing the organ on the release so the morph is one movement rather than something scrubbed back and forth. It is the same control as the phone's, and it should not read as a different one on a wider screen.

    The shell is a class the version writes rather than a width the browser finds: it is a design to be looked at, not a breakpoint, and it holds at whatever size the window happens to be.

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
walks `MB`. Slide 0 is biological age: the strip calls it that, while the code
and the organ list still call the entry **Body** — `label` is the key every
test is written against and the word the list uses under a card whose
heading already says *Biological age*; `slide` is what the carousel calls it,
where nothing else does. It carries the **iris**.

### Three expressions of one system

Biomarkers is the **human body**, biological age is the **iris**, organ
age is the **organs** — three shapes, one particle language. They are three
clouds in the same array, and the carousel morphs between them like any other
step; the biomarker slide and the body slide used to be the same drawing
differing only in colour, and that is no longer true — which matters more now
that there is no colour for two things to differ in.

Slot 9 stays the print, because it is what the Biological Age carousel and the
Body row select and every index in the file is written against that numbering;
the human body is appended as slot 10 and bound in place of an organ's cloud
when the carousel is on the biomarker slide. `BODY_I` finds it by label, which
is also what the range fill measures its height off.

### The fingerprint

Biological age is not an organ, so it is not drawn as one. It is the print: the
one mark that is nobody else's, made the way the organs are made, out of
particles.

The ridges are **isocontours of one scalar field** — the distance to a core
hairpin — rather than curves drawn one at a time. That is what buys the three
things a print needs and a drawn family cannot hold together at once. Contours
of a single field never cross, whatever the wobble does. They stay evenly
spaced, because the field is a distance. And where they wrap the end of the
short arm they close beneath the core on their own, which is the delta —
the thing that makes a print read as a print rather than as rings.

So the shape is authored as one curve: a hairpin whose long arm runs out
through the foot of the pad and whose short arm stops inside it. The wobble is
laid over the field rather than over the ridges, so it bends the whole family
together. Marching squares lifts the contours out, an oval pad cuts them, and
the sampler thins the last fifth of that oval so the print lifts off at its
edge instead of ending on one — an impression, not a stamp. Fixed constants, no
`Math.random`: a print is one print, the same on every load.

The same polylines then do two more jobs. Stroked onto the sampling canvas they
are what becomes particles; handed to the flow preset they are the lanes the
travelling dots run along — only the long runs, since a dot travelling a ridge
fragment reads as a twitch rather than a current, and `width` and `turb` stay at
almost nothing, because on a ridge a dot off the line is a dot in the gap and
the gaps are what make the print legible.

**Depth.** The print carries a centre-to-edge falloff rather than an even
brightness, and the whole static layer is held down: these ridges are the
substrate the signals run through, and a substrate that competes with them is
just a brighter fingerprint. Two things do it, both measured off one radius in
the pad's own tilted frame, taken from a point up toward the core rather than
the pad's centre — which is where the eye reads the middle of a print to be. The
sampler thins outward, so the outer ridges are sparser as well as dimmer; and
`aEdge`, the per-particle brightness the shader multiplies into alpha, is set
from that same radius by a smooth power. For an organ `aEdge` comes from the
distance to the silhouette's edge, which means nothing on a line drawing where
every particle is edge — the print reads it as depth instead. Running the
falloff over the whole radius rather than the last fifth is what keeps a ring
from appearing anywhere for the eye to find, and the floor keeps individual
particles visible out to the rim. The strays sit at that floor: present, barely.

**Signals.** Two layers out of one budget of dots. A quarter of them are the
ambient stream: slow, even, dim, keeping every lane faintly in motion. The rest
are packets — small groups that appear on a ridge, run it end to end fast, fade,
and are replaced somewhere else, with eight channels so several cross the print
at once. Each dot in a packet trails the head by its own stable slot, so the
group holds a comet's shape for the whole run; half run their ridge backwards,
so nothing reads as a rotation of the print; and a *ladder* fires the same
signal on the next lane out and the one after, a beat apart — `FP_RIDGES` is
ordered from the core outward, so consecutive lanes read as one thing leaving
the centre rather than three unrelated ones. Duration, gap and rest are
randomised around their means, so the sequence never lands on a beat. The two
layers are told apart by weight as well as by speed: the ambient sits at the
print's own strength, a packet runs harder — not a glow, but a signal has to be
stronger than the tissue it crosses or it is just a denser part of it. It used
to be a paler colour; `toneA` spends that paleness on alpha instead, which is
the same distinction at the same size in the two inks. Both
ride the polylines by arc length, so a dot is never off its line, and the ridges
themselves never move.

The hero had to be taught to draw them. It renders the cloud out of the static
pair buffers and asks for `[0, N)`, which is every particle except the flow
slice past `FSTART` — so on the phone the flow layer was computed every frame
and never reached the screen. It now takes a second draw off the live buffers,
the way the spatial cards do, for presets built for it and only at rest on the
slide they belong to.

### The iris

Biological age as a **pupil** rather than a figure. It began as a library
exploration and now carries the biological-age slide itself; the fingerprint
stays in the library as an asset, unselected.

A dark centre and a fan of fine strands leaving it — the whole system read off
one structure, which is what the print and the body are each saying too. No
lids, no sclera, no highlight: it is the fan, and the fan is the point.

The fibres go in **bundles with gaps between them**, and that is the whole
trick: a groove is nothing drawn, not fewer dots drawn. Modulating density over
an even fan gives a cloud that is thinner in places; leaving the mask empty
gives a furrow the sampler cannot fill in. Thirty-four bundles of two to four
strands, each leaning its own way, with uneven widths and uneven gaps — even
ones come out as a cog. The bundles sit on an **even partition with each one
jittered inside its own cell**, which is the part that took a second pass:
walking the circle by a random step is the obvious way and it does not close.
The drift accumulates, the last bundle lands wherever it lands, and what is left
is one wide seam with a quadrant lighter than the rest. The cell fixes the
coverage, the jitter inside it keeps the spacing uneven, and a shorter strand
goes into every groove rather than most of them — skipping that at random is the
other way a quadrant goes light. Strands start at the pupil's edge and run out,
some forking a third of the way along, and a shorter strand starts inside the
groove itself so a gap reads as a furrow between fibres rather than an empty
wedge.

Past the middle each strand loosens — its taper thins, its angle scatters, its
radius wanders — so the structure is crisp where it is meant to be read and
comes apart toward the rim. Crypts cut a few fibres short, the way an iris
carries its lacunae, and three short furrow arcs cross the fan so the radial is
not the only direction in the picture; a full ring would read as a diagram. The
sampler holds the dots to the inner half and thins them all the way out.

A shape made of thin lines needs more dots than a constant gap asks for, or the
lines come out as a speckle — the entry carries its own `dots` multiplier and
the library honours it. The opposite is true in the engine: a cloud is the same
nine thousand particles whatever shape it takes, so thin lines wear all of them
on very little area and the iris came out heavier than the organs beside it. It
is drawn at 70% of the frame's density, and because that lottery is stable per
particle it drops the same dots every frame rather than sparkling.

**It dilates rather than scales.** The pupil opens and shuts on a breath of
about nine seconds, and the tissue between it and the limbus is compressed into
whatever is left: the inner edge travels a long way, the rim does not move at
all, and every particle between them moves with the deformation. Scaling the
whole disc would read as a zoom. The breath dwells at its ends — a plain sine is
already flat at its extremes, and passing it through a second sine flattens it
again, so the pupil rests wide and rests small instead of turning round the
moment it arrives — and its phase drifts while its amplitude wanders on periods
sharing no factor with it, so no two breaths are the same size or land on the
same beat. Over that, a front per furrow rather than
one across the disc: the wave's phase and its strength come from which bundle a
dot stands in, so the fibres light in their own time and the movement stays
radial without ever reading as a rotation. The middle keeps its own long pulse,
each dot breathes a little along its own strand, and the flow layer runs spokes
from the ruff to the limbus so a travelling dot is travelling a fibre. On the phone it is framed a twentieth smaller than the body's rule gives it,
weighted by how much of it is on screen rather than switched at the slide, so
the adjustment arrives with the figure over the swipe instead of stepping when
the carousel crosses. It sits at the height every other slide does.

All of that lives twice: in the 2D view the library tiles are drawn with, and in
the shader, so the slide is alive too. `uIris` carries the switch and the two
radii, and it follows the same rule the range fill does — raised where the iris
is the shape on screen and settled, off everywhere else, because a uniform left
up is read by the next page that draws.

### The sphere

A ball of particles whose outline never moves and whose inside never stops. The
mask is only a circle — it is there so the framing, the area and the
normalisation come out of the same machinery as every other shape — and the
positions are then thrown away and rebuilt as a real ball. Sampled evenly
through its volume, a ball projects brightest at the middle and fades to nothing
at the rim, which is a fog rather than an object; so a shell carries the edge and
the volume fills the inside.

The currents are three low-frequency waves through the volume, each drifting on
its own slow clock, summed and pushed through a soft threshold — which is what
turns a gradient into regions with edges, and is the difference between weather
and noise. Two things had to be got right for them to be visible at all:

**They are density, not brightness.** Dimming every dot by the field gives a
ball that is unevenly lit. What reads as a current is regions where the
particles are *not*, so the field decides which dots are drawn at all, against a
threshold that is stable per dot — the same dot fades out and comes back as the
current passes over it, rather than the cloud sparkling.

**And they vary mostly across the ball rather than through it.** A field that
varies as much in depth as in width averages out along every line of sight: the
projection sums the chord and the structure is gone before it reaches the
screen. The first version was invisible for exactly that reason. Depth still
bends the currents; it just cannot be what decides them.

The shell is exempt from the cull, so no current can eat the rim and take the
sphere with it, and depth shows in the dot size rather than in the outline —
the ball has a front and a back without ever ceasing to be a circle.

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

Every state control is a thing that is either on or off, so each is a switch —
the label beside it already says which thing, and the first option is the on
position. The `select` stays underneath as the thing that holds the value —
every handler in the file reads `.value` and listens for `change` — and the
switch drives it rather than replacing it, which is also how a control follows
a change some other control made through the chain. Version and Mode keep their
menus: one is a long list, the other has three options.

- **Mode** — Colour (the burgundy the concept is designed in), Dark, or Light.
- **Archive** — which superseded version is on screen, and only while one is.
  It is the second half of one control: the dropdown names the entry and this
  names the version inside it, so the bar reads *Version: Archive · Archive:
  Desktop V1*. Stepping out to a current design and back returns to the version
  you were reading rather than to the top of the list, and a hash aimed
  straight at an archived mode sets both halves, since they are set from the
  mode rather than from whichever control was touched.
- **Bio visual** — Iris or Sphere, and only on Mobile V7. The biological age
  slide is the one reading in the carousel with a choice of figure, so the
  choice is resolved where the cloud is picked rather than written into the
  row: `PILL` is the table every surface reads, and editing it would carry the
  sphere onto the dashboards, the library and the concept pages, none of which
  offer it. The sphere is a fluid rather than a stipple: the material itself
  travels, on a bounded sway a sixteenth of the radius wide and three clocks
  that share no factor, so the volume is always in slow motion. It is a
  function of time rather than an integration of one, so the dots move on
  closed paths and come back — nothing drifts out of the ball and nothing
  piles up, which an integrated field would not have left it. Damped to
  nothing at the rim, because a boundary that breathes is not a sphere. Over
  that, the currents are drawn in the shader here rather than in
  the library's 2D renderer — the same three-wave field, the same stable
  per-particle lottery, so a thinning region loses the same dots every frame
  instead of shimmering, and the shell is exempt so the boundary never comes
  and goes with the weather inside it. The iris's five-per-cent shrink belongs
  to the iris, not to the slot: the sphere is a ball drawn to its own radius,
  and shrinking it would leave the age slide smaller than the organs after it.
- **Refresh** — reloads the page. Everything the tweaks set lives in memory,
  so this is the way back to the page as it first drew: the states reset, the
  clouds rebuild and the reveals play from the top. The version travels in the
  hash, so it comes back to the page being looked at rather than the first one.
- **Coverage** — on or off. Off is not an empty state: there is nothing to say
  about a card the page does not carry and no action to offer, so it leaves
  and activity takes the width it was sharing. The row drops to a single
  column rather than hiding one of two, since an empty grid track keeps the
  gap it was there to fill. Desktop and mobile together.
- **Biomarkers**, **Biological age**, **Organ age**, **Activity** — each can be
  put in an *Empty* state on its own, desktop and mobile at once, and the state
  each control starts in is *Completed* rather than *Default*: the word says
  what has happened to the card, not which option the code fell back to. The two
  age controls are separate readings: the body is the biological age, the nine
  organs are the organ ages, and one says nothing about the other. Only organ
  age has a *Partial*, because only it can be partly read — a body is tested or
  it is not, so the biological age is *Completed* or *Empty* and nothing between.

  The empty states are designed. The **age** card is the card it always was:
  the same carousel, the same silhouette at the same size in the same place,
  and on the desktop the same list beside it — a missing biological age is not
  a missing page, the biomarkers are still read and the organs still have ages
  of their own. Only the reading goes: where the figure and its caption were,
  the body slide carries one line and one action instead, and the age scale
  fades out with the slide's own approach, there being no reading for it to
  point at. The body reads as a dash wherever else it is quoted, but it is not
  greyed the way an unread organ is — the silhouette is the same body, and only
  what is said about it has gone. **Activity** keeps its eyebrow —
  its sentence does not name the card the way the age card's does — and centres
  *Connect your wearables* and a *Connect* action on the card itself rather than
  on what the eyebrow leaves, which would sit low by half a label.
  **Biomarkers** is the age card's state in the hero: on V6 the slide stays in
  the carousel whether or not there is anything to report — a missing slide
  would be a missing subject — and only its contents change. The count and the
  three ranges go, the arc goes with them, the body loses its fill, and what
  takes their place is the same shape the age card's empty state has: a line
  saying what testing would show, a sentence under it, and *Get tested*. The carousel stands
  through it: emptying biomarkers empties the ages with it, so each slide says
  its own piece rather than the first one speaking for all three. On the
  dashboard, which has no hero, the card carries the same thing — the body
  drawn in the 2D view every other thumbnail in the file uses, since the one
  WebGL canvas belongs to the organ card — in place of the distribution, which
  goes with the reading: a blurred bar is a result held just out of view, and
  there is no result. The phone's own biomarker card keeps that teaser, since
  on V6 the card is in the hero and this state is the hero slide's. On the
  cards below, the distribution stays and the reading comes out of it: blurred
  and drained of colour, the band is a shape rather than a result.

  **Organ age**, emptied, stops saying nothing nine times. The nine organ
  slides collapse to one — *Organ age*, showing the brain (the cloud, not the
  label: *Brain + nerve* draws a neuron, and the brain itself is what *Mental*
  carries), with no heading over its two lines: the name strip under it already
  says what the slide is — so the hero
  carousel reads biomarkers, body, organ age, and that slide carries the same
  shape the other empty states do: *Discover how your organs are ageing*, a
  sentence, and *Get tested*. What sits at that slot is remapped rather than
  reordered, since `MB` is the order every other surface counts by. All three empty
  states are laid out as one thing rather than three: the same strip box, the
  same block height, and the action anchored to its foot, so however long the
  copy above it runs the button a reader is looking for is in the same place.
  The strip is 110px tall and a paragraph is not, so the box grows and its
  offset drops by half of what it grew — every slide's own centre, the body's
  number included, lands exactly where it did, and only the room around them
  changes. The block itself is lifted clear of the name strip below, by the
  same amount on all three, or they would stop agreeing.

  Neither age reading has a middle. The body is read or it is not, and the
  organs come back together or not at all — one panel, one result — so both
  controls are *Completed* or *Empty* and nothing between. Nor are they independent.
  An age is derived from biomarkers, and the body's age is the summary of the
  organs', so the three sit on one chain: biomarkers, then the biological age,
  then the organ ages. Emptying runs down it — no biomarkers means no age of
  any kind — and completing runs back up, since an organ age is only possible
  on a body that has been read, on a panel that has been taken. Neither runs
  the other way: a taken panel need not have produced an age yet, and a body
  can have its age while the organs are still coming in. Whichever control was
  touched keeps what it was set to.

  An arc is a reading, so a slide with no reading has no arc: the biomarker
  slide when the panel is untested, the body when there is no biological age,
  an organ when there are no organ ages. One rule across the carousel rather
  than a case per state, riding the swipe's own position so the arc leaves and
  arrives with the slide it belongs to instead of switching at a threshold.

  On the desktop, where there is no carousel, the same two notes stand exactly
  where the gauge stack they replace did, with the gauge stack hidden rather than
  removed: the organ is framed off the height the stack leaves, so taking it
  out of the flow made every organ jump larger the moment a note appeared —
  and a wide one, the immune cluster, ran off the card's edge. Hidden, its box
  stays, the note is drawn over it, and the organ is the same size either side
  of the switch. It does come down 48px over a note: a note reaches less far up
  the card than the gauge stack does, so an organ framed against the stack
  floats clear of its own copy. Both states are true at once when the organs
  are empty — that empties the body too — so the selection decides which of the
  two the card carries.
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

## Three inks, and opacity as anatomy

**Colour is random. Opacity is not.** That split is the whole treatment.

Every particle is one of exactly three values, dealt by an independent coin so
they fall through the cloud the way a speckled material does rather than
sorting into regions:

| | role | share | opacity |
|---|---|---|---|
| `#A34442` | the material | 60% | 20–50% |
| `#D09A96` | a lighter tone of it | 25% | 12–40% |
| `#F2E9E7` | warm off-white | 15% | 5–25% |

The ranges overlap, and **the brightest colour has the lowest ceiling**. That
is the rule that keeps fifteen percent of the particles from reading as
glitter: the off-white can never be the strongest thing on the page, only the
lightest.

### How many particles, and why so few

**5,200**, down from 9,000 in two steps. The cloud read as a filled 2D shape
rather than a volume, and the only fix for that is fewer particles: negative
space between them is what lets a reader see through the front layer to the
ones behind it. The library's own factor moved with it — one count, both
renderers — and the thinning is uniform, since the sampling is.

Depth carries 40% of the opacity score (up from 25%) and the z spread is a
quarter deeper, so front, middle and back separate instead of averaging into
a mass.

### The library is the source of truth

Every authoring decision about a particle lives in one place and is read by
both renderers — the WebGL engine the product pages use and the 2D painter the
library uses. Colour share, opacity grid, opacity bands, highlight share,
density, and now `DOT_BASE`, the number a particle's size is a multiple of.
The library's grain *is* the engine's grain because they read the same seed.

The two renderers stay separate implementations, because they must: the engine
morphs between organs on the GPU and the painter draws a still cloud on a
canvas. What they may not do is hold separate opinions. When they have — the
painter had its own five-step size formula, `0.9 + (i % 5) × 0.26`, and its
own alpha buckets — the library quietly showed something the product pages did
not, which is the one thing a reference sheet must never do.

### Density: a mask of holes, not a distribution

The question stopped being *how should particles be distributed over this
shape* and became *what should be cut out of it*. Those produce different
pictures: the first fills a silhouette, the second suspends a cloud in space.

**Three octaves of value noise**, at a tenth, a twenty-fifth and a sixtieth of
the shape, raised to a power so the low end spends longer near zero — that is
what makes the holes holes rather than thin patches. One scale gives even
stippling; three give regions that are open, regions that are full, and grain
inside both. The irregularity has to exist at more than one size or the eye
reads it as texture rather than as space.

**`bulk` runs 0.86 near a boundary to 0.22 deep inside one** — nearly four to
one, over a short falloff (`exp(−d / 4)`) so the gain is concentrated in the
first few pixels rather than spread across the whole depth.

**The power on the noise sum decides whether a reader sees variation at all.**
At `^1.8` the mask ran roughly 0.15 to 0.75 and the cloud came out looking
evenly dense everywhere — the variation was there and too shallow to register.
At `^2.7` the low end spends much longer near zero, which turns gentle
thinning into actual holes and makes the fuller regions read as fuller by
contrast with them.

**The flow layer is separated by grain, not by brightness.** It is held at 30%
so it cannot compete with the organ, which means the only thing left to tell
it apart is dot size: a stream of bigger, softer dots moving through a field
of fine still ones. Its dots were `1.15×` the tile's base — picked when the
cloud was twice as dense and had one size — and once the cloud went to five
sizes averaging above that, the flow had become *smaller* than the particles
it runs through, at the same opacity and in the same inks. Indistinguishable
by construction. `1.95×` now, 200 dots a tile rather than 120. `d` is the distance to the nearest boundary, so the low end lands
exactly where a silhouette is a filled mass — the middle of a liver, the body
of a lung — which is where a projection piles up most and a reader learns
least.

**This is still not a perimeter ring**, and the reason is the order of the
multiplication: the noise mask applies to the boundary exactly as it applies
to everything else, so the denser edge arrives with the same holes cut through
it. A ratio decides how much survives; only an *unbroken run* of it would be a
line.

Note what a rejection test can and cannot do: it decides **where** particles
land, never **how many**. Every density change is therefore two — the ratio
here, and the count.

**Nothing prefers the perimeter.** The boundary keeps more than the middle
only because `bulk` takes less from it, and the noise cuts through the
boundary as readily as through anything else — so the outline arrives broken
rather than as a ring. That is the distinction the earlier versions kept
missing: an edge that is *denser* and an edge that is a *line* differ only in
whether anything is allowed to interrupt it.

The count is **5,000** — down from 9,000 over four steps, then back up as the
core and then the edges were asked for more. Measured in the library: brain
3,271 points, lungs 2,612, nerve 1,329. Recognisable, with black space
between and behind the particles rather than a filled shape.

A shape's own `dens` function still applies on top — that is its say in which
of *its* regions gather particles, which is not an edge bias.

### Five particle sizes, unevenly weighted

`0.7× / 0.85× / 1× / 1.15× / 1.3×`, weighted **18 / 24 / 30 / 18 / 10** — an
even split across five is its own kind of regularity, and the middle of a
range is where a material's grain actually sits. Nothing between them, the
same discipline the opacity has.

Depth is applied on top, in the vertex and in the 2D painter both, so a dot at
the front of a volume is drawn about half again the size of the same dot at
the back. Size, opacity and position then all say the same thing about where a
particle is: front is larger and occasionally bright, back is smaller and
almost always faint.

### Opacity: eighteen values, and nothing between them

Every dot in the file lands on one of **5% / 10% / … / 90%**. Not approximately
— measured on a live page, the painter emits exactly 18 distinct alpha values
and none of them is off the grid.

That takes two snaps, not one. Once where the opacity is authored, and again as
the **last line of the vertex shader**, because a particle authored at 30%
passes through the twinkle, the verdict, the vessel fade, the theme lift and
nine other factors before it reaches a pixel, and every one of them would land
it between two steps. A dot below half a step is drawn at nothing rather than
at the floor, which is how a fade reaches zero without leaving a residue.

The 2D painter's fill buckets **are** the grid — 20 of them — and `dot2D`'s
two-disc soft edge is gone from the batched path for the same reason: a soft
edge is two fractions of an alpha, which is two values off the grid for every
dot on it.

**90% — the subtle system.** Each ink over its own band, ranked by structural
score so opacity still says something about where a particle is, with a `^1.6`
curve that favours the low end:

| | band | most of them |
|---|---|---|
| `#A34442` | 20–50% | 20–30% |
| `#D09A96` | 15–40% | 15–25% |
| `#F2E9E7` | 5–25% | 5–15% |

**10% — depth highlights, 55–90%.** Chosen for frontness, but with more than
half their score their own draw, so they scatter through the near face instead
of condensing into a sheet at it — a sheet is a surface, and a surface is the
thing a highlight is meant to let you see past. Sorting the cloud and taking
the top slice fixes the share at exactly 10%; ranking that slice by frontness
puts the strongest on the nearest points. They are the only thing in the cloud
above half.

Ambient strays sit at the floor, 5%.

### No GPU is not a dead page

A browser refuses a WebGL context for reasons that have nothing to do with the
machine being able to draw — too many live contexts across tabs is the common
one, a blocklisted driver the next. The page used to `return` at that line and
stop entirely: no pages, no carousels, no cards, one sentence.

It now asks four times (`webgl`, `experimental-webgl`, each with and without
antialias — a context can be refused for antialias alone on a machine short of
GPU memory), and if all four fail it runs the engine against a **stub that
accepts every call and draws nothing**. Every page, carousel and card behaves
exactly as it does with a GPU, and the organ is painted by the 2D renderer the
library already uses, mounted inside whatever slot the canvas is in — so
`setMode` moves it by moving the canvas, and it needs to know nothing about
the modes. It carries the same cloud, the same three inks and the same opacity
grid; what it does not carry is the morph between organs, which is the
engine's.

### Nothing above its ceiling

The cap is enforced twice: once where a particle's opacity is authored, and
again as a hard `min` at the end of the vertex shader, because a dozen factors
multiply into alpha between those two points and tuning each to stay under
would be a guarantee that quietly stops holding the next time one changes. The
2D painter clamps at the same values, and `dot2D`'s two discs were re-weighted
from `0.34/0.82` to `0.30/0.76` — the old pair composited to `1.02×`, which
would have put a dot over its ceiling by way of its own soft edge.

There is no gain and no separate depth term in the cloud's chain any more.
Both existed to put back what a long run of fractions took out; now that the
authored value already carries the ramp and the ink's range, what remains
modulates around 1 rather than under it.

### The flow runs at a flat 75%, on its own alpha path

Raising the flow under the cloud's shared ceiling did nothing, and it is worth
saying why rather than shipping it and hoping: its dots were already pressing
against 50% for most of a run, and measured, `×1.5` under the shared cap moved
the rendered organ by **0.2 of a level**. Raising a layer that is at a ceiling
means raising the ceiling.

It is now authored at `0.75` outright. What still varies on it is only what
makes it a stream rather than a set of lit dots — the fade at each end of a
loop, so nothing pops, and the depth softening, so a dot behind the volume
reads behind it. The presets' own `op` and `tone` no longer scale it; they
still decide the paths, the pace and the turbulence, which is what they were
for.

And it takes **its own path through the shader**. The cloud's alpha is a
fraction of a fraction thirteen times over and needs a `2.15` gain to arrive
where it was authored; the flow's is authored at the value it should render
at, so it takes none of that — only the visibility fade it rides in on, the
page's alpha, and the theme lift. Running a layer specified at 75% through the
cloud's chain is how it quietly arrives on screen at 40.

### The library draws at the engine's density

`dotTarget` returns the number of dots that holds a constant on-screen *gap*,
which is the right answer for a thumbnail and the wrong one for a reference
sheet: the engine draws all 8650 organ particles, and side by side the library
read as a thinner organ, because it was one. Both the immersive view and the
library now take `fullTarget` — `dotTarget × 3.06`, one constant, one place.

That is five thousand dots a tile across nine tiles, and it took the page from
6fps to 53. Four changes, in order of what each was worth:

- **Deal the dense views into rotating slots.** A time gate does not help,
  because when a frame already takes 50ms the gate always passes — the work
  has to be *spread*, not deferred. One group of three paints per frame, so
  each tile still updates several times a second, which a slow drift cannot be
  told from, and the page keeps its own frame. Worth 2.6×.
- **Squares under five device pixels.** A filled square and a filled circle
  are the same two or three lit pixels at that size, and a rect costs a
  fraction of tessellating an arc. Worth 2.3×.
- **One shape instead of two below `r = 2.2`.** `dot2D` draws each dot as two
  discs for a soft edge; on a dot four pixels wide that edge is one pixel doing
  nothing. Worth 1.25×.
- **Batch by colour and quantised alpha.** A canvas pays for the `fillStyle`
  write and the `fill()` call, not the geometry, so ten thousand fills become
  at most ninety-six. Worth nothing on its own here — the loop, not the
  rasteriser, was the bottleneck — but it is what makes the other three
  expressible.

### White did not work on a light ground, and could not be made to

This is the one place the treatment costs something, and it is structural
rather than a tuning problem. Half the cloud is `#FFFFFF`; the light theme's
card is `#ece7e2`. Fifteen levels of lift is not a particle, and no amount of
alpha invents contrast that is not in the difference between two colours.

This was the reason the highlight moved off pure white, and it is worth
keeping the note: half the cloud at `#FFFFFF` on a `#ece7e2` card is fifteen
levels, and **alpha scales a contrast, it does not create one**. `#BC6654`
carries on both grounds, so the light theme is no longer paying for a third of
its particles saying nothing.

Measured at the even white split, on
a library tile: **27 levels of deviation from its card against the dark
theme's 29** — the two grounds are close now, which they were not at the even
split, because there is simply less white to lose. The single-ink treatment
managed 52 and 34; both are softer than that on purpose.

The alpha lift is pushed to its knee (`×3.2` in the shader, `×1.60` on the 2D
tiles). Past that the extra contrast arrives entirely by dots pressing against
the 50% ceiling, which buys a level or two by flattening the opacity range the
whole treatment is built on. The only real fix would be a second value for the
light theme — the page's own dark instead of white — and that is a third
colour, so it is a decision rather than a repair.

### How exact "two colours" is

The painter never sets a third fill: hooking `CanvasRenderingContext2D.fillStyle`
for a whole session on the library page returns exactly two rgb values —
`163,68,66` and `255,255,255` — plus the `#fff` the offscreen silhouette mask
is rasterised with, which is a bitmask read back as coverage and never drawn.
The same hook counts them and measures the ceiling: **36% white, and no fill
above `0.500`.**
The SVG export is exact by construction: one `fill` per dot, opacity as a
separate `fill-opacity`.

A rasterised PNG carries intermediate values, for two reasons that are both
about the format rather than the palette. Overlapping dots of the two inks
composite, which is the treatment working. And canvas keeps 8 bits per channel
**premultiplied by alpha**, so a pixel at 2% coverage — the antialiased
boundary of every dot — has almost no colour information left in it:
`rgba(163,68,66,0.02)` drawn on a blank canvas and read straight back comes
out `153,51,51`. Open the SVG if you want to read the two values off the
source.

## Light is the same figure, not a second one

Every per-particle value in the shader was tuned against black, where a dot at
a sixth of full still reads. On a light page the same alpha buys almost
nothing: measured on the biomarker slide, the body sat 28 levels off a dark
ground and 6 off a light one — the same cloud, and only one of them visible.

The fix is not a light-mode treatment. That would be two pictures to keep in
step, and they would drift the first time either changed. It is one shader
with the ground's own arithmetic undone by the uniform that already knows
about it — and the colour half of that rule has since gone away entirely. The
light theme's transform went from a dark ink, to the same colour darkened, to
the same colour 30% desaturated, to nothing at all. What is left is alpha —
now `×3.2`, most of which is spent covering for the white third of the cloud
having nothing to say on a pale card (see above).

The order mattered while there was still a colour transform to order. It ran
before the biomarker reading, so the reading painted over it and the light
theme came back as a pale wash on pale paper; moving it **last** fixed that,
and three mode-specific substitutions came out along the way — the biomarker
fill's sage recolour, the cooler verdict's warm-dark halo, and finally the
desaturation itself.

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
