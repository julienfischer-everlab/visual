#!/usr/bin/env node
/*
 * Validates ProgressTimeline in a real browser against its layout rules.
 *
 *   NODE_PATH=$(npm root -g) node test/validate.js        (needs playwright)
 *   CHROME=/path/to/chrome NODE_PATH=... node test/validate.js
 *
 * Serves the component folder on a free port, mounts the component in
 * test/fixture.html at many container widths, step counts, progress states
 * and label lengths, measures the rendered geometry, and drives drag,
 * trackpad, touch, keyboard, re-render, resize and reduced-motion cases.
 * Exits 1 on any failure.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const failures = [];
const fail = (where, msg) => { failures.push(where + ': ' + msg); };
let checks = 0;
const ok = (cond, where, msg) => { checks++; if (!cond) fail(where, msg); return cond; };

const SHORT = ['Details', 'Clinic', 'Slot', 'Deposit', 'Questionnaire', 'Fasting', 'Visit', 'Processing', 'Review', 'Results'];
const LONG = ['Confirm your personal details and Medicare number', 'Pick a partner clinic near you',
  'Choose a time slot that suits', 'Pay the refundable deposit', 'Complete the pre-visit questionnaire (about 10 minutes)',
  'Fasting window', 'Attend your visit', 'Sample processing at the lab', 'Specialist review', 'Results ready',
  'Supercalifragilisticexpialidociousmeasurementwindow'];
const steps = (n, long) => Array.from({ length: n }, (_, i) => ({ id: 's' + i, label: (long ? LONG : SHORT)[i % (long ? LONG.length : SHORT.length)] + (i >= 10 ? ' ' + (i + 1) : '') }));

// In-page measurement of the mounted instance.
const MEASURE = () => {
  const r = document.querySelector('.pt'), rr = r.getBoundingClientRect();
  const sc = r.querySelector('.pt-scroller');
  const lis = [...r.querySelectorAll('.pt-step')];
  const dots = lis.map(li => { const d = li.querySelector('.pt-dot').getBoundingClientRect(); return { x: d.left + d.width / 2 - rr.left, y: d.top + d.height / 2 - rr.top, w: d.width, h: d.height }; });
  const labels = lis.map(li => { const l = li.querySelector('.pt-label'), b = l.getBoundingClientRect(), cs = getComputedStyle(l);
    return { l: b.left - rr.left + parseFloat(cs.paddingLeft), r: b.right - rr.left - parseFloat(cs.paddingRight), fs: cs.fontSize, fw: cs.fontWeight }; });
  const conns = lis.slice(0, -1).map(li => { const cs = getComputedStyle(li, '::after'), b = li.getBoundingClientRect();
    return { a: b.left - rr.left + parseFloat(cs.left), b: b.left - rr.left + parseFloat(cs.left) + parseFloat(cs.width), y: b.top - rr.top + parseFloat(cs.top) + parseFloat(cs.height) / 2, disp: cs.display }; });
  const btn = sel => { const b = r.querySelector(sel), q = b.getBoundingClientRect(), cs = getComputedStyle(b);
    return { vis: b.classList.contains('is-visible'), cssVis: cs.visibility, pe: cs.pointerEvents, tab: b.tabIndex, cx: q.left + q.width / 2 - rr.left, cy: q.top + q.height / 2 - rr.top, w: b.offsetWidth, h: b.offsetHeight, td: cs.transitionDuration, tp: cs.transitionProperty }; };
  const fade = sel => { const f = r.querySelector(sel), q = f.getBoundingClientRect(); return { w: q.width, on: f.classList.contains('pt-fade') && getComputedStyle(f).opacity }; };
  const rcs = getComputedStyle(r);
  const cur = r.querySelector('.pt-step.is-current .pt-dot');
  return { W: rr.width, H: rr.height, radius: rcs.borderTopLeftRadius + ' ' + rcs.borderTopRightRadius + ' ' + rcs.borderBottomRightRadius + ' ' + rcs.borderBottomLeftRadius, overflow: rcs.overflow,
    scrollLeft: sc.scrollLeft, scrollMax: sc.scrollWidth - sc.clientWidth, dots, labels, conns,
    bs: btn('.pt-nav--start'), be: btn('.pt-nav--end'), fs: fade('.pt-fade--start'), fe: fade('.pt-fade--end'),
    classes: r.className, mode: r.dataset.mode, state: window.tl.getState(),
    ariaCurrent: [...r.querySelectorAll('[aria-current="step"]')].map(li => lis.indexOf(li)),
    curAnim: cur ? getComputedStyle(cur).animationName : null, curShadow: cur ? getComputedStyle(cur).boxShadow : null };
};

const frames = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))';

function checkGeometry(m, where, cfg) {
  const { W, N, min } = cfg, S = m.state;
  const free = cfg.c === -99, c = free ? S.currentIndex : cfg.c;   // -99: after manual browsing, so no resting-place rules
  const E = Math.min(128, W / 2);                       // 128px edge areas (they meet below 256px)
  const narrow = W - 2 * E < 2 * min;                    // fewer than two minimum increments between them
  ok(Math.abs(S.edge - E) < 0.01, where, 'edge ' + S.edge + ' expected ' + E);
  ok(S.narrow === narrow, where, 'narrow ' + S.narrow + ' expected ' + narrow);
  ok(m.radius === '24px 24px 24px 24px', where, 'radius ' + m.radius);
  ok(m.overflow === 'hidden', where, 'card overflow ' + m.overflow);
  ok(m.scrollLeft >= -0.5 && m.scrollLeft <= Math.max(0, m.scrollMax) + 0.5, where, 'scrollLeft out of range ' + m.scrollLeft + '/' + m.scrollMax);
  if (!free) ok(m.ariaCurrent.length === (c >= 0 && c < N ? 1 : 0) && (c < 0 || c >= N || m.ariaCurrent[0] === c), where, 'aria-current ' + JSON.stringify(m.ariaCurrent));
  m.dots.forEach((d, i) => ok(Math.abs(d.w - 14) < 0.01 && Math.abs(d.h - 14) < 0.01, where, 'dot ' + i + ' is ' + d.w + 'x' + d.h));
  m.labels.forEach((l, i) => ok(l.fs === '14px', where, 'label ' + i + ' font ' + l.fs));
  if (c >= 0 && c < N) {
    ok(+m.labels[c].fw >= 500, where, 'current label weight ' + m.labels[c].fw);
    m.labels.forEach((l, i) => { if (i !== c) ok(+l.fw < +m.labels[c].fw, where, 'label ' + i + ' as heavy as the current'); });
  }
  // connectors: 4px clear of each dot, on the dots' line
  m.conns.forEach((k, i) => {
    ok(Math.abs(k.a - (m.dots[i].x + 7) - 4) < 0.6, where, 'gap after dot ' + i + ' = ' + (k.a - m.dots[i].x - 7).toFixed(2));
    ok(Math.abs((m.dots[i + 1].x - 7) - k.b - 4) < 0.6, where, 'gap before dot ' + (i + 1) + ' = ' + (m.dots[i + 1].x - 7 - k.b).toFixed(2));
    ok(Math.abs(k.y - m.dots[i].y) < 0.6, where, 'connector ' + i + ' off the line');
  });
  const seg = N > 1 ? m.dots[1].x - m.dots[0].x : 0;
  for (let i = 1; i < N; i++) ok(Math.abs(m.dots[i].x - m.dots[i - 1].x - seg) < 0.6, where, 'uneven spacing at ' + i);
  const overflow = S.maxOffset > 0.5;
  const fl = overflow && m.scrollLeft > 0.5, fr = overflow && m.scrollLeft < S.maxOffset - 0.5;
  ok(m.classes.includes('is-overflow-start') === fl, where, 'start fade ' + m.classes.includes('is-overflow-start') + ' vs overflow ' + fl);
  ok(m.classes.includes('is-overflow-end') === fr, where, 'end fade ' + m.classes.includes('is-overflow-end') + ' vs overflow ' + fr);

  // a connector under a button centre (not a dot, not a gap, not bare track)
  const under = cx => m.conns.some(k => cx >= k.a - 0.5 && cx <= k.b + 0.5);
  const e = E;
  ok(Math.abs(m.fs.w - e) < 0.6 && Math.abs(m.fe.w - e) < 0.6, where, 'fade width ' + m.fs.w + '/' + m.fe.w + ' expected ' + e);
  for (const [b, on, cx, nm] of [[m.bs, fl, e / 2, 'start'], [m.be, fr, W - e / 2, 'end']]) {
    ok(Math.abs(b.w - 28) < 0.6 && Math.abs(b.h - 28) < 0.6, where, nm + ' button size');
    ok(Math.abs(b.cx - cx) < 0.6, where, nm + ' button centre x ' + b.cx.toFixed(1) + ' expected ' + cx);
    if (N > 0) ok(Math.abs(b.cy - m.dots[0].y) < 0.6, where, nm + ' button off the line');
    const want = on && under(cx);
    ok(b.vis === want, where, nm + ' button visible=' + b.vis + ' expected ' + want + ' (overflow ' + on + ', connector ' + under(cx) + ')');
    if (!b.vis) ok(b.tab === -1 && b.pe === 'none', where, nm + ' hidden button still focusable/clickable (tab ' + b.tab + ', pe ' + b.pe + ')');
  }
  if (N === 0) return;

  {
    if (N >= 2) ok(seg >= min - 0.5, where, 'segment ' + seg.toFixed(1) + ' below min ' + min);
    const fits = N >= 2 && (N - 1) * min <= W - 2 * E + 1e-6;
    if (N >= 2 && fits) {
      ok(!overflow, where, 'fits but overflows');
      ok(Math.abs(m.dots[0].x - E) < 0.6 && Math.abs(m.dots[N - 1].x - (W - E)) < 0.6, where, 'fit: not spread edge to edge ' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1));
    }
    if (N >= 2 && !fits) ok(Math.abs(seg - min) < 0.6, where, 'overflowing at ' + seg.toFixed(1) + ' instead of the minimum');
    if (N === 1) ok(Math.abs(m.dots[0].x - W / 2) < 0.6, where, 'single step not centred');
    if (N >= 2 && !fits && narrow) {
      // narrow: whichever step is current (the first before starting, the last when done) at 50%
      ok(m.dots[0].x <= W / 2 + 0.6 && m.dots[N - 1].x >= W / 2 - 0.6, where, 'narrow: track ends inside the middle');
      if (!free) { const k = Math.max(0, Math.min(N - 1, c)); ok(Math.abs(m.dots[k].x - W / 2) < 0.6, where, 'narrow: step ' + k + ' at ' + m.dots[k].x.toFixed(1) + ', expected the centre ' + W / 2); }
    }
    if (N >= 2 && !fits && !narrow) {
      ok(m.dots[0].x <= E + 0.6, where, 'empty space before the first dot');
      ok(m.dots[N - 1].x >= W - E - 0.6, where, 'empty space after the last dot');
      if (!free && c <= 0) ok(Math.abs(m.dots[0].x - E) < 0.6, where, 'start: first dot at ' + m.dots[0].x.toFixed(1));
      if (!free && c >= N - 1) ok(Math.abs(m.dots[N - 1].x - (W - E)) < 0.6, where, 'end: last dot at ' + m.dots[N - 1].x.toFixed(1));
      if (!free && c >= 1 && c <= N - 2) {
        const hl = Math.min(seg, 256) / 2 - 8, cur = m.labels[c], nx = m.labels[c + 1], xc = m.dots[c].x;
        if (fl) ok(cur.l >= E - 0.6, where, 'current label under the start fade (' + cur.l.toFixed(1) + ')');
        if (fr) ok(cur.r <= W - E + 0.6, where, 'current label under the end fade (' + cur.r.toFixed(1) + ')');
        const room = W - 2 * E >= seg + 2 * hl - 0.5;
        if (fr && room) ok(nx.r <= W - E + 0.6, where, 'next label under the end fade (' + nx.r.toFixed(1) + ')');
        // otherwise the current dot rests at 40% of the width
        const pinned = !fl || !fr || Math.abs(nx.r - (W - E)) < 0.6 || Math.abs(cur.l - E) < 0.6;
        if (!pinned) ok(Math.abs(xc - 0.4 * W) < 0.6, where, 'current dot at ' + xc.toFixed(1) + ', expected 40% (' + (0.4 * W).toFixed(1) + ')');
        if (Math.abs(xc - 0.4 * W) < 0.6) ok(m.dots[c - 1].x >= -7, where, 'previous step out of sight at 40%');
      }
    }
  }
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errors = [];
  const newPage = async (o) => { const p = await browser.newPage(Object.assign({ viewport: { width: 1700, height: 900 } }, o)); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); await p.goto(base + '/test/fixture.html'); return p; };
  const p = await newPage();
  const mount = async (cfg) => {
    const cur = cfg.c < 0 ? null : cfg.c >= cfg.N ? null : 's' + cfg.c;
    await p.evaluate(([o, w]) => T.mount(o, w), [{ steps: steps(cfg.N, cfg.long), current: cur, complete: cfg.c >= cfg.N, minSegment: cfg.min }, cfg.W]);
    await p.evaluate(frames);
    return p.evaluate(MEASURE);
  };

  // 1. The matrix
  const WIDTHS = [240, 320, 375, 448, 480, 511, 512, 560, 640, 700, 768, 900, 1024, 1280, 1600];
  const COUNTS = [1, 2, 3, 4, 5, 7, 10, 16, 25];
  let mounts = 0;
  for (const min of [128, 96, 160]) {
    for (const W of (min === 128 ? WIDTHS : [320, 448, 520, 640, 1024])) {
      for (const N of COUNTS) {
        const states = [...new Set([-1, 0, 1, Math.floor(N / 2), N - 2, N - 1, N].filter(c => c >= -1 && c <= N))];
        for (const c of states) {
          for (const long of (min === 128 ? [false, true] : [true])) {
            const cfg = { W, N, c, min, long };
            const m = await mount(cfg);
            mounts++;
            checkGeometry(m, `W${W} N${N} c${c} min${min}${long ? ' long' : ''}`, cfg);
          }
        }
      }
    }
  }
  console.log('matrix: ' + mounts + ' mounts');

  // 2. Manual browsing: drag, wheel, keyboard; progress untouched
  {
    const where = 'drag';
    let m = await mount({ W: 900, N: 16, c: 5, min: 128, long: false });
    const before = m.scrollLeft;
    const box = await p.evaluate(() => { const q = document.querySelector('.pt-scroller').getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; });
    const fired = await p.evaluate(() => { let n = 0; document.querySelector('.pt-scroller').addEventListener('click', () => n++); window._n = () => n; return true; });
    await p.mouse.move(box.x + 450, box.y + 30);
    await p.mouse.down();
    for (let i = 1; i <= 10; i++) await p.mouse.move(box.x + 450 - i * 20, box.y + 30);
    await p.mouse.up();
    await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - (before + 200)) < 2, where, 'dragged 200px, scroll moved ' + (m.scrollLeft - before));
    ok(m.ariaCurrent[0] === 5 && m.state.currentIndex === 5, where, 'drag changed the current step');
    ok(m.state.browsed, where, 'drag not recorded as browsing');
    checkGeometry(m, where + ' (after)', { W: 900, N: 16, c: -99, min: 128 });   // c -99: skip the progress-placement rules
    // the click a drag's release makes is swallowed, a plain click isn't
    ok(await p.evaluate(() => window._n()) === 0 && fired, where, 'the drag\'s own click got through');
    await p.mouse.click(box.x + 300, box.y + 30);
    ok(await p.evaluate(() => window._n()) === 1, where, 'plain click right after a drag swallowed');

    // ordinary re-render keeps the position
    const pos = m.scrollLeft;
    await p.evaluate(() => tl.update({ steps: tl.opts.steps.map(s => Object.assign({}, s, { label: s.label + '.' })) }));
    await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - pos) < 1, 're-render', 'position lost: ' + pos + ' -> ' + m.scrollLeft);

    // resize: clamped, and still where it was in step terms when there's room
    await p.evaluate(() => T.resize(700));
    await p.evaluate(frames); await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(m.scrollLeft <= m.state.maxOffset + 0.5, 'resize', 'not clamped ' + m.scrollLeft + ' > ' + m.state.maxOffset);
    ok(Math.abs(m.scrollLeft - Math.min(pos, m.state.maxOffset)) < 1, 'resize', 'position not kept: ' + pos + ' -> ' + m.scrollLeft);
    checkGeometry(m, 'resize 700', { W: 700, N: 16, c: -99, min: 128 });
    await p.evaluate(() => T.resize(1600));
    await p.evaluate(frames); await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(m.scrollLeft <= m.state.maxOffset + 0.5, 'resize', 'not clamped after growing');
    checkGeometry(m, 'resize 1600', { W: 1600, N: 16, c: -99, min: 128 });

    // progress change brings current and next back
    await p.evaluate(() => T.resize(900));
    await p.evaluate(frames); await p.evaluate(frames);
    await p.evaluate(() => tl.setCurrent('s11'));
    await p.waitForTimeout(900);   // the smooth scroll
    m = await p.evaluate(MEASURE);
    ok(!m.state.browsed, 'progress', 'still browsing after a progress change');
    checkGeometry(m, 'progress -> 11', { W: 900, N: 16, c: 11, min: 128 });
    ok(/Step 12 of 16/.test(await p.evaluate(() => document.querySelector('.pt [aria-live]').textContent)), 'progress', 'not announced');
  }
  {
    const where = 'wheel';
    let m = await mount({ W: 900, N: 16, c: 0, min: 128, long: false });
    const box = await p.evaluate(() => { const q = document.querySelector('.pt-scroller').getBoundingClientRect(); return { x: q.left, y: q.top }; });
    await p.mouse.move(box.x + 400, box.y + 30);
    await p.mouse.wheel(180, 0);
    await p.waitForTimeout(400);
    m = await p.evaluate(MEASURE);
    ok(m.scrollLeft > 100, where, 'trackpad scroll did not move: ' + m.scrollLeft);
    ok(m.state.browsed && m.ariaCurrent[0] === 0, where, 'browsing state');
    ok(m.classes.includes('is-overflow-start'), where, 'start fade not shown after scrolling');
    checkGeometry(m, where + ' (after)', { W: 900, N: 16, c: -99, min: 128 });
  }
  {
    const where = 'keyboard';
    let m = await mount({ W: 900, N: 16, c: 3, min: 128, long: false });
    await p.evaluate(() => { const b = document.createElement('button'); b.id = 'before'; b.textContent = 'before'; document.body.prepend(b); b.focus(); });
    const order = [];
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => { const a = document.activeElement; return a.id || a.className; })); }
    m = await p.evaluate(MEASURE);
    const expect = ['pt-scroller'].concat(m.bs.vis ? ['pt-nav pt-nav--start is-visible'] : []).concat(m.be.vis ? ['pt-nav pt-nav--end is-visible'] : []);
    ok(JSON.stringify(order.slice(0, expect.length)) === JSON.stringify(expect), where, 'tab order ' + JSON.stringify(order) + ' expected to start ' + JSON.stringify(expect));
    await p.evaluate(() => document.querySelector('.pt-scroller').focus());
    const s0 = m.scrollLeft;
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - Math.min(s0 + 128, m.state.maxOffset)) < 1.5, where, 'ArrowRight moved ' + (m.scrollLeft - s0));
    await p.keyboard.press('End'); await p.waitForTimeout(700);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - m.state.maxOffset) < 1, where, 'End');
    ok(m.ariaCurrent[0] === 3, where, 'keyboard browsing changed progress');
    await p.keyboard.press('Home'); await p.waitForTimeout(700);
    m = await p.evaluate(MEASURE);
    ok(m.scrollLeft < 1, where, 'Home');
    // a visible button: Enter fires the callback; a hidden one can't be clicked
    await p.evaluate(() => tl.scrollToCurrent());
    await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    if (ok(m.be.vis, where, 'end button expected visible at c3/N16/W900')) {
      const s0 = m.scrollLeft;
      await p.evaluate(() => document.querySelector('.pt-nav--end').focus());
      await p.keyboard.press('Enter');
      await p.waitForTimeout(700);
      const ev = await p.evaluate(() => T.events.slice());
      const s1 = await p.evaluate(() => document.querySelector('.pt-scroller').scrollLeft);
      ok(ev.length === 1 && ev[0].direction === 'end' && ev[0].currentIndex === 3, where, 'arrow callback ' + JSON.stringify(ev.map(e => e.direction)));
      ok(Math.abs(s1 - Math.min(s0 + 128, m.state.maxOffset)) < 1.5, where, 'Enter on the arrow moved ' + (s1 - s0));
    }
    if (!m.bs.vis) {
      const r = await p.evaluate(() => { const q = document.querySelector('.pt').getBoundingClientRect(); return [q.left, q.top]; });
      const n0 = await p.evaluate(() => T.events.length);
      await p.mouse.click(r[0] + m.bs.cx, r[1] + m.bs.cy);
      ok(await p.evaluate(() => T.events.length) === n0, where, 'hidden start button took a click');
    }
    await p.evaluate(() => document.getElementById('before').remove());
  }
  {
    const where = 'motion';
    let m = await mount({ W: 900, N: 8, c: 3, min: 128, long: false });
    ok(m.curAnim === 'pt-ripple', where, 'no ripple: ' + m.curAnim);
    ok(/180ms|0\.18s/.test(m.bs.td) && /opacity/.test(m.bs.tp) && /transform/.test(m.bs.tp), where, 'button transition ' + m.bs.tp + ' ' + m.bs.td);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    m = await p.evaluate(MEASURE);
    ok(m.curAnim === 'none' && m.curShadow !== 'none', where, 'reduced motion: ' + m.curAnim + ' / ' + m.curShadow);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
  }
  {
    // touch swipe on a touch device
    const where = 'touch';
    const tp = await newPage({ hasTouch: true, isMobile: true, viewport: { width: 420, height: 800 } });
    await tp.evaluate(([o, w]) => T.mount(o, w), [{ steps: steps(10, false), current: 's0' }, 380]);
    await tp.evaluate(frames);
    let m = await tp.evaluate(MEASURE);
    ok(m.state.narrow && m.state.segment === 128 && !m.state.fit, where, 'narrow: expected the full timeline at the minimum segment');
    const box = await tp.evaluate(() => { const q = document.querySelector('.pt-scroller').getBoundingClientRect(); return { x: q.left, y: q.top }; });
    const cdp = await tp.context().newCDPSession(tp);
    const X = Math.round(box.x + 300), Y = Math.round(box.y + 30);   // a finger swiping left
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X, y: Y }] });
    for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X - i * 18, y: Y }] }); await tp.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await tp.waitForTimeout(700);
    m = await tp.evaluate(MEASURE);
    ok(m.scrollLeft > 100, where, 'swipe did not scroll: ' + m.scrollLeft);
    ok(m.state.browsed && m.ariaCurrent[0] === 0, where, 'swipe browsing state');
    checkGeometry(m, where + ' (after)', { W: 380, N: 10, c: -99, min: 128 });
    await tp.close();
  }
  {
    // arrows: one actual segment per click, smooth, clamped; quick clicks add up
    const where = 'arrows';
    let m = await mount({ W: 900, N: 16, c: 3, min: 128, long: false });
    const r = await p.evaluate(() => { const q = document.querySelector('.pt').getBoundingClientRect(); return [q.left, q.top]; });
    const s0 = m.scrollLeft;
    ok(m.be.vis, where, 'end arrow hidden at rest');
    await p.mouse.click(r[0] + m.be.cx, r[1] + m.be.cy);
    await p.waitForTimeout(80);
    const mid = await p.evaluate(() => document.querySelector('.pt-scroller').scrollLeft);
    await p.waitForTimeout(700);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - (s0 + 128)) < 1.5, where, 'one click moved ' + (m.scrollLeft - s0));
    ok(mid > s0 + 1 && mid < s0 + 127, where, 'not smooth (after 80ms: ' + (mid - s0).toFixed(1) + ')');
    ok(m.ariaCurrent[0] === 3 && m.state.browsed, where, 'arrow changed progress or was not browsing');
    checkGeometry(m, where + ' (after one)', { W: 900, N: 16, c: -99, min: 128 });
    const s1 = m.scrollLeft;
    for (let i = 0; i < 3; i++) { await p.mouse.click(r[0] + m.be.cx, r[1] + m.be.cy); await p.waitForTimeout(60); }
    await p.waitForTimeout(900);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - Math.min(s1 + 384, m.state.maxOffset)) < 1.5, where, 'three quick clicks moved ' + (m.scrollLeft - s1));
    for (let i = 0; i < 20 && m.be.vis; i++) { await p.mouse.click(r[0] + m.be.cx, r[1] + m.be.cy); await p.waitForTimeout(500); m = await p.evaluate(MEASURE); }
    ok(Math.abs(m.scrollLeft - m.state.maxOffset) < 1, where, 'never reached the end: ' + m.scrollLeft + '/' + m.state.maxOffset);
    ok(!m.be.vis && !m.classes.includes('is-overflow-end'), where, 'end arrow/fade still on at the end');
    await p.mouse.click(r[0] + m.bs.cx, r[1] + m.bs.cy);
    await p.waitForTimeout(700);
    const back = await p.evaluate(() => document.querySelector('.pt-scroller').scrollLeft);
    ok(Math.abs(back - (m.state.maxOffset - 128)) < 1.5, where, 'start arrow moved ' + (back - m.state.maxOffset));
    // reduced motion: instant
    await p.emulateMedia({ reducedMotion: 'reduce' });
    m = await p.evaluate(MEASURE);
    const b0 = m.scrollLeft;
    await p.mouse.click(r[0] + m.bs.cx, r[1] + m.bs.cy);
    await p.waitForTimeout(30);
    ok(Math.abs(await p.evaluate(() => document.querySelector('.pt-scroller').scrollLeft) - Math.max(0, b0 - 128)) < 1.5, where, 'reduced motion: arrow not instant');
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    // narrow: arrows still a segment, current state untouched
    m = await mount({ W: 340, N: 8, c: 0, min: 128, long: false });
    const r2 = await p.evaluate(() => { const q = document.querySelector('.pt').getBoundingClientRect(); return [q.left, q.top]; });
    if (ok(m.be.vis, where, 'narrow: end arrow hidden at the first step')) {
      await p.mouse.click(r2[0] + m.be.cx, r2[1] + m.be.cy);
      await p.waitForTimeout(700);
      m = await p.evaluate(MEASURE);
      ok(Math.abs(m.scrollLeft - 128) < 1.5 && m.ariaCurrent[0] === 0, where, 'narrow arrow moved ' + m.scrollLeft);
    }
  }
  {
    // the component follows its parent's width with no page resize
    const where = 'container';
    await mount({ W: 1024, N: 10, c: 4, min: 128, long: false });
    for (const w of [1024, 800, 600, 512, 511, 400, 300, 260, 700]) {
      await p.evaluate(w => T.resize(w), w);
      await p.evaluate(frames); await p.evaluate(frames);
      const m = await p.evaluate(MEASURE);
      ok(Math.abs(m.W - w) < 0.6, where, 'width ' + m.W + ' expected ' + w);
      checkGeometry(m, where + ' ' + w, { W: w, N: 10, c: 4, min: 128 });
    }
  }

  ok(errors.length === 0, 'page', 'errors: ' + errors.join(' | '));
  await browser.close();
  server.close();
  console.log(checks + ' checks, ' + failures.length + ' failed');
  if (failures.length) {
    const seen = new Map();
    for (const f of failures) { const k = f.replace(/^[^:]+: /, '').replace(/[\d.-]+/g, '#'); seen.set(k, (seen.get(k) || []).concat(f)); }
    for (const [, list] of seen) console.log('  ' + list[0] + (list.length > 1 ? '  (+' + (list.length - 1) + ' similar)' : ''));
    process.exit(1);
  }
})().catch(e => { console.error(e); server.close(); process.exit(1); });
