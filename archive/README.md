# Artifact archive

Point-in-time snapshots of published Claude artifacts, kept here so the work
survives independently of the artifact URLs and gains version history.

Each folder holds one artifact: `index.html` is the page itself, and the
folder's `README.md` records where it came from and when it was captured.

| Folder | Artifact | Captured from version | Sharing at capture |
| --- | --- | --- | --- |
| [`particle-organs-78766a66`](particle-organs-78766a66/) | Particle Organs — the organ age prototype linked from DES-589 | 2026-08-25T03:16:48Z | Private |
| [`particle-organs-cf1a68fa`](particle-organs-cf1a68fa/) | Particle Organs — earlier iteration | 2026-08-21T23:15:44Z | Shared with organization |

Both artifacts carry the same title, so the folder name is suffixed with the
first segment of the artifact ID to tell them apart.

## What was changed on capture

Published artifacts are served wrapped in a generated skeleton — a `<base>`
tag, the frame runtime script, and a small CSS reset — that the platform adds
at publish time and that is not part of the authored page. Each `index.html`
here is the authored content with that wrapper removed, which is the same
content a redeploy takes as input.

Nothing else was altered. Both pages are fully self-contained: no CDN scripts,
external stylesheets, remote images, or network calls of any kind.

## Viewing

Open `index.html` directly in a browser — no server or build step. The pages
render with WebGL; a browser without it gets the page's own
"WebGL unavailable in this browser" fallback.
