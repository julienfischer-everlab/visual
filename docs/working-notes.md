# Working notes

Context distilled from building this prototype: what the conventions are, why
the design landed where it did, and which parts have already bitten. The
[README](../README.md) describes *what* the thing is and how the engine works —
this is the part you need before you change it.

---

## 1. The shape of the file

One `index.html`. Engine, every page, every theme, every control. No build, no
dependencies, no external requests. That constraint is the point: the prototype
has to open from a file, an artifact, or any static host and behave identically.

Consequences worth knowing before editing:

- **One WebGL context, one canvas.** `#field` is moved between DOM slots by
  `setMode()` — it is never duplicated. Anything that shows an organ *besides*
  the current page uses `makeOrganView`, a 2D-canvas renderer drawing from the
  same point cloud.
- **`MODES[]` is index-stable.** The array index is the page id, it appears in
  `body.m<N>`, and the version dropdown's `value` is that index. Removing an
  entry renumbers everything downstream — see §5.1 for what that broke.
- **Edits are made by script, not by hand.** The file is ~300KB; the edits in
  this history were applied by small Python scripts that assert on an exact
  match before writing. An assert that fails writes nothing, which is the
  desired outcome — a silently-partial edit to a file this size is expensive to
  find.

---

## 2. Pages, and the composite-mode convention

Fourteen pages in three dropdown groups: **Concept** (full-bleed explorations),
**Pages** (product surfaces), **Library** (the component workbench).

The variant pages are not separate pages. Each wears another page's styles
*plus* a marker class, and the markers stack:

| Page | `body` class | Reads as |
|---|---|---|
| Biomarkers · Desktop | `m2` | the original dashboard |
| Biomarkers · Desktop V2 | `m10 m2 b2` | the dashboard + the `b2` marker |
| Biomarkers · Mobile | `m5` | the original bento |
| Biomarkers · Mobile V2 | `m11 m5 v2` | the bento + the `v2` marker |
| Biomarkers · Mobile V1 | `m12 m5 v2 v3` | V2 + the `v3` marker on top |
| Biomarkers · Desktop V1 | `m13 m2 b2 b3` | the V2 dashboard + the `b3` marker |
| Biomarkers · Desktop V3 | `m14 m2 b2 b3 b4` | Desktop V1 + the `b4` marker |
| Biomarkers · Desktop V5 | `m18 m2 b2 b3 b5` | Desktop V1 + the `b5` marker |
| Biomarkers · Mobile V3 | `m15 m5 v2 v3 v4` | Mobile V1 + the `v4` marker |
| Biomarkers · Mobile V4 | `m16 m5 v2 v3 v4 v5` | Mobile V3 + the `v5` marker |
| Biomarkers · Mobile V5 | `m17 m5 v2 v3 v4 v5 v6` | Mobile V4 + the `v6` marker |
| Biomarkers · Mobile V6 | `m19 m5 v2 v3 v4 v5 v6 v7` | Mobile V5 + the `v7` marker |

**A dark island in a light page.** Where a block keeps the organ's ground
rather than the page's surface — the coloured organ card, and V3's whole
insight header — the type on it has to keep the dark theme's ink too, or the
light theme's near-black disappears into it. `syncDark()` puts an `.onDark`
class on those blocks and the ink rules live together at the foot of the sheet.
They have to be written at the weight of the rules they override, which is why
the same set appears three times: bare for the organ card, with `#phone
#mBento` for the phone (whose light rules carry two ids), and with
`.onDark.dgrid` for the dashboard (whose light rules carry b2 and b3).

A page's **label** and its **marker class** are different things and drift
apart on purpose. The pages built as V3 are labelled V1, because that is what
the design is called now; their classes stay `v3` and `b3`. Renaming a marker
would touch every rule written against it for no user-visible gain, and
renumbering a mode would rewire the renderer outright. Read the table above,
not the dropdown, to know which page a rule applies to.

A page's dropdown label says only its platform and version — the group above it
already names the page — so two entries read `Desktop` and two read `Mobile`.
Do not disambiguate them by name; the group is the disambiguation, and the
table above is how you tell which mode index is which.

The dropdown groups off `MODES[].group` and orders within a group off an
optional `sort`, because the product pages read best desktop-then-mobile, which
is neither the order they were built in nor alphabetical. `hero2` — the
two-card hero carousel — is currently set by no page; the mechanism is left in
place because V2's hero has now been a carousel and a plain card once each.

Predicates `isDash(v)` and `isBento(v)` exist so engine code treats a page and
its variant identically. Markup is shared and toggled with `.hiOnly` /
`.v2Only` / `.v3On` / `.v3Off` rather than duplicated, so the original and the
variant cannot drift.

A marker that names a *layout* rather than a page is worth splitting out.
V3 mobile wears `v2` for everything it inherits, so when the two-card hero
carousel was gated on `body.v2` it picked the carousel up with it. The carousel
now has its own `hero2` class, set only by the page that wants it. The rule:
if two pages share a marker and only one wants a behaviour, that behaviour
needs its own name — not a `:not()`.

