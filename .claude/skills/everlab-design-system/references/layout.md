# Layout: breakpoints, frames, container, header, Top nav, Header overlap, desk panels

All anchors are in `index.html` unless named. Line numbers are approximate (`~`) and drift; grep the pattern.

---

## Breakpoints and the Viewport select (XS / S / M / L, forced vs Auto)

**What.** The top bar's `#stBp` (Auto, XS, S, M, L). A forced value sets `body[data-bp]` and frames the whole app at that breakpoint's floor width, centred. Auto follows the window; under 600 px Auto behaves as XS with no device frame (`html.bpAuto`). No XL option: the app draws XL as L (XL exists only in docs, e.g. Step flow at 1920, and in page container queries).

**Where.** `grep -n 'id="stBp"'` (inside `span#bpGrp`, readout `span#tkVw`), `#tkBpSave`; logic: the "Layout tweak" block (`grep -n "W = { xs: 393"`, `autoBp`); persistence `grep -n "everlab.bp"`; Insights family `responsiveSync` / `responsiveTarget`; CSS `body[data-bp` container tokens and `.dash` framing (~10140).

**API.**
- `#stBp` value `auto|xs|s|m|l`; `#tkVw` readout `NNN px · XS`; `#tkBpSave` (gets `[data-dirty]` while the shown value differs from the kept one).
- `body[data-bp="xs|s|m|l"]` (absent in Auto at 600 px and wider); `html.bpAuto` (Auto under 600: `data-bp='xs'`, no frame).
- `BP = w => w >= 1440 ? 'L' : w >= 992 ? 'M' : w >= 600 ? 'S' : 'XS'`; `W = { xs: 393, s: 600, m: 992, l: 1440 }`; `autoBp()` on resize fires the select's change when 600 is crossed. A change sets `body.dataset.bp`, calls `placeSvcV4()`, `read()`, then dispatches `resize`.
- `--bpW` on body: 393 / 600 / 992 / 1440px; `html.bpAuto body[data-bp=xs]` 100vw.

**Rules.** Floors XS 393, S 600, M 992, L 1440. Forced `.dash`: width `var(--bpW)`, left `calc(var(--vwC, 50vw) - var(--bpW) / 2)`, hairline `box-shadow 0 0 0 1px rgba(255,255,255,.08)`. At S/XS the sidebar is hidden (`--sideW:0px`), panels get left 0, top 0, radius 0, no max-width. Insights uses its own boundaries: under 640 mob, under 1024 tab, else desk; forced XS/S picks phone, M/L desk. Saved key: localStorage `everlab.bp` (restored on load with change dispatched).

**How to use.**
```js
const bs = document.getElementById('stBp');
bs.value = 'xs'; bs.dispatchEvent(new Event('change', { bubbles: true }));   /* force XS */
bs.addEventListener('change', () => setTimeout(fit, 60));                    /* react, after a tick */
const bp = document.body.dataset.bp;                                          /* undefined = Auto on a wide window */
```
Real sites: home card Timeline Mobile (P entry `bp:'xs'`), the phone's More > Plan, standalone hashes via `put('stBp','xs')`.

**Pitfalls.** (1) Auto on a wide window has NO `data-bp`: test its absence for the desk. (2) Dispatch with `bubbles:true` (listeners sit on document). (3) `#tkBpOpen` no longer exists, so the "open in a new window" handler is dead; `#tkBpSave`'s title still says "Open the prototype at this viewport" but it only saves. (4) `setMode` rewrites `body.className`: breakpoint state lives on `<html>` (`bpAuto`), never in body classes. (5) Several breakpoint sets coexist: 600/992/1440 (tokens, readout), 640/1024 (Insights), container queries in Plan and marketplace (S from 480, M 640, L 1000). (6) XS is 393 in code though old comments say 402.

---

## XS phone / S tablet frame (`#bpFrame`, `--evPh*` / `--evTb*`, the 852 device)

**What.** The device drawn round a forced XS (iPhone) or S (tablet): a fixed, pointer-events-none overlay with the bezel, the status strip (`.bpStatus`), the dock cloned into it (`.mTabs` with `.mHome`), the drawn keyboard (`.mKbd`) and the Overview's suggestion chips (`.ovSug`). The bezel tokens are THE phone and tablet frames: docs' phones, standalone shells (`.cnDev`, `.grDev`, `.clDev`, `.rfDev`) and Step flow's `.sfDev` take them.

