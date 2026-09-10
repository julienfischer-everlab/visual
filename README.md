# Particle Organs — Organ Age concept

A living particle-anatomy prototype for Everlab: a single WebGL particle system (~9,000 points) morphs between ten anatomical silhouettes, explored through eighteen switchable experience modes with three themes. Everything ships as **one self-contained HTML file** — no dependencies, no external requests. There is an optional build that makes the same file half the size; the source runs as it is.

**Live:** https://particle-organs.vercel.app

## Run

Serve `index.html` from any static server (or just open the file):

```bash
python3 -m http.server 8734
```

## Build (optional)

`index.html` is the file people read and edit, and about a third of it is
explanation: the comments in the CSS and the JS are the design's reasoning,
kept where the decisions are. That is the right shape for the source and the
wrong shape for the wire. `tools/build.js` writes `dist/index.html`: the same
page, with the stylesheet through csso and the script through terser, and the
HTML comments stripped. Nothing else — no number the design landed on is
touched, the shaders (template literals) pass through untouched, and the
regression probes read the same on both files.

```bash
cd tools && npm install && npm run build
```

| | source | dist | gzip source | gzip dist |
|---|---|---|---|---|
| `index.html` | 632 KB | 324 KB | 185 KB | 88 KB |

The build is not where the runtime cost is. The engine's frame is under a
millisecond of JS; the library's is the 2D painter's sixty thousand dots a
frame, and that is drawn as fills of at most sixty `Path2D` buckets per tile
(colour × the 5% alpha grid). The one runtime change made alongside the build
is in that batching: the bucket key is a small integer now (ink id × steps +
step) rather than a string built and hashed per dot, so the sixty thousand
string allocations a frame are gone. Verified pixel-identical to the old
batching on the same dots (`batcheq.js`, max channel difference 0).

What would actually make the page smaller is removing the archived modes
(Desktop V1–V4, Mobile V1–V5 and the rest of m0–m15). That is most of the code
and none of the current design — and it is a product decision, not a build
step, so it has not been made here.

## On a phone

**Mobile (viewport)** in the version menu is the mobile design filling the
browser's viewport with no drawn phone around it, for testing on an actual
phone: the mock-up's shell, bezel, side buttons and drawn status bar are the
device's own job, so they go and the page fills the screen, safe areas included.
It is an entry rather than a mode — Mobile (`#m20`) wearing the full-screen
flag — so the class chain and everything keyed on the mode stay one thing.
Picked from the bar, the bar stays (it is how you get back); opened by its own
hash, **`#m20v`** (or **`#m20vd`** to open with the Dots biomarker graph), the bar is gone and the design has the whole screen, which is
the link to send to a phone.

`/phone` is the older route to the same thing for Mobile V6: `vercel.json`
rewrites that path to `index.html`; anywhere without the rewrite, `?phone` on
the URL does the same, and `&bar` keeps the tweak row for trying the empty
states on the device.

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
| `tools/build.js` | Optional build: minifies `index.html` into `dist/index.html` without changing what it does |
| `dist/index.html` | The built copy — half the bytes, the same page (regenerate, do not edit) |
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
9. **Mobile** — bento layout with the mini organ carousel, metrics carousel and the signal insight sheet. The organ card used to open an organ-age sheet on tap; a tap now does nothing, and the card is a thing to swipe and to look at. Below the filter chips the biomarker list runs to seven groups and twenty-five readings, with a **search** under the chips. The search bar is sticky: it pins under the status bar (the hour, the battery) on the phone's own ground as the list scrolls, so it is always there to tap. Focused, the page scrolls up to it and the main navigation leaves while the keyboard is up — on the device the real one, in the frame a drawn iOS keyboard that slides up from the bottom edge, and back down when the field lets go, whose keys type into the field; typing shows a short skeleton (the list's own rows, every text line and pill a shimmering bar, so the swap to results moves nothing) and then filters the groups by name, with an empty line for a miss; the cross clears the text and nothing else — no scroll, no change of focus; a scroll by the reader lets the field go, so the keyboard drops, and a tap brings it back. The results area stays screen-tall only while the field is focused, so the page is never longer than its content once the keyboard is gone. The tab bar keeps 18px plus the safe area above the home indicator, and in the frame draws the indicator itself, white at 26% (black at 24% in light)
10. **Mobile V2** — the same bento re-laid out to the design: biomarkers and biological age as a pair of figures at the top, health coverage beside a week of steps below, then organ age wide and shallow beneath them — its name and tag down the left, the organ standing in the right half. Wears `m5` plus a `v2` marker.
11. **Mobile V1** — the bento folded down to two blocks. The hero is a plain card carrying biomarkers and health coverage as two figures, with the meter beneath doing the work the dial used to. Below it, steps and organ age stand side by side and close the same way: label, value, visual, a rounded status tag, then the dots — same sizes on both, so the two carousels read as one control. Wears `m5 v2` plus a `v3` marker.

