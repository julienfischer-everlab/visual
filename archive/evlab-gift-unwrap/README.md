# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. Two folds, one
continuous page: a personal message resolving into focus on a white screen,
then the room fades to dark and the gift card rises into it from the bottom.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-08, "Faster fold" |
| Captured on | 2026-09-08 |
| Sharing at capture | Private |
| Size | 18 KB, single file |

Earlier versions (a ribbon-tied card; a warm two-scene reveal with headings
and a biological-age dial) are in the artifact's version history and in this
repo's git history.

## The experience

**Fold 1.** A warm off-white viewport with nothing on it but the sender's
message, set large in a sans (Suisse Intl where installed, otherwise Geist),
with a plain mono line above it, all caps and widely spaced, a small black
square then "Matt, I sent you something". Default copy: "Happy 30th, Sam. Go find out how good you
actually are." over three lines. Each character starts blurred, faintly
transparent and 3px low, and comes up quickly and then sharpens out of the blur over 1.6s. Separately, a warm ember fades over three stagger steps (about 200ms), so at any moment the newest letter is warmest and the two before it progressively less: a short gradient trailing the leading edge. The stagger is
derived from the character count so the whole message lands in about four
seconds. The ember tapers across the last line: the final word carries a fifth of the colour and half the time, so the sentence ends crisp rather than lingering orange. About 450ms after the last character settles, a small black pill,
**See my gift**, rises into place.

**Transition.** On click, three things happen in sequence, all on the same
viewport:

| When | What |
| --- | --- |
| 0ms | The whole first-fold block (chip, message, button) scrolls up and out of the viewport (800ms), like the page being pushed |
| 100ms | The viewport crossfades from warm white to near-black over 700ms, and a faint warm glow comes up with it |
| 100ms | At the same moment, the gift card rises from below the bottom edge into the centre over 1s on `cubic-bezier(.9,0,.22,1)`, a long slow start that then commits fast |
| 1100ms | Settled; the footer line and a small arrow at the top fade in |

Nothing slides or cuts; the room changes around the reader and then the card
arrives. The arrow at the top of fold 2 runs the same sequence in reverse:
the card sinks back below the edge and the room crossfades back to white
together (about 750ms), and the block settles back down into place from
400ms, done at about 1.15s.

**Fold 2.** Near-black with a faint warm glow, and one object in the middle: the
gift card, with no border and no shadow, just a slightly lighter fill. Its
left column holds the same mono "A gift from Matt" line as fold 1, the value, the
product, a monospace "What's included" label over six rows with small square
markers in Everlab red and hairline rules, each on one line on desktop, and
**Claim my gift**. Its right column is the photograph, with the sender's note
overlaid on its lower edge in a dark glass panel.

Motion is limited to transform, opacity and blur. Nothing bounces.
`prefers-reduced-motion` shows the message immediately and crossfades the
folds.

## The photograph

The card's right column is a photo slot. The photo supplied for it (a hand
holding a phone showing Everlab health insights, a glass of water, warm light
on an oak table) was not available as a file when this version was captured.
Until it is, the column carries a composed stand-in of the same scene built
from CSS and a little SVG: oak grain in low warm light, and a tilted phone
showing the Everlab "Health insights" screen with a heart age of 44 and a
steps tile. To ship the real photo:

- **Inside the page** (the only way it can load on the artifact host): set the
  `PHOTO` constant at the top of the script to a `data:` URI of the image.
- **Hosted**: pass `?image=https://...` on the link when Everlab hosts the page.

## Structure

Plain HTML, CSS and JavaScript, no build step. The script is organised as
small components with one piece of state on the
`<body>`:

| Component | Role |
| --- | --- |
| `AnimatedQuote` | Splits the message into unbreakable words and per-character spans, assigns each its delay |
| `GiftIntro` | Fold 1: the message and the button, and when the button appears |
| `GiftCard` | The gift itself: product, term, value, inclusions, the sender's note, the activation button, the photo |
| `App` | Owns the state (`intro → revealing → gift → returning → intro`) and the timing of both directions |

## Feeding it from the email

The gift link can carry everything on the query string. Every parameter is
optional and falls back to the example gift baked into the page.

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The message on the first fold (`%0A` for a deliberate line break; three lines read best) |
| `note` | The sender's short note shown inside the gift card |
| `product` | Product name |
| `term` | One line under the product name |
| `value` | Gift value label, as text |
| `includes` | What's included, pipe-separated (`a\|b\|c`); one line each on desktop, so keep items short |
| `claim` | Activation URL for the button (http or https only) |
| `image` | Photo for the card's right column (http or https only) |

All text is inserted as plain text, never as HTML.

## Design notes

- Every typeface on the page is a sans. No serif anywhere.
- The palette is deliberately two worlds rather than a theme toggle: fold 1 is
  painted white, fold 2 near-black, and neither follows the viewer's dark
  mode.
- Everlab red `#C4655B` appears only on the list markers.
- The card copy and value are placeholders to be replaced with the real
  product composition.

## Verification

Rendered headlessly at capture time on desktop (1440×900) and phone (390×844):
the settled message, a frame with the block lifting as the room darkens, the
finished card, a frame mid-way back, and the restored first fold. Google Fonts were not reachable from the
render sandbox, so the screenshots used the fallback stack; the published
page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