**Where.** Markup `grep -n 'id="bpFrame"'`; tokens `grep -n -- "--evPhR:"` (~10200); placement in `resize()` (`grep -n "const XS_H = 852"`); scale list `grep -n "html.bpFit:not(.bpAuto)"`. Doc: General layout > Header > Demo frames; every DS phone (`.sfDevXS`, `.ldDevXS`, `.hcScr`).

**API.**
- Tokens: `--evPhR:56px`; `--evPhBz:0 0 0 5px #000, 0 0 0 11px #3b3b40, 0 0 0 12px rgba(255,255,255,.14)`; `--evTbR:28px`; `--evTbBz:0 0 0 9px #000, 0 0 0 16px #3b3b40, 0 0 0 17px rgba(255,255,255,.14)`.
- On `<html>` (written by `resize()`): `--barH`, `--bpTop`, `--bpBot`, `--bpS` (XS scale) and `html.bpFit` (scale < 1); `--dSt` on `.dash`. `--bpW` on body. `--vwC` is the centre (see Viewport centring).
- `body[data-bp="xs"] #bpFrame{border-radius:var(--evPhR);box-shadow:var(--evPhBz)}`; `body[data-bp="s"] #bpFrame{border-radius:28px;box-shadow:var(--evTbBz)}`.
- `window.evK(el)`: how much smaller `el` is drawn than its CSS pixels (scaled XS device or a scaled doc phone).