The hero carousel shows how far this goes. The hero card is wrapped in a track
and a dot strip that fold away with `display:contents` on the original bento,
so the card lays out there exactly as it did before the wrapper existed. Under
`body.v2` — which V3 also wears — the wrapper and track become a real flex
carousel. The organ card is *moved* by `setMode` between the hero track and its
row rather than duplicated: one card, one canvas, one set of handlers.

The two variants differ only in the slide width. V2 holds the next card's
shoulder in view (`calc(100% - 44px)` with a 12px gap) so the swipe announces
itself; V3's hero carries coverage as well and runs edge to edge. The last card
still lands flush against the right edge rather than a full step further on —
`heroOff()` clamps the scroll to `scrollWidth - clientWidth` and interpolates
between the per-index offsets, so the final segment is simply shorter than the
others instead of leaving the gap showing as a sliver of page.

> The desktop variant's marker class is `b2` even though the page is now
> *named* V2. `v2` already marks the mobile page and both markers live on
> `<body>` — sharing the name would make every `body.v2` rule cross-apply.
> Internal name only; nothing user-facing says B2.

---

## 3. Design decisions, and the reasoning

**The organ ground is `#220606`, everywhere.** One colour for the burgundy the
particles clear to, on every surface that shows an organ — cards, sheets,
modals, full-bleed. It is set in CSS (`--bg`), in every `gl.clearColor`, and in
the 2D renderers' `dk`. Divergence here reads as a seam down the middle of a
card, which is what forced the unification.

**Chronological age is a control, not a constant.** The "Your age" selector
(30–40) is the origin for everything quoted: the arc scale redraws around the
new centre, and every organ age, delta and caption re-renders. Nothing hardcodes
40.

**Density is measured, not predicted.** Covered in the README; the reason it
belongs in a *design* note is that it is the difference between organs that
look like one family and organs that look like nine different techniques. The
nerve was 25% thinner than the rest at the same nominal density.

**The mini cards share one skeleton.** Both hero cards — Coverage and Steps —
are built from: label → value → a fixed-height `.hiViz` visual sitting on the
baseline → position marker on the card's bottom edge. Every slide of both cards
uses it. That is what makes the pair line up whatever slide each is showing;
without the fixed viz height they drift apart as content changes. Measured
across all slides: viz height 84px, viz bottom 168px (mobile) / 170px (desktop),
dot row 191px / 189px — identical between cards.

**One markup, both platforms.** The mini cards are the same DOM on desktop and
mobile; only their steering differs (arrows top-right on desktop, dots on
mobile, small dots on both). A card that behaves differently per platform
because it *is* different markup is a card that will diverge.

**The in-situ organ card is landscape.** The organ card takes its height from
the left column rather than a fixed value, landing near 4:3. It had been
standing up tall (1.12) against a reference nearer 1.38. The organ is
width-constrained by the list beside it, so height past that point buys empty
space, not a bigger organ.

**Copy is sentence-shaped.** Organ modal titles read "Your brain age is 40", not
"Brain". Labels are categories, headlines carry the sentence.

---

## 4. Verifying a change

There is no test suite. There is a Playwright harness pattern, and it is worth
following because the failure modes here are visual and silent.

Run a static server from the repo root and drive Chromium with swiftshader:

```js
chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-*/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
})
```

**Assert on evidence, not on absence of errors.** "Routes to `body.mN`" and "no
page errors" both pass while the wrong renderer runs. Check the thing each
renderer actually produces: positioned spatial cards, grid cells, placed
carousel items, a non-empty organ. That check (`render.js` in the scratch
harness) is what catches §5.1 class of bug.

**Measure geometry, don't eyeball it.** Gaps, clearances, alignment and drift
are all `getBoundingClientRect` questions. Screenshots confirm; numbers decide.

**Two traps in measurement itself, both hit in this history:**

- *Hidden elements measure zero.* A clipping check that walks
  `.hiSlide .lbl` reports every hidden slide as fine, because `display:none`
  gives `scrollWidth === clientWidth === 0`. Force each slide visible before
  measuring, then restore.
- *Layout settles after the event.* Sampling 120ms after `scrollTo` produced a
  −99px "drift" that did not exist. Wait for a settled frame before trusting a
  position.

**Sweep viewport widths.** Several bugs here live only in a band — see §5.3.
1150 / 1192 / 1300 / 1500 is a reasonable sweep for the desktop pages.

---

## 5. Traps already hit

### 5.1 Renumbering `MODES[]` silently rewires the renderer

Removing a page and renumbering updated the CSS and the branches that were
enumerated — and missed the frame dispatch (`version === 4/5/6`), the
auto-cycle branches, `updateFlowGrid`, and the camera-zoom ternary. Four pages
ran the *wrong renderer*; the mobile bento drew no particles at all. The smoke
test passed throughout.

If you renumber, grep for every numeric comparison against `version`, not just
the ones you remember.

### 5.2 The in-situ canvas sized off a hidden card

While the dashboard is hidden, the organ card measures **0 × 0**. `resize()`
landing in that window pinned the canvas to a 220 × 220 box in the card's
top-left corner — behind the organ list — with sub-pixel particles. The card
read as blank while the list and gauge rendered normally.

Now guarded: the dash branch bails out until the card has a real box.

