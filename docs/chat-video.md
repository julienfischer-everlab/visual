# AI Chat Video Builder: the stage (renderer) and the builder

Marketing → AI Chat Video Builder. Julien's brief: "I write the conversation and choose the components. The tool handles the design and animation."

This page documents the **renderer**: the stage mode of `visuals/concierge.html` (built to `dist/concierge.html`). The **builder** is documented at the end. It is the only thing that draws a composition, for the builder's live preview and for every frame of the MP4. The builder (`visuals/chat-video.html`) is a composition layer around it: it edits the JSON, and it never draws a bubble itself.

## Why the Concierge draws it

- The brief asks for no second chat UI. The Concierge is the chat design system: its tokens, bubbles, Eva's thinking line, the clinician card with the small doctor avatar, the composer and the BLOCK widget renderers.
- The stage uses those classes and renderers (`msgEl`-style markup, `answerHtml`, `BLOCK[t]`, `.msg.u .bub`, `.msg.a .txt`, `.clin .doc`, `.think`, `.dock .box`). When the Concierge changes, the preview and the video change with it.
- The stage adds only what a video needs: time-driven entrances, loaders driven by time, a scroll worked out from time, the canvas and its background, and the phone frame.

## Loading it

- `dist/concierge.html#stage` (or `visuals/concierge.html#stage` locally). The hash hides the app (`html.stg`). `Concierge.stage.load(comp)` draws it.
- Same origin (the builder's iframe in the published artifact): call `iframe.contentWindow.Concierge.stage.*` directly.
- Not same origin: send `postMessage({ everlab: 'stage', id, fn, args })`. The reply is `{ everlab: 'stageRe', id, result | error }`. With `fn: 'onTime'`, the stage sends `{ everlab: 'stageTime', t, playing }` on every seek.

## The composition (v1)

```ts
type Composition = {
  v: 1;
  name: string;
  title?: string;                    // the phone header's title ('Eva')
  format: { ratio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1' | 'custom'; w: number; h: number };
                                     // 1920x1080, 1080x1920, 1440x1080, 1080x1440, 1080x1080; custom takes w, h
  background:
    | { kind: 'color'; color: string }
    | { kind: 'image'; src: string;  // a data/blob/https URL, or a key of the Concierge's pictures (clinic, mriRoom, steven, ...)
        fit: 'fill' | 'fit' | 'crop'; x: number; y: number;   // focal point in % (50, 50)
        scale: number;               // any fit, 1 = as fitted
        blur: number;                // px
        overlay: number;             // 0..1 of overlayColor over the picture
        overlayColor: string; color?: string }                // color: the letterbox under 'fit'
    | { kind: 'video'; src: string;  // a blob or /_blob/ URL (an MP4 or WebM), muted, looped on the timeline
        fit; x; y; scale; blur; overlay; overlayColor; color? };  // as the image
  device: boolean;                   // true: the phone; false: floating
  padding?: number;                  // canvas px kept clear (default 7% of the shorter side)
  theme: 'dark' | 'light';
  lead?: number;                     // ms of empty chat before the first item (500)
  tail?: number;                     // ms held after the last item (1500)
  column?: number;                   // floating: the thread's width in chat px (440)
  zoom?: number;                     // floating: a scale on top of the fitted one (1)
  anchor?: 'center' | 'bottom' | 'top';  // floating: the newest message held in the middle (default), the thread up from the foot, or down from the top
  flow?: 'thread' | 'single';        // floating: 'single' shows one message (with its widget) at a time, then fades it out
  sequence: Item[];
};
type Item =
  | { id: string; type: 'user'; text: string; name?: string; avatar?: string;     // avatar: a picture or initials
      typing: 'none' | 'dots' | 'text'; typeMs?: number; width?: number; delay?: number; hold?: number }
  | { id: string; type: 'eva'; text: string; think: number; step?: string;        // think: ms of "Thinking · step"
      reveal?: 'fade' | 'stream'; avatar?: boolean; delay?: number; hold?: number }
  | { id: string; type: 'specialist'; specialist: string;                        // a key of stage.specialists()
      name?: string; role?: string; avatar?: string; when?: string; text: string;
      typing: boolean; wait?: number; delay?: number; hold?: number }
  | { id: string; type: 'widget'; widget: string; data: object;                  // a key of stage.widgets()
      attach?: boolean; delay?: number; hold?: number };                         // attach:false: a message of its own
```

- `delay`: ms after the item before ends. `hold`: ms the item stays before the next one starts. Leave both out for the motion defaults.
- `typing: 'text'` types the words into the composer on the phone. Floating has no composer ("just remove the chat field"): the bubble comes in empty and the words type inside it, with a caret (`typing: 'bub'` in the schedule, `typeIn` to `typed`).
- `flow: 'single'` (floating only, "just the speech bubble that appears and disappears"): each lead message (a question, Eva's answer, a specialist) is on screen alone, its widget with it. It fades out over the last 260 ms before the next lead (at least 120 ms, never before its own entrance ends). The phone keeps the thread.
- A video background is drawn under the chat, muted and looped. In `seek` it is paused at the time's frame (`vidSync`); while playing it runs at the playback rate and is corrected when it drifts over 0.3 s. `frame()` waits for that frame (`vidAt`) and swaps the video for a JPEG of it, so the MP4 has the video.
- When a typed message is sent, the composer's beam goes once round its edge (the chat's own `.evBeam`, Care team → Eva's), 1.9 s from `sent`, fading in over its first 8% and out over its last 14%. It is painted from the time in `seek`, like everything else, so the MP4 has it.
- A widget joins the answer just before it (Eva's or the specialist's), as a block of that answer. With `attach: false` it is a message of its own.
- `stage.normalize(comp)` returns the composition made whole: every field set, every item given a unique id.

## Timing (the brief's sections 4 and 14)

`stage.schedule(comp)` returns `{ items: [{ id, type, start, end, phases }], duration }`. All values are in ms.

| Item | Phases | Defaults |
|---|---|---|
| user | `typeIn` (dots or typed text), `in`, `inEnd` | delay 400. Dots for 1300. Text at 45 ms a character (700 to 2600), then sent after 280. The bubble fades in and rises 8 px over 240 ms (the chat's `.2, .8, .2, 1`). Hold 600 |
| eva | `thinkIn`, `in`, `inEnd`, `streamMs` | delay 350. think 1600: the thinking line (the 3 x 3 dot grid and "Thinking · Looking at your records", with its shimmer). Then the answer fades in. It never types like a person; `stream` brings the words in one after another (45 ms a word). Hold: a reading time, 600 + 170 a word (1.2 to 5.2 s) |
| specialist | `presIn`, `in`, `inEnd` | delay 450. The card with the avatar, name and role comes in first. The words follow after 700 ms (1600 with typing dots). Hold: reading time |
| widget | `in`, `inEnd` | delay 300. Fades in and rises 10 px over 300 ms. Hold 1600 |

- Scroll: at every change in the thread, the stage works out a target that keeps the new content in view, 16 px clear of the edge. When the new content is taller than the view, its top stays in view. The thread reaches the target in 500 ms on `.4, 0, .2, 1`.
- The scroll targets are measured once per load, then again after fonts and pictures have loaded. Between targets the offset is the eased value, so any time gives the same offset.

## The API: `window.Concierge.stage`

| Call | Returns |
|---|---|
| `load(comp)` | A Promise for `{ duration, w, h, items }`, resolved once fonts and pictures are in and the scroll is measured. It draws at once and keeps the current time |
| `seek(ms)` | The time drawn. This is the exact visual state at ms: the items in the thread, entrance progress, thinking and typing frames, the caret, the composer and the scroll offset. All of it is computed from ms; no wall clock, CSS transition or animation is involved. Idempotent; about 0.05 ms |
| `frame(ms, { scale?, canvas? })` | A Promise for a canvas the composition's size (times scale). It holds `seek(ms)` drawn from this DOM and this page's CSS through an SVG `foreignObject`, with pictures as data URLs. This gives the MP4's frames. About 20 to 80 ms at 1080p |
| `play()` / `pause()` | Starts or stops the clock. The clock only moves t; each frame is still `seek(t)` |
| `rate(x?)` | Gets or sets the playback rate (1, 0.5, ...) |
| `loop(bool?)` | Gets or sets looping |
| `duration()` | The total length in ms |
| `time()` / `playing()` | The current time; whether the clock is running |
| `at(ms)` | The id of the item started last at ms (the builder's "jump to item" and highlight) |
| `onTime(fn)` | `fn(t, playing)` on every seek. Returns an unsubscribe function |
| `size(w, h)` / `size(false)` | Overrides the canvas size, or clears the override. With no arguments, returns `{ w, h }` |
| `fit(bool?)` | true (the default): the canvas is scaled to fit the window. false: it is drawn 1:1 at the top left |
| `ready()` | The Promise of the last load |
| `schedule(comp?)` | The timing of a composition, without drawing it |
| `normalize(comp)` / `comp()` | A composition made whole; the loaded composition |
| `node()` | The stage's root element (`#stg`) |
| `widgets()` | `[{ key, label, category: 'Health' \| 'Services' \| 'Actions', fields: [{ key, label, type: 'text' \| 'area' \| 'lines' \| 'select' \| 'specialist', options? }], preset }]` |
| `preset(key)` / `field(block, key, value?)` | A widget's mock data; reads a field, or with a value returns a copy with the field written |
| `specialists()` | `[{ key, name, role, avatar, initials }]` |
| `colors()` / `formats()` | The DS ground colours (Ink, Sidebar, Paper, Sand, Stage, Warm white, Brown, Orange, Peach); the five formats |
| `exit()` | Leaves the stage |

## Phone and floating (decided)

- **Phone (`device: true`)**: the stage draws the whole phone itself, so the preview and the MP4 are the same pixels. That covers the XS screen (393 x 852), the master frame's look (`--evPhR` 56 round, the `--evPhBz` bezel, no shadow), the status bar (9:41, the island, signal, wifi, battery) and the chat's own head, cloned from the page's `.main > .hd` (menu, title, close: the chat dropped its minimise button, so the video did too). It also covers the thread, the composer (field, +, Eva ▾, send) and the home indicator. The phone is scaled to fit the canvas inside `padding`. The builder draws no frame of its own.
  - **The head's ground** is the chat's: the Top nav master's gradient blur (`.evTnG`, "Top nav always gradient blur by default"). The thread runs up under the head by its height (`--hdH`), and the head takes its scrolled state (`.evTnOn`, the ground 24 px longer) once the thread is under it, set from the time like everything else. The scroll keeps new content below the head.
  - **In `frame()`** (the MP4), the ground's `backdrop-filter` can't be drawn through `foreignObject`. A copy of the thread, blurred 9 px on the page's ground and fading out over the ground's last third, stands in for it under the ground's tint, so the video's head reads as the preview's. The preview's DOM is not touched. The 32 px glass on the head's round buttons is still not drawn in the video.
- **Floating (`device: false`)**: no phone and no ground of the chat's own. Only the thread (bubbles, Eva's answers, avatars, the clinician card, widgets) at the chat's spacing, in a 440 px column scaled to the canvas, its newest message (with its widgets) held at the middle of the frame, the earlier ones going up and out (or the thread up from the foot, or down from the top). No fade: the frame's edge cuts it ("I don't want any kind of blur or fade-out on the top"). "One at a time" (`flow: 'single'`) shows one message at a time in place of the thread. Eva's words and the thinking line take the card ground so they read on a picture. In light theme the cards take the chat's raised surface (the booking card's white and `--bkShadow`).

## Specialists

| key | Name | Role | Avatar |
|---|---|---|---|
| steven | Dr Steven Lu | Preventative Health Doctor | his photo (the app's) |
| sarah | Dr Sarah Chen | Everlab GP | her photo (the app's) |
| maylyn | Dr Maylyn Goh | Everlab GP | MG |
| amelia | Dr Amelia Kerr | Everlab GP | AK |
| joshua | Dr Joshua Martin | Everlab GP | JM |
| edward | Dr Edward Lim | Everlab doctor | EL |
| james | Dr James Okafor | Cardiologist | JO |

`name`, `role` and `avatar` on an item override the library's values. An avatar that is not a picture is used as initials.

## Widgets (`stage.widgets()`: 30)

- **Health**: Biomarker\*, Biomarker trend, Chart\*, Insight\*, Results\*, Protocol\*, Recommendation\*, Reports, Report, Goals, Goal, Image, Images, Citation
- **Services**: Appointment (now with its own title, description and picture), Appointment group, Appointment rows, Specialist\*, Diagnostic\*, Screening\*, Referral\*
- **Actions**: CTA\* (card or buttons only), Booking, Questionnaire\*, Upload\*, Connect wearable\*, Suggestions, Attachments, Doctor's footnote, Check-in header

\* New BLOCK renderers. Each is built from the chat's own card (`.wc`: `--card`, 20 round, 470 wide, full width on the phone), type, `.btn` buttons and `.tdTag` status tags. Each has editable mock data and is shown in the Concierge's Components tab under "Video widgets · Health / Services / Actions", beside "Thinking and typing" and "Specialists".

## Checks

`tools/stage-check.js` (the stage) and `tools/mp4-check.js` (the export, below): serve the repo, then run `NODE_PATH=<playwright> node tools/stage-check.js http://127.0.0.1:<port>/visuals/concierge.html#stage <shots dir>`. It checks four compositions: phone dark 9:16, phone light 16:9 on a blurred picture, floating dark 1:1 on a cropped picture, and floating light 4:3. Each has 7 items.

- `seek(t)` twice gives the same DOM and the same screenshot at 11 times.
- Forward then back gives the same frame. The DOM must match exactly. A few pixels may differ by 1 level of 255 when the compositor re-rasterises.
- Every 30 fps frame from 0 to t, then t, gives the same DOM as jumping to t.
- `seek` takes under 8 ms (measured: about 0.04).
- At the end the thread has scrolled and the last item is in view (on the phone, clear of the head).
- `frame(t)` returns the composition's size and the same pixels twice.
- All 30 widgets draw, and the page throws no errors.

# The builder: Marketing → Chat video builder

- **Where**: the page menu's Asset group → **Marketing** (`#marketing`, also on Home). A slim header names the page and its tools (Chat video builder first; `TOOLS` in the Marketing script takes more). The tool is its own page, `visuals/chat-video.html`, built to `dist/chat-video.html` (about 125 KB, no pictures) and framed by the app. Only the shell, the menu entry and the frame are in `index.html`.
- **Publishing**: the Everlab App - Latest `files` map needs `"chat-video.html": "dist/chat-video.html"` beside concierge.html.
- **Stack**: React 18.3.1 UMD (cdnjs) and htm 3.1.1 (jsdelivr), no build step. Without them the page says so instead of drawing.
- **No second chat UI**: the canvas is `concierge.html#stage` in an iframe, scaled to the chosen format; the builder only edits the composition and calls `Concierge.stage` (`load`, `seek`, `play`, `schedule`, `widgets`, `specialists`, `colors`, `formats`, `field`, `preset`, `normalize`). The widget library's thumbnails come from a second, hidden stage: each widget is drawn floating on a clear ground, `frame()` captures it, and the capture is cropped.

## Layout (the brief's section 12)

| Area | What it holds |
|---|---|
| Top bar | The composition's name, its save state, Undo / Redo, New, Save, Export (MP4 video, Code, Composition JSON, Import JSON), the builder's light / dark |
| Left: Composition | **Sequence**: + Question, + EVA, + Specialist, + Widget, then the rows. Each row has a drag handle (mouse, pen and touch, by pointer events), the type, a preview, its duration and delay, and Edit, Duplicate and Delete. A dot marks the item on screen. **Widgets**: search and Health / Services / Actions, each widget drawn by the real component. **Saved**: the saved compositions (open, Rename, Duplicate, Delete) and the five templates |
| Centre: canvas | The stage in the format's frame, with the resolution, the ratio, phone or floating, and the ground under it. With no items, the templates and "Add a question" |
| Foot: playback | Play / pause, Restart, Loop, 1× / 0.5×, the scrubber with a mark per item (click to jump), the time and the total |
| Right: settings | **Item**: its text (multiline, emoji), name, avatar, typing style, think time, thinking line, reveal, specialist and overrides, the widget's fields, delay, hold, bubble width. **Canvas**: the format (5 and custom), iPhone frame, chat theme, padding, header title or the floating column, zoom, Messages (Thread / One at a time; One at a time moves the anchor to Centre) and the anchor (foot, middle, top); the background (Colour / Image / Video: DS colours, hex, a picture or a video with Fill / Fit / Crop, X, Y, scale, blur and overlay); lead and tail |

- **Blanket** (Canvas → Background, with a picture or a video): a colour laid over it, under the chat (`overlay` 0 to 1, `overlayColor`): the DS swatches, a colour picker and a hex field, and its opacity. Picking a colour with the blanket at 0 sets it to 30%.
- Floating, the name over an answer (Eva's line) is the bubble's opposite: white in light theme, near-black in dark, 2 px over its bubble.
- **The background on the canvas** ("drag the background and increase the background manually"): with a picture or a video behind, drag the canvas to move its focal point (X, Y) and scroll (or pinch) to scale it (scale 1 to 4, in any fit: Fill, Fit or Crop; the Scale slider too, for a picture as for a video). It moves live on the stage, then lands as one edit (one undo step). A click without a drag opens the Canvas settings.
- The stage fills the canvas to its edges: within 1% of the canvas's ratio (its whole-pixel rounding) it scales each way on its own, so no sliver of the page shows at the sides.
- Selecting a row jumps the playhead to the moment it is fully in. Editing an item redraws the canvas and holds it there.
- Empty timing fields are **Auto**: the stage's motion defaults, shown as the hint ("Auto · 0.4 s").
- **Keyboard**: Space play / pause, Delete removes, Cmd/Ctrl+D duplicates, Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo, Cmd/Ctrl+S save, ↑ / ↓ select, Alt+↑ / ↓ move, Esc deselect.

## Storage (the app's capabilities, each null outside the artifact)

| What | In the artifact | Elsewhere |
|---|---|---|
| Saved compositions | `db`, collection `chatVideos`, one document `{ v, name, updated, comp }` each, shared by the team (live) | `localStorage` `everlab:chatVideos` |
| Background pictures | `assets.upload`, kept as `/_blob/<id>` in the composition | a data URL, scaled to 1920 px |
| Background videos | `assets.upload` (20 MB at most), kept as `/_blob/<id>` | a `blob:` URL, for this session only (the builder says so) |
| Files (code, JSON, the video) | `downloads.save` (the viewer confirms) | a plain download link |
| The draft being edited, the builder's theme | `localStorage` (`everlab:chatVideoDraft`, `everlab:chatVideoTheme`) | the same |

- A composition over 240 KB (a large picture kept as a data URL) is saved in this browser, with a note. A viewer who cannot write to the artifact cannot upload pictures.
- The downloads capability takes `.txt`, not `.tsx`: in the app the module comes as `<name>.tsx.txt`.

## Code export (section 17)

- **React + TypeScript**: one self-contained `.tsx`. It holds the model's types; `UserMessage`, `EvaMessage`, `SpecialistMessage`, `Widget` and a named component for each widget used (`BiomarkerWidget`, `CtaWidget`, ...); `compositionOf(props)`, which turns the tree into the composition; and `ChatVideo`, which loads it in the Everlab stage by `postMessage`, so it works across origins (`stageSrc`, default `concierge.html#stage`). The default export is the composition as a tree. It type-checks under `tsc --strict` with `@types/react`.
- **Composition JSON**: the composition itself, to import here again or to load in the stage.
- **Import JSON**: paste or open a file; the stage makes it whole (`normalize`), and it opens as a draft. Over an unsaved draft the dialog closes first, so the Saved panel's "Save it before opening another one?" can be seen.

## The page's API

- `window.ChatVideo` has `comp()`, `setComp(c)`, `stage()`, `schedule()`, `saveFile(name, data, mime)`, `cap(name)`, `toast(msg)`, `toTsx(c?)`, `exportMp4(o)` and, after an export, `lastExport`.

## MP4 export (section 16)

Export → **MP4 video**. One rendering system: the frames are the stage's own, so the video is the preview.

- **The renderer**: a stage of its own (`concierge.html#stage` in a hidden frame at the composition's size, `fit(false)`), so the builder's preview stays free. For each frame `i` it calls `stage.frame(i / 30 s)`: `seek(t)`, then the stage's DOM and CSS drawn through an SVG `foreignObject`, with the background, the phone and every picture in it. The frame is laid on an opaque canvas (the background colour under it), cropped to an even size.
- **Size and rate**: the composition's own size (1920 × 1080, 1080 × 1920, 1080 × 1080, 1440 × 1080, 1080 × 1440, or the custom size rounded down to even), 30 fps. `N = ceil(duration × 30)` frames, so the video lasts the composition (lead and tail included).
- **Encoding**: WebCodecs `VideoEncoder`, variable bitrate, a keyframe every 2 s. About 10 Mbps for 1080p (4 to 12 Mbps by size). In the app the bitrate is also capped so the file fits the downloads capability's 16 MB; a file still over it is encoded again, smaller (twice at most).
- **Codec, in order**:
  1. **H.264 by the browser** (WebCodecs `VideoEncoder`: `avc1.6400xx` High at the level the size needs, then Main, then Baseline) into an **MP4** with `mp4-muxer` 5.2.2 (fast start). Chrome, Edge and Safari on a Mac or PC do this, in hardware where there is one.
  2. **H.264 in software** when the browser has no H.264 encoder (Chromium builds without the proprietary codecs, as headless Chromium is; some Linux browsers): `h264-mp4-encoder` 1.0.12 (WebAssembly, H.264 Baseline, writes the MP4 itself), loaded from jsdelivr only then (1.7 MB). Each frame's pixels go in; quality is set by QP 24, speed 6, a keyframe every 2 s. About 5 s of work per second of 1080p video. The dialog says it takes longer. If the page's security policy refuses its WebAssembly, the export moves on.
  3. **VP9 in WebM** (`webm-muxer` 5.1.4), then VP8, and the dialog says so.
  4. **MediaRecorder** on the canvas, without WebCodecs. The recorder is paused while each frame is drawn and runs for 1/30 s of recorded time per frame, so a slow frame no longer stretches the video; its length can still be off by a few frames (5.12 s for 5.03 s in the check). The format is what the browser records (MP4 or WebM, the codec named when it says).
  - The libraries are pinned UMD builds from cdn.jsdelivr.net (`Mp4Muxer`, `WebMMuxer`, `HME`): the two muxers load with the page, the software encoder on demand; one that failed to load is asked for again at the next export.
- **The dialog**: size, frame rate, length and format; a live thumbnail of the frames; a bar with **Frame n / N**, the per cent and the time left; **Cancel** (or Esc). When it is done: the file's size and time taken, then **Download MP4** (Download WebM on the fallback). The builder's shortcuts wait while it is open.
- **Saving**: `downloads.save` in the app (the viewer confirms), a plain link elsewhere.
- `exportMp4({ comp?, saveFile?, toast?, prefer? })` returns the result (`{ blob, filename, mime, codec, label, container, encoder: 'WebCodecs' | 'software' | 'MediaRecorder', w, h, fps, frames, duration, bitrate, bytes, renderMs, msPerVideoSecond }`, also `ChatVideo.lastExport`), or null when cancelled or failed. `prefer` (the checks): `'vp9-mp4'` puts VP9 in the MP4 first, to run the WebCodecs MP4 path in a browser without H.264; `'soft'`, `'webm'` and `'mr'` start from that fallback.
- **Over 16 MB** in the app: the bitrate is lowered (WebCodecs) or QP raised by 5 (software), and the video made again, twice at most.
- **Known gaps**: a video over 20 MB, or one picked without the assets capability, lives for the session only (a `blob:` URL); a video in a codec the browser can't play (H.264 in headless Chromium) shows no frames; a background picture on another host whose fetch is blocked comes out blank; the glass blur behind the phone header's round buttons (`backdrop-filter`) is not drawn by the SVG route (the head's ground is: see Phone); Safari may refuse a canvas drawn from an SVG `foreignObject` (it would then fail with a message). 60 fps and 4K are later.

## The export's check (`tools/mp4-check.js`)

It runs each path in headless Chromium on a 5 s composition with 3 items, clicks the dialog's Download, saves the file and reads it with ffprobe. The CDN libraries come from the npm registry's copies of the same versions (`tools/.libcache`, not committed), so it runs where the CDNs can't be reached. Measured on dist/chat-video.html:

| Path | File | ffprobe | Made in |
|---|---|---|---|
| default here (no H.264 encoder in this Chromium): software | `check-phone-9-16.mp4`, 241 KB | h264 Baseline, 1080 x 1920, 5.033 s, 151 frames | 24 s |
| software, floating light 16:9 | `check-floating-16-9.mp4`, 257 KB | h264 Baseline, 1920 x 1080, 5.033 s, 151 frames | 24 s |
| `prefer: 'vp9-mp4'` (WebCodecs, mp4-muxer) | `.mp4`, 578 KB | vp9, 1080 x 1920, 5.033 s, 151 frames | 6 s |
| `prefer: 'webm'` (WebCodecs, webm-muxer) | `.webm`, 547 KB | vp9, 1920 x 1080, 5.0 s, 151 frames | 7 s |
| `prefer: 'mr'` (MediaRecorder) | `.mp4`, 552 KB | vp9, 1080 x 1920, 5.12 s, 151 frames | 11 s |

- Esc during the frames cancels: `exportMp4` resolves null and the dialog and the renderer's frame go.
- The H.264-by-the-browser path can't run here (no encoder in this Chromium). It is the same code as `'vp9-mp4'` with the `avc` track; check it in Chrome or Safari: Export → MP4 video, then Download MP4.
