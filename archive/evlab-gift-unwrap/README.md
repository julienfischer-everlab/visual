# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. Two folds, one
continuous page: a personal message resolving into focus on a white screen,
then a dark fold that rises from the bottom and pushes the first one out
through the top, carrying nothing but the gift card.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-08, "Dark fold, sans, card only" |
| Captured on | 2026-09-08 |
| Sharing at capture | Private |
| Size | 18 KB, single file |

Earlier versions (a ribbon-tied card; a warm two-scene reveal with headings
and a biological-age dial) are in the artifact's version history and in this
repo's git history.

## The experience

**Fold 1.** A warm off-white viewport with nothing on it but the sender's
message, set large in a sans (Suisse Intl where installed, otherwise Geist)
and centred exactly. Default copy: "Happy 30th, Sam. Go find out how good you
actually are." over three lines. Each character starts blurred, faintly
transparent and 3px low, and sharpens into place over 900ms. The stagger is
derived from the character count so the whole message lands in about three
seconds. About 450ms after the last character settles, a small black pill,
**See my gift**, rises into place.

**Transition.** On click the dark second fold rises from the bottom of the
screen and pushes the first fold out through the top, both moving together
over 1.25s on `cubic-bezier(.58,.02,.18,1)`: a gentle start and a long settle,
no snap. The page switches to dark for the rest of the visit.

**Fold 2.** Near-black with a faint warm glow, and one object in the middle: the
gift card. It rides in on the sheet and settles a hair after it lands. Its
left column holds "A gift from Sarah", the value, the product, what's
included, the sender's note and **Activate my gift**. Its right column is a
photograph.

Motion is limited to transform, opacity and blur. Nothing bounces.
`prefers-reduced-motion` shows the message immediately and crossfades the
folds.

## The photograph

The card's right column is a photo slot. The photo supplied for it (a hand
holding a phone showing Everlab health insights, a glass of water, warm light
on an oak table) was not available as a file when this version was captured,
so a warm low-light gradient stands in. To ship it:

- **Inside the page** (the only way it can load on the artifact host): set the
  `PHOTO` constant at the top of the script to a `data:` URI of the image.
- **Hosted**: pass `?image=https://...` on the link when Everlab hosts the page.

## Structure

Plain HTML, CSS and JavaScript, no build step. The script is organised as
small components with one piece of state (`intro → revealing → gift`) on the
`<body>`:

| Component | Role |
| --- | --- |
| `AnimatedQuote` | Splits the message into unbreakable words and per-character spans, assigns each its delay |
| `GiftIntro` | Fold 1: the message and the button, and when the button appears |
| `GiftCard` | The gift itself: product, term, value, inclusions, the sender's note, the activation button, the photo |
| `App` | Owns the state and the timing of the transition |

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
| `includes` | What's included, pipe-separated (`a\|b\|c`) |
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
the settled message, a frame mid-transition with the dark fold pushing the
white one up, and the finished card. Google Fonts were not reachable from the
render sandbox, so the screenshots used the fallback stack; the published
page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
