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

**Rules.** `M = { dist: 20, dur: 220, out: 130, lag: 75, bar: 3, gap: 4, pad: 12 }`. Saved key `everlab:sfMaster` (finite numbers only), read on every load over Tweaks. Controls: dist 0-64/2, dur 40-800/10, out 40-600/10, lag 0-300/5, bar 1-8, gap 0-12, pad 0-24. Fill transition clip-path .5s `cubic-bezier(0, 0, .2, 1)`; segment corners 4; base opacity .12. Doc anatomy: header row 44 high, 58 down on XS, 44 on S, 16 on desk; Back/Close drawn 44 (the Top nav master's discs, forced by `.arHeadRow > .arIconBtn` 44px, `align-self: flex-start`: at the row's top, so 58 / 44 / 16, the desk's the master's 16) ink 6%, icons 18/16; on desk Back and Close 24 from the frame's edges (the bar spans the screen); title 14/18 over 12/16 ink 50%; step title 28/29.6 weight 570, 24 under progress; intro 16/22 ink 56%; footer pill 56, 16 + 34 home indicator on XS; desk column 584 at M, 616 at L/XL (the 2xs container 544 / 576 inside 20 sides; the `BPS` frame captions say so); Back hidden on a flow's first page; reduced motion: no push. Doc frames: xs 393x852, s 600x860, m 992x720, l 1440x900, xl 1920x1080 (drawn as L). Viewer pref `everlab:sfBp`. Doc "Slow" = push(..., 4).

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

**Rules.** Frames xs 393x852, s 600x800, m 992x700, l 1440x860. **Full**: XS/S rises 64 and fades (transform 500 ms `cubic-bezier(.2, .8, .2, 1)`, opacity 350 ms ease); M/L fades 380 ms; nav bar 76 (44 circles, ink 7%, title 18/24) phone, 64 (44 circles) desk; title 24/30 phone, 20/26 desk; CTA 56 pill, 34 home indicator, desk column 544; dismiss Close/Back/system back (phone), Close/Back/Escape (desk). **Bottom sheet · Floating**: full width, 28 top corners, hugs content up to 64 under the top; desk `min(viewport - 48, 544)`, 28 corners, centred; ground #181818 dark / white light; padding 8 · 16 · 34 (desk 24); the sheet header master (below: title 24/30 500 + the compact Close 32, 24 under the top); buttons stacked 56 pills 8 apart (desk side by side); scrim black 62% 300 ms; enter 500 ms `cubic-bezier(.2, .8, .2, 1)` (desk rises 24 + fade, 450/300 ms). **Full bottom sheet**: 32 top corners, top 62 down; desk up to 720 high, 28 corners; layer 1 blanket 72%, nothing draws back; layer 2+: sheet behind translateY -12 · scale .92 · 35 corners · 80% · content gone; enter 400 ms `cubic-bezier(.32, .72, 0, 1)`, scrim 300 ms. Sheet becomes floating from M. Viewer prefs `everlab:mdPart/mdBp/mdLay`; master `everlab:mdMaster` (dismiss only).

**How to use (which one).** Full for a flow/page of its own (questionnaire, profile, report) → `.aqWrap.aqDesk.aqFull` or `evSolo`. Bottom sheet · Floating for a short task/question (leave question, welcome, consent on desk). Full bottom sheet for long content over a page that keeps its place (report detail, service sheets, consent on phone, marketplace service, cart). Every phone bottom sheet binds EvSheetSwipe and wears the EvDismiss notch.

**Pitfalls.** The demo is its own markup (`.mdPanel/.mdFull/.mdSheet/.mdStack`), not the app's sheet code; only EvDismiss and EvSheetSwipe are shared. The app's Full modal (`.aqFull`) and stack (iosStk script) carry the same numbers by hand: change both, or better move the demo onto app code. Dismiss Off keeps the notch's room (title 28 under the sheet top either way). The Dismiss control hides on M/L and on Full.

