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
| Captured from version | 2026-09-09, "Version switcher" |
| Captured on | 2026-09-09 |
| Sharing at capture | Private |
| Size | 166 KB, single file (the card photo is embedded) |

## The page

**Hero.** Warm off-white with a soft coral wash rising from the bottom edge.
Left: a grey mono pill reading "Matt sent you something", the message set in
two tones (the first line in ink, the rest in grey), two short lines about the
membership, a black pill button **Claim my gift →**, and a mono line with the
recipient and the total value. Right: a dark maroon card with the photograph
on top, three white tags (Everlab Membership, 12 months, $1,950 value) and the
sender's note.

**What's included.** Near-black band. A coral-square eyebrow, the heading
"Everything in the membership", and three dark cards, each with a title, a
sentence, and a small illustrative panel:

- Blood & Biomarkers: three biomarker rows with range bars and status chips.
- Imaging & Body Composition: a scan disc beside three mono readouts.
- Doctors & Follow-up: a white panel with a dotted timeline (consult, month 6,
  month 12).

The six inclusions from the first version are folded into these three cards.

**Next steps.** Light section, three numbered columns (claim, meet your doctor,
get tested), a second button, and a mono "A gift from Matt" line. A slim
footer carries the wordmark.

No motion beyond a hover on the buttons. Nothing waits for scroll or a click.

A small fixed pill at the top left, mono caps, holds a select with the two
versions of the page: 01 Cinematic reveal (`../evlab-gift-unwrap`) and 02
Sections (this one). Choosing the other opens it in a new tab, or navigates
when the host allows.

## The photograph

The card uses a 1200×750 JPEG crop of
`../evlab-gift-unwrap/couple-sharing-a-photo-album-in-a-cozy-wood-toned-living-room-large.png`,
embedded as a `data:` URI in the `PHOTO` constant. `?image=https://...`
overrides it when the page is hosted.

## Feeding it from the email

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The headline (`%0A` ends the first, dark line; the rest is grey) |
| `note` | The sender's note in the card |
| `product` | Product name, shown as a tag |
| `blurb` | The two lines under the headline (`%0A` between them) |
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
