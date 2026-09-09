# Your Everlab gift

The second version of the gift page: the same gift as the cinematic reveal in
`evlab-gift-unwrap`, laid out as an ordinary scrolling page in three sections
with no animation. It follows the section structure of Everlab's biological
age and plans layouts: a light hero with a dark card on the right, then a dark
band of three cards, then a light closing section.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/05f652dc-ce60-45f8-92db-a2e813932039 |
| Title | Your Everlab gift |
| Captured from version | 2026-09-09, "One page, version + theme tweaks" |
| Captured on | 2026-09-09 |
| Sharing at capture | Private |
| Size | 547 KB, single file (both photographs, the logo and the ellipse are embedded) |

Since this version `index.html` is the same combined page as
`../evlab-gift-unwrap/index.html`, differing only in `DEFAULT_VARIANT`
(`'sections'`) and the `<title>`, so this link opens on the sections layout.
The **Version** select in the top bar switches to the other two in place. The
description below is of the sections layout itself; the shared chrome (Device,
Theme and Version selects, the dark theme, the iPhone frame) is documented in
`../evlab-gift-unwrap/README.md`.

## The page

**Hero.** Plain warm off-white. Left: a grey mono pill reading "Matt sent you
something", the message set medium in two tones (the first line in ink, the
rest in grey) with tight leading, a black pill button **Claim my gift →**, and
a mono line with the recipient and the total value. Right: a dark maroon card with the photograph
on top, three white tags (Everlab Membership, 12 months, $1,950 value) and the
sender's note.

**What's included.** Near-black band with the heading "What's included" and
six dark rounded cards in two rows of three, each a small line icon over one
inclusion, the same six as version 1: the onboarding consult, the blood
panel, the DEXA scan, the physical assessment with VO₂ max, the nutrition
assessment, and re-testing with the 12-month review.

**Next steps.** Light section, three numbered columns (claim, meet your doctor,
get tested), a second button, and a mono "A gift from Matt" line. A slim
footer carries the wordmark.

No motion beyond a hover on the buttons. Nothing waits for scroll or a click.

A fixed, edge-to-edge bar 44px tall runs along the very top in near-black,
with the Device, Theme and Version selects. The sections layout is a
scrolling layer inside the stage below it; its classes and ids carry an `s-`
prefix. In the dark theme the hero and the closing section go near-black, the
inclusion cards a shade lighter than their band.

## The photograph

The card uses a 1200×750 JPEG crop of
`../evlab-gift-unwrap/couple-sharing-a-photo-album-in-a-cozy-wood-toned-living-room-large.png`,
embedded as a `data:` URI in the `PHOTO_CARD` constant. `?image=https://...`
overrides it when the page is hosted.

## Feeding it from the email

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The headline (`%0A` ends the first, dark line; the rest is grey) |
| `note` | The sender's note in the card |
| `product` | Product name, shown as a tag |
| `includes` | The six cards, pipe-separated (`a\|b\|c`) |
| `value` | Total value, e.g. `$1,950` |
| `claim` | URL for both buttons (http or https only) |
| `image` | Photo for the card (http or https only) |

The three inclusion cards and the three steps are authored in the page.
All text is inserted as plain text, never as HTML.

## Verification

Rendered headlessly at capture time, full page, on desktop (1440 wide) and
phone (390 wide). Google Fonts were not reachable from the render sandbox, so
the screenshots used the fallback stack; the published page loads them
normally.

## Viewing

Open `index.html` directly in a browser. No server or build step.
