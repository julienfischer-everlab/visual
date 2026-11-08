# Tokens and components: colour modes, --ar-* tokens, range colours and pills, size tokens, the Title group, cards, buttons, EvTl, the Plan module, Assets, Tweaks, saved setups, house rules

All anchors are in `index.html` unless named. Line numbers drift; grep the pattern. None of these has a Design system tab of its own except where stated.

---

## Colour modes (Dark / Light, `body.light`)

**What.** Two modes. Dark is the default; Light adds `body.light` and every themed rule is a `body.light` override (about a thousand). Dark also adds `body.black`. There is no single semantic palette: each surface family has its own token set.

**Where.** `grep -n 'id="themeSel"'` (~12835; options dark/light); `grep -n "theme0"` (lightOn/blackOn, the change handler); `setMode` adds back `' light'`/`' black'`; `grep -n "body.theming"` (~11251, crossfade); the old `:root --bg/--ink/--ink-bright/--pill/--pill-line/--accent` (~8-14) and their `body.light` values.

**API.** `#themeSel` `'dark'|'light'`; `body.light`, `body.black`; `body.theming` (700 ms: background, colour, border, fill, stroke .55s `!important`). Per-surface hooks: `.arSheet.arDark` (report, Health profile, standalone modals; EvSolo's `paint()` toggles it from its `dark()`: the app's mode, or the page it opens over with `cfg.dark`); `.ldDoc.evDark` (doc pages follow `body.light` by MutationObserver); `#dPlan.plLight` (light when `body.light` OR Tweaks `#stPlSheet === 'light'`; the Plan's `sheet()` also repaints its Activity session); iframe pages get `documentElement.dataset.theme` from `docTheme()` (concierge.html uses `:root[data-theme]` + `prefers-color-scheme`; referral.html and gift-receipt.html follow the app's mode the same way).

**Rules.** Two modes only ("Dark mode, default; Light mode; no need for Colour mode"). Secondary text is ink at 56% (`oklch(var(--ar-ink) / .56)`). Modal ground #181818 in dark. Grey card #000 4% light / #fff 6% dark. Line colour white 8% dark / ink 10% light (`--evNotchC`). Theme applied from the first frame. Not saved with Tweaks (`#themeSel` is in the top bar, not `.tkPanel`).

**How to use.** Read the mode from `body.light` (CSS) or `!document.body.classList.contains('light')` (JS). A new surface defines its tokens on its root plus a `body.light` override, or follows `.arSheet/.arDark`. A same-origin iframe sets `data-theme` on its documentElement. A modal that follows its page's own mode passes `dark()` to EvSolo and the page calls its `paint()` when that mode changes.

**Pitfalls.** `setMode` writes `body.className` whole: a hand-toggled body class is lost on page change (use `<html>` or `CARD_STATE`). A surface keyed to its own toggle (Plan sheet, `.arDark`) must follow `body.light` explicitly. The desk's Plan goal cards follow the app's mode, not the Plan's sheet tweak. The `:root --bg/--ink` set is the old organ concept's: not for app UI.

---

## Component tokens (`.arSheet --ar-*`)

**What.** The Genome UI tokens from the Async report source: the de-facto component tokens for every sheet, modal and flow (Async report, Health profile, Send a gift, Step flow, EvSolo modals, consent). Ink is an oklch triple used with an alpha.

**Where.** `grep -n -- "--ar-ink:"` (~15801-15835: `.arSheet` light; `.arSheet.arDark`, `.arSheet.arIsIntro` dark); the class-name warning comment just above.

