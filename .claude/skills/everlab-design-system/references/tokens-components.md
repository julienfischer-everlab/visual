# Tokens and components: colour modes, --ar-* tokens, range colours and pills, size tokens, cards, buttons, EvTl, Assets, Tweaks, saved setups, house rules

All anchors are in `index.html` unless named. Line numbers drift; grep the pattern. None of these has a Design system tab of its own except where stated.

---

## Colour modes (Dark / Light, `body.light`)

**What.** Two modes. Dark is the default; Light adds `body.light` and every themed rule is a `body.light` override (about a thousand). Dark also adds `body.black`. There is no single semantic palette: each surface family has its own token set.

**Where.** `grep -n 'id="themeSel"'` (options dark/light); `grep -n "theme0"` (lightOn/blackOn, the change handler); `setMode` adds back `' light'`/`' black'`; `grep -n "body.theming"` (crossfade); the old `:root --bg/--ink/--ink-bright/--pill/--pill-line/--accent` (~8-14) and their `body.light` values (~11020).

**API.** `#themeSel` `'dark'|'light'`; `body.light`, `body.black`; `body.theming` (700 ms: background, colour, border, fill, stroke .55s `!important`). Per-surface hooks: `.arSheet.arDark` (report, Health profile, standalone modals; evSolo `paint()` toggles it); `.ldDoc.evDark` (doc pages follow `body.light` by MutationObserver); `#dPlan.plLight` (light when `body.light` OR Tweaks `#stPlSheet === 'light'`); iframe pages get `documentElement.dataset.theme` from `docTheme()` (concierge.html uses `:root[data-theme]` + `prefers-color-scheme`).

**Rules.** Two modes only ("Dark mode, default; Light mode; no need for Colour mode"). Secondary text is ink at 56% (`oklch(var(--ar-ink) / .56)`). Modal ground #181818 in dark. Grey card #000 4% light / #fff 6% dark. Line colour white 8% dark / ink 10% light (`--evNotchC`). Theme applied from the first frame. Not saved with Tweaks (`#themeSel` is in the top bar, not `.tkPanel`).

**How to use.** Read the mode from `body.light` (CSS) or `!document.body.classList.contains('light')` (JS). A new surface defines its tokens on its root plus a `body.light` override, or follows `.arSheet/.arDark`. A same-origin iframe sets `data-theme` on its documentElement.

**Pitfalls.** `setMode` writes `body.className` whole: a hand-toggled body class is lost on page change (use `<html>` or `CARD_STATE`). A surface keyed to its own toggle (Plan sheet, `.arDark`) must follow `body.light` explicitly. The `:root --bg/--ink` set is the old organ concept's: not for app UI.

---

## Component tokens (`.arSheet --ar-*`)

**What.** The Genome UI tokens from the Async report source: the de-facto component tokens for every sheet, modal and flow (Async report, Health profile, Step flow, evSolo modals, consent). Ink is an oklch triple used with an alpha.

**Where.** `grep -n -- "--ar-ink:"` (~15560: `.arSheet` light; `.arSheet.arDark`, `.arSheet.arIsIntro` dark); the class-name warning comment just above.

