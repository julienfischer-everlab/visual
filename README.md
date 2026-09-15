# Everlab — "How it works" stacked scroll

`index.html` — a single self-contained file (no build step, no dependencies, no
network calls). Open it directly in a browser, ideally in device emulation at
**402 × 853**.

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
edge** reaches the bottom of the viewport — i.e. until its last line of content
has been read — and only then freezes, parked against the fold. The next card
sits immediately after it in normal document flow, so the moment card N parks,
card N+1's top edge is exactly at the bottom of the viewport and starts sliding
up over it, 1:1 with the scroll. Card N is never moved, faded or removed; it
just stays underneath.

Scrolling is the native document scroll throughout, so iOS momentum, rubber-band
and scrollbar behaviour are untouched.

### The JS

One function, run at load and on resize / `ResizeObserver`, never on scroll:

```js
panel.style.setProperty('--pin', Math.min(0, innerHeight - height) + 'px');
```

That is the only thing that can't be expressed in CSS — the hand-off point
depends on the card's measured height, so it re-derives itself whenever the
copy, the imagery, the font or the viewport changes. Nothing is hard-coded to
`100vh`.

### Edge cases

| | |
| --- | --- |
| Card taller than the viewport | Scrolls normally for `height − viewport` px, then parks. |
| Card shorter than the viewport | `min-height: 100vh` pads it out so it always covers the card beneath; `--pin` clamps at `0`, and because there is nothing left to read the next card begins its slide immediately. |
| Copy or image height changes | Re-measured automatically; the hand-off moves with it. |

At 402 × 853, cards 2 and 3 are taller than the viewport (read phase, then
park); cards 1 and 4 fit within it (park immediately).

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

## Scope

Mobile only for now. Above 640px the column is simply centred at its 402px
max-width; there is no tablet or desktop treatment yet.
