# Everlab prototype

## Every build lands on the same artifact

After every change: build (`node tools/build.js`), check it, add a note to `docs/working-notes.md`, commit and push, then publish to this existing artifact. Never create a new artifact for the prototype.

- **Everlab App - Latest** (the main prototype, pinned; its page title is "Everlab App - Latest"): https://claude.ai/artifact/W5Y1FUmnVCHfGYtAvzGw88
  Publish `dist/index.html` with `files: {"concierge.html": "dist/concierge.html", "gift.html": "dist/gift.html", "clinic.html": "dist/clinic.html", "gift-receipt.html": "dist/gift-receipt.html", "referral.html": "dist/referral.html"}`.

Then open Everlab App - Latest (Artifact `open`): the user always wants to land on it.

Do not publish the standalone Health Profile artifact (https://claude.ai/artifact/27KVVvtwN5n6VRit7JSrUZ) any more, even when `dist/health-profile.html` changes: the user retired it. The Health profile lives in Everlab App - Latest.

## Documentation is the master

Every Documentation page is the master component (the island, modals, chat bubbles, loading states, …). The app's instances must reflect it: build them from the same code or settings, and when a doc page has a saved setup, every page applies it on load, over Tweaks and older saves.
