/* Hairline V2 · DEXA Body Composition & Bone Mineral Density
 * A body lying flat on the scan table, head at the upper left, feet at the lower right, drawn as
 * three thin plates stacked a little apart. Below, a fine regular grid of squares inside the
 * silhouette, brighter where bone runs. Between, a more open lattice of points, denser close to
 * the bone, round a few lines of it: the pelvis a hairline, the femurs and tibias rows of points,
 * the spine a column of denser points. Above, only the body's outline, as a hairline. Two
 * hairlines run up through the stack at the crown and past the feet. While it holds, the plates
 * part by a few pixels and close again, and the scan pointer, with a hairline bar across the body
 * (the scanner's arm), runs crown to feet, lighting the cells it passes; as it reaches the lumbar
 * spine and then the femoral necks, they turn mint and stay so to the end of the hold. No numbers.
 */
HL2.def({
  name: 'strata',
  title: 'dexa body composition & bone mineral density',
  build: function (rnd) {
    var pts = [], edges = [], G = .24, LIFT = .03, i, j;
    // the outline's right half: [along the body from the crown, across from the midline]; the left mirrors it
    var HALF = [];
    for (var t = 0; t <= 2.31; t += .231) HALF.push([.16 - .16 * Math.cos(t), .13 * Math.sin(t)]);   // the head
    HALF = HALF.concat([[.34, .065], [.4, .075], [.45, .22], [.51, .33], [.6, .36], [1.0, .37], [1.45, .385], [1.6, .38], [1.66, .34], [1.7, .27],
      [1.95, .245], [2.15, .215], [2.35, .21], [2.75, .17], [2.88, .18], [2.98, .17], [3, .14], [2.98, .1], [2.85, .085], [2.5, .085], [2.15, .075], [1.8, .06], [1.6, .04], [1.52, 0]]);
    var mir = function (o) { return o.map(function (p) { return [p[0], -p[1]]; }); };
    function inPoly(P, s, d) { var c = false; for (var a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > d) !== (P[b][1] > d) && s < (P[b][0] - P[a][0]) * (d - P[a][1]) / (P[b][1] - P[a][1]) + P[a][0]) c = !c; return c; }
    function inside(s, d) { return inPoly(HALF.concat([[0, 0]]), s, Math.abs(d)); }
    // the body lies along world x (its length) and y (its width): both read at the same scale, an isometric slab
    var X = function (s, d, z, lz) { var p = [s - 1.5, d, z]; if (lz) p.push(lz); return p; };
    // a point every so often along a polyline (once only where a closed one meets itself)
    function each(o, step, fn) { var e = o.length - 1, shut = o[0][0] === o[e][0] && o[0][1] === o[e][1]; for (var k = 1; k <= e; k++) { var a = o[k - 1], b = o[k], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (var m = k > 1 ? 1 : 0; m <= n - (shut && k === e ? 1 : 0); m++) fn(a[0] + (b[0] - a[0]) * m / n, a[1] + (b[1] - a[1]) * m / n); } }
    // the bones, in the middle layer: the pelvis, then a femur (its neck first) and a tibia each side; the spine apart
    var BONES = [[[1.1, -.18], [1.1, .18], [1.36, .07], [1.36, -.07], [1.1, -.18]]], NECK = [[1.3, .1], [1.36, .16]];
    [NECK.concat([[2.12, .14]]), [[2.18, .14], [2.8, .13]]].forEach(function (b) { BONES.push(b, mir(b)); });
    var SPINE = [[.36, 0], [1.26, 0]], LUMBAR = [.92, 1.2];
    function seg(s, d, a, b) { var vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((s - a[0]) * vx + (d - a[1]) * vy) / (vx * vx + vy * vy))); return Math.hypot(s - a[0] - u * vx, d - a[1] - u * vy); }
    function bone(s, d) { var m = 9; BONES.concat([SPINE]).forEach(function (b) { for (var k = 1; k < b.length; k++) m = Math.min(m, seg(s, d, b[k - 1], b[k])); }); return m; }
    // the mint sites stay white; a mint copy shows only once the pointer reaches them (lumbar s ~.92, necks ~1.33)
    var WL = [.33, .98], WN = [.40, .98];
    function mint(q, win) { pts.push({ p: q.p, w: q.w, acc: true, lift: q.lift, win: win }); }
    // below: a regular grid on the body's own axes; brighter where bone runs and along the edge
    var P = .085;
    for (i = -18; i <= 18; i++) for (j = -5; j <= 4; j++) {
      var s = 1.5 + i * P, d = (j + .5) * P;
      if (!inside(s, d)) continue;
      var rim = !inside(s + P, d) || !inside(s - P, d) || !inside(s, d + P) || !inside(s, d - P), nb = bone(s, d) < .05, lum = nb && Math.abs(d) < .05 && s > LUMBAR[0] && s < LUMBAR[1];
      var q = { p: X(s, d, 0), w: nb ? .5 : rim ? .46 : .14 + .1 * rnd(), lift: [0, 0, -LIFT] };
      pts.push(q); if (lum) mint(q, WL);
    }
    // between: a more open, staggered lattice, clear of the bones; it thins out away from them
    for (i = 0; i * .08 <= 3; i++) for (var d2 = -.405 + (i % 2) * .045; d2 <= .42; d2 += .09) {
      var s2 = i * .08 + .03, bd = bone(s2, d2);
      if (!inside(s2, d2) || bd < .04 || rnd() < Math.min(.55, bd * 2.2)) continue;
      pts.push({ p: X(s2, d2, G), w: .4 + .2 * rnd(), dot: rnd() < .12 });
    }
    // the bones: the pelvis a hairline with a point every so often, the long bones rows of points, the spine a
    // column of denser points. In mint, sparingly and only as the pointer passes, the two sites a bone scan
    // reads: the lumbar run of the spine and the femoral necks (points only: a mint hairline would show before the pointer)
    var atNeck = function (s, d) { return s > 1.29 && s < 1.37 && Math.abs(d) > .095; };
    BONES.forEach(function (b, k) { if (!k) edges.push(b.map(function (p) { return X(p[0], p[1], G); })); each(b, k ? .065 : .14, function (s, d) { var q = { p: X(s, d, G), w: .8 }; pts.push(q); if (atNeck(s, d)) mint(q, WN); }); });
    [1, -1].forEach(function (k) { mint({ p: X(1.33, k * .13, G), w: .9 }, WN); });
    each(SPINE, .036, function (s) { var q = { p: X(s, 0, G), w: .95 }; pts.push(q); if (s >= LUMBAR[0] && s <= LUMBAR[1]) mint(q, WL); });
    // above: the outline alone, as a hairline, with a sparse point along it
    var ring = HALF.concat(mir(HALF.slice(0, -1)).reverse());
    edges.push(ring.map(function (p) { return X(p[0], p[1], 2 * G, LIFT); }));
    each(ring, .2, function (s, d) { pts.push({ p: X(s, d, 2 * G), w: .55 + .15 * rnd(), lift: [0, 0, LIFT] }); });
    // two hairlines through the stack, at the crown and past the feet, where the scan starts and ends
    [-.06, 3.06].forEach(function (s) { edges.push([X(s, 0, 0, -LIFT), X(s, 0, 2 * G, LIFT)]); });
    return {
      pts: pts, edges: edges,
      // the scan: crown to feet in the middle layer, a hairline bar spanning the body's width (the scanner's arm)
      scan: { path: [X(-.06, 0, G), X(3.06, 0, G)], metric: 'xyz', radius: .24, plane: [.015, .44] },
      // the raw data: a long, low field lying along the table, not much larger than the body
      cloud: [1.35, .5, .4, G], loose: .34
    };
  }
});