### 5.3 The organ faded out in a narrow-window band

Particle size derives from the card's own width (`effDim / 700`). At a window
around 1150–1250px the organ column is ~224px instead of ~273px, dropping the
dot size ~20% and thinning the organ to near-invisible points. Everything else
on the card is DOM, so it rendered normally — the symptom read as "the visual is
gone", not "the visual is dim".

Now floored: `pixScale()` holds at 0.42 for the in-situ pages.

This one is worth internalising as a *class* of bug: **anything that scales with
a container has a width at which it disappears.** It never reproduced above
1280px, which is where all the checking had been happening.

### 5.4 A fixed-position canvas cannot chase a scrolling card

First attempt at "the organ floats when I scroll" was a rAF-throttled scroll
listener re-placing a `position:fixed` canvas. That can only ever be a frame
behind. The fix is structural: make the canvas, gauge stack and title
*children* of the card, positioned absolutely, and the browser carries them for
free.

### 5.5 A minimum width made the canvas wider than its card

`W = Math.max(220, slot.width - listW)` overflowed the card by 20–166px below
about 480px of card width. A floor that exists to keep something usable will
happily push it outside its container.

### 5.6 Export framing, not export fidelity

"The PNG doesn't have the same dots as the screen" was not a dot-count problem —
counts matched exactly. It was framing: a square 1920×1920 export of a 502×380
tile crops the sides and pads the top. Exports now keep the live proportions
and replay `view._lastT`, the last painted frame.

### 5.7 `paint()` cleared the ground it had just been given

`paint()` opened with `clearRect`, which wiped the background `exportCanvas`
had laid down — every export came out transparent. `clearRect` belongs to the
frame loop, not the renderer.

### 5.9 The bento carousel reads `PILL` through an order table, not an offset

The mini organ card leads with the body's own age. That used to be an arithmetic
offset — slide *i+1* was `PILL[i]`, and every control that crossed the boundary
added or subtracted one. Once the body became a real `PILL` entry the offset had
nothing left to encode, so it is now a lookup: `MB_ORDER` is the reading order
(body first, then the nine organs in `PILL` order) and `MB` is `PILL` walked
through it. Controls convert with `MB_ORDER.indexOf(pillIndex)` one way and
`MB_ORDER[slide]` the other. The rule is unchanged in spirit and worth keeping
in mind for any new control: **if it moves the carousel it is in MB units; if it
selects an organ it is in PILL units.** The gain is that a reorder is now a data
edit rather than an audit of every ±1.

`PILL` gains entries at the *end* for the same reason: the nine organs are
indexed by everything else in the file, and `MB_ORDER` carries the presentation
order so the data order never has to move.

### 5.10 Adding a tenth selection found the arrays that were still nine

`CARDS` (the concept carousel), `NOTE_POS` (the annotation anchors), `IM_DESC`
and `IM_ANCHOR` are all keyed by organ, and all four stopped at nine. Selecting
the body threw from three of them and rendered an empty description from the
fourth — but only after a mode switch carried the selection onto a page that
reads them, which is why the first sweep looked clean.

The split matters: `NOTE_POS`, `IM_DESC` and `IM_ANCHOR` describe *an organ*, so
they gained a body entry. `CARDS` describes *a concept card*, and the body
deliberately has none, so it stays at nine and its two live-index readers go
through `cardFor(i)`, which falls back to the body's `PILL` row. Same for
`setOrgan`'s carousel tail, which now no-ops when `buttons[i]` is absent. The
general shape: when a selection set grows, the arrays parallel to it split into
the ones that must grow and the ones that must learn to be shorter.

### 5.11 A fixed layer only covers the viewport it was sized to

`.dash` is `position:fixed; top:57px; bottom:0`, so it is exactly one viewport
tall no matter how tall the document is. Everywhere it does not reach — an embed
whose frame is sized to content rather than to a viewport, a full-page capture,
an over-scroll — the page behind it shows instead, and that page was the organ
ground: `#220606` in colour, `#f4efed` in light, against a dashboard that is
`#0d0d0c` / `#fff`. Light chrome over a dark hole, or a cream seam under white.

The fix is not to unfix the layer but to make the page agree with it:
`body.m2{background:#0d0d0c}` and `body.light.m2{background:#fff}`. Worth
remembering for any other full-bleed fixed surface here — the element's own
background is only half the ground.

### 5.12 A throw in the render loop used to end it for good

`frame()` scheduled its own next frame at the *foot* of the body, so anything
that threw above that line meant no further frames — ever. The page kept every
piece of its chrome: the sidebar, the list, the age, the badge. Only the organ
stopped existing. That is indistinguishable from a layout bug, and it is what
was behind two separate "the visual is missing on the right" reports; both times
I went looking at geometry.

The loop now schedules first and runs its body under a guard, so a bad frame
costs a frame instead of the session, and ~1.5s of consecutive failures raises
the `.nogl` notice rather than leaving a silent hole. Worth applying to any
self-scheduling loop here: **schedule, then do the work.**

### 5.13 Moving a node back needs a placeholder, not a remembered sibling

