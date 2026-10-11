/* Hairline V2 · Advanced Blood Testing
 * One narrow sample vessel, its contents a column of fine squares settled into layers. From its
 * base a manifold splits the sample into four thin parallel channels; along each, the points run
 * in a different pattern and density, and at each end they resolve into a small ordered matrix.
 * One sample, many signals, structured data. While it holds, the scan pointer runs down the
 * sample, along the manifold past each channel's mouth and out along the third channel to its
 * matrix, the one in mint. No cells, no droplets, no glassware.
 */
HL2.def({
  name: 'assay',
  title: 'advanced blood testing',
  build: function (rnd) {
    var pts = [], edges = [], acc = [];
    // the vessel: a narrow box standing at the origin, filled to F; a fine 3 x 3 lattice inside
    var R = .08, HT = 1.05, F = .74, G = .045, BAND = .43;
    var sq = function (x0, y0, x1, y1, z, lift) { return [[x0, y0, z, lift], [x1, y0, z, lift], [x1, y1, z, lift], [x0, y1, z, lift], [x0, y0, z, lift]]; };
    edges.push(sq(-R, -R, R, R, 0), sq(-R, -R, R, R, HT), [[-R, R, 0], [-R, R, HT]], [[R, R, 0], [R, R, HT]], [[R, -R, 0], [R, -R, HT]], [[-R, -R, 0], [-R, -R, HT]]);
    edges.push(sq(-R, -R, R, R, F + .03, .03));   // the fill level, rising a touch with the top layer
    for (var z = G / 2; z <= F; z += G * .9) for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) {
      var p = [i * G, j * G, z];
      if (z < BAND - .03) pts.push({ p: p, w: .55 + .25 * rnd() });                                 // the dense lower layer
      else if (z < BAND + .03) pts.push({ p: p, w: .95 });                                           // a thin bright band
      else if (rnd() < .5) pts.push({ p: p, w: .36 + .2 * rnd(), dot: rnd() < .1, lift: [0, 0, .03] });   // the sparse upper layer, parting slightly
    }
    // the manifold: from the vessel's base along x; four channels leave it, parallel, along -y
    var CX = [.3, .52, .74, .96], L = 1.0, MINT = 2;
    edges.push([[R, 0, 0], [CX[3], 0, 0]]);
    CX.forEach(function (x, k) {
      edges.push([[x, 0, 0], [x, -L, 0]]);
      // each channel carries the sample differently: singles, pairs, triplets, a thinning stream
      var on = function (y, w) { pts.push({ p: [x, -y, 0], w: w }); };
      var y;
      if (k === 0) for (y = .1; y < L; y += .09) on(y, .5);
      if (k === 1) for (y = .1; y < L; y += .15) { on(y, .55); on(y + .03, .45); }
      if (k === 2) for (y = .12; y < L; y += .17) { on(y, .5); on(y + .025, .6); on(y + .05, .5); }
      if (k === 3) for (var n = 0; n < 12; n++) on(.08 + (L - .1) * Math.pow(n / 11, 1.7), .5);
      // a few signal points travel the channel, one after another, while it holds
      for (i = 0; i < 6; i++) { var u = i / 5, w0 = .04 + .09 * k + .42 * u; pts.push({ p: [x, -.06 - u * (L - .1), 0], w: 1, win: [w0, w0 + .24] }); }
    });
    // at each end, the result: a small ordered matrix, every cell its own value
    var GS = .05, DIM = [[4, 4], [3, 5], [3, 6], [4, 3]];
    CX.forEach(function (x, k) {
      var c = DIM[k][0], r = DIM[k][1], y0 = -L - .08, m = k === MINT;
      for (var a = 0; a < c; a++) for (var b = 0; b < r; b++) pts.push({ p: [x + (a - (c - 1) / 2) * GS, y0 - b * GS, 0], w: m ? .72 + .28 * rnd() : .4 + .5 * rnd(), acc: m });
      if (m) acc.push(sq(x - c * GS / 2 - .02, y0 + GS / 2 + .02, x + c * GS / 2 + .02, y0 - (r - .5) * GS - .02, 0));
    });
    var gx = CX[MINT];
    return {
      pts: pts, edges: edges, acc: acc,
      scan: { path: [[0, 0, F], [0, 0, 0], [gx, 0, 0], [gx, -L - .08 - 5 * GS, 0]], metric: 'xyz', radius: .09 },
      loose: .35
    };
  }
});
