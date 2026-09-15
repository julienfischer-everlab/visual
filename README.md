# Everlab — "How it works" stacked scroll

`index.html` — a single file, no build step and no dependencies (one webfont is
the only network request). Open it directly in a browser: on a desktop window
it renders inside a 402 × 853 device frame, on a phone it runs full-bleed.

Published demo: https://claude.ai/artifact/THBBiSmitXuxcQ6QNuw1uY

Four steps — *Create your account*, *Meet your doctor*, *Complete your testing*,
*Act, with follow-ups included* — each a white card with a full-bleed visual,
a numbered eyebrow, a heading, body copy and a bullet list.

## How the scroll works

Each card is `position: sticky` with a **negative** `top` offset equal to
`viewportHeight − cardHeight`:

```css
.panel { position: sticky; top: var(--pin); }   /* --pin ≤ 0 */
```

A sticky box with a negative top scrolls completely normally until its **bottom
edge** reaches the fold — i.e. until its last line of content has been read —
and only then freezes, parked there. The next card sits immediately after it in
normal document flow, so the moment card N parks, card N+1's top edge is at the
bottom edge of the screen and starts sliding up over it, 1:1 with the scroll.
Card N does not move; it stays underneath, scaling down 2% and dimming as it is
covered.

Cards are inset by 20px on every side (`--pad`), with the same 20px as the flow
gap between them — the gap is what lets the incoming card enter from the very
bottom edge of the screen rather than from the parked card's bottom edge.

The cover effect is driven by a second custom property, `--cover` (0 → 1),
written on scroll inside one rAF:

```css
.panel            { transform: scale(calc(1 - .02 * var(--cover,0))); }
.panel > .media,
.panel > .body    { opacity:   calc(1 - .4  * var(--cover,0)); }
```

The fade sits on the card's contents rather than the card, because fading the
card itself would let the parked stack underneath ghost through it. Both are
disabled under `prefers-reduced-motion`.

Scrolling is the native document scroll throughout, so iOS momentum, rubber-band
and scrollbar behaviour are untouched.

### The JS

Two jobs. `measure()` runs at load and on resize / `ResizeObserver` — never on
scroll — and writes each card's park offset:

```js
panel.style.setProperty('--pin', Math.min(pad, vh - pad - panel.offsetHeight) + 'px');
```

That is the only thing that can't be expressed in CSS: the hand-off point
depends on the card's measured height, so it re-derives itself whenever the
copy, the imagery, the font or the viewport changes. Nothing is hard-coded to
`100vh`.

`update()` runs on scroll, coalesced into one `requestAnimationFrame`, and only
writes `--cover`. It reads no layout while scrolling — card positions come from
flow offsets cached by `measure()`, which also keeps the reading immune to the
scale transform (`offsetHeight` ignores transforms, a client rect does not).

### Edge cases

| | |
| --- | --- |
| Card taller than the viewport | Scrolls normally for `height − viewport + pad` px, then parks. |
| Card shorter than the viewport | `min-height` pads it out to the full inset window so it always covers the card beneath; `--pin` clamps at `pad`, and because there is nothing left to read the next card begins its slide immediately. |
| Copy or image height changes | Re-measured automatically; the hand-off moves with it. |

At 402 × 853 every card is taller than the screen, giving read phases of roughly
570–710px before each hand-off.

### Content length

The second half of each step — *What to have handy*, *Before the call*, *How
booking works*, *Between consultations*, and the block after each — is
demo-length copy, written to push every card well past one screen so the
read-then-hand-off phase is visible while testing. It is placeholder, not
approved copy. Replace it with the real thing; the hand-off points follow.

## Imagery

The four visuals are **CSS-drawn placeholders** — a plan card on a wooden
surface, a phone on orange fabric mid-consult, a phone and a glass of water on a
table, and a blurred set of result cards. They match the framing and proportions
of the reference so the scroll timing is accurate.

To drop in real photography, add an `<img>` as the first child of the `.media`
block; it covers the placeholder art with no other changes:

```html
<div class="media m-wood">
  <img class="media__photo" src="…" alt="">
  …
</div>
```

Keep (or adjust) the `--ratio` on each `.m-*` rule to match the real asset's
aspect ratio — the card heights, and therefore the scroll hand-off points,
follow from it.

## Typography

Instrument Sans (Google Fonts), with the platform grotesque as fallback — on
iOS that means SF Pro, so the page still reads correctly offline. The font swap
changes card heights, which the `ResizeObserver` and a `document.fonts.ready`
hook re-measure, so the hand-off points survive it.

## The device frame

One media query, not a second code path. `.screen` has `overflow: visible` by
default, so on a phone the cards stick against the document scrollport and the
page runs edge to edge with native momentum. On a window at least 760 × 920 it
becomes the scroll container at a fixed 402 × 853 and the same markup renders as
a device. The script asks which box it is measuring:

```js
getComputedStyle(screen).overflowY === 'visible' ? innerHeight : screen.clientHeight
```

The surface around the device follows the viewer's light/dark theme. The screen
itself stays light in both — it is a light UI by design, not a page to invert.

## Scope

Mobile only for now. The desktop frame is a test harness, not a desktop
treatment; between 640px and the frame's threshold the column is simply centred
at its 402px max-width.
