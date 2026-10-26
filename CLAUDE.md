# Everlab prototype

## Every build lands on the same artifacts

After every change: build (`node tools/build.js`), check it, add a note to `docs/working-notes.md`, commit and push, then publish to these existing artifacts. Never create a new artifact for the prototype.

- **Everlab service pages** (the pinned main prototype): https://claude.ai/artifact/W5Y1FUmnVCHfGYtAvzGw88
  Publish `dist/index.html` with `files: {"concierge.html": "dist/concierge.html"}`.
- **Health Profile** (standalone): https://claude.ai/artifact/27KVVvtwN5n6VRit7JSrUZ
  Publish `dist/health-profile.html`.
