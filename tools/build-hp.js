// The Health profile on its own: dist/health-profile.html, made from the
// same source as the prototype on every build, so a change to the flow
// there is a change here too ("an independent artifact that only includes
// the Health profile flow; all changes on this artifact should impact the
// other"). It takes, by what they hold rather than where they sit:
//   - the report sheet's styles (the <style> with the --ar- tokens),
//   - the Health profile's own styles (the <style> with .arSheet.hpSheet),
//   - the Health profile's script (the <script> that sets window.HealthProfile),
// and puts them in a page of their own: the sheet full screen (a column
// up to 1040 on a wide screen), and a small Demo menu for the theme, the
// state and starting over.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const blocks = (tag) => [...src.matchAll(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)</' + tag + '>', 'g'))].map(m => m[1]);
const pick = (list, test, what) => {
  const found = list.filter(test);
  if (found.length !== 1) throw new Error('build-hp: expected one ' + what + ', found ' + found.length);
  return found[0];
};
const arCss = pick(blocks('style'), b => b.includes('--ar-paper:') && b.includes('.arSheet .arStage'), 'report sheet style block');
const hpCss = pick(blocks('style'), b => b.includes('.arSheet.hpSheet') && !b.includes('--ar-paper:'), 'Health profile style block');
const hpJs = pick(blocks('script'), b => b.includes('window.HealthProfile = {'), 'Health profile script');
const bar = (src.match(/<div id="bpFrame"[^>]*>\s*<div class="bpStatus">([\s\S]*?)<\/div>/) || [])[1];   // the device's status bar (time, island, signal), as the prototype draws it
if (!bar) throw new Error('build-hp: the device status bar (#bpFrame .bpStatus) not found');

