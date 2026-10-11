/* Hairline V2: the report reveal.
 *
 * A cloud of data points drifts in a compact volume; most of them are drawn to
 * the report's form, hold it for a moment, and let it go again:
 *   raw data -> attract -> organise -> reveal -> release -> raw data.
 * Everything on screen is a pure function of the loop's phase (0..1), so the
 * loop is seamless by construction and any moment can be drawn on its own.
 *
 * A figure is registered with HL2.def({ name, title, build(rnd) }); build
 * returns, in world units (x down-right, y down-left, z up, the Hairline 2:1
 * camera):
 *   pts    [{ p: [x, y, z], w: 0..1 brightness, acc: mint, dot: round, lift: [dx, dy, dz], win: [h0, h1] }]
 *          lift: a small move during the hold (a layer parting, a cluster breathing)
 *          win:  the point shows only during this part of the hold (0..1), then fades
 *   edges  [[[x, y, z], ...], ...]  sparse hairlines that fade in once the points have formed
 *   acc    [[[x, y, z], ...], ...]  hairlines in mint (sparingly)
 *   scan   { path: [[x, y, z], ...], metric: 'z' | 'xyz', radius, plane: [hx, hy] }
 *          the scan pointer: one small white square that travels the path during the hold
 *          and lights the points it passes; with plane, a hairline plane rides with it
 *   cloud  [hx, hy, hz, cz]  the cloud's half-sizes and centre height (defaults from the form)
 *   loose  share of the points that stay loose (default .35)
 *   looseAcc  share of the loose points drawn in mint (default 0: mint is the signal, not dust)
 * HL2.mount(canvas, name) plays it; HL2.draw(canvas, name, phase) draws one moment.
 */