**API.** `--ar-ink` (e.g. `'0% 0 0'`, used as `oklch(var(--ar-ink) / a)`), `--ar-paper` (#fff / `oklch(16.84% 0 263.28)`), `--ar-fg`, `--ar-blue-bg2`, `--ar-blue-fg` (focus ring), `--ar-br3`, `--ar-opt-fg/-fg2/-bg/-bg2`, `--ar-sub-*`, `--ar-out-fg/-bg/-bg2`, `--ar-card-bg` (`oklch(0% 0 0 / .04)` light, `oklch(100% 0 263.28 / .06)` dark), `--ar-card-invert-bg`, `--ar-badge-bg`, `--ar-btn-bg` / `-bg-hover` (.64) / `-bg-active` (.48) / `--ar-btn-fg`, `--ar-radius-card:12px`, `--ar-font` ("Saans", ui-sans-serif, system-ui, ...), `--ar-font-mono` ("Saans Mono", ...), `--ar-ease: cubic-bezier(.2,.7,.2,1)`, `--ar-head-top:16px`, `--ar-foot-bottom`, `--ar-fade`.

**Rules.** Every selector scoped under `.arSheet`, every class prefixed `ar`. The root selector is repeated (0,4,0) to beat older unscoped `.arSheet` drawer rules. Weight 380 is written 400. Fonts named, never loaded. Secondary text ink .56. Focus: 2px outline `--ar-blue-fg`, offset 2.

**How to use.** Build a new sheet or modal as `<div class="arSheet ...">`, toggle `.arDark` from the mode (as evSolo's `paint()`). Colour with `oklch(var(--ar-ink) / a)` and `--ar-*`, not hex. Doc pages use their own set (`--ldBg --ldFg --ldMut --ldLine --ldChip --ldAcc`, `--sModal:#181818 --sLine --sCard --sCta`; `grep -n -- "--ldBg"`).

**Pitfalls.** Avoid class names index.html styles globally (`arRow arTop arList arNew arOpen arWrap arDesk`). A colour that switches with the theme must be a token. evSolo reads `--ar-paper` for the frame because the sheet's computed background is mid-transition after a mode change.

---

## Range colours and status pills (Optimal / Suboptimal / Out of range)

**What.** The three range readings as dots, meters and range bars (range colours) and as text pills. No single master: four parallel implementations share the colours.

**Where.** `grep -n -- "--rgOpt:"` (`:root` and `body.light`); `.arSheet --mbO/--mbS/--mbX` (`grep -n -- "--mbO"`); Insights `.st` (`grep -n "\.st\.ok"`, dark ~970, light ~11072); sheets `.arLfPill`; concierge.html `.tdTag` and `--tOptBg/Fg/Dot ...`.

**API.** Insights `<span class="st ok|sub|out|other">` with `ST_WORD = { ok:'Optimal', sub:'Suboptimal', out:'Out of range', other:'Unclassified' }`. Sheets `span.arLfPill.arLfOpt|.arLfSub|.arLfOut`. BioDetail `m.status` → `ST={o,s,x}`, `WORD n:'Unclassified'`. Concierge `.tdTag.opt|.sub|.out`. Overview insights `INS_WORD` sub: "To monitor".

**Rules.** `--rgOpt #aaeec2 --rgSub #ffe29f --rgOut #fe8087 --rgUn rgba(255,255,255,.48)`; light `#6fcb7c #f2c550 #e5514f #7f7f7f`; `--mbO/--mbS/--mbX` the same hexes. `.st`: radius 8, padding 5 11, 12.5px; dark ok #17251a / #9fc98f, sub #272113 / #f2c744, out #2b1416 / #fe8087, other #1e1e1d / #9a9a96; light ok #e5efdb / #55763f, sub #f3ead0 / #8f7327, out #f7dcda / #a33c39. `.tdTag` mirrors `.st` (5 11, radius 8, 12.5/16 500). `.arLfPill`: height 22, padding 0 8, radius 6, 13/16 400, `--ar-*-bg2` / `--ar-*-fg`.

**How to use.** Insights/dash lists: `.st` + `ST_WORD`. Inside an `.arSheet`: `.arLfPill` + `.arLf{Opt,Sub,Out}`. Charts, dots, meters: `var(--rgOpt/--rgSub/--rgOut)` in the shell, `var(--mbO/--mbS/--mbX)` in `.arSheet`. Concierge widgets: `.tdTag`.

**Pitfalls.** The hexes are copied in several places (`.st`, `--rg*`, `--mb*`, concierge `--t*`, and literals `#7fd6a0/#f3cf72/#f06a6a` elsewhere): a colour change touches all. The desk once lacked `.dash .st.out`. Wording differs on purpose ("To monitor").

---

## Type, spacing and radius tokens (`--hdr*`, `--ct*`, `--evPh*`)

**What.** The size tokens that exist as custom properties. No global type scale or radius tokens: type sizes are per component; header and container tokens are the closest thing to a scale.

**Where.** `grep -n -- "--hdrSb:54px"`, `grep -n -- "--ctPadY:24px"`, `grep -n -- "--evPhR:"`; General layout > Header (Sizes) and > Container (tokens table, `glCt`). Full detail in references/layout.md.

**API / rules.** Header 54 status bar; nav 76 phone / 64 desk; Back/Close 44 / 32, ink 7%, 16 icon; nav title 18/24 500; questionnaire 32/40 500 −0.4 (84 Hug); page title 24/30 (54 Hug) phone, 20/26 desk (48 Hug). Container XS/S/M/L padding top-bottom 24/28/32/36, sides 16/16/24/24, gap 24/28/32/36; max-width 2xs none/512/544/576, xs 800, sm 1080, md 1280, lg 1440. Prototype breakpoints XS 393, S 600, M 992, L 1440. Radii in use: `--ar-radius-card` 12; `.sgmCard` 20; rows/areas 16; bottom-sheet and floating modals 28; full bottom sheet 32; CTAs 9999; phone frame 56 (`--evPhR`); desk panels 12. Secondary text ink .56.

**How to use.** `var(--hdr*)` for a header, `var(--ctPadX/--ctPadY/--ctGap)` for a page container, `--evPhR/--evPhBz` (`--evTbR/--evTbBz`) for any device: never new numbers.

**Pitfalls.** The Container doc table and frame are hard-coded (`CT`), not read from the app's tokens. `--hdr*` are read only by the doc. A forced breakpoint has its own token overrides after the media queries: a new token needs both. **Being reworked**: Top nav + container-tokens rule (#260), desk panels (#270), DS "Page types" rule (#274).

---

## Cards

**What.** Card grounds. Inside sheets and modals a grey card is ink 4% (light) / white 6% (dark). Standalone modals use an opaque secondary ground so dots and rings can sit in it. No card master, no doc tab.

**Where.** `grep -n -- "--ar-card-bg"`; `grep -n -- "--sgmCardBg"` (color-mix), `.sgmCard`, `.sgmRow`; `.arRsList > .arAcc`, `.arRsArea`; Doctor's suggestion `--dsgCard`; desk `.dash .dcard`.

**API.** `.sgmCard`, `.sgmRow` (standalone modals); `.arAcc`, `.arRsArea`, `.arLfCardH` (sheets). Tokens `--ar-card-bg`, `--sgmCardBg` (`color-mix(in srgb, oklch(var(--ar-ink)) 6%, var(--ar-paper))`), `--sgmLine`, `--ar-card-invert-bg`, `--dsgCard` (#fff / `oklch(100% 0 0 / .07)`).

**Rules.** Grey card #000 4% light / #fff 6% dark. `.sgmCard`: margin-top 8, padding 20 (24 at M/L), radius 20. Rows/areas radius 16 (`.sgmRow` padding 16 on `--sgmCardBg`). Secondary text ink .56 at 15/22.

**How to use.** In an `.arSheet`: `background: var(--ar-card-bg)`. In an evSolo modal: `.sgmCard` (or `var(--sgmCardBg)` when a dot or ring cuts into it). Don't invent a new grey.

**Pitfalls.** The translucent `--ar-card-bg` lets dots and strokes show through, hence the opaque `--sgmCardBg`. Gift receipt / Overview cards have their own grounds: check the page's existing card first. **Being reworked**: Plan hover/press (#269), desk panels 12 px corners (#270).

---

## Buttons

**What.** The CTA family. Master primary: `.arBtn.arBtnPrimary.arBtnLg` (56 full pill) inside an `.arSheet`. The service page has `.svBtn`. Standalone modals add a tinted secondary pill (`.sgmAsk`) and a text button (`.sgmNot`). Tool chrome: `.tkBtn` (top bar / Tweaks), `.mdBtn` (doc pages), `.alBtn` (Assets).

**Where.** `grep -n "\.arBtnLg\|\.arBtnPrimary"` (~15750-15790); `grep -n "\.svBtn{"`; `grep -n "\.sgmAsk\|\.sgmNot"` (~5911-5926); `.mdBtn`; `.topbar .tkBtn`; `.alBtn`. The Modals tables state the CTA rules. No Buttons tab.

**API.** `<button type="button" class="arBtn arBtnPrimary arBtnLg"><span class="arBtnLabel">Next</span></button>`. Service `<button class="svBtn">`, `.svBtn.sec`. Disabled HP primary: `.arSheet.hpSheet .arBtnPrimary:disabled`.

**Rules.** `.arBtnLg`: width 100%, height 56, min-width 56, padding 0 32, radius 9999, 16/18 570, 2px transparent border, transitions .3s `cubic-bezier(.4,0,.2,1)`. Primary bg `--ar-btn-bg` (black light, white dark), hover .64, active .48, fg `--ar-btn-fg`. End/welcome screens hug the label (width auto, padding 0 36, centred). `.svBtn`: 56, 0 32, radius 12, #fff/#111 (light #111/#fff), 16 500; in a status block (`.svPend`) 44, radius 999, 24 sides, 56 on the phone filling the card; `.svBtn.sec` rgba(255,255,255,.08) (light rgba(46,31,26,.07)). `.sgmAsk`: 48 on the phone, 56 pill on the desk, ink 7% (hover 11%), blur 32. `.sgmNot`: 48, radius 16, text button (56 pill desk). Modals: phone buttons stacked 56 pills 8 apart, primary first; desk side by side; footer 34 under on XS. `.tkBtn`: 12px 500, #131316, 1px #232326, radius 8, 6 12.

**How to use.** Any flow, modal or sheet CTA: the `.arBtn` trio inside an `.arSheet`; a secondary beside it: `.sgmAsk` or `.sgmNot`; `.svBtn` only on the service page's own blocks. Loading: `EvLoad.label`/`simple` on the same button.

**Pitfalls.** A global button reset once blanked the HP card button (now `:where(:not(.hpOvBtn))`). `.svBtn` is overridden by context rules with `!important` (check `.svPend`/`.svcMob`). A disabled primary needs an explicit rule (only hpSheet has one). **Being reworked**: Plan hover/press (#269).

---

## Vertical timeline (`window.EvTl`)

**What.** A step list on a thin connector, one node per step, title ("when · what") and a line beside it. First used in the Suggestion's Plan change ("Why your heart scan moved"). Not the Doctor's suggestion `.dsgTl` nor the Service timeline (Documentation `'pt'`).

**Where.** `grep -n "window.EvTl = "` (~36764, header comment); CSS `grep -n "\.evTl"` (~5929); call sites in the Suggestion (`PC` steps, `section.sgmCard.sgmPcTl`).

**API.** `EvTl.html(steps, label)` → `ol.evTl[aria-label] > li.evTlSt.evTl_<s> > i.evTlNode + i.evTlLn (not on the last) + div.evTlTx > b.evTlT (hidden span.evTlVh 'Done: '|'Flagged: '|'Planned: ') + span.evTlD`. Step `{ s: 'done'|'flag'|'next', t, d }` (plain text, escaped). `EvTl.enter(list, a, d0)` uses an evSolo api (`a.rise`, `a.push`) and returns the delay at which the last (dashed) node starts.

**Rules.** Node 24 circle, margin-top −1, grid 24px + 1fr, gap 12, 16 below each step. done: `--evTlNode` ink .08 disc, check 15 at ink .9. flag: ember disc (`--evTlEmber` #d9653b light, #f78359 in `.arDark`) with a 16 sparkle in `--evTlEmberInk` (#fff / #1a120e). next: dashed ember ring (pathLength 70, dasharray 4 3). Connector left 11.25, top 23, width 1.5, `--evTlLine` ink .09; none under the last. Title 500 16/22; line 400 15/22 ink .56. Entrance: words rise 12 (640 ms); node pops .4 → 1 in 460 ms `cubic-bezier(.34,1.56,.64,1)`; next ring scales and rotates from −120deg over 640 ms `cubic-bezier(.16,1,.3,1)`; connector scaleY over 200 ms after 80 (`cubic-bezier(.45,0,.25,1)`).

**How to use.**
```js
sec.innerHTML = EvTl.html([{ s: 'done', t: '28 Oct · Your blood results', d: 'ApoB came back above range.' }, ...], 'What changed');
const ring = EvTl.enter(sheet.querySelector('.evTl'), a, d);   /* in evSolo enter(sheet, a); start the next block at ring */
```

**Pitfalls.** Needs an `.arSheet` ancestor (ink, font) and `.arDark` for the dark ember. Reduced motion: evSolo calls `still()` instead. Undocumented in the Design system: a doc tab would make it a true master.

---

## Assets library (`window.EvAssets`, `META`, `window.EvSvcImg`)

**What.** A page listing every picture and video the app uses (grouped, searchable, with used-in notes). Replacing one uploads it and swaps it live everywhere, for every viewer. `EvAssets` puts replacements in place; `EvSvcImg` is the shared map of the services' 3D renders, each path written once.

**Where.** `grep -n "window.EvSvcImg = \|window.EvAssets = \|window._al = "`; `META = {` (`grep -n "META = {"`), `HL_FIGS`, `scan`, `scanFiles`, `GROUPS`; CSS `.alPage` (`--alBg --alFg --alMut --alLine --alCard --alAcc --alWarm`); `#alPage`; menu value `'al'`, `#assets-library`.

**API.** `EvAssets`: `sub(str)`, `keyIn(str)`, `now()` → `{key: {u, t, doc}}`, `remote()`, `db()`, `col` (`'assets'`), `preview(k, url, type)`, `clearPreview(k)`, `records()`, `base(k)`, `learn(k, v)`, `attach(doc)`, `on(fn)`, `refresh()`. Key = path under `assets/` with `/` → `~` (e.g. `overview~avatar-dr.webp`). dist tags data URIs `data:<mime>;as=<key>;base64,...` (build.js `tagOf`). Replacements in the shared db collection `assets/<key>` (`/_blob/<id>#<key>`). `data-eva-off` marks originals never swapped. META entry `"<key>": { name, group, kind, usedIn: ["Page · where"], note }`. `window._al = { show, hide, open(k), keys(), scan() }`. `EvSvcImg = { concierge, treat, symp, tele, path, cert, gp }`.

**Rules.** Replacement types png, jpeg, webp, gif, svg, mp4, webm (20 MB; 2 MB SVG). Sounds aren't tagged. Nothing runs while no asset is replaced. Swaps src/poster/style/href/srcset, CSS url() and custom properties, script-made `Image().src`, and same-origin frames (concierge, gift-receipt, clinic). Saved in the shared db (not localStorage).

**How to use.** Reference an asset by a literal path where it is used (the build inlines and tags it; the library finds it). Add a META entry; update `usedIn` when another page uses it. A picture several places share: one path in a map like `window.EvSvcImg`.

**Pitfalls.** Each literal path is a base64 copy (16 MB limit). A runtime-assembled path is never inlined and breaks in dist. A literal path in a comment counts too. `scanFiles` reads only concierge, gift-receipt and clinic (gift.html / referral.html pictures aren't found until opened). Hairline stills are listed by hand in `HL_FIGS`.

---

## Tweaks panel (`#tkMenu`)

**What.** The prototype's control panel: per-page groups of controls, saved together and shared with everyone through the artifact's store.

**Where.** `grep -n 'id="tkMenu"'` (`.tkPanel`, `.tkHead`: `.stTkSave`, `.stTkReset`, `.tkX`); groups after it; `tkPages` (which groups show); two-option select → `.tgl` switch (exclusion list); `select.tkSegSel` → `.tkSegT`; Save/Reset `grep -n "tweaks/shared\|everlab:tkPages"`; `.tkGroup[data-sec]` Overview section cards.

**API.** `<div class="tkGroup" data-pages="ov"><div class="tkSub">Heading</div><div class="tkRow"><span class="lbl">Label</span><select id="stXxx" aria-label="...">...</select></div></div>`. `data-pages` keys: ov, ins, lp, ar, hp, wel, plan, cc, sug, dsg, prc, gift, gr, clinic (space-separated). Also `data-tl`, `data-sec`, `data-fl`. `tkPages(m, extra)`, `window.__tkPages()`. Ids `st*` (dock `dk*`); `tkSegSel`; `.tkProxy` and `.inkHex` not saved; hidden input + `button.tgl[role=switch]` for custom switches.

**Rules.** Save writes every `.topbar .tkPanel select/input[id]` (minus `versionSel`, `.inkHex`, `.tkProxy`) to `everlab:tkAll`, the DEF subset to `everlab:tkPages`, and, with `window.claude.use('db')`, the shared doc `tweaks/shared` (`{v, all, at}`, "Saved for everyone"); on load the shared doc overwrites local saves. Reset clears both and the shared doc, then restores load values (DEF2). Values restored by dispatching `change` (`input` for range). A two-option select becomes a switch (first option = On) unless `tkSegSel` or excluded. Migrations `everlab:mig:dock2`, `everlab:mig:recAuto`.

**How to use.** Add a control `stSomething` inside the right `.tkGroup[data-pages]`, listen for `change` (or `input`) and apply at once; Save/Reset pick it up. Named choices: `tkSegSel` or the exclusion list. A changed default: migrate older saves once with an `everlab:mig:*` flag.

**Pitfalls.** Named two-option selects turn into on/off switches unless excluded. A control outside `.tkPanel` isn't saved. A group without `data-pages` (or with a key `tkPages` never computes) never shows. Older saves override new defaults until migrated. A Design-system saved setup must win over Tweaks.

---

## Design-system saved setups (the doc page is the master)

**What.** Each DS tab with live controls has Save setup writing the master's numbers; every page reads them on load, over Tweaks and older saves.

**Where.** EvOverlap `everlab:hoMaster` (doc Header overlap, `HO_C`); EvSteps `everlab:sfMaster` (`SF_C`); EvDismiss `everlab:mdMaster` (Modals `.mdSave`); `window._navMaster` `everlab:navMaster` (Navigation `.nvSave`). Shell: `const DOCS`, `DSET`; top bar `#tkDocSave` mapping (`grep -n "docCur === 'sf'"`).

**API.** Masters expose `M`, `set(k, v)`, `save()` (true on success), `reset()`, plus their own bind/update. Doc buttons `.mdBtn` Save setup / Reset / Play (read "Saved" for 1400 ms). View state keys `everlab:glPart glBp mdPart mdBp mdLay sfBp bbPart` (not masters).

**Rules.** Read on every page load, applied over Tweaks and older saves. localStorage only (this browser), unlike Tweaks (shared store).

**How to use.** New master: a module with `M` defaults, a key `everlab:<x>Master` read at parse, `set/save/reset`; a doc tab whose controls call `set()` live and whose Save calls `save()`; add it to the `#tkDocSave` mapping; app instances bind through the module.

**Pitfalls.** Saved setups don't reach other viewers. A setup saved before a default changed keeps the old value unless the loader migrates it (navMaster maps `pop` → `beam`). Docs drawn from hand-written copies (Container table) are not masters.

---

## House rules (parse check, build, size, comments, asset paths, fonts, publish)

**Where.** CLAUDE.md; `tools/build.js` (csso + terser, asset inlining, fonts, build-hp.js); `docs/working-notes.md`; the fonts comment near `--ar-font`.

**Rules.**
1. Parse-check every script before building (the command in SKILL.md; it checks index.html's blocks and visuals/concierge.html).
2. Build (`NODE_PATH=/home/user/visual/tools/node_modules timeout 170 node tools/build.js`), check, note in `docs/working-notes.md`, commit, push.
3. `dist/index.html` under 16 MB (about 15.3 MB now).
4. Never `//` mid-line in one-line code: use `/* */`.
5. Never a literal `assets/<path>.<ext>` in a comment; real references written literally, never assembled at runtime.
6. No backtick inside a comment within a template literal (shaders).
7. Fonts: Saans, Tobias, Suisse named in stacks, never embedded or loaded; only open-licence Google Fonts (Geist, Newsreader, ...) may be inlined by build.js in visuals/* pages.
8. Never create a new artifact. Publish Health Profile first (if changed), then Everlab App - Latest with its `files` map, then `open` Everlab App - Latest.
9. Never commit PNGs, zips or MP4s. Scripted edits use exact anchors asserted to occur once. Comments quote the user's words, short.

**How to use.** After an edit: parse check, build, grep dist for the change (minified), working note, commit with the attribution footer, push, publish in the CLAUDE.md order.

**Pitfalls.** A JS parse error can name an unrelated identifier (GLSL in a template literal); `new Function` on the block names the line. csso/terser run on the built copy: an unclosed CSS comment in the source silently swallows rules. A quoted `-->` once opened an HTML comment over the page. A missing asset file stays a path with only a console warning. Large SVGs with embedded photos have come in at 17.9 MB.
