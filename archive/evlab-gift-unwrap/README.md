# Unwrap your Everlab gift

The private page a recipient opens from an Everlab gift email. It is one
continuous scene in two chapters: a personal message that resolves into focus
on a white page, then the whole composition lifts away and the gift itself
comes up from underneath.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-08, "Cinematic two-scene reveal" |
| Captured on | 2026-09-08 |
| Sharing at capture | Private |
| Size | 20 KB, single file |

An earlier version of this page (a ribbon-tied card that flipped over) is in
the artifact's version history and in this repo's git history.

## The experience

**Scene 1.** A warm off-white viewport with nothing on it but the sender's
quote, set large in Newsreader light and centred exactly. The characters
resolve one by one: each starts blurred, faintly transparent and 3px low, and
sharpens into place over 680ms. The stagger is derived from the character
count so any message lands in about two seconds. About 400ms after the last
character settles, a small black pill, **See my gift**, rises into place.

**Transition.** On click the quote and button travel upward and fade, leaving
through the top of the viewport over 1.1s on `cubic-bezier(.76,0,.24,1)`. At
the same time the page warms from `#FCFBF9` to `#F6F0E9`, a soft ambient glow
comes up, and the second scene slides up from beneath.

**Scene 2.** Eyebrow, heading, supporting line, the gift card and a footer
arrive in sequence with roughly 80ms between them, each rising a little and
sharpening from a slight blur. The card is the last to land. Inside it, a
biological-age dial's pointer sweeps round once the scene has settled.

Motion is limited to opacity, blur, translateY and a hair of scale. Nothing
bounces. `prefers-reduced-motion` shows the quote and button immediately and
swaps the scenes with a short crossfade.

## Structure

Plain HTML, CSS and JavaScript, no build step. The script is organised as
small components with one piece of state (`intro → revealing → gift`) on the
`<body>`:

| Component | Role |
| --- | --- |
| `AnimatedQuote` | Splits the message into unbreakable words and per-character spans, assigns each its delay |
| `GiftIntro` | Scene 1: the quote and the button, and when the button appears |
| `GiftReveal` | Scene 2: fills in the sender and recipient, mounts the card |
| `GiftCard` | The gift itself: product, term, value, inclusions, the sender's note, the activation button, the dial |
| `App` | Owns the state and the timing of the transition |

## Feeding it from the email

The gift link can carry everything on the query string. Every parameter is
optional and falls back to the example gift baked into the page.

| Parameter | Meaning |
| --- | --- |
| `from` | Sender's name |
| `to` | Recipient's first name |
| `message` | The quote on the first screen (`%0A` for a deliberate line break; three lines read best) |
| `note` | The sender's short note shown inside the gift card |
| `product` | Product name |
| `term` | One line under the product name |
| `value` | Gift value label, as text |
| `includes` | What's included, pipe-separated (`a\|b\|c`) |
| `claim` | Activation URL for the button (http or https only) |

All text is inserted as plain text, never as HTML.

## Design notes

- The palette is deliberately single-theme: the brief asks for a white page
  that warms, so it is painted explicitly and does not follow the viewer's
  dark mode.
- Type: Newsreader (light, optical size 72) for the quote and headings, Geist
  for everything else, with Suisse Intl used automatically where installed.
  Everlab red `#B4574E` appears only on the list markers and the upper band of
  the dial.
- The card, dial and copy in scene 2 are placeholder content and will be
  replaced with the real product composition.

## Verification

Rendered headlessly at capture time on desktop (1440×900) and phone (390×844)
at four moments: mid-way through the character animation, the settled intro,
520ms into the transition, and the finished gift scene. Google Fonts were not
reachable from the render sandbox, so the screenshots used the fallback
stack; the published page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