12. **Desktop V3** — V1's dashboard with its insight header lifted onto a ground of its own: the hero, steps and organ cards sit inside one `#1c0505` panel on `#280707` cards, over a page that stays light. Wears `m2 b2 b3` plus a `b4` marker.
13. **Mobile V3** — the same idea on the phone: the status bar, the title and the bento share one coloured region running to the screen edges, and the records list below it sits on white. The two are layers rather than sections — see below. Wears `m5 v2 v3` plus a `v4` marker.
14. **Mobile V6** — V5 with the biomarkers folded into the hero, and the whole reading 16px higher: the visual by the uniform, the arc and the age strip by their own offsets, the caption travelling with the number it hangs from, the name strip staying where it is. The organ silhouettes sit a further 16px up, on the organ slides only; the body on the biomarker slide is drawn 8% smaller than it was (1.196× rather than 1.30× the organs' framing) and 16px higher, so it stands clear of the arc. The arc's ends dissolve: past the middle 60% of the scale the ticks blur by steps, to about 3px on screen at the very ends, on top of the side fade — on every arc the pages draw, the library card's included. The header carousel gains a slide in front of the organs: the total where the age sits — a fifth smaller than the age, being a count rather than a reading — the three ranges under it in place of the younger/older caption, and the arc reading the optimal share instead of an age scale, revealed left to right once the slide lands. One band rather than three: the whole distribution in the meter's colours put a run of amber and a run of red across the top of the page under a headline count, which is three verdicts on a slide that is not making one. The split belongs to the bar beneath the counts; up here the reading is how far the green reaches, and everything past it stays unlit rather than being called something. It runs to the same figure as the fill rising through the body on this slide, off the same constant, so the two cannot drift apart. It is not an organ, so it sits at index −1 rather than inside `MB`, and its halo gives way as the swipe carries it in. The header is the backdrop the body rises over, not a surface to be scrolled: a swipe up belongs to the content under it, so the header keeps the horizontal axis — the carousel's — and gives up the vertical one. `touch-action` settles the finger; a trackpad has no gesture for it to honour, so the wheel is turned away by the same rule. The gesture belongs to the surface rather than to the card drawn on it: on the hero layouts the carousel *is* the header, so the whole of it takes the swipe — the title row, the silhouette, the arc, the figure, the caption and the names — and only what is meant to be pressed keeps its press. Elsewhere the card is a tile among others and keeps the gesture to itself. The first slide shows the **human body** and the second the **iris**, so that step changes the figure and nothing around it; the iris is drawn a twentieth smaller than the body's rule gives it, blended in over the swipe. Every slide names itself as an age — the organ's own name plus the word — except the entry that already carries a name of its own and the biomarker slide, which is a count rather than a reading. Two places write that strip, so the rule lives in one. The body is drawn a third larger than the organs and rides down by what it grew, on both of its slides — the scale only comes back out on the step to the first organ, where the framing was going to change anyway. The organs ride down too, by less: nothing zoomed them, but the hero has been lifted for the body's sake and it left them a quarter of the canvas above its centre. Every slide's mass now sits on the same line, so the carousel stops stepping up and down as it goes.
15. **Mobile V7** — Mobile V6 again, as somewhere to diverge from. It is an index and a marker class, not a copy of anything: the class chain is cumulative, so `m20` wears every rule V6 wears and starts differing the moment something is written against `v8`. Wears `m5 v2 v3 v4 v5 v6 v7` plus a `v8` marker.

On the biomarker slide the body is a **vessel being filled**, not a body being coloured. Below the front the particles are dense and at full strength; they do not change colour, because the two they are drawn from say nothing about the reading. The front stops at the **optimal share** rather than covering the figure: how high it reaches is the reading, 81 of 124 being two thirds of a body and not all of it. Above it the cloud does not simply dim — nearly every particle in the volume goes, and what stays is the shell. The edge attribute each particle already carries runs high on the silhouette and low deep inside, so keeping by it leaves an edge nobody drew: the body is still legibly there, visible the way glass is, by its rim rather than by an outline, The empty half reads as a container rather than as the same body dimmed because of how little of it is left, not because anything is tinted. The handover is a band a tenth of the body deep, because a fill in a silhouette fails at exactly one place — a visible horizontal edge — and the particles the lottery took fade back in across it rather than switching on. The strays that sit outside the silhouette stay, since a vessel drawn to the pixel would stop being a particle system. Leaving that slide the fill drains over a span of its own, slower than it arrived — it used to ride the morph's curve directly, and that curve spends most of itself in the first fifth of a three-second dissolve, so the fill left and the particles came back inside half a second and then nothing happened for two and a half more: a flip, not a fade. The fill rises on the same cue and over the same span as the arc's sweep — they are one reveal of one reading, and running them on two clocks left the body still filling long after the meter had finished. The cue is the release: the arc is a reading rather than a scrubbable control, so it commits with the swipe and then fills at its own pace instead of waiting out the silhouette's three-second dissolve. The three ranges below carry the split, so the body itself never needs to carry three readings; the counts live in one object that both the legend and the fill height are read from, since a number typed into the markup and a number typed into the shader would be two places to change one fact. Neither does it morph under the finger: the strips track the drag, the silhouette holds the slide the swipe picked up and only breaks apart on the release, which is the physics every other step of the carousel already had. V6 opens on that slide and holds it against the five-second cycle, since it is the page's headline. The card it came from leaves the body: it is in the hero now, not below it. Wears `m5 v2 v3 v4 v5 v6` plus a `v7` marker.
15. **Desktop V5** — Desktop V1 reading the organ the way the phone does. The organ card carries Mobile V5's stack — the arc, then the age at the size the phone sets it, then the difference in words directly under the number — and that difference stops being a tag: a pill is a status, and V5's whole point is that the figure states the verdict while the words only spell it out, in the same grey whichever way the delta runs. The hero says what the phone's hero says, figure for figure: biomarkers, then the count of the panel still untested rather than health coverage — coverage has a tile of its own further down. The untested figure reads at half opacity, a count of what is missing standing back from the count of what is there. The card carried one action, *Get test*, at the right; it was removed on request and the card has no action now. The steps card already read the same on both. The page is two even columns: biomarkers over the pair on the left, the organ alone on the right. V1 gave the organ the wider half and folded the pair into one full-width tile, because coverage had moved into its hero; V5's hero carries untested instead, so coverage takes its own tile back and the two stand side by side in the phone's order — coverage, then steps. The organ list holds its longest row on one line at the narrower card by taking a larger share of it (51%, against V1's 46%), and the organ takes what is left. The dot that starts each row sits on the eyebrow's own left rule rather than a row's padding in from it -- nothing else on the card stands on that line, so the inset read as a misalignment. The list follows the design's one rule: the eyebrow (*Biological & organ ages*), the dots and the names all stand on that left rule, every row carries its age dim beside its name, and the highlight -- hover and selected are the same state -- is a pill on a 12px radius (it was fully round; "less radius") that overhangs the column by the same 14px on both sides. The eyebrow keeps the head of the card and the list sits at its foot, inset from the bottom by what the eyebrow is from the top, with the slack above it. On the right, the arc's ends are blurred like every arc's, so they dissolve before the card's edge, and the difference in words sits 12px closer under the number than it did. It was a band cut off flush at the card's left edge and ending flush with the figures for a while, with only the selected row showing its age; the design drew it otherwise, and the design is the rule. The halo is a dark-theme thing on both platforms: it is light thrown on a surface, and on the pale ground it read as a coloured stain sitting on the page rather than as light, so the light theme carries none. The phone's light sits on the card too: the same stop list, the geometry scaled off the card's width the way the phone's is off the screen's, and the same slow breath. It is centred on the organ rather than on the card, since the list has the left half and a light centred on the card would sit beside the thing it is lighting. Its colour is the phone's — green while the organ reads younger, orange once it reads older — taken here from the eased warmth the cloud is already tinted by rather than from a carousel position. The card's corner carries the phone's share button in place of the expand arrows. Its own eyebrow reads *Biological age*, at the biomarker card's size and in its grey, so the two titles on the row are one thing said twice rather than two treatments. The organ is drawn a fifth larger than the other dashboards and sits 64px lower in the card, and the stack follows it down by less than it moved — 48px for the arc, 24px for the age and its caption — so the three close on each other as they fall. Those are transforms rather than margins: `resize()` bottom-aligns the stack off its own `offsetHeight`, and a margin would grow that height and shunt the block back up by what it was just given. The cards are the phone's cards exactly: 6% white, which paints `#0f0f0f` — a card that lifts off the page rather than standing on it. A wash is a relationship to what is behind it, so two pages can only share a card colour if they share a ground; the dashboard's `#0d0d0c` goes black here, the way the phone's body is black on this page. Thirteen levels, invisible in itself, and it is what makes the two identical. The canvas clears to the same value, or the organ would sit on a visible rectangle. Wears `m2 b2 b3` plus a `b5` marker.
    The **organ-age sheet** (the phone's bottom sheet and the desktop modal, one component) draws the Library's organ at the tile's own density, and the organ itself swipes like the cards under it; on the phone a downward pull on it still dismisses the sheet.

