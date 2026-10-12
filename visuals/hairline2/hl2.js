/* Hairline V2: the report card.
 *
 * Every figure is the same object: an isometric report card lying flat, one sheet offset
 * underneath, crisp off-white edges, a visual panel and three short hairlines of report text.
 * What changes is the panel: a figure lights cells of a regular grid inside it, and the cells
 * become square particles with deliberate places (a body, a pathway, data rows...).
 *
 * HL2.def({ name, title, build(rnd) }) where build returns, in panel grid units
 * (i across, 0..COLS; j down, 0..ROWS; a cell's centre is i + .5, j + .5):
 *   cells   [{ i, j, b: 0..1 brightness, acc: muted accent, s: size factor (default 1), grey: dim grey }]
 *   lines   [[[i, j], ...], ...]   hairlines inside the panel (darker grey)
 *   bright  [[[i, j], ...], ...]   hairlines inside the panel in off-white (sparingly)
 *   accLines[[[i, j], ...], ...]   hairlines in the accent (very sparingly)
 * HL2.draw(canvas, name) draws the assembled report; HL2.mount(canvas, name) keeps it drawn
 * at the canvas's size. The static, assembled state comes first; motion is added on top of it.
 */
(function () {
  'use strict';
  var HL2 = window.HL2 = window.HL2 || {};
  HL2.figs = HL2.figs || {};
  HL2.def = function (f) { HL2.figs[f.name] = f; };
  HL2.COLS = 24; HL2.ROWS = 20;
  HL2.rng = function (seed) { var s = seed | 0; return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // the palette: off-white edges, darker grey details, one muted accent
  var EDGE = '238,240,236', SHEET = '238,240,236', GREY = '128,134,138', INK = '236,238,234', ACC = '140,200,166', GROUND = '#1b1b1b';
  HL2.palette = { EDGE: EDGE, GREY: GREY, INK: INK, ACC: ACC, GROUND: GROUND };

  // the camera (azimuth, elevation in degrees) and how the page sits in the world: lying on the
  // ground (page across = x, down = y, up out of the page = z) or standing (across = x, down = -z, out = y)
  var VIEW = { az: 26, el: 54, stand: false };   // looked at from higher and more frontally than the 2:1 view, so the panel reads at 250px
  var CA, SA, K, KZ;
  function setView(v) { for (var k in v) VIEW[k] = v[k]; CA = Math.cos(VIEW.az * Math.PI / 180); SA = Math.sin(VIEW.az * Math.PI / 180); K = Math.sin(VIEW.el * Math.PI / 180); KZ = Math.cos(VIEW.el * Math.PI / 180); cache = {}; }
  function proj0(x, y, z) { return [x * CA - y * SA, (x * SA + y * CA) * K - z * KZ]; }
  // page coordinates (x across, y down the page, z out of it) to the world, then to the screen
  function proj(x, y, z) { return VIEW.stand ? proj0(x, -z * 1 + 0, -y) : proj0(x, y, z); }
  HL2.proj = proj; HL2.view = function (v) { setView(v); };

  // the card: page across along x, down along y (its top edge at the back, upper right)
  var CARD = { x0: -.6, x1: .6, y0: -.8, y1: .8, z0: .0, z1: .035, r: .05 };
  var SH = { dx: .075, dy: -.07, z1: -.006, z0: -.04 };                     // the sheet under it, peeking out at the right
  var PAN = { x0: -.48, x1: .48, y0: -.68, y1: .12, r: .03 };               // the visual panel: 24 x 20 cells of .04
  var TXT = [[.30, .62], [.42, .5], [.54, .34]];                            // three lines of report text: [y, length as a share of the panel's width]
  HL2.CARD = CARD; HL2.PAN = PAN;

  function rrect(x0, y0, x1, y1, r, n) {
    var o = [], c = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
    c.forEach(function (q) { for (var k = 0; k <= n; k++) { var a = q[2] + k / n * Math.PI / 2; o.push([q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r]); } });
    return o;
  }
  function hull(P) {
    P = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], up = [], i;
    for (i = 0; i < P.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P[i]) <= 0) lo.pop(); lo.push(P[i]); }
    for (i = P.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(P[i]); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // panel grid units to world
  function pw(i, j) { return [PAN.x0 + i / HL2.COLS * (PAN.x1 - PAN.x0), PAN.y0 + j / HL2.ROWS * (PAN.y1 - PAN.y0), CARD.z1]; }
  HL2.pw = pw;

  var cache = {};
  setView({});
  function model(name) {
    if (cache[name]) return cache[name];
    var f = HL2.figs[name]; if (!f) return null;
    var m = f.build(HL2.rng(20261012));
    return (cache[name] = { f: f, m: m });
  }

  // the frame: the card and its sheet take about two thirds of the stage
  function fit(W, H) {
    var pts = [];
    [[CARD, 0, 0], [{ x0: CARD.x0 + SH.dx, x1: CARD.x1 + SH.dx, y0: CARD.y0 + SH.dy, y1: CARD.y1 + SH.dy, z0: SH.z0, z1: SH.z1 }, 0, 0]].forEach(function (q) {
      var c = q[0]; [[c.x0, c.y0], [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1]].forEach(function (p) { pts.push(proj(p[0], p[1], c.z0)); pts.push(proj(p[0], p[1], c.z1)); });
    });
    var b = [1e9, 1e9, -1e9, -1e9]; pts.forEach(function (s) { b[0] = Math.min(b[0], s[0]); b[1] = Math.min(b[1], s[1]); b[2] = Math.max(b[2], s[0]); b[3] = Math.max(b[3], s[1]); });
    var S = Math.min(W * .66 / (b[2] - b[0]), H * .7 / (b[3] - b[1]));
    return { S: S, ox: W / 2 - (b[0] + b[2]) / 2 * S, oy: H / 2 - (b[1] + b[3]) / 2 * S };
  }

  // the assembled report. `pose(k, cell)` may move a cell (the motion, later): it returns [dx, dy, dz, alpha] in world units
  function draw(ctx, W, H, dpr, M, pose) {
    var F = fit(W, H), S = F.S;
    var P = function (x, y, z) { var s = proj(x, y, z); return [F.ox + s[0] * S, F.oy + s[1] * S]; };
    var lw = Math.max(1, dpr);
    ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var path = function (pl, close) { ctx.beginPath(); pl.forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); if (close) ctx.closePath(); };
    // a slab: its silhouette filled with the ground and stroked, its top face's outline as the crease
    var slab = function (x0, y0, x1, y1, z0, z1, a, face) {
      var ring = rrect(x0, y0, x1, y1, CARD.r, 6), top = ring.map(function (p) { return P(p[0], p[1], z1); }), bot = ring.map(function (p) { return P(p[0], p[1], z0); });
      path(hull(top.concat(bot)), true); ctx.fillStyle = face || GROUND; ctx.fill(); ctx.strokeStyle = 'rgba(' + EDGE + ',' + a + ')'; ctx.lineWidth = lw; ctx.stroke();
      path(top, true); ctx.strokeStyle = 'rgba(' + EDGE + ',' + (a * .62).toFixed(3) + ')'; ctx.stroke();
    };
    slab(CARD.x0 + SH.dx, CARD.y0 + SH.dy, CARD.x1 + SH.dx, CARD.y1 + SH.dy, SH.z0, SH.z1, .5, '#1d1d1d');   // the sheet underneath
    slab(CARD.x0, CARD.y0, CARD.x1, CARD.y1, CARD.z0, CARD.z1, .92, '#222222');                               // the report, its face a touch lighter than the ground so it reads as an object
    var z = CARD.z1;
    // the panel and the report's lines: darker grey
    ctx.strokeStyle = 'rgba(' + GREY + ',.85)'; ctx.lineWidth = lw;
    path(rrect(PAN.x0, PAN.y0, PAN.x1, PAN.y1, PAN.r, 4).map(function (p) { return P(p[0], p[1], z); }), true); ctx.stroke();
    TXT.forEach(function (t) { var a = P(PAN.x0, t[0], z), b = P(PAN.x0 + (PAN.x1 - PAN.x0) * t[1], t[0], z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    // the panel's own hairlines
    var m = M.m, gl = function (list, col, a) { (list || []).forEach(function (pl) { ctx.strokeStyle = 'rgba(' + col + ',' + a + ')'; path(pl.map(function (q) { var w = pw(q[0], q[1]); return P(w[0], w[1], z); }), false); ctx.stroke(); }); };
    gl(m.lines, GREY, .8); gl(m.bright, EDGE, .85); gl(m.accLines, ACC, .9);
    // the cells: squares, binned by colour and brightness
    var pitch = Math.hypot.apply(null, (function () { var a = P(0, 0, 0), b = P((PAN.x1 - PAN.x0) / HL2.COLS, 0, 0); return [b[0] - a[0], b[1] - a[1]]; })());
    var base = Math.max(1.3 * dpr, Math.min(3 * dpr, pitch * .5)), bins = {};   // a particle: half the grid's pitch
    (m.cells || []).forEach(function (c, k) {
      var w = pw(c.i + .5, c.j + .5), al = 1;
      if (pose) { var d = pose(k, c); if (d) { w = [w[0] + d[0], w[1] + d[1], w[2] + d[2]]; al = d[3]; } }
      if (al <= .01) return;
      var s = P(w[0], w[1], w[2]), col = c.acc ? ACC : c.grey ? GREY : INK, lv = Math.max(1, Math.min(6, Math.round((c.b == null ? .85 : c.b) * al * 6)));
      var key = col + '|' + lv + '|' + (c.s || 1); (bins[key] = bins[key] || []).push(s[0], s[1]);
    });
    Object.keys(bins).forEach(function (key) {
      var q = key.split('|'), B = bins[key], sz = Math.max(1, Math.round(base * +q[2]));
      ctx.fillStyle = 'rgba(' + q[0] + ',' + (.25 + .75 * (+q[1]) / 6).toFixed(3) + ')';
      ctx.beginPath(); for (var k = 0; k < B.length; k += 2) ctx.rect(Math.round(B[k] - sz / 2), Math.round(B[k + 1] - sz / 2), sz, sz); ctx.fill();
    });
  }

  function sizer(cv) { var R = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(R.width * d), h = Math.round(R.height * d); if (!w || !h) return null; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return [w, h, d]; }
  HL2.draw = function (cv, name, pose) { var M = model(name), z = sizer(cv); if (!M || !z) return false; draw(cv.getContext('2d'), z[0], z[1], z[2], M, pose); return true; };
  HL2.mount = function (cv, name) {
    var M = model(name); if (!M) return null;
    var last = '', ro = window.ResizeObserver ? new ResizeObserver(function () { var z = sizer(cv); if (z && z.join() !== last) { last = z.join(); draw(cv.getContext('2d'), z[0], z[1], z[2], M); } }) : null;
    if (ro) ro.observe(cv); else HL2.draw(cv, name);
    return { destroy: function () { if (ro) ro.disconnect(); } };
  };

  // shared drawing helpers for the panels, in grid units
  HL2.inside = function (sdf, i, j) { return sdf(i + .5, j + .5) <= 0; };
  HL2.capsule = function (ax, ay, bx, by, r) { return function (x, y) { var dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - ax - dx * t, y - ay - dy * t) - r; }; };
  HL2.union = function () { var f = [].slice.call(arguments); return function (x, y) { var d = 1e9; for (var k = 0; k < f.length; k++) d = Math.min(d, f[k](x, y)); return d; }; };
  // a simple standing body, front view, centred on column cx, from row top to row top + h
  HL2.body = function (cx, top, h, spread) {
    var u = h / 17, sp = spread || 0;
    return HL2.union(
      function (x, y) { return Math.hypot(x - cx, y - (top + 1.7 * u)) - 1.55 * u; },                       // head
      HL2.capsule(cx, top + 3.2 * u, cx, top + 4.2 * u, .6 * u),                                          // neck
      HL2.capsule(cx - 1.55 * u, top + 5.2 * u, cx - 1.2 * u, top + 10.4 * u, 1.35 * u),                   // torso, as two columns
      HL2.capsule(cx + 1.55 * u, top + 5.2 * u, cx + 1.2 * u, top + 10.4 * u, 1.35 * u),
      HL2.capsule(cx - 3.1 * u, top + 5.3 * u, cx - (3.6 + sp) * u, top + 10.8 * u, .62 * u),             // arms
      HL2.capsule(cx + 3.1 * u, top + 5.3 * u, cx + (3.6 + sp) * u, top + 10.8 * u, .62 * u),
      HL2.capsule(cx - 1.05 * u, top + 10.6 * u, cx - 1.15 * u, top + 16.4 * u, .85 * u),                 // legs
      HL2.capsule(cx + 1.05 * u, top + 10.6 * u, cx + 1.15 * u, top + 16.4 * u, .85 * u)
    );
  };
})();