V4 borrows five cards and the organ card from the bento and hands them back
when any other page loads. The first cut recorded each node's parent and next
sibling and restored with `insertBefore(el, next)`. It threw: the organ card is
relocated by `setMode` on its own schedule, so a sibling recorded as an anchor
can be in a different parent by restore time, and `insertBefore` rejects an
anchor that is not a child of the node it is called on.

Restoring in reverse order does not fix it — the stale anchor is a *different*
node's business, not a later sibling of the one being restored. What does fix
it is leaving a comment node standing in the gap and calling `replaceChild`:
a placeholder is inert, invisible to layout, and cannot be moved by anything
else. General rule for any borrow-and-return in this file: **mark the slot,
don't remember the neighbour.**

### 5.8 Rewriting a selector changed which rule won

Wrapping the mobile hero meant `#mBento > .msn:first-child` no longer named the
card, so its two rules were rewritten against a new `.mHeroCard` class. One of
them, `margin-top:auto` on the legend, silently stopped applying: `#phone
.legend` sets `margin-top:20px`, and the old selector out-specified it while
the new one did not. The legend unpinned from the foot of the card on the two
*untouched* mobile pages, which is exactly where nobody was looking.

It happened a second time from the other direction: `#mBento .msn` was written
to lighten the phone's header cards, and the id out-specified
`body.light .msn`, carrying the dark card into the light theme under dark type.
An id in a selector does not just make it *more* specific — it makes it win
against the theme overrides written without one, so a rule with an id in it has
to exclude the themes it does not mean, not leave them to override.

And a third time, symmetrically: `body.light #mBento .lbl` ties on specificity
with `body.light #phone .lbl` and lost on source order, so the light card kept
the old label colour. Written as `body.light #phone #mBento .lbl` it wins. The
general shape of all three: **in this file, specificity is the API.** Anything
that already claims a property claims it at some weight, and the only reliable
way to know a new rule takes effect is to read back the computed value.

Two lessons. Re-specifying a selector is a behaviour change, not a rename —
check what else claims the same property. And the way to catch this class of
regression is a **pixel diff against `HEAD`**: render the untouched pages from
`git show HEAD:index.html` and from the working copy, and compare.

Diff to a **mask, not a bounding box**. The cloud animates, so every diff has a
permanent floor; the question is only *where* it falls. A bounding box merges
disjoint regions, so one stray ambient particle at the far left stretches the
box across half the page and swallows a real regression inside it — which is
exactly how a stray dot strip at the foot of the bento went unnoticed here for
a commit. Paint the changed pixels red over a dimmed copy of the new render and
look at it: the particle noise is unmistakable, and anything else stands out.

### 5.14 A colour that never painted, and a blur with nothing behind it

Two failures landed together on the V4 header's halo and its bottom fade, and
both were silent — no error, just an effect that was not there.

The halo takes its colour from a custom property so the swipe can lerp it:
`--v4halo: 92 196 127`. Written into the gradient as
`rgba(var(--v4halo), .16)` it produces `rgba(92 196 127, .16)` — space-separated
channels followed by a *comma* and an alpha, which is not a legal colour in
either syntax. The declaration was dropped, `background-image` computed to
`none`, and the header looked exactly as it had before. The legal form mixes the
two the other way round: `rgb(var(--v4halo) / .16)`. When a var carries bare
channels, read back `getComputedStyle(el).backgroundImage` — an invalid colour
inside a gradient takes the whole declaration with it and says nothing.

The fade underneath is a progressive blur: two `backdrop-filter` layers, each
masked to start lower and hit harder than the last, with the tint on top. They
have to be **siblings**. An element that carries a `backdrop-filter` becomes a
backdrop root for its descendants, so a blur layer nested inside another one
samples only what is painted within its parent — which is nothing — and comes
out perfectly sharp. Stack the layers side by side under a plain positioned
wrapper that carries no filter, no opacity and no mask of its own.

### 5.15 The file rendered in a different mode than the thing it ships as

`index.html` had no doctype, so opened directly it rendered in **quirks mode**.
The published artifact is the same bytes wrapped in a shell that begins
`<!doctype html>`, so it rendered in **standards mode**. Every local check —
every box measured, every screenshot compared — was therefore made against a
document the user was never looking at.

