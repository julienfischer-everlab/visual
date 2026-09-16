# Everlab — "How it works" stacked scroll

`index.html` — a single file, no build step and no dependencies (one webfont is
the only network request). Open it directly in a browser: on a desktop window
it renders inside a 402 × 853 device frame, on a phone it runs full-bleed.

Published demo: https://claude.ai/artifact/THBBiSmitXuxcQ6QNuw1uY

Four steps — *Get started*, *Consult*, *Test*, *Act* — each a white card with a
step header, a full-width image, a heading, body copy and a bullet list.

## The two states

**Open.** A step reads as one card: its header, then the image, then the
heading and copy.

**Closed.** Once you scroll past a step it collapses to just its header, and
those headers pile up as slim bars at the top of the screen, so all four steps
stay in view as a stack.

Both come out of one scroll, with no state to toggle.

## How the scroll works

Each card is `position: sticky` with a **negative** `top` offset equal to
`viewportHeight − inset − cardHeight`:

```css
.panel { position: sticky; top: var(--pin); }   /* --pin ≤ header slot */
```

A sticky box with a negative top scrolls completely normally until its **bottom
edge** reaches the fold — i.e. until its last line of content has been read —
and only then freezes. The next step follows in normal document flow, so the
moment card N parks, the next step's header is at the bottom edge of the screen
and slides up over it, 1:1 with the scroll.

Cards are inset by 20px on every side (`--pad`), and the same 20px separates
one step from the next, which is what lets the incoming step enter from the
very bottom edge of the screen rather than from the parked card's edge.

## The header stack

Each step's header is a **sibling** of its card, not a child, and is sticky at
its own slot — slot N being the total height of the headers before it:

```css
.head { position: sticky; top: var(--slot); z-index: calc(10 + var(--i)); }
```

Three things make it work, each of which fails in an obvious way if you skip
it:

- **Sibling, not child.** A sticky box is bounded by its containing block, so a
  header nested inside its own card unpins and scrolls away the moment that
  card's flow position passes the slot. As a sibling of the card its containing
  block is the whole stack, so it stays parked to the end.
- **Headers above every card in the z-order** (`10 + i` against the cards'
  `i`). A card sliding up passes *behind* the bars already parked, which is
  what leaves the collapsed stack visible. The bars are opaque and flush, so
  nothing shows between them.
- **Header immediately above its own card in flow.** It therefore reaches its
  slot at the exact moment its card arrives underneath it — the two never
  separate, and no gap opens between a parked bar and the card it belongs to.

## The cover effect

`--cover` (0 → 1) is written on scroll inside one rAF and says how far the next
step has covered this card — 0 as its header enters at the bottom edge, 1 as
that header reaches its slot:

```css
.panel     { transform: scale(calc(1 - .02 * var(--cover,0))); }
.panel > * { opacity:   calc(1 - .4  * var(--cover,0)); }
```

The scale origin is the bottom edge, so a card's parked edge stays where it
was. The fade sits on the card's contents rather than the card, because fading
the card itself would let the stack underneath ghost through it. Both are
disabled under `prefers-reduced-motion`.

Scrolling is the native document scroll throughout, so iOS momentum,
rubber-band and scrollbar behaviour are untouched.

## The JS

Two functions. `measure()` runs at load and on resize / `ResizeObserver` —
never on scroll — and writes `--slot` per header, `--hh` (the header height,
which sets how much screen a card must fill) and `--pin` per card:

```js
panel.style.setProperty('--pin', Math.min(slot + hh, vh - pad - h) + 'px');
```

That is the thing that can't be expressed in CSS: the hand-off point depends on
the card's measured height, so it re-derives itself whenever the copy, the
imagery, the font or the viewport changes. Nothing is hard-coded to `100vh`.

`update()` runs on scroll, coalesced into one `requestAnimationFrame`, and
writes only `--cover`. It reads no layout while scrolling: positions come from
flow offsets cached by `measure()`, taken with `offsetHeight`, which ignores
the scale transform — a client rect does not, so measuring a scaled card that
way would compute a wrong park offset.

### Edge cases

| | |
| --- | --- |
| Card taller than the screen | Scrolls normally for `height − screen + inset` px, then parks; its content scrolls up behind the header stack. |
| Card shorter than the screen | `min-height` pads it to the inset window minus the header, so it always covers the card beneath; `--pin` clamps at the underside of its own header. |
| Copy or image height changes | Re-measured automatically; the hand-off moves with it. |

At 402 × 853 every card is taller than the screen, giving read phases of
roughly 500–670px before each hand-off.

### Content length

The blocks after each step's first list — *What to have handy*, *Before the
call*, *How booking works*, *Between consultations*, and the ones after them —
are demo-length copy, written to push every card past one screen so the
read-then-hand-off phase is visible while testing. They are placeholder, not
approved copy. Delete them and the hand-off points follow; the cards then fit
within the screen and each step hands off as soon as it arrives.

## Typography

Instrument Sans (Google Fonts), with the platform grotesque as fallback — on
iOS that means SF Pro, so the page still reads correctly offline. The font swap
changes card heights, which the `ResizeObserver` and a `document.fonts.ready`
hook re-measure, so the hand-off points survive it.

## Imagery

The four visuals are **CSS-drawn placeholders** — a plan card on a wooden
board, a phone on orange fabric mid-consult, a phone held over a table beside a
glass of water, and result cards over a warm gradient. They match the framing
and proportions of the reference so the scroll timing is accurate.

To drop in real photography, add an `<img>` as the first child of the `.media`
block; it covers the placeholder art with no other changes:

```html
<div class="media m-wood">
  <img class="media__photo" src="…" alt="">
  …
</div>
```

Keep (or adjust) `--ratio` to match the real asset's aspect ratio — the card
heights, and therefore the scroll hand-off points, follow from it.

## The device frame

One media query, not a second code path. `.screen` has `overflow: visible` by
default, so on a phone the steps stick against the document scrollport and the
page runs edge to edge with native momentum. On a window at least 760 × 920 it
becomes the scroll container at a fixed 402 × 853 and the same markup renders
as a device. The script asks which box it is measuring:

```js
getComputedStyle(screen).overflowY === 'visible' ? innerHeight : screen.clientHeight
```

The surface around the device follows the viewer's light/dark theme. The screen
itself stays light in both — it is a light UI by design, not a page to invert.

## Scope

Mobile only for now. The desktop frame is a test harness, not a desktop
treatment; between 640px and the frame's threshold the column is simply centred
at its 402px max-width.
