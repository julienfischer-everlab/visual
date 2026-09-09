# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. Two folds, one
continuous page: a personal message resolving into focus on a white screen,
then the room fades to dark and the gift card rises into it from the bottom.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-08, "Button in the right column, even padding" |
| Captured on | 2026-09-08 |
| Sharing at capture | Private |
| Size | 280 KB, single file (the photograph is embedded) |

Earlier versions (a ribbon-tied card; a warm two-scene reveal with headings
and a biological-age dial) are in the artifact's version history and in this
repo's git history.

## The experience

**Fold 1.** A warm off-white viewport with nothing on it but the sender's
message, set large in a sans (Suisse Intl where installed, otherwise Geist),
with a plain mono line above it, all caps and widely spaced, a small black
square then "Matt got something special for you". Its letters resolve the same way as the
message, ahead of it, with a lighter ember. Default copy: "Happy 30th, Sam. Go find out how good you
actually are." over three lines. Each line opens as a row just before its letters
start, so the centred block grows from the middle: the first line is pushed up
by the second, both by the third, and the finished block sits centred. Each character starts blurred, faintly
transparent and 3px low, and eases up and sharpens out of the blur over 1s. Separately, a warm ember fades over three stagger steps (about 200ms), so at any moment the newest letter is warmest and the two before it progressively less: a short gradient trailing the leading edge. The stagger is
derived from the character count so the whole message lands in about 3.3
seconds, eyebrow included. The ember tapers across the last line: the final word carries a fifth of the colour and half the time, so the sentence ends crisp rather than lingering orange. About 350ms after the last character settles, a small black pill,
**See my gift**, rises into place, with a light-orange point of light travelling
round its edge once every two seconds. Half a second after the button, the top of a
circle scales up from nothing at the bottom edge of the screen, like a sun
about to rise: the photograph behind fold 2 at half
size, placed so the couple sits inside the dome. The circle is the photograph
itself (a round element whose background is the image), so no edge of the
image can ever show inside it.

**Transition.** The button, a scroll down (wheel, trackpad, swipe, or the
down-arrow, page-down and space keys) all run the same reveal, once the
message and button are on screen. On click, three things happen in sequence,
all on the same viewport:

| When | What |
| --- | --- |
| 0ms | The whole first-fold block (chip, message, button) scrolls up and out of the viewport (800ms), like the page being pushed |
| 100ms | The circle grows until it covers the viewport and the photograph inside it grows to exactly a full-screen cover, both computed from the viewport and the image so they land together; the viewport behind crossfades to dark at the same time |
| 100ms | At the same moment, the gift card rises from below the bottom edge into the centre over 1s on `cubic-bezier(.9,0,.22,1)`, a long slow start that then commits fast |
| 1100ms | Settled; the footer line and a small arrow at the top fade in |

Nothing slides or cuts; the room changes around the reader and then the card
arrives. The arrow at the top of fold 2, or a firm scroll up from the top of the fold,
runs the same sequence in reverse:
the card sinks back below the edge, the circle closes back to a half circle at
the bottom and the room crossfades back to white together (about 750ms), and
the block settles back down into place from 400ms, done at about 1.15s.

**Fold 2.** The photograph fills the screen, darkened so type reads over it.
The gift card lands in the centre: one large-radius dark glass panel with a
strong blur, the photo showing through, no border and no shadow. Its left
column holds the mono "A gift from Matt" line, the product name and a short
description at the top; at the bottom, "What's included" as two rows of three,
each inclusion under a small line icon (speech bubble, drop, scan, pulse,
leaf, cycle), no bullets. Its right column, behind a hairline divider, is
"What's next": a vertical timeline of four squares joined by hairlines,
Unwrap (the current step, filled in Everlab red), Claim your gift, Meet your
doctor, Get tested, with **Claim my gift** centred at the foot of the column at
70% of its width. Padding is an even 48px all round, the divider is a faint
hairline, and the card corners are 44px.

Motion is limited to transform, opacity and blur. Nothing bounces.
`prefers-reduced-motion` shows the message immediately and crossfades the
folds.

## Logo and chrome

The Everlab wordmark (`Logo mark+type.svg`, inlined with its fills set to
`currentColor`) sits fixed at the top centre, 25px tall and 44px from the top: ink on the white fold, fading to
white as the room darkens. The back arrow sits top right. On phones the
version switcher moves to the bottom-left corner so it never overlaps the
logo.

## Version switcher

A small fixed pill at the top left, mono caps, holds a select with the two
versions of the page: 01 Cinematic reveal (this one) and 02 Sections
(`../evlab-gift-sections`). Choosing the other opens it in a new tab, or
navigates when the host allows.

## The photograph

The photograph behind fold 2 is
`couple-sharing-a-photo-album-in-a-cozy-wood-toned-living-room-large.png`,
kept in this folder as uploaded (1920×1446 PNG, 4 MB). The page embeds a
1600px JPEG re-encoding of it (about 190 KB) as a `data:` URI in the `PHOTO`
constant, which is the only way an image can load on the artifact host. When
Everlab hosts the page, `?image=https://...` on the link can point at a hosted
copy instead and the embedded one is ignored.

Two further photographs were uploaded alongside it and are kept here as
alternatives: `woman-reading-on-curved-velvet-sofa-in-warm-minimalist-interior-large.png`
and `woman-reading-on-curved-bouclé-sofa-in-warm-minimalist-interior-large.png`.
Neither is used by the page.

## Structure

Plain HTML, CSS and JavaScript, no build step. The script is organised as
small components with one piece of state on the
`<body>`:

| Component | Role |
| --- | --- |
| `AnimatedQuote` | Splits the message into unbreakable words and per-character spans, assigns each its delay |
| `GiftIntro` | Fold 1: the message and the button, and when the button appears |
| `GiftCard` | The gift itself: product, description, value, the sender's note, the button, inclusions, next steps, and the photo behind the fold |
| `App` | Owns the state (`intro → revealing → gift → returning → intro`) and the timing of both directions |

## Feeding it from the email

The gift link can carry everything on the query string. Every parameter is
optional and falls back to the example gift baked into the page.

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The message on the first fold (`%0A` for a deliberate line break; three lines read best) |
| `note` | The sender's short note (kept in the data, not shown for now) |
| `product` | Product name |
| `blurb` | The description of the membership inside the card |
| `value` | Total value (kept in the data, not shown for now) |
| `includes` | What's included, pipe-separated (`a\|b\|c`); six short items fit the two-by-three grid |
| `claim` | Activation URL for the button (http or https only) |
| `image` | The photograph behind fold 2 (http or https only) |

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
