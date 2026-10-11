/* Hairline V2 · Whole Body MRI & CT Chest
 * An abstract standing body, drawn as horizontal contour rings of points, cut by five thin
 * diagnostic planes (head, chest, abdomen, thighs, shins), each a sparse field of squares.
 * While it holds, one slightly larger scan plane travels head to feet and lights what it
 * passes; as it reaches the chest, that plane briefly gathers a few mint points (the CT).
 * No skeleton, no organs, no machine.
 */
HL2.def({
  name: 'body-scan',
  title: 'Whole Body MRI & CT Chest',
  build: function (rnd) {
    var pts = [], edges = [], acc = [], TAU = Math.PI * 2;
    // the body's section at a height [z, half-width, half-depth]; the legs keep their own taper up to the crotch (1.28)
    var prof = [[0, .05, .045], [.45, .068, .06], [.95, .09, .08], [1.28, .11, .1], [1.3, .25, .14], [1.45, .245, .14], [1.72, .2, .12], [2.0, .25, .14], [2.28, .29, .15], [2.4, .33, .13], [2.48, .22, .1], [2.56, .065, .06], [2.64, .065, .06], [2.72, .12, .12], [2.84, .135, .13], [2.95, .1, .1], [3.0, .03, .03]];
    function sec(z) { for (var i = 1; i < prof.length; i++) if (z <= prof[i][0]) { var a = prof[i - 1], b = prof[i], t = (z - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; } return [.03, .03]; }
    function rings(z) {   // [cx, cy, rx, ry] for each closed outline at this height
      var s = sec(z);
      if (z < 1.3) return [[-.145, 0, s[0], s[1]], [.145, 0, s[0], s[1]]];   // two legs, a clear gap between the thighs
      var out = [[0, 0, s[0], s[1]]];
      // the arms hang slightly out (an A-pose), so they never merge into the torso
      if (z > 1.36 && z < 2.34) { var k = (z - 1.36) / .98; out.push([-.47 + .07 * k, 0, .042, .042], [.47 - .07 * k, 0, .042, .042]); }
      return out;
    }
    // the body faces the viewer: its width runs along the screen (world x - y), its depth along x + y
    var Q = Math.SQRT1_2, W = function (l, d, z) { return [(l + d) * Q, (d - l) * Q, z]; };
    function ring(r, z, step) { var c = 2 * Math.PI * Math.sqrt((r[2] * r[2] + r[3] * r[3]) / 2), n = Math.max(6, Math.round(c / step)), o = [], i; for (i = 0; i < n; i++) { var a = i / n * TAU; o.push(W(r[0] + Math.cos(a) * r[2], r[1] + Math.sin(a) * r[3], z)); } return o; }
    // the contour rings, as points: bright at the silhouette's sides, dim behind
    for (var z = .06; z <= 2.97; z += .15) rings(z).forEach(function (r) { ring(r, z, .085).forEach(function (p) { var side = Math.abs((p[0] - p[1]) * Q - r[0]) / (r[2] || 1); pts.push({ p: p, w: .38 + .38 * side + .12 * rnd(), dot: rnd() < .08 }); }); });
    // five small diagnostic planes at fixed heights, each a sparse field of points, denser where the body crosses it
    var PL = [2.8, 2.25, 1.65, 1.0, .35], H = .42, G = .125;
    PL.forEach(function (pz) {
      edges.push([[-H, -H, pz], [H, -H, pz], [H, H, pz], [-H, H, pz], [-H, -H, pz]]);
      for (var gx = -H + G / 2; gx < H; gx += G) for (var gy = -H + G / 2; gy < H; gy += G) {
        var bl = (gx - gy) * Q, bd = (gx + gy) * Q, inside = rings(pz).some(function (r) { var u = (bl - r[0]) / (r[2] + .03), v = (bd - r[1]) / (r[3] + .03); return u * u + v * v <= 1; });
        if (rnd() < (inside ? .9 : .24)) pts.push({ p: [gx + (rnd() - .5) * .02, gy + (rnd() - .5) * .02, pz], w: inside ? .78 : .34 + .14 * rnd() });
      }
      // where the body crosses the plane: its outline, as a hairline
      rings(pz).forEach(function (r) { var o = ring(r, pz, .05); o.push(o[0]); edges.push(o); });
    });
    // the chest (the CT): a thin scatter of mint on the chest plane, there only while the scan passes it
    var cz = 2.25;
    for (var x = -.27; x <= .27; x += .06) for (var y = -.13; y <= .13; y += .055) {
      var u = x / .28, v = y / .14; if (u * u + v * v > 1 || rnd() < .2) continue;
      pts.push({ p: W(x + (rnd() - .5) * .02, y, cz + .012), w: .9, acc: true, win: [.28, .66] });
    }
    var ac = ring([0, 0, .31, .165], cz, .04); ac.push(ac[0]); acc.push(ac);
    return {
      pts: pts, edges: edges, acc: acc,
      // the scan plane is a little larger than the fixed ones, so it reads as the one that moves
      scan: { path: [[0, 0, 3.02], [0, 0, .02]], metric: 'z', radius: .1, plane: [.5, .5] },
      cloud: [.7, .7, 1.6, 1.5],   // a compact volume round the body, not a pillar
      loose: .34
    };
  }
});
