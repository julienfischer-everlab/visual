/* The chat video stage's checks (visuals/concierge.html, Concierge.stage; docs/chat-video.md): the same time drawn twice is the same frame, a time reached frame by frame is the time
   jumped to, forward and back; the phone and floating, dark and light; a six-item conversation scrolls itself. Serve the repo first (python3 -m http.server <port>), then:
     NODE_PATH=<where playwright is> node tools/stage-check.js [page url] [screenshots dir]
   Exits 1 when a check fails. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL0 = process.argv[2] || 'http://127.0.0.1:9473/visuals/concierge.html#stage';
const SH = process.argv[3] || path.join(require('os').tmpdir(), 'stage-shots');
fs.mkdirSync(SH, { recursive: true });

const SEQ = [
  { id: 'q1', type: 'user', text: 'Can you explain my latest blood results?', typing: 'text' },
  { id: 'a1', type: 'eva', text: 'There are a few markers worth looking at. Your LDL cholesterol is above the optimal range, and your ApoB has crept up since March.', think: 1600, step: 'Looking at your records' },
  { id: 'w1', type: 'widget', widget: 'biomarker' },
  { id: 'q2', type: 'user', text: 'Should I be worried? 😬\nI have a family history.', typing: 'dots', name: 'Julien', avatar: 'JF' },
  { id: 'a2', type: 'eva', text: 'It’s worth acting on, not worrying about. I’ve asked Dr Lu to look at it with you.', think: 1200, reveal: 'stream' },
  { id: 's1', type: 'specialist', specialist: 'steven', text: 'I’d focus first on your cardiovascular risk profile. Let’s retest ApoB this month and talk through the options.', typing: true },
  { id: 'w2', type: 'widget', widget: 'booking' }
];
const COMPS = {
  phoneDark: { v: 1, name: 'Phone, dark', format: { ratio: '9:16' }, background: { kind: 'color', color: '#1b1714' }, device: true, theme: 'dark', sequence: SEQ },
  phoneLight: { v: 1, name: 'Phone, light, 16:9 on a picture', format: { ratio: '16:9' }, background: { kind: 'image', src: 'clinic', fit: 'fill', x: 50, y: 50, blur: 12, overlay: .25, overlayColor: '#000000' }, device: true, theme: 'light', sequence: SEQ },
  floatDark: { v: 1, name: 'Floating, dark, on a picture', format: { ratio: '1:1' }, background: { kind: 'image', src: 'mriRoom', fit: 'crop', x: 40, y: 50, scale: 1.2, blur: 0, overlay: .45, overlayColor: '#000000' }, device: false, theme: 'dark', sequence: SEQ },
  floatLight: { v: 1, name: 'Floating, light', format: { ratio: '4:3' }, background: { kind: 'color', color: '#f4f2ed' }, device: false, theme: 'light', sequence: SEQ }
};
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL0);
  await p.waitForFunction(() => window.Concierge && window.Concierge.stage);
  const cmp = await b.newPage();
  const pxDiff = (A, B) => cmp.evaluate(async ([A, B]) => {   /* how many pixels differ between two screenshots, and by how much at most */
    const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [a, b] = await Promise.all([ld(A), ld(B)]), c = document.createElement('canvas'); c.width = a.width; c.height = a.height; const x = c.getContext('2d');
    x.drawImage(a, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.drawImage(b, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0, mx = 0; for (let i = 0; i < da.length; i += 4){ const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d){ n++; if (d > mx) mx = d; } }
    return { n, mx };
  }, [A.toString('base64'), B.toString('base64')]);
  const S = (fn, ...a) => p.evaluate(([fn, a]) => window.Concierge.stage[fn](...a), [fn, a]);
  const html = () => p.evaluate(() => window.Concierge.stage.node().outerHTML);

  for (const [k, comp] of Object.entries(COMPS)) {
    const info = await S('load', comp);
    ok(info.duration > 20000 && info.items.length === SEQ.length, k + ': loaded, ' + info.duration + ' ms, ' + info.items.length + ' items');
    const T = [0, 1200, 2600, 4200, 9000, 13000, 14600, 17500, 21900, 23500, info.duration];
    for (const t of T) {   /* the same time twice: the same DOM, the same pixels */
      await S('seek', t); const h1 = await html(), s1 = await p.screenshot();
      await S('seek', t); const h2 = await html(), s2 = await p.screenshot();
      if (h1 !== h2 || !s1.equals(s2)) ok(false, k + ': seek(' + t + ') twice differs');
    }
    ok(true, k + ': seek(t) twice gives the same DOM and screenshot at ' + T.length + ' times');
    /* forward and back, and frame by frame against a jump */
    const t0 = 15200; await S('seek', t0); const ref = await html(), refS = await p.screenshot();
    await S('seek', info.duration); await S('seek', 3000); await S('seek', t0);
    const backH = await html() === ref, backB = await p.screenshot(), backS = backB.equals(refS), px = backS ? { n: 0, mx: 0 } : await pxDiff(refS, backB);
    if (!backS){ fs.writeFileSync(path.join(SH, 'fwdback-' + k + '-a.png'), refS); fs.writeFileSync(path.join(SH, 'fwdback-' + k + '-b.png'), backB); }
    /* the DOM must be the same; the pixels the same, or (the compositor re-rasterising a layer it had drawn at another offset) a few pixels a level or two apart: not a visible difference */
    ok(backH && (backS || (px.mx <= 2 && px.n <= 20)), k + ': seek forward then back lands on the same frame' + (backH ? '' : ' (DOM differs)') + (backS ? '' : ' (' + px.n + ' px differ by at most ' + px.mx + ' of 255)'));
    const walked = await p.evaluate(([t0]) => { const s = window.Concierge.stage; for (let t = 0; t <= t0; t += 1000 / 30) s.seek(t); s.seek(t0); return s.node().outerHTML; }, [t0]);
    ok(walked === ref, k + ': every frame from 0 to ' + t0 + ' at 30 fps, then ' + t0 + ', equals jumping to it');
    const ms = await p.evaluate(([d]) => { const s = window.Concierge.stage, a = performance.now(); for (let i = 0; i < 300; i++) s.seek(i * d / 300); return (performance.now() - a) / 300; }, [info.duration]);
    ok(ms < 8, k + ': seek takes ' + ms.toFixed(2) + ' ms');
    /* the scroll: at the end the last item in view, above the composer (phone) or inside the canvas (floating) */
    await S('seek', info.duration);
    const sc = await p.evaluate(() => { const n = window.Concierge.stage.node(), col = n.querySelector('.col'), v = n.querySelector('.thread') || n.querySelector('.stgFlV'), last = col.lastElementChild;
      const m = /(-?[\d.]+)px/.exec(col.style.top || ''), vr = v.getBoundingClientRect(), lr = last.getBoundingClientRect();
      return { off: m ? +m[1] : 0, inView: lr.bottom <= vr.bottom + 1 && lr.top >= vr.top - 1, lb: lr.bottom, vb: vr.bottom }; });
    ok(sc.off < 0 && sc.inView, k + ': the thread scrolled ' + (-sc.off).toFixed(0) + ' px, the last item in view (' + sc.lb.toFixed(0) + ' <= ' + sc.vb.toFixed(0) + ')');
    for (const [nm, t] of [['typing', 1700], ['thinking', 4200], ['answer', 9000], ['dots', 13300], ['specialist', 21900], ['end', info.duration]]) {
      await S('seek', t); await p.screenshot({ path: path.join(SH, 'stage-' + k + '-' + nm + '.png') });
    }
  }
  /* a frame as a picture (the MP4's frames): the composition's size, the same pixels twice, quick enough for 30 a second of video */
  for (const k of ['phoneDark', 'floatLight']) {
    const fi = await S('load', COMPS[k]);
    const fr = await p.evaluate(async ([d]) => { const s = window.Concierge.stage, out = [], a = performance.now();
      for (const t of [d * .3, d * .3, d * .8]) { const c = await s.frame(t, { scale: .5 }); out.push(c.toDataURL()); }
      const c = await s.frame(d * .8, { scale: 1 }); return { same: out[0] === out[1], differ: out[0] !== out[2], w: c.width, h: c.height, ms: (performance.now() - a) / 4, png: out[2] }; }, [fi.duration]);
    fs.writeFileSync(path.join(SH, 'frame-' + k + '.png'), Buffer.from(fr.png.split(',')[1], 'base64'));
    ok(fr.same && fr.differ && fr.w === fi.w && fr.h === fi.h, k + ': frame(t) draws ' + fr.w + ' x ' + fr.h + ', the same pixels twice, in ' + fr.ms.toFixed(0) + ' ms');
  }
  /* the catalogue */
  const w = await S('widgets'), cats = new Set(w.map(x => x.category));
  ok(w.length >= 29 && cats.size === 3, 'widgets(): ' + w.length + ' in ' + [...cats].join(', '));
  const sp = await S('specialists'); ok(sp[0].name === 'Dr Steven Lu' && sp[0].role === 'Preventative Health Doctor' && /^(data:|\.\.\/)/.test(sp[0].avatar), 'specialists(): ' + sp.map(s => s.name).join(', '));
  const all = { v: 1, name: 'Every widget', format: { ratio: '9:16' }, device: false, theme: 'dark', sequence: w.map(x => ({ type: 'widget', widget: x.key, data: x.preset, attach: false })) };
  const ai = await S('load', all); await S('seek', ai.duration);
  const bad = await p.evaluate(() => [...window.Concierge.stage.node().querySelectorAll('.blk')].filter(b => !b.firstElementChild || b.offsetHeight < 16).map(b => b.className + ' ' + b.offsetHeight));
  ok(bad.length === 0, 'every widget draws (' + w.length + ' blocks' + (bad.length ? ', empty: ' + bad.join(', ') : '') + ')');
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? fails + ' failed' : 'all passed', '· screenshots in ' + SH);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
