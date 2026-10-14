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
  const cap = r.querySelector('.pt-caption'), capB = cap.getBoundingClientRect();
  const lab0 = r.querySelector('.pt-label'), labB = lab0 ? lab0.getBoundingClientRect() : null;
  return { W: rr.width, H: rr.height, radius: rcs.borderTopLeftRadius + ' ' + rcs.borderTopRightRadius + ' ' + rcs.borderBottomRightRadius + ' ' + rcs.borderBottomLeftRadius, overflow: rcs.overflow,
    scrollLeft: sc.scrollLeft, scrollMax: sc.scrollWidth - sc.clientWidth, dots, labels, conns,
    bs: btn('.pt-nav--start'), be: btn('.pt-nav--end'), fs: fade('.pt-fade--start'), fe: fade('.pt-fade--end'),
    classes: r.className, mode: r.dataset.mode, state: window.tl.getState(),
    ariaCurrent: [...r.querySelectorAll('[aria-current="step"]')].map(li => lis.indexOf(li)),
    curAnim: cur ? getComputedStyle(cur).animationName : null, curShadow: cur ? getComputedStyle(cur).boxShadow : null,
    caption: { shown: getComputedStyle(cap).display !== 'none' && capB.height > 0, text: cap.textContent, info: !!cap.querySelector('.pt-info'), top: capB.top - rr.top, bottom: capB.bottom - rr.top },
    labelBox: labB ? { w: labB.width, h: labB.height } : null, labelText: lab0 ? lab0.textContent : '' };
};

const frames = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))';

