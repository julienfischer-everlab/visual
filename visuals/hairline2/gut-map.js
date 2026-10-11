/* Hairline V2 · Microbiome & Gut Health Assessment
 * An abstract gut: one continuous hairline ramps gently down onto the floor, folds into five close
 * runs, and ramps out below. Its walls are two rows of points. In and round it live four communities
 * of square points at four densities (sparse, medium, dense, very fine), each a small regular lattice,
 * so it reads as mapped data, not a swarm. While it holds, a few points slide a short way along the
 * channel, and the scan pointer comes down the ramp and along the first run; the community it
 * reaches turns mint, breathes out and fills in. No bacteria, no blobs.
 */
HL2.def({
  name: 'gut-map',
  title: 'microbiome & gut health assessment',
  build: function (rnd) {
    var pts = [], edges = [], PI = Math.PI, i, t;
    // the pathway: five close runs along x, joined by half turns at alternate ends
    var X0 = -.55, X1 = .55, R = .14, Y = [-.56, -.28, 0, .28, .56], WALL = .055;
    var line = [], put = function (x, y, z) { line.push([x, y, z]); };
    function run(k, a, b) { var n = Math.ceil(Math.abs(b - a) / .02); for (var i = 1; i <= n; i++) put(a + (b - a) * i / n, Y[k], 0); }
    function turn(k, side) { var d = side > 0 ? 1 : -1; for (var i = 1; i < 24; i++) { var a = -PI / 2 + d * PI * i / 24; put(side + R * Math.cos(a), Y[k] + R + R * Math.sin(a), 0); } }
    for (i = 0; i <= 20; i++) { t = i / 20; put(X0 - .5 + .4 * t, Y[0], .32 * (1 - t) * (1 - t)); }   // in: a gentle ramp down onto the floor
    run(0, X0 - .1, X1); turn(0, X1);
    var scanEnd = line.length + 6;                                 // the scan comes this far: down the ramp, along the first run, round the turn
    run(1, X1, X0); turn(1, X0); run(2, X0, X1); turn(2, X1); run(3, X1, X0); turn(3, X0); run(4, X0, X1 + .1);
    for (i = 1; i <= 12; i++) { t = i / 12; put(X1 + .1 + .3 * t, Y[4], -.16 * t * t); }           // out: a gentle ramp down below it
    edges.push(line);
    // the walls: a point either side of the line every so often, and a few that slide along it
    var s = 0, next = 0, slide = .5;
    for (i = 1; i < line.length; i++) {
      var p = line[i], q = line[i - 1], dx = p[0] - q[0], dy = p[1] - q[1], dl = Math.hypot(dx, dy);
      s += Math.hypot(dx, dy, p[2] - q[2]); if (s < next) continue; next = s + .08;
      var nx = -dy / dl * WALL, ny = dx / dl * WALL;
      pts.push({ p: [p[0] + nx, p[1] + ny, p[2]], w: .3 + .14 * rnd() }, { p: [p[0] - nx, p[1] - ny, p[2]], w: .3 + .14 * rnd() });
      if (s > slide) { slide = s + .3 + .12 * rnd(); var g = .06 + .05 * rnd(); pts.push({ p: p.slice(), w: .8, lift: [dx / dl * g, dy / dl * g, 0] }); }
    }
    // how far a spot on the floor is from a wall, so the communities keep clear of the walls
    function gap(x, y) { var m = 9; for (var i = 0; i < line.length; i += 2) if (Math.abs(line[i][2]) < .01) m = Math.min(m, Math.hypot(x - line[i][0], y - line[i][1])); return Math.abs(m - WALL); }
    // a community: a patch of its own lattice, thinning at the rim. c = [x, y, rx, ry, pitch, fill, w, dots]
    function patch(c, o) {
      for (var gx = c[0] - c[2]; gx <= c[0] + c[2] + 1e-9; gx += c[4]) for (var gy = c[1] - c[3]; gy <= c[1] + c[3] + 1e-9; gy += c[4]) {
        var u = (gx - c[0]) / c[2], v = (gy - c[1]) / c[3], e = u * u + v * v;
        if (e > 1 || rnd() > c[5] * (1 - .3 * e * e) || gap(gx, gy) < .025) continue;
        var pt = { p: [gx, gy, 0], w: c[6] + .12 * rnd(), dot: rnd() < c[7] };
        if (o) { if (o.acc) pt.acc = true; pt.lift = [u * o.lift, v * o.lift, .012]; if (o.win) pt.win = o.win; }
        pts.push(pt);
      }
    }
    patch([-.3, -.4, .32, .24, .09, 1, .8, 0]);         // sparse, at the back
    patch([-.28, .06, .26, .18, .042, .95, .6, 0]);      // dense, in the middle folds
    patch([.25, .42, .32, .17, .036, .92, .72, 1]);      // very fine, at the front: a dot matrix
    var B = [.25, -.56, .26, .15];                        // medium, on the first run: the one the scan reveals
    patch(B.concat([.052, .95, .5, 0]), { lift: .05 });                                         // white, until...
    patch(B.concat([.052, 1, .9, 0]), { lift: .05, acc: true, win: [.44, .98] });                // ...the pointer reaches it: mint
    patch([B[0] + .026, B[1] + .026, B[2], B[3], .052, .85, .9, 0], { lift: .05, acc: true, win: [.52, .98] });   // and its lattice fills in
    // the box, implied: its floor outline only
    edges.push([[-.85, -.76, -.01], [.85, -.76, -.01], [.85, .76, -.01], [-.85, .76, -.01], [-.85, -.76, -.01]]);
    return {
      pts: pts, edges: edges, acc: [],
      scan: { path: line.slice(0, scanEnd), metric: 'xyz', radius: .13 },
      cloud: [.95, .8, .3, .08], loose: .34
    };
  }
});
