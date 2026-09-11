# Unwrap gift-FINAL

The private page a recipient opens from an Everlab gift email. Two folds: a
personal message alone on the first, then the gift over a photograph of a
couple in a warm living room, in one centred glass card with the button inside
it and a horizontal timeline beneath. By default it is the cinematic reveal in
the light theme; a Motion tweak turns it into one plain scroll.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap gift-FINAL (renamed from "Unwrap your Everlab gift" on 2026-09-09) |
| Captured from version | 2026-09-11, "Static header follows Theme, card +64, panel corners" |
| Captured on | 2026-09-11 |
| Sharing at capture | Shared with organization |
| Size | 400 KB, single file (the photograph, the logo and the ellipse are embedded) |

This is the only gift page kept. Earlier versions (a ribbon-tied card; a warm
two-scene reveal; the one-card "01" layout; the three-way Version select; the
independent sections page and the "Split" duplicate, whose archive folders
were removed on 2026-09-09) are in the artifact's version history and in this
repo's git history.

## Tweaks

A fixed, edge-to-edge bar 44px tall runs along the very top in near-black,
with a mono label, seven plain native selects, a colour swatch and two number fields. Each changes the page in
place; nothing reloads. On phones the labels hide and the controls share
the bar evenly.

| Select | Options (default first) | Link parameter |
| --- | --- | --- |
| Device | Desktop, Mobile | `device=phone` |
| Theme | Light, Dark | `theme=dark` |
| Motion | Dynamic, Static | `motion=static` |
| Signature | Off, On | `sig=on` |
| Card | Cards, List | `card=list` |
| Heavy | No, Yes: much more text in the card (a longer description, twelve rows) to test the card's own scroll | `heavy=yes` |
| Panel | a colour swatch (default a warm sand, `#c5a496`), an opacity in percent (default 24) and a backdrop blur in pixels (default 120, the maximum) for the second card in Cards | `panel=c5a496&alpha=24&blur=120` |
| Message | Looking after everyone else (default); Happy Birthday; Adventures ahead; What actually matters; More good years; A little push | `msg=0` to `msg=5` (default 1) |

The six messages, with their authored line breaks, are the `MESSAGES` array
in the script; choosing one re-renders the first-fold title in place (in
dynamic motion it resolves letter by letter again). Every message is set at
the same full size (up to 64px, the block up to 17em wide); the two longest
run over four lines. A custom `message=` on the link still wins.

Switching Motion always lands on the first fold: if the reveal had run, it is
put back to its start, so the static header and the dynamic message are both
where the new mode expects them.

Everything below the bar lives in a stage pinned under it, so the bar never
overlays anything. In Mobile mode the whole page runs inside a drawn iPhone
(430×884, dynamic island, 9:41 status bar, home indicator) scaled to fit; the
phone layout rules are container queries on the stage, so they apply inside
the frame and on a real phone alike. In dynamic motion the stage never
scrolls: if a focus or scroll-into-view nudges it, it is pinned back to the
top.

## Fold 1

The sender's message, set large and medium in a sans (Suisse Intl where
installed, otherwise Geist), under a plain mono eyebrow, all caps and widely
spaced: a small orange square, blinking once a second like a cursor, then
"Marc got something special for you". Default copy: "You’ve spent so much
time looking after everyone else. This one’s for you." over three lines. The
sender's first name is written across the bottom right of the title in a
thin script face (Homemade Apple, in the text colour, inclined 7°), laid over
the last word (starting a third of the way into it, across its lower half,
placed by the script and re-placed on resize), like a signature; it is off
unless the Signature tweak is on: in dynamic motion
it writes itself on from left to right 0.7s after the title's last letter
starts, and again whenever the message is switched.

In dynamic motion things arrive in order: the wordmark fades in first (from
150ms); the eyebrow's letters resolve from 0.73s to 1.7s (on phones the square sits
centred above the two lines, 13px type on a 1.36 line height); the message's letters from 1.8s, the last beginning at 4.8s,
each line opening as a row over 1.5s, from 900ms before its first letter, so
the block grows gently from the middle; **See Marc's Gift** (the sender's
name) and the circle at the bottom arrive together half a second after the
title's last letter starts; the button's row is there from the start, so
nothing grows: the button only fades in while rising 18px (0.9s, easing out),
and the block moves up 64px slowly (1.3s, easing out) to make room. Each letter eases up and
sharpens out of a blur over 1.64s on one smooth curve, and is orange for as long as it is out of focus
(the warmth fades over 70% of the sharpening time, full strength, `#F5842E`
on dark), so every word arrives orange and blurred and settles white and
sharp. The last word keeps most of it. In the dark theme the fold is the same
near-black as the room behind fold 2, the type warm white, the button white
with dark type. In the light theme (the default) the fold is warm white
with near-black type.

## Dynamic motion (default)