It surfaced through a selector. A caption class written as `.v4AgeS` also
matched `.v4Ages`, because quirks mode makes class and id selectors
case-insensitive; the strip inherited the caption's `position:absolute;
top:100%` and hung off the foot of the header. In the artifact it would have
been fine, which is the worst version of the bug: broken only where it was
being verified.

The doctype is now declared, and the two agree. The layout it moved is small and
entirely inline line boxes — `.hiStat` from 15px to 18px, the overview tasks,
one desktop tag — all of which the published page had been showing all along.

Two lessons. **Verify the artefact you ship, not the file you edit**: if the two
differ by so much as a wrapper, say what the difference is before trusting a
measurement. And never distinguish two classes by case alone — the collision is
silent, and it only appears on one side of that gap.

### 5.16 Three ways the shader's own scope bit back

The organ's verdict tint lives in the vertex shader, and three separate requests
all turned out to be one line each in it — which is worth knowing before hunting
through CSS for a colour that is not there.

The tint was gated to the shell by `smoothstep(uOrgR * 0.45, uOrgR, …)`, which
sorted every cloud into a coloured rim around a palette-coloured middle. It
reads as two zones rather than one organ, and no amount of changing the colour
fixes that — the gate is what has to go, leaving the per-particle lottery to
scatter the verdict across the whole silhouette.

The theme is available in there as `uLight`, so a colour that has to differ per
theme is `mix(dark, light, uLight)` rather than anything in the sheet. And the
light theme's own re-ink runs *after* the tint, so white does not arrive as
white: it lands on 0.4 grey. Specify the light value, do not let the transform
guess it.

### 5.17 A uniform outlives the page that set it

The range fill is V6's alone, and it was set inside the bento frame, which also
resets it at the top — so within that page it was airtight. Then Desktop V5
showed a green-to-red body. Nothing on that page had asked for one.

A GL uniform is not scoped to the code that writes it. It belongs to the
program, and the program outlives `setMode`: the dash path draws with whatever
the last page left in `uRange`, and a visit to V6 was enough to tint every page
reached after it. The frame that *uses* a uniform can only be trusted to leave
it right for itself. The reset belongs one level up, in `drawFrame`, before the
branch — every path starts from a known value, and the one path that wants the
fill turns it on for itself.

Worth generalising: a per-page uniform needs a default written on the shared
path, not a reset written on its own. The bug only shows on the *second* page
you look at, which is exactly the order nobody tests in.

It happened twice. `bioArc` — the crossfade from the age scale to the
distribution — is a module-level `let` written only inside the bento frame, and
the arc block that reads it runs on every page. So the same visit to V6 left
every dashboard afterwards wearing the ranges instead of its own age scale, a
week after the uniform version of it was fixed. The reset trick does not help
here, because the writer runs *after* the reader in the same frame; what does
is asking the page rather than the variable: `const bioA = (isBento(version) &&
v7On()) ? bioArc : 0`. Shared mutable state read across pages needs a gate on
the reader, not just a default on the writer.

Then a third: `arcASvg.style.opacity`, written in the same bento frame to fade
the arc off a slide with no reading. V6 left it at 0 and the dashboard's arc
was simply not there. Same shape, same fix — the value is computed where the
carousel positions live and *applied* on the shared path, gated on the page:
`onHero ? arcFade : '1'`.

Three times is a pattern, so state it as a rule. **Anything the bento frame
writes to a shared object — a GL uniform, a module variable, an element's
style — is read by pages that never run that frame.** Compute it there if you
must; apply it where every page can see it, with the page deciding. And the
check that catches it is cheap: after touching anything a single page draws,
switch to a different page and look at it — the failure is never on the page
you were working on.

### 5.18 A family of ridges drawn one at a time cannot be a fingerprint

The Biological Age visual is a fingerprint, and it took three constructions to
get one.

**Each ridge as its own ellipse.** Every curve was a good curve and the family
was a scribble: two neighbours only need their wobbles to disagree by more than
the gap between them and they cross, and a print that crosses itself stops
reading as a print at any distance.

**Each ridge as an offset of one base loop.** That fixed the crossing — offsets
of a convex curve are parallel by construction, whatever the wobble does — and
it produced a clean nested family. It was still not a fingerprint. It had no
delta, and nothing filled the inside of the loop below the core, so it read as
an arch, or a keyhole, depending on where the ends were cut.

**Ridges as isocontours of one scalar field.** The field is the distance to a
core hairpin. Contours of a single field never cross, for the same reason as
before but stronger; they stay evenly spaced, because the field is a distance;
and where they wrap the end of the hairpin's short arm they close beneath the
core on their own — which is the delta, the thing that makes a print read as a
print rather than as rings. The wobble goes on the field rather than on the
ridges, so it bends the whole family together. Marching squares lifts the
contours out and an oval pad cuts them.

The general form: **when a shape is a family of curves that must not touch and
must relate to each other, author the relation, not the curves.** Offsetting
gets you as far as "they do not cross". A field gets you the structure the
family is supposed to have — the merges and the terminations included — because
the structure is a property of the field, not something drawn on afterwards.

### 5.19 Marching squares, walked one way, eats a corner

The print's ridges are contours, and contours come out of marching squares as a
bag of unordered segments that has to be linked into runs. The first linker
seeded on the first unused segment and walked forward until it ran out.

A seed lands in the middle of a chain as often as at its end. Walking forward
from a mid-chain seed takes half the contour and leaves the other half unused;
that half is re-seeded later facing a neighbour that is now used, so it dies
after two or three segments and is dropped for being too short to draw. The
result was a wedge of missing ridges — always in the top-left, because the
scan is row-major and the failure happens where the scan starts.

It read as a bug in the *shape*, and two rounds went into the geometry looking
for it. It was in the bookkeeping: the contours were right the whole time.

Link both ways from the seed and join. The general form: **when you rebuild an
ordered thing out of unordered pieces, a seed has two directions and you owe it
both.** And a wedge of anything missing in the same corner every time is a scan
order confessing, not a shape.

### 5.20 A layer that was drawn everywhere except where it was wanted

The print's signals ride the flow slice, which lives past `FSTART` in the same
buffers as the cloud. Every frame it was updated: packets spawned, positions
written along the ridges, colours uploaded. A probe on the buffer showed all of
it working. Nothing appeared on the phone.

The hero draws the cloud out of the static pair buffers, and it asks for
`[0, N)` — every particle except the flow slice. The concept modes draw the
whole buffer and the spatial cards ask for the slice by hand; the hero, alone,
did neither. So the layer was computed sixty times a second and never reached
the screen, and every adjustment made to it changed nothing, invisibly.

What found it was wrapping `drawArrays` and printing the ranges: one entry,
`0+9000`, where there should have been two. Worth doing early — a layer that
does not appear is either not drawn or drawn wrong, and the draw log tells you
which in one line, where staring at the shader tells you neither.

The condition that then had to be right: the hero's pair is *this slide and the
next one*, never a slide twice. At rest the blend sits at zero and the B slot
contributes nothing, so it is the A slot that has to be the shape you are
testing for. Testing both was a condition that could never be true, which
looked exactly like the bug it had just replaced.

### 5.21 The table that is still ten

5.10 records a table that was still nine the day a tenth selection arrived.
Adding the fingerprint, the human body and the iris as clouds ten, eleven and
twelve found `NOTE_POS` — the annotation offsets, indexed by organ index, ten
entries long — and it threw on the first frame that selected the new one.

It is the same lesson and it did not stick, so here it is as a rule rather than
a story: **when you add a cloud, grep for every array indexed by organ index
before you look at anything on screen.** There were four of them; three had
grown with the organ list because they were derived from it, and the one that
was written out by hand had not. Handwritten parallel arrays are the only kind
that can fall behind, and they fall behind silently until the index is reached.

**It did not stick the second time either.** The sphere was added as cloud
twelve and nothing threw, because a library tile is drawn by the 2D renderer
and never reaches `NOTE_POS`. The moment Mobile V7 could *select* the sphere,
the same undefined `.ax` came back — third time, same table, same message.

So the rule stopped being a rule and became code. `NOTE_POS` is now padded to
`ORGANS.length` at build time with a serviceable right-hand anchor, and the
handwritten rows above it still say where each figure wants its note. The
placement is a per-figure choice worth making; it was never worth a crash when
nobody had made it yet. **A handwritten table indexed by a growing list should
end with the line that fills it out** — the entries are the design, the length
is not.

There is a second lesson hiding in it: **adding a cloud is not what finds these
— selecting one is.** A cloud that only ever appears in the library is drawn by
a different renderer and clears none of the traps.

### 5.22 A random walk around a circle does not close

The iris's fibre bundles were placed by stepping around the circle, each step a
random fraction of the mean. Every step is fine and the mean is exactly right,
and the figure still comes out with one wide empty wedge: the steps are a random
walk, the walk accumulates drift, and wherever the drift happens to leave the
last bundle is a seam. It read as a lighting problem — one quadrant looking
under-exposed — which is what sent the first look at it to the density function,
where there was nothing wrong.

Place on an even partition and jitter inside the cell. The cell guarantees the
coverage; the jitter inside it does the irregularity that the random step was
there to provide. Same look, no seam, and the guarantee is structural rather
than something the numbers happen to average out to.

**Anything laid around a circle by cumulative random steps has this bug**, and
it is invisible in the code and obvious in the picture, at one angle only.

---

### 5.23 The control that only existed while there was something to control

Tablet M replaces Desktop V5's organ list with arrows either side of the age,
which is the only way to change the card's reading once the list is gone. The
arrows were hung off `#ageBig`, since that element is exactly as wide as the
digits and centred, so they keep their distance from the number whether it is
two digits or a dash — no measurement, and nothing to keep in step.