**API.** `--ar-ink` (e.g. `'0% 0 0'`, used as `oklch(var(--ar-ink) / a)`), `--ar-paper` (#fff / `oklch(16.84% 0 263.28)`), `--ar-fg`, `--ar-blue-bg2`, `--ar-blue-fg` (focus ring), `--ar-br3`, `--ar-opt-fg/-fg2/-bg/-bg2`, `--ar-sub-*`, `--ar-out-fg/-bg/-bg2`, `--ar-card-bg` (`oklch(0% 0 0 / .04)` light, `oklch(100% 0 263.28 / .06)` dark), `--ar-card-invert-bg`, `--ar-badge-bg` (#000 8% / #fff 24%), `--ar-btn-bg` / `-bg-hover` (.64) / `-bg-active` (.48) / `--ar-btn-fg`, `--ar-radius-card:12px`, `--ar-font` ("Saans", ui-sans-serif, system-ui, ...), `--ar-font-mono` ("Saans Mono", ...), `--ar-ease: cubic-bezier(.2,.7,.2,1)`, `--ar-head-top:16px` (58 on the XS device, 44 at S), `--ar-foot-bottom`, `--ar-fade`.

**Rules.** Every selector scoped under `.arSheet`, every class prefixed `ar`. The root selector is repeated (0,4,0) to beat older unscoped `.arSheet` drawer rules. Weight 380 is written 400. Fonts named, never loaded. Secondary text ink .56. Focus: 2px outline `--ar-blue-fg`, offset 2.

**How to use.** Build a new sheet or modal as `<div class="arSheet ...">`, toggle `.arDark` from the mode (as EvSolo's `paint()`). Colour with `oklch(var(--ar-ink) / a)` and `--ar-*`, not hex. Doc pages use their own set (`--ldBg --ldFg --ldMut --ldLine --ldChip --ldAcc`, `--sModal:#181818 --sLine --sCard --sCta`; `grep -n -- "--ldBg"` ~7206).

**Pitfalls.** Avoid class names index.html styles globally (`arRow arTop arList arNew arOpen arWrap arDesk`). A colour that switches with the theme must be a token. EvSolo reads `--ar-paper` for the frame because the sheet's computed background is mid-transition after a mode change. `var(--ar-font, inherit)` inside a `font:` shorthand voids it outside the sheet: write longhands (the Top nav master's lesson).

---

## Range colours and status pills (Optimal / Suboptimal / Out of range)

**What.** The three range readings as dots, meters and range bars (range colours) and as text pills. No single master: four parallel implementations share the colours.

**Where.** `grep -n -- "--rgOpt:"` (`:root` and `body.light`, ~32); `.arSheet --mbO/--mbS/--mbX` (`grep -n -- "--mbO"` ~16359); Insights `.st` (`grep -n "\.st\.ok"`, dark ~982, light ~11299); sheets `.arLfPill`; the Activity plan's stage re-declares `--rgOpt/--rgSub/--rgOut` (`.plAStage`); concierge.html `.tdTag` and `--tOptBg/Fg/Dot ...`.

**API.** Insights `<span class="st ok|sub|out|other">` with `ST_WORD = { ok:'Optimal', sub:'Suboptimal', out:'Out of range', other:'Unclassified' }`. Sheets `span.arLfPill.arLfOpt|.arLfSub|.arLfOut`. BioDetail `m.status` → `ST={o,s,x}`, `WORD n:'Unclassified'`. Concierge `.tdTag.opt|.sub|.out`. Overview insights `INS_WORD` sub: "To monitor".

**Rules.** `--rgOpt #aaeec2 --rgSub #ffe29f --rgOut #fe8087 --rgUn rgba(255,255,255,.48)`; light `#6fcb7c #f2c550 #e5514f #7f7f7f`; `--mbO/--mbS/--mbX` the same hexes. `.st`: radius 8, padding 5 11, 12.5px; dark ok #17251a / #9fc98f, sub #272113 / #f2c744, out #2b1416 / #fe8087, other #1e1e1d / #9a9a96; light ok #e5efdb / #55763f, sub #f3ead0 / #8f7327, out #f7dcda / #a33c39. `.tdTag` mirrors `.st` (5 11, radius 8, 12.5/16 500). `.arLfPill`: height 22, padding 0 8, radius 6, 13/16 400, `--ar-*-bg2` / `--ar-*-fg`.

**How to use.** Insights/dash lists: `.st` + `ST_WORD`. Inside an `.arSheet`: `.arLfPill` + `.arLf{Opt,Sub,Out}`. Charts, dots, meters: `var(--rgOpt/--rgSub/--rgOut)` in the shell, `var(--mbO/--mbS/--mbX)` in `.arSheet`. Concierge widgets: `.tdTag`.

**Pitfalls.** The hexes are copied in several places (`.st`, `--rg*`, `--mb*`, `.plAStage`, concierge `--t*`, and literals `#7fd6a0/#f3cf72/#f06a6a` elsewhere): a colour change touches all. The desk once lacked `.dash .st.out`. Wording differs on purpose ("To monitor").

---

## Type, spacing and radius tokens (`--hdr*`, `--ct*`, `--evPh*`, `--tg*`)

**What.** The size tokens that exist as custom properties. No global radius tokens. Titles have a type scale: the Title group master's levels (`--tg*`, next section); other text sizes are per component; header and container tokens are the rest of the scale.

**Where.** `grep -n -- "--hdrSb:54px"`, `grep -n -- "--ctPadY:24px"`, `grep -n -- "--ct2xs: 100%"`, `grep -n -- "--evPhR:"`, `grep -n -- "---- Title group, the master"`; General layout > Header (Sizes) and > Container (tokens table, `glCt`). Full detail in references/layout.md.

**API / rules.** Header 54 status bar; nav 76 phone / 64 desk; Back/Close 44 / 44 ("CTA top nav always 44px"), ink 7%, 16 icon; nav title 18/24 500; questionnaire 32/40 500 −0.4 (84 Hug); page title 24/30 (54 Hug) phone, 20/26 desk (48 Hug). Container XS/S/M/L padding top-bottom 24/28/32/36, sides 16/16/24/24, gap 24/28/32/36; max-width 2xs Full/512/544/576, xs 800, sm 1080, md 1280, lg 1440, used through `data-container` (merged #260) or `var(--ct…)`. Prototype breakpoints XS 393, S 600, M 992, L 1440. Main page titles: the Title group's H2 (`--pgH1Fs` on the desk, `--tgH2*S` at XS·S). Radii in use: `--ar-radius-card` 12; `.sgmCard` 20; rows/areas 16; bottom-sheet and floating modals 28; full bottom sheet 32; CTAs 9999; phone frame 56 (`--evPhR`, also the XS clip), tablet 28; desk panels 12 12 0 0; the Plan's tiles 20 (80) / 14 (56). Secondary text ink .56.

**How to use.** `var(--hdr*)` for a header doc, `var(--ctPadX/--ctPadY/--ctGap)` and `data-container` for a page container, `var(--tg<Lv>FsS|L)` for a title's size, `--evPhR/--evPhBz` (`--evTbR/--evTbBz`) for any device: never new numbers.

**Pitfalls.** The Container doc reads the tokens off the CSS (`ctRead`), so change the CSS rules. `--hdr*` are read only by the doc; app bars use the Top nav master (`--evTn*`). A forced breakpoint has its own token overrides after the media queries: a new token needs both.

---

## Title group (`window.EvTitle`, `.evTg`; General layout > Title group)

**What.** One title block for every page ("some titles don't need that. That's just an option"): a level (its type), the title and, each only where it is needed, a slot above the group or at its right (an icon, a visual, a badge), a support line above the title (support top) and one under it (support bottom), an icon at either side of the words, and on the H1 a second tone (the muted part). Left or centred. A bare title (just the words) is the same master with nothing on.

**Where.** `grep -n "window.EvTitle = "` (~20462, in the Health profile's script block, after EvTopNav: health-profile.html gets it too); CSS `grep -n -- "---- Title group, the master"` (~16870, in the report sheet's style block after the container rules: the `:root` defaults, `--tgL`, `.evTg*`); doc `grep -n "const glTg = \|const glTgWire = \|TG_TXT\|TG_C = "` (~47201). Tab `data-gl="tg"` (General layout, after Top nav), hash `#title-group`.

**API.** `EvTitle.html(o)` → markup; `EvTitle.node(o)` → the element; `EvTitle.mount(el, o)`. `o = { level, title, muted, align, top, bottom, slot, iconL, iconR, tag, cls, id, titleCls, titleId, topCls, bottomCls, attr }`:
- `level`: `'display-hero' | 'display' | 'h1' | 'h1-short' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'` (unknown → h2).
- `title`, `muted`, `top`, `bottom`: plain text (escaped), or `{ html }` for markup. Empty = the part is off.
- `slot`: `{ at: 'top' | 'right', html }`, or a list of both. Right only with `align: 'left'`; centred, it goes on top.
- `iconL`, `iconR`: svg strings, drawn at 7/8 of the level's size, half its size from the words, in the words' flow (inline: the first before the first word, the last after the last, a wrapped title too), each centred on its line (`height: 1lh`).
- `align`: `'left'` (default) | `'center'`. `tag`: the title's element, `h1`-`h6` or `p` (default: Display hero, Display, H1 → `h1`; H2-H6 their own).
- `cls`, `id`, `attr` go on the group; `titleCls`, `titleId` on the title; `topCls`, `bottomCls` on the support lines (a host's own hooks for its context rules).
- Markup: `div.evTg.evTgL|evTgC[.evTgSlT][.evTgSlR][data-lv] > [div.evTgSlot.evTgSlotT] + [p.evTgTop] + <tag>.evTgT ([span.evTgIc] [span.evTgW] words [span.evTgM] [span.evTgIc]) + [p.evTgBot]`; with a right slot the column is in `div.evTgCol`, then `div.evTgSlot.evTgSlotR`. No wrapper inside the title when it has no icons.
- Numbers: `EvTitle.M` / `D` (flat keys `<Lv><Fs|Lh|Ls><S|L>`, `<Lv>W`, `<Lv>Sf`, `<Lv>Sl`, `GapT GapB GapS GapR`; `<Lv>` = `Dh Ds H1 H2 H3 H4 H5 H6`, h1-short shares H1), `K` (`'everlab:tgMaster'`), `set(k, v)` (finite numbers, known keys only), `save()`, `reset()`, `key(level)`, `LV` (the levels: id, name, key, default tag, use).

**Rules (the levels; XS · S under 992, M · L from 992).**

| Level | XS · S | M · L | Weight | Tracking XS·S · M·L | Support | Use for |
|---|---|---|---|---|---|---|
| `display-hero` | 40/44 | 52/56 | 300 | −1 · −1.4 | 16/22 | One big statement a page opens on: a welcome, a landing hero, an empty state |
| `display` | 32/38 | 40/46 | 500 | −.3 · −.6 | 16/22 | A standalone page's own title (the Concierge page's `.cnT` is 32/38) |
| `h1` | 26/30 | 28/32 | 570 | −.2 · −.2 | 16/22 | A flow's step title (the HP's, Send a gift's), a marketing title in two tones: the muted part on its own line |
| `h1-short` | as H1 | as H1 | 570 | as H1 | 16/22 | The H1 with its muted part inline after the comma, wrapping on |
| `h2` | 24/30 | 24/30 | 500 | −.2 · −.3 | 15/22 | A page title: the main pages (`--pgH1Fs` desk, the XS·S rule), a modal's or a sheet's H1 under the Top nav (`.sgmT`) |
| `h3` | 20/26 | 20/26 | 500 | −.2 · −.2 | 14/20 | A section's title, a small card's H1 (the Top nav A/B bar title's size) |
| `h4` | 17/24 | 17/24 | 400 | 0 | 14/20 | A card's or a group's title, in the text's weight |
| `h5` | 12/16 | 12/16 | 600, uppercase | 1px | 13/18 | An overline over a list or a section |
| `h6` | 12/16 | 12/16 | 500 | 0 | 13/18 | The smallest heading: a caption's title, a meta label |

- Gaps: support top → title `--tgGapT` 8, title → support bottom `--tgGapB` 8 (both halved from H3 down: 4), slot → group `--tgGapS` 16, group → right slot `--tgGapR` 16. Carried as padding by the parts (`.evTgTop` padding-bottom, `.evTgBot` padding-top, `.evTgSlotT` padding-bottom), so a host's `margin: 0` keeps them; the group sets no margin of its own (the host's).
- Ink: the title takes the host's colour; the muted part and the support lines are the secondary ink, 56% of it (`--tgMute: color-mix(in srgb, currentColor 56%, transparent)`), so it works on every surface, dark and light. Display hero, Display and H1 balance their lines, the rest wrap pretty. The face is the host's (its surface's family: Saans in the sheets, the shell's on the desk); the master sets size, line height, weight, tracking, in longhands. The parts' rules are `.evTg .evTgT` (one class above a host's element rule such as `.dash h1`); a host's class rule on the same element (the HP's `.arSheet.hpSheet .hpH`) still wins, so it must read the tokens.
- Breakpoint: the raw tokens (`--tgH1FsS`, `--tgH1FsL`, ...) are on `:root` (CSS defaults; EvTitle writes them all on `<html>` at parse); `--tgL` picks the pair (0 XS·S, 1 M·L): the window (`@media (min-width: 992px)`), a forced `body[data-bp]`, a frame's `[data-ct-bp]`, a modal's `.aqWrap.aqBp*`. A doc frame shows a breakpoint by wearing `data-ct-bp`.
- Saved setup: `everlab:tgMaster` (JSON of M), read at parse on every page (index.html and health-profile.html), over the CSS defaults; `reset()` removes it. The doc's own state (level, alignment, words, breakpoint) is `everlab:tgDoc` (UI only). The top bar's Save on General layout saves the shown part's master: Title group → `EvTitle.save()`.