The reveal. The circle that rises at the bottom is the photograph at half
size, the couple inside the dome. Inside it, concentric at 30% of its size,
sits a second half circle: the card's own glass surface (same tint, same 60px
blur) with nothing in it yet, the card not yet expanded.

The button, a scroll down, a swipe or the down-arrow, page-down and space keys
run the same sequence on the one viewport: the first-fold block travels 256px
up while fading and blurring (800ms); from 100ms the circle grows until the
photograph is exactly a full-screen cover while the room crossfades to dark
(no halo at the top); at the same moment the glass half circle morphs into the
card's exact rectangle (position, size and corner radius taken from the card's
layout, one Web Animation for all five so the box never drifts) over 1s on
`cubic-bezier(.9,0,.22,1)`; in dynamic motion the card itself has no glass of
its own: the seed stays exactly behind the transparent card for the whole
visit as its surface (following the card if the fold scrolls on a phone), so
there is never a swap between two surfaces; on landing the seed snaps to
where the card is at that moment, and a scroll of the fold during the morph
(a swipe's momentum on a phone) re-aims it, so it never lands offset; as the
seed lands the content fades in; settled at 1.1s, when the footer and a small arrow at the
top (a 40px frosted disc, white at 16% over a 24px blur, on desktop and
phones alike) fade in and the five timeline steps appear one after another, 350ms apart,
from 1.2s to about 3.2s. The arrow, or a firm scroll up, runs it in reverse:
the card's content fades out in place (350ms, nothing inside it moves) while
the seed shrinks back into a half circle in the dome and the room lightens (750ms, the seed always inside the closing circle), and the
block settles back from 400ms, done at about 1.15s. The seed's rectangle is
taken from the card as it sits on screen, so a scrolled fold on a phone still
lands exactly. On phones a dark gradient is fixed at the
top of the screen under the wordmark and the arrow so the card can scroll
beneath them, carrying a progressive 16px backdrop blur that fades out with
the gradient (the floating button's bar at the foot has the same, upward), the first-fold block sits 64px lower, and the timeline has 24px
more room above it.

## Static motion

One ordinary scroll, nothing waiting on a click. The title, eyebrow and button
are simply there, with no entrance. The first fold is a header 80% of the
screen tall with 56px rounded bottom corners (48px on phones) that follows the
Theme tweak: warm white with near-black type in Light, near-black with warm
white type in Dark (the scroll hint below takes the same ink); the photograph is the page's own background,
held fixed behind both folds by a sticky zero-height layer at the top of the
scroll, showing under the corners and drifting up at 20% of the scroll as a
small parallax (the layer is 170% of the screen tall and the drift stops at
44% of the screen, so a long fold, heavy content on a phone say, never
uncovers the page beneath). Centred 46px above the header's bottom edge, a one-pixel,
36px track carries a bright segment that keeps running from top to bottom
(1.6s loop), a vertical progress hinting at the scroll; it never stops. There
is no Back control; scrolling up is the way back. On phones the first fold's content is centred
with 80px above and below and the second fold starts 70px under the header, and a dark gradient is fixed at the top of the
screen over the photograph so the status bar reads. The back arrow, the
circle, the seed and the floating phone button are not used. Reduced motion
disables the parallax.

## Fold 2

The photograph fills the screen, darkened so type reads over it. The fold does
not scroll on desktop; on phones it does. One glass card, centred, up to 625px
wide: `rgba(40,38,36,.36)` over a 60px blur, 44px corners, no shadow, so the
room shows through; 40px padding inside all round in the Cards layout (the
foot matches the sides; the panel below also ends 40px under its
last line). Inside: the mono
"Your gift from Marc" line (orange square), the product name "Everlab
Protocol Membership" 10px under it (beside the circle), a short description
(16px on a 20px line) kept 88px clear of the right edge like the title so it
never runs under the circle, then a mono "What's included"
label above six plain rows, each a small line icon (speech bubble, drop, scan,
pulse, leaf, cycle) and the full title, no card and no dividers, 6px above and
below each row. Then **Claim my gift** full width at the foot of the card. At
the top right of the card, beside the title, sits the membership passport as a
64px circle of the `Ellipse 4358.png` copper image, crisp, with nothing on
it. Phones drop the circle, and lay the card out differently: the script moves
the "Your gift from Marc" line and the product title out of the card into a
head above it, centred, with 64px above and below so the photograph shows
around them (they move back inside when the stage is wide again, ids and all);
the card itself keeps the very same glass as the half circle on the first
fold (`rgba(40,38,36,.36)` over a 60px blur), with 30px padding and 32px at
the foot; the panel below uses the same 30px sides and 32px foot. In dynamic motion the seed morphs to the card as on
desktop, unchanged in colour; the head above the card fades in with the
card's content. The floating **Claim my gift** at the
foot of the screen fills 70% of the width, centred; in dynamic motion it waits
below the screen and rises into place over 0.75s from 1.5s, once the card has
landed and its content shown, and drops back below on the way back. Its bar's
gradient and progressive blur live on a layer of their own behind the button,
so the button stays crisp; the fold keeps 120px of room at its foot so
everything can scroll clear of the button.

Under the card, 52px below and directly over the photograph, with no label: a
horizontal timeline as wide as the card (with the Card tweak on List), five equal columns with a 10px square
at the centre of each and its label (12.5px) centred beneath on one line; a half-pixel
line runs from 6px right of each square to 6px left of the next. The squares
are white at 20%, Unwrap filled in Everlab red with a soft orange pulse
travelling along its segment; then Get started, Consult, Test, Act. The card and the timeline are centred together in the fold.

With the Card tweak on Cards (the default) the timeline goes and a second card
takes its place: a panel in a warm sand (`#c5a496`) at 24% over a 120px
backdrop blur by default (the Panel tweak sets any colour, opacity and blur)
as wide as the hero card. Its surface is one element in the stage, placed by
the script from the card's box and cut to shape with a clip path: the panel's
rectangle, the card's radius on its bottom corners, and at the top only the
two slivers outside the card's rounded bottom corners, so nothing of it runs
under the card's glass (no faint edge shows through) and the panel reads as a
card tucked behind the hero card with only its bottom showing. While it
slides it sits in a clip box that starts at the card's bottom edge and always
reaches the panel's foot, so the slivers appear only as it settles (on the
slide's end event, or a timer 1.9s after landing if that never arrives) and the
bottom corners are never cut. It
arrives in dynamic motion once the hero card has landed: from 1.0s the
surface and the content slide down together out from behind the card (their
own height in 0.8s, easing out; the content inside a clip at the card's
bottom edge, the surface hidden under the card's glass) so it emerges from
under it; on the way back both slide up under the card again in 0.35s. It holds, everything centred, under a mono "What's next?" label (18px above
the chips), three chips in a row: Get started, Meet your doctor, Get your plan
(pills with a hairline border, 13px medium, each starting with a 22px numbered circle, 1 to 3, set 7px from the pill's left, top and bottom so
it fills the pill's height, outlined at 16% when idle and filled in the text
colour when active). One is active at a time, white at 14% with brighter text
and no border, the two states fading into each other over 0.4s; after three
seconds the next chip takes over, round and round.
Under the chips one line of description (14px, two lines always reserved so
nothing jumps, set 32px further in than the chips on each side) belongs to the active chip and crossfades when it changes:
"Three minutes and a few questions about your health and history." / "A
45-minute consult online. They decide what's worth testing for you, and we
book it around you." / "Your doctor walks you through every result and what
to change first." Clicking a chip makes it active and restarts the three seconds. The
cycle runs only while the panel is on screen (Cards layout, on the second
fold in dynamic motion or anywhere in static), stops on the way back to the
first fold or when the tab is hidden, and restarts from the first chip when
the panel returns. On phones the chips wrap.
The hero card keeps its six rows, set a
little tighter (4px above and below each row, 44px top and bottom padding)
and the stack sits inside a frame of 160px above and 160px below on desktop
(112px above in static motion; phones have no frame, their fold simply flows):
the script caps the card's height so card and panel always fit that frame, and
the card's upper part (everything above the button) scrolls on its own, with no
visible bar and a 28px fade at either end once it can scroll; the button never
moves, and neither does the circle at the top right, which sits on the card
itself outside the scrolling part so it is always whole. With the default text the card scrolls a little at 900px tall; with the
Heavy tweak it scrolls a lot. Phones keep the flowing fold instead. The
wordmark sits top centre, the footer line "Page secured by Everlab" bottom
centre. On phones the timeline labels may wrap and in dynamic motion **Claim
my gift** floats at the foot of the screen.

## Feeding it from the email

Every parameter is optional and falls back to the example gift in the page.

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name (in the eyebrow, the card and the button) |
| `to` | Recipient's first name |
| `message` | The message on the first fold (`%0A` for a line break; three lines read best) |
| `product` | Product name (default "Everlab Protocol Membership") |
| `blurb` | The description inside the card |
| `includes` | What's included, pipe-separated (`a\|b\|c`), six items |
| `claim` | Activation URL for the button (http or https only) |
| `image` | The photograph behind fold 2 (http or https only) |
| `device`, `theme`, `motion`, `sig`, `card`, `heavy`, `panel`, `alpha`, `blur`, `msg` | The tweaks, as above |

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
(`intro → revealing → gift → returning → intro`), the seed's geometry and the
tweaks. Motion is limited to transform, opacity and blur, plus the seed's
box morph.

## Verification

Rendered headlessly at capture time on desktop (1440×900) and in the iPhone
frame, light and dark, in both motions: the first fold at several moments of
the arrival sequence, the seed at rest, mid-morph and landed (its rectangle
measured against the card's, and its centre measured through the way back),
the settled card, and the static scroll at three positions. Google Fonts were
not reachable from the render sandbox, so the screenshots used the fallback
stack; the published page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