(function () {
  'use strict';
  var HL2 = window.HL2 = window.HL2 || {};
  HL2.figs = HL2.figs || {};
  HL2.def = function (f) { HL2.figs[f.name] = f; };
  HL2.MINT = '170,238,194';          // Everlab's mint: the app's "optimal" green (#aaeec2)
  HL2.INK = '236,239,241';           // the points and the lines: soft white
  HL2.LOOP = 7.2;                    // seconds

  // the Hairline camera: azimuth 45deg, k = sin(elevation) = .5 (the 2:1 view)
  var CA = Math.cos(Math.PI / 4), SA = Math.sin(Math.PI / 4), K = 0.5, KZ = Math.sqrt(1 - K * K);
  HL2.proj = function (x, y, z) { return [x * CA - y * SA, (x * SA + y * CA) * K - z * KZ]; };
  HL2.rng = function (seed) { var s = seed | 0; return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeBack(t) { var c = 1.25, u = t - 1; return t <= 0 ? 0 : t >= 1 ? 1 : 1 + (c + 1) * u * u * u + c * u * u; }   // a small overshoot, then settling
  function easeInOut(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // the timeline, as shares of the loop
  var T = { a0: .10, a1: .30, aDur: .20, eIn: [.34, .48], eOut: [.70, .80], h0: .50, h1: .70, s0: .40, s1: .74, r0: .68, r1: .78, rDur: .20 };   // the last point is home at .98: the loop closes on the cloud
  HL2.T = T;

  var cache = {};
  function prepare(name) {
    if (cache[name]) return cache[name];
    var f = HL2.figs[name]; if (!f) return null;
    var rnd = HL2.rng(20261011), m = f.build(HL2.rng(7)), pts = m.pts, i;
    // the cloud: a rounded box round the form, a little larger than it
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (i = 0; i < pts.length; i++) for (var k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], pts[i].p[k]); hi[k] = Math.max(hi[k], pts[i].p[k]); }
    var c = m.cloud || [(hi[0] - lo[0]) * .62 + .2, (hi[1] - lo[1]) * .62 + .2, (hi[2] - lo[2]) * .56 + .2, (hi[2] + lo[2]) / 2];
    var cx = (hi[0] + lo[0]) / 2, cy = (hi[1] + lo[1]) / 2;
    var inCloud = function () { var u, v, w; do { u = rnd() * 2 - 1; v = rnd() * 2 - 1; w = rnd() * 2 - 1; } while (u * u * u * u + v * v * v * v + w * w * w * w > 1); return [cx + u * c[0], cy + v * c[1], c[3] + w * c[2]]; };
    var loose = m.loose == null ? .35 : m.loose, nL = Math.round(pts.length * loose / (1 - loose)), P = [];
    var order = pts.map(function (q, j) { return j; });
    // attraction runs across the form along its height and a little at random, so it gathers rather than lands at once
    var span = (hi[2] - lo[2]) || 1;
    for (i = 0; i < pts.length; i++) {
      var q = pts[i], h = (hi[2] - q.p[2]) / span, s = inCloud();
      P.push({ c: s, t: q.p, w: q.w == null ? .8 : q.w, acc: !!q.acc, dot: !!q.dot, lift: q.lift || null, win: q.win || null,
        a: T.a0 + (T.a1 - T.a0) * clamp(.55 * h + .45 * rnd(), 0, 1), r: T.r0 + (T.r1 - T.r0) * rnd(),
        ph: rnd() * TAU, ph2: rnd() * TAU, f: 1 + (rnd() * 2 | 0), amp: .03 + rnd() * .05, b0: .22 + rnd() * .3, loose: false,
        dv: [(rnd() - .5) * .5, (rnd() - .5) * .5, (rnd() - .3) * .35] });
    }
    var lAcc = m.looseAcc == null ? 0 : m.looseAcc;   // mint means the revealed signal, so the loose cloud carries none unless a figure asks
    for (i = 0; i < nL; i++) P.push({ c: inCloud(), t: null, w: .4, acc: rnd() < lAcc, dot: rnd() < .22, lift: null, win: null, a: 0, r: 0,
      ph: rnd() * TAU, ph2: rnd() * TAU, f: 1 + (rnd() * 2 | 0), amp: .04 + rnd() * .06, b0: .18 + rnd() * .3, loose: true, dv: null });
    // the frame: the formed object fits about two thirds of the stage, the cloud the rest
    var box = [1e9, 1e9, -1e9, -1e9], add = function (p) { var s = HL2.proj(p[0], p[1], p[2]); box[0] = Math.min(box[0], s[0]); box[1] = Math.min(box[1], s[1]); box[2] = Math.max(box[2], s[0]); box[3] = Math.max(box[3], s[1]); };
    pts.forEach(function (q) { add(q.p); }); (m.edges || []).forEach(function (e) { e.forEach(add); });
    var cbox = [1e9, 1e9, -1e9, -1e9]; P.forEach(function (q) { var s = HL2.proj(q.c[0], q.c[1], q.c[2]); cbox[0] = Math.min(cbox[0], s[0]); cbox[1] = Math.min(cbox[1], s[1]); cbox[2] = Math.max(cbox[2], s[0]); cbox[3] = Math.max(cbox[3], s[1]); });
    var M = { f: f, m: m, P: P, box: box, cbox: cbox, cc: [cx, cy, c[3]] };
    // the scan path, measured
    if (m.scan && m.scan.path && m.scan.path.length > 1) { var L = [0], sp = m.scan.path; for (i = 1; i < sp.length; i++) L.push(L[i - 1] + Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1], sp[i][2] - sp[i - 1][2])); M.scanLen = L; }
    return (cache[name] = M);
  }
  function along(path, L, u) { var d = u * L[L.length - 1], i = 1; while (i < L.length - 1 && L[i] < d) i++; var t = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1), a = path[i - 1], b = path[i]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  var BW = 6, BA = 3;   // brightness bins: soft white and mint
  function draw(ctx, W, H, dpr, M, ph) {
    var m = M.m, P = M.P, i;
    // fit: the form into ~64% of the stage's smaller side, centred; the cloud may run wider
    var bw = M.box[2] - M.box[0], bh = M.box[3] - M.box[1], S = Math.min(W * .64 / bw, H * .66 / bh);
    var ox = W / 2 - (M.box[0] + bw / 2) * S, oy = H / 2 - (M.box[1] + bh / 2) * S;
    var pr = function (x, y, z) { var s = HL2.proj(x, y, z); return [ox + s[0] * S, oy + s[1] * S]; };
    var px = dpr * Math.max(1.15, Math.min(2.1, Math.min(W, H * 1.3) / dpr / 210));    // a point's side: about 1.6px at 340 x 260, in step with the fitted figure in a tall or a short box
    var hold = sstep(T.a1 + T.aDur - .04, T.h0, ph) * (1 - sstep(T.h1, T.r1, ph));   // 0..1, the form at its fullest
    var hp = clamp((ph - T.h0 + .06) / (T.h1 - T.h0 + .1), 0, 1);                   // the hold's own progress
    var env = Math.sin(Math.PI * hp);                                               // a breath over the hold
    // the scan pointer
    var sc = m.scan, spos = null, su = 0;
    if (sc && M.scanLen) { su = clamp((ph - T.s0) / (T.s1 - T.s0), 0, 1); if (ph > T.s0 && ph < T.s1) spos = along(sc.path, M.scanLen, easeInOut(su)); }
    var bins = [], k; for (k = 0; k < BW + BA; k++) bins.push([]);
    var dots = [];
    for (i = 0; i < P.length; i++) {
      var q = P[i], cp = q.c, w1 = TAU * ph;
      // drift: slow, periodic in the loop, so the cloud is where it started when the loop closes
      var x = cp[0] + q.amp * Math.sin(q.f * w1 + q.ph), y = cp[1] + q.amp * Math.cos(q.f * w1 + q.ph2), z = cp[2] + q.amp * .7 * Math.sin(w1 + q.ph2);
      var b = q.b0, formed = 0;
      if (q.t) {
        var a = easeBack(clamp((ph - q.a) / T.aDur, 0, 1)), r = easeInOut(clamp((ph - q.r) / T.rDur, 0, 1)), lin = clamp((ph - q.a) / T.aDur, 0, 1);
        formed = Math.min(a, 1) * (1 - r);
        var tx = q.t[0], ty = q.t[1], tz = q.t[2];
        // micro-movement while held, and the figure's own small move
        tx += .006 * Math.sin(TAU * 3 * ph + q.ph); ty += .006 * Math.cos(TAU * 3 * ph + q.ph2); tz += .004 * Math.sin(TAU * 2 * ph + q.ph);
        if (q.lift) { tx += q.lift[0] * env; ty += q.lift[1] * env; tz += q.lift[2] * env; }
        // on the way in, a little turbulence across the path
        var tb = Math.sin(Math.PI * lin) * .08;
        var gx = x + (tx - x) * a + tb * Math.sin(q.ph * 3 + ph * 9), gy = y + (ty - y) * a + tb * Math.cos(q.ph2 * 3 + ph * 7), gz = z + (tz - z) * a;
        // on the way out, it drifts off as it lets go
        var dr = Math.sin(Math.PI * r) * .35;
        x = gx + (x - gx) * r + q.dv[0] * dr; y = gy + (y - gy) * r + q.dv[1] * dr; z = gz + (z - gz) * r + q.dv[2] * dr;
        b = q.b0 + (q.w - q.b0) * formed;
        if (q.win) { var wv = sstep(q.win[0], q.win[0] + .12, hp) * (1 - sstep(q.win[1] - .12, q.win[1], hp)); formed *= wv; b *= wv; if (wv < .02) continue; }
      } else {
        // loose points close in a little round the form while it holds
        var cc = 1 - .1 * hold; x = M.cc[0] + (x - M.cc[0]) * cc; y = M.cc[1] + (y - M.cc[1]) * cc; z = M.cc[2] + (z - M.cc[2]) * cc;
      }
      // the scan lights what it passes
      if (spos) { var d = sc.metric === 'z' ? Math.abs(z - spos[2]) : Math.hypot(x - spos[0], y - spos[1], z - spos[2]); var lit = Math.exp(-(d * d) / (sc.radius * sc.radius)) * formed; b = b + (1 - b) * lit; }
      var s = pr(x, y, z);
      if (q.dot) { dots.push(s[0], s[1], b, q.acc && formed > .5); continue; }
      var bin = q.acc && (formed > .45 || q.loose) ? BW + Math.min(BA - 1, (b * BA) | 0) : Math.min(BW - 1, (b * BW) | 0);
      bins[bin].push(s[0], s[1]);
    }
    ctx.clearRect(0, 0, W, H);
    // the hairlines: in once the points have formed, out as they let go
    var ea = sstep(T.eIn[0], T.eIn[1], ph) * (1 - sstep(T.eOut[0], T.eOut[1], ph));
    ctx.lineWidth = Math.max(1, dpr * .75); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var path = function (pl) { ctx.beginPath(); pl.forEach(function (p, j) { var s = pr(p[0], p[1], p[2] + (p[3] ? p[3] * env : 0)); if (j) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }); ctx.stroke(); };
    if (ea > .01) {
      ctx.strokeStyle = 'rgba(' + HL2.INK + ',' + (.42 * ea).toFixed(3) + ')'; (m.edges || []).forEach(path);
      ctx.strokeStyle = 'rgba(' + HL2.MINT + ',' + (.6 * ea).toFixed(3) + ')'; (m.acc || []).forEach(path);
    }
    if (spos && sc.plane) {   // the scan plane: a hairline rhombus riding with the pointer
      var hx = sc.plane[0], hy = sc.plane[1], cz = spos[2], cxp = spos[0], cyp = spos[1], pa = Math.sin(Math.PI * su) * .5;
      ctx.strokeStyle = 'rgba(' + HL2.INK + ',' + pa.toFixed(3) + ')';
      path([[cxp - hx, cyp - hy, cz], [cxp + hx, cyp - hy, cz], [cxp + hx, cyp + hy, cz], [cxp - hx, cyp + hy, cz], [cxp - hx, cyp - hy, cz]]);
    }
    for (k = 0; k < BW + BA; k++) {
      var B = bins[k]; if (!B.length) continue;
      var mint = k >= BW, lv = mint ? (k - BW + 1) / BA : (k + 1) / BW;
      ctx.fillStyle = 'rgba(' + (mint ? HL2.MINT : HL2.INK) + ',' + (mint ? .45 + .55 * lv : .12 + .88 * lv).toFixed(3) + ')';
      ctx.beginPath(); for (var j = 0; j < B.length; j += 2) ctx.rect(Math.round(B[j] - px / 2), Math.round(B[j + 1] - px / 2), px, px); ctx.fill();
    }
    for (i = 0; i < dots.length; i += 4) { ctx.fillStyle = 'rgba(' + (dots[i + 3] ? HL2.MINT : HL2.INK) + ',' + (.12 + .8 * dots[i + 2]).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(dots[i], dots[i + 1], px * .42, 0, TAU); ctx.fill(); }
    if (spos) {   // the pointer: one small white square, a short trail behind it
      for (k = 3; k >= 0; k--) {
        var pu = easeInOut(clamp(su - k * .012, 0, 1)), pp = along(sc.path, M.scanLen, pu), ps = pr(pp[0], pp[1], pp[2]), sz = px * (k ? 1.1 : 1.9);
        ctx.fillStyle = 'rgba(255,255,255,' + (k ? .5 - k * .12 : 1) * Math.sin(Math.PI * su) + ')'; ctx.fillRect(Math.round(ps[0] - sz / 2), Math.round(ps[1] - sz / 2), sz, sz);
      }
    }
  }

  function sizer(cv) { var R = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(R.width * d), h = Math.round(R.height * d); if (!w || !h) return null; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return [w, h, d]; }
  HL2.draw = function (cv, name, ph) { var M = prepare(name), z = sizer(cv); if (!M || !z) return false; draw(cv.getContext('2d'), z[0], z[1], z[2], M, ((ph % 1) + 1) % 1); return true; };
  HL2.mount = function (cv, name, opt) {
    opt = opt || {}; var M = prepare(name); if (!M) return null;
    var still = opt.still != null ? opt.still : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var gone = false, raf = 0, seen = true, t0 = 0, off = (opt.phase || 0) * HL2.LOOP * 1000, io = null, last = '';
    if (window.IntersectionObserver) { io = new IntersectionObserver(function (es) { seen = es[es.length - 1].isIntersecting; if (seen && !raf && !gone) raf = requestAnimationFrame(tick); }); io.observe(cv); }
    function tick(now) {
      raf = 0; if (gone) return; if (!cv.isConnected) { stop(); return; }
      if (!seen || document.hidden) return;   // offscreen: sleep until seen again
      if (still) { var z = sizer(cv); if (z && last !== z.join()) { last = z.join(); draw(cv.getContext('2d'), z[0], z[1], z[2], M, .6); } raf = requestAnimationFrame(tick); return; }
      if (!t0) t0 = now - off;
      var z2 = sizer(cv); if (z2) draw(cv.getContext('2d'), z2[0], z2[1], z2[2], M, ((now - t0) / 1000 / HL2.LOOP) % 1);
      raf = requestAnimationFrame(tick);
    }
    function wake() { if (!document.hidden && !raf && !gone) raf = requestAnimationFrame(tick); }
    function stop() { gone = true; if (raf) cancelAnimationFrame(raf); raf = 0; if (io) io.disconnect(); document.removeEventListener('visibilitychange', wake); }
    document.addEventListener('visibilitychange', wake);
    raf = requestAnimationFrame(tick);
    return { destroy: stop };
  };
})();