**How to use.**
```js
el.innerHTML = EvTitle.html({ level: 'h2', tag: 'h1', title: 'My plan', cls: 'plPgT' });                    /* a bare page title */
const g = EvTitle.node({ level: 'h1', tag: 'h2', title: t, bottom: d, align: 'center', cls: 'hpQ hpC', titleCls: 'hpH', bottomCls: 'hpD' });   /* the HP's q() */
scr.appendChild(EvTitle.node({ level: 'h2', tag: 'h3', title: rvT, bottom: rvD, cls: 'hpGfRvQ' }));           /* Send a gift › Check and pay: Review your information */
EvTitle.html({ level: 'h1', title: 'Your results are in,', muted: 'three things to act on.', slot: { at: 'top', html: badge } });
```
A host stylesheet that must keep its own selector (e.g. the HP's `.hpH`, the main pages' `.mkT`, `.tlH1`, `.acHead h1`) reads the master's tokens: `font-size: var(--tgH1FsL)` (and `var(--tgH1FsS)` under its XS/S rule), never a copied number.

**Adopted.** The Health profile's step titles and Send a gift's (`q()`, H1; their `.hpH` numbers are `--tgH1*S/L`; the date step's line is the group's `.evTgBot`); every `.hpH` takes the H1 tokens; Send a gift's Check and pay H2 "Review your information" (`.hpGfRvQ`); the desk's main page titles (`.dash --pgH1Fs/Lh/Ls` = `--tgH2FsL/LhL/LsL`); the phone and tablet titles of Services, My journey and My account (`#dMkt .mkT`, `#dTl .tlH1`, `#dAcc .acHead h1` read `--tgH2FsS/LhS/LsS/W`); the Plan's page title (H2, an h1); the Top nav doc's H1s (H2 in the phones (`data-ct-bp="xs"`) and on the desk (`"m"`), with the line under it as support bottom; H3 in the 400 variants).

