# AI Chat Video Builder: the stage (renderer)

Marketing → AI Chat Video Builder. Julien's brief: "I write the conversation and choose the components. The tool handles the design and animation."

This page documents the **renderer**: the stage mode of `visuals/concierge.html` (built to `dist/concierge.html`). It is the only thing that draws a composition, for the builder's live preview and for every frame of the MP4. The builder (`visuals/chat-video.html`) is a composition layer around it: it edits the JSON, and it never draws a bubble itself.

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
        scale: number;               // crop only, 1 = as fitted
        blur: number;                // px
        overlay: number;             // 0..1 of overlayColor over the picture
        overlayColor: string; color?: string };               // color: the letterbox under 'fit'
  device: boolean;                   // true: the phone; false: floating
  padding?: number;                  // canvas px kept clear (default 7% of the shorter side)
  theme: 'dark' | 'light';
  lead?: number;                     // ms of empty chat before the first item (500)
  tail?: number;                     // ms held after the last item (1500)
  column?: number;                   // floating: the thread's width in chat px (440)
  zoom?: number;                     // floating: a scale on top of the fitted one (1)
  anchor?: 'bottom' | 'top';         // floating: the thread grows up from the foot (bottom) or down from the top
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
- `typing: 'text'` types the words into the composer. That needs the phone; floating falls back to `'dots'`.
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

- **Phone (`device: true`)**: the stage draws the whole phone itself, so the preview and the MP4 are the same pixels. That covers the XS screen (393 x 852), the master frame's look (`--evPhR` 56 round, the `--evPhBz` bezel, no shadow), the status bar (9:41, the island, signal, wifi, battery) and the chat's head for an open conversation (menu, title, minimise, close). It also covers the thread, the composer (field, +, Eva ▾, send) and the home indicator. The phone is scaled to fit the canvas inside `padding`. The builder draws no frame of its own.
- **Floating (`device: false`)**: no phone and no ground of the chat's own. Only the thread (bubbles, Eva's answers, avatars, the clinician card, widgets) at the chat's spacing, in a 440 px column scaled to the canvas, anchored at the foot. The top edge fades out under 56 px. Eva's words and the thinking line take the card ground so they read on a picture. In light theme the cards take the chat's raised surface (the booking card's white and `--bkShadow`).

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

`tools/stage-check.js`: serve the repo, then run `NODE_PATH=<playwright> node tools/stage-check.js http://127.0.0.1:<port>/visuals/concierge.html#stage <shots dir>`. It checks four compositions: phone dark 9:16, phone light 16:9 on a blurred picture, floating dark 1:1 on a cropped picture, and floating light 4:3. Each has 7 items.

- `seek(t)` twice gives the same DOM and the same screenshot at 11 times.
- Forward then back gives the same frame. The DOM must match exactly. A few pixels may differ by 1 level of 255 when the compositor re-rasterises.
- Every 30 fps frame from 0 to t, then t, gives the same DOM as jumping to t.
- `seek` takes under 8 ms (measured: about 0.04).
- At the end the thread has scrolled and the last item is in view.
- `frame(t)` returns the composition's size and the same pixels twice.
- All 30 widgets draw, and the page throws no errors.
