# Flows and modals: Step flow, Modals, Full modal / evSolo, stacking, swipe, Dismiss, EvFullView, Consent, Loading states

All anchors are in `index.html` unless named. Line numbers drift; grep the pattern. Most masters here live in the Health profile script/style blocks (~18800-21950), which `tools/build-hp.js` carries into `dist/health-profile.html`.

---

## Step flow (`window.EvSteps`)

**What.** The master of every flow taken a page at a time: shell (header with Back, two-line title, Close; segmented progress; body; full-width pill footer), the progress bars, and the left/right push between steps. Used by the Async report (shell + progress + push) and the Health profile step pages (progress "stages" + push; its own header).

**Where.** `grep -n "window.EvSteps = "` (~19545); progress CSS `grep -n "arStepsBar\|arStepWrap"`; doc `grep -n "const sfDoc"` (`SF_C` controls, `SF_P` demo pages, CSS `.sfLive`). Tab `'sf'`, `#step-flow`. Top bar Save → `EvSteps.save`.

**API.** `window.EvSteps = { M, D, K, progress(n), push(old, nw, dir, k), look(), cls(o), shell(p), ease:{in,out}, set(k,v), save(), reset() }`.
- `progress(n)` → `{ el, n(), set(i[, n]), part(k, f[, n, text]) }`: `el` is `div.arSteps[role=progressbar]` with `.arStepsBar.arStepsBase` + `.arStepsFill > .arStepsBar`; `set` lights current and earlier, aria-valuetext "Step i of N"; `part` = k stages whole plus fraction f of the next (HP). Fill is a clip-path inset using `var(--sfGap)`.
- `push(old, nw, dir, k)`: `nw` from opacity 0 + translateX(±dist) over dur·k after lag·k, ease `cubic-bezier(.16, 1, .3, 1)`, fill backwards; `old` to opacity 0 translateX(∓dist) over out·k, ease `cubic-bezier(.4, 0, 1, 1)`, fill forwards; returns old's Animation (caller removes old). `dir > 0` = Next.
- `look()` reads Tweaks `#stArBar` (`'grad'`|solid), `#stArFoot`, `#stArCard` (`'outline'`|fill); blur always false. `cls(o)` → `' arBarGrad' ' arFootGrad' ' arNoBlur' ' arCardsFill'`.
- `shell({ root, head, stepWrap, body, foot, cta, o, on, later })` → `{ fitG, edge }`: gradient bar (`span.arGround`, `--ar-head-h`, `--ar-gs`, `--ar-ge`, `.arScrolled` at scrollTop > 2), gradient footer (`span.arFootGround`, `--ar-foot-h`, `--ar-fs`, `--ar-cta-b`, `--ar-fe`), solid edge (`.arEdge`, `--ar-tf`/`--ar-bf` 0..24px).
- Tokens on `<html>`: `--sfBar`, `--sfGap`, `--sfPad`.

**Rules.** `M = { dist: 20, dur: 220, out: 130, lag: 75, bar: 3, gap: 4, pad: 12 }`. Saved key `everlab:sfMaster` (finite numbers only), read on every load over Tweaks. Controls: dist 0-64/2, dur 40-800/10, out 40-600/10, lag 0-300/5, bar 1-8, gap 0-12, pad 0-24. Fill transition clip-path .5s `cubic-bezier(0, 0, .2, 1)`; segment corners 4; base opacity .12. Doc anatomy: header row 40 high, 58 down on XS (discs at 60), 44 on S, 16 on desk; Back/Close drawn 44 (the Top nav master's discs, forced by `.arHeadRow > .arIconBtn` 44px; the doc's anatomy row still says 36) ink 6%, icons 18/16; on desk Back and Close 24 from the frame's edges (the bar spans the screen); title 14/18 over 12/16 ink 50%; step title 28/29.6 weight 570, 24 under progress; intro 16/22 ink 56%; footer pill 56, 16 + 34 home indicator on XS; desk column 584 at M, 616 at L/XL (the 2xs container 544 / 576 inside 20 sides; the `BPS` frame captions still say 536 / 568); Back hidden on a flow's first page; reduced motion: no push. Doc frames: xs 393x852, s 600x860, m 992x720, l 1440x900, xl 1920x1080 (drawn as L). Viewer pref `everlab:sfBp`. Doc "Slow" = push(..., 4).

