---
name: everlab-design-system
description: Use for any change to the Everlab prototype's UI (index.html, visuals/*.html) - a new page, screen, modal, sheet, flow, chat widget, icon, loader, button or token - and for any question about a Design system element (breakpoints, frames, header, Top nav, Title group, container, Header overlap, Page types, Step flow, Modals, Dismiss/swipe, Navigation, dock, More, icons, Chat bubbles, Concierge, Loading states, tokens, Tweaks, saved setups, the Plan module, Send a gift). Says where each master lives, its API and numbers, how instances are built from it, and the house rules for building and publishing.
---

# Everlab Design system

The prototype is `index.html` (about 50k lines: never read it whole; `grep -n` an anchor, then Read with offset/limit), the pages in `visuals/*.html` (the chat is `visuals/concierge.html`), built by `tools/build.js` into `dist/`.

## The principle: Documentation is the master

Every Documentation / Design system page is the master component. The app's instances are built from the same code or settings, never from copied numbers. When a doc page has a saved setup, every page applies it on load, over Tweaks and older saves (CLAUDE.md).

The page menu `#versionSel` has Documentation (`'doc'`) and Design system (`'ds'`). Design system tabs (`DSET = ['gl','sf','md','bb','nv','ld']`): General layout (Header, Top nav, Title group, Container, Header overlap, Page types), Step flow, Modals (Full, Bottom sheet · Floating, Full bottom sheet), Chat bubbles, Navigation (Island and Iconography: dock, desk sidebar, More, Ask Everlab, the Insights icon), Loading states. Documentation tabs: Service timeline (`'pt'`, `components/progress-timeline/demo.html`), Concierge components (`'cc'`, references/chat.md), Membership onboarding (`'hp'`, `hcDoc`: Health profile card states and flows, Send a gift's pages, Concierge phases), Gifting (`'gf'`, `gfDoc`, `#gifting`: every screen of Send a gift, drawn by `HealthProfile.snap`, and of Receive a gift, `gift.html` framed and held with `#embed&still=intro|gift|next`). Grep `DSET` and `const DOCS` for the shell.

## How to work

1. **Find the master first.** Look the element up in the table below and read its reference. Grep its anchor (`grep -n "window.EvSteps = " index.html`). Line numbers in the references drift: trust the grep pattern.
2. **Build the instance from the master.** Call the module (`EvSteps.progress`, `EvPush.page`, `EvSheetSwipe`, `EvLoad.simple`, `EvSolo`, `EvTopNav.html`, `EvTitle.html`, `EvNavIc.svg`, ...) or read its tokens (`var(--ctPadX)`, `var(--evPhR)`, `--ar-*`, `--tg*`). Never re-implement a push, a swipe, a notch, a frame, a loader, a title or an icon. If no master fits, make one (below) rather than a one-off.
3. **Document it on its doc page.** A new pattern or state goes on its Design system tab (or the Concierge Components tab), drawn by the same code. Update the doc's hand-written tables when numbers change (several are stale today: see each reference's pitfalls).
4. **Saved setups.** A master with live controls has `M` defaults, `set(k, v)`, `save()`, `reset()`, a key `everlab:<x>Master` read at parse on every page, and the top bar's Save (`#tkDocSave`) mapped to it. Existing: `everlab:hoMaster` (EvOverlap), `everlab:sfMaster` (EvSteps), `everlab:tgMaster` (EvTitle, the Title group), `everlab:pushMaster` (EvPush, Page types), `everlab:mdMaster` (EvDismiss: `on()`, `set(v)`, `save()`, no `M`/`reset`), `everlab:navMaster` = `{ lab, icm, ins }` (dock labels, icon motion, the Insights icon: the `window._navMaster()` loader and the doc's `.nvSave`, not `#tkDocSave`). They are localStorage only (this browser).
5. **Page state.** `setMode` rewrites `body.className` whole: put new state on `<html>` or in `CARD_STATE` (written back in the class rebuild), never a hand-toggled body class.
6. **Page kind.** A destination of the dock / sidebar / More is a Main page (switched in place); a page opened from a page to go deeper is a Sub page and goes through `EvPush.page` (push in, pop out); modals and sheets are not pages (references/layout.md, Page types).

## House rules

