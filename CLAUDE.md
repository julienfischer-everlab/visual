# Everlab prototype

## Every build lands on the same artifacts

After every change: build (`node tools/build.js`), check it, add a note to `docs/working-notes.md`, commit and push, then publish to these existing artifacts. Never create a new artifact for the prototype.

- **Everlab App - Latest** (the main prototype, pinned; its page title is "Everlab App - Latest"): https://claude.ai/artifact/W5Y1FUmnVCHfGYtAvzGw88
  Publish `dist/index.html` with `files: {"concierge.html": "dist/concierge.html", "gift.html": "dist/gift.html"}`.
- **Health Profile** (standalone): https://claude.ai/artifact/27KVVvtwN5n6VRit7JSrUZ
  Publish `dist/health-profile.html`.

Order: publish Health Profile first, if it changed, and **Everlab App - Latest last**, then open Everlab App - Latest (Artifact `open`). The viewer lands on the last artifact touched, and the user always wants to land on Everlab App - Latest.