**How to use.**
```js
var p = window.EvSteps.progress(n); wrap.appendChild(p.el); p.set(i);          /* Async report stepIndicator */
var prog = window.EvSteps.progress(3); prog.part(k, frac, 3, label);            /* HP stages */
root.className = 'arSheet ...' + window.EvSteps.cls(o);
window.EvSteps.shell({ root, head, stepWrap, body, foot, cta, o, on, later });
out = window.EvSteps.push(ghost, nw || body, f ? 1 : -1);                       /* report */
const arLk = window.EvSteps.look();
```

**Pitfalls.** Never re-implement a push or progress (the HP and report copies were removed). The caller owns the leaving page: position it absolutely where it stood, and cancel/remove any page still leaving before pushing again (sfDoc `go1`: remove `.sfOld` first). The HP variant uses `--sfBar`/`--sfGap` but not `--sfPad`, and has its own header. The welcome/last page "rise" is not this push. The doc rebuilds on `#stArBar/#stArFoot/#stArCard` and theme; call `fitG`/`edge` again when the page changes.

**Being reworked.** Desk panels (#270) may change the desk column. The flows keep their own `.arHeadRow` (progress rides in it), not `EvTopNav` markup.

---

## Modals doc (Design system > Modals)

**What.** Three types with live demos at XS/S/M/L: **Full** (covers the viewport), **Bottom sheet · Floating** (sheet on XS/S, floating modal on M/L), **Full bottom sheet** (layer 1 overlaps; layer 2+ stacks iOS-style; tall floating on desk). Hosts the Dismiss On/Off master and its Save setup.

**Where.** `grep -n "const mdDoc"` (TX spec tables, Dismiss control, Save); CSS `grep -n "\.mdFr\|\.mdStack"` (~7280-7340). Tab `'md'`, `#modals`. Top bar Save → `EvDismiss.save`.

**API.** Tabs `[data-md]=full|sheet|stack`; breakpoint `[data-mdbp]=xs|s|m|l`; layers `[data-mdl]=1..3` (phone only); Dismiss `[data-mddis]=on|off` (`EvDismiss.set`, live); `.mdPlay`, `.mdShut`, `.mdSave`. Panels bind `window.EvSheetSwipe(p, ..., { handle: '.mdGrab, .mdSh', scrim: () => fr.querySelector('.mdScrim'), skip: '.mdIc', when })`. `setLay(n)` toggles `.up/.back/.gone` and inert.

**Rules.** Frames xs 393x852, s 600x800, m 992x700, l 1440x860. **Full**: XS/S rises 64 and fades (transform 500 ms `cubic-bezier(.2, .8, .2, 1)`, opacity 350 ms ease); M/L fades 380 ms; nav bar 76 (44 circles, ink 7%, title 18/24) phone, 64 (32 circles) desk; title 24/30 phone, 20/26 desk; CTA 56 pill, 34 home indicator, desk column 544; dismiss Close/Back/system back (phone), Close/Back/Escape (desk). **Bottom sheet · Floating**: full width, 28 top corners, hugs content up to 64 under the top; desk `min(viewport - 48, 544)`, 28 corners, centred; ground #181818 dark / white light; padding 8 · 16 · 34 (desk 24); title 24/30 500 + Close 32; buttons stacked 56 pills 8 apart (desk side by side); scrim black 62% 300 ms; enter 500 ms `cubic-bezier(.2, .8, .2, 1)` (desk rises 24 + fade, 450/300 ms). **Full bottom sheet**: 32 top corners, top 62 down; desk up to 720 high, 28 corners; layer 1 blanket 72%, nothing draws back; layer 2+: sheet behind translateY -12 · scale .92 · 35 corners · 80% · content gone; enter 400 ms `cubic-bezier(.32, .72, 0, 1)`, scrim 300 ms. Sheet becomes floating from M. Viewer prefs `everlab:mdPart/mdBp/mdLay`; master `everlab:mdMaster` (dismiss only).

**How to use (which one).** Full for a flow/page of its own (questionnaire, profile, report) → `.aqWrap.aqDesk.aqFull` or `evSolo`. Bottom sheet · Floating for a short task/question (leave question, welcome, consent on desk). Full bottom sheet for long content over a page that keeps its place (report detail, service sheets, consent on phone, marketplace service, cart). Every phone bottom sheet binds EvSheetSwipe and wears the EvDismiss notch.

**Pitfalls.** The demo is its own markup (`.mdPanel/.mdFull/.mdSheet/.mdStack`), not the app's sheet code; only EvDismiss and EvSheetSwipe are shared. The app's Full modal (`.aqFull`) and stack (iosStk script) carry the same numbers by hand: change both, or better move the demo onto app code. Dismiss Off keeps the notch's room (title 28 under the sheet top either way). The Dismiss control hides on M/L and on Full.

**Note.** Since the Top nav master (#260, merged) the app's full modals draw their bar with `EvTopNav` (references/layout.md); the Modals doc's own `.mdNav` numbers (76/64, 44/32) are a hand-made demo. **Being reworked**: desk panels (#270).

---

## Full modal shell (`.aqWrap.aqDesk.aqFull`) and `evSolo`

**What.** The Full modal: a page of its own over the app (Health profile, Async report, Concierge, Suggestion, Doctor's suggestion, Personal recommendation). `evSolo` is the shell factory for the standalone full modals: `.aqWrap.aqDesk.aqFull.evSolo` with an `.arSheet.sgmSheet` (head with title + close/back, scroller `.sgmScr`, pinned footer `.arFoot.sgmFoot`).

**Where.** CSS `grep -n "aqWrap.aqDesk.aqFull .aqFrame"` (~5805); evSolo CSS `grep -n "\.sgmCol\|--sgmSide"`; factory `grep -n "const evSolo"` (~36783); `window.__soloClose`; `html.evCover`. Instances `window._sug`, `window._dsg`, `window._prc`.

**API.** `const evSolo = cfg => api` (local to the app script, not on window). cfg: `on` (body class), `cls` (wrap class), `key` (menu value), `hash`, `label`, `sheet`, `title` (string or fn; `''` = content carries its own h2 `id=key+'T'`), `back` (fn → Back chevron instead of Close), `body()`, `foot()`, `mount(sheet, api)`, `unmount`, `paint`, `enter(sheet, api)`, `still(sheet, api)` (reduced motion), `click(e, sheet, api)`, `tweaks: [ids]`, `replay: id`. Returns `{ open(), close(now), replay(), remount() }` plus `api = { isOpen, reduced, optV, dark, rise(el, y, delay, dur), push(anim), el() }`. Wrap: `.aqDim`, `.aqFrame`, `.aqStat` (status bar copied from `#bpFrame .bpStatus`). Classes `.on`, `.shut`, `aqBpXS/S/M/L`, `.aqDev` (forced XS/S), `.aqInk` (light). The head is the Top nav master, variant C (`EvTopNav.html({ back, close, cls: 'sgmNav' })`, `EvTopNav.watch(.sgmScr, .sgmNav, #<key>T)`: `.evTnOn` / `.evTnTitled`); the title is the body's `h2.sgmT.evTnH1`; the body column `.sgmCol[data-container="2xs"]`; tokens on `.arSheet.sgmSheet` `--evTnTop` (54 on XS), `--evTnX` (`--sgmSide`, 24 desk). `.sgmHead` is only the fallback when `EvTopNav` is missing.

**Rules.** `.on` after two rAFs; focus into the sheet after 540 ms. `rise()` default 780 ms `cubic-bezier(.16, 1, .3, 1)`. Close: `.shut`, ends after 580 ms (`now` = at once). Desk dismiss: `.arClose`/`.sgmNot`, Escape (not while `.tkShotM` or a Chat `.ccOn` is over it); Tab trapped in the sheet. Closes at once on `everlab:mode`. Frame paper from `--ar-paper`. Hashes `#suggestion`, `#doctors-suggestion`, `#personal-recommendation`. `html.evCover` hides the page under a covering full modal 0.7 s after it is up (never for `.hpBs` sheets). No saved setup.

**How to use.**
```js
m = evSolo({ on: 'sugOn', cls: 'sugWrap', key: 'sug', hash: '#suggestion', label: '...', sheet: 'sgmSug',
             title: () => pc() ? '' : '...', back: pc, tweaks: [...], ... });
window.__soloClose();                                /* close all from another page */
window.EvLoad.label(go, 'Processing');               /* its CTA loader (.dsgGo) */
```

**Pitfalls.** A new standalone full modal goes through `evSolo` and joins `__soloClose`'s list `['_sug', '_dsg', '_prc']` and the page-switch hides. Full modal on the phone is up 64 + fade, not a full-screen slide. The page under must not paint once covered (`html.evCover`). Full modals have no swipe-down: never bind EvSheetSwipe to them.

**Being reworked.** "Chat top bar controls to full-modal top nav size" (#273); desk panels (#270).

---

## Full bottom sheet stacking (layer 1 overlap, layer 2+ iOS stack)

**What.** Almost-full sheets over a phone screen (`.tlSheet`, `.shWrap`): layer 1 overlaps the page under a 72% blanket; a sheet opened over another stacks, the one behind drawn back as a card on black, status bar white.

**Where.** Script `grep -n "iosLay1"` (the KINDS list `[['tlSheet', '.tlShPanel', '.tlShDim'], ['shWrap', '.sheet', '.shDim']]`, near the file's end); CSS `grep -n "\.iosStk\|iosStkIn"` (~9030).

**API.** Automatic: a `.tlSheet`/`.shWrap` with `.on` in a phone screen (wrap < 640 wide), starting in its top 14% and full width, gets `.iosLay1` (first) or `.iosStk` (over another); `body.iosStkOn`; `--stkDur` from the panel's own transform transition; `--stkTop`.

**Rules.** Layer 1: blanket black 72%, nothing draws back, grabber only while Dismiss is on, 32 top corners. Layer 2+: scrim rgba(0,0,0,.22) + `::before` card at left/right 4%, top `var(--stkTop, 40px)`, 32 corners, ground color-mix 64% with #000, `iosStkIn .12s linear` after `var(--stkDur, .4s)`; status bar white with the same delay.

**How to use.** Open sheets with the existing `.tlSheet`/`.shWrap` structures; the script stacks them. The marketplace's locked service sheet (`.svLkM`) over the steps sheet gets z-index 31.

**Pitfalls.** The screen behind empties only at the end of the slide (black/card wait `--stkDur`; removed at once on shut). The Async report's sheets do their own two layers. The Modals doc's stack demo is a separate implementation.

---

## Swipe down to dismiss (`window.EvSheetSwipe`)

**What.** One helper for every phone bottom sheet: the panel follows the finger from its grabber/header (or its body when scrolled to top), the scrim lightens; past threshold or a flick it closes via the sheet's own close, otherwise springs back.

**Where.** `grep -n "window.EvSheetSwipe = "` (~19604; `.auto` and the auto families just after); `window.evK` just before; CSS `.evSwiping`.

**API.** `window.EvSheetSwipe(panel, close, opts)` → `{ off() }` (stored as `panel._evSw`; a second call returns the existing binding, new opts ignored). opts: `handle` (selector), `scrim` (element or fn), `skip` (selectors that never start a drag), `when()` (gate; default `/^(xs|s)$/` on `body.dataset.bp`), `threshold` (80; alias `min`), `can` (alias of when), `move` (element/fn to translate instead), `out: 'slide'`. `EvSheetSwipe.auto(fams)`: binds lazily on first pointerdown; fam `{ wrap, panel, dim, x, handle, skip, geo }`. `.evSwiping` while dragged.

**Rules.** If `EvDismiss` is off: no drag at all. Never starts on input, textarea, select, `[contenteditable="true"]`, `[data-noswipe]`, `.evNoSwipe`, or `skip`. From the body only when no ancestor scroller is scrolled. Starts after 6 px; abandons if moving up or more across than down. Closes at dy > 80 or velocity > .5 px/ms with dy > 24. Spring back transform .32s `cubic-bezier(.16, 1, .3, 1)`, scrim .32s. `out:'slide'`: .24s `cubic-bezier(.4, 0, 1, 1)` to translateY(h + 40), close() after 200 ms. Scrim opacity = 1 − dy / height. Styles `!important`. Scaled frames handled (rect height / offsetHeight). Eats the click after a drag. Auto families: `.tlSheet/.tlShPanel/.tlShDim` (x `.tlShX, .mkDetX`, handle `.tlShGrab, .tlShHead`, geo), `.shWrap/.sheet/.shDim` (x `.shClose`, handle `.shHandle, .rsTop, .oaTop`, geo), `.ibWrap/.ibCard/.ibDim` (x `.ibX`, handle `.ibHandle, .ibHead`).

`window.evK(el)` returns how much smaller `el` is drawn than its CSS pixels; other drags (carousels, the organ ages sheet, hero carousels) divide screen pixels by it so content follows the finger in a scaled XS device.

**How to use.**
```js
window.EvSheetSwipe(pkP, function () { shut(true); },
  { handle: '.hpPkGrab, .hpPkH', scrim: pkDim, skip: '.hpPkX', when: function () { return !!sheet; } });   /* HP pickers */
window.EvSheetSwipe(w.querySelector('.mvStack'), close,
  { scrim: w.querySelector('.mvScrim'), skip: '.mvX', out: 'slide', when: () => w.classList.contains('on') });   /* More */
```

**Pitfalls.** One helper only (the cart's copy was merged back). Pass a `when` that is false on the desk / when shut (desk modals have no swipe). Always pass `skip` for the close and a `handle`. Binding is once per element; re-rendered panels need a fresh bind (`.off()` the old). Sheets whose exit isn't a transform need `out:'slide'`. New families go into `EvSheetSwipe.auto` (geo for almost-full) and their grabber into the `html.evDisOff` hide list. Full modals have no swipe. iframes (Gift referral) are bound from the parent on load. Don't re-check Dismiss in callers' `when()`.

---

## Dismiss master and notch (`window.EvDismiss`, `.evNotch`)

**What.** The app-wide Dismiss setting for bottom sheets: On (default) = every phone bottom sheet wears a notch and swipes down; Off = no notch (room kept), no swipe, Close and scrim only. Also the shared notch element.

**Where.** `grep -n "window.EvDismiss = "` (~19664); CSS `grep -n "\.evNotch\|html.evDisOff"` (~9040-9050); HP copy `.hpConfP > .evNotch`; consent `.ecGrab`. Doc: Modals Dismiss control + Save.

**API.** `window.EvDismiss = { K: 'everlab:mdMaster', on(), set(v), save(), notch(el) }`. `set` toggles `html.evDisOff` on the page and same-origin iframes and dispatches window `evdismiss` (detail `on`). `save` merges `{ dismiss: 'on'|'off' }`. `notch(el)` inserts `<i class="evNotch" aria-hidden>` as first child unless present. Tokens `--evNotchC` (line colour: `:root` rgba(255,255,255,.08); `body.light` rgba(17,17,17,.1); `#dPlan`/`.plLight`; `.arSheet`/`.arDark`; `.ecWrap`/`.ecDark`), `--evNotch` override (rgba(255,255,255,.6) over a picture: `.svLkM`, `.lkHero`, `.mkDet`).

**Rules.** Read on every load (module init) over Tweaks; the doc is the only place to set it. Notch 36 x 4, radius 2, `background: var(--evNotch, var(--evNotchC))`, absolute, top 8, centred (margin-left −18), z-index 6, 12 above the header. Off hides (opacity 0, visibility hidden, no pointer events, room kept): `.evNotch .tlShGrab .shHandle .ibHandle .arQaGrab .ecGrab .hpPkGrab .bmdOvG .plPMdGrab .plNShGrab .mdGrab` (and the referral's `.grab`). Desk floating modals have no notch. The standalone Health Profile (other origin) keeps On.

**How to use.**
```js
if (window.EvDismiss) window.EvDismiss.notch(w.querySelector('.mvCard'));        /* More sheet */
if (window.EvSheetSwipe && window.EvDismiss) window.EvDismiss.notch(panel);      /* HP leave question */
const swipeOn = !window.EvDismiss || window.EvDismiss.on();
```

**Pitfalls.** One notch colour (`--evNotchC`); never hard-code a grabber size/colour. Off hides, never `display:none`. A sheet with its own grabber class joins the `html.evDisOff` list and draws from `--evNotchC`. `.evNotch` app CSS is in the main style block, the HP standalone draws `.hpConfP > .evNotch` itself: keep both in sync.

---

## Modals cover the full viewport (`window.EvFullView`)

**What.** A modal opened from a page covers the whole app window (sidebar included) on the desk; re-fits on resize. On the phone it clears its inline geometry.

**Where.** `grep -n "window.EvFullView = "` (~19533). Belongs to Modals (no tab of its own).

**API.** `window.EvFullView = { cover(el), fit(el) }`. `cover` remembers and fits; `fit` sets position fixed and left/top/width/height to `.dash`'s rect on the desk, clears them at `body[data-bp]` xs|s. Window resize re-fits held elements still connected and not hidden.

**How to use.**
```js
det.hidden = false; if (window.EvFullView) window.EvFullView.cover(det);       /* Plan nutrition detail */
pStage.appendChild(el); if (window.EvFullView) window.EvFullView.cover(el);    /* Plan medication modal */
```

**Pitfalls.** Call `cover()` after the element is in the DOM and unhidden. No release on close (the held list cleans itself on resize). Desk panels (#270) may change `.dash` geometry: verify after it merges.

---

## Consent (`window.EvConsent`)

**What.** Terms in a full bottom sheet on narrow hosts (< 600) with grabber, page identifier, close and a marketing title; a centred modal on wider hosts. "I consent" unlocks only after reading to the end; "I do not consent" asks first in place (red alert + Cancel / Yes, I do not consent). Escape, close or scrim closes with no answer.

**Where.** `grep -n "window.EvConsent = "` (~19796); CSS `grep -n "\.ecWrap"` (in the HP style block). Page: General patterns > Consent (`'cn'`, `#consent`, `cnOpen`/`cnShow`). Not a Design system tab.

**API.** `window.EvConsent.open(host, { id, title, body, appt, dark, mode, top, still, readonly, onConsent, onDecline, onClose })` → `{ el, close(), kill() }`. Host must be positioned. `mode` `'sheet'|'modal'` (else `host.clientWidth < 600` → sheet); `still` (doc stills; `'decline'` = question shown); `readonly` (one Close); `top` → `--ecTop`; `body` = paragraph strings; `appt` fills "Declining consent may prevent us from proceeding with your {appt}…"; `id` default "Terms and Conditions"; `title` default "Please give your consent to continue.". `kill()` removes at once, no callback. Tokens `--ecBg --ecInk --ecMut --ecLine --ecChip --ecDis --ecDisFg --ecScrim --ecRed --ecRedFg --ecAlBg --ecAlT --ecAlP --ecTop`.

**Rules.** Read-to-end: `scrollTop + clientHeight >= scrollHeight - 8`. Sheet: height `calc(100% - var(--ecTop, 64px))`, padding 8 16 `calc(16px + max(var(--evHome, 0px), safe-area))`, 20 corners, transform .42s `cubic-bezier(.32, .72, 0, 1)`, dark scrim .72. Dialog: `min(800px, 100%)` x `min(720px, 100%)`, 20 corners, padding 20 24 24, opacity .22s + scale(.96) .3s. Close delay 380 / 240 ms. Header id 16/20 570; title 26/30 570; buttons 56 pills 16/18 570, 2 columns gap 8; dark ground #181818. Focus trap; Escape → onClose. Sheet swipes via EvSheetSwipe `{ handle: '.ecGrab, .ecHead', scrim, skip: '.ecX' }`.

**How to use.**
```js
cnM = window.EvConsent.open(dev, { id: 'Terms and Conditions', appt: 'onboarding consult', dark: !cnLight(),
  top: xs ? '56px' : '24px', onConsent: ..., onDecline: ..., onClose: ... });
```

**Pitfalls.** Use `kill()` (not `close()`) when redrawing. Inside the HP sheet `--ecTop` = `--ar-head-top` + 8. Title and CTAs stay the Health profile's style (26/30 570; 56 pill). A Design system Consent tab, if added, builds from `EvConsent.open(..., { still })`.

---

## Loading states (`window.EvLoad`)

**What.** One module for every wait: **Simple** (spinner replaces the button content; optional slow label after 5 s; success tick + word), **Loader with label** (spinner + action word on a quieter button), **Multi-step** (overlay with spinner, step line, node track).

**Where.** `grep -n "window.EvLoad = "` (~19747); CSS `grep -n "\.evSpin\|\.evBusy\|\.evMs"` (HP style block); doc `grep -n "const ldDoc"`. Tab `'ld'`, `#loading-states`.

**API.** `window.EvLoad = { label(btn, text) -> restore(), simple(btn, { slow, after }) -> done(ok?) (+ done.slow()), multi(host, steps, { step }) -> { el, done: Promise, stop() } }`. `label` hides the children in `span.evBusyO`, adds `span.evBusyL` (i.evSpin + text), `.evBusy`, disabled, aria-busy, min-width = current width. `simple`: `.evBusyS`, spinner only; `slow` text after `after` (5000); `done('Saved')` shows the tick + word (`.evOk`) and returns the restore. `multi`: `div.evMs` (role status) with `.evMsRow`, `.evMsT` track, `.evMsF` fill, n+1 `.evMsN` nodes; step default 1100 ms; fades out 380 ms after the last step. Tokens `--evInk`, `--evWash`.

**Rules.** Spinner 14 x 14, 1.5px border, .8s linear (2.4s reduced motion). `.evBusy` rgba(29,26,23,.34) light / rgba(255,255,255,.2) dark, text #fff; `.evBusyS` opacity .42; `.evOk` .56. Multi: inset 0, z 40, blur(14px), .32s; row 14/20 500; track 140 x 8, nodes 6 x 6. Doc: Simple for Next/Continue/Save & continue/inline validation (no layout shift; > 5 s "Hang tight…"); Label for Saving/Submitting/Confirming/Cancelling/Updating; Multi only for high-impact multi-backend operations (payment, checkout, prescription, booking confirmation, report generation, ID verification). Doc frames 393x852, 600x860, 992x680, 1440x900. No saved setup.

**How to use.**
```js
var pb = L.label(cta, 'Processing'); setTimeout(function () { pb(); /* ... */ }, 2000);   /* HP booking */
addDone = window.EvLoad.simple(b);                                                       /* Plan add, 900 ms */
L.multi(dev, x.steps, { step: 1100 });                                                   /* doc checkout demo */
```

**Pitfalls.** Keep the button's width and emphasis; never swap its text by hand. Always call the restore (also on teardown). HP Book uses the label loader "Processing" 2 s (no multi-step, no Booking confirmed page). Stale: ldDoc's Simple "Not used in a flow yet" (it is: Plan add, cart checkout); some comments say "Documentation -> Loading states" though it's a Design system tab. Multi needs a positioned host.