**Note.** Since the Top nav master (#260, merged) the app's full modals draw their bar with `EvTopNav` (references/layout.md); the Modals doc's own `.mdNav` numbers (76/64, 44) are a hand-made demo. Its sheets' header is the sheet header master's own code (`EvSheetHead.html`, next section). **Being reworked**: desk panels (#270).

---

## Modal context: a modal that takes over owns Tweaks and Flow while it is up (`window.EvCtx`)

**Rule.** While a page over the app or a modal that takes it over is up, Tweaks shows only its groups (none: the Tweaks button hides, and the panel opens again as it goes if it was open) and Flow only its flow panel (none: the Flow button hides); the page's come back when it closes. Its tweaks are the ones its own page shows from the Page menu. The latest up wins (a sheet over a modal over a page: the sheet).

**Where / API.** `grep -n "window.EvCtx = "` (just before `tkPages`); the table of contexts in the `EvCtx.add` list under it and in docs/working-notes.md. `EvCtx.add({ key, label, tweaks: [data-pages keys] or a function of its step, flow: flow-panel key(s), on() })`, `top()`, `cur()`, `key()`, `tweaks(ctx)`, `flow(k)`, `kick()`, `list()`; `html[data-tk]` = the key up; `everlab:ctx` on change. `tkPages` reads `top()` (`[data-tl]` groups are key `tl`, `[data-svc]` key `svc`); every Flow panel asks `window.__flowOk(key)` (`__flowPanel`, the journey, the reveal's timeline, the referral).

**How to use.** A new modal or page over the app: one `EvCtx.add` entry (its `on()` from its open class), its Tweaks group's `data-pages` carrying its key, its flow panel's key in `flow`. A sheet that is a step of a flow (the profile's pickers and consent, a service's steps and Booked in, the Timeline's row sheet, the Plan's Sub pages) is not registered: it keeps its flow's. Re-reads on class changes of the html, the body and the overlays (one frame later) and every 500 ms; no call needed on open or close.

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

## Sheet header master (`window.EvSheetHead`, `.evShHd`; Modals > Bottom sheet)

**What.** The header of every titled bottom sheet and centred sheet modal ("titled bottom sheets = the Modals doc's sheet header, 24/30 title with a compact close"): the title at the left, the compact Close at the right. Not a top nav: a full modal's Back / Close bar is EvTopNav.

**Where.** CSS `grep -n "Sheet header, the master"` (the report sheet's style block, after the Top nav master: the standalone Health profile carries it); JS `grep -n "window.EvSheetHead = "` (after EvTopNav). The Modals doc draws its sheets with it (`SH()` in mdDoc, `.mdSh{--evShPt:24px}`).

**API.** `EvSheetHead.html({ title, tag ('h2'), id, cls, titleCls, close (false = none), closeCls, closeLabel, closeIcon, pre })` → `div.evShHd > (tag.evShT | div > pre + tag.evShT) + button.evShX`; `EvSheetHead.IX`. A sheet with its own markup wears the classes: `.evShHd` on its row, `.evShT` on its title, `.evShX` on its close (keep the old class for its handler and swipe `skip`). Token `--evShPt`: what the sheet already gives above the row (its padding-top, an in-flow grabber); the row adds the rest up to 24. Sides stay the sheet's own.

**Rules.** Row flex, flex-start, gap 12, margin-bottom 8, padding-top `max(0, 24 - --evShPt)`, padding-bottom 0. Title 24/30 500, −0.2, balanced, margin-top 4 (font family and colour the sheet's). Close 32 circle, `color-mix(currentColor 7%)`, glyph 16, position static (wins over the every-dismiss 36 by `html:not(#_m):not(#_d) .evShHd .evShX.evShX`). The row is 24 under the sheet's top on the phone (the EvDismiss notch 8 down, 12 above it: put `.evNotch` on the sheet's grabber so it floats) and on the desk modal (its 24 padding).

**Sites.** `.tlSheet` builders (grabber `.tlShGrab.evNotch`, `--evShPt` 0), `arQa` (20 phone, 24 on the desk modal), `.mkCart` (0 desk, 12 phone: its in-flow grabber), `.ibCard` (10 phone, 24 desk; desk modal 544 · 28 · 24), `.plPMd` / `.plNSh` (8 phone, 24 desk), `bmdOv` (20; its floating desk modal `.bmdFloat`, the Plan's What this moves opener on the desk, 24), `hpPk` and the phone's Medicare example `hpMc.hpPk` (10, their grabber absolute in the HP CSS; the desk's Medicare dialog keeps its own head), Organ ages / Your debriefs / Insights (`.shHandle.evNotch`, 0), EvConsent (`.ecHead.evShHd`, 8 sheet / 20 dialog; `.evShT` only on the dialog's title; the phone's identifier stays 16/20 with the 26/30 title in the text). Not on it: `.mkDet` (picture header, 32 glass close; its body title already 24/30), the locked and About modals `.svLkM` / `.svAbM` / `.lkHero` (built by the same `mkDoc` as the doc sheets, then `ownHd()` takes the master's classes and the `.evNotch` off: their !important header and in-flow grabber, as before), `rsTop` / `isTop` (no title). Content under the row: 8, no top margin of its own (`#dPlan .evShHd + :is(.plNShB, .plPMdPr)`). Closes draw `EvSheetHead.IX` (the 16 glyph), never a text ✕ or a local 12-unit X. EvConsent's desk dialog keeps an 800 reading width (recorded in the Modals doc's Shape row), the one exception to the 544.

**Pitfalls.** Never restyle a sheet's title or close by hand: add the classes and set `--evShPt`. A grabber left in the flow shifts the row: count it in `--evShPt` or make it the notch. The HP standalone has no `.evNotch` CSS: draw its grabber absolute in the HP block.

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

**Rules.** If `EvDismiss` is off: no drag at all. Never starts on input, textarea, select, `[contenteditable="true"]`, `[data-noswipe]`, `.evNoSwipe`, or `skip`. From the body only when no ancestor scroller is scrolled. Starts after 6 px; abandons if moving up or more across than down. Closes at dy > 80 or velocity > .5 px/ms with dy > 24. Spring back transform .32s `cubic-bezier(.16, 1, .3, 1)`, scrim .32s. `out:'slide'`: .24s `cubic-bezier(.4, 0, 1, 1)` to translateY(h + 40), close() after 200 ms. Scrim opacity = 1 − dy / height. Styles `!important`. Scaled frames handled (rect height / offsetHeight). Eats the click after a drag. Auto families (their headers wear the sheet header master's classes; handles unchanged): `.tlSheet/.tlShPanel/.tlShDim` (x `.tlShX, .mkDetX`, handle `.tlShGrab, .tlShHead`, geo), `.shWrap/.sheet/.shDim` (x `.shClose`, handle `.shHandle, .rsTop, .oaTop`, geo), `.ibWrap/.ibCard/.ibDim` (x `.ibX`, handle `.ibHandle, .ibHead`).

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

**Rules.** Read-to-end: `scrollTop + clientHeight >= scrollHeight - 8`. Sheet: height `calc(100% - var(--ecTop, 64px))`, padding 8 16 `calc(16px + max(var(--evHome, 0px), safe-area))`, 20 corners, transform .42s `cubic-bezier(.32, .72, 0, 1)`, dark scrim .72. Dialog: `min(800px, 100%)` x `min(720px, 100%)`, 20 corners, padding 20 24 24, opacity .22s + scale(.96) .3s. Close delay 380 / 240 ms. Header the sheet header master's row and compact Close 32 (`.ecHead.evShHd`, `.ecX.evShX`), 24 under the top; id 16/20 570 (the dialog's header title 24/30 500, `.evShT`); title 26/30 570; buttons 56 pills 16/18 570, 2 columns gap 8; dark ground #181818. Focus trap; Escape → onClose. Sheet swipes via EvSheetSwipe `{ handle: '.ecGrab, .ecHead', scrim, skip: '.ecX' }`.

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

---

## Biomarker detail (`window.BioDetail`)

**What.** The one biomarker detail every biomarker row opens: what it is, the latest result on its range, the history chart. The Insights phone's rows (`#mRecs .mbrow`), the Async report's (`bioOpen`, the body in the report's own sheet) and the Plan's What this moves rows (`.mbrow.plBio` on the Activity plan, the Nutrition plan and the Wind-down routine).

**Where.** `grep -n "window.BioDetail = "`; CSS `grep -n "\.bmdOv\b\|\.bmdFloat"`; the Plan's opener `grep -n "const bioOpen"`.

**API.** `BioDetail.sheet(host, m, { dark, from, float, onClose, stack, back, keep })` → `{ close(), el }`; `BioDetail.body(m, { dark })`; `model(m)`, `zoneOf(d, v)`. m: `{ name, value: '5.2 %', date: 'Oct 2026', status: 'Optimal'|'Suboptimal'|'Out of range'|'', bar: 'osx', pos: 0..1 }`. `float`: the desk's floating Full bottom sheet (centred, min(544) wide, up to 720 high, 28 round, scrim 62%, rise 24 + fade 450/300 ms; no notch, no swipe). `onClose()`: called as it starts closing, before focus returns to `from`. Escape and the Tab loop sit on the document while it is open (the topmost sheet only), the panel `tabindex=-1`, so a click on its words never loses them. A name finds its description when it names the same test: the same words before any brackets ("HbA1c", "Apolipoprotein B (ApoB)"; `serum` aside: "Morning cortisol"), or the same words in all ("Cortisol (morning)"); never part of an entry's name ("Vitamin B12" is not Active B12) nor an abbreviation alone ("LH").

**Reading a row.** `BioDetail.read(row)` turns a status-bar row (the Insights' `.mbrow`, the Plan's `.mbrow.plBio`: name, `.g` value and date or `data-bio-*`, `.st` ok/sub/out, the `.rng .mk` caret in its band of 34/26/26) into m, setting the bar on the marker's own range from `BAR` (worse higher by default; `lo` worse lower, `xso`; `mid` / `mid<` either way, `xsosx`, the member's off reading above / below), so a low ferritin never reads as too high. `BioDetail.find(name)` is the member's own Insights row (`#mRecs`) for a name, brackets ignored. Every opener reads through these: the same marker opens the same detail wherever it is tapped. Units `ug`/`umol` show as `µg`/`µmol`.

**How to use (the Plan).** A row is `bioAt(name, value, date, st)`'s attributes (`role=button`, `tabindex=0`, `data-bio-n/v/d/s`, aria-label) and joins the Plan's interaction states (plate inset 4 / -8, 12 round, the hairlines kept). The opener puts a `.plBioHost` in the subpage's stage (`EvFullView.cover` on the desk), makes the page inert, calls `sheet(BioDetail.read(BioDetail.find(name) || row), { float: desk, dark: !plLight })`; the subpage's hide closes it (`bioShut`). Once the Insights' rows exist, `bioSync` gives each Plan row its Insights twin's date and caret, so row, detail and Insights agree.

