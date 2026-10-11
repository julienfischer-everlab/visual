/* Hairline V2 · Advanced Blood Testing
 * One narrow sample vessel, its contents a column of fine squares settled into layers. From its
 * base a manifold splits the sample into four thin parallel channels; along each the points sort
 * themselves into their own pattern (a fine single file, a double rail, short ticks of three, a
 * sparse file that thins out), and at each end they stand up as a small ordered matrix. One
 * sample, many signals, structured data. While it holds, the scan pointer leaves the sample at its
 * bright band, runs down to the base, along the manifold past the first mouth and out along the
 * second channel, then climbs that channel's matrix; as it comes down the channel, that one matrix
 * fills in mint, and is whole as the pointer reaches it. No cells, no droplets, no glass.
 */
HL2.def({
  name: 'assay',
  title: 'advanced blood testing',
  build: function (rnd) {
    var pts = [], edges = [], acc = [], i, a, b, u, z;
    // the vessel: a narrow box standing at the origin, filled to F; a fine lattice inside, in layers
    var R = .09, HT = .7, F = .52, G = .045, BAND = .3;
    edges.push([[-R, -R, 0], [R, -R, 0], [R, R, 0], [-R, R, 0], [-R, -R, 0]], [[-R, -R, HT], [R, -R, HT], [R, R, HT], [-R, R, HT], [-R, -R, HT]]);
    edges.push([[-R, R, 0], [-R, R, HT]], [[R, R, 0], [R, R, HT]], [[R, -R, 0], [R, -R, HT]], [[-R, -R, 0], [-R, -R, HT]]);
    edges.push([[-R, R, F + .03, .03], [R, R, F + .03, .03], [R, -R, F + .03, .03]]);   // the fill level, on the two front faces only, rising a touch with the top layer
    for (z = G / 2; z <= F; z += G * .68) for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) {
      var p = [a * G, b * G, z];
      if (z < BAND - .03) { if (rnd() < .85) pts.push({ p: p, w: .5 + .25 * rnd() }); }                        // the dense lower layer
      else if (z < BAND + .03) pts.push({ p: p, w: .95 });                                                       // a thin bright band
      else if (rnd() < .45) pts.push({ p: p, w: .36 + .2 * rnd(), dot: rnd() < .1, lift: [0, 0, .03] });        // the sparse upper layer, parting a little
    }
    for (z = .06; z < HT; z += .06) pts.push({ p: [-R, R, z], w: .34 });   // a graduation up its left edge
    // the manifold: from the vessel's base along x; four channels leave it, parallel, along -y
    var CX = [.3, .62, .94, 1.26], L = .9, MINT = 1;
    edges.push([[R, 0, 0], [CX[3], 0, 0]]);
    for (u = R + .03; u < CX[3]; u += .03) pts.push({ p: [u, (rnd() - .5) * .02, 0], w: .5 + .2 * rnd() });
    CX.forEach(function (x, k) {
      edges.push([[x, 0, 0], [x, -L, 0]]);
      // the points sort as they go, settling into each channel's own pattern: members of a group sit side by side, across it
      var gap = [.03, .05, .085, .045][k], grp = [1, 2, 3, 1][k], j, y;
      for (y = .06; y < L - .04; y += gap) for (j = 0; j < grp; j++) {
        u = y / L; var s = .05 * Math.pow(1 - u, 2);
        if (k === 3 && rnd() < u * .6) continue;    // the last one thins out
        pts.push({ p: [x + (j - (grp - 1) / 2) * .024 + (rnd() - .5) * s, -y + (rnd() - .5) * s, 0], w: .42 + .2 * u + .1 * rnd(), dot: rnd() < .06 });
      }
      for (j = 0; j < 3; j++) { u = rnd() * .3; pts.push({ p: [x + (rnd() - .5) * .07 * (1 - u), -.05 - u * L, 0], w: .36 + .15 * rnd() }); }   // still mixed at the mouth
      // a few signal points travel the channel, one after another, while it holds
      for (i = 0; i < 7; i++) { u = i / 6; var w0 = .04 + .09 * k + .42 * u; pts.push({ p: [x, -.06 - u * (L - .1), 0], w: 1, win: [w0, w0 + .24] }); }
    });
    // at each end, the result: a small ordered matrix standing on a short bar, every cell its own value
    var GS = .05, DIM = [[4, 7], [6, 4], [3, 9], [5, 5]], YE = -L - .015, Z0 = .045;
    CX.forEach(function (x, k) {
      var c = DIM[k][0], r = DIM[k][1], m = k === MINT, x0 = x - c * GS / 2 - .012, x1 = x + c * GS / 2 + .012;
      for (a = 0; a < c; a++) for (b = 0; b < r; b++) {
        var q = [x + (a - (c - 1) / 2) * GS, YE, Z0 + b * GS];
        pts.push({ p: q, w: .5 + .45 * rnd() });                                   // every matrix in white...
        if (m) pts.push({ p: q, w: .8 + .2 * rnd(), acc: true, win: [.55, .98] });  // ...and the one that matters turns mint as the pointer comes
      }
      (m ? acc : edges).push([[x0, YE, .02], [x1, YE, .02]]);   // its foot bar; the mint one's in mint
    });
    var gx = CX[MINT];
    return {
      pts: pts, edges: edges, acc: acc,
      // from the bright band down to the base, out along the mint channel, then up its matrix's rows
      scan: { path: [[0, 0, BAND], [0, 0, 0], [gx, 0, 0], [gx, YE, 0], [gx, YE, Z0 + (DIM[MINT][1] - 1) * GS]], metric: 'xyz', radius: .09 },
      cloud: [.74, .56, .24, .22],   // a low, wide slab of data lying over the channel bed, not a ball
      loose: .34
    };
  }
});