Then an empty state. `body.emAge .dash #organSlot > #pillui{visibility:hidden}`
takes the whole gauge stack down when a card has no reading, so the note can
stand where the figure was — and the arrows went with it. The slide with
nothing on it was the one slide you could not leave, on the one shell with no
list to leave by. Nothing threw; the sweep was clean; the page simply had a
dead end in it.

Restoring the stack's visibility and hiding everything in it except the arrows
worked and was wrong: the note occupies **exactly** the band the number was in
— that is the point of it — so the arrows came back on top of the copy. There
is no gap to move them into, because the two things are meant to be in the same
place.

The answer was a second place to stand, not a rescue of the first: a matching
pair positioned against the **card**, at the ends of the name strip on its
floor, shown only while a note is up. One pair or the other, never both,
neither of them measuring anything. **A control that lives inside a thing that
can be hidden is a control that can be hidden**, and the states worth checking
are the ones where the surface it belongs to is not there.

### 5.24 A theme fix that only reached one of the two renderers

The light theme's figure was measured, fixed and verified — on the shader.
There are two renderers. The library's tiles are 2D canvas, and they carried
their own light-mode rule from much earlier: `ink = [58,45,34]`, a flat dark
brown painted over every dot's own colour. Nine red organs rendering as grey
smudges, on the one page in the file whose entire job is to show what the
organs look like. The sweep was clean, nothing threw, and the surface I had
been screenshotting was the dashboard.

