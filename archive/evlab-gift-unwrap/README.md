# Unwrap your Everlab gift

The landing page linked from an Everlab gift email. The recipient arrives on a
plain cream card tied with a ribbon in Everlab red. One tap on **Unwrap** slips
the ribbon off, turns the card over to show the sender's message, and settles
the gifted product underneath with a gift code, an expiry date and a
**Claim your gift** button.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/e92660a9-d2b7-4acb-a8b0-7c566c4a7159 |
| Title | Unwrap your Everlab gift |
| Captured from version | 2026-09-08 (first publish) |
| Captured on | 2026-09-08 |
| Sharing at capture | Private |
| Size | 17 KB, single file |

## Design

- **Palette** is Everlab's own: warm cream ground `#F3EDE7`, deep brown ink
  `#2A1B16`, muted brown `#9A8377`, and the signature red `#B4574E` for the
  ribbon and the list markers. A dark theme on the deep organ brown `#1A0E0C`
  follows the viewer's setting.
- **Type**: Suisse Intl when installed, otherwise Geist from Google Fonts for
  the interface; the message and the "for Julien" tag are set in Newsreader
  italic so the note reads as a card, not as UI.
- **Motion**: a single orchestrated sequence of roughly two seconds. Ribbons
  slide off, the card flips, the message fades in line by line, then the gift
  rises from below. `prefers-reduced-motion` skips straight to the revealed
  state. The card never moves once the page has loaded, so nothing jumps.

## Feeding it from the email

The gift link can carry everything on the query string. Every parameter is
optional and falls back to the example gift baked into the page.

| Parameter | Meaning |
| --- | --- |
| `to` | Recipient's first name |
| `from` | Sender's name |
| `message` | The sender's note (line breaks encoded as `%0A`) |
| `sign` | Sign-off line under the message |
| `product` | Product name |
| `blurb` | One-sentence product description |
| `includes` | What's included, pipe-separated (`a\|b\|c`) |
| `code` | Gift code |
| `until` | Expiry date, as text |
| `claim` | Claim URL for the button (http or https only) |

All text is inserted as plain text, never as HTML.

Example:

```
index.html?to=Julien&from=Sarah&message=Happy%20birthday%2C%20Jules.&code=EVL-7K2M-QX4&until=8%20September%202027&claim=https%3A%2F%2Feverlab.com.au%2Fclaim
```

## Verification

Rendered headlessly at capture time on desktop (1280×900) and phone (390×844):
wrapped card at rest, then the revealed message and gift after clicking
**Unwrap**. Google Fonts were not reachable from the render sandbox, so the
screenshots used the fallback stack; the published page loads them normally.

## Viewing

Open `index.html` directly in a browser. No server or build step. The page is
self-contained apart from the Google Fonts stylesheet.