function checkGeometry(m, where, cfg) {
  const { W, N, min } = cfg, S = m.state;
  const free = cfg.c === -99, c = free ? S.currentIndex : cfg.c;   // -99: after manual browsing, so no resting-place rules
  const E = Math.min(128, W / 2);                       // 128px edge areas (they meet below 256px)
  const narrow = W - 2 * E < 2 * min;                    // fewer than two minimum increments between them
  const fitsWide0 = N >= 2 && (N - 1) * min <= W - 2 * E + 1e-6, fitsNarrow0 = N >= 2 && !fitsWide0 && narrow && N * Math.min(min, 256) <= W + 1e-6;
  // narrow and scrolling, inside a 64px safe area each side: labelled while three minimum
  // columns fit across it (five 64s in 320px), compact (no labels) below that
  const CE = Math.min(64, W / 4), CU = W - 2 * CE, CM = Math.min(min, Math.max(38, CU / 2)), colM = Math.min(min, 256);
  const narrowScroll = narrow && N >= 2 && !fitsWide0 && !fitsNarrow0;
  const compact = narrowScroll && 3 * colM > CU + 1e-6, narrowL = narrowScroll && !compact;
  const Ee = narrowScroll ? CE : E;
  ok(Math.abs(S.edge - Ee) < 0.01, where, 'edge ' + S.edge + ' expected ' + Ee);
  ok(S.narrow === narrow, where, 'narrow ' + S.narrow + ' expected ' + narrow);
  ok(S.compact === compact && m.classes.includes('is-compact') === compact, where, 'compact ' + S.compact + ' expected ' + compact);
  // compact: the labels gone from sight (still read out), one caption naming the next step
  if (compact) ok(m.labelBox && m.labelBox.w <= 1.01 && m.labelBox.h <= 1.01 && /^Step 1 of /.test(m.labelText), where, 'compact: label still showing ' + JSON.stringify(m.labelBox));
  else if (N >= 1) ok(m.labelBox && m.labelBox.h >= 19, where, 'label hidden outside compact');
  if (!free) {
    const nx = c < 0 ? 0 : c < N - 1 ? c + 1 : -1;
    const want = compact && nx >= 0 ? 'Up next \u2013 ' + cfg.labels[nx] : null;
    ok(m.caption.shown === !!want && (!want || m.caption.text === want), where, 'caption ' + (m.caption.shown ? JSON.stringify(m.caption.text) : 'hidden') + ', expected ' + (want ? JSON.stringify(want) : 'hidden'));
    if (want) ok(m.caption.top >= m.dots[0].y + 7 + 12 - 0.6 && m.caption.bottom <= m.H + 0.6, where, 'caption placement ' + m.caption.top.toFixed(1) + '..' + m.caption.bottom.toFixed(1));
  }
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

  // the timeline under an arrow's centre: its line, dots or label columns (not bare track past the ends)
  const colW = compact ? 14 : Math.min(seg, 256);
  const under = cx => N >= 2 && cx >= m.dots[0].x - colW / 2 - 0.5 && cx <= m.dots[N - 1].x + colW / 2 + 0.5;
  const e = Ee;
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
    if (N >= 2 && !compact) ok(seg >= min - 0.5, where, 'segment ' + seg.toFixed(1) + ' below min ' + min);
    if (compact) {
      // three dots across the safe area (previous, current, next) as far as the minimum allows; fits: spread across it
      const fitsC = (N - 1) * CM <= CU + 1e-6;
      if (fitsC) {
        ok(S.maxOffset <= 0.5, where, 'compact fit but overflows');
        ok(Math.abs(m.dots[0].x - CE) < 0.6 && Math.abs(m.dots[N - 1].x - (W - CE)) < 0.6, where, 'compact fit: not across the safe area ' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1));
      } else {
        ok(Math.abs(seg - CM) < 0.6, where, 'compact segment ' + seg.toFixed(1) + ' expected ' + CM.toFixed(1));
        ok(seg <= min + 0.5, where, 'compact segment above the minimum');
        ok(m.dots[0].x <= CE + 0.6 && m.dots[N - 1].x >= W - CE - 0.6, where, 'compact: blank space past an end (' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1) + ')');
        if (!free) {
          const k = Math.max(0, Math.min(N - 1, c)), x = m.dots[k].x;
          const atStart = Math.abs(m.dots[0].x - CE) < 0.6, atEnd = Math.abs(m.dots[N - 1].x - (W - CE)) < 0.6;
          ok(Math.abs(x - W / 2) < 0.6 || (atStart && x < W / 2) || (atEnd && x > W / 2), where, 'compact: step ' + k + ' at ' + x.toFixed(1) + ', expected the centre ' + W / 2 + ' unless clamped at an end');
          if (Math.abs(x - W / 2) < 0.6 && CM * 2 <= CU + 0.6 && k > 0 && k < N - 1) ok(m.dots[k - 1].x >= CE - 0.6 && m.dots[k + 1].x <= W - CE + 0.6, where, 'compact: a neighbour outside the safe area');
        }
      }
    }
    const fitsWide = N >= 2 && (N - 1) * min <= W - 2 * E + 1e-6;
    const fitsNarrow = N >= 2 && !fitsWide && narrow && N * Math.min(min, 256) <= W + 1e-6;   // narrow: every column fits, so they stretch across the card
    const fits = fitsWide || fitsNarrow;
    if (fitsWide) {
      ok(!overflow, where, 'fits but overflows');
      ok(Math.abs(m.dots[0].x - E) < 0.6 && Math.abs(m.dots[N - 1].x - (W - E)) < 0.6, where, 'fit: not spread edge to edge ' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1));
    }
    if (fitsNarrow) {
      ok(!overflow, where, 'narrow fit but overflows');
      ok(Math.abs(m.dots[0].x - W / N / 2) < 0.6 && Math.abs(m.dots[N - 1].x - (W - W / N / 2)) < 0.6, where, 'narrow fit: columns not filling the card ' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1));
    }
    if (N >= 2 && !fits && !compact) ok(Math.abs(seg - min) < 0.6, where, 'overflowing at ' + seg.toFixed(1) + ' instead of the minimum');
    if (narrowL) {
      // labelled narrow: the current step at 50% as far as the track allows, previous and next clear of the fades
      ok(S.maxOffset > 0.5, where, 'labelled narrow but nothing to scroll');
      ok(m.dots[0].x <= CE + 0.6 && m.dots[N - 1].x >= W - CE - 0.6, where, 'narrow: blank space past an end (' + m.dots[0].x.toFixed(1) + '..' + m.dots[N - 1].x.toFixed(1) + ')');
      if (!free) {
        const k = Math.max(0, Math.min(N - 1, c)), x = m.dots[k].x;
        const atStart = Math.abs(m.dots[0].x - CE) < 0.6, atEnd = Math.abs(m.dots[N - 1].x - (W - CE)) < 0.6;
        ok(Math.abs(x - W / 2) < 0.6 || (atStart && x < W / 2) || (atEnd && x > W / 2), where, 'narrow: step ' + k + ' at ' + x.toFixed(1) + ', expected the centre ' + W / 2 + ' unless clamped at an end');
        const lo = Math.max(0, k - 1), hi = Math.min(N - 1, k + 1);
        if (Math.abs(x - W / 2) < 0.6) ok((!fl || m.labels[lo].l >= CE - 0.6) && (!fr || m.labels[hi].r <= W - CE + 0.6), where, 'narrow: a neighbour\'s label under a fade (' + m.labels[lo].l.toFixed(1) + '..' + m.labels[hi].r.toFixed(1) + ')');
        ok((!fl || m.labels[k].l >= CE - 0.6) && (!fr || m.labels[k].r <= W - CE + 0.6), where, 'narrow: the current label under a fade');
      }
    }
    if (N >= 2 && fitsNarrow) ok(seg >= min - 0.5, where, 'narrow fit below the minimum');
    if (N === 1) ok(Math.abs(m.dots[0].x - W / 2) < 0.6, where, 'single step not centred');
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
  for (const min of [128, 96, 160, 64]) {
    for (const W of (min === 128 ? WIDTHS : min === 64 ? [240, 300, 319, 320, 352, 383, 384, 448, 640] : min === 96 ? [320, 410, 416, 440, 448, 520, 640, 1024] : [320, 448, 520, 640, 1024])) {
      for (const N of COUNTS) {
        const states = [...new Set([-1, 0, 1, Math.floor(N / 2), N - 2, N - 1, N].filter(c => c >= -1 && c <= N))];
        for (const c of states) {
          for (const long of (min === 128 ? [false, true] : [true])) {
            const cfg = { W, N, c, min, long, labels: steps(N, long).map(s => s.label) };
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
    checkGeometry(m, 'progress -> 11', { W: 900, N: 16, c: 11, min: 128, labels: steps(16, false).map(s => s.label + '.') });
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
    ok(m.state.compact && !m.state.fit && Math.abs(m.state.segment - 126) < 0.01, where, 'compact: expected the full timeline, three dots across the safe area (segment ' + m.state.segment + ')');
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
      ok(Math.abs(m.scrollLeft - m.state.segment) < 1.5 && m.ariaCurrent[0] === 0, where, 'narrow arrow moved ' + m.scrollLeft + ', segment ' + m.state.segment);
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
      checkGeometry(m, where + ' ' + w, { W: w, N: 10, c: 4, min: 128, labels: Array.from({ length: 10 }, (_, i) => SHORT[i]) });
    }
  }

  // ---- regressions from the adversarial review ----
  {
    // parents that size to content: a 1fr grid cell, a flex:1 child, a table cell
    const where = 'parents';
    for (const kind of ['grid', 'flex', 'table']) {
      const w = await p.evaluate(kind => {
        if (window.tl) window.tl.destroy();
        const host = document.getElementById('host'); host.style.width = '900px'; host.innerHTML = '';
        const wrap = document.createElement('div'), cell = document.createElement('div'), side = document.createElement('div');
        side.style.width = '200px';
        if (kind === 'grid') { wrap.style.cssText = 'display:grid;grid-template-columns:1fr 200px;width:900px'; }
        if (kind === 'flex') { wrap.style.cssText = 'display:flex;width:900px'; cell.style.flex = '1'; side.style.flex = 'none'; }
        if (kind === 'table') { wrap.style.cssText = 'display:table;width:900px;table-layout:auto'; cell.style.display = 'table-cell'; side.style.display = 'table-cell'; }
        wrap.append(cell, side); host.append(wrap);
        window.tl = new ProgressTimeline(cell, { steps: Array.from({ length: 30 }, (_, i) => ({ id: 's' + i, label: 'Step ' + (i + 1) })), current: 's4' });
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r([document.querySelector('.pt').getBoundingClientRect().width, tl.getState().maxOffset, document.documentElement.scrollWidth - document.documentElement.clientWidth]))));
      }, kind);
      ok(Math.abs(w[0] - 700) < 1.5 && w[1] > 0 && w[2] <= 0, where, kind + ': card ' + w[0] + ' (expected 700), max ' + w[1] + ', page overflow ' + w[2]);
    }
    await p.evaluate(() => { document.getElementById('host').innerHTML = ''; });
  }
  {
    // a transformed ancestor (a modal scaling in) doesn't skew the measured width
    const where = 'transform';
    const st = await p.evaluate(() => {
      if (window.tl) window.tl.destroy();
      const host = document.getElementById('host'); host.style.width = '900px'; host.style.transform = 'scale(.9)'; host.style.transformOrigin = '0 0';
      window.tl = new ProgressTimeline(host, { steps: Array.from({ length: 6 }, (_, i) => ({ id: 's' + i, label: 'Step ' + (i + 1) })), current: 's0' });
      return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => { host.style.transform = ''; requestAnimationFrame(() => requestAnimationFrame(() => r(tl.getState()))); })));
    });
    ok(Math.abs(st.width - 900) < 0.6 && st.fit, where, 'width ' + st.width + ' fit ' + st.fit);
  }
  {
    // edge: undefined from a wrapper keeps 128; small custom edges keep the end dots on their lines
    const where = 'edge';
    let m = await mount({ W: 1000, N: 12, c: 0, min: 128, long: false });
    await p.evaluate(() => tl.update({ edge: undefined, minSegment: undefined }));
    await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(m.state.edge === 128 && Math.abs(m.dots[0].x - 128) < 0.6, where, 'undefined edge gave ' + m.state.edge);
    for (const [ed, W, N, c] of [[64, 1023, 3, 0], [96, 1400, 5, 5], [80, 1200, 4, 4], [96, 900, 12, 12]]) {
      await p.evaluate(([ed, W, N, c]) => { T.mount({ steps: Array.from({ length: N }, (_, i) => ({ id: 's' + i, label: 'Step ' + (i + 1) })), current: c < N ? 's' + c : null, complete: c >= N, edge: ed, minSegment: ed === 96 && N === 12 ? 200 : 128 }, W); }, [ed, W, N, c]);
      await p.evaluate(frames);
      m = await p.evaluate(MEASURE);
      const n = m.dots.length, endpoint = c <= 0 ? m.dots[0].x - ed : m.dots[n - 1].x - (W - ed);
      ok(Math.abs(endpoint) < 0.6, where, 'edge ' + ed + ' W' + W + ' N' + N + ': endpoint off by ' + endpoint.toFixed(1));
      ok(m.scrollMax <= m.state.maxOffset + 1, where, 'edge ' + ed + ': extra scroll range ' + m.scrollMax + ' vs ' + m.state.maxOffset);
    }
  }
  {
    // a press that leaves the track before moving doesn't stay armed
    const where = 'ghost drag';
    let m = await mount({ W: 900, N: 16, c: 5, min: 128, long: false });
    const box = await p.evaluate(() => { const q = document.querySelector('.pt-scroller').getBoundingClientRect(); return { x: q.left, y: q.top, h: q.height }; });
    const s0 = m.scrollLeft;
    await p.mouse.move(box.x + 400, box.y + 30); await p.mouse.down();
    await p.mouse.move(box.x + 401, box.y + box.h + 60); await p.mouse.up();   // out the bottom, released outside
    await p.mouse.move(box.x + 300, box.y + 30); await p.mouse.move(box.x + 150, box.y + 30);   // hover, no button
    await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - s0) < 1, where, 'hover scrolled by ' + (m.scrollLeft - s0));
  }
  {
    // a tap during the automatic scroll doesn't freeze it or count as browsing
    const where = 'tap during auto';
    await mount({ W: 900, N: 16, c: 2, min: 128, long: false });
    const box = await p.evaluate(() => { const q = document.querySelector('.pt-scroller').getBoundingClientRect(); return { x: q.left, y: q.top }; });
    await p.evaluate(() => tl.setCurrent('s12'));
    await p.waitForTimeout(90);
    await p.mouse.click(box.x + 450, box.y + 30);
    await p.waitForTimeout(1000);
    await p.evaluate(() => tl.update({ label: 'Progress' }));
    await p.evaluate(frames);
    const m = await p.evaluate(MEASURE);
    const want = await p.evaluate(() => ProgressTimeline.targetOffset(tl.layout, 12));
    ok(!m.state.browsed && Math.abs(m.scrollLeft - want) < 1.5, where, 'browsed ' + m.state.browsed + ', at ' + m.scrollLeft + ' expected ' + want);
  }
  {
    // an ordinary re-render mid arrow scroll doesn't cut it short; keys add up
    const where = 'render mid scroll';
    let m = await mount({ W: 900, N: 16, c: 3, min: 128, long: false });
    const r = await p.evaluate(() => { const q = document.querySelector('.pt').getBoundingClientRect(); return [q.left, q.top]; });
    const s0 = m.scrollLeft;
    await p.mouse.click(r[0] + m.be.cx, r[1] + m.be.cy);
    await p.waitForTimeout(60);
    await p.evaluate(() => tl.update({ steps: tl.opts.steps.map(s => Object.assign({}, s)) }));
    await p.waitForTimeout(800);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - (s0 + 128)) < 1.5, where, 'arrow scroll ended at +' + (m.scrollLeft - s0));
    await p.evaluate(() => document.querySelector('.pt-scroller').focus());
    const k0 = m.scrollLeft;
    for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40); }
    await p.waitForTimeout(900);
    m = await p.evaluate(MEASURE);
    ok(Math.abs(m.scrollLeft - Math.min(k0 + 384, m.state.maxOffset)) < 1.5, 'keys', 'three quick ArrowRight moved ' + (m.scrollLeft - k0));
    // Enter twice on the focused arrow: two segments, focus stays on it
    const e0 = m.scrollLeft;
    await p.evaluate(() => document.querySelector('.pt-nav--end').focus());
    await p.keyboard.press('Enter'); await p.waitForTimeout(80); await p.keyboard.press('Enter');
    await p.waitForTimeout(900);
    m = await p.evaluate(MEASURE);
    const af = await p.evaluate(() => document.activeElement.className);
    ok(Math.abs(m.scrollLeft - Math.min(e0 + 256, m.state.maxOffset)) < 1.5, 'enter', 'Enter twice moved ' + (m.scrollLeft - e0));
    ok(/pt-nav--end/.test(af) || !m.be.vis, 'enter', 'focus left the arrow: ' + af);
  }
  {
    // focus never falls to <body> when the track stops scrolling
    const where = 'focus';
    await mount({ W: 700, N: 6, c: 2, min: 128, long: false });
    await p.evaluate(() => document.querySelector('.pt-scroller').focus());
    await p.evaluate(() => T.resize(1400));
    await p.evaluate(frames); await p.evaluate(frames);
    const a = await p.evaluate(() => [document.activeElement === document.body, !!document.activeElement.closest('.pt'), tl.getState().fit]);
    ok(!a[0] && a[1] && a[2], where, 'after fitting: body ' + a[0] + ', in card ' + a[1] + ', fit ' + a[2]);
    await p.evaluate(() => T.resize(900));
  }
  {
    // forced colours: a visible focus outline, dots that still show
    const where = 'forced colours';
    await mount({ W: 900, N: 16, c: 5, min: 128, long: false });
    await p.emulateMedia({ forcedColors: 'active' });
    await p.evaluate(() => document.querySelector('.pt-scroller').focus());
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowLeft');
    const fc = await p.evaluate(() => { const a = getComputedStyle(document.querySelector('.pt'), '::after'); const d = getComputedStyle(document.querySelector('.pt-step.is-upcoming .pt-dot')); return [a.outlineStyle, a.outlineWidth, d.boxShadow]; });
    ok(fc[0] === 'solid' && fc[1] === '2px' && fc[2] !== 'none', where, JSON.stringify(fc));
    await p.emulateMedia({ forcedColors: 'none' });
  }
  {
    // the arrows' accessible names can be set by the host
    const where = 'arrow labels';
    await p.evaluate(() => T.mount({ steps: Array.from({ length: 16 }, (_, i) => ({ id: 's' + i, label: 'Step ' + (i + 1) })), current: 's5', arrowLabels: { end: 'Next steps' } }, 900));
    await p.evaluate(() => tl.update({ current: 's6' }));
    const n = await p.evaluate(() => [document.querySelector('.pt-nav--start').getAttribute('aria-label'), document.querySelector('.pt-nav--end').getAttribute('aria-label')]);
    ok(n[0] === 'Scroll to earlier steps' && n[1] === 'Next steps', where, JSON.stringify(n));
  }

  {
    // minSegmentSmall: its own minimum under smallBelow (600px), the main one from there up; resizing across the line repositions
    const where = 'small min';
    for (const W of [320, 300, 480, 599, 600, 900]) {
      for (const c of [0, 4, 9]) {
        await p.evaluate(([W, c]) => T.mount({ steps: Array.from({ length: 10 }, (_, i) => ({ id: 's' + i, label: ['Details', 'Clinic', 'Slot', 'Deposit', 'Questionnaire', 'Fasting', 'Visit', 'Processing', 'Review', 'Results'][i] })), current: 's' + c, minSegment: 128, minSegmentSmall: 64 }, W), [W, c]);
        await p.evaluate(frames);
        const m = await p.evaluate(MEASURE);
        const min = W < 600 ? 64 : 128;
        ok(m.state.minSegment === min, where, 'W' + W + ': minimum ' + m.state.minSegment + ' expected ' + min);
        checkGeometry(m, where + ' W' + W + ' c' + c, { W, N: 10, c, min, labels: ['Details', 'Clinic', 'Slot', 'Deposit', 'Questionnaire', 'Fasting', 'Visit', 'Processing', 'Review', 'Results'] });
      }
    }
    for (const w of [700, 590, 610, 320]) {
      await p.evaluate(w => T.resize(w), w);
      await p.evaluate(frames); await p.evaluate(frames);
      const m = await p.evaluate(MEASURE);
      ok(!m.state.browsed, where, 'resize to ' + w + ' counted as browsing');
      checkGeometry(m, where + ' resized ' + w, { W: w, N: 10, c: 9, min: w < 600 ? 64 : 128, labels: ['Details', 'Clinic', 'Slot', 'Deposit', 'Questionnaire', 'Fasting', 'Visit', 'Processing', 'Review', 'Results'] });
    }
  }
  {
    // a small minimum: 320px holds five 64px steps, so it keeps its labels (and goes compact once three don't fit)
    const where = 'min 64';
    let m = await mount({ W: 320, N: 10, c: 4, min: 64, long: false });
    ok(!m.state.compact && m.state.narrow && m.labelBox.h >= 19 && !m.caption.shown, where, 'labels at 320: compact ' + m.state.compact + ', caption ' + m.caption.shown);
    ok(Math.abs(m.dots[4].x - 160) < 0.6 && Math.abs(m.state.segment - 64) < 0.01 && Math.abs(m.state.edge - 64) < 0.01, where, 'current at ' + m.dots[4].x + ', segment ' + m.state.segment + ', edge ' + m.state.edge);
    m = await mount({ W: 300, N: 10, c: 4, min: 64, long: false });
    ok(m.state.compact && m.caption.shown, where, '300: expected compact, three 64s don\'t fit across 172');
    await p.evaluate(() => T.resize(320));
    await p.evaluate(frames); await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(!m.state.compact && !m.state.browsed && Math.abs(m.dots[4].x - 160) < 0.6, where, 'grown to 320: compact ' + m.state.compact + ', browsed ' + m.state.browsed + ', current at ' + m.dots[4].x);
  }
  {
    // compact: the info button calls onInfo and fires the event; the caption follows progress; back to labels when wide
    const where = 'compact';
    await p.evaluate(() => { window._info = []; T.mount({ steps: Array.from({ length: 10 }, (_, i) => ({ id: 's' + i, label: 'Step ' + (i + 1) })), current: 's3', onInfo: d => window._info.push(d) }, 320);
      document.querySelector('.pt').addEventListener('progress-timeline:info', e => window._info.push(Object.assign({ ev: true }, e.detail))); });
    await p.evaluate(frames);
    let m = await p.evaluate(MEASURE);
    ok(m.state.compact && m.caption.shown && m.caption.text === 'Up next \u2013 Step 5' && m.caption.info, where, 'caption ' + JSON.stringify(m.caption));
    ok(Math.abs(m.dots[3].x - 160) < 0.6 && Math.abs(m.dots[2].x - 64) < 0.6 && Math.abs(m.dots[4].x - 256) < 0.6, where, 'previous, current, next at ' + [2, 3, 4].map(i => m.dots[i].x.toFixed(1)));
    ok(m.bs.vis && m.be.vis && Math.abs(m.bs.cx - 32) < 0.6 && Math.abs(m.be.cx - 288) < 0.6, where, 'arrows ' + JSON.stringify([m.bs.vis, m.be.vis, m.bs.cx, m.be.cx]));
    await p.evaluate(() => document.querySelector('.pt-info').click());
    const inf = await p.evaluate(() => window._info);
    ok(inf.length === 2 && inf[0].currentIndex === 3 && inf[1].ev, where, 'info ' + JSON.stringify(inf));
    const lbl = await p.evaluate(() => document.querySelector('.pt-info').getAttribute('aria-label'));
    ok(lbl === 'See all the steps', where, 'info label ' + lbl);
    await p.evaluate(() => tl.update({ current: 's9' }));
    await p.waitForTimeout(700);
    m = await p.evaluate(MEASURE);
    ok(!m.caption.shown && Math.abs(m.dots[9].x - 256) < 0.6, where, 'last step: caption ' + m.caption.shown + ', last dot ' + m.dots[9].x);
    await p.evaluate(() => tl.update({ current: 's1', onInfo: null }));
    await p.waitForTimeout(700);
    m = await p.evaluate(MEASURE);
    ok(m.caption.shown && !m.caption.info && m.caption.text === 'Up next \u2013 Step 3', where, 'no onInfo: ' + JSON.stringify(m.caption));
    await p.evaluate(() => T.resize(700));
    await p.evaluate(frames); await p.evaluate(frames);
    m = await p.evaluate(MEASURE);
    ok(!m.state.compact && !m.caption.shown && m.labelBox.h >= 19, where, 'wide again: compact ' + m.state.compact + ', caption ' + m.caption.shown);
    // a focused info button that goes away hands focus to the card, not <body>
    await p.evaluate(() => { T.resize(320); });
    await p.evaluate(frames); await p.evaluate(frames);
    await p.evaluate(() => tl.update({ onInfo: () => {} }));
    await p.evaluate(() => document.querySelector('.pt-info').focus());
    await p.evaluate(() => tl.update({ current: 's9' }));
    const fa = await p.evaluate(() => [document.activeElement === document.body, !!document.activeElement.closest('.pt')]);
    ok(!fa[0] && fa[1], where, 'focus after the caption emptied: ' + JSON.stringify(fa));
  }

  ok(errors.length === 0, 'page', 'errors: ' + errors.join(' | '));
  await browser.close();
  server.close();
  console.log(checks + ' checks, ' + failures.length + ' failed');
  if (failures.length) {
    const seen = new Map();
    for (const f of failures) { const k = f.replace(/^[^:]+: /, '').replace(/[\d.-]+/g, '#'); seen.set(k, (seen.get(k) || []).concat(f)); }
    for (const [, list] of seen) console.log('  ' + list[0] + (list.length > 1 ? '  (+' + (list.length - 1) + ' similar)' : ''));
    if (process.env.ALL) failures.forEach(f => console.log('    ' + f));
    process.exit(1);
  }
})().catch(e => { console.error(e); server.close(); process.exit(1); });