**Rules.**
- **XS is always 393 x 852** ("All XS need a minimum height 852px", merged #266). Centred in the room under the bar with at least 16 above and below. A window too short (or too narrow: room = window less 320 for each docked Tweaks / Flow panel) keeps the 852 and scales the whole device: `s = max(.2, min(1, (av - 32) / 852, (room - 32) / 393))`, written as `--bpS`, `html.bpFit` when s < 1. `--bpTop/--bpBot` stay the 852 frame's own top and foot.
- One `scale:var(--bpS, 1)` on every layer laid in the frame's rect: `.dash, #bpFrame, .lp, .aqWrap.aqDesk, .ccPage, .clDev, .rfDev, .grDev, .cnDev, .gfPage iframe, #phoneShell, #phoneShell2`. A new framed layer must join that list.
- S frame: 48 under the bar and 48 above the window's foot (fallbacks `calc(var(--barH)+48px)` / `48px`).
- Page radius inside: `.dash` 56 (XS) / 28 (S), scrollbar hidden.
- Status strip XS: padding 18 34 4; time 15/600 .02em; island 96 x 27, top 13, radius 16, border 1px #1a1a19. S: padding 10 22 0, time 12, no island, signal svg scale(.8). Light: ink #000, svg inverted. Forced XS: the strip is a 47 px band (`html:not(.bpAuto) body[data-bp=xs] .dash{border-top:47px solid var(--pageBg)}`); picture-headed pages (`body.svcOn`, `body.aptOn`) run under it (`--stH:47px` on aptOn). Full sheets at `--shTop:5px` (52 on svcOn/aptOn).
- S keeps the phone dock centred at 420 wide. Auto (`html.bpAuto`): no bezel, strip, keyboard or home bar; `#bpFrame` fills the window under the bar. `body.m5`/`m6` (old shells) hide `#bpFrame`.
- Doc phones are 393 x 852 too (Header overlap `.hoPh`, Navigation island, Modals XS, Container XS, Step flow, Loading states, Demo frames).

**How to use.** A surface that sits in the frame at forced XS/S copies the standalone pages' geometry:
```css
html:not(.bpAuto) body.X:is([data-bp="xs"],[data-bp="s"]) .xDev{position:fixed;left:calc(var(--vwC, 50vw) - var(--bpW) / 2);width:var(--bpW);top:var(--bpTop, calc(var(--barH,57px) + 48px));bottom:var(--bpBot, 48px);border-radius:var(--evPhR);box-shadow:var(--evPhBz);}
```
(see `.cnDev`, `.grDev`, `.clDev`, `.gfPage iframe`), and add `.xDev` to the `html.bpFit` scale list. Drags inside divide screen pixels by `evK(el)`. Copy the status bar at run time from `#bpFrame .bpStatus` (glDoc's `sb`, Loading states).

**Pitfalls.** (1) No drop shadow: the master is a bezel only ("the SAME iPhone frame all the time, meaning NO shadow"). (2) Hard-coded copies drift: `border-radius:56px` in `.dash`/`.lp` at XS, `.mdFr.mdPhone`, `.rfDev`, `#dOver .ovDimD`, `.aqWrap` at XS. (3) The Header overlap doc phone `.hoPh` is NOT the master frame (radius 48, inset 1px line, no bezel). (4) The S frame's radius is a literal 28px, not `var(--evTbR)`. (5) `#bpFrame` doesn't clip: the dock's `::before` inherits the frame's bottom radii. (6) Hiding the dock must target `#bpFrame > .mTabs` (and `#phone`, `#phone2`, `.nvFr`). (7) A scaled `.dash` holds its fixed children: the Overview's dim and results notice are placed inside it while `bpFit`. (8) The screenshot CTA measures the scaled device and renders back at 393 x 852 @3x.

---

## Container tokens and General layout > Container

**What.** The page container: a centred column as wide as the screen up to a max width, padded, sections a gap apart. Padding and gap are live CSS tokens; max widths exist only in the doc. The tab shows a live questionnaire page at XS/S/M/L, scaled to fit, and a tokens table.

**Where.** `grep -n -- "--ctPadY:24px"` (~10210: `:root`, `@media` 600/992/1440, `body[data-bp=...], [data-ct-bp=...]`); max widths `grep -n -- "--ct2xs: 100%"` (~16683, with `[data-container]`). Consumers: `#dOver`, `#dOver .ovTop`, `.ov5Cards` (padding); `data-container="2xs"` on evSolo's `.sgmCol`, the flows' desk column via `var(--ct2xs)`. Doc: `grep -n "const ctRead\|const CT_BP\|const CT_MAX"` (reads the tokens off the CSS through a hidden `[data-ct-bp]` element), CSS `.glCt*`. Tab `data-gl="ct"`.

**API.** `--ctPadY` (top/bottom), `--ctPadX` (sides), `--ctGap` (between sections). Max widths `--ct2xs` (100% XS, 512 S, 544 M, 576 L), `--ctXs` 800, `--ctSm` 1080, `--ctMd` 1280, `--ctLg` 1440; a page names its column `data-container="2xs|xs|sm|md|lg"` (centred, `max-width: var(--ct…)`) instead of a max-width of its own. `[data-ct-bp="xs|s|m|l"]` and `.aqWrap.aqBpXS/S/M/L` carry a breakpoint's tokens. Doc: `CT_W` frame sizes (xs 393x852, s 600x760, m 992x760, l 1440x820), `CT_NAMES`, `ctRead(bp)`, `CT_BP`, `CT_MAX`; a Breakpoint AND a Container picker; classes `.glCtStage`, `.glCtSc`, `.glCtFr`, `.glCtWrap`, `.glTgl` (Show sizes, `.glRed` on `.glMain`). The top nav (Top nav C) and the footer span the frame inside its padding; only the body's content sits in the container.

**Rules.** XS / S / M / L: padding top-bottom 24 / 28 / 32 / 36; left-right 16 / 16 / 24 / 24; gap 24 / 28 / 32 / 36. Max-width table: `layout/container/max-width/2xs` 10000 (no cap) / 512 / 544 / 576 for a flow's page; xs 800; sm 1080; md 1280; lg 1440. Media queries min-width 600, 992, 1440; a forced `data-bp` overrides them. Doc UI keys `everlab:glBp`, `everlab:glCt`, `everlab:glPart`. No saved setup (not a savable master).

**How to use.**
```css
padding:var(--ctPadY) var(--ctPadX); gap:var(--ctGap);
margin:0 calc(-1 * var(--ctPadX)); padding:0 var(--ctPadX);                                        /* bleed a row (.ov5Cards) */
top:calc(-1 * var(--ctPadY)); margin:calc(-1 * var(--ctPadY)) calc(-1 * var(--ctPadX)) 0;         /* sticky bar (#dOver .ovTop) */
```
Flow pages cap at 544 on the desk (`width 544; max-width calc(100% - 48px)`).

**Pitfalls.** (1) Only the Overview reads the tokens; `#dMain #dSvc #dTl #dApt #dAcc #dMkt` hard-code 32 40. (2) The desk Overview overrides to `--ctPadY:32px; --ctPadX:40px`, so the doc's M/L 24 isn't what it shows. (3) The doc reads the tokens off the CSS: change the `:root` / `@media` / `body[data-bp], [data-ct-bp]` rules, never a copy. (4) `#dOver` centres its 1080 content with `padding: max(var(--ctPadX), calc((min(1584px - var(--sideW,224px), 100% - var(--sideW,224px) - 16px) - 1080px) / 2))` (the % is the dash's, hence `--sideW`). A new token needs both the media query and the `body[data-bp], [data-ct-bp]` override.

**Being reworked.** Desk panels follow the Overview (#270) will move panels onto these tokens.

---

## Header (General layout > Header; `--hdr*`)

**What.** The documented head every page shares. Phone (XS/S): status bar, nav bar (Back, modal title, Close), page title (questionnaire 32 or page 24). Desk (M/L): no status bar, smaller Back/Close at the column's edges, 20 page title. Drawn live from `--hdr*`, with Show sizes labels, demo frames and a Sizes table.

**Where.** `grep -n -- "--hdrSb:54px"` (~7245); doc CSS `.gl*`; builder `grep -n "const glDoc"` (`nav()`, `phone()`, `demo(k)`). Tab `data-gl="hdr"` (default), link `#general-layout`.

**API.** `--hdrSb:54px; --hdrNav:76px; --hdrSide:16px; --hdrGap:16px; --hdrBtn:44px; --hdrNavT:18px; --hdrNavTL:24px; --hdrQ:32px; --hdrQL:40px; --hdrPg:24px; --hdrPgL:30px; --hdrNavDk:64px; --hdrSideDk:76px; --hdrBtnDk:32px; --hdrPgDk:20px; --hdrPgDkL:26px`. Doc classes `.glFr` (`.glDk`), `.glPart[data-sz]`, `.glSb`, `.glNav`, `.glBtn`, `.glNavT`, `.glTtl` (`.glPg`), `.glBody`, `.glDemo` (`.glDemoxs/.glDemos/.glDemodk`), `.glDemoFoot`, `.glDemoCta`, `.glRed`.

**Rules (Sizes table).**
| Row | XS · S | M · L |
|---|---|---|
| Status bar | The device's: 54 · time left, island, signals right | None |
| Nav bar | 76 Hug · 16 sides · 16 between | 64 · 76 sides (the page's column) |
| Back · Close | 44 circle · ink 7% · 16 icon | 32 circle · ink 7% · 16 icon |
| Nav title | 18/24 · 500 · left, after Back | None |
| Title · questionnaire | 32/40 · 500 · −0.4 · 12 above, 32 below: 84 Hug | Same as Title · page |
| Title · page | 24/30 · 500 · 8 above, 16 below: 54 Hug | 20/26 · 500 · 11 above and below: 48 Hug |

Demo frames: XS 393 x 852, S 600 x 860, desk 720 tall with a 544 column (max-width `calc(100% - 48px)`). Foot: 16 16 34 on the phone (CTA 52, radius 26), 20 0 32 on desk (CTA 48). No saved setup.

**How to use.** For a modal's, sheet's, standalone page's or flow's bar use the Top nav master (next section), not these numbers. Real copies of this tab: Modals doc `.mdNav` (76/64, 16/76 sides, `.mdIc` 44/32), Plan subpages' 24/30 title.

**Pitfalls.** (1) `--hdr*` are read ONLY by the doc's `.gl*`: changing a token changes the doc, not the app. (2) The documented status bar is 54, but forced XS draws a 47 px band and the strip at padding 18 34 4; EvOverlap's bar foot is 130 (54 + 76). (3) Step flow and Modals docs carry their own header rows (e.g. "one row 40 high ... 58 down on XS") that differ; check both.

---

## Top nav (`window.EvTopNav`, `.evTn`; General layout > Top nav, merged #260)

**What.** One bar for every modal, sheet, standalone page and flow with a Back and / or a Close. A (title, Close) and B (Back, title, Close): 76 hug. C (no title): a 32 safe space, the controls floating at their place, the page's H1 the first thing in the body, its words faded into the bar once the H1 has gone under it. The ground is always the gradient blur.

**Where.** `grep -n "window.EvTopNav = "` (~19846, header comment); CSS `grep -n "^\.evTn"` (~16643-16680, after the report sheet's styles); doc `grep -n "const glTn\|const glTnWire"` (variants, XS phones at rest / scrolled, desk, rules table). Tab `data-gl="tn"`. concierge.html copies the ground (`.evTnG`) for its head: change both.

**API.** `window.EvTopNav = { html(o), mount(el, o), watch(scroller, nav, h1, o) -> { update }, titled(h1, bar, sheet), variant(o), IB, IX, IM }`. `o = { back, title, close, more, reveal, cls, backCls, closeCls, tag, titleId, backLabel, closeLabel, attr }`; `variant`: title → `'a'` (or `'b'` with back), else `'c'`. Markup `div.evTn.evTnA|B|C[data-tn] > .evTnG (10 <i>) + button.evTnBtn.evTnBk + .evTnT | .evTnFt > span + button.evTnBtn.evTnX|.evTnMore`; `.evTnHasBk`, `.evTnHasX`. The body's H1 gets `.evTnH1` (clearance from the controls). `watch` sets `.evTnOn` (scrollTop > 0: the ground bleeds 24 further), on C `.evTnTitled` (the H1's middle past the controls' foot, once the page has moved) and `.evTnFar` (the H1's column clear of the controls: no clearance). Host tokens `--evTnTop` (54 under the XS status bar, else 0), `--evTnX` (16 phone, 24 desk), `--evTnGnd`, `--evTnInk`; `--evTnD` 44.

**Rules.** A/B: min-height 76 (+ `--evTnTop`), padding 16, gap 16, title 20/28 500 one line. C: height 32 (+ `--evTnTop`), controls absolute 16 down, `--evTnX` in. Discs 44, ink 6%, 16 icon, hover ink 4%, focus 2px #4b7bec. Title appearing 17/22 600, centred between the controls, fade + 6 px rise .25 s. H1 under C: 12 clear of a Close (padding-right 56), 40 lower under a Back. Ground: `--evTnGnd` at `--hoTint` (.85) masked to nothing over 10 backdrop-blur bands (14 px top to 1.5 foot); sticky at its scroller's top. Reduced motion: no transitions.

**How to use.**
```js
body = '<div class="siScroll">' + EvTopNav.html({ close: true, closeCls: 'prX siX', cls: 'prNav' }) + '<h3 class="siTitle evTnH1">...</h3>...';   /* the info sheet */
EvTopNav.watch(wrap.querySelector('.siScroll'), wrap.querySelector('.prNav'), wrap.querySelector('.siTitle'));
```
Sites: evSolo (`cls: 'sgmNav'`, Back or Close, title `#<key>T`), Results received / info sheets (`.prNav`), the records filter, the Service detail (`titled()` rule), the Container and Header docs. A control that keeps an old class (`.arClose`, `.prX`) for its handler passes it as `closeCls`/`backCls`.

**Pitfalls.** Never a hand-made head with its own discs or ground. The flows (Async report, Health profile, Step flow) keep their `.arHeadRow` markup (progress rides in it) with the 44 discs only. EvChat's `.chHead` is not on it yet (#273). The old `.sgmHead` is only the fallback when `EvTopNav` is missing.

---

## Header overlap (`window.EvOverlap`)

**What.** One pattern for a page with a photo at its top: the hero is sticky under the bar while the sheet slides over it; the picture rises and dims, the title drifts up and fades. The bar (`.hoBand`) is dark over the photo from the first pixel of scroll, then the screen's mode once the sheet's top reaches the bar's foot. Scroll-driven animations on the compositor where supported, a once-a-frame script elsewhere. Doc numbers are the master (Save setup).

**Where.** `grep -n "window.EvOverlap = "` (~19674); CSS `grep -n -- "--hoOverlap"` (tokens, `.hoHero/.hoPic/.hoWords`, `.hoTl`, `.hoBand`); doc `grep -n "HO_C\|const glHo\|glHoWire"`; doc phone `.hoStage/.hoPh/.hoSc/.hoDBand/.hoDHero`. Tab `data-gl="ho"`; top bar Save calls `EvOverlap.save()` when `docCur === 'gl'`.

**API.** `window.EvOverlap = { M, D, sda, apply(sc, hero, o), bind(sc, o) -> { update }, mark(sc), set(k, v), save() -> bool, reset() }`. bind options: `hero` (selector, default `.hoHero`, or a function), `short` (true or a function: span capped to the page's scroll), `onFrame(k, on, hero)` (k progress 0..1, on = sheet under the bar), `band` (default `.hoBand`), `sheet` (default `.hoSheet`). Markup: `.hoHero .hoPic .hoWords .hoSheet .hoBand` or `data-ov="hero|img|title|sheet|band"` (`mark()` adds classes and puts `.ovGround` with 10 `<i>` blur bands in each band). State: `.hoTl` on the scroller, `.hoBand.on`, `.hoBand.hoOnSheet`. Tokens (`:root`, by `tok()`): `--hoOverlap --hoRadius --hoRise --hoDim --hoTint`; CSS-only `--hoPicPos` (50% 22%), `--hoBleed` (38px), `--hoGndDk` (#0f0f0f); per page `--hoBarH` (64px; 130px on the phone), `--hoGnd`; per hero `--hoSpan --hoWy` (SDA) or `--hy --hk --hpy` (fallback).

**Rules.** `M = { ty: .25, rise: 32, end: 40, overlap: 28, radius: 24, dim: .35, tint: .85 }`. Doc controls (min-max/step): ty 0-.5/.05 (title drift), rise 0-64/2, dim 0-1/.05, overlap 0-48/2, radius 0-40/2, end 0-160/8 (fade ends at hero height − end), tint 0-1/.05. Span = max(60, heroHeight − end); with `short`, min(H − end, scrollHeight − clientHeight), at least 60. Sheet: margin-top −overlap, top corners radius. `.on` at scrollTop > 0; `.hoOnSheet` when the sheet's top is at or above the bar's foot (130 XS, 64 desk). Bar ground: tint→0 gradient over bar + 38 on 10 blur bands (14 px down to 1.5); over the photo only 4 bands (2.5, 7, 14, 18.5). Changes ease .28 s; reduced motion keeps fades, no travel. Activity plan hero 265 XS / 320 S / 360 desk. Saved key `everlab:hoMaster` (JSON of M), read by `load()` at parse on every page; `reset()` removes it.

**How to use.** Mark the parts, make the hero img `height:calc(100% + var(--hoRise))`, set `--hoBarH` and `--hoGnd` on the band, bind once per scroller, call `update()` after a page or tab change:
```js
const fx = window.EvOverlap ? window.EvOverlap.bind(act, { hero: '.plATop', onFrame: under })
  : (act.addEventListener('scroll', under, { passive: true }), { update: under });
```
Sites: Activity plan (hero `.plATop`, `data-ov` markup), Nutrition plan (`.plNTop`), Service detail `heroFx` (`hero: '.svmHero', short: () => body.svTaskOn`), Appointment `apFx` (function hero), doc phone `E.bind(sc, { hero: '.hoDHero', onFrame })`.

**Pitfalls.** (1) Never write per-frame inline styles or a per-page parallax (old pages lagged 4-18 px). (2) Never fade the `.hoBand` or a parent: a faded parent cuts the backdrop blur. (3) A hero's overflow:hidden makes it a scroller, so the timeline is named `--hoSc` (never `scroll(nearest)`). (4) Don't cache the span: `bind()` measures it (ResizeObserver plus every frame); one measured hidden came out 60. (5) Always take the master's numbers. (6) No photo (Nutrition at M/L/XL) = no overlap, no corners. (7) Firefox / older Safari take the script path (slight lag; the doc's Performance row says so). (8) The doc phone isn't the master XS frame.

---

## Desk page panels (`#dMain #dOver #dSvc #dTl #dApt #dAcc #dPlan #dMkt`)

**What.** On the desk each page is a card that owns its scroll, floating over the shell ground (`--shellBg` #181818) right of the sidebar, 16 below the shell's top, 12 px top corners. At forced S/XS the panel becomes the device's screen.

**Where.** Shared rule `grep -n "#dMain, #dOver\|#dMain,#dOver"` (~561-596: position, top 16, radius, padding, transitions, sideMin left 72, the one cap); the shell strip and `--pnCap` in the `.dash` rule (`grep -n -- "--pnCap"`); per page `grep -n "^#dSvc\|#dApt{\|#dAcc{\|#dPlan{\|#dMkt{\|#dTl{"`; S/XS reset near the container tokens (~10240); the tablet's `body.tabM .dash`.

**API.** The eight ids; `.dash` (padding-left 224, 72 with `body.sideMin`), `--shellBg`, `--pageBg`, `--sideW` (224 / 72 retracted / 200 tablet / 0 at S/XS; registered with `@property` so it slides with the retract), `--pnCap` (on `.dash`: `min(1584px - var(--sideW), 100% - var(--sideW) - 16px)`; 1020 on the tablet). Visibility by body classes: `body.m9` (Overview shell) plus `svcOn tlOn plOn mkOn aptOn accOn`.

**Rules.** Shared: absolute; left 224 (72 sideMin); right 0; bottom 0; top 16; overflow-y auto; radius 12 12 0 0; background `var(--pageBg)`; padding 32 40 60; scrollbar hidden (`scrollbar-width:none` + `::-webkit-scrollbar`); `transition: left .32s cubic-bezier(.2,.8,.2,1)`. Cap: one for every panel, `max-width: var(--pnCap)` in the shared rule (1360 open, 1512 retracted, 8 off the rail and the frame's edge, centred past that); no page sets its own. Its 100% is the shell's own width, so a docked Flow or Tweaks column is already taken out. The shell strip (`.dash` background) is sized in CSS from the same sum (rail + half of what the cap leaves + 40), so the gap and the top-left corner show on every page with nothing measured. Per page: `#dApt` 32 40 80; `#dTl` 32 40 80; `#dAcc` 32 40 0; `#dPlan.plDesk` 32 40 0 on `--plSh` (its subpages' `.plPStage` pad `--plPPad` 40, 16 at S/XS); `#dMkt` 32 `var(--mkPx:40px)` 60; `#dOver` `var(--ctPadY)` with its `--ctSm` 1080 content centred by `calc((var(--pnCap) - var(--ctSm)) / 2)` and 60 at the foot. `body.m9 .dash{overflow-y:hidden}`. S/XS: left 0, top 0, radius 0, max-width none.

**How to use.** A new desk page: add its id to the scrollbar rule, the position block, the sideMin left 72, the transition, and the S/XS reset. Nothing else: the cap and the shell strip come from `--pnCap`; never give a page its own max-width.

**Pitfalls.** (1) A missed selector list shows a scrollbar, a square corner or the wrong left after retracting. (2) Padding is inconsistent (32 40 vs tokens). (3) A per-page `max-width` or a different cap sum breaks the strip: the gap and the top-left corner show only while the panel's left matches `--pnCap`'s sum. (4) The scrollbar must never take width.

**Out of scope here.** The Insights tablet (`body.tabM #dMain`, Auto 600-991) keeps its own 200 rail, flush, 28 padding. Page titles still differ in size (Overview 24, Insights / Timeline 26, Plan 28, Account / Appointment 32).

---

## Home indicator and safe areas (`--evHome`, `.mHome`, `env()`)

**What.** XS footers get the home space: 34 px at the foot of the drawn phone with the home bar (134 x 5) in it, footer actions 16 above. On a real phone (Auto) the space is `env(safe-area-inset-bottom)`, no bar drawn.

**Where.** `grep -n -- "--evHome:0px"` (~5825); `.mTabs .mHome` (~1200); doc `.glDemoFoot`, `.mdHome`; `#phone` env() padding (~1051); EvConsent sheet padding.

**API.** `--evHome`: 0px default; 34px on `html:not(.bpAuto) body[data-bp="xs"]` and `.aqWrap.aqDev.aqBpXS`; `env(safe-area-inset-bottom, 0px)` on `html.bpAuto body`. Bars: `.mTabs .mHome`, `::after` on `.aqFrame .cnDev .grDev .clDev .rfDev`, `.mdHome` in docs. `--ar-foot-bottom:calc(16px + var(--evHome))` in report sheets. `--navLift` (29px; 14px when fullscr or bpAuto).

**Rules.** Bar 134 x 5, bottom 8, radius 3; rgba(255,255,255,.26) dark / rgba(0,0,0,.24) light. Shown only in the drawn frame (hidden in `body.fullscr`, `html.bpAuto`). Footers 16 over the 34 (50 from the bottom) on XS. Doc tables: "CTA 56 pill · 16 sides · 34 under it (home indicator)"; sheets "8 top · 16 sides · 34 bottom". Dock 29 above the bottom, 16 clear of the indicator.

**How to use.** `padding-bottom:calc(16px + var(--evHome))`; for a sheet that can also be full screen `calc(16px + max(var(--evHome, 0px), env(safe-area-inset-bottom, 0px)))` (EvConsent). Draw a bar only under `html:not(.bpAuto)` at forced XS: `left:50%; bottom:8px; width:134px; height:5px; margin-left:-67px;` .26 / .24.

**Pitfalls.** (1) Many footers hard-code 34 (`.plNShP`, `.mkDetFoot`, `.mkCartFt`, `.glDemoFoot`, `.mdFoot`) and keep it in Auto. (2) Keep the dock lift a single variable (`--navLift`): an old padding shorthand once left the dock 1 px off. (3) S gets `--evHome` 0, but its dock carries the bar. (4) The old `--ar-foot-bottom:40px` is superseded on XS by 16 + `--evHome`.

---

## Design system page shell and the General layout tab

**What.** Design system is the page-menu value `'ds'`. It shares the Documentation shell (`#docPage`, `window._doc`) with its own tabs. General layout has a left aside with four parts (Header, Top nav, Container, Header overlap), each with a note, and a main column.

**Where.** `grep -n "o.value = 'ds'"`; `grep -n "const DOCS\|DSET = \|docLast"`; `docShow`; `#tkDocSave` mapping (`grep -n "docCur === 'sf'"`); `docHash`; `const glDoc`; home card `doc: 'gl', wide: true`; CSS `.ldSide/.ldPats/.ldNotes`, `.glMain/.glSec`.

**API.** `window._doc.show(k, set)`, `hide()`. `DSET = ['gl','sf','md','bb','nv','ld']`; `docLast = { doc:'pt', ds:'gl' }`. Hashes `#general-layout #step-flow #modals #chat-bubbles #navigation #loading-states`, and `#design-system` (last tab open). Parts: `[data-gl="hdr|tn|ct|ho"]` buttons, `[data-glv]` views, `[data-gln]` notes, `pick(k)`. Keys `everlab:glPart`, `everlab:glBp`, `everlab:glCt` (UI only). `body.docOn`, `body.dataset.docSet`.

**Rules.** Parts: `[data-gl="hdr|tn|ct|ho"]` (Header, Top nav, Container, Header overlap). Pages take their numbers from the masters the doc drives. The Design system pages have no Tweaks group, so nothing in Tweaks overrides a saved master. The bar's Save maps `'sf'` → `EvSteps.save`, `'gl'` → `EvOverlap.save`, `'md'` → `EvDismiss.save` (Navigation has its own `.nvSave`).

**How to use.** New General layout part: a `[data-gl]` button in `.ldPats`, a `[data-gln]` note, a `[data-glv]` view built by its own function (like `glCt`, `glHo`); extend `pick()` if it needs a refresh on show (`el._hoUp`); a master gets `save()` and joins the `#tkDocSave` mapping. New tab: an entry in `DOCS` (`el`, `t`, `hash`) and in `DSET`.

**Pitfalls.** (1) Views built while hidden measure zero: refresh on pick and with ResizeObserver. (2) Specimen tables (CT, Sizes, HO rows) are hand-written copies: update with the code. (3) New doc phones use `--evPhR/--evPhBz` and 393 x 852.

---

## Viewport centring with docked panels (`--vwC`, `html.tkDocked`, `html.flowDocked`)

**What.** A forced frame and the Auto desk centre in the room left by Tweaks (docked right, 320), the Flow panel (docked left, 320) and an open + section panel.

**Where.** `grep -n "html.tkDocked\|html.flowDocked"` (~101-109); `shiftOn`/`shiftOff` (~37420).

**API.** `--vwC` (default 50vw), `--tkDockW:320px`, `--flDockW:320px`; `html.tkDocked`, `html.flowDocked`, `html.tkFlMove` (left .45s cubic-bezier(.2,.8,.2,1)).

**Rules.** tkDocked: `--vwC = (100vw − 320) / 2`. flowDocked: `320 + (100vw − 320 − tkDockW) / 2`. Auto: `.dash` right = tkDockW, `.dash`/`.side` left = flDockW. `.aqWrap.aqFull` follows. + panel: `--vwC = max(bpW/2 + 16, min(current, (innerWidth − dock − 500)/2))`. The XS fit-scale counts the docked panels too (room = window less 320 each).

**How to use.** Any fixed framed surface: `left:calc(var(--vwC, 50vw) - var(--bpW) / 2); width:var(--bpW);`. Never 50% or 50vw directly.

**Pitfalls.** (1) Pinning a framed modal to a docked column showed the Overview in a strip beside it: use `--vwC`. (2) The floating "‹ Back" pill beside the phone (`.tkFlBack`) is hidden everywhere ("remove that, dont need as we have the flow panel"): the Flow panel steps back; don't bring it back.
