# Chat: Chat bubbles master, Concierge intro, EvChat, model menu, Concierge page, widgets, conversations, editor, embedding, loaders

Two documents: `index.html` (the app, the Chat bubbles master, EvChat, the Concierge intro, the embedding) and `visuals/concierge.html` (the Concierge chat page, its own document, built to `dist/concierge.html`). Line numbers drift; grep the pattern. The concierge.html entries below were not re-checked in this refresh (index.html only): grep them before relying on a number.

**Two chats exist.** EvChat (in-page, fake answers) and the Concierge iframe (`window._cc`). The Overview v5 card, More > Contact us and the Suggestion go to the Concierge; the Overview's service tiles, observation cards, Ask Everlab's question and its service tiles (`window.EvSvcChat`) go to EvChat. Pick the one the page already uses.

**Pending here.** The Chat top bar (#273) and the Chat video builder (#268): see their placeholders at the end of this file.

---

## Chat bubbles (Design system master)

**What.** Design system > Chat bubbles: the speech bubbles (member, Eva, clinician + face, typing bubble, attachment chip, 3x3 "thinking" loader) and their push/fade motion, drawn live and played with the same FLIP the Concierge intro runs. Two parts: Style (`st`) and Animation (`mv`).

**Where.** `grep -n "const bbDoc"` (~47726); CSS `grep -n "\.bbStage\|\.bbB{\|\.bbGrid"` (~7440); `DOCS` entry `bb: { el: () => bbDoc(), t: 'Chat bubbles', hash: '#chat-bubbles' }`.

**API.** No JS module: `bbDoc()` returns the element; local `B = { me(t), typ(dr), ai(t, att, dr), think(t) }`; `add(html, rm)` = FLIP; `play()` runs `SEQ`. Classes `.bbB`, `.bbMe`, `.bbAi`, `.bbDr` + `img.bbDrAv`, `.bbTyp` (three `<i>`, keyframes `ccTypD`), `.bbAtt` (i icon / b name / download svg), `.bbThink` + `.bbGrid` (9 `<i>`, `bbDot`), `.bbTh` (thread; `.bbAll`, `.bbLive`), `.bbStage` (393 x 540). Tab memory `everlab:bbPart`. Slow x4 (`.bbSlow`). Animation's Play / Slow sit in the right panel (EvDocPanel); Style has no controls (no panel).

**Rules.** `.bbB`: max-width `min(100%,320px)`; padding 12 18; radius 24 (no tail); 15/1.34 400; `text-wrap:pretty`; `backdrop-filter: blur(64px)`. `.bbMe` right, rgba(255,255,255,.06); `.bbAi` left, rgba(255,255,255,.22) (member + 16 points). `.bbDr` margin-left 44, max-width `min(100% - 44px, 320px)`; `.bbDrAv` 36 round at left −44 top 0, ring `0 0 0 1px rgb(255 255 255/.12)`, only on the first of a run. Gap 8; thread from the foot, padding 24 24 40. `.bbAtt` zoom .8, icon tile 34 radius 11, 10 above. Loader 3 x 3 4px squares gap 2, line at 62%. **Motion**: the stack moves together 420 ms `cubic-bezier(.22,1,.36,1)` (composite add); new bubble translateY 16 → 0 420 ms same curve, same frame; opacity 0 → 1 200 ms linear from 120 ms; no scale, no bounce. History: only the latest two (`.bbTh:not(.bbAll) > :has(~ * ~ *)` opacity 0 + blur 8, 500 ms). "Away" = thread up, each bubble fades and blurs on its own. Typing bubble only for the doctor. Sizes are owned by Tweaks > Concierge: `#stHpCcBubFs` (12-20, 15), `#stHpCcBubLh` (1.1-1.7, 1.34), `#stHpCcBubPx` (8-32, 18), `#stHpCcBubPy` (4-24, 12), `#stHpCcMeOp` (0-20, 6%), `#stHpCcMeCol` (#ffffff), `#stHpCcBubMw` (200-420, 320) → `--ccBubFs --ccBubLh --ccBubPx --ccBubPy --ccMeOp --ccMeRgb --ccBubMw`. No saved setup of its own (only Tweaks Save, `everlab:tkAll`).

**How to use.** New bubble UI uses `.bbB/.bbMe/.bbAi/.bbDr/.bbDrAv/.bbTyp` (as EvChat's care-team `drBubble` does) and the doc's FLIP:
```js
/* old children */ el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', composite: 'add' });
/* new one */      nw.animate([{ transform: 'translateY(16px)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
                   nw.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 120, easing: 'linear', fill: 'backwards' });
```

**Pitfalls.** The master is NOT shared code: the Concierge intro (`.hpCcB`, `flip()`) is a separate implementation, and the in-app / Concierge-page member bubbles use other classes and numbers (`.chBubble` radius 22, 12/16, max 82%; concierge `.msg.u .bub` radius 22, 11/18, max `min(80%,480px)`, rise 8px .42s `(.2,.8,.2,1)`). A doc change does not reach them. The sidebar prose is stale (says the face is 24 at the foot of the last of a run; the CSS is 36 at the top of the first; and 20%/4% vs the code's 22%/6%): trust the CSS and legend. Never put a mask-image on the thread (cuts the backdrop blur). Blur is 64.

---

## Concierge intro bubbles (instance of Chat bubbles)

**What.** The Health profile's Concierge intro (phases Intro, star, Island, Bubble speech, Services, Specialists) over a video: member/Eva/doctor bubbles, typing bubble, 3x3 thinking mosaic, Script attachment.

**Where.** CSS `grep -n "\.hpCcB\.hpCcB\|\.hpCcTh"` (~19190-19290) and the blur-64 / no-mask override; JS `grep -n "hpCcThink\|var flip = \|typB = "` (~21791-21880). Doc stills: Documentation > Membership onboarding (`'hp'` tab, Concierge phases row, `opts.ccPh` `'intro'|'star'|'island'|'meet'|'chat'`).

**API.** Internal to the hp module: `bub(c, now, rm)` with `c = [who 'me'|'ai', text, 'script'?, 'dr'?]`; `typB(who, rm)`; `dots(only)`; `flip(fn)`; `mid(b)` centres the latest bubble (padding-bottom `max(24, th.clientHeight/2 - b.offsetHeight/2)`; 16 under `html.hpCcVisFirst`). Classes `hpCcB hpCcMe|hpCcAi [hpCcDr] [hpCcIn]`, `img.hpCcDrAv`, `span.hpCcAtt`, `hpCcTypB`, `hpCcThink`.

**Rules.** Padding `var(--ccBubPy,12px) var(--ccBubPx,18px)`; radius 24; font `var(--ccBubFs,15px)/var(--ccBubLh,1.34)`; member `rgba(var(--ccMeRgb,255,255,255), var(--ccMeOp,.06))`; Eva/doctor + .16; blur 64. Doctor margin 44, avatar 36 at −44, first of a run only. Thread gap 12 (master 8), padding 24 48 (master 24 24), flex-end; history opacity/filter .6s (master .5s); away translateY(−32px), children opacity 0 blur 8 (.75s `cubic-bezier(.65,0,.35,1)`). FLIP identical to the master. The title groups' `--ccTgY` lands their tops 16 under the screen's middle; the pager (`.hpCcVDots`) is placed from the title group's foot.

**How to use.** Change the look through Tweaks > Concierge (`--ccBub*`), or edit the bbDoc CSS and the hpCc CSS together.

**Pitfalls.** Duplicated by hand (gap, padding, transition): keep both in step. Fade each bubble, never the thread (a fading parent cuts the backdrop blur: "bg disappears first, then the text"). The phases are listed in the Flow panel.

**The intro's title writing and video are shared with Send a gift.** The letter-by-letter reveal is one helper in the hp module, `ltrW()` (`grep -n "var ltrW = "` ~21530): `{ w(word), sp(words), at(), end() }`, spans `.hpWelC` 34 ms apart, 1300 ms each, played by `.on` on an `.hpLtrT` title (keyframes `hpWelRes` / `hpWelEmb`); a screen reader gets the words whole (`.hpSr`). The Send a gift intro (`BUILD['gift.intro']`) writes its H1 alone with it ("Treat someone you love / to a year of Everlab", no line under it: "h1 no sub"), in classes `hpH hpLtrT hpCcIntroT hpGfH`, so its type is this title's at every breakpoint (26/30 on XS/S, 28/36 on M/L, 570, -.01em). The Concierge's video (`window.__ccVid`, no second copy) plays in its `.hoPic` only with Tweaks > Send a gift > Header: Video (the gift's photo by default: the video read as "moving to the Concierge"), under a #111 blanket (`--gfVidBl`, 30%); the CSS rules are joined with `:is(.hpCcVid, .hpGfVid)`. A still or reduced motion: the words as text, the photo, no video. Send a gift's own rules: references/flows-modals.md, Send a gift.

---

## In-app chat (`window.EvChat`)

**What.** The app's own full chat: full-screen on the phones (`#phone`, `#phone2`), a centred card on the desk shell (`.dash`) at M/L, and the Navigation doc's phone. Head (menu, title, more, close), thread, composer (field, +, Eva/Care team pill, send), the drawn keyboard (EvKbd: the phones' own, the doc phone's, and on the desk at XS the frame's shared keys, `_frameKeys()`), up only while the field is focused, home indicator. Eva streams an answer from a regex bank; Care team answers with the master's doctor typing bubble, then his words.

**Where.** `grep -n "window.EvChat = \|attachChat"` (~34983; `ICON` ~34646, `DEFAULT_Q`, `ANSWER`, `BANK`, `DR_REPLY`, `DR_AV` before it); CSS `grep -n "\.chWrap\|\.chModal\|\.chComposer\|\.chKbd"` (~2676, ~2970-3100); the openings map `grep -n "const SERVICE_CHAT"` (~40236, also `window.EvSvcChat`).

**API.** `window.EvChat.attach(host, id)` with id `'phone'|'phone2'|'dash'|'doc'`; idempotent (`host._chat`). `host._chat = { open(src, question, ctx?), close(), send(q), model('eva'|'care') }`; `ctx = { title, q, answer: [paragraphs] }` (`SERVICE_CHAT` / `EvSvcChat`). Listens `everlab:go` (keyboard go), `everlab:mode` (closes). Sets `ph.classList 'chatOn'`, and `'chKbd'` while the composer's field is focused (removed on blur and on close), `ph._kbdTarget`, body `mSearchOn`; `--chSb`. On the desk: `place()` writes `--chSb` and calls `seat()`; `seat()` sets the modal's `bottom` to the keys' height while `.chKbd`, else 0. `care(turn)` → `drBubble(true)` at 450 ms, words at 2250 ms.

**Rules.** Plain cut: `.chModal` opacity .22s, no movement (its `bottom` follows the keys at their .32 s). Bg #121211 (light #f6ece6). Head padding 16 (the Top nav master's insets: 76 tall), under `--chSb` (the master's status bar over the modal, `frameStrip()`: 54 on XS, 28 on S, less what the frame already covers, so 7 under the XS 47 band): its 44s at 70 on XS and 44 on S, as the full modals', icons `var(--evTnD)` 44 round rgba(255,255,255,.08) with 16 glyphs (Close 13; `.chHead .chIcon.chX` held at 44 over the every-dismiss 36), title 16/500. Thread padding 6 16 12. `.chBubble` max 82%, 12/16, radius 22, rgba(255,255,255,.08), 15/1.4. Thinking "Thinking · Looking at your records" (`ICON.dots`, `chPulse` 1.1s); beat 900 ms, words every 22 ms, +180 ms per paragraph. Composer margin 8 12 12 (bottom = sides), padding 14 14 12, radius 24, .06 fill and **no border or inner ring** ("remove border"; light rgba(46,31,26,.05)); buttons 40 high radius 20; send lit once text (`.hasText`). New turn `.chTurn.in`: `chRise` .42s `cubic-bezier(.22,1,.36,1)` from 16px + `chFade` .2s linear .12s (the master's numbers). Desk: card `min(640, 100%-48)` x `min(720, 100%-64)`, radius 22, dim .55. XS/S drawn device: body padding-bottom 34, composer margin-bottom 12 (the sides'), `.chHome`. **The keys only while the field is focused** ("unfocus: no keyboard"): it opens focused (keys up, composer on them, 12 over); let go, the keys drop and the composer slides to the screen's foot, 12 over the 34 home space, the home bar back; focus again, the keys come back; send keeps the focus. One rule everywhere: the desk's XS frame (`html:not(.bpAuto) body[data-bp="xs"]:has(.dash.chatOn.chKbd) #bpFrame > .mKbd`, the body's 34 and `.chHome` go), the phones (`:is(#phone,#phone2).chatOn.chKbd .mKbd`), the doc's phone (`.nvFr:is(.kbdOn, .chatOn.chKbd) .mKbd`). No drawn keys at S/M/L or in bpAuto (`seat()` puts the foot at 0). Escape closes the model menu first, then the chat. Placeholders "Ask Eva…" / "Message your care team…".

**How to use.**
```js
const ph = el.closest('#phone2') || document.querySelector('.dash');
if (ph && ph._chat) ph._chat.open(tile, ctx.q, ctx);                                    /* Overview service tiles */
const ctx = window.EvSvcChat[t.querySelector('.aiSvcT').textContent.trim()] || window.EvSvcChat.Concierge;
close(); setTimeout(() => ch._chat.open(t, ctx.q, ctx), 300);                            /* the Ask sheet's service tiles: the sheet closes first */
```
Ask Everlab's question hands off with `ch._chat.open(card, q)` and removes the sheet after 300 ms (`.handoff`).

**Pitfalls.** Its member bubble is `.chBubble`, not `.bbMe`; its loader is `ICON.dots` + `chPulse`, not `.bbGrid`. `follow()` divides by a scale k (docs draw the phone scaled). Its top bar controls are 44 ("CTA top nav always 44px"), but `.chHead` keeps its own markup (title, model menu): the Chat top bar rework (#273) is still pending, so check `.chHead` against EvTopNav after it merges. A new keys rule must test `.chKbd`, not only `.chatOn` (the keys used to stay up, focused or not).

---

## Eva / Care team model menu and switch beam

**What.** The composer's model pill ("Eva ˅" / "Care team ˅") opens a popover: Eva "Answers from your Everlab record" (Everlab mark), Care team "A clinician replies within a business day" (team icon), a check on the chosen one. Switching Care team → Eva plays the intro's beam once round the field.

**Where.** In-app `grep -n "MODELS\|setModel"` (~34852), CSS `.chModel[aria-expanded] .chPop .chMi`; EvBeam (navigation-icons-motion.md). concierge.html: `grep -n "modelMenu\|beamRun\|'modelSet'"`, CSS `.evBeam` (copied "to the letter"), Components > Field demo (`data-demo`).

**API.** `host._chat.model(m)` = `setModel(m, true)`; in-app popover `.chPop[role=menu] > button.chMi[role=menuitemradio][aria-checked][data-m]` + `svg.ck`. Concierge `Concierge.model('eva'|'care')`, `#pop > .menuIt[data-act=modelSet][data-m]` (`.sel`) + `.ck`.

**Rules.** Beam numbers as EvBeam (1.9 s, conic #FF9F4A/#FFB866/#FF8A3D). Only on Care team → Eva (not on open, not Eva → Eva). Menu min-width 180, padding 6, radius 16, #232322 (light #fdfaf3), `chPop` .16s `cubic-bezier(.2,.8,.2,1)`; rows 10 12, radius 10, 15/1.45, small 13 #8b8b86; right edge on the pill, 8 above it. Placeholder switches with the model in both chats.

**How to use.** `if (beam && model === 'eva' && was !== 'eva' && window.EvBeam) window.EvBeam.run(composer)`; in concierge.html `beamRun(box)`.

**Pitfalls.** Two beam CSS copies (index.html and concierge.html) change together. The old `.boxBeam` streak is gone. Opening the chat calls `setModel('eva', false)` (no beam). The menu closes on the member's own wheel/touchmove, not the streamed scroll. While the keys are up, the field's buttons and the menu keep the focus (pointerdown prevented), or the keys drop from under the pointer.

---

## Concierge page (`visuals/concierge.html`)

**What.** The full Concierge chat: desktop app (sidebar: New chat, Inbox, Recent) or mobile panel (drawer); home (logo, "How can we help you today?", field, three ways in, For your attention with filter chips); Inbox; chat thread (member bubble, Eva text or clinician card, BLOCK widgets, meta actions); composer; the drawn keyboard (the app's EvKbd, put in at build); lightbox; toast.

**Where.** In concierge.html: tokens `:root` and dark; `.hd .thread .col .dock .box`; composer `.round .pill .send`; messages `.msg .bub .txt .blk .meta .in .think`; home; drawer; embed CSS; keyboard; `msgEl/answerHtml/metaHtml`, `go`, `ask`, `THINK`, `play`, `layout`. Built by `tools/build.js` (pictures inlined; EvKbd's CSS and script put in at `<!--ev:master EvKbd css/js-->`).

**API.** Tokens `--bg --side --fg --muted --faint --line --card --cardLine --bubble --input --hover --active --sec --secH --pri --priFg --acc --accFg --ok --bad --badge --badgeFg --pop --popLine --stage --scrim --ring --note --noteFg --edge --shadow --popShadow --sans --mono`, embed `--safeT/--safeB`, `--dockP` (12). Theme `html[data-theme='light'|'dark']`. Classes `.app(.mob .atHome .drawer .sideMin .closed .kb)`, `.hd .ttl .iconBtn .hdInbox`, `.thread > .col`, `.dock > .box` (`textarea#q`, `.boxRow`, `.round`, `.pill#modelName`, `.send#sendBtn .has/.on`), `.msg.u > .bub`, `.msg.a > .txt | .clin`, `.blk.b-<type>[data-b]`, `.meta`, `.think`, `.in`. `S = { view 'new'|'chat'|'inbox', id, hist, model, busy, dev 'desk'|'mob', tab 'chat'|'cmp' }`.

**Rules.** Dark bg #0d0d0c, side #181818, fg #ececec, muted #8b8b86, bubble .08, input .08, card .04; light bg #fff, side #efe7d8, fg #2e1f1a, muted #7d6b58, bubble rgba(46,31,26,.07). Column max 688, padding 12 24 40; dock 0 24 24 (phone: `--dockP` 12 left, right and below the field, over the keys too). Box radius 24, padding 14 10 10 18, no ring on focus ("NO border on focus state chat field"); textarea 15/1.5, max 160. Round/pill 36; send 40, folded (width 0, scale .6) until a character, lit when non-blank and not busy. Member bubble `min(80%,480px)`, 11 18, radius 22, pre-wrap. Eva text max 600. Blocks 16 under the text, 12 apart. msg gap 24 (desk 36 after a question). `.in` rise .42s `cubic-bezier(.2,.8,.2,1)` from 8px. Thinking: `.think` shimmer 1.6s, words `THINK[intent] + '…'`; 700 ms + min(500, blocks*160) before the answer; words two at a time every 26 ms; blocks at 140 + j*160 ms. `.clin` `min(100%,470px)`, 18 20, radius 20; doctor 36. `.hd` 60 on the desk (8 above and below its 44s); phone `.hd` 48 + `--safeT`, embedded 58 + `--safeT` (padding 1 + `--safeT` 16 9, 10 between); iconBtn 44 everywhere in the head ("CTA top nav always 44px": the desk's, the phone's embedded or not; 20 glyphs on the phone), `.hdInbox` 44 tall, 15 words, 20 icon; no minimise (the old `#hdMin` minus is gone); `--hdH` follows. Placeholders: home "Ask anything ...", desk "Ask anything…", mobile "Ask Eva…", care "Message your care team…".

**How to use.** Edit concierge.html, then build (`dist/concierge.html` is what `#ccFrame` loads; publish it in `files` as `concierge.html`). Links `#components`, `#mobile`, `#chat-<id>`, `#doc-components`, `#persona-2`.

**Pitfalls.** Its bubbles/motion are NOT the master's (radius 22, rise 8px, no blur, shimmer loader): flag before claiming "built from the master". Landing must not show the drawer (`.noSlide`). The field is moved between `#homeBox` and `.dock` (`boxTo`), never copied. Its head's ground is a copy of the Top nav master's `.evTnG` (merged #260; `--hdH`, the thread runs up under `.hd`, `.evTnOn` once scrolled): change it with index.html's. The head itself keeps its own markup (#273 pending, below). Its own home bar `.homeInd` hides while the keys are up (`.app.kb ~ .homeInd`). **Its stage** (`#stage`, `Concierge.stage`: the Chat video builder's preview and every MP4 frame; docs/chat-video.md) clones this page's `.main > .hd` for the phone's head, so a change to the head reaches the video; run `tools/stage-check.js` after changing the chat's markup or CSS.

---

## BLOCK widgets and their data shapes (concierge.html)

**What.** What an Eva answer shows under its words: appointment card/rows/group, goals carousel/single, attachments, reports carousel/single, citation, image/image group, suggestion chips, and the proactive check-in set (header, biomarker trend sparkline, booking card with states, doctor's footnote).

**Where.** `grep -n "var BLOCK"` (renderers after, `REG`), data `APT ST GOALS FILES REPORTS IMGS DOCTOR`, renderers `aptCard aptRow aptGroup goalCard carousel attChip atts repCard imTile imGroup cite ROWS`, `sparkSvg`; CSS `.apt .aRow .car .goal .att .clin .rep .ckHd .trend .spark .bk .drNote .im`; booking clicks `bkBook bkTimes bkSlot bkCal bkRe`.

**API.** `Block = { t, ...data }`:
- `{t:'apt', k: review|dexa|nutri|mri|physical|blood, st: booked|open|done|blocked|soon|review, date?, cmp?}`
- `{t:'aptGroup', rows:[[k, st, date?],...], shown?:3}`, `{t:'aptRows', rows}`
- `{t:'goals'}`, `{t:'goal', i}`
- `{t:'atts', f:[blood|bio|ferritin|iron|mriRep|study]}`
- `{t:'reports', r:[diag|nutri|mri|phys]}`, `{t:'report', r}`, `{t:'cite', r}`
- `{t:'img', k: sheet|neuro|cmp|sheet2}`, `{t:'imgGroup'}`
- `{t:'sugs', qs?:[...]}`
- `{t:'checkin', who:'Eva', when:'just now'}` (a HEAD block, drawn above the words)
- `{t:'trend', name, unit, date, st:'opt'|'sub'|'out', pts:[[label, value],...]}`
- `{t:'booking', title, incl, slots:[[day,time],...], at, prep, place, area, dist, after, st:'offer'|'times'|'loading'|'booked'}`
- `{t:'drNote', text}`

Rendered as `<div class='blk b-<t>' data-b=j>`; booking is stateful via `data-reg` (REG).

**Rules.** ST: booked "Booked" [View]; open "Not booked" [View, Book]; done "Complete"; blocked "Blocked"; soon "Starting soon" [View, Join call]; review "In review". Trend: opt Optimal, sub Suboptimal, out Out of range. Sparkline 64 x 28, PX 5 PY 6, points r 2.25, last r 7 halo + 4. Booking: "Book this time" → loading ("Booking" spinner) → booked ("Add to calendar", "Reschedule"); "Other times" radiogroup. Unknown `t` is skipped.

**How to use.** Add a block to `A[intent].blocks` or a turn's blocks (via `Concierge.setConv` / the editor). New type: `BLOCK.<t>` renderer + `WIDGETS` entry + `FIELDS` entry + a Components section + CSS.

**Pitfalls.** `turnsIn()` resets a booking caught in `loading` to `offer`. Blocks are copied per turn (`turnOf`): never share references. Header-type blocks must be added to `HEAD = {checkin:1}`.

---

## Conversation model and personas (concierge.html)

**What.** One shape for a conversation the chat draws and the editor writes; intents (`A`) matched by regex; seeded history; Persona #1 (the member) and Persona #2 (opens on Eva's ApoB check-in).

**Where.** `grep -n "var A = \|var match = \|var TITLES\|var SEED\|var PERSONA\|turnOf = \|var loadPersona = \|var setPersona = "`.

**API.** `Turn = { r:'u'|'a', text, who?:'eva'|'doctor', when?, blocks:[Block], time, k? }`. `chats[id] = { id, title, msgs:[Turn] }`; `order` newest first. `Persona = { id, open?, convs(), inbox, attn, cats, match?(s) }`. Intents: aptNext aptSoon aptGroup goals goalOne attach clin reports nutri protein mri mriCmp mriAll mriStudy care help script refSpec refBlood refImg reqSent apobWhat apobTrend apobFast apobBook p2Results p2Help. `Concierge.persona(id?)` → `'p1'|'p2'`.

**Rules.** `match()`: requests first (renew/script → script; refer → refBlood/refImg/refSpec), then the persona's own match, then Persona #1's regexes, default `help`. Model care → `care`. After a request question (`REQ`) → `reqSent`. New chat title = `TITLES[k]`, or the question's first 40 chars. Same persona again = no-op. Persona #2 opens chat `apob` unread and plays its last turn with "Eva is checking in".

**How to use.** From the app: Tweaks > Chat > Persona (`#stCcPer`) → `Concierge.persona(v)`; directly `concierge.html#persona-2`.

**Pitfalls.** `go()` and `ask()` bump `S.tok` so a playing answer stops when the chat moves; `play()` frees the field only for its own token. A check-in opened `{unread:true}` stays unread until the member answers, acts or leaves.

---

## Conversation editor (Tweaks > Chat > Conversation)

**What.** Edit the open conversation's questions, answers (Eva or care team), reply line and widgets from Tweaks; drag/move/delete turns; + Question / + Answer; Reset; saved with Tweaks.

**Where.** concierge.html API `grep -n "WIDGETS\|FIELDS\|getConv\|setConv\|onConv"` (the calls are set as `window.Concierge.getConv = ...`, the comment above lists every call). App: `grep -n 'id="ccEd"\|ccEdPick\|stCcConv'` (editor, `CC()` accessor, `turnHtml/draw`).

**API.** `Concierge.getConv(id?)` → `{ id, persona, title, turns, edited, seeded } | null`; `setConv(id, turns|null, { at?, persona?, title? })` (null = back to its own); `onConv(fn)` → unsubscribe (`fn({ id, persona, why:'open'|'chat'|'edits' })`); `edits(map?)` → `{ '<persona>:<id>': { title, turns, base? } }`; `convs()`; `widgets()` → `[{ t, l, fields:[{ k, l, kind:'text'|'area'|'select', opts }] }]`; `preset(t)`; `field(block, k, v?)`.

**Rules.** Edits drawn on the next frame (rAF batch). The chat's own turns on an edited conversation are written back (`convNote 'chat'`). `#stCcConv` (JSON of `edits()`, '' when empty) and `#stCcPer` persist with Tweaks Save (`everlab:tkAll`) and are put back on load. The Chat group (`data-pages="cc"`) shows for both chats' contexts (`chat` and `cc`, `EvCtx`).

**How to use.** From index.html always through the frame, JSON-copying across realms:
```js
const w = document.getElementById('ccFrame').contentWindow;
w.Concierge.setConv(id, JSON.parse(JSON.stringify(turns)));
```

**Pitfalls.** iframe objects are another realm: JSON-copy (`X()`) before keeping. The editor subscribes once per Concierge instance (`C.__ccEd`). A new chat that was only an edit is deleted on reset (`unOv`); a seeded chat returns to the persona's turns.

---

## Concierge components gallery (Components tab / Documentation > Concierge components)

**What.** Every Concierge component in each state: Field (model menu + beam demo), Appointments (wide, compact, rows, rows under an answer, group), Goals, Attachments (+ menu), Clinician fallback, Reports (single, carousel, citation), Imaging, Proactive check-ins (header, trend x3, booking x4, footnote, whole). Live as in the chat.

**Where.** concierge.html `grep -n "var buildCmp = \|cmpCheckins\|setTab"`, CSS `.cmpIn .sec .sub .wrapRow`, `embDoc`. App: Documentation tab `'cc'` (src `concierge.html#doc-components`, hash `#concierge-components`); theme from `docTheme()`.

**API.** `Concierge.setTab('chat'|'cmp')`; `#components` (with bar) or `#doc-components` (`html.embDoc`, gallery alone). Built from the chat's own renderers (`aptCard`, `aptRow`, `BLOCK.*`, `answerHtml`, `turnOf('clin')`).

**Rules.** A Documentation tab, not Design system (`DSET` excludes `'cc'`); `body.docCc` hides `#tkDocSave`. Field demo starts on Care team so picking Eva plays the beam; it keeps its own choice (`data-demo`).

**How to use.** Every new BLOCK or chat component gets a `sec()`/`sub()` in `buildCmp`.

**Pitfalls.** It shows widgets and the field only (no member bubble, shimmer or meta). The speech-bubble master is Design system > Chat bubbles. Its Field model menu is the specimen itself, not moved into the doc panel.

---

## App embedding of the Concierge (`#ccPage` / `#ccFrame`, `window._cc`)

**What.** The Concierge over the current page ("Chat" in the menu, `#concierge`): an iframe of concierge.html whose device is the Viewport's (phone in the XS frame, tablet in S, else desk), theme the bar's Mode, close posting back.

**Where.** `grep -n "window._cc = \|ccRun\|ccShow\|ccHide"` (~46825); markup `grep -n 'id="ccPage"'`; CSS `.ccPage` (z 45; `ccIn` on XS/S); `html.evCover` hides it under a full modal unless the Chat is the context up (`html.evCover:not([data-tk="cc"])`); concierge.html embed and close postMessage.

**API.** `window._cc = { show, hide, run(fn), fresh(), ask(q), inbox(), history(), care() }`; `run(fn)` shows the page, creates `iframe#ccFrame` (src `concierge.html`, clipboard-write, `.ccStat` cloned from `#bpFrame .bpStatus`) and calls `fn(window.Concierge)` now or after load (+60 ms). Concierge: `window.Concierge = { ask, go(view, id?, push?, o?), setDev, setTab, embed('phone'|'tablet'|'desk'|null), model, focus(), drawer(), persona, draft(t), getConv, setConv, onConv, edits, convs, widgets, preset, field }`. Close: `{ everlab: 'ccClose' }` → `ccHide`. Body `ccOn`/`ccOut`; menu value `'cc'`; `window.__pageVal()`.

**Rules.** `embed` sets `html .emb/.embPhone/.embDesk`, `--safeT` 54px phone / 30px tablet / 0, `--safeB` 22 / 12 / 0. `ccDev` re-embeds only when the mode changes. `ccHide` fades 260 ms. The frame is scaled with the XS device (`.ccPage` is in the `--bpS` list).

**How to use.**
```js
window._cc.run(c => { c.model('care'); c.go('new'); if (c.focus) c.focus(); });   /* More > Contact us */
window._cc.ask('Tell me about the ' + s.t + ...);                                 /* a service card */
```

**Pitfalls.** Never call `w.Concierge` before the frame has loaded: use `_cc.run`. try/catch `contentWindow` access. One path, one iframe (the editor expects `#ccFrame`). `dist/concierge.html` must be published in `files` or the frame 404s. The embedded head is 58 + `--safeT`, its controls 44 (#273 pending).

---

## Thinking / typing loaders in chat (four drawings)

**What.** How "Eva at work" and "someone typing" are drawn: the master 3x3 mosaic (`.bbThink/.bbGrid`), the doctor's typing bubble (`.bbTyp` / `.hpCcTypB`), the in-app pulse (`.chThink .chDots`), the Concierge text shimmer (`.think`).

**Where.** `grep -n "\.bbTyp\|\.bbThink\|\.bbGrid\|hpCcThink\|\.chThink\|\.chDots"`; concierge.html `.think`, `THINK`.

**API.** Master: `<div class='bbThink'><span class='bbGrid'><i>x9</i></span><span>line</span></div>`; typing: `<div class='bbB bbAi bbTyp bbDr'><img class='bbDrAv'><i></i><i></i><i></i></div>`. In-app: `<div class='chThink live'><span class='chDots'>ICON.dots</span><b>Thinking</b><i>·</i><span class='chStep'>Looking at your records</span></div>`.

**Rules.** Typing dots 6px, gap 4, opacity .35 → .95 and −3px, delays 0/.15/.3s, 1.2s. Grid 4px squares gap 2, durations 1.3-1.9s. Line at 62% ("Thinking", "Connecting you to your doctor"). Typing bubble only for the doctor.

**How to use.** New chat surfaces take the master's `.bbThink/.bbGrid` and `.bbTyp`.

**Pitfalls.** Only the master and the hpCc intro share the mosaic; EvChat and the Concierge page draw their own (known divergence, not to be copied further).

---

## Phone keyboard (`window.EvKbd`, Design system master)

**What.** The one drawn iOS keyboard: four rows (shift and delete on the third; 123, space, search on the fourth) and the home space under them, dark #1d1d1f with #6b6b6f keys (light #d1d3d9 / white keys). The Overview top field's (the XS frame's `#bpFrame > .mKbd`), the phones' `#mKbd`, the Overview phone's assistant keys, EvChat's, Send a gift's letters keyboard, and the Chat page's (`visuals/concierge.html`, put in by tools/build.js). Never draw a second keyboard ("Use same keyboard as the overview top chat field").

**Where.** index.html: CSS section `grep -n "Phone keyboard (EvKbd;"` (~2631) to `/* ---- end Phone keyboard ---- */`; JS `grep -n "window.EvKbd = "` (~20321, top level, beside EvDismiss/EvOverlap); users `grep -n "EvKbd.wire\|EvKbd.html"`. tools/build.js `masters['EvKbd css'|'EvKbd js']` (cut, parse-checked) for `<!--ev:master EvKbd css-->` / `<!--ev:master EvKbd js-->`.

**API.** `EvKbd.html()` the keys' markup (into an element of class `mKbd`); `EvKbd.wire(el, field | () => field)` its typing: pointerdown prevented (the field keeps the focus), the character at the caret (at the end when the field is not focused), an `input` event; shift caps the next letter; search dispatches `everlab:go` on the field then blurs it (the keys drop); 123 inert. Up state: the host's own selector (`body.ovKbd/frKbd/tlKbd`, `body:has(.dash.chatOn.chKbd)` at XS, `#phone.chatOn.chKbd`, `.nvFr:is(.kbdOn, .chatOn.chKbd)`) or `.mKbd.on`; light: `body.light` or `.mKbd.kbL`; `--kbR` rounds its foot with the screen.

**Rules.** Rises/drops `translateY(100%)` + `clip-path` .32s `cubic-bezier(.2,.8,.2,1)`, hidden (visibility) when down. Keys 42 high, radius 5, gap 6, rows 11 apart; home space 34. Height 254 at 393. A field standing on it sits as far over its top as from the screen's sides (Chat page `--dockP` 12; EvChat composer 12). A host that pads the keys pads them only while up (Send a gift's: a keyboard down at height 0 still showed its 8 px padding as a grey line under the footer).

**How to use.** `const k = document.createElement('div'); k.className = 'mKbd'; k.innerHTML = EvKbd.html(); EvKbd.wire(k, input);` then raise it with `.on` (or the frame's `_frameKeys()` in the XS frame). In another document, add the two `<!--ev:master EvKbd …-->` markers and guard on `window.EvKbd`.

**Pitfalls.** The Chat page has no `body.light`: it sets `.kbL` from its own theme on focus. Its own home bar `.homeInd` is a sibling after `#app`, hidden with `.app.kb ~ .homeInd` (a descendant selector never matches): one bar on the keys, theirs. Its field's buttons and the model menu keep the focus while the keys are up (pointerdown prevented), or the keys drop from under the pointer. A field leaving the screen never says focusout: blur it yourself so its keys drop (Send a gift's `show()`).

---

## Pending: Chat top bar (#273)

Still pending (not merged on this branch). Today EvChat's `.chHead` and the Concierge's `.hd` keep their own markup with the master's 44 discs and insets (above). After it merges, document here: whether the heads move onto `EvTopNav` (variant, `cls`, the model menu's place), the new numbers, the status-bar handling (`--chSb`, `--safeT`), and update EvChat's and the Concierge page's Rules and the Top nav's Pitfalls in references/layout.md.

## Pending: Chat video builder (#268)

On another branch, being merged; not on this branch yet. After it merges, document here: what it builds on the Concierge chat, its anchors (index.html and / or visuals/concierge.html), its API and data shape, its numbers and motion (does it reuse EvBeam or the Chat bubbles' FLIP?), its Tweaks or doc controls, a real call site, and its pitfalls; add its row to SKILL.md's table.

## Chat field master (EvChatField)

**What.** The one card a question is typed into, the same everywhere ("this chat field should be the same everywhere; make sure this is part of a DS component"). The star's Dock chat is the reference. The words sit on top at 17; 20 below them come the tools: + at the left, then who it goes to (Eva) and send at the right, each 36.

**Where.** CSS `grep -n "EvChatField, the chat field master" index.html`. The tokens are on `:root`, with light values on `body.light`:

| Token | Dark | Light | What |
|---|---|---|---|
| `--cfBg` | #2a2a2a | #fff | the card's ground |
| `--cfRing` | white 6% | ink 8% | its 1 px ring |
| `--cfR` | 28 | 28 | corners |
| `--cfPT` / `--cfPX` / `--cfPB` | 24 / 24 / 16 | same | inside |
| `--cfFs` | 17 | 17 | the words |
| `--cfGap` | 20 | 20 | words to tools |
| `--cfBtn` / `--cfBtnBg` | 36 / white 8% | 36 / ink 7% | +, who, send |

**Instances.** The rule set dresses all three, over their own older numbers:
- the Dock chat's `.aiRowTop` (EvAsk, `html.askDock`);
- the Top Chat's full-modal `.evSrchFull .evSrchF.evSrchFd`;
- the in-app chat's `.chComposer` (EvChat).

The Top Chat's in-card variant (`.evSrch:not(.evSrchFull)`) stays flat inside its panel.

**Rules.**
- A new place to type uses these tokens, never its own numbers.
- The send fills (light ground, dark arrow) once there are words (`.hasText` / `.on`).
- In the Dock, the field rises with the keys on their curve (.32 s, `cubic-bezier(.2,.8,.2,1)`). The suggestions come after, bottom to top, from 440 ms, 70 ms apart, and the house beam (EvBeam) runs once round the field.

