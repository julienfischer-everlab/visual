# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. Two folds, one
continuous page: a personal message resolving into focus on a white screen,
then the room fades to dark and the gift card rises into it from the bottom.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-09, "One page, version + theme tweaks" |
| Captured on | 2026-09-09 |
| Sharing at capture | Private |
| Size | 547 KB, single file (both photographs, the logo and the ellipse are embedded) |

Since this version the three gift pages are one file. The same page is
published at all three artifact URLs; each opens on its own version
(`DEFAULT_VARIANT` in the script) and the **Version** select in the top bar
switches between them in place, without leaving the page. The copies in
`../evlab-gift-sections` and `../evlab-gift-split` differ from this one only
in that constant and the `<title>`.

Earlier versions (a ribbon-tied card; a warm two-scene reveal with headings
and a biological-age dial) are in the artifact's version history and in this
repo's git history.

## The experience

**Fold 1.** A warm off-white viewport with nothing on it but the sender's
message, set large in a sans (Suisse Intl where installed, otherwise Geist),
with a plain mono line above it, all caps and widely spaced, a small black
orange square then "Matt got something special for you". Its letters resolve the same way as the
message, ahead of it, with a lighter ember. Default copy: "Happy 30th, Sam. Go find out how good you
actually are." over three lines. Each line opens as a row just before its letters
start, so the centred block grows from the middle: the first line is pushed up
by the second, both by the third, and the finished block sits centred. Each character starts blurred, faintly
transparent and 3px low, and eases up and sharpens out of the blur over 1s. Separately, a warm ember fades over three stagger steps (about 200ms), so at any moment the newest letter is warmest and the two before it progressively less: a short gradient trailing the leading edge. The stagger is
derived from the character count so the whole message lands in about 3.3
seconds, eyebrow included. The ember tapers across the last line: the final word carries a fifth of the colour and half the time, so the sentence ends crisp rather than lingering orange. Just after the last character settles, a small black pill,
**See my gift**, rises into place; its row opens from nothing so the message and
eyebrow are pushed up as it arrives, the way the lines pushed each other (the
button is 17px type on 15×30px padding, about 15% larger than the fold-2
buttons' proportions). At
the same moment the top of a circle
scales up from nothing at the bottom edge of the screen, like a sun about to
rise: the photograph behind fold 2 at half
size, placed so the couple sits inside the dome. The circle is the photograph
itself (a round element whose background is the image), so no edge of the
image can ever show inside it.

**Transition.** The button, a scroll down (wheel, trackpad, swipe, or the
down-arrow, page-down and space keys) all run the same reveal, once the
message and button are on screen. On click, three things happen in sequence,
all on the same viewport:

| When | What |
| --- | --- |
| 0ms | The whole first-fold block (eyebrow, message, button) travels 256px up while fading out and softening into a blur, all together (800ms) |
| 100ms | The circle grows until it covers the viewport and the photograph inside it grows to exactly a full-screen cover, both computed from the viewport and the image so they land together; the viewport behind crossfades to dark at the same time |
| 100ms | At the same moment, the gift card rises from below the bottom edge into the centre over 1s on `cubic-bezier(.9,0,.22,1)`, a long slow start that then commits fast |
| 1100ms | Settled; the footer line and a small arrow at the top fade in |

Nothing slides or cuts; the room changes around the reader and then the card
arrives. The arrow at the top of fold 2, or a firm scroll up from the top of the fold,
runs the same sequence in reverse:
the card sinks back below the edge, the circle closes back to a half circle at
the bottom and the room crossfades back to white together (about 750ms), and
the block settles back down into focus from 400ms, done at about 1.15s.

**Fold 2.** The photograph fills the screen, darkened so type reads over it.
The fold does not scroll on desktop: the card lands centred in the stage,
the logo is pinned to the top edge and the footer line ("Page secured by
Everlab", text only, centred on the same axis as the logo) to the bottom, and
on short screens the card tightens its padding and tiles so it always fits.
On phones the fold scrolls. The gift card: one large-radius grey glass panel
at about half opacity (`rgba(40,38,36,.47)`) over a strong blur, so the room
shows through it, no border and no shadow. Its left column
holds the mono "Gift received from Matt" line (orange square), the product
name "Everlab Protocol" and a short description at the top; at the bottom, a
mono "What's included" label above a faint rounded card (a 3.5% white tint,
14px of padding top and bottom) of six rows,
each with a small line icon (speech bubble, drop, scan, pulse, leaf, cycle),
a visible hairline divider between rows, 11px of padding above and below each
row, the full titles. Its right column, behind a hairline divider, opens
with a membership passport card: the `Ellipse 4358.png` copper texture under
a fine dot grid, the Everlab mark top left, a MEMBER pill top right, the
recipient's name and "Everlab Membership" bottom left, "12 months / gift
membership" bottom right. Under it, "What's next": a vertical timeline of four
squares joined by hairlines that meet the squares exactly, 22px between steps, Unwrap (the current
step, filled in Everlab red), Claim your gift, Meet your doctor, Get tested;
a soft orange pulse travels down the first segment every 2.2s so the journey
reads as in motion, with **Claim my gift** filling the foot of the column. Padding is an even 48px all round, the divider is a faint
hairline, and the card corners are 44px.

Motion is limited to transform, opacity and blur. Nothing bounces.
`prefers-reduced-motion` shows the message immediately and crossfades the
folds.

## Desktop and iPhone

The top bar carries a **Device** select: Desktop or iPhone (also `?device=phone`
on the link). In iPhone mode the whole experience runs inside a drawn iPhone,
430×884 with a dynamic island, a status bar reading 9:41, and a home
indicator, scaled to fit the window below the bar. The screen is the same
stage the desktop version uses, so the reveal, the circle, the card and the
scroll and swipe triggers all behave identically; the phone layout rules are
container queries on the stage rather than media queries on the window, so
the phone layout applies inside the frame on a desktop screen and on a real
phone alike. Sizes that used viewport units now use container units.

On phones: the first-fold block sits 72px above centre, the eyebrow runs over
two lines with looser spacing, the headline
is larger (34 to 40px), the half circle is about twice the desktop ratio
(roughly half the screen width), and on the second fold **Claim my gift**
floats at the foot of the screen over a soft dark gradient, in place of the
button inside the card.

## Dark theme

The top bar also carries a **Theme** select: Light or Dark (`?theme=dark` on
the link). Dark paints the first fold the same near-black as the room behind
fold 2, with the message and eyebrow in warm white, a white **See my gift**
button with dark type, the wordmark in white, and the ember mixed towards
white instead of ink. The transition then only opens the circle and raises
the card; the room is already dark. In the sections version the hero and the
closing section go near-black too, the inclusion cards a shade lighter than
their band, the white tags keeping dark type.

## Logo and chrome

A fixed, edge-to-edge bar 44px tall runs along the very top of the page in
near-black, with a mono label and three plain native selects: **Device**
(Desktop, iPhone), **Theme** (Light, Dark) and **Version** (01 Cinematic
reveal, 02 Sections, 03 Split card). Each changes the page in place through
a `data-` attribute on `<body>` (`data-device`, `data-theme`,
`data-variant`); nothing reloads and the current fold is kept. The
sections version is a scrolling layer inside the same stage, shown only for
`data-variant="sections"`; its classes and ids carry an `s-` prefix so they
never collide with the cinematic folds. Everything else lives in a stage
pinned below the bar, so the bar never overlays anything. On phones the labels
hide and the selects narrow so all three fit.

The Everlab wordmark (`Logo mark+type.svg`, inlined with its fills set to
`currentColor`) sits at the top centre of the stage, 25px tall: ink on the
white fold, fading to white as the room darkens. The back arrow sits top
right.

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
| `product` | Product name (default "Everlab Protocol") |
| `blurb` | The description of the membership inside the card |
| `value` | Total value (kept in the data, not shown for now) |
| `includes` | What's included, pipe-separated (`a\|b\|c`); six short items fit the two-by-three grid |
| `claim` | Activation URL for the button (http or https only) |
| `image` | The photograph behind fold 2 (http or https only) |
| `v` | Version to open on: `1`/`card`, `2`/`sections`, `3`/`split` |
| `theme` | `light` or `dark` |
| `device` | `desktop` or `phone` |

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

Rendered headlessly at capture time on desktop (1440×900), a short screen
(1280×720), a phone viewport (390×844) and the iPhone frame, for each of the
three versions and both themes: the settled first fold, the finished card, and
a run that switched version and theme from the selects without reloading.
Google Fonts were not reachable from the
render sandbox, so the screenshots used the fallback stack; the published
page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
