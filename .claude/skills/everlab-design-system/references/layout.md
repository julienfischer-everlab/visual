# Layout: breakpoints, frames, container, header, Top nav, Header overlap, Page types, desk panels, main page titles, Flow panel

All anchors are in `index.html` unless named. Line numbers are approximate (`~`) and drift; grep the pattern.

---

## Breakpoints and the Viewport select (XS / S / M / L, forced vs Auto)

**What.** The top bar's `#stBp` (Auto, XS, S, M, L). A forced value sets `body[data-bp]` and frames the whole app at that breakpoint's floor width, centred. Auto follows the window; under 600 px Auto behaves as XS with no device frame (`html.bpAuto`). No XL option: the app draws XL as L (XL exists only in docs, e.g. Step flow at 1920, and in page container queries).

**Where.** `grep -n 'id="stBp"'` (~14452, inside `span#bpGrp`, readout `span#tkVw`), `#tkBpSave`; logic: the "Layout tweak" block (`grep -n "W = { xs: 393"` ~44164, `autoBp`); persistence `grep -n "everlab.bp"`; Insights family `responsiveSync` / `responsiveTarget`; CSS container tokens and `.dash` framing (`grep -n "body\[data-bp\] .dash{"` ~10382).

**API.**
- `#stBp` value `auto|xs|s|m|l`; `#tkVw` readout `NNN px · XS`; `#tkBpSave` (gets `[data-dirty]` while the shown value differs from the kept one).
- `body[data-bp="xs|s|m|l"]` (absent in Auto at 600 px and wider); `html.bpAuto` (Auto under 600: `data-bp='xs'`, no frame).
- `BP = w => w >= 1440 ? 'L' : w >= 992 ? 'M' : w >= 600 ? 'S' : 'XS'`; `W = { xs: 393, s: 600, m: 992, l: 1440 }`; `autoBp()` on resize fires the select's change when 600 is crossed. A change sets `body.dataset.bp`, calls `placeSvcV4()`, `read()`, then dispatches `resize`.
- `--bpW` on body (and on `.aqWrap.aqBp*`): 393 / 600 / 992 / 1440px; `html.bpAuto body[data-bp=xs]` 100vw. A forced M or L is `min(992px | 1440px, calc(100vw - var(--flDockW, 0px) - var(--tkDockW, 0px)))`: never wider than the room beside a docked Flow or Tweaks column ("where are all cta on buy gift exp": the gift's Close had gone off the window).

**Rules.** Floors XS 393, S 600, M 992, L 1440. Forced `.dash`: width `var(--bpW)`, left `calc(var(--vwC, 50vw) - var(--bpW) / 2)`, hairline `box-shadow 0 0 0 1px rgba(255,255,255,.08)`. At S/XS the sidebar is hidden (`--sideW:0px`), panels get left 0, top 0, radius 0, no max-width. Insights uses its own boundaries: under 640 mob, under 1024 tab, else desk; forced XS/S picks phone, M/L desk. Saved key: localStorage `everlab.bp` (restored on load with change dispatched).

**How to use.**
```js
const bs = document.getElementById('stBp');
bs.value = 'xs'; bs.dispatchEvent(new Event('change', { bubbles: true }));   /* force XS */
bs.addEventListener('change', () => setTimeout(fit, 60));                    /* react, after a tick (evSolo's fit does this) */
const bp = document.body.dataset.bp;                                          /* undefined = Auto on a wide window */
```
Real sites: home card Timeline Mobile (P entry `bp:'xs'`), the phone's More > Plan, standalone hashes via `put('stBp','xs')`.

**Pitfalls.** (1) Auto on a wide window has NO `data-bp`: test its absence for the desk. (2) Dispatch with `bubbles:true` (listeners sit on document). (3) `#tkBpOpen` no longer exists, so the "open in a new window" handler is dead; `#tkBpSave`'s title still says "Open the prototype at this viewport" but it only saves. (4) `setMode` rewrites `body.className`: breakpoint state lives on `<html>` (`bpAuto`), never in body classes. (5) Several breakpoint sets coexist: 600/992/1440 (tokens, readout), 640/1024 (Insights), container queries in Plan and marketplace (S from 480, M 640, L 1000). (6) XS is 393 in code though old comments say 402. (7) A forced M/L's `--bpW` can be narrower than its floor with panels docked: read `--bpW`, never 992 / 1440.

---

## XS phone / S tablet frame (`#bpFrame`, `--evPh*` / `--evTb*`, the 852 device)

**What.** The device drawn round a forced XS (iPhone) or S (tablet): a fixed, pointer-events-none overlay with the bezel, the status strip (`.bpStatus`), the dock cloned into it (`.mTabs` with `.mHome`), the drawn keyboard (`.mKbd`) and the Overview's suggestion chips (`.ovSug`). The bezel tokens are THE phone and tablet frames: docs' phones, standalone shells (`.cnDev`, `.grDev`, `.clDev`, `.rfDev`) and Step flow's `.sfDev` take them.

**Where.** Markup `grep -n 'id="bpFrame"'` (~15351); tokens `grep -n -- "--evPhR:"` (~10420); placement in `resize()` (`grep -n "const XS_H = 852"` ~31359); scale list `grep -n "html.bpFit:not(.bpAuto)"` (~10456); the corner clip `grep -n "clip-path:inset(0 round 56px)"` (~10417). Doc: General layout > Header > Demo frames; every DS phone (`.sfDevXS`, `.ldDevXS`, `.hcScr`, `.hoPh`, `.ptPh`).

**API.**
- Tokens: `--evPhR:56px`; `--evPhBz:0 0 0 5px #000, 0 0 0 11px #3b3b40, 0 0 0 12px rgba(255,255,255,.14)`; `--evTbR:28px`; `--evTbBz:0 0 0 9px #000, 0 0 0 16px #3b3b40, 0 0 0 17px rgba(255,255,255,.14)`.
- On `<html>` (written by `resize()`): `--barH`, `--bpTop`, `--bpBot`, `--bpS` (XS scale) and `html.bpFit` (scale < 1); `--dSt` on `.dash`. `--bpW` on body. `--vwC` is the centre (see Viewport centring).
- `body[data-bp="xs"] #bpFrame{border-radius:var(--evPhR);box-shadow:var(--evPhBz)}`; `body[data-bp="s"] #bpFrame{border-radius:28px;box-shadow:var(--evTbBz)}`.
- The corner clip: `html:not(.bpAuto) body[data-bp="xs"] :is(.dash, .lp, .aqWrap.aqDesk){clip-path:inset(0 round 56px)}`; `html:not(.bpAuto) body[data-bp="s"] :is(.dash, .lp){clip-path:inset(0 round 28px)}`.
- `window.evK(el)`: how much smaller `el` is drawn than its CSS pixels (scaled XS device or a scaled doc phone).

**Rules.**
- **XS is always 393 x 852** ("All XS need a minimum height 852px", merged #266). Centred in the room under the bar with at least 16 above and below. A window too short (or too narrow: room = window less 320 for each docked Tweaks / Flow panel) keeps the 852 and scales the whole device: `s = max(.2, min(1, (av - 32) / 852, (room - 32) / 393))`, written as `--bpS`, `html.bpFit` when s < 1. `--bpTop/--bpBot` stay the 852 frame's own top and foot.
- One `scale:var(--bpS, 1)` on every layer laid in the frame's rect: `.dash, #bpFrame, .lp, .aqWrap.aqDesk, .ccPage, .clDev, .rfDev, .grDev, .cnDev, .gfPage iframe, #phoneShell, #phoneShell2`. A new framed layer must join that list.
- **The screen clips everything to its corners** ("make sure the XS frame iPhone clips content, radius covers the screen"): overflow + radius alone let a page sliding in or out (a Page types push: its own composited layer) paint square past the corners in some browsers; the `clip-path` on the same radius holds every layer, fixed ones included. Auto (full screen) has none.
- S frame: 48 under the bar and 48 above the window's foot (fallbacks `calc(var(--barH)+48px)` / `48px`).
- Page radius inside: `.dash` 56 (XS) / 28 (S), scrollbar hidden.
- Status strip XS: padding 18 34 4; time 15/600 .02em; island 96 x 27, top 13, radius 16, border 1px #1a1a19. S: padding 10 22 0, time 12, no island, signal svg scale(.8). Light: ink #000, svg inverted. Forced XS: the strip is a 47 px band (`html:not(.bpAuto) body[data-bp=xs] .dash{border-top:47px solid var(--pageBg)}`); picture-headed pages (`body.svcOn`, `body.aptOn`) run under it (`--stH:47px` on aptOn). Full sheets at `--shTop:5px` (52 on svcOn/aptOn).
- S keeps the phone dock centred at 420 wide. Auto (`html.bpAuto`): no bezel, strip, keyboard or home bar; `#bpFrame` fills the window under the bar. `body.m5`/`m6` (old shells) hide `#bpFrame`.
- Doc phones are 393 x 852 too (Header overlap `.hoPh`, Page types `.ptPh`, Navigation island, Modals XS, Container XS, Step flow, Loading states, Demo frames).

**How to use.** A surface that sits in the frame at forced XS/S copies the standalone pages' geometry:
```css
html:not(.bpAuto) body.X:is([data-bp="xs"],[data-bp="s"]) .xDev{position:fixed;left:calc(var(--vwC, 50vw) - var(--bpW) / 2);width:var(--bpW);top:var(--bpTop, calc(var(--barH,57px) + 48px));bottom:var(--bpBot, 48px);border-radius:var(--evPhR);box-shadow:var(--evPhBz);}
```
(see `.cnDev`, `.grDev`, `.clDev`, `.gfPage iframe`), add `.xDev` to the `html.bpFit` scale list, and to the corner-clip list if anything slides inside it. Drags inside divide screen pixels by `evK(el)`. Copy the status bar at run time from `#bpFrame .bpStatus` (glDoc's `sb`, Loading states, evSolo's `.aqStat`).

**Pitfalls.** (1) No drop shadow: the master is a bezel only ("the SAME iPhone frame all the time, meaning NO shadow"). (2) Hard-coded copies drift: `border-radius:56px` in `.dash`/`.lp` at XS, the clip's 56 / 28, `.mdFr.mdPhone`, `.rfDev`, `#dOver .ovDimD`, `.aqWrap` at XS. (3) The S frame's radius is a literal 28px, not `var(--evTbR)`. (4) `#bpFrame` doesn't clip: the dock's `::before` inherits the frame's bottom radii. (5) Hiding the dock must target `#bpFrame > .mTabs` (and `#phone`, `#phone2`, `.nvFr`). (6) A scaled `.dash` holds its fixed children: the Overview's dim and results notice are placed inside it while `bpFit`. (7) The screenshot CTA measures the scaled device and renders back at 393 x 852 @3x. (8) The clip covers `.aqWrap.aqDesk` at XS only: a full modal at forced S relies on its own radius.

---

## Container tokens and General layout > Container

**What.** The page container: a centred column as wide as the screen up to a max width, padded, sections a gap apart. **The rule: "the max width container is on the body content! Not the viewport"**: the page keeps its padding at the viewport; the top nav and the footer span the screen (inside the padding); only the body's content (and the footer's button) sits in the container. "The container and the breakpoint need to be combined": any breakpoint with any container. The tab shows a live questionnaire page at XS/S/M/L with a Breakpoint and a Container picker, scaled to fit, and a tokens table read off the CSS.

**Where.** Padding / gap `grep -n -- "--ctPadY:24px"` (~10361: `:root`, `@media` 600/992/1440, `body[data-bp=...], [data-ct-bp=...], .aqWrap.aqBp*`); max widths `grep -n -- "--ct2xs: 100%"` (~16863, with `[data-container]`). Consumers: `#dOver`, `#dOver .ovTop`, `.ov5Cards` (padding); `data-container="2xs"` on EvSolo's `.sgmCol`, the flows' desk column via `var(--ct2xs)`; `--ctSm` in the Overview's centring, the Service detail's grid, My journey V2; `--ctXs` the Send a gift desk banner (`.hpGfHero` on `hpWide`: `min(var(--ctXs), 100% - 48px)`). Doc: `grep -n "const ctRead\|const CT_BP\|const CT_MAX"` (~47130: reads the tokens off the CSS through a hidden `[data-ct-bp]` element), CSS `.glCt*`. Tab `data-gl="ct"`.

**API.** `--ctPadY` (top/bottom), `--ctPadX` (sides), `--ctGap` (between sections). Max widths `--ct2xs` (100% XS, 512 S, 544 M, 576 L), `--ctXs` 800, `--ctSm` 1080, `--ctMd` 1280, `--ctLg` 1440; a page names its column `data-container="2xs|xs|sm|md|lg"` (`box-sizing:border-box; width:100%; margin:0 auto; max-width: var(--ct…)`) instead of a max-width of its own. `[data-ct-bp="xs|s|m|l"]` and `.aqWrap.aqBpXS/S/M/L` carry a breakpoint's tokens. Doc: `CT_W` frame sizes (xs 393x852, s 600x760, m 992x760, l 1440x820), `CT_NAMES`, `ctRead(bp)`, `CT_BP`, `CT_MAX`; the pickers `.glCtGrp` with labels "Breakpoints" / "Container size" (`.glCtLbl`), `[data-ctbp]`, `[data-ctc]`; classes `.glCtStage`, `.glCtSc`, `.glCtFr`, `.glCtWrap`, Show sizes in the right panel (`.glRed` on `.glMain`).

**Rules.** XS / S / M / L: padding top-bottom 24 / 28 / 32 / 36; left-right 16 / 16 / 24 / 24; gap 24 / 28 / 32 / 36. Max-width table: `layout/container/max-width/2xs` Full / 512 / 544 / 576 for a flow's page or a standalone modal's body; xs 800; sm 1080; md 1280; lg 1440. Media queries min-width 600, 992, 1440; a forced `data-bp` overrides them. Doc UI keys `everlab:glBp`, `everlab:glCt`, `everlab:glPart`. No saved setup (not a savable master).

**How to use.**
```js
'<div class="sgmCol" data-container="2xs">' + body + '</div>'                                       /* EvSolo: the body in the 2xs column, the bar spanning */
```
```css
padding:var(--ctPadY) var(--ctPadX); gap:var(--ctGap);
margin:0 calc(-1 * var(--ctPadX)); padding:0 var(--ctPadX);                                        /* bleed a row (.ov5Cards) */
top:calc(-1 * var(--ctPadY)); margin:calc(-1 * var(--ctPadY)) calc(-1 * var(--ctPadX)) 0;         /* sticky bar (#dOver .ovTop) */
width:min(var(--ctXs, 800px), calc(100% - 48px));                                                  /* a desk banner (Send a gift) */
```
Flow pages cap at the 2xs column on the desk (544 M, 576 L, inside 20 sides: 584 / 616).

**Pitfalls.** (1) Only the Overview reads the padding tokens; `#dMain #dSvc #dTl #dApt #dAcc #dMkt` hard-code 32 40. (2) The desk Overview overrides to `--ctPadY:32px; --ctPadX:40px` (`body:not([data-bp="xs"]):not([data-bp="s"]) #dOver`), so the doc's M/L 24 isn't what it shows. (3) The doc reads the tokens off the CSS: change the `:root` / `@media` / `body[data-bp], [data-ct-bp], .aqWrap.aqBp*` rules, never a copy. A new token needs both the media query and the forced override. (4) `#dOver` centres its 1080 content with `padding: var(--ctPadY) max(var(--ctPadX), calc((var(--pnCap) - var(--ctSm, 1080px)) / 2)) 60px`. (5) The doc's Use column is hand-written and stale: it says xs is "None yet", but Send a gift's desk banner reads `--ctXs`. Off-token widths it lists: My journey V1 760, the report's and profile's 536 / 568 / 560.

---

## Header (General layout > Header; `--hdr*`)

**What.** The documented head every page shares. Phone (XS/S): status bar, nav bar (Back, modal title, Close), page title (questionnaire 32 or page 24). Desk (M/L): no status bar, Back/Close (44, as the phone's: "CTA top nav always 44px") at the column's edges, 20 page title. Drawn live from `--hdr*`, with Show sizes labels, demo frames and a Sizes table. Its side description was removed ("remove desc").

**Where.** `grep -n -- "--hdrSb:54px"` (~7277); doc CSS `.gl*`; builder `grep -n "const glDoc"` (~47015; `nav()`, `phone()`, `demo(k)`). Tab `data-gl="hdr"` (default), link `#general-layout`.

**API.** `--hdrSb:54px; --hdrNav:76px; --hdrSide:16px; --hdrGap:16px; --hdrBtn:44px; --hdrNavT:18px; --hdrNavTL:24px; --hdrQ:32px; --hdrQL:40px; --hdrPg:24px; --hdrPgL:30px; --hdrNavDk:64px; --hdrSideDk:76px; --hdrBtnDk:44px; --hdrPgDk:20px; --hdrPgDkL:26px`. Doc classes `.glFr` (`.glDk`), `.glPart[data-sz]`, `.glSb`, `.glNav`, `.glBtn`, `.glNavT`, `.glTtl` (`.glPg`), `.glBody`, `.glDemo` (`.glDemoxs/.glDemos/.glDemodk`), `.glDemoFoot`, `.glDemoCta`, `.glRed`.

**Rules (Sizes table).**
| Row | XS · S | M · L |
|---|---|---|
| Status bar | The device's: 54 · time left, island, signals right | None |
| Nav bar | 76 Hug (16 + 44 + 16) · 16 sides · 16 between | 64 · 76 sides (the page's column) |
| Back · Close | 44 circle · ink 7% · 16 icon | 44 circle · ink 7% · 16 icon |
| Nav title | 18/24 · 500 · left, after Back | None |
| Title · questionnaire | 32/40 · 500 · −0.4 · 12 above, 32 below: 84 Hug | Same as Title · page |
| Title · page | 24/30 · 500 · 8 above, 16 below: 54 Hug | 20/26 · 500 · 11 above and below: 48 Hug |

Demo frames: XS 393 x 852, S 600 x 860, desk 720 tall with a 544 column (max-width `calc(100% - 48px)`). Foot: 16 16 34 on the phone (CTA 52, radius 26), 20 0 32 on desk (CTA 48). No saved setup.

**How to use.** For a modal's, sheet's, standalone page's or flow's bar use the Top nav master (next section), not these numbers; for a title use the Title group (`EvTitle`, references/tokens-components.md). Real copies of this tab: Modals doc `.mdNav` (76/64, 16/76 sides, `.mdIc` 44 phone and desk), Plan subpages' 24/30 title.

**Pitfalls.** (1) `--hdr*` are read ONLY by the doc's `.gl*`: changing a token changes the doc, not the app. (2) The documented status bar is 54, but forced XS draws a 47 px band and the strip at padding 18 34 4; EvOverlap's bar foot is 130 (54 + 76). (3) Step flow and Modals docs carry their own header rows (e.g. "one row 44 high ... 58 down on XS") that differ; check both.

---

## Top nav (`window.EvTopNav`, `.evTn`; General layout > Top nav, merged #260)

**What.** One bar for every modal, sheet, standalone page and flow with a Back and / or a Close ("General TOP NAV rule (DS). IF no h1 title, keep a safe space at the top. h1 is then part of the Body"; "Top nav always gradient blur by default"). A (title, Close) and B (Back, title, Close): 76 hug (16 + 44 + 16). C (no title): a 32 safe space, the controls floating at their place, the page's H1 the first thing in the body, its words faded into the bar once the H1 has gone under it. The ground is always the gradient blur.

**Where.** `grep -n "window.EvTopNav = "` (~20408, header comment above it; in the Health profile's script block, so health-profile.html carries it); CSS `grep -n "^\.evTn"` (~16822-16917, after the report sheet's styles); doc `grep -n "const glTn\|const glTnWire"` (~47161: variants, XS phones at rest / scrolled, desk, rules table). Tab `data-gl="tn"`. concierge.html copies the ground (`.evTnG`) for its head: change both.

**API.** `window.EvTopNav = { html(o), mount(el, o), watch(scroller, nav, h1, o) -> { update }, titled(h1, bar, sheet), variant(o), IB, IX, IM }`. `o = { back, title, close, more, reveal, cls, backCls, closeCls, moreCls, tag, titleId, backLabel, closeLabel, moreLabel, backIcon, closeIcon, attr }`; `variant`: title → `'a'` (or `'b'` with back), else `'c'`. Markup `div.evTn.evTnA|B|C[data-tn] > .evTnG (10 <i>) + button.evTnBtn.evTnBk + .evTnT | .evTnFt > span + button.evTnBtn.evTnX|.evTnMore`; `.evTnHasBk`, `.evTnHasX`. The body's H1 gets `.evTnH1` (clearance from the controls; `.evTnClr` for a first block that is not the H1). `watch` sets `.evTnOn` (scrollTop > 0: the ground bleeds `--evTnBleed`, 24, further), on C `.evTnTitled` (the H1's middle past the controls' foot, once the page has moved) and `.evTnFar` (the H1's column clear of the controls: no clearance; the 32 band's foot is the line). Host tokens `--evTnTop` (54 under the XS status bar, else 0), `--evTnX` (16 phone, 24 desk), `--evTnGnd`, `--evTnInk`, `--evTnBleed` (24), optional `--evTnDisc` / `--evTnDiscBlur` (a disc's ground and backdrop blur; none set yet); `--evTnD` 44 (also on `:root`, read by bars with their own markup: the Service detail's, the in-app chat's).

**Rules.** A/B: min-height 76 (+ `--evTnTop`), padding 16, gap 16, title 20/28 500 −.1 one line (ellipsis). C: height 32 (+ `--evTnTop`), controls absolute 16 down, `--evTnX` in. Discs 44 ("CTA top nav always 44px": every top bar, phone and desk; a branch had them at 36, undone), ink 6%, 16 icon, hover ink 4%, focus 2px #4b7bec. Title appearing 17/22 600 −.2, centred between the controls, fade + 6 px rise .25 s. H1 under C: 12 clear of a Close (padding-right 56), 40 lower under a Back (both: no right clearance; `.evTnFar`: neither). Ground: `--evTnGnd` at `--hoTint` (.85) masked to nothing over 10 backdrop-blur bands (14 px top to 1.5 foot); sticky at its scroller's top. **Sticky** ("All top nav should have a tweak: Sticky ON / OFF. Put this as a design system level"): `EvTopNav.M.sticky` 'on' (default) or 'off'; Off sets `html.tnFree`, which unpins every top nav (`.evTn`, `#dOver .ovTop`, `body.v4 .mHead`, `.svTop`, `.svmNav`, the Plan's `.plPBar` / `.plNBar` / `.plABar`, `.hoBand`: `position: relative; top: auto`). `set('sticky', v)`, `save()` (`everlab:tnMaster`, read at parse on every page, shared through `EvShared` under masters/), `reset()`, `load()`. Driven from General layout → Top nav (its Sticky control, Save setup) and Tweaks → Top nav → Sticky (`#stTnSticky`, a `tkProxy` of the master, shown on every app page; the Tweaks' Save and Reset keep it). A new page top bar that pins must join the `html.tnFree` list. A control that keeps an old class is still forced to the master's disc (`html:not(#_m):not(#_d) .evTn .evTnBtn.evTnBtn` 44 !important, over the every-dismiss 36). Reduced motion: no transitions. **Style and per page** ("a control on the top navigation for each page ... If it's fixed, have two variants: gradient or field or transparent"): `EvTopNav.M.bg` ('grad' default, 'fill', 'clear'; `set('bg', v)`, saved with Sticky in `everlab:tnMaster`, presets keep it as `tnb`) is the default; each page takes its own Fixed and Style in Tweaks → Top nav (`#stTnSticky`, `#stTnBg`; picks in the hidden `#stTnPg`, JSON by `EvCt.cur()` key, kept by Save and presets). The page's values land on `html.tnFree` and `html[data-tnbg]`; CSS beside the master's covers `.evTnG`, the Overview's `.ovTop`, `.svTop`, `.svmNav`, the Plan's `.plPBar`, `.hoBand`, the Timeline's `.t3Bar` and the step flows' `.arSheet` bar (Filled: the flow starts at the bar's foot; Transparent: under all of it, `--ar-hh`). The Timeline's Fixed is Tab top's own (`#stT3TabFix`); the step flows (ar, hp, wel, sgf) have no Fixed row. A new page bar joins the `html[data-tnbg]` rules.

**How to use.**
```js
body = '<div class="siScroll">' + EvTopNav.html({ close: true, closeCls: 'prX siX', cls: 'prNav' }) + '<h3 class="siTitle evTnH1">...</h3>...';   /* the info sheet: C */
EvTopNav.watch(wrap.querySelector('.siScroll'), wrap.querySelector('.prNav'), wrap.querySelector('.siTitle'));
TN.html({ close: true, closeCls: 'arClose', cls: 'sgmNav', title: ttl, titleId: key + 'T', tag: 'h2' });                                         /* EvSolo with cfg.bar: A, the Activity session */
```
Sites: EvSolo (`cls: 'sgmNav'`, Back or Close; C with the title the body's `h2.sgmT.evTnH1`, or A with `cfg.bar`, its words held to the 2xs column from S by `.aqWrap.evSolo .sgmNav.evTnA{padding-left:max(var(--evTnX), calc((100% - var(--ct2xs)) / 2))}`), Results received / info sheets (`.prNav`), the records filter, the Service detail (`titled()` rule), the Container and Header docs (the Top nav doc's H1s are the Title group master's, `EvTitle`: H2, H3 in the variants). A control that keeps an old class (`.arClose`, `.prX`) for its handler passes it as `closeCls`/`backCls`.

**Pitfalls.** Never a hand-made head with its own discs or ground. The flows (Async report, Health profile, Send a gift, Step flow) keep their `.arHeadRow` markup (progress rides in it) with the master's 44 discs only (`.arHeadRow > .arIconBtn` 44 !important, at the row's top, the row 44: 58 XS, 44 S, 16 desk). Bars with their own markup take the 44 and the insets: the Service detail (XS `.svTop` 119 tall, Back and More 70 down and 16 in, the title coming in on their line; `.svmNav` 72 tall, 16 under the strip and 12 under them), the Plan sub pages' Back (44 at 70, at the top of the 130 band; its title at 80, 76 in), EvChat's `.chHead` and the Concierge's `.hd` (44 controls, own markup: the Chat top bar rework #273 is still pending, references/chat.md). The desk's in-page Backs are not top navs and keep their size (Service detail `.svBack` 28, the Plan's desk Back 32, the Page types doc's desk panel 32). A titled bottom sheet is not a top nav: it wears the sheet header master (references/flows-modals.md). The old `.sgmHead` is only the fallback when `EvTopNav` is missing.

---

## Header overlap (`window.EvOverlap`)

**What.** One pattern for a page with a photo at its top: the hero is sticky under the bar while the sheet slides over it; the picture rises and dims, the title drifts up and fades. The bar (`.hoBand`) takes its ground (tint and blur) gradually once the scroll passes a delay, then the screen's mode once the sheet's top reaches the bar's foot. Scroll-driven animations on the compositor where supported, a once-a-frame script elsewhere. Doc numbers are the master (Save setup).

**Where.** `grep -n "window.EvOverlap = "` (~20362); CSS `grep -n -- "--hoOverlap"` (tokens, `.hoHero/.hoPic/.hoWords`, `.hoTl`, `.hoBand`); doc `grep -n "HO_C\|const glHo\|glHoWire"` (~47070); doc phone `.hoStage/.hoScale/.hoPh/.hoSc/.hoDBand/.hoDHero`. Tab `data-gl="ho"`; top bar Save calls `EvOverlap.save()` when `docCur === 'gl'` and the shown part is not Page types or Title group. tools/build.js carries this CSS and script into `dist/referral.html` at `<!--ev:master EvOverlap css/js-->` (it fails the build if the cut has no `bind` / `mark`).

**API.** `window.EvOverlap = { M, D, sda, apply(sc, hero, o), bind(sc, o) -> { update }, mark(sc), set(k, v), save() -> bool, reset() }`. bind options: `hero` (selector, default `.hoHero`, or a function), `short` (true or a function: span capped to the page's scroll), `onFrame(k, on, hero)` (k progress 0..1, on = sheet under the bar), `band` (default `.hoBand`), `sheet` (default `.hoSheet`). Markup: `.hoHero .hoPic .hoWords .hoSheet .hoBand` or `data-ov="hero|img|title|sheet|band"` (`mark()` adds classes and puts `.ovGround` with 10 `<i>` blur bands in each band). State: `.hoTl` on the scroller, `.hoBand.on`, `.hoBand.hoOnSheet`, `--hoK` (0..1) on the band. Tokens (`:root`, by `tok()`): `--hoOverlap --hoRadius --hoRise --hoDim --hoTint`; CSS-only `--hoPicPos` (50% 22%), `--hoBleed` (38px), `--hoGndDk` (#0f0f0f); per page `--hoBarH` (64px; 130px on the phone), `--hoGnd`; per hero `--hoSpan --hoWy` (SDA) or `--hy --hk --hpy` (fallback).

**Rules.** `M = { ty: .25, rise: 32, end: 40, overlap: 28, radius: 24, dim: .35, tint: .85, delay: 48, ramp: 64 }`. Doc controls (min-max/step): ty 0-.5/.05 (Title drift), rise 0-64/2, dim 0-1/.05, overlap 0-48/2, radius 0-40/2, end 0-160/8 (fade ends at hero height − end), tint 0-1/.05, delay 0-160/4 (Ground delay), ramp 0-200/4 (Ground fade). Span = max(60, heroHeight − end); with `short`, min(H − end, scrollHeight − clientHeight), at least 60. Sheet: margin-top −overlap, top corners radius. Bar ground: `--hoK = clamp((scrollTop − delay) / ramp, 0, 1)` scales the tint and each band's blur (nothing to 48, full at 112 with the defaults); `.on` once `--hoK` > 0; `.hoOnSheet` (k = 1) when the sheet's top is at or above the bar's foot (130 XS, 64 desk), the switch to the screen's own ground easing .28 s. Ground: tint→0 gradient over bar + 38 on 10 blur bands (14 px down to 1.5); over the photo only 4 bands (2.5, 7, 14, 18.5). Reduced motion keeps fades, no travel. Activity plan hero 265 XS / 320 S / 360 desk. Saved key `everlab:hoMaster` (JSON of M, finite numbers only), read by `load()` at parse on every page; `reset()` removes it.

**How to use.** Mark the parts, make the hero img `height:calc(100% + var(--hoRise))`, set `--hoBarH` and `--hoGnd` on the band, bind once per scroller, call `update()` after a page or tab change:
```js
const fx = window.EvOverlap ? window.EvOverlap.bind(act, { hero: '.plATop', onFrame: under })
  : (act.addEventListener('scroll', under, { passive: true }), { update: under });
```
Sites: Activity plan (hero `.plATop`, `data-ov` markup), Nutrition plan (`.plNTop`), Service detail `heroFx` (`hero: '.svmHero', short: () => body.svTaskOn`), Appointment `apFx` (function hero), Send a gift's intro (`EvOverlap.bind(scr, { hero: '.hpGfHero', band: '.hpGfBand', sheet: '.hpGfBody', onFrame })`), the Gift referral (referral.html, `hero: '.rfTop'`, `short: true`), doc phone `E.bind(sc, { hero: '.hoDHero', onFrame })`.

**Pitfalls.** (1) Never write per-frame inline styles or a per-page parallax (old pages lagged 4-18 px). (2) Never fade the `.hoBand` or a parent: a faded parent cuts the backdrop blur. (3) A hero's overflow:hidden makes it a scroller, so the timeline is named `--hoSc` (never `scroll(nearest)`). (4) Don't cache the span: `bind()` measures it (ResizeObserver plus every frame); one measured hidden came out 60. (5) Always take the master's numbers. (6) No photo (Nutrition at M/L/XL) = no overlap, no corners. (7) Firefox / older Safari take the script path (slight lag; the doc's Performance row says so). (8) The doc phone is the app's XS frame now (`.hoPh`: `--evPhR`, `--evPhBz`, home bar, 12 round the 393 x 852 screen, fitted by `EvDocPanel.room`); keep it on the tokens. (9) A Bar ground test at scrollTop 1 shows nothing now (the delay): scroll past 48.

---

## Page types (`window.EvPush`; General layout > Page types, merged #274)

**What.** Every page of the app is one of two kinds ("SUB PAGE SHOULD TRANSITION WITH A PUSH effect"; "Page type: main, sub, + demo"). **Main**: a destination of the dock (XS, S) or the sidebar (M and up): Overview, Insights, My journey, Services, the Plan, and More's own (My account, Settings, Contact us, Gift, Refer): switched in place, no move, the dock's or sidebar's entry lit. **Sub**: opened from a page to go deeper (the Service detail, the Appointment page, the Plan's Activity plan, Nutrition plan, Medical actions, My supplements, Wind-down routine, My journey's Past activity): it pushes in from the right over the page it came from, and Back pops it, one master for all. **Not a page**: modals and sheets (bottom sheets, full bottom sheets, floating and full modals, the standalone pages: Async report, Health profile, Past results, the Chat, the Suggestion, the Activity session) keep their own motion.

**Where.** Master `grep -n "window.EvPush = "` (~23376, its own `<script>` after the Health profile's; not in dist/health-profile.html), header comment above it. Doc `grep -n "const PT_C\|const glPt = \|const glPtWire"` (~47083), CSS "General layout -> Page types" (`grep -n "\.ptStage\|\.ptPh"`, ~7390). Tab `data-gl="pt"`. App call sites: `grep -n "EvPush.page("` (the Service detail's `pushIn/popOut`, the Appointment's `pg`, the Plan's `pgP`, My journey's Past button, Escape on the Service detail). The Flow panel waits for a push (`EvPush.after` in `__flowDock`, `html.flWait`). Send a gift's intro ⇄ first step reuses the numbers in the HP module's `pagePush` (`grep -n "function pagePush"`).

**API.** `window.EvPush = { M, D, K, ease, shadow, rm, light, dimOf(), go(o), page(update, o), push(o), pop(o), cancel(), after(fn), frame(), keep(), swipe(host, o), reduced(), busy(), set(k, v), save(), reset() }`.
- `go({ dir: 'push'|'pop', from, to, keep, update, done, now, slow, radius })`: a view transition; `from` the frame(s) that clip the move, `to` the frame(s) after (default `from`), `keep` what stays put over them (status bar, dock), `update()` the change, `done()` once landed (a sheet to open after), `slow` a factor for this run only (the doc's Slow). Inside another's `update`: joins it (one move). Returns the ViewTransition or null.
- `page(update, { dir, now, force, done })`: the app's: the frame is `.dash` on the phone layout (no sidebar showing) or the shown `.dash > .dvMain` panel from M; `#bpFrame` kept on the phone. Animated only for a tap or a key inside the app (`.dash, #bpFrame`, not `.side, .mTabs, .mvRow, ...`) unless `force`; page menu, links, Tweaks, main-page switches stay instant.
- `cancel()`: an instant switch (page menu, dock, sidebar, More, Tweaks, docs) drops a push still waiting for its picture (captured listeners do this). `after(fn)`: fn once no move plays. `swipe(host, { back, when })`: a swipe from the host's left edge (6% of its width, min 16) past a third or a flick (> 40 px at > .5 px/ms) presses `back()`; the app binds it to the phone's `.dash` for `.svBack, .apBack, .plABack, .plNBack, .plPBack`.
- State: `html.evPushing`, `html.evPopping`; a `<style id="evPushCss">` written per run; `view-transition-name` `evPg<i>` / `evPk<i>`.

**Rules.** `M = { dur: 340, dist: 28, dim: .4 }`; curve `cubic-bezier(.2, .8, .2, 1)` (calm, no spring). Push: the new page `translateX(100%) → none`, the page under `none → translateX(-28%)` and `brightness(1 − dim)` (Light: dim × .5, `LIGHT`); the sub page's left edge casts `-12px 0 32px rgba(0,0,0,.28)`. Pop: its own keyframes (not a reversed push, which turns the curve into an ease in). Groups clipped to the frame with its radius; the frame's own corner is off while pictured (square leading edge). A frame that moved meanwhile snaps (only its pages slide). Reduced motion: a 160 ms crossfade (plus-lighter, isolated); no view transitions: at once. Doc controls: Duration 200-700/10, Page under drifts 0-50/1 %, Page under dims 0-.8/.02. Saved `everlab:pushMaster` (finite numbers), read at load on every page; the top bar's Save on General layout saves it while Page types shows.

**How to use.**
```js
const pgP = (f, dir, done) => { if (window.EvPush) return window.EvPush.page(f, { dir, done }); f(); if (done) done(); };   /* the Plan's subpages */
const actShow = (now, from) => now ? actShow0(true, from) : pgP(() => actShow0(false, from));                             /* in: the page's own show inside the update */
const actBackTo = () => { if (actOn) pgP(actBackTo0, 'pop'); };                                                          /* out: Back, the crumb, Escape */
window.__plOpen = (k, o) => { let det = null; pgP(() => { det = plOpen0(k, o); }, 'push', () => { if (det) det(); }); };   /* a sheet after the page lands */
```
A new Sub page: its show / hide do the change at once (no CSS transition of their own), called inside `EvPush.page`; its Back calls `page(hide, { dir: 'pop' })`; add its Back's class to the app's `swipe` list.

**Pitfalls.** (1) Never give a Sub page its own slide (the Plan's old .44 s push and its dim layers were removed). (2) A page that hides the dock lets it fade over the move (it is in the picture). (3) Picking a page from the menu mid-push: `cancel()` must run before the switch (the capture listeners do; a new instant path must call it). (4) Slow is the doc's alone (`go({ slow })`), never the app's. (5) The phone's edge swipe prevents the browser's pan on touch (touchmove preventDefault) so it ends in pointerup. (6) The Page types doc's `.ptPh` is on the master frame tokens; its desk panel's Back is 32 (an in-page Back).

---

## Desk page panels (`#dMain #dOver #dSvc #dTl #dApt #dAcc #dPlan #dMkt`; "follow the setup on overview", merged #270)

**What.** On the desk each page is a card that owns its scroll, floating over the shell ground (`--shellBg` #181818) right of the sidebar, 8 off the rail and the window, 16 below the shell's top, 12 px top corners. At forced S/XS the panel becomes the device's screen.

**Where.** Shared rule `grep -n "#dMain, #dOver, #dSvc, #dTl, #dApt, #dAcc, #dPlan, #dMkt{"` (~576-600: position, top 16, radius, padding, the one cap; the transition and `body.sideMin` left 52 just above, ~569-573); the shell strip and `--pnCap` in the `.dash` rule (`grep -n -- "--pnCap"` ~524); per page `grep -n "^  #dApt{\|^  #dAcc{\|^  #dTl{\|^  #dMkt{\|#dPlan.plDesk{"`; S/XS reset `grep -n 'body\[data-bp="s"\] .dash, body\[data-bp="xs"\] .dash'` (~10385); the tablet's `body.tabM .dash` (~11566).

**API.** The eight ids; `.dash` (padding-left 224, 52 with `body.sideMin`), `--shellBg`, `--pageBg`, `--sideW` (224 / 52 retracted / 200 tablet / 0 at S/XS; registered with `@property` so it slides with the retract), `--pnCap` (on `.dash`: `min(1584px - var(--sideW), 100% - var(--sideW) - 16px)`; 1020 on the tablet). `body.sideMove` (the retract's 420 ms: `will-change: transform` on every panel's children). Visibility by body classes: `body.m9` (Overview shell) plus `svcOn tlOn plOn mkOn aptOn accOn`.

**Rules.** Shared: absolute; left 224 (52 sideMin); right 0; bottom 0; top 16; overflow-y auto; radius 12 12 0 0; background `var(--pageBg)`; padding 32 40 60; scrollbar hidden (`scrollbar-width:none` + `::-webkit-scrollbar`); `transition: left .32s cubic-bezier(.2,.8,.2,1)`. Cap: one for every panel, `max-width: var(--pnCap)` in the shared rule (1360 open, 1532 retracted, 8 off the rail and the frame's edge, centred past that); no page sets its own. Its 100% is the shell's own width, so a docked Flow or Tweaks column is already taken out. The shell strip (`.dash` background) is sized in CSS from the same sum (rail + half of what the cap leaves + 40), so the gap and the top-left corner show on every page with nothing measured. Per page: `#dApt` 32 40 80; `#dTl` 32 40 80; `#dAcc` 32 40 0; `#dPlan.plDesk` 32 40 0 on `--plSh` (its subpages' `.plPStage` pad `--plPPad` 40, 16 at S/XS); `#dMkt` 32 `var(--mkPx:40px)` 60; `#dOver` `var(--ctPadY)` with its `--ctSm` 1080 content centred by `calc((var(--pnCap) - var(--ctSm)) / 2)` and 60 at the foot. `body.m9 .dash{overflow-y:hidden}`. S/XS: left 0, top 0, radius 0, max-width none.

**How to use.** A new desk page: add its id to the scrollbar rule, the position block, the sideMin left 52, the transition, the `body.sideMove` list, and the S/XS reset. Nothing else: the cap and the shell strip come from `--pnCap`; never give a page its own max-width.

**Pitfalls.** (1) A missed selector list shows a scrollbar, a square corner, the wrong left after retracting, or a page repainting (dark tiles) during the retract. (2) Padding is inconsistent (32 40 vs tokens). (3) A per-page `max-width` or a different cap sum breaks the strip: the gap and the top-left corner show only while the panel's left matches `--pnCap`'s sum. (4) The scrollbar must never take width.

**Out of scope here.** The Insights tablet (`body.tabM #dMain`, Auto 600-991) keeps its own 200 rail, flush, 28 padding.

---

## Main page titles and header discs (`--pgH1Fs`, the XS·S H2 rule, `--mainBtn`)

**What.** One title size for the main pages at each breakpoint pair, the Title group master's H2: on the desk (M·L) Overview, Insights, Services, My journey, My plan, My account; on the phone and tablet (XS·S) Services, My journey and My account ("services is good, take that as ref"; "match this to the other header, e.g. timeline"). Their header discs share one fill.

**Where.** `grep -n -- "--pgH1Fs"` (~637-639: the `.dash` tokens, the desk `:is()` list, the XS·S rule); `grep -n -- "--mainBtn"` (~640, and its readers: `#dMkt .mkCartB`, `.acHdA button`, `.tlSearch`, `.tlPastBtn`).

**API / rules.**
- Desk: `.dash{--pgH1Fs:var(--tgH2FsL, 24px); --pgH1Lh:var(--tgH2LhL, 30px); --pgH1Ls:var(--tgH2LsL, -.3px)}`, applied by `body:not([data-bp="xs"]):not([data-bp="s"]):not(.tabM) :is(#dOver .dvH1, #dMain > h1, #dMkt .mkT, #dTl .tlH1, #dPlan.plDesk .plPgT, #dAcc .acHead h1)` (weight 500). The Plan's title is drawn by `EvTitle` itself.
- XS·S: `body:is([data-bp="xs"], [data-bp="s"]) :is(#dMkt .mkT, #dTl .tlH1, #dAcc .acHead h1){font-size:var(--tgH2FsS); line-height:var(--tgH2LhS); letter-spacing:var(--tgH2LsS); font-weight:var(--tgH2W)}` (24/30 −.2 500).
- Discs: `:root{--mainBtn:rgba(255,255,255,.07); --mainBtnH:rgba(255,255,255,.11)}`, `body.light{--mainBtn:#f2f2f2; --mainBtnH:#ebebeb}`; 44 round, 20 icons, `margin-block:-7px` so they hang 7 over and under the 30 title row. My journey and My account sit on Services' line (title and discs measured equal at XS and S; on S each head starts 10 lower under the drawn strip). My account's Settings gear is lit while its tab is up (`.on`: #ececec ground, #111 icon; light inverted; `aria-pressed`), as My journey's Past.
- Sub pages (Service detail, Appointment, the Plan's subpages) keep their hero titles.

**How to use.** A new main page's title: add its selector to the desk `:is()` list (and the XS·S rule if it has a phone title), or draw it with `EvTitle.html({ level: 'h2', tag: 'h1', ... })`. A header disc: `background:var(--mainBtn)`, hover `var(--mainBtnH)`, 44 with `margin-block:-7px`.

**Pitfalls.** The Overview's phone title (`.dvH1`, 20) and Insights are not on the XS·S rule (Title group candidates). Never copy 24 / 30: read the `--tgH2*` tokens so a saved Title group setup reaches them.

---

## Home indicator and safe areas (`--evHome`, `.mHome`, `env()`)

**What.** XS footers get the home space: 34 px at the foot of the drawn phone with the home bar (134 x 5) in it, footer actions 16 above. On a real phone (Auto) the space is `env(safe-area-inset-bottom)`, no bar drawn.

**Where.** `grep -n -- "--evHome:0px"` (~5849); `.mTabs .mHome` (~1217); doc `.glDemoFoot`, `.mdHome`; `#phone` env() padding; EvConsent sheet padding.

**API.** `--evHome`: 0px default; 34px on `html:not(.bpAuto) body[data-bp="xs"]` and `.aqWrap.aqDev.aqBpXS`; `env(safe-area-inset-bottom, 0px)` on `html.bpAuto body`. Bars: `.mTabs .mHome`, `::after` on `.aqFrame .cnDev .grDev .clDev .rfDev`, `.mdHome` in docs, `.chHome` (EvChat), `.hoPh::after`, `.ptHome`. `--ar-foot-bottom:calc(16px + var(--evHome))` in report sheets. `--navLift` (29px; 14px when fullscr or bpAuto).

**Rules.** Bar 134 x 5, bottom 8, radius 3; rgba(255,255,255,.26) dark / rgba(0,0,0,.24) light. Shown only in the drawn frame (hidden in `body.fullscr`, `html.bpAuto`). Footers 16 over the 34 (50 from the bottom) on XS. Doc tables: "CTA 56 pill · 16 sides · 34 under it (home indicator)"; sheets "8 top · 16 sides · 34 bottom". Dock 29 above the bottom, 16 clear of the indicator.

**How to use.** `padding-bottom:calc(16px + var(--evHome))`; for a sheet that can also be full screen `calc(16px + max(var(--evHome, 0px), env(safe-area-inset-bottom, 0px)))` (EvConsent). Draw a bar only under `html:not(.bpAuto)` at forced XS: `left:50%; bottom:8px; width:134px; height:5px; margin-left:-67px;` .26 / .24.

**Pitfalls.** (1) Many footers hard-code 34 (`.plNShP`, `.mkDetFoot`, `.mkCartFt`, `.glDemoFoot`, `.mdFoot`) and keep it in Auto. (2) Keep the dock lift a single variable (`--navLift`): an old padding shorthand once left the dock 1 px off. (3) S gets `--evHome` 0, but its dock carries the bar. (4) The old `--ar-foot-bottom:40px` is superseded on XS by 16 + `--evHome`. (5) While the drawn keys are up they draw the home bar: hide your own (`.app.kb ~ .homeInd`, `.dash.chatOn.chKbd .chHome`).

---

## Design system page shell and the General layout tab

**What.** Design system is the page-menu value `'ds'`. It shares the Documentation shell (`#docPage`, `window._doc`) with its own tabs. General layout has a left aside with six parts (Header, Top nav, Title group, Container, Header overlap, Page types), each with a note, and a main column.

**Where.** `grep -n "o.value = 'ds'"`; `grep -n "const DOCS\|DSET = \|docLast"` (~46950); `docShow` (it calls `EvPush.cancel()` first); `#tkDocSave` mapping (`grep -n "docCur === 'sf'"` ~47831); `docHash`; `const glDoc`; home card `doc: 'gl', wide: true`; CSS `.ldSide/.ldPats/.ldNotes`, `.glMain/.glSec`.

**API.** `window._doc.show(k, set)`, `hide()`. `DSET = ['gl','sf','md','bb','nv','ld']`; `docLast = { doc:'pt', ds:'gl' }`. Hashes `#general-layout #step-flow #modals #chat-bubbles #navigation #loading-states`, `#title-group` (General layout on its Title group), and `#design-system` (last tab open). Parts: `[data-gl="hdr|tn|tg|ct|ho|pt"]` buttons, `[data-glv]` views, `[data-gln]` notes, `pick(k)`. Keys `everlab:glPart`, `everlab:glBp`, `everlab:glCt`, `everlab:tgDoc` (UI only). `body.docOn`, `body.dataset.docSet`.

**Rules.** Pages take their numbers from the masters the doc drives. The Design system pages have no Tweaks group, so nothing in Tweaks overrides a saved master. The bar's Save maps `'sf'` → `EvSteps.save`, `'gl'` → the shown part's master (`everlab:glPart`: `pt` → `EvPush.save`, `tg` → `EvTitle.save`, else `EvOverlap.save`), `'md'` → `EvDismiss.save`, the Service timeline frame's `PTDemo.save`; Navigation has its own `.nvSave`.

**How to use.** New General layout part: a `[data-gl]` button in `.ldPats`, a `[data-gln]` note, a `[data-glv]` view built by its own function (like `glCt`, `glHo`, `glTg`, `glPt`) and its wiring (`glPtWire`); extend `pick()` if it needs a refresh on show (`el._hoUp`, `el._tgUp`) and the remembered part's list (`p0`); a master gets `save()` and joins the `#tkDocSave` mapping; tag its controls for `EvDocPanel`. New tab: an entry in `DOCS` (`el`, `t`, `hash`) and in `DSET`.

**Pitfalls.** (1) Views built while hidden measure zero: refresh on pick and with ResizeObserver. (2) Specimen tables (CT, Sizes, HO rows, Navigation's `T`) are hand-written copies: update with the code. (3) New doc phones use `--evPhR/--evPhBz` and 393 x 852.

**Doc headers master (`window.EvDocHd`, `DH` in the doc shell's scope; "use this for ALL documentation, same patterns").** Every Documentation and Design system page draws its title hierarchy through it, the Concierge entry points' three levels. `grep -n "const DH = window.EvDocHd"` (just before `window.EvDocPanel`); CSS: the rule `.dhS{position:sticky` (with `.dhST`) and the block after `.ldMainH{` ("Doc headers, the master").
- Level 1 `DH.page(t, bp, right)`: the page's head bar (`.ldMainH.dhP`, 62 tall): the page's title (constant: `DOCS[k].t`), a mono badge `.ldBp` for the breakpoint shown (empty hides it; a page writes it later with `el.querySelector('.dhP .ldBp')`), view controls at the right (only where the page has no right panel, e.g. Concierge entry points). In a column that scrolls (`.glMain`, `.ldDoc.ntDoc`) it is sticky at the top; on the canvases it stands over the scroller.
- Level 2 `DH.sec(t, sub, o)`: a section's head (`.dhS`): title 20/600, its line inline in grey; a line over 110 characters goes under the bar (`.dhSub`) unless `o.long` says; `o.right` (Go to prototype), `o.hc` (a class on the bar: the canvases keep `hcRowH`, `obRowH`), `o.cls`/`o.sc` (classes for a title / line the page writes later: `mdH`/`mdP`, `nvH`/`nvHp`, `ldPT`/`ldPD`), `o.note` (a paragraph under). Sticky at `--dhPH - 16` under level 1, inside its own section so the next pushes it out; `--dhX` is the column's side padding (bar across it); on the page-style docs the bar and its rule run past the column (border-image outset, no sideways scroll).
- Level 3 `DH.cap(n, t, sub)` (`ci()` the inside): an item's caption under it (`.dhI`: "n · name" bold, its line grey), 24 under the frame's visible edge ("put the text 24px below the frame"): the figure has no gap, the caption a `calc(24px + var(--dhRing))` margin, `--dhRing` the frame's ring outside its box (the phone bezel 12 × `--hcS`, the desk hairline 2 × `--hcS`, 0 for cards).
- Sections scroll sideways on their own ("The horizontal scroll should only be different by section"): a row's `.hcStrip` (or any `.dhStrip`, Overview bento's `.obPair`) is its own `overflow-x:auto` scroller across the column; `.hcFlows` scrolls up and down only (`.hcRows` the column's width). `DH.pan(sc)` drags a canvas by hand (vertically the canvas, sideways the strip it was taken by); `DH.strip(n)` finds a node's strip (Membership onboarding's own drag and wheel use it).
- Page kinds: the part pages (General layout, Modals, Step flow, Chat bubbles, Main menu, Loading states) keep their left side list, level 1 the page, level 2 the part and its sections; the page-style docs (`ntDoc`: Core components, Modules, Carousel, Empty state, Intro flow, Biomarker item, Notes) have level 1 over a left-aligned `.ntIn`, the old description a `DH.lead()`; the canvases (Concierge entry points, Membership onboarding, Gifting, Overview bento) their rows as level 2. The frames from other files draw the same with their own CSS: `components/progress-timeline/demo.html` (`.dhP`, sticky `h2`, captions under) and `visuals/concierge.html` Components (`buildCmp`'s `sec`/`sub`).
- A new doc page: `DH.page()` first in its scrolling column, a `<section>` per group starting with `DH.sec()`, each item a `<figure>` ending with `DH.cap()`; a wide row in a `.dhStrip`. Not converted: Membership onboarding's All states gallery (`.hcItem` header above, not reachable from the page), Intro flow's live players (`.itLab` over the player and its buttons), the Concierge entry points Skeleton's flow cards (`.ceFlowH`).

---

## Doc pages' controls panel (`window.EvDocPanel`)

**What.** Every Design system and Documentation page puts all its controls (actions, choices, sliders, fields, switches) in one right panel laid out as Tweaks ("ALL controllers need to be on a right panel, similar as tweak layout"): a 320 column docked at the doc's right, full height, a pinned header with the actions, groups as Tweaks' cards (small caps titles), a row a control (label left, control right; a slider: label and value on one line, the bar full width under it). The preview keeps the column on the left with its title and description.

**Where.** `grep -n "window.EvDocPanel = "` (~46965, just before `const glDoc`); CSS block "Doc panel (EvDocPanel;" (its own `<style>`, first rule `.dpRail`); every builder's tags (`data-dp`, `data-dpa`); the Service timeline's frame mounted from `ptPanel` (docShow) with the tags in `components/progress-timeline/demo.html`.

**API.** Tags on the controls where the builder draws them: `data-dpa` an action (the header; `data-dpa="Label"` a row of buttons in the group), `data-dp="Label"` a control on its own row, `data-dp=""` a block of rows kept as it is (a `.hoCtl` slider stack), `data-dpg="Title"` a group from that control on, `data-dpk="raw"` keep its own dress, `data-dpx` a wrapper left empty (hidden). `EvDocPanel.mount(host, { root, before, after, fixed, wide, label })` → `{ el, head, group(t), row(label, ctl, group), put(node, group), sync() }` (also `rail._dp`); `EvDocPanel.room(el, foot)`: the height under an element in its scroller (the phones' fits). Classes: `.dpRail` (`.dpLive` docked), `.dpHead`, `.dpGroup` / `.dpSub`, `.dpRow` / `.dpL`, `.dpBtn`, `.dpSeg`, `.dpField`, `.dpSw`, `.dpBlock`; `.dpDock` on the doc (`.ldDoc`) while docked.

**Rules.** mount moves the very nodes (no copies): listeners and lookups keep working; a listener delegated to a wrapper means tag the wrapper (`.hoCtl`), or point the lookup at the control (Step flow's Transition). Docked while the doc is at least 1140 wide (o.wide; the frame's 900): absolute in the `.ldDoc` (`position:relative`, `padding-right:320`), so nothing between it and the doc may be positioned; narrower, it stands where the controls were, under the preview's header (max 520). A row hides with its controls (`hidden`), a group with its rows, the panel when empty (Chat bubbles' Style: none). Colours from the doc's tokens (`--ld*` → `--dp*`), Light follows. General layout: a panel per part; Show sizes moves into the shown part's panel (View group) where it has sizes (Header, Top nav, Container). Doc tables sit in `.glTabW` (scroll on their own).

**How to use.** A new control on a doc page: draw it where it belongs and tag it; a new doc page: tag its controls and call `EvDocPanel.mount(host)` at the end of its builder. Fit a phone with `room(stage, foot)`, not `innerHeight`.

**Pitfalls.** Not converted: the Membership onboarding canvas's per-screen Filled switches, Go to prototype and Open (they belong to their screen), the Concierge components' Field model menu (the specimen itself). A positioned ancestor between the panel and the `.ldDoc` breaks the docking.

---

## Viewport centring with docked panels (`--vwC`, `html.tkDocked`, `html.flowDocked`)

**What.** A forced frame and the Auto desk centre in the room left by Tweaks (docked right, 320), the Flow panel (docked left, 320) and an open + section panel.

**Where.** `grep -n "html.tkDocked\|html.flowDocked"` (~102-109); `shiftOn`/`shiftOff` (~39039).

**API.** `--vwC` (default 50vw), `--tkDockW:320px`, `--flDockW:320px`; `html.tkDocked`, `html.flowDocked`, `html.tkFlMove` (left .45s cubic-bezier(.2,.8,.2,1), 520 ms), `html.flWait` (the panel held back while a Sub page pushes).

**Rules.** tkDocked: `--vwC = (100vw − 320) / 2`. flowDocked: `320 + (100vw − 320 − tkDockW) / 2`. Auto: `.dash` right = tkDockW, `.dash`/`.side` left = flDockW. `.aqWrap.aqFull` follows. + panel: `--vwC = max(bpW/2 + 16, min(current, (innerWidth − dock − 500)/2))`. The XS fit-scale counts the docked panels too (room = window less 320 each); a forced M / L narrows `--bpW` to the room left.

**How to use.** Any fixed framed surface: `left:calc(var(--vwC, 50vw) - var(--bpW) / 2); width:var(--bpW);`. Never 50% or 50vw directly.

**Pitfalls.** (1) Pinning a framed modal to a docked column showed the Overview in a strip beside it: use `--vwC`. (2) The floating "‹ Back" pill beside the phone (`.tkFlBack`) is hidden everywhere ("remove that, dont need as we have the flow panel"): the Flow panel steps back; don't bring it back.

---

## Flow panel (`#tkFlowBtn`, `html.flowOff`, `window.__flowPanel`)

**What.** The left column (320) beside a screen that is a flow: its pages or steps, the one up lit, a press jumps there (the Health profile's Journey `jny`, the reveal's timeline `wtl`, the Gift referral `rf`, a service's steps `svc`, the Async report `ar`, Send a gift `sgf`). Folded on every load ("don't automatically open the Flow panel, only when we activate it by clicking the CTA"); the top bar's Flow button opens and folds it.

**Where.** `grep -n 'id="tkFlowBtn"'` (~13012, `.topbar .tkFlowBtn` CSS ~116-118); the block `grep -n "H.classList.add('flowOff')"` (~30793: `sync`, `__flowOk`, `__flowAv`, `__flowDock`, the button's click); the general panel `grep -n "window.__flowPanel = "` (~30805); the older panels `jny`, `wtl` and the referral's (`grep -n "flowOff"`).

**API.** `html.flowOff` (folded; added at parse, the stored state no longer read or written); `#tkFlowBtn` (`hidden` unless a panel is available and allowed, `aria-pressed` = open). `window.__flowAv(key, on)`: a screen says it has a panel; `window.__flowOk(key)`: allowed under the context up (`EvCtx.flow`); `window.__flowDock()`: docks / undocks (`html.flowDocked`, `--flTop`, `tkFlMove`), deferred while `EvPush.busy()` (`html.flWait`, then `EvPush.after`). `window.__flowPanel(key, { on(), model() -> { title, now, groups: [{ name, go, rows: [{ t, go, doc }] }] }, go(id) })`: a panel as `aside.hpJny.hpWtl.hpFl[data-fl=key]` in the top bar, rows `[data-go]` (click, Enter, Space). Event `everlab:ctx` re-syncs it.

**Rules.** 320 wide, docked at the left under the bar; the app moves aside on `tkFlMove` unless reduced motion. One panel per context (a modal over a page: its own flow alone; none: the button hides). Folded: every panel hidden, the button still there.

**Arranging steps ("ALL flow item should have a reorder option and toggle").** Every step row in a flow carries a grip (drag, or arrow keys, to reorder) and a switch (off: the step is skipped, its name dimmed). The general panel opts in with `cfg.arrange` (rows with `id`, `sc`, `fix`, `nosw`, `off`; stored by `cfg.store` or `everlab:flowArr`; `window.EvFlowOrd(ids, ord)`). The Health profile's Journey (`jny`): each step's pages via `pageList(ol, ordInput, HP.<wear|past|you>, area, sub, offInput)`, the order in `stHpW1Ord` / `stHpW2pOrd` / `stHpW3Ord` and the pages off in `stHpW1Off` / `stHpW2pOff` / `stHpW3Off` (hidden inputs before `#stHpJnyMk`, so Tweaks' Save keeps them when the rows sit in the Flow panel); `HealthProfile.<wear|past|you>.order(list, off)` sets `AREA[k].steps` to the pages on, one at least (the last one on can't be switched off). The step groups' Health profile home rows are each step's start, not pages: no grip or switch.

**How to use.** A screen with steps: `window.__flowPanel('mykey', { on: () => body.classList.contains('xOn'), model: () => ({ title, now, groups }), go: id => jump(id) })` and `flow: 'mykey'` on its `EvCtx` entry. Never open it from code on load.

**Pitfalls.** (1) A panel shown or hidden by anything re-docks through the top bar's MutationObserver; a panel gone with the app still pushed left a 320 gap ("why this right gap?"). (2) Don't read the old stored open state. (3) A push and the docking never run together (the push plays in a still frame, then the app moves).
