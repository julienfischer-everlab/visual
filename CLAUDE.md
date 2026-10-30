# Everlab prototype

## Every build lands on the same artifacts

After every change: build (`node tools/build.js`), check it, add a note to `docs/working-notes.md`, commit and push, then publish to these existing artifacts. Never create a new artifact for the prototype.

- **Everlab App - Latest** (the main prototype, pinned; its page title is "Everlab App - Latest"): https://claude.ai/artifact/W5Y1FUmnVCHfGYtAvzGw88
  Publish `dist/index.html` with `files: {"concierge.html": "dist/concierge.html", "gift.html": "dist/gift.html", "clinic.html": "dist/clinic.html", "gift-receipt.html": "dist/gift-receipt.html"}`.
- **Health Profile** (standalone): https://claude.ai/artifact/27KVVvtwN5n6VRit7JSrUZ
  Publish `dist/health-profile.html`.

Order: publish Health Profile first, if it changed, and **Everlab App - Latest last**, then open Everlab App - Latest (Artifact `open`). The viewer lands on the last artifact touched, and the user always wants to land on Everlab App - Latest.

## Documentation is the master

Every Documentation page is the master component (the island, modals, chat bubbles, loading states, …). The app's instances must reflect it: build them from the same code or settings, and when a doc page has a saved setup, every page applies it on load, over Tweaks and older saves.