const page = `<meta charset="utf-8">
<title>Health Profile</title>
<style>
/* the page round the sheet: its ground and the Demo menu, in the viewer's theme (or the one picked in Demo) */
:root { --pg: #f3f1ee; --pgFg: #1d1a17; --ctl: #ffffff; --ctlLine: rgba(0, 0, 0, .1); --ctlFg: #1d1a17; --ctlSub: rgba(29, 26, 23, .6); --ctlOn: #1d1a17; --ctlOnFg: #ffffff; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --pg: #0b0b0b; --pgFg: #ececec; --ctl: #1b1b1d; --ctlLine: rgba(255, 255, 255, .1); --ctlFg: #ececec; --ctlSub: rgba(236, 236, 236, .6); --ctlOn: #ececec; --ctlOnFg: #111111; color-scheme: dark; } }
:root[data-theme="dark"] { --pg: #0b0b0b; --pgFg: #ececec; --ctl: #1b1b1d; --ctlLine: rgba(255, 255, 255, .1); --ctlFg: #ececec; --ctlSub: rgba(236, 236, 236, .6); --ctlOn: #ececec; --ctlOnFg: #111111; color-scheme: dark; }
html, body { height: 100%; }
body { margin: 0; overflow: hidden; background: var(--pg); color: var(--pgFg); font: 14px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
/* the stage, the device on it, the sheet in the device. Viewport (Demo), as the prototype's: Auto, the window (a column up to 1040 on a wide one); XS the reference phone, 393 with 56 corners, a black bezel in a steel rim and its status bar drawn over the sheet; S the tablet, 600 with 28 corners and a wider bezel; M 992 and L 1440 wide, unframed */
#stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
#dev { position: relative; width: 100%; max-width: 1040px; height: 100%; overflow: hidden; }
#hp { position: absolute; inset: 0; display: flex; }
#hp > .arSheet { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; overflow: hidden; }
.bpStatus { display: none; }
@media (min-width: 1100px) { #stage[data-bp="auto"] #dev { height: calc(100% - 48px); border-radius: 24px; box-shadow: 0 30px 80px rgba(0, 0, 0, .3); } }
#stage[data-bp="xs"] #dev { width: 393px; max-width: none; height: calc(100% - 96px); max-height: 900px; border-radius: 56px; box-shadow: 0 0 0 5px #000, 0 0 0 11px #3b3b40, 0 0 0 12px rgba(255, 255, 255, .14); }   /* the prototype's XS frame (--evPhBz), no drop shadow ("the SAME iPhone frame all the time, meaning NO shadow") */
#stage[data-bp="s"] #dev { width: 600px; max-width: calc(100% - 64px); height: calc(100% - 96px); border-radius: 28px; box-shadow: 0 0 0 9px #000, 0 0 0 16px #3b3b40, 0 0 0 17px rgba(255, 255, 255, .14); }
#stage[data-bp="m"] #dev { width: 992px; max-width: 100%; }
#stage[data-bp="l"] #dev { width: 1440px; max-width: 100%; }
#stage:is([data-bp="xs"], [data-bp="s"]) .bpStatus { position: absolute; left: 0; right: 0; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 18px 34px 4px; color: #fff; pointer-events: none; }
.bpStatus .tm { font-size: 15px; font-weight: 600; letter-spacing: .02em; }
.bpStatus .isl { position: absolute; left: 50%; top: 13px; width: 96px; height: 27px; transform: translateX(-50%); border: 1px solid #1a1a19; border-radius: 16px; background: #000; }
#stage[data-bp="s"] .bpStatus { padding: 10px 22px 0; } #stage[data-bp="s"] .bpStatus .tm { font-size: 12px; } #stage[data-bp="s"] .bpStatus .isl { display: none; } #stage[data-bp="s"] .bpStatus svg { transform: scale(.8); }
#stage.lt .bpStatus { color: #000; } #stage.lt .bpStatus svg { filter: invert(1); }
#stage[data-bp="xs"] .arSheet { --ar-head-top: 58px; } #stage[data-bp="s"] .arSheet { --ar-head-top: 44px; }   /* the sheet's bar clear of the status bar, as in the prototype's device */
/* the Demo menu: on a phone a small pill in the room under the sheet's button, opening upward; on a wide screen a round button in the gutter beside the sheet */
.demo { position: fixed; z-index: 100; left: 50%; bottom: calc(4px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.demo > summary { list-style: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 20px; padding: 0 10px; border-radius: 999px; background: var(--ctl); color: var(--ctlSub); box-shadow: 0 0 0 1px var(--ctlLine); cursor: pointer; font-size: 11px; line-height: 1; letter-spacing: .04em; }
.demo > summary::-webkit-details-marker { display: none; }
.demo > summary:focus-visible, .demo button:focus-visible, .demo select:focus-visible { outline: 2px solid #4b7bec; outline-offset: 2px; }
.demo[open] > summary { background: var(--ctlOn); color: var(--ctlOnFg); }
.demo .panel { position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 12px; width: 240px; padding: 14px; border-radius: 14px; background: var(--ctl); color: var(--ctlFg); box-shadow: 0 0 0 1px var(--ctlLine), 0 18px 50px rgba(0, 0, 0, .25); }
.demo .h { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ctlSub); }
.demo label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--ctlSub); }
.demo .seg { display: flex; gap: 4px; padding: 3px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--ctlLine); }
.demo .seg button, .demo .go { flex: 1; height: 32px; border: 0; border-radius: 8px; background: none; color: var(--ctlFg); font: inherit; font-size: 13px; cursor: pointer; }
.demo .seg button[aria-pressed="true"] { background: var(--ctlOn); color: var(--ctlOnFg); }
.demo select { height: 34px; padding: 0 8px; border: 0; border-radius: 8px; background: var(--pg); color: var(--ctlFg); box-shadow: inset 0 0 0 1px var(--ctlLine); font: inherit; font-size: 13px; }
.demo .go { flex: none; box-shadow: inset 0 0 0 1px var(--ctlLine); }
/* beside the screen when there is room for it: the gutter of a wide Auto, or 28 right of a framed phone or tablet; its panel opening down and inward */
.demo.side { bottom: auto; top: 50%; transform: translateY(-50%); }
.demo.side > summary { width: 36px; height: 36px; padding: 0; border-radius: 50%; color: var(--ctlFg); font-size: 0; box-shadow: 0 0 0 1px var(--ctlLine), 0 6px 18px rgba(0, 0, 0, .18); } .demo.side > summary::after { content: "\\22EF"; font-size: 18px; }
.demo.side .panel { left: auto; right: 0; bottom: auto; top: 44px; transform: none; }
</style>
<style>
${arCss}
</style>
<style>
${hpCss}
</style>
<div id="stage" data-bp="auto"><div id="dev"><div id="hp"></div><div class="bpStatus" aria-hidden="true">${bar}</div></div></div>
<details class="demo">
  <summary aria-label="Demo controls">Demo</summary>
  <div class="panel" role="group" aria-label="Demo">
    <p class="h">Demo</p>
    <label>Viewport<span class="seg" role="group" aria-label="Viewport"><button type="button" data-bp="auto">Auto</button><button type="button" data-bp="xs">XS</button><button type="button" data-bp="s">S</button><button type="button" data-bp="m">M</button><button type="button" data-bp="l">L</button></span></label>
    <label>Theme<span class="seg" role="group" aria-label="Theme"><button type="button" data-th="dark">Dark</button><button type="button" data-th="light">Light</button></span></label>
    <label>State<select id="dmState" aria-label="The profile's state"><option value="none">Step 1</option><option value="one">Step 2</option><option value="two">Step 3</option><option value="two_d">Step 3.5 (dropped off)</option><option value="all">Done</option></select></label>
    <label>Step title<span class="seg" role="group" aria-label="Step title: the step's name over the dashes, or the dashes alone"><button type="button" data-stt="on">On</button><button type="button" data-stt="off">Off</button></span></label>
    <button type="button" class="go" id="dmReset">Start over</button>
  </div>
</details>
<script>
${hpJs}
</script>
<script>
/* the page: the profile's sheet full screen, from its intro; X at the intro does nothing more here (there is no page under it) */
(function () {
  var HP = window.HealthProfile, host = document.getElementById('hp'), de = document.documentElement, inst = null;
  var dark = function () { var t = de.getAttribute('data-theme'); return t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); };
  var stage = document.getElementById('stage'), dev = document.getElementById('dev'), demo = document.querySelector('.demo'), KEY = 'everlab.hp.bp';
  var paint = function () { if (inst) inst.theme(dark() ? 'dark' : 'light'); stage.classList.toggle('lt', !dark()); [].forEach.call(document.querySelectorAll('.demo [data-th]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-th') === 'dark') === dark())); }); };
  /* the Demo button beside the screen when it fits (28 right of the device, or in a wide Auto's gutter); else the pill under the sheet's button */
  var place = function () { var r = dev.getBoundingClientRect(), x = r.right + 28; demo.classList.toggle('side', x + 36 + 12 <= innerWidth); if (demo.classList.contains('side')) { demo.style.left = Math.round(x) + 'px'; } else demo.style.left = ''; };
  var setBp = function (b) { stage.setAttribute('data-bp', b); [].forEach.call(document.querySelectorAll('.demo [data-bp]'), function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-bp') === b)); }); try { localStorage.setItem(KEY, b); } catch (e) {} requestAnimationFrame(place); };
  var mount = function () { if (inst) inst.destroy(); host.textContent = ''; inst = HP.mount(host, { theme: dark() ? 'dark' : 'light', name: 'Julien', onClose: function () { if (inst) inst.home(); } }); paint(); };
  var stateOf = function () { var sm = HP.store.summary(), nx = ['wear', 'past', 'you'].filter(function (k) { return sm.st[k] !== 'done'; })[0]; return sm.n === 3 ? 'all' : ['none', 'one', 'two'][sm.n] + (nx === 'you' && sm.st.you === 'prog' ? '_d' : ''); };   // only step 3 has a dropped-off state
  var sel = document.getElementById('dmState');
  sel.addEventListener('change', function () { HP.store.preset(sel.value); mount(); });
  document.getElementById('dmReset').addEventListener('click', function () { HP.store.preset('none'); sel.value = 'none'; mount(); });
  [].forEach.call(document.querySelectorAll('.demo [data-th]'), function (b) { b.addEventListener('click', function () { de.setAttribute('data-theme', b.getAttribute('data-th')); paint(); }); });
  [].forEach.call(document.querySelectorAll('.demo [data-bp]'), function (b) { b.addEventListener('click', function () { setBp(b.getAttribute('data-bp')); }); });
  var setStt = function (v) { HP.stepTitle(v); [].forEach.call(document.querySelectorAll('.demo [data-stt]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-stt') === v)); }); try { localStorage.setItem(KEY + '.steptitle', v); } catch (e) {} };
  [].forEach.call(document.querySelectorAll('.demo [data-stt]'), function (b) { b.addEventListener('click', function () { setStt(b.getAttribute('data-stt')); }); });
  { var sk = null; try { sk = localStorage.getItem(KEY + '.steptitle'); } catch (e) {} setStt(sk === 'on' ? 'on' : 'off'); }
  addEventListener('resize', place);
  { var kept = null; try { kept = localStorage.getItem(KEY); } catch (e) {} setBp(/^(auto|xs|s|m|l)$/.test(kept || '') ? kept : innerWidth >= 560 ? 'xs' : 'auto'); }   /* XS to start where the phone fits, as the prototype opens; a phone itself, Auto; the last picked after */
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  new MutationObserver(paint).observe(de, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('everlab:hp', function () { sel.value = stateOf(); });
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape' || !inst) return; var x = host.querySelector('.arClose'); if (x) { e.preventDefault(); x.click(); } });
  mount(); sel.value = stateOf();
})();
</script>
`;

// the pictures it names (assets/…), inlined as the prototype's build does: the page is published alone, so a path would lead nowhere
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm' };
let pics = 0;
const out = page.replace(/assets\/[A-Za-z0-9_\-./]+?\.(webp|png|jpe?g|gif|svg|mp4|webm)\b/g, ref => { const f = path.join(root, ref); if (!fs.existsSync(f)){ console.warn('build-hp: missing asset, left as a path: ' + ref); return ref; } pics++; return 'data:' + MIME[ref.split('.').pop().toLowerCase()] + ';base64,' + fs.readFileSync(f).toString('base64'); });
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'health-profile.html'), out);
console.log('hp    ' + (out.length / 1024).toFixed(0) + ' KB  (' + pics + ' pictures inlined, dist/health-profile.html, from index.html)');
