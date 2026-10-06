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

### 5.30 A layer authored at one number, rendered at another

The flow was specified at 75% and, once the ceiling was raised to let it get
there, still arrived on screen at about 40. Nothing was wrong with the number:
it was being multiplied by the cloud's own chain on the way out — the twinkle,
the depth term, the gain that exists to undo the *cloud's* fractions.

**A layer whose alpha is authored at the value it should render at must not
share a pipeline with one whose alpha is a fraction of thirteen other things.**
The flow now takes its own path through the shader: `mix(cloudA, flowA,
flowP)`, where `flowA` is the authored value times only the visibility fade it
rides in on, the page alpha and the theme lift. Everything else in the chain
belongs to the cloud.

The same mistake had a second form on the 2D side: `themeA`, which lifts the
cloud against a pale ground, was multiplying the flow's authored 0.75 to 1.195
— over full opacity, silently, because nothing clamped it. Caught by hooking
`fillStyle` and printing the maximum, which is worth doing after any change
that moves a ceiling.

Also worth recording: **once fills are batched, counting `fillStyle` writes
stops counting particles.** The guard that measured the white share by hooking
it had been correct for months and silently became a bucket count instead —
reporting 50% for a 30% split. A measurement that stops measuring the thing it
names is worse than no measurement.

### 5.31 Rank, then quantise

The brief wanted two things at once: an opacity *histogram* (half the cloud at
10–20%, a third at 20–35%, a seventh above) and an opacity *meaning* (edges
and internal structures strong, volume medium, depth and strays faint).
Written as two rules they drift the first time either is touched — a curve
tuned to look right stops matching the histogram, and a histogram enforced
directly stops following the shape.

They are one rule if you **rank by the meaning and read the values off the
histogram**: sort the cloud by structural score, take each particle's
percentile, feed it through the histogram's inverse CDF. The shape decides the
order, the histogram decides the values, and neither can drift from the other
because there is only one of them.

Two things fell out of doing it that way. `edge` stopped being an opacity and
became a **rank in 0–1**, because the ink a particle lands on decides which
range that rank is spent over and the ink is not known when the cloud is
built — the clouds are shared across every organ, the colours are per particle
index. And the shader's gain and depth term could go: both existed to put back
what a long run of fractions took out, and once the authored value carries the
ramp and the range, everything left has to modulate *around* 1 rather than
under it, or the histogram is a fiction.

**Two specs in one message can be arithmetically incompatible, and the fix is
to say so, not to split the difference.** 60% of particles red with a floor of
20% opacity means at most 40% of the cloud can be under 20% — so the requested
"50% at 10–20%" cannot hold alongside the per-colour table. The table is the
more specific rule and wins; the global split lands at 26/56/15 and that
number goes in the README rather than being quietly rounded toward the brief.

### 5.32 A backtick in a comment inside a template literal

`// \`authored\` already carries the ramp` — written inside the vertex
shader's template literal, which the backtick promptly closed. The page threw
`Unexpected identifier 'authored'` and nothing rendered.

Worth its own note because of how the error read: a **JavaScript** parse error
naming a **GLSL** identifier, from a line that is a comment in both languages.
Nothing in the message points at the real cause. The five-second diagnosis is
to extract the largest `<script>` block and run `node --check` on it, which
names the line directly — and is worth doing before reading any shader.

### 5.33 An outline nobody drew

"Too many particles around the outer edges, a hollow outlined look." The
sampler had biased toward the silhouette since the first version —
`0.07 + 0.93 × exp(-d / 3.5)`, six times the density two pixels from a
boundary as twenty — and every subsequent opacity treatment had been tuned
*on top of* that, including one round spent making the ramp core-strong to
compensate for it and a later round spent making it edge-strong again.

**A weighting in the sampler and a weighting in the shading are not
independent, and the sampler is the one nobody looks at.** Two rounds of
opacity work were arguing with a line of rejection sampling written months
earlier. The fix was to delete it: `pts` is already every pixel inside the
mask, so an unweighted draw from it *is* uniform area density, and the
silhouette then emerges from where the cloud stops rather than from a rim
drawn in it.

The second half is what a constraint costs. Once nothing may correlate
strongly with distance from the edge, the biomarker slide's empty vessel loses
its input: that effect read by keeping the rim above the fill front, and the
rim was the thing being removed. It now keeps the strongest of the cloud
instead — emptied and still legibly there, but not glass. **When a brief
removes a signal, find what else was reading it** before shipping, and say
what changed rather than letting it be discovered.

### 5.34 A carousel loops on two functions, and neither of them wraps the position

Making the organ carousels endless came down to two lines, used everywhere:

```js
const wrapIx = (v, n) => ((v % n) + n) % n;          // which reading is at v
function wrapD(k, x, n){ let d = k - x; return d - n * Math.round(d / n); }
```

`wrapD` is the one that does the work: the **shortest signed distance** from a
slot to the strip's position, so the first reading draws just off the right
edge while the last one is still centred. That is what makes the loop seamless
— the wrap-around neighbour is already on screen before the step, so there is
never a frame to hide.

**The position itself is deliberately not wrapped.** Folding `dsx`/`bx` into
range would put a discontinuity under the finger at exactly the moment a drag
crosses the seam. It runs on unbounded and is normalised only at rest, where
slot placement is wrap-invariant and nothing moves. Everything that *names* a
reading wraps at the point of use; nothing that *positions* one does.

Three things had to stop clamping, and one had to stop resisting: `dsGlide`
and `bxGlide` (so a step off the end travels the short way rather than
scrubbing back across the strip), the release handlers, and the rubber-band
past the ends — which is the correct feel for a list with ends and exactly
wrong for one without.

The trap was the odd slide out. The phone's carousel carries a biomarker slide
at index −1 that is not in `MB` and is positioned by its own two blocks of
code, `-1 - bx`. Everything else looped and that one slide vanished at the
seam — visible only by stepping the whole way round and reading the labels,
which is why the check was a script that presses ArrowRight thirteen times and
prints what is on screen rather than a screenshot of one state. **A carousel is
correct at its seam or nowhere, and the seam is the one state a screenshot of
the default view never shows.**

### 5.35 "Every dot snaps" is a property of the last line, not the first

Authoring opacity on a 5% grid is easy and worth almost nothing on its own: a
particle written at 30% is multiplied by the twinkle, the verdict, the vessel
fade, the density lottery, the theme lift and nine more before it reaches a
pixel, and each of those lands it between two steps. **A quantisation
guarantee belongs at the end of the pipeline**, and the honest version needs
both — the author so the distribution is what was asked for, the end so what
is drawn is what was authored.

Three things had to change to make it hold on the 2D side, and none of them
looked like quantisation:

- the batcher bucketed alpha to 48 steps, a number chosen for smoothness back
  when nothing depended on it. 20 buckets **are** the grid.
- `dot2D` drew every dot as two discs, at 0.30 and 0.76 of its alpha, for a
  soft edge. That is two values off the grid for every dot on it. The edge
  went; at three device pixels it was one pixel of falloff.
- the flow's end-fades multiply a flat 0.30 into a continuum. Snapped with the
  same function the cloud uses.

The check that mattered was hooking `fillStyle` for a whole session and
printing the distinct alphas: **18, none off-grid, 0.05 to 0.90.** Before the
three fixes the same probe said 302 distinct values — which is the number that
tells you the property is not held, and no screenshot ever would have.

And one ordering lesson: the ink a particle carries had to be decided *before*
any cloud was built, because the cloud builder now authors an opacity and
needs to know which band to spend it over. It had been drawn later, when the
colour buffer was filled. Two draws from the same distribution are two
different answers to one question.

### 5.36 Uniform density through a silhouette is a filled shape

The sampler has now been three things: edge-biased (an outline with a fill
behind it), uniform (a solid), and finally uneven on purpose. The middle one
is the interesting mistake, because uniform *sounds* like the neutral answer
and is not: a constant density inside an outline is exactly the definition of
a filled shape. A volume reads as a volume because you can see through parts
of it, which means the density has to vary — and vary in a way that has
nothing to do with the boundary, or you are back to the first mistake.

Smooth value noise at about a fifteenth of the shape does it, plus a 30%
reduction toward the interior where the projection piles up most. Both were
overdone on the first attempt — noise at a twenty-sixth with a 58% swing, and
42% out of the middle — and the brain stopped being a brain. **A density
change is a legibility change**, and the check is whether you can still name
the organ.

### 5.37 A refused context should not be a dead page

`if (!gl) return;` sat at the top of an IIFE containing the entire
application. A browser refusing a WebGL context — for tab count, for a driver
blocklist, for asking for antialias on a machine short of memory — took every
page, carousel, card and label with it and left one sentence.

Two fixes, and the second is the one that matters. Ask more than once: four
attempts across `webgl`/`experimental-webgl` with and without antialias. And
when all four fail, **run the app against a stub instead of not running it**.
A Proxy that answers 1 for any all-caps property (the enums), `true` for the
two `get*Parameter` calls whose results are actually tested, an object for
anything `create*`, and a no-op function for everything else is enough for the
whole engine to execute happily while drawing nothing.

The organ is then painted by the 2D renderer that already existed for the
library, mounted **inside the canvas's own slot** rather than positioned over
its viewport rectangle. The first version mirrored the rect from `document.body`
and landed in the wrong place: a rectangle copy inherits nothing about the
stacking, clipping or transforms the slot sits under. Living in the slot means
the same CSS that places the canvas places the fallback, in every mode, with
no knowledge of any of them.

(One trap on the way: `makeOrganView` skips any host whose `offsetParent` is
null, and a `position:fixed` element has none — so the fallback mounted, sized
itself, and silently never painted.)

### 5.38 Distributing over a shape and cutting holes in one are different questions

Four rounds of density work all asked the same question — *how should
particles be spread across this silhouette* — and every answer to it fills the
silhouette, because that is what the question means. Edge-biased filled it
with an outline and a backing; uniform filled it evenly; a shell gradient
filled it with a gradient. The picture only changed when the question did:
**what should be cut out of it.**

The mechanism is three octaves of value noise rather than one. A single scale
produces even stippling, which the eye reads as texture; three produce open
regions, full regions and grain inside both, which it reads as space. Raising
the sum to a power matters as much as the octaves — it keeps the low end near
zero for longer, and that is the difference between a hole and a thin patch.

The other half is where to take the most from. `d`, the distance to the
nearest boundary, is largest exactly where a silhouette is a filled mass, and
those are the regions where a projection piles up most and a reader learns
least — so 55% comes out of them. Note what this is *not*: nothing in it
prefers the perimeter. The boundary survives better only because less is taken
from it, and the noise cuts through the boundary as readily as anywhere else.
**An edge that is denser and an edge that is a line differ only in whether
anything is allowed to interrupt it** — which is the thing three previous
attempts got wrong in both directions.

---

### 5.39 Same count, same colours, same opacities — and a different picture

The two renderers had already been made to agree on every list: the same
particles, the same subset, the same three inks, the same 5% opacity grid, the
same flow. A phone hero still did not look like the library tile. Three things
turned out to be wrong, and only measurement separated them — each one alone
would have been diagnosed as "the dots are too small".

**One draw call had never been unified.** The `else` branch that serves the
dashboards and the phone still ran `drawArrays(0, TOT)` — the whole buffer,
6,245 organ particles against a tile's 3,561. Every other path had been
converted; this one was the default case, so nothing named an organ in it and
nothing flagged it. It also hid the other two faults: three times the count at
a third of the dot size looks, in aggregate, about right, which is why the
Heart appeared to match while the Brain did not.

**The size law ran backwards in the zoom.** `pow(uZoom, 0.35)`, sublinear so a
narrow card kept visible points — but the organ's size on screen is linear in
the same zoom, so the ratio went as `uZoom^-0.65`: the more of the frame a page
gave the organ, the finer its grain got. `uZoom` is always written as a layout
constant over the organ's own radius, so `uZoom × r` is that constant alone;
size the dot by it and the frame, the device pixel ratio and the radius all
cancel against the projection. Ten surfaces, one number.

**The two dots were not the same dot.** The tile's is a flat square at exactly
its authored alpha — the soft edge had been taken off it so the 5% grid would
survive to the pixel. The engine's was a disc under `smoothstep(1.0, 0.38, d)`,
which lit about a third of the area for the same particle *and* multiplied a
snapped alpha by a smooth ramp on the way to the screen. The grid guarantee had
a hole in it the whole time, in the renderer that states it in a comment.

The calibration that closed it is worth recording, because two numbers had to
move together. Coverage of the organ's own bounding box and total ink over that
box are independent measures: dot size moves both, falloff shape trades one
against the other. Matching coverage alone overshot the ink by a quarter;
matching ink alone left the cloud reading as hard specks rather than grain.
`(1.0 - d)` — no plateau, ink spread to the rim — with `DOT_PIX` solved for ink
lands both: 15.2 against the tile's 15.2, coverage 0.48 against 0.52.

The residue is honest and worth knowing: **a library tile renders its backing
store below its CSS size and arrives upscaled**, which spreads every dot over
about 1.8 pixels for one drawn. That blur is a performance decision, not a
design one, and it is the last of the difference — the same ink, slightly
softer. The engine reproduces the tile's ink, not its resampling.

### 5.40 A message that named the wrong fault

A screenshot came back with the whole page under a 94%-black sheet reading
**WEBGL UNAVAILABLE IN THIS BROWSER**. It was not. WebGL had answered — the
context existed, the program had linked, the page had drawn. What had happened
is that `drawFrame` threw ninety frames running, and the guard around it raises
that same overlay without touching its text, which is written for a browser
that has no WebGL at all. So the sheet sent a reader to their driver settings
for a fault in this file, and stayed up for the rest of the session even if the
next frame succeeded.

Three things follow from that, and only one of them is the bug.

**A shared overlay must be told what it is saying.** Four code paths raise it —
no context, context lost, context restored, render failed — and three of them
set the text first. The fourth inherited whatever was in the markup. It now
names the failure and quotes `e.message`, because the person looking at the
sheet is the only one who can read it back to me, and it lifts as soon as a
frame completes.

**A lookup read every frame must be total.** `orgDrawN` indexed `clouds`
without checking, so one index that does not name a cloud is not one bad
frame, it is every frame from then on. It returns 0 now.

**And a shader must not read its own output.** The size clamp I had just added
was written `if (gl_PointSize > 0.0) gl_PointSize = max(gl_PointSize, 1.0)`.
`gl_PointSize` is an output; reading one back is undefined in GLSL ES 1.00, and
a stricter driver than the software rasteriser I test against may refuse to
compile it. Computed in a local and assigned once now. Worth being precise
about what this does and does not explain: a shader that fails to compile
throws during setup, so the frame loop never starts and this overlay never
appears — it cannot be the fault in the screenshot. It is a hazard I shipped,
found while looking for a different one, and it would have failed silently on
hardware I cannot reach.

The fault itself I could not reproduce: twenty-two modes, a sixty-second
auto-cycle on six surfaces, every organ slide on every phone hero, and every
card-state combination all came back clean. That is the honest state of it —
the diagnostics are fixed, the fault is not found, and the next occurrence will
say what it is.


### 5.41 A soft edge has to be measured in the unit it is seen in

The falloff that made a phone hero's dots match the library tile turned a
full-bleed organ into fog. Both are the same line of shader — `(1.0 - d)`,
alpha falling from the centre to the rim — and that is the fault: it is a
share of the dot's own radius, so it scales with the dot. At a pixel and a
half across there is no room for a gradient and it reads as a soft point,
which is what the tile's upscaled backing store looks like and what I
calibrated against. At twelve pixels across the same line is a gradient
twelve pixels wide, and the organ is made of nothing but out-of-focus balls.

Softness belongs in pixels, because that is the unit an edge is seen in. The
vertex publishes the sprite's size as a varying and the fragment sets the rim
to about one pixel of it, whatever the size. Two guards make that work at the
ends: the rim is capped at the radius, or a small dot never reaches its own
authored alpha anywhere and the cloud silently loses a third of its ink; and
the size still has a one-pixel floor, because below that a dot is not a fine
dot but no dot.

`DOT_PIX` has to be re-solved after any change to the falloff — the shape of
the dot and the size of the dot both set how much ink lands on the page, so
they are one calibration and not two. Solid discs carry more than blurred ones
at the same radius, which is why the number moved with the edge.

*And, for the second time in this file: a backtick in a comment, inside the
template literal holding the shader, closed the string. The page threw
`Unexpected identifier 'vPt'` — a JavaScript error naming a GLSL variable.
Note 5.32 says exactly this. Knowing the trap is not the same as not falling
into it; what caught it in one step was running the error probe before the
measurement probe, rather than after.*


### 5.42 The flow had a "before" it should never have had

"The flow appears a second after the visual." Two causes, and neither was the
flow's own opacity — the authored alpha measures flat at 165.7 from the first
frame through a whole organ change.

`flowVis` started at zero and eased toward one at 0.05 a frame: about seven
tenths of a second to arrive. Worse, the same value gates `updateFlow`, so for
those frames the dots were not being put on their paths at all. It is seeded at
its target on the first frame now and smooths only if something changes it
later.

And the flow's A slot is zero-filled at startup, so the opening gather dragged
every flow dot out of a knot at the origin: the stream only became a stream
near the end of the gather. Holding A on the live positions until the gather
lands leaves nothing to travel from — the streams are already running while the
cloud arrives. Measured at the first frame, the flow's ink went from 24% of its
settled value to 53%; the rest of the ramp is the opening camera move, which
grows the organ and the flow together.

An organ change was already right and is untouched: `freezeInto` writes the
flow's A slot from where the dots actually are, so they travel with the cloud
instead of snapping to the new organ's paths. Isolating the flow's own draw
call and counting its lit pixels through a change shows it present the whole
way, spreading mid-morph rather than disappearing.


### 5.43 A morph is two streams, not one stream drawn twice

The hero drew its flow only once the carousel had settled — `f < 0.02` — so
through the whole swipe there was no stream, and it snapped back on at the end.
That is the worst possible moment to hide it: the swipe is the one time a
reader is watching the thing move.

The reasoning behind the gate was sound as far as it went. A lane is built in
one cloud's normalised frame; drawn over another cloud it lands nowhere. But
the hero is not showing one cloud mid-swipe, it is showing two, interpolated by
`uP` — and the flow can have the same two ends. The outgoing organ's lanes go
in the A slot, the incoming organ's in B, `uP` takes the swipe's own fraction,
and every flow dot travels from one shape to the other inside the cloud that is
doing the same thing around it.

What that needed was for "the flow of organ X" to become a function you can
evaluate into either slot, rather than a procedure that writes `posB` for
`current`. Two arguments — which organ, which slot — and one more that matters:
**the packet channels are state, not geometry.** The pulse and signal presets
carry a handful of live packets, and evaluating a second organ in the same
frame would step their clock twice. The second call places the packets it
already has along the other shape's lanes, which is exactly what a morph wants:
the same dots, a different path.

Measured by isolating the flow's own draw call: 0 lit pixels for the whole
swipe before, ~1,090 continuously after, on both phone heroes. The order of the
two calls is not arbitrary either — B is written first so the colours left
standing belong to the resting slide, which is where `f` sits.


### 5.44 A count taken as a maximum is another organ's density

"The nerve is very, very condensed after the morph lands." It was, by exactly
three times, and the reason is one word in the hero's draw call.

A morph is two clouds at once, so the hero drew `max(orgDrawN(ia),
orgDrawN(ib))` — anything less drops points out of one of them mid-step, which
is true. What is not true is that the pair only exists mid-step: the hero holds
that same expression at rest, so a slide sitting next to a denser one draws its
neighbour's count. The nerve asks for 1,587 points. The body next to it asks
for 4,700. The nerve was drawn with 4,700 — its own particles, three times over
the density its shape was sampled for, which on a shape made of *lines* rather
than volume is the difference between a stipple and a solid mass.

Interpolating instead of maximising fixes both ends at once. `nA + (nB - nA) *
f` gives the resting slide its own count and the moving one a count between the
two, which is what every other property of the pair already does. Ink over the
organ's own box, on the two phone heroes: 14.07 and 13.41 against the library
tile's 4.63 before, 6.73 and 7.48 after.

The general lesson is worth naming because it is the second time in this file:
**a clamp that is correct during a transition is wrong at rest, and a
transition's expression is evaluated at rest far more often than in flight.**
The same `max` had been written into `heroDrawN` for the single-organ pages; it
is interpolated there too now.


### 5.45 One shape's geometry, not one shape's bug

The neuron's flow piled into the bottom-right corner every time the hero
morphed into it. Two things were true at once, and only one of them was a bug.

The bug: a `pulse` preset writes a position only for the dots currently inside
a packet. A morph interpolates *every* slot whether or not this preset lit it,
so the seven-hundred-odd untouched slots carried whatever coordinate was last
written into them — some other organ's lanes — and the whole layer flew there.
Inactive dots are parked on this shape's own path at their stable phase now:
still invisible, but somewhere that belongs to the organ being drawn.

The geometry: all four of the neuron's paths end at the same axon terminal. A
layer interpolating between another shape's lanes and this one's therefore
*converges*, whatever the slots hold — it does not spread along a shape,
because the shape's lanes do not spread at that end. That is not something to
fix; it is what a neuron is. So this preset carries `late`, and its stream sits
the transition out and eases in once the pair has landed. Eased in both
directions rather than switched, or the exception would be its own pop.

Worth being precise about the shape of the exception: it is one flag on one
preset, read where the flow is drawn, not a branch on an organ's name. Any
asset whose lanes converge can ask for the same behaviour by saying so.


### 5.46 Two ends of one curve are one pair of equations

"The edge should be more condensed by 25%." Then, on top of it, "less dense in
the core by 4%, more condensed on the edge by 6%." Both are the same curve —
`A + X * exp(-d/8)`, a constant plus a term that decays inward — and neither
end of it can be set without moving the other. The constant sits under both, so
scaling the coefficient by 1.25 lifts the deep middle along with the boundary
and buys about 20% of what was asked.

Solve for the pair instead:

    A + X e^-0.25 = edge      A + X e^-2.75 = core

The first ask: keep the core, take the boundary from 2.122x it to 2.655x —
0.424 and 1.152. The second: 1.4004 and 0.4777, from 1.3212 x 1.06 and
0.4976 x 0.96 — 0.395 and 1.290, and 2.93x.

What any of it buys is the *ratio*, because a rejection test decides where
particles land and never how many. Raising every weight raises nothing at all.
Which also means a one-sided ask ("more edge") and a two-sided one ("more edge,
less core") are the same kind of instruction: both are a tilt, and only the
second says how steep in two numbers instead of one.

The pixel-level effect is smaller than the weighting change and depends on the
shape, which is worth saying rather than hiding: a lung, with a real interior to
take from, moved its measured edge-to-core ink ratio 1.107 -> 1.346 -> 1.414; a
neuron, which is nearly all edge, has little interior to take from. Nothing can
make a shape denser at the edge than it is in a middle it does not have.

### 5.48 "Thinner, sharper" is two knobs, and the second moves the first

Two properties are being named and they are not the same one: how wide a dot
is, and how hard its edge is.

Width is `DOT_BASE`, the number both renderers read through the seed --
0.95 -> 0.76 -> 0.61. Hardness is the rim constant in the fragment shader:
`aa` is in r units and the sprite's radius is half its point size, so the
constant *is* twice the rim's width in pixels. 2.4 was a 1.2px falloff; 1.6 is
0.8px. Sharpening moves the engine's dot toward the tile's, which has no
falloff at all -- the 2D painter lays a flat rect at exactly its authored alpha
-- so this closes a difference between the renderers rather than opening one.

The part worth remembering: **a harder edge is less ink at the same radius**,
so `DOT_PIX` had to be re-solved. It is the number that makes the engine agree
with the tile, and that number is an answer about the *shape* of the dot as
much as its size — change either and it has to be asked again. 5.70 -> 6.02
put the ink back: tile 7.71 against 6.64-7.66 on the surfaces, the ratio it
held before the rim moved.


### 5.49 Rotate the hue; do not pick three new colours

"A bit more orange, not too much." The three inks are a family — 60/25/15 with
their own opacity bands — and picking three warmer colours by eye would have
kept each one plausible and lost the steps between them. Each hue is rotated
about ten degrees toward orange with lightness and saturation held, which is
the same ink warmed rather than a different ink:

    #A34442 -> #A35442     #D09A96 -> #D0A496     #F2E9E7 -> #F2EBE7

The near-white barely moves, which is correct: there is little hue in it to
turn. `inkOf`, which tells the three apart in the 2D painter by green channel
against 0.45 and 0.80, still separates them — 0.33 / 0.64 / 0.92.

### 5.50 The tile has a floor, and the grain has reached it

`DOT_BASE` 0.61 -> 0.52 on the same ask. Measured at the tile: mean dot
diameter **1.04 backing-store pixels**, tenth percentile 0.73. The tile's
backing store is 1.5x its CSS size, so those are 0.69 CSS pixels on screen.

That is the floor, and it is worth stating plainly rather than discovering it
again next round: **below about a pixel a dot stops getting smaller and starts
getting fainter.** A canvas rect of side 0.73 is not a finer dot, it is the
same dot at less alpha. Further reductions will read as a weaker drawing, not
a sharper one.

The engine has headroom the tile does not — it draws at full device resolution,
so its dots are still two and a half pixels on a phone hero. Which means the
two renderers now degrade differently as the grain falls, and `DOT_PIX` has to
be re-solved each time to hold them together: 6.02 -> 6.68 here, landing the
tile at 6.46 against 5.78-6.35 on the surfaces. If the grain is asked to go
finer again, the honest fix is the tile's backing-store scale, not the number
that measures the engine against it.


### 5.51 A ratio stated twice is a ratio that will come apart

The flow's size was written in two places and two currencies: the engine as a
seed of `1.50`, the 2D painter as a radius of `1.95` with no reference to
`DOT_BASE` at all. That agreed exactly once -- at `DOT_BASE = 0.95`, where it
was written -- and three rounds of thinning walked it apart without a word.
Measured at the tile afterwards: cloud dots at 1.04px, flow dots still at
3.9px, nearly four times the size of what they run through.

`FLOW_MUL` is the ratio, once, and both renderers multiply it by `DOT_BASE`.
The lesson is not "keep them in sync" -- they were in sync, by hand, and hands
do not survive four changes. It is that a *relationship* has to be stored as a
relationship. A number that means "1.5x that other thing" and is written as
`1.50` has thrown away the only part of itself that was load-bearing.

### 5.52 Three colours are judged, not measured, so they get a control

Everything else in this file is settled by measuring: counts, ink, grain, the
edge ratio. The palette is not that kind of question -- it is looked at and
either right or wrong -- so three swatches in the tweak bar set the inks live,
and a Save button keeps them.

Two things made it cheap. `INK_PICK` already existed: which ink a particle
carries is decided once and stored, so a colour change repaints without
reshuffling. And the recolour pass writes rgb only, never alpha, which is
authored per cloud on the 5% grid and has nothing to do with hue.

`inkOf` had to stop telling the three apart by reading the green channel back
out of the colour buffer against 0.45 and 0.80. That worked only because the
three were far apart on it, and a control that lets a person pick any three
colours makes it silently wrong. It asks `INK_PICK`: the draw that decided,
not the pixel it produced.

**And uploading to the GPU is half the job.** The first version changed the
engine's surfaces and left the library untouched -- which is the one place the
palette is actually judged. The 2D painter does not read the colour buffer; it
bakes an ink into each point when it first samples a cloud and keeps that list.
`recolour` drops those lists so the next paint rebuilds them. The general
shape: *a value that has been copied into a cache is not one value any more*,
and the second copy is invisible from where the first one lives.

The restore is done at the declaration rather than after load, for the same
reason in reverse: at that point nothing has read the three yet, so there is
nothing to rebuild. Applying a saved palette later would mean re-uploading the
buffer and dropping every sampled list to say something that could have been
said first.

### 5.53 A layer rounded out of existence

"The floating particles around the visual are gone." They were: the ambient
slice measured **0 lit pixels** on every surface, drawn every frame and
arriving as nothing.

The strays were authored at `OP_LO` -- 0.05, the bottom step of the grid -- and
then multiplied by 0.42 in the buffer. 0.05 x 0.42 = 0.021, and the shader's
last line rounds anything under half a step to zero. So the layer was not dim,
it was absent, and it had been absent for as long as those two lines had sat
next to each other.

This is the exact failure the grid is meant to prevent, committed by the code
that owns the grid. The rule is not "snap at the end" -- the snap was working
perfectly, it is what deleted the layer. The rule is that **a factor applied
after a value is authored is a second author**, and at the bottom of a
quantised range a second author can only round down. The 0.42 is gone; the
strays carry a spread of 0.05 to 0.20 written where the rest of the opacity is
written, on the grid, skewed low so a few carry the field and most are barely
there.

`AMB_VIEW` went 150 -> 300 of the 350 built, which is the count both renderers
read, so the tile and the product get the same field.


### 5.54 Depth derived from a silhouette is depth a line cannot have

"The brain and the nerve are too 2D, and the nerve should go in multiple
directions." Both come from one line: `zmax = depthPx * sqrt(d / 22)`, where
`d` is the distance to the nearest boundary.

That is right for a mass and wrong for a line. A lung's middle is twenty pixels
from an edge, so it gets its full depth; a dendrite is two pixels from an edge
*everywhere along its length*, so it gets 30% of it and reads as wire on glass.
The rule was never "thin things are flat" -- it was "thickness on screen stands
in for thickness in depth", which is a fair guess for a blob and a bad one for
a branch.

`vol` is the per-shape override, and it has three parts because the ask had
three:

- `floor` puts depth under the thin parts regardless of `d`. Thickness.
- `spread` displaces whole *regions* along z from a low-frequency field of
  (x, y). This is the one that answers "multiple directions": a per-particle z
  offset is more thickness, and thickness is not direction. The field has to be
  coarse enough that a branch agrees with itself and disagrees with the branch
  beside it -- at 1/42 of the raster, it is.
- `hl` raises the highlight share, because the front of a volume is what tells
  a reader it is one. 10% globally, 16% on these two.

The nerve takes the most of all three (0.72 / 0.62), because it is the shape
with the least silhouette to derive anything from.


### 5.55 Thinner is not free, and the same mistake had a third instance

"The floating particles should be super thin." They were the *coarsest* thing on
screen: written as `-(0.5 + rand * 0.9)`, a bare magnitude, while every cloud
dot is `DOT_BASE * m`. At DOT_BASE 0.95 that was about the same size; at 0.52
it made a stray up to two and a half times a cloud dot.

That is the third instance of one mistake in this file -- the flow's `1.50` and
`1.95`, and now the strays' `0.5`. A size that means "a fraction of that other
thing", written as the number it happened to equal on the day, is true once.
`AMB_MUL` joins `FLOW_MUL`: both are fractions of `DOT_BASE`, so the whole
system moves together and there is nothing left in it that has to be remembered
by hand.

The other half is that **thinner costs light**. A dot a third the diameter
lights a ninth the pixels, and the first attempt (0.60) took the layer from 720
lit pixels to 53 -- thin to the point of gone, which is the same failure as the
0.42 that started this. 0.85 with the authored alpha raised one step, 0.05-0.20
to 0.10-0.25, holds it at 118: single-pixel specks that still read as a field.
Two knobs, because "make it thinner" and "keep it visible" are two properties
and only one of them was asked for out loud.


### 5.56 A percentage asked of a grid has to be spent before the rounding

"Make all visuals brighter by 10%." Every dot in the file sits on one of
eighteen opacity values, 5% to 90% in steps of 5, and the obvious move -- lift
the three ink bands by a tenth -- does nothing where it matters. `0.20 x 1.10`
is `0.22`, which rounds straight back to `0.20`; `0.05` becomes `0.055` and
rounds back to `0.05`. The low end of the range is where most of the cloud
lives, so the bands would have moved only at the top, and "10% brighter" would
have arrived as "the bright dots got brighter".

The lift belongs one step earlier, on the continuous value, before the snap:

    const BRIGHT = 1.10;
    opSnap(BRIGHT * (b[0] + (b[1] - b[0]) * Math.pow(p, 1.6)))

Now the rounding falls where it falls. A dot three fifths of the way through a
step crosses to the next one, a dot one fifth of the way does not, and across
thousands of dots the mean rises by the tenth asked for while every individual
dot is still on the grid. Measured as mean deviation from the ground: library
Brain 19.5 -> 21.4, m20 31.2 -> 33.8, m19 30.4 -> 34.0, m21 33.6 -> 36.0, m18
22.6 -> 23.7. Mean +8.3%, not +10, and the shortfall is the two hard ends of
the grid: the highlights clamp at 0.90 and the dimmest dots are already at
0.05 and have nowhere below to have come from. Both are the grid doing its job,
so the constant stays at the number that was asked for rather than being tuned
up until a measurement reads 10.0.

### 5.57 A layer made of the same mixture as its background is only motion

The flow was dealt the same three inks as the cloud it runs through -- 60/25/15
by `pickInk`, the same coin as every particle in the organ. Which means the one
thing separating the stream from the still field was that it moved. Freeze a
frame and there is no stream in it.

It is one colour now, and it is the lightest of the three. The flow is held
well under the cloud on alpha -- that is deliberate, it must not compete on
brightness -- so hue is the only budget it has left, and spending all of it in
one place is what turns a scatter of moving dots into a material.

The two renderers had, as usual, two opinions. The engine dealt all three inks;
the 2D painter dealt the two *darkest* ones (`tones = [INK_CSS, MID_CSS]`) and
never touched the light one at all. So the library tile -- the surface where
this gets judged -- was showing the flow in the dimmest pair available, which
is most of why it kept reading as more cloud there. Both sites read `LIT` now,
live, so the tweak bar moves the stream with everything else. Verified by
drawing nothing but the flow slice and histogramming `(r-bg)/(b-bg)`, which is
the ink's own red/blue ratio whatever the alpha it was drawn at: 2.9 for the
deep ink, 1.4 for the mid, 1.05 for the light one. m18/m20/m21 all come back
one cluster at 1.0, no trace of the other two.

### 5.58 "The heart is too weak" was not about opacity at all

The ask was "add 30% more, I want to see some volume, the heart for example is
too weak", arriving straight after a brightness change -- so the obvious reading
is another 30% of brightness and the heart is just the example that prompted it.
Measuring every library tile before touching anything says otherwise:

| | frac (own box) | ink (whole tile) |
|---|---|---|
| Brain | 0.447 | 3.08 |
| Heart | **0.486** | **1.90** |
| Lungs | 0.376 | 2.26 |

The heart was the *densest* organ per unit of its own bounding box and one of
the lightest on the tile as a whole. It was never short of particles or alpha.
It was drawn small: `sizeMul 0.88`, the lowest of any filled organ, against
1.00-1.04 for the rest. Every cloud is already normalised so its longest
dimension matches (`s = 1.55 / maxDim`), so a sizeMul under 1 is a deliberate
shrink applied on top of that, and nothing in the file said why.

1.00 gives it `(1/0.88)^2` = 1.29x the area. The dot count is derived from the
area, so it gains the particles to fill the new size instead of being stretched
over the old ones -- 5,305 points to 6,583. Tile ink 1.90 -> 2.74, which puts
it level with the lungs at 2.77 instead of last but one.

Worth stating as a rule: when a request names one element as the weak one, the
measurement that matters is the one that isolates it from the others, not the
one that describes the whole. Per-unit-area the heart looked fine and a global
brightness lift would have kept it exactly as far behind the brain as it was.

### 5.59 A percentage lift that is mostly spent

`BRIGHT` 1.10 -> 1.43. What actually landed, as total ink per tile:

    Sphere +31%   Body +30%   Bone +29%   Cells +27%   Gut +27%
    Fingerprint +26%   Iris +24%   Lungs +23%   Kidneys +22%
    Liver +20%   Nerves +20%   Brain +16%

Median +26% for an authored +30%, and the brain is the outlier for a reason
that is visible in the numbers: it runs a 16% highlight share against the
default 10%, and highlights are what hits the ceiling first. `opBright` tops out
at `1.43 x 0.90` = 1.287, clamped back to 0.90, so everything past `p = 0.37`
is now the same value -- a three-step ramp where there were seven.

Which is the useful thing to record: the highlight headroom is mostly gone. The
next lift, if one is asked for, has to come from the bands, or from raising
`OP_HI` and accepting more than eighteen values, or from somewhere that is not
opacity at all -- count, size, or (as with the heart) how large the organ is
drawn in the first place.

### 5.60 The rim cannot be pushed up, only the middle pulled down

"35% more density, more matter especially on the edge, thicker." Three asks,
and they are three different knobs. The count is `FULL_DOTS`, 4.16 -> 5.62,
and since the rejection test decides where and never how many, that is the
whole of the density part. "Thicker" is the length in `exp(-d/L)`: how far in
from the boundary the dense band reaches before it decays to the interior
value, so 8 -> 11 is the same rim carried deeper. "Especially on the edge" is
the ratio of the two ends, and that is where the first attempt went wrong.

It raised the boundary weight a tenth, to 1.54, and held the deep middle at
0.4777. Measured, the interior gained *more* than the rim: +32% against +21% on
the brain. The acceptance test is `min(1, mask * bulk)`, and at the boundary
`bulk` is already past 1 -- so for every point where the noise mask is not low,
a higher boundary weight clips to the same 1 it was clipping to before. The rim
has no headroom on that side. The only way to favour it is to make the interior
*less* likely relative to it: the deep middle down to 0.40, which with 35% more
count still leaves the core up in absolute terms. Re-solved at L = 11:

    A + X*e^(-2/11) = 1.54,   A + X*e^(-22/11) = 0.40   ->   0.179, 1.632

Boundary over core 2.93x -> 3.85x; the mid volume (d = 8) 0.87 -> 0.97.

Measured on the library tiles as ink density inside a shell of the closed
silhouette versus the interior it encloses:

| shell | brain edge / core | lungs edge / core | heart edge / core |
|---|---|---|---|
| 7 px (the band) | +29% / +26% | +31% / +27% | +25% / +24% |
| 3 px (the rim) | +23% / +31% | +24% / +30% | +12% / +20% |

The thick band gains at least as much as the core everywhere, which is the
thickness. The outermost three pixels still gain less than the core, and that
is not the sampler: rim pixels were already the densest thing on the tile and,
after the brightness lift, sit closest to the 0.90 ceiling, so an extra dot
there composites to less than an extra dot in the middle does. It is a ceiling
in the measurement, not in the distribution, and pushing the ratio further
would not show up there either.

Total ink per tile: median +27% for a count up 35%, the gap being the same
saturation. Two tiles did not move: Iris and Sphere already sit at the buffer
(12,445 and 12,245 points against 11,545 slots), and are the two explorations
nothing in the product selects. The brain, the largest filled organ, lands at
10,578 -- the cap is close now, and the next density ask will need `N` raised.

### 5.61 Three channels at once, still as a transform

"Shinier, a bit more saturated, 20% warmer, orange-red -- it's all about
colours here." Three adjectives, three HSL channels, and the same rule as the
last time the inks moved: each is the old ink transformed, not a new pick, and
all three get the same transform so the steps between them stay the steps they
were.

    hue         +5 degrees toward orange
    saturation  x1.20
    lightness   +0 / +2 / +1.5 points

    #A35442 -> #AC5839      #D0A496 -> #D8AD97      #F2EBE7 -> #F6F0EC

The lightness column is where "shiny" went. Shine in a particle cloud is
contrast between the near points and the mass, so the deep ink holds and the
two light ones lift -- and since the flow is now the third ink alone, the flow
is what goes brightest: a stream of near-white through a warmer cloud, which is
where the eye reads shine first.

Measured on screen as the direction and chroma of (pixel - background), which
is the ink's own hue and saturation whatever alpha it was drawn at:

| | hue | saturation |
|---|---|---|
| library Brain | 22.3 -> 28.6 deg | 0.373 -> 0.448 (+20%) |
| library Heart | 22.4 -> 29.5 deg | 0.371 -> 0.440 (+19%) |
| phone m20 | 12.8 -> 17.5 deg | 0.430 -> 0.479 (+11%) |
| desk m18 | 12.6 -> 17.2 deg | 0.440 -> 0.490 (+11%) |

The tile takes the full 20%; the engine takes half of it, because its cloud is
denser and more dots composite over each other toward the light ink, which
desaturates. Same authored colour, two surfaces, two saturations -- the grain
is unified but the overlap is not, and it cannot be, since the engine draws the
organ several times the tile's size.

**A saved palette that is the old defaults is not a choice.** The tweak bar's
Save writes the three to storage and the page restores them before anything
reads them. Which means a Save pressed once, without changing anything, would
have pinned that browser to the old inks for ever, and every warmer set
authored here after it would have been silently overridden -- the file would
say one thing and the screen another, with nothing to point at. So the previous
defaults are listed by name (`OLD_INKS`), and a saved set that matches one of
them is ignored. A set that differs was chosen, and stands.

### 5.62 The strays' own opacity, on their own constant

"The floating particles a quarter more visible." The strays are authored on
their own line in `buildCloud`, already through `BRIGHT`, so the lift goes on a
constant of their own next to `AMB_MUL` rather than into `BRIGHT` -- `AMB_A =
1.25`, before the snap like everything else, so the rounding falls where it
falls rather than moving only the values already near a step. 0.15-0.35 on the
grid becomes 0.20-0.45. Measured with nothing but the stray slice drawn on m20:
ink 3.36 -> 4.50, of which the quarter is the alpha and the rest is the lighter
inks landing on the same pixels.

The probe had to be corrected first. It counted from 11,895, which was
`N - AMB` when AMB was 350, and read zero on both sides -- a measurement of the
right thing at the wrong address, and a zero that would have been believed if
the baseline had not also come back zero. Two identical wrong answers are the
tell.

### 5.63 A strength written as a switch is a snap waiting for a threshold

"There is still a bug on the biological age when the visual morphs -- like a
clip of a different shape going inside. Super brutal." Frames at 50ms and 150ms
across the swipe looked continuous, on the phone in both directions, and a
total-ink series showed nothing. The thing that found it was the difference
between *consecutive* frames under a fake clock, every 33ms:

    HEAD m20:  ... 89 529 73 88 ...      (settled, then one frame at 5-6x)
    new  m20:  ... 155 62 64 77 80 94 90 74 129 192 117 219 151 ...

The iris asks the shader for a pupil remap, brightness fronts and a 30% cull
of its particles, and the CPU wrote the switch for them as exactly 0 or 1:
`uIris.x > 0.5`, set when the morph's progress fell under 0.02. So on the frame
the morph settled, the pupil jumped to its dilated radius, the fronts lit, and
three in ten dots vanished -- together, in 16ms, on a cloud that had spent the
previous 300ms arriving smoothly. Leaving did the same in reverse on the first
frame of the next swipe. It is the same magnitude of change as the whole morph,
compressed into a frame, which is precisely "a different shape clipped in".

`setShape(a, b, f)` takes the pair and the progress now and computes a
strength: ramping out over the first third of a morph away from the shape and
in over the last third of a morph toward it. The shader multiplies its `solid`
mask by it, and the cull follows the same ramp (`1 - 0.30 k`), so the dots go
one at a time rather than a third at once. The sphere had the identical switch
and takes the identical ramp.

Two lessons. A value that the shader tests against 0.5 is a switch however it
is typed, and a switch on a continuous process will fire on a single frame
sooner or later. And stills cannot find a one-frame event: only the difference
between one frame and the next can, and only at frame rate.

### 5.64 A floor under the depth made a slab

The brain and the nerve had been given a depth floor (a minimum thickness
everywhere) and a noise field displacing whole regions along z, so the nerve's
branches would go "in multiple directions" instead of lying flat. The user's
verdict: remove it -- the brain looks flat now, it should be like a sphere.

Which is right, and for a reason worth writing down. The shared law is
`zmax = depthPx * k * sqrt(d / 22)`: thickness grows as the square root of the
distance in from the silhouette, which is the section of a rounded body cut by
the picture plane -- nothing at the rim, deepest in the middle. That profile is
what a front-on view reads as round: the rim is thin so it recedes, the centre
is thick so its highlights sit forward. A floor of 0.55 puts more than half the
maximum depth at the rim as well, so the rim no longer recedes, and a shape
with the same depth everywhere is a slab however deep it is. The displacement
field, meanwhile, read as a warp rather than as depth.

Both removed; both shapes back on the shared law, keeping only their extra
share of highlights (`hl: 0.16`). And the whole section made deeper for every
shape instead, 1.25 -> 1.75, so the perspective in the shader has more to work
with -- including on the nerve's branches, whose thin sections get the same
proportional gain. The span the front/back rank is read over scales with it
(0.44 -> 0.62), or a deeper cloud would saturate the rank at both ends.

### 5.65 The strays, another quarter

"More visible, not bigger, just brighter." `AMB_A` 1.25 -> 1.5625, the same
constant as last time, on the same line, before the snap. Ink with only the
stray slice drawn on m20: 4.50 -> 5.54.

### 5.66 A timer cannot be "with the morph"; only a function of it can

"The flow doesn't move well. When the morph finishes, just after one second,
the flow appears, and it's so brutal. Example: the lung." Drawn with nothing but
the flow slice, every 33ms of a fake clock, a click from the heart to the lung
on the phone:

    231 233 246 270 248 260 198 113 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 220 235 ...

Seven hundred and sixty milliseconds of nothing, ending well after the cloud
had landed. Logging the uniforms written before each flow draw explained the
shape of it: a click across the carousel is not one morph but one per slide it
crosses, and Heart to Lung crosses Mental and Brain. Brain is the nerve, and the
nerve's flow was `late` -- drop to zero at the first pixel of any morph touching
it, then ease back at 5% a frame once landed. Sensible for a swipe onto the
nerve; on a three-hop click the ease-back began after the third hop, so the
lung got the nerve's penalty. A timer that starts when the morph ends is, by
construction, a thing that happens after the morph.

Replaced with a dip that is a function of the morph's own fraction: `1 -
sin^4(pi f)`, full at both ends, empty at the midpoint where the neuron's lanes
pile into their shared terminal. It cannot be late, because it and the cloud's
position are the same number. Fourth power rather than second because the
carousel's last hop decelerates -- f spends its final third arriving slowly --
and a dip still 35% deep at f = 0.7 read as the flow lagging the cloud.

### 5.67 The positions had two ends; the alphas had one

Fixing the timer left a 660ms gap on the same click, and the uniform log showed
the flow being drawn throughout it. The flow's positions live in two slots, A
and B, and the shader blends them by f -- but its alpha is one array, written
by whichever end `updateFlow` ran for last, which is the A end. A morph leaving
the nerve was therefore drawn, every frame until it landed, with the nerve's
alphas: a pulse preset, sparse bursts and zero between them, on dots whose
positions were already most of the way to the lung's lanes. Then the pair
landed, A became the lung, and the whole stream lit in one frame. That is the
sentence the user wrote, measured.

The B end's alphas are now kept aside after B is written and blended into A's
by the same f as the positions, and re-uploaded. After both fixes, the same
click:

    227 235 251 255 236 248 207 125 122 102 41 117 115 129 36 0 9 121 158 189 208 208 213 231 ...

A brief dip through the nerve hop -- the exception the design asked for -- and
back to full as the cloud lands, because they are landing on the same f.

### 5.68 Two shells are not a volume

"The 3D seems to work with two layers instead of one unique 3D environment."
Correct, and it was written down as a virtue. Depth was placed at `zsign *
zmax * rand^0.3`: the 0.3 power skews |z| toward zmax, so most particles sat on
the front face or the back face and few between. The comment called it a
shell, "the same reason a sphere drawn in points is drawn as a shell". But a
sphere drawn as a shell is a hollow sphere, and the two-shell version of a
brain is two brain-shaped sheets with a gap -- which is what two layers means.

Uniform through the section now: `(rand * 2 - 1) * zmax`. The `sqrt(d)` law
already gives the section a rounded profile, thin at the rim and deep in the
middle, so a solid fill of that section is a rounded solid. The shell-weighting
was doubling a cue the profile provides on its own, and paying for it with a
hole in the middle of every organ.

### 5.69 Three small numbers that added up to a size

"The iris in the mobile view seems reduced by 10%." Two deliberate reductions
were stacked: a twentieth off the body's framing on the phone (`1 - 0.05 *
irisShown`), and a radius of 0.80 where the organs have 0.78 -- the camera
frames to r, so a wider r is a smaller figure, 2.5% here. Seven and a half
percent, perceived as ten. Both removed; the iris is framed by the same rule
as everything else. The lesson is the one from the heart (5.58): an element
that reads small is usually small for a reason written in a number somewhere,
and the number is easier to find than to argue with.

### 5.70 Sixteen pixels, in the unit the pan already speaks

"Push the iris mobile up by 16px." The hero's pan is in clip space, two units
over the canvas, and the comment beside `orgDrop` had already done the
conversion for a 202px hero: 0.25 is 25px. So 16px is 0.158, added to the pan
weighted by how much of the iris is on screen -- the same weight the old
framing shrink used, so it rides up with the swipe rather than stepping when
the carousel crosses. Measured as the centroid of the hero's lit pixels on the
Biological age slide: 127.7px -> 111.6px, 16.1 up.

### 5.71 The fourth palette is a pick, and is kept as one

Three screenshots of the tweak bar's colour pickers, and "keep these shades as
default": 247/131/89, 240/217/168, 246/240/236. Salmon, sand, warm white.

The three previous moves were transforms of the set before them, on the
principle that colours picked by eye stop being a family. This set was picked
by eye, on the live control built for exactly that, and is kept exactly as
picked -- the principle was about *my* picking, not the user's. The set it
replaces goes into `OLD_INKS`, so a browser that saved it unchanged is not
pinned to it.

### 5.72 The flow was excluded from the tissue it runs through

"The iris is still clipping with the flow." The flow-only series into the iris
had no gap left in it, so this was not the timer or the alphas. It was the
remap: the iris dilates by moving its tissue radially, and the remap's mask
left out the strays, the ghost and the flow on the grounds that "they are not
the tissue". The strays and the ghost are not. The flow's lanes run from the
ruff to the limbus, through the very band the remap compresses, so when the
pupil opened the fibres moved outward and the spokes stayed put -- their inner
ends sat in the hole and their bodies cut across fibres that had moved. That is
a layer clipping another layer, frame by frame, for as long as the breath
lasts.

Position takes the tissue's remap now (`ride`, without the flow exclusion); the
brightness fronts still leave the flow alone. A layer embedded in a deforming
body has to deform with it or it is not embedded.

### 5.73 A frame rate that dropped on both sides is not a regression

The library read 27fps after this round against 37 the round before, with
nothing in the round that touches the library's painter. Measured back to back
against the previous commit served on a second port: 28.3 / 30.1 / 30.4 -- the
same on both. The container was slower, not the page. One A/B is worth more
than any amount of reasoning about which change could have cost it.

### 5.74 A fix in the shader that a draw order never let run

"The iris is still clipping with the flow. Double check." The previous fix put
the flow inside the iris's dilation remap in the shader, and the reasoning was
right; the measurement says it did not happen on the phone. Drawing the tissue
alone and the flow alone on the settled iris and reading their radial extents
about the same centre, three times over a breath:

    tissue inner edge   40 -> 47 -> 48 px
    flow inner ends     42 -> 42 -> 44 px

The pupil opened by eight pixels and the spokes moved by two: when dilated, the
flow's inner ends sat inside the hole. The shader was willing; the uniform was
zero. On the phone hero the cloud is drawn, `setShape` is lowered, and the flow
is drawn *after* that -- so `uIris.x` was 0 for every flow draw on that path and
the remap it now allowed for the flow was multiplied by nothing. The dash path
happened to reset after its flow draw and was fine. Raised again around the
hero's flow draw; after: tissue 34 -> 40 -> 41, flow 34 -> 43 -> 39, the same
range.

A change made where the effect is computed is not a change until every path
that draws the thing carries the state it depends on. The shader is one place;
the uniforms are set in five.

### 5.75 The server that was not serving the file

Three measurements in a row said the settled iris drew no flow at all and only
one draw call a frame, `drawArrays(0, 10980)`, from a line of the file that
contained no draw call. The served copy was not the working tree. A stale
`python3 -m http.server 8735` had survived with its cwd in the scratchpad, where
an old `index.html` sits, and a `cd` earlier in the same shell line had put it
there. The byte-count check at the start of each run is the guard against this
and it was skipped for exactly the runs that went wrong.

The server is started from a script now (`/tmp/claude-0/serve.sh`) that kills
whatever holds the port, starts from the project directory whatever the shell's
cwd is, and prints served size, file size and the server's own cwd. The lesson
is older than this file: a measurement that contradicts the code is a
measurement of something else, and the first thing to check is what.

### 5.76 Fifteen percent, on top of the true size

"Scale down the iris by 15%." Asked for after the unasked 7.5% had been removed,
so this is a deliberate size and not a leftover: `(1 - 0.15 * irisOn)` on the
framing, weighted like the pan so it arrives with the swipe. Outer radius on
the settled iris 151 -> 129 px at 2x, which is 0.85. The 16px lift holds
(centre 111.9 px).

### 5.77 Six back down

"Push down the iris by 6px." 0.158 -> 0.099, the same unit (2 / 202 per pixel),
so the iris now sits 10px above the organs on the phone. Measured centroid
111.9 -> 117.7 px, 5.8 down. Two asks in opposite directions a build apart are
not a contradiction; they are someone converging on a number by eye, which is
what a number that is asked for by the pixel is for.

### 5.78 "Blinking" was a frame rate, not an alpha

"Flow is still clipping.... blinking", with a crop of the lung. Three things
were measured before anything was changed, because "blinking" can mean four
different faults and the last two rounds had already fixed two of them.

1. The phone hero at rest, flow slice alone, framebuffer read INSIDE the hooked
   draw call so no compositing race is possible: 95 draws in 90 frames, 221 to
   251 lit pixels, never zero. The layer does not switch off.
2. Per-pixel brightness flicker at rest, phone hero: half the flow's pixels
   jumped a step or more every frame, against 9% for the cloud. Suspected the
   twinkle crossing the 5% grid on a continuous alpha; exempted the flow from
   the twinkle and authored its alpha on the grid. The figure did not move
   (48% -> 51%), and neither did it on the commit before this round's flow
   work (51%) or on one from the start of the session (37%). It is motion:
   sub-pixel travel of a two-pixel dot changes the pixels it covers. Not a
   fault, and not new. The two changes stay because they are right on their
   own terms; they are not the fix.
3. The library tile, canvas read every rAF: the cloud's lit count changed
   every third frame and the flow arcs were painted every third frame -- 196
   arcs, then two frames of none. The tile's canvas persists between paints,
   so nothing blinks off. But a stream whose dots move ~half a pixel per
   update, updated at a third of the frame rate, is a stream whose dots leave
   one pixel and land in the next with nothing between. On the brightest ink
   in the file, that is what blinking looks like. The crop was a library tile.

So the fault was the slot scheduler (5.x, "one group of three paints per
frame"), which is right for a cloud that drifts and wrong for a stream that
travels. The flow now paints every frame on every dense tile, on a transparent
overlay canvas over the cloud's; the cloud and the strays keep their slot.

Two wrong turns on the way, both measured:

- The first cut composited a cached copy of the cloud under the flow every
  frame. `drawImage` of a tile-sized canvas thirteen times a frame cost 20ms in
  software rendering; 30fps to 9. The overlay costs a `clearRect`.
- The fps did not come back. Counting primitives found 106,000 rects a frame
  where 37,000 were expected: every tile's cloud was repainting every frame.
  The resize check compared the canvas's integer width against `w * 1.5`, so
  a 301px tile was "resized" -- reallocated and repainted -- on every frame it
  was checked. Behind the slot gate that had been one wasted repaint per slot
  for as long as the gate existed; in front of it, everything. Rounded now.
  37,300 rects a frame, and the flow overlay lit every frame.

Cost of the flow at full rate in this software-rendered container, measured
back to back against the previous commit: 27-28fps -> 24.7 on the library.
The phone is unchanged. The right trade for the one layer whose whole meaning
is that it moves.

### 5.79 A dot that moves cannot be smaller than the pixels it crosses

"The flow still clipping, fix it" -- "the white particles that are moving".
The overlay had put the flow at full frame rate (5.78) and it still blinked,
so the fault was in the dot, not the schedule. Every metric so far had
conflated two things: pixels changing because a dot MOVED across them, which
is motion and correct, and a dot's own brightness changing as it moved, which
is the blink. The measurement that separates them follows each dot: find its
brightest pixel in one frame, match it to the nearest peak within 2.5px in the
next, and record how much that brightness changed.

    library tile, per dot, frame to frame:   median 17%   p90 30%   (before)

Seventeen percent brighter or dimmer every frame, every dot. That is what a
hard-edged square 1.6 pixels wide does as it travels a fraction of a pixel per
frame: one bright pixel, then two dim ones, then one bright. The cloud's dots
are the same size and do not blink, because they do not move.

Two changes to the tile's flow dots, and only theirs. A floor of 1.15 backing
pixels on the radius, the way the engine's points have `max(ptSize, 1.0)` --
the library's grain went finer than a pixel and the flow went with it, and a
STILL dot can do that where a moving one cannot. And a soft profile: drawn
twice, a wide faint disc (1.6r at 0.30 of its alpha) under a narrow firm one
(r at 0.80), both as circles whatever their size (`soft` in the batcher, which
otherwise draws small dots as squares), so what any pixel receives changes by
degrees as the dot crosses it.

    library tile, per dot, frame to frame:   median 0%    p90 8%    (after)

The engine had the same fault at a smaller amplitude: 11% median, 29% p90 on
the phone hero. Its points already have a soft rim, but at the two-pixel size
the flow was drawn at, a sprite is sampled by four fragments and a cone across
four fragments still jumps as its centre crosses them. A floor of three pixels
for the flow alone (`1.0 + 2.0 * flowP`), and a fully soft edge (`vSoft`, the
smoothstep run to the centre): 3% median, 9% p90 on the phone, 5% and 11% on
the desktop.

Cost, in software rendering: two arcs a flow dot on the tiles, 26 -> 22fps on
the library; the phone unchanged. The dots are visibly a little larger and
softer than the "two times smaller, fine like the other particles" of 5.51 --
that instruction was met on a dot that stood still and cannot be met on one
that moves. The right size for a moving dot is the smallest one that does not
blink, and this is it.

The general lesson is the one from 5.63 restated for space instead of time:
stills cannot find a one-frame event, and pixel counts cannot find a per-dot
one. The measurement has to be shaped like the thing being looked for.

### 5.80 A quarter more, and for once the grid agrees

"Increase the flow visibility by 25%, more opacity on the dot." `FLOW_A` 0.40 ->
0.50: 0.40 x 1.25 is 0.50, two steps up and exactly on the 5% grid, so nothing
has to be argued about rounding this time. Both renderers read `flowA()`, so
one number. Flow drawn alone on the phone hero: ink 28.1 -> 35.8, +27%.

### 5.81 One lane is a line, however many dots are on it

"On the muscle and bone, at the bottom of the visual there is a cluster of
white dots. Spread them across the entire visual." Measured first: the flow's
vertical distribution on the bone was even -- 20/20/16/19/20 by fifths on the
phone, the same on the desktop and the tile -- so it was not at the bottom in
the sense the numbers could see. The pictures said what the numbers had not:
the bone's flow preset was a single path, straight down the spine, and two
hundred dots on one lane are not a stream through a figure, they are a solid
white line down the middle of it. Std of x on the tile's flow overlay: 3.3px,
against 34 for the cloud. Where the eye put the "cluster" hardly matters; the
whole thing was a cluster, in one dimension.

The preset is now the spine plus, at each of the five vertebrae (`drawBone`,
y = 62 + 50i), a pair of lanes from the column out along the transverse
processes to their tips: perfusion along the spine and out through the bone.
Dots are dealt evenly across the path list, so the spine is listed five times
to give it roughly the same dots per unit of length as the ten short
processes. Std of x: 3.3 -> 26.4px, against the cloud's 35.

Worth keeping: a distribution can be perfectly even along one axis and still
be a line. The histogram that would have found this is the one along the OTHER
axis, and the fastest way to know which axis to histogram is to look at the
picture first.

### 5.82 The line that made sense on one surface and not the other

"Remove this white border edge on the top and left, it is useless." The
one-pixel neutral ring was added to the phone with the halo it catches (5.3x):
a light with nothing to land on is a wash, so the phone's edge carries a
hairline that is brightest where the light is. The same rule was applied to the
desktop card, and there it read as exactly what it is when there is no visible
light behind it -- a stray white edge along two sides. Gone from the card; the
phone keeps it. A detail that exists to serve another detail should be removed
wherever the other is missing, and the other was missing on the card, which is
the next note.

### 5.83 A light positioned so that only its darkest quarter shows

"Do you see the green and orange halo on mobile? I need the same on desktop and
tablet, top right." The card already had one. `.v4Halo` on `#organSlot` was a
1104px circle whose centre sat 426px above the card, so that only its bottom
126px cap fell inside -- and the cap of a radial gradient is its outer quarter:
stops at 77% and beyond, alpha under 3%. Present in the DOM, invisible on the
screen, which is the same as absent and harder to notice.

The centre now sits just outside the card's top-right corner (88% across, 70px
above; 84% on the tablet) with a 440px radius, so the inner stops -- the ones
that are actually light -- fall inside the card the way they do on the phone.
Nothing else changed: same stops, same `--haloK`, same verdict colours. Checked
at 2x with an older organ (orange, top right), a younger one (green), and the
aligned one (see the next note), on desktop and tablet.

### 5.84 Aligned is not younger

"The halo for 'aligned with your age' shouldn't be green. White, very low
opacity." Both colour sites picked the hue off `delta > 0 ? orange : green`,
which puts zero on the green side: an organ exactly its age glowed as if it were
younger. Three verdicts now, on both surfaces: orange above, green below, and
white at 30% of the halo's strength at zero. The strength rides `--haloK`,
which the JS now sets per verdict beside the colour, so a dim white and a full
green interpolate together -- across the swipe on the phone, and with the eased
warmth on the card, where "aligned" is the closeness of the warmth to zero.

### 5.85 Swapping two names without swapping what they name

"Replace brain age by mental age and mental age by brain age." The labels in
`PILL` swapped, and with them the two entries in every table keyed by label --
the biomarker descriptions, the organ copy, the annotation anchors, the age
nouns -- so each organ kept its own words and its own anchor and only its name
changed. The brain (organ 0) is *Brain age* and reads as aligned; the neuron
(organ 1) is *Mental age* and reads six years younger. One site keys on the
ORGANS label rather than the pill's and was left alone. The tab order follows
the pill list, so it now reads Heart, Brain, Mental, Lung.

### 5.86 The card's light at 30%

"Reduce the halo on tablet and desktop by 70%." One frame after it became
visible at all (5.83), which is the right order: first make the thing exist,
then set its level. The card's `--haloK` is the phone's 1.55 times 0.30, set in
the same place the verdict dims it, so the aligned white is 30% of 30%. A card
is a pane on a dark page rather than a screen, and the phone's strength on it
read as a stain over the whole top. Checked at 2x on desktop and tablet: a
tint in the corner, orange or green by verdict, and no more.

### 5.87 The flow, a step past the arithmetic

"You really need to see the flow -- 25% more visible." 0.50 x 1.25 is 0.625,
which sits between two steps of the grid; 0.65 rather than 0.60, because the
ask was emphatic and the previous round had already landed a quarter short of
a quarter. Flow drawn alone on the phone: ink 34.5 -> 44.1, +28%. The shader
caps the flow at 0.75, so there is one step left above this before the cap has
to move -- worth saying now, so the next "more" is not a surprise.

### 5.88 "No flow while the cloud is in flight" was the one-second blink

"The flow is still clipping when you transition from one organ to another.
The transition occurs, and then after 1 second, the flow blinks." Every hero
path had been fixed (5.66, 5.67) and measured continuous. The 2D painter had
not: its flow section began with `if (view.morph) return` -- "no flow or
feeding while the cloud is in flight" -- so on the organ-age card and the
immersive picker every organ change switched the stream off for the 760-900ms
of the morph and back on the frame the cloud landed. Measured on the picker's
view, overlay lit pixels per frame, click at frame 10:

    before   2478 2471 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2412 2449
    after    2247 2249 2233 2252 2274 2279 2245 2187 2234 2192 2213 2107 2014 2026 1990 2000 2270 2297

Twenty-four frames of nothing, then everything. The painter now does what the
hero does: two streams, lane to lane and alpha to alpha by the same eased
fraction the cloud travels by; the other end stands in where one has no
stream (`hand`); the neuron dips through its middle (`late`). The two
presets' indices come off the morph's keys (`'o' + organIdx`). The body pass
still paints only the cloud in flight; the strays still wait.

### 5.89 The library is the source of truth, so the engine draws the library's dot

"The flow is too bright now. You only fixed the library... make sure the
library visuals are reflected on mobile, desktop and tablet. The library is
always the source of truth." Flow ink as a share of cloud ink, per surface, on
the previous commit:

    tile 17.6%    phone 25.4%    desktop 20.2%

Three surfaces, three answers, because two renderers drew two different dots:
the tile a firm disc at rF under a faint one at 1.6 rF, rF floored at 1.15 of
its backing pixels; the engine a three-pixel soft cone. Same `FLOW_A`, same
lanes, same count -- and a quarter more ink on the phone than on the tile,
which is what "too bright, you only fixed the library" is when measured.

The engine draws the tile's dot now. The sprite is the outer disc's diameter
(`rF = max(ptSize / 2, 0.77 css px * uDpr)`, the tile's floor restated in
device pixels through a new `uDpr`), and the fragment shader lays down the two
discs -- 0.80 inside 1/1.6 of the radius, 0.30 to the edge, clamped where they
overlap -- in place of the cone, for flow dots only. Then the level: `FLOW_A`
0.65 -> 0.35, "reduce it by 50%", 0.325 to the nearer step. After:

    tile 10.5%    phone 9.4%    desktop 9.8%

One number, within a point, on every surface. The level had been raised twice
and was never the problem; the problem was that "the flow" meant a different
amount of ink depending on which renderer said it. Per-dot brightness change
on the phone with the new profile: 4% median, 19% p90 -- up from the cone's
9% at p90, the price of the tile's harder discs, and still a fifth of where it
started.

### 5.90 Two renderers, one dot: the rule, restated for the flow

The cloud's dot was unified early (5.39, "grain as a ratio"). The flow's was
not, because it looked unified: both read `FLOW_MUL`, both read `FLOW_A`, so
the *inputs* agreed. What did not agree was the shape each renderer turned
those inputs into, and shape is ink. The check that would have caught it is
the one in 5.89 -- the same layer's ink as a share of the same reference on
each surface -- and it is cheap enough to run after every change to either
renderer. It is in `flowratio.js`.

### 5.91 The blink that lived in the last thousandth

"I told you a million times: it is a clip when you morph, and then you wait 1
second, and then, for 0.5 seconds, the flow appears and disappears." Every
earlier measurement had stopped a second or so after the swipe, and had
sampled the flow with reads that could return false zeros -- so a real gap
sitting at 2.5 seconds, among artefact zeros, was invisible. This time: four
seconds, every 33ms, the flow read INSIDE its own draw call, with the number
of flow draws per frame and the visibility uniform beside each sample. On the
phone, Heart to Lung:

    1980ms  516 508 497 489 492 503 504 497 512 505 497 496 492 490 504 488 497
            0 0 0 0 0 0 0 0 0 0 0 0 468 ...

Twelve frames, four hundred milliseconds, 2.5 seconds after the swipe, the flow
drawn on every one of them (two draws a frame, uFlowVis at 1) and not a pixel
lit. Then back. The desktop and the tablet, same test: continuous.

The carousel eases into its final position asymptotically, so the fraction
spends its last stretch in [0.999, 1). The alpha blend between the two ends'
streams (5.67) was gated `f > 0.001 && f < 0.999`: outside that, no blend, and
the colours stand as the A end wrote them -- the OUTGOING slide. Heart to Lung
passes through the neuron, so the outgoing slide of the last hop is the neuron,
and the neuron's alphas are pulses: sparse bursts, zero between. For four
hundred milliseconds the lung's lanes were drawn with the neuron's silence.
Then the carousel snapped to f = 0, A became the lung, and the flow appeared.

The cutoff is gone: the blend runs to f = 1 inclusive, where it is B exactly.
After, both directions on the phone, and the tablet: continuous through the
tail and the snap. The zeros that remain are the neuron's own mid-hop dip (5.66),
two to five frames deep in a hop that touches it -- the exception that was asked
for, and the only one.

Three lessons, all about the measurement rather than the code. Measure for as
long as the user says the thing takes, plus the same again. Read the thing
where it is produced, not where it is displayed, so a zero means zero. And when
a cutoff is written as `< 0.999`, ask what happens in the last thousandth --
on an eased motion, the last thousandth is where the time goes.

### 5.92 Cheaper in code, the same on screen

"Make it cheaper in terms of code." Measured first: 632 KB, of which 54 KB is
markup, 174 KB stylesheet (47 KB of it comments) and 404 KB script (168 KB of
comment lines). Runtime: the engine's JS is under a millisecond a frame and its
GL calls are trivial (six `bufferSubData`, three `drawArrays`); the library's
2D painter is the only real cost, 20–28 ms a frame under software rendering,
which is sixty thousand dots a frame as `Path2D` fills.

Two things done, and one not.

`tools/build.js` writes `dist/index.html`: csso on the stylesheet (without
restructuring, so the cascade order is exactly the source's), terser on the
script, HTML comments stripped. 632 KB → 324 KB, 185 KB → 88 KB gzipped. The
shaders are template literals and pass through byte for byte. Every probe reads
the same on both files: the sweep (`ERRORS none`), the guard (no white, max
alpha 0.900), the flow ratio (10.3 / 9.7 / 10.5% against 10.2 / 9.8 / 10.2%,
inside the run-to-run spread), the frame rate (33.6 vs 32.6 fps on the
library, 60 on the phone). The source stays the file that is read and edited;
the comments are the reasoning and they stay where the decisions are.

In the painter's batching, the bucket key was `rgb + '|' + q` -- a string
built and hashed into a Map for every dot, sixty thousand allocations a frame.
It is an integer now (ink id × 21 + step), the three inks interned once per
batch, and an `order` list keeps the fills in first-use order, which is what
the Map's iteration gave and which matters: a lighter ink over a deeper one
composites differently from the reverse. Verified the honest way -- the old
and the new `makeBatch` cut out of the two files, run side by side in one page
on the same twenty thousand seeded dots, pixels compared: max channel
difference 0 (`batcheq.js`). A page-level comparison of the library tiles was
tried first and could not tell: even with a seeded `Math.random` and a fake
clock, two loads of the SAME file differ by a mean of 3–5 levels (which frame
a tile last painted on is not deterministic), so the unit comparison is the
one that counts.

Not done: removing the archived modes (m0–m15), which is most of the code and
none of the current design. That is a product decision -- the archive is there
to be stepped through -- and it is offered, not made.

### 5.93 The list as the design draws it

A screenshot with a blue rule down the left of the card: "The hover state of
this is wrong. Follow this rule here." The rule is one edge. The eyebrow, the
dots and the names stand on it; the hover pill stands the same distance
outside it on either side, rounded all the way round; every row carries its
age, dim beside its name. Ours was a band cut off flush at the card's left
edge (a −24px margin bleeding into a 0/10/10/0 radius), ending flush with the
figures on the right, and only the selected row showed its age. Now: margin
−14px both sides, padding 14px, radius 999px, ages on every row. And the
eyebrow reads *Biological & organ ages* -- "there is an S to remove on organs
and put on age".

### 5.94 The card's light dipped through white

"When transitioning the organ, the halo on the top right is clipping a little
bit." Traced per frame (`halofade.js`): Heart to Lung, `--haloK` 0.465 →
0.339 → 0.141 → 0.465 across three samples 130ms apart, the colour going green
→ (179 196 173) → orange. The card's light was read off the eased warmth --
green below zero, orange above, white within 0.08 of zero at a third of the
strength -- and a change of verdict crossed zero on the way. Ten frames
through the white, dimmed by 70%, in the middle of every green-to-orange morph.

Now it fades the way the phone's does: the two verdicts are the ends, and the
light blends from whatever it was showing to the new organ's colour and
strength on the morph's own S-curve (`haloFrom`/`haloTo`/`haloNow`, keyed to
`morphStart` the way the camera's `camFrom` is). After: 0.465 flat through the
morph, the colour walking green → orange over the second with no reversal, on
the desktop and the tablet.

### 5.95 A 6% white light, measured on the pixels

"The neutral state has to be a white halo on the top right with an opacity of
6%. For mobile, desktop, and tablet. At the moment I don't see any halo." The
white light was at 30% of the coloured lights' strength, and on the card that
sat on top of the card's own 70% cut. Measured with the light on and off, the
lift of the band under the top edge over the ground (`halolift.js`): 3.5% at
the card's top right, 2.5% at the phone's dome peak. Not a light anyone sees.

The stops alone would have said the phone was at 6% already -- the centre is
151px above the top on a 365px radius, the top edge 41% out, 0.126 of the
strength at k = 0.48 -- and they are wrong by more than half, because the
header's ground and the status bar sit over the gradient. So the strength is
set off the measurement, per surface: 0.19 (× 1.55) on the card for 6.0% on
the desktop and the tablet at the top-right band; 0.74 (× 1.55) on the phone
for 6.0% at the dome's peak. The coloured lights measure 7% on the phone by
the same probe, so the white is nearly their equal there -- which is what "I
want to see it" means. The phone's dome stays centred, as it has always been;
"top right" is where the card's light sits.

### 5.96 The card's edge has its line back

"A line with your edge should have the light. I think it's 4% white opacity on
the top." The ring that was taken off the card in 5.8x (it read as a stray
edge at the phone's strength) is back at the strength asked for: the same
one-pixel gradient clipped to its own padding, white at 4% at the top and gone
a third of the way down, nothing along the sides. Dark theme only, as on the
phone.

### 5.97 "The organ could not be drawn": the wrap read a row that is not there

A screenshot of the phone with the fallback message across it: *cannot read
properties of undefined (reading 'organIdx')*, Kidney age in the strip. It
never showed as a page error -- the frame loop catches its own failures and
only says so after ninety of them -- which is why the error probes were clean
and the user's screen was not.

The carousel wraps (5.8x): past the last reading, k1 is the first one, "so the
step out of the end of the list is the same crossfade every other step is".
In Mobile V6 the first one is the biomarker slide at −1, and MB has no row at
−1. The hero block already knew that for the A end -- `oa = mbAt(max(0,
k0))`, `ia = k0 < 0 ? BODY_I : …` -- and not for the B end, which was written
before the wrap existed and read `mbAt(k1)` straight. So swiping on from
Kidney threw on the first frame of the morph and on every frame after, and
after a second and a half the page said so.

The B end is now read the way the A end is: `ob` from row 0, `ib` the body
when k1 < 0, and `vasc` and `bodyShown` rise with f when the biomarker slide is
the one arriving, as they fall with it when it is the one leaving. Reproduced
before (one swipe on from Kidney, `wrapcrash.js`: "organ render failed" on
V6 and V5), clean after, and the wrap itself looks right: the kidney breaks
into the body over the swipe and the strip reads Kidney age · Biomarkers ·
Biological age.

The lesson is the probe's, again: a page that catches its own errors has to
be probed for the catch, not for the throw. `wrapcrash.js` counts the console
line the catch writes.

### 5.98 The phone's ring is gone on dark

"Remove this screen border on the top and on the left and right of this
screen", with the top of the phone in the picture. That is the one-pixel ring
(5.7x): 34% white at the top, fading a third of the way down the sides. On the
dark phone it read as a drawn frame around the screen rather than as a light
landing on an edge -- the screen already has a black bezel for an edge. Off on
dark; the light theme keeps it, where it is the edge itself against a pale
page and there is no bezel in the picture. The card's 4% line (5.96) stays: it
was asked for separately, and a whisper on a pane is a different thing from a
frame on a screen.

### 5.99 The mobile header, two percent lighter

"Increase the header grey to be a little bit lighter by 2%. On mobile." The
V6 header is a wash of white on the body's black, run down to black by the
scroll (`--v5head`, written per frame). It was 5% -- rgb(13) -- sitting a step
under the 6% cards; it is 7% now, rgb(18), a step over them. Three places say
the number: the JS that drives it, the CSS fallbacks on `#phone` and `.mHead`,
and the foot fog's fallback, which had drifted to 15 and is 18 with the rest.
Measured: `.mHead` computes to rgb(18, 18, 18) at rest.

### 5.100 Aligned: one increment, white

"When aligning with my age, the only increment active should be the one in
the middle. It should be white." The arc coloured the ticks between the
centre and the organ's age and skipped the centre tick itself, so an organ
exactly its age lit nothing: an indicator over a dead scale. Now the centre
tick takes the indicator's own ink (white on dark, black on light, the same
white the aligned halo is) at the lit ticks' 0.95, rising over the last half-
year of the indicator's travel so a morph into the aligned organ ends on a lit
centre rather than switching one on. Checked on the phone and the desktop with
Brain (delta 0): 61 ticks, exactly one above the resting level, `#fff@0.950`.

### 5.101 The dark rectangle: a fourth copy of the number

"The background is cut. It's like a dark rectangle." The 2% lift (5.99) found
three places that said 13 and missed the fourth: the canvas clear colour in the
frame loop, which paints the hero's box the same grey as the header so the box
is invisible on it -- "or a grey rectangle surfaces", as its own comment
warned. It kept clearing to 13 on an 18 header, and the box surfaced, darker.

Both now read one constant, `V6_HEAD = 18`: the CSS driver and the clear.
Measured on the phone with the body showing: header 18, canvas 18 at the
bottom corner; at the top both sit under the green light, 22–24 against 21–23,
a level apart. The rule this leaves behind: a number the CSS and the renderer
both have to agree on is declared once and read twice, never written twice.

### 5.102 One step is one step, across the join

"When I go to biomarker and I go backward to kidney, all of the visuals
change a lot. It should just change one." The carousel is a loop and its
position is unwrapped, so one reading has many positions: Kidney is 9, and
also −2, and 20. The swipe handler already knew this -- it set the target to
the position the finger reached (−2) and glided there -- and then called
`selectPill`, which set the target again, to the reading's slot (9), and
glided there instead: eleven slides the long way round, every organ flashing
through the centre. Measured with the strip name nearest the centre sampled
every 40ms (`loopback.js`), the step from Biomarkers back to Kidney passed
Kidney, Mental, Muscle & bone, Gut, Metabolic, Kidney; the step on from Kidney
to Biomarkers passed five names the other way.

`selectPill` now glides to whichever position of the reading is nearest where
the carousel is: it keeps the caller's target when that target names this
reading (the swipe and the arrow keys have already chosen), and otherwise takes
the shortest signed distance (`bxD`) from the current position -- so a pill
tap and the auto-advance also take the short way round, forward across the
join from Kidney rather than rewinding the strip. After: every step in the
probe passes exactly one name, both directions, join included.

### 5.103 The light theme's own three inks

"On light mode, the three colours need to be inverted. The orange should be
way more orange." The light theme drew the dark palette with the alpha lifted
×3.2, and the README's own note on it said the only real fix was a second set
of values, "a decision rather than a repair". Decided.

Inverted as turned over, not negated: negating would make the orange a blue.
The three keep their roles and swap their tones for the ground -- the
near-white highlight becomes the theme's text ink (46 31 26), the sand a burnt
amber (184 118 46), the orange a deeper, more saturated orange (214 68 12; it
went through 232 92 32 and 222 80 22 on the way, each one "more orange" than
the last against the same alpha).

Two renderers, one table. The engine: six vec3 uniforms (the dark three and
the light three), the shader finds which ink a particle carries by nearest of
the dark three and mixes to its counterpart by `uLight` -- at the end of the
vertex shader, after the ceilings that key off the dark colour's green, so
nothing else changes. The painter: `inkNow(c)` maps a baked ink string at draw
time, so no tile re-samples and the exports carry it. `pushInks()` follows the
pickers through `recolour()`.

The lift, re-measured (`lightlift.js`: mean lift of the organ's pixels off its
ground, halo hidden). The old ×3.2 / ×1.60 were pushing an ink with nothing to
say; with the ink carrying the contrast, ×1.80 / ×1.70 put the tile at 70
levels off its card against the dark theme's 56 and the desktop card at 86
against 76, and the engine and the tile agree on what they put on screen (hue
19–20, saturation alike). The phone's body slide reads fainter than the rest
in light (32 against 51) because its dots are authored faint -- a shell -- and
that was true before; left alone.

Checked by eye at 2× on the card, the phone and the tile: orange marks with
dark specks through them, the same picture on all three.

### 5.104 Darker than the dark theme is light, and red

"You didn't change anything for the colour in light mode. Obviously the dot
should be way darker than in dark mode." And: "more to red, dark red than
orange; adapt everything to mobile, desktop and tablet, not only the library."

5.103 had measured for parity -- the organ as far off the pale ground as off
black -- and got it (1.14× on the card, 1.25× on the tile, 0.63× on the phone's
body). Parity was the wrong target: a saturated orange at a fifth of full on
white is a pastel, and a pastel orange was what the light theme had shown
before. Nothing looked changed, because in the only sense that matters nothing
had. The library read differently only because its tiles pack the dots.

Now: the material is a dark red (156 30 24), the middle a brick (168 84 54),
the highlight the ink (46 31 26); the lift goes back up to ×3.0 in the shader
and ×2.2 on the tiles, so the marks arrive dark. Measured the same way: tile
81 against dark's 57, card 97 against 88, the phone's lung 62 against 72 (its
dots are the smallest, so per-pixel coverage caps what any lift can do). The
hue on screen is 8–9 on all three -- a red -- where 5.103's was 19–20. By eye
at 2× on phone, card and tile: dark red marks with near-black specks, the same
picture on the three surfaces, and unmistakably not the dark theme's.

The lesson is about the target, not the tool. "Inverted" and "darker" were
both said; the first pass heard the first and measured for it. When a request
names a direction, measure the direction.

### 5.105 Shinier, a step back toward orange, and the flow in orange too

"Make the light mode's red a bit more shiny and contrasted, and turn it a
little more orange. It looks a bit sad. For the flow, you can use more orange
as well." The dark red (156 30 24) was the depth the previous note asked for
and, on the page, a mute one. Now the material is a saturated red-orange (204
50 18), the middle a lighter orange (214 110 44), and the highlight -- which
is the flow's ink and the specks through the cloud -- a deep burnt orange (122
38 12) in place of the theme's near-black: still the darkest of the three, so
the contrast the specks and the flow give the picture stays, but it is orange
now rather than brown-black. The lift goes up a step with it, ×3.2 / ×2.4, for
"contrasted". Checked at 2× on the phone, the card and the tile: a lively
red-orange body with darker orange specks, the same on all three.

### 5.106 Two palettes, one row of pickers

"I want the colour to be custom as well: I can pick colours in light mode, but
this set should be independent of the dark one; and the same for dark." The
three pickers edit the palette of the theme that is showing -- `setInk(i, v)`
writes `LIGHT_INKS[i]` on light and the dark three otherwise -- and the
swatches re-sync on the theme control's change event so they always show the
set in hand. Which theme is read off the control's value, not the body class:
the sync runs on the same event as the class toggle, and which listener the
browser runs first is not something to lean on.

Save writes both sets, the light one under `everlab.inks.light`; each is
restored on its own at start, before anything reads the three. The light set
has no "old defaults" guard -- it has no history of being saved unchanged, so a
saved set is a choice. `recolour()` already pushed the six uniforms and
dropped the painter's baked lists, so a pick lands on the engine and the tiles
alike. Probed (`pickers.js`): a pick on light changes the light three and
leaves the dark three; a pick on dark does the reverse; both survive a reload.

### 5.107 Mobile (viewport): an entry, not a mode

"Add a version, mobile (viewport), that fills the design to the viewport so we
can test on our phone. No iPhone frame." The full-screen flag already existed
for the `/phone` route (`CARD_STATE.fullscr`, setMode writes it into the class
list); what was missing was a way to reach it from the menu, on the current
mobile design rather than V6. A new mode index would have meant touching every
`version === 20` and the class chain, so it is an entry in the dropdown --
value `viewport` -- that sets the flag and calls setMode(20). From the bar the
bar stays (`showBar`); by hash, `#m20v`, it goes.

One thing bit: setMode itself rewrites the address bar to `#m` + mode and the
dropdown to the mode's own option, which stripped the `v` and reset the entry
the moment it was chosen -- and with the hash already `#m20`, going to `#m20`
was then no change and the frame never came back. setMode now writes the entry
and the flagged hash when the flag is on. Probed at 390×844 (`viewport.js`):
by hash, `#phone` is 0,0,390,844 with the bar hidden; by menu, the same with
the bar showing; picking Mobile again or any other hash takes the flag off.

### 5.108 Organs -- Fine Grain: twice the particles, the same picture every time

The brief: a second collection in the library at exactly twice each organ's
particles, sampled from the organ's geometry rather than duplicated, dots a
little smaller with the same variation, anatomy and framing kept, particles
distinct, palette and themes kept, the card layout and export reused, the
count shown, deterministic, verified side by side, responsive. Plus a Density
select, Normal / Dense.

The cloud builder took the count. `buildCloud(..., opts)` with `{ count, amb,
rnd }`: `n` in place of N, `amb` in place of AMB, `rnd()` in place of every
Math.random, INK_PICK read modulo N -- and a cloud built this way carries its
own seed table (the five sizes, the strays' negative flag) and its own ink
picks, drawn off the same generator before the positions so the sequence is
fixed. The three custom builders (fingerprint, iris, sphere) take the same
option and read the cloud's own body count. The painter's caps went per-cloud
(`bodyN(cl)`), and both samplers read the cloud's seed and ink tables when it
has them. Left out, everything is exactly as it was: the engine's clouds are
still N, still off the shared tables.

The size: the body prefix must hold twice the library's largest target (11800,
the iris and the sphere) with the strays behind it, and 2N - 2AMB is 23090 --
five hundred short -- so FINE_N = 2N + 512, with the strays pinned at 2 x AMB
so the count doubles exactly rather than by ratio. The tile: the same options
as the base tile with the body target at twice what the base tile actually
draws (its target through `organN`, which caps it), the flow at twice, the dot
at 0.78, and the repaint dealt into six groups instead of three.

Two things bit. The Density select came out as an on/off switch: the bar turns
every two-option select into a toggle (`segmentise`), and Normal is not Dense
turned off, so it joins the version and bio-visual selects in the exemption.
And "exactly twice" of a count that was not itself stable: the Organ Library's
counts moved by up to a thousand between two loads of the same page (Brain
10117, then 11275), because `dotTarget` iterates its gap solver on whatever
random sample it is handed. So the page's Math.random is a seeded mulberry32
now -- every start-up draw in one fixed order -- and both collections read the
same on every load; the fine clouds have their own generators on top, so their
pictures do not depend on what else the page drew first.

Verified (`finegrain.js`, `finestable2.js`): thirteen cards, every fine count
exactly twice its base card's (Brain 10398 -> 20796 ... Sphere 12245 ->
24490); counts identical across two loads, both collections; the SVG export of
a fine tile identical across two loads except sub-pixel drift from a frame's
difference in the fake clock; the PNG export a 2540x1920 file named
`00-brain-fine-dark-...`; the Density select and the nav move each other; the
fine panel at 17 fps under software rendering against the normal library's
33, with the cloud repaint in six groups (it was 11 fps in three). By eye at
2x: the heart at fine grain is the same heart, finer and denser, every dot its
own.

Not attached: the brief's reference screenshot arrived afterwards ("inspi") --
a very fine, even stipple with every grain still a dot -- and the dot went from
0.82 to 0.78 of normal on the strength of it.

### 5.109 The engine carries its ink index, not an inference

"Reflect colour from library", with the phone's light-mode iris in pale peach
-- the dark palette on the pale ground -- while the library showed the red.
Could not be reproduced here: the phone's light iris renders the light three
in this environment, with and without a saved custom palette (`savedpal.js`,
`iriscrop.js`). Most likely a cached page; but the request stands on its own
merits. The engine inferred which ink a particle was by nearest colour to the
three dark inks, and the painter mapped by ink identity -- two mechanisms for
one fact, and an inference is the kind of thing that fails on a palette it was
not tuned against (two saved inks close together, say).

Now the fact travels with the particle: an `aInk` attribute, 0/1/2 for the
organ, its strays and the flow, 3 for the ghost outline (which keeps its own
colour in every theme), written once when the buffers are built. The shader
maps by it; the three dark-ink uniforms and the distance test are gone. The
painter already mapped by ink identity, so the two now read the same index.
Checked: shaders compile, no null uniform locations, the phone's light iris is
the library's red with a saved custom palette in both themes, sweep clean,
flow ratios unchanged.

### 5.110 Not scored: the legend's fourth reading, on a switch

"Create a tweak, Not scored. If on, add the label next to Out of range." The
meter already draws it -- the grey remainder after the three coloured runs --
and the legend did not say what it was. Now a bar switch (`stNs`, a two-option
select the bar renders as a toggle, off by default) puts a fourth item beside
Out of range on every surface that has the legend: the desktop biomarker card,
the phone bento, and the V6 hero's legend, where the count is derived from
BIO_N (124 less 81, 9 and 6: 28) rather than typed. The dot is the meter's
own remainder grey, per theme. A class on the body, held in CARD_STATE so
setMode does not drop it on a page change.

One thing bit: the hero legend lays its spans out by an id-strength rule, and
a class-strength `display:none` lost to it, so the item showed in the hero
whatever the switch said. The hiding rule now outranks it by one class and
steps aside when the switch is on, so the item takes the same flex row as its
siblings. With four items the hero's row closes up by four pixels a gap so its
ends sit clear of the header's side fade. Probed (`notscored.js`): off on
desktop, on shows "28 Not scored", the state survives a change to the phone,
off again hides it everywhere.

### 5.111 Density on every surface: one cloud, two draw counts

"Density select should be on tablet, desktop and mobile. This needs to replace
the visual by the library one." The engine's buffers were N = 12,245 a cloud,
and Dense is twice the library's largest target; the fine-grain tiles had
their own clouds at another size, which the engine could not draw without
re-uploading everything that hangs off N.

The way through was already in the design: a cloud built by independent
random sampling has no order, so its first k particles are as uniform a subset
as any other, and both renderers already draw a prefix (orgDrawN, samplePts).
So every cloud is built at the fine size -- N = 2 x 12,245 + 512, AMB 1,400 --
and density is how far in a surface draws: Normal the library's target, Dense
twice it. The extra particles are the NEXT ones in the same cloud, new points
of the same geometry, and the fine-grain tile is now literally the base tile
plus as many again. The engine on Dense draws orgDrawN x 2, ambView() (1,400
strays for 700) and flowView() (420 flow dots for 210, out of the 780 it
already computes) at FINE_DOT. The separate fine clouds, their seed tables and
per-organ generators went; buildCloud keeps its `opts` (harmless, unused).

Two caps, and the first pass conflated them. With the buffer's old cap gone
the normal Iris tile grew from 12,445 to 14,433 and the Sphere to 15,450:
doubling the cloud is not a licence for the normal set to grow. `organN` is
now the DESIGN's cap, the 11,545 body slots the buffer used to have, applied
to every normal count (the library's targets, imTarget, orgDrawN before the
x2); `cloudIdx` caps only at what the cloud holds, so twice a capped count
fits. Iris 12,445 -> 24,890, Sphere 12,245 -> 24,490, as before.

The switch is one state however set: `applyDense(on)` from the bar's select or
the library's two nav entries sets denseOn, the body class (held in CARD_STATE)
and the select; the memoised counts are per density. Probed
(`denseengine.js`): phone Lung 7,166 -> 14,332 body, 700 -> 1,400 strays, 210
-> 420 flow; desktop Heart 7,806 -> 15,612; the state survives a page change.
Library (`finegrain.js`): thirteen cards, every count exactly double; counts
identical across loads. The flow-ratio probe had the buffer's slice
boundaries typed in (13,000 for the flow) and read the strays as flow at the
new layout -- moved to the new offsets, the ratios read 10.6 / 10.3 / 10.4%
as before. Start-up: the bigger clouds cost about 300 ms more here (600 ->
900 ms to first draw), which is the price of Dense being one switch away on
every page rather than a rebuild.

### 5.112 Unclassified: two readings of the panel, on every screen

Four mocks -- with unclassified, without, phone and desktop -- and "create this
tweak for all screens". The Not scored switch (5.110) becomes Unclassified,
and rather than deriving a fourth number from the three it carries the mocks'
own figures: both read 110 in total; without is 80 Optimal, 24 Suboptimal, 12
Out of range with the meter full (69 / 21 / 10%); with is 68 / 20 / 12 plus 10
Unclassified, the meter leaving its share grey (62 / 18 / 11%). Every legend
count and meter run carries both readings as `data-on` / `data-off`, and
`applyUnclass` writes the one in force, so the hero (built from BIO_SETS), the
desktop card and the phone bento switch together and BIO_FILL follows. In the
V6 hero four items are laid two by two, as the mock has them -- a two-column
grid, centred, since a wrapping flex row put three on the first line. The
mocks' arithmetic is kept as given: the without reading sums to 116 against
the 110 shown, which is the design's to settle, not the prototype's. Probed
(`unclass.js`): 80/24/12 <-> 68/20/12/10, meters 69/21/10 <-> 62/18/11, hero
spans on two rows at two shared x positions, state survives the change to the
phone, off again everywhere.

### 5.113 No action on a hero tap

The phone's organ-age sheet ("Organ ages ... Your body age is 34") opened from
a plain tap on the hero card; "remove this modal on tap, no action on tap".
bxUp's tap branch now returns without doing anything -- a swipe still moves the
carousel, the dots still select, the arrow keys still step. The sheet itself
(sheetL) is still built, since nothing else is wrong with it, but nothing
opens it; the desktop card's modal is untouched, as the request was the phone
screen. Probed against HEAD: the same tap opened `oaModal` there and opens
nothing now.

### 5.114 Two lines, and a round of the desktop card

The published hero legend put three items on the first line and the fourth
alone on the second; "in 2 lines like this", with the mock: Optimal and
Suboptimal, then Out of range and Unclassified, each line centred, and the dot
before the count. The grid of 5.112 aligned columns rather than centring
lines, so it goes: the legend is a wrapping flex row again, a zero-height
break element after the second item takes the whole row when the switch is
on and is display:none otherwise, and the items are reordered dot, count,
word. One thing to know: the legend is absolutely positioned off the number,
whose width is the number's, so without a width of its own Chrome's
shrink-to-fit gave it half the parent and wrapped every item -- the 280px
width is back for that reason, not for the pairing.

Then five notes on the Desktop V5 organ card, each a line: the highlight pill
on a 12px radius rather than fully round; the caption 12px closer under the
number (status margin 4px -> -8px; the stack is bottom-aligned so the number
comes down to meet it); the arc's ends blurred -- at scale .52 the arc is 343px
in a half-card of 266, and the base mask (clear by 4%, full at 30%) was still a
third strong where the card clipped it, so the b5 mask runs 14% -> 42%; the
*Get test* action removed; the untested figure at half opacity. And the list
moves to the foot of the card, the eyebrow staying at its head, inset 24px from
the bottom as the eyebrow is from the top. Probed: list bottom = card bottom -
24, age block down 12 with the caption where it was, button display none,
figure opacity .5; modes and page errors none. The phone's own *Get test* and
untested figure are as they were -- the screenshots were the desktop's.

### 5.115 The hero legend's ink, the hero's one number, and the strip's mask

Three on the phone hero legend in a row: count and word in one colour, white at
56% (black at 56% in the light theme), the count medium rather than bold, both
up 2px (14 / 13). Then the design's typography for the number itself -- medium,
64 on a 64 line, letter-spacing -1 -- for every hero figure: the ages were 57px
at -2.3, the biomarker count 45.6px at -1.84, and "the biomarker hero number
seems inconsistent with the other hero number" was exactly that. The count now
inherits .v4AgeN's size rather than setting its own.

Then the legend's second line, which the published version did not show at
all: the age strip's side fade is a mask, and a mask clips at its element's
box, so a line hung below the strip is simply not drawn. At the 64px figure the
first line already ran 5px past it. The strip is 40px deeper as padding-bottom
(border-box, so height 150 and bottom 59 keep its top edge), with the numbers
pulled up 20px to keep their centre; with Unclassified on the arc and the strip
lift 16px so the second line clears the names. Not in the empty states, which
size the strip their own way. Probed (herolook.js): off, one line inside the
box; on, two lines at 482 and 510 inside a box ending at 531, names' text from
538; the organ slides unchanged but for the size.

### 5.116 The arc after a backward swipe

"The arc progress is missing / doesn't react properly when I go backward." The
carousel's committed position bxT is unwrapped -- that is how the loop is
travelled the short way -- so a swipe back from the biomarker slide (-1) puts
the last organ at -2, the one before at -3, and so on. Three readers took
`bxT < 0` to mean the biomarker slide: the distribution's `want`, the arc's
`arcGoing`, and the idle cycle's hold. So every organ reached by swiping
backward kept the biomarker distribution on the arc -- green run from the left,
no indicator, no age scale -- until a forward swipe brought bxT back above
zero. All three read bxWrap(Math.round(bxT)) now. Probed with pointer swipes
(arcback2.js) on the previous build and this one: three swipes back there left
the arc at the distribution with the indicator at opacity 0; here each lands on
the organ's own gap -- indicator on, ticks green or orange to the reading.

### 5.117 One dropdown for the switches

"Put all of these tweaks inside one select, a dropdown listing each item with
a toggle." A `<details>` in the bar, its summary wearing the selects' shell and
chevron, and a panel of rows: Biomarkers, Unclassified, Biological age, Organ
ages, Coverage, Activity, name left, toggle right. The selects are still the
controls, and segmentise() still renders each as its toggle, now inside its
row. The panel is position:fixed because the bar scrolls sideways and would
clip a child; a small script places it under the bar when it opens and closes
it on an outside click, Escape, or a bar scroll. Version, Mode, Density, the
inks and Refresh stay in the bar. Probed (tkmenu.js): six rows with toggles,
a toggle flips its state with the panel staying open, outside click and Escape
close it.

### 5.118 A 160px reading, and the ranges' own colours

"Arc, number and the values below should fit into a 160px height area." With
two legend lines the block ran from the indicator's top to the legend's foot in
161px. The legend sits 5px closer under the number (margin 14 -> 9 in that
state) and its lines 2px closer (row gap 7 -> 5): 152.

"Use the exact colour for ranges", with the two panels, dark and light. The
prototype had one set (#5cc47f / #f2c744 / #ef6f63) typed in some thirty
places; the design has two, a pastel set on the dark ground and a saturated one
on the light. They are CSS variables now -- --rgOpt, --rgSub, --rgOut, --rgUn on
:root and again on body.light -- and every legend dot, meter run, range bar and
the sheet's gradient reads them; the unclassified grey is also the meter's
remainder, as it is in both mocks. Script that paints a range (the hero's
distribution arc, the tablet's arc tone, the signal sheet's zones) reads them
through rangeCol(), cached per theme. The values were read off the screenshots
by eye -- the tokens' hex, if it differs, goes in those two lines and nowhere
else. The organ-age colours (younger green, older orange) are a different
reading and were left alone. Probed (rangecol.js): dots, runs, bars and
gradient stops report the dark set, then the light set after a theme change;
the hero arc's lit ticks take the light green.

### 5.119 Organ up 16px, the arc's ends blurred, and the tablet's stack

"Push up organ by 16px on mobile." The organ slides' vertical offset is a
clip-space pan in the hero frame -- orgDrop, -0.25 at 2 / 202 per pixel --
weighted by how little of the body slide is showing, so the same weight
carries the lift: -0.25 + 0.158. The body on the biomarker slide is where it
was. Screenshot against the previous build: the heart's crown 16px higher.

"Is there a blur effect on both edges? If not add 6px blur progressive." There
was not: two Gaussian filters were declared in buildArcA and applied to
nothing; the ends relied on the side-fade mask alone. Now six filters, 1.5 to
11.5 in the svg's units (0.8 to 6px on screen at the .52 the pages draw it),
and each tick past the middle half of the scale takes the step for its
distance, so the ends dissolve rather than thin. The filter regions are in
user space and cover the whole scale -- a tick's own box is a pixel wide, and a
percentage of that is nothing to blur into. 30 of 61 ticks carry a filter;
frame pacing here unchanged (61 fps under swiftshader either way).

"Tablet: push up hero number + arrows + sub by 16px; push up the bottom
carousel by 16px; carousel item active medium not bold." The number, its
arrows (they hang off #ageBig) and the caption ride one transform, so b5's
translateY(24px) is 8px on the tablet; the name strip's bottom goes 10 -> 26;
the strip's names are weight 500 -- all of them, since the active one is told
apart by opacity and blur, not weight. Probed against the previous dist:
ageBig 455 -> 439, arrows 484 -> 468, caption 533 -> 517, strip 587 -> 571,
weights 600 -> 500.

### 5.120 The biomarker slide, to the design's two frames

"Adjust mobile version biomarkers", with the two frames. The legend is no
longer lines of dot-count-word but a row of columns divided by hairline rules,
one a reading, each with the dot and count on its first line and the word
beneath -- three columns without the unclassified, four with, the same layout
either way, so the break element and the two-by-two rules of 5.114 go. The
legend hangs off the number, whose width is the number's, so it takes the
hero's width from a custom property resize() writes (--heroW) less 48px, and
the columns share it. The strip's side fade came in from 20% to 6% a side:
the outer columns stood in it and read at half strength. The 16px lift of the
reading is unconditional now, the legend being two lines in both states.

The arc reads the panel as the frames draw it. Without the unclassified, the
one green band to the optimal share stays, and the indicator stands at the
band's end in the range grey rather than hiding. With them, the distribution:
optimal, suboptimal, out of range in the ranges' colours, then the grey
remainder, and no indicator -- the bands mark where each share ends. The
indicator hands over at the half-way point of the swap, where both readings are
at nothing (the age's needle fades out over the first half, the end-stop fades
in over the second, with the reveal), so it never jumps in view. Probed
(bioslide.js): off, ticks 0-43 green then base, indicator #8c8c8c at the band's
end; on, 0-37 green, 38-47 sand, 48-54 salmon, 55-60 base, indicator at 0; the
light set on the light theme; four equal columns of 81px, rules between them;
the block 149px. Arc-wrap, Unclassified and error probes as before.

### 5.121 Arc cycle, the body's fit, and the tokens

A mobile-only tweak, Arc cycle, in the Tweaks dropdown (a row that is in the
list only when a v7 page is up). On, the biomarker arc's band keeps its extent
-- the optimal share, the indicator at its end -- and its one colour walks the
four statuses, optimal, suboptimal, out of range, unclassified, two seconds
each, easing into each over the first 350ms, looping without a pause. One
colour on the arc at any moment, whichever way the Unclassified switch is set:
with both on, the cycle says what the bands would have said, one at a time. A
flag the arc reads each frame (CARD_STATE.arcCyc, body class arcCyc, kept
through setMode). Probed (arccyc.js): the row shows on m20 and not on the
desktop; sampled every 250ms for 8.5s the band carries exactly one colour, eight
samples a state, the crossfade visible as mixed values at each step; with
Unclassified on as well, still one colour.

"Visual is too close to arc here: reduce by 8% and move up 16px" -- the body
on the biomarker slide. The hero grows the body by 30% over the organs'
framing; that is 19.6% now (1.196 = 1.30 x 0.92), and its pan gains the same
16px (0.158 clip units) the organs got, on the body's own weight. Screenshot
against the previous build: the crown 16px higher, the shoulders inside the
arc's span.

Then the tokens, from the design: dark mode optimal / younger AAEEC2,
suboptimal / older FFE29F, out of range FE8087, aligned / unclassified white at
48%, "consider this on arc". The dark range variables take them (the grey is
rgba now, so the colour parser behind the cycle's crossfade reads rgb() and
rgba() as well as hex, and returns rgba). The age arc on the dark ground takes
the same three -- younger in the optimal colour, older from the suboptimal to
out-of-range by seven years -- with no desaturation, the tokens being the calm
the fifth was for; the aligned centre tick lights to 48% rather than 95%; the
younger / older dots in the lists and pills go through ageDot(), the tokens on
dark and the old green and amber on light. The light theme's ranges and arc
are as they were. Probed: legend dots, meter runs, range bars and gradient
stops report the tokens; the arc's lit ticks read rgb(170,238,194) younger and
rgb(254,170,145) two years older; the cycle's states are the four tokens.

### 5.122 The cycle goes; a lighter blur, on every arc

"No, no need to highlight the portions one after each other." The Arc cycle
of 5.121 -- one colour walking the four statuses -- lasted the afternoon; the
row, the state, the body class, the frame logic and the colour parser behind
its crossfade are all out, and the biomarker arc reads the design's two frames
as in 5.120. It is in the history (d445090) if it is ever wanted back.

"Reduce the blur effect": the end blur's six steps are halved, 0.8 to 5.8 in
the svg's units, so about 3px on screen at the very ends rather than 6.

"Add blur effect on edges for ALL arcs": the main scale (#arcA) is one svg
that every dashboard, tablet and phone page draws, so the blur was already on
those; the library card's arc (ageArcMarkup, built as a string) had none and
takes the same treatment -- six filters per instance, ids per instance since a
page can hold several, applied past the middle half of its 23 ticks. And the
Desktop V5 card's narrower side fade (14% -> 42%), put there so the ends had
dissolved before the card clipped them, comes off: the blur does that job now,
and the arc reads the same on every page.

### 5.123 Arc cycle, as the frames have it

Three frames arrived with no words: the biomarker slide with, in each, one
status lit -- optimal green on its own portion of the arc in the first,
suboptimal sand on its portion in the second, out-of-range salmon in the third
-- the rest of the scale at rest, and in the legend the matching column bright
while the others stand back. So the cycle of 5.121 was the wrong cycle, not a
wrong idea: it recoloured the whole band; the design lights each status where
it lives. Back it comes, that way. The arc's ticks belong to segments (the
shares, as the static bands draw them; four with the unclassified shown, three
without), and each frame one segment is lit in its colour at the band's
strength while the rest sit at their base grey. Two seconds a state. The
change runs 350ms and is out-then-in -- the leaving segment fades to base over
the first half, the arriving one rises over the second -- because the brief
tells the arc never to carry two status colours at once, and a plain crossfade
did, for a frame or two. The frame toggles an `on` class on the legend's
column when the state changes; CSS steps the others back to half opacity and
brings the count to full ink on the arc's own 350ms. The indicator hides while
the cycle runs; the lit portion marks itself. On by default, since these are
the design's frames; the row stills it.

Probed (arccyc2.js): sampled every 300ms, one colour on the arc at every
sample, the lit range moving 0-43 / 44-56 / 57-59 across the three states
without the unclassified and 0-37 / 38-47 / 48-54 / 55-60 with, the `on` class
on the matching column each time; off, the static bands and every column at
full opacity. Arc-wrap, error and all-arcs probes clean.

### 5.124 The portion grows in; the middle 70%; no switch

"The portion should grow and be revealed from left to right." The arriving
status no longer fades up as a block: the leaving one fades out over 200ms,
then the arriving one's front travels from its left end to its right over
450ms (eased), a soft edge a tick and a half wide, so the portion is drawn in
the way the reveal draws the bands when the slide lands. Still one colour on
the arc at any moment.

"For biomarkers don't consider the first 15% and last 15% of the portion, as
we don't see anything." True: the side fade is clear by 4% and full at 30%,
and the end blur sits on the outer quarter, so a share laid on the whole
scale lost its ends. The panel is laid onto the middle 70% now -- a share q
sits at 0.15 + 0.70 q -- for the cycle, the static bands and the band's
indicator alike, and the ticks outside the window stay at rest.

"Remove the action on the ranges on biomarkers, the animation should run
without interaction from the user." The Arc cycle row goes: the cycle runs on
the hero on its own, and BIO_CYCLE (a constant) is what is left of the switch,
so the static bands are one edit away rather than a rebuild. The legend's
column rules, which hung off the tweak's body class, are unconditional.

Probed (arcsweep.js), sampled every ~50ms across a change: the unclassified
portion (ticks 48-50, 0.80-0.83) fades, the column class moves, then the
optimal portion grows 9 -> 34 (0.15 -> 0.57) over about 450ms and holds; never
more than one colour; nothing lit below 0.15 or above 0.85. Arc-wrap and error
probes clean.

### 5.125 The middle 60%

"Exclude the left 20% and right 20% for the biomarker portions." The window
of 5.124 was 15% a side; it is 20% now, the panel laid onto the middle 60% of
the scale -- one constant, W0/W1, that the cycle, the static bands and the
band's indicator all read. Probed: nothing lit below 0.20 or above 0.80, the
optimal portion 12 -> 32 of 61 ticks, one colour at a time.

"Need smoother ease in-out for the range in the arc animation." Both halves
of the change run on a quintic ease now (6x^5 - 15x^4 + 10x^3, no velocity at
either end) rather than the linear fade and cubic sweep they had, a little
longer -- 300ms out, 650ms in -- and the sweep's front is three ticks wide
instead of one and a half, starting three ticks before the portion so the
first tick rises as gently as the rest. A state still holds for the remainder
of its two seconds.

Asked again once that was live, so the change is rebuilt as two wipes rather
than a fade and a sweep: the leaving portion recedes from its right end to its
left (450ms) and the arriving one grows from its left end to its right
(850ms), both fronts seven ticks wide with each tick's own rise eased across
the front, on the quintic clock. Nothing switches; the edge is a gradient that
travels. The legend's column change takes the same 600ms rather than 350.
Probed at ~50ms: the out-of-range portion recedes 44 -> 41 over the first
half-second, then the optimal portion grows 12 -> 32 over the next .85s; one
colour at a time throughout.

### 5.126 The middle 60% is the visible arc

"The range portions should be included into these 60% central." They were
laid there (5.125), but the hero's arc kept the base side fade -- clear by 4%,
full by 30% -- so a portion's first ticks sat under the fade and it looked to
start short of where it did, and the end blur began at 25% from each end, one
step inside the window. The hero's arc now fades only outside the window
(clear by 3%, full by 20%, and the mirror), and the end blur on every arc
starts at the 20% line rather than 25%, so the middle 60% is crisp and whole
and the portions fill exactly it. Probed: the lit optimal portion runs from
the first fully opaque tick; the desktop and tablet arcs keep the base fade.

### 5.127 Bio graph: the arc, or a line of dots

"Instead of the arc for the biomarker, maybe just dots -- a line of dots, filled
with the colour of the ranges by percentage. A tweak: the arc by default, the
dots the other one." A Bio graph row in the Tweaks dropdown, Arc / Dots, kept
as a select (two named readings, so segmentise leaves it alone, as it does
Density). Dots is a body class held in CARD_STATE.

The dots are forty `<i>` in a flex row, space-between, the legend's width
(--heroW less 48) at bottom 222px -- where the arc's ticks sit -- 6px each,
resting at white 14% (black 12% on light). paintDots() gives each range its
share of the forty by largest remainder, so the counts always sum to forty,
and fills them left to right in the legend's order with the range variables;
the unclassified take the range grey when shown and rest when folded in. It
runs from the frame with the reveal fraction and only writes the DOM when the
signature (state, theme, dots revealed) changes. The swap is the arc's own:
on the biomarker slide the arc's opacity is arcFade x (1 - bioArc) and the
dots' arcFade x bioArc, so the dots arrive as the distribution would have and
the age scale is back on the organs; the reveal fraction is bioRev, so they
fill left to right once the slide lands. With the dots the arc's status cycle
stands down and the legend's columns all read at full.

Probed (biodots.js): default Arc, dots display none; Dots: forty dots, 28 / 8
/ 4 without the unclassified and 25 / 7 / 4 / 4 with, the arc at 0 and the
dots at 1 on the biomarker slide, the reverse on an organ, back again on the
return; the state and the select survive a page round trip; the light set on
the light theme. Error, mode and arc-wrap probes clean.

### 5.128 The dots on the arc's curve

"Put the dots in the same way as the arc, with a circular shape, keep the blur
on the background and the fade-out on the edges, and more gap between the
dots." The straight row (5.127) goes; the dots are a `<g>` of circles inside
#arcA itself, built by buildArcA on the same geometry -- ptA at the ticks'
midline, evenly pitched across v -9..9, the middle 60% the panel is laid on --
so the svg's side fade, its scale and its place on every rebuild are theirs
for nothing. Twenty-six of them at r 2.4 (3.7px on screen, a 4px gap), down
from forty at 6px edge to edge. The group's opacity is the swap (bioArc), and
in the tick loop the ticks under the dotted stretch stand down by the same
weight while the ticks outside it -- the blurred, fading ends -- stay as the
arc's background, so the dotted centre reads as one arc with the grey ends.
paintDots() sets fill and opacity on the circles rather than a background on
divs; the DOM row, its CSS and --heroW dependence are gone. The indicator
stays hidden with the dots, as with the cycle.

Probed (biodots.js): 26 circles on a 20px rise across 204px, gap 3.9px; 18 /
5 / 3 without the unclassified, 16 / 5 / 3 / 2 with; the ticks under them at
base x (1 - bioArc), the ends unchanged; the group at 0 on an organ slide and
1 again on the return; state through a page round trip; the light set on the
light theme. Error, mode, arc-wrap and all-arcs probes clean.

"No gap between the dot and the arc dot." The dots were pitched at half-steps
inside the window, so the first sat 0.35 years in from its edge and the
nearest grey tick 0.5 beyond it: a gap of nearly two tick pitches at each
join. They run edge to edge now (v = -9 + 18k / 25), the first and last on the
window's ends. Then, before that shipped: "fade out on the left and right
more; remove the 20% safe space, I can see the arc there; I'll remove the arc
on this version totally, just the 60% with the dots." So in the Dots version
every tick stands down as the dots come up -- the grey ends included -- and the
dotted line carries its own fade: the outer six dots each side taper to a
tenth on a smooth curve, so the run dissolves at both ends with nothing else
to soften it. Probed (dotjoin.js): 26 dots from v -9 to 9, no tick above base
x (1 - bioArc) anywhere on the biomarker slide, the end dots at a tenth of the
middle's strength; the arc whole again on the organ slides.

### 5.129 The dots by link, and the phone's biomarker search

The message about the dots came a third time, and the reason was not the
build: the viewport entry has no bar, so on a phone the Bio graph select cannot
be reached and the arc is all anyone sees. The choice travels in the link now
-- a trailing `d` on the hash (#m20vd, #m20d) sets CARD_STATE.bioDots and the
select before setMode runs. modeFromHash, viewportFromHash and a new
dotsFromHash read the suffix. Probed: #m20vd opens fullscreen with the dots at
1 and every tick at 0; #m20v is the arc as before.

"Extend the biomarker screen so we can simulate the search, below the
filters." The phone's list grows from one group of four to seven groups of
twenty-five (kidney, heart, metabolic, thyroid, blood, inflammation, all
placeholder readings), each a `<section class="mgrp">` so a filter has
something to hide and show, and the last row's missing rule is a :last-child
rule rather than an inline style. Under the filter chips, a search box in the
select's shell. Its behaviour, as asked:

- Focus: the wrapper goes position:sticky at the top of the scroll container
  (on the phone's ground, with a soft shadow) and the container scrolls up to
  it, smoothly; the body wears mSearchOn, which hides the main navigation
  (.mTabs) while the keyboard is up and gives the list its padding back.
- Typing: the list gives way to a shimmering skeleton of six rows for 380ms,
  then the groups are filtered by the row's name -- rows that miss hide, groups
  with nothing left hide, and an empty line names the query. The cross shows
  as soon as there is text, clears it, and keeps the focus (pointerdown is
  prevented so the field never blurs on the way).
- A scroll by the reader blurs the field, so the keyboard goes. Two scrolls
  are not the reader's and are ignored for a beat: our own scroll-to-top on
  focus (900ms) and the container clamping its position when the list just
  got shorter (250ms after a change) -- the second was found by the probe,
  which saw the field lose focus on the first keystroke. To the same end the
  results area (list or skeleton) is kept at least a screen tall while the
  search is up, so a short result cannot pull the stuck field back down.
- The wrapper stays stuck while the field holds text, so a filtered list
  keeps its search in view after the keyboard has gone; cleared and blurred,
  it goes back into the flow.

Probed (msearch.js, touch emulation at 390x844): tap -> stuck at 0, scrolled
to it, tabs gone; "ser" -> skeleton, then Liver's four rows alone; a miss ->
the empty line; the cross -> all 25 back with focus kept; "chol" then a hand
scroll -> blurred, tabs back, the search still stuck with its three rows;
cleared -> back in the flow. Error and mode probes clean.

### 5.130 The search bar pinned under the status bar; the cross; the home indicator

Three from the device. "The search should be below the top navigation -- the
hour and the battery -- fixed with a dark background; when you scroll the
keyboard disappears, and the user can click again and the keyboard appears."
The sticky-on-focus of 5.129 went back into the flow once the field was empty
and blurred, so after a scroll had dropped the keyboard the field could be
gone. The wrapper is always sticky now, at the top of the scroll container on
the phone's ground, with a shadow (and .stuck) once it is actually pinned;
where the status bar lies over the page (V4 on, position:absolute) it pins
under it -- --msTop is the bar's height, read live since setMode moves the bar
-- and once pinned backs the bar with the same ground (a ::before) so the list
does not scroll under the hour. Its z-index is 4, below the status bar's 5, so
the text stays on top. On the device the bar is hidden and the safe-area
padding does the same job, so --msTop is 0 there.

"Click the clear icon: we shouldn't put the search at the top of the screen.
It should stay in position, we don't interact with the focus, we just clear."
The cross called focus(), and the focus handler scrolled; it clears and
refilters and does nothing else now, pointerdown prevented so the field's
focus is neither taken nor given by the tap.

"The main nav should have more padding on the bottom, it's too close to the
home navigation; and the home indicator should be on the iPhone frame, fixed
with the main nav." The tab bar's bottom padding is 18px plus the safe area
(was 8); in the frame, where the device is not there to draw it, a 134 x 5
home pill sits 8px off the bottom inside the tab bar, with 30px of padding
above it.

Probed (msearch.js): the cross leaves scroll and focus as they were (828, still
focused, all 25 rows back); a hand scroll blurs and a retap refocuses with the
bar still pinned; in the frame the bar pins under the status bar (top 39px,
z 4 under 5), the tab labels sit 35px above the frame's edge, the pill 134 x 5
at 8px. Error and mode probes clean.

"In some cases there is still empty space at the bottom when you search.
Make sure this never happens; the screen always fits the content." The slack
was the screen-tall results area of 5.129, kept while the field held text so
the pinned bar could not be pulled down by a short list; with the keyboard
gone it showed as a blank under three rows. It is kept only while the field is
focused now -- the keyboard covers it then -- and dropped on blur, so the page
is as long as its results; if that lets the bar back into the flow, it is
still there to tap. The clamp that dropping it can cause is held off the
scroll-to-dismiss for a beat, as the other non-reader scrolls are. Probed:
after a hand scroll blurs a three-row search, minHeight is cleared and the
scroll height is the content's (no slack); focused again, the slack is back
under the keyboard.

### 5.131 A keyboard in the frame; dots by default, one after another; a truer skeleton

"I need a keyboard. Can you just put an iOS keyboard for the sake of the demo?"
The frame has no device under it to raise one, so the search stood over a
blank where the keyboard would be. The frame draws one now (.mKbd, built by
the script): four rows -- qwertyuiop, asdfghjkl, shift zxcvbnm delete, 123
space search -- 254px tall over the tab bar's place, dark and light, with the
home pill in its own bar. It shows while the field is focused, and the keys
work: a letter goes into the field and fires the same input event a real
keystroke would, so the skeleton and the filter follow; delete takes one off;
search blurs, which drops the keyboard as a scroll does. The list gets 280px of
bottom padding while it is up so the last rows can be scrolled clear of it.
Pointerdown is prevented on the keys so a tap does not take the field's focus.
Only the frame draws it: on the device (#m20v) the real one comes up.

"Make the dot arc the default and increase the gap by 2px; the dots should
appear one after another when you enter the screen." Bio graph now opens on
Dots; twenty-two dots (from twenty-six) put 5.6px between them at hero scale
(was 3.9). The reveal is on the arc's own clock (bioRevT): a front runs left
to right across the run over 1.1s, each dot rising over the time the front
takes to pass two of them, eased, so they lay down one after another rather
than fade in as a block, and the last lands about where the arc's sweep would
have ended. The paint is keyed on the front's position, so it is repainted
only while it moves. Probed (dotstag.js): swiping away and back, 2 dots at
0.11s, 9 at 0.40s, 17 at 0.78s, all 22 at 1.04s; gap 5.6, dot 3.7.

"Put the home indicator lighter by 70% in the bar." The pill was white at 90%
(and near-black in light); it is white at 26% now, black at 24% in light, in
the tab bar and under the drawn keyboard alike.

"Make sure the skeleton fits with the biomarker row. Use the same kind of
element, so it will be more realistic." The skeleton was three loose bars per
row. It is the list's own markup now -- a group head (a title bar, two
description bars) and five .mbrow rows, each a name bar, the three range
bars, a value bar and a pill -- so the rows take the real grid, padding and
rule as they are, and every block is a shimmering bar where a text line or a
pill will be. The bars sit in the lines' own boxes (name 16px, value 14px,
pill 24px), so a skeleton row is 75px like a real one and the head is 79px
against the real 78.8; the swap from skeleton to results moves nothing.
Probed (skelh.js, skel.js): five rows at 75 each, real 75.

### 5.132 The keyboard comes up from the bottom

"The keyboard should have a transition coming from the bottom of the screen."
It switched on. It is in the frame all the time now, parked a full height
below the bottom edge (translateY(100%), hidden and deaf to touch), and slides
up over 320ms on an ease-out when the field takes focus, then back down the
same way when a scroll or the search key lets it go; visibility follows the
slide down so the parked keyboard cannot be tapped through the tab bar's
place. Only the frame draws it -- on the device (#m20v) it stays display:none
and the real one comes up. Probed (kbdslide.js): tap, and the offset runs
254 -> 200 -> 55 -> 16 -> 0 over 0.36s, visible throughout; a scroll runs it
back 0 -> 147 -> 242 -> 254 and it is hidden at 0.43s; the viewport version
shows none. The typing probe (mkbd.js) is unchanged.

### 5.133 The dots a pixel closer, over 80% of the arc

"Reduce the gap by 1px on the arc system, and you can put 10% safe space on
each side, not 20%." The dots ran over the middle 60% of the scale (v -9..9)
with 5.6px between them; they run over the middle 80% now (v -12..12), and
the pitch is set by the count, so the gap came down by adding dots: thirty
over the wider span put 4.7px between 3.7px dots at hero scale. Thirty-two
gave 4.2 and thirty-one 4.4 -- the arc is a curve, so the chord-based guess
overshot -- and thirty is the count nearest the asked pixel. The Arc version's
biomarker window is the same 10..90% now, so the two graphs agree on where
the reading sits, and the hero's side fade on the arc runs only outside that
80% (clear by 3%, full at 10%, was 20%), so the outer dots and the outer
ticks of a portion are not dimmed by it. The end taper of the dots (the outer
six each side to a tenth) is unchanged. Probed: 30 dots, gap 4.7, dot 3.7,
first at 10.7% of the arc's width and last at 89.3%; the reveal still lands
the last dot at 1.1s; the Arc version's first lit tick is at 10% of the scale.

### 5.134 Fifteen percent safe space

"Reduce by 15% safe space." The window settles between the two: 15% empty at
each side, the dots and the Arc version's portions over the middle 70% of
the scale (v -10.5..10.5), the hero's side fade full from 15%. The pitch is
held by the count again: twenty-six dots over 70% opened the gap to 5.2px,
so it is twenty-eight, at 4.5px between 3.7px dots -- the nearest count to
the 4.6 the "reduce by 1px" asked for. Probed: 28 dots, gap 4.5, first at
15.2% of the arc's width and last at 84.8%; the reveal lands the last dot at
1.07s; the Arc version's first lit tick is at 15% of the scale.

### 5.135 The dots grow from the first every time the slide is reached

"Every time the biomarker starts -- when you land on the slide or open the
app -- the coloured dots should grow from left to right." They were meant to
(5.131), and on the probe they did, but the run was on the arc's clock
(bioRevT), which starts with the swap: the first dots rose under a group still
fading in and while the carousel was still travelling, so on the device the
run was a third laid down by the time the slide could be seen. And on a cold
start the clock began on the first frame, which is followed by the shader
compile: 1.1s of reveal spent in frames nobody saw.

The dots have their own clock now (dotsRevT). It starts on the first frame
in which the slide has landed -- the swap complete and the carousel settled
within 2% of the slide -- and is dropped the moment the slide is left, so
the next arrival starts it again. A frame that arrives more than 200ms after
the one before, while the run is still going, pushes the clock on by the
delay, so a stall (the cold start, a tab coming back) postpones the growth
rather than consuming it. The arc's own reveal and the body's fill keep
bioRevT as they were.

Probed: after a swipe the group is fully in (opacity 1) before the first dot
rises at 0.31s and the twenty-eight are laid down by 1.35s; on a cold start
(sampled from the navigation commit) the dots go 0 -> 3 at 0.96s and reach
28 at 1.87s, the whole run seen. Modes and error probes clean.

### 5.136 The dots grow faster

"Grow faster the arc on the biomarker." The run took 1.1s end to end, a
length inherited from the arc's own sweep; it takes 650ms now, each dot still
rising over the time the front takes to pass two of them, so it reads as a
run laid down rather than a switch. Probed: after a swipe the first dot rises
at 0.30s and the twenty-eight are down by 0.91s; on a cold start the run goes
3 -> 28 in 0.54s once the first frames are through.

### 5.137 The dots gather into the indicator

"We need a transition between the dots and the next arc: when you go from
biomarkers to biological age, combine all the dots into one, and that dot
becomes the reference dot on the range." The run used to fade with the swap
(260ms) while the age arc's indicator faded in at the centre; two things
crossing, neither becoming the other.

Now, when the slide is left with the dots up, the group holds at full
opacity and each dot travels over 520ms (a smooth ease) from its place on the
run to the indicator's spot -- along the arc to the centre (v -> 0) and
outward from the dots' radius (R - 6.5) to the indicator's (R + 13) -- while
growing from 2.4 to the indicator's 4 and blending from its range colour to
the indicator's ink (white; black in light). The ends' taper and the resting
dots' faintness lift as they go, so what arrives is one solid dot, not a
pale one. The frame the gather ends, the dots go and the indicator appears
at that same point, and the sweep to the organ's age starts from there: the
arc's start (arcStart) is held for the gather rather than the swap's 260ms,
and the aligned centre tick waits with it. A run left half-grown gathers only
what was there (dotsMergeRev). A swipe back before the gather has ended
clears it (dotsMergeT), and the run is laid down again on landing as usual.
The Arc version is untouched -- with the dots off, the 260ms hand-over
stands.

Probed (dotmerge.js): after the swipe the dots' spread runs 306 -> 280 ->
156 -> 25px over 0.44s as the radius goes 2.4 -> 3.88 and the first dot's fill
runs from AAEEC2 to near white; at 0.53s the group is off and the indicator
is on at (220, 1) -- the gather's target -- from where it travels to (125, 14)
with eleven ticks lit behind it. A swipe back mid-gather leaves the run
whole (28 dots, spread 306, radius 2.4, indicator off). Landing, backward
swipe, mode and error probes clean.

"And the grouping should be faster." 320ms rather than 520. Probed: spread
306 -> 200 -> 81 -> 4px over 0.28s, the indicator on at 0.35s.

### 5.138 The arc by default, the green alone, still

"Keep the arc biomarker by default and only display the green portion. No
animation on the other portions." Bio graph opens on Arc again (the dots stay
a select away, and `d` on the hash still opens them). BIO_CYCLE is off: the
arc shows the optimal share as one band from the window's left end, revealed
left to right once as the slide lands, and then holds. The static reading
used to draw all three colours when the unclassified were shown; it is the
green alone in both states now, off the same figure as the body's fill
(BIO_FILL, which applyUnclass moves), and the indicator stands at its end in
both -- it was hidden with the unclassified because the bands marked their
own ends, and there are no bands now. The legend's columns were dimmed to
half by the cycle's own rule with the lit one at full; with no cycle nothing
would be lit, so the columns are at full and the dimming is behind a body
class the cycle sets when it runs (bioCycle).

Probed (arcstill.js): Arc selected, dots off, ticks 9..39 lit in AAEEC2 only
(the band's end at 65% of the scale = 15% + 70% x 80/110), the indicator at
its end, all four legend columns at 1, and nothing moves over 3.6s; with the
unclassified shown, ticks 9..34 in the green alone (68/110), indicator at the
end. Modes and error probes clean.

### 5.139 A second palette: the wine family

"At the moment we have only three particle colours, correct? Plus opacity on
each. How can we achieve this render, need more colours." (A reference heart:
deep wine, rose, salmon in the bright clusters, a mauve, cream, white sparks,
every dot a little off its neighbour, on black.) Then: "try to iterate keeping
the current setup in place." So a Palette tweak -- Three inks, the default and
exactly as it was, or Wine family.

The way in that keeps the setup: nothing about the anatomy changes. Each
particle keeps its ink index (INK_PICK), and with it its authored opacity, its
light-theme ink (aInk -> uInkL0..2) and the painter's mapping. The palette
only decides what colour that index is drawn in, conditioned on the index so
the three's tonal hierarchy carries into the family (WINE_SETS): the material
-> deep wine 38 / rose 42 / mauve 20; the lighter tone -> salmon 65 / pink 35;
the highlight -> cream 70 / white 30. Then per particle a jitter in HSL (hue
+-5 degrees, lightness +-5 points) and an alpha factor on the 5% grid, per ink
(WINE_A_RANGE): material 0.8-1.5x, lighter 1.0-1.7x, highlight 1.8-3.2x. The
tables are drawn once at load (WINE_RGB, WINE_CSS, WINE_A) so the engine
(paintPalette writes the cloud slice of the colour buffer, alpha in the fourth
channel, which the shader multiplies in and snaps back to the grid) and the
painter (inkOf / inkCss / paletteA, its baked lists dropped on the switch)
agree dot for dot. The flow and the ghost keep their own colours.

Three cuts to get there, all on the heart against the Dark ground, which is
where the reference sits. The first (deep wine 7B2D3A / rose B85A66 / mauve
8A6B86, alpha 45-100%) read as a dimmer, greyer cloud than the three inks --
a factor that only dims takes the average down, and the mauve pulled it grey.
The second brightened the reds and moved the factor to 60-100%, still dull.
The third is the one kept: warmer reds (9C3A4A / D06878; salmon F2886A), the
factor allowed above 1 so some dots are brighter than their authored level,
and the highlight's factor high enough to break the 25% cap, since the
reference's white dots are its brightest. What is still not the reference: its
dots are larger and softer, and the size table is baked into the seed buffer
both renderers share, so a wider grain is a separate change; and the cloud
still reads dimmer overall, which is the authored 20-50% band of the material
doing what it was designed to do.

The flag the painter reads (paletteWine) is its own `let` rather than a read
of CARD_STATE: the painter bakes its first tile before CARD_STATE is declared,
and the read threw. Probed (wine.js, wine2.js): the select flips the body
class and repaints without error, survives a page change to Mobile V7, and the
light theme is unchanged. Modes and error probes clean.

### 5.140 The halo's three lights, as the design has them

"Adjust halo: green (younger) 88AB74 16%, orange (older) E7B69C 12%, neutral
(aligned) FFF 8%." The lights used to be pitched by measurement -- a
strength per surface (the phone's 1.55, the card's 30% of it, the white
tuned separately to a 6% lift off the rendered pixels) -- which made the same
verdict a different value on each surface, and none of them a number a
designer had written. Now one table (HALO) carries the colour and the peak,
and the peak is what the design states: the colour's opacity at the
gradient's first stop. haloKFor turns it into the stop multiplier (the stops
are written at .287 of --haloK), and the phone's writer and the card's read
the same table, so the three lights are 88AB74 at 16%, E7B69C at 12% and
FFFFFF at 8% on the phone, the tablet and the desktop card alike. "No
reading" is the grey at the aligned light's 8%. The :root default follows
the younger light.

Probed (halo.js): on the phone, swiping the carousel, younger organs 88AB74 at
.16, the aligned brain FFFFFF at .08, older organs E7B69C at .12; on the
desktop and tablet cards (m21, m18) the same per organ.

### 5.141 The Teaser video page

"Create a new page called Teaser video. I want to use our system and describe
into a script sequence by sequence. Each frame should be animated slightly to
guide the motion designer who is going to polish everything manually in AE."
With the script (seven lines, Everlab last) and a nine-frame board.

A page (#m22, group Video, MODES index 22), built on first view like the
instrument (__tzBoot). The page is the board: a header with the intent, the
script beside it with timecodes and what is on screen per line (two of the
nine sequences have no VO -- 03 and 07 -- and are marked so; 07 is the
board's line rather than the script's, and the note says to keep or cut it
with the client), then the nine frames three across, each a 16:9 stage, the
spoken line, and the notes for the AE pass: motion, ease, durations, cut.
Palette, type and delivery cards close it.

The frames move a little, and in the system's own means. 01 is a field of
the three inks (the engine's default set, as rgb) drifting on a 14-degree
tilt with streaks and five readings surfacing; 02 the same field drawing in
to an accent point that swells (CSS custom properties per dot for the
radial travel); 03, 08 and 09 are type on black -- a breath, a cut, and the
three beats of the closure; 07 an SVG line drawing on with three points
popping (SMIL, so it plays without script). 04-06 are the product's own
component: makeOrganView on a drawn phone, the heart at 760 dots with its
beat, and the arc an SVG with dashed ticks whose portion grows on a SMIL
dasharray and whose indicator rides an animateMotion along the same path; the
reading counts up on the arc's clock, the halo is the verdict's light (HALO's
values) as a radial gradient behind the organ. 06 starts on the lungs and
morphs to the heart and back every six seconds (the view's own morphTo), the
number, the label, the arc and the light following once the morph is most
of the way over -- the first cut left it on the heart wearing 48 and orange
for six seconds, and looked up "Lung" in a table that says "Lungs".

The page is black whatever the theme (a video is graded on black), and the
engine's canvas is hidden under it as it is under the library. The views
stop painting when the page is hidden (offsetParent), so the page costs
nothing when it is not showing.

Probed (teaser.js): the entry sits under Video as value 22, the page shows and
the engine hides, nine frames, nine script lines, the three organ canvases
painted, the 06 loop flips the reading and the light, a round trip through
Mobile and back leaves the page built and showing. Modes and error probes
clean.

### 5.142 The teaser opens on lifestyle imagery; the organs tracked apart

"I'd like to start with an imagery lifestyle, then transition to the cloud of
dots" -- with a still: warm afternoon light, someone reading on a sofa. And on
the Over time frame: "all tracked independently, for better insights and
decision taking."

A tenth sequence in front: 01 Lifestyle, two seconds, no VO. The photograph
itself is the designer's to drop into the comp -- it is not in the repo, and
the sketch does not pretend to be it: a stand-in of its tones (the cream of
the boucle, the figure's navy, the terracotta cushion, a shaft of light)
pushes in about 4%, then goes to dots. Two copies of the still do it: the
solid one fades as a second, screened one comes up under a radial-gradient
mask whose cells coarsen from 6px to 34px (mask-size is animatable) -- the
image as a halftone in its own colours -- and as the screen breaks the
field of signals comes up through it and takes the drift. The note for AE
says the real thing: image to particles (Form or Particular on the still)
rather than a mask; the dot screen is the intent. The VO's first line now
starts as the image goes, at 0:02, and the rest of the board shifts by a
beat: 03 The bigger story 0:04, 04 Introducing 0:07 (two seconds rather than
three), 08 Over time 0:18-0:22, 09 Look closer 0:22, 10 Closure 0:25.

08 Over time: one heart line became three organs -- heart, lungs, liver --
each its own line in its verdict's colour (the design's tokens), drawing on
in turn over 1.6s with its points popping and the latest reading labelled at
its end, and the lines never meeting: that is what "tracked independently"
looks like. A legend in the header, two actions under the chart (heart: keep
going; lungs: consider a check-in), and the caption is the client's line.

Probed: ten frames, ten script lines, the numbering and timecodes through;
the still's loop sampled at 1.5s (the still), 4.4s (the screen, the image's
colours in the dots) and 5.6s (the field); the chart at 5.2s with all three
lines drawn and the readings labelled. Modes and error probes clean.

### 5.143 The bigger story is the body

"Here use exactly the Body visual. Cloud of particles that become the body
particle shape. Add chip with bio age when the body is shaped." (With the
chip drawn: 8 YEARS YOUNGER, the mono in black on the accent.)

Frame 03 dropped the drawn convergence for the component itself: an organ
view on the stage, starting on the engine's sphere -- a cloud of the same
particles -- and morphing to the body (morphTo, 1.6s), at the library's own
density for the body's cloud (organN(fullTarget), the tile's ten thousand points; a dense view, painted in slots) rather
than a thumbnail's, since this is the frame the piece turns on; the strays
drift round it. As the body lands the chip cuts in over the right shoulder
(a step transition, no fade -- a label pinned, not a fade-up), and the sketch
loops cloud -> body -> cloud every 6s so both can be seen. The script line
and the notes follow.

The body did not show at first: the page's base rule fixes every canvas to
the viewport (it is written for the engine's), and a view's main canvas is
positioned by it. The phone frames escaped only because a transformed
ancestor (the phone's translate) re-anchors fixed descendants; the body's
stage has none, so its canvas sat under the top bar. The organ stages now
pin their canvases to themselves (.tzOrgan canvas), as the library's cells do.

Probed: the view paints (3280 lit samples on the main canvas), the chip
comes on once the body has landed, and the frame is the body with the chip
at its shoulder.

### 5.144 The body as a zoom out; one frame in focus

"This should feel like a zoom out, from few floating particles to body
cluster." Frame 03 opens close: the view scaled 3.4x and translated so the
frame sits on the cloud's upper-right edge, where only the strays drift, a
few large soft dots in black. Then the pull-back (2.6s on a long ease-out)
runs with the morph (1.6s), so the body is whole before the camera settles,
and the chip cuts in as it lands. A first cut laid the view out at 3.4x the
stage so the close-up would be the painter's own pixels; it was, and the
landed body was a faint dust of sub-pixel dots, so the view is at the stage's
size and the close-up is an upscale -- soft, which the note says, since in
AE the camera moves through real particles.

"Keep that control section and on the left column use the frame focused, one
frame at a time, no frames next to each other. Remove the title and
description." The header is gone; the page is two columns: the focused frame
on the left, the script on the right, each line a control that brings its
frame up (the frame's own arrows and the arrow keys step through), the
active line marked. A hidden frame's views stop painting on their own, so
only the frame in focus costs. With one frame filling the column the stages
are three times the size they were, so the type inside them is sized to the
stage (container query units) and a frame reads the same at any width.

Probed: one frame shown at a time, the third line brings frame 03 up, the
arrow steps to 04; 03 sampled close (a few dots at the edge, the rest black)
and landed (the body, the chip at its shoulder). Modes and error probes
clean.

"Your organs age differently -- before Introducing Organ Age." The heart
frame moves ahead of the title card: 04 Heart / younger at 0:07-0:10 with
the line, 05 Introducing at 0:10-0:12, and 06 The right pace picks the
heart back up after it. The script, the frames and the delivery notes'
frame numbers follow.

### 5.145 The phone frames are the app

"Why don't you use the exact same build as the mobile app? Why reinvent the
wheel?" -- and then "Use the same screen as the Mobile view!" Fair: the mobile
hero is one instance of one thing (a canvas, an arc, a halo, a shell), which
is why the storyboard had redrawn it. The way to use the exact build is to
let each frame be the app: the file is self-contained, so a frame is an
iframe of this same file opened on the mobile viewport hash, and the real
hero renders inside it.

What that needed. The hash grew a hero suffix: `#m20v.p0` opens the hero on
pill 0 (the heart), `#m20v.p0-3` opens on the heart and glides to the lungs
and back every 5.5s, the way a swipe does (bxT and bxGlide, selectPill).
The landing runs 140ms after setMode, past setMode's own 60ms settle that
puts V6 on the biomarkers. It did not land at first: setMode rewrites the
hash with replaceState to the bare `#m20v`, and the suffix was read after
that call -- so it is read before, and the rewrite keeps the suffix, so a
reload of a framed page lands where it did. The teaser's phone helper adds
an iframe to frames 04, 06 and 07 (loading="lazy", src set on first focus),
laid out at the app's 390px and scaled to the drawn phone, and shown only
once the framed document reports itself as the mobile page (same origin, so
it can be asked); if the host refuses to frame the page the sketch stays.
The iframe's 'load' fires either way, which is why the class is read rather
than the event trusted.

Frame 08 also has its line now: "Everlab tracks them all, for better
decisions", landing as the third line finishes drawing.

### 5.146 Frame 03: centred, sharper, whole, and eased

"Particles should be centred, not on the left. Sharper dots. The body at the
end seems to have some holes -- keep the same body as the bio age one. The
zoom out should have better pacing, ease in out."

Centred: the close-up is on the cloud's centre now, and reads as a few
particles by opacity rather than by looking away from the cloud -- the view
opens at 80% and comes to full as the camera pulls back. Sharper: the zoom
is 2.2x rather than 3.4x, so the close-up is a gentler upscale. (Laying the
view out at 1.5x the stage to make the close-up the painter's own pixels was
tried and undone: the dots are sized in pixels, so the larger layout spread
them thin, and the landed body, scaled back down, was a faint dust.) Whole:
the morph samples both clouds at the body's target, and the sphere holds
fewer points than the body's ten thousand, so the body it landed on was
missing the difference -- the holes. Once the morph is over the view is
re-seated on the body itself (setOrgan), which re-samples it in full: the
same body the bio-age slide and the library draw. Eased: 3s on an
ease-in-out (cubic-bezier .65 0 .35 1) rather than a long ease-out, the chip
landing as it settles.

### 5.147 One dot, then the universe; no inclined text

Three at once. "Avoid inclined text": the silent lines and the script's
"no VO" were italic; they are upright, and `i` and `em` inside the page --
which are dots and streaks, not words -- are set upright too so nothing can
lean. "The sequence should be a cloud of particles floating, consistently
moving like a vacuum, blur with parallax, and metrics appearing and
disappearing through the zoom out" -- and "first sequence: a simple dot that
becomes the cloud universe of dots by zooming out, then go to sequence 2."

So the lifestyle still is out of 01 and one field serves 01 and 02: the
universe (universe()), some 1,270 dots in four depths -- far: small, dim, blurred
1.6px; mid: blurred .7px; sharp; near: large and out of focus 1.4px --
every depth drifting the same way (up and to the left) at its own speed, one
direction and never back, which is the pull; the whole field in a zoom
container. 01 opens at ten times, one accent dot at the centre (the others
are kept 11% clear of it, so nothing else is in frame close), and pulls back
over 8s on an ease-in-out to the whole; 02 keeps pulling back gently (1.6x
to 1x) while six readings (72, 209, 14, 5.1, 6h 12m, 88%) surface and go in
the two sharp depths on staggered 6.4s cycles, up 0.6s, held 1.8s, gone. Each
frame's loop fades to black at its end so the reset does not pop. The
readings are sized to the stage like the rest of the type.

Probed: 01 at 0.9s is the one dot alone; at 6s the universe with the dot at
its centre; 02 shows the field with readings up; no element on the page
renders italic.

"Use the full viewport space. Viewport padding 64px, #111 background. Cards
#000 for the frame, the script and timecodes, the palette, type and
delivery; 32px radius, 32px padding." Done as said: the page's wrap has no
maximum width and 64px of padding on a #111 ground, and the five kinds of
content sit in black cards at 32px radius and padding; the stage inside the
frame card keeps a 16px radius and a hairline so it reads on the black.

### 5.148 The body is the Library's

"Body looks so bad, just take the one on the library!!!" Right. Two things
kept it from being that body. The library tile draws each organ at
organN(fullTarget x the organ's own `dots` multiplier), fill .46, dot 1.0;
the frame drew the body at organN(fullTarget) alone -- the body's multiplier
is what takes the tile to ten thousand points -- with fill .55. And the
morph from the sphere left the body sampled at the sphere's count until it
was re-seated, so for a while it was a body with holes. Now frame 03 is the
library's view with the library's options (libOpts), and no morph: the
cloud the frame opens on is the body seen close, at 2.2x and 80%, and the
pull-back resolves it. The phone sketches take the same options.

"Put the caption overlapping the video frame, like a movie subtitle." The
spoken line moved from under the stage onto it: bottom centre, 6% up, white
at medium weight in a black box (the caption's own rectangle, no shadow),
smaller than the first cut -- "smaller, with a rectangle black background"
-- and sized to the stage like the rest of the type. "If no VO, don't show
any subtitle": a silent frame carries none; its direction is in the script
and the notes. The notes stay under the frame.

"More shiny, the body dots." The library's body as it is, with two lifts on
top for this frame alone: the view's alpha at 1.35 (the faint dots come up,
the bright ones cap at full) and, on its canvas, brightness 1.35 and
saturation 1.15 in CSS -- so the tile's own drawing is untouched and the
shine is the frame's.

"Start the sequence closer -- all dots filling the frame. No loop: cut the
sequence at the end and start over, same for all sequences." Frame 03 opens
at 4.5x on the body's centre, dots edge to edge, and pulls back as before;
at the end of its cycle the view jumps back to the close-up with the
transition off for the jump (.snap) and plays again -- a cut, not a reverse.
The same rule everywhere: 01 and 02 lose their fade at the loop's end and
simply reset; 06's push runs in and cuts back rather than alternating; 07's
hero glides to the lungs, holds, and snaps back to the heart (land) before
gliding again. The SMIL loops (the arcs, the chart) already ran forward and
reset.

"More dots filling the screen, floating. Less orange, more neutral shiny
ones. No fixed dot in the centre: the start should just start with one, then
zoom out revealing more around." The universe is denser (some 1,900 dots, the
depths' band pulled in from 190% to 160% of the stage so more of them are in
frame, 02's pull-back from 1.35x rather than 1.6x), and mostly neutral: a
fifth salmon, three tenths sand, half off-white, all brighter, the sharp
depth with a faint glow. The accent dot pinned at the centre is gone from
both frames. 01 opens on an ordinary off-white dot of the sharp depth at the
centre, on a drift of its own so slow the close-up holds it, and the
pull-back shows the rest around it; 02 has nothing at the centre.

"Simulate the subtitle talking, word by word appearing." Each word of a
spoken line is its own span, coming up in turn 0.32s apart (a talking pace)
with a small rise, the line holding once complete and going at the end of an
8s period to start over -- the period the frames cycle on. Silent frames have
no subtitle, so nothing to speak.

"No halo light on the particles. Too much orange, make it more neutral. More
parallax: blur, opacity." The glow is off every dot (the sharp depth's and
the opening dot's). The inks are a twelfth salmon, a third sand, the rest
off-white. The depths are pulled apart: the far one a thousand dots at 1-2px,
18-42% and 2.2px of blur, drifting 18px over its cycle; the mid 620 at 1.8-3px,
38-72%, 1px, 62px; the sharp 340 at 3-5px, 70-100%, no blur, 150px; the near
44 at 8-14px, 22-48%, 2.6px of blur, sweeping 300px -- a sixteen-fold range
of speed between the nearest and the farthest, which is the parallax.

A frame starts from its first frame when it comes into focus: show()
restarts its CSS animations (getAnimations, cancel and play) and rewinds its
SVG timelines (setCurrentTime 0). They had all been running since the page
was built, so a frame opened mid-cycle -- a subtitle caught with its first
words already gone.

"Put some real metrics, written letter by letter, the same effect as the Card
nav's metric entries. Ideate more. Particles need to be finer." (With three
examples: VO2 MAX 42.8 ML/KG/MIN, MAX HR 184 BPM, O2 UPTAKE 3.2 L/MIN, each a
filled square and two lines of the mono.) 02's readings are entries now, in
the Card nav annotation's manner and by the same mechanics (typeInto's
square-cursor typer, 34ms a character, four blinks): a filled square, the
label typed on, then the value on the line below, a hold of about two
seconds and a fade. Fourteen real readings to draw from -- VO2 max, max HR,
O2 uptake, resting HR, HRV, glucose, LDL, SpO2, blood pressure, sleep,
hs-CRP, ferritin, grip, cortisol -- seven a cycle, shuffled, at seven places
and staggered 0.85s apart, on an 8s cycle that runs only while 02 is in
focus (show starts it and clears it). The entries sit in an overlay over the
zoom rather than in a drifting depth, so they read while the field pulls
back behind them. The grain is finer: the far dots .8-1.4px, the sharp ones
2-3.2px.

"Introducing / organ age, in two phases. No full uppercase. Saans medium,
smaller." 05 is two lines on one cycle: "Introducing" up at 0.6s, held,
gone by 3.7s as "organ age" comes up and holds to the cut; sentence case,
4.2% of the stage's width (about 45px at 1080p), centred, no breath. Saans
is named first in the stack with the product's fallbacks behind it -- the
file does not carry the face, so the page shows the fallback until the font
is installed where it is viewed; the AE comp has it.

The subtitle's first words were going at three seconds, and the restart on
focus did not explain it: the words' keyframes were named tzWord, which is
also the closure frame's wordmark animation (up, hold, gone by 36%), and the
later definition won -- 36% of the words' 8s is 2.9s. The words' keyframes
are tzSpeak.

"VO: It all starts with one test." 01 has its line: it lands on the one dot
before the pull-back, so the first spoken word of the piece is over one
dot, and the universe answers it. The script, the frame and its subtitle
follow; only 05 and 08's board line remain without VO -- 08 has its own now,
so only 05 is silent.

"Markers good, but more delay between them appearing. Reduce the line
height. Scale the square and text down 30%." Entries 1.4s apart (was .85),
five a cycle rather than seven so the last still has its hold; the type at
1.5% of the stage's width (from 2.1), line height 1.25 (from 1.5), the
square, the cursor and the indent scaled with it.

"Once the subtitle is written, hold 2s, then fade out the whole subtitle."
The words no longer fade one by one at the cycle's end; they stay, and the
box goes as one: the last word lands at .25 + (n - 1) x .32 + .2s, the line
holds 2s, the box fades over .5s. The fade point depends on the word count,
so one keyframes rule is written per count present (tzSubOutN) into a style
the page appends after the frames.

### 5.149 The organ-age sheet: the right visual, and the organ swipes

"Use the right visuals here. Make the organ swipeable as well." (The
sheet, on the phone, its brain a faint sketch.) The sheet drew each organ at
a two-thousand-dot thumbnail (shapeTarget 2000, 2400 on the desktop) with
fill .44 and dot 1.05, and on the sheet's dark ground that read as a
sketch. It draws the library's organ now -- the tile's own count (the
organ's multiplier on the engine's density), fill .46, dot 1.0 -- on the
phone sheet and the desktop modal alike, and the morph between organs
samples at that count.

The horizontal gesture belonged to the cards alone; the stage above only
took a downward pull to dismiss the sheet. One set of handlers sits on both
now: a horizontal drag on the organ moves the track and dissolves the organ
into the next exactly as a drag on the cards does (the same rubber-band, the
same flick), and on the phone a downward pull on the stage still takes the
sheet away -- the direction decides which gesture it is, once it has moved
seven pixels sideways or ten down.

Probed on the desktop modal (m2, the expand button): open on the heart, a
leftward drag across the organ lands on the brain with the card marked and
the copy swapped; the lit pixel count on the stage's canvas up by a third
over the thumbnail. Modes and error probes clean.

### 5.150 Hex beside the ink swatches

"Need HEX, not RGB, on the tweak here." The Ink swatches are the browser's
own colour inputs, and the picker they open shows RGB fields with no way to
ask it for hex. So the bar carries its own: a mono hex field beside each
swatch, the two one control -- type a six- or three-digit hex and the swatch
and the ink follow (an unparsable value marks the field and changes nothing;
blur restores the swatch's hex); pick with the swatch and the field follows;
a theme change resyncs both, as the swatches already did. Probed: typing
AAEEC2 sets the swatch and the ink, a bad value is marked and leaves the ink,
picking updates the field.

"Add VO: A deeper view of your organs. Some age exactly as they should." 06's
line is the two sentences now, in the script and on the frame; at a talking
pace the eleven words take about 3.5s to land, so the subtitle's hold and
fade fall a beat after the frame's own cut -- the frame is 3s on the board,
which the edit will settle.

"Replace by: But not the full story." 04's line, in the script and on the
frame; the phone with the heart under it as before.

"Split in two sequences." 06 is two: 06 A deeper view (0:12-0:14, the push
in on the heart, "A deeper view of your organs") and 07 The right pace
(0:14-0:16, the heart held, "Some age exactly as they should"), each the
app on the heart; the rest move a beat -- 08 Lungs 0:16, 09 Over time 0:19,
10 Look closer 0:23, 11 Closure 0:26. Eleven sequences. (The first cut of
this patch stopped on a stale anchor after the notes were written, so for
one commit the notes described a board the page did not have.)

"Add VO here; Introducing stays too long." 05 speaks its title: "Introducing
Organ ages" -- and the title's second phase reads "Organ ages", capital O,
plural, as asked. The first phase holds about a second now (up by 6% of the
cycle, gone by 27%) and the second comes at 36%; the two together no longer
outstay the two-second frame by much.

"Style the timeline: align the times with the title above, push right;
active card padding left and right +8px; inactive items down 40%." The
script's rows have no negative margin now, so the timecodes stand on the
title's left edge; the active card alone runs 8px past the text on both
sides (padding and a negative margin); the other rows are at 60% and come up
on hover.

"Group the sequences by naming the group in the timeline: 1-4 Introduction,
5-8 New feature, 9 Value, 10-11 Closure." Four headings in the script's
list, the mono eyebrow in the accent over the first line of each act, the
act's first row carrying no rule under its heading. The headings are rows of
the same list but not lines: the focus wiring selects rows by their index
attribute, so a heading is neither clickable nor counted.

"Kill 'It all starts with one test'. Keep the sequence without VO." 01 is
silent again -- the dot and the pull-back stay, the first spoken line is
02's -- and carries no subtitle, as silent frames do. 05 keeps its VO, so
01 is the one silent sequence.

"Add a chip, white, left side: 124 biomarkers." Frame 03 lands with two chips
now, the same mono in black: the count on white over the body's left
shoulder, cut in at 3.1s as the camera settles, and the verdict in the
accent over the right shoulder 0.4s after it -- the reading first, then what
it means. Both cut, no fade, and both clear on the cut back to the close-up.

"Merge. No need showing a phone UI here." 04 -- the phone on the heart under
"But not the full story" -- is folded into 03: the body and its chips hold
while the second line lands, no phone, no cut between the two lines, 0:04 to
0:10. Ten sequences; the acts are 01-03, 04-07, 08, 09-10, and the first
app frame is 05 now, so it carries the full "the frame is the app" note and
06 and 07 refer to it. The heart count-up that rode the old 04's arc went
with it.

"Introducing / Organ ages: rotating vertical transition, fade in, out." Each
phase turns about a horizontal axis as it fades -- a vertical turn, toward
the camera on the way in (rotateX 70 degrees to flat, rising a third of its
height) and on and away on the way out (flat to -70, still rising) -- with
perspective on the stage and ease-in-out on the turn and the fade alike; the
timings are the ones set above, about a second on "Introducing", the rest
on "Organ ages".

"When I play a sequence, automatically transition to the next. Add a
vertical progress on the right side (timeline) so we can see the progress
through the play." A Play button in the frame's bar (the space bar too):
each sequence runs for its board time -- the gap to the next timecode, the
last to 0:30 -- and hands on to the next, round and round until Pause; the
sketch restarts on each hand-over as it does on a click, so the frame's own
cycle starts with its slot. A hairline down the script card's left edge,
from the first line to the last, fills in the accent to the top of the line
in focus and on through it on the frame's clock; it clears to the line's top
on pause, and the clock holds while the page is away on another mode.

"Padding 12px. No border, never. All cards, inactive and active, should have
the same padding so nothing jumps when we activate items." Every row of the
script is 12px in on all sides and runs 12px past the text either way, so
the text keeps the card's edge; the active row only takes its ground. The
rules between rows are gone, and the act headings sit 24px down.

"No full stop. Use the same font style as Introducing." 09 reads "Look
closer" -- sentence case, no stop -- in the Introducing type: Saans medium,
4.2cqw, the same fade-up and hard cut as before.

"Merge sequences 1 and 2, both animations in one. Remove 'It all starts',
we don't need that copy." One sequence, 0:00-0:04, "Your body holds
millions of signals": the dot close, the 2s pull-back to the field, and the
same move easing on gently (1.35x to 1x) for the rest of the cycle while the
readings type on -- the first once the field has resolved, 1.8s in, then
1.4s apart, four a cycle so the last says its piece before the cut. The
one-dot universe carries the readings' layer now; the second field is gone.
Nine sequences, no silent one; the acts are 01-02, 03-06, 07, 08-09.

"More right margin after the timeline. Put the timeline inside the group. The
line should live-progress while the video is playing." The progress is one
hairline per act now, inside it: under the heading's left edge, from the
act's first row to its last, with the rows 20px to its right (32px in, the
line at 12). Acts already played read full, acts to come empty. And the line
lives whether or not Play is on -- the sequence in focus is playing, so its
line fills through its row on the board's clock and holds at the row's end;
with Play on the hand-over follows. Pause no longer clears it.

"Auto go to next sequence." The play is on from the start: the board runs
itself, each sequence its board time and on to the next, round and round;
Pause (or the space bar) holds it, and a click on a row joins the play
there. The button reads Pause at boot.

"Need to finish this sequence before going to the next one. After Organ
ages, plus a 1s delay. All sequences need a 2s minimum, a 1s delay after
the VO." The play's pacing is its own now, not the board's timecodes (those
are the edit's): a sequence hands over at the latest of 2s, the line spoken
plus a second (a word every 0.32s from 0.25s), and where its own motion is
through -- the readings' cycle, the body's 8s, "Organ ages" landed (2.9s)
plus a second, the push to its 6s cut, the glide landed on the lungs plus a
second (5s), the third line drawn and the actions up (6.5s), "Look closer"
landed plus a second, the dot gone (4.5s). The live phones load at boot,
hidden, so they are ready when the play reaches them, and on focus the board
asks the framed page to land again (a postMessage; the app re-runs its hero
landing), so the arc reveal -- and 06's glide, which now starts 1.5s after
landing rather than 6 -- begin with the slot. The sketch under 06 morphs
1.5s in to match.

"Others are ageing faster." 06's line, in the script and on the frame.

"Break the subtitle in two pieces: Together they tell a bigger story, then
But not the full story." A line can be spoken in pieces (" | " in the
script): a box per piece, the next starting once the one before has landed,
held its 2s and gone (0.6s) -- so 02's second piece comes at 4.8s -- and the
fade rule is written per (word count, start, cycle) now. The body's cycle is
8s to carry it, the chips holding while the second line lands.

"Same sequence as Look closer: add Available now before Look closer." 08 is
two phases as 03 is -- "Available now" turning in and away, "Look closer"
coming the same way and holding -- with the line in two pieces to match,
"Available now." then "Look closer.", and the play holding to the second
piece plus a second.

"Sequence 1: more screen time, +2s." 01 runs a 10s cycle: the pull-back
paced the same (the dot to the field in the first 2.4s), the ease on to 1x
over the rest, five readings rather than four, and the subtitle on the same
10s so the line does not come round again before the cut. A frame can name
its cycle; the others stay on 8.

"Break with paragraphs!" The motion notes under a frame are a paragraph per
labelled part now -- Motion, Ease, Hold, Cut, Note -- 9px apart, instead of
one run of text.

Two sketches that cycle on their own now start with their slot rather than
wherever their interval happened to be: 02's body (the cut to the close-up,
the pull-back, the chips, the hold to 8s) restarts when 02 comes into focus,
and 06's fallback glide goes to the lungs 1.5s in and back 4.2s later, as
the app does. Without this the chips could be off for most of a slot.

The play's clock skips any frame gap over a second (a phone booting, the
tab away), so a stall is not charged to the slot it happens in.

"Sequence 2 should be a cloud of particles that become the body. Use the
morph from the concept." It is the morph now, and whole this time: the
cloud the frame opens on is a cloud derived from the body's own -- the same
particles, every one, scattered through a ball the body's height (a seeded
scatter, so it is the same cloud on every load), carrying the body's inks,
seeds and count -- so the painter's morph, which samples both clouds at one
target and takes index i to index i, lands every dot in its place. (5.148's
holes came from morphing off the sphere, which holds fewer points than the
body.) The cycle: cut to the cloud, the travel from 0.5s over 2.4s along the
morph's slight arc, the camera pulling back only a touch now (1.25x to 1x
over 3s, where the zoom-out had been 4.5x), the chips at 3.1 and 3.5s, the
hold to 8s, the cut back to the cloud.

Stills of 03-06 for the user showed the framed phones one slide off -- 05 on
the brain, 06 on the immune system. The mobile page's own hero auto-switch
(drawFrame: the next pill every 5s unless something manual happened in the
last 14s) was running under the teaser's slots, and the hash landing did not
count as manual. A page opened on a pill holds it now: the landing sets the
manual clock to infinity, so the framed phone shows what the frame asks for
and nothing else.

"Can I integrate this image to illustrate sequence 4? The exact image, don't
recreate." Yes, and now there is a way to. Images live under `assets/` so
the source stays a file people can read and the dev page loads them over
HTTP; the build inlines every `assets/...` path it finds -- in CSS or in a
string -- as a data URI, because dist/index.html has to be the whole page in
one file (it is what the artifact publishes). One image so far, 31KB of webp
that inlines to 41KB of base64.

04 is that photograph now: the app on a tablet, the organ ages listed down
the left and the reading with its particle organ to the right, shot close
and shallow. It fills the stage (object-fit: cover) and takes the same slow
push the live frames use, so the two cut together; the note calls it the
reference still and says a screen recording of the same view replaces it in
the edit. The live phone that was 04 is gone, so the full "the frame is the
app" note moved to 05 and 06 refers to 05.

(A pasted image is recoverable: the session transcript stores each one as
base64 in its message record, so the exact file can be written back out
rather than asked for again.)

"04 --> img. Replace current 04 to 05." A second photograph: the app on a
phone, shot close and straight on, the particle heart over the arc over the
reading -- 36, four years younger. That is 04 now, and the tablet that was
04 moves to 05, where the whole set of organ ages listed at once is what
makes "some age exactly as they should" land. Both take the same slow push,
so they cut together. The live phones they replaced are gone, so the "frame
is the app" note moved on again, to 06.

A 419KB PNG inlines to 560KB of base64, which is most of a megabyte of page
for one still, so the pastes are re-encoded to webp before they land in
assets/ -- in Chromium, over a canvas, since the container has no image
tools (towebp.js in the scratchpad). 410KB to 18KB at 1920 wide and quality
.86, with nothing visible lost on a photograph this dark.

The build's inliner reads the source, so it only sees a path written out
whole. The first cut of these two built the path at run time
('assets/teaser/' + file) and shipped a page with two broken images: the
regex matched nothing, so nothing was inlined and nothing warned. The helper
takes the whole path now, and the comment beside it says why.

"Smaller chip, 2x less. Write them one after each other." The chips are half
the type (1.3cqw) with half the padding, and they are written rather than
cut in: the count types on at 3.1s, a letter every 38ms with a square cursor
at the end, the cursor blinks twice and goes, and only then does the verdict
start. The box is sized by its letters, so it grows as they arrive -- the
same hand as the readings in 01, which is the board's one way of putting
words on a frame.

"This on 06. Make it moving inside a bit." The third photograph: the phone
at an angle, the heart drawn in the orange, 44 and eight years older -- the
turn 06 has always been, the same frame as 04 with the other verdict, and a
stronger picture than the heart-to-lungs morph it replaces. It moves inside
rather than straight in: the push is centred on the screen (transform-origin
46% 42%) and runs to 1.09, so the camera travels into the reading and not
into the middle of the plate.

That was the last live frame, so the three app sequences are all stills now
and no organ view is built for them. The live-iframe machinery is left where
it stands -- with no .tzLive on the page it costs nothing, and a frame that
wants the running app back only has to ask for one. The three photographed
slots are paced by their lines alone (TZ_DONE 0): a looping push has no end
of its own to wait for, and at 6s it would have held each frame twice as
long as the board asks.

### 5.151 Every organ at once, and the voice in the room

"On seq 07, display a grid of organs based on this image, make them appear
randomly with a zoom out while the sequence progresses. Remove the chart
currently implemented, replace by this concept." The three-line chart is
gone. 07 is the app's nine readings at once, each cell the product's own
parts rather than a drawing of them: the particle organ, the age scale with
its coloured gap and indicator (ageArcMarkup, the same function the
immersive page draws), the age (CHRONO + delta) and the verdict (imVerdict).
The numbers are PILL's, so the grid says what the app says -- 37, 40, 34, 48,
37, 42, 35, 44, 39 -- and a change to that table changes this frame too.

The camera opens in on the middle cell at 2.7x and pulls back to the whole
grid over 7s; the other eight arrive around it in a shuffled order, 0.56s
apart, all landed by 4.3s so the frame settles complete and holds. The first
cut staggered all nine, which left the stage black for the first third of a
second of every cycle -- a dropped frame, not a cut. The centre cell is on
from the first frame now, which is also truer to the shot: you open on one
organ and the rest arrive around it.

Nine organ views on one stage is the Library's whole page in a ninth of the
room, so each is built at a third of the library tile's count with feed and
flow off: what moves in a cell is the organ itself.

"Include this source as a voice style ref." A fourth card beside Palette,
Type and Delivery: the reference recording, with a line saying to match its
pace, register and restraint rather than its words. The build inlines audio
now as well as images (mp3, m4a, wav added to the map), which is 1.3MB of
mp3 becoming 1.7MB of base64 -- the page goes from 0.5MB to 2.2MB, paid once
so the board travels as one file with the read inside it.

(A probe artefact worth remembering: page.screenshot with a clip and
deviceScaleFactor 2 captured a region that did not match what the page
reported -- one cell where nine were on. At deviceScaleFactor 1 the same
clip is right. Measure the DOM for truth; use the screenshot to look.)

"Seq 07, use the exact img provided, don't recreate anything." Fair: the
grid I built from PILL was the product's own parts, but it was not the
picture that was given. 07 is that picture now, and it still arrives tile by
tile -- the plate is nine divs of one image, each at 300% with its own
background-position, so a third of the file can come up on its own without a
pixel of it being remade. The image is square, so it sits centred at the
stage's height and the sides stay black. The nine organ views the rebuilt
grid needed are gone with it.

### 5.152 The board plays the read

"In the teaser add the voice over, respect decent pause between sequence."
The take is 23s of all nine lines with only breath between them -- the
longest internal gap is 0.18s -- so the pauses had to come from the board.
Where each line sits in the file was found rather than guessed: decode it in
Chromium, take a 20ms RMS envelope, list the silences, and match them to the
lines by syllable count. The fit lands every line between 0.25 and 0.32s a
syllable, an even read, which is what says the boundaries are right.

From there the board is timed to the voice and nothing else. A slot is its
line plus a beat (1s; 2.4s on the last, for the black), so the whole play
runs 33s for a 30s film and every cut falls in silence. The sequence sets
the recording's head to its line, plays it, and stops it when the line is
out -- the pause between sequences is real silence, not the next line
starting early. A browser will not play audio untouched, so a blocked start
is remembered and the first click or key anywhere retries it.

Two things follow from the voice being the spine. The caption is written at
the voice's pace now -- the line's share of the take split between its
pieces by word count, the words even across each piece -- so the last word
lands as the voice finishes rather than at a pace of the caption's own. And
every sketch's cycle is its slot: the stage carries it as --tzCyc and the
zooms, pushes, turns and the closure all read it, while the three that run
on timers (01's readings, 02's body and chips, 07's tiles) scale their steps
to it. Probed: three readings typed by 3.86s, both chips written by 5.08s,
all nine tiles up by 4.22s -- each sketch finishes inside its own shot.

TZ_DONE is gone. It existed to hold a sequence until its sketch was through;
with the sketches cut to fit, the voice is the only clock.

"Use this card style grid instead. Use the exact img. Zoom out slow, card
opacity appearing one after each other." The motion is in: the drift back is
1.55x to 1 on an ease-out over the whole slot -- a move that is still going
as it settles rather than a pull -- and the tiles fade in over half a second
each, one after the other in reading order, evenly spaced so the last is up
with a beat to spare. The first is up from the frame's first moment, for the
same reason as before: a stage that starts empty reads as a dropped frame.

The plate itself is still the nine-up. The card image could not be read this
turn -- a paste reaches the message store only once the turn it arrived in
has ended -- so swapping the file and going from nine tiles to six (3x2,
background-size 300% 200%) is the one thing left.

"Put them into an iPad screen, inclined and blurred." The grid is on a
tablet now, which puts 07 in the same room as 05 and 06 rather than floating
on black: a rim of brushed metal round a black screen, turned away from the
camera (rotateY -25, rotateX 7, a degree of roll) on a 130cqw perspective,
with a touch of softness over the whole device and a depth-of-field wash
that deepens toward the far edge -- a backdrop-filter under a gradient mask,
with the light falling off the same way. The screen's ground is the image's
own, so the plate's edges do not show inside it.

The device is sized by the stage's height (74%), so it sits whole in frame
when the drift settles; at the drift's start, 1.55x, the frame is inside the
screen and the edge of the device is just off it, which is the shot the
reference showed.

"Replace by this VO." A second take, 20.7s against the first's 23.1 -- a
quicker read. The cues were found the same way, and the fit is tighter this
time: the eight spoken lines land between 0.23 and 0.30s a syllable, with
the trailing "Everlab" longer, as a single word held is. Nothing else had to
move: the slots, the caption pace and every sketch's cycle are all read off
VO_CUES, so replacing the file and the nine pairs retimed the whole board.
It runs 31s now.

"Include this music on the bg while the sequences are running." A bed, and
it behaves like one: it runs under the whole play rather than per sequence,
loops (40s against the film's 31), starts and stops with Play, and ducks
while the voice is speaking -- 0.15 under the line, 0.34 in the pauses, on a
quarter-second ramp down and a slightly slower lift. The two levels are the
only numbers in it worth arguing about; at these the voice stays clear and
the room does not go empty between lines. The Voice card is the Sound card
now and carries all three: the take, the bed, the style reference.

That is 4.4MB of page -- three audio files inline, 4MB of the 4.4. It is
paid once and the board travels as one file with its sound in it, but if it
ever needs to come down, the style reference is the 1.3MB that the take has
made redundant.

### 5.153 The holds inside a line

"Need 2 sec pause between 2 sentences." ".5 sec pause after [03's first
phrase]." "Look closer should come after 1.5s delay, match voice as well."
Three asks about the same thing: the silence inside a line, which the
recording does not have -- the reader runs the sentences together with a
breath between them.

So a line can divide now. VO_SPLIT says where inside the take it divides,
VO_HOLD how long the board waits before the second part, and the board holds
the recording for exactly that: it plays the first part, pauses the audio,
waits, then sets the head to the second part and plays on. The silence is
made by the board, not cut into the file. 02 holds 2s between "a bigger
story" and "But not the full story", 03 holds 0.5s between "Introducing" and
"Organ ages", 08 holds 1.5s before "Look closer".

The split points came from the same envelope: the breath nearest where the
syllable count says the sentence ends -- 4.89s, 7.22s and 18.69s into the
take.

Everything downstream follows, because everything reads the cues. A slot is
the sum of its parts plus its holds plus the beat after (02 is 6.6s now,
08 4.4s). The captions start where their part of the recording starts and
run at its pace. And the two title frames, 03 and 08, turn on the same
clock: the first phrase is up while it is said and turns away through the
hold, the second comes as the voice does and holds to the cut. Their
keyframes are written per frame, since the beats differ -- the fixed
percentages could not have followed a voice.

(03's line is two pieces in the script now, "Introducing | Organ ages.",
which is what the frame always showed; the script list joins them back for
reading.)

"Universe should zoom out slower, 2x." The move runs at twice the slot's
length now, so every part of it is at half the rate and the shot cuts while
the camera is still pulling back. The dot becomes the field over about 1.6s
rather than 0.8, and at the cut the field is still easing back from 1.35x
rather than parked at 1. That is truer to the shot the board is describing:
a zoom out that carries on past the cut, not one that arrives and waits.
(The alternative -- keeping the move inside the slot and halving its travel
-- would have opened on a dot barely magnified, which loses the frame the
sequence is built on.)

### 5.154 The Library loses Other

"Remove other." The Library's third nav entry and its Milestones panel are
gone, and so is everything that was only there for them: the panel markup,
the builder, the MILESTONES table, and the seven shapes it drew from --
the blood tube, the syringe, the balance, the apple, the feet, the
medication and the supplements, about 200 lines in all. Nothing else
referenced any of it, so leaving it would have been unreachable code rather
than a feature waiting to come back. It is in the history if it is ever
wanted: dadecf8 is the last commit that has it.

The nav is two entries now, Organ Library and Organs -- Fine Grain, which
is the pair the Density control already mirrors -- so the page and the bar
say exactly the same thing, which they did not quite before.

### 5.155 Liquid Glass, on the mobile overview

A new navigation for the phone: a floating dock at the bottom and a floating
pill at the top, both of one material.

The material is three layers, which is what keeps it from reading as a
frosted white rectangle. A gradient of its own runs across the pane; under
that gradient sits a dark plate at 55% (in light, a white one at 42%) --
without it the blur leaves 9.5px labels sitting on whatever happens to be
behind them, and the brief asked for legibility as well as translucency.
Over both, a sheen: a radial fall from the upper left and a hairline of
specular along the top edge, where glass of any thickness would catch the
light. The backdrop is blurred 26px, saturated 180% and lifted 5%, so what
is behind it keeps its colour rather than going grey. A shadow underneath
separates it from the content; an inset highlight top and bottom gives it a
thickness.

The dock is two pieces at one height, 56px, eight pixels apart: an island
with the four destinations and the chat on its own beside it. The chat is
the same glass warmed with the accent -- more weight than any one of the
four without leaving the system. The active destination takes a brighter
layer of the same glass, not a solid fill, so nothing in the pill is opaque.
The nav element that holds them both takes no pointer events, only the two
pills do, so the gap between them is not a dead strip over the content.

The fifth tab, More, moved to the top pill, where an overflow belongs; the
four that stayed are the four destinations. The top pill sticks to the top
of the scroller rather than sitting above it as a header, so the content
passes under the glass and the blur does the separating -- 48px, the title
at 17px, the overflow and share as two round panes of the same material.

The scroller pays for the float, as it did for the bar: 92px of bottom
padding plus the safe area, which is the dock's 56 plus its 14 plus room to
breathe. The frame's drawn home indicator sits below the dock, 9px clear.

The four are still presentational -- the prototype has one screen -- but the
island answers a tap now: the brighter layer moves and aria-selected follows
it, because a nav that does not respond to being pressed cannot be judged.

"More frosted. Remove border line style. Inactive less prominent. Add a 5th
item in the main island." The blur goes 26px to 44px and the plate 55% to
66%, with the light gradient pulled back -- more diffusion, less window. The
outline is gone entirely: the edge is a soft catch of light now (one inset
highlight, blurred) rather than a drawn line, which is what separates glass
from a bordered card. Inactive items drop from 68% to 42% (light: 55 to 36),
so the active one carries the pill on its own. And the island holds five
again, which means More came back down from the top pill -- it was there
because four slots could not hold five destinations, and five can.

"Use this nav on the overview mobile screen as well. Keep the nav as a
master asset because it is common to multiple screens." So it is one asset
now: the markup is written once in the script (MOBILE_NAV) and mounted into
each phone that carries it, rather than pasted into the page twice. Each
mount gets its own id and its own tap wiring. One CSS gate says which modes
show it -- v8 in the first phone, m6 in the second -- and every other rule
is keyed to the component's own classes, so the asset is identical wherever
it lands.

The Overview screen had a bar of its own, .ovtab: a flat row of squares
under a hairline. It is gone, markup and rules, or the screen would have
carried two navigations.

### 5.156 The arc opens the other way too

"Arc needs to transition between Bio age and biomarker." It only did in one
direction. Leaving the biomarker slide, the twenty-eight dots travel along
the arc into its centre, grow to the indicator's size, take its ink, and the
indicator takes over from the single dot they become -- a move built when
the gather went in. Arriving, there was nothing: the age ticks faded out
over the 260ms swap, the slide landed, and the dots were simply written down
left to right. A transition on the way out and a cut on the way in, which is
why the pair never read as one control.

So the gather runs backwards. Same clock (320ms), same path, same easing,
the same `place()` that draws the travel -- only `m` runs 1 to 0 instead of
0 to 1. One dot at the indicator's radius opens out along the curve until
every dot is on the run. Two things differ from a reversed gather, and both
follow from what the move means. Every dot is at the resting grey through
the spread, not at its range colour: this is the indicator coming apart, and
the indicator is one ink. And every dot is at full opacity from the first
frame rather than rising through the run's taper, because they are all
already there -- the ends' fade belongs to a run being written, not to one
being unfolded. The colours arrive after, on the reveal the design already
had: `dotsRevT` is set to `dotsSpreadT + DOTS_SPREAD`, so the left-to-right
growth starts the frame the spread finishes and nothing overlaps.

The indicator has to be held for it. Its opacity was falling out with the
slide (`1 - 2 * bioA`), so by the time the slide landed it was already gone
and the run would open out of nothing. It is now held at full while the
biomarker slide is arriving and the spread has not started, and released at
the spread's first frame -- where the gathered dot sits at exactly its
radius, its size and its ink, so the hand-over is invisible. That is the
same trick the gather uses at its end, in the other direction.

The spread's clock starts where the reveal's used to: the slide fully on and
settled on its integer (`bioOn >= 0.999`, `bxT` within 0.02 of a whole), so
a swipe still in flight cannot trigger it. Leaving the slide clears both
clocks, so a swipe back part-way through opens it again from the top rather
than continuing a spread whose indicator has gone.

### 5.157 The scale goes to a hundred, and gets a page

"I want the particle colour system to range from 5% opacity to 100% with 5%
increments -- 5% 10% 15% etc -- with the 3 colours. On my design system I want
to follow this structure as I'll set one token colour and apply the opacity
ranges."

The grid was already the shape of the ask: every dot in the file snapped to a
multiple of 5%, twice -- once where the opacity is authored and again at the
last line of the shader, because a dozen factors multiply into alpha in between
and the guarantee has to survive them. What it was not was complete. It stopped
at 90%, so the scale could not state the token at full, and a design system
built on "one token, a ramp of opacities" needs the top of the ramp to be the
token itself.

So OP_HI goes 0.90 to 1.00 and the grid is twenty values. Only the top moves.
The normal cloud never reached the old ceiling -- the highest band tops out at
50%, which BRIGHT lifts to 71%, five steps clear -- so the population that
changes is the 10% depth highlights and the non-flow cap in the shader, which
is the only thing the ceiling was ever binding on. opBright was clamping flat
at 0.90 and losing four of its seven steps; it runs 0.80 to 1.00 now, five
steps, and the brightest dots in the cloud are the token at full. Measured on
the hero: mean luminance 14.67 to 14.88 in dark, bright pixels +3.5%, and in
light very slightly more ink on the pale ground. A touch more depth in the
highlights, no glitter.

Then the export, which turned out to be lying. The canvas holds the grid by
bucketing -- DOT_STEPS is 20, and that IS the 5% grid -- but the SVG sink is
deliberately unbatched, one circle per dot with its own fill-opacity, because
that is what makes an export inspectable. Unbatched means unsnapped: a 5% dot
seen through a layer fade came out at 0.015 or 0.040, and an export of one
organ carried a dozen values that are not on the scale. Pre-existing, and
invisible until you go looking, which is exactly the problem -- the SVG is the
asset that leaves for someone else's tool. The sink snaps now, the same way the
batch does. Same organ, after: 10,659 circles, opacities 0.05 through 0.95 in
exact fives and nothing between, 123 of them at full with no fill-opacity
attribute at all.

The structure itself gets a page. Library -> Colour: the three tokens by the
roles the cloud deals them in -- material at 60%, lighter tone at 25%,
highlight at 15% and the flow -- each over the twenty steps. It is not a copy
of the palette. The strings come from INK_CSS / MID_CSS / LIT_CSS through
inkNow(), the same values the engine paints from, so recolour() repaints it in
the frame a pick lands and the theme selector swaps all three for the light
inks, which are different colours rather than the same ones dimmed. Set a token
to #3366FF on the tweak bar and the whole ramp is blue. Click a step and its
rgba() is on the clipboard.

The swatches sit directly on the page ground with nothing behind them. A token
ramp that paints its own plate is showing you the plate, and 5% of the material
ink on this burgundy genuinely is almost nothing -- which is worth seeing,
since it is what the bottom of the scale buys. The percentage under each step
carries the reading.

### 5.158 A controller for the glass

"Add controller for the glass effect on the main nav." The material had been
tuned by editing the stylesheet and reloading, three times over, which is the
slowest possible way to judge a blur. So it comes onto the bar: a Glass menu
beside Tweaks, six sliders, live.

The question worth getting right was what a control means when there are two
themes. The dark pane is a gradient over a plate at 66% of near-black; the
light pane is a gradient over a plate at 58% of white. Those are not the same
number and were never meant to be -- each was tuned against its own ground. A
single "plate opacity" slider writing one absolute value would flatten that:
move it and you lose whichever theme you were not looking at.

So the six split in two. Blur, saturation and brightness are absolute, because
a backdrop filter does the same thing whatever is behind it -- 44px of blur is
44px of blur on both grounds. Tint, sheen and shadow are multipliers on the
values each theme already carries, defaulting to 1. Every alpha in both
stylesheets became calc(base * var(--lgTintK)) or its sheen and shadow
equivalents, so one slider at 50% halves the dark plate to 0.33 and the light
plate to 0.29, each from its own base. Measured both.

The properties go on documentElement, not on body, and that is the one detail
that would have quietly broken it: body.light declares the theme's own values,
and an inline custom property written on body would be arguing specificity with
a class rule on the same element. On html it is plain inheritance -- the root
value flows down, the theme's rule never competes with it.

Each row states its value in mono at the right. A slider is a gesture and a
number is a decision; if the point of tuning a material is to end up with
values that go into a design system, the bar should hand them over rather than
make you infer them from a thumb.

Reset removes the properties instead of writing the defaults back into them.
The difference matters the next time a default is re-tuned in the CSS: removal
lands on whatever the stylesheet now says, while writing 44 back would pin it
to what a list in the script remembers. The sliders' resting positions are
still a second copy of the defaults -- that is the part a future re-tune would
have to catch up -- but the material itself has one source.

The menu is gated to the two screens that carry the navigation, the same way
the biomarker group is gated, since a control for something not on screen is
just noise. Opening it closes Tweaks and the reverse: two fixed panels under
one bar would overlap, so the placement code that was written for the one
dropdown now runs over all of them.

Note that v8 opens fullscreen, where the bar is hidden by design -- tune on
#m20 or #m6, which show the bar and the navigation together.

### 5.159 The teaser, as a page you scroll

A landing page for Organ Age, built on the file's own parts: one canvas, one
set of particles, and a scroll position as the only clock. Every scene is the
same points at different targets, blended -- a particle in the universe is the
particle that becomes a chamber of the heart and the one that lands in the
phone. That is the whole reason it is one canvas and not nine sections.

Reuse was the constraint and it mostly held. The organs come out of the file's
clouds through samplePts, the colours are the three inks through inkNow, the
opacities go through opRender onto the twenty-step grid, the fills are batched
by makeBatch the way every other 2D surface batches them, and the figures are
PILL and CHRONO. What had to be new is a camera: a perspective divide and a
defocus term. Every flat surface in the file has no use for those, and a page
that moves through a volume cannot do without them.

Two things I got wrong, both worth writing down.

The first was a design-system error, not a maths one. I reproduced the rule
"colour is random" and then drew my own opacities from the bands. But the other
half of that rule is "opacity is anatomy": a point's authored alpha is its
distance to the nearest boundary in the silhouette, and it is the entire reason
an edge looks like an edge. Keeping the colour rule and inventing the opacity
gives a cloud of exactly the right colours in the shape of nothing. Opacity now
travels with the state, so a blend between two scenes crossfades the anatomy
along with the position.

The second was surplus particles. Nine thousand of them wrapped over a
2,600-point sample meant every structural point was drawn three or four times
with a few pixels of scatter, and a few pixels on every point is ten pixels of
thickening -- enough to close the gaps between the chambers. The organ is
exactly the sample now, and what is left over falls away around it as the dust
it came from, which is also what the story wants at that moment.

The third thing took an embarrassing number of passes and was never a
rendering problem at all. The hero organ read as an oval haze, and I went
looking for it in the density, the sample depth, the perspective, the strands
and the dot size in turn -- each time re-rendering, each time still a blob,
each time concluding something was wrong with the renderer. The painter drawn
at the same size looked no better, which seemed to confirm it.

The organ was never on screen. The timeline had a key for the heart at 0.620
and the next key, the lung, at 0.725, with nothing between them: the heart was
the picture for exactly one instant and was already halfway to the lung by the
time any frame I inspected was taken. Every "blob" was a fifty-fifty blend of
two organs, which is precisely what a fifty-fifty blend of two organs should
look like. Giving each organ a real hold -- two keys naming the same state, so
that nothing morphs between them -- produced a heart with its chambers and its
vessels on the first try, and a lung with two lobes and a trachea.

And a fourth thing, which is why the brief came back a third time: the page was
not in the menu. MODE_GROUPS is an allow-list, not a display order -- a mode
whose group is not named in it is built, routable by its hash, and completely
invisible, with nothing anywhere to say so. Adding { group: 'Landing page' } to
MODES was half the job; the group had to be added to MODE_GROUPS as well. Until
it was, the only way to reach the page was to know to type #m23, so opening the
artifact and looking down the Version list showed no landing page at all and
the reasonable conclusion was that none had been built. A silent drop is worse
than an error: everything I had verified about the page was true, and none of
it was reachable.

The lesson is not about particles. A scene needs somewhere to be still before
it can be judged, and a timeline built only of transitions has no such place.
The other lesson is that "it works" is not the same as "it can be found", and
only one of those two had been tested.
The probe stops were chosen off the key list and every one of them landed
between two keys, so the instrumentation agreed with the bug. Every hold in
KEYS is now a pair, and the walk samples the middle of each pair rather than
the numbers either side of it.

The second organ is the lung. The brief suggested kidneys for "others may be
ageing faster" and in PILL the kidney is a year younger; using it would have
this page contradict every other screen in the file. The lung is +8 and is the
organ that actually carries that reading.

### 5.160 The chips become a control

"Chips must be clickable. Increase grey intensity, #fff 8% bg. On tap the chip
should turn to active state and the list below should turn into loading state,
same as the search typing data set loading state. Only one chip can be selected
in the list."

They were divs. Divs with an .on class on the first one, which is a picture of
a filter rather than a filter -- no tab stop, no keyboard, nothing to press.
They are buttons now, with aria-pressed saying which is on and data-st naming
the status each one selects, and the plate goes from 7% to 8% with the chosen
one at 16%, twice it, behind the white edge it already had.

The loading state is not a copy of the search's. It IS the search's: typed()
and the chips both call one load(), which hides the list, shows the skeleton,
and applies the filter 380ms later. Two code paths doing the same 380ms would
have drifted the first time either was tuned, and the point of the request was
that the two should feel like the same act -- the set below is being fetched
again, whatever asked for it.

Which meant the filter had to be one filter. A row passes if it matches the
typed text AND the chosen range, so picking Optimal inside a search narrows
what the search found rather than replacing it. The status comes off the row's
own pill (.st ok / .st sub), so the filter reads the list rather than a second
table of what is supposed to be in it.

Two of the five ranges hold nothing in this sample -- the chips carry the
design's figures (81/9/6/28) and the list is twenty-five rows, seventeen
optimal and eight suboptimal. Rather than invent results to fill them, the
empty line changes with the reason: a search that found nothing names what was
typed, a range that holds nothing says "No biomarkers out of range", which in a
health app is a result and reads as one. Fabricating two out-of-range
biomarkers to make a control look busy would have been the wrong kind of
fixing.

### 5.161 A controller for the dock's shape

"Add bottom nav controller for style / effect." The glass menu tunes what the
material is like; this is the other half -- how much room the dock takes and
what shape it is.

Five controls. Height, side inset and scrim are sliders writing custom
properties on the root, the same pattern the glass uses. Shape and labels are
classes on the body instead, because a shape is a state rather than a number,
and they go in CARD_STATE so setMode does not drop them when it writes the
class list whole.

The height is the one that had to be derived rather than set beside anything.
It drives the island, the chat, both radii and the scroller's bottom padding
from one variable; at 72px the padding goes 92 to 108 on its own, or a taller
dock would quietly start covering the last row of the list under it. That is
the same lesson as the flow multiplier: a size that means "a fraction of that
other thing" has to be stored as that fraction.

Both shape states are CSS alone. "One bar" closes the gap and squares the two
facing corners so the island and the chat read as one continuous control; it
would have been easier to move the chat into the island in the DOM and that
would have forked the markup of an asset mounted into several screens.

The scrim is the effect the screenshot asked for without naming. Glass shows
what is under it, which is the point of glass and also the problem when what
is under it is a list -- a row was running straight into the labels. A fade of
the page's own ground rising behind the dock separates them without making the
pane opaque. First cut spent the strength twice, in the gradient's alpha and
again in opacity, so a slider at 100% arrived at 72; the colour is solid now
and opacity carries it alone. Off by default: it is a choice about a screen,
not a property of the component.

### 5.162 Four corrections, and one of them was upside down

**Chips, 44px and a 1.5px edge.** The height is explicit now rather than falling
out of the padding -- a control has a size, and a padding-derived one drifts the
moment the label's font moves. The 1.5px edge could not be a border: Chromium
floors border-width to whole CSS pixels, measured at dpr 1, 2 and 3, so a
declared 1.5px border paints at 1. It is an inset box-shadow ring instead, which
renders at the width it is given and, being outside layout, cannot move the row
by a sub-pixel -- which is what the transparent-border trick existed for.

**The counts are counted.** "Make sure ALL = the sum of all chips, and the items
in the list match the number of the chip selected." They were the design's
figures -- 81 optimal, 9 suboptimal, 6 out of range -- written into the markup
over a list of twenty-five rows, so every chip disagreed with what tapping it
showed and All agreed with nothing. They are tallied from the rows at init now:
All is the sum of the rest, which is also the row count, because they are the
same arithmetic. A range with nothing in it drops its chip rather than sitting
there as a dead control at zero -- and `display:flex` on the class beats the
UA's `[hidden]{display:none}`, so it has to be told twice. 25 = 17 + 8, and
each chip's number is exactly what its list shows.

**The landing opens on a body.** "Landing should start by a single dot and zoom
out to form a body shape." The pull-back from the one dot does not open onto a
formless field any more: it resolves into a person, holds long enough to be
read, and only then comes apart into the universe of signals it is made of.
Which makes the universe read as *yours* rather than as space, and is the move
the teaser opens with.

**And every organ on that page had been upside down.** The clouds are authored
in the engine's space, where +y is up; a screen's +y is down, and the painter
has always negated it (`oy - qy * sc`). My organInto added it. On a heart that
is nearly invisible -- it is roughly symmetric about its own waist, and I had
looked at it a dozen times while chasing a different bug. A body arrived with
its head at the bottom and the mistake was unmissable in one frame. Worth
remembering: the shapes that hide an error are the ones you verify against.

### 5.163 One control for the inks, and no dead scroll

**"Combine this into one select, Particles colours."** Six elements in a row --
swatch, hex, swatch, hex, swatch, hex -- took a third of the bar to say one
thing, and said it without naming which ink was which. They are behind one
menu now, in the same idiom as Tweaks, Glass and Dock, and in the panel each
ink has a row and a role: Ink 01 Material, Ink 02 Lighter tone, Ink 03
Highlight -- the words the Library's Colour page already uses, so the bar and
the design system call them the same thing. Save moved in with them, since it
is what makes a pick outlast a reload. Checked that a hex still drives its
swatch, the cloud and the Colour page's ramp in the same frame.

**"On landing I want the scroll to always move vertically, never stop and
scroll without anything animated."** Fair, and it was something I introduced.
A hold in the timeline is two keys naming the same state, which is what stops
an organ being a permanent blend of two organs -- but I had given both keys the
same camera and the same pan as well. So through every hold the picture was
exactly where it had been: you turn the wheel and nothing happens. Five of
those, and the worst was the title card, where the field is out and the only
thing on screen is a line of type that was also static.

A hold holds the MORPH, not the camera. No two consecutive keys share a camera
and a pan now: through every hold the camera keeps pushing in and the world
keeps rising, and pan runs monotonically down the whole timeline, so whatever
else is happening, scrolling moves the content up. The copy gained a second
movement besides its fade -- a slow rise across the whole of each line's life --
which is what carries the title card, where there is nothing else to carry it.

Measured rather than judged: the timeline walked in twenty-five steps, each
compared against the last on the ink's centroid, its pixel count and every copy
block's position. Every step moves. The smallest is the title card, where the
canvas is legitimately empty and the type is the whole of it.

### 5.164 A hundred and ten readings

"Put good values", against the design's own chip row: 110 All, 68 Optimal, 20
Suboptimal, 12 Out of range, 10 Other. Which sums correctly -- so the only way
to have those figures AND keep the rule from two notes ago, that a chip's
number is what tapping it shows, was for the list to actually hold a hundred
and ten readings in that distribution. It held twenty-five.

So the panel is a table now, not markup. A hundred and ten rows of HTML is a
hundred and ten chances to mistype one, and more to the point the counts have
to be a property of the data rather than of the file: the chips tally the rows
they will filter, so the only thing that could ever disagree with the design is
the table, and the table is one place to look.

Seven groups, the ones the list already had, and the standard panel under each
-- liver enzymes, the lipid fractions and particle measures, the thyroid axis,
the full blood count and iron studies, the inflammatory markers. The values are
plausible placeholders, as the original twenty-five were. Two statuses had no
look yet, since nothing in the list had ever been out of range or unclassified;
they have one now in both themes.

I miscounted the table by two on the first pass -- 112 and 70 optimal -- which
is exactly the failure mode the derived counts protect against: the chips said
112 and the list showed 112, perfectly self-consistent and not the design. The
tally is a script now rather than an eye.

One detail fell out for free. The marker on each row's range bar is placed from
the row's status, so an optimal reading sits over the green, a suboptimal one
over the amber and an out-of-range one past it -- deterministic within its band
off the biomarker's own name, so the markers neither stack on one pixel nor
move between loads. It used to sit at the far left on every row regardless.

And Other stopped being gated to one version. Its count governs it like every
other chip: there when the list holds unclassified readings, gone when it does
not.

### 5.165 The record select, and a sheet to choose from

"Put this next to the Search. Record select - Search. Select should be
clickable, 56px same as the search. Offer multiple options. On click on an
option the list is loading state." First as a bottom sheet, then a design came
back showing a menu anchored under the button instead -- a title, "category |
date" beneath it, and a badge with the count of readings that record carried.
The menu is that.

The records line used to be a div above the chips that said "25 records" and
did nothing. It is a control now, beside the search and the same 56px, and the
two share a row: choosing the record set and searching within it are the same
question asked twice, so they belong on one line. The select takes what its
longest label needs and the search takes the rest -- the other way round and
the label truncates, which is the one thing a control naming the current state
cannot do.

A native select could not carry it: a title, a category, a date and a count per
option is four things, and an OS picker has room for one. So the menu is a list
of its own, anchored under the button that opened it, with the button staying
visible above it -- which is what tells you what you are changing, and is why
it is not a sheet.

The counts are the design's and they sum to 136 over a panel of 110, which is
right rather than wrong: a biomarker measured in August and again in May is in
both reports. So a reading belongs to one or more records. The membership is
assigned by walking the records' counts as one run of 136 and stepping through
the rows by a stride coprime with 110 -- the first 110 steps touch every row
exactly once, so nothing is orphaned, and the remaining 26 give those rows a
second record. Exact quotas by construction, and the same sets on every load.
Measured: every badge is exactly what its option shows, 44, 32, 2, 2, 56, and
All is the 110 distinct.

Picking an option goes through the same load() a keystroke and a chip go
through, because it is the same act. The chips recount for whatever record is
chosen -- 44 = 30 + 8 + 2 + 4, 56 = 37 + 9 + 5 + 5 -- and a chip whose range
empties under a narrower record hands back to All.

Two placement bugs, both the same lesson about where a thing actually lives.
The menu was written beside the controls it belongs to but outside their
wrapper, so position:absolute resolved against the scroller and it rendered
nine thousand pixels down the content: open, correct, and nowhere to be seen.
And once it was in the right parent it was still painted over by the dock --
.mBody is position:relative with z-index 2, which makes it a stacking context,
so the menu at 9 inside a wrapper at 10 resolves at 2 against a dock at 6 and
no amount of raising it could ever have worked. The dock steps back instead,
and only while the menu is open.

One thing noticed and left alone. The hero's two readings of the panel live in
BIO_SETS, and its "unclassified shown" set is 68/20/12/10 -- exactly the panel
the chips now count, which is a pleasing confirmation that the table is the
design's. Its "folded" set is 80/24/12 against a stated total of 110, and
80 + 24 + 12 is 116. That is the design's own arithmetic rather than the
prototype's, so it is flagged rather than quietly rewritten.

### 5.166 The two selects move above the chips

"Put the 2 select above the Chips filters. Increase gap between select and
search by 4px. Select radius 14px, same for search."

The order is the logic: the record select and the search decide WHICH set is on
the page, the chips cut that set by range. So the two that choose come first
and the one that narrows comes after. Gap 8 to 12, both radii to 14.

Moving it exposed a nesting mistake of my own making. Splicing the row above
the chips, I cut at the row's closing tag and put the chips block there --
which made the chips a flex child of .msRow, so they laid out on the same line
as the search and painted over it. The fix was to walk the div depth from
.msWrap's opening tag to find where it actually closes, rather than counting
closing tags by eye. Chips and row are siblings now, row first.

Then: "search 35% width, select report 65%. Select needs the eyebrow when an
option other than All records is selected."

The button carries two lines now -- the report's title over its category and
date, in the words the menu uses -- and one line for All records, which is not
a report and has nothing to qualify. That is also why the select takes the
larger share: it has two lines of text to hold and the search has none.

The split is calc((100% - 12px) * .65), not calc(65% - 6px). Taking half the
gap off each looks equivalent and is not: 6px is a larger share of the smaller
box, so the ratio came out 65.5 : 34.5 rather than 65 : 35. Measured 65.0 after.

One thing I changed without being asked, and would undo on a word: at 35% the
field is 137px, and "Search biomarkers" simply clips there -- a placeholder has
no ellipsis. The visible placeholder is "Search" now; the accessible label is
still the full phrase.

### 5.167 The tuned glass becomes the glass, and the dock clears the home

"Keep these values as default" -- blur 16, saturation 100, brightness 0.90,
tint 70, sheen 20, shadow 165. Which is a much quieter material than the one I
authored: far less blur, no added saturation, a darker and lighter-tinted plate
and most of the sheen gone, against a heavier shadow. They are the :root values
now and the sliders rest on them, so Reset returns here rather than to what the
file used to say.

"Can I also have an option for the light effect and all effect for the active
state. The inactive state, the opacity on the item." Two more controls in the
Dock menu. Active light scales the whole of the active item's treatment -- its
brighter layer, both inset highlights and its shadow -- and Inactive scales how
present an unchosen one is. Multipliers on what each theme landed on, as the
glass's three are, because the dark and light docks do not carry the same
numbers and one control has to be honest across both.

"Push up the nav group by 16px, need to be 12px above the home bottom." The two
numbers did not agree, and measuring said why: the dock's bottom was sitting
ONE pixel above the home indicator, not the nine I would have guessed from the
stylesheet. `body:not(.fullscr) .mTabs{padding-bottom:22px}` had never applied
-- `body.v8 #phone > .mTabs` sets the padding shorthand and out-specifies it --
so the framed dock silently wore the fullscreen number. It is a variable now,
--navLift, which cannot lose that argument because there is only one
declaration: 25px framed (12 clear of the indicator's top, plus its 5px height,
plus the 8px it sits off the edge) and 14px fullscreen, where the device draws
its own indicator into the safe area that env() already pays for. Measured: the
gap is exactly 12. The group is 56px and always was.

"When an option is selected, put a cross icon -- clear action, same as the
search. Tapping the rest of the field triggers the options list."

Two targets means two buttons, since a button cannot contain a button: the
cross is laid over the field's right end rather than inside it, and stops the
click from reaching the field underneath. The chevron leaves when the cross
arrives -- with a record chosen the useful action is undoing it, not being told
the list can open.

And a trap worth writing down. I hid the chevron with el.hidden = true and it
did nothing, while reading back as true. `hidden` is an HTMLElement property
and the chevron is an SVG element, which does not implement it: the assignment
created a plain JS field and the attribute was never set. It looked correct
from script and wrong on screen -- the chevron sat beside the cross. Both icons
are driven by one class on the wrapper now, which is what should have decided
it anyway: they are two halves of one state, not two things that happen to
agree.

### 5.168 Save, one group, and a colour for the plate

"Add a Save, that will save the setup after change." Both panels have one now,
beside their Reset, each persisting its own values under its own key -- the
same thing the ink pickers have always done, for the same reason: a material
tuned on the bar is worth more than one reload. Storage can throw, so every
path fails back to the defaults and the button says "Cannot save" rather than
pretending.

Reset clears the save as well as the properties. Without that, a reset would
look undone the moment the page reloaded -- which is the same mistake as a
Reset that writes the defaults back instead of removing them, and I have made
that one already in this file.

"Put glass inside Dock." They were two groups on the bar, Dock and Glass, which
is two labels for one object: what the dock is shaped like and what it is made
of. One group now, two menus -- Dock [Style] [Material].

"Put up nav by 4px." --navLift 25 to 29, so the gap over the drawn home
indicator goes 12 to 16. Measured.

"Add bg colour of the dock nav." The plate was a literal in two places, near
-black under a dark page and white under a pale one; it is --lgPlate now, with
each theme starting from its own and a picker over both. Written on BODY rather
than on the root, which is the same trap the glass multipliers avoided from the
other side: body.light declares its own starting plate, so a value set on the
root loses to it in the light theme, while inline on the same element wins in
both. The swatch reads whatever the theme is actually painting until someone
picks -- after that the pick stands, through a theme change, because a colour
someone chose is a colour they chose. Reset removes it rather than writing one
back, so the plate returns to what the theme says.

### 5.169 Ellipsis, 60/40, a heavier chip and a bar that fades

"Consider ellipsis if title too long. Select 60%, search 40%." The split moves
and the title truncates rather than wrapping into the date beneath it --
"Comprehensive Blood Tests" wants 187px and has 151, and ends in an ellipsis.
The select still takes the larger share because it carries two lines and the
search carries none.

"Bg opacity 12%." The chips' resting plate goes 8% to 12%. I took the active
one up with it, 16 to 20, to keep the doubling the first instruction asked for
-- "inactive light grey, active lighter grey" is a relationship, and leaving
the active where it was would have closed the gap to four points. Say the word
if the active should stay at 16.

"Fixed top bar gradient progressive instead of clear cut." Pinned, the bar's
plate stopped dead and the list carried on from the next pixel, so a row was
sliced across its own middle. There was a shadow on that edge, which marks it
rather than softening it. The plate carries on past its own bottom now as a
30px fade of the page's own ground, and the shadow is gone: rows go out under
the bar instead of being cut by it. Only while it is stuck -- in the flow there
is nothing passing beneath to fade.

### 5.170 A chip at zero, one Dock menu, and the second bar that wasn't one

"Should all chip even is 0." A range holding nothing used to drop its chip.
That made the row reshuffle as the reader narrowed the set -- five chips under
*All records*, three under a small report -- and it also meant a chosen range
that emptied had nowhere to sit, so the page quietly handed the filter back to
*All*. Both are gone. Five chips whatever is on the page, a zero where there is
nothing, and a chosen range that empties stays chosen: the empty line says *No
biomarkers out of range*, which is a result and is more use than the filter
changing out from under the reader.

"Put this inside Dock style. Merge everything about Dock inside dock." There
were two menus, *Style* and *Material*, split on the reasoning that how much
room the dock takes and what the glass is like are different questions. They
are, and it did not matter: tuning a dock means moving between them, and the
two buttons close each other, so every move cost two clicks. One panel now, in
two named halves -- SHAPE over MATERIAL -- with one Save and one Reset at the
foot. The two halves still write two storage keys, because they are two tables
and always were; each registers what it writes and what it clears on a small
shared list and the buttons run whatever registered. Fourteen rows is taller
than a short window, so the panel scrolls rather than running off the bottom of
the screen.

"Bug on scroll. Double fixed bar." It was one bar. When the select and the
search moved above the chips, the chips stayed behind in the scrolling list --
so once the bar pinned, the chips slid up behind it and stood there cut across
their own middle: a row of half pills under the plate, which is exactly what a
second bar looks like. I measured before believing the screenshot, and the
markup was not duplicated (one `#mSearch`, one `#mChips`); the geometry said
the chips overlapped the pinned bar by 42px, and a screenshot of `#phone` at
that scroll showed the sliced pills.

The fix is not a z-index. The chips are the same filter as the select -- they
cut the set the select chose -- so they belong to the same bar, and they pin
with it. The whole filter group is 132px of pinned control on an 810px phone,
which is what it costs; in exchange the list passes under one edge with one
fade. Inside the bar the chips keep the full width through negative margins,
since a horizontal scroller that stops short of the edge tells you it has ended
when it has not. The chips carry the bar's bottom padding now, so the empty
biomarkers state -- which hides them -- gets that padding back explicitly.

### 5.171 The gradient above the bar, and it was there

"Seems like there is an overlap gradient above the top bar? Remove that if any."
There was. Not in the pinned state -- I sampled that column and it is flat
#0d0d0c all the way from the bezel to the bar -- but in the frames just before
the bar pins. The backing plate that keeps the list off the hour and the
battery belonged to the search bar and only switched on at the instant it
pinned, so on the way up the strip was see-through and the hero showed through
it: the organ's dots under two blur layers as a pale smudge beside 9:41, with a
hard seam where the bar's plate started.

A plate that belongs to the status bar has no such moment. `.mstatus` gets its
own ground on this page, behind its text, fading in over the first 80px of
scroll -- so at rest the organ still runs to the top of the screen, which is
the design, and from 80px on the strip is the page's ground at every scroll
position rather than only at the pin. The bar's `.stuck::before` is gone: two
plates in one strip is what kept producing a seam to look at.

"Reduce font top line on the select by 2px." 15px to 13px, over a 12px eyebrow.
That is a flat size hierarchy and it works only because the colour carries it
-- the title is the ink, the eyebrow is grey. Say the word if it wants to go
back up.

"Chip opacity 10%" and "text white". The resting plate goes 12% to 10%. I took
the active one down by the same two points, 20 to 18, to hold the eight-point
step the first instruction asked for ("inactive light grey, active lighter
grey" is a relationship, not two numbers). The label is full strength now in
both states -- and in both themes, which is not the same colour: white on the
dark ground, the theme's own ink on paper, where white would be no text at all.

### 5.172 One filter row, three widths -- and one tweak fewer

"Align the style of these elements following the mobile version. Same for
tablet." The desk had its own reading of the same three controls: 12px-radius
fields at 13.5px text, and chips that were outlined boxes on a 10px radius.
They are the same components, so they now carry the same numbers -- 56px on a
14px radius for the record select and the search, 44px fully rounded on a
filled plate for the chips, the active one a step lighter behind an inset
1.5px ring. The tablet needed nothing of its own: it reads the dashboard's
rules, so aligning the desk aligned it, and its one-row-that-scrolls override
still holds. Light keeps its own two colours, since white on paper is not text.

"Remove this tweak" -- Bio visual, the Iris/Sphere choice for the biological
age figure, gone from the bar. With the control gone `bioSph` could no longer
be set, so the class, the CARD_STATE entry, the setMode clause and `bioIdx`
(which existed only to answer "iris or sphere?") went with it: the slide reads
its own organ index, which is the iris. The Sphere cloud itself stays -- the
renderer still carries its uniform and the library still lists it; what left is
the ability to put it in the age slide.

### 5.173 The dock's own icons

Five SVGs, so the dock stops wearing the marks I drew for it as placeholders.
They are solid shapes on a 20px artboard; the set they replace was a 1.5px
stroke on a 24px one. That is not a like-for-like swap: the old marks used
about 16 of their 24 units, the new ones about 17.5 of 20, so at the same 21px
box the new set reads a third bigger. The box comes down to 18px (21 where the
labels are off, from 23) and they land on the optical size the stroked set had.

`fill: currentColor; stroke: none` rather than the stroke rules, which is what
keeps them on the tab's own colours -- the active tab's white and the
inactive's 42%, both still driven by --navActK and --navInactK from the Dock
menu. The per-circle rule went with the old set; nothing in the new five is a
circle element.

The chat bubble beside them is untouched and is still a 1.5px stroked outline.
It came with no replacement, and at this weight the two read together well
enough; it is worth a look if a matching solid one turns up. The files are
named "active" -- there is no second, inactive set here, and none is needed:
the artwork is already an outline and the state is carried by colour and the
plate behind it, as it was.

### 5.174 The chips settle at eight

"Chips bg fff 8%." Back where they started -- 8/16 was the first pair, then
12/20, then 10/18, now 8/16 again. The eight-point step between resting and
chosen has held through all of it, which is the part that matters: "inactive
light grey, active lighter grey" is a relationship, and the absolute value is
what the eye is being tuned on. One change, three surfaces, because the phone,
the desk and the tablet now read the same chip rule. Light is untouched at
10/17: ink over paper needs a little more weight than white over black to read
the same, and it was tuned there.

### 5.175 The desk takes the phone's arrangement too

"Desktop and tablet should use the same structure as mobile." Style was only
half of it: the desk still had the select alone on one row and the chips with
the search pushed to the far right on the next, which is two rows saying three
things. The phone's arrangement is the select beside the search -- choosing the
record set and searching within it are the same question asked twice -- with
the chips under both, cutting whatever that leaves. That is the structure now
at every width: one `.dRow`, 60 : 40 either side of a 12px gap, then the chips,
then the list.

The one number that is not the phone's is the row's width. 60/40 of a 1160px
column is a 690px select with half a foot of empty space inside it, which is a
different control rather than the same one bigger, so the row is 560px and the
split is taken from that -- a `--dRowW` on `.dash`, so the two shares and the
row cannot drift apart. The tablet drops the search, and there the row ends
where the select does rather than running on into the gap: the select keeps its
329px either way, because a control that grows when its neighbour leaves is not
the same control.

### 5.176 The smear above the bar, and the bar that let go mid-beat

"There is a blur, should be full black with gradient on the bottom of the fixed
bar." The strip between the status bar and the search bar was live content
while the bar was still on its way up -- and on this page live content at the
top means the hero, whose bottom edge is two backdrop blurs and a halo. So what
stood there was a soft coloured smear, not the page's ground. The status bar's
plate now follows the bar down: a second layer whose height IS the gap, so it
can cover that and nothing else, fading in over the last 40px of the approach
and solid for the last 20. Appearing at full height would have been a black
band arriving out of nowhere over the hero, which is a different bug.

  scroll  690  gap 28px  o 0.60   bar at 72
  scroll  700  gap 18px  o 1.00   bar at 62
  scroll  718  gap  0px  o 1.00   bar at 44, pinned

"On the chip click, there is a bug: the bar becomes unfixed during the loading
state." The skeleton is five rows where the list is a hundred and ten. Swapping
them shortened the page, the scroller clamped, and a pinned bar with nothing
left to pin against dropped back into the flow for the 380ms of the beat and
pinned again after. The beat now holds whatever height the list had, so the
only thing that changes during it is the rows. The same hold was already there
for the keyboard, but only while the field was focused -- a chip tap focuses
nothing, which is why it only showed up there.

### 5.177 The desk's controls start working

"Need to be able to click, like the mobile. Search and reports select." They
looked right and did nothing: a div reading "32 records", a div reading
"Search", and six placeholder rows under chips carrying the design's figures --
81 optimal over a list of six, which is two sources for one number and one of
them wrong.

Three moves. The panel table, the records and the membership walk come out of
the phone's controller into the file's own scope, so both surfaces read one
table. The desk builds its list from it -- 110 rows, seven groups, in the desk's
own row shape, with the trend column and a date column where the phone shares a
cell. And the filter itself becomes `bioFilter(cfg)`: one implementation each
surface calls with its own elements.

What is genuinely different stays with each surface. The phone holds the
scroller's height through the beat (a page that shortens under a pinned bar
unpins it) and manages the keyboard, the scroll-to-pin and the status bar; the
desk has none of those and passes none of them. Everything else -- the record
menu and its badges, the chip counts, the empty lines, the beat -- is the one
copy.

  desk   110 rows / 7 groups   chips 110 68 20 12 10
  chip out -> 12 shown   other -> 10   ok -> 68
  record r1 -> chips 44 30 8 2 4, 44 shown, "Pathology Report / Pathology | 13 Aug 2026"
  search "chol" inside r1 -> 1 shown;  cleared -> 44;  record cleared -> 110

One thing to know: on the desktop pages that are not V2 the Other chip is
hidden by the design, so the four chips on screen sum to 100 while All reads
110. All is the row count and the list does hold 110 -- tapping All shows them
-- so the number is honest; it is the hidden chip that makes the row look like
it does not add up. Worth a decision if those pages matter.

### 5.178 The held height bought a second bug

Holding the list's height through the loading beat kept the bar pinned, which
was the point. It also meant that a chip tapped from a thousand pixels down
left the reader looking at held-open nothing for 380ms: the skeleton's five
rows sat far above the viewport, inside a box being held at the old list's
height. I caught it in a mid-beat screenshot -- the page was simply black --
which is the sort of thing a measurement of `stuck: true` will happily tell you
is fine.

The beat now also lands at the top of the results. That is not a patch on the
hold; it is what should happen anyway. A scroll position measured in the old
list means nothing in the new one -- the set is being replaced, so the top of
it is where to be.

The pin point is measured off the LIST, not off the bar. The bar is sticky, and
a sticky element's `offsetTop` already carries the shift, so it reports
wherever it is currently pinned rather than where it sits in the flow -- my
first attempt computed `pin ≈ scrollTop` and so never scrolled at all. The
list's top in content space, less the bar and the status strip, is the
scrollTop at which the bar pins with the list right under it.

  from 1400, chip "Suboptimal": lands at 718, bar pinned at 44,
  skeleton's first row at y 263, then 20 rows at the same position

### 5.179 Still a transparent gap -- on the pages I had not scoped it to

The plate held on the current design and nowhere else. The search bar is on
every mobile page, and the status bar has lain over the page since V5, so V5,
V6 and V7 have exactly the same strip to hold -- and I had written the rule as
`body.v8`. On those three the strip stayed transparent and the list showed
through beside the hour, which is what the screenshot was of.

Scoped to `body.v5` now, which V6, V7 and V8 all inherit. V4 and earlier keep
the status bar in the flow (`position: relative` or `static`), so `statusH()`
is 0 there, there is no strip, and nothing to hold.

  m16 m17 m19 m20  status bar absolute, plate present, strip opaque
  m15 and earlier  status bar in the flow, no strip

A reminder that "which pages does this rule apply to?" is a question to answer
from what the rule is FOR -- the status bar lying over a list -- rather than
from the page I happened to be looking at.

### 5.180 An overlap instead of an abutment, and 4px above the chips

"Still a gap." I could not reproduce it. Measured at four viewport sizes and
three device pixel ratios, on V5, V6, V7 and V8, the geometry is the same and
the strip is the page's ground: status bar 5..44, bar top 44, select top 56,
nothing between them but the notch's own outline. Forcing a fractional status
height (39.6px, 40.4px) -- the one case arithmetic can lose -- did not open one
either.

So rather than keep hunting a thing I cannot see, the construction changed so
that it cannot exist. The two plates OVERLAP what they meet rather than abutting
it: 10px up past the status bar, where the phone's own radius clips them, and
2px down into the search bar. Abutting is correct arithmetic and the wrong
construction -- `--msTop` is `offsetHeight`, a whole number, so wherever the
real height falls between two integers the plates meet at a fraction of a pixel
and the list shows through the difference. An overlap cannot.

If it survives that, the remaining candidates are outside the CSS: a cached
copy (which had already produced one "where are the icons?" round), or the
browser's own compositing of the hero's backdrop-filters, which headless
Chromium does not reproduce.

"+4px between the select/search row and the chip row." 10px to 14px, on the
chips' own top padding rather than on the row, so the negative margins that
give them the full width are untouched.

### 5.181 The bar is one surface, and the hero cannot reach past it

"Fixed top nav should be above everything and have a black bg, and end with a
gradient progressive at the bottom. Atm I see a gap at the top."

That sentence is the specification, and it is better than what was there. The
strip had been treated as a hole to be patched -- a plate here, another plate
there, each covering what the other missed -- rather than as part of the bar.
It is the bar's now: one surface from the top of the screen through the fields
and the chips, ending in the fade, with the hour and the battery floating over
it. The bar's own plate reaches up by --msTop + --msGap + 1px (the pixel is the
overlap into its own background), and the status bar carries a second plate,
anchored to the screen top, that fades in over the first 80px of scroll and
holds the strip while the bar is still a page away. Where both apply they cover
the same strip twice rather than meeting along an edge. Two surfaces that have
to meet perfectly will eventually fail to; two that overlap cannot.

  strip black at every scroll from 100px, pinned or not, on V5 V6 V7 V8
  pinned frames 600-1400 on all four: nothing in the strip but the notch

And one thing measurement could not reach. The strip was clean in every frame I
could render, which means the arithmetic was never the problem -- so the
remaining suspect is the one element headless Chromium does not reproduce
faithfully: the hero's title pill is `.lgGlass`, a backdrop-filter, sitting at
exactly the coordinates the reported fragment kept appearing at. A
backdrop-filter is the one thing in this file that can be composited outside
the stacking context it was painted in. `#mHead` gets `isolation: isolate`,
which costs nothing and closes that route.

Worth saying plainly: I could not reproduce this one in four attempts. The fix
is a change of construction plus a guess at a compositing path. If it survives,
the next thing to check is not the CSS.

### 5.182 The search is an icon until it is a search

"Search uses too much space. Use a simple search icon CTA only and extend the
search field on click to cover 60% of the width, which will reduce the width of
the report select. This is on mobile."

Right: a field that says "Search" and holds nothing was spending 40% of the row
on a word. At rest it is a 56px square with the magnifier in it and the select
takes everything else -- 81% rather than 60%, which is enough for the report's
title and its date on two lines. Tapped, the field opens to 60% and the select
gives the room back.

Both are flex-basis with a transition, so the swap is two boxes changing width
rather than a reflow. The select drops its eyebrow while the search is open:
category and date are the detail you drop first when the room runs out, and one
line that can be read beats two that cannot.

  rest    select 81%   search 56px
  tapped  select 39%   search 58%   (60/40 of the row either side of the gap)

The collapsed field is zero-wide, NOT display:none. The tap on the box opens
the search by focusing the field, and a display:none element cannot take focus
-- hiding it that way made the icon a button that did nothing, which the first
run caught.

It stays open while it holds text, closed otherwise. A field with a search in
it that collapsed to an icon would be a filter you cannot see or undo.

### 5.183 The icon off centre, and an edge that would not paint at 1.5

"Search should be in the center. Icon 20px. Select and search btn border 1.5px.
Focus border field white colour."

The icon was 4.5px left of centre, for a reason worth writing down: the
collapsed box still has two children -- the magnifier and the zero-wide field
-- and a 9px gap between them. The gap is real even when the thing on the other
side of it is not, so the PAIR centred rather than the icon. No gap when
collapsed, and it lands on the middle. 16px to 20px while we are here.

The 1.5px edge is an inset ring, not a border. Chromium floors border-width to
whole CSS pixels, so a declared 1.5px border paints at 1 -- the same thing the
chips' active edge ran into months ago. The border stays, transparent, because
it is what holds the box's size; the visible edge is
`box-shadow: inset 0 0 0 1.5px`, coloured through a `--msEdge` token so hover,
open and focus each set one value rather than each restating a border.

Focused, that token goes full strength: white on the dark ground, the theme's
own ink on paper, where white would be no edge at all. Same rule the chips
follow, so the focused field and the chosen chip now wear the same edge.

  collapsed  box 56px  icon 20x20  offset from centre 0.00  ring 1.5px inset
  focused    ring rgb(255,255,255)      light: rgb(46,36,28)

### 5.184 It grew the wrong way, and the gradient was mine all along

"On click search, the field should expand from right to left, not left to
right." It was growing left to right, and the cause is a CSS detail worth
keeping: `flex-basis` interpolates between two LENGTHS and jumps between `auto`
and a length. The select was `flex:1 1 auto` at rest, so it snapped to its new
width in a single frame -- which put the search's left edge at its final place
instantly and left the right edge to travel outward. Both ends are definite
now (`calc(100% - 12px - 56px)` at rest), the two boxes move together, and the
right edge holds still while the field opens leftward.

  right edge 349.7 at every frame;  left edge 293.7 -> 182.7

"Still feel there is a gradient that overlaps the top part. Remove that." There
was, and it was mine: two plates with animated opacity. The status strip faded
in over the first 80px of scroll, and a fading plate over a bright hero IS a
gradient -- mean row brightness ran 0..68 through that window. The bar's own
plate crossfaded over the last 40px of its approach for the same reason. Both
are gone. The status strip is simply opaque, always; the bar's plate is on when
pinned and off when not. A fixed bar is not a thing that arrives gradually.

  status strip, every scroll: mean row brightness 13..13, flat

The cost is that the organ no longer runs under the hour at rest. Looking at it,
that costs nothing -- the figure starts well below the strip anyway -- and it
buys a top bar with no state in it at all.

"Search 50% and report 50% when search is active." 60/40 to 50/50; measured 48
and 48 either side of the 12px gap.

### 5.185 The assistant gets its own mark, and the desk gets one row

"Use this svg icon." A sparkle, two filled paths on a 24px artboard, replacing
the speech bubble on the dock's fifth pill. That is not only a redraw: a bubble
opens a thread, a sparkle opens something that answers. The button's label goes
with it -- "Chat" to "Ask Everlab" -- because the label is what a screen reader
reads out and it should say what the button does.

Sized like the five beside it. The bubble was a 1.5px stroke using about two
thirds of its 24px box; this is filled and uses about five sixths of the same
box, so 23px would have read a fifth larger for no reason. 20px lands on the
same weight.

"Desktop, this in one row. Records 256px width, chips, search far right." The
desk has width the phone does not, and was spending it on two rows for three
controls. One row now: the select at a fixed 256px, the chips taking whatever
is left, the search pushed right at 256px to match. The phone still stacks,
because 375px cannot hold them side by side -- same components, same shells,
one arrangement per width rather than one arrangement everywhere.

  desk    select 292..548   chips 560..1104   search 1116..1372 (flush right)
  tablet  select 292..548   chips 606..1302   no search

Two things fell out of it. `.dRow` can no longer be gated on V2, because the
chips are inside it now and every desktop page shows chips -- so the gate moved
down to the select and the search, which are V2's alone. And the chips scroll
rather than wrap: a chip row that wraps stops reading as a row, and here a
second line would push the search off the end. Five chips do not fit between
two 256px boxes at this width, so the last 28px fade -- a chip sliced at the
search's edge reads as broken, the same chip fading reads as more to scroll.

### 5.186 Two rows after all, and the accent comes off the assistant

"Record select row 1 left side. Search row 1 right side. Row 2 chips. Same on
tablet." Which supersedes the one-row version of an hour ago -- and is better.
The select and the search are the two ends of one question (which set is on the
page, and what in it are you looking for), so a row with them at either end and
nothing between reads as a pair of anchors rather than as a control and its
neighbour. The chips get the second row to themselves, which is the one of the
three that grows: five now, more later.

  desk    row 1  select 292..548 ......... search 1116..1372
          row 2  chips 292..1372
  tablet  the same, and the search comes back -- it was hidden only because
          the one-row version had no room for it

"Why the right CTA is orange." Asked twice, so I stopped offering options and
made the call. It was orange because the accent was baked into that one pane as
a fixed tint -- which is the single thing in the dock that contradicts the
material's own premise. Every other pane takes its colour from what is behind
it; on a black page there is nothing behind this one to be orange, so what
showed was the raw tint, and 42% accent over a warm dark plate lands as brown
rather than as the accent. The assistant's pill is the island's material now, a
step brighter: set apart by light, which the glass can actually justify.

If it should be an accent CTA instead, the honest way is a committed #F78359
with dark ink, not a wash over near-black -- one rule, and the file says where.

### 5.187 A choice for the left slot

"Create a tweak for the left mini card. Option 1 Coverage. Option 2 latest
report (create this card following the mini card patterns. Title eyebrow:
Report. Main title Pathology test)."

Coverage is a reading the page keeps taking; the latest report is a thing that
just arrived. They want the same slot and are not the same card, so this is a
choice rather than two cards fighting for the room -- one row in Tweaks, one
class, and the CSS does the swap.

The card follows the pattern: the same shell, the eyebrow-then-figure shape the
others use, one slide rather than four because there is one report. Its title
takes .big's size rather than .hiLead's, because the title IS this card's
figure -- what 64% is to Coverage, the report's name is to this -- with the
date and the reading count under it as the line that qualifies it, the way the
record menu qualifies an option.

Two things worth the note. The title, date and count are written from RECS, the
same table the record select reads, so "the latest report" is one fact with one
source; it reads "Pathology Report · 13 Aug 2026 · 44 biomarkers" because that
is what the latest record IS. And the off state had to be declared AFTER
`body.b2 .dash .v2Only{display:flex}` rather than before it: the two carry the
same specificity, so source order decides, and stated earlier the card showed
by default in a slot that already had a card in it.

"Left card --> select (2 options). Coverage. Latest report (default)." It had
come out as a toggle, because `segmentise` turns every two-option select into
one -- and that is right for the rows around it, which are all on/off. This one
is not: Coverage is not the off state of Latest report, it is the other thing
that could be there. So `stLeft` joins the handful of ids segmentise leaves
alone, and the default flips to the report -- the card that shows what just
arrived, with coverage there whenever it is asked for.

  select, no toggle beside it, boots at "Latest report" with the card up

### 5.188 One spot means one spot

"Left card is one spot only!!! the select selects this spot." Both cards were
showing -- three cards in a row built for two -- and the reason is worth the
note. The slot is spoken for by half a dozen rules: b3 hides it, b5 orders it,
noCov removes it, emBio blanks it, v3 drops it on the phone. My swap was a
plain `body.leftRep .dash .hiCov`, which several of those out-specify, so the
coverage card stayed up and the new one arrived beside it.

Fixed by making the report card carry `.hiCov` as well as `.hiRep`. Every rule
about that slot now lands on both, so the slot behaves the same whichever card
is in it, and what is left is the choice of WHICH -- stated with !important on
purpose, because it is not an argument about which of those rules wins, it is a
switch between two cards inside whatever they decided. The phone's bento gets
its own copy of the card, so the select means the same thing there.

  m10 m18 m20 m21  exactly one card in the slot, boot / coverage / report
  m13 m14          the slot does not exist on those pages, and still does not

"Add +8px between row here." 14px to 22px between the fields and the chips.

"On desktop and tablet this should follow the same pattern as the mobile,
stick to top on scroll." The controls that decide what the list shows should
still be there a thousand rows in. Both rows pin as ONE block -- two sticky
blocks would part company the moment one of them changed height -- with the
page's ground behind it and the same 30px fade under it the phone uses, on only
once it is actually pinned, since in the flow there is nothing passing beneath
to fade.

  desk and tablet: pinned from scrollTop 700, block 182px, fade on

### 5.189 The page's ground, said once

"Why grey bg? Should be same bg colour as the body." Because I had named the
colour twice. The block was `background:#0d0d0c`, which is the desk's ground --
and the tablet's is `#000`, so the block sat on it as a grey slab. Light made
three, and a fourth would have been one more place to forget.

The ground is a token now, declared where each theme declares it and read by
everything that has to look like the page:

  .dash            --pageBg:#0d0d0c   --pageBg0:rgba(13,13,12,0)
  body.light       --pageBg:#fff
  body.b5          --pageBg:#000      (the tablet, and Desktop b5)
  body.light.b5    --pageBg:#fff

`--pageBg0` is the same colour at zero alpha rather than `transparent`, because
some engines interpolate a gradient to `transparent` through grey -- the phone's
fade already spelled its own out for that reason, and now both read the token
instead.

  m10 / m21 / m18, colour and light: page and block report the same value

### 5.190 The report's title is a figure, and its action is the card

"Report card title should use the same font size as the steps title 2,568."
It did -- at the size I had typed into `.hiRepTitle`, 22px, which is what
`.hiCard .big` is *before* either surface resizes it. The phone takes `.big`
down to 18px and the desk up to 24px, so a third number was wrong on both.

The title carries `.big` now and `.hiRepTitle` asks for one thing, a
line-height, because it wraps and a number never does. The size, weight and
colour come from wherever `.big` is set for that surface, so the two cards in
that row cannot drift apart again:

  m11 m16 m17 m19 m20  phone  title 18px = steps 18px
  m10 m18 m21          desk   title 24px = steps 24px

"CTA view report remove arrow, Full width." The arrow was there to say *this
goes somewhere*; a button that fills the card already says it, and the other
mini cards' pills sit next to a slide's worth of other content where a
left-aligned pill with an arrow still earns its shape. So the rule is scoped
to this card -- `.hiRep .hiAct{align-self:stretch;justify-content:center}` --
and Book now / Start keep theirs.

  8 pages, both themes: 0 svg in the pill, inset 22px / 22px on the phone and
  20px / 20px on the desk -- the card's own padding, edge to edge

### 5.191 The report card, as specified

"Latest report / Pathology test / 13 Aug 2026 / 44 biomarkers. CTA (footer)
position." Four corrections to the card and one to where its button sits:

- the eyebrow reads *Latest report*, not *Report* -- which is what the card is
- the title is **Pathology test**. It comes from `RECS`, so the record is what
  was renamed: the card and the record select now say the same thing, which is
  the whole reason the card reads from that table. `Pathology test` also sits
  better beside `VO2 Max Test` and `Comprehensive Blood Tests` than
  `Pathology Report` did.
- the date and the count are two lines, not one sentence joined by a middot.
  Two facts that happen to be about the same report; at 171px the middot line
  wrapped anywhere it liked.
- the pill sits on the card's floor. `.hiAct` keeps its 20px bottom margin
  everywhere else because a dot row sits under those cards; this one has
  nothing below it, so the margin was just a gap.

### 5.192 One tweak for one slot

"Remove as it's on the Left card select." The Coverage on/off tweak predates
the Left card select and the select now owns that spot -- Coverage is one of
the two things that can be in it. Two controls for one slot is one too many,
so the tweak is gone: the row, the listener, `CARD_STATE.noCov`, the class
setMode wrote, and the four rules it drove.

### 5.193 Both candidates travel, or the slot goes empty

"When coverage is selected the Steps should be there, always." The V4/V5 phone
row is built by moving cards into `#mV4Row`, and it moved one left card:

    v4Take(q('#mBento .hiCov'), row);

`querySelector` takes the first `.hiCov` in the markup, and the report card
wears `.hiCov` **on purpose** -- that is how every rule about the slot (b3
hides it, b5 orders it, emBio blanks it) lands on whichever card is in it. So
the row always took the report and left the real Coverage card behind in
`#mBento`, where it is out of view. Choose Coverage and the slot emptied: the
report had gone and coverage had never arrived, leaving Steps on its own.

Both candidates travel now and the `leftRep` class picks between them in the
row, exactly as it does everywhere else:

    document.querySelectorAll('#mBento .hiCov').forEach(c => v4Take(c, row));

  m16 m17 m19 m20  report -> [REP STEPS]   coverage -> [COV STEPS]
  m10 m18 m21      the desk was already right, and still is

### 5.194 One grey, from the top of the screen down

"Top hour battery bar no bg. Keep grey bg from hero header." The hour and the
battery sat on a strip of `#0d0d0c` while the header under them was
`rgb(18 18 18)` -- close enough to look like a mistake and far enough to see.
The strip cannot simply have no background: it is absolute, so the hero would
run up behind the time. It had to paint the header's ground rather than a
colour of its own, so that ground is a token now, declared where the phone
declares it:

    body.v5 #phone       --headBg:#000       (light: #ececea)
    body.v6 #phone       --headBg:rgb(var(--v5head, 18 18 18))
    body.v5 .mHead       background:var(--headBg)
    .mstatus::before     background:var(--headBg)

"Remove rounded bg on the Title and share icon." The title is a header, not a
pill. It lives inside `.mHead`, which already carries that grey and is the
thing that sticks -- the pill was a plate on a plate. Flat, full-bleed and
static now, with the share button an icon on that surface rather than a disc
on it. Scoped to `body.v8 #phone`, so `#phone2`'s pill on m6 is untouched.

  m20 colour  strip rgb(18,18,18) = header;  m20 light  rgb(236,236,234) = header
  m16 colour  strip rgb(0,0,0)    = header;  title bg none, radius 0, shadow none

### 5.195 The figure's size, and one delta from it

"Use the font size by 4px on the title." Read as *up* 4px: the title is words
where Steps is a number, and words set at a number's size read smaller than
the number, so matching them measured level rather than looked level.

Rather than typing three new sizes, the figure's size became a token at the
three scopes that already set it, and the title is that plus four:

    .hiCard                --fig:22px
    .dash .hiCard          --fig:24px
    body.v2 #phone .hiCard --fig:18px
    .hiRepTitle.big        font-size:calc(var(--fig) + 4px)

Each title selector carries `.big` so it outranks the `.big` rule at its own
scope -- `body.v2 #phone .hiCard .big` is an id and three classes, and a plain
`.hiRepTitle` loses to it.

  phone 18 -> 22   desk 24 -> 28   every other figure unmoved

At 22px "Pathology test" no longer fitted the phone card's 127px of content
width and took two lines where 18px fitted on one. That was the cost, and it
was not worth it: **reverted** -- the title is `.big` and nothing else, the
same size as 2,568 on every surface. What the token bought is still worth
keeping, though: the figure's size is named once per surface now, so the two
cards in that row cannot drift apart whoever changes what.

### 5.196 Expanded Report

A tweak for the filter's shape. Off, the records live behind a select beside
the search. On, they are the first row -- a carousel of cards, All first and
six reports after it -- and the second row is the chips with the search at
their right end.

**A card is the choice, so there is no cross.** Picking another card is how you
undo this one, and All is a card like the rest rather than a cleared state.
That is the whole reason the select needed a cross and this does not.

**One selection, one function.** `choose()` moved out of the record menu's
block in `bioFilter` and now sits in the factory's own scope: the menu, the
carousel and the list all call it, so no control can say one thing while the
list shows another. It updates whichever of the two exist -- `rec.listEl` and
`cards` are both optional -- recounts the chips and runs the same 380ms beat a
chip and a keystroke run. The carousel is built from `RECS`, the same table
the menu reads.

**Six reports.** `RECS` gained a sixth (Baseline panel, 18 Jun 2025, 38
readings; the table is in date order, which `assignRecords` depends on -- a
reading shows the date of the first record it appears in). `r2` was renamed
from *Pathology test* to *Lipid panel*: two cards reading the same thing side
by side in a carousel looks like a bug, where two rows in a dated menu did not.

**The search moves.** It is a child of the row it shares with the select and
has to become a child of the row the chips are in, which CSS cannot do. So it
moves, and a comment node holds its seat -- the same trick `layoutV4` uses,
and for the same reason: a remembered sibling can be somewhere else by the
time it is handed back, a placeholder cannot. In the chips' row it is shaped
like a chip: fully rounded, 44px, the chips' own height.

Two gates needed saying outright:

- `body:not(.expRep) .rcCar{display:none !important}`. The desk's carousel
  wears `.v2Only` for its b2 gate, and `body.b2 .dash .v2Only{display:flex}` is
  a class deeper than a plain `.rcCar` rule -- so with the tweak off, the row
  showed on every b2 page.
- `body.expRep .dash .rcCar{display:none}` with a `.b2` rule over it. The first
  desktop page filters by chips alone, with no record select and no search, so
  a carousel of records is a control that page's design does not have.

The cards carry 19px/24px -- 8px more than they opened with -- and sit 12px
apart rather than 8px. A card holding two lines of different weight needs the
room to read as a card rather than as a label with a border round it, and at
8px the row read as one strip that happened to have seams in it.

  24 pages with the tweak on, no script errors; 7 cards everywhere the row
  appears, search 44px and to the right of the chips on all 13 surfaces that
  carry one; picking a card narrows the list to that record and the chips
  recount to it (r2: 110 -> 32)

### 5.197 A pinned bar that stays pinned

"On a fixed filter state, when I click on a filter the screen jumps from fixed
to fixed again." The desk's, and only the desk's: the phone has held its bar
through the beat since the pinned-bar work, and the desk was given the sticky
block without the two things that make holding it possible.

The skeleton is a fraction of the list's height. Swapping it in collapsed the
page's scrollHeight, the browser clamped scrollTop to what was left, the block
fell out of its pinned position and snapped back when the list returned:

  m10, chip tap at scrollTop 1400
  block top  0 -> 281 -> 281 -> 281 -> 0    scrollTop 1400 -> 273 -> 1400

So the skeleton is held at the height the list had, or a screenful under the
block, whichever is more -- nothing shortens, nothing is clamped, nothing
moves. And the results keep that same screenful afterwards, because a record
holding two readings leaves less page than there is scroll and the block would
slide back down when the shorter list arrived. Filtering to a short list is
still adjusting the filter.

  chip, and cards r5 (56 readings), r3 (2) and All: block top 0 throughout,
  all four, normal and Expanded Report

### 5.198 The gap was an empty row still charging rent

"Reduce gap by 32px." 56 of the 68px between the carousel and the chips came
from the row the select and the search used to share: `display:none` never
applied, because the desk's row wears `.v2Only` and `body.b2 .dash .v2Only` is
three classes deep -- the same trap the carousel's own gate fell into two
notes ago. Matched with `.b2` it wins on specificity rather than on force, and
what was left was an honest 12px, so the carousel states the rest: 36px.

### 5.199 The strip is not the header

"Remove top bg, the hero header should be below the hour and battery bar."
V5 lifted the status strip out of the flow as an overlay, which is what made
it need a plate: something had to hold that strip while the hero ran up behind
the clock. Put the strip back in the flow and the header begins below it, so
nothing can pass beneath the time and there is nothing for a plate to do.

The two grounds are then two grounds, not one, and are declared apart -- the
strip shows the phone's own, the header its `--headBg`:

    body.v5 #phone        --headBg:#000   background:#111
    body.light.v5 #phone  --headBg:#ececea  background:#fff
    body.v6 #phone        --headBg:rgb(var(--v5head))  background:#000

Light out-specifies the v6 rule, which is why it does not repeat there.

`statusH()` already returned 0 for a strip in the flow, so `--msTop` went to 0
on its own and the bar now pins at the strip's bottom edge with nothing between
them:

  m20  scrollTop 680 gap 38 -> 700 gap 18 -> 720 stuck, bar top 44,
       0px between the bar and the strip above it

### 5.200 Two grounds, both read rather than named

"No black strip" and "fixed bar should be black bg, not dark grey" are the same
correction twice, in opposite directions, and both are the same mistake: a
surface painting a colour of its own instead of the one it belongs to.

The status strip belongs to the header, so it shows `--headBg` -- one grey from
the top of the screen through the title, with the header still beginning below
the hour and the battery. The filter bar belongs to the list, so it shows the
list's ground, which is a token now for the same reason the page's is:

    body.v5 #phone .mBody   --bodyBg:#111   --bodyBg0:rgba(17,17,17,0)
    body.light.v5 .mBody    --bodyBg:#fff
    body.v6 #phone .mBody   --bodyBg:#000
    .msWrap, .msWrap::after read var(--bodyBg, <the theme's old constant>)

The bar lives inside `.mBody`, so it inherits. Each theme keeps its old
constant as the fallback, for the pages that declare no ground at all.

  m20 bar rgb(0,0,0) = body;  m16 rgb(17,17,17) = body;  light rgb(255,255,255)
  m11, which declares no --bodyBg, keeps rgb(13,13,12) as before

`body.light.v5 #phone` had to restate `background:var(--headBg)` rather than
just set the token, because `body.light.v4 #phone` sets a background of its own
and is a class deeper.

### 5.201 The fade starts inside the bar

"The gradient should start in the middle of the height of the chips row, then
blend outside the sticky fixed bar by 24px." Which means the bar's own ground
can no longer run solid to its bottom edge -- it has to stop where the fade
begins, or the fade is painting over a colour identical to itself.

So the background is a gradient that goes transparent at
`calc(100% - var(--msFadeUp))`, and the `::after` starts at that same point and
runs `--msFadeUp + 24px`. It carries `z-index:-1`, which in the painting order
puts it above the element's own background and below its in-flow content: the
lower half of a chip sits over fading ground rather than under a wash.

`--msFadeUp` is measured, not typed -- half the chips row, set beside `--msTop`
-- so it follows the row whatever ends up in it.

  m20 stuck: --msFadeUp 34px of a 68px chips row; ::after top 102px of a 136px
  bar, height 58px, z-index -1; the fade begins at 228, the chips' own middle

The desk's block is built the same way, from `--dFadeUp`.

### 5.202 The dropdown stands off, and loses its floor

"Dropdown position 4px to the bottom of the Records select. Remove the around
footer bar on the bottom of the dropdown." It was `top:calc(100% - 6px)`,
tucked into the select by six pixels; it is `+4px` now, measured at 4.0. The
chevron under the list is gone: a list that scrolls says so by cutting a row,
not by drawing an arrow beneath it.

### 5.203 The report card swipes

"Add carousel in latest reports, simulate few reports on swipe." The carousel
driver already picks up any `.hiCard` holding two or more `.hiSlide`s, with its
dots and its arrows -- so the card needed slides, not a mechanism.

They are built from `RECS`, which meant moving that table above its first
consumer: the driver runs long before the biomarker layer does, and a const in
the temporal dead zone throws rather than reads. `fillLatestReport` is gone --
the builder writes every slide's title, date and count, so there is still one
source for what the reports are.

Four slides, the dot count its neighbours carry; `REP_SLIDES` is the only
number to change. The first slide keeps the eyebrow *Latest report* and the
rest read *Report*, because only one of them is the latest.

And the pill gets its 20px bottom margin back. It was dropped because "the
other cards keep that margin for the dot row under them, and this card has
nothing below" -- which was true, and stopped being true the moment the card
became a carousel.

  m20 and m10: 4 slides, 4 dots, 2 arrows, first slide the latest;
  tapping the third dot shows Other Report on both

### 5.204 The halo had nothing left to veil

"The halo you overlap the top bar with battery and hour should blend together.
Don't want to see a separator bg." Then, plainly: "remove the blur effect on
scroll here."

A frosted band sat over the top 84px of the phone -- blur only, masked out
toward its foot, arriving with the scroll (`--topFog` ramped over the first
48px and held at 1). It was there to veil whatever was passing behind the hour
and the battery while the status strip was an overlay.

The strip has been back in the flow since 5.199, and the header begins below
it, so nothing passes there at all. What the band did instead was blur the top
of the header and stop, which is the separator that was being reported: an edge
the strip did not have and the header did.

Gone, with the property it ran on.

  m20 at scrollTop 0 / 30 / 120 / 400: the strip and the header report the same
  colour at every step -- rgb(18,18,18) down to rgb(0,0,0) as --v5head runs --
  and there is no blur over either

### 5.205 The plate overlapped the wrong way

"Fix the 1px gap!!" -- a hairline of list between the status strip and the
pinned bar. The bar's plate exists for exactly this, and it had stopped
reaching: with `--msTop` at 0 (the strip is in the flow now) its geometry
resolved to `top:0; height:1px`, which is a pixel *inside* the bar rather than
above it. It now starts a pixel higher and is a pixel taller, so it always
overlaps into whatever is above rather than meeting it along an edge -- the
same reason the two plates were made to overlap in 5.180.

  m20 at scrollTop 760 / 900 / 1400 / 2200: strip bottom 126.00 = bar top
  126.00, and no row between them carries anything brighter than the ground

Headless layout lands those two on the same whole pixel, so I could not
reproduce the sliver here; the plate is belt and braces either way.

### 5.206 The chips stand over the list

"Chip bg blur 32px. Bleed more by 16px the gradient black on the bg."

Since 5.201 the ground stops halfway up the chips row, so the lower half of
every chip has live content behind it rather than a solid plate. A 32px
backdrop blur is what makes that read as a control standing over the list
instead of a pill with text showing through it. Both surfaces.

The fade runs 40px past the bar rather than 24.

"Select and search radius 14px." The only 999px left in the app was the
Expanded Report search, which was made fully rounded when it moved into the
chips row; it is 14px again, matching the select and the search everywhere
else. It keeps the chips' 44px height.

### 5.207 The separator was the hero's own light, cut

"Still this bg separator. The hero bg should blend into this home top bar."

Not a colour mismatch -- the strip and the header had been reading the same
token since 5.200, and measured identical at every scroll position. The step
was the halo. Its circle is 730px across with its centre 151px *above* the
screen, so the brightest band it ever shows is at the very top of the header --
and `.mscroll` clips it at its own top edge, which is the strip's bottom. Bare
ground above the line, eight levels of light below it, hard edge between.

  centre column, at rest: rgb(18,18,18) through the strip, rgb(26,26,25) the
  moment the header starts

So the same circle is drawn once more on the phone itself -- same radius, same
centre, same stops -- behind everything, and moved by whatever moves the real
one: the scroll plus the header's 0.12 parallax, faded by the same amount the
header's content fades. Two halves of one light rather than a light and a copy.

Two things had to be true for it to work:

- **`#phone` has to isolate.** A `z-index:-1` pseudo on an element that is not
  a stacking context paints behind that element's own background, which here
  is opaque -- the light was drawn and then buried.
- **The title's top margin had to stop collapsing out.** `.mHead` sat 8px below
  the scroller's top because `.mtitle`'s 8px margin escaped through it, and in
  that band -- above the header's opaque ground, below the clip -- *both*
  halves painted at once. A bright seam exactly where the two were meant to
  meet invisibly. `display:flow-root` on `#mHeadIn` contains it; the title does
  not move, the header's ground reaches up to the cut.

  step across the cut: 0.3 levels at rest, 1.8 at scrollTop 60, 3.2 at 150,
  0.0 by 320 -- against the 8 it started at

### 5.208 The figure comes down 6px

"Reduce font by 6px", over a crop of the two card titles side by side. One
token, so both come down together and stay level:

    .hiCard                --fig  22 -> 16
    .dash .hiCard          --fig  24 -> 18
    body.v2 #phone .hiCard --fig  18 -> 12

  m10 m18 m21 desk 18px, m11 m16 m17 m19 m20 phone 12px, title = steps on all 8

Worth flagging: on the phone that puts the figure at 12px under a 12.5px meta
line, so the report card's title is now a half-pixel *smaller* than the date
under it and the hierarchy reads flat. Either the meta comes down with it or
the 6px belongs to the desk alone -- both are one number.

### 5.209 Turning the organ by hand

"On the card nav, make a tool to be able to rotate manually the organ."

The cloud's yaw and pitch are already a pair of numbers -- `look.tx` and
`look.ty`, eased into `look.x/y` at 0.04 a frame and turned into the rotation
matrix. What drives them is the pointer, as a parallax: a drift you cannot aim.
So the tool does not add a rotation, it takes that one over. `look.manual` is
the switch; while it is set, the parallax handler returns without writing.

The control is the card's own corner button, 30px on a 9px radius, beside the
expand and the share. Drag it and the organ turns with the drag -- about a full
turn across 260px, and a pitch held to +-0.42 because the cloud is a body and
tipping it past its own shoulders reads as broken rather than as looked at from
above. Release and it stays where it was put.

**A press with no drag is the way back**: it centres the organ and hands the
parallax its job again. The control that takes the view over is the one that
gives it back, so there is no second button for undoing and nothing to explain.

It eases rather than snaps, because `look` is read through the drift's own 0.04
follow -- the organ arrives a beat after the hand, which is what stops a
60-degree flick from looking like a cut.

Written once and mounted into whichever organ cards the page carries
(`#organSlot` and `#mOrgCard`), the way the dock is. `touch-action:none`, or a
drag on it scrolls the page out from under the gesture; the click is swallowed,
because the card under it changes organ on a click and the handle is not that.

  m10 desk and m11 phone: drag turns the cloud and it holds with the pointer
  moved away; a press returns it face-on

"Where is the rotate tool?" -- on the wrong organ. It went to `#organSlot` and
`#mOrgCard`, which are the organ *cards*; on V4 and up the organ is the header
itself (`#mHeroOrgan`) and has no card to put a corner on. So the page most
likely to be open -- the phone's Overview -- carried the tool only on the small
organ card far down the list. It hangs at the top right of the hero now, where
a card's corner would be, above the halo and the arc.

  14 of the 24 pages carry an organ and all 14 now show the tool

"Where is the rotation tool?" -- asked again, and fairly. Two things were wrong
with it and neither was where it lived.

**It did not say what it was.** An unlabelled icon, 9% white, in a corner that
already holds other icons. It reads "Rotate" now beside the glyph, at 16% with
full-strength ink, everywhere there is room for a label -- which is everywhere
except the phone's small organ card, whose corner language is a square and
stays one.

**And on the phone there were two of them, stacked.** `#mOrgCard` is moved
*inside* `#mHeroOrgan` by `layoutV4` -- after the handles are mounted, so no
check at mount time can see the nesting -- and both pills landed in the same
corner, one over the other. `.hasRot .hasRot .dcRot{display:none}` settles it:
one handle per organ, the outer host wins, said in CSS because the nesting
comes and goes with the layout.

The hero's handle also moved off the top-right corner, where it sat directly
under the title's share button and read as a second header control rather than
as the organ's own. Below it now, on the organ, clear of the arc and the
legend -- the legend is what it collided with when it was tried on the name
strip.

  one handle on every one of the 14 pages that carry an organ, and only one

### 5.210 The organ is the control

"Scroll up down to zoom inside the organ, and click and hold and move to rotate
it like a 3D model."

**Hold, then move.** Not drag: a drag on the organ already means *next organ*
on the phone and has to go on meaning it. So the gesture that rotates is one
the swipe cannot be mistaken for -- press, wait 180ms, then move. Move before
the timer lands and the hold is cancelled, because that was a swipe. It is also
exactly what was asked for, word for word.

Verified: a quick drag never sets `.rotating`; a 260ms press does, and the
cloud turns with the pointer after it.

**The wheel pushes in and out**, 0.65x to 3x, exponential so a notch is the
same proportion of the view wherever you are in the range rather than a fixed
step that crawls up close and leaps far away. It rides on the zoom the camera
already computes (`setZoom(zoomNow * look.zoom * ...)`), so framing, the organ
swap and the breath all keep working underneath it. The dots grow with it,
because `uOrgK` is `uZoom * r` and that pair is deliberately set in one call.

The wheel is taken (`preventDefault`), so the page does not scroll under the
pointer while you are zooming -- measured: scrollTop 0 before and after two
notches, on both surfaces.

**The handle stays**, because it is the only thing that says any of this is
possible, and pressing it is still the one way back: centre, level, zoom 1.

  m20 hero and m10 desk: wheel zooms without scrolling, quick drag does not
  rotate, a held drag does, and the handle returns all three to square on

### 5.211 Card Nav only

"Rotate only on here", over the version menu with **Card Nav** on it.

Which settles what the handle was for. It had been mounted on every organ card
on every page -- three hosts, a nested-host rule to stop it doubling, a corner
to find in each layout -- and on those pages the organ is a 200px card in a
column of other cards, which is not a thing anyone wants to orbit. On Card Nav
the organ is the whole screen. That is the one worth handling.

So all of it moves to `body.m0` and off everything else:

- the handle is a fixed control at the top right, not a card corner, and its
  own rule is `display:none` with `body.m0 .dcRot{display:flex}` over it
- the hold-drag and the wheel hang off the canvas and read the body class at
  the moment of the gesture, because setMode rewrites that class whole
- `.hasRot`, the per-card positioning and the nested-host rule are all gone
  with the cards they were for

`setMode` now fires an `everlab:mode` event and the view centres on it: a
rotation held into a layout with no way to undo it is a stuck organ.

  m0 shows the handle; m1 m5 m10 m11 m16 m20 m21 do not. On m0 the wheel zooms,
  a held drag turns the lungs, and the handle puts all three back. All 25 pages
  clean.

### 5.212 Drag it, and a cage to read it by

"Simple rotate on the organ directly when I drag. An outlined sphere visual that
indicates what face I'm looking at while rotating. Remove the rotate button, no
need if I can do it directly on the organ."

**The hold is gone.** It was there because a drag on the organ meant *next
organ* on the phone -- and the feature is Card Nav only now, where the canvas
has no swipe to protect. So a drag is a drag: press and move, and it turns from
the first pixel. Measured: `.rotating` is set and the sphere is at full opacity
20px into the gesture.

**The button is gone**, which takes the press-to-centre with it. Double-click on
the organ is the way back now -- centre, level, zoom 1 -- and so is changing
page.

**The sphere** is a wireframe cage around the organ: the silhouette, the equator
and two meridians, with a mark on the front pole. It is built from the SAME
matrix the shader is handed, column for column, from `look.x`/`look.y` rather
than the targets -- so it eases with the cloud instead of arriving ahead of it,
and the two cannot disagree about which way the thing is facing.

Each great circle is sampled rather than solved: 48 points projected and joined,
which is exact for any angle and costs nothing at this size. A ring whose points
are more than half behind the sphere is drawn at a third of the ink, so the near
half of the cage reads in front of the far half; the pole mark is filled while
that pole faces you and hollow once it has gone round the back. That is the
answer to "what face am I looking at" in one glance.

It shows during the drag and holds for 520ms after, so the last turn can be read
rather than vanishing with the hand. `requestAnimationFrame` only while it is up.

  m0: button absent, globe display:block at opacity 0 at rest, 1 on the first
  move, 0.49 mid-fade after release; three rings drawn, one front two back at
  that angle. All 25 pages clean.

### 5.213 V2: what the page is a list of

"Create a tweak V2 toggle. When on, add a tab above the hero header,
Biomarkers / Report. Tab will change the whole data listed on the page."

A segmented control between the title and the hero. **Above the hero, not
below it**, because the hero belongs to both tabs -- it is the same body either
way, and what changes underneath it is which set of things is being listed.

The Report tab lists `RECS`, the same table the record select, the record
carousel and the report card all read, so the four cannot disagree about which
reports exist or what they carried. Rows wear the list's own language: title,
`category | date`, and the reading count in the badge the record menu uses.

**The filter goes with the list.** A record select and five range chips have
nothing to say about a list of records, so `body.repTab` hides the whole bar
along with the biomarker groups, the skeleton and the empty line.

**A report is a way into the readings, not a dead end.** Tapping one narrows
the biomarkers to that record and hands the page back to the Biomarkers tab. It
goes through the same `choose()` the select and the carousel go through --
which is why `bioFilter` now returns it -- so the record is chosen once and
every control showing it agrees.

Both states are body classes, because setMode rewrites `body.className` whole
and anything toggled onto an element is dropped at the next page change. And
turning the tweak off clears `repTab` with it: the page cannot be left listing
reports with no tab to get back from.

  m20: tabs absent with the tweak off; on, the list is still 110 readings;
  Report shows 6 rows with the bar and the groups gone; tapping Lipid panel
  returns to Biomarkers at 32 rows with the select reading "Lipid panel";
  switching the tweak off from the Report tab lands back on Biomarkers.
  All 25 pages clean.

### 5.214 The vertical axis was a tilt, not a rotation

"Should be able to rotate vertically as well." It could -- by 17 degrees, at
half the speed of the horizontal. Which is a parallax tilt wearing a rotation's
clothes, and not what a model on a turntable does.

Two numbers were wrong, and both because they were typed rather than derived.
The engine reads yaw as `look.x * 1.05` and pitch as `-look.y * 0.7`, so a pixel
of travel has to be divided by a *different* number on each axis to turn the
organ at the same rate in both -- otherwise a diagonal drag is two speeds. The
rate is now stated once and each axis converts into its own units:

    RAD_PER_PX = 1.05 / 260        about 0.23 degrees a pixel
    YAW_PX     = 1 / 260
    PITCH_PX   = RAD_PER_PX / 0.7  (1/173, because pitch's scale is smaller)

And the clamp is a quarter turn rather than 0.42 of nothing in particular:
`PITCH_MAX = (PI/2) / 0.7`. Past a quarter turn the model is upside down and
the yaw axis runs backwards, which reads as the control breaking rather than as
the organ turning -- and every face is reachable without going there, because
the yaw is free.

  drag down: the sphere's front pole climbs 0 -> -39.7 -> -84.6 and stops at
  -86, which is the rim's own radius -- exactly a quarter turn, and it holds
  there however much further the hand goes

### 5.215 The Report tab carries reports in the hero

"Report table will change the carousel, will report inside the carousel. Below
no mini card. Just the list of all records captured."

The hero's carousel cannot carry them. It IS the organ carousel -- the cloud
morphs to whatever it lands on -- so the reports get the same two strips
instead, built from `RECS` and hung on the same geometry: the figure at
`bottom:83px` at 64/64/-1, the names at `bottom:38px` under the same edge mask.
The cloud stays put: it is the body, and these are the body's reports.

    figure   the reading count, with "biomarkers | date" under it
    strip    the report's title, neighbours peeking at 34% and blurred

The figure travels the hero's whole width so only one is ever legible; the
names travel 62% of it, so the neighbours crop out of the mask at either side,
which is the strip's own way of saying there are more. Tap a neighbour or swipe
the hero.

**No mini cards below**, and the list of all records directly under it.

**The swipe needed `stopPropagation`, and that was the whole bug.** The hero
carries the organ carousel's own drag, and that one takes the pointer capture
as soon as it sees 7px of sideways travel -- so the report swipe got exactly
one `pointermove` and the organ carousel owned the rest of the gesture. The
trace is unambiguous:

    before   pointermove@720  pointerdown@720  pointermove@706
    after    pointerdown@720  then all eight moves  then pointerup@608

Worth recording how that was found, because two plausible culprits were wrong
first: pointer capture on my own element, and `preventDefault`. Removing both
changed nothing. What settled it was driving the same gesture synthetically --
which worked -- so the handlers were right and the input path was being stolen,
which pointed at an ancestor rather than at the code.

  m20: Report shows the report strips, no organ strips, no mini row, 6 rows
  listed; a swipe moves the hero to Lipid panel / 32; Biomarkers brings the
  organ strips and the mini row back. All 25 pages clean.

### 5.216 The hero's reports become cards

"For report inside the hero header, use a card carousel to list all report. Can
be a imgs, a video. We need the name of the report and" -- the message ends
there, but the reference frame says the rest: a cover, a date chip on it, and
the name with whoever signed it.

So the strips from 5.215 are gone and the hero is a card carousel. Each card is
a cover, `12 Jul 2025`-style chip top left, a play badge where the report is
film rather than a still, and a foot of avatar, name and byline.

**A real scroller, not a hand-written swipe.** The last version had to fight
the organ carousel for the pointer and needed `stopPropagation` to win; a
scroller with `scroll-snap-type:x mandatory` cannot be stolen that way at all,
and brings momentum, trackpads and the keyboard with it. The dots read the
scroll position -- whichever card is nearest the middle -- rather than being
told by the gesture, so they cannot drift out of step with it. (The
`stopPropagation` stays: the organ carousel still sees the pointer events over
the cards and would swipe organs behind them.)

**Where the covers came from.** There are no assets, and the page inlines
everything it uses, so each cover is a duotone mixed from two colours on the
record plus three soft lights over it -- a highlight, a fill and a floor. Flat
duotone alone reads as a swatch; the lights are what make it read as a
photograph standing in for a photograph.

`by`, `art` and `media` live on the record in `RECS` rather than in a second
table beside it, so a report stays one row wherever it is shown.

The organ's strips, its gauge and the cloud itself stand down on this tab: the
subject is the reports, not the body. And a card is a way in, like a row in the
list below -- tapping one narrows the readings to it and returns to Biomarkers,
through the same `choose()` everything else uses.

  m20: 6 cards, 6 dots, 2 of them film; scrolling to the third card moves the
  dot to index 2; the gauge is display:none and the canvas at opacity 0;
  tapping the second card lands on Biomarkers at 32 rows reading "Lipid panel".
  All 25 pages clean.

### 5.217 Medical records, under the biomarkers' own filter

"Add these under report list, same filtering system as biomarkers one."

The documents behind the reports: grouped by the report they came out of, each
group a header (category, date, source, download) over its rows (name, file
mark, View). Under the report list on the Report tab.

**"The same filtering system" turned out to be one word of new code.**
`bioFilter` already counts from the rows, composes chips with the search and
runs the 380ms beat. The only thing it assumed was what a chip cuts BY: it read
`bioRowSt(row)`, a reading's range. That is now `cfg.rowKey`, defaulting to the
same function, and the records pass `row => row.dataset.c`. One filter, asked a
different question about each list:

    biomarkers   rowKey = bioRowSt          chips: Optimal / Suboptimal / ...
    records      rowKey = row.dataset.c     chips: Pathology / Imaging / ...

Everything else came free -- including the thing worth keeping: the counts are
derived, so All is the sum of the rest by construction rather than by someone
remembering. 11 + 6 + 3 = 20, and 20 is the row count.

  all 20/6 groups; Imaging alone 6/2; Imaging plus "tumour" 1/1 -- the chip and
  the search compose, as they do on the biomarkers; cleared, back to 20/6.
  All 25 pages clean.

Left out on purpose: *Select period* and the date pill beside it. They are a
different filter -- a range over time -- and the brief asked for the
biomarkers' one. A control that does not work is worse than no control on a
page where everything else does.

### 5.218 The carousel did not work because a mouse is not a finger

"Make this carousel work." It did -- under a finger. A scroll-snap scroller
pans for touch and for the wheel, and for nothing else: on a screen, pressing a
card and pulling did nothing at all, which is the whole of the report the
carousel "doesn't work".

So the drag is driven by hand now, and the two halves have to be kept apart:

- snapping is turned **off** for the length of the gesture, because mandatory
  snap fights a `scrollLeft` written every frame, and back **on** at the end
  with a smooth scroll to the nearest card, so a release still lands on one
- a drag must not also open a card. The click arrives after `pointerup`, so the
  fact of having dragged has to outlive the gesture by a frame -- a flag set in
  the release and cleared on the next tick. It had to be set *inside* the
  release rather than in a second listener: at the target, listeners run in
  registration order whatever their capture flag, so the second one read the
  state after the first had already cleared it.

The native behaviour stays underneath: touch, wheel and the keyboard are still
the browser's, and the dots still read the scroll position rather than the
gesture.

  a 220px mouse drag moves scrollLeft 0 -> 246 and the dot 0 -> 1, landing
  snapped; a plain click still opens the card and lands on Biomarkers

"No need that on report tab" -- the plain list of records under the hero is
gone. The cards are that list, and two lists of the same six reports on one
screen is one too many. Its markup, its styles and its builder went with it.

"16px padding bottom below the carousel nav": a 16px margin under the hero on
this tab, so the dots are not sitting on the section below them.

### 5.219 Half a card, and a glide rather than a snap

"Carousel smoother. 50% release should trigger the next or prev slide."

The browser's snap decides where a release lands from momentum, which is why a
slow half-card drag came back to where it started. The rule now is measured:
the card step is the distance between two cards' left edges, and a release that
moved half of that or more commits to the neighbour. Below it, back.

The landing is a 420ms ease-out-cubic written to `scrollLeft` by hand, with
snapping off for the gesture *and* for the glide and restored at the end --
mandatory snap fights a scroll position written every frame, and the fight is
what the jerk was. Writes are batched to one a frame; the pointer can outrun
the compositor, and every extra write is a layout for nothing.

  card step 285 | half 142.5
  42% left  -> dot 0    62% left  -> dot 1    55% left  -> dot 2
  80% right -> dot 1    30% right -> dot 1

"More padding bottom below nav dot +12px": 28px under the hero on this tab. An
A/B at three margins says it lands 1:1 -- 0px gives 4px of overlap into the
section below, 16px gives 12px of clearance, 28px gives 24px.

### 5.220 One dock tab renamed

"Change to insights not biomarkers." The dock's second destination is
**Insights**. The word only appears once, in `MOBILE_NAV`, because the dock is
one asset mounted into every phone that carries it -- the rename is a one-line
change for the same reason the icon is.

### 5.221 The records' filter is the biomarkers' bar

"The filter need to be sticky. Search same behaviour as biomarkers. When scroll
the screen unfocus the search, when search focus trigger keyboard."

The medical records already ran through `bioFilter`; what they did not have was
the *bar*. They do now, and it is the same element: `.msWrap`, with the chips
inside it and the field above them, pulled out to the section's edges so the
plate is the width of the screen.

Three things had to stop being singular:

- **the bar.** `placeBar`, `setPlate` and `setStuck` were written against *the*
  wrapper; they now run over whichever bars are laid out. Only one ever is --
  the biomarkers' bar is hidden on the Report tab and the records' off it --
  and the test is `offsetWidth > 0` rather than a computed `display`, because
  the records' bar is visible in its own right while an ancestor hides it.
- **the field.** The drawn keyboard belonged to `mSearchIn`; it belongs to the
  phone. It types into whichever input inside `#phone` has the focus, so
  raising it from the records' field fills the records' field.
- **the gate.** `body.repTab #phone .msWrap{display:none}` was written when
  there was one `.msWrap` on the phone. It is `:not(.mMedBar)` now, or the
  tab that shows the records hid their own filter.

The field stays open here rather than collapsing to an icon: the biomarkers'
field shares its row with a record select and has to make room for it, and
there is no record select over a list of records.

  bar sticky at offset 0 with the plate on, 35px fade; focus raises the
  keyboard and pins the bar; three keys on the drawn keyboard type "dex" into
  the records' field and cut 20 rows to 2; a reader scroll blurs it

### 5.222 The tabs, at the desk

"On desktop add the v2 Biomarkers / Reports tab same as mobile. Below the h1."

Same two tabs, same state -- `repTab` is a body class, so the desk's copy and
the phone's cannot disagree, and clicking either moves both. The querySelector
that collected the tabs was `#mTabsV2 .v2Tab`; it is `.mTabsV2 .v2Tab` now.

Sized to their words rather than stretched: the phone's control is
`display:flex` across 375px, the desk's is `inline-flex`, because a segmented
control the width of a monitor reads as a toolbar and these are two names.

What the tab changes is the same thing it changes on the phone -- everything
below it. The biomarkers' filter block and list go; a shelf of report cards and
the medical records arrive. The card is the phone's card, written once and
arranged twice: a carousel of 78%-wide cards in the phone's hero, a
`repeat(auto-fill, minmax(232px, 1fr))` grid at the desk, because the desk has
the width and a carousel there would be hiding things for no reason.

Two lists, one table, in both places: `buildMeds` writes its rows into whichever
hosts the page carries, so the phone's records and the desk's are the same
records by construction rather than by agreement. The desk's records get their
own `bioFilter` with the same `rowKey`, and its own pinned block beside
`dFilters` -- `dStick` runs over both now, and only one is ever on the page.

Clicking a report card at the desk narrows the desk's readings to it and hands
the page back to the Biomarkers tab, which the phone already did; the desk was
listening to `everlab:pickRec` nowhere, so it now does.

  desk: tabs inline-flex under the h1; Report hides dFilters and the 110-row
  list, shows 6 cards and 6 record groups / 20 documents; chips 20/11/6/3;
  "dexa" cuts 20 to 2; the block pins at offset 0; a card narrows the desk
  list to 32 rows and lands on Biomarkers

### 5.223 The bento goes with the list it summarised

"When report is selected remove the bento -- Biomarkers, Bio age, Latest
report, steps. Replace by the Reports cards in a carousel."

Right: a biomarker count, a bio age and a steps week are the headline of the
*readings*. On a tab that lists reports they are a summary of something that is
not on the page. The whole `.dgrid` goes, and the reports take the top.

Which made the grid a carousel, and the carousel shared. `heroReports` became
`repCarousel(car, dots, nav, opts)` -- the drag, the half-a-card commit rule
and the 420ms glide are the same code on both surfaces now, and the phone's
measurements are unchanged.

Two things had to be told apart, and the first only showed up once the desk had
real numbers under it:

- **where a card rests.** One card fills the phone's hero, so a card rests in
  the middle of the scroller. The desk shows three and a peek, and a card
  resting in the middle of *that* is unreachable for the first and last cards
  -- with `scroll-snap-align:center`, the desk opened at scrollLeft 0 already
  reading as card **1**, and the arrows walked 1 -> 2 -> back to 1. So the
  alignment is an option: `centre` on the phone, `start` at the desk, and
  `nearestIdx`, `centreOf` and the dot sync all read it.
- **the dots.** With six cards and 3.35 showing, a dot per card marks a
  position that can only ever reach the third: two dots that never light. The
  desk has none. It has arrows instead -- which the phone has no pointer to
  hover -- and the card cut off at the right edge says the rest is there.

  desk: arrows step exactly one card (0 -> 289 -> 0), a 42% drag comes back
  and a 62% drag commits, the arrows reach scrollLeft 757 = max with the last
  card fully visible, and a card still opens its readings

### 5.224 8px more inside the card, 32px less black under the dots

"Add +8px padding on the report cards": the date chip, the play badge and the
foot were all inset 12px from the card's edges; they are 20px now. One change,
both surfaces, because they are the same card.

"Reduce top padding black by 32px": between the carousel's dots and the
*Medical records* heading the phone had 92px of nothing. The 28px under the
hero is the dots' own clearance and was asked for, so the 32px came off the
two below it -- the records section's 8px top padding, and the heading's 26px
top margin, down to 2. The desk sets its own 34px there and is untouched.

  card inset 12 -> 20 on the phone and the desk; dots-to-heading 92 -> 60

### 5.225 V2 on by default, and the switch that read backwards

"The version with the Biomarker tab and Report tab at the top (V2 off
currently) should be V2 ON." The tabs are the page now, so the tweak starts on.

Which turned up a second thing. `segmentise` turns any two-option select into a
switch, and its rule is written down: *the first option is the on position*.
`stV2Tab` and `stExpRep` were both written off-first, so both switches read
`aria-checked` true while their tweak was off. Reordered, with `selected` on
the option that was the default, so V2 now defaults **on** and Expanded Report
still defaults **off** -- and both switches say which.

### 5.226 The dock said Overview on the insights page

"Make this Menu active for this page." The dock is one asset mounted into every
phone that carries it, so its markup can only name one destination, and it named
Overview. `#phone` is the insights screen and `#phone2` is the Overview screen,
and `mountNav` already knows which it is mounting into -- so it marks the one
this screen *is*, rather than the one the markup happens to carry.

### 5.227 The line under the status bar was a typed 109

"Bug line gap?" -- a hairline across the screen at the top.

The hero light is painted twice: once inside the header's organ block, and once
on `#phone::before` so it carries on above the scroller. `--v4haloY` is the
centre in the PHONE's coordinates, so the copy inside the block has to come back
by however far down the phone that block starts -- and that distance was typed:
`calc(var(--v4haloY) - 109px - var(--v4haloR))`.

109 was right when it was written. V2's tabs went in above the hero and made it
**174**. The two copies of the same light were then 65px apart, and where one
stops and the other carries on -- exactly the scroller's top edge -- they
disagreed. That is the line.

It is measured now (`--v4heroTop`, written beside `--heroLift` in the scroll
handler) and re-read a frame after anything that moves the hero, since
`everlab:mode` fires at the top of setMode, before the page is rebuilt.

  the step across the scroller's top edge: 2.8 lum -> 1.0, which is the 8-bit
  quantisation floor of the gradient itself; the two halves now share a centre
  at -151px, measured on both

### 5.228 The report card, after the framework

The card is no longer a photograph with type over it. Following the reference:
a kind with its dot, a dismiss, the report's name, the date and who signed it,
an illustration, and one full-width action.

The illustration is drawn, not fetched -- the page inlines everything it uses,
and two tilted sheets with a coloured band say "a document" faster at 150px than
a photograph of one would. A video is the same sheet with a tinted frame and the
play badge the record rows already carry. Both take their tint from the record's
own colour pair, so six cards stay six things.

Two consequences worth writing down:

- **the card stopped being a `<button>`.** It has a dismiss and an action
  inside it, and a button cannot contain a button. It is a div the click
  delegate already found by class; the CTA and the cross are the real buttons.
- **the card list can change.** Dismissing one means the cards and the dots
  cannot be captured once at build time -- a stale index is a dot marking a
  card that is not there. Both are re-read from the DOM after every change.

### 5.229 Scroll from anywhere, and a ground that moves

"Should be able to scroll up from the entire screen (not only on body card
section)." Two rules said otherwise, both written for the hero carousel's
sideways swipe and both too wide:

- `body.v4 .mHead{touch-action:pan-x}` -- a finger on the hero could only pan
  sideways, so a scroll had to be started below it. `pan-x pan-y` lets the
  browser pick the axis from the gesture, which is what it is for.
- the header's wheel handler called `preventDefault` on every wheel event. It
  now turns away only the sideways ones; a vertical wheel is the page's.

  a wheel over the middle of the hero moves the scroller 0 -> 400

"Fully rounded. On click the active state bg should move left right to the
related active tab." The track and the tabs are pills, and the active ground is
one element that moves rather than two that swap. It is measured off the tab it
lands on -- the phone's two are equal halves, the desk's are as wide as their
words -- so one mechanism serves both. A control that has no width yet (its page
is not on screen) is left alone, and its first placement is made with the
transition off, or the ground would slide in from nowhere the moment the page
arrives.

  phone: 180px wide, 4 -> 188. desk: 111px -> 82px, 4 -> 119.

### 5.230 A card opens a sheet

"Click on a report card open a bottom sheet." Opening a report and going to its
readings were one step; they are two now. The card opens a sheet -- the kind
with its dot, the illustration at 148px, the name, what the report measured, and
its four facts -- and the sheet carries the action the card used to: *See
results* narrows the biomarkers and hands the page back to the Biomarkers tab,
through the same `everlab:pickRec` the select and the carousel go through.

It reuses the organ sheet's chrome: the same wrapper, dim, handle and slide,
because a second bottom sheet that moved differently would read as a second kind
of thing. It is mounted twice -- inside the phone frame, and fixed over the desk,
still a bottom sheet -- and each carousel is handed its own, so nothing has to
guess which surface is on screen.

Two things the shared chrome cost, both found by looking at it:

- **the sheet came up wine-dark.** `.sheet{background:var(--bg)}`, and `--bg`
  belongs to whichever organ page is behind. It has its own raised neutral now.
- **the rules did not apply at all** until the block moved. `.rsSheet` and
  `.sheet` have the same specificity, and `.sheet` was defined 1600 lines later,
  so `top:32%` and the rest kept winning. The report sheet's CSS now sits
  directly after the chrome it is overriding.

"Carousel need to be faster and snappy": the glide was 420ms off a cubic, which
is a pace for a thing being shown. It is 240ms off a quintic -- leaves at once,
arrives without a slide.

### 5.231 Three labels and a title

"For V2 remove this / Tab on the top." The page title row goes when V2 is on and
the tabs take the top of the screen: *Health insights* over a control that
already says Biomarkers or Reports is the page named twice, and the tabs are the
more useful of the two. (The share button lived in that row and went with it.)

"Insights not biomarkers in the menu" -- the desk sidebar's destination, which is
the same rename the dock got in 5.220, in the other navigation.

"Reports with 's'" -- both copies of the tab.

### 5.232 The fade let the list through the bar

"One line gap bug": beside the chips, where no chip covers the ground, a row
passing under the pinned bar showed through it -- half a sparkline and a dashed
range bar, hanging in the bar.

The construction was doing what it was asked to. The ground stops halfway up the
chips row (5.184) and the fade runs from there to 40px past the block -- so at
the block's own bottom edge the fade has run 22 of its 62px and is 65% opaque,
and whatever passes under shows at the other 35%. Under a chip that is invisible;
beside one it is a row cut in half.

The fade now holds flat for the part of its run that is still inside the block
and does its descent below it: a three-stop gradient with the middle stop at
`var(--dFadeUp)` from the top, which is exactly the block's bottom edge. Both
bars, phone and desk, since both are built the same way. The blend still happens
-- it happens where the content it is blending into actually is.

### 5.233 The Reports tab gets a second shape

"Add another version in V2 tweak select: Bento / Carousel (current one). Bento
should have 2 big cards next to each other. First idk yet. Second the list of
reports stacked. Same height as the biomarkers bento header."

A new control, **Reports**, beside V2's own switch: two named shapes, and
neither is the other one turned off, so it stays a select rather than becoming a
toggle -- the same exemption `stLeft` and `stGraph` carry.

- **first card** is the set at a glance: the count, what it is made of, and the
  categories with a bar of their shares. It is the open slot -- "first idk yet"
  -- filled with something honest rather than left blank, and it is one function
  to replace.
- **second card** is the reports stacked: dot, name, date and kind, scrolling
  inside the card, each row opening the same sheet a card does.

"Same height as the biomarkers bento header" is measured, not typed (see 5.227
for what typing it costs): `--dBentoH` is written from `.dgrid`'s own height
whenever that grid is on screen -- which the Reports tab is not, since it hides
it, so the read happens on the way back to Biomarkers and at load. The phone
needs no measurement at all: its bento sits inside `#mHeroOrgan`, which is the
header, so it is the header's height by construction.

  desk: bento 495px = the biomarkers grid's 495, two cards at 472 each = its
  own two columns. phone: hero 410 on both tabs, two cards 181 x 394.

**The whole page went `display:none`.** The wrapper's class was `repBento` and
so is the body's state class -- and `.repBento{display:none}` is a class
selector, which matches the body as happily as anything else. The element is
`.rbWrap` now. A state class and an element class that share a name will find
each other eventually; the rule is that the body's classes are a namespace of
their own.

### 5.234 Past results: one message, two dresses, one destination

"Create an additional page where we show a modal (desktop) and bottom sheet
(mobile), that on CTA click it lead the user to the Health insights page
filtered by the latest results."

A page of its own (#m24, *Onboarding* in the menu), and it shows **both**
surfaces at once: the dashboard takes the left of the screen with the modal over
it, the phone takes the right with the sheet up. It wears both class chains --
the desk's and the phone's -- plus a marker that splits the screen. One
consequence of wearing both: the engine still had a canvas to paint on, and a
cloud of particles appeared in the gap between the two surfaces, which is
neither of them. The canvas is off on this page.

**The CTA is the point of it**, and getting it right turned up a real bug.

The hand-off started as `setMode(...)` then a two-rAF dispatch of
`everlab:pickRec`. It worked by hand and failed under the probe -- and the probe
was right: **nothing paints while a screenshot is being taken**, so the frames
never came and the record was silently dropped. A frame is not a scheduler.

Moving to a timeout surfaced the real problem underneath. The record's NAME
landed on the control and the list stayed at all 110 rows, with `#dRecsList`
stuck at `display:none`. The filter's 380ms beat hides the list, shows the
skeleton, and restores both when it lands -- and a page change *during* that
beat means nothing the new page does next is the thing that takes the skeleton
down. The list stays hidden for good. That is not this page's bug; it is every
page's bug, and it was reachable by any mode change made within 380ms of a
filter change:

    pick then navigate +0ms   -> 110 rows, list display:none
    pick then navigate +120ms -> 110 rows, list display:none
    pick then navigate +420ms -> 44 rows,  list block

`bioFilter` now lands a pending beat the moment `everlab:mode` fires -- the set
is already decided by then, only the pause was outstanding. All three orderings
give 44 rows after it. The CTA chooses the record first and changes the page
second, which is also the order that says what happens.

### 5.235 New report

"Add a tweak 'New report'. Add a card dark blue below the select saying New
report available + CTA chevron. On click it will prefilter the select and update
the list below."

A notice under the record select, on both surfaces, in the one colour on this
page that is not the palette -- blue reads as the system speaking rather than as
a reading, which is what "something arrived" is. It carries the latest report's
category and date, and tapping it goes through the same `choose()` the select
performs the long way. Acted on, it goes; turning the tweak off and on again is
a fresh notice.

  both surfaces: hidden off, rgb(22,41,74) below the select on, and a tap
  gives "Pathology test" over 44 rows

### 5.236 V3: the tabs below the hero, and what that costs the carousel

"Create a V3 where the Biomarkers / Reports tab live below the hero bento. The
Carousel inside report is not in the hero anymore in this version but inside the
content with the list of medical records."

V2's tabs sit above the hero because the hero belongs to both of them. V3 puts
them below it, and the consequence follows: the hero is then the *biomarkers'*
header rather than a shared one, so the report carousel cannot live in it. It
moves down to sit with the records it belongs with, and the hero keeps its
organ, its ages and its mini cards on both tabs -- every rule that emptied the
hero on the Reports tab is now `:not(.v3Tab)`.

The V2 control is a three-way now (V2 / V3 / Off), which takes it out of
`segmentise` on its own -- only two-option selects become switches.

Nothing is drawn twice. The two tab strips and the phone's carousel are *moved*,
each leaving a comment node in its seat, because a remembered sibling can be
somewhere else by the time it is handed back -- `layoutV4` moves this hero's
contents around. The same trick Expanded Report uses, for the same reason.

One measurement worth keeping: anchoring the phone's tabs to `#mBento` moved
them twelve pixels and no further, because `#mBento` is a zero-height wrapper.
The hero **is** the bento header on the phone; the anchor is `#mHeroOrgan`.

  phone: tabs 146 -> 548, below the hero's 542 bottom; the carousel's parent
  becomes #mRepCarHost and it goes static. desk: tabs 154 -> 675, below the
  grid. Switching back to V2 puts all three where they were.

### 5.237 V3, settled

Four passes over the same layout, each one the consequence of the last:

- **the hero bento stays on both tabs.** V2 takes the desk's `.dgrid` away on
  the Reports tab, because the tabs sit above it and the bento is the
  biomarkers' summary. V3 keeps it: the tabs sit BELOW it there, so the bento
  is the page's header rather than one tab's content, and a header that came
  and went with the tab under it would make two tabs read as two pages.
- **the phone's tabs go under the two mini cards**, not under the hero: the
  bento is the hero *and* the minis, so the anchor is `#mV4`.
- **which puts them inside the rounded body card**, and the card then carries
  the HEADER's ground rather than the list's -- `rgb(var(--v5head))`, the same
  number the header paints, so the card reads as the page continuing and
  darkens to black on the same curve as the reader scrolls past the header.
  That rule has to sit after the v5/v6 grounds: same specificity, and source
  order was handing it to them.
- **70% wide, centred**, so the control is the middle of the card (75% first,
  then trimmed).

### 5.238 The Onboarding page became two, over the Overview

"Just use the overview backgrounds... but I need two screens: the desktop
screen on one page, the mobile screen on another."

So `#m24` is the desk Overview (m9's chain) with the modal, and `#m25` is the
Overview phone (m6's chain, `#phone2`) with the sheet. The message arrives while
you are looking at your Overview, which is where it would actually arrive.

"When you click Explore your result, it's going to go to the inside page and
scroll down to the sticky filter position." It does -- smoothly, because the
travel is the explanation: what the message is about is the list below, not the
header above it. The scroll is **asked for again until it lands**, because a
single scroll timed to "after the beat" is a guess and the guess was wrong: the
list is hidden while the skeleton is up, so the page is short, and a scroll to a
place the page does not reach yet clamps to the top and stays there. The first
attempt is smooth; a retry sets the position outright, since a smooth scroll is
driven by frames and where frames are not coming, asking politely never arrives.

  phone: lands scrolled with the bar pinned (offset 0, stuck) and 44 rows.
  desk: lands scrolled at deviceScaleFactor 1; under Playwright at dsf 2 the
  scroll does not take, which is a capture artifact rather than a page bug --
  the same code path, same page, same waits, differs only by that flag.

### 5.239 Three tidies

- **Bio graph is gone.** Every read of it was already null-guarded and the
  `#...dots` hash flag sets `CARD_STATE.bioDots` directly, so the row could
  simply leave; its dead exemption in `segmentise` went with it.
- **V2 is Layout**, and its values are named for the three layouts rather than
  for on and off: V1 / V2 / V3.
- **No horizontal scroll in the body.** `.dash` was `overflow:auto`, which is
  both axes, and the organ card's halo and arc reach past the container at
  narrow widths -- 14px of sideways travel at 1280, 36px at 1100, with every
  tweak and none. It is `overflow-y:auto; overflow-x:hidden` now: the page
  scrolls down, never sideways, and anything wide enough to need a horizontal
  scroller carries its own.

### 5.240 The New report notice floats

"Make it floating ghost cta, above the main bottom nav, no border." It was a
card in the filter block; it is a floating pill over the page now, blue at
three-quarter strength over a 24px blur with no outline at all, and on the phone
it sits above the dock -- the one thing it must not cover. Floating means it
belongs to the surface rather than to the block it was written in, so both
copies are moved out of their bars into `#phone` and `.dash`: an absolutely
positioned child of the sticky filter bar would ride the bar rather than the
screen.

  phone: 9px of clearance above the dock, rgba(22,41,74,.72), box-shadow none.
  desk: fixed, 26px off the bottom, 560 wide, and the tap still gives 44 rows.

### 5.241 V3's tabs settle above the two cards, and the group is renamed

"Tab above 2 cards on v3": inside the rounded body card, before the mini-card
row rather than after it. `#mV4` is the first thing in the body card, so the
slot goes before it instead of after.

"Onboarding --> Results received": the menu group.

### 5.242 Sequence 07 is drawn now, not photographed

A 3x3 of the product's own particle organs, each with its age scale and its
reading, on black. The camera starts inside the centre organ at 3.25x, holds a
beat, then pulls back into the grid on an ease-out that keeps drifting -- with a
sliver of rotateX/rotateY, so the grid reads as a plane in space rather than a
wall. The other eight come up one after another as it goes, in a sequence across
the grid (centre, then the cross, then the corners) rather than in reading
order, so it reads as lights being switched on. Hierarchy holds after the
reveal: the ring a tile is in sets both its settled opacity and its view's
alpha, so the centre is the brightest thing in frame, its neighbours softer, the
corners atmospheric. The old plate -- one photograph tiled nine ways -- is gone,
and with it the last inlined image on this page.

Two layout traps, both about a grid whose cells hold more than a square:

- **`1fr` rows have `min-height:auto`**, so a cell whose organ, scale and
  reading came to more than its share pushed its row -- and three pushed rows
  are a grid taller than the frame, with the top and bottom rows hanging off
  it. `minmax(0,1fr)` on both axes, and the cell clips.
- **`cqh` resolves differently for a frame that is not on screen yet**, so the
  grid measured one size and rendered another. It is sized from the frame's own
  height now (`height:80%; aspect-ratio:1`), which is the binding dimension on
  a landscape frame and needs no container at all.

  nine cells, eighteen canvases (each view is a cloud and a flow), the ages
  and labels off PILL; the reveal cycles with the camera at SLOT[6] = 3.83s

### 5.243 The mosaic, on the notes

"Remove hero number on the mosaic. Stay longer on the first organ and zoom more.
Use the dotted particles organ, same as the concept on the grid one."

- the number goes; the organ and its scale carry the tile, and nine big numbers
  at that size was a table rather than a constellation
- 5.4x rather than 3.25x, held to 30% of the slot rather than 11% -- the reveal
  waits with it (its first tile now lands a second in, not 420ms)
- **and the dots had to go the other way from the obvious.** "Dotted like the
  concept" first read as *more* density, so I gave the tiles the engine's own
  count -- and they filled in solid. A tile here is a sixth of the frame, so
  the points have to be FEWER and finer for the organ to read as a speckle:
  a third of the density at dot 0.85, fill 0.3.

### 5.244 V3's reports wear the mini card

"On report mobile v3, use the card style as the Latest report and steps (same
style and height) but put the reports there as a carousel."

222px tall, 22px radius, the same 6% ground -- read off the bento's own pair
rather than typed -- and the reports scroll through that shape two-and-a-peek at
a time. The mini-card row steps aside on this tab: it is the biomarkers' pair,
and this tab is not the biomarkers.

"When switch between the two tabs, light fade transition, super light": a 260ms
fade from 42% on whatever the tab changed, re-triggered by taking the class off
and putting it back a frame later, since an animation does not replay while its
class is already on.

**Known, not fixed:** the dots under this carousel mark from the centre of the
scroller, which is right for one card in the hero and half a card out with two
in view. Making the alignment follow the layout is a bigger change than it
looks, and I would rather not ship it unverified.

### 5.245 The report card becomes the bento's card

"Make sure the reports cards look exactly the same as the Biomarkers cards.
Just need to be in a carousel."

So on this tab the report card IS *Latest report*: the same eyebrow, title, two
lines of detail and pill at the foot. What it is not is the notification card --
no dismiss, no illustration, no dot. The second line needed the biomarker count
beside the date, so `.rcMeta` is three named parts now (date, byline, count) and
each surface shows the two it wants: the hero and the desk keep date and byline,
the mini card takes date and count.

"Make sure the left gap of this section is the same" -- and it was not, by
exactly 13px, for a reason worth writing down: **`scroll-snap-align:start` snaps
to the SCROLLPORT's edge, not the padding edge**, so the row scrolled 13px on
its own and cancelled its own gutter. `scroll-padding-left` tells the snap where
the content starts. (A scroller also keeps its scrollLeft across a layout
change, so the row opened wherever the hero's carousel had been left; v3Layout
resets it.)

"The width of the card needs to be a bit less to see the 3rd card overflow",
then "3rd card should be visible 24px" -- so it is measured rather than eyeballed.
The peek runs past the scroller's 13px right padding, so what it eats is the two
12px gaps plus the peek, less that padding: `calc((100% - 35px) / 2)`.

  the bento's card and the report card both start 18px from the phone's edge;
  card 147 x 222, and the third breaks the right edge

### 5.246 Historical records, and a travel that can be read

"Select should be Historical records / 2011 - 2026." So the sheet's CTA no
longer picks the newest report -- it picks a **range**. `RECS` carries one now:
`all: true` means it passes every row rather than the rows stamped with its id,
because it is not a test that was taken and stamps none; `sub` writes its own
second line, since a range is a pair of years and not a category and a date. It
is excluded from `REPS`, so it gets no report card, and from `assignRecords`,
so it stamps nothing.

"Slower the animation scroll down auto by 2x": `behavior:'smooth'` has a
duration the browser picks and will not be told, so the travel is driven by hand
now -- 1000ms on an ease-in-out, with a reader gesture winning the moment the
position is not where we put it. The retry that checks the landing had to be
moved out to 1280ms: at 420ms it was firing mid-glide and snapping the very
travel it was checking (0 -> 5 -> 67 -> 722 in three samples; now 0 -> 4 -> 61
-> 280 -> 608 -> 707 -> 722).

### 5.248 V2's tabs, 70% and centred

"V2 bug, top bar cut bg. Reduce tab width 70% center."

The two are one thing. V2's tab track ran the full width of the screen with a
flat bottom edge and a 6% fill, so under the status strip it read as a *band*
that stopped -- a cut in the ground rather than a control on it. At 70% and
centred it is a pill on a continuous ground, which is what it always was.

Worth saying plainly: I scanned a column down the phone's top looking for a hard
colour step and did not find one -- every change was under 2 lum, which is the
hero halo's own gradient. The cut was the track's shape, not the ground.

### 5.247 Two more names, and a hero that stopped blinking

"Rename --> Insights, not Biomarkers page": the menu group.

"V3, when switching tab the hero needs to stay intact, at the moment it's
blinking." The crossfade was applied to the header as well as the body. In V2
that is right -- the hero IS what changes. In V3 the hero belongs to both tabs
and does not change with them, so a shared header that blinks on every tap reads
as the page reloading. V3 fades the body only.

### 5.249 The island the filter bar was standing on

"Main nav menu is missing! the island."

It was not missing. It was being stood on. On the Insights phone at rest the
content above the filter bar measures 766 of an 844 screen, and the dock's band
runs 750-835 -- so the record select came to rest exactly across the island,
and what you see is a nav with a dark bar through it. Every version does it:
V1 762, V2 766, V3 756.

Four probes said the dock was `display:block` at top 778 and screenshotted it
rendering, which is how I spent a turn looking in the wrong place. A screenshot
of the *foot* rather than of the element settled it in one frame. Measuring the
thing you were asked about proves it exists; it does not prove it is legible.

The fix reserves the band the dock takes -- `--navH + --navLift + 8` under the
pair -- so at rest the bar is below the fold and the island has the foot to
itself. Biomarkers only: the Reports tab drops the pair, so its own block starts
at 568 and clears the dock unaided; the reserve there would only push "Medical
records" into the band it exists to keep clear.

The cost is ~93px of black you scroll past once, between the pair and the bar.
That is the dock's own room, which is what the gap is.

Not the scrim: `--navScrim` at 60% left the select plainly readable under the
island. The scrim fades a ground; the thing in the way was a control.

### 5.250 View results, and what a tap does next

"View results --> CTA instead of chevron." A chevron makes the reader guess
where the card goes. The pill says it.

"When click on the blue floating: the card should disappear fade out and the
screen should be positioned with the fixed filter group at the top."

Both halves were already built, just not joined. `.nrCard.done` was
`display:none !important` -- gone on the frame of the tap, which reads as the
tap having broken something; it is now an opacity/translate fade with
`pointer-events:none`, and the card stays in the layout at nothing, which costs
nothing where it is the only absolutely positioned thing on the surface.

The travel is the one the Past-results CTA already drives. It was written
inside that handler, so it came out as `reachFilter(desk, wait)` -- the same
retry loop, the same hand-driven glide, the same 1280ms first check that stops
it snapping the travel it is checking. The card passes a shorter wait (80ms):
the reader is already on the page, so there is no rebuild to wait out, only the
filter's own beat.

Measured: opacity 1 → .65 → .15 → 0 over ~300ms, and the scroller lands with
the bar's gap at 0 on both surfaces.

### 5.251 The tabs were being faded while you used them

"Weird transition on the bg of tab item, need smoother. It feels like clipping."

`#mTabsV2` lives inside `#mHeadIn`, and `#mHeadIn` was one of the two elements
carrying the tab crossfade. So every switch dipped the control itself to 42% and
back over 260ms while its thumb slid 340ms -- the ground under the active tab
went dark mid-travel, which is exactly what clipping looks like.

The fade wants the hero, not the head: `['mBody', 'mHeroOrgan']`. Sampled
through a switch, the control now holds opacity 1 for all 43 frames and the
thumb travels 589 → 722 on its ease-out. The label's colour went from .18s to
the thumb's own .34s curve, so it no longer arrives before the ground it is on.

V3 is unchanged -- it fades the body only, because its hero belongs to both
tabs (5.247).

### 5.252 undefined biomarkers

The Latest report card builds its slides from `RECS.filter(r => r.id !== 'all')`.
Historical records (5.246) is a *span*, not a document: no date, no reading
count. So the first slide read "undefined / undefined biomarkers". Range records
are now excluded by `!r.all` as well, and the card opens on Pathology test,
13 Aug 2026, 44 biomarkers.

### 5.253 One piece of news, said once

"When come from the bottom sheet trigger, when we land on the biomarkers screen
the blur card floating shouldn't be there."

Right: the sheet has just told the reader what was found and they asked to see
it. Landing on a floating card announcing a report is the page repeating itself,
over the list it sent them to. The CTA marks the notice acted-on -- the state
its own tap leaves it in -- before it navigates. Nothing on the Results-received
surfaces shows the card (measured on m24, m25, m9 and m6: `vis:false` on both
copies), so there is no fade to see on the way out.

Scoped to that CTA rather than to `everlab:pickRec`. Four other things dispatch
that event -- a report card, a sheet, a record row -- and dismissing the notice
whenever any report is opened is a bigger claim than was asked for.

### 5.254 110, not 0

Landing there showed the bug next to it: chips reading **0 All, 0 Optimal,
0 Suboptimal** over a full list. `countChips` tallies rows whose `data-r`
carries the chosen record, and Historical records is a range -- no row is
stamped with it. `applyFilter` has known that since 5.246 (`recSet === 'all' ||
recAll || ...`); the tally never got the clause. Two filters, one of them
answering a question the other had stopped asking.

Now 110 / 68 / 20 on the same screen.

### 5.255 A control must not dim while it is being used

"The tab is clipping when the tab switch, should be smooth. Don't reload the
tab group on item change."

5.251 took the phone's V2 tabs out of the fade and I reported it fixed. It was,
for one of three controls. The desk's tabs live in `<main>` with everything the
tab changes, and V3's live in the body card with everything the tab changes --
both still dipped to .42 and climbed back on every switch. Measured, not read:
`dTabsV2` went `.42 → .448 → .665 → .853 → .948 → 1` while its thumb was still
sliding. A ground that goes dark under a moving thumb is exactly what clipping
looks like.

Three containers, one move: the container hands the fade to its children and
the things that belong to *both* tabs keep out of it.

    .dash main.tabSwap > *        { animation:tabSwap .26s ease; }
    .dash main.tabSwap > h1,
    .dash main.tabSwap > .mTabsV2 { animation:none; }

and the same for `.mBody` in V3, excluding `.v3Slot` (the tabs) and `#mV4` (the
hero bento). Opacity multiplies, so a child cannot out-run a fading parent --
the fade has to move down a level, it cannot be opted out of from inside.

"On V3 and V4 only the content BELOW the tab should load new content, not the
hero bento header. It currently looks like it's reloading the whole page." Same
rule, and now measured through a switch: tabs 1, hero 1, content .42 → 1.

One hour lost to `#v3Slot`: it is a *class*, not an id. The exclusion silently
matched nothing and the probe said .42 as before.

### 5.256 32, and the scrim doing the work instead

"Too much gap here. Should be 32."

Fair. 5.249 bought the island's legibility with 93px of black to scroll past,
which is a lot of nothing to ask a reader for. The scrim buys the same thing in
no space at all: the bar comes to rest at 780 of an 844 screen, inside the
dock's band, and at full strength the ground rising behind the island hides it
completely. Tested at .75 and .88 first -- "All records" still legible through
both -- so it is held at 1 on this screen rather than left to the slider. The
slider is a demo of the material; this is the screen the material exists for.

The gap is 32px on both tabs now, and it is a gap again rather than the dock's
room.

Also on the desk: the tab group is centred and 40px under the title. Centred
needs `display:flex; width:fit-content` -- an inline box has no auto margins to
give.

### 5.257 The notice belongs to one tab

"Blue new report should only be visible for the Tab Biomarker." Its whole act
is to prefilter the readings, and it floats over the page rather than in it, so
on Reports it was a card about a list that is not on screen, sitting over the
one that is. `display:none`, not the fade -- this is not the notice being acted
on, it is the notice not belonging here.

### 5.258 V4, and the third noun

"V4: add a tab Insights. Inside this tab show a list of insight cards stacked,
that open drawer or bottom sheet on mobile."

V2 and V3 ask what the page is a list *of* and answer with two nouns, both of
them things the clinic produced: readings, documents. The third is the one the
reader actually came for — what those readings mean. So V4 is V3's shape with
one more destination, and nothing in its CSS re-states V3's layout: `v4Tab`
carries `v3Tab` too.

Stacked, not a carousel. A carousel is for a set you skim; six findings you read
one at a time, in the order the page put them in, is a list.

Each card: the panel it came from, a dot in the same three range colours the
chips and the pills use, the finding in a sentence, and the readings it was
drawn from. That last row is the point — a finding with no marker under it is an
opinion, and naming the readings is what makes it checkable. The sheet carries
them again with their values.

A bottom sheet on the phone and a right-hand drawer on the desk: the same
content, in the shape each surface reads a long thing in. The CTA goes to the
Biomarkers tab, because the readings are the evidence.

Two booleans rather than a string, because every rule on the page is keyed to a
body class and a class is what `setMode` can rewrite and put back. `tabNow()` is
the one place that reads them as one name, and `showTab` still takes the
booleans its two older callers speak in.

A version cannot strand the page on a tab it does not have: leaving V4 from
Insights lands on Biomarkers with the list restored (measured).

And the wine-dark sheet, for the second time in this file: `.sheet{background:
var(--bg)}` belongs to whichever organ page is behind, and `.isSheet` has equal
specificity, so it only wins from *after* the shared chrome. I wrote it beside
the other V4 rules at line 1600 and it came up the colour of the page behind it,
exactly as `.rsSheet` did. Moved below `.rsDesk`. Worth remembering as a rule:
**a sheet's own ground is declared after the sheet chrome, never beside its
feature.**

### 5.259 Two tabs, one starting line

"The report card carousel and the biomarker card should be at the same height
from the tab group."

They were 32px apart and the reason was mine. V3 hides the pair on the Reports
tab, so `#mV4` is an empty block there — but it still carried the 32px foot
5.256 gave it to keep the biomarkers' filter clear of the dock. Mini cards
began 18px under the tabs; the report row began 50px under them. An empty block
keeps its gutter and gives up its foot: `padding:2px 13px 0`. Both 18 now.

It took two goes because the fix tied on specificity with the rule it was
correcting (two ids, three classes each) and lost on source order. Moved to sit
directly after it, which is also where it reads.

"For V4 the tab group should fill the entire width of the screen." 70% fitted
two words and cut Insights in half. V4 takes the width the cards take — the same
13px gutter — so the control lines up with the block under it instead of
floating inside it.

"For V3 and V4 you can reduce the opacity of the mini card." .06 → .035. Those
versions put the pair on the body card's own ground rather than on the page's,
and a 6% fill that read as a card over black reads as a box drawn around
nothing here.

### 5.260 A chosen record is an answer, not a field

"When the select is active, add light grey background and remove the border to
make it more prominent."

Both halves are the same move. An outlined box reads as somewhere to go and
type; filled, it reads as the answer. At rest the select keeps its 1.5px inset
ring (an inset ring rather than a border, because Chromium floors border-width
to whole pixels); chosen, it drops the ring and takes a 10% fill, 14% while its
menu is open. The desk keeps its border and makes it transparent, since that is
what holds the box's 56px. Measured in both themes on both surfaces: fill on,
edge off, height unchanged.

### 5.261 One fill for two tabs

"The biomarker cards and the report cards should have the same background: 6%
white opacity."

Reverting 5.259's third item, and rightly. The pair and the report row are the
same card in two tabs -- one replaces the other on a tap -- so they are the one
place on the page that must agree about their material. Taking the pair to 3.5%
made them two different materials. Both 6%.

### 5.262 The body card arrives at black

"On V3 and V4 the body card should be transparent in the default state, and
when you start to swipe up it should tend to a black background, with a blur
while you scroll. At some point it turns fully black and the whole screen is
black."

The card was painting `rgb(var(--v5head))` -- the header's own grey, from the
earlier "keep the body the same colour as the header". That made it a surface
from the first frame. It is now nothing at rest and black by the time it has
the screen: `rgba(0,0,0,var(--v3BodyK))`, with a blur on the same number, and
`--v3BodyK` runs the smoothstep the header's grey already runs, so the two
arrive at black together.

The blur is switched on by a class rather than left at `blur(0)`. A
backdrop-filter on a full-height element costs frames even when it is doing
nothing, and this page has a WebGL field behind it.

Measured through a scroll: k 0 → .468 → .995 → 1, blur 0 → 9.4 → 19.9 → 20px,
and the card's rounded top still opens 16px above the tab group on both tabs.

### 5.263 The insight card, as a card rather than a page

"A lot of examples of card content for the insights. Keep the content, the
visuals, the graph and the chart. Put the title on the left and the visual on
the right. You can drop the description and the tag below, because you can
click on it and open the full description."

Right, and it is the same argument as the New report notice: a card that says
everything is a card you read instead of press. The lead paragraph and the
marker row went to the sheet, which is where there is room for them. What is
left is the finding in a line and the shape of the reading it came from.

Three shapes, because findings come in three kinds: a **series** that moved
(insulin rising, hs-CRP falling, eGFR flat), a **single reading against its
bands** (ApoB, ALT -- drawn as the same three range pills the biomarker rows
carry, so a finding and a row agree about what the ranges are), and a **place
in a population** (free testosterone, with the marker riding the curve rather
than floating over it, so its height reads as how many people are there).

Each is drawn from the finding's own numbers, so a card cannot show a rise its
readings do not have. `preserveAspectRatio="none"` with
`vector-effect="non-scaling-stroke"`: the box is a share of the card, so its
aspect changes between a 390 phone and a 1080 column, and a scaled stroke would
thin out on the desk.

The eyebrow is now the status in its own colour -- Optimal, To monitor, Out of
range -- because that is the line worth colouring. The panel name went to the
sheet with everything else.

### 5.264 Inline tabs at the desk

"Can you do an inline tab instead of a segmented tab, and add a 16px margin
top? V3, V4. Only for desktop, not mobile -- for mobile keep the segmented tab."

A pill is a control you switch; an underlined row is a place you are. The phone
has two or three words and a thumb to slide between them, which is what a pill
is for. The desk has the width to lay them out as a row with a rule under it,
and a count beside each label says how much is behind it before you press.

The sliding thumb becomes the underline -- same element, same measurement, so
the travel is the one that was already there, at 2px on the rule instead of
40px behind the label.

Counts are read from the lists rather than typed, for the reason every other
figure on the page is: a number beside a tab is a promise about what is behind
it, and one written by hand goes stale the first time a row is added.

Two things the change broke and had to restate: the inline `display:flex` on
`.v2Tab` out-specifies the V4 gate, so V3's desk grew an Insights tab it does
not have; and the older `margin:24px auto` rule sits later in the sheet at the
same specificity, so the 16px never landed until that rule was the one edited.

### 5.265 The desk tabs, second pass

"+24px margin top. Tab regular not bold. Remove badge on biomarkers. Keep
Reports badge but orange 1." And, in the same run, "reduce gap below tab group
by 40px."

40px above, regular weight on every tab (the underline says which one you are
on, and a second signal saying the same thing makes the row look heavier on one
side), and the badge changes meaning: it counts what is NEW, not what is there.
A number on every tab is a table of contents -- the reader can see the list is
long by looking at it -- and one that only appears where something arrived is
the one that makes them press. So orange, on Reports, in the warm the Pathology
dot already uses, and nothing on the others. `TAB_NEW` is the one place it is
written.

The gap under the rule was 86px: 26 from the control, 26 from the filter
block's own lead-in and 34 from the row inside it. That is a page break, not a
gap between a tab and the thing it lists. The row's 34 goes and the control
keeps 20, leaving 46.

Twice in one turn the same trap: a later rule at equal specificity. The 16px
margin-top never landed until I edited `body.v3Tab .dash .dTabsV2` itself
rather than the block I had just written, and the inline `display:flex` on
`.v2Tab` out-specified the V4 gate, so V3's desk grew an Insights tab it does
not have. **On this sheet, check what already matches the selector you are
about to write.**

### 5.266 The hero stops blinking at the desk too

"When the tab changes the hero header bento shouldn't blink/clip. Only the
content below the tab should update."

5.255 excluded `h1` and `.mTabsV2` from the desk's fade, which was right for V2
and useless for V3 and V4: those move the tabs below the hero and *into*
`.v3Slot`, so the exclusion stopped matching them, and `.dgrid` -- the hero
bento they moved under -- was never excluded at all. Measured: tabs .42, grid
.42, content .42, all climbing together. Both are out of it now, and the
measurement reads tabs 1, grid 1, content .42 → 1.

### 5.267 The blur belongs to the gesture

"The blur effect on swipe up V3 V4 should be efficient at the very beginning of
the scroll."

It was riding the fill's curve, which is the header's height -- 500px, so at
40px of scroll the blur was 3% of nothing. The two are different events: the
fill is the header being covered, the blur is the reader lifting the card, and
a card being lifted should go soft in the first centimetre. `--v3BlurK` is its
own number, full within 110px. Measured: at y=40 the fill is .03 and the blur
is already 13px of 22.

### 5.268 One ground, card and contents

"The content on the body card should have the same colour bg, transparent to
black. ALL content."

The card ramped and the blocks inside it did not: the filter bar's plate, the
fades at its edges and the list's ground all read `--bodyBg`, which was still
`#000`. So an opaque rectangle sat on a card that was not there yet -- you
could see the bar's edges over the hero. `--bodyBg` is now the same
`rgba(0,0,0,var(--v3BodyK))` the card paints, redefined on `.mBody` so
everything that reads the token follows without being named. Measured through a
scroll, the bar's gradient and the card's fill carry the same alpha at every
step.

### 5.269 24px out of the pair, and a share that belongs to the hero

"Reduce height of the mini card by 24px, compress the chart steps." 222 → 198,
and the steps chart gives up the height rather than the type -- the visual is
the only part of the tile with slack in it (70 → 48). The report row comes down
with it: same card, next tab (5.261).

"V3 V4: add share button secondary rounded on mobile, top right hero, go away
when swipe up with the hero header." The button already existed -- V3 and V4
hide the title row that carried it, because the tabs name the page. It comes
back on its own at the hero's top right, without the glass pill under it, and
absolute inside the header rather than sticky: it belongs to the hero, so it
lifts and fades with it instead of pinning over the list. Measured at 300px of
scroll: opacity .2 and still rising.

### 5.270 Reports leaves the sidebar, and the three tabs open at one distance

"V3 and V4: remove Reports in the main nav desktop." Right -- those versions
fold reports into the Insights page as a tab, so the sidebar entry is a second
door to the same room. Hidden on `v3Tab`, still there on V1 and V2, which do
not have the tab.

"Add gap +8px" (on the Reports tab) and "reduce gap by 16px" (on Biomarkers).
Taken together they level the three: each block was opening at its own
distance under the rule, because each carries its own lead-in -- the filter
block had 26px of padding on top of the control's own margin, and the report
shelf and the insight list had nothing but the margin. Now 30 and 28.

Done through the control's margin plus one pull on the filter block, not by
adding margins to the blocks: adjacent siblings collapse, so an 8px margin-top
under a 20px margin-bottom is 20px and nothing happens. And the filter block is
pulled up by a negative margin rather than by trimming its padding, because
that padding is the plate above the select when the bar pins.

### 5.271 The insight card, and a figure that was never rescaled

"Insights card +8px padding. Title regular font." 16/18/15 → 24/26/23 on the
phone, 20/22/19 → 28/30/27 at the desk, and the title drops from 500 to 400:
the coloured status above it is already doing the work a bold line would.

"V3 V4 mobile: visual particles scale down .9x." Those versions put the tabs
and the pair under the hero, so the figure shares the screen with more than it
was drawn for. Folded into `v5Shrink`, which is the factor the renderer already
multiplies into the zoom -- both are the same thing to it, how big the body is
in its frame.

It did not land at first, and the reason is worth keeping: `v5Shrink` is only
written by the parallax handler, which runs on scroll. Changing the version
from the tweak bar does not scroll anything, so the figure kept the last
version's size until the reader moved the page. `setMode` has called
`parallaxApply()` for exactly this reason since it was written; the layout
select now does too.

Measuring it took two goes as well. A bounding box over an animated particle
cloud is noise -- V3 and V4, which are the same size by construction, measured
180 and 139. The horizontal standard deviation of the warm pixels is stable:
31.2 → 28.9, which is the 0.9 (the residual is the crop truncating the
distribution).

### 5.272 The desk's report sheet becomes a drawer

"Report → drawer on desktop."

A bottom sheet is a phone gesture: it comes up under your thumb and you push
it back down. On a 1440 screen it was a short letterbox across the middle of a
page with plenty of side, and the insight drawer beside it made the
inconsistency plain. Same geometry as that one -- 460 wide, flush right, full
height -- so the two read as one surface arriving from one place.

The drag-to-dismiss is the phone's gesture and is now bound only there: it
writes `translateY`, which is the axis the drawer uses for nothing and its
close uses for everything. The desk closes on the dim, the cross and Escape.

"Remove the cross top right. Add right gradient fade out." Both on the desk's
report shelf: it is a set you browse, not a stack of notices to clear, and
four crosses over three cards and a peek is four things asking to be dealt
with. The row now ends in a fade at the width of the peek -- a card sliced down
its middle by the column's edge reads as broken, the same card fading out reads
as more to scroll. Same device the chip row already uses.

"+4px gap dot nav and card carousel, V3 V4 mobile": 12 → 16.

### 5.273 The Insights tab gets a top half

"Insights tab active. Title: On going tracking. Replace report card by Sleep
score (no carousel inside). Keep heart rate (remove carousel inside). Add a
title before the list of insights cards: 'What your body tells you'."

So the tab is two halves: what is being watched between tests, and what the
tests found. Both tiles are slides the steps carousel already carries, cloned
out of it and stood still -- on this tab they are the subject, and a subject
does not rotate away while you are reading it. Cloning rather than re-writing
means the chart, the type and the axis labels cannot drift from the ones on
the other tabs.

The page's own pair comes down on this tab (`#mV4Row`), because two pairs one
under the other is the same shelf twice. The desk keeps its bento: that one
carries the organ card as well and is the page's summary rather than this
tab's subject.

One trap: the pair was invisible at first because I gave it `.mbrow2` for the
two-column grid. That class is folded to one column and half hidden from V2
on -- it is the V4-and-earlier pair, not a layout primitive. `.insPair` has its
own grid.

"Make sure it leads to desktop and mobile V2." Verified rather than changed:
m24 → m18 on the desk and m25 → m20 on the phone, both landing in the V2 tab
layout with Historical records chosen and the filter pinned at the top.

### 5.274 The archive that was archiving nothing

"Keep only this desktop and these 2 mobiles, the rest put under one page
'Archives'."

The machinery for this was built a while back and has been dead since 5.247:
it filtered on `v.group === 'Biomarkers page'`, and that group was renamed
**Insights**. Nothing matched, `ARCHIVED` was empty, and all fourteen versions
listed themselves again -- the exact menu the archive exists to prevent. The
group name is a constant now, `ARC_GROUP`, read by both the filter and the
option, so a rename cannot separate them a second time.

`LIVE` drops to Desktop and Mobile. Tablet joins the archive: it is a version
of this design like the rest, not a third current surface. Mobile (viewport)
stays, and is not in `LIVE` because it is an entry rather than a mode --
Mobile wearing the `fullscr` flag.

The group now reads Desktop / Mobile / Mobile (viewport) / Archives, and
nothing about the modes changed: `#m13` still opens Desktop V1, with the
version menu showing Archives and the archive select showing its name.

**A rename is a refactor when a string is doing the joining.** This one sat
broken for twenty-odd notes because nothing fails when a filter matches
nothing -- it just quietly lists everything.

### 5.275 Results, not a report

"New results available. Not new report available."

Right, and it matches the CTA under it: the card says View results and the
page it opens is a filtered set of readings, not a document. A report is the
file; the results are what the reader came for. Both copies of the card, and
the tweak that switches them, now say results.

### 5.276 Seven nights, seven bars

"Can use 7 vertical bar here instead." The sleep tile's caption already said
*Last 7 nights*, and a line between seven nightly scores draws a continuity the
readings do not have -- they are seven separate nights, which is what the steps
chart beside it already says about seven days. Same `.stpBars` and the same day
letters, so the two tiles are one chart with two subjects.

Changed at the source slide rather than in the clone, so the carousel's own
Sleep score slide agrees with the tile. The cost is that Sleep score and Time
asleep now look alike inside that carousel; the alternative was the same metric
drawn two ways in one product, which is worse.

"+8px gap after title" then "less gap by 16px": the titles get 18px under them
on the phone and 24 at the desk, and the run from the tabs to the first title
comes down from 58 to 42 -- the Insights tab drops the pair like the Reports
tab does, and the 32px foot under it is there to keep the biomarkers' filter
clear of the dock, which is not what follows here.

Third time this week: the trim did nothing until its selector carried the same
class count as the rule it was correcting. `body.insTab #phone #mV4` is two
classes short of `body.v5.v8 #phone #mV4`.

### 5.277 One section title

"Keep the same size for the title across all different tabs and sections. Use
the reference as the medical record."

The Insights tab's headings were 15 and 17 against Medical records' 20 and 24,
which reads as two levels of heading where the page has one. They are now one
rule with Medical records in it, rather than a copy of its numbers -- a size
written twice is a size that drifts, and this one already had.

Type and spacing stay separate: the shared rule carries the font, each title
keeps its own margins. Folding `margin:0` into the shared rule silently ate the
18px under the insight headings, because that rule sits later in the sheet than
the one that set them.

### 5.278 The set arrives from the side you moved towards

A screen recording, with "tab should behave like this, effect".

Read it frame by frame at 20fps. The underline does **not** slide -- it jumps
in one frame, and the label's weight with it. What moves is the content: the
incoming panel starts about 14px to the left of its place and travels into it
while fading up from near-nothing, and the outgoing panel fades out where it
stands. Clicking the left-hand tab brings the new set in from the left, so the
travel carries the direction.

That is what our crossfade was missing: two sets that dissolve into each other
read as one set changing its mind, where a set that arrives from the side reads
as the next thing along. `--swapX` is written per switch from the two tabs'
positions in the row, and the keyframes carry it; the easing is the ease-out
the thumb already uses, so both decelerate into place together.

Measured: +14 → 0 going right, -14 → 0 going left, opacity .42 → 1 over ~260ms,
on the phone and the desk. The tabs and the hero stay at 0 throughout in all
three versions -- they are out of the fade (5.266) and so out of the travel.
And no horizontal scroll: `#mScroll` is `overflow-x:hidden`, and its scrollWidth
is the same at rest as mid-swap.

**Getting at the recording.** Chromium here is the open-source build with no
H.264, and Playwright's bundled ffmpeg only muxes what it records. The npm
registry is reachable, so `ffmpeg-static` did it in one line. Worth remembering
the order: try the decoder you have, then the one you can fetch.

**The container had been rebuilt.** The working tree came back on this branch
at `7ebfbdb Add files via upload` -- another session's commit, nothing to do
with this work -- and the scratchpad and node_modules were gone. Everything
here was pushed, so `git reset --hard origin/<branch>` restored it whole;
`7ebfbdb` is on several other branches, so nothing of anyone's was lost.
The lesson is the one that already holds: push every batch.

### 5.279 The tabs come up, and give room below

"Move up Tab (+ content below) by 16px" and "tab margin bottom +8px".

Both on the one control, so both in the one rule: `margin:-14px auto 24px`
(V4's copy keeps its own gutter, `-14px 13px 24px`). The negative top exactly
cancels `.mBody`'s 14px of padding, which is what puts the pill at the card's
own top edge -- the card's rounded top does not move with it, so the header
keeps its overlap and only the contents rise.

Measured on both tabs in both versions: the card's top holds at 436 while the
bar goes 452 → 436, and the gap under it goes 16 → 24. The tabs are nearer the
hero they belong to and further from the set they change, which is the right
way round.

### 5.280 The shelf gets its name

"Add Everlab Report as title of the report carousel."

Written as **Everlab reports** -- sentence case like Medical records beside it,
and plural because the shelf holds six. The brand is Everlab; the message said
Everlan.

It joins the shared section-title rule as a third class rather than borrowing
`.insHead`, whose name is about a different tab. One rule now carries Medical
records, the insight headings and this, so the three cannot drift apart.

Shown only where the shelf is a section of the page: V3 and V4 on the phone,
and every version at the desk. V2 keeps the carousel inside the hero, where a
title would be a second heading over a block that already has one.

The phone's row is a scroller with its 13px gutter inside it, so the title had
to be given that gutter rather than inheriting a padding the host does not
have. Measured: the heading's text, the first card and Medical records all
start at the same x on both surfaces.

### 5.281 The desk's pill was only ever V2's

"Use a normal tab line, V3 V4" -- with a screenshot that turned out to be
neither: it matched V2's tab pixel for pixel (same cards, same share icon,
same spacing), and V2's desk tab has been a segmented pill since it was built.
V3 and V4 already carry the underline from 5.264. Asked which one needed the
change; V2's pill, to the underline.

There was never a reason for the two versions to differ here -- the pill
belonged to no design decision about V2 itself, just to which rule happened to
load first. `body.v2Tab .dash .dTabsV2` and `body.v3Tab .dash .dTabsV2` sat at
equal specificity, so V3/V4 (which always carry `v2Tab` too) silently won on
source order; V2 alone fell through to the pill underneath. One rule now, on
`v2Tab`, so V2, V3 and V4 read the same control. The margin, the underline
colour and the thumb-as-underline all moved with it; the things that were
genuinely V3/V4-only -- the tab row's placement inside the body card, the
filter block's negative offset -- stayed where they were, since V2's page
structure never created that gap to begin with.

Left-aligned under the title now rather than centred, which is what a line of
tabs reads as; a centred line looks unrooted in a way a centred pill does not.
Verified in both themes, on Desktop and every archived Desktop variant, with
the phone's pill (which stays a pill by design, per 5.264) untouched.

### 5.282 The line hugs the label; the rule still runs the row

"Tab shouldn't fill the width." Then, once the full-width hairline itself was
confirmed as wanted: "bottom border yes but not the tab, should be hug the
tab."

Both tabs were 525px wide, half the row each, with 500px of nothing between
"Biomarkers" and "Reports" -- because merging the pill rule into the line rule
at 5.281 dropped `flex:0 0 auto` along the way, so each tab fell back to the
phone pill's `flex:1`, sized to fill half a segmented control it no longer is.

The container keeps its width -- that's what draws the hairline the full row
across -- only the tabs inside it stop stretching to match. Verified: 76px and
81px, 30px apart, on V2, V3 and V4, in the same position the user's screenshot
showed it acted on.

### 5.283 See all, a quiet arrow, a step under the section title, and a badge that already existed

Five small requests landed in one batch; each is its own change.

**"Add See all on the top right that opens a drawer with all of the other
reports."** A right-hand drawer at the desk, a bottom sheet on the phone --
the same two dresses every other drawer on this page wears -- stacked with
every report rather than the three-and-a-peek the shelf shows. A row hands off
to the report's own single sheet rather than repeating it, closing itself
first so the two never show at once. "Put the report with the orange badge
one" landed as a small `New` chip on `REPS[0]`, the same report the shelf's
own tab badge already points at (`TAB_NEW`) -- one flag, read in two places,
so they cannot name two different reports as the new one. There is no report
dated 2020 in `REPS` (the six span Jun 2025 to Aug 2026); I did not invent one
to match the number named, since that would be silently changing the app's
data rather than building the drawer that was asked for -- say the word if a
seventh, older record should exist and I will add it.

Two bugs came out of building it, both older than this feature. `<i class="d">`
was already this page's way of writing an empty coloured dot, and I reused it
for the "New" chip -- except this one holds text, and an `<i>` is italic by
default. And the drawer's own heading and close button were both left to
inherit rather than told what colour to be: `document.body` carries a warm ink
on some pages (V4's organ-tinted ground sets it), and a drawer mounted on
`document.body` -- which every desk drawer on this page is -- picks that up
where nothing more specific overrides it. `.isScroll h3` had the exact same
gap already, unexercised because nobody had opened the insight drawer from a
warm-ground page before; `.rsSheet`/`.isSheet .shClose` had the matching gap
in light theme, where the base close button's near-white icon sits on a sheet
that has gone cream. Fixed all three alongside the new one, since it is the
same missing declaration in each place.

**"The arrow should be smaller, without a border. Use a light gray instead of
black, and fade it out behind the carousel."** Scoped to `.dRepNav`, the report
shelf's own prev/next -- `.hiNav`, the mini-cards' arrows, was already
borderless, backgroundless and small, so applying the same request there would
have been solving a problem that rule does not have. 36px to 30px, the inset
ring gone, the near-black fill replaced with the same translucent light wash
the page's other secondary chips use. The fade is a radial gradient in the
page's own ground, sitting behind the button rather than on the scroller's
mask: the arrow floats over the seam between two cards, and the card's own
edge now softens into that gradient instead of ending under a hard-edged
circle.

**"There's a small line under the hour and the battery."** The same banding
this file already diagnosed and left open, asked a second time. Measured
again to be sure -- the column still steps by under 2 luminance units the
whole way down, still no hard edge -- and rather than hand back the same three
options a second time, took the least invasive of them: a five-percent film of
turbulence noise over `.v4Halo`, in `overlay` blend, which breaks up the 8-bit
steps without moving a single gradient stop. One rule serves both copies of
the halo, since a `display:none` host draws no pseudo-element and costs
nothing on the pages that never turn it on.

**"These two titles should be smaller -- 8px smaller than the H1."** 24px to
18px at the desk (26px h1 minus 8), on the one shared rule Medical records,
Everlab reports and the insight headings all already read from.

---

### 5.284 The bar and the card stay put; only what is inside moves

**"On desktop, the top should be rounded -- a grey bar, then a card below it,
and neither should move when you scroll. The scroll should happen inside the
card, with 16px of safe space above whatever it's showing."** Reference was
another app's own chrome: a bar pinned above a card whose only rounded corners
are the top ones, the gap between the two never closing.

`.dash` was already `position:fixed` with its own `overflow-y:auto` -- it
looked like the scroll container, but it was really just the fixed shell the
sidebar and the page both sat in, and scrolling it meant scrolling the
sidebar's ground along with everything else. Giving the bar and the gap a
fixed home meant moving the actual scrolling one level down, onto something
that isn't `.dash` itself: a new `#dTopBar` (the grey/cream strip) and a new
`#dMain` (the rounded card, `overflow-y:auto`) inside it, with `.dash` now
just the static shell both sit on. `--dBarH`/`--dBarGap` are the one pair of
numbers the bar's height and the card's top both read, so a future resize of
either can't put them out of step.

Two other `<main>`s on this page -- `.dvMain` (Overview) and `.olMain` --
already scroll themselves independently and were never touched; the reference
was this one dashboard, not every page that happens to use `<main>`.

Two bugs, both caught by measuring rather than by eye, since a screenshot of
one near-black rectangle beside another does not show a wrong number:

- `#dMain` was given `left:0;right:0`, matching neither the sidebar's width nor
  `#dTopBar`'s own `left:224px`. Centering `max-width:1160px` inside the FULL
  viewport width, instead of the width to the right of the sidebar, put the
  card's own edge 84px to the left of where the bar starts -- under the
  sidebar rather than beside it. Given `left:224px` (`200px` at the tablet
  width) to match the bar, it centers in the same box the bar already spans.
- The gap between bar and card measured 61px, not the requested 16. `#dMain`
  sits inside `.dash`, whose own fixed `top` is already synced to the page's
  toolbar height in JS; `#dMain`'s `top` is relative to `.dash`'s own edge, so
  adding that same toolbar height a second time (both in the base CSS and in
  the resize handler that re-synced it) double-counted it. `#dMain`'s `top` is
  now just `--dBarH + --dBarGap`, nothing else, and the resize handler no
  longer touches it at all -- it never needed to.

Four places that used to read `.dash`'s own scroll position -- the sticky
filter (`dStick`), the "scroll the filter into view" glide (`reachFilter`),
the record-skeleton height guard, and the sun-follow listener on the organ
hero -- now read `#dMain` instead, since that is where the scrolling actually
happens now. `.dash`'s own two remaining jobs, syncing its `top` to the
toolbar and giving the "new results" notice somewhere to append itself, did
not move, since neither depends on which element scrolls.

---

### 5.285 A trio you can resize between, not a page rebuilt to reflow

**"Make this responsive for desktop, tablet, and mobile -- on the same page,
so people can test on the mobile phone by resizing the screen."** Asked as a
follow-up to the bar-and-card work above, and worth pausing on before
building anything: every other page here is mode-switching, not responsive --
Desktop, Tablet and Mobile are three separate markups (different DOM
families, `.dash` versus `#phone`), picked from a menu, not one layout that
reflows. Asked which of two very different builds this meant -- a real fluid
rewrite of the page's CSS, or wiring the menu's existing three designs to
switch on width instead of on a click -- and the answer was the second, which
is what shipped.

Desktop (18) and Mobile (20) are already the two live entries the menu opens
to by default; Tablet (21) sits in the archive, a variant of the same design
rather than a third current surface (see 5.274, the archive rename). All
three are already built, so the feature is a width check, not new layout: a
`resize` listener that, only while the current mode is one of these three,
measures `innerWidth` and calls the same `setMode` the menu's own dropdown
calls -- under 640px Mobile, under 1024px Tablet, above that Desktop -- then
mirrors the choice back onto the dropdown so it never shows a design other
than the one on screen. Landing on any other page and resizing the window
does nothing, same as before; this is one design's own behaviour, not a
change to how the prototype works.

Mobile's normal dress is a drawn phone -- bezel, rounded shell, fixed to a
height-derived width -- floating in whatever space the browser leaves around
it, which is right for browsing the menu but wrong for testing a breakpoint:
shrinking the window would just shrink the empty space, not the page. The
menu already has an answer for this, "Mobile (viewport)", which is Mobile
wearing a `fullscr` flag that drops the bezel and lets the design fill
whatever frame it's given; the auto-switch reaches for that state rather than
the framed one, so a narrow browser window reads the same as a narrow phone.
`showBar` stays on through all three, for the same reason the viewport entry
keeps it on when picked by hand: it is the only way back to a wider design
without the menu to reopen it from.

---

### 5.286 One surface, not three -- the shell, the arrow, the drawer, the list

**"The top part is fucked up. Follow the screenshot I sent you, only for the
layout style."** Sampling the reference's own pixels (`.dash`'s ground, the
sidebar, the card) rather than eyeballing it settled what the screenshot
actually showed: sidebar and the bar over the card share one exact colour
with no seam between them, and the gap under that bar -- the strip the
rounded card's top corner reveals -- is that *same* colour again, not a
third, darker one. This build had three: `.side` at `#111110`, `.dTopBar` at
`#1c1c1a`, and the gap showing `.dash`'s own `--pageBg`, which is also what
the card itself is drawn in. Three tones reading as three surfaces is what
"fucked up" meant. Fixed by naming the shared one -- `--shellBg` -- and
pointing `.dash`, `.side` and `.dTopBar` at it together, dropping the
border-right and border-bottom that used to mark where one supposedly ended
and the next began. The card keeps its own `--pageBg`, darker still, which is
the whole trick: one ground behind everything, one card floating over it,
never three bars stacked into a wall.

**"The gradient should be vertical, not at an angle. The same on the right
side."** `.dRepNav`'s halo (5.283) was a `radial-gradient` centred on the
30px button -- a soft circle, which over a busy report card reads as an
off-centre smudge rather than an edge easing away. Replaced with a
`linear-gradient` running straight off the shelf's edge, tall enough
(`top/bottom:-45px`) to cover the card's full height, mirrored for `.prev`
and `.next` rather than shared: one rule doesn't turn "fades right" into
"fades left" by itself.

**"25 documents ... the header is fixed."** The drawer (5.283) had only ever
carried the shelf's own six, so its header-stays-put-while-the-list-scrolls
behaviour -- already correct, `.arSheet` is a flex column with `.arTop`
un-shrinking and `.arList` the only thing that scrolls -- had nothing to
prove it against. Nineteen more records, backdated from Apr 2025 to Feb 2021,
inside the span `hist`'s own "2011 to 2026" already promised, so a list long
enough to scroll was one the data already implied rather than padding for
its own sake. Confirmed rather than assumed: the header's `top` in viewport
coordinates read the same before and after scrolling the list 800px.

**"12px padding from the viewport edge ... 24px rounded corners."** `.arDesk
.arSheet` sat flush against the top, right and bottom of the screen, square.
Given the same inset on those three sides (left is the sliding edge, not a
resting one) and a 24px radius on all four corners now that the shape reads
as a floating card rather than a panel bolted to the glass. Its closed
position was `translateX(100%)`, which only clears a flush-right sheet -- with
a 12px gap it left a 12px sliver on screen -- so the slide-out distance became
`100% + 12px`.

---

### 5.287 The bar that was drawing over its own background

5.284 gave the dashboard a bar, a gap, then the card; 5.286 gave the bar and
the sidebar one shared colour. Put together, the bar had nothing left to do:
once `.dash`'s own ground read the same as the bar sitting on it, the bar was
a rectangle drawn over a rectangle already that colour. Confirmed with
`getBoundingClientRect` before touching anything -- the visible gap really
was 68px (52px bar plus 16px gap), not the 16px the bar's own height was
supposed to leave -- then removed the bar element outright (HTML, CSS and the
one `resize()` line that positioned it) rather than shrinking it to nothing,
since a 0-height fixed element some future change re-inflates is worse than
one that was never there. `#dMain`'s `top` is a flat `16px` now, off `.dash`
itself, which already sits at the toolbar's own height -- the bar had been
adding that height a second time, which is the other reason the gap read
large.

Asked which of two things "the edge one" meant when told the space above it
needed 16px more: the drawer, or the dashboard's own h1. It was the h1 --
`#dMain`'s own top padding, `16px 40px 60px`, doubled to `32px 40px 60px` on
both the desk and the tablet, so the heading keeps its distance now that the
corner it used to clear by a 68px run-up is 16px behind it.

**"Make sure the background of the viewport is darker than this."** Once the
bar was gone and `.dash`'s ground was the one colour the whole strip above
the card reads, that same colour was showing somewhere it never used to: the
card is capped at 1160px and centred, and on anything wider than sidebar plus
that, the ground used to be the card's own colour past both of the card's
flanks -- invisible, since the two matched. Pointing `.dash` at the shared
shell colour for 5.286 meant that flank was now visibly paler than the card
sitting in the middle of it, a rail down both sides on any wide desk. Fixed
with a hard-stop gradient rather than a second element -- `linear-gradient(
var(--shellBg) 16px, var(--pageBg) 16px)` -- so the same 16px that ends the
strip above the card also ends the shell everywhere else in `.dash`'s own
ground, and the flanks read as more of the card rather than more of the bar.

---

### 5.288 One fade, not two -- and a darker floor under both of them

**"The left fade-out is wrong. It should be like the right fade-out."** The
report shelf's own fade (`.dRepCar`'s mask, "three and a peek") only ever
ran off the trailing edge -- `mask-image:linear-gradient(to right,#000
calc(100% - 64px),transparent)` -- because the leading edge had nothing
before it to fade at scroll position zero. But 5.283's arrow halo made the
*start* look like it should fade too, and never delivered one: the previous
card's own content stayed crisp right up to the `<` button instead of easing
into the page the way the trailing peek does under `>`. Mirrored the mask --
`transparent, #000 64px, #000 calc(100% - 64px), transparent` -- rather than
making it conditional on scroll position, since a card fading in from a
position you can still scroll back to and one you can still scroll forward
to are the same kind of edge; happens to also mean the first card fades in
very slightly at rest, which reads as the row's own framing rather than as a
mistake.

**Colours, given as exact values rather than "darker":** `--shellBg` (the
sidebar and the strip above the card) to `#181818`, `--pageBg` (the card
itself) to `#0f0f0f`. Both had a second definition that would have kept the
old value regardless of the first -- `body.m2{background:#0d0d0c}`, the
safety net under an overscrolled `.dash` ("give the dashboard pages the
dashboard's own ground, so there is nothing dark left to expose"), and
`body.b5 .dash{--pageBg:#000}`, a full override for the organ-tinted `b5`
family the page actually shown (m18) belongs to. Missing the second would
have meant the numbers were right everywhere except the one page being
looked at.

**"A rounded corner on the left of the black body."** `#dMain`'s
`border-radius` was `20px 20px 0 0` -- both top corners, easing away from
the bar 5.287 removed, and both bottom corners square, since the card met
the sidebar and the browser's own edge with nothing to ease into. The
sidebar is gone from that account now that the card floats the full height
of its left side rather than starting under a bar; bottom-left rounds to
match, bottom-right stays square, since that corner still meets the
browser's own.

**"All drawers on the desktop should have the same behaviour with the
padding around."** `.rsDesk .rsSheet` (the single report) and `.isDesk
.isSheet` (the insight) still had 5.283's original geometry -- flush to the
top, right and bottom, square -- because only the reports drawer had been
asked for the 12px-inset, 24px-radius treatment since. Given both the same
rule verbatim, including the `100% + 12px` slide-out distance the flush
`translateX(100%)` would have left a sliver on screen for.

---

### 5.289 An arrow that goes nowhere shouldn't offer to

5.288's mirrored fade was symmetric on principle -- the start and the end are
"the same kind of edge" -- and that principle turned out to be wrong at the
edges themselves: at rest, on the very first card, the left fade and the
`<` arrow were both saying there was something to scroll back to, when there
wasn't. The same is true in reverse on the last card.

`repCarousel` already tracked scroll position for its dots; added an
`edgeSync` beside it that reads `car.scrollLeft` against `car.scrollWidth -
car.clientWidth` and toggles `.atStart`/`.atEnd` on the shelf itself, run on
every scroll and once before the first paint. Three CSS states off those two
classes -- fade only the far edge, only the near edge, or (both, if a shelf
ever holds too few cards to scroll at all) neither -- replace the one
unconditional mask 5.288 shipped, and the arrow at whichever end is
`opacity:0 !important` over its own hover rule, not just quiet until
hovered.

Also given `#dMain` a 24px radius to match the drawers' own (was 20px, set
before 24 was the number anything on this page used).

---

### 5.290 The rectangle that was always there, just the same colour as the card

**"What the fuck is this shape?"**, about the branching particle cloud under
"Mental age". Traced, not guessed: `PILL`'s own comment says it plainly --
*"The names swapped, at the user's word: the brain organ is 'Brain age' and
the nerve is 'Mental age'."* -- a deliberate relabelling from earlier in this
project, not a bug. Reported that back rather than touching anything, and
asked what to do about it now that it reads as wrong; told to leave it and
wait, so nothing changed here.

**"Remove the black background below the organ and the range."** Not the
organ or the dial's own doing -- `#field`, the one canvas the whole
prototype's organs share, sits (z-index 2) between the organ card's
background (0) and its text (3, 5), so whatever colour the canvas clears to
IS the card's ground for as long as the canvas covers it. `body.b5 .dcard
.organ`'s own background is `rgba(255,255,255,.06)` -- a 6% white wash OVER
`--pageBg`, not `--pageBg` alone -- and the canvas's `lift` clear colour
(the code's own name for this exact card) was `[0.06,0.06,0.06]`, `--pageBg`
un-washed. A rule already carried the reason as a comment -- *"the canvas
clears to the value, not to the wash, so the two drift apart"* -- documented
as an accepted gap, apparently small enough not to chase before; today's
darker `--pageBg` (5.288) didn't cause it, but the fresh colours made it
worth reading the comment as a bug report rather than a shrug. Composited
by hand -- `#0f0f0f` under 6% white is `#1d1d1d` -- and swapped in for the
flat value. The light `lift` colour was already doing this correctly
(`0.9725` is white under a 2.8% black wash, not white on its own), which is
what gave away that the dark one had simply never been.

---

### 5.291 A fixed number where a measured one belonged

The fix above for the invisible left corners used a flat 264px shell strip,
tuned against the one viewport width it was checked at. Re-checked against
the actual geometry and it wasn't a constant at all: `#dMain`'s left edge is
`224px` (or `200px` on the tablet) *plus* whatever `margin:0 auto` adds once
the viewport is wide enough to centre the width-capped card past its
sidebar -- 260px at 1456px wide, 492px at 1920px, a different number again
on the tablet at either width, since its sidebar and cap are both narrower.
264px was only ever going to be right by luck, at the one width it was
built against; anything wider left the curve cutting into flank-matched
`--pageBg` again, the exact bug it was meant to fix.

Measured instead: `resize()` now reads `#dMain`'s real
`getBoundingClientRect().left` and writes it to `--dMainLeft` on `.dash`,
which the shell strip's width reads directly (`calc(var(--dMainLeft) +
40px)`) rather than guessing at. Checked six combinations -- both modes at
900px, 1456px and 1920px -- since the two fixed numbers this replaced had
each looked right at exactly one width apiece.

---

### 5.292 One offset, reported three ways

Three reports in close succession, all the same bug seen from different
angles: a gap above the pinned filter chips that should be the card's own
black; a request to "push the fixed bar up by 32px"; the fixed bar's own
fade gradient reading as gone, with scrolled rows visible through it.

`#dMain`'s top padding went from 16px to 32px in 5.288, for the h1's sake.
`.dFilters` and `.dMedBar` are both `position:sticky;top:0` -- and sticky's
`top` is measured against the scroll container's PADDING edge, not its
border edge, so `top:0` had always meant "stick 32px short of the card's
visible top," painted over by nothing, since neither block carries its own
background there. Below 16px of padding this read as a design choice (a
sliver of breathing room above a pinned bar); at 32px it read as a mistake,
which is what it was pointing at.

It also broke the thing that was supposed to *finish* the bar's own fade:
`dStick()`'s stuck check is `blk.top <= scroller.top + 0.5`, comparing the
sticky block's edge to the scroll container's BORDER edge -- correct once
the block sticks flush with it, permanently false once a 32px gap sits
between them. `.stuck` never matched, so `.dFilters.stuck::after` (the
second layer that extends solid ground the 40px past the bar's own
gradient) never turned on, and rows scrolling under the bar's own
short fade showed through it. One fix for both: `top:-32px` on each block
cancels the padding out, so they stick flush with the border edge --
exactly what the stuck check was already written to expect.

---

### 5.293 A card that opts out of the wine, and the last of the padding

**"Why did you change this bg? Keep same bg as the cards, colour 181818."**
About Desktop V3's organ card, wine-tinted since before this session --
`body.b4 .dash .dcard, .dcard.bcard, .dcard.scard, .hiCard, .dcard.organ
{background:#280707}`, one rule for every card the page has, in both
themes ("the same #280707 light or dark, because it is the organ's ground
rather than the page's surface"). Said so rather than taking the blame for
a design already there, then made the change asked for: the organ card
alone comes out of that rule and gets `#181818` instead, `:not(.organTint)`
so the separate user-facing toggle of the same name -- which paints the
same wine tint onto any organ card, on any page, when switched on by hand
-- still wins if someone turns it on here too. The shared WebGL canvas
that draws INTO that card needed the same split: its clear colour used one
`tint` flag for `organTint`, `b4` and `v4` alike, so leaving `b4` in it
would have kept painting the canvas wine under a card that no longer is.
`b4` came out of `tint`; a new `v3Neutral` flag (`b4` without `organTint`)
clears the canvas to `#181818` on its own, so the rectangle problem 5.290
fixed doesn't reopen here.

**"Too much top padding... total padding top is 24px" / "padding top fixed
bar 24px."** Two more angles on the pinned filter blocks 5.292 just fixed
the sticking of. `.dFilters`'s own `padding-top` was 26px, `.dMedBar`'s was
18px -- both set to 24px. But the biomarkers block also carries `body.b2
.dash .dRow{margin-top:34px}`, breathing room under the summary cards in
normal flow, written before this block could ever pin itself to the top of
the screen. Pinned, there are no summary cards above it to breathe under,
and the same 34px just reads as too much padding on a bar sitting flush
against the card's own edge -- which is what "reduce by 32" and "total
24px" were both pointing at. `.dFilters.stuck .dRow{margin-top:0}` collapses
it exactly when stuck, leaving the natural, unpinned spacing alone.

---

### 5.294 One shot, not two: the teaser's opening dot, universe and body

A reference clip and a clear brief: DOT, then PARTICLE UNIVERSE, then BODY
SHAPE, as one continuous camera pullback -- no cuts, no pause between
stages, morphing throughout. The teaser's own sequences 01 and 02 already
told that story in that order, but as two separate shots: 01 was a CSS
starfield (`universe()`, four `<i>`-div depth layers under a `transform:
scale` zoom) that cut hard to 02, a `makeOrganView` canvas holding its own
independent cycle, morphing a scattered cloud into the body on a clock of
its own. Two renderers, two clocks, one hard cut between them -- exactly
what "avoid cuts" and "one continuous camera pullback" rule out.

The fix was to stop treating them as two sequences. 01 and 02 are now one
frame (still called 01; 03 through 09 renumber down to 02 through 08, the
TZ_GROUPS/VO tables/`onShow` indices and the odd cross-reference in a later
frame's note -- "Where 04 was..." -- moving with them). The whole shot runs
on the one piece of infrastructure that was already proven: `makeOrganView`
and its `.morphTo()`, the same real per-particle morph 02 was already
doing, just given the WHOLE arc to carry instead of half of it.

The dot and the universe turn out to already be inside that engine, not
separate assets. A `makeOrganView`'s `fill` is nothing but how large it
draws its cloud (`sc = min(W,H) * fill`); run it from a very tight value
down to the library's own settled one and that IS a camera pullback --
the same points, the same canvas, just how much of the frame they are
asked to fill. So the "universe" is the existing scatter cloud (10s already
built for 02: the body's own particles sent out to a random sphere, seeded
so the morph back is point-for-point), viewed at a scale so tight only a
sliver of it is on screen; pulling back over the cycle reveals the rest of
the sphere as "a universe of dots" for free, before the same points travel
into the body on the existing morph, well before the pullback finishes
(`morphTo` fires at 40% through the cycle, so the field is still opening as
the body starts to gather -- the overlap the brief asked for). The camera
runs on five keys eased into each other (`smoothU`, a plain S-curve),
fast-slow-fast-slow rather than one constant ease, for the "occasional
speed-up... without breaking continuity" the reference wanted -- never a
stop, always still moving.

Getting genuinely close to a single dot took a surprise: a uniform-density
BALL does not thin out toward its centre in projection the way a shell
count would suggest. A 2D disc around the axis sees the whole depth of the
ball through it, so the expected count in a small window falls off with the
SQUARE of how far the camera has pulled back, not the cube -- at the scale
that looked right by eye (10x) the sphere still put a dozen-odd of its own
points inside the frame, no zoom involved. Getting under one meant a much
higher opening `fill` (120, not 10) and holding the ambient "feed" (matter
that spirals in from beyond the cloud's own radius, on its own clock) off
until the field has properly opened at u=0.16 -- otherwise it puts a few of
its own points on screen regardless of the camera. What actually reads as
"one dot, alone" is an explicit CSS seed (`.tzSeed`), faded out once the
canvas's own field has taken over; the same trick the old CSS starfield
already used, just carried onto the new single-shot canvas.

A `Zoom` button on every frame's bar, alongside Play and the arrows,
`requestFullscreen()`s that frame's `.tzStage` alone -- the shot, not the
bar or the notes around it -- since the ask ("a zoom, full screen viewport
option") was for reviewing a shot at its own size, not the board.

---

### 5.295 Five named phases inside the one shot

5.294's dot-to-body pull-back worked as one continuous move, but the brief
that followed named five distinct phases -- empty to dot, slow zoom-out,
space travel, universe reveal, body reveal, each with its own character --
and asked for them explicitly, not just implied by one smooth curve. The
shot is still one `fill` animation on one canvas; what changed is giving
each phase its own span of it, named (`PH.dot`, `PH.zoom`, `PH.travel`,
`PH.universe`), rather than the five arbitrary-looking keys 5.294 shipped.

The two open items were the "dot" itself and the accelerate-then-decelerate
of phase five. The seed (`.tzSeed`) used to be a binary CSS
opacity-transition, on for the opening beat and off once the field had
taken over -- which does not "gradually emerge" (phase one) or read as
"progressively smaller" (phase two), since a flat dot that only fades
cannot also shrink. It is JS-driven now, opacity AND scale both a function
of `u` (`seedAt`): growing 0.55x to 1.6x as it fades up through phase one,
while the camera itself holds flat (no zoom yet -- that is what makes phase
one its own beat and not just the first instant of phase two), then
shrinking 1.6x to 0.35x as it fades back down through phase two, so the
same dot reads as retreating rather than as a picture cross-fading to a
smaller one. Phase three (`bodyView.feed`, the ambient particles that
spiral in from beyond the cloud's own radius) now switches on exactly where
the seed switches off, at `PH.zoom` -- the "space travel" sensation is
handed cleanly from the one asset to the other, not overlapped or gapped.

Phase five ("gradually accelerate... then smoothly decelerate") is not a
separate easing bolted on -- it is what a SINGLE key-to-key blend already
does. 5.294 had two rates from `.56` to `1` (fast, then a gentler one to the
settled value); collapsing that into one `smoothU` span from `PH.universe`
(.64) to a new `PH.settle` (.90) puts the whole accelerate-decelerate arc in
one continuous curve, with a short flat tail to 1.0 for the residual settle
rather than a second phase. The morph into the body now starts at
`PH.universe` and finishes by `PH.settle`, so the shape gathers while the
camera is still accelerating and lands as it decelerates -- "the body is
the larger structure the shot has been inside since the dot," which is
also now the literal last line of the frame's own director's note, rewritten
phase by phase to match.

---

### 5.296 The bento's report card, a list instead of a carousel

"Reduce the card of the report, it's too big" and "add the title 'Everlab
Report' above it, like desktop" arrived first; before either was built, a
third message redrew the card outright: My Reports, the four latest as a
plain list, no CTA, a New badge on the first row. Built the third version
-- it supersedes the first two rather than sitting beside them, since a
list sized to its own rows answers "too big" by construction and carries
its own heading in place of the requested title.

The card (`.hiRep`) was one carousel shared by two surfaces --
`buildReportSlides()` wrote the same four-slide, dots-and-arrows markup
into every `.hiRep` on the page, desktop's `#hiRep` and the mobile bento's
`#hiRepM` alike ("ONE SPOT, ONE CARD", 3.332's own comment). The desktop
card stays exactly that; only `#hiRepM` gets the new shape, so
`buildReportSlides()` now branches on the element's id and writes one of
two markups from the same four `reps`, everything else about the function
(the RECS-driven data, the slice of four) unchanged. The row itself is not
a new pattern: dot, title, meta, New badge, chevron is the all-records
drawer's own `.arRow`, copied rather than shared (that row is a real
`<button>` with a click handler; this one, like the rest of `.hiRep`
today, is not wired to anything yet, so making it a real button would have
implied a tap that does nothing).

The one snag was sizing. `.hiCard{height:210px}` is shared with the
carousel beside it so the pair lines up, and every V2/V3/V5-tab variant
adds its OWN fixed height on top (`body.v2 #phone .hiCard{height:234px}`,
and two more like it) at a specificity an id-plus-class selector cannot
beat. `#hiRepM.hiCard{height:auto !important}` is what actually wins auto
back across all of them; `align-self:start` stops the grid row stretching
it back out to match its still-fixed-height neighbour. Without the
`!important` the fourth row was being cut mid-line by whichever variant's
height rule was highest specificity -- exactly the kind of thing a
screenshot at one variant and not the others would miss.

---

### 5.297 The Organ Age landing page, in the order the brief always meant

The teaser's dot-to-body pullback (5.294, 5.295) got the order right on a
flat 2D canvas. The Organ Age landing page (`#m23`, `__lpBoot`) is the
other place this story lives, on a real page you scroll rather than a
looping tile, with a genuine perspective camera (`tick`: a focal length,
a camera position, a divide) instead of a flat scale -- and it shipped
with the reveal in the wrong place: dot, then body, then the universe,
then a black title card. The brief wants dot, particles, universe, body --
the reveal held back to the end, "the larger structure we have been
inside all along" -- so the fix is the same reorder 5.294 did to the
teaser, done to this page's own `KEYS` timeline instead of rebuilding it:
the existing `dot`/`uni`/`body`/`dark` states, unmoved, just walked in a
different sequence, with the `dark` title card (unchanged in every value)
shifted later to follow the body instead of leading into the universe.
`heart` onward -- the whole rest of the Organ Age feature -- starts at
`0.600` exactly as it always did; nothing past the title card moved.

The one thing the existing engine had no knob for was "oversized": `cam`
moving the camera is how everything else on this page gets closer or
further, but pushing it far enough for a point at the origin to fill the
screen pushes `d` (the perspective divide's denominator) toward its own
near-clip floor, and `dof`'s defocus math -- which measures distance from
a focal plane pinned just past the camera -- goes with it; the dot would
have rendered as a fully-blurred haze, not a crisp close-up. So it is not
`cam` at all: a new per-key `zoom` (default 1, read by only the three
opening keys) is a plain multiplier on the perspective scale, applied
to a point's own `x`/`y` before anything else touches them. 180 down to 1
across the first two legs is the whole of "empty to oversized dot, then
let it shrink" -- fast at first, easing into the ordinary scale phase two
starts from, which is what "retreating faster than the dot itself is
moving" actually is here: not a camera cut, a still camera and a
magnification collapsing under it.

Two bugs came out of putting a number that large into a formula tuned for
values near 1. First, `pan` (a small constant screen-space lift, unrelated
to any one particle's position) was being multiplied by `zoomK` along with
everything else -- 0.1 world units is a gentle nudge at 1x and eight
thousand pixels at 180x, which threw every particle straight past the
screen-bounds check and rendered nothing at all. `pan` now gets the
ordinary scale and nothing more. Second, the same fate met the idle drift
(the small per-particle sine wobble that plays while the scroll is still)
until `zoomK` moved to apply to the base position alone, before drift, arc
travel and the organ flow-current are added -- those stay at the tiny
scale they were authored at, so a wobble that is imperceptible at 1x
stays imperceptible at 180x instead of shaking the whole frame. Both were
found the same way: adding a temporary `window.__lpDebug` hook to read
back the actual `sx`/`sy`/`zoomK` for particle 0 mid-render, since a
canvas either draws a pixel or it doesn't and a screenshot alone does not
say why not. Removed once both were fixed.

The dot itself needed two more things a scale factor alone could not give
it. Its screen position is particle 0's own tiny `Math.random()` scatter
(the `dot` state spreads all nine thousand points within a hundredth of a
unit of the origin, though only particle 0 is ever lit) -- invisible at
1x, but magnified 180 times over it becomes "which corner of the screen
the one dot lands in," different on every load. Particle 0's `x`/`y` are
now forced to exactly zero once, after the state is built, so the dot the
page opens on is always dead centre. And "luminous" turned out to mean
nothing at this engine's own alpha grid and whatever ink and opacity
particle 0 happened to draw at random -- usually a muted, unlit brown, not
a glow. Particle 0's ink and alpha are now forced too: the brightest ink
in the file and a near-peak opacity, one particle out of nine thousand,
never visible again once any other state has more lit than it does.

The three lines of copy across this stretch swap position rather than
reword -- "one signal" still opens, "millions of signals" now plays
across the particle field instead of the body, and "your body is
constantly sending them" now lands as the body itself resolves, which is
a better pairing for what is on screen than either line had before.

---

### 5.298 One clock per particle, not one clock for the field

5.297's dot-to-universe morph moved every one of the nine thousand
particles on the same `e` -- the whole field arriving in lockstep, which
is a dissolve, not particles finding their own way. Three notes on it
("particles should appear progressively, more scroll more particles",
"some particles should navigate faster than others, not all at the same
speed", and separately "the first dot should stay in the centre, smaller
and smaller") turned out to be two problems, not three.

Each particle now carries its own fixed stagger (`pStg`, set once at
build time, a plain `Math.random()`), which slices out its own share of
a key's local progress to actually move across: `g = pStg[i] * 0.65`,
then the particle's own `ei = smooth((lp - g) / (1 - g))`. A particle
with `g` near 0 starts the moment the key does and takes the whole span
to arrive; one nearer the 0.65 ceiling waits, then closes its own,
shorter, remaining distance -- faster, because it has less of the key
left to do it in. Both complaints came out of that one number: a particle
isn't there at all (it is still at `A`'s position, which for the dot-to-
universe leg means invisible, since only particle 0 is lit in the `dot`
state) until its own window opens, which is what makes more of the field
visible as the scroll advances rather than the same count fading up
together; and a later start finishing at the same place in less local
progress is a particle visibly overtaking the ones already under way.
`cam`/`dof`/`pan`/`zoom` stay on the single global `e` throughout --
those describe the one camera, which does not have nine thousand copies
of itself to stagger. Off (`STAG = 0`) under reduced motion, where a
key's content is asked to arrive exactly on the scroll position and nothing
should be left mid-flight for its own separate clock to finish later.

The third note was a separate, smaller fix: the "one signal" dot was
never pinned to the centre once the universe state took over -- particle
0 has a position in `uni` like any of the other nine thousand, wherever
the general scatter put it, so the previous cut had it drifting off
toward wherever that happened to be rather than staying the one point the
shot opened on. `uni.x[0]`/`uni.y[0]` are now forced to zero, the same
fix already in place for the `dot` state itself (5.297), so the dot
holds dead centre through the whole reveal and only ever reads as
smaller -- the same particle throughout, not a hand-off to a stranger
nearby.

---

### 5.299 Earlier company, a bigger universe, a wider body

Four notes on 5.297/5.298, arriving in a run: the field around the dot
should start "right after the first scroll", the dot "should feel...not
alone since the beginning", the universe the body gathers out of should
be bigger, and the body itself "should zoom out more". All four are the
same shape of note -- the opening was still too close and too late --
and landed on the timeline and the universe's own build.

Phase one (dot alone) was three keys over the first 9.5% of the track;
it is two keys over the first 2% now, and the field starts fading up
immediately after -- by 6%, not ~21%. The dot is only ever truly by
itself for the first couple of percent of the scroll, which is what
"not alone since the beginning" asked for: not zero, but as close to it
as a phase that still needs to exist at all can be.

`buildStates`' `uni` -- the cluster and free-floating radii both -- is
roughly a third wider in every dimension than 5.297 shipped. The body
that gathers out of it (`organInto`) is the same fixed size it always
was, so a bigger field to gather FROM is what makes the convergence read
as a bigger pull-back, not a change to the body itself. Giving the
universe more of the track to open out into (phase three now runs to
36%, not 33%, over three keys instead of two) is what keeps a bigger
field from reading as merely a slower reveal of the same one.

And the body's own key had its `cam` cut from 1.25 to 0.15 -- down from
the universe's 0.65, not up. 5.297's read of "the pull-back's rate
should be steeper here" pushed `cam` further in the direction it had
been going the whole page, which is a bigger push IN: the body arrived
close and cropped, filling most of the frame. What "zoom out more"
wanted was the opposite direction entirely -- `cam` actually falling
across this key, a real retreat rather than a continued advance, so the
body settles small and whole in the middle of a mostly black frame, the
"larger structure" it came out of still legible as space around it.

---

### 5.300 A second, independent gate on the reveal; a camera that actually travels

"Still bad, need to feel we are in space, the more travel the more dot"
-- 5.299 widened the universe and moved its arrival earlier, but two
things were still short of what was asked. Both came from the same root:
`cam`'s own range through the universe was 0.05 to 0.65, a 0.60 span,
which against `FOC` (2.45) is not far enough for near and far points to
actually separate. Every point's perspective scale moves by roughly the
same small amount as `cam` sweeps that little, which is what a zoom looks
like, not what flying through a volume does -- nothing is ever close
enough to swell and pass out of frame, because nothing is ever close
enough. `cam` now runs 0.05 to 1.35 across the same two keys (more than
double), and `buildStates`' universe reaches further toward the camera's
own path (`z` as low as -2.2, not -1.4) so points actually exist in the
range this bigger sweep sends past the lens rather than merely away from
it -- the low end of a particle's `z` is what "behind the camera" (tick:
`d = FOC + z - cam`, clipped under 0.16) is measured off, so without
particles reaching that low, widening `cam` alone would have swept
through empty space.

The other half: STAG (5.298) staggers a particle's arrival within
whichever key pair is CURRENT, which for the dot-to-universe morph is one
key pair's worth of track (6% to 22%) -- once past it, every particle
already at the universe's own state held there, fully arrived, for the
rest of the universe's build (22% to 36%) with nothing left for "more
scroll" to do. A second, independent gate now runs on top of it, off the
raw scroll position rather than any one key's local progress: each
particle's own arrival point is spread evenly across the WHOLE stretch
from where the universe is introduced to where it is called built
(0.06 to 0.36), so the count on screen keeps climbing for as long as that
stretch lasts, not just its first key pair. Particle 0 -- the dot -- is
explicitly exempt, or its own turn in that same random queue would have
hidden the one thing the shot opens on.

---

### 5.301 The halo's breath was leaving a line behind

A straight horizontal line kept getting reported wherever `.v4Halo` sits --
behind the organ silhouette in the phone's V5 header, across the desktop
card's organ-and-gauge column, next to the status bar's clock and battery.
Three different hosts, one shared cause: the halo is a large radial-gradient
div, and it was breathing -- `animation:v4Breath 11s ease-in-out infinite`
(and its `v4BreathTop` twin for the copy that echoes above the phone's
scroller), a slow `scale(1)` to `scale(1.21)` and back. An animated `transform`
promotes the element to its own composited layer, and that layer gets
rasterised fresh every frame; at whatever row its box (or the `overflow:hidden`
clip it sits inside) lands on a fractional pixel, the resample leaves a seam --
worse than the static 8-bit banding `.v4Halo::after`'s noise film was already
built to hide, because it is a moving edge rather than a fixed one, and no
single screenshot ever showed the same row twice.

The fix is not a bigger gaussian or another film of noise: it is removing the
one thing forcing a re-rasterise. `animation:v4Breath` / `v4BreathTop` is gone
from all three rules that carried it (`body.b5 #organSlot .v4Halo`,
`body.v5 #mHeroOrgan .v4Halo`, `body.v5 #phone::before`), along with the
`@keyframes` themselves and the `will-change:transform` hints that existed
only to prep for that animation. The halo now paints once and sits there --
static, as asked -- and with nothing left to re-rasterise, the line has
nowhere to appear.

---

### 5.302 The line wasn't the breath -- it was the noise film's own edge

5.301 stopped short: the line behind the organ was still there after the
halo went static, which means the animation was never the whole story for
that one. `.v4Halo::after` lays a flat tile of noise over the light to break
up 8-bit banding (5.301's own account of it), at one even 5% across the
*entire* box -- but the light itself is not even across that box: past
roughly half its radius the gradient has already all but reached zero (the
comment above it says as much -- "the last third of the radius ... there is
no boundary left to see"). A texture that keeps going at full strength past
the point the thing it's disguising has already faded out stops tracking the
light and starts drawing an edge of its own, at the box's plain boundary --
which is what sat across the organ's torso, roughly half the header down,
exactly where `.v4Halo`'s own box ends. `--v4NoiseFade`, a radial mask on
`.v4Halo::after` shaped like the light's own falloff (solid to 50% of the
radius, gone by 82%), retires the film at the same rate the light does, so
there is nothing left at the box edge for either of them to draw.

The line by the status bar was a different bug wearing the same name.
`#phone::before` -- the copy of the halo that carries on above the
scroller's own clip, so the light still reads at the very top of the header
-- is a plain element, not `.v4Halo`, so the noise-film rule never reached
it: that copy has been running with the 8-bit banding the film exists to
hide since the day it was added, unmasked by anything. `#phone` is
dark-mode-idle on its OTHER pseudo-element -- `::after` there is spoken for
only in light theme, for the card's rim highlight -- so `body.v5:not(.light)
#phone::after` now carries this copy's own noise film, same geometry as the
`::before` it sits behind, same `--v4NoiseFade` mask, rather than a second
nested pseudo that plain CSS has no way to write.

---

### 5.303 A cursor that forgot it was a list

"My Reports" (`.hiRepRow`) carried no `cursor` rule of its own, so hovering
its rows fell back to the browser's own default over text -- an I-beam,
not the hand every other clickable row in the file shows (`.olist .or`,
the organ list this same page's halo sits beside, sets `cursor:pointer`
plainly). One property, brought in line with its neighbours.

---

### 5.304 A top that scrolled content hit instead of faded into

`#dMain` (the Insights page's own content card) owns its own scroll and its
own rounded top corner, and `overflow-y:auto` clips whatever scrolls past
that corner clean -- a card sliced flat across its own middle, no different
in kind from the row `.dFilters` already exists to fix further down the
same page, just further up, at the very top, with nothing there to fade it.
`.dTopFade`, a zero-height div sticking flush with that same corner
(`top:-32px`, the same cancelled-padding trick `.dFilters` uses, since
sticky's `top` reads off #dMain's padding edge, 32px short of the corner it
needs to sit on), fades from `--pageBg` to `--pageBg0` over 56px -- the
card's own colour to nothing, so whatever is currently scrolled to the top,
heading or card, dissolves into the ground it's sitting on rather than
stopping dead against it. One rule, reused by every `.dash` variant that
carries this markup (`--pageBg` is already themed and re-themed per
version), and zero height of its own -- a matching negative margin gives
the space back -- so it never pushes the heading down.

The first cut left it on all the time, since sticky's static position (its
resting spot before it has anything to catch) is still in the document,
still painting -- which put a permanent wash straight over the heading and
tabs sitting right where it rests at scroll 0, nothing there yet worth
fading. It also stacked above `.dFilters` and `.dMedBar`, the page's other
two sticky bars, which land on this exact same stuck position once
scrolled far enough -- so their own chips and search sat under a second,
uncoordinated fade on top of the bottom-edge one they already draw for
themselves, in the wrong place for their own height. Both are the same
mistake: `.dTopFade` behaving as a blanket rather than as a third fixed
bar with no fade logic of its own. `dStick()` -- the script that already
toggles `.stuck` on the other two off the scroll position -- now toggles
it on this one too (opacity 0 until then), and its z-index moved under
both of theirs, so once either is actually pinned, its own opaque top
simply paints over this one rather than the two adding up. One fade, at
the bottom of whichever bar is actually fixed, never two stacked.

### 5.305 A flash on every tab switch, nothing to do with scroll at all

Reported as "the gradient appears for a bit" on switching Biomarkers/
Reports -- not scroll-related, since it happened sitting at the very top
of the page, where `.dTopFade` should never show at all (5.304's fix). The
`.stuck` toggle was innocent; the tab switch runs its own crossfade
entirely apart from it: `.dash main.tabSwap > *{animation:tabSwap .26s}`
plays a 0.42-to-1 opacity climb on every DIRECT CHILD of `#dMain` when a
tab changes, so the new content slides and fades in together (5.294's
account of it). `.dTopFade` is a direct child too, and a running CSS
*animation* overrides a property's own rule for as long as it plays,
`.stuck` or not -- so every switch played the climb regardless of scroll
position, then handed back to `.stuck`'s real value once it finished. The
rule already carries an exclusion list for exactly this -- `h1` and
`.mTabsV2` don't crossfade either, because a control fading while it's
being used reads as the page reloading -- `.dTopFade` joins it: a
decoration, not tab content, with its own fade already spoken for.

---

### 5.306 A third shape for the Reports tab: one card per report

The Reports tab already has two shapes behind the `Reports` tweak --
Carousel (swipe) and Bento (a summary tile beside a scrolling list of
every record) -- both fixed regardless of how many reports there are. The
brief asked for a third that isn't fixed: how many reports there are
decides the shape itself, not just what's inside it. One report is a
single full-width card at 256px; two sit side by side at 320px each; past
two, the third report onward has nowhere left to sit beside a card
without shrinking it every time a new one arrives, so they move into a
second card and stack there instead -- the same `.rbList`/`.rbRow` the
Bento's own "All reports" card already draws, reused rather than rebuilt.

`buildRepCards()` (beside `buildRepBento()`, same shape of function) reads
a report-*count* off a new tweak, `Reports shown` (1 / 2 / more than 2),
not off `REPS.length` -- this is a review tool for a shape the live
account's real count may never actually put it in, same as `stAge`'s
Completed/Empty is for the biological-age card. Both tweaks live in the
same select-and-body-class pattern every other one here does: `Reports`
gained a third option (`cards`), driving a new `repCards` class alongside
the existing `repBento`, and `Reports shown` writes `CARD_STATE.repCount`
and re-fires `everlab:repTab` -- the same event the tab switch itself
already dispatches, which is how the rebuild reaches this without a
direct reference to a function declared in a different part of the file
(`dStick()`'s own `.stuck` recompute and half a dozen other listeners
already reach across the same way).

One bug on the way there: the first cut called `rebuildRepCards()` once,
immediately, right where `buildRepBento()`'s own boot-time calls sit --
but `CARD_STATE` is declared further down this same scope, so that read
it mid-TDZ (`Cannot access 'CARD_STATE' before initialization`).
`buildRepBento()`'s calls never touch `CARD_STATE`, which is why they were
never at risk of the same thing. Dropping the eager call and leaving only
the event listener fixed it -- the tab switch that first shows Reports
supplies the first real call, by which point `CARD_STATE` exists.

---

### 5.307 Mobile V2.5: V2's own bento, V3's dark ground

A new Mode-menu entry (`Mobile V2.5`, index 26, sort 6.5 -- between V2 and
V1, the same fractional-sort move the Tablet entry made against V5) wearing
`m5 v2 v25`: V2's own chain, wearing none of `v3`/`v4`, plus a marker of
its own for the one thing asked for on top of it -- the dark ground `v4`
carries. "V3" in the Mode menu is display-only, kept "for what it is
rather than for how many came before it" the way Desktop's own naming
already is (7541 on): the menu entry named `Mobile V3` is mode index 15,
which wears `v2 v3 v4` -- so the marker its dark ground is actually written
against is `v4`, not `v3`.

The obvious move -- add `v4` to the chain, or copy its rules wholesale onto
a new class -- brought its WHOLE bundle, and most of that bundle is not
"the ground," it is the sticky header V3/V4 was built around: `.mHead`
switching from `display:contents` (nothing painted, nothing measured) to a
real, `position:sticky` box. That box is sized for a slim, one-screen organ
header. Put V2's own header in it instead -- two full rows of cards, the
tabs, the report carousel -- and it barely ever released: the carousel's
own measurements, taken against `.mHead` as a plain ancestor, came out
wrong (every organ slide landed at `display:flex; transform:none`
simultaneously -- names and ages from ten different organs overlapping in
one card, `Kidney` printed through `Muscle & bone`), and the tabs scrolled
out of reach behind the pinned block. `v25`'s rules are `v4`'s own,
restated: only the two that pay for colour (`#phone`'s background, and the
mini-cards sitting on it), none of the ones that pay for structure.

Two more places had `v4` -- not `v3`, not "the dark mode," literally that
one class name -- hard-coded as the only way something knew to turn dark:

- `isBento`, a plain list of mode INDICES the mini-organ carousel's own
  frame loop (`bentoFrame`) is allowed to run for. Index 26 wearing `v2`
  looks exactly like index 11 to every rule keyed off `.v2`, but a numbered
  list does not know that automatically -- it is not a class, it is
  arithmetic, and 26 was never in it. This is what produced the garbled
  carousel above; once 26 joined the list, the windowing came back.
- The canvas's own clear colour, computed in JS off `cls.contains('v4')`
  for whether the organ's card is "tinted" (cleared to the ground colour
  rather than to whatever plain surface a card normally clears to). Without
  it, the CSS said dark red and the canvas said `#252522` (V2's own,
  untinted mini-card grey) -- a visibly mismatched rectangle behind the
  particles, on the one card in the header where the canvas IS the card.
  Reads `v25` now, alongside `v4` and `organTint`.

And the ground itself is dark-theme only, where `v4`'s copy is not: `v4`
forces it under `.light` too because every card and label downstream of it
carries its OWN `body.light.v4` reading, tuned to still work against it.
V2's cards have `body.light` readings of their own, tuned against V2's
light ground -- porting every one of them across to keep one dark island
lit under a theme that has turned everything else pale is the same
overreach the sticky header was. `body.v25:not(.light)` and the matching
`&& !cls.contains('light')` on the canvas tint: on the one theme that
doesn't want a dark island, V2.5 quietly reads as V2 again, the same way
the halo already sits out of `.light` entirely (5273 on) rather than being
forced to work somewhere it was never asked to.

---

### 5.308 A count in the Cards header, and one tweak retired

The Reports tab's "Everlab reports" header sits above whichever shape is
showing -- Carousel, Bento, or now Cards -- and never used to say more than
that plain plural. Asked for Cards specifically: "1 report should show 1
Everlab report" -- the count that decides the shape should say itself in
the header above it too, singular where there is only the one. `buildRepCards()`
writes it now, off the same `count` the cards themselves come from.

Fixing it exposed the same trap 5.306 already hit once: `buildRepCards()`
runs on every `everlab:repTab` firing, whichever layout is actually showing
-- so the first cut kept writing the counted label even while Carousel or
Bento was on screen, and switching away from Cards never got the plain
label back (the switch handler's own reset ran, then this immediately
overwrote it on the same event). Guarded on `CARD_STATE.repCards` actually
being true, the same flag the body class reads: no card, no touch.

Separately, the Palette tweak (Three inks / Wine family, `#stPal`) was
removed from the tweaks panel on request -- the row alone; `applyPalette()`
and `WINE_SETS` stay as they were; the default (Three inks) is what every
page now shows without a control to leave it. `stPalSel`'s own listener
was already written `if (stPalSel) ...`, the pattern every tweak here
uses, so a missing element is not a missing handler.

---

### 5.309 Cards, round two: a header moved, sizes corrected, an overflow earned

5.308's count in the "Everlab reports" header turned out not to be wanted
after seeing it rendered -- reverted back to the plain plural, and the
label's own reach into `buildRepCards()` (the `CARD_STATE.repCards` guard,
the switch handler's reset) went with it. Simpler code for the same reason
5.306 keeps citing: a rule that isn't there cannot regress.

The header itself moved: `.secHead` sat AFTER `#dRepBento`/`#dRepCards` in
the markup, so on both of those shapes it rendered BELOW the grid it was
naming -- correct only for the Carousel, which sits later still. Moved
before both, it now reads above every shape the same way.

The three sizes were re-specified once seen at their first numbers: one
report is 128px, not 256, and reads as a row -- title on the left, "View
report" on the right, both centred on the shorter strip, because a report
alone has nothing to stack under it. Two is 192px, not 320. `.rcInfo`, a
new wrapper around the eyebrow/title/meta trio, is what let one report's
CTA move to the row's end without the other two shapes' vertical stack
following it there -- `display:contents` everywhere but `.n1`, so it is
invisible to layout except on the one shape that needs it as a real block.

And the stack (the right card, past two reports) earns a "See more" in its
own top-right corner, but only once it is actually too tall to read at a
glance -- measured after render (`scrollHeight` against `clientHeight`),
not assumed from the count, since whether it overflows depends on the
demo count *and* the host's own height (the phone's card is shorter than
the desk's). Opens the same "Everlab reports" drawer the section header's
own "See all" does (`allRepsD`/`allRepsM`), reached directly rather than
through the boot-time `.arOpen` wiring, which only ever saw the buttons
that existed at boot -- this one is built long after, on a tab switch.

---

### 5.310 V2.5 was a Layout, not a Mode -- and the count reaches every shape

5.307 built "Mobile V2.5" as a new entry in the Mode menu. It was the wrong
door. The V2 and V3 being asked about were the **Layout** tweak's options
(V1 / V2 / V3 / V4 in the Tweaks panel -- `#stV2Tab`, `CARD_STATE.v2Tab`/
`v3Tab`/`v4Tab`), not the archived Mode-menu versions that happen to share
the names. The screenshot that finally said so had the Layout dropdown open.
Mode 26 is gone -- its MODES entry, class chain, `isBento` index, `LIVE`
promotion, `body.v25` ground and the canvas tint's check for it -- and
`#m26` now falls back to the last mode the way any out-of-range hash does.

V2.5 lives where it was meant to: a fifth Layout option, between V2 and
V3, wearing `v2Tab` (tabs above the hero, exactly where V2 puts them --
measured, 140px, against V3's 116 after `v3Layout()` moves them) plus a
class of its own, `v25Tab`. What `v25Tab` carries is precisely the half of
V3 that was wanted: the body card's ground. Under V3 that card is
`rgba(0,0,0,var(--v3BodyK))` -- nothing at rest, so the header's own grey
(`--headBg`, `rgb(18 18 18)` under V6) reads straight through it, and black
by the time it has the screen, on the same curve the header darkens
(`headerParallax()` writes `--v3BodyK` and `--v3BlurK`). "Body no black
bg, use same grey as the hero header; on scroll body become black" is that
rule word for word. So `v25Tab` joins `v3Tab` in the selector list of those
three rules rather than restating them -- the two sharing one ground is the
point, and drift between them would be a bug -- and in the scroll handler's
`if`. What it does NOT carry is `v3Tab` itself, whose class also relocates
the tabs and the carousel (`v3Layout()`), and V3's `v5Shrink` factor, which
pays for those relocated tabs sharing the hero's screen.

Two more asks from the same review, both about the Cards shape:

- **The phone stacks.** Two cards side by side on a 375px screen left each
  too narrow to read. `body.repTab.repCards #phone #mHeroOrgan .rcWrap` is a
  column now, filling the hero's fixed 410px the same way the bento does
  (`top/bottom:8px`). Two reports split it evenly -- which lands each at the
  same 192px the desk gives them, unasked. Past two, the big card takes the
  compact row shape one report already uses and the stack takes what's
  left (`flex:1 1 auto; min-height:0`, so `.rbList` scrolls inside it).

- **"Reports shown" reaches every shape, not just Cards.** The Carousel
  showed all twenty reports with the tweak at "1 report" -- the count was
  Cards' alone. `repsShown()` is now the one slice all three shapes read,
  and it reads the SELECT rather than `CARD_STATE`: the carousel and the
  bento are built at boot, before `CARD_STATE` is declared (the TDZ 5.306
  already hit once), and the select is in the document from the first
  line. Each shape rebuilds on `everlab:repTab` only when the slice's
  LENGTH changed -- that event fires on every plain tab switch too, and
  rebuilding then would throw away a dismissed carousel card and its
  scroll position for nothing. `CARD_STATE.repCount` is gone; the select is
  the state, and it survives `setMode()` the same way.

### 5.311 V2.5's hero hugs its tab, and the Cards shape grows to four counts

One long review round on the V2.5 Layout, all of it in the Reports tab.

- **The cut line below the status bar** (5.303's seam, back again) was the
  halo's two noise films: `.v4Halo::after` in the header and the
  `#phone::after` echo above the scroller. Each composites its grain over a
  different stack, so the two halves of the same film never matched to
  better than ~3 levels along the joint, and that joint sits exactly at the
  status bar's bottom edge. Measured over the clean columns (200–296 and
  464–560 at 2x, clear of the clock and the island) the halves agree to
  within 0.5 level once the films are gone. The header film is now scoped
  to the desk (`body.b5 #organSlot .v4Halo::after`), where there is no
  echo to disagree with; the phone film is deleted.

- **The hero hugs its content in V2.5** (`HERO25` block, `#mHeroOrgan
  height:auto`). Under V2 the hero is a fixed 410px box with the carousel
  and the dots absolutely placed in it. Under `v25Tab.repTab` those
  children come back into the flow -- carousel, dots, bento, cards, each
  with its `position:absolute` undone -- and a heading, `.rcHeroHead`
  ("Everlab reports" / See all), is the hero's first child. The title had
  been missing because only V3's relocated host carried one.

- **One or two reports are cards, not a carousel, in V2.5.** A carousel of
  one is a card with a dot under it; of two, a card and a hint. So
  `rebuildRepCards()` derives `repFew` -- V2.5, Carousel layout, slice of
  two or fewer -- and the phone's Cards rules take `:is(.repCards,.repFew)`:
  one report is the 128px row card filling the hero's width, two are side
  by side at 192px. Past two the carousel stays. `repFew` rides in
  `CARD_STATE` so `setMode()` re-emits it.

- **`#hiRepM` (the My Reports mini card) shows the carousel under V2.5**,
  not the list: `buildReportSlides` writes both and CSS picks, so the
  Layout tweak needs no rebuild.

- **The Cards shape has four counts now**, on both screens. `repsShown()`
  gives 1, 2, 3 or 5 (the select's "More than 3"). `n1`: one row card,
  CTA on the right, 128px. `n2`: two cards side by side, 192px. `n4`
  (past two): the main card left and ONE card right holding the rest as
  list rows -- two at three reports, three past that -- with a "See more"
  in its head when there are more than the rows show. A three-report
  shape of its own (two row cards stacked on the right) lived for one
  publish and was taken back: "just the 1 report big card, the rest of
  reports inside one card, stacked". No fixed heights on n4: the right
  card hugs its rows and the left card follows it (`flex:1 1 0` on both,
  `align-items` stretch) -- measured 229/229 on the desk at five reports,
  164/164 at three. Eyebrows: "Latest report" on the main card, "Recent
  report(s)" on the others. The phone stacks them all in a column.

- **Smaller ones:** `.mTabsV2` gets `margin-bottom:30px` under V2.5 (the
  asked +16 over V2's 14). The list rows' dots are one neutral grey now
  (`.rbRow i.d`, `rgba(242,229,224,.22)`) rather than each report's colour
  -- a list marker, not a legend; the inline `style` came off the two
  builders that write `.rbRow`. And a **"Reports title"** tweak
  (`#stRepTitle`, `CARD_STATE.repTitle`, class `noRepTitle` when off) hides
  the "Everlab reports" heading over the cards in all three places it can
  stand -- the desk's `.dRepWrap`, V3's `.mRepCarHost`, V2.5's hero --
  with the hero keeping the heading's 8px top so the cards do not touch its
  edge.

### 5.312 V2.5's header joins the flow; the tabs are what holds

- **The header scrolls with the page under V2.5.** V4's model -- the
  header pinned to the scroller's top (`position:sticky`), its content
  receding at 0.12 and fading, the body riding 24px over it on rounded
  corners -- is exactly what was asked away: "the hero header should just
  be part of the flow, the body shouldn't overlap the hero". So under
  `body.v4.v25Tab:not(.v3Tab)` the header is `position:relative`, the
  body's `margin-top` is 0 and its corners square (there is no edge to
  round any more), and `headerParallax()` skips the transform and the
  opacity for it (`flow`), moving the hero light's outer half at the
  scroll's own rate and leaving it lit -- the header is not receding, so
  nothing on it should look as if it were. The body's ground still runs
  from the header's grey to black on the scroll, which was V2.5's founding
  ask; the backdrop blur is left off in the flow, since the body has
  nothing under it to blur.

- **The tabs pin, until the cards push them off.** `position:sticky;
  top:8px` on `.mTabsV2` -- and the trick is where it sits: INSIDE
  `#mHeadIn`, so its containing block is the header, and sticky's own rule
  ("stay within the containing block") is what unpins it: the pill holds
  under the hour while the hero scrolls past beneath it (measured: at
  y=120 and y=300 the pill is at 134, scroller top + 8) and is carried off
  as the header's end reaches it (76 at y=480, gone at y=700), which is
  "fixed on scroll until the group reach the cards below" without a line
  of script. A `backdrop-filter:blur(16px)` on the pill keeps it legible
  over whatever passes under it.

- **From the same review:** the "See all" is gone from the "Everlab
  reports" heading in all three places -- "if See more exists it should be
  in the >3 reports inside the stacked item card", where it already is
  (`.hasMore`). The latest report's card carries a **New** badge, top
  right (`.rcNew`, absolute, so the card's own layout is untouched); on
  the row shape that put the badge's corner over the CTA, which was
  sitting at the top of the row on the column shape's
  `align-self:flex-start` -- it is centred on the row now. The phone's
  row card has a 162px floor ("latest report height by 48px" over the 114
  it hugged to). And the eyebrow on the other cards reads **Other
  report(s)**, not Recent.

- **Then the phone's latest-report card stopped being a row** ("CTA below
  content left bottom (margin top 24px)"): eyebrow, title, meta, 24px, CTA
  at the left, the card hugging that (168px) -- the 162 floor went with the
  row. The badge stays absolute in the corner. The desk keeps its 128px
  row with the CTA at the right. Phone card titles are 18px (22 wrapped
  "Pathology test" onto two lines at two cards across).

- **"Header hug height based on content"**: under the cards the header ran
  86px before the next section -- the hero's 8px padding, its 28 margin,
  the body's 14, and 34 of padding on the mini-card row `#mV4` around a
  row the Reports tab hides. The 8 and the 34 are gone under V2.5's Reports
  tab; the 28 stays as the one gap.

- **"reduce gap by 24px"** on the biomarkers tab: undoing the body's 24px
  ride over the header (5.312) had opened exactly 24px of air between the
  organ names and the mini cards (60 against V2's 36). The hero gives it
  back on its own margin (`margin-bottom:-18px` = 6 − 24) on the biomarkers
  tab only; measured 36 again.

- **The halo fades out on the Reports tab** -- "Halo bg concern only
  biomarker hero section". Both halves (`.v4Halo` in the header and the
  `#phone::before` echo) go to opacity 0 under `body.v5.repTab:not(.v3Tab)`
  on a .35s transition, the tab crossfade's own length, and come back on
  Biomarkers. Opacity rather than display so it is a fade, not a cut.

- **The list rows' dot is gone** ("No need dot"): `.rbRow i.d{display:none}`.
  It had been the report's colour, then a neutral grey; the row is the
  title, the date and the chevron now. The `<i>` stays in the markup so
  the two builders need not change. The All-reports sheet's rows lost
  theirs too (`.arRow .d`).

### 5.313 V2.5 is the default, and its body is not a card

- **Defaults.** The Layout select opens on V2.5 and the Reports select on
  Cards -- `selected` on the options AND `CARD_STATE.v25Tab:true` /
  `repCards:true`, which have to keep agreeing (setMode writes the body's
  classes from CARD_STATE; the selects are what the handlers read).

- **"Abandon the content card system."** V2.5 had taken V3's body ground
  -- a card that is transparent at rest and fills to black on the scroll
  (`rgba(0,0,0,var(--v3BodyK))`). With the header in the flow that card
  had an edge, and for a moment on the way up the card's alpha and the
  header's grey ran different curves and the edge showed under the organ
  names. Now the body paints nothing (`background:transparent`) and the
  phone's ONE ground does the darkening: `--headBg` is
  `rgb(var(--v5head))` under V6, and the scroll handler already runs
  `--v5head` from 18 to 0 as the header goes by -- so status bar, header
  and body are one surface going to black together. Measured
  phone/header at 18/18, 10/10, 0/0 at y = 0, 200, 400. `--bodyBg` (what
  the filter bar's plate and the list paint) is that same grey, and
  `--bodyBg0` is it at alpha 0 for the fades. The handler no longer
  computes `--v3BodyK` for V2.5.

- **A plate under the pinned tabs.** With the header scrolling under the
  sticky pill, the organ's particles showed in the 8px between the hour
  and the pill. `.mTabsV2::before` is now a full-width plate in
  `--headBg` (the pill is 70% wide, so it reaches 15/70 out on each side)
  from the scroller's top edge to a soft fade 14px under the pill; the
  pill's own tint moved to `::after` so the plate could sit under it. Both
  z-index:-1, under the buttons and the thumb. The blur on the pill went
  with it -- an opaque plate has nothing to blur.

- **One New badge.** The card's `.rcNew` had been drawn as a light pill;
  the sheet's row, the My Reports row and the desk tabs' count already
  shared the orange one (`#e0865f` on `#1a0f08`, 11px, 4×8, 7px radius).
  "keep same badge for new report everywhere" -- so the card's took that,
  and nothing else changed about where it sits.

- **Mobile (viewport) with the bar** (`?phone&bar`): the tweak bar is
  fixed and was covering the tabs. `resize()` now writes the bar's
  measured height to `--barH` on the root, `body.fullscr.showBar #phone`
  pads for it on top of the safe area, and the tabs sit 16px under it
  ("make the tab group 16px from the top below the Tweak bar"). Without
  `?bar` the bar is display:none, `--barH` is 0 and nothing moves.

- **The stack's rows press like the organ-age items.** Each `.rbRow` is a
  14px-rounded row that lights up on hover (`rgba(242,229,224,.06)`) and
  on press (.1), with no rule between rows -- the highlight is the
  separation. It bleeds 10px into the card's padding on both sides so the
  text stays put and the highlight is wider than it. Rows were already
  buttons that open the report sheet; this is the affordance saying so.

- **"remove for this demo"**: the "3 records are processing" note over the
  medical records is `display:none`, phone and desk. Markup and rules
  stay for when the processing state is shown again.

- **The sticky tabs are gone again** (5.312, 5.313). The plate under the
  pinned pill -- opaque from the scroller's top to 14px under the pill --
  was what "cut the top part" of the organ at rest, and "Tab group remove
  fixed state. Don't need" settled it: no sticky, no plate, no pseudo tint;
  the pill is back on its own 6% ground and scrolls with the header.

- **Desk one-report card**: the CTA is centred on the title-and-meta pair,
  not on the card. It WAS at the card's centre (measured), but the eyebrow
  above the title puts the text's visual mass below that centre, so the
  button read as high. A 24px top margin (eyebrow line 14 + title margin
  10) on the centred item moves its centre down by 12, onto the two lines'
  middle: title 311–334, meta 342–357, CTA 318–353.

- **Desk card titles are 20px** (26 → 24 → 20 across three asks).

- **The stack's rows take the organ list's row exactly** (`body.b5 .dash
  .olist .or`: `margin:0 -14px; padding:9px 14px; border-radius:12px`,
  hover `rgba(242,229,224,.07)`): 14px of highlight past the text on each
  side rather than the 10 of the first pass ("padding is not enough left
  right. Keep exactly same pattern as the organ age list item hover
  state"), 12px radius, the 7% wash. And the card itself stopped
  offering a pointer -- `.rcCard{cursor:default}`; what is pressed is
  inside it (CTA, rows, See more), each with its own.

### 5.314 The jump, found: the pinned filter bar lost 34px of height

"when I hit that there is a jump" (asked about several rounds ago, and
again as "the fixed bar jump when reach the Dropdown / search section")
was on the live Desktop, whose body carries `b2`. `body.b2 .dash
.dRow{margin-top:34px}` gives the filter row its breathing room under the
summary cards, and `body.b2 .dash .dFilters.stuck .dRow{margin-top:0}` took
it away the instant the block pinned, so the block went from 180px to 146
and everything under it leapt up 34 (measured: the list's absolute top
911 -> 877 at the pin). The archived m2 does not carry `b2`, which is why
the first probe on it saw nothing.

The margin stays now and the bar pins 34px higher instead:
`body.b2 .dash .dFilters.stuck{top:-66px}` (the -32 that cancels #dMain's
padding, and 34 more). The class flips exactly as the block passes the
-32 line, so changing `top` there does not move it -- it carries on in
the flow for 34px and holds -- and the select still rests 24px under the
card's edge (85 against the scroller's 61). Swept 600–760 and back in 1px
steps: the list's absolute top never changed.

Also: the desk tabs' divider is `rgba(255,255,255,.06)` (was .1) --
"divider a bit less prominent".

### 5.315 Every desk page on the Insights shell -- the Overview first

"Keep this desktop (breakpoint ready) for the Overview page. I want all
pages be based on this structure from now!" The structure is `.dash`:
the fixed sidebar (`.side`, 224px, the shell's ground) and the card that
owns its own scroll (`#dMain`, rounded top, capped at 1160 and centred),
with the responsive switch that turns the desk into the tablet and the
phone as the window narrows.

The Overview (m9) had a shell of its own -- `.dvWrap`, a 302px `.dvNav`
with placeholder "Menu" entries, and `.dvMain` scrolling inside a grid.
It is on `.dash` now:

- **The `<main>` moved, not copied.** `#dOver` (the old `.dvMain`, given
  an id) is appended into `.dash` after `#dMain` at boot, so its own
  script -- the organ tile, the rail -- finds the nodes it always did.
  `.dvWrap` and its nav stay in the markup at display:none; nothing reads
  them.
- **One card rule, two cards.** `#dMain, #dOver{...}` share the card
  (position, radius, cap, padding); `body.m9 #dMain{display:none}` and
  `body.m9 #dOver{display:block}` say which is showing, and `body.m9
  .dash{display:block}` joins `body.m2`'s. `resize()` measures
  `--dMainLeft` off whichever card is showing, since a hidden `#dMain`
  measures left:0 and the shell strip behind the rounded corners would
  have shrunk to 40px.
- **The sidebar lights the page it is on.** `.nvOver` / `.nvIns` classes
  on the two entries; under m9 Insights' `.on` is quieted and Overview is
  lit. Clicking moves between them: `goto` maps Overview → 9 and Insights
  → 18 (it mapped only Overview and the old nav's "Biomarkers" → 2, the
  archived first desk).
- **The Overview is a responsive family too.** `responsiveSync()` works
  from `RESP_FAMILIES` now -- Insights {18, 21, 20} and Overview {9, 9, 6}
  (no tablet of its own, so the desk holds until 640) -- and the phone
  end of each wears `fullscr`+`showBar`; `body.fullscr.m6 #phoneShell2`
  fills the window the way m5's shell does, and `#phone2` takes the same
  border/padding rules as `#phone`, bar padding included. The menu keeps
  showing the desk entry at every width: the window changed, not the
  choice. Checked: m9 at 600px → m6 full-bleed, back at 1600 → m9; m18 →
  m20 → m18 likewise.
- **Past results (m24) still sits over it.** Its dimming filter moved from
  `.dvWrap` to `.dash .side` and `.dash #dOver` rather than onto `.dash`
  itself: a filter on `.dash` would make it the containing block of its
  own fixed sidebar and drop the sidebar by the bar's height.

And the **"Mobile (viewport)" entry is gone from the Version menu** --
"remove mobile viewport as I have it on desktop": Desktop is responsive,
and a narrow window IS the mobile viewport. `#m20v` and the `/phone` path
still reach the full-screen phone; the select simply shows the mode's
own entry when they do.

### 5.316 Reports tab, four small ones and a phone carousel

- **The row wash was being clipped, not under-sized.** `.rbList` scrolls
  (`overflow-y:auto`), and a scrolling box clips sideways as well -- so the
  row's 14px overhang past its list showed as the list's own 4px padding
  ("hover bg should bleed more"). The list reaches out now (`margin:0
  -10px; padding:0 10px` in the stack card, 12 on the desk) and the row
  stays inside it with `padding:12px 14px` (16 on the desk): the wash runs
  14/16px past the text on each side, measured, and the text is still
  level with the eyebrow above.

- **No press scale on the report cards.** `.rcCard:active{transform:
  scale(.97)}` belonged to the record chips in `.rcCar`, which share the
  class name; scoped to `.rcCar .rcCard:active` -- "no report card should
  be clickable, so no press state that scales down the card".

- **The Reports tab's orange 1.** `.tCount` on the desk tabs was V3's alone
  (`body:not(.v3Tab) ... {display:none}`); it shows on every line-of-tabs
  layout now (`body:not(.v2Tab)` hides it, i.e. only the pill).

- **Phone Cards past two is a carousel.** `buildRepCards()` returns `nCar`
  on the phone for 3+: every report as the two-up card (192px, CTA at the
  foot), in a row that scrolls and snaps card by card. Width is
  `calc(50% - 12px)` with a 16px right padding: 50% is of the content box
  the padding has already shortened, so (W-16)/2 - 12 = (W - 2·12 - 16)/2,
  and two cards stand in the row with exactly 16px of the third at the
  right edge ("card width based on the 3rd card visible 16px on the right
  side"); -20 had left 32. The desk keeps the main card and the stack.

- **The row runs edge to edge.** The hero's 13px inset was cutting the
  third card flat ("no cut on the right side"); the row is `left/right:0`
  (margin 0 under V2.5) with the 13 back as padding and as the snap line,
  so the third card runs off the screen instead and its 16px shows from
  the screen's own edge. Two-up cards (n2 and the row): 208px (192 + 16),
  16px titles (18 − 2), and the New badge in the flow under the meta line
  -- in the corner it landed on the eyebrow's letters -- via `order` on
  the badge and the CTA, since `.rcInfo` is display:contents and the three
  lines are the card's own flex items. "Everlab reports" has 20px under it
  (12 + 8).

- **Swipable under a mouse** ("make it swipable"): a pointer drag on the
  row moves `scrollLeft`, followed on the WINDOW for the drag's length
  rather than captured -- `setPointerCapture` on the row stalled after
  the first move and never released in Chromium. Mandatory snapping is off
  while the pointer is down (`.dragging`) and the row is asked to settle on
  the nearest card on release; the click that follows a drag is swallowed
  so a swipe never opens a report. Touch keeps the native scroll.

- **Dots under the row** ("add carousel nav dot"): `.rcDots`, the hero
  carousel's own dot language (5px marks, the current one 16 wide), a
  sibling AFTER the row because the row is the scroller and anything
  inside it would scroll away. One dot per scroll POSITION, not per card:
  two cards stand in the row, so the last card is never the leading one
  and a fifth dot could never light -- n cards, n−1 dots, the active index
  clamped. They follow the scroll and a tapped dot scrolls to its card.
  In V2's fixed hero they sit at 8+208+14; in V2.5's they follow in the
  flow. First pass painted nothing: the tap padding was drawn on the mark
  itself, and `#phone *{box-sizing:border-box}` (an id) beat the
  content-box the rule asked for, leaving a 5px box entirely padding. The
  tap target is a pseudo now (`inset:-8px -4px`).

### 5.317 One card and 96px of the next; the New card's halo; the release glides

- **The row shows one card and 96px of the next** ("1 card + 2nd card
  96px on the right side"), not two and a sliver. Right padding is 108 (96
  + the 12px gap), so the card is exactly the row's content box
  (`width:100%` = W − 13 − 108, 251px on the 372px phone) and the second
  card's left edge is 96px from the screen's edge -- measured. With that
  padding the last card can lead as well, so the dots are one per card
  again (five for five; the 1px the sub-pixel widths lose at the far end
  is absorbed by the clamp).

- **The New card's halo** ("add a top right halo (200% the card size) when
  the report is New"): `.rcCard.rcNewCard::before`, a radial wash with
  radii 100% × 100% -- a diameter of two cards -- centred on the top-right
  corner, so the quarter inside the card lights that corner and fades
  toward the far one; the badge's warm at 26% down to nothing by 72%.
  Under the content (z-index −1 in the card's own stacking context,
  `isolation:isolate`) and clipped by the card. Every shape, both screens:
  `big()` puts the class on whichever card gets the Latest eyebrow.

- **The release glides** ("make sure the carousel has a smooth effect on
  release when swipe the card, too brutal atm"). The brutality was two
  things landing at once: the browser's smooth `scrollTo` and the
  mandatory snap coming back the same frame `.dragging` left, so the snap
  won and the row jumped. Now the row settles on its own rAF glide
  (ease-out cubic, 480ms) and `.dragging` -- snap off -- stays until the
  glide has landed exactly on a snap line, where there is nothing left to
  snap. The release also reads the last moves' velocity: a flick past
  0.35px/ms carries to the next card in its direction, anything slower
  settles on the nearest. Measured an 80px flick: 80 → 160 → 212 → 243 →
  258 → 263, landed on card 2; a slow 30px drag settled back.

- **The row's cards, once more** ("badge top right; eyebrow replace by
  date"): with the card a full card wide again the badge went back to its
  corner, and the eyebrow is the report's DATE -- `big()` takes a
  `dateTop` flag; the meta line then says only what the report is ("44
  biomarkers", "Video"), so the date is not read twice. The side-by-side
  pair (n2, ~168px) keeps the label eyebrow and the badge in the flow,
  where a corner badge landed on the letters. Measured 102px between the
  date's last letter and the badge.

### 5.318 The Visual report card, the phone's tab count, 142

- **A "Report card" tweak: Neutral / Visual.** Neutral is the card as it
  was. Visual ("put the content below like this", a media shelf: a tile
  and its caption) drops the card's ground and padding and stands a tile
  where the card was -- the report's two colours (`r.art`) as a gradient
  with the shelf's own document/video drawing (`repArtHTML`) centred on it,
  16px radius, 16:10 on the phone and a held 200px on the desk (16:10 of a
  500px column made a 320px poster of an icon) -- with the eyebrow, title
  and meta under it on the page. The tile is the way in (a button carrying
  `data-r`, answered by the click the CTA already answered), so the CTA
  goes; the New badge moves onto the tile's corner and the halo, which lit
  a card that is not there, goes. The desk's one-report row puts the tile
  on the left at 220px. `.rcVis` is in the markup always; `body.repVisual`
  (`CARD_STATE.repVisual`, `#stRepStyle`) shows it, so the tweak is CSS
  alone and no shape rebuilds.

- **The phone's pill carries the Reports count too** ("put the same '1'
  badge on mobile on report tab; rounded badge as the segmented tab"):
  `tabCounts()` writes to both tab controls, and the pill's copy is
  smaller (10.5px) and fully rounded like the pill and its thumb, 6px
  after the label. A first pass set the phone's tabs to inline-flex for
  the gap and thereby un-hid V4's Insights tab, whose hiding is a display
  rule of its own -- so the badge spaces itself with a margin instead.

- **Visual, second pass: the tile is the card's HEADER.** "Need to fill
  with a card bg below the content, the visual is the header of the card"
  -- so the card keeps its ground; the tile sits flush to its top edge and
  corners (radius 0 of its own, clipped by the card's `overflow:hidden`),
  and the eyebrow, title and meta sit in the card under it, carrying the
  22px side padding themselves since the card's own had to go for the
  header to reach the edges. The desk's one-report row is 140px with the
  header on the left at the card's full height (the `.dash` 200px rule had
  to be outranked there). The Report card control stays a SELECT --
  Neutral / Visual are two dresses, not one turned off -- so `segmentise()`
  skips `#stRepStyle` like `#stRepLay`.

- **The Tweaks panel reads top-down** ("this tweak first / this under a
  group Biomarkers tab / this under a group Reports"): Layout first, then
  a **Biomarkers tab** heading (`.tkSub`, the panel's existing group
  style) over Biomarkers, Unclassified, Biological age, Organ ages, Left
  card, Activity and New results, then a **Reports** heading over Reports,
  Reports shown, Report card, Reports title and Expanded Report. Rows
  moved, none renamed; every handler still finds its id.

  Then three more asks on the same panel. The two groups are **cards**
  inside the dropdown (`.tkGroup`: the page's card wash on the panel's
  ground, 10px radius, the heading inside at the top -- "use the cards
  style for the grouping"). The Reports card's rows are **renamed** as
  given -- Reports → Style, Reports shown → How many, Report card →
  Layout, Reports title → Title -- labels only, ids and handlers
  untouched. And **Expanded Report is out of the panel** ("remove this
  tweak"): the row is gone, the handler null-guards and `body.expRep`'s
  rules stay. Then the cards were **condensed** ("condense the property
  inside the cards, make it a bit smaller; the title group of each card
  should be regular and smaller"): rows at 5px vertical padding inside a
  card (7 outside), no gap between them, and the card's title at 9.5px
  regular.

### 5.319 A new result, read off the record select

"When there is a new result, put a blue dot next to the chevron, and then
on the list item, you should put a badge: New." Both hang off the New
results notice (`body.newRep`, the Tweaks toggle), so the three say one
thing together: a **7px blue dot** (`.msRecNew`, `#5b9cf5`) stands beside
the chevron in both record selects, and in the list the newest report
(`REPS[0]`) wears the orange **New** badge beside its name. Opening that
report -- from the list, or through the notice card -- marks the wrap and
the menu `.seen` and both go; turning the notice back on brings them back
with the fresh notice. Two things the first pass missed: the dot is an
`<i>` inside the select button, which `.msRec i` / `.dash .drecs i`
already dress as the eyebrow line (display:block), so the dot's rule is
said against the buttons at that weight; and the phone's menu
(`#mRecMenu`) is NOT inside its wrap -- it lives in `.msRow` -- so the
badge's rule and the `.seen` mark address the menu itself.

### 5.320 The Bento's left card is the reports, stacked

"On the Bento one, use the card layout for your report, with a list of
four reports: the visual on the left, text on the right, and stack four
items. On the right side, keep the documents." The left card had been a
summary -- a count, a lead line, the categories and their bar. It is the
reports now: up to four `.rbVRow`s, each with the report's visual on the
left (the Visual card's tile at 64×44, the report's two colours and the
shelf's drawing) and its title and date · kind on the right, the newest
wearing the New badge; a row opens the report as the list's rows always
did. The right card is the documents list, untouched. The list does not
scroll (four rows fit), so it reaches 10px out for the rows' wash without
clipping and the rows' own 10px put the text back at the card's padding
(thumb at 22, measured). The phone has no room for two bento cards with
four rows each, so it shows the stack alone at the hero's width. The
summary's rules (`.rbBig`, `.rbSplit`, `.rbBar`) stay, unused.

### 5.321 Photographs on the report visuals

"Use this image for the report visual placeholder" -- three photographs
(a green smoothie, a dotted globe on sage, a red micrograph), cropped to
the tile's 16:10 at 800px and saved as webp under `assets/reports/`
(41–54KB each; the build inlines them as data URIs like the teaser's).
`REP_ART` deals them round the reports in order (`repImg(r)`), so
neighbouring cards never share one. They go on the Visual card's tile
(`.rcVis`) and the Bento row's thumb (`.rbThumb`) as an inline
`background-image`, `cover`, centred; with a photograph on the tile
(`.hasImg`) the document/video drawing stands down and the report's
gradient stays underneath for the frame the image has not painted yet.
Two corrections followed the first render. The globe's crop had asked
PIL for a 1250px band out of a 901px image and PIL padded the rest with
black -- a letterboxed tile; wide photographs take the full height and
trim the sides now. And the tile's own rule (`body.repVisual .rcCard.rcBig
.rcVis`, background shorthand, the drawing at 58%) outranked the `.hasImg`
overrides, so the photo tiled at natural size under a visible drawing;
the overrides are said at that weight now (cover, centred, drawing off).

### 5.322 Visual: thumbs on the stack, the badge on the meta line, 20px

- **The stack card's rows carry a thumbnail too** ("the right card is
  missing [the visual]; put a small thumbnail next to each stacked
  element"): `.rbThumb.rbThumbS` in `rowItem()`, 52×34 with the same
  photograph, cover and centred, shown only in Visual.

- **The record dropdown**: the desk's menu is 440px wide under its 256px
  button ("make the dropdown wider"), so a title with the New badge beside
  it is no longer cut; the count badge is 32px high at 13px (was 34/15,
  "smaller, maybe 32 high"); and the in-list New badge is BLUE like the
  dot on the button -- "the dot means something new is inside the
  dropdown, and this is the something" -- one colour for one signal.

- **The Visual card's New badge is in the footer, right, off the image.**
  Not the corner badge moved: pinning it to the card's bottom put it
  below the meta line on the phone's row, where cards stretch to the
  tallest. A second copy is written INTO the meta line and floated to its
  right end (`.rcNewInline`), so it is level with the meta on a card of
  any height; Neutral shows the corner one and hides this, Visual the
  reverse. Measured level with the meta on every shape, both screens.

- **The Visual title is 20px on both screens** ("the title is too big, it
  should be font size 20") -- the desk already measured 20; the phone's
  Visual cards (16 and 18) came up to it. `#phone .rcTitle{18px}` is an id
  rule, so the phone's line is said with `#phone` in it. Then "still too
  big, put 18px" -- 18 on both screens.

### 5.323 The desk's out-of-range pill, the Visual right column, the drawer's cover

- **Out of range on the desk was never styled.** `.dash .st.ok` and `.sub`
  existed; `.out` and `.other` did not, so those pills fell to the generic
  `.st` (no ground, page ink). The phone's pair, red on red and grey on
  grey, is on the desk now, light theme included -- "the out-of-range
  should be a red background and red text". Measured over every desk
  pill: 68 ok, 20 sub, 12 out, 10 other, each with its own ground.

- **Visual, past two: a right column of two cards.** "The latest report
  on the left as it is; on the right, two cards: the report card you
  have, and below it a small card, same full width, a My documents card
  with just one item." The stack sits in `.rcCol` with `.rcDocs` under it
  -- the stack's shell, a "My documents" eyebrow and one row (a document
  icon, the first record's first document, its date and source) that
  scrolls the reader to the records below. Written always, shown by
  `body.repVisual`; both cards hug (`flex:none` inside the column), the
  column is their sum and the main card stretches to it: 233 + 20 + 115 =
  368 on both sides, measured. Neutral shows the stack alone at 233.

- **Thumbs and photos**: the stack's thumbs are 44×30 with 8px of their
  own before the text ("too wide, text too close"); the photos are dealt
  so the Pathology test wears the red micrograph and Other Report the
  celery ("for the pathology test use the red pathology image; the other
  report the celery"); and the report drawer's cover wears the same
  photograph as the report's thumbnail ("on the drawer, use the visual
  from the thumbnail on the cover") -- `.rsArt.hasImg`, cover, the drawing
  off.

- **"Other Report" is "Nutritional review"** ("here you can put a
  nutritional review") -- the placeholder that wears the celery, r3 in
  RECS; a label, nothing keyed on it.

- **The Visual header fills the card.** A card stretched to its column or
  its row used to leave the gap under the text; the header is `flex:1 1
  auto` now (min 200 on the desk, 16:10 as the base elsewhere) so the
  stretch goes into the image, and the lines sit at the foot with 8px more
  above and below them (eyebrow 26 up, card 30 down) -- "use the full
  height of the image; the footer on the bottom with +8px top and bottom
  padding". Desk past two: 342 card, 228 image; the footer's 30 measured.

- **The documents card became two** ("split that into two cards: left, My
  documents with the number 47; right, New document with the Upload
  document CTA, moved up from the bottom"): `.rcDocRow`, side by side
  under the stack. The left is a button -- eyebrow and a 40px **47**, the
  design's figure -- that scrolls to the records; the right carries the
  `.mUpload` button, and the records header's own Upload steps back while
  the Visual layout is showing (`body.repVisual .dash .mMedsHead
  .mUpload{display:none}`). Both hug at 89px; the column and the main card
  follow. (Superseded in 5.324: the two cards left the column for the
  records section.)

- **142.** `BIO_SETS.*.total` is 142 (was 110) and so are the two static
  "Biomarkers 142" readings in the desk markup; the three readings stay as
  the design drew them, so the meter's green share is now 80/142. The
  filter chips still count the rows (110 distinct), as they always did.

### 5.324 The document cards move above Medical records

"Just above the medical record, you can put the two cards (My Documents
and Upload New Document) next to each other, in the same card style as
the biomarker card. Use the same bento gap between cards as the biomarker
bento, and the same rounded corners. Add more padding on the bottom; they
need to be higher."

- **Out of the reports, into the page.** The two cards are no longer built
  by `buildRepCards` into the Visual layout's right column; they are static
  markup, `.docRow` with two `.docCard`s, standing first inside both records
  sections (`#dMedsWrap` on the desk, `#mMedsWrap` on the phone), just above
  the *Medical records* header. Being the page's own markup rather than a
  layout's, they show in every report style -- Neutral as well as Visual --
  and on both screens, wherever the Reports tab shows its records. The
  header's own Upload button steps back for good (`.docRow + .mMedsHead
  .mUpload{display:none}`): the CTA lives in the New document card.
- **The biomarker bento's frame, per screen.** The desk row is a two-column
  grid at the `.dgrid`'s 16px gap (20 on the tablet, as `.dgrid` goes), and
  its cards take `.dcard.bcard`'s 20px corners, 24px padding, `#252522`
  ground and V5's `.06` wash (`#f4efed` in light). The phone row is at the
  `.mbrowV2`'s 8px gap and its cards take `.msn`'s 22px corners, 22px
  padding and `.04` wash. Measured: desk cards 532×125 at a 16px gap, phone
  169×121 at 8px; radii 20/22.
- **Taller, at the bottom.** Padding is 24/24/36 on the desk and 22/22/34 on
  the phone -- 12px more below than on the other sides -- with the figure 14px
  under its eyebrow and the button 12px under its own. The row takes the 34px
  the header used to stand off the reports by; the header stands 28px under
  the row (24 on the phone).
- **The count is a way down.** *My documents* is a button; a tap scrolls the
  records list itself into view (desk `dMain` 0→821 in the check), where the
  older in-column card scrolled to the header.
- **The Visual column.** With nothing under the stack, the right column in
  the Visual layout at 3+ reports had 81px of ground under the stack's three
  rows (the main card's photo header makes it 314px against the stack's
  233). The stack now grows to the column (`.rcCol > .rcCard{flex:1 1
  auto}`); in Neutral both are 233 and nothing changes.
- Checks: `docrow.js` (both screens; row grid, gap, radius, padding, wash,
  button fits, header Upload hidden, no `.rcDocRow` left), `docs.js`,
  `visual.js` -- no errors.

**Follow-up, same round** -- "these two need to be in the second column,
below the other reports": on the desk, in the cards layout at three or more
reports, the row stands under the *Other reports* stack in the right column
after all -- but it is still the records section's node. `placeDeskDocRow()`
(called from `rebuildRepCards`) moves the one `.docRow` into `.rcCol` when
`CARD_STATE.repCards` and the desk host is `.n4`, and back to just above the
*Medical records* header in every other case (one or two reports, the Bento
and Carousel styles), so the records never lose it; `buildRepCards` parks it
back above the records before it rewrites the host's HTML, or the rewrite
would have dropped it. The block is one bento at the biomarker bento's gap:
16px between the main card and the column (`.dRepCards.n4`), between the
stack and the row, and between the two cards; the row's 34px top margin
only applies above the records. Heights: Neutral 233 + 16 + 125 = 374,
which the main card stretches to; Visual at three reports 173 + 16 + 125 =
314 = the main card. The header's Upload is hidden outright now
(`.mMedsHead .mUpload`), since the row is not always its sibling. The
phone keeps its row above the records. Check: `docrow2.js` -- home of the
row at n4 Neutral/Visual/×5 (column), ×2 and Bento (above records), back to
cards (column), after a tab round-trip; the count card scrolls `dMain`
0→668 from the column; no errors.

**Second follow-up** -- "these two should be below the report card on the
right, in the right column; the left column is only for the latest
report": the screenshot was the desk at one or two reports, where there was
no right column and the row had fallen back above the records. The desk is
two columns at every count now. `buildRepCards` wraps the second report in
`.rcCol` at two, and writes an empty `.rcCol` at one, so `placeDeskDocRow`
has a column to fill whenever the cards layout is showing (its test is
"host has a `.rcCol`", not the shape); the phone's shapes are untouched
(`onPhone` skips the wrapper). The `.rcCol` rules lost their `.n4`
qualifier; `.dash .rcWrap.n1 > .rcCard, .n1 .rcCol, .n2 .rcCol` share the
row at `flex:1 1 0`; the main card's typed heights give way (`.n2 >
.rcBig{height:auto}`, `.n1 > .rcRow{height:auto;min-height:128px}`) so it
stretches to the column; at one report the row is the whole column and
stretches to the card (`.n1 .rcCol > .docRow{flex:1 1 auto}`). The desk
cards wrap's own gap is 16px now too, at every count. Heights: two reports
Neutral 192 + 16 + 125 = 333, Visual 313 + 16 + 125 = 454; one report
Neutral 128, Visual 200 (the photo tile's floor). The one-report Visual row
card is half the page now and its meta line had no room for the inline New
badge (it overlapped "44 biomarkers"), so there it is the corner badge
again. Above-records remains the fallback for Bento and Carousel. Check:
`docrow2.js` at ×1/×2 in both styles, `visual.js`, `docs.js` -- no errors.

### 5.325 Documents On/Off

"Add toggle on/off for this" (the two document cards). A **Documents** row
under Title in the panel's Reports group, `#stDocs`, a two-option select
that `segmentise` renders as a switch like Title's. Off is `body.noDocs`,
kept as `CARD_STATE.docs` and re-emitted by setMode so a tab change or a
version switch keeps it: the `.docRow` is hidden on both screens, the
records header gets its Upload button back (`body.noDocs .mMedsHead
.mUpload{display:inline-block}` over the `.mMedsHead .mUpload{display:none}`
the cards brought in), and the desk's one-report shape drops its empty right
column so the row card is full width again (1080 from 554); the height
overrides that let the main card stretch to the column are gated on
`body:not(.noDocs)`, so at two reports the card goes back to its typed 192.
The handler fires `everlab:repTab` and `resize()` for the hero and the
sidebar. Check: `doctoggle.js` -- desk ×3/×2/×1 Off/On, after a tab
round-trip, phone Off/On; no errors.

### 5.326 The records' filter bar takes the biomarkers' shape (V2.5)

"V2.5 -- add filter below Medical records", with the biomarkers' bar as the
picture: the record select on the left, the search on the right.

- **Two rows, as the biomarkers' block.** The desk's `#dMedBar` is a column
  now: `.dMedRow` -- a `.dRecWrap` select (`#dMedRecSel`, same markup as
  `#dRecSel` so the one stylesheet serves both, minus the New dot) and the
  search, both 256×56 at the row's two ends -- then the category chips under
  it, as before. It still pins as one block and its fade still measures off
  the chips.
- **What the select asks.** The biomarkers' select chooses a report; the
  records list has no report to choose, so its select asks the list's own
  second question -- which provider's records: *All records*, *COMRAD / PRP
  Diagnostic Imaging* (4 records), *Everlab Pathology* (2 records), from
  `MED_SRCS`, counted off MEDS. Each MEDS group carries its provider key `s`,
  stamped on its rows as `data-s`.
- **`bioFilter` learned a second option set.** `cfg.recs` (default RECS) is
  what the rec block lists and `choose` looks up; `cfg.recKey` (default: the
  `data-r` stamp match the biomarkers use) is how a row is judged against the
  chosen record. The desk records filter passes MED_SRCS and `row.dataset.s`;
  the biomarkers' two filters and the phone's records filter pass nothing
  and behave as before (27 options on the desk's report menu, all six phone
  groups). A provider and a chip cut together -- Everlab + Imaging shows the
  empty line -- and the cross returns to All records.
- Check: `medbar.js` -- geometry, menu (440 wide, three options with their
  counts), Everlab → 2 groups with the label and "2 records" on the button,
  chip on top, clear, the biomarkers' menu, the phone; no errors.

### 5.327 The upload card: a question and a link

"Got a record from your provider? (small grey) / Upload records + upload
icon (link)". The New document card's eyebrow and pill are gone; in their
place `.docAsk` -- the question at 13px in the eyebrow's grey, wrapping to
two lines on the phone -- and `.docLink`, a bare button: *Upload records* at
15px medium with a 16px upload glyph (arrow out of a tray) after it, a soft
underline that firms on hover, 14px under the question. Both copies of the
card (desk `#dMedsWrap`, phone `#mMedsWrap`) carry it; the card keeps the
`rcUpBtn` class so nothing that looks for the control changes. Heights hold
at 125 (desk) / 122 (phone) against My documents. Check: `uplink.js` -- both
screens, text, sizes, colour, no pill or eyebrow left, link fits the card.

**Follow-up** -- "centered vertical / horizontal": the question and the link
are centred on both axes of the card (`.docCard.docUpload{justify-content:
center;align-items:center;text-align:center}`), with the bottom padding
pulled level with the top (22/24) so the centre is the card's. Measured 0px
off on both axes.

### 5.328 The Categories chip; Visual as the default Layout

"Add a chip (1st): Categories, 'All categories' -- Genetics, ..., ..." and,
of the Layout tweak, "as default".

- **The chip.** First on the biomarkers' chip row on both screens
  (`#dCatChip`, `#mCatChip`): a chip like the others with a chevron in the
  dot's place, reading *All categories*. Behind it a menu of the list's
  groups -- the seven PANEL titles, Liver Health through Inflammation; there
  is no Genetics group in the data, so none is offered -- plus *All
  categories* first. Choosing one names it on the chip, lights the chip as a
  chosen range chip is lit, filters the list to that group and re-counts the
  range chips for it (Heart Health: 20 / 10 / 4 / 4 / 2), through the same
  380ms beat. A range chip on top narrows further (Heart Health + Out of
  range: 4 rows). Both lists stamp `data-cat` (`catKey(title)`) on their
  groups; `bioFilter` takes `cfg.cat` and judges a row by its group's stamp.
- **Where the menu hangs.** The chip row scrolls sideways and would clip a
  menu inside it, so the menu (`.catMenu`, the record menu's plate at 300px)
  is the row wrapper's child (`.dRow2`/`.msRow2` are `position:relative`),
  placed under the chip by measurement on open -- or ABOVE it when the chip
  sits low in the viewport and the menu would run off the bottom (`.up`,
  arriving from below), which is the desk's case at first load. It opens on
  its own `.open` class, not `body.mRecOn`, which would light the record
  menus too.
- **Visual as default.** `CARD_STATE.repVisual: true` and the Layout
  select's `selected` on Visual -- the two say the same thing, as with the
  other defaults.
- Check: `catchip.js` -- chip first on both screens, menu options, Heart
  Health on the desk and Thyroid on the phone (chips re-counted, one group
  shown), a range chip on top, reset to All, the desk menu opening upward and
  in view, the upload card's centring; `stRepStyle` reads visual and the body
  wears repVisual at load; no errors.

### 5.329 Service requests in the records menu; the menus' All row and hover; the section i

Five asks in one round.

- **The records menu lists service requests, not providers** ("list a few
  examples of service requests in the dropdown: Title, NEW, X records,
  Date"). Each MEDS group is one request now, named by `sr` and keyed by `s`
  (`sr1`…`sr6`): *Full blood & tumour markers* (New, 4 records, 24 Sep 2025),
  *DEXA & body composition*, *Travel vaccinations*, *Liver, iron & thyroid
  panel*, *Cardiac CT & calcium score*, *Lipid & glucose check*. The option
  builder took two more fields: `isNew` (an option's own badge, `.mRecNew
  .always`, shown whatever the New results notice is doing) and `nText` (the
  pill's own words, "4 records", in place of the chart glyph and a count).
- **No provider line while a request is chosen** ("when the filter is
  active, no need for the subtitle below the grouping"): `applyFilter` marks
  the list `recChosen` when a record other than a range is chosen, and
  `.mMedList.recChosen .mMedTop .src` hides. The biomarkers' list wears the
  class too and nothing there answers to it. The chips' tally also went
  through `recHit`, so they count the chosen request (the screenshot's 0 / 0
  / 0 was the old `data-r` test against a key it could not match).
- **All records carries a count and a span** ("add number badge right side,
  date as well below, full date range"): on both menus the All row gets the
  pill -- every row the list has, counted by the menu (110 readings; "20
  records") -- and a second line: `2011 – 2026` on the biomarkers' (RECS
  `sub`, as Historical has), `Jun 2024 – Sep 2025` on the records' (`MED_SPAN`,
  oldest to newest request, month and year).
- **Hover on the menu rows** ("following the pattern that bleeds outside the
  container"): the selected plate at a whisper (`.045`), on `@media
  (hover:hover)`; the hairlines run 12px in from the plate's edges so the
  plate stands 12px outside the text on both sides, as the organ list's pill
  stands outside its column; the hairlines either side of the hovered row go,
  as they do for the chosen one. Measured: plate at 378, text at 390.
- **The i beside both section titles** ("opens a bottom sheet on mobile, a
  modal on desktop"): `button.inf.secInf` -- the panel's own i, made a
  button -- after *Everlab reports* (desk `.secHead`, the phone's V2.5
  `.rcHeroHead` and V3 host) and *Medical records* (both `.mMedsHead h3`).
  `infoSheet(host, desk)` builds one per surface: the desk's in the
  past-results modal chrome (dim + centred card, 480 wide, fixed to the
  page, fading in) on `body`, the phone's in the phone frame's sheet chrome
  (handle, home bar, slide up). `SEC_INFO` holds the copy, from the brief:
  *Reports written by Everlab from your results. Each one is your data read
  for you: what was found, what it means, and what to do next.* / *The raw
  documents, exactly as they came from your providers: pathology, imaging
  and immunisation records, kept in one place so nothing is lost.* Close on
  the cross, the dim, Escape, or a page change.
- Checks: `medsrc.js` (options with badge, pill and date; sr1 and sr4 chosen
  -- one group, no provider line, chips re-counted; cleared; the biomarkers'
  menu untouched), `secinfo.js` (All rows on both menus, hover plate and
  hairline, both desk i's open and close their modal by Escape and the dim,
  the phone i opens the sheet and the dim closes it); no errors.

### 5.330 The chip asks for the TYPE; the menus' badges

"All types -- Blood, Genetics, Wearables, Imaging, + add 4 more." and
"Historical records: add badge. All badges: lower bg opacity by 50%, height
28px."

- **Types, not groups.** The first chip reads *All types* and its menu
  offers where a reading came from -- Blood, Genetics, Wearables, Imaging,
  Urine, Microbiome, Body composition, Self-reported (`TYPES`) -- rather than
  the group it sits in. A reading is Blood unless `TYPE_OF` names it: Lp(a)
  is Genetics; resting metabolic rate and postprandial glucose Wearables;
  visceral fat index Imaging; the urine ACR Urine; bile acids Microbiome;
  body fat percentage Body composition; waist-to-height Self-reported. Both
  lists stamp `data-type` on their rows (`rowType(name)`); `catHit` reads
  the row's stamp, so a type cuts across groups and empties the ones with
  none of it (Imaging: one row, in Metabolic Health; Genetics: one, in Heart
  Health). The group `data-cat` stamps stay, unused.
- **The badges.** Every range row on a record menu carries the count pill
  now -- Historical records as well as All records, both at every reading
  the list has (110) -- and every pill is 28 tall (was 32) on half the wash
  (`.055`, was `.11`; light `.05`), corners 8.
- Check: `catchip.js` -- the chip's options, Imaging on the desk (1 / 0 / 1 /
  0 / 0), Imaging + Out of range empty, reset, Genetics on the phone, the
  three badges at 28 and `.055`; no errors.

### 5.331 Menu rows 2px apart; a divider after the types chip

"2px gap on all dropdown item lists" -- `.mRecScroll` is a column flex with
`gap:2px`, so every record, request and type menu spaces its rows the
same; the hairline a row draws above itself (`top:-1px`) lands in the gap.
"Small divider between type and all" -- `i.chipDiv`, a 1×20 hairline at
`.14` (light `.16`), centred on the row, between the types chip and the
range chips on both screens; with the row's 8px gaps either side it reads
as two questions on one row. Check: `chipdiv.js` -- 1×20, 8/8, centred;
2px between every pair of rows on the three desk menus; the phone's
divider; no errors.

### 5.332 The group header centres its line

"Centered vertically": with a request chosen the provider line hides and
the group header's title is one line beside a 34px button; the header was
`align-items:flex-start`, so the title sat high with the button centred.
It is `align-items:center` now, in both states -- text and button both 0px
off the header's centre at 63px (two lines) and 60px (one). Check:
`medtop.js`.

### 5.333 Three more requests at the foot of the records

"Colonoscopy, Microbiome test, MRI scan -- put some random records below in
the list." Three MEDS groups after the six, further back in time: a
*Colonoscopy* (Sydney Endoscopy Centre, Nov 2023: report, histopathology,
recall letter), a *Microbiome test* (Microba, Sep 2023: gut profile, stool
culture, dietary recommendations) and an *MRI scan* (I-MED, Mar 2023:
lumbar spine MRI, radiologist summary). A colonoscopy is neither a test nor
a picture, so `MED_CATS` gained *Procedures* (`proc`, a sand dot), which
the chips row, the group headers and the counts take up on their own: 28
All / 14 Pathology / 8 Imaging / 3 Immunisation / 3 Procedures. The menu
lists nine requests and All records spans Mar 2023 – Sep 2025. Check:
`medsrc.js`, `medtail.js`.

### 5.334 The explainers, elaborated

"Elaborate a bit" / "same here": each section's copy is three short
paragraphs now (`SEC_INFO.*.body` is an array; the sheet writes one `<p>`
per entry, 12px apart). Medical records: what they are and where they come
from, with the procedure letters named; that they are kept in one place,
grouped by service request, to find, download or hand on, with the filters
and search pointed at; and the upload. Everlab reports: written by the
clinical team from the results, the reading of the record rather than the
record; what the findings mean and what to do next, latest first; and what
the New badge means and that a report opens in full with its biomarkers.
The desk modal is 480×416 for the records' copy; the phone sheet caps at
80% and its copy scrolls if it must (it does not, at 389px). Check:
`secinfo.js`, `modalshot.js`.

### 5.335 The chip divider, wider

"+8px left and right from divider": `.chipDiv{margin:0 8px}`, so with the
row's own 8px gaps the hairline stands 16px off the chip on either side.
Check: `chipdiv.js` -- 16/16 on both screens.

### 5.336 Real wearable data: an Oura group

"Add real wearable data, e.g. Oura wearables." A ninth PANEL group, *Sleep
& Recovery* -- "what your Oura ring records overnight and through the day,
averaged over the last 30 nights" -- with sixteen of the ring's own
measures in its own units: sleep, readiness and activity scores; total,
deep and REM sleep, efficiency and latency; resting heart rate, HRV,
respiratory rate, SpO2, skin temperature deviation; steps, active calories
and sedentary time (the one out of range). `rowType(name, group)` reads the
group: everything in a `WEARABLE_GROUPS` group is Wearables without being
listed one by one; resting metabolic rate moved to Body composition, since
the ring does not measure it, and postprandial glucose stays a CGM's
Wearables reading. The list is 126 readings now (79 / 24 / 13 / 10), and
Wearables shows 17 across two groups (12 / 4 / 1 / 0). The hero's 142 is
untouched -- it is the account's figure, not the panel's count. Check:
`wear.js` -- both screens.

### 5.337 Every New badge in one amber

"All New badges this colour: 332910 bg, FFE29F fg." The report card's
corner and inline badge (`.rcNew`), the bento row's (`.rbNew`), the
hero-rows sheet's (`.arNew`) and both menus' (`.mRecOpt .mRecNew`, which
was blue) are `#332910` on `#ffe29f` now, in both modes -- they had no
light variants and need none. The New card's corner halo follows: the
badge's amber at a whisper (`.16` dark, `.34` light) in place of the orange.
The Reports tab's "1" is a count, not a New badge, and keeps its orange.
Check: `newbadge.js` -- card (both dresses), bento, records menu, report
menu all `rgb(51,41,16)` / `rgb(255,226,159)`; the halo's gradient.

### 5.338 Every type has its readings

"Make sure all types have appropriate, realistic biomarkers, min 10." Six
more PANEL groups, one per source: *Genetics* (13: APOE e3/e4, MTHFR,
Factor V Leiden, LPA and PCSK9 variants, 9p21, TCF7L2, FTO, CYP2C19 and
SLCO1B1 metaboliser status, HLA-B27, a polygenic CAD score), *Imaging* (12:
calcium score, carotid IMT and plaque, LVEF, aortic root, epicardial fat,
liver fat and stiffness, DEXA visceral fat, spine and femoral T-scores, a
thyroid nodule), *Urine* (12: ACR, PCR, pH, specific gravity, the dipstick
panel, sodium, creatinine, iodine), *Gut Microbiome* (12: Shannon
diversity, F/B ratio, four genera, butyrate capacity, calprotectin, sIgA,
zonulin, elastase, occult blood), *Body Composition* (12: fat %, lean and
muscle mass, visceral fat index, A/G ratio, ALMI, bone mass, water, BMI,
waist, waist-to-height, RMR -- the four body readings left Metabolic Health
for it) and *Lifestyle & Self-reported* (13: exercise, strength, alcohol,
smoking, caffeine, produce, diet score, sleep quality, PSS-10, PHQ-9,
sitting, water, family history). `GROUP_TYPE` maps a group to its source;
`TYPE_OF` keeps the four strays. Per type: Blood 102, Wearables 17,
Genetics 14, Microbiome 13, Urine 13, Self-reported 13, Imaging 12, Body
composition 12 -- 196 readings, 14 groups. The categories the V4 brief asks
the results database to filter by are these group titles. Check:
`types10.js`, both screens.

### 5.339 The explainer ends on Upload records

"Add a link to upload records at the end." `SEC_INFO.records.link` renders
as the sheet's last line: *Upload records* with the upload glyph, in the
`.docLink` dress (now unscoped from the upload card so both can wear it).
It closes the sheet and scrolls the upload card into view. Check:
`types10.js`.

### 5.340 The V4 information architecture: Overview | Results

The brief: keep the dress, move the architecture. Two tabs still, renamed;
the Overview keeps the bento and gains the tests; the Results tab keeps
the reports and gains one results database. Built as the default, with an
**IA** row in the panel (V4 / V3) that puts the page back exactly.

- **The tabs.** `applyIA` writes *Overview* / *Results* into the two tabs'
  own text nodes (the count badge is a child and untouched), on both
  screens; V3 writes *Biomarkers* / *Reports* back.
- **Your tests.** `#dTests` under the desk bento, `#mTests` under the
  phone's card row, shown on the Overview under V4 only. `buildTests`
  writes one `.tcard` per MEDS request: its picture (the report art by
  category), a dotted category-and-date eyebrow, the title (a button that
  opens the report drawer/sheet when the request has a `rep`), the readings
  that report produced with their standing (counted off the rows stamped
  with the report -- *44 biomarkers · 29 Optimal · 8 Suboptimal · 4 Out of
  range · 3 Other*), the documents (the Everlab report first when there is
  one), and the clinician's `note` when there is one (three have). Two
  columns on the desk, one on the phone; V5's wash, 20/22px corners.
- **All results.** `#dResHead` / `#mResHead` -- the heading, a segmented
  control *All | Biomarkers | Records* and one search -- stands in the
  Results tab under the reports; `applyIA` moves the biomarker filter block
  and its list in beneath it (a comment holds each node's seat, as Expanded
  Report does), so the records section below is the database's other half.
  The segments are `body.resBio` / `body.resRec` (kept as `CARD_STATE.res`)
  hiding the other half; *All* shows both under small sub-headings. The
  one search writes into both blocks' own fields (hidden under V4) and
  they run their own beats -- "iron" finds two readings and one record.
  Categories = the group titles (the chip), status = the range chips, types
  the second chip, record types the records' chips: the brief's filters,
  all already there. Under V4 the desk document row's fallback home is
  above the database (`docRowHome`).
- Check: `v4ia.js` -- tabs, Overview (bento + 9 cards, filters gone),
  Results (order: reports > head > filters > list > records), the three
  segments, the shared search, IA back to V3 and to V4 again; the phone's
  Overview and Results and its Records segment; no errors.

### 5.341 Each report holds its own readings; the badge is the count

"That make sense?" (an allergy panel showing microbiome readings) and
"the number on the badge should reflect the number of biomarkers in the
list." Two faults in `assignRecords`: it dealt any row to any record, and
its stride could land on one row twice, so a badge of 26 stood over fewer
rows.

- **Panels for the reports** ("review each panel and reflect realistic
  biomarker names"): four more PANEL groups -- *Allergy & Immune Response*
  (16: total and specific IgE, eosinophils, tryptase, ECP), *Hormones*
  (14), *Vitamins & Minerals* (12), *Cardiorespiratory Fitness* (8, a
  Wearables group: VO2 max, max HR, recovery, thresholds, peak power, grip)
  -- and a skin-lesions row in Imaging. 247 readings, 18 groups.
- **`REC_POOL`**: what each report can hold, by the panel it is named for
  -- whole groups (Full blood count → Blood Health, Thyroid panel →
  Thyroid, Allergy panel → Allergy, Gut microbiome test → Gut Microbiome,
  Genetic screening → Genetics + Lp(a)…) or names where a panel is a slice
  of one (Lipid panel → the lipids in Heart Health, Iron studies → the iron
  and red-cell rows, Sleep study → the sleep rows, Cardiac MRI → LVEF,
  aortic root, epicardial fat). The broad panels take the whole blood work.
  Rows carry `data-grp` for it. Declared beside PANEL, above the first
  list that deals (it was below it, and the phone's build hit the TDZ).
- **Exactly n distinct rows**: a stride coprime with the pool's size walks
  it as a permutation, so a record's first n steps are n different rows;
  a record asking for more than its pool is capped, and six counts were
  set to their panels (Lipid 15, Thyroid 10, Bone density 3, Allergy 16,
  Hormone 14, Genetic 14). A row no record reached takes the newest
  compatible record as its DATE DONOR only (`data-rd`), never as a member.
  All 25 badges equal their rows; the allergy panel is 16 allergy rows,
  the microbiome test 8 microbiome rows.

### 5.342 The My documents card goes

"Remove": the count card left the document row on both screens; the
upload card stands alone, full width of its column.

### 5.343 The phone carousel centres; See more on its header

"See more missing top right" -- the phone's reports header carries the
stack's *See more ›* (`.rcMore.arOpen`, into the all-reports sheet), 13px
off the right edge. "Prev and next visible equally and the active card
centered" -- the carousel's padding is 56px both sides and the cards snap
to the centre, so the active card stands in the middle with 49px of each
neighbour showing (was left-aligned with a 96px peek on the right). The
dots and the glide already worked in card steps, so nothing else moved.
Check: `carcenter.js`.

### 5.344 The test cards, stacked

"Manage that stacked": one column on the desk too. A card with the whole
width lies down -- the picture on the left at 260 wide and the card's full
height (200 at least), and on the right two halves side by side
(`.tcMain` 1.25fr: eyebrow, title, the readings' standing, the note;
`.tcSide` 1fr: the documents), 36px apart. The phone's card is unchanged:
picture on top, the two halves stacked, the documents under their
hairline. Nine cards, 200–246 tall. Check: `teststack.js`.

### 5.345 The IA brings its layout; the phone carousel clamps to the edges

"IA V3 should be the 2.5 layout, IA V4 the V4 layout." The IA select sets
the Layout select (`v4` / `v25`) and fires its handler, and the defaults
moved with it: Layout V4, `v25Tab:false, v3Tab:true, v4Tab:true` -- three
tabs (Overview | Results | Insights), the tabs under the bento, the bento on
every tab. Under that layout the phone's Cards row had been laid over the
biomarker hero while its "Everlab reports" header sat below the tabs, so
the row (`#mRepCards`, and its dots after it) joined the V3 moves into
`#mRepCarHost`, in the flow under the header; the 34 phone card rules
that named `#mHeroOrgan` now name `:is(#mHeroOrgan,#mRepCarHost)`. The V3
host's header carries the See more too.

"The first card should be larger and start from the container on the
left" (and the middle ones centred, from 5.343): the row's padding is the
hero's own 13px on both sides and the cards snap to the CENTRE at
`calc(100% - 60px)` wide -- a centre snap that would need a negative
scroll is clamped to 0, so the first card pins to the left inset with 66px
of the next showing, the last pins to the right, and the ones between
stand centred with 36px of each neighbour. The dots, a tapped dot and a
released drag all go through `snapAt(i)` / `idxAt(x)` -- the clamped
centre position of card i and the nearest card to a position -- instead
of card-width multiples. Check: `carcenter.js` (first card at the inset,
card 1 at 48/48, peeks 36/36, See more on the visible header opens the
sheet), `phonev4.js`, `v4ia.js` (IA V3 → two tabs, V4 → three).

### 5.346 The IA row merges into Layout

"IA V3 → merge and replace Layout 2.5": one control. The Layout select's
own handler sets `CARD_STATE.ia4` (V4 and only V4) and runs `applyIA`, so
V4 is Overview | Results with the tests and the one results database, and
V1, V2, V2.5 and V3 are the page as it was. The IA row and its handler are
gone; the default is unchanged (Layout V4). Check: `v4ia.js`, now
switching the Layout to V2.5 and back.

### 5.347 The test card's second shape; the desk tabs above the bento

"Put the doctor note top right of the card. Remove the list of documents.
Footer: Date / Biomarkers / Documents." The desk card's body is a grid of
two columns and two rows: the kind (category alone now), the title and
the readings' standing on the left; the clinician's note in the right
column, top; and across the bottom `.tcFoot`, a hairline with three
figures under small labels -- the date, how many biomarkers (when the test
produced any), how many documents. The document list is gone (the count
stands for it); the "N biomarkers" line went too, since the footer says
it. Cards are 209 tall at their tallest. The phone card stacks the same
three parts.

"Above bento": under the V4 IA the desk's tab strip stays above the bento
rather than moving under it with the V3/V4 layout -- the tabs say which
page this is and the bento is on every page. `v3Mark`'s destination for
the desk tabs answers null under `ia4`, and `v3Layout` reads null as "stay
in the seat". The phone keeps its tabs under the hero, as that layout
draws it. Check: `deskv4.js`, `v4ia.js`.

### 5.348 The design's i; the test card trimmed; See results

- **The i glyph** ("use this SVG for the i icon", `li-new_info.svg`): a
  16px ring with the i drawn in, inlined as the five section buttons'
  content with `fill:currentColor`. The button draws nothing of its own
  now -- `.dash .inf.secInf` / `#phone .inf.secInf` outrank the bordered
  circle the `.inf` class gave it -- and the glyph takes the text's grey,
  white on hover. 16×16, no border, centred on the heading's line.
- **The card, trimmed** ("remove biomarkers, remove the dot colour before
  category"): the eyebrow is the category's word alone and the status line
  under the title is gone; the footer's Biomarkers figure is what the card
  says about its readings.
- **See results** ("bottom right footer: See results → go to the Results
  tab filtering by the test"): a link at the footer's right end, in the
  upload link's dress at the figures' size. It opens the Results tab,
  chooses the test's request in the records half (`everlab:pickMed`, a new
  hook both records filters answer; the phone's records filter took
  `MED_SRCS` and the `data-s` key so it can) and, when the test produced
  a report, that report in the biomarkers half (`everlab:pickRep`: the
  pick without `pickRec`'s change of page) -- All records otherwise, so an
  earlier choice does not hang over it -- sets the segment to All or
  Records to match, and scrolls the database into view. Measured: Full
  blood & tumour markers → 44 readings under *Pathology test* and one
  request group; Travel vaccinations → Records alone, one group, the
  biomarkers back on All records. Check: `infoicon.js`, `seeres.js`.

### 5.349 V4's Results tab: no bento, no Insights; the pill leads the chip row

Four asks on the V4 Results tab.

- **No bento** ("V4: remove bento on Results tab"): `body.ia4.repTab` hides
  the desk grid on every layout, and the phone's hero and card row with it.
  What leaned on the phone's hero straightened up: the body card no longer
  climbs 24px over the hero's foot, the tab strip stands 12px under the
  status bar rather than 14px into the hero, the hero's share button (which
  stands outside the hero in the frame) goes with it, and the cards row's
  dots -- which a hero rule still placed 230px down -- take `top:auto` in
  the V3 host.
- **No Insights** ("remove insights"): `body.ia4 .v2Tab.v4Only` is hidden,
  so V4 is two tabs on both screens, Overview | Results.
- **Biomarkers | Records, no All, in the types chip's place** ("put this
  segmented tab, without All, instead of All types"; "if Biomarkers is
  active show the chips All, Optimal…; if Records, hide the group chips").
  The pill is the phone tab pill's dress -- a 3px pill, 38px segments, the
  chosen one on a .12 ground, 44 tall like the chips -- and `placeResSeg`
  moves it (one node per surface, `#dResSeg` / `#mResSeg`, with the row's
  divider after it) to the head of whichever half's chip row is showing:
  the biomarkers' range chips or the records' type chips. The types chip
  and its divider step back under V4; the sub-headings too, since only one
  half shows. `setRes` knows two values now, `bio` (the default) and `rec`;
  See results lands on Biomarkers for a test with a report, Records
  otherwise. The results head keeps the title and the one search, on the
  title's line on the desk.
- Check: `seg.js` -- the pill first in `.filters` at 44 tall, Biomarkers on,
  range chips showing, records hidden; Records → the pill first in
  `#dMedChips`, type chips showing, biomarkers hidden, placeholder "Search
  records"; back; See results on a report-less test → Records; the phone
  the same, its hero and share button gone, tabs at 70, dots 10px under the
  cards; no errors.

### 5.350 Genetics filed by health area; rows padded; the test carries across; the V2.5 bars agree

- **No Genetics group** ("remove the repeated Genetics heading; group
  genetic results by health area"). The thirteen variants are filed where
  they speak: APOE, the LPA and PCSK9 variants, 9p21 and the polygenic CAD
  score in Heart Health; Factor V Leiden and prothrombin in Blood Health;
  MTHFR, TCF7L2 and FTO in Metabolic Health; the CYP2C19 and SLCO1B1
  metaboliser calls in Liver Health; HLA-B27 in Inflammation. `TYPE_OF`
  keeps every one a Genetics reading, and the Genetic screening report
  deals by TYPE now (`REC_POOL` learned `types`), so choosing it shows its
  14 rows across five health groups and no Genetics heading. 17 groups.
- **Rows padded** ("align vertically text, add padding on the row"): the
  desk's list rows are 18px top and bottom (were 16), the phone's 16 (were
  14); both already centre their cells. Taken as the list rows, there being
  no screenshot -- say if another row was meant.
- **The test carries across** ("V4: when switching to Records, keep the
  test active above"). `bioFilter.choose` reports through `cfg.onChoose`,
  and the four filters write `LAST_PICK.bio` / `.med`; `setRes` then maps
  the biomarkers' report to the request that produced it (`MEDS.rep`) on
  the way to Records, and the request back to its report on the way to
  Biomarkers -- All records when there is no counterpart. DEXA scan →
  *DEXA & body composition*; *Full blood & tumour markers* → Pathology
  test.
- **The V2.5 records bar in the biomarkers bar's structure** ("keep the
  biomarkers' structure for the record filter; consistent spacing, style"):
  the records row stands 22px off its chips as the biomarkers' does (its
  margin was giving 34), and its search says *Search*, as the other does.
  Both selects are 256 wide and both show a second line on All records.
  The records chips have no leading types chip: the chips ARE the record
  types.
- Check: `genrows.js`, `carry.js`.

### 5.351 Wearables by health area; the database loses its titles; the search on the select's row

- **Wearables filed where they speak** ("nonsense: Metabolic Health in
  Wearables"; then the six areas). Postprandial glucose is a blood reading
  again. The ring's two heart readings (resting heart rate, HRV) sit in
  Heart Health, typed Wearables by name; the *Sleep & Recovery* group is
  gone and in its place five groups the brief named, every row a Wearables
  reading: *Sleep* (10: the sleep and readiness scores, total, deep, REM and
  light sleep, efficiency, latency, time awake, regularity), *Activity &
  Movement* (10: the activity score, steps, active minutes, sedentary time,
  active calories, distance, sessions, hourly movement, inactivity alerts,
  stairs), *Fitness* (the VO2 max group renamed, 10 with the ring's VO2
  estimate and a cardio fitness age), *Respiratory Health* (10: rate, SpO2
  and its overnight low, regularity, disturbances, variation, snoring,
  daytime rate, trend, altitude-adjusted) and *Temperature* (10: overnight
  skin temperature, its deviation nightly and over 30 nights, range, peak,
  low, trend, fever alerts, cycle shift, ambient-adjusted). The VO2 reports
  deal from Fitness, the sleep study from Sleep and Respiratory Health.
- **No titles over the database under V4** ("remove Medical records title
  on V4"; "All results title as well"): the pill says which half this is.
  The results head keeps only its 34px place in the flow on the desk and is
  gone on the phone.
- **The search on the select's row** ("search same level as the dropdown
  select All records"): each half's own field is back beside its select
  under V4, and the head's field is hidden -- only one half shows at a
  time, so it is still the one search.
- Check: `types10.js`, `seg.js`, `carry.js`, `v4top.js`.

### 5.352 The upload card's gap; the New badge at the design system's 28

"Reduce gap": the link stands 8px under the question in the upload card
(was 14). "Height 28 as DS component" (the Figma badge: 51 hug × 28): every
New badge -- the report card's corner and inline badge, the bento row's,
the hero-rows sheet's and both menus' -- is 28 tall now, a 13px label on
10px of side padding, 8px corners, the amber unchanged. Check: `upgap.js`
(gap 8), `newbadge.js` (heights).

### 5.353 The latest report is "Diagnostic review"

"Title → Diagnostic review": the first report (`r1`) is *Diagnostic
review* everywhere it is named -- RECS, the two bento cards' static title
(desk and phone), the report cards, the menus, the drawer, the test card's
link. Its readings, date and badge are unchanged. Check: `rename.js`.

### 5.354 One select over both halves; the Visual card's badge and CTA

- **The filter above stays the same one** ("when switching to Records the
  filter above should stay the same one"). Under V4 the biomarkers' record
  select and search are the database's only ones: their row stays up on
  both halves and the records' own row (select and search) is hidden.
  Records hides only the biomarkers' chips and list. Choosing a report
  there drives the records to the request that produced it (`syncMed`, from
  the filter's `onChoose` and on the switch to Records; All records when
  none did), and what is typed in the one search is typed into the records'
  hidden field too. The other direction is gone: the records never choose
  for the biomarkers, so a report with no request behind it is not lost on
  the way back.
- **The same gap and margin on both halves** ("the same gap and margin on
  the filter section across the active tab"): the chips stand 22px under
  the select row on both -- the records' bar brings no padding of its own
  under V4 -- and both chip rows start on the row's left edge (372 on the
  desk). The records' bar pins under the pinned select row (top 46).
- **The Visual card** ("New next to title; need CTA rounded, See report
  right side bottom"): the badge stands beside the title (28 tall, on the
  title's middle), the corner copy hidden as before; the CTA is back in the
  Visual dress as a rounded pill reading *See report*, 34 tall, 22px off the
  card's right and bottom, on the meta line's level, the meta line leaving
  it 150px.
- Check: `oneselect.js` -- desk: Diagnostic review chosen, Records keeps
  the label and shows its one request, "tumour" filters the records, clear
  returns both to All; row-to-chips 22 on both halves; the card's badge and
  CTA; the phone the same, its records bar's own search gone.

### 5.355 Wearables are dated Today

"Date should be Today for wearable biomarkers": the ring reports every
night, so a wearable reading's date is not a record's. `assignRecords`
hands the date stamp `Today` to every row typed Wearables (52 of them, on
both screens) and the records' dates to the rest. Check: `today.js`.

### 5.356 The latest report is "Advanced blood panel"

"Diagnostic review shouldn't be a record. Use Advanced blood panel instead":
a diagnostic review is what the clinician does with the results, not a
record in the list. Report `r1` (the New one, 44 biomarkers) is renamed in
`RECS` and in the two static bento titles, so the Visual card, the bento,
the report select and the phone carousel all read *Advanced blood panel*.
Nothing else changes. Check: `rename.js` (zero leftovers on both screens).

### 5.356a Layout V2.5 is the default again

"Layout V2.5 as default": the Layout select's `selected` moves from V4 to
V2.5 and `CARD_STATE` boots `v25Tab:true, v3Tab:false, v4Tab:false,
ia4:false`. The page opens on Biomarkers | Reports with the old IA (the
filters in their home seats, the results pill parked in the hidden
head); picking V4 in the select still turns the Overview | Results IA on,
and V2.5 turns it back off, with no errors either way. The V4 work is
unchanged, only no longer the door. Check: `v25default.js`.

### 5.357 Two ways in, one menu: Records | Category

"On the dropdown offer 2 ways to filter, by Records or by Category (the
type). Remove the type below and put it inside the dropdown with a tab
inside the dropdown content." The types chip that led the chip row (and its
divider and floating menu) is gone on both screens. The record select's
menu opens on a segmented head, `.mRecTabs` -- Records | Category, the
results pill's shape at the menu's scale -- with a pane under each:
`#dRecList`/`#mRecList` as before, and `#dCatList`/`#mCatList` with All
types and the eight types, each with its counted badge. A tab click keeps
the menu open (`stopPropagation`); the pane that opens is the one holding
the filter, else the one last looked at.

The two are two answers to one question, so they are exclusive: choosing a
type calls `choose('all')` first (letting the record go and marking every
control), then holds the type, names it on the button with the eyebrow
*Category*, and shows the cross; choosing a record clears `catSet` inside
`choose()`; the cross clears both. The chips count what is held either way.
`.mRecScroll[hidden]{display:none}` because the pane's `display:flex`
outranked the attribute -- both lists showed at once on the first build.
Check: `menutabs.js` (Genetics → 14 rows, then Lipid panel → 15 with the
type let go, then clear → 275; phone Wearables → 52).

### 5.358 Report Video tweak

"Add a tweak Report Video: add a player centred on the visual." A Video
select in the Reports tweaks (Off by default) sets `body.repVideo` through
`CARD_STATE.repVideo`. The Visual card's tile carries a `.rcPlay` span
always -- a 64px frosted disc with a play triangle, centred by measurement
(0,0 off the tile's centre), 52px on the row card -- and the class shows
it. `display:block` on its svg, because the tile hides its own drawing's
svg under an image. The tile's click is the play.

### 5.359 Smaller titles, and the Lipid panel is new

"Smaller font for titles, same font size as sub titles": the Visual card's
title is the meta line's 13px on both screens (18 → 13; the phone's carousel
rule carried the same change, or it kept 18). With the title that small the
one-report row card no longer needs the corner badge in the CTA's corner
-- the badge sits beside the title there too, and the corner rule is gone
(it was drawing "New" over "See report").

"Add NEW badge on the Lipid panel on the right col next to the chevron
(left of chevron)": `RECS` r2 carries `isNew: true`, and a stack row writes
`.rbNew.rbNewRow` before its chevron for a flagged report (the menu shows
the same badge for it, as it did for a flagged request). Check:
`menutabs.js` ("badge then chevron").

### 5.360 One report: the upload card at 320

"One report: use max width 320px for the upload card, the other card fill."
`.dash .rcWrap.n1 .rcCol{flex:0 0 320px;max-width:320px}` and the row card
`flex:1 1 auto` -- 744 + 320 across the 1080 row. Check: `onerep.js`.

### 5.361 Menu at 376, tab head at 8, player without a ring

"Dropdown width reduce by 64px": the desk's record menu is 376px (was
440). "Segmented tab 8 corner radius, not full": `.mRecTabs` is 8px with
its buttons at 5 (8 less the 3px inset), no longer a pill. "Player no
border / increase blur bg": the play disc drops its inset ring and blurs
what is behind it at 18px (was 8). Check: `menuw.js`.

### 5.362 One report: thumbnail top right, CTA under the lines

"If one report: put the thumbnail top right following the card padding;
content on the left and the CTA below the content on the left." The desk's
one-report row card is a grid inside its own 22px padding: the eyebrow,
title and meta in the left column, the See report pill under them (static,
16px below the meta, on the card's bottom padding), and a 160x106 tile at
12px radius in the right column, top-aligned -- 22px from the top and the
right. The full-height tile bleeding to the card's edge is gone at this
count; the other shapes keep theirs. The play disc is 44px on this tile.
Check: `onerep2.js` (thumb 22/22 off the corner, CTA 22 from the left,
still centred at 0,0 with Video on).

### 5.363 A document glyph on the records menu's badges

"Put a doc icon instead of 'records'": the records menu's count pills read
"4 records"; they now carry a page glyph (folded corner, two lines, the
chart glyph's 16-box and stroke) with the number -- `DOC` beside `CHART` in
the menu builder, and `MED_SRCS` hands the menu `nDocs` instead of the
sentence. All records draws the same glyph with the row count (28). The
biomarkers' menu keeps its chart glyph. The phone has no request select,
so this is the desk's alone. Check: `docicon.js`.

### 5.364 The phone's records bar is the biomarkers' row

"Same pattern as the biomarkers tab: need the filter dropdown and the
search; search exactly the same pattern as the biomarker search." The
phone's Medical records bar (`#mMedBar`) carried a full-width search field
alone. It is now the biomarkers' `.msRow`: the request select
(`#mMedRecSel`, with its cross and its menu of the nine requests plus All
records, the same MED_SRCS the desk's shows, with the document-glyph
counts) and beside it the search resting as a 56px icon, opening leftward
to half the row on a tap or while it holds text, and closing back to the
icon when let go empty -- `searchOn`/`hasText` on the bar, as on the
biomarkers'. The filter behind it is unchanged (the request select was
already in the config for See results, only without controls). Check:
`medrow.js` (select 278 + icon 56 at rest, 167 + 167 open; DEXA → 4 rows;
clear → 28). Seen on the way: a records search that found nothing said "No
biomarkers match" -- the filter's one hard-coded noun; it takes `noun` now,
and both records lists pass `records`.

### 5.365 Mobile: no upload card, the link in the heading

"Mobile: kill the card. Put the link Upload records + icon on the right
side of the title Medical records." The phone's `.docRow` (the "Got a
record from your provider?" card over the records) is gone, and the
heading's hidden Upload document pill is replaced by the same
`.docLink.rcUpBtn` the card carried -- Upload records with the tray glyph,
14px, at the title's right on the title's line. The heading stands where
the card stood, 42px under the hero (its margin and the body's padding);
its own top margin is 0 on the phone so it does not add to that. The desk
keeps its card.
Check: `headup.js` (no `.docRow` on the phone, link flush right and
centred on the title, desk card still one).

### 5.366 Focus pins the bar, on every search

"For ALL search behaviour: even if the list returns not enough results and
leaves empty space, when focused the filter bar should stick at the top.
Will see a lot of empty space below, but that's ok." Probed all four bars
(`sticky.js`: focus, type a query that leaves little or nothing, read the
bar's top against the scroller's). Two failed and one half-failed:

- **Desk records** had no held height under its bar, so a search that left
  three records shortened the page and the browser clamped the scroll with
  the bar 484px down. `dMedFilter` now holds `#dMeds` a screenful under
  the bar in `afterApply`, as the biomarkers' list is held.
- **Phone records** held nothing while focused either: `holdMed()` gives
  `#mMeds` the biomarkers' `setStick` treatment -- a screen less the bar
  while the field is focused, nothing once it blurs.
- **Phone biomarkers** pinned on focus and then lost it as letters were
  typed: `beforeBeat` measured the pin off the LIST, and from the second
  keystroke on the list was already hidden behind the skeleton, so it
  measured nought at the top of the page and each letter scrolled the bar
  further up (752 → 38 over five letters). It measures off whichever of
  the list and the skeleton is laid out.
- **Desk**, both bars: focusing now runs the scroller up to the bar's stuck
  place (`dPinOnFocus`: the bar's distance below the scroller's top is the
  scroll, and nought when already stuck), so the field is at the top while
  it is typed in, as the phone has always done.
- **Desk biomarkers** came down 9px on every search that found little: in
  `applyFilter` the skeleton was hidden, then `afterApply` measured the
  scroller to hold the list -- and that measurement forced a layout of a
  page with neither skeleton nor held list, which the browser clamped the
  scroll to. `afterApply` now runs before the swap -- the skeleton still
  standing at its held height when the list is measured and held -- and the
  two are swapped in one layout, so nothing is ever measured shorter than a
  screen. (Showing both for a moment was tried first and set off scroll
  anchoring: the scroll flew 659px up when the skeleton went.) The two list
  scrollers also carry `overflow-anchor:none`: the swap is managed, and the
  browser re-anchoring to a moved row only fought it.

### 5.367 Carousel: the resting card lit, the rest faded

"Fade out the inactive card 80%, fade in when active." The phone's report
carousel marks the card at rest `.cur` from the same scroll sync that
lights the dot (`syncDots`, now also stamped on the host as `_syncCar` so
a rebuild can call it: new cards, no scroll event). The CSS fades every
card in the row to opacity .2 and brings `.cur` to 1, over .28s. Read
"80%" as the amount faded, so a fifth remains; one number to change if it
was meant as the opacity left. Check: `carfade.js`.

### 5.368 Badge by the date, title at 17

"NEW badge next to date. Title font size bigger +4px." Where the card's
eyebrow is the date (the phone's carousel, `dateTop`), the inline New
badge is written into the eyebrow after the date, with the eyebrow's small
caps and tracking stopped at the badge; elsewhere it stays beside the
title (the desk's eyebrow is LATEST REPORT). The Visual card's title is
17px (13 + 4) on both screens.

### 5.369 Mobile: the record menus are bottom sheets

"For the dropdown use a bottom sheet (mobile only)." On the phone the two
record menus (`#mRecMenu`, `#mMedRecMenu`) are moved into a sheet built on
the explainers' pattern -- `shWrap` dim, `sheet` with handle, close and
home bar, a title (Filter results / Filter records) -- mounted on `#phone`
at first bind. The menu node itself is the sheet's body (position static,
no plate, no fade of its own; the sheet scrolls), so the tab head, the
panes, the rows and every handler are unchanged; only `open()`/`isOpen()`
in `bioFilter` branch on the sheet. The dim, the X, Escape and a pick
close it. The desk keeps the anchored plate. Check: `recsheet.js`.

### 5.370 The records lists load through a skeleton too

"When data fetch, use skeleton loading same as biomarker to simulate the
loading state." The two records lists (`#dMeds`, `#mMeds`) had no skeleton
in their filter config, so `load()` applied at once. Each now clones the
biomarkers' skeleton at init (`#dMedSkel`, `#mMedSkel`, the same nodes and
classes, seated before the list) and passes it, with a `beforeBeat` that
holds the skeleton at the list's height or a screenful under the bar. The
rules that hide `.dSkel` on the Reports tab and under V4's Records half
exclude the records' own, and V4's Biomarkers half hides it with the list.
The phone's clone drops the skeleton's 13px side padding, which the
section carries. Check: `medskel.js` (skeleton up and list away at 120ms,
list back at 720ms; the pinned bar stays at 0 through the beat).

### 5.371 A chosen request drops the group's date

"When a filter is selected, no need the date below on the group list."
With a request chosen the select above names it and its date, so the date
beside the category in each group header goes with the provider line that
already went: `.mMedList.recChosen .mMedTop .cat em{display:none}`. Both
screens. Check: `medskel.js` (dates 9 → 0 on choosing a request).

### 5.372 A pick pins the bar

"When the user clicks an option, the screen behind should be positioned
with the filter bar fixed at the top, always, so the user can focus on the
results -- the bottom sheet closes and the screen scrolls up to the sticky
bar." `bioFilter` takes `afterPick`, called from the menu's record rows and
the Category pane (All included). The phone's is `pinBar(bar)`: the bar's
flow position less the status strip is the scrollTop, reached with a smooth
scroll under `holdScroll`; the desk's is `dPinBar`, the focus behaviour
shared out. So the page has somewhere to go, the phone's bars now hold a
screenful under themselves while a record or a type is held as well as
while the field is focused -- the list marks `recChosen`/`catChosen` the
moment a pick is made, not after the beat, and `setStick` no longer clears
the skeleton's hold mid-beat (that clamp left the bar 53px short on the
first build). Check: `pickpin.js` (bar at 0 after a pick from the page top,
biomarkers and records, phone and desk).

### 5.373 A chosen request hides the records' chips

"Remove the chips filter when a record is selected above." One request's
records are one category, so with a request chosen the records' chip row
(`#mMedChips`, `#dMedChips`) steps back, marked `recChosen` from
`applyFilter`; the select row keeps the chips' gap to the list. A range
left on a chip would have filtered from out of sight, so a choice resets
the chips to All (`resetChips`, records lists only). Clearing the request
brings the chips back. Check: `pickpin.js` (Imaging chip on, request
picked → chips hidden, All lit, 4 rows; cleared → chips back, 28).

### 5.374 The page ends where the screen does

"Here I shouldn't be able to scroll down more." With the bar pinned over
four records the page still scrolled on: the held height was a screen less
the bar, and the body's padding under the dock (and whatever else follows
the list) came after it. The hold is now the whole geometry -- `holdFor`
on the phone, `dHoldFor` on the desk: from the pinned bar's top to the
page's end (the bar, whatever stands between it and the list -- the empty
line on the biomarkers, the row's 12px gap on the records -- the list, and
everything after the list) must fill exactly one screen, and the list's
hold is what is left over. The bar's place in the flow is read with the
bar set static for one measurement (a stuck bar's rect is where it is
pinned, and Chrome's offsetTop carries the sticky shift too). On the desk
the block sticks 34px above the scroller's edge once `.stuck` (`top:-66px`
over 32px of padding), which `dTuck` reads with the class on and gives
back to the hold and to the pin scroll. `applyFilter` runs `afterApply`
again once the list is laid out, so the measurement is the list's own and
not the skeleton's. Check: `nomore.js` (`left` 0 after a pick or an empty
search on every list, a push scrolls nowhere; the one list longer than a
screen keeps its own scroll).

### 5.375 Desk: a pick leaves the page where it is

"On desktop no need to stick at the top when a record is selected, keep
the current vertical." The desk's two filters drop their `afterPick`: a
pick from the dropdown filters in place, the scroll untouched. The phone's
sheet pick still scrolls to the pinned bar (5.372), and the desk's focus
still pins (5.366). Check: `pickpin.js` (desk scrollTop unchanged by a
pick).

### 5.376 A chat at the top of the Overview

"On Overview put a chat top centered." Both Overview screens (the desk's
`#dOver`, m9; the phone's `#phone2`, m6) open on `.ovChat`: a 56px pill
(52 on the phone) with the assistant's spark at the left, a field ("Ask
Everlab anything about your health"; the phone's shorter) and a send disc
at the right, over the greeting. The desk holds it to 640px in the middle
of the page (260px each side at 1600); the phone gives it the screen's
width. Focus lights the ring and fills the send disc. Light mode carries
its own colours. Check: `ovchat.js`.

### 5.377 The rail's arrows, 8px right

"Push right by 8px the arrow group CTA." The Overview's "Your next
actions" header carries the rail's prev/next discs at its right, flush
with the rail's edge; they now stand 8px past it (`margin-right:-8px` on
`.dvSec .nav`), so the disc's round edge rather than its box lines up with
the cards below.

### 5.378 The fade only over content

"The gradient on sticky should only occur when the bar overlaps the
content, not when the sticky is at position 0." `.stuck` -- which turns
on the fade under the desk's blocks (`dStick`) and the phone's bars
(`setStuck`) -- meant "the bar has reached the top". With the page resting
at the pin that is true while the list starts exactly where the bar ends,
so the fade blended into nothing and greyed the first group header. It
now means "content is passing under the bar": the first laid-out thing
after the bar has its top above the bar's bottom. At the pin, off; a pixel
further, on. Check: `fadeover.js`.

### 5.379 The phone dock goes where it says

"Nav should redirect to the corresponding page." The dock's tabs only
moved their own highlight. Overview now opens the Overview phone (m6) and
Insights the Insights phone (m20), through `setMode`, from either screen;
each screen's own dock lights the tab it IS. Plan, Services and More have
no screen in the prototype, so a tap on them does nothing and the lit tab
keeps saying where the reader is. The assistant's spark is unchanged.

### 5.380 The spark grows into the assistant's sheet

"On click the star button, the button should expand to be a large card +
open the keyboard. We need this entry point for Everlab services in this
card as bento." Then, against an Oura capture: "same pattern as this for
the bottom star CTA -- a card that overlaps the bottom of the screen; the
field placed first in the card, then the list of services below; on field
click the list of services disappears and the keyboard appears" -- and
"actually the star button should expand to a card, so a morph effect
would be nice." So `aiSheet`, per phone: a dim and a sheet over the foot
of the screen (`.aiCard`: rounded top, a handle, the Ask Everlab field,
a rule, *Everlab services* as a bento -- Telehealth and Check Symptoms
wide, then Med Certs, Pathology, Treatments -- and the home bar). On tap
the sheet starts as the button (its rect measured, a translate + scale
and a 50% radius) and opens to its place over .46s, the contents fading
in once it has its shape; nothing is focused. Tapping the field folds
the services and the home bar away and raises the frame's keyboard, the
sheet standing on the keys (`typing`); letting the field go empty brings
them back. The Overview phone had no keyboard, so it gets a clone of the
Insights phone's, wired to type into its focused field. Close (dim,
handle, Escape, a page change) shrinks the sheet back to where the button
was. Check: `aisheet.js`.
"Star button not start" came back once: the live artifact carried the
code and a copy of that exact file opened the card under Chromium at
every size, the full-screen entry and a touch tap included, so the page
in hand was a cached older one; republished.

### 5.381 Overview: one title style, the chat under the centred greeting

"Keep all titles the same style, refer to the report page. Put the AI
field below the h1. H1 centred, AI field just below, centred as well,
80% width." The Overview's titles wear the Everlab reports heading's
20 / 500 / -.2 on both screens -- the desk's greeting (`.dvH1`, was 29)
and section heads (`.dvSec`, was 19), the phone's greeting (was 17) and
section heads (`.ovsec`, was 16). The greeting is centred, and the chat
field sits under it at 80% of the content column, centred (the desk's
640px cap is gone). Check: `ovchat.js`.

### 5.382 Ask, then the chat

"On click, the field morphs to a full modal; keyboard appears" -- then,
against a chat-thread capture: "no, that's only the view when the user
clicks the bottom nav icon; the top field should merge smoothly to a full
modal" -- then: "on field tap, keyboard appears; can type, and when
submitted, overlapped by the full chat experience." So, on both phones
(`chatModal`, one chat each, `ph._chat.open(from, question)`):

- The Overview's pill under the greeting: a tap raises the frame's
  keyboard and the words go into the pill; Enter, the send disc or the
  keyboard's search key (now `everlab:go` from every drawn keyboard, then
  the blur) hands them to the chat.
- The assistant sheet's field (5.380): the same -- typing folds the
  services away; submit opens the chat over the sheet and the sheet steps
  away under it.
- The chat grows out of the field it came from (translate + scale from its
  rect, pill radius to none, .5s) into a full screen under the status
  strip, standing on the keyboard: a head (menu, the question as title --
  *Protein intake* for the default --, more, close), the thread (the
  question in a bubble with its time and copy/edit, *Thinking · Looking at
  your records* pulsing, then Eva's three paragraphs streaming in word by
  word after a 900ms beat -- the protein answer whatever was asked, this
  being a prototype), and the composer (*Ask Eva …*, +, *Eva ⌄*, send)
  focused so the keyboard stays up. Close shrinks it back into the field.

Check: `chat.js` (pill tap → keyboard only; typed "hi" → search key →
chat with "hi" in the bubble, 105 words streamed; the sheet's field → Enter
→ chat, sheet gone).

### 5.383 The sheet folds on the keyboard's own time

"Need a better transition when the keyboard appears here: the service
section fades out, the keyboard appears while the card height adjusts to
hug the content." The services (and the home bar under them) sit in a
one-row grid whose row runs from 1fr to 0fr -- an auto height that
animates -- fading on the way, and the card's ride onto the keys
(`bottom`, `padding-bottom`) runs on the keyboard's own .32s curve. Traced
after a tap: card 414 → 153 → 108 → 103px over 300ms as the keys rise
(807 → 594 → 557 → 553), and back the same way on blur. Before, the
services went in one frame and the card jumped.

### 5.384 A cross beside the sheet's field, and no ring on it

"Add a cross top right next to the AI field to dismiss the card and go
back to the initial screen. Also remove the border on the AI field." The
sheet's field row is the field and, beside it, a 56px disc with a cross
(`.aiX`) that runs the close -- the card shrinks back into the star,
keyboard down if it was up. The card's field drops its inset ring at rest
and under focus (the plate alone, a shade brighter when focused); the
Overview's pill keeps its ring, being a field on the page rather than in a
card.

### 5.385 The Overview phone gets a top bar

"Top nav fixed on scroll (blur bg + light gradient): profile avatar circle,
AI field filling the container (full rounded, no border, no submit arrow),
bell icon (circle, blurred #fff at 4%). Below, in the body, the h1." The
Overview phone's greeting stops being the sticky pill. A 60px bar (`.ovTop`)
rides the top of the scroller: a 40px profile disc at the left (a warm
gradient and a figure at first; then the photo Julien sent,
`assets/overview/avatar.png`, inlined by the build like every other asset),
the assistant's field filling the middle at 44px with no
ring and no send disc, and a 40px bell on a 4% white plate at the right. It
is sticky at 0 with an 18px blur and a faint white gradient over a 55% dark
plate, so the page passes under it; the assistant sheet's dim still covers
it (`#phone2.aiOpen`). "Welcome back, Julien" is now the page's heading in
the body, 14px under the bar, centred, at the report page's 20/500. A tap on
the field still raises only the keyboard; the search key still grows the
chat thread out of the field.

### 5.386 One group at the top, fading into the page; the greeting at 24

"Status bar transparent. Status and top bar in one group. Progressive
black gradient + blur on the background." And: "H1 medium, +6px, 24px."
The Overview phone's status strip goes transparent and floats over the
scroller, which now starts at the top edge of the screen; the bar pads
itself by the strip's measured height (`--stH`), so hour, battery, avatar,
field and bell sit on one ground. That ground is a pseudo behind the bar
running 28px past its foot: black at .96 fading to nothing, with the blur
masked away along the same run, so the page dissolves into the group rather
than meeting a plate's bottom line. The greeting goes to 24/500, -.3.

Then, from a capture of the hero's copy reading through the field: "field
AI needs blur 64px bg." The field carries its own 64px backdrop blur, so
whatever scrolls behind it is a wash rather than words. And "avatar and
bell should follow the field's height, 56px": the field goes to 56 and the
two discs with it.

### 5.387 The top field, live

"On the field in the top bar: push the avatar off the screen to the left,
extend the field left, replace the bell with a dismiss." While the top
field has focus (`#phone2.ovTyping`) the avatar rides off the left edge on
a negative margin -- its width and the gap, 66px -- and fades as it goes,
so the field grows into its room on the same curve and lands on the bar's
own 13px padding, level with the dismiss on the right. The
bell's glyph turns a quarter and fades into a cross; a press on it while
the field is live clears and blurs the field (on pointerdown, with the
default prevented, so the blur does not land first and turn it back into a
bell), which drops the keyboard and brings the avatar back.

"The AI field doesn't have enough blur." The field's own 64px blur was
there, but the group's ground under it faded from 55% of its height, so the
lower half of the field stood on half a blur and a .6 plate, and the hero's
copy read through. The ground is now solid (.92) and fully blurred (24px)
down to the field's foot; only the last 40px fade -- the bar's bottom
padding and the 28px run past it.

"Overlay with a 25% black blanket when the field is focused." While the
top field is live a blanket (`.ovDim`, 25% black) lies over the page: under
the bar and the keys, over the scroller and the dock, fading in over .28s.
A tap on it lets the field go, which lifts the blanket with the keyboard.

"Julien, same font weight as the rest." The name in the greeting was 400
against the greeting's 500; it keeps its grey and takes the weight. Then
"align left" and "+8px margin top": the greeting sits on the cards' 13px
column, 22px under the bar instead of 14.

### 5.388 The bento, restyled

"Bento, this style" -- a capture of three grey slabs with big corners, a
bare glyph top-left and a two-line label under it, left. The sheet's tiles
take it: 24px corners, an 8% white plate, 16px padding, the glyph 26px in
the page's ink with no disc and no accent, the label 15/400 on up to two
lines at the foot. Icon and label sit at the tile's two ends
(`justify-content:space-between`) on a 120px minimum, so every tile in a
row shares the glyph line and the baseline. The 3/6 + 2/6 spans stay: two
wide tiles, then three.

"Put the dismiss cross outside, above the card." The cross leaves the
field's row -- the field has the row to itself again -- and floats 16px
above the card's top-right corner, a 48px disc of 14% white on the dim
with a little blur. It stays the card's child, so it rides up with the
card onto the keyboard and stays put through the fold; it fades in .2s
after the card lands so it never shows scaled inside the morph.

### 5.389 The chat cuts in

"On submit I want a full-screen modal over the page with the full chat, no
fancy transition." The thread used to grow out of the field on a
half-second morph, the pill's radius unrolling as it went. Now it is a cut:
the modal is there on submit and gone on the cross, no transform, no
radius, no fade. It fills the screen: on the Overview phone, where the
status strip floats, the modal runs up behind the strip and pads its body
by the strip's height; on the Insights phone, where the strip is in the
flow, it starts under it as before. It still stands on the keyboard.

"It should just fade in over the current screen, no movement entrance."
So not a hard cut: the modal fades from 0 to 1 over .22s where it stands,
full size from the first frame, and fades out the same way on the cross.
The wrap is shown and laid out at 0 before `on` lands, or the two would
resolve in one style pass and there would be nothing to fade from.

"The black gradient should stop at 75% of the height." The top group's
ground and its blur mask hold to 75% of the pseudo's height and fade to
nothing over the last quarter, in place of the fixed 40px tail.

"There is a weird circular transition when the full chat appears." Not the
chat's: the screen under the fade was still moving. The chat's composer
takes the focus the moment it opens, and the field that had it lets go --
on the Overview the avatar slid back in and the cross turned a quarter into
the bell, on the sheet the services unfolded and then the whole sheet
vanished at frame 0 -- all of it showing through a modal at .2 opacity. Now
whatever is under the chat holds still until the chat is opaque: the bar
keeps its live state for 300ms after a blur that the chat caused, and the
sheet marks a `handoff` on submit, ignores the blur, and is removed without
animation at 300ms.

Then a capture of the sheet with the orange icon discs and the "EVERLAB
SERVICES" eyebrow -- the bento from before 5.388 -- alongside "still a weird
circular transition": the page being looked at is a cached copy, and the
circle is the old pill morph. Noted to Julien; a hard refresh brings the
current build.

### 5.390 The sheet, lighter

"No arrow CTA if not focused. Remove the divider. Title 'Services', not
full caps. Cards lighter, like the example." The sheet's send disc shows
only while its field is live (it scales in from .6 on focus and goes on
blur; through the hand-off to the chat it holds its live look so nothing
moves under the fade). The rule above the services is gone, the title is
"Services" at 15/500 in a soft grey with 20px of air above it, and the
tiles go from 8% to 10% white, a shade lighter, with the hover following.

"Height of the component 44px." The Overview top bar's row comes down from
56 to 44: the field, the avatar and the bell alike, the bell's glyph to 20,
and the avatar's ride off the left edge to 54px (its width and the gap).
"Cross CTA 44px": the sheet's floating dismiss comes down from 48 to 44,
still 16 above the card. "Card #fff 4% opacity": the tiles settle at 4%
white (hover 8%) -- the lighter look of 5.390 was the stale page talking.
"+8px padding, cards": the tiles pad 24 (16 at the right, for a two-line
label's sake) instead of 16.

### 5.391 The chat keeps its keys; the sheet loses its handle

"The full chat should always have the keyboard, even unfocused." The keys
came and went with the composer's focus, so a tap anywhere in the thread
dropped them and the composer fell to the foot. Now the phone carries
`chatOn` while the chat is open and the keyboard stands regardless; with
nothing focused the keys type into the composer (`ph._kbdTarget`), on the
frame's own keyboard and on the copies alike.

"Remove the notch swipe-down indicator, then reduce the padding." The
sheet's handle is gone -- the dim, the cross and the star's own close are
the ways out -- and the card opens with 16px of air above the field instead
of the handle's 10 + 5 + 16.

### 5.392 Suggestions under the live field; the services, mini, on Overview

"When the chat is focused we should suggest some chips under the field, in
the context of the page behind, e.g. show latest results." The sheet gets
a row of chips (`.aiChips`) that is folded while the services show and
opens as they fold, on the same curve: a grey "Suggestions" label with a
spark, then one line of outlined 44px pills (a hairline at 18% white, no
fill, 15/400) scrolling sideways -- from Julien's capture of the pattern. The Insights phone offers its biomarkers -- latest
results, what is out of range, biological age, trends since the last test;
the Overview its plan -- latest results, next step, review my plan, book a
consult. A chip is the question asked: on pointerdown, so the field keeps
its focus through the hand-off, the words go into the field and submit.

"Put the services below the h1 on Overview, in a mini way." The same five
services under the greeting (`.ovSvc`), first as a sideways row of pills,
then -- "this bento, 2x per row" -- as a two-column grid of 48px pills at 6%
white, the glyph at 20 and the label at 14/500, the fifth taking the last
row alone. The greeting gives up 2px of its bottom padding to them.

"Add a bento icon when the chat field is focused; on click, back to the
initial card with chat and bento." A 56px disc with a four-square glyph
grows in beside the sheet's live field (width and gap from 0, on the fold's
curve) and, pressed, lets the field go: the keys drop, the suggestions fold
and the services unfold, the card as it first opened.

"Remove the Suggestions title. Fade out on the right side." The label and
its spark go; the chips start straight under the field, and the row is
masked over its last 56px so the pills run out under the card's edge in a
fade rather than a cut. "Border opacity 4%": the pills' hairline drops from
18% to 4% white.

"If nothing is typed, remove the arrow." The sheet field's send disc now
waits for words as well as focus: the field marks `hasText` on input and
the disc scales in on the first character, out again when the last goes;
it is cleared after the hand-off so the next open starts clean.

"Black gradient, reduce opacity 50%." The Overview top group's ground goes
from .96/.92 to .48/.46, the 24px blur doing more of the separating; the
75% stop and the fade over the last quarter stay.

"The carousel should go to the edge of the viewport, not stop on the
container; fade out on the right side." The chips' folding block was
clipping the row at the card's padding, so the row's negative margins never
reached the edge. The block itself is now card-wide (its own -16px
margins) and the row pads 16 inside it, so the pills run under the card's
right edge and the mask fades them over the last 64px there.

"Regular font": the Overview's mini service pills drop from 500 to 400.
"Bg opacity 2%, cards": their plate goes from 6% to 2% white (hover 6%).
"Title +12px after": the greeting's bottom padding goes from 14 to 26, so
the bento sits 26 under it. "Blanket on chat focus, +24% opacity": the
Overview's blanket under the live field goes from 25% to 49% black.

"The arrow submit should go to the full chat modal." It was wired on click,
and a press on the disc blurred the field first: the disc hid with the
blur (it shows only while the field is live), and the click that followed
had nothing to land on. It submits on pointerdown now, with the default
prevented, so the field keeps its focus and the words go to the chat.

### 5.393 The top bar without the avatar

"Remove the avatar and fit with that" -- a capture: the field at the left
filling the row, then two discs, an inbox tray with an orange dot and the
bell. The avatar and its photo leave the bar; the field starts on the
bar's 13px padding and runs to the discs. The inbox (`.ovInbox`) is the
bell's twin, 44px on 4% white, a tray glyph with the accent's 8px dot at
its shoulder. When the field goes live the inbox folds away -- width and
gap to 0, on the fold's curve -- so the field grows to the right, and the
bell turns into the dismiss as before.

### 5.394 Header V2, a tweak

"Tweak header v2: put a card below the h1 -- Inbox, Services." A new
Overview group in the Tweaks panel with a Header select, V1 (the default)
or V2, carried as `CARD_STATE.hdrV2` / `body.hdrV2` like the other
switches. In V2 a card (`.ovHub`, 4% white, 22px corners) sits under the
greeting with two 52px rows: Inbox, its tray glyph, an accent count pill
(3) and a chevron; and Services, the bento glyph and a chevron, which opens
the assistant sheet. The top bar gives up its inbox disc and the mini
bento stands down -- the card holds both now. V1 is untouched.

### 5.395 The booking card; the sheet floats

"Replace by this card instead of Personalised Health" -- a capture: a dark
card, a soft-focus clinic scene at the right, a "Next step" pill, "Your
health journey starts here. Book your consultation now." with the first
sentence dimmed, and at the foot "Next availability / Tomorrow 8:00am" on
the left and a white Book button on the right. The Overview's hero takes
that shape (`.ovhero.ovBook`, 250px min). The photo is not in the repo, so
the scene is drawn: three blurred radial washes (a warm wall, a dark
figure, a low shelf) fading in from the right over the card's near-black.
Drop a photo into assets/overview and it can sit under the same text.

"Put a 12px gap so the card feels more like floating." The assistant sheet
stands 12px off the left, right and bottom edges with all four corners at
26, its drawn home bar gone (the phone's own shows under it); on the keys
it keeps the 12px float above them.

### 5.396 Five Explore cards in the next-actions row

"Add more of these cards" -- a sheet of five: "We have some insights from
*documentname*", from a questionnaire, an item, a device, and "we are
syncing with your device", each with a stacked-sheets illustration and See
insights. The Overview's carousel gets the five after the News card, built
in `ovExplore()` from one family of parts: two stacked sheets (the back one
turned 7deg, the front -6) and, on the front sheet, the thing itself -- a
red image block over text lines, a checklist with the first box lit, plain
text, a device face with bars and a trace, and the same face dimmed with a
turning spark for the sync. The sources are real ones from the concept:
the Advanced blood panel, the Health questionnaire, the Dexa report, the
Oura ring, the Apple Watch (syncing, its button dimmed). The dots now
count the cards and the lit one follows the scroll; the dismiss on an
Explore card takes it out of the row and the dots shrink with it.

### 5.397 The age card: a carousel of particle organs

"Keep the neutral grey card. A mini 3D particle organ here, the bio age
one. The arc as on the tablet. Eyebrow, organ, age, arc. Carousel.
Centred." The Overview's right mini card drops its red and joins its
neighbour's grey, and becomes a snapping carousel (`ovAgeCard()`): the
biological age first -- the body, from the library at the small target --
then three organ ages, each slide centred: the eyebrow, a 92px particle
organ, the age (chronological plus the organ's delta, as everywhere else)
and the tablet's own tick arc (`ageArcMarkup`) with its dot. Small dots
under the row follow the scroll; the two cards in the row now stretch to
the same height.

### 5.398 Next actions: the five Explore cards, with the rendered icons

"Replace the next actions section by these, and include the icons." The
organ-age card and the News card leave the row; the five Explore cards are
the row. The icons are Julien's renders -- the report with its red image
block, the checklist with one red tick, the blood tube with its red cap,
the watch with its red trace, the spinner of dots turning from grey to red
-- cropped from the strip and keyed off their black ground (alpha from
luminance: black to nothing, the dark plates whole, the glows half), so
they sit on the card's grey. They live in assets/overview and the build
inlines them like everything else. The tube is the blood panel now, the
watch the Apple Watch, the spinner the syncing Oura ring; the SVG sheets
of 5.396 stay in the code as the fallback family. (The paths are written
out one by one: the build inlines an asset only where it can read its path
in the source, and a path built from pieces at run time slipped past it.)

### 5.399 The inbox sheet

"The inbox icon should trigger a bottom sheet" -- a capture of the sheet:
Inbox and a close, Unread with its count and See all, three messages with
avatars, times and unread dots, then Explore more as chips. Built as
`inboxSheet()` on the Overview phone, a floating card like the
assistant's, sliding up over a dim from the top bar's inbox disc and from
Header V2's Inbox row alike. Dr. Steven Lu (initials on a cool plate, the
photo not being in the repo), Eva with a Suggested tag and her spark, and
a Prescription that requires input in the accent; the unread dots in the
capture's blue. Explore more: two chips, latest results and plan progress.
The dim covers the top bar (`#phone2.ibOpen`), and the cross, the dim and
Escape close it.

"Hero card bg" -- the clinic photo, sent as a zip. It replaces the drawn
scene on the booking card: `assets/overview/hero-consult.webp` (720 wide,
soft and dark at its left already), anchored right where the figure is,
covering the card. The card stays dark on the light page: it is a picture
now, not a plate.

### 5.400 Health coverage in the left slot

"Health coverage card instead here." The Overview's left mini card, which
read Health insights 75 / Biomarkers, is the Insights phone's coverage
card now: the eyebrow, 64% with a small grey sign, and the dotted dial with
its warning in the middle, centred in the room under the figure so the two
cards in the row match, the dial at 96 to the organ's 92.

### 5.401 Card imagery, the renders

"Card imagery" -- a zip of five 400px renders: the Everlab report, the
clipboard questionnaire with two orange ticks, the blood tube with its red
cap, the watch with its trace, the watch syncing. They are shot on a light
grey (#e3e3e3) with soft shadows baked for it, so keying them onto the dark
card would leave grey shadow blobs; instead each sits in a light tile the
card's width and 200 tall, corners at 18, the image contained and the
tile's grey the image's own, so the tile reads as the picture's ground.
They replace the keyed icons of 5.398 (`assets/overview/card-*.webp`; the
keyed set is gone).

"Need to be able to swipe as a carousel, same behaviour as all carousels
on this project." The Explore row takes the report carousel's rules
(5.31x, buildRepCards): cards snap to the centre, the first and last
clamped to the edges; the card at rest is lit and the others fade to .2;
under a finger it scrolls natively, under a mouse it is dragged, snapping
off while the pointer is down and an eased 480ms glide settling it on the
nearest card -- or the next, on a flick past .35px/ms -- when it lets go;
a tapped dot glides to its card; the click after a drag is swallowed, so a
drag never dismisses or opens anything.

### 5.402 The age card takes the Insights arc

"Just use the arc from the Insights page." The tablet's tick arc
(ageArcMarkup) leaves the age card for the hero's own instrument. #arcA is
one live element the pages pass around, so the card gets a still copy
(`arcAMarkup`) drawn by the same geometry -- ptA and AG, the half-year
ticks, the fade to the ends and the stepped end blur -- and painted the way
the frame paints a landed reading: the ticks between the centre and the
organ's age in the age's colour, ramping in over the first 30%, an aligned
organ lighting the centre tick in white, the indicator riding outside the
ticks. No labels, as the phone hero shows it, and the hero's side mask.

"Remove the carousel. The arc should bleed over the edges. Put the arc
down by 16px. Remove the age. Organ bigger by 15%." The card is one
reading again: the eyebrow, the body at 106 (from 92), and the arc alone as
the reading -- no number. The arc is drawn half again as wide as the card
(150%, margins of -25%) so its ends run under the card's edges and the
card's own overflow cuts them; it sits 16 lower than it did.

"+16px margin after the title": the Overview's section headings (`.ovsec`)
pad 26 below instead of 10, before what they head.

"Instead put 3 cards next to each other": the services under the greeting
go three to a row, on a six-column grid with each pill two columns wide; a
last row of two shares it at three columns each, so five make 3 + 2 with no
empty slot. The pills keep the glyph at the left (18) and the label at
12.5, wrapping to two lines where the width asks.

The same words again, with a capture of Header V2's card: "put 3 cards
next to each other" was about the hub. Its two rows become three tiles in
a row -- Inbox with its count beside the glyph, Services, and Records --
each the glyph top-left and the label at the foot on the 4% plate, 96 tall
with 20px corners. Inbox and Services keep their sheets; Records is the
third slot, waiting for its page.

"Where are the 3 cards next to each other?" Nowhere, on a fresh load: the
tiles live in Header V2, and the tweak reset to V1 with every reload, so
the page came up with the pills and no hub. V2 is the default now
(`hdrV2: true`, the select's `selected` with it), as with the other
switches whose chosen state became the default.

"Also no arc change as requested" -- with a capture that still shows the
age, the dots and the arc inside the card: the build before the change.
The viewer has served a copy several versions behind more than once today
(the Suggestions label, the icon discs, the two-row hub), and there was no
way to tell from the page itself. Now there is: the Tweaks panel's
Overview group ends with a Build row -- "dev" in the source, and in dist
the build's time (UTC) and commit, written by tools/build.js -- so a page
in front of someone can be checked against the last publish.

### 5.403 The age card morphs, as the hero does

"Use this organ visual" -- the iris. "Put a small nav carousel below the
arc, 16px from the footer, centred. Swipe left and right: the organ morphs
and the arc changes, the same as the Insights page. Push the organ down
16px. Reduce the gap between organ and arc by 12px."

The card is one organ that changes rather than a row of slides. The
biological age is the iris -- the row's own organ, which the first cut had
overridden with the figure. A swipe (40px sideways, finger or mouse) goes
to the next or previous of the ten readings, biological age first then the
nine organs in product order, and the card does what the hero does: the
particles travel into the new shape (`morphTo`, 900ms, at the dense
target), the arc's indicator sweeps to the new reading on the hero's
quintic clock with the lit run following (`arcACopyLive`: the still copy's
svg built once, painted per frame by the same rules), and the eyebrow
leaves the way the swipe went and returns from the far side. Small dots
under the arc mark where it stands, 16 from the card's foot, and a tap on
one goes there. The eyebrow gives the organ 22 of air instead of 6, and the
arc sits straight under the organ (the 12 it had is gone). The card
scrolls the page up and down as before (touch-action pan-y) and only a
sideways move is a swipe; the click after a swipe is swallowed.

### 5.404 The services as cards in a row

"Keep the header top like this" -- V1: the field, the inbox disc, the
bell -- so V1 is the default again. "Below the title, the same as the other
version with cards next to each other, but use the services as the cards.
Carousel: two cards visible + 48px of the third." The pills under the
greeting become the hub tile's shape -- glyph top-left, label at the foot,
the 4% plate, 20px corners, 96 tall -- in a row that scrolls sideways and
snaps to the 13px inset. Two stand in the row and 48px of the third shows
past the second gap: 13 + w + 8 + w + 8 + 48 = the width, so w is
(content - 51) / 2, about 147. Dragged under a mouse like the other rows
(`ovSvcRow`: snap off while the pointer is down, an eased glide onto the
nearest card's start or the next on a flick, the click after a drag
swallowed). The V2 hub tiles stay behind the Header tweak.

"Increase the height by 16px. First card: Concierge, with a rotating halo
border; badge top right, NEW." The tiles go to 112. Concierge leads the
row: the same tile with a service bell, a ring of light turning round its
edge -- a conic sweep (accent into the amber into white, then nothing) on a
pseudo twice the tile's size spinning once every 3.2s under a plate inset
by 2px, so only the ring shows at the edge -- and the New badge in the
corner in the reports' badge colours. (The badge is a span, and the tile's
children are position:relative for the ring's sake; the badge's own rule
had lost to that and it sat in the flow, over the bell. Its selector now
outranks the children's.)

### 5.405 The age card: arc up a fifth, the reading in words, no dots

"Arc bigger by 20%. Put '32 years old' below the arc, 18px, white,
medium, centred. Remove the nav. Push the organ up by 8px." The arc goes
from 150% to 180% of the card's width, its ends still cut by the card. The
dots go; under the arc the reading stands in words -- the chronological age
plus the organ's delta, "34 years old" for the biological age at the demo's
40 -- 18/500 white, centred, fading out and back as a swipe changes the
organ. The eyebrow gives the organ 14 instead of 22.

"Push the arc down by 16px. Push up 'years old' by 6px." The arc takes 16
of air above it again; the reading closes up to the arc (its 6 gone).
"Smaller font size, xx years old, by 2px": 18 to 16.

"Push up the age by 32px. Arc also up 16px." The arc's 16 of air goes
again; the reading rises 16 with it and 16 more of its own, into the empty
foot of the arc's box (the ticks end well above it).

### 5.406 Services, Large: a second dress for the cards

"Add another version based on this one, with a bigger card, title +
support, the visual at the right side (not below the content)" -- with a
capture of Casa's feature cards for the feel. A Services select in the
Overview tweak group: Tiles (the default) or Large (`CARD_STATE.svcLg`,
`body.svcLg`). The cards are one markup in two dresses: the visual (the
glyph, or in Large the glyph at 30 on a 64px soft disc) and the text (the
title, and in Large a line of support under it in grey). Large lays them
in a row -- words at the left, the disc at the right -- on a card 128 tall
and one card wide with 48px of the next showing (13 + w + 8 + 48 = the
width). The support lines: Concierge "Your care team, one message away",
Telehealth "See a doctor from home, today", Check Symptoms "Describe how
you feel, get guidance", Med Certs "A certificate in minutes", Pathology
"Book tests at a clinic near you", Treatments "Plans and prescriptions,
managed". Concierge keeps its halo and badge, its disc warmed with the
accent.

"Border thinner. More like warm orange than gold, smoother, subtle." The
ring goes to 1px (the plate inset by 1), and the sweep is the accent alone
-- rising over a long ramp to .7 and falling away as slowly, the amber and
the white peak gone -- turning once every 3.6s.

"Concierge should open the chat full modal." A tap on the Concierge card
opens the full chat (the thread as it opens from the star, on the default
question); a drag that begins on it is still a drag and opens nothing.

### 5.407 Card imagery, third pass: the dark set

"Replace by this!" -- a strip of the five Explore cards as designed: dark
cards (#0f0f0f), and on each a pair of stacked sheets -- the doctor's card
(Dr Steven, a trace, a moon, bars) over a document, over a questionnaire
with its orange header and radio dots, over a report, a Garmin card over a
device, and the syncing spark -- with the last card's button reading
Provide consent. The illustrations are cut from the strip (276 x 170, the
band between the line and the button) with their own ground, and the
Explore cards take that ground (#0f0f0f), so the picture and the card are
one surface with no tile. The renders of 5.401 are gone; the syncing card
says Provide consent, as designed, instead of a dimmed Syncing.

"Use these images for the insight card; also the card bg should be #fff
6%." A zip of the same stacked sheets as transparent renders at 2x (816 x
520): Dr Edward's card over a report, the questionnaire with its orange
header and radio dots, the Garmin card over a gold-headed sheet, the
syncing spark. They replace the strip cuts, so the card's own plate is the
ground -- and that plate is 6% white now rather than the strip's #0f0f0f.
Four renders for five cards: the report render serves the Dexa report and
the blood panel both.

### 5.408 The top group's fade, eased

"The gradient and blur should be more progressive, smoother." The ground
held to 75% and then fell to nothing in a straight line, and the mask cut
the blur the same way -- a visible band under the bar in the capture. The
pseudo now runs 56px past the bar (from 28), the black holds to the
field's foot (55%) and eases out on a curve -- .46, .42, .32, .2, .09, 0 --
and the blur's mask follows the same stops, so neither the tint nor the
blur has an edge.

"Tap: go to the Insights page." A tap on the age card (a press that does
not travel sideways) takes the reader to the Insights page by the dock's
own route (`setMode(20)`); a swipe is still a swipe and stays.

"Progressive bleeds too much after the UI element. Max 16px bleed." The
56px run washed the greeting and the hero's copy under the bar. The pseudo
now ends 6px past the bar -- 16 past the field's foot, the bar's own 10 of
padding included -- and the whole fade happens in those 16px, on the same
eased curve as before (.48, .42, .3, .16, .06, 0; the blur's mask alike).
The stops are `calc(100% - Npx)` from the foot, so the run is 16px whatever
the status strip measures. Measured: field foot at 176, ground's foot at
192.

### 5.409 The services with their renders; the desk wears the phone

"Use these images at the cards below the h1. One visual for each card."
Julien's strip of five renders -- the bell, the laptop with the doctor on
call, the signed Rx sheets, the bottle with its pills, the folder with its
arrow -- cut to squares on a transparent ground (`assets/overview/svc-*.webp`,
360px) and given one to a card: Concierge, Telehealth, Med Certs,
Treatments, Pathology. Five renders, five cards, so Check Symptoms leaves
the row (it stays in the assistant's bento). The tile turns over: the title
at the top-left, the render 64px at the bottom-right, the New badge keeping
its corner; 124px tall for the room. The Large dress puts the render at the
right of the words at 88px, with no disc under it now. The row is one
markup for the phone and the desk (`svcRow()` in the sheet's script).

"Adapt the desktop based on the recent update on mobile." The desk's
Overview (#m9) wears the phone's pieces, laid out for the width. The top
bar first -- the field filling the left, the inbox with its dot, the bell,
48px -- sticky on the card's top (top:-32px, the way .dFilters cancels the
card's padding) with the same ground and blur, ending 16px under the field.
The greeting as the page's heading, left, 24 / 500. The five services in
one grid row, 140px tall, the render 76px. The top band keeps its two
columns: the booking card at the left, stretched to the right column's
height (573 in the capture), and at the right the coverage and age cards
(the dial 112px, the same particle organ, arc and reading) over the tasks.
The rail is the phone's Explore cards -- the five renders on the 6% plate,
302px wide, resting on their left edge, all lit, the arrows stepping a card
at a time and the dots following. The old plan card, the two gauges and the
organ card are gone from the page; `desktopOverview()` guards the organ
card should it return, and still moves the page into the shell and wires
the sidebar. `buildOvAge(card, onTap)` and `buildOvExplore(car, dots,
{align, nav})` build both surfaces: on the desk a tap on the age card goes
to the Insights desk (#m18), a drag still moves through the organs.
Measured at 1440: bar 84 tall, bleed 16, services 5 × 140, hero 465 × 573,
rail 5 cards / 5 dots, next arrow → card 2. No console errors, phone
unchanged in behaviour (5 service cards, 5 Explore cards).

"Desaturate the 3D visual by 25%. Top-left placement, text bottom-left.
Smaller, ratio 1:1, 48px." The tile turns back over: the render 48 × 48 at
the top-left (`order:-1`, pulled 4px into the padding), the title at the
foot, the New badge in its corner; a `saturate(.75)` on the image takes a
quarter of the colour out so the renders sit with the page rather than on
it. The tile is 112 again (124 on the desk); the Large dress keeps the
render at the right of the words, 72px. Measured: render 48 × 48 at 10 / 10
from the corner, title 14 from the foot.

"On click on these cards scale down by 2px." A press (`:active`) scales the
card so its width gives 2px -- .986 of the phone tile's 147, .9934 of the
Large card's 303, .99 of the desk tile's 206 -- over .12s, the corners and
the render shrinking with it, and it comes back on release. Measured on the
phone: 147.4 → 145.4 pressed → 147.4 released; the desk 206.4 → 204.3.

"Title should be Insights." The Explore cards' section reads *Insights*
now, on the phone and the desk, in place of *Your next actions*; the See
all count and the desk's arrows stay.

"Smaller visual, 40 × 40px. Increase cards padding +4px." The render is
40 × 40 and flush with the title's left (the 4px pull into the padding
went); the tile's padding is 18 / 16 / 18 / 18 on the phone (from 14 / 12 /
14 / 14) and 20 on the desk (from 16). Measured: render 40 × 40 at 18 / 18
from the corner, title 18 from the foot and the left.

"Update next step bg img." The booking card's photo is Julien's second
one: the doctor, arms folded, at the right of a dim office (1059 × 672,
`assets/overview/hero-consult.webp`, 10 KB). Cover on a card narrower than
the picture shows less than half its width, and anchored right the first
pass put her face under the headline on both surfaces; the anchor is 70%
on the phone and 65% on the desk now, which keeps her in the card's right
third with the words clear of her, and a dark run from the left (.72 to
nothing by 78%) gives the copy a ground whatever the window shows. The
desk's headline is held to 62% of the card for the same reason.

"Push visual up by 4px. Desaturated by 20%." The service render sits 4px
higher (14 from the tile's top, the title where it was) and keeps four
fifths of its colour rather than three quarters (`saturate(.8)`).

"Reduce height. Padding between content and footer 32px. Reduce CTA Book,
44px height. Break line before 'starts'." The booking card: the footer's
run above it is 32 (from 56) and the card's 250px floor is gone, so the
content sets the height -- 242 on the phone, from 292; the desk's is the
right column's, as before. Book is 44 tall (from 52), 15px type on a 15px
corner. The headline breaks after *journey* on both surfaces.

"Update visuals Concierge and Med Certs, keep same saturation." Two new
renders -- the bell alone, larger in its frame, and the stacked sheets with
a bow-tie mark and a signature -- cut to the same 360px squares and
dropped in for `svc-concierge.webp` and `svc-cert.webp`; the `saturate(.8)`
on the row applies to them as to the rest.

"Reduce text font size by 4px." The booking card's headline is 16px on
the phone (from 20) and 19 on the desk (from 23), the leading a touch
looser at 1.3; the card is 229 tall on the phone now.

"Update all visuals, crop them." A third set, the five together on one
1536 × 1024 sheet with a soft glow behind each -- the bell, the laptop, the
sheets with the bow-tie mark, the bottle with its pills, the folder. The
sheet's glow runs the five together, so each is cut from its own cell of
the grid, trimmed to where the alpha passes 40 (the faint halo left
behind), squared and scaled to the same 360px; the row's saturate(.8)
applies as before. All five of `svc-*.webp` replaced.

### 5.410 The field's placeholder turns over

"Make this placeholder rotate every 3 seconds, vertically, fade in and
out: Where is my latest results / When my Microbiome results will arrive /
What's on my workout plan tomorrow / ..." The top bar's field, on the
Overview phone and the Overview desk, carries seven lines in turn --
*Ask Everlab anything*, then the reader's likely questions: latest
results, the Microbiome results' arrival, tomorrow's workout plan,
biological age explained, the next step, a consult next week. Every three
seconds the line leaves upward as it fades (.3s, 10px) and the next rises
in from below; the input's own placeholder is cleared so the two never
show together, and the line hides while there are words in the field and
returns when they go. The input is wrapped in a host so the line sits
exactly where the typed words will (measured 0 / 0 off the input's left
and middle). The turn pauses while the tab is hidden or the phone is off
screen, and reduced-motion drops the slide, keeping the fade. The
assistant's sheet keeps its still placeholder. `ovPlaceholders()`.

### 5.411 Header V3: the greeting and the field centred

"Do another version: title centred, chat field below the h1 centred,
margin 32px, keep the carousel cards." A third Header on the Overview
tweak (`body.hdrV3`). The bar keeps the inbox and the bell at its right
and gives up the field; the greeting is centred, 32 under the bar; the
field stands centred under it at the content's width (346 on the phone),
32 below the greeting and 32 above the services carousel, which stays.
The field is one node rather than two copies: `placeOvChat()` moves it
from the bar's front to after the greeting for V3 and back for V1 and V2,
so its wiring -- the focus that raises the keyboard, the bell as dismiss,
the hand-off to the chat -- goes with it. In the scroller it takes z 7,
the bar's own, so it stands over the blanket while live. Measured: bar →
greeting 32, greeting → field 32, field → services 32, greeting and field
centred to the pixel; typing lands on the field over the blanket, the
bell lets go, Enter opens the chat; V1 and V2 put the field back in the
bar.

"V3: put the avatar profile on the top nav's left side. Push up the h1 by
16px. Reduce the width of the chat field to 75%. Reduce the gap between
the h1 and the chat field by 8px. On scroll past the service carousel,
display the chat field inside the top sticky bar." The profile disc (the
avatar render, 44px) stands at the bar's left in V3 only, the discs at
the right; the greeting is 16 under the bar (from 32); the field is 75% of
the content's width (259 of 346), 24 under the greeting (from 32), 32
above the services. And once the services row's foot has gone under the
bar, `placeOvChat()` moves the field up into the bar between the profile
and the discs -- a spacer of its height and margins (100px) holds its
place in the page so nothing jumps and the page keeps its length -- and
brings it back under the greeting when the page scrolls up again; the
move fades the field in where it lands. Measured: field under the title
at scroll 264, in the bar at 284 (the row's foot at 378 in the phone, the
bar 104 tall); typing from the bar raises the keyboard; scroll height
2200 before and after; V1 hides the profile and never spaces.

"Make the bg progress smoother: top → full blur, end of the bar → no
blur." The bar's ground, on the phone and the desk: no plate with a 16px
edge any more -- the tint and the blur's mask are full at the top and
ease to nothing at the ground's foot on one curve (.94, .82, .64, .42,
.2, 0 at 18 / 36 / 54 / 72 / 88 / 100%). The ground still ends 16px under
the field.

"Replicate the same as mobile V3 on desktop." The desk's Overview wears
V3 too: the profile (48px) at the bar's left, the greeting centred 16
under the bar, the field centred at 75% of the content (810 of 1080), 24
under the greeting and 32 above the services row; and once the row's foot
has gone under the bar the field moves up into it, between the profile
and the discs, a 104px spacer holding its place. `placeOvChat()` runs over
both hosts now (`OV_HOSTS`: the phone with its scroller and `.mtitle`, the
desk with itself and `.dvH1`), each keeping its own past-the-row flag.
Measured on the desk: under the title at scroll 262, in the bar at 282,
scroll height 2060 throughout; V1 puts the field back and hides the
profile; the phone unchanged.

Five small ones after it. "The fixed top header bar needs a gradient
black, progressive, 50% opacity": the bar's tint is black at .5 at the top
now (from the page's own dark at .48), easing to nothing at the foot on
the blur's curve, on both surfaces; the light page keeps its light tint at
the same .5. "Reduce gap by 8px": the greeting to the field is 16 (from
24), the spacers 92 / 96 to match. "Bento: use the same padding / gap,
12px": the services row's gap is 12 (from 8) and it sits 12 above the
booking card (from 18), so the row, the card and the two small cards all
keep the page's 12; the tile is (100% − 59) / 2 and the Large card 100% −
47, the third and second still peeking 48 (measured 53 with the phone's
own edge). "Reduce the max width of the field by 256px": the desk's field
is capped at 554 (75% of the 1080 content was 810). "No avatar on
desktop": the desk's bar shows the discs only, at the right (with no
profile to push them there, the bar ends its row at the right); the phone
keeps its profile. "Field scroll state 320px max width": in the bar, the
desk's field is at most 320 wide and stands beside the discs, 10 from the
inbox (measured 554 under the greeting, 320 in the bar).

### 5.412 The Tasks tweak: the list, or one insight card

"Tweak control here: Tasks to complete (current), or Insights -- one card
with a chart, 128px height." A Tasks row on the Overview tweak
(`#stTasks`, `body.insCard`). *Tasks to complete* is the list as it was;
*Insights card* stands one card in its place -- and in place of its
heading -- on the phone and the desk: 128 tall, the small cards' plate,
the eyebrow *Insights*, the line "ApoB is above the optimal range", the
reading "146 mg/dL · See insight" at the left, and at the right the ApoB
trend from the old desk card (green to amber to red over three gridlines,
the chip at the top-right). 12 under the two small cards on the phone, the
grid's 20 on the desk, where the booking card shortens to the column (452
from 573). Measured: 128 × 346 on the phone, 128 × 595 on the desk, the
list and its heading hidden, both back on Tasks.

"Put this tweak on Overview." The row had landed in the Insights group of
the panel, before Biological age; it sits in the Overview group now, after
Services and before Build, where the page it changes is.

### 5.413 Organs: density and the inks under one button

"Density and Particles colours, under one tweak: Organs." The bar's
Density select and the Particles colours menu were two controls about one
thing, the particle organ. They are one menu now, *Organs* (`#inkMenu`,
the same details), in two named halves: Density -- the Normal / Dense
select, keeping its id so its handler and the engine read it where it
stands -- and Particle colours, the three inks with Save as before. The
`#densGrp` span is gone from the bar. Checked: the switch to Dense still
puts `dense` on the body from inside the menu.

### 5.414 Sizes, the default header, and a font that went serif

"Insights card 192px. Bio age and health coverage need to fit in 256px
height." The Tasks tweak's card is 192 tall (from 128), the chart growing
with it. The two small cards are 256 each, on both surfaces (`height`,
not the age card's own measure): the phone's parts already fit (the
reading at 200, 38 above the foot); the desk's arc, at 180% of a wider
card, stood 123 tall and pushed the card to 290, so on the desk it is 130%
(89 tall) and the reading lands at 222, 16 above the foot.

"Use V3 Overview as the default one." `hdrV3: true`, the Header select on
V3; a fresh load puts the field under the greeting on the phone and the
desk, the profile on the phone alone, and the other pages are untouched.

"When Tasks turns off, the font becomes serif. Shouldn't; please check."
It did, and the capture in 5.412 had shown it (read then as the headless
browser missing the web font). The body flag for the tweak was `insCard`,
and `.insCard` is a card component already, with `font:inherit` -- so a
body wearing the class inherited its font from the root, which has none
set, and the browser's serif came through everywhere. The flag is `tkIns`
now; the component keeps its name. Checked: the body's font family is the
page's before, during and after the switch.

"Replace the Pathology icon / visual." A new render for the fifth card,
cut the same way as the set -- to where the alpha passes 40, squared,
360px -- into `svc-path.webp`; the row's saturation applies as before.

"Desktop: +24px gap after the chat field." The desk's field sits 56 above
the services row (from 32), the spacer that holds its place while it
rides in the bar 120 (48 + 16 + 56); the phone keeps its 32.

"Card hero bento: Tasks, Insights." The Tweaks row for that card is named
*Card hero bento* and reads as a select of the two -- Tasks, Insights --
rather than the toggle segmentise() had made of it: neither card is the
other turned off, so `#stTasks` joins the selects the toggle pass skips.

### 5.415 Container tokens, and the bar's ground in two layers

"Consider these breakpoint values." Julien's layout / container table:
padding top-bottom 24 / 28 / 32 / 36 and left-right 16 / 16 / 24 / 24, gap
24 / 28 / 32 / 36, across xs / s / m / l, and the container's max-width
steps (2xs Full / 512 / 544 / 576, xs 800, sm 1080, md 1280, lg 1440). The
table names no screen widths, so the max-width steps stand in for them:
xs below 800, s from 800, m from 1080, l from 1280. Three custom
properties on the root (`--ctPadY`, `--ctPadX`, `--ctGap`) carry the
values through media queries, and the desk's Overview reads them: the
card's padding, its max-width (1080 of content plus the two paddings, so
1128 at l where it was 1160), the top band's and the plan grid's gap, the
small cards' gap, the rail's gap, the insight card's margin. The bar
cancels the card's padding by the same variables, so it stays flush at
every breakpoint. The Insights desk keeps its own numbers. Measured: at
1440 padding 36 / 24, gap 36, card 1128; at 1180 32 / 24, gap 32, card 956;
at 1000 28 / 16, gap 28, card 776; the bar flush at 0 / 0 in each.

"Progressive gradient and blur. Field centred." and "Black gradient more
intense." The desk's bar had a readable edge where its one blur ended.
The ground is two layers now, on both surfaces: the strong blur (24px)
whose mask falls away sooner (.92, .74, .5, .26, .1, 0 at 22 / 42 / 60 /
76 / 90 / 100%), and under it a soft blur (8px) masked in from 22% and
out at the foot, so the blur steps down in two stages and the foot has no
edge. The tint is black at .78 at the top (from .5) on the same curve,
the light page's light tint alike. And the desk's field, when it rides in
the bar, stands on the bar's own centre (absolute, 320 wide) rather than
in the room left of the discs, fading in without the slide. Measured:
field centre 0 off the card's centre at 1440, 1180 and 1000.

### 5.416 The Insights card as a carousel; the Layout tweak

"Have a carousel inside the carousel, all breakpoints. Nav at the bottom.
Content left: eyebrow, title (+2px), support, AUTO, CTA View results.
Right: the data visual, the entire height. Make it swipable inside the
card." The hero bento's Insights card holds three insights now -- ApoB
above the optimal range, Vitamin D back in range, resting heart rate
trending down -- each a slide the card's width: at the left the eyebrow,
the title (17px on the phone, 18 on the desk, from 15 / 16), the support
line, then the room, then *View results* at the foot; at the right the
chart at the slide's whole height, its chip above the last point; the
dots at the card's foot. A finger scrolls it natively and snaps, a mouse
drags it (snap off while down, an eased glide onto the nearest slide or
the next on a flick), a dot glides to its slide, the click after a drag
is swallowed. The chart is drawn from the reading's five points, each
segment in its status colour, with `vector-effect:non-scaling-stroke` on
the lines and on the dots (zero-length paths with round caps) so the
strokes keep their weight however the box stretches -- the old chart's
dots had squashed into ovals. `buildOvInsights(card)`, for both hosts.
Measured: 3 slides, each the card's width, the chart the slide's height;
a drag lands slide 2 and the dot follows; a dot click lands slide 3.

"Make Insights the default hero bento card." `insCard: true`, the select
on Insights.

"On the tweak control I want to see the viewport width, updating as the
viewport resizes; also a select to pick the breakpoint XS / S / M / L as
the variables shared. The default breakpoint view is always set on the
min width of the breakpoint." A Layout group at the top of the Tweaks
panel: *Viewport* reads the window's width live with the breakpoint it
falls in (1440 px · L), and *Breakpoint* -- Auto, XS, S, M, L -- forces
one: `body[data-bp]` sets that breakpoint's three tokens whatever the
window measures, and holds the desk's card to what the breakpoint's
minimum width would leave it beside the sidebar (S: 800 − 224 − 16 = 560),
so the page is seen at that width's floor. XS has no floor in the table;
480 stands in. The readout says "(forced)" while one is. Auto is the
default. Measured: Auto at 1440 → L, 36 / 24 / 36, card 1128; at 1000 →
S, 28 / 16 / 28; forced S at 1440 → card 560, 28 / 16 / 28; forced XS →
240; forced L → 1040 (1280 − 224 − 16, under the token's own 1128). And
the page reflows at S and XS, forced or in a window that narrow, so the
breakpoint's view is that breakpoint's layout rather than the desk's two
columns squeezed: the top band stacks, the services go three across (two
at XS), the plan two across (one at XS), the two small cards one above
the other at XS.

### 5.417 The bar's blur as bands; the Layout controls on the bar

"Still no progressive gradient on the desktop top sticky." Sampled in
Chromium the ground fades without a step; Julien's captures are Safari's,
and WebKit does not mask a backdrop filter -- the blur runs to its box's
edge whatever the mask says, so the one-layer (then two-layer) ground
ended in a line at the bar's foot. The ground is six bands now
(`.ovGround`, built into each bar by `ovGround()`): the tallest the
softest (2px), each shorter one sharper -- 4, 7, 11, 16, 24px at 90, 78,
64, 50, 36% of the height -- painted in that order so each blurs the ones
beneath. Every browser bounds a backdrop filter to its own box, so the
blur steps down from the top to a 2px whisper at the foot with no mask
needed; the masks stay on the bands for Chrome, feathering each step.
The tint keeps to ::before.

"Visible viewport size directly on the tweak bar, plus the breakpoint
select -- this top level, next to Organs." The Layout group leaves the
Tweaks panel for the bar itself: *Viewport 1440 px · L* and the
Breakpoint select stand between Organs and Refresh, on every page.

"Bento gap 20px grid." The desk's hero bento -- the top band, the two
small cards, the insight card's margin -- keeps the desk's 20 rather than
the container's gap, which the plan grid and the rail still take.
"Insights card 256 − 32 height": 224 (from 192). "Insights card nav
carousel: push up 8px": the dots 17 from the foot (from 9), the slide's
bottom padding 32 (from 24) so the CTA clears them.

"Reduce the height of these cards to 192px." The two small cards, 192
(from 256), on both surfaces, with the age card's parts scaled to fit:
the organ 80 (from 106), the eyebrow's gap 10 (from 14), the arc 150% on
the phone (from 180) and the card's own width on the desk (from 130%),
the reading pulled 20 up into the arc's empty foot (26 on the desk); the
desk's dial 96 (from 112). Measured: organ at 39, arc at 119, reading at
155 (phone) / 159 (desk), 19 / 15 above the foot.

### 5.418 The forced breakpoint frames the whole shell

"The viewport should vary, not just the body." Forcing a breakpoint had
narrowed the card and left the sidebar and the window as they were. Now
the whole desk shell -- the sidebar and the card -- is framed at the
breakpoint's floor (480 / 800 / 1080 / 1280) and centred in the window,
a hairline round it, as a browser that wide would show it. At S and XS
the sidebar folds away and the card takes the frame's width, as a shell
that narrow would; the sidebar's width is a variable so the card's cap
follows, and the shell's ground gradient measures the card's edge off the
shell's own left rather than the window's. The bar's readout says the
frame's width first ("800 px · S (forced, window 1440)"). Measured at a
1440 window: L → frame 1280 at 80, sidebar shown, card 1040; M → 1080 at
180, card 840; S → 800 at 320, sidebar hidden, card 784, one column,
services three across; XS → 480, card 464, two across; Auto → the window.

"Grid gap 12px." The desk's hero bento is on the page's 12 (from 20):
the top band, the two small cards, the insight card's margin.

Then the age card again, in three steps: "push arc up 8px" (the arc's top
margin −8, the reading held where it was, so the two part); "organ
smaller by 10%, up by 4px, years old up by 8px" (the organ 72 from 80,
the eyebrow's gap 6 from 10, the reading pulled 20 into the arc's foot
from 12; 26 on the desk). Measured: organ at 35, arc at 99, the reading
at 135 (phone) / 140 (desk). And the Insights card: "reduce line height"
(the title's leading 1.15 from 1.3) and "CTA full rounded" (View results
a pill, 999 from 10, its padding 16).

"Reduce grid gap mobile by 4px." The phone's bento is on 8 (from 12): the
services row's gap and the 8 under it, the two small cards' gap and the 8
above them, the insight card's margin; the tile is (100% − 51) / 2 again
and the Large card 100% − 43, the third and second still peeking 48.

"This is the viewport to resize, the entire window -- possible?" Not from
inside: a page cannot resize the window it runs in; browsers let a script
size only a window it opened itself. So, with a breakpoint forced, an
*Open ↗* beside the select opens the same page (hash and all) in a new
window exactly the breakpoint's floor wide, the browser's own chrome
added back so the viewport is the floor -- there the real media queries
take over and the bar reads "800 px · S" on its own. The in-window frame
stays for a viewer that blocks pop-ups. Checked: the button is hidden on
Auto, shows on S, and the window it opens measures 800 and lands on #m9.

"XS should be 402." "S should be 600px." "M 992." "L 1440." The floors
are Julien's now: XS 402 (the phone's width; 480 had stood in), S 600
(from 800), M 992 (from 1080), L 1440 (from 1280) -- for the frame, the
window Open makes, the readout, and the Auto thresholds alike (the S
tokens from 600, M's from 992, L's from 1440; the XS reflow below 600,
the S reflow below 992). At a 1440 window Auto reads L, just; a 1439
window is M.

"S: keep the carousel, as XS." At S and XS -- forced, or a window that
narrow -- the desk's services are the phone's carousel rather than a
wrapped grid: two cards and 48 of the third, snapping, dragged under a
mouse (`ovSvcRow()` takes the row and its inset now, 13 on the phone and
0 on the desk, and runs on both).

### 5.419 The sidebar: the wordmark, the glyphs, the retract

"Put the logo top; also add a retract action top right of the nav that
retracts, to see only the icons." The desk's sidebar has a head now:
Julien's wordmark (his SVG, its fills on currentColor so the light page
inks it dark, 20 tall) at the left and a retract button (a panel glyph)
at the right; each entry carries a line glyph -- home, the atom for
Insights, the checklist, the cube, the document with a heart, the
calendar -- before its label. Retracted (`body.sideMin`, a CARD_STATE
flag so a page change keeps it) the rail is 72 wide: the wordmark gone,
the toggle centred, each entry its glyph alone with the label as a title,
the lit entry keeping its plate; the card moves in to 72, its cap follows
through `--sideW`, and the engine re-measures. Measured at 1440: open,
sidebar 224 and the card at 268 / 1128; retracted, sidebar 72 and the
card at 192 / 1128; the flag survives Insights and back; the toggle
returns it. (Julien's "L problem, right side should fill the container"
turned out to be the L frame, 1440, standing wider than his window --
"actually is ok".)

"Insights: the full section, an on / off toggle." An *Insights section*
row under Card hero bento in the Tweaks panel (Shown / Hidden, a toggle):
off, the section goes whole -- its heading with See all and the arrows,
the Explore cards' rail, the dots -- on the phone and the desk
(`body.noInsSec`, a CARD_STATE flag so a page change keeps it); the
action plan closes up to the bento. Shown is the default. ("Where is the
full section tweak?" -- in the Tweaks dropdown, Overview group, under
Card hero bento; a Build stamp before 4498139 has not got it.)

### 5.420 The bar's bands, finer and longer; the age cards, by surface

"The gradient is not well managed. Reduce black by opacity. Increase blur
progress +32." Safari draws each band's edge as a step it cannot feather,
and six steps over 100px read as bands. Ten now, the steps halved (1.5, 2,
3, 4, 5, 6, 8, 10, 12, 14px, compounding to about 24 at the top), over a
run 32px longer -- the ground ends 38 past the phone's bar and 36 past the
desk's (from 6 and 4) -- so each step is smaller and there are more of
them across more height; the tint is black at .55 at the top (from .78)
on the same curve, running the longer way too. Measured: ten bands, 120
down to 34 tall on the desk's 84px bar; the phone's ground 137 tall on
its 99px bar.

"On desktop we have space: push down years old, arc down 8px, organ +10%."
The desk's age card: the organ 80 (from 72), the arc's top margin 0 (from
−8), the reading following them down 16 -- organ at 35, arc at 115,
reading at 156, 18 above the foot. "Mobile: push down years old 12px, arc
8px, organ 4px." The phone's, scoped apart: the eyebrow's gap 10 (from
6), the arc's margin 0 (from −8), the reading pulled 8 into the arc's
foot (from 20) -- organ at 39, arc at 111, reading at 159, 15 above the
foot.

### 5.421 The landing page's header

"Organ Age landing page: create a header following this structure. Keep
the organ + arc + years old on the right side, same as the mobile
carousel. Header full dark, left content white, right side interactive
with the carousel mobile organ." A page-high black header stands above
the landing page's pinned stage (`.lpHead`): a nav with Julien's wordmark
at the left and *Start Today* (a white pill, to #m20) at the right; then
two columns at 50 / 50 -- at the left the eyebrow *Organage*, the serif
line "Your body has more than one age." (Tiempos Headline where it is
installed, Times otherwise, 66px at 1440), the two paragraphs from the
reference, and *See your Organ Age*; at the right the Overview's age card
at three times the scale (`buildOvAge`, the organ 220, the arc at 110%,
the reading 24px), swiped or dragged through the organs as on the phone,
with a line under it saying so. The CTA, and a tap on the card, scroll
the page to the story. Below 900 the columns stack. The stage's timeline
now runs from where the stage pins: the header's height comes off the
scroll position and the run. Two things found on the way: a stuck sticky
element's offsetTop is the scroll position itself (so the first cut read
zero for ever; the header's own height is the fixed number), and the page
sat under the prototype's bar (it starts at `--barH` now, as the other
pages do). Measured at 1440 × 900: header 900 tall, the card 560 × 520, a
drag lands the heart; the CTA lands the stage at 0 with the timeline at
its start.

"On rest the top bar gradient / blur." At rest the Overview bar's ground
had been blurring the greeting under it. The ground -- the bands and the
tint -- is off at rest now and comes in (.28s) once the page has scrolled
6px under the bar, on the phone and the desk alike (`.ovScrolled` on the
host). "2 col 50 50": the desk's hero bento is two equal columns (from 1 :
1.28). "Action plan card: no bg, light grey border; grid gap 20px": the
plan's cards are outlined (a 1px ring at .12 white; .16 dark on the light
page) with no fill, on a 20px grid.

"This white state only when > 0 characters are typed inside the field."
The send disc went white on focus; it goes white with characters now
(`.ovChatBox.hasText`, toggled with the rotating placeholder's own
input listener), and back to grey when the field is emptied.

"Need a smooth transition on the retract system. This is a common nav for
all pages on M and L." The rail's width and padding, the shell's left
padding and the cards' left edge ease over .32s on one curve; the labels
and the wordmark fold by max-width and opacity rather than vanishing; the
ground and the engine re-measure once the rail has landed. It is the one
`.dash .side`, so the Insights desk wears the same rail and the same
retract (checked: retracted, Insights opens with the rail at 72 and its
card at 176). "Make the left and right padding even, too much on the
right at the moment": retracted, the rail's padding is 0 and each entry
is a 44px plate centred by its own margins, 14 either side, the toggle
the same.

### 5.422 The landing header's right side: the phone's hero, turning

"Use h1 sans, not serif. No bg on the card, right side. Autorotate every
3 sec. Increments too thick on the arc. The organ doesn't seem to be the
same as the mobile. I want that view." The right side is the Insights
phone's hero as a view now (`buildLpHero`), not the Overview card: no
plate; the particle organ at 300 (dense, its fill .62 and dot 1.1 so it
reads as the phone's); the arc across the column with hairline ticks
(1.1); the age at 84px with the delta under it ("3 years younger"); and
at the foot the ages' names in a row -- the one in the middle lit, its
neighbours faded and softened, as the phone's pills read mid-swipe. It
turns to the next organ every three seconds while the page is the one
showing (the organ morphs, the arc sweeps, the number and the names cross
over), and a swipe, a drag or a tap on a neighbour's name takes it there
by hand and rests the turning for six seconds. The h1 is the page's sans
at 500. Measured: 300 organ, ticks 1.1, 84px number; at 3.4s the view is
on Heart (37, 3 years younger), at 6.4s on Brain; a drag back lands and
holds through the next tick; a tap on the next name moves on.

"Put more floating particles coming from the right column's top left and
top right, attracted into the organ. Also put the halo at the top right
of the header." A canvas under the view (`lpStreams`): 150 particles born
just off the column's two top corners, each on its own curve -- pulled
out past its corner's side, then in to a point on the organ's rim --
brightening and growing as they arrive, reborn at a corner; the three
inks, mostly the material one; drawn while the page is the one showing.
And the header carries a warm halo off its top-right corner: the accent
in a soft radial, .2 at the centre, gone by 72%, on a disc 70vw across.

"All nav items should have a hover and press state." Every entry lights
on hover (.05 white) and presses darker (.1), the lit one a shade brighter
on hover; the light page has its own. "Still too much right padding on
the nav when retracted": Chromium measured 14 / 14, so this is WebKit --
a flex item's automatic minimum width holds its text's width whatever
max-width says, and the folded label kept its room; `min-width:0` on the
label and the wordmark lets them fold to nothing there too. And "the nav
size is different" between Overview and Insights: measured the same on
both -- 224 wide, 26 / 20 padding, 13.5px, the first entry at 133 -- it is
one `.dash .side`; the two captures were at different zooms.

"Keep only this, remove the rest of the scroll." The landing page is its
header alone: the pinned stage, its scroll track and the end scene stay in
the markup but are hidden and not built (`LP_STORY = false` gates
`__lpBoot`), the page does not scroll, and the header fills it. With no
story to scroll to, *See your Organ Age* goes where *Start Today* goes,
the Insights phone. Checked: nothing scrolls under a wheel, the story's
canvas is never sized, the CTA lands #m20.

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

- **Artifact:** https://claude.ai/code/artifact/eb7b1a71-ee47-49a2-b338-2f1b60244efd
  — the live copy through this work (an earlier one, 78766a66…, carried the
  first stretch). Republished after every commit — a re-sent message has
  always meant "I don't see it yet". Since 5.92 it is republished from
  `dist/index.html` (only `<title>` differs), so the copy people open is the
  built one.
- **Branch:** `claude/zip-package-import-fzfsrp` on
  `julienfischer-everlab/visual`, pushed.
- Write access was refused for most of this work — `git push` returned 403 on
  `git-receive-pack` — so the history sat local and was handed over as a zipped
  git bundle instead. It was granted later and the whole branch went up at
  once. If a push starts failing that way again, the grant lives at
  claude.ai/admin-settings/claude-tag; the bundle is a stopgap, not a fix.

**5.423 — The landing's names as a carousel, and a round of asks on it and the phone.** "This should act as a carousel, same as the mobile view": the three names under the hero (prev · current · next) are now one track of all ten ages, `.lpAvNames`, that scrolls and snaps with the current one centred and lit and the others fading and softening with their distance from the centre, as the phone's pills read mid-swipe. It is scrolled by a finger, dragged under a mouse (snap off while the pointer is down, the nearest name chosen on release), a tapped name is chosen, and the view's own turns scroll it. The end scene had still been showing after "keep only this": `.lpEnd`'s own rule set `display:flex` later in the sheet, so the hide now leads with `.lp`; the header takes the page's own height (under the bar) rather than `100vh`, and the page no longer measures as scrollable. Then, from the screenshots: the streams at a third of the pace ("floating particles way slower"), and a third of them born along the top edge rather than at the two corners, landing on the organ's upper rim ("should come from the top as well"); the organ at twice the engine's dense count, 5,200 dots ("more dot 2x, dense"); the arc's indicator at r 3 in place of 6, the ticks at .8 in place of 1.1, and 42 ticks a side in place of 30 — `arcAMarkup` and `arcACopyLive` take a ticks-per-side count now, the zero tick placed by index so it always lands ("1.4x more increment"). The halo is the concept phone's, exactly ("keep exact same halo top right system as the concept mobile UI"): the same nine-stop gaussian on `.lpHead::before`, the same three verdicts from `HALO` — younger 88AB74 at 16%, older E7B69C at 12%, aligned white at 8% — written as `--v4halo`/`--haloK` by the hero and blended from the light showing to the new organ's on the morph's own 900ms S-curve, so Lung goes warm and Body green. The turning is every 4.5 seconds ("auto carousel rotate every 4-5 sec"), resting seven after a hand. The h1's leading is .96 ("reduce line height"). And the forced breakpoints frame this page as they frame the shell ("make the breakpoint working on this page"): `body[data-bp] .lp` sits at the floor's width, centred, with the hairline; `.lp` is a container so the page's one responsive block answers to its own width (`@container lp`), and the h1 and halo take `--lpW` in place of `vw`. Measured: S frames at 600 centred, one column, h1 38.

On the phone's Overview, from the two screenshots: the age card's "34 years old" up 8 (margin -16); the Insights visual keeps 24 clear above it — the svg starts 24 down its box and the chip rides with it ("insight data visu safe padding top 24px"); the bar's field and discs at #fff 8% with more blur — the field 96 in place of 64 on every host, the discs 48 in place of 12 ("increase field and cta bg blur and #fff 8% bg"). And the field live: the greeting rolls up and out and "How can we help you?" rolls in, white, on one axis — the `.mtitle` lifted to z-index 7 with the field so both sit over the blanket ("on click the h1 should rotate fade in out and another title should appear when field focused and title should be above blanket").

**5.424 — "Push up the organ group by 64px."** The hero's right column, `.lpHeroVis` — organ, arc, age, delta and the names' track together — sits 64 above the grid's centre (`position:relative;top:-64px`), the copy at the left staying where it was. Measured: the organ's top from 200 to 136 at 1440×900.

**5.425 — XS as the phone, device frames, the 1280 container, and a Hero action tweak.** Four asks in one round. "Push up xx years old by 4px": the phone's age card reading at margin -20. "Overview container max width 1280px": the desk's Overview content cap from 1080 to 1280 (plus the padding). "XS should be the exact structure as overview mobile version": at the forced XS the desk's card wears the phone's numbers — no card padding and the 13px column, the bar with the profile at its left and the discs at 44 under the strip's 45, the 24px greeting 16 under, the 44px field at 75% with the 14px type and the 92px spacer, the services in the phone's bento (two tiles and a sliver, 112 tall, the row bleeding to the edges with its own 13 so the tiles slide under them — `ovSvcRow` reads the row's padding now rather than a passed number), the booking card at the phone's height and 22 radius, the two small cards side by side on 8, the Insights card 8 under with the phone's slide padding and 17px title, the section titles with the phone's 22/26, the Explore cards at 86% snapping to the centre, and, in place of the desk's grid of six protocol cards, the phone's plan list of four with the timeline link (copied into the desk's markup, shown at XS only). Measured against the phone: bar 99, title 24, field 44, tiles 112, small cards 192 two-up, Insights 224 — the same. "XS and S use a frame like iPhone XS and tablet S" and "add padding top on the viewport 48px": a fixed `#bpFrame` overlay draws the device round the forced page — the phone's 56 radius, black bezel and steel rim, the status strip (9:41, island, signal) and the dock mounted over its foot; the tablet's 28 radius, wider bezel, a small time at the top left and no island — and the page's rectangle sits 48 under the bar and 48 above the window's foot with its corners the device's and its scrollbar hidden. The dash's top is written by `resize()` (the bar's measured height), so the 48 is added there rather than in a rule the inline top would beat. The Organ Age landing is framed the same way.

And "create a tweak 'Hero action' with different examples of the hero action card": a new Overview row, Hero action — Consult (the doctor, next availability, Book: the default), DEXA scan (the scan photo from the zip, "Get your health baseline. Book your DEXA Scan.", Book alone) and Latest report (the figs, "Here is your latest report. Explore your Mid Year Review.", the author with the date, See Document). `CARD_STATE.hero` → `body.heroDexa` / `body.heroReport`; `paintHero()` writes the tag, the heading and the foot into both hosts' cards; the two photos fill the card under a top-and-foot scrim, the card near square (346 floor) as the designs are. Photos in `assets/overview/hero-dexa.webp` and `hero-report.webp`.

**5.426 — "All need to stick with the same format as the Consult. Depending of the device obviously."** The DEXA scan and latest report cards give up their near-square photo cards and take the consult's format exactly, on each device the consult's own: the same card at the content's height (229 on the phone, the bento column's on the desk), the photo at the right under the same dark run from the left, the copy at 74% with the grey lead and the white ask, and the foot's two lines beside the button — Next availability · Friday 10:30am · Book for the scan, the author and the date · See Document for the report. The photos are anchored where their subject is (the head at the right of the scan, the figs' bowl for the report). At the phone's width the author's date takes two lines under the name so See Document keeps its size; on the desk it is one.

**5.427 — The landing hero, another round.** "Organ more dense, more particles": 9,000 dots at fill .78 (from 5,200 at .62). "Floating particles should be finer and slower 2x": the streams' dots at .4–1.1 (from .7–2) and half the pace again, a sixth of the original. "Push up organ by 24px": the organ alone rides 24 above its slot; the arc, the age and the names stay. "XX / xx sub should fade in out when active item change, from left to right, 24px movement": the age and its line leave to the right by 24 as they fade and return from 24 left, on the swap's 190ms. "Landing page container 1080px": the hero grid and the nav on one 1080 container (1160 with the 40s), centred. "H1 landing smaller by 8px": 56 at the top of the clamp, 34 at the foot, .04 of the width between.

**5.428 — Arrows, a smaller organ, the arc lower.** "Add arrow left and right CTAs on both sides": the reading (the age and its line) sits in `.lpAvRead` with a round 44px arrow at either side, quiet at 6% white and brighter under the pointer, each a step of the carousel that rests the turning as a hand does. "Reduce organ by 15% scale down" and "avoid cut the organ": the organ's 300 canvas is shown at .85 (255 of layout, with -22 margins) rather than drawn into a 255 box — a shape drawn dense to its edges was being cut at the canvas's edge, and at .85 it keeps its drawing room. "Arc down by 24px": the arc's top margin from -6 to 18.

**5.429 — The names' fade, the organ again, the arrows, the ground.** "Need a fade out left and right + blur fade on the carousel nav": the names' track masks over a long run to either edge (35% at 18 and 82, gone at 2 and 98) so the neighbours stay whole and the ones past them go, and each name fades and softens further with its distance from the centre — to 8% and 3.2px at the edges, from 16% and 1.6. (A first cut of this put a line comment mid-line and swallowed the rest of it; terser refused the build, and the comment is a block now.) "Scale down by 20%, avoid cut on organ, increase amount of particles in organ by 1.35x": the shape fills .62 of its canvas rather than .78 — the 20% smaller, and the room that keeps a kidney's outer edge inside the canvas — at 12,150 dots. "Reduce arrow CTA by 2x": 22px discs with 12px chevrons, 48 in from the reading's edges. "Reduce gap XX and XX younger by 12px": the line's top margin from 10 to -2. "Bg hero #121212": the header's ground, from black.

**5.430 — "Reduce CTA 32px height. Full rounded."** The booking card's button, on every hero action and both hosts: 32 tall (from 44), a pill (from 15), 18 of side padding (from 26); the report's own padding rule goes, the pill being the same for all three.

**5.431 — "Desktop view overview push down 34 years old by 6px."** The desk's age card reading at margin -20 (from -26); the phone's stays at -20 of its own.

**5.432 — "Nav inconsistent", the hero lower and smaller, the arrows still.** The Insights desk's main (`#dMain`) centres on `margin:auto` at a 1160 cap, so retracting the nav stepped its edge 76 to the right into a wide gutter where the Overview's card holds its edge: retracted, the main's cap grows by the rail's 152 (1312), and its edge stays put — 100 from the window's edge at 1440 in place of 176 — measured. On the landing: "push down by 48px": the organ group at -16 (from -64); "reduce organ by 20%": the shape fills .5 of its canvas (from .62), with the 12,150 dots; "arrow absolute position so it doesn't jump based on the length of the age": the reading's block is a fixed 260 wide with the age and its line on one line each, so the arrows sit at the same two x whatever the reading says — measured the same across "6 years younger", "matches your age" and "8 years older".

**5.433 — "Fix the breakpoint!!! Centered content on XS S. On XS organ push down by 64px."** Forced to XS the landing's copy ran off the frame's right edge: the one-column grid was `1fr`, whose floor is the content's min-content width, and the names' track — one nowrap line of all ten ages — set that floor at the track's whole width. The column is `minmax(0,1fr)` now and the hero's pieces `min-width:0`, so the h1 wraps to two lines at 402 and one at 600. Under 900 the content is centred: the eyebrow, the h1, the copy and the CTA on the column's axis, the visual under them at the centre. At XS the organ group sits 64 lower. And a one-column hero is taller than a phone's frame, so the header takes its content's height there and the page scrolls (its scrollbar hidden), where the desktop's stays fixed — measured: 1094 of page in the 859 frame, scrolling to the names.

**5.434 — "Different padding!!!!!!!!" and "increase height by 32".** The two desks sat at different distances from the rail: the Overview's card is capped at 1280 of content plus its padding, or the shell less the rail less 16, while the Insights desk's main was capped at 1160 and centred on its own — 20 further in at 1440, flush against the rail at 1363 where the Overview kept 8. `#dMain` takes the Overview card's cap and reserve now (1328, or the shell less the rail less 16), placed after the shared rule that had been overriding a first attempt; the earlier retracted-only cap goes. Measured at 1363, 1440 and 1680, open and retracted: the two pages' edges the same to the pixel (232/80, 232/92, 288/212). And the desk's two small cards are 224 tall (from 192, "increase height by 32"); XS keeps the phone's 192.

**5.435 — V4 Overview, and the desk's field at 320.** "Create a v4 Overview": a fourth choice on the Header row, V3 with three things dropped — the Concierge tile (the row is four now), the two small cards (coverage and age) and the Insights card (the Insights section and its carousel stay) — and, on the desk, the services moved into the hero's right column, where everything they replace had been: two by two ("2 + 2", chosen over 3 + 1 wide once the count was four), each tile at least 124 tall and the rows at 1fr so the column fills to the booking card's height (260 and 260, measured). The row is one element moved by `placeSvcV4()`: into the column for V4 on the desk, back under the greeting otherwise — and at XS, where the desk wears the phone's structure, it stays above the booking card as the phone's does. `CARD_STATE.hdrV4` → `body.hdrV4` alongside `hdrV3`, since V4 is V3 underneath; V3 stays the default. And "chat field desktop 320px max width": the desk's under-the-greeting field caps at 320 (from 554), the same as its bar state.

**5.436 — The landing hero in a card, and the age at 76.** "Try another landing page version where the right visual is included inside a card, rounded corner 32px, #fff 4% bg, blur": a new Tweaks group, Organ Age landing, with one row, Hero visual — Open, or Card (the default, so the new version is the one seen): the view in a 32-radius card at 4% white with a 24px backdrop blur and a hairline, 40/24/32 of padding, the streams behind it going to a wash through the glass; the organ's -24 lift is dropped in the card, where it read as a cut against the edge. "Reduce the age by 8px font size": 76 (from 84), 56 (from 64) under 900. The body flag is `tkLpCard`, not `lpCard`: `.lpCard` is the old story's copy card, with a `will-change: opacity, transform` of its own — on the body that made it the containing block for every fixed descendant, and the landing collapsed to a zero-width box at the body's centre (the same collision `insCard` had, 5.4xx; the tk- prefix is the rule now).

**5.437 — "Use as default."** V4 is the Overview's default: the Header row opens on it, `CARD_STATE.hdrV4` starts true, and `placeSvcV4()` runs once at load so the desk's services start in the hero's column.

**5.438 — V4 in V2's header, the section spacing, See all.** "On V4 keep the header of the V2": V4 no longer wears V3 underneath — the field rides in the bar with the bell alone (the inbox disc hidden, as V2 keeps it), no profile, the greeting at the left; the V4 drops and the desk's column of services stay. "Increase section gap +8px", then "increase gap above margin +8px, below title decrease 4px": the section titles at 38 above and 22 below on the phone (from 22/26), 50 above and 10 below on the desk (from 34/14), the XS copy of the desk with the phone's. "See all font size 14px, add 2px margin between text and badge": 14 on both hosts (from 11 and 13), the gap to the count 7 and 9 (from 5 and 7).

**5.439 — Your action plan, to the design; the plan's photos; the placeholder's turn; the carousel's rest; the badge.** "Your action plan card design mobile": the phone's plan rows are the design's — a 90px square at the left, the title at 16, two lines of description clamped, the Protocol chip; a foot with where it happens (a video call with its icon, or the clinic underlined with the pin) and the button, Book lit and View quiet; a hairline between rows; the sixth, Nutrition Review, locked — faded, a lock on its picture; See full timeline a wide 14-radius button with the arrow. Six rows now, the design's (MRI Scan and Nutrition Review join), the same list copied into the desk's XS. "Use these photos for action plan item": the six 312px squares from the zip as `assets/overview/plan-*.webp`, on the phone's rows and on the desk's six protocol cards alike. Two things caught on the way: the chip inherited the description's clamped box and ran the row's width (`.tx .pr` inline now), and the new flex `.ovtl` had outranked the rule hiding the desk's copy of the list and link (hidden by id now). "For the rotating label, the next label should come with less delay, and need fade in out": the gap between the line leaving and the next arriving 150ms (from 300), the period 2.6s (from 3), and the new line's start state is released a frame later so WebKit paints it and runs the fade rather than skipping to the end. "Inactive card 90% opacity": the Explore carousel's other cards at .9 (from .2). "Badge 28px height + increase gap 2px": See all's count 28 tall on both hosts, 9 and 11 from the words.

**5.440 — The Insights count, the desk's bar and hero, the rail's edges.** "Tweak Insights: 0 / 1 / 2 / 3+": the Insights section's on/off row is a count now — 0 hides the section as off did, 1 and 2 show that many Explore cards (the others `.hid`, the carousel's machinery seeing only the shown ones, the dots redrawn, nothing to page through so the dots and the desk's arrows go; one card on the phone at the column's width), 3+ all of them. "Hero desktop height 320px": the booking card's floor on the desk and at S, said with the body so it outranks the desk's `.ovhero` reset (a plain `#dOver .ovBook` had lost to it despite coming later — the inline probe proved the box would take it); XS keeps the phone's height. "Desktop chat max width 320px" in the bar too, then "place field on the right side next to the bell, 256 max width; title on left side; also add the inbox next to the bell CTA same as mobile view": on the desk's V4 the greeting rides in the bar at the left (moved there with the services, back under the bar for the other headers and at XS), the field at the right at 256 beside the inbox and the bell — the inbox hidden on the phone's V4 only, as V2 has it. "Insights desktop item gap 24px", "title margin bottom +8px", "grid gap 24px": the rail's cards 24 apart, the desk's section titles 18 below (from 10), the hero bento and its services grid on 24 (from 12). "On desktop if overflow on carousel add a fade out to show there is more item behind it, valid on left and/or right depending on overflow": the desk's rail masks a 96px fade at whichever edge has cards past it — right at rest, both mid-way, left at the end, neither when they all fit — read on scroll, on resize, and by a ResizeObserver, since the rail has no width until its page shows.

**5.441 — "Add inbox as V2."** The phone's V4 bar keeps the inbox disc beside the bell, as the desk's does; the rule that hid it goes.

**5.442 — "+8% opacity on blanket when top field is focus."** The phone's blanket under the live field at 57% black (from 49).

**5.443 — "+24px gap between section."** On the desk's V4 the hero bento sits 24 further under the bar that carries the greeting (a margin on the grid; XS keeps the phone's spacing).

**5.444 — "Gap grid 16px. Item gap 16px."** The desk's hero bento and its services grid on 16 (from 24), and the Insights rail's cards 16 apart (from 24).

**5.445 — "Section gap +8px."** (5.444's three gaps landed in this build: the first pass matched nothing and the note went in alone.) The phone's services row keeps 16 under it to the booking card (from 8), the desk's XS copy with it.

**5.446 — The inbox on the desk, the Overview's body padding, the sticky greeting, the plan cards' border, and the tiles opening the chat.** "Remove explore more on inbox sheet": the sheet ends at its three messages. "Also use a modal on desktop M L, keep bottom sheet for XS S": the inbox is built for the desk too, from its bar's disc, mounted on the shell (`.dash`, so a forced device frames it) — at M and L a centred 440 card that fades and settles in, no handle; at XS and S, and in a window under 992, the phone's sheet at the frame's foot. "Grid 12px gap": the hero bento and its services grid back on 12. "Body padding: keep this structure for Overview": the Overview's card takes the Insights desk's 32 above and 40 at the sides at M and L (the tokens rewritten on the card, so the bar and the caps follow; the Insights main's cap to 1360 with it), the two pages measuring the same to the pixel at 1440 and 1680. "Fade out the title on sticky state": the greeting in the desk's bar fades once the page has moved under it. "Light border colour": the plan cards' hairline at 22% (from 12). And "this should trigger the chat in the context of the card, ideate discussion": a service tile opens the phone's chat in its own context — the ask the tile stands for as the question, the service as the title, and Eva's opening on it (what it is, where things stand, the step she can take) in place of the protein thread, which the field still gets. `SERVICE_CHAT` holds the five; the chat's `open` takes a context with a title and an answer of its own.

**5.447 — "Border #fff 2%."** The desk's plan cards' hairline at 2% white (from 22): all but gone against the page.

**5.448 — "Border 8%."** The plan cards' hairline at 8% white.

**5.449 — The Explore card's visual slot and title.** "Visual slot fix height 160px": the render's slot is a fixed 160 on both hosts, the image fitted to it (it had been the card's slack, growing with the card and the title's length). "Title padding right +48px", "keep regular, reduce font size by 2px": the title clears the dismiss disc with 48 at its right, at 14 (from 16; the desk's 13.5 from 15.5), regular — the source still white but no longer heavier.
With the slot fixed, the card's slack had moved under the button on the phone (the card has a 380 floor); the button takes `margin-top:auto`, so the slack sits above it and See insights stays at the foot.

**5.450 — "Hug content."** The Explore cards' floors go (380 on the phone, 352 on the desk): each card is its content's height — the eyebrow, the title, the 160 slot and the button — 326 on the phone, 328 on the desk, the same across the row.

**5.451 — "Carousel needs to be smoother on release item."** The landing's names track moves on one eased glide now — a 520ms ease-out driven frame by frame, the snap held off while it runs and back on at rest — on release after a drag, on a tap, on the arrows and on the turns alike; before, the release handed the track to a native smooth scroll with the snap live, and the snap caught it mid-way and landed it in a jump. Underneath, a second cause: the names' `offsetLeft` was measured from an ancestor, not the track, so the glide's target and the snap's rest were 24 apart and every landing corrected by that much; the track is positioned now, and the two agree — traced: the glide eases to its rest and stays.

**5.452 — "Reduce by 32px, so the card height decreases."** The Explore card's render carries a clear foot inside its 160 slot; the slot's bottom margin is -32 now, so that clear foot overlaps the room above the button and the card is 294 (from 326).

**5.453 — "On Insights V4 add a 2nd card (vertical) in the left column."** The Insights desk's pair of mini cards is two columns now: the latest report over a new upload card at the left (the records page's "Got a record from your provider? Upload records" with the glyph, in the mini card's shell), the activity card at the right running the height of both.

**5.454 — The service detail page, and the Explore visual at 128.** "Create a service detail page following the same layout as the Insights and Overview page. Follow this design": a new main on the shell, `#dSvc`, standing where the Overview's does (the same card rule, the same sidebar, the same padding and caps; written beside `#dOver` in the old shell and moved into `.dash` at boot with it), shown in its place when a plan card's Book or View, or the booking card's Book, is pressed (`body.svcOn`), the back chevron, Escape or a change of mode returning. The design's page: the back disc; the service's photo at 104, its title at 28 and "Started on 20 February 2026", the more disc at the right; then two columns — at the left the pending action on its warm tint (the orange tag, the line, the two lines of support, View options), Confirm your appointment with the warning strip and the location / duration / clinician rows on hairlines, the referrals card (the barcode tile, the line, Show) and Instructions; at the right, Your progress with its three steps on their bars (the first lit orange) and About the service with Read more. The phone's, `.svcMob`, a screen over the Overview's scroller (`#phone2.svcOn`, the dock away, the strip taking a ground once the sheet has scrolled under it): the hero with back and more over the scan's photo faded into the ground, the title and date, the progress card on glass with its four segments; then the sheet with the same sections stacked, the pending action's button full width as View Available Times, the referrals card with a chevron, Instructions, a rule, About the service and Read more. Both in the dark theme with the design's colours held for the light one (the peach tints, the black button). And "reduce the visual by 32px height, keep ratio": the Explore card's render slot at 128 (from 160), the render fitted to it.

**5.455 — A home mosaic, S as a tablet, Personas, and the Organs menu on the Concept pages only.** "First page of this artifact should be a mosaic of cards, showing each page in a minimal version": a home page under the bar (`#home`, `body.homeOn`) is what opens with no hash (and at `#home`), and a Home entry heads the Version menu. Sixteen cards, each a drawn miniature of its page — blocks for text and cards, the organ as a dot cloud, the arc as a dashed curve, the peach and orange where the page has them — with its group and name: four wide cards spanning two columns and two rows (Overview desktop, Insights desktop, the Organ Age landing, the teaser) locking twelve small ones to their edges (the Overview's mobile, the service detail's desktop and mobile, results received on both, Insights mobile, the library, the five concepts), three columns under 1100 and two under 800. A card opens its page; the service detail cards open over their Overview. Picking a page from the menu leaves the home; a page hash still opens that page directly. "Remove unnecessary padding on tablet S" and "tablet overview 2 cols same as M L": in a forced device the page is the screen — no 16 band above, no 16 gutter at the right, no card corners, no scrollbar — and S keeps the hero's two columns, the booking card beside the services' two by two (and a window between 600 and 992 the same; one column only under 600). "For Overview I need a tweak Personas, create just one for now": a Persona row with Julien · new member; `PERSONAS` holds the name and photo, written into both hosts' greeting and avatar, so a second is a row of data and an option. "Tweak organ ONLY concern Concept pages": the Organs menu (density and inks) is hidden, and closed, on every page but the five concepts.

**5.456 — Tweaks per page, and the home's miniatures fixed.** "The tweaks should be only the ones that concern the page — Insights: Biomarkers and Reports; Overview: Overview; landing: Organ Age landing; the Layout tweak is for Insights": each group and the Layout row carry the pages they concern (`data-pages`: ins / ov / lp), and `setMode` shows only the current page's — Insights desktop and mobile get the Layout, the Biomarkers tab and the Reports; the Overview (and results received, which opens over it) the Overview; the landing its own; the concepts, the library and the teaser have none, so the Tweaks menu hides (and the home page hides both menus). The Build row moved out of the Overview group to the panel's foot, shown wherever the menu is. The Persona, Hero action and Hero visual rows had `<label>`s, which took the panel's accent serif; they are `span.lbl` like the rest. And the home's miniatures used short class names (`card`, `arc`, `ph`, …) that collided with page styles and pushed blocks out of their frames; they are `x-` prefixed now, and a check counts no block outside its miniature.

**5.457 — "Version, not Header."** The Overview's first tweak row reads Version (V1–V4): it has chosen the whole page's shape since V4, not only the header.

**5.458 — Library in Concept; the Explore render clear of its button.** "Remove group, put library inside Concept group": the Library mode's group is Concept now (last in it), the Library group gone from the Version menu, and the home's library card labelled Concept. And the Explore card's render had come to sit over See insights: the -32 margin was set against the 160 slot, and at 128 the render's clear foot (17.5% of its height, measured off the alpha) is only 22 — so the margin is -14, the drawing's bottom 18 above the button, the card 280.

**5.459 — "Insights badge, height 20."** See all's count on both hosts is the design's pill: 20 tall, a ring and the number in warm cream (#fbe9d8) on dark amber (#43220b), 6/8 of padding and 4 between ring and number; the phone's and the desk's share one rule now.

**5.460 — "Put service detail in a new group. Also, where is desktop?"** The service detail page had only been reachable by pressing Book on the Overview, the desktop one included. It is a group of its own in the Version menu now, under the Overview's — Desktop and Mobile — each entry opening its Overview and the page over it. The menu names the page that is showing: it reads Service detail · Desktop when the page is opened from a Book button too, and goes back to the Overview's entry when the back chevron closes it.

**5.461 — "Service access from menu, and from the action plan card on the Overview."** The sidebar's Services entry opens the service detail page from any desk page (over the Overview's desk), and Services is the lit entry while it shows, Overview unlit; the back chevron returns and Overview lights again. The whole action plan card opens it now, not only its Book or View — the desk's protocol cards (a faint lift under the pointer) and the phone's plan rows alike.

**5.462 — The rail's fades eased, 24 above the card's button, the badge without its ring.** "Fade out when it's been displayed, should appear smoothly": the desk rail's edge fades used to switch masks on a class, so they popped; one mask is always on now, its two fade widths registered with `@property` as lengths and transitioned over .38s — 0 where nothing runs past an edge, 96 where cards do (traced: 0 → 23 → 58 → 79 → 90 → 96). "Add 24px padding top on insight card footer": See insights stands 24 further under the render (the drawing 42 above it; the desk card 306). "Badge Insights, NO icon, height 28px": the count pill drops its ring and is 28 tall, 13px type, 10 at the sides, the same dark amber and cream.

**5.463 — "Remove task and this tweak."** The Card hero bento row is gone from the Overview's tweaks, and with it the Tasks card it switched to: the "Tasks to complete" heading and list are out of both hosts' markup, the handler and the CSS that hid them go too. The Insights card is the only card there (still hidden in V4, which drops it); V1–V3 show it on both hosts. The Overview's tweaks read Version, Persona, Services, Hero action, Insights.

**5.464 — "Same behaviour as all top nav, with gradient, blur, fixed on scroll."** The service page's back button rides a bar like the Overview's: sticky at the card's top (its padding cancelled as the Overview's bar cancels it), the same black tint running out 36 below it and the same ten blur bands (`.ovGround`), both hidden at rest and faded in once the page has scrolled under it (`#dSvc.ovScrolled`, set past 6px). Light theme takes the cream tint; XS the phone's inset.

**5.465 — Every service tile clickable on the desk; a New user persona.** "All should be clickable": the phone's service tiles opened the chat in their context, the desk's did nothing — the desk had no chat. The chat builder makes a third one now, for the shell: a dim and a centred 640 card at M and L, the whole frame at XS and S (and in a window under 992), no drawn keyboard, a click on the dim letting go; the desk's service tiles open it in their context as the phone's do, and the desk's field hands its question to it on Enter or its send disc. At forced XS the device's dock hides while the chat is open (the composer stands there). "Create a persona, New user: remove the Insights section, add Health profile and Bio age cards below the next step card, no action plan section": a second Persona option, New user (`body.psNew`) — the Insights section and the action plan section (heading, cards, timeline link) gone on both hosts, and the two small cards back under the booking card: on the phone where they stand, on the desk moved out of the hero's column into a row under the hero (and back when the persona changes). The coverage card reads Health profile for the new user; the desk's wide age card keeps its organ, arc and reading at their drawn 300, centred, so the reading stays in the card. The first persona is renamed Julien · member.

**5.466 — The New user's cards: three steps, and Biomarkers locked.** "Replace by a simple 3 steps to-do style: connect wearable, complete questionnaire, book consult": the new user's Health profile card is a to-do — "0 of 3 done" and the three steps, each an empty ring and its name on a hairline — in place of the percentage and gauge, on both hosts (the steps wrap on the phone's narrow card, which then grows past 192 with its neighbour, the two sharing the row equally). "For the new user this should be the biomarker visual, locked; title Biomarkers; title footer removed": the age card locks — the human body the phone hero's biomarker slide shows, greyed under a lock disc, the eyebrow Biomarkers, the arc dimmed at zero, no "years old", no swipe, and no tap through to Insights; switching back to Julien unlocks it onto the reading it was on (`card._ovAge.lock`).

**5.467 — "Go to service" from the dock.** The mobile dock's Services tab opens the service detail page: from the Overview phone and from the Insights phone alike (the Overview phone with the page over it, the menu reading Service detail · Mobile), and in the forced XS device the desk's page, the device's dock lighting Services while it shows and Overview again when the back chevron closes it. Plan and More still have no screen and stay where they are.

**5.468 — "Add a small title with doctor and date, like this."** Each Explore card carries its source under the title, grey and small, with a short rule between the two: the doctor for a document (Dr Edward Lim · 14 Apr 2026 on the Dexa report and on the blood panel, Dr Steven Lu on the questionnaire — each matching the name on its render), the device for a device (Apple Watch · 9 Apr 2026; Oura ring · Syncing). One line in the card builder, so the phone's row and the desk's rail show it alike.

**5.469 — The tablet's island, the service page's corner and its right panel.** "Overview S, keeping the nav island at the bottom": the forced S tablet carries the phone's dock too, centred at 420 rather than stretched across the frame, the page's foot clearing it by 120; it hides while the desk's chat is open, and its Services tab opens the service page as the XS device's does. "Rounded corner missing": the shell draws a corner block measured off the card that is showing, and it was measuring off the Overview's card while the service page showed — the service page is measured now, and the shell re-measures when the page opens and closes. "Push up the right side panel, same level as the left body content": the service header (photo, title, date, more) sits in the left column now, so the progress panel's top is level with the photo's (153 and 153).

5.470 — The phone service page's top bar now behaves like the Overview's on scroll ("same behaviour as the home page top bar"). Its back and more discs used to live inside the hero and scroll away with it. They now sit in a sticky `.svmNav` at the top of `.svcMob`, clear of the status strip. The hero is pulled up under the bar by the bar's height, so at rest the page looks as before. Once the sheet scrolls past 6px (the Overview's threshold, previously 40), the bar fades in the Overview's black .55→0 tint, 38px past its foot, and ten blur bands (`.ovGround`) over .28s. The status strip's solid ground from 5.464 is dropped, since the tint now covers it. The desk service page already had this bar (5.464).

**5.471 — Reports tab (desk): Upload records on the title's line; the photo 64 shorter.** "Upload record on Report tab should be at the same level than the Title Medical records on the right side": the desk takes the phone's arrangement. The link, `.docLink.headUp`, sits at the Medical records title's right on its line; its centre is within half a pixel of the title's. The upload card that held it in the right column is gone on the desk (`.dash .docRow` hidden), and at one report the column that was only that card goes with it. The info sheet's "Upload records" now scrolls to the link. "Reduce height bg 64 — the step card, that will automatically reduce the height of the latest report and right col": the latest report's photo from the 220 it was stretched to (by the stack plus the upload card) down to a 156 floor. The card goes from 340 to 276, and the Other reports stack beside it stretches to match (276). The phone is unchanged; it already had the link on the title's line.

**5.472 — The Timeline page ("create a new page with breakpoint control called Timeline, reproduce based on these captures XS and L, the same layout as the other pages").** A new desk main, `#dTl`, in the Overview's shell as the service page is: the sidebar (its Timeline entry now opens it and is lit while it shows), the card, the forced breakpoints and their device frames, the dock inside the phone and tablet. It opens from the sidebar, from a new "Timeline" group in the menu, and from a wide card on the home page. The dock's Overview in the forced device goes back to the Overview; opening the service page closes it and vice versa; any change of mode closes it. The Tweaks menu is hidden here, since no tweak concerns it. One page for every breakpoint: its own width picks the layout (a container query at 540px, measured on the content box). From S up it is the L capture: the title, the tabs (Upcoming · Yours to claim · Past) with the search at the right, and the months down a rail with a dot at each heading (the care team's spark, this month filled, the ones ahead hollow). Each row has an 80px picture, the title and one line of description, what and where under them (requested, clinic link, date, video call, the doctor's avatar, records), and View / Book / Purchase with the ⋯ at the right. The suggestions sit in a tray, a card of rows inside it. At XS it is the phone capture: no rail, the 44px picture beside the title, the details stacked under it, the actions full width, and the suggestions as a snapping carousel of cards with their arrows. The tabs and search ride a sticky bar that takes the Overview's tint and ten blur bands once the title has gone under (under the status strip in the devices). Rows are written from data (`TL`), so the tabs switch content (claimable items, completed ones) and the search filters the tab showing, dropping empty months, with a "Nothing matches" line. Photos are the plan's own (consult, pathology, DEXA, MRI, nutrition, the doctor for the MRI briefing). The doctor's avatar, `assets/overview/avatar-dr.webp`, is a face crop of the consult portrait, and those lines name Dr Sarah Chen, whose face it is, rather than the capture's "Dr. Steven". Dark by default with light-mode tokens. On the way: in light mode the sidebar had kept Insights lit on the Overview's shell (the light plate outranked the rule unlighting it); fixed.

**5.473 — Timeline: dark mode to the captures; every row opens its own service page; progress and steps in the row; service groups.** "Adjust dark mode": the page's colours read off the dark captures and checked against the render, pixel for pixel. View and Purchase sit on a #484848 plate (24% white), the ⋯ on #1c1c1c (5.5%), bare beside Book on the phone. The suggestions are a #1c1c1c tray round a solid #2a2a2a card, with the same two plates on it (#5c / #35). The search field is filled #1c1c1c; the rail, the dots and the rules are barely there. Light mode keeps its own tokens.

"The View CTA + click on the entire object always redirect to the service page; adapt the content on each service detail page based on where you come from": the service page is one template painted from data (`SVC` in servicePage), with a state (`STATE`). Eight services have their own title, photo, where, how long, who, referral or not, instructions, three steps and about text: DEXA, onboarding consult, MRI briefing, MRI, nutrition review, pathology, CT calcium score, physical assessment. The state is the one the entry is in: requested (the original "pending action"), to book, booked, suggested, to buy, to claim, due later, done. It sets the card at the top (orange when something is asked of you, green when settled, neutral when on offer), the section title, the Date row, the progress (x/3) and the line under the title. The whole row opens it, View / Book / Purchase included, but not the ⋯; the back chevron returns to the Timeline at the scroll it left. The Overview's plan cards open their own service too (by title), both desk and phone, and the booking card's Book opens the service its hero shows. Fixed on the way: an override left undefined (a row with no title of its own) had blanked the page's h1.

"A sense of progress through the steps via a mini increment visual; a detail view of the steps (accordion); if the service is a service group, the service breakdown inside the object + the active steps": each row that is yours has a segmented bar under its details, one segment per step (done orange, current half-filled, the rest faint, green once completed), then "Step 1 of 3 · Book your appointment" and a Steps toggle. The toggle opens an accordion (grid rows 0fr→1fr) with the steps as a small timeline: done with a green check, current with an orange ring, to come faint. Suggestions and "due at 50/60" rows have none, since they are not started. A group — "Heart health check" under the care team, added as the example: advanced blood panel done, CT calcium score in progress, cardiology review up next — has a segment per service, "Service 2 of 3 · CT Coronary Calcium Score", and a Details toggle. Its accordion lists the services with their status, then the active service's steps. A service in the list opens that service's page; the row opens the active one; clicking inside the open box never opens anything.

**5.474 — "Add 4px padding inside the main card" (the Suggestions tray).** The tray's padding round its card is 8 in place of 4, on both sides and the bottom. The tray sits 4 further out (margin-left −22) so the suggestion pictures stay on the same line as the rows above (both at x 492 at 1440). Its "Suggestions" label comes 4 in to stay where it was over the card, and its corners go from 18 to 20 to follow the wider inset. Desk only; the XS carousel keeps its own spacing.

**5.475 — Service groups from the examples; split button; steps as short titles; complete struck through.** "Some e.g. of service group, the rest can be simple service": the placeholder Heart health check is gone. Two groups take its place, from the two examples.

- **Member Check-In (August):** DEXA Scan in hand ("Book appointment", its steps Book appointment · Booked · Done). Diagnostics Review and Member Check-In are locked, each saying "You need to complete your … before you can book this appointment."
- **Microbiome & Gut Health Assessment (September):** Gut Health Questionnaire done; the assessment in hand ("Collect sample", "Collect your sample and post it back (Mon or Tue only)", its eight steps from Confirm address to Report ready, four in); Microbiome Report coming (blue ring); Gut Health Review under "Next steps", locked until the report.

Every other row stays a simple service. A group's Details opens one vertical line of its services — done a green check, the one in hand an orange ring opened into its steps as dots, coming blue, waiting grey — each with its status chip (orange for the one in hand) and no status column at the right ("no need status on the right"). The steps sit inside that line, under their service ("the step need to be part of the vertical timeline, not at the end"). Six services were added so each opens its own page: Diagnostics Review, Member Check-In, the questionnaire, the assessment, the report, the review. So were three states: in hand (the chip and its line, progress x/8), locked (the reason, Book appointment greyed out), coming (the report). A service in the group's line opens its page; the row and its button open the one in hand.

"When ... present put in a split button": a row with a ⋯ has one button of two halves, the action at the left and the ⋯ at the right past a hairline, on one plate (grey, or white for Book, Claim and Collect sample). Each half is its own target; the ⋯ still opens nothing. "Keep the steps short, just title, not sub": the simple rows' steps are titles only. "Complete → strikethrough": a done step, a done service and a done sub-step are struck through in the faint grey.

**5.476 — Timeline: tabs as Insights', a hover state, and a divider as wide as it.** "Timeline tab: keep the same behaviour as the tabs from Insights, with movement": the words at 15, 30 apart, on a hairline across the bar's whole width (under the tabs alone at XS, where the search stands below them). A 2px underline (`.tlThumb`) slides and resizes to the tab pressed on Insights' own curve and time (.34s cubic-bezier(.22,.61,.36,1)). It is measured off the tab, placed without the slide the first time the bar has a width, and re-measured by a ResizeObserver, so a breakpoint change never leaves it at the old tab's size (XS had kept L's 68 wide under a 123 tab). "Add hover state": the whole row lifts onto a rounded tile (20 radius, 5.5% white) reaching 24 past the picture and the buttons, as the capture; in the suggestions card it is a 4% tile inside the card, and it only applies where there is a mouse. "Also need small divider": the rule between rows is now 7% (from 4%) and as wide as the tile, 24 past either side, and fades out beside the row under the pointer so the tile never sits on a line.

**5.477 — "Increase title font size by 2px."** The Timeline rows' titles are 17 in place of 15 (letter-spacing −.1), on every breakpoint, including the suggestions' and the groups' rows. Measured: every title 17px at L and XS, no horizontal overflow at XS.

**5.478 — Timeline rows: the gap, the count in the chip, 12px pictures, primary actions open, an even tile.**

- "Visual and content + 4px gap": the picture and the text are 18 apart (from 14), 16 at XS (from 12).
- "Step 1 of 3 → merge into chip; remove status between step x of x and step chip": the progress line is the segments and one chip, which reads "Step 2 of 3", "Service 2 of 4", "Not started" or "Completed" with its chevron, and opens the steps. The "· Meet your doctor" status that stood between them is gone.
- "Img radius 12px": the 80px pictures have 12 corners (8 at XS's 44).
- "When it's a primary action, show the card inside upfront": a row whose button is the primary one (Book, Collect sample, Claim) renders with its steps already open (aria-expanded true). Today that is MRI Briefing, MRI Scan and the Microbiome group, and the three Claim rows. A tap still closes it; View rows stay closed.
- "Reduce card padding by 6px, even on all sides": the hover tile reaches 18 past the picture and the buttons (from 24), the same 18 as above and below. Measured 18/18/18/18. The divider between rows follows it.

**5.479 — "Reduce padding by 4px" (the row's hover tile).** The tile reaches 14 past the picture and the buttons (from 18), and sits 4 inside the row's own 18 above and below, so it is 14 on every side while the rows keep their spacing. Measured 14/14/14/14. The divider between rows follows the tile's width.

**5.480 — "The item divider should be outside the object, 8px margin top and bottom; on hover we see a gap of 8px between the card and the divider."** The rows' padding is 22 above and below (from 18): 8 of gap plus the tile's 14. The hover tile sits 8 in from the row's edges (top and bottom 8, sides −14). The dividers no longer fade out beside the row under the pointer: they stay, with an 8px band of page between them and the tile. Measured gap 8 above and 8 below, 14 inside, both dividers at full opacity on hover.

**5.481 — "Spread by 4 cards here, one per service, stacked, gap 2px."** A group's Details is no longer one box: each service is its own card (5.5% white, 14×16 inside), stacked 2 apart. The stack's outer corners are 12 and the inner ones 4 (12 12 4 4 · 4 · 4 · 4 4 12 12), so the cards read as one pile. The line joining the rings is gone now the cards part them. Each card keeps its ring, title, chip, line and, for the service in hand, its dot steps, and lightens a little under the pointer; a click on one still opens that service's page. Measured: 4 cards, gaps 2/2/2, at L and XS.

**5.482 — The progress in the chip; the Preventative Health Genetic Test.**

- **"Merge progress and chip":** the segments ride inside the chip, ahead of the count and the chevron (`▬▬▬ Step 2 of 3 ⌄`); the row's progress line is that one control. A tap anywhere on it, the bar included, opens the steps and never the page.
- **"Create this one as well" (the Preventative Health Genetic Test example):** a third group in September. It is a group of one service: Eugene Genetics' saliva kit waiting on delivery, with a blue "Confirm delivery" chip and ring ("waiting on someone else" is blue, the one in hand orange) and "Your kit is on its way — usually 3 to 7 business days".
  - Its seven steps run Confirm address and "Your Eugene kit is being prepared", each done with its date (14 Sept 2026, set beside it and not struck through with it), then Confirm delivery (current), Collect sample, Pending results, Results in and Report ready. The example's second "Results in" is read as Report ready.
  - A group of one counts its steps rather than its one service: seven segments, "Step 3 of 7".
  - Its button is Confirm delivery, a primary action, so the row comes open.
  - The service has its own page (`gene` in SVC): at home, posted back, Eugene Genetics, referral, saliva-sample instructions and an about; opened from the row it reads "In progress · Confirm delivery. · 3/7".

**5.483 — The DEXA flow as three rows; step titles regular.** "DEXA timeline: need these 3 objects in the timeline, all in the same timeline block" (answered: three separate rows): the Member Check-In group row in August is replaced by its three services, one after the other in the August block.

- **DEXA Scan:** an orange "Book appointment" chip after its title, "Book your DEXA scan to measure body composition and bone density". Its own steps are Book appointment · Booked · Done (a row can now name its steps; its page shows the same three, 1/3). `[Book | ⋯]`, primary, so it comes open.
- **Diagnostics Review:** a grey chip, "You need to complete your DEXA Scan before you can book this appointment.", no button, its picture and title dimmed (`.tlRow.lock`), no steps. Its page is the locked one, with Book appointment greyed out.
- **Member Check-In:** the same, waiting on Diagnostics Review.

Each carries "Member Check-In · x of 3" to say they belong together. Rows can now take a chip after the title (`tag`) and go without buttons.

"Regular": the steps' titles are weight 400 (from 500), the current one included; the orange ring and the brighter colour still mark it.

**5.484 — The home page, one row per page ("use one row per page, then inside put the entry points").** The mosaic of sixteen cards is regrouped. Each page is a row, in the order the pages are worked on:

- Overview, Insights, Service detail, Timeline and Results received (Desktop · Mobile each)
- Landing page (Organ Age)
- Video (Teaser video)
- Concept (six)

A row has the page's name, one line on what it is and its count of entry points at the left, and its entry points at the right, cards of one size (every shot the same 16:10, so the drawings keep their proportions) that wrap when there are many. The cards drop their eyebrow, since the row names the page, and read just Desktop, Mobile or the concept's name. Timeline gains a Mobile entry point: the same page opened at the forced XS in the phone frame (its Desktop card puts the viewport back to Auto). Under 900px a row stacks its header over its cards, and under 520px the cards go one per line.

**5.485 — A locked object stands under its blocker, and says so.** "If an object is not available it's because another is not finished yet; then it needs to be below the blocker object, and we need to see a step chip so we know what blocks it."

- **Order:** the renderer puts each row that waits on another (`need`) directly under that row, chains included (DEXA Scan → Diagnostics Review → Member Check-In). This holds in every section and tab whatever order the data lists them in; a row whose blocker is not in the section keeps its place.
- **Chip:** a locked row's progress chip is a blocker chip. It shows a lock, then the blocker's own progress (DEXA's three segments with step 1 in hand; Diagnostics Review's three still empty, since it is itself waiting), then "Waiting on DEXA Scan".
- **Tap:** the chip scrolls to the blocker and lights it for a moment (the hover tile, washed orange, fading back); it never opens a page. The lock line under the title stays as it was.

**5.486 — Rings by state; no "Next steps"; no badge on DEXA.** "Complete: green check; current: white circle; future (locked): white at 30%": one rule now sets every ring on the Timeline, in the steps list and in a group's cards. Done is the green disc with its check; the one in hand is a white ring (its orange dot and the orange, and the blue of the waiting kit, are gone); what is still to come, locked or not, is a white ring at 30% (Microbiome Report no longer blue). Light mode reads the same in the page's dark ink. "Remove next step title": the small "Next steps" over a group's last service is gone. "Remove orange badge here": the DEXA Scan row's title has no "Book appointment" badge, since its Book button says it; the locked rows keep their grey chips.

**5.487 — Every object has its steps; a single service is level one; the future faint; Step x / x; the cards 8 and 6.**

- **"When it's locked I still need to see why, so the step block is needed for all objects":** every row now has its steps chip and block. The Waiting on chip of a locked row opens a block that starts with the reason, "Complete your DEXA Scan", as the step in hand, with a link to it ("DEXA Scan · Step 1 of 3 →", which scrolls to the blocker and lights it). The row's own steps follow, all to come. Suggestions and the rows due at 50 and 60 read "Not started" and open their three steps. The chevron alone turns when a chip opens (the lock had been turning upside down with it).
- **"If the service is not a service group, treat the steps as level one, with the circle indicator":** the Preventative Health Genetic Test is a plain row now, not a group of one. Its seven steps are the ring list, the two done ones with their date beside them, and "Your kit is on its way — usually 3 to 7 business days" is its detail line. It has no badge by its title (as with DEXA); its page still asks "Confirm delivery." at 3/7.
- **"Circle border 16% opacity; the locked step title opacity 50%":** the rings still to come are white at 16% (from 30%), and their titles are at 50%: the steps to come and a group's coming or locked services (Microbiome Report, Gut Health Review).
- **"Indicate Step x / x on the active step card":** the service in hand in a group carries "Step 4 / 8" at the right of its title line.
- **"Radius 8px all cards", "6px gap":** a group's service cards all have 8 corners and stand 6 apart.

**5.488 — "Green when complete. No increment, linear progress, width 96px."** The segments in the steps chip are one linear bar, 96 wide and 4 tall on the faint track. It fills orange with what is done plus half the step in hand, e.g. Step 1 of 3 at 16px, Step 2 of 3 at 48, Step 3 of 7 at 34, Service 2 of 4 at 36. Once everything is done it is full and green (the Past tab). Not started is an empty track. The same bar stands in the locked rows' Waiting on chips, showing the blocker's progress. The segments are still what the chip is built from and are turned into the bar as the list renders, so every chip on every tab has it.

**5.489 — Increments for groups only; service cards 10.** "Increment only when service group, each increment is one": a group's chip keeps its segments, one per service, across the same 96px (3 apart): done green, the one in hand orange, the rest faint. The Microbiome group reads green · orange · faint · faint for Service 2 of 4. Every single service keeps the linear bar, and so do the Waiting on chips. "Services card 10px radius": a group's service cards have 10 corners (from 8), still 6 apart.

**5.490 — A group's steps as rings; the Member Check-In group; steps closer.** "Keep same style for bullet indicator": the service in hand inside a group lists its steps with the same rings as a single service's (the green check, the white ring, 16% white to come, joined by the line), not the small dots. The service cards' own 20px rings stay theirs, now scoped so the steps inside get the standard 16. "Add this one": the Member Check-In as a service group, in October, beside the three separate rows in August. DEXA Scan is in hand ("Book appointment", its line, Step 1 / 3, its steps Book appointment · Booked · Done); Diagnostics Review and Member Check-In are locked, each with "You need to complete your …". It has three increments, Service 1 of 3 and `[Book | ⋯]`, so it comes open; its locked services open their locked pages. "Compress a bit": the step lists are 6 between steps (from 10), a step every 22px.

**5.491 — XS and S: the steps in a bottom sheet; no badge on the service in hand.** "On mobile XS S, always open the steps detail inside a bottom sheet": at the forced XS and S, or a window under 992, the steps chip opens a sheet inside the device instead of the inline accordion. Inline details are hidden in that mode, so the primary rows no longer come open there.

- **Sheet:** a grab bar, the row's title and its chip (the bar and "Step 3 of 7" / "Service 2 of 4"), a close disc, the same detail the accordion holds (the rings, a group's cards, a locked row's reason), and the row's own buttons at the foot. At S it is 480 wide and centred, like the dock.
- **Actions:** the foot's button opens the service page; a group's service opens its own page; "DEXA Scan · Step 1 of 3 →" closes the sheet and takes you to the blocker.
- **Closing:** the dim, the close disc or Escape close it, and so does leaving the page or changing mode. The device's dock hides while it is up, as for the chat.
- **Rings:** the ring rules now reach the sheet too, which sits outside #dTl (its first build showed the old orange ring).

"Remove badge orange": the service in hand in a group has no chip ("Collect sample", DEXA's "Book appointment"), since the row's button says it. The locked services keep their grey "Book appointment".

**5.492 — Later; sticky months; primary first; quieter rules; no trail; no chip on suggestions; square-ish chips.**

- **"All locked objects need to appear under a group 'Later' at the end of the list":** the renderer takes every locked row out of its month into a last section, Later (Diagnostics Review, then Member Check-In, still in blocker order). A month left with nothing is dropped.
- **"Make the month title stacked sticky on scroll, same as the alphabetical names in the Contacts app":** each month's title is sticky inside its month, just under the tabs bar, on the page's ground (its dot with it). When the next month arrives it pushes the previous title up and out. The stick point is measured off the bar wherever it sticks (24px on the desk, 95 in the XS device, under the status strip).
- **"+4px top bottom on divider":** 12 between the hover tile and the rules (rows 26 above and below, the tile 12 in), the tile still 14 inside.
- **"Primary object always first in the month group list":** within a month, rows whose button is the primary one come first. August is MRI Briefing, DEXA Scan, then Onboarding consult; September leads with MRI Scan, the genetic test and the Microbiome group.
- **"Divider reduce opacity 30%":** the rules between rows are 5% (from 7%).
- **"No need trail":** the steps' rings stand alone, no line between them.
- **"Suggested item no need step chip":** the suggestions have no steps chip.
- **"Radius 8px, not fully rounded":** the steps chip, and its copy in the sheet, have 8 corners.

**5.493 — "No need trail, use vertical progress bar."** The steps' rings are gone: each step has a 4px segment at its left, the height of its line, 4 apart from the next. Done is green, the one in hand orange, and to come faint (16% white), so the list reads as the chip's increments stood on end. This applies to a single service's steps, the service in hand inside a group, a locked row's list (its "Complete your DEXA Scan" segment orange), and the XS/S sheet. A group's service cards keep their 20px rings. Done steps are still struck through, and dates stay beside them.

**5.494 — XS: chip and button side by side; the stuck title's fade; the step in hand fills; the bars to the reference.**

- **"Next to each other, same height 56px":** at XS the steps chip and the row's button share a line, both 56 tall, 12 corners. The chip is as wide as its words (a 72 bar inside) and the button fills the rest, its label giving way (ellipsis) before the screen does; the XS page had been 15px too wide with "Confirm delivery ⋯". A row with no chip (a suggestion) gives the button the whole line.
- **"The sticky gradient should be at the end of the vertical":** a month title stuck under the bar carries the stack's fade at its foot, 28px from the page's ground to clear. It shows only while stuck (marked on scroll), so rows at rest are never dimmed.
- **"First increment move top to bottom, so we feel it's currently happening":** the step in hand's segment fills from top to bottom in orange over its faint track, holds, fades a little and starts again (1.8s). It stays still and solid under reduced motion.
- **"Ignore sub" (the reference's bars):** the steps stay titles only; the segments are 6 wide (3 corners), 8 apart, 16 from the words.

**5.495 — Thinner bars 2 apart; the step in hand flows; "Your next step".**

- **"Reduce width 2px, vertical gap 2px":** the step segments are 4 wide (2 corners), 2 apart and 26 tall, so the words keep their spacing and the segments read nearly as one bar.
- **"Movement with gradient":** the step in hand no longer fills and resets. An orange gradient flows down it without end (bright and faint orange bands, one period the segment's height, 1.4s linear, so the loop has no seam); still and solid under reduced motion.
- **"Add badge 'Your next step', orange":** the step in hand in every list carries an orange "Your next step" badge beside its title, 20 tall and 6 corners. That covers a single service, the service in hand in a group, a locked row's "Complete your DEXA Scan", and the XS/S sheet. It first sat high, because an old rule for the steps' sublines styled every span in the list as a block; the badge is set past it and centred on the title.

**5.496 — The step in hand beside the chip.** "Add an orange badge next to it that reuses the current step in progress; when the steps are open it disappears, as we see the same on the list": beside the steps chip, an orange badge names the step in hand (28 tall, 8 corners), e.g. "Meet your doctor", "Get your referral". A group shows its active service's step in hand ("Collect sample", "Book appointment"). It hides while the steps are open, since the list then shows that step with its "Your next step" badge; the rows that come open (the primary ones) show it once closed. There is none on rows that are not started, complete or locked (a locked row's chip already says what it waits on). At S, in sheet mode, it always shows, since the steps never open inline there. At XS it stays hidden, since the chip and the button fill the line.

**5.497 — The ages after Later, and locked.** "After Later, also should be locked":

- **Order:** the 50 and 60 years old sections now close the list, after Later.
- **Their DEXA rows:** locked by age. Dimmed like the other locked rows, no buttons, and "Available when you turn 50." (60) as their line.
- **Chip:** a lock with "Unlocks at 50", no progress, since there is none yet. It opens their steps: "Available when you turn 50" first, then the scan's own three, all to come.
- **Page:** the row still opens its page, "Due when you turn 50."

These rows stay in their own sections (a `tail` section) rather than joining Later, which holds the rows waiting on another service.

**5.498 — "Show increments, related to the number of steps inside the service."** The chip's linear bar gives way to increments everywhere, still across 96 (3 apart), one per step of the service: three for most, seven for the genetic test, eight for a service with eight. Done steps are green, the one in hand orange, the rest faint, matching the vertical bar in the list below. A group keeps one per service, the Waiting on chips show their blocker's steps the same way, and a completed row is all green (Past).

**5.499 — The increments ride in the active badge, always 96.** "Put the step increment progress inside the active badge; the increment group must always be 96px in total width":

- **Badge:** where a row has a step in hand, the increments sit in its orange badge ahead of the step's name (▬▬▬ Meet your doctor). Done green, the one in hand orange, to come a faint orange on the badge's tint.
- **Chip:** it then reads "Step 2 of 3 ⌄" alone.
- **When the badge isn't there, the chip keeps the increments:** while the steps are open (the badge hides), at XS (the badge has no room), and on rows with nothing in hand (not started, complete, locked).
- **Width:** the group is 96 wide whatever the number of steps, XS included (it had been 72 there).

**5.500 — DEXA shows what comes after it; the chip the same open or closed.**

- **"The DEXA should also show the 2 other services related":** the August DEXA Scan row (Member Check-In · 1 of 3) lists, under its own steps, the two services that wait on it, Diagnostics Review and Member Check-In. Each has a faint bar the height of its two lines, its name, a grey "Book appointment" chip and "You need to complete your … before you can book this appointment." (a row's `then`). Either opens its locked page, from the row or from the XS/S sheet.
- **"When collapsed, keep the same chip, just turn the chevron":** the steps chip reads "Step 1 of 3" whether the steps are open or closed, the same width, with only its chevron turning. It no longer takes the increments back when opened; they live in the active badge, which hides while open.
- **The related chips:** these grey chips were caught by the old subline rule for spans too, like the next-step badge; they are set past it and centred on their names.

**5.501 — "Remove gradient, just normal movement."** The step in hand's segment no longer carries a flowing gradient. A solid orange fill grows down it from top to bottom over its faint track, holds full, and starts again (1.6s). It stays still and solid under reduced motion.

**5.502 — DEXA inside its group, with service cards.** "No — the DEXA is part of a group of services, same as this one: use the separate service cards when it's part of a service group":

- **August:** the DEXA Scan row (with its steps and the two related services listed under it, 5.500) is replaced by the Member Check-In service group, drawn as Microbiome is. The DEXA Scan card is in hand (its line, Step 1 / 3, its steps Book appointment · Booked · Done with "Your next step"), then the Diagnostics Review and Member Check-In cards, locked, each with its grey chip and "You need to complete your …".
- **The group row:** Service 1 of 3, the badge carrying the increments and the step in hand, `[Book | ⋯]`, open as a primary.
- **Removed as duplicates of it:** the two locked rows it made redundant (so Later, now empty, is gone), and the second Member Check-In group in October.
- **What stays:** a single service can still name the services after it (`then`), and a locked service standing on its own still goes to Later.

**5.503 — A group's services as objects placed by their own state, each with the group's cards.** "This is locked because the DEXA is not completed yet, so it should appear in Later; need to use the same list of services inside the DEXA service": the Member Check-In group's three services are now three objects, each placed by its own state. DEXA Scan in August (in hand, `[Book | ⋯]`, open). Diagnostics Review and Member Check-In in Later, dimmed, with their "Waiting on DEXA Scan" / "Waiting on Diagnostics Review" chips, in blocker order.

- **Inside each:** the same list of the group's service cards (one `CHECKIN` definition for all three): DEXA in hand with its steps and "Your next step", then the two locked cards. The object's own card is outlined in the list (`focus`).
- **Chip:** Service 1 of 3 on DEXA's object; the Waiting on chip over the same list on the locked ones.
- **Taps:** an object's button, title or row opens its own service's page, not the group's active one. A card in the list opens that card's service.

**5.504 — A passive step reads neutral.** "If a service has a passive step (one that isn't on them, e.g. Get your results), the badge status needs to be neutral, no orange, and neutral progress." Steps that wait on someone else (Get your results / plan / referral / cleared, the kit being prepared, Ordered, Pending results, Results in, Report written, Report ready) are passive (`PASSIVE`).

- **Passive step in hand:** the badge beside the chip is grey with light text, and its increment is white rather than orange. In the step list, the bar fills white and the badge reads "In progress" instead of an orange "Your next step".
- **Action step in hand:** unchanged, orange.
- **Example:** a Pathology Test in "With your care team" waiting on its results (step 3 of 3).

**5.505 — The active service card has a 2px white border.** "Active service 2px border white": in a group's list of service cards, the one in hand (`li.cur`) is bordered with a 2px inset in `--tlMkCur`. That is white in dark mode and dark ink in light mode, matching its ring. It applies in the inline stack and the bottom sheet. An object's own card that isn't active keeps the faint 1px outline.

**5.506 — The active service card is lighter instead of bordered; the service page's done steps are green.**

- **Active card:** "No, remove border, just increase #fff opacity by 8% on the active service bg." The in-hand card in a group's list has no border. Its ground is `rgba(255,255,255,.135)` instead of `.055`, and `.17` on hover. Light mode uses the ink equivalent.
- **Service page:** "First bar progress needs to be green." The service page's "Your progress" bars are now split by state. Done steps are green (`.svStep.ok`, #9cc088), the step in hand is orange, and future steps stay faint. Before, every step up to the current one was orange.

**5.507 — Quieter service cards: a filled lock, names only when not active, no step count.** In a group's list of service cards:

- **Locked cards:** a service locked behind another has a filled lock (`LOCKF`) in place of the empty ring, in the ring's grey (`--tlMkFut`). This follows "for locked service, replace circle by a filled lock icon same grey colour".
- **Inactive cards:** a card that isn't the one in hand (done, coming up or locked) shows only its name, with no "You need to complete…" line and no badge. This follows "if service is not active, remove the sub title and badge on the cards".
- **Active card:** the "Step x / y" on its right is gone ("remove step right side"). Its steps list and "Your next step" say it.

**5.508 — Pathology first in "With your care team", with its photo; a single service's steps on the active ground; smaller marks.**

- **First row:** "First one replace by pathology." The care team's first object is now a Pathology Test, requested 11 days ago. It has two steps: "Complete your test" (in hand, "Your next step") and "Get your results".
- **Pathology photo:** the uploaded photo becomes the Timeline's pathology thumbnail (`assets/overview/tl-path.webp`, a 312 square crop). It replaces the orange placeholder on every pathology row.
- **Passive-step example:** now a Dexa Scan waiting on its results (step 3 of 3, neutral badge), so the section doesn't show two pathologies.
- **Single service's steps box:** "If a service is not part of a group, it is still active, so the same bg opacity." The steps box of a single service (`.tlDetBox.tlDetAct`) takes the active card's ground, `rgba(255,255,255,.135)`, with the ink equivalent in light mode. Locked and age boxes keep the quiet ground.
- **Group card marks:** "Reduce circle." The circle was already 20 × 20, so it is now 16 × 16, centred in the same 20px slot. The check and the lock shrink with it (10px tick, 18px lock), so the three marks read the same size.

**5.509 — "Related service" on the inactive service cards.** "Add a mini badge right side of the inactive service card 'Related service'": every card in a group's list that isn't the one in hand (done, coming up or locked) carries a small grey "Related service" badge at the right of its name line.

- **Size:** 20px high, 11.5px text in the sub colour, pushed right with `margin-left:auto`.
- **Active card:** keeps its description and steps, with no badge.
- **Coverage:** shows the same in the inline stack and the XS/S sheet.

**5.510 — An orange badge means a primary object; the care team section becomes July 2026.**

- **Rule:** "Orange badge -> primary -> always CTA primary." When an object's step in hand is the member's to do (its orange "Your next step"), the object is primary. `isCta(r)` is either the row's own `cta` or its plan (`planOf`: a single service's steps, or the group's own or active service) having a step in hand that isn't passive.
- **What primary means:** a white primary button (split included), open by default, and first in its month.
- **Newly primary:** the July Pathology Test (Complete your test), the booked Onboarding consult, Dexa Scan and Nutrition review (Meet your doctor / Go to your appointment / Join the call).
- **Unchanged:** passive ones (Dexa waiting on its results, a pathology waiting on its referral) and ones not started keep the quiet button.
- **Section heading:** "Change to July 2026": the first section's heading, "With your care team", is now "July 2026" (its care dot unchanged).

**5.511 — A passive step's progress in light grey.** "Passive step light grey, not white": a passive step in hand now marks its progress in `--tlFutTx` (50% ink), light grey rather than white. This covers its increment in the badge, the chip's increment and its bar's fill in the steps list. Done steps stay green, and steps to come stay faint.

**5.512 — Service cards at 8% / 4%; 6px more between the image and the content.**

- **Card grounds:** "Active service card use #fff 8% opacity bg, inactive use 4%." In a group's list, the service in hand sits on `rgba(255,255,255,.08)` (.10 on hover) and the others on `.04` (.06 on hover). A single service's steps box, being the one in hand, takes the same 8%. Light mode uses the ink equivalents.
- **Image gap:** "Increase gap between img and content +6px." The thumbnail column is 6px wider than its image (86px for the 80 thumbnail on desk, 50 for the 44 at XS). The text now starts 24px after the image instead of 18 (22 instead of 16 at XS). The other column gaps are unchanged.

**5.513 — No badge beside an object's title.** "Remove badge": the locked objects (Diagnostics Review, Member Check-In) lose the "Book appointment" badge after their title, and no object's title carries one now. The tag still travels to the service page, where it names the ask.

**5.514 — A coming-up service shows the lock too.** "Lock icon, not circle": in a group's list, a service that is coming up but not locked behind another (Microbiome Report) now takes the same filled grey lock as the locked ones, not the empty ring. Only the service in hand keeps a ring, and done ones keep the green tick.

**5.515 — The open card in a group's list is always the object's own service; no borders on the cards.** "The master active card should always == the context, e.g. here Diag review." In a group's list, the card that opens (`li.main`: #fff 8%, description, steps, no badge) is now the object's own service (`focus`), not the group's service in hand.

- **Diagnostics Review:** its own card opens. It keeps its lock, its title reads in full, and its steps are those of a locked object: first "Complete your DEXA Scan" with "Your next step" and the `DEXA Scan · Step 1 of 3 →` link (it scrolls to and flashes the DEXA object), then its own Book appointment / Booked / Done.
- **The other cards:** the rest (DEXA with its white ring, Member Check-In with its lock) are collapsed at 4% with "Related service".
- **Groups without a focus:** a group object with no `focus` (Microbiome) still opens its service in hand.
- **Borders:** "Remove all border in step service card." The 1px outline that marked the object's own card (`.me`) is gone. No card in the list has a border or ring now, only the grounds.

**5.516 — A locked object's list shows the steps on its blocker's card.** "Don't show the steps in the active but in the blocker step before, DEXA scan."

- **Locked object:** when the object's own service is locked (Diagnostics Review, Member Check-In), its card stays the context one (8%, full title, no badge) but carries no steps. The group's service in hand, the one everything waits on (DEXA Scan), opens instead with its description and its steps (Book appointment with "Your next step", Booked, Done). It keeps its "Related service" badge.
- **Object in hand:** when the object's own service is the one in hand (DEXA's object), nothing changes; its own card carries the steps.

**5.517 — Steps only ever show in their own service's object.** "Never show the step breakdown outside of the parent service": a service's steps appear only in its own object's list.

- **Locked object:** in Diagnostics Review's or Member Check-In's list, the group's services are names only. DEXA carries its ring and "Related service". The object's own card is marked at 8% with its lock, with no steps on any card.
- **DEXA:** its steps (Book appointment / Booked / Done) show only in DEXA's own object.
- **Microbiome:** the group object with no focus is its own service in hand, so it still shows that service's steps.
- **Removed:** the blocker-first step list for a locked group card (5.515) is gone.

**5.518 — The object's own card is just its steps.** "On active service card, no need to repeat the title and sub"; "also remove the left progress indicator, the vertical bars are the indicator": the open card in a group's list (`li.main.solo`) now holds only its steps. Its title and description are the object's own, above, and the vertical bars say where it stands. So the ring, the name and the description are gone from it.

- **Where:** DEXA's object and the Microbiome object.
- **Other cards:** the related cards keep their tick, ring or lock, their names and "Related service".
- **Locked object:** its own card (no steps) keeps its lock and name.

**5.519 — The active card keeps its name when a card is above it, and lines up with the rest.**

- **Name:** "On active card, if an object is before the active service, keep the title." The steps-only card (5.518) shows its service's name again when another card sits above it in the list (Microbiome, after the done questionnaire). There is no ring and no description. When it is first (DEXA), it stays steps only.
- **Alignment:** "Make sure the progress and text are vertically aligned with the rest." Its bars are centred under the other cards' marks (8px into the 20px mark slot), and its step names and its own name start where the other cards' names start (32px in). Measured: mark and bar centres at 622, name and step starts at 644.

**5.520 — The step chip at 28.** "28 height": the step chip beside the badge ("Step 1 of 2") goes from 30px to 28px, the badge's height, so the two sit level. At XS it keeps its 56 next to the button.

**5.521 — A ring on the active card's name; 8px more between the chip and the badge.**

- **Ring:** "Active card title add a circle border icon." When the active card shows its name (a card above it), the name carries the white ring (`.tlMkH`, 16px, 2px ring). It sits in the same slot as the other cards' marks: its centre is on the same line as their ticks and locks and the bars below.
- **Gap:** "+8px gap, row." The step chip and the badge beside it are 18px apart instead of 10.

**5.522 — Chip and badge 8 apart; 8 more above their row.** "8px gap": the step chip and the badge beside it are 8px apart. I had read the earlier "+8px gap, row" as between them; it was the row. "Add 8px gap between row": the chip's row now sits 20px below the meta line instead of 12 on desk. XS keeps its 16.

**5.523 — Step rows 4px shorter.** "Compress vertically each row by 4px": in the steps list every row is 4px shorter. The bars' minimum goes from 26px to 22px, and the words' padding from 3px to 1px, so the row with the "Your next step" badge shrinks too. Measured rows go from 28/28/26 to 24/24/22, with the 2px between the bars kept.

**5.524 — A single service's steps box on the group cards' lines.** "Top card should follow the same padding as the bottom card; same element alignment, progress and content": a single service's steps box (Pathology, Onboarding consult, MRI Briefing and the rest) keeps its 14/16 padding, the same as the group cards. Its bars and words now sit where they do in a group's cards: bars 8px in (centred under the cards' marks) and words 32px in. Measured in every open object: bars at 620, words at 644.

**5.525 — The waiting Dexa is part of its Member Check-In; a lighter passive grey; thumbnails at radius 16.**

- **Waiting Dexa:** "Wrong, a DEXA includes other related services." The July Dexa Scan waiting on its results is now a member of its Member Check-In, not a lone service. It carries the "Member Check-In · 1 of 3" meta and the "Service 1 of 3" chip, and its list shows its own card (steps only: two done, "Get your results" in progress) above the Diagnostics Review and Member Check-In cards, locked, with "Related service". Its button opens the DEXA page at 3/3.
- **Passive grey:** "Lighter grey colour." A passive step's progress uses its own token, `--tlPas`: #fff at 72% (ink at 60% in light mode) instead of 50%. That covers the badge's increment and the bar's fill.
- **Thumbnails:** "Radius 16." Object thumbnails are at radius 16 on desk (from 12). XS keeps its 8 on the 44px thumbnail.

**5.526 — Secondary CTA at #fff 8%.** "CTA secondary 8% bg fff": the secondary button (and its ⋯ half in a split) sits on #fff at 8% (12% on hover), down from 24%/30%, in the page and in the sheet. The primary stays white. Light mode keeps its ink 7%.

**5.527 — A group object's chip counts steps, never services.** "Always step, not service": the chip on a group object now counts the object's own service's steps, not the group's services. Its increments and its badge are that service's too. The locked ones keep their "Waiting on …" chip.

- **Dexa waiting on results:** "Step 3 of 3", two green and the passive grey, "Get your results".
- **DEXA to book:** "Step 1 of 3", "Book appointment".
- **Microbiome:** "Step 4 of 8", "Collect sample".

**5.528 — The service in hand marked with a filled disc, not the white ring.** "Replace by circle filled 8% bg fff" (this one: the white ring): in a group's list, the service in hand is marked with a filled 16px disc at #fff 8% (ink 8% in light mode) instead of the 2px white ring. This covers the ring on the active card's name and on DEXA's card in the locked objects' lists. The done tick and the locks stay.

**5.529 — Unfilled step bars at #fff 24%.** "Progressing grey 24% bg fff": the bars of the steps still to fill have their own token, `--tlBar`, at #fff 24% instead of 16% (ink 20% in light mode). That covers the steps to come and the in-hand step's track under its fill. The rings and locks keep their 16%.

**5.530 — A passive step's moving part at #fff 24%.** "The moving part, bg fff 24%": the fill that runs down a passive step's bar ("Get your results", in progress) is #fff at 24% (`--tlBar`), where it was the 72% light grey. It runs over an 8% track so the movement still reads; with reduced motion the bar is a solid 24%. The badge's passive increment keeps its lighter grey.

**5.531 — A Timeline tweak: which objects open their steps.** "Add tweak, open steps only current month": the Tweaks menu now shows on the Timeline, with only the Timeline's own group ("Timeline"). Leaving the page brings back the Overview's tweaks.

- **Open steps:** a primary object comes with its steps open, depending on the setting:
  - Current month (the default): only in the current month, the section with the "now" dot (August 2026).
  - All primary: the earlier behaviour.
  - None: no object opens its steps.
- **Measured:** Current month opens August's three (MRI Briefing, DEXA Scan, Onboarding consult). All opens nine: July 1, August 3, September 5. None opens 0.

**5.532 — 4px more between the dividers and the objects.** "Add divider margin top bottom 4px": the hover tile now sits 16px clear of the dividers above and below (from 12). The row's padding grows by the same 4 on each side (30 from 26), so the content keeps its 14 inside the tile. XS unchanged.

**5.533 — Skin Check and Colonoscopy suggestions in one block; service page's progress tighter; 48 to its ⋯; no steps on Yours to claim.**

- **Suggestions:** "Use Skin Check, Colonoscopy for suggested; just use one suggested block." The suggestions are now a Skin Check (every year from 30) and a Colonoscopy (every 5 years from 45), in one block, in August (the current month); October's is gone.
  - Both have service pages of their own (`SVC.skin`, `SVC.colon`), each with a clinic, three steps, instructions and an "about".
  - Their thumbnails are abstract placeholders (`tl-skin.webp`, `tl-colon.webp`, soft blurred colour on grain like the pathology one), since the repo has no photo for either.
- **Service page, "Your progress":** "Reduce title font size by 2px; gap between items 8px." Step names at 14px (from 16), 8px between the steps (from 20).
- **Service page, header:** "Gap 48px between title and more CTA." The title keeps at least 48px from the ⋯ button (its 20 gap plus 28).
- **Yours to claim:** "Never display the steps, neither the badge step." The tab's objects show no step chip, no badge and no steps; nothing opens.

**5.534 — Refresh comes back to the Timeline; the rail 6% stronger.**

- **Refresh:** "Refresh button doesn't work." It did reload, but the Timeline isn't in the hash (it sits over the Overview's #m9), so the page came back on the Overview. Opening the Timeline now leaves a flag in `sessionStorage` (`everlab:tl`), which leaving it clears. A reload with the flag set opens the Timeline again.
  - Checked: reload on the Timeline returns to it (menu on "Timeline"); reload after going back to the Overview stays there.
  - In a private window the flag may not stick. The reload then lands on the Overview as before.
- **Rail:** "Make the line on the left side of the timeline more prominent, increase line opacity by 6%." The rail (`--tlRail`) goes from #fff 3.5% to 9.5% (ink 10% to 16% in light mode).

**5.535 — The badge and the steps fade as they open and close.** "Fade in/out on collapse, and the badge that disappears":

- **Badge:** the step-in-hand badge beside the chip no longer vanishes when the steps open. It fades out (.18s), then turns hidden, and fades back in (.22s) as they close. It keeps its place, so nothing beside it moves. At XS, where there is no badge, nothing changes.
- **Steps:** the steps panel fades with its height: in (.3s, a touch after the opening starts) and out (.2s).
- **Measured:** badge opacity .36 at 80ms into opening, .65 at 90ms into closing; the panel at .27 halfway open.

**5.536 — Suggestions 8px further from the rail; the booked September Dexa removed.**

- **Suggestions:** "+8px gap between timeline line and suggested card." The suggestions tray starts 8px further from the rail (its outset −14 from −22).
- **Dexa:** "Remove this DEXA." The booked Dexa Scan in September (Quantum Therapy Sydney, 1 Sep) is gone. September now holds MRI Scan, Nutrition review, the Genetic Test and the Microbiome assessment.

**5.537 — July folded into August.** "Push these 2 into August, remove the July group": the Pathology Test (Complete your test) and the Dexa Scan waiting on its results move into August 2026, and the July section is gone. August, the current month, now opens with them.

- **Order:** primary first, so Pathology, Onboarding consult, MRI Briefing and DEXA Scan, all open; then the waiting Dexa Scan (not primary: its step is passive), collapsed.

**5.538 — Service page: tighter steps, a status block that follows the step in hand, the Timeline's steps.**

- **Steps list:** "Gap between stacked items 4px"; "in the content add 8px padding top/bottom." In "Your progress" the steps are 4px apart and each has 8px above and below its words, the bar running their height. The sub line was already 14px ("reduce sub title to 14px"), so it is unchanged.
- **Status block:** "The body status block (the orange one) needs to reflect the current step on the right side." The block now says the step lit on the right: "Your next step · Step 2 of 3", the step's name as the heading, its line under it.
  - It is orange when the step is the member's, and neutral with "In progress" when it isn't (results on their way).
  - A time to re-choose (request), a locked service and one not started keep their own message. The button stays the state's.
  - Suggested pages read the service's own recommendation (Skin Check: every year from 30; Colonoscopy: every 5 years from 45).
- **Steps as on the Timeline:** "The detail page should reflect the same steps as the timeline page." Every Upcoming object's page lists the same steps with the same one in hand, checked row by row, e.g. the waiting Dexa at 3/3 "Get your results".
  - A passive step in hand is now grey there too, not orange.
  - The locked ones differ only where the Timeline shows no steps (Later) or its "Available when you turn 50" line.

**5.539 — A "Your journey" block on a group service's page, under the progress or in the body.** "We need to add a block below Your progress, or in the body instead of the status block (tweak 'Detail journey block: Right col or Body'). It should list all services related in the journey; the active block should be the context of the page, e.g. here Diag Review."

- **The block:** a group service's page (Member Check-In's DEXA Scan, Diagnostics Review and Member Check-In, the Microbiome group) now carries "Your journey" with the group's name. It lists every service of the group as cards, with a tick (done), a filled disc (in hand) or a lock.
  - The page's own card is at 8%, its name in full.
  - The others are at 4% with "Related service" and open their own page when tapped, the journey kept.
- **Placement, from Tweaks → Timeline → Journey block:**
  - Right column (the default): under "Your progress". The page's card carries its status line ("Complete your DEXA Scan first."), and the status block stays in the body.
  - Body: the block takes the status block's place. The page's own card holds the status: tag, heading, line and button. It is tinted orange when the step is the member's, as the block was.
  - At XS the body version stacks its status and gives the button full width; the right-column version sits under the progress.
- **Wiring:** the Timeline passes the journey (`journey: {name, items, i}`) with every group service it opens, from a row, its button or a card in its list. A single service has no journey and keeps its page as it was.
- **Tweaks:** the Timeline's tweaks now also show on the service page, and the Overview's no longer do there.

**5.540 — The journey on every grouped service's page, however it is opened; a Service detail tweak group of its own.**

- **Journey from any entry:** "So where are the journey cards?" They only came with pages opened from the Timeline. Opened from Service detail, the Overview or anywhere else, a service that belongs to a group now builds its journey itself (`JDEF`), with the page's own service in the state it opened in:
  - DEXA, Diagnostics Review, Member Check-In → Member Check-In.
  - The four gut services → Microbiome.
  - Checked: the home page's Service detail (DEXA) shows DEXA · Diagnostics Review · Member Check-In, as does the Overview's Dexa card. Its Diagnostics card opens that page with the journey kept.
  - Services outside any group (MRI…) have none.
- **Tweaks:** "Service detail should only show the Service detail tweak, not the Overview." The service page's Tweaks show a single group, "Service detail" (`data-svc`). The Timeline shows only its "Timeline" group (Open steps), and the Overview its own.
  - The journey setting is a switch, "Journey in body" (the bar turns a two-option select into one): off, the right column; on, the body.

**5.541 — Step chip and badge on the Overview's action plan cards; no count in the service page's status.**

- **Overview cards:** "Add the badge step + badge status on the Overview action plan items." Each action plan card (the desk grid and the phone list) now carries the Timeline's pair above its footer: the step chip ("Step 2 of 3") and the badge of the step in hand with its increments ("Visit a collection centre"). The badge is orange when the step is the member's, neutral when it isn't.
  - The state is the one the card opens its page in (Book: to book; View: booked), so the card and its page agree.
  - The card remembers its service and state (`data-key`, `data-st`), since the injected step names would otherwise mislead the title matching.
- **Service page status:** "Service detail remove Step X of X." The status block's tag is just "Your next step" or "In progress". The progress beside it counts the steps.

**5.542 — A locked service's journey card is just its name and "Complete your … first"; the blocker has a View.** "When a service is locked, just keep the title and sub title 'Complete your DEXA Scan first'. No CTA in this service card. And put a CTA on the blocker service, 'View'."

- **Locked service's own card:** on a locked service's page, its own card in "Your journey" (either placement) shows only its name and "Complete your DEXA Scan first.". There is no status block and no button.
- **Blocker card:** the card of the service it waits on (`jB`, found by the `need`) carries a "View" button in place of "Related service". It opens that service's page, the journey kept.
- **Examples:** Diagnostics Review → DEXA Scan has the View; Member Check-In → Diagnostics Review has it.
- **Services in hand:** a service that is in hand (DEXA) keeps its status and button in its card in the body version.

**5.543 — No card round the journey block.** "No need a card style, just keep cards for the stacked service items." The "Your journey" block loses its own ground, padding and radius, in the right column and in the body. Its heading sits on the page, with the services' cards (8% for the page's own, 4% for the rest) stacked under it, 32px below the progress.

**5.544 — The page's own journey card, when nothing blocks it, is just the action and its button.** "If a service has no blocker: no need to repeat the service title here, neither the status; just the action and CTA."

- **Page's own card:** in the body version, when the page's own service isn't waiting on another (DEXA to book, DEXA waiting on its results), its card drops its mark, its name, the status tag and the line. What stays is the step's action ("Book your appointment.", "Get your results.") and its button, aligned with the other cards' names. It is tinted orange when the step is the member's.
- **Locked page:** a locked page keeps its name and "Complete your … first" (5.542).
- **XS:** the button goes full width under the action.

**5.545 — "Your journey" without the group's name beside it.** "Remove right content": the journey heading is just "Your journey"; the group's name ("Member Check-In") on its right is gone.

**5.546 — "Journey module" as a menu, Body content by default.** The service detail tweak is now "Journey module", a dropdown with two choices: "Body content" (the default) and "Right column". The bar's switch-making skips it (`stJr`), since the two are places, not on and off. A group service's page now opens with the journey in the body, in place of the status block.

**5.547 — The status block back out above the journey; the page's own service badged "This service"; the DEXA page as the design.**

- **Status above the journey:** "Externalise the status block above the section 'Your journey'." In the body version, the status block is its own block again, above "Your journey" (40px clear). A locked page's has no button.
- **This service:** "In my journey add the active service (DEXA Scan, current page) + badge 'This service'." The journey lists every service as a plain card, the page's own at 8% with a "This service" badge. The one a locked page waits on carries its View; the rest are "Related service".
- **DEXA from the design:** "Adjust content for DEXA based on this design."
  - "Started on 20 February 2026" under the title.
  - A status of "Pending action" / "Book your appointment" with a "Book" button, no line under it.
  - The steps' lines: "Schedule with your referred provider", "Complete your DEXA scan" (the design's "colonoscopy" read as a slip), "Track your result here".
  - Service detail's own entry opens the DEXA to book, as the design (it opened the re-choose-a-time case).
- **Across services:** a status that follows the step in hand now reads as the design everywhere: "Pending action" (or "In progress" when it isn't the member's), the step's name, no line. Booking buttons read "Book".

**5.548 — The Pathology page from its reference design.** "Pathology content, e.g. for ref." The August Pathology Test (step 1 of 2, "Complete your test") opens its page with:

- **Header:** "Started on 20 February 2026" under the title, and the red photo (`tl-path.webp`) on the page as on the Timeline.
- **Status:** "Pending action" / "Complete your pathology test".
  - Lines: "Find a collection centre near you and schedule your test. We'll notify you when it's time for your test, so you don't forget.", and a second paragraph, "If you've already completed it on your own, click 'I've already done the test.'".
  - Two buttons under the text: "I've already done the test" (secondary, #fff 8%) and "Find collection centre" (primary). They stack full width when the block is narrow.
- **Wiring:** a service can now carry a step's own status (`act`, keyed by the step's name) with its heading, lines and buttons. Only Pathology's "Complete your test" has one.
- **Row state:** the row's state is now "active" (it was the re-choose-a-time "request"), so the page no longer shows that case's copy. The design's "About the service" text reads as microbiome placeholder copy, so the pathology's own is kept.

**5.549 — A third journey setting: the status inside the service's card.** "Add a new tweak where the status block is included inside the service card." "Journey module" now has three choices:

- **Body content (the default):** the status block above "Your journey".
- **Body, status in the card:** the journey in the body, with no status block of its own. The page's own card ("This service") carries the status under its name: tag, heading, line and button, tinted orange when the step is the member's. A locked page's card has its status without a button, and the service it waits on keeps its View. At XS the status stacks and its button goes full width.
- **Right column:** under "Your progress".
- **Fix:** the right-column block no longer also draws in any mode other than Right column.

**5.550 — The blocker is the service the chain waits on now, with a primary View; the status as a card inside the card.**

- **Blocker:** "Wrong, the DEXA is the blocker here!!! Also use primary CTA for blocker service." On a locked page, the "View" sits on the group's service in hand, the one the whole chain waits on (DEXA), not on the locked one just before it (Diagnostics Review, for Member Check-In). It is a primary button now (white; ink in light mode). Checked: Diagnostics Review and Member Check-In both put the View on DEXA Scan, and it opens the DEXA page.
- **Status in the card:** "Put status in a card inside a card." In "Body, status in the card", the status is a card of its own inside the service's card, under its name.
  - It has 18/20 padding and radius 12, on its tone's ground: orange when the step is the member's, #fff 6% when it isn't.
  - The service's card keeps its 8%.

**5.551 — The page's own journey card, a border only; the status card at 4% grey or the usual orange.** "Active card: just border, no bg. Status card bg #fff 4% opacity, grey or orange (orange keeps the same as usual)."

- **Page's own card:** no ground, a 1px border (#fff 14%; ink 18% in light mode). This is in every journey placement.
- **Status card inside it:** #fff 4% when the step isn't the member's, the status block's usual orange when it is.

**5.552 — A locked page names the service to do now.** "No, 'Complete your DEXA Scan first', sub adapted as well." A locked page in a journey names the service the chain waits on now, the group's in hand, not the step just before it. It does so in its status, its line and its journey card's line: "Complete your DEXA Scan first." / "You need to complete your DEXA Scan before you can book this appointment." This matches the View on DEXA Scan (5.550). The header keeps "After your Diagnostics Review", its place in the order.

**5.553 — Every journey card the height of the one with its View.** "Make sure all service detail service cards have the same size, based on the one with a CTA." Every card in "Your journey" is at least 56px, the height of the card that carries the View button, so the list reads as one set: 56/56/56 in the body.

- **Right column:** the page's own card is taller only where it carries its status line.
- **Card mode:** it is taller only where it carries its status card.

**5.554 — No "Your appointment" before it is booked; the journey's own card filled, the rest outlined; 28px labels.**

- **Nothing booked yet:** "If state is Book appt, it doesn't make sense to show the Your appointment section below, just remove it." While the step in hand is a booking (the "book" state, or any "Book…" step), the page has no appointment section (location, duration, clinician). It goes straight from the status and journey to the referrals and instructions. Once booked, the section returns.
- **Journey cards:** "Active filled grey bg; non-active / locked outlined 1.5px border." The page's own card is filled (#fff 8%). The others have no ground and a 1.5px outline (#fff 10%; ink 14% in light mode).
- **Labels:** "Label 28px height." "This service" and "Related service" are 28px high (12.5px text, 10px sides, radius 8).

**5.555 — Journey cards at radius 14.** "+4 radius cards": the service cards in "Your journey" go from radius 10 to 14.

**5.556 — "Your journey" set as the page's section headings.** "Adjust Your journey size based on the Instructions size." In the body, "Your journey" is the page's section heading, the same as "Instructions" (`.svH2`, 22px, 40px above, 16px below). The right-column version keeps the side panel's smaller heading, as "Your progress".

**5.557 — Dashed outlines for the related services.** "Dashed": the journey cards other than the page's own are outlined with a 1.5px dashed border (#fff 16%; ink 20% in light mode). The page's own card keeps a clear border of the same width, so names and badges line up. Vertical padding goes to 10, so every card stays 56px with its border and the View's 32.

**5.558 — Longer, wider-spaced, 2px dashes at #fff 4%.** "Dashed: increase increment, gap and width; colour opacity #fff 4%." A CSS dashed border can't be tuned, so the related cards' outline is now drawn as an SVG rounded rectangle behind them. It uses 10px dashes, 8px gaps, 2px wide, at #fff 4% (ink 10% in light mode), following the card's 14 radius. The cards keep their clear 1.5px border for alignment and their 56px height.

**5.559 — Journey badges say what a service is: Locked, or nothing when done.** "Replace Related with 'Locked' if locked. If completed, no badge necessary."

- **Locked or coming-up services:** the badge reads "Locked".
- **Completed ones:** no badge; the tick and the strike say it.
- **Unchanged:** "Related service" stays only on a service that is open but not the page's own (the gut assessment, seen from the Microbiome Report's page). The blocker keeps its View, and the page's own keeps "This service".

**5.560 — Finer dashes at #fff 6%.** "Reduce increment and dash width; opacity #fff 6%." The related cards' dashed outline is now 6px dashes with 6px gaps, 1.5px wide, at #fff 6% (ink 12% in light mode).

**5.561 — Tighter dashes at #fff 12%.** "12% border dashed; reduce more width and gap." The related cards' outline is now 4px dashes with 4px gaps, 1px wide, at #fff 12% (ink 20% in light mode).

**5.562 — "Right column merged": the progress inside the journey's own card.** "Add another tweak that merges Your progress inside the service card on Your journey"; "call this tweak Right column merged." "Journey module" gains a fourth choice, "Right column merged".

- **Right column:** the journey sits there, and the separate "Your progress" panel goes. The page's own card ("This service") carries the service's steps under its name, with bars and lines as in the progress panel, done green, in hand orange.
- **Body:** the status block stays in the body.
- **Other choices:** unchanged, their progress panel kept.

**5.563 — A "Locked pattern" tweak; the waiting Dexa removed; Timeline group labels as the journey's.**

- **Locked pattern:** "Add a tweak for all locked service cards with a disabled pattern on the bg, super light." A "Locked pattern" switch (off by default) lays fine diagonal lines behind every locked service card: 1px at #fff 3.5% every 7px (ink 5% in light mode).
  - It covers the service page's journey and the Timeline's group lists.
  - It sits in both the Service detail and the Timeline tweaks, one setting, and survives a change of page (`body.svLockPat`, set again after a page rewrites the body's classes).
- **Second Dexa:** "Remove the 2nd DEXA item." The Dexa Scan waiting on its results is gone from August, which now holds Pathology Test, Onboarding consult, MRI Briefing and DEXA Scan.
- **Timeline labels:** the group lists on the Timeline follow the journey's labels too: "Locked" for locked or coming-up services, none for done ones, "Related service" only for an open one that isn't the object's own.

**5.564 — Merged: a locked service shows no steps.** "On merged tweak, locked service hides the steps." In "Right column merged", a locked page's own journey card shows its name and "Complete your DEXA Scan first", without the step list. A service in hand (DEXA) keeps its steps in its card.

**5.565 — "This service" on the Timeline's group cards; the blocker always orange with its View.** "Active service: add badge 'This service'. Blocker service needs to always be orange theme + CTA View."

- **Timeline group lists:** the object's own card carries "This service". This includes the in-hand card when its name shows.
- **Blocker:** on a locked object, the service the chain waits on (DEXA) is orange (the status orange, #F78359 at 12%) with a white "View" (28px). Tapping it opens DEXA's page.
- **Service page journey:** its blocker card is orange the same way (no dashed outline), with its primary View.

**5.566 — Locked pattern on by default, finer and denser.** "Locked pattern by default ON (ON: pattern displayed, OFF: not displayed). Pattern: reduce gap, thinner a bit."

- **Default:** the "Locked pattern" switch starts on, so locked service cards show the pattern from the first load. Switching it off removes the pattern and keeps it off across pages.
- **Switch order:** its two choices are On/Off, since the bar's switch reads its first choice as on.
- **Pattern:** 0.7px lines every 4px (from 1px every 7px), at #fff 4% (ink 6% in light mode).

**5.567 — Merged card: no line under the name; steps on the name's and the dot's lines.** "No need sub title 'Book appt'. Align vertically content with title, and vertical progress with dot (centred)."

- **No line under the name:** in "Right column merged", the page's own card no longer repeats its status under its name.
- **Steps aligned:** the step names start where the service's name starts (32px in). The progress bars are centred under the dot (10px in). Measured: dot and bar centres both at 1097, name and steps both at 1119.

**5.568 — A stronger locked pattern, a 1.5px dash, 6px around each step.**

- **Pattern:** "Pattern needs to be more visible." The locked pattern's lines go to #fff 8% (ink 10% in light mode) and 0.8px, still every 4px.
- **Dash:** "Dashed border 1.5px width." The related cards' dashed outline is 1.5px wide (4/4 dashes, #fff 12%).
- **Steps:** "Content item padding top bottom 6px." Each step in "Your progress" (and in the merged card) has 6px above and below its words, from 8; they stay 4px apart.

**5.569 — The DEXA's own steps everywhere; the service page's picture at radius 24.**

- **DEXA steps:** "Make sure all steps on DEXA have this content on the service detail page." A DEXA page always lists the DEXA's own three steps, whatever state or entry opened it: "Book your appointment" / "Schedule with your referred provider", "Go to your appointment" / "Complete your DEXA scan", "Get your results" / "Track your result here". The Timeline's DEXA object (and its Member Check-In group) uses the same steps (`DEXA_ST`) in place of the older "Book appointment / Booked / Done". Checked in every state: book, request, booked, suggested, later, claim, done, and active at 3.
- **Picture:** "Radius service detail page visual 24." The service page's header picture is at radius 24 (from 12), desk and XS.

**5.570 — A locked page's status button is "View", to the service to do now.** "CTA should be 'View'." On a locked page in a journey, the status block's button is an active "View" (no longer a greyed "Book appointment"). It opens the page of the service the chain waits on (DEXA), the journey kept. This applies in the body, right-column and merged layouts. In "status in the card", the card still carries no button; the blocker's card has the View.

**5.571 — Steps at 4px padding; the merged journey on the body's top line.**

- **Steps:** "Padding top bottom 4px." Each step in "Your progress" has 4px above and below (from 6).
- **Merged journey:** "Merge tweak: push up the right col so the title 'Your journey' is vertically aligned with the content on the body." In "Right column merged", the journey is the column's first block and starts on the body's top line. It drops its 32px top margin, so its heading and the page's picture and title all start at the same height (153px, measured).

**5.572 — Status buttons at 44; an orange dot in the in-hand service's disc.**

- **Status buttons:** "44px height CTA for all status blocks." Every button in a status block is 44px high: Book, View, Add to calendar, and Pathology's two. This covers the page, the status-in-card journey, XS and the phone page.
- **Orange dot:** "Add orange dot inside the grey dot." The service in hand's grey disc now carries a 6px orange dot at its centre. This shows in the service page's journey and in the Timeline's group lists, including the disc on the in-hand card's name.

**5.573 — Locked pattern at #fff 12%.** "Pattern opacity 12% #fff": the locked pattern's lines go to #fff 12% (ink 14% in light mode), still 0.8px every 4px.

**5.574 — Right column merged by default; a Diagnostics Review once the DEXA is done.**

- **Default layout:** "Use as default." The service page's "Journey module" starts on "Right column merged": the journey in the right column with the page's own steps in its card, and no separate progress panel. The locked pattern stays on by default.
- **New Timeline object:** "In the timeline, add a Diagnostics Review item when DEXA is fully completed." September gains the Member Check-In a step further on, as a Diagnostics Review now to book: "Member Check-In · 2 of 3", "DEXA Scan completed", a primary "Book", Step 1 of 3.
  - Its group list shows DEXA Scan done (tick, struck, no badge), its own card in hand with its steps and "This service", and Member Check-In locked.
  - Its page reads "Pending action · Book appointment" with "Book". The journey shows DEXA done, then Diagnostics Review as this service with its steps, then Member Check-In locked.

**5.575 — Every locked status says "View".** "Status block when locked: CTA 'View'." A locked page's status button is always an active "View", never a greyed "Book appointment".

- **In a journey:** it opens the service the chain waits on (5.570).
- **Without a journey:** a locked service with no group now does the same by name. For example, an MRI Scan locked behind its briefing opens the MRI Briefing page.
- **Checked:** Diagnostics Review and Member Check-In (to DEXA), Gut Health Review (to the gut assessment), MRI Scan (to MRI Briefing), and every Timeline entry to a locked page, desk and phone.
- **Stale view:** the greyed button in the screenshot is the build before 5.570. A reload shows the View.

5.576 Status CTA full round, pattern +12%, blur bug, Timeline group cards
- Status block buttons (.svPend .svBtn): 44px, border-radius 999px.
- Locked pattern stripes: #fff .12 → .24 (light: .14 → .26).
- Blur bug: the top bars' ten blur bands (.ovGround) ran 28–38px past the bar's bottom edge, blurring content still in view (the Timeline's sticky month, the service page's status block). On .tlBar, .svTop and .svmNav they now end at the bar's edge; the tint alone fades on.
- Timeline group cards: badge (.tlRelB) 28px high like the View button (padding 0 10, radius 8, 12.5px); card padding 14/16 → 10/12; name row min-height 28 and the left indicator margin 6px 2px, so it is centred on the title.

5.577 Service detail is the first page; journey heading on the title line; pattern stronger
- No hash now opens Service detail · Desktop (DEXA to book, Journey module Right column merged). #home still opens the gallery; any page hash opens that page.
- The service page is remembered through a reload (sessionStorage 'everlab:svc' = [key, state]), as the Timeline is; closing it forgets it.
- Right column merged: "Your journey" heading 36 high, centred, so it sits on the line of the page title's first line and its … button (centres 169/171/171); list 12 below it.
- Locked pattern stripes 1px (from .8) at #fff 24%.
- Diagnostics Review with DEXA done (September) checked: DEXA done, Diagnostics Review "This service" with its steps, Member Check-In locked, no orange blocker.

5.578 Locked pattern stripes #fff 6% (light: .08) ("pattern 6% opacity").

5.579 In-hand disc: orange dot 6 → 8px; a grey ripple (box-shadow 0 → 8px, #fff 18% → 0, 2s, off for reduced motion) on the service page's journey and the Timeline's group cards. Locked pattern stripes #fff 8% (light .10).

5.580 Locked pattern gap 3 → 4px (period 4 → 5px), stripes still 1px at 8%.

5.581 Locked journey cards on the service page filled #fff 4% (hover 6%) under the dashes and pattern, as the Timeline's locked cards already are.

5.582 Service page steps (.svStep): padding 4 → 6px top and bottom; the bars grow with the step.

5.583 Tweak "Pattern opacity" (2–30%, default 8%) under Locked pattern, in the Timeline and Service detail groups (kept in step). Sets --lpA on the root; the stripes read rgba(255,255,255,var(--lpA)), light mode var(--lpA) + .02.

5.584 Save / Reset at the foot of the Timeline and Service detail tweak groups: Open steps, Journey module, Locked pattern and Pattern opacity kept in localStorage 'everlab:tkPages' and put back on load, before the first page opens. Reset clears it and puts the defaults back (Current month, Right column merged, On, 8%).

5.585 Service page journey: locked cards drop the dashed outline (fill 4% and the pattern only); related and done cards keep it.

5.586 XS service page as the phone's design; journey card and dot; Timeline search on the title line
- Desk service page at XS: paint() writes the phone's hero (image behind, title, start date, Your progress card) and sheet (status, journey, sections, referrals, instructions, About) into #dSvc; the hero runs up under the bar to the card's top, title 56 below the bar. The bar gets 44px back and more discs (.svXsMore). The page repaints on a breakpoint change. The phone's body rules are shared (:is(.svcMob, .svXsBody)).
- Journey: the page's own card 4px more padding above and below (14, 16 when narrow). In-hand dot white (ink in light mode), was orange.
- Timeline: the search moved from the tab bar to the title's line, right (.tlHead). At XS only its 44px round icon; a tap opens the field over the title's line, and it closes on blur when empty.

5.587 Bug: the Timeline's step sheet (XS/S, or a window under 992) stayed up over the service page. A change of page through the Version menu rewrote the body's classes, so tlOn was gone before the Timeline's close() ran, and close() returned before closing the sheet. close() now closes the sheet first, and the sheet is hidden whenever the Timeline isn't on.

5.588 The journey module's heading reads "Your progress" (was "Your journey"), in every mode.

5.589 Timeline September MRI Scan on step 3 (Get your results): state active, at 2, a neutral grey bar, CTA View secondary (no cta flag; the step is passive). A passive step in hand whose name is about results is badged "Waiting for results" (others keep "In progress").
- Service page, a passive step in hand (e.g. MRI on Get your results): the status reads "Waiting for results" (results steps) or "In progress", grey, and has no button (the Continue is gone); a step with its own act override keeps its buttons.

5.590 Phone service page (Mobile version and the desk at XS): the Your progress card is gone from the hero ("remove this on mobile"); hero padding-bottom 48 so the start date clears the sheet. The steps stay in the sheet: the journey card lists them, and a single service (no journey) gets the desk's Your progress list under its status.
- The desk's service page at XS and S hides the main nav (the device's dock, #mTabs3): a sub page, as the phone's already is.

5.591 Journey cards: the group's service in hand, when it is not the page's own (or the Timeline card's object) and not a blocker, shows a secondary View (#fff 8%) in place of "Related service" ("if an active is not locked but is not a parent, add the CTA View"). Service page and Timeline group cards alike.

5.592 A single service (no journey) lists its progress as a journey of one: the "Your progress" heading outside, then its own card (grey 8%, name, "This service", its steps inside), the same as a group's. Right column merged on the desk, and the phone's sheet (Mobile and XS). A locked single service shows its lock and no steps. Other Journey module modes keep the old progress panel for a single service.

5.593 Landing page (Organ Age, #m23): the page scrolls again, and a section follows the header: eyebrow "Nine ages", "Every system tells its own story.", a line, then the nine organs 3 x 3 (.lpOrgGrid), each a card (#fff 4%, radius 24) with its particle organ (makeOrganView, dense, no download), its age's name and what it describes (AGE_DESC). Under 900 of page width 2 columns; under 600 one column, the title and the line only, centred, no organ.
- At 900 and under, the header's copy and its CTA sit under the organ group: eyebrow and title, the organ view, then the two paragraphs and See your Organ Age (.lpHeroTx display:contents, ordered). XS: the organ's 64 push-down becomes a 24 margin; the header's foot 120 -> 24.
- 5.594 Organs grid: no cards; an outlined 3 x 3 grid with no gap (hairlines #fff 10%). 3 columns at every width: organ 200 (150 under 900); under 600 the organ 96 and the name 13px only, no description.
- 5.595 A single service's progress card (no related services) drops its name row (dot, name, This service): the steps alone in the card, words 22 in, bars at its left. A locked single service keeps the name row with its lock, since it has no steps to show.
- 5.596 Organs grid rounded 16 as a whole (one outline, inner hairlines only). Under 600: the organ 77 (was 96), the cells 4 more padding (16 10 22).
- 5.597 Landing h1 in Tobias ('Tobias', then Georgia/serif; not in the repo, so named as Suisse is and shown where installed), weight 400, -1px, line-height 1; broken as "Your body has more / than one age." at every width.
- 5.598 Landing header at 900 and under: the arc (and the reading under it) 40 up (margin-top 18 -> -22).
- 5.599 Timeline at XS: the step chip and the CTA 44 high (56); the chip shows a ring (20px, 3px stroke, conic to the count, orange / green done / grey passive) in place of the increments; the picture 60 (44), radius 12, its column 66; the hover ground 4 in from the row's edges (14 of padding round the content, was flush at the top) and radius 20.
- 5.600 Landing tweak "Organs section": Carousel (default, "Phase 2 - 9 organs with tabs") or Grid (the 3 x 3; body.tkLpGrid, CARD_STATE.lpGrid). Carousel: the "What's included" tag (.lpInc; .lpTag is the old story's), "Nine systems. / One clearer picture." (the second line 50%), the line, "your OrganAge may include:", nine pill tabs with orange dots (Heart, Brain, Gut, Bones, Lungs, Cells, Liver, Kidneys, Nervous -> PILL's Heart, Brain, Gut, Muscle & bone, Lung, Immune, Metabolic, Kidney, Mental), one card (#fff 7%, radius 32): the particle organ (hero density, morphing between tabs), "N biomarkers tested" (PILL.bio) with a leader line, the name, a line, See your OrganAge (-> the Insights phone, as the hero's CTA). Under 600: tabs scroll, the card stacks with "01 / 09", arrows under it; the biomarker callout hidden. The eight lines other than the Heart's are mine, in the Heart's pattern.
- 5.601 Landing header to the V2 design: maroon (#1f0a0a) for the page, header and organs sections (the carousel card #fff 8%), no halo; the "OrganAge" tag (.lpInc) over a three-line Tobias title ("Your body / has more / than one age.", 44-76px, lh .95); the copy 15px; two CTAs, See your OrganAge (white) and Compare Everlab plans (#fff 8%); Start Today a rounded rectangle (radius 10, white); the reading's arrows gone; the Hero visual tweak now Open by default. Under 600: a menu disc at the left, Log in and Join today (outlined) at the right, no wordmark; the title 40; the CTAs full width, stacked.
- 5.602 Carousel under 600: the card 16 more padding (38 34 34), everything centred (the CTA too), the organ 184 (230), no "01 / 09", no orange dot on the tabs.
- 5.603 Landing title under 600 on two lines, "Your body has more / than one age." (the first break desktop-only), 38px.
- 5.604 Timeline XS: rows 30/32 of padding (12 more round the dividers, 4 more inside the hover card, whose ground is 12 in from the row, -14 at the sides); the CTA hugs its label (flex none, 24 sides) at the row's right when there is a chip.
- Phone service page (Mobile and desk XS): the hero is sticky under the bar and the sheet (z 1) slides up over it; the hero's words drift up (-0.25 of the scroll) and fade out over its height, its picture dims to 35%, as the Insights phone's header. Referrals moved above Your progress. Bug: at XS the desk's right column was still painted (its assignment sat outside the XS branch), so Your progress showed twice; fixed.
- 5.605 Phone service hero: 20 more below the title group (padding-bottom 48 -> 68), Mobile and desk XS.
- 5.606 Phone service hero: the ground under the picture neutral (#151515 -> #0d0d0c; the warm #2b1a12 read as an orange shade). Desk XS: the sticky hero's top set to minus the card's padding (24), so the picture reaches the card's top again (a 24 band showed above it).
- 5.607 Tweak "Active card steps" (Service detail): Vertical (default, the steps listed) or Horizontal: the page's own card keeps its name row, then one row of bars coloured by status (green done, orange in hand, grey passive in hand, #fff 14% to come) and the step in hand's name under them. A single service shows its name in this layout. Kept by Save.
- 5.608 Phone service hero: the picture's fade to black half as long (mask from 62%, was 30%); the gap under the title group back to 48.
- 5.609 Phone service hero: no fade at the picture's foot (the mask gone); title to start line 6 (8).
- 5.610 Timeline steps bottom sheet (XS/S): no CTA row; the sheet ends with the steps.
- 5.611 Phone service sheet: 2 more padding at its top (18).
- 5.612 Phone service hero: a black gradient at its foot again as an overlay (transparent 45% -> black), at 30%; the picture moves up to 32 px as the sheet scrolls over (its layer 32 taller at the foot so no edge shows).
- 5.613 Horizontal card (tweak): a tap on the page's own card opens its steps listed (the service page's step list) in the Timeline's bottom sheet (.tlSheet.svSheet): the service's name, "Step x of n", the steps; dim, x or Escape closes it. On the phone inside #phone2, on the desk over .dash (480 wide and centred except at XS). Shown only while its page is up.
- 5.614 Every bottom sheet a 32 safe space at its foot (.sheet padding-bottom 32, not the desk's side drawers; the steps sheets' body 32). The steps sheets (Timeline and service page) drop the step chip under their title. The dock's Plan is now Timeline (the sidebar's calendar): it opens the Timeline page (on a phone, the desk's in the XS device) and is lit there.
- 5.615 Steps sheets: the title centred on the close button's line (align-items center); the title forced plain (no text-decoration, border or ground). The line the user saw across it did not reproduce here.
- 5.616 The horizontal card tweak applies to the phone layouts only (Mobile, desk XS); the desk keeps the vertical steps.
- 5.617 The service page's steps sheet never shows on the desktop (only at XS on the desk, and on the Mobile phone); a breakpoint change closes it.

5.618 The appointment page ("add the appointment page"), from the two designs (desktop, mobile)
- Desk #dApt (a dvMain beside #dSvc, moved there at start): back; the head in two columns (title, then at the foot the tags Physical appointment / Cancer, the line and a full-width Book with an arrow; the picture 553 x 444, radius 16); a hairline; then the main column (Consents with Review, Questionnaires with Complete, each an icon tile with an orange dot and an outlined button; What to expect and How to prepare as square-bulleted lists, each with a Watch a quick video preview card; the Questions about your appointment box with the care team's address) and the side (the We'll notify you note; Date & Time with a Pending confirmation badge, Location, Type, Duration). Under 860 of page width one column, the side first.
- Phone .aptMob in #phone2 (over the service screen, z 6), and the desk at XS: the picture full bleed with the title on it and a back disc; a sheet over it with its grab, the tags and line, the note and details, then the lists. No Book, as the design.
- Colours from the page's theme (.apPg tokens): dark by default, the design's own white, black and grey in light mode.
- Doors: Version menu, Appointment (Desktop, Mobile); and View appointment on a service page's Your appointment heading (booked services), back returning to that service page.
- 5.619 Appointment page, as the service page behaves: the desk's back in the sticky .svTop bar (tint and blur bands once scrolled, #dApt.ovScrolled); the shell's corner block now measured off #dApt (resize() had measured a hidden card, so the page's top-left corner showed square); the phone (and desk XS) built on the service page's svmNav / svmHero / svmBody, so the bar, the pinned hero, its words drifting and fading, the 32px picture parallax, the 30% foot gradient and the sheet sliding over all come with it. A Your progress module added (the service cards only, no steps: DEXA Scan This service, Diagnostics Review and Member Check-In Locked), under the details on the phone, under them in the side column on the desk.
- 5.620 Appointment page: a tap on a service card in Your progress opens that service's appointment page (its name, its picture; its card becomes This service, the others keep their state); opening the page afresh starts on DEXA Scan.
- 5.621 Appointment page for Diagnostics Review: no Consents or Questionnaires; What to expect in its own words (the video call, the DEXA results read with the latest bloods, the next steps). Per service in JI (noForms, expect).
- 5.622 Appointment page, not booked (Diagnostics Review, Member Check-In): the note and the details give way to a Book your appointment card (outlined, radius 20; a blue calendar-plus tile, the title, Duration, a full-width Book with an arrow), in the side column on the desk and under the line on the phone, as the designs. A locked service's Book is dimmed with "Available once your DEXA Scan is complete."
- 5.623 DEXA's appointment page shows the Book your appointment card too (active): its step in hand is to book, as on its service page, so the page's state block is the booking card, not the pending-confirmation details.
- 5.624 Appointment page's Your progress on a locked service: the card it waits on (DEXA Scan) is the blocker, orange with a primary View that opens its appointment page, as the service page's blocker.

5.625 Two Service detail tweaks
- Documents: None (default) / In the steps / In the status block. The service's documents (DEXA: DEXA Scan Consent, Medical Imaging Consent with Review; Pre-Scan Health & Medical History, DEXA Scan Health Questionnaire with Complete; others one Health Questionnaire) as micro steps: small rows under the step in hand in Your progress, or cards inside the status block under its title and button (an icon tile with an orange dot, the name, a white button), as the capture. Not on done, locked or later services.
- Layout: Appointment (old) / Service detail (new, default). On Appointment every door that opens a service page (the Overview plan, the Timeline, Service detail in the menu...) opens the appointment page instead; from the Timeline its back returns to the Timeline. Switching the tweak swaps the page in view. The Service detail tweak group also shows over the appointment page. Both kept by Save.
- 5.626 Tweaks over the phone's service and appointment screens (#phone2.svcOn / .aptOn): the Service detail group only, no Overview group, as on the desk.
- 5.627 Documents tweak: "In the steps" renamed "In a sub step"; a fourth option "As steps": each document becomes a step of its own after the step in hand (its name, "Review and sign / Complete before your appointment", a small button at the right).
- 5.628 Documents as steps: no button on them (steps to come never carry a CTA); name and line only.

5.629 The flow, simulated ("let's simulate the flow: I click Book, a modal with an example booking flow, its Book, then the next step")
- Book in a service page's status block (when the step in hand is a Book step) opens the booking: a centred modal on the desk, a bottom sheet on the phone and at XS. The clinic and duration; Select a date (seven days from Mon 6 Oct, chips); Available times (six slots, a few full, struck through); a summary and Book, enabled once a time is picked.
- Book books it: the service goes to booked with that date (Confirmed / the next step lit, Your appointment showing it), the status block flashes. The state is kept per service, so leaving and reopening the page keeps it.
- Tweak Service detail > Simulate: Next step (from a Book step it opens the booking; otherwise the next step, then Completed) and Reset (every service back as it was, documents undone).
- With the Documents tweak on, a document's Review / Complete marks it done (a green tick, Done), and as steps it turns green.
- 5.630 Demo step skipper: a small previous / next pair at the right of Your progress (every mode, desk and phone): it moves the service a step back or on without the booking (a Book step forward goes straight to booked, a default date), back to Book, on to Completed; disabled at either end; not on locked, later, suggested, purchase or claim services.
- 5.631 The status block reads the step in hand's title and its line (was the title alone), e.g. Meet your doctor / Go through your history and goals. The demo's step skipper no longer flashes the status block (the booking still does).
- 5.632 Layout tweak as a segmented tab (Appointment | Service detail) in place of its select (the select stays hidden as the value; .tkSegSel builds the tab).
- 5.633 Desk page cards (#dMain, #dOver, #dSvc, #dTl, #dApt) keep the scrollbar's gutter (scrollbar-gutter: stable): the content width no longer changes when the scrollbar appears. In a device (XS, S) the scrollbar is hidden, so nothing changes there.
- 5.634 Journeys follow the simulated flow: the groups' services take the state each has been moved to (SIM), and a locked one opens once every service before it is done. A page opened as locked whose predecessors are all done paints as in hand (Book, its steps listed, no orange blocker): DEXA completed, then Diagnostics Review shows Book appointment and its steps; Member Check-In stays locked until the review is done.
- 5.635 Layout (Appointment | Service detail) moved out of Tweaks to the top bar, before Refresh, shown only on the Timeline, the service page and the appointment page (desk and phone). The desk's page cards hide their scrollbar outright (the stable gutter was not honoured in every browser), so the layout width never moves. The orange blocker card a bit more intense (#f78359 18%) with a hover (26%); light mode #fbe0d1 / #f8d2bd.
- 5.636 Documents tweak: the "In a sub step" option removed (None / As steps / In the status block).
- 5.637 Documents never repeat the service's name: DEXA Scan Consent -> Scan Consent, DEXA Scan Health Questionnaire -> Health Questionnaire (service page and appointment page).
- 5.638 Documents in the status block, any still to do: the block reads "Before you book (/ your appointment), please complete the required documents below." with no line and no primary button; once every document is done it shows the step and its button again.
- 5.639 The top bar's Layout switch shows on the service and appointment pages only, not the Timeline.
- 5.640 Documents tweak on the Timeline too (its own row in the Timeline group, kept in step with the service page's): As steps puts the documents in the step list after the step in hand (ticked once done); In the status block puts them as rows with their Review / Complete under the step list. A document done on either page is done on both.
  Bug fixed on the way: the service page's Documents select had taken the id stDocs, already the Insights "My documents" tweak's, so that tweak had been reading the wrong select; it is stSvDocs now.
- 5.641 Documents in the status block: the status block lists only those still to do; each one done moves to the body, under Consents or Questionnaires (as the appointment page's lists), with Completed and a View. Once all are done the status block is the step again and the body keeps the two lists.
- 5.642 Documents tweak (Timeline and Service detail groups): a switch, Off by default; when on, a Document layout row appears: Part of step timeline (the documents as steps) or Part of status block. They drive the hidden mode select the pages read, which Save keeps.
- 5.643 Documents as steps go before the step in hand (before Book): the first one still to do is the step in hand (orange in Your progress, its name, line and Review / Complete in the status block; done, the next one takes over), the Book step after them waits; once all are done the Book step is in hand again. The Timeline's list the same.

5.644 — The demo skipper (prev/next arrows) walks one fixed sequence when Documents are on: the steps before Book, then each document, then Book, then the remaining steps. Each click moves exactly one item; prev un-marks documents in reverse. The documents always sit just before the Book step (service page and Timeline), so they stay green there after booking instead of moving after the step in hand.

5.645 — Reports: any step can add a report, listed under the status block as "Reports" (icon, name, who it's from, View). They build up with progress. DEXA: Referral letter from the start, Booking confirmation once booked, Scan summary at Get your results, then the Body composition and Bone density reports when done. Other services: Referral letter, Booking confirmation, Preliminary report, Final report. On phone they sit straight under the status block, above the referrals card.
5.646 — Documents tweak is on by default (as steps). New "Doc number" segmented tweak (1 2 3 4, default 4), shown when Documents is on, in both the Timeline and service groups and kept by Save: the service asks for the first N of its documents (shared list for the service page and the Timeline). Step titles in the progress list are regular weight (400).
5.647 — A last step that just says "Done" (Diagnostics Review) is the done state, not a step in hand: no orange warning, no "Done" CTA. The page goes to Completed with that step green, the skipper's last next lands on Completed, and the Timeline marks it done.
5.648 — Documents open a fake form for the demo. It uses the same modal (desk) / bottom sheet (phone) as the booking.
- Consent: an intro, a short scrollable text, an "I have read and understood" tick box and a typed-name signature, then "Sign and submit".
- Questionnaire: four tap-to-answer questions with a "N questions left" count, then "Submit".
- Submitting completes the document and the next one comes up in hand. This applies to the status block CTA and to the document rows. The demo skipper still ticks documents off directly.
The status block title is now an action ("Sign your Scan Consent", "Complete your Health Questionnaire"); the step on the right keeps the plain name.
5.649 — Document layout "Part of status block": a document stays in the status block, whatever the step, until its form is submitted; only then does it move to the body list (Consents / Questionnaires). The demo skipper no longer ticks documents off in this layout, it only moves the steps. The title follows the step: "Before you book…" at Book, "Before your appointment…" at Go to your appointment, "Please complete the required documents below." after it.
5.650 — "My documents": every document completed, signed or uploaded lands in one body section called My documents (icon, name, a green "Completed" / "Signed" / "Uploaded", View), in either Document layout. If nothing is done yet, the section is not shown. It replaces the separate Consents / Questionnaires headings. There is a new document kind, a photo upload (camera icon, "Upload", "Upload your Photo ID" in the status block). Its fake form has a dashed "Take a photo or choose a file" area; tapping it fakes a picked photo (thumbnail, IMG_2041.jpg, Replace) and enables Upload. For now the photo only appears in the non-DEXA services' document list, which is now Health Questionnaire, Service Consent, Photo ID, Privacy Consent.
5.651 — Reports only show once the service is completed (its last step done), not along the way: no Reports section until then; then all the service's reports are listed under the status block.
5.652 — A completed document opens again: View in My documents opens its form read only. A consent shows the box ticked and the name it was signed with. A questionnaire shows the chosen answers, with the others dimmed. A photo shows the uploaded file. The footer reads "Signed today", "Completed today" or "Uploaded today", with a Close button. A document ticked off by the demo skipper never had a form filled in, so it shows default answers ("Signed electronically", the first option for each question).
5.653 — Timeline: with Document layout "Part of status block", the Timeline card shows no documents at all, only the service's own steps; the document rows under the steps are gone. With "Part of step timeline", documents still show as steps.
5.654 — "Your referrals" card always comes right after the status block, on desktop too, ahead of Reports, My documents, Your appointment and Instructions. On phone it now also comes before Reports.
5.655 — Overview, phone: the Insights cards are at half width. Two cards fit across with 32px of the third showing, so the row now lines up from the left (start snap at the row's 13px inset) instead of centring.
- The contents are scaled down to match: 12px padding, a smaller label and close button, a 12.5px title, an 11px byline, a 72px illustration and a smaller See insights button.
- The illustration and button sit at the foot of the card, so they line up across cards.
- The desktop rail and XS desktop are unchanged.
5.656 — Overview, phone: Insights card padding 16px (+4), the dismiss button 28 × 28, and the phone's section titles at 26px (Insights and Your action plan, kept alike). The cards hold their width (min-width 0), so two still fit across with 32px of the third; a long doctor's name now ends in "…".
5.657 — While a document is the thing to do (the document in hand as a step, or one still pending in the status block), "Instructions" is replaced by "Why we need this information", with three lines for the kind of document:
- Consent: what consent confirms, that the scan cannot go ahead without it, and that it can be withdrawn.
- Questionnaire: how the answers help prepare the visit and keep the scan safe, and that the doctor reads them.
- Photo ID: matching the member to the referral, and that the photo is stored securely.
Once the documents are done (from Book on), Instructions comes back.
5.658 — "Your referrals" is now a row in the My documents style, not an outlined card: the barcode in a 48px tile, "Your referrals" with a small grey line ("Show them when you get to your appointment"), and an outlined Show button. Same on desktop and phone (the phone's chevron button is gone). It still sits right after the status block.
5.659 — My documents is always the last section of the body, after Your appointment / Your service and Instructions (or Why we need this information), on desktop and phone. On phone it comes before the rule and About the service.
5.660 — Once the results are in (service done), "Results" replaces the Reports list. It has two chips styled like the Insights page's, Everlab report (default) and Medical records.
- Everlab report: one full-width card with an "EVERLAB REPORT" eyebrow, the report name and a New badge, the date and biomarker count, a See report button and the service picture on the right. Placeholder data: DEXA "Body composition & bone density", 1 Oct 2026, 18 biomarkers.
- Medical records: the Insights page's records list. A group header (category dot, Imaging for DEXA or Pathology otherwise, the date, the provider, a download button) sits over one row per document, each with a file icon and View.
5.661 — At "Get your results" the body drops Your appointment and Instructions (the appointment is behind them), leaving My documents. They come back once the service is done.
5.662 — Overview phone Insights cards, larger text: label 13px, title 15px, byline 12.5px. Because the larger text cut off the doctor's name, the name and date now sit on two lines (no separator).
- The card copy reads "New insights from your …" instead of "We have some insights from your …" on every host.
5.663 — Overview, phone: a "Health profile" section ("0 of 3 done") sits between Insights and Your action plan. It is one card with three rows, each an icon tile, a title, a grey line and a pill button:
- Fill in your questionnaire, Start
- Connect your wearables (Apple Health, Garmin, Oura or Whoop), Connect
- Upload your medical records, Upload
5.664 — Tweaks › Overview › Section order: a list of the phone's sections (Services, Shortcuts, Next step, Coverage & age, Insights, Health profile, Your action plan) that can be dragged into any order. Each section moves with all its parts (heading, cards, dots, the Timeline link). Sections another tweak hides are marked "hidden". Save keeps the order (stOvOrder) and Reset restores it. A card section dropped under another section keeps a 24px gap.
5.665 — Overview phone Insights cards: the title is 4px smaller (11px), in one colour (no white source), with 8px above it.
5.666 — Insights desktop: a new "Tabs" tweak (segmented, in the Biomarkers tab group) switches the page tabs between Inline (the underlined line, the default) and Segmented. Segmented is the phone's pill: a tinted rounded ground, tabs at least 150px wide, and a lighter pill under the tab in hand that glides between tabs. The Reports count badge stays.
5.667 — Health profile is a to-do list. Each row has a circle on the left, which turns into a green tick when done, and a done row's title is struck through and greyed, with its button gone. Tapping the circle toggles a row; tapping its button (Start / Connect / Upload) completes it. The heading counts "N of 3 done". The questionnaire starts done (1 of 3) to show the state. The icon tiles are gone.
5.668 — Insights desktop (Latest report layout):
- The Latest report card is 256px tall, and the Steps card beside it matches.
- The "Got a record from your provider? Upload records" card is removed.
- "Upload records" (link and upload icon) now sits at the right end of the page tabs' row, under the divider line in Inline and beside the pill in Segmented.
- In Segmented, the pill's ground is drawn under the tabs only (--trackW, measured), so the row can run on to the link.
5.669 — Overview phone Insights cards: title 16px. Health profile's count reads "1 of 3 done" without the flex gap after the number.
5.670 — Insights desktop: the Tabs tweak defaults to Segmented (the pill).
5.671 — The Tabs tweak class sits on <html> (the page's modes rewrite the body's classes, which had dropped it), so Segmented holds as the default. Segmented tabs on desktop hug their labels (20px each side, no equal widths). The Medical records header's "Upload records" is gone on desktop; the one beside the tabs is the only one, and the info pop-up's link scrolls to it.
5.672 — The desk's Upload records beside the tabs is a tertiary CTA: outlined (1.5px ring), fully rounded, 40px tall, no underline, with a hover ring.
5.673 — Insights desk: Segmented tabs 44px tall, Upload records CTA 44px (20px sides), its ring at half the opacity (.18 → .09, hover .2; light .1).
5.674 — Insights desk Segmented tabs: the whole control is 44px (36px tabs in a 4px inset), matching the 44px Upload records CTA.
5.675 — Insights phone: the tabs sit at the left, each as wide as its label, inside a 44px pill whose ground is drawn under the tabs only. An outlined "Upload" CTA (44px, fully rounded, half-opacity ring) sits at the right of the same row. The V4-only Insights tab stays hidden outside V4.
5.676 — Insights phone: the two tabs fill the pill, sharing the width up to Upload equally (12px gap before Upload). The Reports count badge is orange, #f7641f with white text, on phone and desk.
5.677 — The Reports count badge (phone and desk) takes the Overview "12" badge's style: a pill, #43220b ground, #fbe9d8 figure.
5.678 — Insights phone: the tabs row sits at the same height as the Overview's ask bar (138 from the frame top, 8 higher than before).
5.679 — Reports count badge: peach (#f3b98c) with a dark figure, as the reference. The gap between the label and the badge is 2px wider (8 on the phone, 10 on the desk).
5.680 — Overview phone Insights cards: title 14px (line-height 1.35).
5.681 — Overview phone Insights cards: the dismiss is a ghost button (no fill, grey ×, a faint fill and white × on hover).
5.682 — Overview phone:
- New tweak "Insight cards", segmented: Condensed (default) is the two-across cards with the peek, left-aligned; Non condensed is the earlier single wide card (86%), centred. The condensed rules are keyed to html.insCond, and Save keeps the choice (stInsCond).
- The section titles (Insights, Health profile, Your action plan) are 20px.
5.683 — Phone bottom nav: inactive tabs 50% more opaque (.42 → .63 dark, .36 → .54 light; hover .85). The Dock tweak's inactive slider still scales it.
5.684 — Overview phone condensed Insights cards: title line height 17px (was 1.35, about 19px).
5.685 — Overview: new "Hero image" tweak (segmented): Cover (as before) / Top right — the hero card's picture as a 96px rounded tile at the top right (no dark run), the copy beside it, the Book button bottom left and Next availability bottom right (right-aligned). Kept by Save (stHeroImg).
5.686 — Overview hero (Consult):
- The new photo, assets/overview/hero-doctor.webp (800×1196, from the supplied portrait), replaces the office shot.
- Cover: the portrait sits at the right (62% wide on phone, 46% on desk), face in the upper half, its left edge faded into the card by a mask. The DEXA and Report heroes keep their own pictures.
- Top right: the face is centred in the tile.
- The hero card's title is 2px larger: 18 on phone and XS, 21 on desk.
5.687 — Overview phone, condensed Insights cards: the byline shows the date only (no doctor or device name). Non condensed keeps "name | date".
5.688 — Overview phone, new tweaks:
- "Health profile" (Section / In Insights). In Insights moves the to-do list into the first card of the Insights carousel. That card is 70% of the row, with "Health profile" and its count at the top and titles only, and the insight cards follow in whichever card style is set. The section heading is hidden, and the carousel dots count the card. Back to Section returns the list under its heading.
- Dock › Material › "Glass effect" switch: a liquid-glass preset on the sliders (blur 22, saturation 190%, brightness 1.08, tint 25%, sheen 140%) plus a lit rim and a soft top sheen on the island and the AI button. Turning it off restores the previous slider values.
5.689 — Overview hero card: 6px gap between the Next step chip and the title (was 22).
5.690 — Overview Insights cards use the new imagery set (assets/overview/card4-*.webp, from the supplied renders):
- Dexa report: the pale report sheet
- Health questionnaire: Dr Steven L.'s card
- Advanced blood panel: the navy charts
- Apple Watch: the watch photo with its chips
- Oura ring (syncing): the run photo
5.691 — Service page: once the service is done, Your appointment and Instructions are dropped too, as at Get your results. Results and My documents remain.
5.692 — Overview phone, condensed Insights cards: the date sits above the title (label, date, title, picture, button).
5.693 — Overview phone, Insight cards tweak: a third option "Mid", between Condensed and Non condensed. It shows one card wide with 72px of the next visible. The content is styled as Condensed (date above the title, no name) and the cards line up from the left.
5.694 — Health profile in the Insights carousel: its header uses the Explore cards' label row (grey dot and "Health profile", count at the right), and the to-do list sits at the foot of the card.
5.695 — Overview phone, condensed and mid Insights cards: the order is label, picture (80px), date, title, then the button at the foot.
5.696 — Condensed and mid Insights cards: the date replaces "Explore" in the label row, beside the dismiss, and the byline row goes. The order is now date row, picture, title, button.
5.697 — Insight cards tweak:
- The Mid option is removed, leaving Condensed and Non condensed.
- Non condensed: the title is 16px in one weight (500) and one colour, with no lighter or bolder source.
- Non condensed: the button sits at the card's foot, with 18px under it to match the top-left inset. Cards stretched by a taller neighbour had left 37px there.
5.698 — The Insights "See all" count badge (phone and desk) is grey (#4a4a4a, white figure) as the reference, still 28px tall, with 2px more between "See all" and the badge (9 → 11 on the phone, 11 → 13 on the desk).
5.699 — Timeline: a new "Steps" tweak (Vertical / Horizontal, kept by Save). Horizontal draws an open service's steps the way the phone's service page does: a row of bars coloured by status (done green, in hand orange, waiting grey, others empty) with the step in hand's name under it, inside the same panel. Documents shown as steps count as bars.
5.700 — Timeline, Horizontal steps: the bars are at most 240px wide (96px at the least), and the name of the step in hand sits to their right on the same line.
5.701 — Every sticky top bar (Overview phone and desk, Service and Appointment pages desk and phone, Timeline) now uses one recipe:
- A single, even 18px backdrop blur across the bar's whole height.
- A black 62% tint (cream 72% in light mode) over the same area.
- Both run 30px past the bar's bottom and fade out over those 30px.
- This replaces the ten progressive bands that thinned toward the bottom and the earlier cut at the bar's edge.
The Insights desk's pinned filter bars, which are opaque, are unchanged.
5.702 — Sticky bars: some browsers ignored the mask on the single blurred layer, so the blur ended in a hard line. It is now ten stacked bands with no mask. Each is 3px shorter and blurrier than the last (1 → 18px), so the blur eases out over the 30px bleed and is full strength across the bar itself. The tint still fades smoothly over the same 30px.
5.703 — The sticky-bar rule, the same for every sticky top bar (Overview phone/desk, Service and Appointment pages desk/phone, Timeline). Call the bar H tall:
- The tint and the blur cover H + 32px.
- The top half of H is solid black (cream in light).
- From the bar's middle to 32px below it, the black fades out on an eased curve.
- The blur is ten stacked bands, unmasked, whose bottoms step from mid-bar to the end of the bleed: full under the top half, easing out across the remaining half + 32.
5.704 — Service page, Results › Everlab report card: it carries the report's own welcome, as in the report modal reference:
- the title "Your complete blood panel report is here." with the New badge
- Dr. Steven Lu (his avatar, assets/overview/avatar-steven.webp) · 23 April 2026
- the patient photo, cropped from the reference: assets/overview/report-debrief.webp
5.705 — Sticky bars: the tint is the page's own background rather than pure black: #0f0f0f on the desk cards, #0d0d0c in the phone, white or cream in light mode. It uses the same half-solid, eased-fade, +32px shape.
5.706 — Timeline group cards: the services you can open that have no other control (done or locked) show a small ghost circle with a chevron at the right; it fills on the card's hover. The card in hand, with its steps, has none, and the cards that carry a View button keep it instead.
5.707 — Timeline: the pinned month header ("September 2026") sits above the top bar's tint and blur (z 6 over the bar's 5). It is content, so it stays crisp, and the bar's bleed runs behind it rather than over it.
5.708 — Service page: the details section that read "Your service" is headed with the service's own name ("DEXA Scan", or the service's title for the others).
5.709 — Service page demo skipper: on each prev/next, only the step items whose state changed fade (out to nothing and back in their new state over 420ms). The rest of the list and the status block do not move.
- Steps not yet reached show their content at 70% opacity, on the service page and in the Timeline's step lists, where they now take the step ink at 70% rather than a grey.
5.710 — Overview desk, Insights rail: the prev/next arrows moved from the section header onto the rail. They are 40px glass discs at its two ends, at mid-height, 8px in.
- Each shows only when there is somewhere to go: prev hides at the start, next hides at the end.
- With no overflow (two or fewer cards) the pair is hidden altogether.
5.711 — Sticky rule, clarified:
- The ground is the page colour, solid over the first 50% of the sticky group's height, then fading over the remaining 50% plus 32px.
- The blur reaches 130% of the group (at least the fade's end), full under the solid half and easing out below.
- On the Timeline the group is the tabs bar plus the month heading pinned under it. The ground and blur are measured on both (--stkG / --stkExt set as the month pins), and the pinned month drops its own plate and fade so one ground runs under the pair.
5.712 — Chevrons: the ghost circle sits 4px after the label or badge, on the Timeline group cards and now also on the service page's journey cards (the dependency services you can open with no View button, e.g. a locked Member Check-In). It fills on the card's hover.
5.713 — Condensed Insights cards: the order is date row, title (13/16px, 8px under the date row), the picture centred in the space left, then the button. The title is left-aligned, 14/17px.
5.714 — Overview hero card: the title is 1px smaller (17 on phone and XS, 20 on desk), with 4px more between the Next step chip and the title (6 → 10).
5.715 — Hero image "Top right": the photo is a 112px circle (was a 96px rounded square), and the Book button uses the larger 44px size.
5.716 — Overview phone, Your action plan rows:
- The step in hand ("Go to your appointment") is the service's subtitle, one line in the normal grey. It is no longer an orange badge.
- The "Step 2 of 3" chip and the step bars sit side by side on one line, under the subtitle beside the picture (the current bar stays orange).
- The Protocol badges are removed.
- 20px between the picture and the text (+4).
5.717 — Overview phone, Health profile: new "Profile style" tweak, List (default) or 3 columns.
- 3 columns shows three tiles side by side. Each has an icon on top, a short title (Fill your questionnaire / Connect your accounts / Upload your medical record) with no subtitle, and its button full width at the foot.
- A done tile shows a green tick at its corner and its title struck through, and its button is hidden; it keeps its height.
- It applies to the Health profile section only; the In Insights card keeps the list.
5.718 — Condensed Insights cards: the title is left-aligned again, at 14/17px. The picture sits 12px above the button on every card (8, then +4) (it was 16–25px, centred in the space), and the free space now goes above the picture.
5.719 — Overview: new "Hero background" tweak, Dark (default) / #777670. The grey ground carries the photo's edge run in the same grey; the lead text, the chip and the availability line are lightened to read on it. Kept by Save (stHeroBg).
5.720 — Hero background tweak: a third option, Dark brown (#2b2019), with the photo's edge run in the same brown and a warm-tinted chip.
5.721 — Sticky bars, smoother progressive blur: the ten bands each feather out over their last 28px (they had hard edges), and the blur climbs on a gentle curve (0.5 → 18px) instead of even steps, so the bands blend into one another. The span is unchanged: full under the solid half, easing out over the remaining half + 32px.
5.722 — Save covers every tweak.
- The Tweaks panel and the Dock › Style panel each end with a Save / Reset row that stays at the panel's foot.
- Save (that one or any group's) stores the value of every control in both panels: selects, switches, segmented tabs, sliders, colours and the section order. They come back on load (localStorage everlab:tkAll, alongside the earlier everlab:tkPages).
- Reset clears both stores and puts every control back to its value as the page loaded.
5.723 — Hero background tweak reduced to two options: Neutral (the earlier dark #161514) and Earth (#252522), with Earth the default. The grey and brown trials are removed.
5.724 — Overview Insights: the Oura ring "syncing / Provide consent" card is now first in the row, on phone and desk.
5.725 — Condensed Insights cards:
- The title is 4px higher (4px under the date row).
- The dismiss sits 4px further right.
- The See insights / Provide consent button hugs its label and is centred, rather than running full width.
5.725 — Condensed Insights cards:
- The title is 4px higher (4px under the date row).
- The dismiss sits 4px further right.
- The button hugs its label and is centred.
- The cards are 10px apart (−2), with the third card's peek kept.
5.726 — Demo skipper, no blink: on prev/next each step's text eases from the opacity it had to the one its new state gives it (70% ↔ 100%, 320ms). Nothing drops to zero and nothing else animates.
5.727 — Overview phone, Services tweak: new "Condensed" option (Tiles / Condensed / Large). Each card is one 64px line: the label at the left, and the render shrunk to 28px on a 40px grey disc at the right.
5.728 — Overview hero card:
- The whole card is tappable and opens the booking, as the Book button does.
- It lightens on hover (Earth #252522 → #2d2d2a) and scales to 98% while pressed.
- The Next step chip is 28px tall, with its ground at half the opacity (14% → 7%) and 2px more space below it.
5.729 — Condensed Insights cards:
- The label row always shows a date; the Oura syncing card gets 9 Apr 2026.
- At least 8px above the picture.
- 4px more under the button, whose sides are now 18px (−2).
5.729 — Condensed Insights cards:
- The label row always shows a date; the Oura syncing card gets 9 Apr 2026.
- At least 8px above the picture.
- 4px more under the button, whose sides are now 18px (−2).
- Insight cards (phone and desk) lighten on hover (6% → 9%) and scale to 98% while pressed, as the hero card does.
5.730 — Carousels: the pictures inside cards (Insights renders, service renders) are not draggable and ignore the pointer, so a swipe or mouse drag that starts on a picture moves the row like anywhere else on the card. Pressed cards scale to 98%.
5.731 — Condensed Insights cards: each card is 4px wider, so the third card shows 24px (was 32).
5.732 — Overview desk, Your action plan: both the grid cards and the list rows follow the phone. The step in hand is the line under the name, the Step chip and the bars sit side by side under it, and there is no Protocol badge.
5.733 — Chevrons, on the Timeline group cards and the service page journey cards: the ghost chevron sits right after the service's name, and the Locked / Related badge stays at the far right.
5.734 — Service page, Results › Everlab report card:
- No eyebrow and no New badge.
- The doctor (with avatar) and date sit above the title.
- The photo is a circle at the top right: 112px on desk, 80px on phone.
- 24px padding all round.
5.735 — Tweaks: Hero action, Hero background and Hero image are grouped in a card of their own, "Hero task", after the Overview group.
5.736 — Tweaks: an "Insights" group holds the count (relabelled "Amount": 0 / 1 / 2 / 3+) and Insight cards (Condensed / Non condensed), after Hero task.
5.737 — Health profile card in the Insights carousel: each to-do is a card of its own. It is ghost at rest (no fill, no separator), takes a 6% ground on hover, and is pressed 2% smaller. The list sits at the card's foot, 4px from its sides and bottom, with 2px between rows.
5.738 — Health profile check circles are 20px (tick 11px), in the section and in the Insights card. The hero title is a single colour (the grey lead now matches) and 1px smaller: 16 on phone and XS, 19 on desk.
5.739 — Health profile card in Insights:
- The item cards' corners are concentric with the card: its radius less the 4px inset, so 12px on a 16px card (22 → 18 in Non condensed).
- The titles are 12.5px.
- Each row's button is a ghost chevron, a 28px circle that fills on the row's hover.

5.740 The action plan gets a card for the deferred steps ("on action plan add a card to show the deferred actions"). It sits under the plan, before See full timeline. It is a dashed card with a calendar-clock tile, "2 steps deferred", a one-line list of what was put off and when it returns (DEXA Scan, Sun 1 Nov; Skin Check, Mon 16 Nov), and a View button. View opens the list inside the card, one row per step, and each row opens that service's page. On the desk it spans the plan grid; at XS it follows the list. It moves with the action plan in Section order, and the new-user Overview hides it.

5.741 A group's locked services sit under an eyebrow, "Your services" ("an eyebrow group title above a group of locked services"). It goes above the first locked service other than the page's own, in the service page's progress list and in the Timeline's group list (13px, medium, grey).

5.742 The eyebrow over a group's locked services now reads "Up next" instead of "Your services" ("Your services --> Up next"). This applies on the service page and in the Timeline.

5.743 Locked services lose their Locked badge ("remove the Locked badge"), on the service page, the Timeline and the appointment page. The chevron moves to where the badge was, at the card's right ("chevron CTA instead on the right side").

5.744 A locked service in Up next opens a modal over the page instead of switching to its page ("open just a modal vs switching the page"). The modal shows:
- The service's picture with a Locked tag.
- What unlocks it ("Unlocks once your DEXA Scan is complete.").
- The service's About text.
- Its duration and location.
- Its steps, under "What happens".
- "After your DEXA Scan" and a Got it button in the footer.

It works on the service page (as a modal on desktop, a sheet on phone) and in the Timeline's group lists. The deferred card's Skin Check now uses its own picture.

5.745 When the page's own service is locked, the Up next eyebrow now goes above it, so above Diagnostics Review when viewing it while the DEXA is still to do. It previously sat only above the services after it ("for this case the Up next should be before Diagnostics Review"). The same rule applies in the Timeline's group lists.

5.746 The hero card's round doctor picture is 4px smaller, 112 → 108px ("reduce by 4px"). The title's room beside it grows to match.

5.747 The Health profile card in Insights: each to-do card's own padding is up 4px on every side, 8/8/8/12 → 12/12/12/16 ("card padding internal + 4px").

5.748 Desk Insights header: the divider between "See all 12" and the arrows is gone ("no need divider").

5.749 The desk rail's overlay arrows sit centred on the rail's edges, half of each 40px button outside the container ("arrow should be positioned 50% bleeding outside the container").

5.750 Insights cards: the eyebrow to title gap is 4px larger, 2 → 6 on the desk and 4 → 8 on the phone ("add 4px gap between eyebrow and title").

5.751 Desk Insights sticky fix: under B2 the filter block now sticks at -66px from the start, where before it only took that value once marked .stuck. It used to pin at -32 first, with 58px of bare ground above the select cutting the cards off, then jump up 34px when .stuck came on ("sticky bug here, clipping when become fixed"). It now scrolls straight to its pin and holds.

5.752 Insights copy ("Your debriefs / Reports - Results"):
- The Reports tab is now "Results", desk and phone, in every layout.
- The "Everlab reports" heading is now "Your debriefs", along with its info sheet title and the All reports drawer heading.

5.753 My documents: each status carries its time, grey, after a dot ("Signed · Today, 9:12 am"; older ones by date). The completed document's modal footer shows the same. The time is recorded when the document is done.

5.754 Once a service is done, its documents stay in its steps, ticked. The list keeps the same length it had while in progress, 7 for the DEXA, where it used to drop to 3 ("completed steps has less steps than the previous steps, should be the same amount").

5.755 The locked service modal is now short ("just explain briefly WHY this service is locked and display a card by the blocker services, CTA See detail"):
- The picture with a Locked tag.
- One line on why: "Member Check-In builds on your DEXA Scan and Diagnostics Review, so it unlocks once they are complete."
- Under "Complete first", one card per service it waits on: picture, name, status and a See detail button that opens that service's page. The one in hand is orange, the others show their lock.

The about, details, steps and footer are gone. It applies on the service page and in the Timeline.

5.756 Locked modal, round two:
- A 160px banner of the service's imagery leads, in place of the square picture ("put a banner with imagery instead of square img").
- The tag reads "Not available yet" ("Locked badge -> Not available yet"). The line says it "becomes available once …", never "unlocks" ("no Unlock term, more like available").
- The blocker cards gain 4px of padding (10 → 14) and a bigger picture (44 → 56). Their status is grey, no longer orange ("remove orange text"); the card in hand keeps its orange ground.
- A later blocker that is itself locked also reads "Not available yet".

5.757 New service page tweak, Content: Sections (default) / Under tabs ("try a tweak content under tabs, where all sections are under tab"):
- Under tabs, every section below the status block becomes a tab in an underlined row: Referrals, Results, Appointment, Instructions or "Why we need it", Documents.
- One section shows at a time, fading in. The selected tab is kept through repaints.
- Your progress stays above the tabs.

5.758 About the service has left the page, both the desk's right column and the phone's foot, and moved into the … button ("About this service under the More CTA, dropdown: Do it later, About this service"):
- The … button opens a small menu with Do it later and About this service.
- About opens a modal with the banner, the name, the about text, duration, location, provider and Read more.
- Do it later shows a toast: "DEXA Scan moved to later. We'll remind you in 30 days."

5.759 The outlined Show / View buttons (referrals, My documents) are fully rounded, and their border is at half its opacity (.18 → .09; light .2 → .1) ("lighter border button opacity less by 50%", "full rounded").

5.760 Locked modal header, Banner (the default): the picture runs edge to edge across the modal's top, and the title and close button sit over it on a dark fade ("the image as an edge-to-edge banner with the header overlapping the top"). A round 80px lock avatar straddles the banner's foot, 56px on the banner and 24px on the body ("avatar style overlapping the header and the body, 70% / 30%"), with the description below. The About this service modal uses the same banner, without the avatar.

5.761 New tweak, Locked modal: Banner / Simple ("a tweak variation with this simple header"). Simple shows, centred:
- The service picture (88px, rounded) with a round lock badge on its corner.
- The title "{Service} not available yet", 22px.
- The why line in grey.

The Complete first cards follow, as before.

5.762 Locked modal text:
- The service name moves out of the header and into the body, 20px, with the "Not available yet" badge at its right ("the badge on the right side, the title above the description, not in the header").
- The description is regular weight at 14.5px ("regular size") and fuller: a per-service reason for Diagnostics Review, Member Check-In and the gut report and review; otherwise the why line plus the service's about ("describe more").
- 32px sits before Complete first ("more margin before Complete first").

The Simple variant uses the same fuller description.

5.763 Locked modal (Banner): 8px more between the title and the description (10 → 18), and the description is #fff ("increase gap between title and desc by 8px, desc #fff").

5.764 Locked modal, Complete first cards: 8px more under the name (2 → 10), and the status in #fff. The status of the one in hand reads "Next to complete" instead of "Ready to book" ("next to complete, not ready to book"); the locked ones still say "Not available yet".

5.765 Complete first shows one card, the next service to complete, not every one before it ("no need to show all next services, just the next one"). The description still names them all.

5.766 Steps tweak set to Horizontal: on the phone (and XS) the bars and the step in hand move into the hero, under the title and date, as lighter tracks on the picture ("replace that inside the hero header, below the title group"). Tapping them opens the steps sheet, as the card did. The page's own card in Your progress keeps its name and This service badge without the bars; a lone service's card is hidden.

5.767 New tweak, Docs in one step (Off / On) ("if multiple consents / docs inside one step, stack them as cards inside the status block"). On:
- A service's documents are one step on the right, "Complete your documents · 4 forms before your appointment".
- The status block reads "Complete these before your DEXA Scan", with the sub line "These need to be finished before your DEXA Scan can be scheduled."
- The documents still to do are stacked inside the block as cards, each with an orange dot and its own button (Review / Complete / Upload).
- Each one leaves the stack as it is done. When none are left, the step ticks and the page moves on to Book.

5.768 The Content tweak gains "Under pill tabs": the same sections, with the tabs as pills in the look of the Results chips ("all sections of the body organised under a tab pill system"). On the phone the row scrolls edge to edge.

5.769 The Simulate row (Next step / Reset) is gone from Tweaks ("remove that tweak"). The page's own previous / next arrows by Your progress still walk the steps, and the script's listeners skip the missing buttons.

5.770 Service page step bars are 1px thicker, 3 → 4 ("increase thickness 1px"), still centred under the dot (8px in). The pill tabs use their own svCPill class: a global .pill rule had given their row a red ground.

5.771 Locked modal, Banner:
- The banner is 128px tall and shows the service's picture blurred 128px, a wash of its colours.
- The avatar is now the picture itself, at 24px radius instead of a circle, still 70 / 30 over the banner's foot ("circle needs to be the image of the service, rounded 24px not fully circle; banner 128px height, bg blur 128px").
- The Complete first card is neutral grey, no longer orange ("neutral, not warning").

5.772 On the service page's Results section, the first chip reads "Everlab results", no longer "Everlab report" ("Report → Results", confirmed as the chips).

5.773 The page's own card in Your progress follows the page. It is ticked and struck through only when the service is done. A journey handed over from elsewhere could carry it as done while a step was still in hand (a tick over "Go to your appointment"). The page's state now overwrites that ("that's not possible, it's incomplete, change the check complete at the top"), and the group's next service is worked out again from it.

5.774 Content under tabs: the section that matters now stays a full section, heading and all, above the tabs. The others are secondary, under the tabs ("tabs are secondary items, put the primary section above the tabs").

The primary is the first present of: Results, Why we need it (a document pending), Appointment, Referrals, Instructions, Documents. If only one section would be left for the tabs, the page stays as plain sections.

5.775 Under tabs, the tabs are always the same four, in this order: Referrals, Appointment, Instructions, Documents ("tabs should always be there, even if empty"). One with nothing in it says so in a grey line ("No upcoming appointment.", "Documents you sign, fill in or upload show here."). The tab that is the primary section above is left out. Any other section joins after the four. The status block and the progress always stay above the tabs.

5.776 Steps not yet reached show their words at 50%, down from 70% ("opacity 50% inactive item"). The step fade animates between the same computed values, so it follows.

5.777 The service page body's section titles (h2) are smaller: 22 → 18 on the desk, 18 → 16 on the phone and XS ("main section title smaller, h2"). Your progress keeps its size.

5.778 Docs in one step is now a 1 / 2 / 3 select: how many documents make one step ("select 1 2 3").
- 1 is every document its own step, as before.
- 2 or 3 take them in steps of that size, each named for what it holds: "Sign your consents", "Fill in your questionnaires", or "Complete your documents" when mixed. The documents' names are the sub line, and a step left with one document keeps that document's name.
- While a step of several is in hand, the status block reads "Sign these / Fill these in / Complete these before your DEXA Scan", with only that step's documents stacked as cards.

5.779 The referrals have their own section title, "Referrals" ("add title for Referrals"). Under tabs it folds into the Referrals tab.

5.780 Content under tabs is down to two tabs, Documents and About this service ("tab should only be Documents, About this service"). Every other section stays a plain section above them: Referrals, Your appointment, Instructions or Why we need it, and Results. About this service holds the about text, duration, location, provider and Read more. Documents shows My documents, or an empty line.

5.781 Your appointment loses its View appointment button at the right ("remove right cta").

5.782 Locked modal: the avatar has no ring ("no border"), and the banner's blur is 32px instead of 128 ("blur 32px"), so the picture still reads through.

5.783 Locked modal, Banner: the badge is gone and the title says it, "{Service} not available yet." ("remove badge; title $name not available yet.").

5.784 With the steps tweak set to Horizontal, the hero's progress is a card ("progress card header like this"). It is translucent and blurred, 22px round, and taps 2% smaller. A header row reads "Your progress" with the count at its right (1/4), then the bars and the step in hand in grey.

5.785 The referrals row is an outlined card: a 1px border at 10%, 20px radius, 14px padding ("outlined card").

5.786 Content gains "All under tabs" ("tweak this with the tab system"). As pills, every section becomes a tab: Referrals, Appointment, Instructions or Why we need it, then Documents and About this service. Results, when there are any, stays above.

5.787 At the results step and once done, the referrals leave their section and file under My documents, as "Your referrals · Used at your appointment" with a View button ("on get your results, this referral is irrelevant, put on doc"). My documents now shows when the referral is its only entry.

5.788 The documents stacked in the status block sit 4px apart instead of 8 ("gap 4px"). Their buttons are full round and smaller: 34px tall, 15px padding, 13.5px text ("full rounded, smaller").

5.789 Service page results renamed: the section title Results → "Debriefs", and its chips Everlab results → "Report" and Medical records → "Results" ("Results title → Debriefs; Everlab results → Report; Medical records → Results"). All under tabs keeps Debriefs above the tabs.

5.790 Health profile gains a third style, Stacked, now the default ("one section and stack 3 items inside"). The three to-dos sit in one card, one under the other, each with the 3 columns' icon tile at its left, its title and line, and its button. A done one gets a green tick on its tile's corner and a struck title.

5.791 The services in the phone's ask sheet take the look of the Overview's services row ("keep same visual in bottom menu sheet for actions"): 64px cards in two columns, the name at the left and the render on a grey disc at the right. There are six: Concierge, Telehealth, Check Symptoms (its glyph on the disc, having no render), Med Certs, Treatments and Pathology.

5.792 The services' visuals are 8px smaller, the grey disc 40 → 32px and the render inside it 28 → 22, in the Overview's condensed row and in the ask sheet's grid alike ("visuals 8px smaller").

5.793 The Health profile placement tweak is renamed in the user's words: "Health profile card", with Dedicated section / Insights carousel ("health profile card tweak: in insight carousel, in dedicated section"). It sits next to Profile style in the Overview group, and its behaviour is unchanged.

5.794 With the hero's progress card on, the hero gets a grey ground (#1c1c1b) under it ("the cover always sits on a grey background that takes 70% of the Your progress card, then fades into the hero img"):
- The ground is solid from the hero's foot up to 70% of the card's height, measured on each paint.
- It then fades over 150px into the picture.
- The card itself is a flat 7% white on that ground.

5.795 The hero's progress card has no parallax ("remove parallax on the Your progress card hero, the card should follow the content"). The card, and the title and date above it, move one for one with the scroll, at full opacity: the title had drifted slower and slid under the card. The grey ground moves with them, and only the picture keeps its slight drift.

5.796 Insights' Amount select (0 / 1 / 2 / 3+) is an On / Off switch named Insights ("use toggle on off").
- On shows the carousel of insight cards.
- Off hides it and shows the Health profile card in its place ("OFF show Health profile card"). If Health profile was set to live in the carousel, it comes back out as its own section, and goes back in when Insights is on again.

5.797 The Insight cards tweak (Condensed / Non condensed) is gone ("remove that"). The cards stay condensed.
Stacked is also the page's own default now, not only Reset's.

5.798 The microbiome example follows the attached design ("reduce the steps in the main right panel; orange the member acts, blue the member waits, green done; the sub steps inside the state block, in a card with a to-do list").

Right panel: Your progress lists the group's four services as its steps, "Step 2 of 4", each with a 4px bar and a line.
- Done ones are green, "Completed 3 Oct".
- The one in hand is orange when the member acts and blue when they wait, its name bold, with the kit's step and count ("Kit being prepared · 2 of 5").
- Later ones are grey with what to expect ("Usually ready 3 business days after your results arrive").
- A row opens its service, or its locked modal.

The assessment's steps are now the kit's five: Confirm your address (act), Kit being prepared (wait), Kit on its way (wait), Collect and post your sample (act), At the lab (wait).

The status block follows the step in hand:
- Blue "In progress" with no button while we work, e.g. "We're preparing your kit, it usually ships within 2 business days…".
- Orange "Pending action" with its button when it's the member's turn (Confirm address, How to collect).
- Below a rule sits a "Your kit · 1 of 5 done" to-do card: ticks with dates for the done steps, a blue or orange ring with its date for the one in hand ("Ships by 7 Oct"), empty circles after.

The member starts at Kit being prepared, on the page and in the Timeline. The phone shows the same, with Your progress in the body.

5.799 New tweak, Sub steps: how the kit's five show in the status block ("tweak sub steps: to-do list vertical, horizontal stepper, horizontal linear bar").
- To-do list (the default) is the vertical card as before.
- Stepper follows the parcel tracker: five nodes on a 4px track, filled green up to the step in hand. Done nodes are green with a tick, the one in hand is blue or orange with a soft ring, the name sits under each, and "Your kit · 1 of 5 done" is above.
- Linear bar is one 6px track filled to halfway through the step in hand, green fading to that step's blue or orange. The step's name sits under it, with when and "Step 2 of 5" at the right.

5.800 In the right panel, the bar of the service in hand fills top down only as far as its sub steps: 1 of 5 is a fifth, 2 of 5 two fifths, and the rest of the track stays grey ("the % progress on the filled bar needs to match the sub steps"). Done services stay fully green.

5.801 With Docs in one step at 2 or 3, the status block always holds that many cards, one per document of the step in hand (a questionnaire, a consent, an ID…) ("this should contain X cards that relate to the X docs"). A document done stays in the stack as a ticked card, no longer leaving it, until the whole step is done. Before, the second half of a step showed a lone Privacy Consent once Photo ID was in.

5.802 The Journey module tweak is gone ("remove this tweak"). The service page keeps Right column merged, its default (JR 'rightm' in the script), and the listener skips the missing select.

5.803 Stepper:
- The circles are 4px smaller (22 → 18px).
- The track is cut into segments, one between each two circles and 4px clear of both. A segment is green once the step before it is done ("4px gap between circles and lines").
- The step in hand ripples, blue or orange, every 1.8s ("ripple effect on the active one"), and holds a still ring when reduced motion is set.

5.804 On the microbiome's Collect and post your sample step, Instructions becomes "Before you post", a numbered list as in the capture:
1. Use every collection container in the kit.
2. Pack the Microba ice pack in the return package. Don't swap it for another one.
3. Activate the temperature gauge.
4. Post on a Sunday, Monday or Tuesday only, with the days on a soft yellow mark.

Numbers are in grey.

5.805 On the microbiome's At the lab step, Instructions becomes "What happens next", as in the capture:
1. Microba sequences your sample and sends us your results.
2. Your clinician reviews them and records a video walkthrough for you.
3. Your report, video and recommendations land here, and we'll let you know.

The kit's dates now run 3, 6, 9 and 13 Oct for the done steps, with Results by 27 Nov at the lab.

5.806 The top bar's Layout switch (Appointment / Service detail) is replaced by a Service select: DEXA scan / Microbiome test / Pathology test ("remove and replace by a select"). It shows wherever the service page does. Choosing one opens that service's page in the same place, desk or phone, in its demo state:
- DEXA scan opens at book.
- Microbiome test opens on Kit being prepared.
- Pathology test opens at book.

The select follows the page as it changes. The service page is now the only layout; the appointment page is no longer reachable from here.

5.807 The stepper's segments sit 8px clear of each circle, up from 4 ("4px + gap between circle and line").

5.808 The stepper's circles are 4px smaller again, 18 → 14px, tick 8px. The segments stay 8px clear and centred on them ("circle reduce by 4px").

5.809 The kit card's header row, "Your kit · N of 5 done", is gone ("remove"). The to-do list and the stepper start straight under the rule.

5.810 The blue "you wait" colour is now #BCCFEA on #0C2241 ("Blue → FG BCCFEA, Bg 0C2241"). The status block is #0C2241 with its tag and dot in #BCCFEA, and the to-do ring, stepper dot and ripple, linear bar end and right-panel bar all use #BCCFEA. The stepper's empty dots are #BCCFEA at 16% so they sit on the navy.

5.811 The kit's sub steps leave the status block for a card of their own, stacked under it ("put the sub steps group inside a stacked card below the status card, outlined card, no bg"). The card is outlined in 1px at 10%, with no fill, and starts 16px up under the status card so the two read as a stack. The status card is opaque so the outline doesn't show through. All three Sub steps styles sit in it, with the stepper's empty dots now 12% white on the page's ground.

5.812 The sub steps card gets a light grey ground (4% white, keeping its outline) and 8px more padding on top, 36 → 44 on the desk and 34 → 42 on the phone ("light grey bg for sub steps + 8px top padding").

5.813 The complete green is #42BE65 ("complete fg 42BE65"), across the microbiome system: the kit's ticks, the stepper's done dots and segments, the linear bar's fill, the right panel's done bars, and the Completed status block's tag and dot.

5.814 The sub steps footer card has 16px more padding top and bottom: 60 / 38 on the desk, 58 / 36 on the phone ("footer padding top bottom + 16px"). New tweak, Footer style ("tweak footer style"):
- Grey (the default) is #fff at 4% with no border.
- Bordered is a 1px outline at 10% with no ground.

5.815 The sub steps footer card's padding is 8px less top and bottom: 52 / 30 on the desk, 50 / 28 on the phone ("decrease padding top bottom 8px").

5.816 The "you wait" status block (In progress) is #fff at 4% instead of navy, with the tag and dot still #BCCFEA ("In progress (user wait): bg #fff opacity 4%"). When it is stacked over the sub steps card it uses #1b1b1b, the same grey made opaque.

5.817 The phone (and XS) service page always carries the main step block in its hero, under the title and date, whatever the Active card steps tweak says ("mobile: add main step block"). It reads "Your progress" with the count at the right, the bars, and the step in hand.
- For the microbiome the bars are the group's four services (1/4, 2/4…), the current one orange when the member acts and blue (#BCCFEA) when they wait. Its line is the kit's step and count ("Kit being prepared · 2 of 5").
- Elsewhere the bars are the service's own steps.

Done bars are #42BE65. Tapping the block opens the steps sheet.

5.818 The sub steps footer's Grey ground is #fff at 2%, down from 4% ("sub step footer bg 2% fff"), so it sits a step under the waiting status block's 4%.

5.819 With the progress card in it, the phone hero is no longer pinned and pushed by script: it scrolls with the page, natively. The card, title and date move as one with no lag, so the card stops floating ("the progress card floats weirdly on scroll, keep same as the hero header content"). Only the picture inside keeps its slight drift.

5.820 With the progress card in the hero, the picture no longer runs behind the whole hero. It stops where the grey ground turns solid (70% up the card), and the ground's fade carries it into the grey ("the hero bg img should start when the progressive bottom bg starts, not in the whole hero header"). The card itself sits on plain grey.

5.821 New tweak, Sub steps colour ("sub steps: avoid the coloured system, more like white and grey; create a tweak"):
- White & grey, the default: done steps are a white tick or dot, done segments and the bar's fill are white at 55%, the step in hand is a solid white ring or dot with a white ripple, and the rest are grey.
- Coloured: the green / orange / blue as before.

It covers the to-do list, stepper and linear bar. The status block and the right panel keep their colours.

5.822 On the phone (and XS) the stepper names only the step in hand ("sub steps on mobile can't show all labels, only show the current one"). The five nodes stay on their line without names, and under them sits one line with the current step's name at the left and its when at the right ("Kit being prepared · Ships by 7 Oct"). The desk keeps a name under each node.

5.822 On the phone (and XS) the stepper names only the step in hand ("sub steps on mobile can't show all labels, only show the current one"). The five nodes stay on their line without names, and under them sits one line with the current step's name at the left and its when at the right ("Kit being prepared · Ships by 7 Oct"). The desk keeps a name under each node.

5.823 New tweak, Progress placement, for the phone's main step block ("tweak progress placement: in hero header, in status block"):
- In hero header (the default) is the card under the title, as before.
- In status block puts the same block (Your progress, the count, the bars, the step) at the top of the status block on a clear ground, with a rule under it before the tag and title. The hero is then just the title, date and picture.

Tapping the block still opens the steps sheet.

5.824 The stepper's connecting lines are 2px thinner, 4 → 2px, still centred on the 14px circles ("reduce line by 2px").

5.825 The top bar's Open ↗ button, which opened the page in a window at the chosen viewport, is gone ("remove"). Its listeners are guarded and skip it.

5.826 The right panel's group steps (the microbiome's four) are no longer clickable: no pointer, no hover underline, and no click handler ("we shouldn't be able to click on a step"). They are for reading only.

5.827 The step bars take the palette exactly ("keep these colours exactly"): done #42BE65, the member's turn #F5BE8C (the peach), waiting #BCCFEA, and solid #4D4D4D for steps ahead. This applies to the service page's step list, the bars (hero card, horizontal), and the right panel's group bars.

5.828 The status block's primary button is 8px narrower each side, 32 → 24px ("primary CTA less padding left right by 8px").

5.829 The stepper's step in hand is a 2px ring with a 6px dot inside, in the status block label's colour: orange #F78359 when it's the member's turn, #BCCFEA while they wait. Its ripple is the same colour, in either Sub steps colour ("active circle, outlined 2px with a filled circle inside, same colour code as the label status above").

5.830 Steps done and steps ahead both dim their content (name and line) to 50%, leaving the bar at full colour; the step in hand stays at 100% ("completed steps and next steps: opacity only on the content, 50%"). This applies to the service page's step list and the right panel's group of services. When every step is done, nothing is dimmed and everything shows at 100% ("exception: all steps completed, no opacity"); the page marks this with .svFin, the group list with .allDone. Later services keep their text colours, so the 50% alone does the dimming.

5.831 The kit's sub steps follow the same rule ("inactive opacity"). In the to-do list and the stepper, the words of steps done and steps ahead are #ECECEC at 50%, while the ticks, rings and circles stay at full. The step in hand is at 100%.

5.832 The "This service" badge is gone from the page's own card in Your progress, and likewise in the appointment page's progress and the Timeline's group lists ("remove this"). The card is told apart by its place and its steps.

5.833 A completed service in Your progress (e.g. the DEXA Scan, struck through, seen from the Diagnostics Review page) opens a modal over the page instead of switching to its page ("open modal vs the actual page"). The modal has:
- The banner and the service's picture as its avatar.
- The name with a green "Completed" tag.
- "Completed on 6 Oct 2026." and what it is.
- "What you did", its steps all ticked and at full opacity.
- A See full details button that opens its page.

5.834 A new service, Whole Body MRI & CT Chest (key wbmri), built from the five screens ("create the MRI service"). It opens from the Service select ("Whole Body MRI"), and its five stages step by the arrows or its own buttons.

Each stage sets the status block, the body and a right panel of six services (MRI Onboarding Questionnaire, Screening Briefing, MRI and CT Chest consent, the scan, the report, the Post-Scan Debrief):
1. Questionnaire. "Complete your MRI safety questionnaire" with Start questionnaire, and "Why we need this information". Step 1 of 6, orange.
2. Book the briefing. Book (opens the booking), "What to expect", My documents (the questionnaire, completed 3 Oct 2026). Step 2 of 6.
3. Briefing booked. Green "Confirmed — Your briefing call is on Thu 8 Oct, 11:00 am", with Join call and an outlined Add to calendar stacked at the right. "Your briefing call" rows (date, online video call, 15 minutes, Dr Sarah Chen) and the reschedule note, then What to expect and My documents. The briefing's bar is green.
4. The doctor's review. A grey "In progress" block with no button, the header reading "Ready to sign by Tue 13 Oct", and "Why we need your consent". Step 3 of 6, blue.
5. More information needed. Orange, with Upload document and Message your care team; "What helps your doctor" then "Why we need your consent". Upload sends it back to the review.

The phone shows the same, with the hero card's six bars. Two stacked buttons sit at the right in a new .svSide layout; the global .side class had pushed the block into the sidebar.

5.835 The kit's sub steps card moves above the status card, as its header ("inverse footer and put it above as header"), and is headed by the main step's name, e.g. "Microbiome & Gut Health Assessment" ("add the title of the current main step above the timeline"). The status card overlaps its foot by 16px.

5.836 One completed green everywhere: every #9CC088 becomes #42BE65 ("completed icon uses the same green as the rest"). That covers the done tick on the page's own card, the Timeline's done marks and segments, the Overview action plan's bars, documents' Signed and Done, and Health profile's ticks.

5.837 The About this service modal is cut to its words ("remove properties rows, read more and cover"): the header "About this service" with its close, then the service's name and its description, with no banner, no duration / location / provider rows and no Read more.

5.838 The Sub steps tweak is gone; the kit's sub steps are the stepper, as in the design ("remove stepper tweak, keep as the design").

5.839 Docs in one step (1 / 2 / 3) becomes Multiple actions step, On / Off ("replace by multiple actions step on / off; this step is the first of the timeline, to show what Required actions can look like"):
- On, the documents are one first step, "Required actions · 1 of 4 done", and the status block stacks all their cards, each with its own button, ticked as they're done.
- Off, each document is a step of its own, as before.

5.840 The MRI service gains the rest of its screens, stages 6 to 10 (the arrows walk them; "complete the rest of the steps content"):
6. Sign your consent: Review and sign, "Why we need this information". The referral to Quantum Therapy Sydney (issued 9 Oct 2026) joins My documents. Step 3 of 6.
7. Pay your balance to book your scan: "$2,800, after your $199 deposit", Pay $2,800, then a numbered "Before your scan" (six points, "{4 hours}" marked as an open value). The signed consent joins My documents. Step 4 of 6, the consent "Signed 10 Oct".
8. Book your scan: Book scan above an outlined "Can't find a time? We'll book it for you", Before your scan. The panel reads "Book at a partner imaging clinic".
9. We're booking your scan with Quantum Therapy Sydney: blue, "confirm within {2} business days", one outlined Update your availability, and the header "Booking confirmed by Wed 14 Oct".
10. The exception, Not going ahead: grey, "A Whole Body MRI isn't the right fit for you right now", the doctor's words in a quote, Message your care team, the header "Closed on 9 Oct 2026". The panel reads "Closed", the consent is white "Not going ahead", and the services after it are struck through. My documents shows the questionnaire only.

5.841 A step not in hand (done or ahead) has its title in the sub line's grey #8B8B86, still at 50% ("inactive step: titles the same colour as the sub title"), both on the service page and in the group panel. All done, the titles are white again.

5.842 A done service in Your progress is no longer struck through ("remove strikethrough"). The MRI's closed services keep theirs, as in the design.

### 5.843 MRI: last 5 screens, debrief modal, warning colour
- New MRI stages, inserted before "Not going ahead" (now stage 14):
  - 9: Choose a new time (the clinic cancelled).
  - 10: Booked, confirmed, with Your appointment rows.
  - 11: With the radiologist.
  - 12: Your doctor is reviewing.
  - 13: Your debrief is ready.
- Stages 11 to 13 show "Your debrief" (Report / Results chips) with a placeholder card. Stage 11 adds "What happens next".
- Stage 13 opens a modal over the page: doctor avatar with a play button, Ready tag, note, Watch video, and "I'll watch later". It opens once each time the MRI reaches that stage, and Watch video reopens it.
- The status block's warning now uses the DEXA pending design colours: background #3a1f0b, tag and dot #f5be8c. Light mode has its own fallback.

5.844 On the phone (and XS), Your progress in the body shows only when the service has a service before or after it: a journey of more than one, the microbiome group or the MRI. A single service, such as pathology or a consult, keeps only the hero's progress card. The rule is in jrM.

5.845 On the MRI's first step, the button opens the MRI safety questionnaire in the document modal. Submitting it moves to step 2, and My documents appears below with the questionnaire, which View reopens read-only.

5.846 The About this service modal no longer repeats the service name: it shows only the description, under the "About this service" heading. Its padding is 24px on the left and right.

5.847 Phone service page:
- The hero has 32px more above the h1.
- Once the hero title has half gone under the top bar, or under the sheet, it fades into the bar between back and more. It is one line, with an ellipsis (#phone2.svcTitled .svmNavT).

5.848 Two MRI steps, "With the radiologist" and "Your doctor is reviewing", now show the sub step timeline above the status block, under "Whole Body MRI & CT Report". It is the same stepper as the microbiome kit, with four sub steps: Scan done, Radiologist report, Doctor review, and Report and video ready. The step in hand is blue, in the waiting colour. On the phone, only that step is named, with its timing.

5.849 The status block now uses one layout through the whole journey (desktop):
- The text always starts 24px from the top and left.
- The buttons sit in a fixed 232px column at the right, centred on the text, so the text wraps at the same width on every step.
- Every button is 44px high; the outlined secondary was 40px.
- The long secondary label "Can't find a time? We'll book it for you" is now "Book it for me", to fit the column.
- On the phone it was already consistent: 24px padding, 20px from text to buttons, 10px between stacked buttons.

5.850 The Your progress timeline card has 24px padding left and right (was 20px).

5.851 A status with two actions puts them below the text, side by side: the secondary on the left, the main one on the right. On the phone they stack full width. This matches the other services. The long label "Can't find a time? We'll book it for you" is back. A single outlined action stays at the right.

5.852 Secondary text on the service page and its modals is now white at 56% opacity instead of solid greys (#8b8b86, #b5b3ae, #a8a8a3, #7d7c78), 44 declarations in all ("always use opacity vs solid grey colour"). Light mode keeps its own colours.

5.853 The desktop service header (picture, title group, more button) is centred vertically.

5.854 The phone service page's body ends 40px under its last section. It was the dock's height plus 40px, but this screen has no dock.

5.855 On the phone, the hero's Your progress card opened a sheet listing the demo's raw stages: 15 for the MRI. The sheet now shows the same timeline as the desktop's right panel (jrX(false)):
- the MRI and the microbiome: their services;
- DEXA: its steps, then Up next.
It sits right under the sheet's title.

5.856 New tweak, Sub steps placement (stKitPl):
- **Header** (default): the timeline sits above the status card, as before.
- **Mini right**: on desktop, the timeline moves inside the status card, in its right column (232px, the same width as the button column), as on the phone: nodes only, then the step in hand and its timing under them. A button, if any, sits under it.
The phone and XS are unchanged. It applies to the microbiome kit and the MRI's radiologist and doctor review steps.

5.857 XS service page (the desk's phone view):
- The hero's title is now 88px under the bar, as on the phone (was 56). The padding is set inline by fit(), so the change is there, not in CSS.
- On scroll, the title fades into the bar between back and more, with an ellipsis (#dSvc.svTitled .svTop .svmNavT). It uses the same rule as the phone: the hero title half under the bar, or under the sheet.

5.858 Phone and XS service page:
- The hero's progress card no longer names the step under its bars.
- The hero is sticky again, with its progress card in it. The body is a rounded card that slides up over it: 28px corners, 28px overlap, and a soft shadow. The hero's title, date and progress card drift up and fade as one, so the card no longer floats apart from the title.
- In XS the body sat 2px below the hero: the hero was relative, with the inline top of -24px meant for sticky, so its corners never showed.

5.859 Phone and XS: when the next service in the journey is locked, an "Up next" card with its name sits tucked under the hero's progress card. The two are stacked, the progress card opaque on top (.svmHzStack, .svmHzNext). The grey ground under the hero measures the whole stack. The MRI and microbiome heroes, which already show their group, are unchanged.

5.860 The MRI report's sub step timeline has two steps, Radiologist report and Doctor review ("only need 2 sub steps"). On the radiologist stage the first is in hand; on the doctor review stage the first is done and the second in hand.

5.861 MRI debrief ready (stage 13):
- The last service, Post-Scan Debrief, is green, as reached (MK 'conf'), in the panel and on the phone's bars.
- The next arrow is disabled there: the journey ends at the debrief.
- The Not going ahead screen (stage 14) is an exception, no longer reachable with the arrows. It opens with `_svc.openDesk('wbmri', 'active', { at: 14 })`.

5.862 Phone and XS: with the progress card in the hero, the hero scrolls with the page again, not pinned. Pinned, its title and card drifted at a quarter of the scroll and the card seemed to float ("your progress card floating weird").
- The title, card and body now move exactly with the finger.
- The body stays a rounded card over the hero's foot: 28px overlap, its corners showing in XS too, since top:auto clears the inline -24px meant for sticky.
- Only the picture is in parallax, lagging behind at 40%.

5.862b On a locked service's page, Your progress puts the service(s) it waits on under a "Complete first" title, as Up next does for the locked ones (Diagnostics Review: Complete first, DEXA Scan; Up next, Diagnostics Review, Member Check-In).

5.862c The service page's section titles on the phone and XS (Referrals, My documents and the others) are 20px, as the report's on the phone (Medical records, .mMedsHead h3). The desk keeps 18px, as the report there.

5.863 The top bar's Service select now has two groups:
- **Without dependency:** Microbiome test, Whole Body MRI, Pathology test.
- **With dependencies:** DEXA scan, Diagnostics Review, Member Check-In.
The two after the DEXA are new picks. They open locked, waiting on the DEXA, under Complete first.

5.864 Status block on the desk: its single button hugs its label again, no fixed 232px column ("CTA hug content"). The text still starts at the top left, 24px in.

5.865 Your progress: every card but the page's own shows a chevron. The View buttons on the service in hand and the blocker are gone ("keep consistent: replace the View CTA by a chevron"). The whole card still opens that service.

5.866 A locked service's page shows only its status card, then About this service (the service's about text). No appointment, instructions, documents or tabs.

5.867 The desk header's more button sits at the top right; the picture and title group stay centred ("CTA right on top").

5.868 Active step in the progress lists (the service's steps, and the group's services): title medium 16px #fff, its line regular 14px #fff. Light mode uses the dark ink.

5.869 2px between the step bars, was 4px ("reduce bar gap by 2px").

5.870 Closed sheets and modals are now hidden outright (visibility, after their slide-out of .34s), not only pushed below their host. When the host ended inside the device frame, an empty document sheet showed at the foot of the phone page ("fix that on mobile").

5.871 New tweak, Body style (phone and XS, stBodySty):
- **Card** (default): the rounded body over the hero.
- **No card**: no sheet. The hero and the body share one ground that eases from the hero's grey (#1c1c1c) to #0f0f0f as the hero scrolls away (a smoothstep, as the Insights page's header). The hero has 16px under it. The top bar's ground follows the same colour (--svG, --stkRGB).

5.872 Every step item in the progress lists (a service's steps, a group's services): title medium 14px, its line regular 12px. The one in hand stays white.

5.873 Body style No card: the hero's title is centred at 256px wide at most, the start date centred under it, and 24px between the title group and the progress card.

5.874 Every card on the service page and in its sheets has the Timeline step card's 12px corners: the status card, the sub steps card, the progress lists, the journey cards, the hero's progress and Up next cards, the referrals and debrief cards, and the debrief placeholder.

5.875 24px inside the status card in every layout, and inside the step cards: the group's list and the service's own steps card.

5.876 On the phone and XS, the status card's button sits 16px further below the text (36px in all). The completed status keeps its View report button, since the request for space above it followed the request to remove it.

5.877 The XS breakpoint is 393px wide, the reference phone (was 402): the forced frame and --bpW.

5.878 The phone's Your progress card has 24px padding (was 18px), and the Up next card under it 24px on the sides and bottom.

5.879 The step in hand always takes the status block's colour: Pending action orange, In progress blue, Confirmed/Completed green, info grey (tc(), from x.tone). It applies to the phone hero's bars, the desk's step list and the microbiome group's own row. It no longer guesses from the step's name (PASV).

5.880 Cards are 32px round (was 12): every card on the service page and in its sheets, the body card's top, and the Timeline's step card with them.

5.881 Body style No card:
- 24px less above the title (phone 128px under the bar, XS 64px from fit()), 40px under the title group (was 24), and nothing under the progress card (was 16).
- The screen sits on #0f0f0f throughout. The hero's grey ground and its gradient run into the same #0f0f0f, no longer a grey that darkens on scroll.
- Switching the tweak repaints the page (_svc.repaint), so XS's hero resets its top.

5.882 Cards are 24px round (32 -> 24, "card radius 24px"): the service page's cards, its sheets, the body card's top and the Timeline's step card.

5.883 The desk's Your progress card (the right panel's service card with its steps, and the group's list) has 20px padding. The phone keeps 24px.

5.884 The phone hero's Up next card:
- It takes the locked cards' stripes (with the Locked pattern tweak) and a lock before the service's name.
- 4px less at its top and bottom (44/20).
- Its ground is #fff at 2%.

5.885 XS service page: no 92px kept at the foot for a dock this page doesn't have. The body ends 40px under its last section ("remove this useless space at the bottom of mobile view").

5.886 The phone's progress sheet (from the hero's Your progress card) opens almost full height: 64px clear at the top. It shows the desk's panel exactly: built with PH off, so the service's own card carries its steps, then Up next. The list starts right under the sheet's title.

5.887 The Up next card under the phone's progress card: its words at #fff 32% (was 56%), 14px and all regular, and 4px less at its top and bottom (40/16).

5.888 The phone hero's Your progress card has 4px less at its top (20px) and a #fff 4% background (was 7%). When stacked over the Up next card it stays opaque: 4% white over the ground under it (#1c1c1b, or #0f0f0f with No card).

5.889 Sheets' blanket (.tlShDim) at #000 72% (was 55%).

5.890 The phone's progress sheet pads its cards as the desk's right column does (20px). The desk's right column cards and the sheet's are 20px round; the rest of the page's cards stay 24px.

5.891 The phone's progress sheet keeps the desk panel's heading, Your progress with the step count and the demo's previous / next arrows ("arrows on mobile too"). A step from there repaints the page, and the sheet refills behind it (sh._fill).

5.892 The phone hero's Up next card: background #fff 4% (was 2%).

5.893 The progress panel's cards, on the desk's right column and in the phone's sheet: 16px inside, 20px round. That covers the service's own card with its steps, the other services' cards and the group's list. The dashed outline drawn on the other cards follows the 20px corner (rx 14 -> 20).

5.894 The service page's own scroll stops at its foot (overscroll-behavior: contain). In XS, the Overview under it no longer scrolls on with it: the .dash is locked while a service is open, and reset to the top on opening ("fix this unnecessary scroll").

5.895 6px between the progress bars (was 4px).

5.896 The phone and XS hero title is 26px (was 22px).

5.897 Under the title, a service that has begun always shows when it started: its own start date, else "Started on 20 February 2026". It no longer shows its state's line (Requested 11 days ago, a booking date, Report expected...). A service not begun (locked, later, suggested, to buy, to claim) keeps its own line.

5.898 Body style No card: the centred title is 304px wide at most (was 256px).

5.899 The Version menu's Service detail has Desktop only. Mobile is gone, since XS on the desktop view is the phone. The menu is only marked with a page it lists.

5.900 New tweak, Footer Up next (stUpNext, a switch, off by default): the Up next footer under the phone's progress card, when the next service waits on this one.

5.901 The phone and XS hero's progress card carries the demo's previous / next arrows at its top right, beside the count (.svmHzWrap). They sit on a layer of their own, so a tap steps the demo and doesn't open the sheet; the card itself still opens it.

5.902 Bug: with an info status (a step not the member's to act on, e.g. Get your results), the step in hand took the class "inf". The page already uses that for its info buttons, which are inline-block, so the step collapsed to a narrow column. The class is now svTinf.

5.903 No blue: waiting / In progress is neutral #b8b8b8 (was #bccfea). That covers the status tag and dot, the step bars, the group's bar, the kit's nodes and ripple, and the phone's progress bars. Light mode's #5560b8 is a warm grey.

5.904 Sub step timeline: when the step in hand is waiting (neutral), the line on to the next step shows a loading light running left to right (kitLoad, 1.6s; still with reduced motion). The gradient is set as background-image, not the shorthand: an !important shorthand pins background-position, and the animation can't move it.

5.905 Phone and XS: the step in hand is named as a heading above the status card and its sub steps (.svStepT). It takes the main step for a kit or a report, the service for the MRI's group, the document in hand, or else the service's step. It moves out of the sub steps card, which on the phone no longer repeats it. There's no heading on a locked, later, suggested, to buy, to claim or done page.

5.906 Phone and XS: the sub steps card comes after the status card, tucked under it as a footer, under the step's title ("sub steps below the status card"). The desk keeps them above as the card's header (or mini at its right, with the tweak).

5.907 Sub step timeline: circles 10px (was 14px), the step in hand a 2px ring around a 4px dot. No tick on the steps done. The lines between them follow: centred on 5px, 8px clear of each circle.

5.908 Phone and XS sub steps: the step in hand is centred under the nodes, with the next step under it ("Next: Kit on its way", "Next: Doctor review"). The last one keeps its timing. Desktop's Mini right shows the same.

5.909 The step title over the status card shows only when there are sub steps. A page with none, such as the DEXA's Scan Consent, has none ("remove this title").

5.910 The services list (.svGrpL): 4px between the bars (was 18px), each item's words 4px above and below, centred on their bar.

5.911 Every timeline step card has the same metrics, the service's own steps (.svStep) as the services list ("exact same style, padding, behaviour"):
- a 4px bar the item's full height;
- 4px between items;
- the words 4px above and below and 20px from the bar's edge;
- the line 3px under a 14/1.35 title, 12/1.4.
Measured: each item 47px tall, on a 51px pitch, in both.

5.912 With sub steps, the status card has a header strip across its top, edge to edge: #fff 12%, the main step's name (.svPendHd). It replaces the name inside the desk's sub steps card and the phone's title over the card. It works with Mini right too.

5.913 The MRI's and the microbiome's progress lists are drawn as the DEXA's card (asCard): the service's name with its dot, then its services as steps in the same .svStep style. The tones map act -> on, wait -> on pas, conf -> on okc, closed -> grey, and later steps are struck through when closed. The old .svGrpL list is no longer used by them.

5.914 The MRI's debrief, once ready, is the DEXA's report card: Dr Sarah Chen's avatar and date, the line, Watch video, and the picture. Watch video opens the debrief modal.

5.915 Timeline step items: the words have 8px above and below (was 4px), and the line sits 1px under the title (was 3px).

5.916 A waiting (neutral) step always shows it's moving. In the step lists (desk, sheet), a light runs down its bar, top to bottom (svLoadV). On the phone and XS hero bars, it runs left to right (svLoadH). Each takes 1.6s, and stops with reduced motion. The kit's sub steps already had it (5.904). The gradient and size are !important so later background shorthands can't wipe them; the position is left free to animate.

5.917 Phone and XS, a status with sub steps sits in one outlined card (.svWrap): 1px #fff 12% border, 32px corners, 8px inset. Inside, from the top: the main step's name (16 medium), the status card inset (24px corners), and the timeline under it with no ground ("like this"). The desk keeps the #fff 12% header strip on the status card.