**A rule about how something looks belongs to the component, not to the
renderer that happened to be in front of you.** Grep for the concept
(`classList.contains('light')`), not for the code you just changed.

The second half of the note is about the fix itself. The shader's light path
was `desaturate ×0.16, then ×0.42 + 0.015` — a desaturation *and* a darkening,
both aimed at legibility. Splitting them showed the darkening was doing the
wrong job badly: multiplying an already-desaturated colour down destroys what
chroma is left (a red at 40% luminance lands at 17%, which reads as soot), and
at the coverage these dots actually paint it moved the composited result three
levels. Contrast came from the alpha lift the whole time. So colour is one
line now — the dark theme's colour, 30% less saturated — and alpha carries the
legibility, lifted 1.85 → 3.0 to cover what the darkening had been quietly
contributing.

Once alpha carried it, a third mode-specific substitution fell out: the cool
verdict's halo, sent to a warm dark under the light theme so it would not
vanish. Removing it made the light body read *redder and cleaner* than the
override ever had. **A compensation added when something was invisible should
be re-tested once the real cause is fixed** — it is usually not neutral, it is
just the least visible of the damage.

### 5.25 Taking the colours out found every place there were colours

The brief was one ink — `#A34442` on every particle, everything else carried by
opacity. The interesting part was not the shader line that sets it. It was the
inventory: a colour decision turns out to live in six places, and five of them
do not look like colour code.

- the palette the cloud samples per particle (the obvious one)
- the ghost outline's own pale warm, written straight into the colour buffer
- nine flow presets' `tone`, rewritten into the buffer every frame
- the signal layer's second tone, chosen per particle between ambient and packet
- the verdict tint in the vertex shader, plus the desaturation under it
- the 2D renderer, which is a separate painter with its own idea of all of the
  above

Grepping for the constant finds the first. Grepping for the *concept* —
`colors[`, `tone`, `rgb`, `mix(` — finds the rest.

**A distinction encoded in colour has to be re-encoded, not deleted.** Every
tone above meant something: an airflow paler than a perfusion, a signal packet
paler than the tissue it crosses, an organ ageing faster than you. Dropping
them would have quietly removed six readings. `toneA` reads a tone for its
luminance and spends it on alpha, which keeps each distinction at roughly the
size it had; the verdict became a straight alpha gain or loss, which is if
anything the more literal statement of what it means.

The second half of the note is about what a constraint costs elsewhere. One
ink is a fixed luminance, so it no longer averages out against either ground,
and three separate things had to be re-tuned to keep the figure weighing what
it did: the base alpha (the ink is darker than the old palette's mean), the
`edge` ramp (which had to be scaled as well as reversed, since it multiplies
alpha directly), and the light theme's lift (which had been compensating for a
desaturation that no longer happens). Measuring the tile and the organ against
their own grounds before and after is what kept that honest — by eye the first
attempt looked fine and was down a third of its contrast.

And one honest limit found by measuring rather than assuming: a canvas stores
8 bits per channel **premultiplied by alpha**, so the antialiased boundary
pixels of every dot cannot hold the ink exactly. `rgba(163,68,66,0.02)` drawn
on a blank canvas reads straight back as `153,51,51`. The fill is still one
value — hooking `fillStyle` for a session proves it — and the SVG export is
exact by construction, but "every pixel in the PNG is literally #A34442" is
not a claim the format can support, and it is better to say so than to let
someone discover it in a colour picker.

### 5.26 A colour that does not exist on one of the grounds

The brief after the single ink was two: half `#A34442`, half `#FFFFFF`, evenly
distributed, opacity doing the rest. On the dark themes it is exactly the
thing asked for — the cloud stops reading as one flat red material and starts
reading as a speckle with a bright element and a dark one to build depth
between.

On the light theme half the cloud is white on `#ece7e2`. Fifteen levels. That
is not a tuning problem and no lever in the file can fix it: **alpha scales a
contrast, it does not create one**, and the contrast between white and a
near-white card is not there to scale. The figure falls to the red half at
half the particle count — measured, 30 levels of deviation from a library
tile's card against the dark theme's 41, where the previous single-ink
treatment managed 52 and 34.

Two things worth keeping from it. **Push a compensating lever to its knee, not
past it**: the light lift was tried at 1.9, 4.6, 5.2 and 6.5, and past about
5 the extra contrast arrives entirely by dots clamping at full opacity —
buying three levels by destroying the wide opacity range the whole treatment
is built on. 5.2 is where it stops being worth it. And **name the limit rather
than quietly designing around it**: the fix is a second value for the light
theme, which is a third colour, which is a decision the brief did not make. It
goes in the reply and in the README, not into the file.

The general shape: a two-value palette is a relationship to a ground, not a
property of the artwork. One of the two will always be doing most of the work
on any given surface, and if a surface's own colour sits at one end of the
pair, that end stops existing there.

### 5.27 A ceiling on alpha has to be enforced where alpha ends, not where it starts

"No particle above 50% opacity" sounds like one number to change. It is not,
because alpha in this file is authored in one place and *finished* in another
with thirteen multiplications in between — the edge ramp, the twinkle, the
depth, the density lottery, the verdict, the vessel fade, the iris mask, the
theme lift, and five more. Several of those ran above 1 by design.

