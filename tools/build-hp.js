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

const page = `<meta charset="utf-8">
<title>Health Profile</title>
<style>
/* the page round the sheet: its ground and the Demo menu, in the viewer's theme (or the one picked in Demo) */
:root { --pg: #f3f1ee; --pgFg: #1d1a17; --ctl: #ffffff; --ctlLine: rgba(0, 0, 0, .1); --ctlFg: #1d1a17; --ctlSub: rgba(29, 26, 23, .6); --ctlOn: #1d1a17; --ctlOnFg: #ffffff; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --pg: #0b0b0b; --pgFg: #ececec; --ctl: #1b1b1d; --ctlLine: rgba(255, 255, 255, .1); --ctlFg: #ececec; --ctlSub: rgba(236, 236, 236, .6); --ctlOn: #ececec; --ctlOnFg: #111111; color-scheme: dark; } }
:root[data-theme="dark"] { --pg: #0b0b0b; --pgFg: #ececec; --ctl: #1b1b1d; --ctlLine: rgba(255, 255, 255, .1); --ctlFg: #ececec; --ctlSub: rgba(236, 236, 236, .6); --ctlOn: #ececec; --ctlOnFg: #111111; color-scheme: dark; }
html, body { height: 100%; }
body { margin: 0; overflow: hidden; background: var(--pg); color: var(--pgFg); font: 14px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
#hp { position: fixed; inset: 0; display: flex; justify-content: center; }
#hp > .arSheet { position: relative; display: flex; flex-direction: column; width: 100%; max-width: 1040px; height: 100%; min-height: 0; overflow: hidden; }
@media (min-width: 1100px) { #hp { padding-block: 24px; } #hp > .arSheet { border-radius: 24px; box-shadow: 0 30px 80px rgba(0, 0, 0, .3); } }
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
@media (min-width: 1100px) { .demo { left: auto; bottom: auto; right: max(12px, calc((100vw - 1040px) / 2 - 56px)); top: 50%; transform: translateY(-50%); }   /* in the gutter beside the sheet */
  .demo > summary { width: 36px; height: 36px; padding: 0; border-radius: 50%; color: var(--ctlFg); font-size: 0; box-shadow: 0 0 0 1px var(--ctlLine), 0 6px 18px rgba(0, 0, 0, .18); } .demo > summary::after { content: "\\22EF"; font-size: 18px; }
  .demo .panel { left: auto; right: 0; bottom: auto; top: 44px; transform: none; } }
</style>
<style>
${arCss}
</style>
<style>
${hpCss}
</style>
<div id="hp"></div>
<details class="demo">
  <summary aria-label="Demo controls">Demo</summary>
  <div class="panel" role="group" aria-label="Demo">
    <p class="h">Demo</p>
    <label>Theme<span class="seg" role="group" aria-label="Theme"><button type="button" data-th="dark">Dark</button><button type="button" data-th="light">Light</button></span></label>
    <label>State<select id="dmState" aria-label="The profile's state"><option value="none">Step 1</option><option value="none_d">Step 1.5 (dropped off)</option><option value="one">Step 2</option><option value="one_d">Step 2.5 (dropped off)</option><option value="two">Step 3</option><option value="two_d">Step 3.5 (dropped off)</option><option value="all">Done</option></select></label>
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
  var paint = function () { if (inst) inst.theme(dark() ? 'dark' : 'light'); [].forEach.call(document.querySelectorAll('.demo [data-th]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-th') === 'dark') === dark())); }); };
  var mount = function () { if (inst) inst.destroy(); host.textContent = ''; inst = HP.mount(host, { theme: dark() ? 'dark' : 'light', name: 'Julien', onClose: function () { if (inst) inst.home(); } }); paint(); };
  var stateOf = function () { var sm = HP.store.summary(), nx = ['wear', 'past', 'you'].filter(function (k) { return sm.st[k] !== 'done'; })[0]; return sm.n === 3 ? 'all' : ['none', 'one', 'two'][sm.n] + (nx && sm.st[nx] === 'prog' ? '_d' : ''); };
  var sel = document.getElementById('dmState');
  sel.addEventListener('change', function () { HP.store.preset(sel.value); mount(); });
  document.getElementById('dmReset').addEventListener('click', function () { HP.store.preset('none'); sel.value = 'none'; mount(); });
  [].forEach.call(document.querySelectorAll('.demo [data-th]'), function (b) { b.addEventListener('click', function () { de.setAttribute('data-theme', b.getAttribute('data-th')); paint(); }); });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  new MutationObserver(paint).observe(de, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('everlab:hp', function () { sel.value = stateOf(); });
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape' || !inst) return; var x = host.querySelector('.arClose'); if (x) { e.preventDefault(); x.click(); } });
  mount(); sel.value = stateOf();
})();
</script>
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'health-profile.html'), page);
console.log('hp    ' + (page.length / 1024).toFixed(0) + ' KB  (dist/health-profile.html, from index.html)');