**Candidates (not yet on it).** The standalone modals' title `.sgmT` (24/30 500 −.2 = H2 XS·S) and the Plan change's `.sgmPcT` (28/34); the Concierge page's `.cnT` (32/38 = Display XS·S) and its eyebrow `.cnEy` (H5-like); My journey's `.jpHt` (32/38); the Plan's section titles `.plSecH h2` (18, 16 on the phone; the Activity session's `.plSecH h3`) and its sheet title `.plNShT`; the info sheets' `.siTitle` (22 500); the Container doc's `.glCtH` (26/30) and the Header doc's `.glTtl`; the HP home's `.hpHome .hpH` (32/32), the Concierge intro `.hpCcIntroT` (28/36; Send a gift's intro title wears it), the Async report intro `.arRvT` (32/32); the Overview's phone title `.dvH1` (20) and Insights'.

**Pitfalls.** (1) The HP's context rules (`.hpQ`, `.hpH`, `.hpD`, `.hpCcT > .hpH`) still win over the master's own rules inside `.arSheet.hpSheet`; they read the master's tokens, so the numbers still come from it; the HP's description keeps its own ink (.64), not the master's .56. (2) A frame drawn at a breakpoint must carry `data-ct-bp` (or sit in an `.aqWrap.aqBp*`), else it takes the window's pair. (3) The standalone health-profile.html has no `data-bp`: its `.hpH` stays on the M·L tokens, as before (only an `.aqWrap.aqBpXS/S` takes XS·S). (4) The muted part is inline on every level; on H1 a break before it (`.evTgM::before { content: "\A" }`) puts it on a line of its own, so a right icon still follows its last word. (5) Never copy a level's numbers into a new rule: `var(--tg<Lv>FsS|L)`.

---

## Cards

**What.** Card grounds. Inside sheets and modals a grey card is ink 4% (light) / white 6% (dark). Standalone modals use an opaque secondary ground so dots and rings can sit in it. No card master, no doc tab.

**Where.** `grep -n -- "--ar-card-bg"`; `grep -n -- "--sgmCardBg"` (~5875, color-mix), `.sgmCard`, `.sgmRow`; `.arRsList > .arAcc`, `.arRsArea`; Doctor's suggestion `--dsgCard`; desk `.dash .dcard`; the Activity session's exercise cards `.plSesEx` (`--ar-card-bg`, 20 round).

**API.** `.sgmCard`, `.sgmRow` (standalone modals); `.arAcc`, `.arRsArea`, `.arLfCardH` (sheets). Tokens `--ar-card-bg`, `--sgmCardBg` (`color-mix(in srgb, oklch(var(--ar-ink)) 6%, var(--ar-paper))`), `--sgmLine`, `--ar-card-invert-bg`, `--dsgCard` (#fff / `oklch(100% 0 0 / .07)`).

**Rules.** Grey card #000 4% light / #fff 6% dark. `.sgmCard`: margin-top 8, padding 20 (24 at M/L), radius 20. Rows/areas radius 16 (`.sgmRow` padding 16 on `--sgmCardBg`). Secondary text ink .56 at 15/22.

**How to use.** In an `.arSheet`: `background: var(--ar-card-bg)`. In an EvSolo modal: `.sgmCard` (or `var(--sgmCardBg)` when a dot or ring cuts into it). Don't invent a new grey.

**Pitfalls.** The translucent `--ar-card-bg` lets dots and strokes show through, hence the opaque `--sgmCardBg`. Gift receipt / Overview / Send a gift plan cards have their own grounds: check the page's existing card first.

---

## Buttons

**What.** The CTA family. Master primary: `.arBtn.arBtnPrimary.arBtnLg` (56 full pill) inside an `.arSheet`. The service page has `.svBtn`. Standalone modals add a tinted secondary pill (`.sgmAsk`) and a text button (`.sgmNot`). Tool chrome: `.tkBtn` (top bar / Tweaks), `.mdBtn` (doc pages), `.alBtn` (Assets). Main page header discs: `--mainBtn` (references/layout.md).

**Where.** `grep -n "\.arBtnLg\|\.arBtnPrimary"` (~16013); `grep -n "\.svBtn{"` (~7654); `grep -n "\.sgmAsk\|\.sgmNot"` (~5950); `.mdBtn` (~7331); `.topbar .tkBtn`; `.alBtn`. The Modals tables state the CTA rules. No Buttons tab.

**API.** `<button type="button" class="arBtn arBtnPrimary arBtnLg"><span class="arBtnLabel">Next</span></button>`. Service `<button class="svBtn">`, `.svBtn.sec`. Disabled HP primary: `.arSheet.hpSheet .arBtnPrimary:disabled`.

**Rules.** `.arBtnLg`: width 100%, height 56, min-width 56, padding 0 32, radius 9999, 16/18 570, 2px transparent border, transitions .3s `cubic-bezier(.4,0,.2,1)`. Primary bg `--ar-btn-bg` (black light, white dark), hover .64, active .48, fg `--ar-btn-fg`. End/welcome screens hug the label (width auto, padding 0 36, centred). `.svBtn`: 56, 0 32, radius 12, #fff/#111 (light #111/#fff), 16 500; in a status block (`.svPend`) 44, radius 999, 24 sides, 56 on the phone filling the card; `.svBtn.sec` rgba(255,255,255,.08) (light rgba(46,31,26,.07)). `.sgmAsk`: 48 on the phone, 56 pill on the desk, ink 7% (hover 11%), blur 32. `.sgmNot`: 48, radius 16, text button (56 pill desk). Modals: phone buttons stacked 56 pills 8 apart, primary first; desk side by side; footer 34 under on XS. `.tkBtn`: 12px 500, #131316, 1px #232326, radius 8, 6 12.

**How to use.** Any flow, modal or sheet CTA: the `.arBtn` trio inside an `.arSheet`; a secondary beside it: `.sgmAsk` or `.sgmNot`; `.svBtn` only on the service page's own blocks. Loading: `EvLoad.label`/`simple` on the same button.

**Pitfalls.** A global button reset once blanked the HP card button (now `:where(:not(.hpOvBtn))`). `.svBtn` is overridden by context rules with `!important` (check `.svPend`/`.svcMob`). A disabled primary needs an explicit rule (only hpSheet has one). Plan buttons take the Plan's interaction states (merged #269; references/navigation-icons-motion.md, Hover / press).

---

## Vertical timeline (`window.EvTl`)

**What.** A step list on a thin connector, one node per step, title ("when · what") and a line beside it. First used in the Suggestion's Plan change ("Why your heart scan moved"). Not the Doctor's suggestion `.dsgTl` nor the Service timeline (Documentation `'pt'`).

**Where.** `grep -n "window.EvTl = "` (~38339, header comment); CSS `grep -n "\.evTl"` (~5956); call sites in the Suggestion (`PC` steps, `section.sgmCard.sgmPcTl`).

**API.** `EvTl.html(steps, label)` → `ol.evTl[aria-label] > li.evTlSt.evTl_<s> > i.evTlNode + i.evTlLn (not on the last) + div.evTlTx > b.evTlT (hidden span.evTlVh 'Done: '|'Flagged: '|'Planned: ') + span.evTlD`. Step `{ s: 'done'|'flag'|'next', t, d }` (plain text, escaped). `EvTl.enter(list, a, d0)` uses an EvSolo api (`a.rise`, `a.push`) and returns the delay at which the last (dashed) node starts.

**Rules.** Node 24 circle, margin-top −1, grid 24px + 1fr, gap 12, 16 below each step. done: `--evTlNode` ink .08 disc, check 15 at ink .9. flag: ember disc (`--evTlEmber` #d9653b light, #f78359 in `.arDark`) with a 16 sparkle in `--evTlEmberInk` (#fff / #1a120e). next: dashed ember ring (pathLength 70, dasharray 4 3). Connector left 11.25, top 23, width 1.5, `--evTlLine` ink .09; none under the last. Title 500 16/22; line 400 15/22 ink .56. Entrance: words rise 12 (640 ms); node pops .4 → 1 in 460 ms `cubic-bezier(.34,1.56,.64,1)`; next ring scales and rotates from −120deg over 640 ms `cubic-bezier(.16,1,.3,1)`; connector scaleY over 200 ms after 80 (`cubic-bezier(.45,0,.25,1)`).

**How to use.**
```js
sec.innerHTML = EvTl.html([{ s: 'done', t: '28 Oct · Your blood results', d: 'ApoB came back above range.' }, ...], 'What changed');
const ring = EvTl.enter(sheet.querySelector('.evTl'), a, d);   /* in EvSolo's enter(sheet, a); start the next block at ring */
```

**Pitfalls.** Needs an `.arSheet` ancestor (ink, font) and `.arDark` for the dark ember. Reduced motion: EvSolo calls `still()` instead. Undocumented in the Design system: a doc tab would make it a true master.

---

## The Plan module (`#dPlan`, `window._plan`): tokens, tiles, Sub pages, sheets, the Activity session

**What.** "My plan": a main page (the dock's More › Plan on the phone, the sidebar's Plan on the desk) with its goal cards, sections (Activity, Nutrition, medications, supplements, routines) and their rows; its Sub pages (Activity plan, Nutrition plan, My Medical actions, My supplements, Wind-down routine) pushed in by `EvPush`; its sheets (a medication's modal `.plPMd`, the Nutrition item sheet `.plNSh`, the biomarker detail); and the Activity session, a Full modal (`EvSolo`). It has its own mode (`#dPlan.plLight`), its own interaction states, and its own tile tokens.

**Where.** The module `grep -n "const host = document.getElementById('dPlan')"` (~45614) to `window._plan = ` (~46086); CSS `grep -n "#dPlan{\|#dPlan.plLight{"` (~8106-8108: `--plSh --plInk --plMut --plTx2 --plCard --plLine --plChev --plPill --plCnt --plTile`), tiles `grep -n -- "--plPTileBg\|--plATileBg\|--plTileR80"` (~8306, ~8410-8450, ~8640), the Activity session `grep -n "the Activity session (a program"` (~8670), the meals' visuals `grep -n "\.plNMealH img"` (~8533), the desk's goal cards `grep -n "#dPlan.plDesk .plGoal"` (~8231). Pictures `grep -n "const NIMG\|aFga:"` (~45618, ~45779).

**API.**
- `window._plan = { open(o), close(), ses(k), act(), nut(), back() }`; links `#plan`, `#activity-plan`, `#nutrition-plan`, `#medical-actions`, `#my-supplements`, `#wind-down-routine`, `#activity-session` (menu values `plan`, `planAct`, `planNut`, ...).
- Sub pages: `actShow / actBackTo` (`.plAStage > .plA`), `nutShow / nutBackTo` (`.plNStage > .plN`), `pShow(k) / pBackTo` (`.plPStage`, `PG = { med, sup, rtn }`), all through `pgP = (f, dir, done) => EvPush.page(f, { dir, done })`; `window.__plOpen(k, o)` (from the Nutrition plan's stack: My supplements with an item's detail after the push); `planInert(on)` makes the Plan's top and sheet inert under a Sub page or sheet.
- Sheets: `detShow(k, from)` (inside the Nutrition plan) and **`detSoloShow(k, from)`**: the Plan's Nutrition card (My meals' Breakfast) rows open the item's own sheet over the Plan where it stands ("Open bottom sheet of the item, no the nutrition page"): the Nutrition stage up with its page left out (`.plNStage.plNSolo`, `--plNY` the Plan's scrollTop), `planInert(true)`, the sheet `.plNSh` (`EvFullView.cover` on the desk; EvSheetSwipe on the phone; Close, scrim, Escape put it away, focus back on the row). `detOf(k)`: `'mac'`, `k<i>` (Key actions), `m<i>-<j>` (a meal's tip). Only See plan opens the Nutrition plan.
- The goal cards: one `button.plPGoalGo` over each card (`g.classList.add('plPGoal')`), `GO = { 'Restorative sleep': rtn, 'Stronger heart': med, 'Steady energy': nut }`.
- The Activity session: `window._plSes` = `EvSolo({ key: 'planSes', hash: '#activity-session', sheet: 'plSesSheet', bar: true, dark: () => !host.classList.contains('plLight'), ... })`; `sesOpen(k)` from `.plProt .plRow[data-ses]` (the Plan's Activity rows) and the Activity plan's `button.plRow[data-ses]` (My programs, My week; not the Rest day); `SES[k]` data (`fga`, Push-Pull-Legs, Zone 2 walk / run).
- Mode: `sheet()` toggles `#dPlan.plLight` (`body.light` or Tweaks `#stPlSheet` `'light'`) and repaints the session (`ses.paint()`).

**Rules.**
- **Tiles.** 80 for the Activity programs and supplements (radius `--plTileR80` 20), 56 for medications (`--plTileR56` 14). The Activity programs' figures are cut-outs (clear-ground WebP, `act-fga|ppl|z2b|z2i`) `object-fit: contain` on **`--plATileBg`** (#262626 on the dark sheet, #f0f0f0 on the light; on `.plAStage`, eased .3 s): "bg change based on mode, visual png above it". Supplements are cut-outs too, 4 padding, contain, on **`--plPTileBg`** (#252522 dark, #f3efed light; on `#dPlan`, no edge in Light). Medications on `--plTile` (cover). The meals' category visuals (`nut-cat-*`, 192 cut-outs) 84 at each My meals card's top right, no tile, margin −10 −4 −10 0.
- **Desk.** `#dPlan.plDesk`: a grid `minmax(0, 520px) 260px` gap 32 (L and XL: `580px 312px` gap 48), padding 32 40 0 on `--plSh`. Its goal cards: the phone's dark glass card in Dark (rgba(38,38,38,.84) + blur 24, white words, 72% lines), the white card under `body.light`; they follow the app's mode, not the Plan sheet tweak.
- **Sub pages** have no motion of their own: up and away at once inside the master's push / pop (`EvPush`, General layout > Page types). Their Back is 44 at 70 on the phone (the top of the 130 band), 32 on the desk; the subpages' stage pads `--plPPad` 40 (16 at S/XS).
- **Interaction states**: every control takes the Plan's plate (references/navigation-icons-motion.md, Hover / press), scoped `:is(#dPlan, .plSesSheet)`; `press(root)` binds `.plPress` on the Plan and on each drawn session sheet.
- **Activity session**: Top nav A (its title in the bar, level with its 44 Close); Exercises (a card each: 96 photo with a 44 smoked play disc, name 16/20 500, number circle 24, chips 12/16 on `--ar-badge-bg`; cards 16 padding, 20 round, 6 apart, 20 between columns), a rule (24 either side), the session's blocks (a tag 14/18 500 on `--ar-badge-bg`, its line 16/24 500, square-bulleted points 16/24), a rule, Important (a note on `--ar-blue-bg2`, a 3 px bar `--plSesBar`, 20 padding, 20 round). Section titles the Plan's `.plSecH` (18 500, h3 under the bar's h2). Entrance: the Exercises title rises 16 at 240 ms, each card 24 rising 70 ms after the one before.

**How to use.**
```js
host.querySelectorAll('.plNut .plRow[data-pn]').forEach(b => b.addEventListener('click', () => detSoloShow(b.dataset.pn, b)));   /* a row's sheet over the Plan */
const nutShow = (now, from) => now ? nutShow0(true, from) : pgP(() => nutShow0(false, from));                                     /* a Sub page */
window._plan.ses('fga');                                                                                                           /* open a session from elsewhere */
```
A new Plan surface: its colours from the `--pl*` tokens (and a `#dPlan.plLight` value), its tiles on `--plATileBg` / `--plPTileBg` with the tile radii, its tappables in the interaction states' lists and `SEL`, a Sub page through `pgP`, a sheet with `EvSheetHead` classes, `EvSheetSwipe`, `EvFullView.cover` on the desk and `planInert`.

**Pitfalls.** (1) Two modes to follow: the Plan's (`plLight`: the app's Light or the Plan sheet tweak) for the sheet, its Sub pages and the session; the app's for the desk goal cards. (2) A sheet over the Plan must take itself away when a Sub page opens (`nutShow0` calls `detHide(true)` first; `detSoloShow` refuses while a Sub page is up). (3) Cut-outs are WebP with alpha: never put them on a photo tile; the tile's grey is the token. (4) The session sheet lives outside `#dPlan`: any Plan rule it needs must be scoped `:is(#dPlan, .plSesSheet)`. (5) The play disc plays nothing yet (no video); the session photos are placeholders (noted in the Assets library).

---

## Assets library (`window.EvAssets`, `META`, `window.EvSvcImg`)

**What.** A page listing every picture and video the app uses (grouped, searchable, with used-in notes). Replacing one uploads it and swaps it live everywhere, for every viewer. `EvAssets` puts replacements in place; `EvSvcImg` is the shared map of the services' 3D renders, each path written once.

**Where.** `grep -n "window.EvSvcImg = \|window.EvAssets = \|window._al = "` (~16930, ~17016); `META = {` (`grep -n "META = {"` ~17102), `HL_FIGS`, `scan`, `scanFiles`, `GROUPS`; CSS `.alPage` (`--alBg --alFg --alMut --alLine --alCard --alAcc --alWarm`); `#alPage`; menu value `'al'`, `#assets-library`.

**API.** `EvAssets`: `sub(str)`, `keyIn(str)`, `now()` → `{key: {u, t, doc}}`, `remote()`, `db()`, `col` (`'assets'`), `preview(k, url, type)`, `clearPreview(k)`, `records()`, `base(k)`, `learn(k, v)`, `attach(doc)`, `on(fn)`, `refresh()`. Key = path under `assets/` with `/` → `~` (e.g. `overview~avatar-dr.webp`). dist tags data URIs `data:<mime>;as=<key>;base64,...` (build.js `tagOf`). Replacements in the shared db collection `assets/<key>` (`/_blob/<id>#<key>`). `data-eva-off` marks originals never swapped. META entry `"<key>": { name, group, kind, usedIn: ["Page · where"], note }`. `window._al = { show, hide, open(k), keys(), scan() }`. `EvSvcImg = { concierge, treat, symp, tele, path, cert, gp }`.

**Rules.** Replacement types png, jpeg, webp, gif, svg, mp4, webm (20 MB; 2 MB SVG). Sounds aren't tagged. Nothing runs while no asset is replaced. Swaps src/poster/style/href/srcset, CSS url() and custom properties, script-made `Image().src`, and same-origin frames (concierge, gift-receipt, clinic). Saved in the shared db (not localStorage).

**How to use.** Reference an asset by a literal path where it is used (the build inlines and tags it; the library finds it). Add a META entry; update `usedIn` when another page uses it. A picture several places share: one path in a map like `window.EvSvcImg` (or a token written once, as Send a gift's `--hpLivPic`).

**Pitfalls.** Each literal path is a base64 copy (16 MB limit). A runtime-assembled path is never inlined and breaks in dist. A literal path in a comment counts too. `scanFiles` reads only concierge, gift-receipt and clinic (gift.html / referral.html pictures aren't found until opened). Hairline stills are listed by hand in `HL_FIGS`. A picture replaced in place (the supplements' cut-outs over the same `sup-*.webp`) keeps its key and META entry.

---

## Tweaks panel (`#tkMenu`)

**What.** The prototype's control panel: per-page groups of controls, saved together and shared with everyone through the artifact's store.

**Where.** `grep -n 'id="tkMenu"'` (~13013; `.tkPanel`, `.tkHead`: `.stTkSave`, `.stTkReset`, `.tkX`); groups after it; `tkPages` (which groups show: the page's, or only those of the page or modal over it, `window.EvCtx`, flows-modals.md); two-option select → `.tgl` switch (exclusion list); `select.tkSegSel` → `.tkSegT`; Save/Reset `grep -n "tweaks/shared\|everlab:tkPages"` (~46470-46493); `.tkGroup[data-sec]` Overview section cards.

**API.** `<div class="tkGroup" data-pages="ov"><div class="tkSub">Heading</div><div class="tkRow"><span class="lbl">Label</span><select id="stXxx" aria-label="...">...</select></div></div>`. `data-pages` keys (space-separated): ov, ins, lp, ar, hp, wel, plan, cc, sug, dsg, prc, gift, gr, clinic, srch (Top Chat AI), ask (Ask sheet), sgf plus a step key (Send a gift, while its flow is up: `sgf sgfIn` Intro / Intro full video / Header / Video overlay, `sgf sgfPl` Plans, `sgf sgfEv` Envelope / Note control; the `sgf` context returns only the step's key). Also `data-tl`, `data-svc`, `data-sec`, `data-fl`. `tkPages(m, extra)`, `window.__tkPages()`. Ids `st*` (dock `dk*`); `tkSegSel`; `.tkProxy` and `.inkHex` not saved; hidden input + `button.tgl[role=switch]` for custom switches.

**Rules.** Save writes every `.topbar .tkPanel select/input[id]` (minus `versionSel`, `.inkHex`, `.tkProxy`) to `everlab:tkAll`, the DEF subset to `everlab:tkPages`, and, with `window.claude.use('db')`, the shared doc `tweaks/shared` (`{v, all, at}`, "Saved for everyone"); on load the shared doc overwrites local saves. Reset clears both and the shared doc, then restores load values (DEF2). Values restored by dispatching `change` (`input` for range). A two-option select becomes a switch (first option = On) unless `tkSegSel` or excluded. Migrations `everlab:mig:dock2`, `everlab:mig:recAuto`.

**How to use.** Add a control `stSomething` inside the right `.tkGroup[data-pages]`, listen for `change` (or `input`) and apply at once; Save/Reset pick it up. Named choices: `tkSegSel` or the exclusion list. A changed default: migrate older saves once with an `everlab:mig:*` flag. A control for one step of a flow: its own group with the step's key, and the context's `tweaks()` returning it on that step.

**Pitfalls.** Named two-option selects turn into on/off switches unless excluded. A control outside `.tkPanel` isn't saved. A group without `data-pages` (or with a key `tkPages` never computes) never shows. Older saves override new defaults until migrated. A Design-system saved setup must win over Tweaks. Two rows can share a label (Send a gift's two "Intro" rows): give the options distinct names.

---

## Design-system saved setups (the doc page is the master)

**What.** Each DS tab with live controls has Save setup writing the master's numbers; every page reads them on load, over Tweaks and older saves.

**Where.** EvOverlap `everlab:hoMaster` (doc Header overlap, `HO_C`); EvTitle `everlab:tgMaster` (doc Title group, `TG_C`/`TG_G`); EvPush `everlab:pushMaster` (doc Page types, `PT_C`); EvSteps `everlab:sfMaster` (`SF_C`); EvDismiss `everlab:mdMaster` (Modals `.mdSave`); `window._navMaster` `everlab:navMaster` (Navigation `.nvSave`). Shell: `const DOCS`, `DSET`; top bar `#tkDocSave` mapping (`grep -n "docCur === 'sf'"`).

**API.** EvOverlap, EvTitle, EvPush and EvSteps expose `M`, `D`, `set(k, v)`, `save()` (true on success), `reset()`, plus their own bind/update/html/go. EvDismiss has `K`, `on()`, `set(v)`, `save()`, `notch(el)` (no `M`/`reset`). The dock's is the `window._navMaster()` loader over `{ lab, icm, ins }` (labels, icon motion, the Insights icon); its Save is the doc's `.nvSave`. Doc buttons `.mdBtn` Save setup / Reset / Play (read "Saved" for 1400 ms), in each doc's right panel (EvDocPanel). View state keys `everlab:glPart glBp glCt tgDoc mdPart mdBp mdLay sfBp bbPart` (not masters).

**Rules.** Read on every page load, applied over Tweaks and older saves. localStorage only (this browser), unlike Tweaks (shared store). Loaders keep only finite numbers (and known keys).

**How to use.** New master: a module with `M` defaults, a key `everlab:<x>Master` read at parse, `set/save/reset`; a doc tab whose controls call `set()` live and whose Save calls `save()` (the controls tagged for the right panel, `EvDocPanel`, layout.md); add it to the `#tkDocSave` mapping; app instances bind through the module.

**Pitfalls.** Saved setups don't reach other viewers. A setup saved before a default changed keeps the old value unless the loader migrates it (navMaster maps `pop` → `beam`). A setup saved before a key existed takes the default for it (EvOverlap's `delay` / `ramp`, EvSteps' `fade`, navMaster's `ins`). Docs drawn from hand-written copies (Container table, Navigation's `T`) are not masters.

---

## House rules (parse check, build, size, comments, asset paths, fonts, publish)

**Where.** CLAUDE.md; `tools/build.js` (csso + terser, asset inlining, fonts, build-hp.js, the `<!--ev:master …-->` cuts for referral.html and concierge.html); `docs/working-notes.md`; the fonts comment near `--ar-font`.

**Rules.**
1. Parse-check every script before building (the command in SKILL.md; it checks index.html's blocks and visuals/concierge.html).
2. Build (`NODE_PATH=/home/user/visual/tools/node_modules timeout 170 node tools/build.js`), check, note in `docs/working-notes.md`, commit, push.
3. `dist/index.html` under 16 MB (about 15.6 MB now).
4. Never `//` mid-line in one-line code: use `/* */`.
5. Never a literal `assets/<path>.<ext>` in a comment; real references written literally, never assembled at runtime.
6. No backtick inside a comment within a template literal (shaders).
7. Fonts: Saans, Tobias, Suisse named in stacks, never embedded or loaded; only open-licence Google Fonts (Geist, Newsreader, ...) may be inlined by build.js in visuals/* pages.
8. Never create a new artifact. Publish `dist/index.html` to Everlab App - Latest with its `files` map (concierge, gift, clinic, gift-receipt, referral), then `open` it. Never publish the retired standalone Health Profile artifact, even when `dist/health-profile.html` changes.
9. Never commit PNGs, zips or MP4s. Scripted edits use exact anchors asserted to occur once. Comments quote the user's words, short.

**How to use.** After an edit: parse check, build, grep dist for the change (minified), working note, commit with the attribution footer, push, publish per CLAUDE.md.

**Pitfalls.** A JS parse error can name an unrelated identifier (GLSL in a template literal); `new Function` on the block names the line. csso/terser run on the built copy: an unclosed CSS comment in the source silently swallows rules. A quoted `-->` once opened an HTML comment over the page. A missing asset file stays a path with only a console warning. Large SVGs with embedded photos have come in at 17.9 MB. A helper session once published its own build against its brief: publish only the merged build.

## Interactive sizes and the core components (EvCtl)

- **What**: one height scale for every interactive element ("a Input m size will have the same size as a button m size; the m reflects the height"): lg 56 · md 44 · sm 36 · xs 28 · 2xs 20. Tokens `--ctlLg … --ctl2xs` on `:root`; `.evCtl-<size>` sets `--cH` (height), `--cPx`, `--cFs/--cLh`, `--cIc`, `--cGap`, `--cR` for the components.
- **Master**: `window.EvCtl` (grep `window.EvCtl = `): `btn({ label, size, kind: primary|secondary|tertiary|ghost, icon: ''|'l'|'r'|'both', iconOnly, disabled })`, `split({ label, size, kind })`, `badge({ label, size, kind: outline|tint|solid, icon })`, `input({ kind: text|search|select|area, size, placeholder })`, `chip({ label, size, on })`, `filter({ label, size, set })`, `seg({ size })` (EvSeg), `HAS` (the sizes each comes in), `sample(k, size)`, `wire(root)`. Classes `.evBtn .evSplit .evBdg .evIn .evChip`; ink via `--cInk/--cGnd` (dark default, `body.light` / `.arSheet:not(.arDark)` light).
- **Availability**: Buttons (label, icon only, split) lg–xs; Badges md–2xs; Inputs lg, md; Segment tab lg (two lines), md, sm; Filter chip md; Chip md, sm. Anything else is "Not available".
- **Docs**: Design system → Core components: Sizes (`#sizes`, the full matrix), Buttons (`#buttons`), Inputs (`#inputs`), Badges (`#badges`), Chips (`#chips`), Segment tab, Toggle; drawn by `czDoc(k)`.
- **Already on the scale**: `EvSeg` (`.evSeg2` lg, `.evSegM` md, `.evSegS` sm), `.arBtnLg` (lg). New controls should come from EvCtl, not a fresh button or field.