Two things follow, and both were needed:

- **Clamp at the end.** `min(A, 0.50)` in the last line of the vertex shader,
  and the same value in the 2D painter. Anything else is a guarantee that
  holds until the next time one of the thirteen changes.
- **Normalise the factors that ran above 1 anyway**, or the clamp does the
  damage the tuning was supposed to avoid. The edge ramp ran 1.00–1.59; under
  a hard cap its top third would clip flat and the core-to-edge gradient — the
  entire reason it exists — would disappear into the ceiling. Rescaled to
  0.62–0.98, and the biomarker slide's rim window rescaled with it.

The verdict needed rethinking rather than rescaling. It used to *add* alpha
for an organ reading older; under a ceiling, adding says nothing, because the
dots it would raise are the ones already against it. It now only subtracts:
older sits at the ceiling, neutral a little under, younger falls away. Same
three readings, read from below instead of from above.

And a gain, which is the part that is easy to skip. With every factor a
fraction averaging about 0.47, a particle authored at 25% arrives at 12% — so
a brief asking for "5% to 50%" gets a picture that lives in 2% to 24% and
reads as a mistake. `×2.15` before the clamp puts the authored range back
where it was authored. **A range specified at one end of a pipeline is not the
range that comes out of it**; measure the output, not the input.

Last, the soft edge. `dot2D` draws each dot as two discs at 0.34 and 0.82 of
its alpha, which composite to 1.02× — so a dot at the ceiling went over it by
way of its own antialiasing. 0.30/0.76 composites to 0.95×. A ceiling is only
as good as the thing that draws under it.

### 5.28 Raising something that is already at its ceiling

"Add opacity on the flow by 50%" looks like one multiplication. The flow's
dots were already clamped at the cloud's 50% ceiling for most of a run, so the
multiplication landed on a wall — measured, ×1.5 under the shared cap moved
the rendered organ by **0.2 of a level**. Raising a layer that is against a
ceiling means raising the ceiling for that layer, not the number feeding it.
Both, in the end: `min(A, mix(0.50, 0.75, flowP))` in the shader plus the 1.5
factor, so the parts of a run that were below the old cap rise by the same
proportion as the parts that were at it.

**Measure before shipping a multiplication.** The change would have looked
correct in the diff and done nothing on screen.

### 5.29 Two renderers, two densities, one "source of truth"

The library drew every organ through `dotTarget`, which returns the dot count
that holds a constant on-screen *gap*. The engine draws all 8650 particles.
Both are defensible; having both means the reference sheet for the component
shows a thinner organ than the component. `fullTarget = dotTarget × 3.06` is
now the one constant, taken by the immersive view and the library alike.

Then it ran at 6fps, and the profile was not where it looked. In order:

1. **Batching the fills by colour and quantised alpha** — the obvious win,
   ten thousand `fill()` calls down to ninety-six — was worth **nothing**. The
   bottleneck was the per-dot JS loop and the geometry, not the state changes.
2. **Rects instead of arcs** below five device pixels: 2.3×. At that size a
   square and a circle are the same lit pixels, and tessellating an arc is not.
3. **One shape instead of two** below `r = 2.2`: another 1.25×. `dot2D` draws
   a soft edge as two discs; on a four-pixel dot that edge is one pixel.
4. **Dealing the dense views into rotating slots**: 2.6×, and the one that
   mattered. A *time* gate did nothing — when the frame already takes 50ms the
   gate always passes. Work that is too expensive per frame has to be spread
   across frames, not deferred within one. Three of nine tiles paint per
   frame; each still updates several times a second, which a slow drift cannot
   be told from.

6fps to 53. **The optimisation that reads as obviously right can be worth
zero; measure each one separately**, or the three that did the work get
credited to the one that did not.

---

## 6. Open items

- **"Survey" vs "Questionnaire".** That slide's category label was shortened to
  *Survey* because *QUESTIONNAIRE* does not fit beside the arrows below ~1300px
  and was ellipsizing. The headline still reads "Complete your questionnaire".
  Reverting the label is one word, at the cost of the truncation.
- **The V2 reference designs are light-mode.** They are reproduced in the
  theme-aware palette rather than forced light; use the Mode selector to
  compare against the mocks.
- **Mock numbers differ from live data.** The references show bio age 32 and
  "118 All"; the prototype derives those from the "Your age" selector, so they
  will not match a static mock.
- **The organ-age modal does not close on Escape**, and stays open when the
  page is changed from the version dropdown.

---

## 7. Publishing

- **Artifact:** https://claude.ai/code/artifact/78766a66-729c-4942-8206-0acbcf4b8551
  — the live copy through this work. Republished from an exact copy of
  `index.html` (only `<title>` differs).
- **Branch:** `claude/zip-package-import-fzfsrp` on
  `julienfischer-everlab/visual`, pushed.
- Write access was refused for most of this work — `git push` returned 403 on
  `git-receive-pack` — so the history sat local and was handed over as a zipped
  git bundle instead. It was granted later and the whole branch went up at
  once. If a push starts failing that way again, the grant lives at
  claude.ai/admin-settings/claude-tag; the bundle is a stopgap, not a fix.
