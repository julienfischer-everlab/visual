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
