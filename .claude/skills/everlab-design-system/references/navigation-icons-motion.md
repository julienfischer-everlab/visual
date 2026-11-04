# Navigation, icons and motion: sidebar, dock, More, icon library, icon motion, beams, Ask Everlab, carousels, hover/press

All anchors are in `index.html` unless named. Line numbers drift; grep the pattern. Doc: Design system > Navigation (`'nv'`, `#navigation`, `grep -n "const nvDoc"` ~47757; its "Sizes and behaviour" table `T`, partly stale: see the pitfalls below).

---

## Desk sidebar (`.dash .side`, `body.sideMin`, `body.sideMove`) and its icons

**What.** The desk rail from M up: wordmark and retract toggle, then Overview, Insights, Timeline, Services, Plan, the optional Journey demo select, My account at the foot. Retracted it is a 52 px rail of glyphs; items stay in place, only labels go. Icons from `EvNavIc`, drawn a size down in their 20 box (the Figma's ~16 glyph); the retract (Menu) at 18. The lit entry draws filled with the dock's icon motion (`.icLit`), open and contracted; the retract is filled while contracted.

**Where.** Markup `grep -n '<aside class="side">'` (~14521: `.sideHead`, `.logo svg.sideLogo`, `button.sideTgl`, `.nv`, `label.sdJr`, `.sideFoot .nvAcc`); CSS `grep -n "\.dash \.side"` (~532-575, the foot ~8922, light ~11278); JS: icon swap + `lit()` `grep -n "Overview: 'home'"` (~39826), the toggle and `sideMove` `grep -n "classList.add('sideMove')"` (~39844); Menu icon `grep -n "EvNavIc.IC.side"` (~39787); `CARD_STATE.sideMin`. Doc row "Desk sidebar".

**API.** `.sideTgl` (aria-expanded, aria-label "Retract the navigation" / "Expand the navigation"), `.nv` (+ `.on`, `.nvOver`, `.nvIns`, `.nvTl`, `.nvSvc`, `.nvPlan`, `.nvAcc`, `.icLit`), `.sdJr` (`#sdJrSel`), `.sideFoot`. State `body.sideMin` + `CARD_STATE.sideMin`; `body.sideMove` for 420 ms around the retract (each panel's children on their own layer). Tokens `--sideW` (224 / 52 / 0 at S/XS), `--shellBg`. `KEY = { Overview:'home', Insights:'insights', Timeline:'timeline', Services:'services', Plan:'plan' }`; each `.nv > svg` replaced by `L.svg(k)` with its viewBox swapped to `1 1 22 22`, `.sideTgl > svg` by `L.svg('side')`.

**Rules.** Open: width 224, fixed, left 0, top the bar's height (57 in CSS; `resize()` sets it), padding 26 0 26 8 (8 to each plate on the left, the rail's edge 8 off the panel on the right: "right side padding should be same as left side"), 13.5px, #bdbdb9; `.sideHead` padding 0 16 0 12, margin-bottom 34 (the wordmark's left on the glyphs'); wordmark 20 tall; toggle 28 x 28 radius 7, svg 18. `.nv`: padding 12 (44 high), gap 8, radius 10, margin-bottom 6, glyph 20; hover rgba(255,255,255,.05) + #ececec; active .1; `.on` #1e1e1c (hover #242422); labels max-width 160; light: ink #6b5c4a, hover rgba(46,31,26,.06), active .1, lit plate #ece4d3. Retracted: width 52, the same padding (the 44 plates 8 off the window and 8 off the panel, every glyph at x 20); `.sideHead` padding-left 8; `.nv` width 44, gap 0; labels max-width 0, opacity 0; logo hidden; `.dash` padding-left 52, `--sideW:52px`, panels left 52. Width/padding .32s `cubic-bezier(.2,.8,.2,1)`; the toggle adds `body.sideMove` a frame before the rail moves (removed after 420 ms), then dispatches resize; resize again on the width's transitionend. Lit on `body.m9`: `.nvOver` unless svcOn/tlOn/plOn/mkOn/aptOn/accOn; `.nvTl` for svcOn|tlOn; `.nvPlan` for plOn; `.nvSvc` for mkOn|aptOn; `.nvAcc` plate for accOn (no filled icon). My account keeps its ring (18.5 across, 1.75), no filled state. Hidden at S/XS. `html.flowDocked` moves it to `left: var(--flDockW)` (Auto).

**How to use.** A page that lights a plate needs both the CSS plate (`body.m9.xxOn .dash .side .nvX`) and `lit()` ("change both"). Retract from code by clicking `.sideTgl` (keeps CARD_STATE, class, ARIA, `sideMove`, resize in step).

**Pitfalls.** Two sources of "lit" (CSS and `lit()`) must match. Don't animate glyph x on retract. It is fixed: forced breakpoints move it (`body[data-bp] .dash .side{left:calc(var(--vwC,50vw) - var(--bpW)/2)}`). A flex label needs `min-width:0` (WebKit). A new desk panel must join the `body.sideMove` list, or its content repaints every frame of the retract (dark tiles: "clipping a lot on retract menu"). Some comments still say "72" or "60" for the rail: it is 52.

---

## Phone dock (island + AI button)

**What.** The floating bottom nav on every main phone page (XS, S): an island pill with 5 tabs (Home, Insights, Timeline, Services, More) and a round AI button (`.mChat`, the sparkle), plus the home indicator. Written once as a string, mounted into every phone host.

**Where.** `grep -n "const MOBILE_NAV"` (~34283), `grep -n "function mountNav"` (~34324; tab routing `DEST`); CSS tokens `grep -n -- "--navH:60px"` (~1110), `--navActK`, `--navLift`; `.mTabs{display:none;}` (the CSS gate decides which modes show it), `.mDock`, `.mTab{` (~1225), `body.navLab12 .mTab` (~1260), `.mChat{`, `.mTabs .mHome`. Doc: Navigation "Island · XS · 393 px" + table T.

**API.** `MOBILE_NAV` (string, not on window) = `nav.mTabs#mTabs > .mDock > (.mIsland.lgGlass[role=tablist] > a.mTab[role=tab] x5: navIc(key) + <i>Label</i>) + button.mChat.lgGlass[aria-label='Ask Everlab']`, then `i.mHome`. `mountNav` hosts `['phone','phone2','bpFrame']` (ids `mTabs`, `mTabs2`, `mTabs3`); `#phone` lights Insights, `#phone2`/`#bpFrame` Home. `DEST = [6, 20, 'tl', 'mkt', null]` (Home → setMode(6)/m9 in XS, Insights → 20, Timeline → `window._tl.open()`, Services → `window._mkt.open()`, More → EvMore). Re-lights its own tab on `everlab:mode` (not bpFrame). Body classes `navBar` (One bar), `navLab12` (Below · 12px), `navNoLab` (Icons only), kept in `CARD_STATE.navBar/navLab12/navNoLab` and written in the class rebuild. `html.bpAuto #bpFrame > .mTabs`: `--navLift:14px`, no `.mHome`.

**Rules.** On every main page on XS and S (Overview, Insights, My journey, Services); not on a flow, modal or detail page. Island 60 high (`--navH`), 30 corners, 4 inside, glass (blur, dark plate, top sheen). Tab: equal share, 52 high (`calc(var(--navH) - 8px)`), 26 corners, icon 18, label 9, 4 between them, inactive `rgba(236,236,234,calc(.63 * var(--navInactK)))`. **Below · 12px** (`navLab12`, the default): label 12/14, icon 20, **7 between icon and label** ("+2px gap between icon and label"; was 5), tabs `flex:1 1 auto; padding:0 5px` (as wide as their label), island padding 0 3. Icons only (`navNoLab`): icon 21, label hidden. More's dots drawn 1 up (`.mTab svg[data-ic="more"]{translate:0 -1px}`). AI button 60 circle, sparkle 20. 8 between island and AI button, 12 from the sides (`--navInset`), 29 above the bottom (`--navLift`; 16 clear of the indicator). More open: `.mDock` slides down `translateY(calc(100% + 48px))` and fades (.4s `cubic-bezier(.4,0,.8,.4)`), back .45s `cubic-bezier(.32,.72,0,1)`.

**How to use.** Never copy the markup: a new phone host joins `mountNav`'s hosts or clones the live one (the doc does `document.querySelector('#bpFrame .mTabs').cloneNode(true)` and strips ids). A page "in More" calls `window.__litMore()` on open. Sizes via the tokens only.

**Pitfalls.** The label text is the routing key (More is detected by `t.querySelector('i').textContent.trim() === 'More'`). The body class list is rebuilt on every page change: dock state lives in `CARD_STATE`. A phone's dock must name its own screen (re-light on `everlab:mode`). Tabs keep the breakpoint (only Timeline/Services push a phone into XS). The doc's Tab row still says "4 under the icon" for 12px labels (the CSS is 7).

---

## Dock active pill (`.mPill`)

**What.** The lit tab's brighter glass as one element that slides to the tab lit, carrying over from the previous page's dock.

**Where.** `grep -n "function navPill"` (~46511); CSS `grep -n "mPillOn\|> \.mPill"` (~1244). The doc phone has its own small copy (`const slide = (t, now) =>` in nvDoc).

**API.** `setup(isl)` prepends `<i class="mPill" aria-hidden>`, sets `isl._pill`, `isl._tabs`, adds `.mPillOn`; a MutationObserver on class changes → `sync(isl, true)`; ResizeObserver → `sync(isl, false)`. Module-level `last` index: a newly shown dock starts at the last tab and slides.

**Rules.** transform and width .23s `cubic-bezier(.2,1,.3,1)`, opacity .2s ease ("2x faster and snappier"). Height `calc(var(--navH) - 8px)`, top 4, radius half. Dark fill `linear-gradient(160deg, rgba(255,255,255,calc(.20*var(--navActK))), rgba(255,255,255,calc(.07*var(--navActK))))` + inset highlights; light .9/.5. With `.mPillOn`, `.mTab.on`'s own background is off. Reduced motion: opacity only.

**How to use.** Toggle `.on` + aria-selected on the `.mTab`; the observer moves the pill. Never set pill styles by hand.

**Pitfalls.** Label changes (dkLab) change widths (the doc re-slides). Hidden docks (offsetWidth 0) reset and fade the pill.

---

## Dock master saved setup (`window._navMaster`) and Tweaks > Dock

**What.** The Navigation doc's Labels, Icon motion and Insights icon, saved with Save setup, applied on every page after Tweaks and older saves restore.

**Where.** `grep -n "window._navMaster = "` (~34285, + its `addEventListener('load', () => setTimeout(window._navMaster, 400))`); the parse-time Insights read just above it (`grep -n "m.ins === 'heart') navIns"`); Tweaks `#dkLab`, `#dkIcM` in `#dkMenu`; handlers `grep -n "DOCK_KEY\|icmSet"`; doc `.nvSave` (`grep -n "everlab:navMaster', JSON.stringify"` ~47813), the Insights buttons `[data-nvi]`.

**API.** localStorage `everlab:navMaster` = `{ lab: 'on'|'big'|'off', icm: 'beam'|'pop'|'rise'|'fade', ins: 'chart'|'heart' }`; `_navMaster()` sets `#dkLab` (default `'big'`) and `#dkIcM` and dispatches change, and calls `EvNavIc.ins(ins)` (default `'chart'`). `ins` is also read at parse (before the dock is drawn) so every dock, the sidebar and More draw it from the start. `icmSet(v)`: `CARD_STATE.navIcM = v`; body `navIcBeam`/`navIcRise`/`navIcFade` (Pop = no class). Tweaks key `everlab.dock.v2`: shape, lab, icm and sliders `dkH` (`--navH` 44-72, 60), `dkInset` (`--navInset` 0-32, 12), `dkScrim` (`--navScrim`), `dkAct` (`--navActK`), `dkInact` (`--navInactK`).

**Rules.** Defaults: labels `big` (Below · 12px), shape island, motion beam, Insights Chart. Doc buttons `data-nvl` on = "Shown · 9px", big = "Below · 12px", off = "Icons only"; `data-nvm` beam/pop/rise/fade; `data-nvi` chart/heart (Iconography's right panel, "Insights icon"). A saved `pop` is migrated to `beam`.

**How to use.** Anything added to the dock master goes into the `.nvSave` JSON, `_navMaster`, a parse-time read if it changes what the dock draws, and (if a body class) `CARD_STATE` + the class rebuild.

**Pitfalls.** `lab` defaults to `big` and `ins` to `chart` even with no save (an unsaved pick in the doc is undone on the next load, on purpose). A deliberate Pop save becomes Beam. Stale: the doc row "Icon motion" lists only Pop/Rise/Fade and a CSS comment says "Pop (the master's default)"; Beam is the default.

---

## Icon motion (outline → filled): Beam / Pop / Rise / Fade

**What.** The animation when a library icon lights (a tab, the More row, the sidebar's lit entry/retract, the doc's live icons).

**Where.** CSS `grep -n "svg.evIc{"` (~1320) and the lines after: lit rule, keyframes `evIcPop evIcGrow evIcOut evIcIn evIcRise evIcFill evIcBeam`, `body.navIcRise`, `body.navIcFade`, `body.navIcBeam`, `.bm`, `.still`, reduced motion.

**API.** Lit hosts: `:is(.mTab.on, .nvIcLive[aria-pressed="true"], .icLit, .mvRow.mvOn, .mvRow.mvOn > .evMe, .nvIcLive[aria-pressed="true"] > .evMe) > svg.evIc`, or `svg.evIc.on`. Paths `.o` outline, `.f` filled, `.bm` beam track (pathLength 100). `svg.evIc.still` = no motion. `--evIcBeam` (#FFB866).

**Rules.** Pop: svg `evIcPop` .44s `cubic-bezier(.3,.7,.4,1)` (1 → .88 → 1.06 → 1); `.f` `evIcGrow` .42s `cubic-bezier(.34,1.56,.64,1)` (.4 → 1); `.o` out .16s at .1s. Rise: `.f` clip-path inset 100% → 0 .38s `cubic-bezier(.45,0,.2,1)`; `.o` out .14s at .26s. Fade: `.f` in .2s, `.o` out .2s. Beam (default): `.f` `evIcFill` .74s `cubic-bezier(.4,0,.2,1)` (opacity .16 held to 60%, then 1); `.bm` `evIcBeam` .62s `cubic-bezier(.45,0,.25,1)` at .04s (stroke 1.6, dasharray 26 74, dashoffset 100 → 0, opacity 0 → 1 at 12% → 1 at 82% → 0); `.o` out .14s. Back to outline: `.f` transform .2s / opacity .16s. Keyframes (not transitions), so it plays when a dock mounts already lit.

**How to use.** Light an icon elsewhere by adding a class from the selector (prefer `.icLit` on the icon's direct parent); the svg must be a direct child.

**Pitfalls.** The motion class is written in the page-change class rebuild from `CARD_STATE.navIcM` (it used to be wiped). A new host must be added to every copy of the `:is()` list (base, Rise, Fade, Beam). `.still` uses `!important`.

---

## Icon library (`window.EvNavIc`, Iconography)

**What.** One drawing per destination on a 24 grid (shown through viewBox 2 2 20 20), 1.75 strokes as filled evenodd outlines: `.o` outline (rest), `.f` the silhouette filled with details cut out (active), `.bm` the beam's track. Also My account's photo + ring and the desk Menu icon. Insights has two drawings, Chart (the default) and Heart, picked on the Navigation doc ("Heart icon (+active state) as a tweak on the Design system").

**Where.** `grep -n "const NAV_IC\|const navIc\|const navMe\|window.EvNavIc = \|const navIns"` (~34263-34282); `EvNavIc.IC.side` (later script, ~39787); CSS `svg.evIc`, `.evMe`, `.evMeRing`. Doc: Navigation > Iconography (`.nvIcSec`, `data-nvgo='ic'`, `.nvIcLive`, `figure[data-nvins]` with `.nvIcUse` on the one in use, the Insights icon buttons `[data-nvi]`).

**API.** `window.EvNavIc = { IC, svg(k, cls?, vb?), me(cls?), list, ins(v?) }`. `svg` → `<svg class="evIc [cls]" data-ic=k viewBox=vb||"2 2 20 20"><path class=o/><path class=f/><path class=bm pathLength=100 d=(b || first subpath of f)/></svg>`. `me()` → `span.evMe` (member photo from `.ovAvatar img`, or a person glyph) + `svg.evIc.evMeRing` (viewBox 0 0 31.5 31.5). `list: [[key, label, description], ...]`. Keys in `IC`: home, insights (the one in use), chart, heart, timeline, services, more, plan, contact, settings, gift, refer, side. `ins()` → `'chart'|'heart'`; `ins('heart'|'chart')` sets `IC.insights` and swaps the `d` of `.o`, `.f`, `.bm` on every `svg.evIc[data-ic="insights"]` drawn (docks, sidebar, the doc's phone), then dispatches `everlab:navIns`. `navIc` is local; elsewhere use `window.EvNavIc.svg`.

**Rules.** 18 on the tab (20 with 12px labels, 21 icons only), 22 in More rows (viewBox `0 0 24 24` + `mvIc`), 20 in the sidebar (viewBox `1 1 22 22`: a size down), 18 for the retract. 1.75 line, round ends. Filled = solid silhouette, inner details cut (evenodd). Heart: lobes and point, the line filled evenodd; filled the heart solid, the beam from the dip. My account: photo 24, ring 2 clear, 1.75 ink, no filled state. Optional `b` for a custom beam track.

**How to use.** Add `{o, f[, b]}` to `NAV_IC`, or from a later script `window.EvNavIc.IC.key = {...}; window.EvNavIc.list.push([key, label, desc])` (as the Menu icon). The Iconography grid, dock, More and sidebar draw from it. Sites: More `window.EvNavIc.svg(k, 'mvIc', '0 0 24 24')`; sidebar `L.svg(k).replace('viewBox="2 2 20 20"', 'viewBox="1 1 22 22"')`; doc `window.EvNavIc.svg(c[0], 'on still')`. Draw Insights with key `insights` (never `chart`) so `ins()` reaches it.

**Pitfalls.** Never draw stroked one-off nav icons. Iconography also shows Eva's beam star (EvBeamStar). Keep `list` descriptions in sync with the drawings (`list` has `chart` and `heart`, not `insights`). An icon drawn with `data-ic="chart"` won't follow the Insights choice.

---

## More sheet (`window.EvMore`)

**What.** The dock's More opens a bottom sheet of three stacked cards (Plan · Contact us, Settings, My account · Gift Everlab, Refer a loved one), a scrim and a floating close; the current page's row keeps a plate and lights its icon with the dock's motion; More is lit in the dock on those pages, sub pages included ("if the user is under a sub page, the main page on the nav still needs to be the active nav").

**Where.** `grep -n "window.__litMore = \|window.__morePage = \|window.EvMore = "` (~34290-34298); the delegated capture-phase click on `#bpFrame .mTab, #phone .mTab, #phone2 .mTab` after it; CSS `.mvWrap .mvScrim .mvStack .mvCard .mvX .mvRow` (`grep -n "\.mvRow"` ~1293-1296). Doc rows "More" and "More · the page you are on".

**API.** `window.EvMore.open(host)` → `{ el, close } | null` (null if one is open). `GROUPS = [[['Plan','plan']], [['Contact us','contact'],['Settings','settings'],['My account','me']], [['Gift Everlab','gift'],['Refer a loved one','refer']]]`. Rows `button.mvRow[data-mv=key][aria-current=page]`; lit row `.mvOn` at 300 ms + its card's `--dl`. `window.__morePage()` → `'plan'|'me'|'settings'|'gift'|'refer'|'contact'|''` from `plOn` (the Plan and every Plan sub page), `accOn` (+ `_acc.tab()`), `gfOn`, `rfOn`, `ccOn && !ccOut` (+ Concierge model care). `window.__litMore()` lights More on every dock. Doc phone: `host.dataset.mvCur`, `host._mvLit()`. Uses EvSheetSwipe (`out:'slide'`) and `EvDismiss.notch(top card)`. Row actions (360 ms): My account `_acc.open({tab:'profile'})`, Settings `_acc.open({tab:'settings'})`, Gift Everlab `_hp.gift()` (Send a gift, over the page), Refer `_rf.show(1)`, Contact us `_cc.run(c => { c.model('care'); c.go('new'); c.focus(); })`; Plan its own handler.

**Rules.** Stack 12 from sides and bottom, 8 between cards; card padding 4, radius 26, #181818 (light #fff); `--dl = (n-1-i)*50ms` (the card by the dock first), rise `translateY(28px) scale(.98)` → none .5s `cubic-bezier(.2,.8,.2,1)`; scrim rgba(0,0,0,.55) .35s; close 44 circle 60 above the stack, right 16, rgba(255,255,255,.14) blur 12; row 56, padding 0 16, gap 14, radius 22 (last 22 22 40 40), 16px, icon 22, photo 24; hover .05, active .09 + scale(.985), focus-visible .07; **the current row (`aria-current="page"`) keeps an 8% plate** (light rgba(46,31,26,.07)), hovers elsewhere stay 5%; removed after 520 ms; Escape closes; focus to close at 60 ms.

**How to use.** A new page reachable from More: a row in `GROUPS`, an icon in EvNavIc, a branch in `__morePage`, `__litMore()` on open, and the routing branch in the click handler.

**Pitfalls.** A page that forgets `__litMore` leaves its own tab lit. The doc phone must not navigate the app (`app(host)`). Tapping More never moves the pill. Swipe/notch belong to EvSheetSwipe/EvDismiss. `__morePage` answers `'gift'` for the old Gift page (`gfOn`) only; Send a gift is a full modal over the page (no dock under it). The doc's "More · the page you are on" row doesn't mention the plate.

---

## Eva's beam star and the AI button's press ring (`window.EvBeamStar`)

**What.** `EvBeamStar(size)`: Eva's beam star, a circle on a 4% ground with a warm conic beam turning round its edge every 3.2 s, its glow spilling in, the star in the middle (Iconography; the report's wrap-up). `EvBeamStar.press`: the press ring for the dock's AI button (`.mChat`), the star's ring and glow once round its edge. **The Ask sheet no longer waits on it** ("remove beam effect on press"): the button's click opens the card at once.

**Where.** `grep -n "window.EvBeamStar = \|window.EvBeamStar.press = "` (~20163-20183); CSS `grep -n "\.evBeamStar\|evBsPress"` (~8240-8252); shared `@property --hpBm`, `@keyframes hpBeam`; EvAsk's click (`grep -n "remove beam effect on press"`) and its close's `press.cancel(btn)`. Doc row "AI button · press", figure `.nvIcBs`.

**API.** `window.EvBeamStar(size?)` → `span.evBeamStar` (`--bsz`; tokens `--bsBg` rgba(255,255,255,.04), `--bsInk` #fff). `window.EvBeamStar.press = { start(btn), end(btn) -> ms left, cancel(btn?), then(btn, fn) }`; a delegated capture pointerdown on `.mChat` starts a ring (`span.evBeamStar.evBsPress` prepended), pointerup/cancel ends it; `then(btn, fn)` runs `fn` at once and plays one quick round over it; `b._bsOpen` holds a deferred open.

**Rules.** 350 ms per round (`RND`; CSS `::before/::after` .35s; "beam should happen fast"); ring rotated −142deg so the head starts at the top; on release it finishes the current round (at least one: `ceil(elapsed/350)*350`), fades .3s (`.out`, removed at 320 ms). Press ring `--bsz: var(--navH, 56px)`. Light: padding 1.5px, deeper orange (rgb(232 105 28 / .6), #F07A2E, #E8691C). Reduced motion: no turn. Standalone star: 1px ring .85, glow `blur(calc(var(--bsz)/7))` .55, hpBeam 3.2s linear infinite; star svg 36% of `--bsz`.

**How to use.** Star elsewhere `window.EvBeamStar(64)` (report wrap-up), override `--bsBg/--bsInk` per surface. A button that should open at once: `btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(); })` (EvAsk).

**Pitfalls.** The pointerdown listener in `EvBeamStar.press` is still wired: pressing `.mChat` still prepends `.evBsPress.on` and draws its ring while the button is held (at least one 350 ms round, under the card that now opens on click), though the click no longer waits for it. If the beam must be gone entirely, that listener (or the `.mChat > .evBsPress` CSS) is what still draws it. The doc's "AI button · press" row still describes the beam and the deferred open. Press-only overrides live under `.mChat > .evBsPress`, never on the shared `.evBeamStar`.

---

## Ask Everlab card (`window.EvAsk`)

**What.** The AI button's card: grows out of the button into a #181818 card with the field and the Services bento; typing folds services, shows suggestions and the keyboard; send hands to the chat (EvChat). **A service tile starts its chat** ("this service action leads to: bottom sheet close, chat experience starts triggered by the context selected"): the sheet closes back into the star, then the chat opens on that service.

**Where.** `grep -n "function aiSheet\|window.EvAsk = "` (~34392, ~34614); the tiles' handler `grep -n "wrap.querySelectorAll('.aiSvc')"`; the openings `grep -n "const SERVICE_CHAT\|window.EvSvcChat = "` (~40236-40249); Tweaks > Ask sheet > Icons (`#stAskIc`, `html.askIc3d`, `window.EvSvcImg`; merged #271). Doc rows "Ask Everlab · open/card/icons/typing/send/close"; nvDoc calls `window.EvChat.attach(fr, 'doc'); window.EvAsk.attach(fr, 'doc')`.

**API.** `window.EvAsk.attach(host, id)` (hosts `phone`, `phone2`, `bpFrame`, the doc's); `host._askOpen()`, `host._askClose()`. `window.EvSvcChat` = `SERVICE_CHAT`: `{ '<tile title>': { title, q, answer: [paragraphs] } }` (Concierge, Script renewal, Check Symptoms, Specialist referral, Blood test referral, Imaging referral, and the Overview row's Telehealth, Med Certs, Treatments, Pathology), the same map the Overview's services row opens.

**Rules.** Open from the button's rect (translate + scale) to 12 off the screen's sides and foot, 460 ms `cubic-bezier(.2,.8,.2,1)`, corners 26 top / 44 foot, contents after 180 ms, blanket 67% 350 ms; at once on click (no beam first). Card 16 inside; field + Close 44 floating 16 above. Service tiles 16 round, 14 type. Typing: services row 1fr → 0fr, 4 chips, bento button 56, card 12 above the keyboard, 320 ms. Letting go of the field (the bento button, a tap off it) **clears its words and send state** as the services come back. A tile: `close()`, then 300 ms in (most of the way through the .46 close) `ch._chat.open(tile, ctx.q, ctx)` with `ctx = EvSvcChat[tile title] || EvSvcChat.Concierge`. Close runs back into the button (480 ms). Icons 3D (`html.askIc3d`): each service's render 32 square left of its name, 12 to the name, names on two lines at least (2.5em), tiles 76 high.

**How to use.** Mount with `EvAsk.attach` on a phone host that carries the dock; never build a second card. Service renders come from `window.EvSvcImg`; a new tile's chat opening goes into `SERVICE_CHAT` under the tile's exact title.

**Pitfalls.** The tile's title text is the key into `EvSvcChat` (a renamed tile falls back to Concierge). The chat opens only if the host has `_chat` (EvChat attached).

**Pending: Services Grid / Carousel.** A setting on the Navigation doc for how the Ask sheet lays out its Services (Grid or Carousel) is in flight. After it merges, document here: its control and where it is saved (likely `everlab:navMaster`), the two layouts' numbers, the classes, how the carousel swipes (EvMagnet?), and its doc row.

---

## Other beams: `EvBeam` (chat composer), intro field `hpCcBm`, field star `.ovChatSpark`

**What.** The warm conic beam family sharing `@property --hpBm`: (1) `hpCcBm`, the Concierge intro field's resting beam; (2) `EvBeam`, the same layers once round a field (in-app composer; concierge.html on Care team → Eva); (3) the Overview ask field's star morphing into a 16%-ink dot with a beam round it.

**Where.** `grep -n "@property --hpBm\|@keyframes hpBeam"`; `.hpCcF .hpCcBm`; EvBeam CSS `grep -n "\.evBeam{"`, JS `grep -n "function evBeam\|window.EvBeam = "` (~34633); call `window.EvBeam.run(composer)`; `visuals/concierge.html`: `beamRun`; field star `grep -n "ovChatSpark"`, gradient `ovSpBm3`.

**API.** `window.EvBeam = { run(host), layers: LAYERS }`, LAYERS = `<span class="evBmIn"><span><i class="evBm"></i></span></span><i class="evBm evBmL"></i><span class="evBmG"><i class="evBm"></i></span>`, prepended as `span.evBeam`, `.run` removed after 2100 ms. concierge.html `beamRun(bx)` builds the same markup. Field star: svg paths + `.ovSpDot` + `.ovSpOrb`.

**Rules.** Edge line 1 wide inset −.5px opacity .42; inward spill 9 band, blur 7, .25 (overflow hidden); halo 8 band 4 out, blur 12, .09; conic transparent 0-55deg, #FF9F4A 92, #FFB866 118, #FF8A3D 146, transparent 185-360. Once round 1.9 s linear (`evBmTurn`) with `evBmFade` 0 → 1 at 8% → 1 at 86% → 0; reduced motion 1.2 s glow, no turn; hpCcBm rests at hpBeam 6s. Field star: 8.8 s loop (stars 5 s, dot held 3 s), dot fill-opacity .16, orb stroke 1.3 dasharray 32 68, two turns; light stops #F07A2E / #E8691C; star 18 (16 in hdrV3 / `#phone2 .ovTop`), hidden while typing on XS.

**How to use.** `window.EvBeam.run(fieldEl)` (field needs border-radius; its content `position:relative` above the beam). In concierge.html use `beamRun`.

**Pitfalls.** Two copies (index.html EvBeam and concierge.html beamRun + CSS) change together. The press ring (EvBeamStar) is a different beam: don't merge them. Light theme needs the deeper orange. The Chat video builder (#268, pending, references/chat.md) may reuse the beam: check after it merges.

---

## Carousels (`window.EvMagnet`)

**What.** A row of cards swiped by hand with a 50% magnet: drag half a card (plus gap) or more goes to the next/previous, less springs back. Shared by every carousel.

**Where.** `grep -n "window.EvMagnet = "` (~20516). Not on a Design system tab yet.

**API.** `window.EvMagnet.bind(row, { item, drag, onMove })` → `{ go(i), at() }`. `item` cards selector; `drag` class while dragging; `onMove()` once a frame on scroll. `row.dataset.dragged='1'` for one tick to swallow the click.

**Rules.** Starts after 6 px across; more vertical = page scroll; scroll-snap off while moving; threshold `|dx| >= step * .5` (`step = c[1].offsetLeft - c[0].offsetLeft`); glide 240 ms easeOutQuint; last card stops at the row's end; reduced motion jumps; no drag when nothing scrolls. Drags divide by `evK(el)` in a scaled device.

**How to use.**
```js
window.EvMagnet.bind(gl, { item: '.plGoal', drag: 'plDrag' });                       /* Plan goals (each card a button: .plPGoalGo) */
window.EvMagnet.bind(rec, { item: '.mkRc', drag: 'mkDrag', onMove: arrowsSet });     /* Services recommended; arrows call go() */
```

**Pitfalls.** Mouse drags like a finger (keep dragstart prevented). A card that is a button must ignore the click after a drag (`dataset.dragged`; the Plan's goal cards open nothing on a drag). Not documented: if added, under Navigation or General layout with these numbers.

---

## Hover / press conventions

**What.** Every nav item and tappable answers the hand: a hover tint and a press scale/tint. Plain CSS (`:hover`, `:active`, some under `@media (hover: hover)`); no app-wide JS master or token. The Plan (#269, merged) has one rule set of its own for every control on the Plan, its subpages, their sheets and the Activity session (a full modal over it), after the More rows' feel.

**Where.** Sidebar `.dash .side .nv:hover/:active`; dock `.mTab:hover`, `.mTab:active{transform:scale(.955);}`; `.mChat:active{transform:scale(.94);}`; More rows (`.mvRow`, `[aria-current]`); `.mvX:hover`; `.rcCard:active` scale(.97); `.aiChip:active` scale(.96). Plan: the CSS block `grep -n "the Plan's interaction states (\"In plan"` (~8635, after the Nutrition plan's sheet, scoped `:is(#dPlan, .plSesSheet)`) and the `.plPress` script `grep -n "const press = (() => { const SEL"` (~45842).

**Rules.** Dock tab hover rgba(236,236,234,.85), press scale(.955), transform .16s ease. AI button hover brighter gradient, press scale(.94). Sidebar hover rgba(255,255,255,.05), press .1 (light rgba(46,31,26,.06) / .1). More rows hover .05, press .09 + scale(.985), focus-visible .07, current .08. Small round buttons hover rgba(255,255,255,.12), press scale(.94). Cards press scale(.97-.99) by size (large chips scale(.9934), about 2px of 303). Plan (`:is(#dPlan, .plSesSheet)`): the plate is the control's `::before` (isolation, so nothing moves), `--plHov` ink 5% on hover (only under `@media (hover:hover)`), `--plPrs` ink 9% pressed, `--plRing` for the focus-visible 2px ring; over a photo or a card of its own ground .1 / .18 white (the desk's goal cards: white plate in Dark, dark on their white Light card); press `scale(var(--plPrsS, .985))`, .94 for the 32/44 round Back/Close buttons; a goal's cover (`.plPGoalGo`) presses its whole card (.985); transform .15s ease, no spring. A row's plate bleeds 8 past its column (radius `--plPlateR` 12; an 80 tile's row 28, a 56 tile's 22), the hairlines beside it hidden; links take it 4 x 8 round the words. Pressed on `:active` and on `.plPress`, which `press(root)` sets from pointerdown (held 90 ms; dropped on a 10 px slide or when a scroller round it moves more than 4 px). Tiles 80 (activity, supplements, radius `--plTileR80` 20) and 56 (medications, `--plTileR56` 14). Covered: `button.plRow, button.plPStep, .plNTip, .plSee, .plPCrumbA, .plNCrumbP, .plNMac, .plA .svCTab, .plRtnGo, .plMore, .plATileB, .plPBack, .plNBack, .plABack, .plPMdX, .plNShX, .plPGoalGo, .mbrow.plBio, .plSesEx`.

**How to use.** New tappables: a ~.05 ink hover tint; press scale(.94) for small round buttons, .955-.97 for pills/cards, .985-.99 for wide rows/cards; transform .15-.16s ease. A new control on the Plan (or in its Activity session) joins the selector list in every rule of the Plan's interaction states and the `.plPress` script's `SEL` ("The same list as the CSS's"); a surface drawn outside `#dPlan` calls `press(root)` on its root each time it is drawn (EvSolo's `mount: sh => press(sh)`) and joins the `:is(#dPlan, ...)` scope.
