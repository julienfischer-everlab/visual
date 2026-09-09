# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. Two folds: a
personal message alone on the first, then the gift over a photograph of a
couple in a warm living room, with a glass card on the left and the
membership on the right (the "split card" layout). By default it is one plain
scroll in the dark theme; a Motion tweak turns it into the cinematic reveal.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap gift-FINAL (renamed from "Unwrap your Everlab gift" on 2026-09-09) |
| Captured from version | 2026-09-09, "Message tweak, scroll hint" |
| Captured on | 2026-09-09 |
| Sharing at capture | Shared with organization |
| Size | 383 KB, single file (the photograph, the logo and the ellipse are embedded) |

`../evlab-gift-split` holds the same file under its older title; the two
artifacts are now identical. The sections version is a separate page,
`../evlab-gift-sections`, no longer switchable from here. Earlier versions (a
ribbon-tied card; a warm two-scene reveal; the one-card "01" layout; the
three-way Version select) are in the artifact's version history and in this
repo's git history.

## Tweaks

A fixed, edge-to-edge bar 44px tall runs along the very top in near-black,
with a mono label and four plain native selects. Each changes the page in
place; nothing reloads. On phones the labels hide and the four selects share
the bar evenly.

| Select | Options (default first) | Link parameter |
| --- | --- | --- |
| Device | Desktop, iPhone | `device=phone` |
| Theme | Dark, Light | `theme=light` |
| Motion | Static, Dynamic | `motion=dynamic` |
| Message | Happy Birthday; Looking after everyone else; Adventures ahead; What actually matters; More good years; A little push | `msg=0` to `msg=5` |

The six messages, with their authored line breaks, are the `MESSAGES` array
in the script; choosing one re-renders the first-fold title in place (in
dynamic motion it resolves letter by letter again). The two longest run over
four lines a size down. A custom `message=` on the link still wins.

Everything below the bar lives in a stage pinned under it, so the bar never
overlays anything. In iPhone mode the whole page runs inside a drawn iPhone
(430×884, dynamic island, 9:41 status bar, home indicator) scaled to fit; the
phone layout rules are container queries on the stage, so they apply inside
the frame and on a real phone alike.

## Fold 1

The sender's message, set large and medium in a sans (Suisse Intl where
installed, otherwise Geist), under a plain mono eyebrow, all caps and widely
spaced, a small orange square then "Matt got something special for you".
Default copy: "Happy Birthday. I want you around for a long time." over three
lines. Letters resolve one by one out of a blur with a faint warm ember on the
newest three, each line opening as a row so the block grows from the middle;
the whole message lands in about 3.3 seconds. Just after the last character
settles, **See Matt’s gift** (the sender’s name) rises into place (17px type on 15×30px padding), its
row opening so the message is pushed up as it arrives. In the dark theme the
fold is the same near-black as the room behind fold 2, the type warm white,
the button white with dark type, and the ember a touch warmer (`#E8874A` at
70%) so it still reads on the dark ground: a soft peach on the newest three
letters, gone in about 200ms.

## Static motion (default)

One ordinary scroll, nothing waiting on a click. The title, eyebrow and button
are simply there, with no entrance. The first fold is a painted card 80% of the
screen tall with 56px rounded bottom corners (48px on phones), sitting over
the photograph; in the strip of photograph under it a one-pixel white line
bobs up and down (16px, 1.8s) as a hint to scroll, fading out over the first
120px of scroll. On phones the fold's content is centred with 80px above and
below. The photograph is the page's own background: a
sticky, zero-height layer at the top of the scroll holds it fixed behind both
folds, so the first fold's card scrolls up off it and the gift sits on it,
and it drifts up at 12% of the scroll, a small parallax. The button, or any
scroll, simply moves down the page. The card, passport, timeline and
footer are in place from the start; the back arrow, the circle and the
floating phone button are not used. Reduced motion disables the parallax.

## Dynamic motion

The reveal. As the button arrives, the top of a circle scales up from the
bottom edge of the screen: the photograph at half size, the couple inside the
dome. The button, a scroll down, a swipe or the down-arrow, page-down and
space keys run the same sequence on the one viewport: the first-fold block
travels 256px up while fading and blurring (800ms); from 100ms the circle
grows until the photograph is exactly a full-screen cover while the room
crossfades to dark; at the same moment the glass card rises from below into
place over 1s on `cubic-bezier(.9,0,.22,1)`, the right side a beat later;
settled at 1.1s, when the footer and a small arrow at the top fade in. The
arrow, or a firm scroll up, runs it in reverse (about 1.15s).

## Fold 2

The photograph fills the screen, darkened so type reads over it. The fold does
not scroll on desktop; on phones it does. The glass card covers the left
half: `rgba(40,38,36,.32)` over a 44px blur, 44px corners, no border, no
shadow, so the room shows through. Inside, 48px padding all round: the mono
"Gift received from Matt" line (orange square), the product name "Everlab
Protocol", a short description, then at the foot a mono "What's included"
label above six plain rows, each a small line icon (speech bubble, drop, scan,
pulse, leaf, cycle) and the full title, no card and no dividers, 8px above and
below each row, the block following the description directly. At the top
right of the card, beside the title, sits the membership passport as a 128×72
tile: the `Ellipse 4358.png` copper texture blurred 64px into a warm gradient,
the Everlab mark top left and "12 months" bottom right. Phones drop the tile.

On the right, 64px from the card and directly over the photograph: "What's
next", a horizontal timeline of four equal columns, a square above each label
and a hairline from each square's right edge to the next square's left edge;
Unwrap filled in Everlab red with a soft orange pulse travelling along its
segment, then Claim your gift, Meet your doctor, Get tested; and **Claim my
gift** full width beneath. The wordmark sits top centre, the
footer line "Page secured by Everlab" bottom centre. On phones the card and
the right side stack, the first-fold block sits 72px above centre, the
headline is larger, and in dynamic motion **Claim my gift** floats at the foot
of the screen.

## Feeding it from the email

Every parameter is optional and falls back to the example gift in the page.

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The message on the first fold (`%0A` for a line break; three lines read best) |
| `product` | Product name (default "Everlab Protocol") |
| `blurb` | The description inside the card |
| `includes` | What's included, pipe-separated (`a\|b\|c`), six items |
| `claim` | Activation URL for the button (http or https only) |
| `image` | The photograph behind fold 2 (http or https only) |
| `device`, `theme`, `motion` | The tweaks, as above |

All text is inserted as plain text, never as HTML.

## The photograph

`couple-sharing-a-photo-album-in-a-cozy-wood-toned-living-room-large.png`,
kept in this folder as uploaded (1920×1446 PNG, 4 MB). The page embeds a
1600px JPEG re-encoding (about 190 KB) as a `data:` URI in the `PHOTO`
constant, the only way an image can load on the artifact host. Two further
photographs uploaded alongside it are kept here as alternatives and are not
used by the page.

## Structure

Plain HTML, CSS and JavaScript, no build step. `AnimatedQuote` splits the
message into per-character spans and assigns each its delay; `GiftIntro` runs
fold 1; `GiftCard` fills the gift; `App` owns the state
(`intro → revealing → gift → returning → intro`) for the dynamic motion and
the tweaks. Motion is limited to transform, opacity and blur.

## Verification

Rendered headlessly at capture time on desktop (1440×900) and in the iPhone
frame, light and dark, static (first fold, three scroll positions showing the
parallax) and dynamic (the settled card). Google Fonts were not reachable from
the render sandbox, so the screenshots used the fallback stack; the published
page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