- **Parse-check every script before building** (run from `/home/user/visual`):
  ```
  node -e 'const fs=require("fs");for(const f of ["index.html","visuals/concierge.html"]){const s=fs.readFileSync(f,"utf8");const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/g;let m,n=0;while((m=re.exec(s))){if(/type\s*=\s*["\x27]?(importmap|application\/json|text\/template|module)/.test(m[1]))continue;n++;try{new Function(m[2])}catch(e){if(!/import|export/.test(e.message))console.log(f,n,e.message)}}}'
  ```
- **Build**: `NODE_PATH=/home/user/visual/tools/node_modules timeout 170 node tools/build.js` (writes dist/index.html, concierge, gift, clinic, gift-receipt, referral, health-profile.html). Then grep `dist/` for the change (minified: quotes and spaces change).
- **dist/index.html stays under 16 MB** (about 15.6 MB now: little room). Every literal asset path is inlined as base64: write a shared picture's path once (as `window.EvSvcImg` does).
- **No `//` mid-line** in one-line code: use `/* */` (a `//` swallows the rest of the line).
- **No literal `assets/<path>.<ext>` in a comment** (the build inlines it). Write real references literally, never assembled at runtime (`'assets/' + name` breaks in dist).
- No backtick inside a comment within a template literal. No `-->` in quoted text.
- **Fonts**: brand faces (Saans, Tobias, Suisse) are named in stacks, never loaded or embedded. Only open-licence Google Fonts may be inlined by build.js, in visuals/* pages.
- Never commit PNGs, zips or MP4s. Scripted edits use exact anchors asserted to occur once. Comments quote the user's words, short.
- After a change: build, check, a note in `docs/working-notes.md`, commit, push, publish per CLAUDE.md.
- **Never create a new artifact.** Publish `dist/index.html` to Everlab App - Latest with its `files` map (concierge, gift, clinic, gift-receipt, referral), then `open` it. The standalone Health Profile artifact is retired: never publish it, even when `dist/health-profile.html` changes.

## Elements and where they are documented

| Element | Master / anchor | Reference |
|---|---|---|
| Breakpoints, Viewport select (XS/S/M/L, Auto) | `#stBp`, `body[data-bp]`, `html.bpAuto`, `--bpW` | references/layout.md |
| XS phone / S tablet frame (852 device, fit-scaling, the corner clip) | `#bpFrame`, `--evPh*`, `--evTb*`, `--bpS`, `clip-path: inset(0 round 56px)` | references/layout.md |
| Top nav master (A / B / C, General layout > Top nav) | `window.EvTopNav`, `.evTn`, `glTn` | references/layout.md |
| Title group (a title's level, its slots, support lines, icons; General layout > Title group) | `window.EvTitle`, `.evTg`, `--tg*`, `glTg` | references/tokens-components.md |
| Container tokens, General layout > Container ("max width on the body, not the viewport") | `--ctPadY/X`, `--ctGap`, `--ct2xs`, `--ctXs` 800, `--ctSm` 1080, `--ctMd` 1280, `--ctLg` 1440, `data-container` | references/layout.md |
| Header (status bar, nav bar, titles) | `--hdr*`, `glDoc` | references/layout.md |
| Header overlap | `window.EvOverlap` | references/layout.md |
| Page types (Main / Sub: every Sub page pushes in and pops out) | `window.EvPush`, `glPt`, `everlab:pushMaster` | references/layout.md |
| Desk page panels | `#dMain #dOver #dSvc #dTl #dApt #dAcc #dPlan #dMkt`, `--pnCap` | references/layout.md |
| Main page titles and header discs (the XS·S H2 rule) | `--pgH1Fs`, `#dMkt .mkT`, `#dTl .tlH1`, `#dAcc .acHead h1`, `--mainBtn` | references/layout.md |
| Home indicator and safe areas | `--evHome`, `.mHome` | references/layout.md |
| Design system page shell, General layout tab | `window._doc`, `DSET`, `glDoc` | references/layout.md |
| Doc pages' controls panel (every control in a Tweaks-style right panel) | `window.EvDocPanel`, `data-dp*`, `.dpRail` | references/layout.md |
| Viewport centring with docked panels | `--vwC`, `html.tkDocked/flowDocked` | references/layout.md |
| Flow panel (closed on load, opened by its button) | `#tkFlowBtn`, `html.flowOff`, `window.__flowPanel`, `__flowOk` | references/layout.md |
| Step flow (Linear / Fade; the Questionnaire Header: step titles `--sfQh` lower) | `window.EvSteps` | references/flows-modals.md |
| Modals doc | `mdDoc` | references/flows-modals.md |
| Full modal shell, standalone full modals (Suggestion, Doctor's suggestion, Personal recommendation, Activity session) | `.aqWrap.aqDesk.aqFull`, `window.EvSolo` (`dark`, `bar`, `paint`) | references/flows-modals.md |
| Full bottom sheet stacking | `iosLay1` / `iosStk` script | references/flows-modals.md |
| Sheet header (titled sheets: 24/30 title, compact 32 Close) | `window.EvSheetHead`, `.evShHd/.evShT/.evShX` | references/flows-modals.md |
| Swipe down to dismiss | `window.EvSheetSwipe`, `window.evK` | references/flows-modals.md |
| Dismiss master and notch | `window.EvDismiss`, `.evNotch` | references/flows-modals.md |
| Modals cover the full viewport | `window.EvFullView` | references/flows-modals.md |
| A modal that takes over owns Tweaks and Flow while it is up | `window.EvCtx`, `html[data-tk]`, `__flowOk` | references/flows-modals.md |
| Consent | `window.EvConsent` | references/flows-modals.md |
| Loading states (Simple on Send a gift's Continue to payment) | `window.EvLoad` | references/flows-modals.md |
| Biomarker detail sheet (Insights rows, Async report, Plan's What this moves) | `window.BioDetail` | references/flows-modals.md |
| Send a gift (the Health profile module's gift flow: intro, note, envelope, plans) | `_hp.gift()`, `BUILD['gift.*']`, `gfEnv`, `gfNc`, `stGf*` | references/flows-modals.md |
| Desk sidebar (and its icons; retract rail 52) | `.dash .side`, `body.sideMin`, `body.sideMove`, `lit()` | references/navigation-icons-motion.md |
| Phone dock | `MOBILE_NAV`, `mountNav` | references/navigation-icons-motion.md |
| Dock active pill | `navPill`, `.mPill` | references/navigation-icons-motion.md |
| Dock master saved setup (labels, icon motion, Insights icon) | `window._navMaster`, `everlab:navMaster` | references/navigation-icons-motion.md |
| Icon motion (Beam/Pop/Rise/Fade) | `svg.evIc`, `navIc*` body classes | references/navigation-icons-motion.md |
| Icon library (Insights Chart / Heart) | `window.EvNavIc`, `EvNavIc.ins()` | references/navigation-icons-motion.md |
| More sheet | `window.EvMore`, `__litMore`, `__morePage`, `.mvRow[aria-current]` | references/navigation-icons-motion.md |
| Eva's beam star, the AI button's press ring | `window.EvBeamStar(.press)` | references/navigation-icons-motion.md |
| Ask Everlab card (service tiles start their chat) | `window.EvAsk`, `window.EvSvcChat` | references/navigation-icons-motion.md |
| Other beams (chat composer, intro field, field star) | `window.EvBeam`, `hpCcBm`, `.ovChatSpark` | references/navigation-icons-motion.md |
| Carousels | `window.EvMagnet` | references/navigation-icons-motion.md |
| Hover / press conventions, the Plan's interaction states | plain CSS; `:is(#dPlan, .plSesSheet) --plHov/--plPrs/--plPrsS`, `.plPress` | references/navigation-icons-motion.md |
| Chat bubbles master | `bbDoc`, `.bbB` | references/chat.md |
| Concierge intro bubbles | `.hpCc*`, `bub()`, `flip()` | references/chat.md |
| In-app chat | `window.EvChat` | references/chat.md |
| Phone keyboard (the one drawn keyboard) | `window.EvKbd`, `.mKbd`, CSS "Phone keyboard (EvKbd;" | references/chat.md |
| Eva / Care team menu and switch beam | `setModel`, `EvBeam.run`, `beamRun` | references/chat.md |
| Concierge page | `visuals/concierge.html` | references/chat.md |
| BLOCK widgets | `var BLOCK` (concierge.html) | references/chat.md |
| Conversation model and personas | `A`, `match()`, `PERSONA` | references/chat.md |
| Conversation editor | `Concierge.getConv/setConv/edits` | references/chat.md |
| Concierge components gallery | `buildCmp` | references/chat.md |
| Chat video stage and builder (Marketing page, MP4 export) | `Concierge.stage` (`concierge.html#stage`), `visuals/chat-video.html`, `window._mtg`, `ChatVideo.exportMp4` | docs/chat-video.md |
| App embedding of the Concierge | `window._cc`, `#ccFrame` | references/chat.md |
| Thinking / typing loaders | `.bbThink`, `.bbTyp`, `.chThink`, `.think` | references/chat.md |
| Colour modes | `#themeSel`, `body.light` | references/tokens-components.md |
| Component tokens | `.arSheet --ar-*` | references/tokens-components.md |
| Range colours, status pills | `--rg*`, `--mb*`, `.st`, `.arLfPill`, `.tdTag` | references/tokens-components.md |
| Type, spacing, radius tokens | `--hdr*`, `--ct*`, `--evPh*`, `--tg*` | references/tokens-components.md |
| Cards | `--ar-card-bg`, `.sgmCard` | references/tokens-components.md |
| Buttons | `.arBtn.arBtnPrimary.arBtnLg`, `.svBtn`, `.sgmAsk` | references/tokens-components.md |
| Vertical timeline | `window.EvTl` | references/tokens-components.md |
| The Plan module (tiles, Sub pages, sheets, Activity session) | `#dPlan`, `window._plan`, `--plATileBg`, `--plPTileBg`, `detSoloShow` | references/tokens-components.md |
| Assets library | `window.EvAssets`, `META`, `window.EvSvcImg` | references/tokens-components.md |
| Tweaks panel | `.tkGroup[data-pages]`, `st*` ids | references/tokens-components.md |
| Design-system saved setups | `everlab:*Master` | references/tokens-components.md |
| House rules | CLAUDE.md, tools/build.js | references/tokens-components.md |

## Pending (fill in after they merge)

Each has a short "Pending" placeholder in its reference; replace it with the usual what / where / API / rules / how to use / pitfalls once the work is on this branch.

- **Chat top bar** (#273, still pending): EvChat's `.chHead` and the Concierge's `.hd` keep their own markup with the master's 44 discs until it merges. references/chat.md.

Merged since the skill was first written, documented here: the **Chat video builder** (#268: Marketing, `Concierge.stage`, the MP4 export; docs/chat-video.md, references/chat.md), the Ask sheet Services Grid / Carousel and services list (references/navigation-icons-motion.md), the gift plan cards’ dot-ribbon banner and List cards (references/flows-modals.md), the Top nav master and container tokens (#260), desk panels follow the Overview (#270, `--pnCap`), the Plan's hover / press (#269), Page types (#274, `EvPush`), XS 852 (#266), the Ask sheet icons (#271), the Title group (`EvTitle`), `window.EvSolo` with `dark` / `bar` / `paint`, the Insights icon (`ins`), the More sheet's plate, the 52 retract rail, the XS / S corner clip, the Flow panel closed on load. Places still on their own heads: EvChat `.chHead` and the Concierge `.hd` (#273), the flows' `.arHeadRow` (the master's 44 discs only), the Header tab's `--hdr*` (doc only). Top bar CTAs are 44 everywhere ("CTA top nav always 44px"); titled sheets wear the sheet header master (EvSheetHead).

## Checklist before you ship

- [ ] The element's master was found and used; no copied numbers, no second implementation.
- [ ] New state lives on `<html>` or in `CARD_STATE`, not a hand-toggled body class.
- [ ] Works at XS, S, M, L and in Auto (no `data-bp` on a wide window), Dark and Light.
- [ ] A Sub page opens and closes through `EvPush.page`; a Main page switches in place.
- [ ] Phone sheets bind `EvSheetSwipe` (with `handle`, `skip`, `when`) and wear the `EvDismiss` notch; full modals do not swipe.
- [ ] Framed surfaces use `--vwC`, `--bpW`, `--bpTop/--bpBot`, join the `--bpS` scale list if laid in the XS frame (and the corner clip list if they can slide); drags divide by `evK(el)`.
- [ ] The doc page shows the change (drawn by the same code) and its hand-written tables are updated.
- [ ] New saved setup: key read at parse on every page, `#tkDocSave` mapped, wins over Tweaks.
- [ ] Parse check passes, build passes, dist under 16 MB, the change found in `dist/`.
- [ ] Working note written; committed (and pushed, published per CLAUDE.md: Everlab App - Latest only) when the task says so.
