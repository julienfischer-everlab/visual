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
