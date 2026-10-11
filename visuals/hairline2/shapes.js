/* The particle shapes, per page (gut: microbes; path: blood; dexa: bone; wbmri: scans; consult: the plan): point clouds in a unit box, read onto a grid by swarm.js. Drawn by agents and checked by rendering; pure functions. */
/* ---- gut ---- */
(function () {
  const R = (window.DBSHAPES = window.DBSHAPES || {});

  /* ---------- shared helpers (pure; randomness only via rnd) ---------- */

  var TAU = Math.PI * 2;

  function mk(N) {
    return { p: new Float32Array(2 * N), a: new Float32Array(N), i: 0, N: N };
  }
  function put(o, x, y, b) {
    if (o.i >= o.N) return;
    var k = o.i++;
    o.p[2 * k] = x;
    o.p[2 * k + 1] = y;
    o.a[k] = b < 0.05 ? 0.05 : b > 1 ? 1 : b;
  }
  // approx. unit gaussian
  function gs(rnd) {
    return (rnd() + rnd() + rnd() - 1.5) * 2;
  }
  // split `total` integer units across weights (largest remainder)
  function alloc(W, total) {
    var S = 0, k, n = W.length, c = new Array(n), rem = new Array(n), used = 0;
    for (k = 0; k < n; k++) S += W[k] > 0 ? W[k] : 0;
    for (k = 0; k < n; k++) {
      var v = S > 0 && W[k] > 0 ? (W[k] / S) * total : 0;
      c[k] = Math.floor(v);
      rem[k] = v - c[k];
      used += c[k];
    }
    var left = total - used;
    if (left > 0) {
      var idx = [];
      for (k = 0; k < n; k++) idx.push(k);
      idx.sort(function (i, j) { return rem[j] - rem[i]; });
      for (k = 0; k < left; k++) c[idx[k % n]]++;
    }
    return c;
  }

  // polyline from fn(u) -> [x,y], u in [0,1]
  function poly(fn, n) {
    var P = new Float64Array(2 * (n + 1));
    for (var k = 0; k <= n; k++) {
      var q = fn(k / n);
      P[2 * k] = q[0];
      P[2 * k + 1] = q[1];
    }
    return P;
  }
  function fromArr(arr) {
    var P = new Float64Array(arr.length);
    for (var k = 0; k < arr.length; k++) P[k] = arr[k];
    return P;
  }
  function circle(cx, cy, r, n) {
    return poly(function (u) { return [cx + r * Math.cos(u * TAU), cy + r * Math.sin(u * TAU)]; }, n);
  }
  // closed outline of a tube around centreline polyline C with radius r (rounded caps)
  function tube(C, r, capN) {
    var M = C.length / 2, out = [], k, a;
    var nx = new Float64Array(M), ny = new Float64Array(M);
    for (k = 0; k < M; k++) {
      var k0 = k > 0 ? k - 1 : 0, k1 = k < M - 1 ? k + 1 : M - 1;
      var tx = C[2 * k1] - C[2 * k0], ty = C[2 * k1 + 1] - C[2 * k0 + 1];
      var l = Math.hypot(tx, ty) || 1;
      nx[k] = -ty / l;
      ny[k] = tx / l;
    }
    capN = capN || 14;
    for (k = 0; k < M; k++) out.push(C[2 * k] + r * nx[k], C[2 * k + 1] + r * ny[k]);
    // end cap: n -> t -> -n   (t = (ny, -nx) rotated so that t points forward)
    var e = M - 1, tex = ny[e], tey = -nx[e];
    for (k = 1; k < capN; k++) {
      a = (k / capN) * Math.PI;
      out.push(C[2 * e] + r * (nx[e] * Math.cos(a) + tex * Math.sin(a)), C[2 * e + 1] + r * (ny[e] * Math.cos(a) + tey * Math.sin(a)));
    }
    for (k = M - 1; k >= 0; k--) out.push(C[2 * k] - r * nx[k], C[2 * k + 1] - r * ny[k]);
    var tsx = ny[0], tsy = -nx[0];
    for (k = 1; k < capN; k++) {
      a = (k / capN) * Math.PI;
      out.push(C[0] + r * (-nx[0] * Math.cos(a) - tsx * Math.sin(a)), C[1] + r * (-ny[0] * Math.cos(a) - tsy * Math.sin(a)));
    }
    out.push(out[0], out[1]);
    return fromArr(out);
  }
  function xform(P, cx, cy, ang, s) {
    var c = Math.cos(ang) * (s || 1), sn = Math.sin(ang) * (s || 1);
    for (var k = 0; k < P.length; k += 2) {
      var x = P[k], y = P[k + 1];
      P[k] = cx + c * x - sn * y;
      P[k + 1] = cy + sn * x + c * y;
    }
    return P;
  }
  // straight-ish wavy filament: start (x,y), heading h, length len, bend k (rad/unit),
  // wavelength lam, amplitude amp, phase ph
  function filament(x, y, h, len, bend, lam, amp, ph, n) {
    n = n || 120;
    var pts = [], ds = len / n, px = x, py = y, hh = h;
    for (var k = 0; k <= n; k++) {
      var s = k * ds;
      var env = Math.min(1, s / (lam * 0.6)) * (1 - 0.25 * (s / len));
      var w = amp * env * Math.sin((TAU * s) / lam + ph);
      pts.push(px - Math.sin(hh) * w, py + Math.cos(hh) * w);
      px += Math.cos(hh) * ds;
      py += Math.sin(hh) * ds;
      hh += bend * ds;
    }
    return fromArr(pts);
  }
  // runs of a closed parametric outline that are not hidden
  function visibleRuns(fn, n, hidden) {
    var X = new Float64Array(n), Y = new Float64Array(n), V = new Uint8Array(n), k, nv = 0;
    for (k = 0; k < n; k++) {
      var q = fn(k / n);
      X[k] = q[0];
      Y[k] = q[1];
      if (!hidden(q[0], q[1])) { V[k] = 1; nv++; }
    }
    if (!nv) return [];
    var P;
    if (nv === n) {
      P = new Float64Array(2 * (n + 1));
      for (k = 0; k <= n; k++) { P[2 * k] = X[k % n]; P[2 * k + 1] = Y[k % n]; }
      return [P];
    }
    var st = 0;
    while (V[st]) st++; // first hidden sample
    var runs = [], r0 = -1;
    for (var m = 1; m <= n + 1; m++) {
      var vis = m <= n && V[(st + m) % n];
      if (vis && r0 < 0) r0 = m;
      if (!vis && r0 >= 0) {
        var len = m - r0;
        if (len >= 2) {
          P = new Float64Array(2 * len);
          for (k = 0; k < len; k++) {
            var id = (st + r0 + k) % n;
            P[2 * k] = X[id];
            P[2 * k + 1] = Y[id];
          }
          runs.push(P);
        }
        r0 = -1;
      }
    }
    return runs;
  }

  /* Sample `count` points along strokes, proportional to length * w.
     stroke: { pts, w, b (number | fn(u,x,y)), j (iso jitter), off (normal offset),
               io (inward offset for closed curves; negative = outward), oj (gauss normal jitter),
               ou (uniform normal spread), bv (brightness variation) } */
  function strokes(o, rnd, list, count) {
    if (count <= 0 || !list.length) return;
    var W = new Array(list.length), si, k, s;
    for (si = 0; si < list.length; si++) {
      s = list[si];
      var P = s.pts, n = P.length / 2, seg = new Float64Array(Math.max(1, n - 1)), L = 0;
      for (k = 0; k < n - 1; k++) {
        var d = Math.hypot(P[2 * k + 2] - P[2 * k], P[2 * k + 3] - P[2 * k + 1]);
        seg[k] = d;
        L += d;
      }
      s._seg = seg;
      s._L = L;
      s._sg = 1;
      if (s.io) {
        var A = 0;
        for (k = 0; k < n - 1; k++) A += P[2 * k] * P[2 * k + 3] - P[2 * k + 2] * P[2 * k + 1];
        s._sg = A >= 0 ? 1 : -1;
      }
      W[si] = L * (s.w == null ? 1 : s.w);
    }
    var cnt = alloc(W, count);
    for (si = 0; si < list.length; si++) {
      s = list[si];
      var nn = cnt[si];
      if (!nn) continue;
      var Q = s.pts, sg = s._seg, ns = sg.length, acc = 0, kk = 0;
      for (var m = 0; m < nn; m++) {
        var t = ((m + 0.5 + (rnd() - 0.5) * 0.8) / nn) * s._L;
        while (kk < ns - 1 && acc + sg[kk] < t) {
          acc += sg[kk];
          kk++;
        }
        var sl = sg[kk] || 1e-9, f = (t - acc) / sl;
        if (f < 0) f = 0;
        if (f > 1) f = 1;
        var dx = Q[2 * kk + 2] - Q[2 * kk], dy = Q[2 * kk + 3] - Q[2 * kk + 1];
        if (!(sl > 1e-9)) { dx = 0; dy = 0; sl = 1; }
        var x = Q[2 * kk] + f * dx, y = Q[2 * kk + 1] + f * dy, nx = -dy / sl, ny = dx / sl;
        var off = s.off || 0;
        if (s.io) off += s.io * s._sg;
        if (s.oj) off += gs(rnd) * s.oj;
        if (s.ou) off += (rnd() * 2 - 1) * s.ou;
        x += nx * off;
        y += ny * off;
        if (s.j) {
          x += gs(rnd) * s.j;
          y += gs(rnd) * s.j;
        }
        var u = s._L > 0 ? t / s._L : 0;
        var b = typeof s.b === 'function' ? s.b(u, x, y) : s.b;
        b += (rnd() - 0.5) * (s.bv == null ? 0.08 : s.bv);
        put(o, x, y, b);
      }
    }
  }

  /* Even stipple of `count` points inside a region (jittered grid, optional weight). */
  function area(o, rnd, inside, bb, count, bfn, wfn) {
    if (count <= 0) return;
    var x0 = bb[0], y0 = bb[1], x1 = bb[2], y1 = bb[3], G = 14, hit = 0, gx, gy, k;
    for (gy = 0; gy < G; gy++)
      for (gx = 0; gx < G; gx++)
        if (inside(x0 + ((gx + 0.5) * (x1 - x0)) / G, y0 + ((gy + 0.5) * (y1 - y0)) / G)) hit++;
    var A = (((x1 - x0) * (y1 - y0)) * Math.max(hit, 0.5)) / (G * G);
    var h = Math.sqrt(A / (count * 1.5));
    var nx = Math.max(1, Math.min(400, Math.ceil((x1 - x0) / h))), ny = Math.max(1, Math.min(400, Math.ceil((y1 - y0) / h)));
    var hx = (x1 - x0) / nx, hy = (y1 - y0) / ny;
    var CX = [], CY = [], KEY = [];
    for (gy = 0; gy < ny; gy++)
      for (gx = 0; gx < nx; gx++) {
        var cx = x0 + (gx + 0.5) * hx, cy = y0 + (gy + 0.5) * hy;
        if (inside(cx, cy)) {
          var w = wfn ? wfn(cx, cy) : 1;
          CX.push(cx);
          CY.push(cy);
          KEY.push(w > 0 ? Math.pow(rnd(), 1 / w) : -rnd());
        }
      }
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    if (!CX.length) {
      for (k = 0; k < count; k++) put(o, mx + gs(rnd) * 0.01, my + gs(rnd) * 0.01, bfn(mx, my));
      return;
    }
    var idx = new Array(CX.length);
    for (k = 0; k < idx.length; k++) idx[k] = k;
    idx.sort(function (i, j) { return KEY[j] - KEY[i]; });
    for (k = 0; k < count; k++) {
      var c = idx[k % idx.length], px = CX[c], py = CY[c];
      for (var tr = 0; tr < 4; tr++) {
        var qx = CX[c] + (rnd() - 0.5) * hx, qy = CY[c] + (rnd() - 0.5) * hy;
        if (inside(qx, qy)) { px = qx; py = qy; break; }
      }
      put(o, px, py, bfn(px, py) + (rnd() - 0.5) * 0.08);
    }
  }

  /* rotate everything, then centre the bounding box and scale the larger side to 2*target */
  function fit(o, ang, target) {
    var c = Math.cos(ang || 0), s = Math.sin(ang || 0), k, n = o.i;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (k = 0; k < n; k++) {
      var x = o.p[2 * k], y = o.p[2 * k + 1];
      var X = c * x - s * y, Y = s * x + c * y;
      o.p[2 * k] = X;
      o.p[2 * k + 1] = Y;
      if (X < x0) x0 = X; if (X > x1) x1 = X;
      if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
    }
    var sc = (2 * target) / Math.max(x1 - x0, y1 - y0, 1e-6), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    for (k = 0; k < n; k++) {
      var px = (o.p[2 * k] - mx) * sc, py = (o.p[2 * k + 1] - my) * sc;
      o.p[2 * k] = px < -1 ? -1 : px > 1 ? 1 : px;
      o.p[2 * k + 1] = py < -1 ? -1 : py > 1 ? 1 : py;
    }
  }
  // any slot left unfilled (should not happen) gets a copy of a placed dot
  function finish(o, rnd) {
    var placed = o.i;
    while (o.i < o.N) {
      var src = placed > 0 ? Math.floor(rnd() * placed) : 0;
      put(o, o.p[2 * src] + gs(rnd) * 0.004, o.p[2 * src + 1] + gs(rnd) * 0.004, placed > 0 ? o.a[src] : 0.5);
    }
    return { p: o.p, a: o.a };
  }

  // light from upper-left, used for gentle sphere shading
  var LX = -0.55, LY = -0.62, LZ = 0.56;
  function lambert(dx, dy, r) {
    var ux = dx / r, uy = dy / r, d2 = ux * ux + uy * uy;
    var uz = d2 < 1 ? Math.sqrt(1 - d2) : 0;
    var v = ux * LX + uy * LY + uz * LZ;
    return v > 0 ? v : 0;
  }

  /* ---------- 1. bacillus with trailing flagella ---------- */
  function bacillus(N, rnd) {
    var o = mk(N);
    var L = 0.34, r = 0.205;
    var B = alloc([0.28, 0.11, 0.075, 0, 0.33, 0], N);
    var C = fromArr([-L, 0, -L / 2, 0, 0, 0, L / 2, 0, L, 0]);
    var body = tube(C, r, 40);
    strokes(o, rnd, [{ pts: body, b: function (u, x, y) { return 0.86 + 0.12 * (-(y / r) * 0.6 - (x / (L + r)) * 0.3); }, j: 0.0035 }], B[0]);
    strokes(o, rnd, [{ pts: body, io: 0.034, b: 0.55, j: 0.004 }], B[1]);
    // nucleoid: loose coiled thread along the axis
    var nuc = poly(function (u) {
      var env = Math.pow(Math.sin(Math.PI * u), 0.6);
      var w = TAU * 6.5 * u;
      return [-0.27 + 0.54 * u + 0.028 * Math.cos(w) * env, 0.052 * Math.sin(w) * env + 0.028 * Math.sin(TAU * 1.3 * u + 0.8)];
    }, 360);
    strokes(o, rnd, [{ pts: nuc, b: 0.58, j: 0.005 }], B[2]);
    // cytoplasm texture
    var rin = r - 0.055;
    area(o, rnd, function (x, y) {
      var cx = x < -L ? -L : x > L ? L : x;
      return Math.hypot(x - cx, y) < rin;
    }, [-L - rin, -rin, L + rin, rin], B[3], function () { return 0.27; });
    // flagella from the rear pole (+x)
    // [angle on pole, length, bend, phase, wavelength, amplitude]
    var spec = [
      [-0.66, 0.96, -0.12, 0.0, 0.23, 0.046],
      [-0.25, 1.14, 0.42, 2.2, 0.27, 0.056],
      [0.18, 1.06, -0.32, 0.9, 0.25, 0.05],
      [0.62, 0.86, 0.12, 3.9, 0.22, 0.044]
    ];
    var fl = [];
    for (var k = 0; k < spec.length; k++) {
      var ps = spec[k][0];
      var sx = L + r * Math.cos(ps) * 0.96, sy = r * Math.sin(ps) * 0.96;
      fl.push({
        pts: filament(sx, sy, ps * 0.6, spec[k][1], spec[k][2], spec[k][4], spec[k][5], spec[k][3], 160),
        b: function (u) { return 0.84 - 0.34 * u; },
        j: 0.0035
      });
    }
    strokes(o, rnd, fl, B[4]);
    // faint halo just outside the membrane
    strokes(o, rnd, [{ pts: body, io: -0.06, oj: 0.022, b: 0.15, j: 0.006, bv: 0.06 }], B[5]);
    fit(o, 0.5, 0.9);
    return finish(o, rnd);
  }

  /* ---------- 2. staphylococcus: grape-like cluster ---------- */
  function staphylococcus(N, rnd) {
    var o = mk(N);
    // x, y, r, depth (bigger = nearer)
    var S = [
      [-0.3, -0.53, 0.24, 0.25],
      [0.17, -0.5, 0.25, 0.5],
      [-0.6, -0.12, 0.235, 0.3],
      [-0.13, -0.12, 0.27, 0.95],
      [0.35, -0.07, 0.24, 0.4],
      [-0.4, 0.31, 0.25, 0.65],
      [0.09, 0.33, 0.265, 0.8],
      [0.54, 0.34, 0.22, 0.15],
      [-0.1, 0.69, 0.23, 0.45]
    ];
    var n = S.length, i, j;
    // spheres in front of each sphere that overlap it
    var FR = [];
    for (i = 0; i < n; i++) {
      FR.push([]);
      for (j = 0; j < n; j++)
        if (j !== i && S[j][3] > S[i][3] && Math.hypot(S[i][0] - S[j][0], S[i][1] - S[j][1]) < S[i][2] + S[j][2]) FR[i].push(S[j]);
    }
    function hiddenBy(i, x, y, m) {
      var F = FR[i];
      for (var q = 0; q < F.length; q++) {
        var dx = x - F[q][0], dy = y - F[q][1], rr = F[q][2] - m;
        if (dx * dx + dy * dy < rr * rr) return true;
      }
      return false;
    }
    function ring(cx, cy, r) {
      return function (u) { return [cx + r * Math.cos(u * TAU), cy + r * Math.sin(u * TAU)]; };
    }
    var B = alloc([0.37, 0.09, 0, 0.05, 0], N);
    var outl = [], inner = [], halo = [];
    for (i = 0; i < n; i++) {
      (function (i) {
        var cx = S[i][0], cy = S[i][1], r = S[i][2], dm = 0.8 + 0.2 * S[i][3];
        var bfn = function (u, x, y) { return (0.8 + 0.2 * lambert(x - cx, y - cy, r) / 0.9) * dm; };
        var runs = visibleRuns(ring(cx, cy, r), 160, function (x, y) { return hiddenBy(i, x, y, 0.004); });
        for (var q = 0; q < runs.length; q++) outl.push({ pts: runs[q], b: bfn, j: 0.0035 });
        var ri = r - 0.034;
        runs = visibleRuns(ring(cx, cy, ri), 110, function (x, y) { return hiddenBy(i, x, y, -0.03); });
        for (q = 0; q < runs.length; q++) inner.push({ pts: runs[q], b: 0.5 * dm, j: 0.004 });
        var rh = r + 0.05;
        runs = visibleRuns(ring(cx, cy, rh), 90, function (x, y) {
          for (var j = 0; j < n; j++) {
            if (j === i) continue;
            var dx = x - S[j][0], dy = y - S[j][1], rr = S[j][2] + 0.05;
            if (dx * dx + dy * dy < rr * rr) return true;
          }
          return false;
        });
        for (q = 0; q < runs.length; q++) halo.push({ pts: runs[q], oj: 0.024, j: 0.006, b: 0.14, bv: 0.06 });
      })(i);
    }
    strokes(o, rnd, outl, B[0]);
    strokes(o, rnd, inner, B[1]);
    strokes(o, rnd, halo, B[4]);
    // interior stipple, denser and brighter on the lit side
    var vis = new Array(n);
    for (i = 0; i < n; i++) {
      var c = 0, cx = S[i][0], cy = S[i][1], r = S[i][2];
      for (j = 0; j < 36; j++) {
        var px = cx + (((j % 6) + 0.5) / 6 - 0.5) * 2 * r, py = cy + ((Math.floor(j / 6) + 0.5) / 6 - 0.5) * 2 * r;
        if (Math.hypot(px - cx, py - cy) < r && !hiddenBy(i, px, py, -0.02)) c++;
      }
      vis[i] = c * r * r * (0.85 + 0.15 * S[i][3]);
    }
    var ci = alloc(vis, B[2]);
    for (i = 0; i < n; i++) {
      (function (i) {
        var cx = S[i][0], cy = S[i][1], r = S[i][2], rr = r - 0.06, dm = 0.85 + 0.15 * S[i][3];
        area(o, rnd, function (x, y) {
          var dx = x - cx, dy = y - cy;
          return dx * dx + dy * dy < rr * rr && !hiddenBy(i, x, y, -0.04);
        }, [cx - rr, cy - rr, cx + rr, cy + rr], ci[i], function (x, y) {
          return (0.2 + 0.28 * lambert(x - cx, y - cy, r)) * dm;
        }, function (x, y) {
          return 0.25 + lambert(x - cx, y - cy, r);
        });
      })(i);
    }
    // division band on two cells: near half of a tilted equator
    var sep = [];
    [[3, 0.5, 0.32], [6, -1.0, 0.28]].forEach(function (d) {
      var s = S[d[0]], a = d[1], tilt = d[2], rr = s[2] - 0.022;
      var ux = Math.cos(a), uy = Math.sin(a), vx = -uy * tilt, vy = ux * tilt;
      sep.push({
        pts: poly(function (u) {
          var t = Math.PI * (0.04 + 0.92 * u);
          return [s[0] + rr * (Math.cos(t) * ux + Math.sin(t) * vx), s[1] + rr * (Math.cos(t) * uy + Math.sin(t) * vy)];
        }, 40),
        b: 0.45,
        j: 0.004
      });
    });
    strokes(o, rnd, sep, B[3]);
    fit(o, 0, 0.9);
    return finish(o, rnd);
  }

  /* ---------- 3. spirillum: helical rod with polar tufts ---------- */
  function spirillum(N, rnd) {
    var o = mk(N);
    var X = 0.82, waves = 2.5, w = (TAU * waves) / (2 * X), A = 0.125, r = 0.058, ph = Math.PI / 2;
    var M = 220;
    var C = poly(function (u) {
      var x = -X + 2 * X * u;
      return [x, A * Math.sin(w * x + ph)];
    }, M);
    var body = tube(C, r, 16);
    var zf = function (x) { return Math.cos(w * x + ph); };
    var B = alloc([0.34, 0.1, 0, 0.3, 0], N);
    strokes(o, rnd, [{ pts: body, b: function (u, x) { return 0.8 + 0.18 * zf(x); }, j: 0.003 }], B[0]);
    strokes(o, rnd, [{ pts: body, io: 0.02, b: function (u, x) { return 0.45 + 0.15 * zf(x); }, j: 0.003 }], B[1]);
    strokes(o, rnd, [{ pts: C, ou: r - 0.03, b: function (u, x) { return 0.27 + 0.1 * zf(x); }, j: 0.004 }], B[2]);
    // tufts at both poles
    var fl = [];
    var ends = [
      { k: M, dir: 1 },
      { k: 0, dir: -1 }
    ];
    ends.forEach(function (e, ei) {
      var k0 = e.k, k1 = e.dir > 0 ? M - 3 : 3;
      var ex = C[2 * k0], ey = C[2 * k0 + 1];
      var h = Math.atan2(ey - C[2 * k1 + 1], ex - C[2 * k1]);
      var spread = [-0.75, -0.38, 0, 0.36, 0.72];
      var lens = [0.36, 0.44, 0.48, 0.42, 0.34];
      for (var q = 0; q < spread.length; q++) {
        var a0 = h + spread[q] * 0.9;
        var sx = ex + Math.cos(h + spread[q] * 1.4) * r * 0.9, sy = ey + Math.sin(h + spread[q] * 1.4) * r * 0.9;
        fl.push({
          pts: filament(sx, sy, a0, lens[q], spread[q] * 0.8, 0.15, 0.024, q * 1.3 + ei * 2, 90),
          b: function (u) { return 0.78 - 0.3 * u; },
          j: 0.003
        });
      }
    });
    strokes(o, rnd, fl, B[3]);
    strokes(o, rnd, [{ pts: body, io: -0.045, oj: 0.018, b: 0.14, j: 0.005, bv: 0.06 }], B[4]);
    fit(o, 0.42, 0.9);
    return finish(o, rnd);
  }

  /* ---------- 4. streptococcus: curved chain of cocci ---------- */
  function streptococcus(N, rnd) {
    var o = mk(N);
    var nC = 7, rx = 0.15, ry = 0.132;
    // pairs sit closer (fresh division) than the joins between pairs
    var gaps = [0.268, 0.292, 0.268, 0.292, 0.268, 0.292];
    var k, cells = [];
    // walk a wavy, bending path: starts heading right along the top, bends down
    var x = 0, y = 0, h = -0.32, ds = 0.004, sTot = 0, gi = 0;
    for (k = 0; k < gaps.length; k++) sTot += gaps[k];
    cells.push({ x: x, y: y });
    for (var s = 0; s < sTot + 1e-6 && cells.length < nC; s += ds) {
      var kap = 1.05 + 0.75 * Math.sin((TAU * s) / sTot + 0.4);
      h += kap * ds;
      x += Math.cos(h) * ds;
      y += Math.sin(h) * ds;
      var d = Math.hypot(x - cells[cells.length - 1].x, y - cells[cells.length - 1].y);
      if (d >= gaps[gi]) {
        cells.push({ x: x, y: y });
        gi++;
      }
    }
    while (cells.length < nC) {
      var lc = cells[cells.length - 1];
      cells.push({ x: lc.x + Math.cos(h) * 0.26, y: lc.y + Math.sin(h) * 0.26 });
    }
    // mirror so the chain runs along the top and down the left side (safe from right/bottom crop)
    for (k = 0; k < nC; k++) cells[k].x = -cells[k].x;
    for (k = 0; k < nC; k++) {
      var a = cells[k > 0 ? k - 1 : k], b2 = cells[k < nC - 1 ? k + 1 : k];
      cells[k].ang = Math.atan2(b2.y - a.y, b2.x - a.x);
      cells[k].cs = Math.cos(cells[k].ang);
      cells[k].sn = Math.sin(cells[k].ang);
    }
    function inEll(c, x, y, ex, ey) {
      var dx = x - c.x, dy = y - c.y;
      var u = (dx * c.cs + dy * c.sn) / ex, v = (-dx * c.sn + dy * c.cs) / ey;
      return u * u + v * v < 1;
    }
    function ellFn(c, ex, ey) {
      return function (u) {
        var t = u * TAU, a = ex * Math.cos(t), b = ey * Math.sin(t);
        return [c.x + a * c.cs - b * c.sn, c.y + a * c.sn + b * c.cs];
      };
    }
    function nb(k, m) {
      return function (x, y) {
        return (k > 0 && inEll(cells[k - 1], x, y, rx + m, ry + m)) || (k < nC - 1 && inEll(cells[k + 1], x, y, rx + m, ry + m));
      };
    }
    var Bd = alloc([0.6, 0, 0.16, 0, 0], N);
    var outl = [], inner = [], sep = [], halo = [];
    for (k = 0; k < nC; k++) {
      (function (k) {
        var c = cells[k];
        var bfn = function (u, x, y) { return 0.8 + 0.2 * lambert(x - c.x, y - c.y, ry) / 0.9; };
        var runs = visibleRuns(ellFn(c, rx, ry), 180, nb(k, -0.003));
        for (var q = 0; q < runs.length; q++) outl.push({ pts: runs[q], b: bfn, j: 0.0035 });
        runs = visibleRuns(ellFn(c, rx - 0.03, ry - 0.03), 140, nb(k, 0.03));
        for (q = 0; q < runs.length; q++) inner.push({ pts: runs[q], b: 0.48, j: 0.004 });
        runs = visibleRuns(ellFn(c, rx + 0.05, ry + 0.05), 120, nb(k, 0.05));
        for (q = 0; q < runs.length; q++) halo.push({ pts: runs[q], oj: 0.022, j: 0.006, b: 0.14, bv: 0.06 });
      })(k);
    }
    for (k = 0; k < nC - 1; k++) {
      var A1 = cells[k], A2 = cells[k + 1];
      var dd = Math.hypot(A2.x - A1.x, A2.y - A1.y), half = dd / 2;
      var hh = ry * Math.sqrt(Math.max(0, 1 - (half / rx) * (half / rx))) * 0.95 + 0.004;
      var mx = (A1.x + A2.x) / 2, my = (A1.y + A2.y) / 2, ux = (A2.x - A1.x) / dd, uy = (A2.y - A1.y) / dd;
      var inPair = k % 2 === 0;
      sep.push({ pts: fromArr([mx + uy * hh, my - ux * hh, mx - uy * hh, my + ux * hh]), b: inPair ? 0.5 : 0.72, w: inPair ? 0.8 : 1.2, j: 0.003 });
    }
    strokes(o, rnd, outl, Bd[0]);
    strokes(o, rnd, inner, Bd[1]);
    strokes(o, rnd, sep, Bd[2]);
    strokes(o, rnd, halo, Bd[4]);
    var ci = alloc(cells.map(function () { return 1; }), Bd[3]);
    for (k = 0; k < nC; k++) {
      (function (k) {
        var c = cells[k], m = Math.max(rx, ry) - 0.04;
        var p0 = k > 0 ? cells[k - 1] : null, p1 = k < nC - 1 ? cells[k + 1] : null;
        area(o, rnd, function (x, y) {
          if (!inEll(c, x, y, rx - 0.05, ry - 0.05)) return false;
          var dk = Math.hypot(x - c.x, y - c.y);
          if (p0 && Math.hypot(x - p0.x, y - p0.y) < dk + 0.03) return false;
          if (p1 && Math.hypot(x - p1.x, y - p1.y) < dk + 0.03) return false;
          return true;
        }, [c.x - m, c.y - m, c.x + m, c.y + m], ci[k], function (x, y) {
          return 0.2 + 0.26 * lambert(x - c.x, y - c.y, ry);
        }, function (x, y) {
          return 0.25 + lambert(x - c.x, y - c.y, ry);
        });
      })(k);
    }
    fit(o, 0, 0.9);
    return finish(o, rnd);
  }

  /* ---------- 5. community: mixed microbes in a loose colony ---------- */
  function community(N, rnd) {
    var o = mk(N);
    var Rc = 0.74, items = [];
    var TYPES = ['rod', 'diplo', 'coccus', 'chain', 'vibrio', 'spiral'];
    var TW = [0.34, 0.22, 0.17, 0.1, 0.1, 0.07];
    function pickType() {
      var t = rnd(), acc = 0;
      for (var k = 0; k < TYPES.length; k++) {
        acc += TW[k];
        if (t < acc) return TYPES[k];
      }
      return 'rod';
    }
    function make(type, x, y, ang) {
      var it = { type: type, x: x, y: y, ang: ang, outl: [], innr: [], dim: 0.72 + 0.28 * rnd() };
      var C, r, k;
      if (type === 'rod') {
        var L = 0.06 + 0.035 * rnd();
        r = 0.037 + 0.008 * rnd();
        C = xform(fromArr([-L, 0, 0, 0, L, 0]), x, y, ang);
        it.outl.push(tube(C, r, 12));
        it.innr.push({ pts: C, ou: r * 0.45 });
        it.rad = L + r;
      } else if (type === 'vibrio') {
        r = 0.034;
        var arcR = 0.14, sp = 0.95;
        C = poly(function (u) {
          var t = -sp / 2 + sp * u;
          return [arcR * Math.sin(t), arcR * (1 - Math.cos(t)) - arcR * 0.06];
        }, 24);
        xform(C, x, y, ang);
        it.outl.push(tube(C, r, 12));
        it.innr.push({ pts: C, ou: r * 0.45 });
        it.rad = arcR * Math.sin(sp / 2) + r + 0.01;
      } else if (type === 'spiral') {
        var len = 0.15;
        C = poly(function (u) {
          var t = -len + 2 * len * u;
          return [t, 0.032 * Math.sin((TAU * 2.25 * u) + 0.3)];
        }, 70);
        xform(C, x, y, ang);
        it.outl.push(tube(C, 0.016, 8));
        it.rad = len + 0.04;
        it.spiral = C;
      } else if (type === 'coccus') {
        r = 0.042 + 0.014 * rnd();
        it.outl.push(circle(x, y, r, 40));
        it.innr.push({ pts: circle(x, y, r * 0.45, 20), ou: r * 0.3 });
        it.rad = r;
      } else if (type === 'diplo') {
        r = 0.042 + 0.008 * rnd();
        var dd = r * 0.88, cs = Math.cos(ang), sn = Math.sin(ang);
        var c1x = x - cs * dd, c1y = y - sn * dd, c2x = x + cs * dd, c2y = y + sn * dd;
        it.outl = it.outl.concat(visibleRuns(function (u) { return [c1x + r * Math.cos(u * TAU), c1y + r * Math.sin(u * TAU)]; }, 48, function (px, py) { return Math.hypot(px - c2x, py - c2y) < r - 0.002; }));
        it.outl = it.outl.concat(visibleRuns(function (u) { return [c2x + r * Math.cos(u * TAU), c2y + r * Math.sin(u * TAU)]; }, 48, function (px, py) { return Math.hypot(px - c1x, py - c1y) < r - 0.002; }));
        var hh = Math.sqrt(Math.max(0, r * r - dd * dd)) * 0.9;
        it.sep = fromArr([x - sn * hh, y + cs * hh, x + sn * hh, y - cs * hh]);
        it.innr.push({ pts: fromArr([c1x - cs * r * 0.3, c1y - sn * r * 0.3, c2x + cs * r * 0.3, c2y + sn * r * 0.3]), ou: r * 0.45 });
        it.rad = dd + r;
      } else {
        // short chain of 3-4 small cocci on a gentle curve
        var nn = rnd() < 0.5 ? 3 : 4;
        r = 0.036;
        var g = r * 1.75, cxs = [], cys = [];
        for (k = 0; k < nn; k++) {
          var t2 = (k - (nn - 1) / 2) * g;
          var lx = t2, ly = 0.9 * t2 * t2;
          cxs.push(x + lx * Math.cos(ang) - ly * Math.sin(ang));
          cys.push(y + lx * Math.sin(ang) + ly * Math.cos(ang));
        }
        for (k = 0; k < nn; k++) {
          (function (k) {
            var ccx = cxs[k], ccy = cys[k];
            it.outl = it.outl.concat(visibleRuns(function (u) { return [ccx + r * Math.cos(u * TAU), ccy + r * Math.sin(u * TAU)]; }, 40, function (px, py) {
              return (k > 0 && Math.hypot(px - cxs[k - 1], py - cys[k - 1]) < r - 0.002) || (k < nn - 1 && Math.hypot(px - cxs[k + 1], py - cys[k + 1]) < r - 0.002);
            }));
          })(k);
        }
        it.innr.push({ pts: fromArr([cxs[0], cys[0]].concat(cxs.slice(1).reduce(function (acc, v, i) { return acc.concat([v, cys[i + 1]]); }, []))), ou: r * 0.4 });
        it.rad = ((nn - 1) / 2) * g + r + 0.02;
      }
      return it;
    }
    function fits(x, y, rad) {
      if (Math.hypot(x, y) + rad > Rc + 0.08) return false;
      for (var k = 0; k < items.length; k++) {
        var q = items[k];
        if (Math.hypot(x - q.x, y - q.y) < rad + q.rad + 0.035) return false;
      }
      return true;
    }
    // a few anchor microbes so the telling forms sit upper-left
    var anchors = [
      ['spiral', -0.36, -0.36, -0.5],
      ['diplo', -0.62, 0.0, 1.2],
      ['rod', 0.05, -0.52, 0.35],
      ['chain', -0.12, -0.02, 2.6],
      ['vibrio', 0.38, -0.2, -0.9],
      ['coccus', -0.25, 0.32, 0]
    ];
    anchors.forEach(function (a) { items.push(make(a[0], a[1] * Rc / 0.86, a[2] * Rc / 0.86, a[3])); });
    var target = 27, spirals = 1;
    for (var att = 0; att < 1500 && items.length < target; att++) {
      var rr = Rc * Math.sqrt(rnd()), th = rnd() * TAU;
      if (rnd() > 1 - 0.55 * Math.pow(rr / Rc, 3)) continue;
      var x = rr * Math.cos(th), y = rr * Math.sin(th) * 0.96;
      var type = pickType();
      if (type === 'spiral' && spirals >= 2) type = 'rod';
      var rad = type === 'rod' ? 0.14 : type === 'spiral' ? 0.19 : type === 'chain' ? 0.12 : type === 'vibrio' ? 0.11 : type === 'diplo' ? 0.1 : 0.06;
      if (!fits(x, y, rad)) continue;
      var it = make(type, x, y, rnd() * TAU);
      if (!fits(x, y, it.rad)) continue;
      if (type === 'spiral') spirals++;
      items.push(it);
    }
    var B = alloc([0.66, 0.15, 0.03, 0.04], N);
    var OL = [], IN = [], SP = [];
    items.forEach(function (it) {
      var dim = it.dim;
      it.outl.forEach(function (P) {
        OL.push({ pts: P, b: (it.type === 'spiral' ? 0.95 : 0.9) * dim, j: 0.003, w: it.type === 'spiral' ? 1.15 : 1 });
      });
      it.innr.forEach(function (s) {
        IN.push({ pts: s.pts, ou: s.ou, b: 0.32 * dim + 0.05, j: 0.004 });
      });
      if (it.sep) SP.push({ pts: it.sep, b: 0.55 * dim, j: 0.002 });
    });
    strokes(o, rnd, OL, B[0]);
    strokes(o, rnd, IN, B[1]);
    strokes(o, rnd, SP, B[2]);
    // faint colony matrix: specks thinning toward the rim
    area(o, rnd, function (x, y) { return Math.hypot(x, y) < Rc + 0.06; }, [-Rc - 0.06, -Rc - 0.06, Rc + 0.06, Rc + 0.06], B[3], function (x, y) {
      return 0.11 + 0.08 * (1 - Math.hypot(x, y) / Rc);
    }, function (x, y) {
      var d = Math.hypot(x, y) / Rc;
      return Math.max(0.05, 1 - d * d * 0.8);
    });
    fit(o, 0, 0.9);
    return finish(o, rnd);
  }

  R['gut'] = [
    { name: 'bacillus', f: bacillus },
    { name: 'staphylococcus', f: staphylococcus },
    { name: 'spirillum', f: spirillum },
    { name: 'streptococcus', f: streptococcus },
    { name: 'community', f: community }
  ];
})();
/* ---- path ---- */
(function () {
  const R = (window.DBSHAPES = window.DBSHAPES || {});

  // ---------------------------------------------------------------- helpers
  const TAU = 6.283185307179586;

  function gauss(rnd) {
    let u = rnd();
    if (u < 1e-9) u = 1e-9;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rnd());
  }
  function hyp2(x, y) { return Math.sqrt(x * x + y * y); }
  function hyp3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function smooth(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  function makeOut(N) { return { p: new Float32Array(2 * N), a: new Float32Array(N), i: 0, N: N }; }
  function put(o, x, y, a) {
    if (o.i >= o.N) return;
    o.p[2 * o.i] = clamp(x, -0.995, 0.995);
    o.p[2 * o.i + 1] = clamp(y, -0.995, 0.995);
    o.a[o.i] = clamp(a, 0, 1);
    o.i++;
  }
  // split N by weights; floor, remainder to the last bucket
  function split(N, w) {
    let s = 0, acc = 0; const c = [];
    for (let k = 0; k < w.length; k++) s += w[k];
    for (let k = 0; k < w.length; k++) {
      const n = k === w.length - 1 ? N - acc : Math.floor(N * w[k] / s);
      c.push(n); acc += n;
    }
    return c;
  }
  // cumulative length of a flat polyline
  function cumLen(pts, closed) {
    const m = pts.length / 2, segs = closed ? m : m - 1;
    const L = new Float64Array(segs + 1);
    for (let j = 0; j < segs; j++) {
      const k = (j + 1) % m;
      L[j + 1] = L[j] + hyp2(pts[2 * k] - pts[2 * j], pts[2 * k + 1] - pts[2 * j + 1]);
    }
    return L;
  }
  // sample n dots along a polyline by arc length (stratified), with normal jitter.
  // aFn(x, y, t) -> alpha (t in 0..1 along the line); ok(x, y) -> accept (optional)
  function alongPoly(o, pts, closed, n, rnd, jit, aFn, ok) {
    if (n <= 0) return;
    const m = pts.length / 2, L = cumLen(pts, closed), T = L[L.length - 1];
    for (let k = 0; k < n; k++) {
      let x = 0, y = 0, t = 0;
      for (let tries = 0; tries < 14; tries++) {
        const s = tries === 0 ? (k + rnd()) / n * T : rnd() * T;
        let lo = 0, hi = L.length - 1;
        while (hi - lo > 1) { const md = (lo + hi) >> 1; if (L[md] <= s) lo = md; else hi = md; }
        const j = lo, j2 = (j + 1) % m;
        const seg = L[j + 1] - L[j] || 1e-9, f = (s - L[j]) / seg;
        const x0 = pts[2 * j], y0 = pts[2 * j + 1], x1 = pts[2 * j2], y1 = pts[2 * j2 + 1];
        const dx = (x1 - x0) / seg, dy = (y1 - y0) / seg, g = gauss(rnd) * jit;
        x = x0 + (x1 - x0) * f - dy * g;
        y = y0 + (y1 - y0) * f + dx * g;
        t = s / T;
        if (!ok || ok(x, y)) break;
      }
      put(o, x, y, aFn(x, y, t));
    }
  }

  // ================================================================ 1. drop
  const DROP_HW = (function () {
    const t = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const yl = i / 255 * 2 - 1, a = Math.acos(clamp(-yl, -1, 1));
      t[i] = Math.sin(a) * Math.pow(Math.sin(a / 2), 1.45);
    }
    return t;
  })();
  // outline: x = sin t * sin(t/2)^1.45, y = -cos t  (tip up, round base), scaled and placed
  const DROP_S = 0.915, DROP_CX = -0.07, DROP_CY = 0.0;
  const DROP_PTS = (function () {
    const K = 220, pts = [];
    for (let k = 0; k < K; k++) {
      const t = TAU * k / K;
      pts.push(DROP_CX + DROP_S * Math.sin(t) * Math.pow(Math.abs(Math.sin(t / 2)), 1.45), DROP_CY - DROP_S * Math.cos(t));
    }
    return pts;
  })();
  function bloodDrop(N, rnd) {
    const o = makeOut(N);
    const S = DROP_S, CX = DROP_CX, CY = DROP_CY;
    const HW = DROP_HW;
    const halfW = function (yl) {   // yl in [-1, 1] local, returns local half width (table lookup)
      const f = (clamp(yl, -1, 1) + 1) * 0.5 * 255, i = Math.min(254, f | 0), t = f - i;
      return HW[i] * (1 - t) + HW[i + 1] * t;
    };
    const pts = DROP_PTS;           // outline polyline in final coords
    const c = split(N, [0.40, 0.07, 0.45, 0.08]);
    // light from upper left
    const Lx = -0.55, Ly = -0.62, Lz = 0.56;
    // outline: brighter on the lit (left) side, a touch thicker on the shadow side
    alongPoly(o, pts, true, c[0], rnd, 0.007, function (x, y) {
      const side = (x - CX) / 0.7;
      return 0.86 + 0.12 * clamp(-side, 0, 1) + 0.04 * (rnd() - 0.5);
    });
    // specular highlight: a curved tapered streak inside, upper left of the bulb
    const BX = 0.0, BY = 0.38, BR = 0.5;    // bulb frame (local)
    // a long tapered streak, a gap, then a short dash (engraver's highlight)
    const nDash = Math.max(3, Math.round(c[1] * 0.16));
    for (let k = 0; k < c[1]; k++) {
      const dash = k < nDash;
      const u = dash ? (k + rnd()) / nDash : (k - nDash + rnd()) / (c[1] - nDash);
      const ang = dash ? Math.PI * (1.35 + 0.07 * u) : Math.PI * (0.94 + 0.34 * u);
      const w = dash ? 0.012 * Math.sin(Math.PI * u) + 0.003 : 0.024 * Math.pow(Math.sin(Math.PI * u), 0.8) + 0.003;
      const rr = BR + Math.abs(gauss(rnd)) * w;
      put(o, CX + S * (BX + rr * Math.cos(ang)), CY + S * (BY + rr * Math.sin(ang)), 0.92 + 0.08 * rnd());
    }
    // interior stipple: shaded body of revolution + reflected-light crescent lower right
    let placed = 0, guard = 0;
    while (placed < c[2] && guard < c[2] * 60) {
      guard++;
      const yl = -0.9 + 1.88 * rnd(), xl = (rnd() * 2 - 1) * 0.72;
      const w = halfW(yl);
      if (w < 0.02) continue;
      const u = xl / w;
      if (Math.abs(u) > 0.95) continue;
      const nx = u, ny = clamp((yl - BY) / 0.62, -0.45, 1), nz2 = 1 - nx * nx - ny * ny;
      const nz = Math.sqrt(Math.max(0.04, nz2)), nl = hyp3(nx, ny, nz);
      const lam = Math.max(0, (nx * Lx + ny * Ly + nz * Lz) / nl);
      const edge = hyp2(u, (yl - BY) / 0.62);
      const refl = smooth(0.62, 0.92, edge) * clamp(0.65 * u + 0.75 * (yl - 0.25), 0, 1);
      const dens = 0.05 + 0.5 * lam * lam * lam + 0.75 * refl;
      if (rnd() > dens) continue;
      put(o, CX + S * xl, CY + S * yl, 0.22 + 0.3 * lam + 0.35 * refl + 0.06 * rnd());
      placed++;
    }
    for (; placed < c[2]; placed++) put(o, CX, CY + S * 0.5, 0.3);
    // faint halo hugging the outside
    alongPoly(o, pts, true, c[3], rnd, 0.0, function () { return 0.1 + 0.08 * rnd(); });
    for (let k = o.i - c[3]; k < o.i; k++) {   // push halo dots outward
      const x = o.p[2 * k], y = o.p[2 * k + 1];
      const dx = x - CX, dy = y - (CY + S * 0.25), d = hyp2(dx, dy) || 1;
      const off = 0.025 + Math.abs(gauss(rnd)) * 0.04;
      o.p[2 * k] = clamp(x + dx / d * off, -0.995, 0.995);
      o.p[2 * k + 1] = clamp(y + dy / d * off, -0.995, 0.995);
    }
    return { p: o.p, a: o.a };
  }

  // ================================================================ 2. red cells
  // Evans-Fung biconcave profile, half thickness in units of the cell radius
  const H0 = 0.1036, H2 = 1.0013, H4 = -0.5614, HMAX = 0.3285;
  function hR(r2) { return r2 >= 1 ? 0 : Math.sqrt(1 - r2) * (H0 + H2 * r2 + H4 * r2 * r2); }
  function dhR(r2) {   // dh/d(r2)
    r2 = Math.min(r2, 0.985);
    const q = Math.sqrt(1 - r2), P = H0 + H2 * r2 + H4 * r2 * r2;
    return -P / (2 * q) + q * (H2 + 2 * H4 * r2);
  }
  const NB = 96;
  function makeCell(cx, cy, rad, thDeg, psiDeg) {
    const th = thDeg * Math.PI / 180, ps = psiDeg * Math.PI / 180;
    const C = { cx: cx, cy: cy, R: rad, c: Math.cos(th), s: Math.sin(th), cp: Math.cos(ps), sp: Math.sin(ps), rmax: new Float32Array(NB) };
    // silhouette radius table about the projected centre (local, unrotated)
    for (let i = 0; i < 200; i++) {
      const ph = TAU * i / 200, co = Math.cos(ph), si = Math.sin(ph);
      for (let j = 0; j <= 10; j++) {
        const rho = 0.5 + 0.05 * j, h = hR(rho * rho);
        for (let sg = -1; sg <= 1; sg += 2) {
          const X = rho * co, Y = rho * si * C.c - sg * h * C.s;
          let b = Math.round((Math.atan2(Y, X) / TAU + 1) * NB) % NB;
          const r = hyp2(X, Y);
          if (r > C.rmax[b]) C.rmax[b] = r;
        }
      }
    }
    const tmp = Float32Array.from(C.rmax);
    for (let b = 0; b < NB; b++) C.rmax[b] = Math.max(tmp[b], (tmp[(b + 1) % NB] + tmp[(b + NB - 1) % NB]) / 2);
    return C;
  }
  function cellProj(C, x, y, z, out) {
    const X = x, Y = y * C.c - z * C.s;
    out[0] = C.cx + C.R * (X * C.cp - Y * C.sp);
    out[1] = C.cy + C.R * (X * C.sp + Y * C.cp);
  }
  function cellSilR(C, ang) {
    const f = (ang / TAU + 1) * NB, b0 = Math.floor(f), t = f - b0;
    return C.rmax[b0 % NB] * (1 - t) + C.rmax[(b0 + 1) % NB] * t;
  }
  function insideCell(C, x, y, margin) {
    const dx = (x - C.cx) / C.R, dy = (y - C.cy) / C.R;
    const X = dx * C.cp + dy * C.sp, Y = -dx * C.sp + dy * C.cp;
    return hyp2(X, Y) < cellSilR(C, Math.atan2(Y, X)) + margin;
  }
  function selfOccluded(C, x, y, z) {
    for (let t = 0.03; t < 1.6; t += 0.03) {
      const px = x, py = y + t * C.s, pz = z + t * C.c;
      if (pz > HMAX + 0.01) return false;
      const r2 = px * px + py * py;
      if (r2 < 1 && Math.abs(pz) < hR(r2) - 0.004) return true;
    }
    return false;
  }

  // fixed composition, front to back (geometry precomputed once; generator stays pure)
  const CELLS = [
    makeCell(-0.36, -0.30, 0.56, 48, -14),
    makeCell(0.10, 0.44, 0.50, 54, 9),
    makeCell(0.48, -0.37, 0.42, 40, 18)
  ];
  function redCells(N, rnd) {
    const o = makeOut(N);
    const cells = CELLS;
    const share = split(N, [0.42, 0.33, 0.25]);
    // light, in camera space (right, down, toward viewer)
    const lcx = -0.35, lcy = -0.4, lcz = 0.85, ll = hyp3(lcx, lcy, lcz);
    const tmp = [0, 0];
    for (let ci = 0; ci < cells.length; ci++) {
      const C = cells[ci];
      const front = cells.slice(0, ci);
      const ok = function (x, y) {
        for (let k = 0; k < front.length; k++) if (insideCell(front[k], x, y, 0.035)) return false;
        return true;
      };
      const Lx = lcx / ll, Ly = (lcy / ll) * C.c + (lcz / ll) * C.s, Lz = -(lcy / ll) * C.s + (lcz / ll) * C.c;
      const c = split(share[ci], [0.30, 0.15, 0.55]);
      // silhouette
      const sil = [];
      for (let b = 0; b < NB; b++) {
        const ang = TAU * b / NB, r = C.rmax[b];
        const X = r * Math.cos(ang), Y = r * Math.sin(ang);
        sil.push(C.cx + C.R * (X * C.cp - Y * C.sp), C.cy + C.R * (X * C.sp + Y * C.cp));
      }
      alongPoly(o, sil, true, c[0], rnd, 0.006, function () { return 0.86 + 0.12 * rnd(); }, ok);
      // crest of the rim (the ridge circling the dimple)
      const crest = [], RC = 0.7, hc = hR(RC * RC);
      for (let b = 0; b < 120; b++) {
        const ph = TAU * b / 120;
        cellProj(C, RC * Math.cos(ph), RC * Math.sin(ph), hc, tmp);
        crest.push(tmp[0], tmp[1]);
      }
      alongPoly(o, crest, true, c[1], rnd, 0.008, function (x, y, t) {
        const near = Math.sin(TAU * t);   // +1 on the near (lower) side
        return 0.55 + 0.3 * clamp(near, 0, 1) + 0.08 * rnd();
      }, ok);
      // surface stipple: shaded top surface, rim bright, dimple sparse
      let placed = 0, guard = 0;
      while (placed < c[2] && guard < c[2] * 80) {
        guard++;
        const r2 = rnd() * 0.985, ph = TAU * rnd(), rho = Math.sqrt(r2);
        const x = rho * Math.cos(ph), y = rho * Math.sin(ph), h = hR(r2);
        const g = dhR(r2) * 2;
        const nx = -g * x, ny = -g * y, nz = 1, nl = hyp3(nx, ny, nz);
        const lam = Math.max(0, (nx * Lx + ny * Ly + nz * Lz) / nl);
        const hh = h / HMAX;
        const rim = smooth(0.42, 0.62, rho);
        const dens = 0.035 + rim * (0.25 + 0.6 * lam * lam) + (1 - rim) * 0.12 * lam;
        if (rnd() > dens) continue;
        if (selfOccluded(C, x, y, h)) continue;
        cellProj(C, x, y, h, tmp);
        if (!ok(tmp[0], tmp[1])) continue;
        put(o, tmp[0], tmp[1], 0.2 + rim * (0.18 + 0.3 * lam) + 0.08 * rnd());
        placed++;
      }
      for (; placed < c[2]; placed++) { cellProj(C, 0.7, 0.3, hc, tmp); put(o, tmp[0], tmp[1], 0.4); }
    }
    return { p: o.p, a: o.a };
  }

  // ================================================================ 3. tube
  function testTube(N, rnd) {
    const o = makeOut(N);
    const beta = 16 * Math.PI / 180, cb = Math.cos(beta), sb = Math.sin(beta);
    const OX = -0.04, OY = 0.0;
    const W = 0.175;                         // tube half width
    const vTop = -0.47, vB = 0.74;           // straight wall span; bottom arc centre at vB
    const toW = function (u, v, out) {       // local (u across, v along axis) -> world
      out[0] = OX + u * cb + v * sb;         // top (v<0) leans left
      out[1] = OY - u * sb + v * cb;
    };
    const tmp = [0, 0];
    const poly = function (loc) {
      const r = [];
      for (let k = 0; k < loc.length; k += 2) { toW(loc[k], loc[k + 1], tmp); r.push(tmp[0], tmp[1]); }
      return r;
    };
    // tube outline (open at the top, hidden by the cap)
    const tubeL = [];
    for (let k = 0; k <= 20; k++) tubeL.push(-W, vTop + (vB - vTop) * k / 20);
    for (let k = 1; k < 40; k++) { const a = Math.PI - Math.PI * k / 40; tubeL.push(W * Math.cos(a), vB + W * Math.sin(a)); }
    for (let k = 20; k >= 0; k--) tubeL.push(W, vTop + (vB - vTop) * k / 20);
    const tube = poly(tubeL);
    // cap: tall ribbed body + wider skirt
    const capB = [], cw = 0.195, cTop = -0.9, cMid = -0.625, rr = 0.035;
    capB.push(-cw, cMid);
    for (let k = 0; k <= 8; k++) { const a = Math.PI + Math.PI / 2 * k / 8; capB.push(-cw + rr + rr * Math.cos(a), cTop + rr + rr * Math.sin(a)); }
    for (let k = 0; k <= 8; k++) { const a = 1.5 * Math.PI + Math.PI / 2 * k / 8; capB.push(cw - rr + rr * Math.cos(a), cTop + rr + rr * Math.sin(a)); }
    capB.push(cw, cMid);
    const capBody = poly(capB);
    const sw = 0.222, sTop = cMid, sBot = -0.46, sr = 0.015;
    const skL = [
      -sw + sr, sTop, sw - sr, sTop, sw, sTop + sr, sw, sBot - sr, sw - sr, sBot, -sw + sr, sBot, -sw, sBot - sr, -sw, sTop + sr
    ];
    const skirt = poly(skL);

    // liquid: two thirds of the tube, surface level in the world (horizontal)
    const vFill = vTop + (vB + W - vTop) / 3;      // axis point of the surface (local v)
    toW(0, vFill, tmp);
    const Ys = tmp[1];
    const wallV = function (u) { return (Ys - OY + u * sb) / cb; };   // local v of surface at u
    const pL = [0, 0], pR = [0, 0];
    toW(-W, wallV(-W), pL); toW(W, wallV(W), pR);
    const mcx = (pL[0] + pR[0]) / 2, mcy = Ys, mrx = Math.abs(pR[0] - pL[0]) / 2 - 0.004, mry = 0.034;

    const c = split(N, [0.26, 0.10, 0.06, 0.10, 0.07, 0.33, 0.04, 0.02, 0.02]);
    // 0 tube outline: lit left wall brighter
    alongPoly(o, tube, false, c[0], rnd, 0.006, function (x, y, t) {
      return (t < 0.4 ? 0.95 : t > 0.6 ? 0.8 : 0.88) + 0.05 * rnd();
    });
    // 1 cap body outline
    alongPoly(o, capBody, false, c[1], rnd, 0.006, function () { return 0.9 + 0.1 * rnd(); });
    // 2 skirt outline
    alongPoly(o, skirt, true, c[2], rnd, 0.005, function () { return 0.88 + 0.1 * rnd(); });
    // 3 cap ribs: vertical engraved lines, denser / brighter on the lit side
    const ribs = [-0.14, -0.093, -0.046, 0.001, 0.048, 0.095, 0.142];
    const rw = [1.5, 1.35, 1.15, 1.0, 0.8, 0.65, 0.55];
    let rs = 0; for (let k = 0; k < rw.length; k++) rs += rw[k];
    const ribN = split(c[3], rw);
    for (let k = 0; k < ribs.length; k++) {
      for (let j = 0; j < ribN[k]; j++) {
        const v = cTop + 0.06 + (cMid - 0.03 - cTop - 0.06) * (j + rnd()) / ribN[k];
        toW(ribs[k] + gauss(rnd) * 0.004, v, tmp);
        put(o, tmp[0], tmp[1], 0.3 + 0.35 * rw[k] / 1.5 + 0.05 * rnd());
      }
    }
    // 4 meniscus ellipse (front arc bright, back arc dimmer)
    for (let k = 0; k < c[4]; k++) {
      const ang = TAU * (k + rnd()) / c[4];
      const x = mcx + mrx * Math.cos(ang), y = mcy + mry * Math.sin(ang) + gauss(rnd) * 0.003;
      put(o, x, y, Math.sin(ang) > 0 ? 0.92 : 0.6);
    }
    // 5 liquid body: cylinder shading, lit from the left, settled cells darker low? keep calm
    let placed = 0, guard = 0;
    while (placed < c[5] && guard < c[5] * 60) {
      guard++;
      const u = (rnd() * 2 - 1) * (W - 0.012), v = vTop + (vB + W - vTop) * rnd();
      if (v > vB && u * u + (v - vB) * (v - vB) > (W - 0.012) * (W - 0.012)) continue;
      toW(u, v, tmp);
      const ty = tmp[1] + gauss(rnd) * 0.0; // no blur
      if (ty < Ys + mry * Math.sqrt(Math.max(0, 1 - Math.pow((tmp[0] - mcx) / mrx, 2))) + 0.006) continue;
      const q = u / W, nz = Math.sqrt(Math.max(0, 1 - q * q));
      const lam = Math.max(0, -0.62 * q + 0.78 * nz);
      const dens = 0.25 + 0.7 * lam * lam;
      if (rnd() > dens) continue;
      put(o, tmp[0], ty, 0.3 + 0.28 * lam + 0.06 * rnd());
      placed++;
    }
    for (; placed < c[5]; placed++) { toW(0, vB, tmp); put(o, tmp[0], tmp[1], 0.4); }
    // 6 glass highlight streak near the left wall
    for (let k = 0; k < c[6]; k++) {
      const v = vTop + 0.08 + (vB - vTop - 0.1) * (k + rnd()) / c[6];
      toW(-W * 0.62 + gauss(rnd) * 0.005, v, tmp);
      put(o, tmp[0], tmp[1], 0.75 + 0.2 * rnd());
    }
    // 7 empty glass above the liquid: sparse faint texture
    placed = 0; guard = 0;
    while (placed < c[7] && guard < c[7] * 80) {
      guard++;
      const u = (rnd() * 2 - 1) * (W - 0.02), v = vTop + 0.02 + (vFill - vTop + 0.1) * rnd();
      toW(u, v, tmp);
      if (tmp[1] > Ys - 0.03) continue;
      put(o, tmp[0], tmp[1], 0.16 + 0.1 * rnd());
      placed++;
    }
    for (; placed < c[7]; placed++) { toW(0, vTop + 0.05, tmp); put(o, tmp[0], tmp[1], 0.2); }
    // 8 faint halo just outside the tube walls
    alongPoly(o, tube, false, c[8], rnd, 0.0, function () { return 0.1 + 0.08 * rnd(); });
    for (let k = o.i - c[8]; k < o.i; k++) {
      // push outward from the tube axis
      const x = o.p[2 * k], y = o.p[2 * k + 1];
      const ux = (x - OX) * cb - (y - OY) * sb;            // local u
      const vv = (x - OX) * sb + (y - OY) * cb;            // local v
      let nx, ny;
      if (vv > vB) { const d = hyp2(ux, vv - vB) || 1; nx = ux / d; ny = (vv - vB) / d; }
      else { nx = ux >= 0 ? 1 : -1; ny = 0; }
      const off = 0.02 + Math.abs(gauss(rnd)) * 0.02;
      toW(ux + nx * off, vv + ny * off, tmp);
      o.p[2 * k] = clamp(tmp[0], -0.995, 0.995); o.p[2 * k + 1] = clamp(tmp[1], -0.995, 0.995);
    }
    while (o.i < N) { toW(0, 0.3, tmp); put(o, tmp[0], tmp[1], 0.3); }
    return { p: o.p, a: o.a };
  }

  R['path'] = [
    { name: 'blood-drop', f: bloodDrop },
    { name: 'red-cells', f: redCells },
    { name: 'test-tube', f: testTube }
  ];
})();
/* ---- dexa ---- */
(function () {
  const R = (window.DBSHAPES = window.DBSHAPES || {});

  /* ---------------- shared helpers (pure; randomness only via rnd) ---------------- */

  // approx. unit gaussian, bounded (sum of three uniforms)
  function gs(rnd) {
    return (rnd() + rnd() + rnd() - 1.5) * 2;
  }

  // split integer `total` across weights (largest remainder)
  function alloc(W, total) {
    var S = 0, n = W.length, c = new Array(n), rem = new Array(n), used = 0, k;
    for (k = 0; k < n; k++) S += W[k];
    for (k = 0; k < n; k++) {
      var v = (W[k] / S) * total;
      c[k] = Math.floor(v);
      rem[k] = v - c[k];
      used += c[k];
    }
    var idx = [];
    for (k = 0; k < n; k++) idx.push(k);
    idx.sort(function (i, j) { return rem[j] - rem[i]; });
    for (k = 0; k < total - used; k++) c[idx[k % n]]++;
    return c;
  }

  // uniform Catmull-Rom through flat [x0,y0,x1,y1,...]
  function spline(pts, closed, sub) {
    var n = pts.length / 2, out = [], m = closed ? n : n - 1, i, k;
    for (i = 0; i < m; i++) {
      var i0 = closed ? (i - 1 + n) % n : Math.max(i - 1, 0);
      var i2 = (i + 1) % n;
      var i3 = closed ? (i + 2) % n : Math.min(i + 2, n - 1);
      var x0 = pts[2 * i0], y0 = pts[2 * i0 + 1], x1 = pts[2 * i], y1 = pts[2 * i + 1];
      var x2 = pts[2 * i2], y2 = pts[2 * i2 + 1], x3 = pts[2 * i3], y3 = pts[2 * i3 + 1];
      for (k = 0; k < sub; k++) {
        var t = k / sub, t2 = t * t, t3 = t2 * t;
        out.push(
          0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
          0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3)
        );
      }
    }
    if (closed) out.push(out[0], out[1]);
    else out.push(pts[2 * n - 2], pts[2 * n - 1]);
    return out;
  }

  function ellipse(cx, cy, rx, ry, a0, a1, steps, rot) {
    var out = [], c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (var i = 0; i <= steps; i++) {
      var t = a0 + ((a1 - a0) * i) / steps, ex = rx * Math.cos(t), ey = ry * Math.sin(t);
      out.push(cx + ex * c - ey * s, cy + ex * s + ey * c);
    }
    return out;
  }

  function mapPts(pts, fn) {
    var out = new Array(pts.length);
    for (var i = 0; i < pts.length; i += 2) {
      var q = fn(pts[i], pts[i + 1]);
      out[i] = q[0];
      out[i + 1] = q[1];
    }
    return out;
  }

  function mirrorX(pts) {
    var out = new Array(pts.length);
    for (var i = 0; i < pts.length; i += 2) {
      out[i] = -pts[i];
      out[i + 1] = pts[i + 1];
    }
    return out;
  }

  // polyline -> path with cumulative length
  function path(pts) {
    var n = pts.length / 2, cum = new Float64Array(n);
    for (var i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    return { pts: pts, cum: cum, L: cum[n - 1] };
  }
  // several paths treated as one, sampled by length
  function group(list) {
    var ps = [], st = [], L = 0;
    for (var i = 0; i < list.length; i++) {
      var p = path(list[i]);
      ps.push(p);
      st.push(L);
      L += p.L;
    }
    return { paths: ps, st: st, L: L };
  }

  // stratified samples along a group, gaussian jitter along the normal
  function onGroup(o, G, n, rnd, sd, a0, a1) {
    var pi = 0, seg = 1, P = o.p, A = o.a;
    for (var j = 0; j < n; j++) {
      var s = ((j + rnd()) / n) * G.L;
      while (pi < G.paths.length - 1 && s >= G.st[pi + 1]) { pi++; seg = 1; }
      var p = G.paths[pi], ls = s - G.st[pi], cum = p.cum, pts = p.pts, m = cum.length;
      while (seg < m - 1 && cum[seg] < ls) seg++;
      var l0 = cum[seg - 1], l1 = cum[seg], t = l1 > l0 ? (ls - l0) / (l1 - l0) : 0;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var x0 = pts[2 * seg - 2], y0 = pts[2 * seg - 1], dx = pts[2 * seg] - x0, dy = pts[2 * seg + 1] - y0;
      var dl = Math.hypot(dx, dy) || 1, g = gs(rnd) * sd, k = o.i++;
      P[2 * k] = x0 + dx * t - (dy / dl) * g;
      P[2 * k + 1] = y0 + dy * t + (dx / dl) * g;
      A[k] = a0 + (a1 - a0) * rnd();
    }
  }

  function inPoly(poly, x, y) {
    var c = false, n = poly.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var yi = poly[2 * i + 1], yj = poly[2 * j + 1];
      if (yi > y !== yj > y) {
        var xi = poly[2 * i];
        if (x < ((poly[2 * j] - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    }
    return c;
  }
  function polyArea(poly) {
    var s = 0, n = poly.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) s += poly[2 * j] * poly[2 * i + 1] - poly[2 * i] * poly[2 * j + 1];
    return Math.abs(s) / 2;
  }
  // region = { polys:[...], holes:[...], box:[x0,y0,x1,y1], area }
  function bb(q) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < q.length; i += 2) {
      if (q[i] < x0) x0 = q[i];
      if (q[i] > x1) x1 = q[i];
      if (q[i + 1] < y0) y0 = q[i + 1];
      if (q[i + 1] > y1) y1 = q[i + 1];
    }
    return [x0, y0, x1, y1];
  }
  // region = union of polys minus holes, with per-polygon bounding boxes for fast rejection
  function region(polys, holes) {
    holes = holes || [];
    var area = 0, pb = [], hb = [], k, box = [1e9, 1e9, -1e9, -1e9];
    for (k = 0; k < polys.length; k++) {
      area += polyArea(polys[k]);
      var q = bb(polys[k]);
      pb.push(q);
      box = [Math.min(box[0], q[0]), Math.min(box[1], q[1]), Math.max(box[2], q[2]), Math.max(box[3], q[3])];
    }
    for (k = 0; k < holes.length; k++) { area -= polyArea(holes[k]); hb.push(bb(holes[k])); }
    return {
      polys: polys.map(function (q) { return Float64Array.from(q); }),
      holes: holes.map(function (q) { return Float64Array.from(q); }),
      pb: pb, hb: hb, box: box, area: Math.max(area, 1e-9)
    };
  }
  function inRegion(rg, x, y) {
    var inside = false, k, q;
    for (k = 0; k < rg.polys.length && !inside; k++) {
      q = rg.pb[k];
      if (x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3]) inside = inPoly(rg.polys[k], x, y);
    }
    if (!inside) return false;
    for (k = 0; k < rg.holes.length; k++) {
      q = rg.hb[k];
      if (x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3] && inPoly(rg.holes[k], x, y)) return false;
    }
    return true;
  }
  // jittered-grid stipple inside a region (even, engraving-like); dens(x,y) in 0..1 optional
  // dm: rough mean of dens over the region (sizes the grid so one pass usually suffices)
  function inRegionFill(o, rg, n, rnd, a0, a1, dens, dm) {
    if (n <= 0) return;
    var b = rg.box, h = Math.sqrt((rg.area * (dens ? dm || 0.5 : 1)) / (n * 1.4)), cand, m;
    for (var pass = 0; pass < 3; pass++) {
      cand = [];
      for (var y = b[1]; y < b[3]; y += h) {
        for (var x = b[0]; x < b[2]; x += h) {
          var px = x + rnd() * h, py = y + rnd() * h;
          if (dens && rnd() > dens(px, py)) continue;
          if (inRegion(rg, px, py)) cand.push(px, py);
        }
      }
      m = cand.length / 2;
      if (m >= n) break;
      h *= Math.sqrt(Math.max(m, 1) / (n * 1.3));
      if (h < 1e-6) break;
    }
    var P = o.p, A = o.a, j, k;
    for (j = 0; j < n; j++) {
      var cx, cy;
      if (j < m) {
        var r = j + Math.floor(rnd() * (m - j)); // partial Fisher-Yates
        cx = cand[2 * r]; cy = cand[2 * r + 1];
        cand[2 * r] = cand[2 * j]; cand[2 * r + 1] = cand[2 * j + 1];
        cand[2 * j] = cx; cand[2 * j + 1] = cy;
      } else {
        // fallback: rejection, then a polygon vertex
        var ok = false;
        for (var t = 0; t < 40 && !ok; t++) {
          cx = b[0] + rnd() * (b[2] - b[0]);
          cy = b[1] + rnd() * (b[3] - b[1]);
          ok = inRegion(rg, cx, cy);
        }
        if (!ok) {
          var q = rg.polys[0], vi = 2 * Math.floor((rnd() * q.length) / 2);
          cx = q[vi]; cy = q[vi + 1];
        }
      }
      k = o.i++;
      P[2 * k] = cx;
      P[2 * k + 1] = cy;
      A[k] = a0 + (a1 - a0) * rnd();
    }
  }

  // affine: local -> box, then clamp
  function finish(o, T) {
    var P = o.p, N = o.N;
    for (var k = 0; k < N; k++) {
      var x = P[2 * k], y = P[2 * k + 1];
      var X = T[0] * x + T[1] * y + T[2], Y = T[3] * x + T[4] * y + T[5];
      P[2 * k] = X < -1 ? -1 : X > 1 ? 1 : X;
      P[2 * k + 1] = Y < -1 ? -1 : Y > 1 ? 1 : Y;
      if (o.a[k] < 0) o.a[k] = 0; else if (o.a[k] > 1) o.a[k] = 1;
    }
    return { p: o.p, a: o.a };
  }
  // rotation by ang then uniform scale so bbox of `pts` fits half-extent `half`, centred at (cx,cy)
  function fitT(ptsList, ang, half, cx, cy) {
    var c = Math.cos(ang), s = Math.sin(ang), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var k = 0; k < ptsList.length; k++) {
      var q = ptsList[k];
      for (var i = 0; i < q.length; i += 2) {
        var X = c * q[i] - s * q[i + 1], Y = s * q[i] + c * q[i + 1];
        if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      }
    }
    var sc = (2 * half) / Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return { T: [sc * c, -sc * s, cx - sc * mx, sc * s, sc * c, cy - sc * my], sc: sc };
  }

  // 0 at N<=200 .. 1 at N>=800: small N spends its dots on outlines first
  function lowK(N) {
    return Math.max(0, Math.min(1, (N - 200) / 600));
  }

  function out(N) {
    return { p: new Float32Array(2 * N), a: new Float32Array(N), i: 0, N: N };
  }

  /* ---------------- 1. femur ---------------- */
  // Local frame: shaft vertical, y down, head on local -x (medial). Units ~ 1 = shaft width.
  var FEM = null;
  function femurGeom() {
    if (FEM) return FEM;
    var H = [-2.0, 0.86], r = 0.95, d2r = Math.PI / 180;
    // head: free arc from the lower neck junction round to the upper one
    var head = ellipse(H[0], H[1], r, r, 64 * d2r, 352 * d2r, 14);
    var rest = [
      // neck, upper border (saddle) -> trochanteric fossa -> greater trochanter
      -0.58, 0.98, -0.12, 1.04, 0.2, 0.88,
      0.38, 0.46, 0.66, 0.3, 0.95, 0.44, 1.07, 0.9,
      1.07, 1.5, 0.95, 2.15, 0.72, 2.75,
      // lateral shaft
      0.56, 3.6, 0.5, 5.0, 0.53, 6.5, 0.68, 7.5,
      // lateral flare, epicondyle, lateral condyle
      0.95, 8.2, 1.18, 8.75, 1.26, 9.3, 1.18, 9.8, 0.92, 10.08, 0.55, 10.02,
      // intercondylar notch
      0.28, 9.72, 0.0, 9.5, -0.26, 9.74,
      // medial condyle, epicondyle
      -0.6, 10.08, -0.98, 10.12, -1.27, 9.86, -1.36, 9.35, -1.24, 8.78,
      // medial flare, medial shaft
      -0.98, 8.2, -0.66, 7.5, -0.51, 6.5, -0.47, 5.0, -0.52, 3.75,
      // lesser trochanter
      -0.66, 3.25, -0.92, 3.0, -0.84, 2.7,
      // neck, lower border
      -0.98, 2.38, -1.25, 2.04
    ];
    var ctrl = head.concat(rest);
    var outline = spline(ctrl, true, 6);
    var coarse = spline(ctrl, true, 2);
    // inner structure
    var canalL = spline([-0.2, 3.4, -0.23, 4.6, -0.23, 6.2, -0.3, 7.4, -0.48, 8.1], false, 6);
    var canalR = spline([0.25, 3.1, 0.26, 4.6, 0.27, 6.2, 0.34, 7.4, 0.53, 8.1], false, 6);
    var interTroch = spline([0.98, 1.6, 0.5, 2.08, -0.1, 2.45, -0.64, 2.76], false, 6); // intertrochanteric line
    var headInner = ellipse(H[0], H[1], r, r, -6 * d2r, 62 * d2r, 10); // articular margin across the neck
    var fovea = ellipse(H[0] - 0.3, H[1] + 0.12, 0.1, 0.1, 0, Math.PI * 2, 8);
    var notch = spline([-0.42, 9.95, -0.25, 9.45, 0.0, 9.2, 0.25, 9.42, 0.42, 9.92], false, 6); // intercondylar fossa
    var epiph = spline([-1.2, 8.95, -0.5, 8.75, 0.3, 8.78, 1.08, 8.92], false, 6); // physeal scar
    var compress = spline([-1.7, 1.45, -1.1, 2.0, -0.6, 2.95], false, 5); // calcar / compressive trabeculae
    var tens = spline([-2.3, 0.35, -1.4, 0.45, -0.5, 0.95, 0.4, 1.75], false, 5);
    // mirror so the head (medial) sits on +x, then tilt: head points up, condyles down-right
    var all = [outline, coarse, canalL, canalR, interTroch, headInner, fovea, notch, epiph, compress, tens];
    for (var q = 0; q < all.length; q++) for (var i = 0; i < all[q].length; i += 2) all[q][i] = -all[q][i];
    var ang = -46 * d2r;
    var F = fitT([outline], ang, 0.92, -0.04, -0.02);
    FEM = {
      outline: group([outline]),
      inner: group([canalL, canalR, interTroch, headInner, notch]),
      faint: group([epiph, compress, tens, fovea]),
      body: region([coarse]),
      T: F.T,
      sc: F.sc
    };
    return FEM;
  }
  function femur(N, rnd) {
    var G = femurGeom(), o = out(N), u = 1 / G.sc; // u: one box unit in local units
    var k = lowK(N), f = 0.35 + 0.65 * k;
    var c = alloc([44, 13 * (0.6 + 0.4 * k), 5 * k, 30 * f, 8 * k], N);
    onGroup(o, G.outline, c[0], rnd, 0.006 * u, 0.85, 1.0);
    onGroup(o, G.inner, c[1], rnd, 0.005 * u, 0.42, 0.62);
    onGroup(o, G.faint, c[2], rnd, 0.008 * u, 0.25, 0.4);
    // cancellous ends denser than the shaft
    inRegionFill(o, G.body, c[3], rnd, 0.22, 0.45, function (x, y) {
      return y < 3.0 || y > 8.3 ? 1 : 0.28;
    }, 0.6);
    onGroup(o, G.outline, c[4], rnd, 0.035 * u, 0.1, 0.2);
    return finish(o, G.T);
  }

  /* ---------------- 2. lumbar vertebrae (lateral view) ---------------- */
  // Local units ~ cm. Anterior to the left (x small), posterior elements to the right.
  var VERT = null;
  function vertGeom() {
    if (VERT) return VERT;
    var outlineCtl = [
      0.15, 0.0,
      // superior endplate
      0.6, -0.06, 1.75, 0.05, 2.9, -0.06, 3.35, 0.0,
      // pedicle top (shallow superior notch)
      3.55, 0.28, 3.95, 0.4, 4.3, 0.25,
      // superior articular process
      4.45, -0.3, 4.65, -0.85, 5.0, -1.05, 5.32, -0.82, 5.42, -0.25,
      // lamina, spinous process (hatchet)
      5.7, 0.25, 6.4, 0.52, 7.3, 0.72, 8.25, 0.92, 8.95, 1.0, 9.32, 1.3, 9.4, 1.9, 9.18, 2.42,
      8.4, 2.4, 7.4, 2.18, 6.65, 2.2,
      // inferior articular process
      6.32, 2.52, 6.26, 3.1, 6.0, 3.45, 5.6, 3.36, 5.36, 2.9,
      // lamina underside, deep inferior vertebral notch
      5.12, 2.25, 4.72, 1.85, 4.2, 1.7, 3.75, 1.82,
      // posterior body wall, inferior endplate
      3.48, 2.2, 3.36, 2.7, 2.9, 2.76, 1.75, 2.65, 0.6, 2.76, 0.15, 2.7,
      // anterior waist
      0.3, 2.2, 0.42, 1.35, 0.3, 0.5
    ];
    var bodyCtl = [
      0.15, 0.0, 0.6, -0.06, 1.75, 0.05, 2.9, -0.06, 3.35, 0.0, 3.46, 0.7, 3.45, 1.4, 3.48, 2.2,
      3.36, 2.7, 2.9, 2.76, 1.75, 2.65, 0.6, 2.76, 0.15, 2.7, 0.3, 2.2, 0.42, 1.35, 0.3, 0.5
    ];
    var postWall = spline([3.35, 0.0, 3.46, 0.7, 3.45, 1.4, 3.48, 2.0], false, 5);
    var facetTP = ellipse(4.85, 0.95, 0.42, 0.3, 0, Math.PI * 2, 12); // transverse process root, end-on
    var vOut = spline(outlineCtl, true, 4), vOutC = spline(outlineCtl, true, 2), vBody = spline(bodyCtl, true, 2);

    var LV = 4, pitch = 3.92, a = 0.5, yc = 1.5 * pitch + 1.35, hh = 1.6 * pitch;
    var Ts = [];
    for (var i = 0; i < LV; i++) {
      var cy = i * pitch + 1.35, cx = -a * (1 - ((cy - yc) / hh) * ((cy - yc) / hh));
      var dxdy = (2 * a * (cy - yc)) / (hh * hh), l = Math.hypot(dxdy, 1);
      Ts.push({ cx: cx, cy: cy, dx: dxdy / l, dy: 1 / l }); // local "down" axis
    }
    function tf(T) {
      return function (x, y) {
        var X = x - 1.75, Y = y - 1.35; // right axis = (dy, -dx)
        return [T.cx + X * T.dy + Y * T.dx, T.cy - X * T.dx + Y * T.dy];
      };
    }
    var outlines = [], inner = [], bodies = [], posts = [], discsO = [], discsP = [], all = [], tps = [];
    for (i = 0; i < LV; i++) {
      var f = tf(Ts[i]);
      var o1 = mapPts(vOut, f);
      outlines.push(o1);
      all.push(o1);
      inner.push(mapPts(postWall, f));
      tps.push(mapPts(facetTP, f));
      var b = mapPts(vBody, f);
      bodies.push(b);
      posts.push({ poly: mapPts(vOutC, f), hole: b });
    }
    // discs between bodies: wedge with anterior/posterior bulge
    for (i = 0; i < LV - 1; i++) {
      var fu = tf(Ts[i]), fl = tf(Ts[i + 1]);
      var ua = fu(0.2, 2.74), um1 = fu(1.0, 2.7), um2 = fu(2.5, 2.7), up = fu(3.3, 2.74);
      var la = fl(0.2, -0.04), lm1 = fl(1.0, -0.02), lm2 = fl(2.5, -0.02), lp = fl(3.3, -0.04);
      var ab = [(ua[0] + la[0]) / 2 - 0.42, (ua[1] + la[1]) / 2];
      var pb = [(up[0] + lp[0]) / 2 + 0.2, (up[1] + lp[1]) / 2];
      var ctl = [ua[0], ua[1], um1[0], um1[1], um2[0], um2[1], up[0], up[1], pb[0], pb[1], lp[0], lp[1], lm2[0], lm2[1], lm1[0], lm1[1], la[0], la[1], ab[0], ab[1]];
      var dpoly = spline(ctl, true, 4);
      discsP.push(dpoly);
      // only the free (bulging) sides as bright edges
      discsO.push(spline([ua[0], ua[1], ab[0], ab[1], la[0], la[1]], false, 6));
      discsO.push(spline([up[0], up[1], pb[0], pb[1], lp[0], lp[1]], false, 6));
      // faint lamellae of the annulus
      var m1 = [(ua[0] + la[0]) / 2, (ua[1] + la[1]) / 2], m2 = [(up[0] + lp[0]) / 2, (up[1] + lp[1]) / 2];
      inner.push(spline([m1[0] + 0.1, m1[1], (m1[0] + m2[0]) / 2, (m1[1] + m2[1]) / 2 - 0.04, m2[0] - 0.1, m2[1]], false, 6));
    }
    var postRegions = [];
    for (i = 0; i < LV; i++) postRegions.push(region([posts[i].poly], [posts[i].hole]));
    var F = fitT(all, 0, 0.9, -0.06, -0.01);
    VERT = {
      outline: group(outlines),
      inner: group(inner),
      tps: group(tps),
      discEdge: group(discsO),
      bodies: region(bodies),
      posts: postRegions,
      discs: region(discsP),
      T: F.T,
      sc: F.sc
    };
    return VERT;
  }
  function vertebrae(N, rnd) {
    var G = vertGeom(), o = out(N), u = 1 / G.sc;
    var k = lowK(N), f = 0.3 + 0.7 * k;
    var c = alloc([42, 6 * (0.5 + 0.5 * k), 3 * k, 7, 19 * f, 8 * f, 8 * f, 7 * k], N);
    onGroup(o, G.outline, c[0], rnd, 0.005 * u, 0.85, 1.0);
    onGroup(o, G.inner, c[1], rnd, 0.005 * u, 0.4, 0.6);
    onGroup(o, G.tps, c[2], rnd, 0.005 * u, 0.3, 0.45);
    onGroup(o, G.discEdge, c[3], rnd, 0.005 * u, 0.55, 0.75);
    inRegionFill(o, G.bodies, c[4], rnd, 0.28, 0.5);
    // posterior elements: split evenly across levels
    var cp = alloc([1, 1, 1, 1], c[5]);
    for (var i = 0; i < 4; i++) inRegionFill(o, G.posts[i], cp[i], rnd, 0.22, 0.4);
    inRegionFill(o, G.discs, c[6], rnd, 0.18, 0.32);
    onGroup(o, G.outline, c[7], rnd, 0.03 * u, 0.1, 0.2);
    return finish(o, G.T);
  }

  /* ---------------- 3. body with skeleton (front view) ---------------- */
  // Built directly in box units (y down); right half designed, left half mirrored.
  var BODY = null;
  function bodyGeom() {
    if (BODY) return BODY;
    var d2r = Math.PI / 180;
    // arm: centre line + half widths -> outer/inner edges
    var armC = [[0.224, -0.47, 0.04], [0.247, -0.35, 0.033], [0.28, -0.2, 0.026], [0.3, -0.11, 0.029], [0.338, 0.05, 0.019], [0.352, 0.125, 0.025]];
    var outer = [], inner = [];
    for (var a = 0; a < armC.length; a++) {
      var p0 = armC[Math.max(a - 1, 0)], p1 = armC[Math.min(a + 1, armC.length - 1)];
      var dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy), nx = dy / l, ny = -dx / l; // normal to the outside
      outer.push(armC[a][0] + nx * armC[a][2], armC[a][1] + ny * armC[a][2]);
      inner.push(armC[a][0] - nx * armC[a][2], armC[a][1] - ny * armC[a][2]);
    }
    var innerRev = [];
    for (a = inner.length - 2; a >= 0; a -= 2) innerRev.push(inner[a], inner[a + 1]);
    var headPts = ellipse(0, -0.83, 0.074, 0.1, -90 * d2r, 66 * d2r, 9);
    var half = headPts.concat(
      [0.036, -0.712, 0.038, -0.675, 0.05, -0.652, 0.11, -0.632, 0.175, -0.608, 0.215, -0.585, 0.243, -0.54],
      outer,
      [0.365, 0.175, 0.356, 0.208, 0.336, 0.212, 0.322, 0.175],
      innerRev,
      [0.18, -0.452, 0.168, -0.38, 0.152, -0.26, 0.146, -0.15, 0.156, -0.06, 0.174, 0.02, 0.18, 0.09,
        0.175, 0.18, 0.161, 0.3, 0.138, 0.41, 0.128, 0.48, 0.136, 0.58, 0.124, 0.7, 0.1, 0.83,
        0.112, 0.885, 0.13, 0.925, 0.118, 0.95, 0.07, 0.952, 0.048, 0.93,
        0.052, 0.85, 0.045, 0.72, 0.05, 0.6, 0.042, 0.48, 0.034, 0.36, 0.024, 0.22, 0.01, 0.142]
    );
    var left = mirrorX(half), ctrl = half.slice();
    for (var i = left.length - 2; i >= 2; i -= 2) ctrl.push(left[i], left[i + 1]);
    var silhouette = spline(ctrl, true, 4);
    var silC = spline(ctrl, true, 1);

    function both(list) {
      var o = [];
      for (var k = 0; k < list.length; k++) { o.push(list[k]); o.push(mirrorX(list[k])); }
      return o;
    }
    function shift(pts, dy) {
      var o = pts.slice();
      for (var k = 1; k < o.length; k += 2) o[k] += dy;
      return o;
    }

    // spine: chain of small vertebral blocks, cervical -> lumbar
    var spineBlocks = [], y = -0.7;
    for (var v = 0; v < 24; v++) {
      var lum = v >= 19, th = v >= 7 && v < 19;
      var hgt = lum ? 0.03 : th ? 0.022 : 0.016, w = lum ? 0.02 : th ? 0.015 : 0.012;
      spineBlocks.push([-w, y, w, y, w, y + hgt, -w, y + hgt, -w, y]);
      y += hgt + 0.006;
    }
    var sb = y; // top of sacrum
    var sacrum = spline([-0.046, sb, 0.046, sb, 0.036, sb + 0.05, 0.012, sb + 0.1, -0.012, sb + 0.1, -0.036, sb + 0.05], true, 4);
    // ilium + pubis + ischium (right), relative to sb
    var hip = spline(shift([
      0.042, -0.012, 0.058, -0.07, 0.098, -0.094, 0.134, -0.078, 0.148, -0.038,
      0.138, -0.004, 0.134, 0.022, 0.13, 0.062, 0.124, 0.094, 0.108, 0.124, 0.088, 0.142,
      0.062, 0.136, 0.03, 0.128, 0.008, 0.122, 0.008, 0.098, 0.036, 0.088,
      0.062, 0.066, 0.07, 0.035, 0.062, 0.006
    ], sb), true, 4);
    var obtur = ellipse(0.062, sb + 0.106, 0.018, 0.013, 0, Math.PI * 2, 10, 0.4);
    // femur (right): ball, neck, trochanter, slim shaft, condyles
    var fh = [0.102, sb + 0.062];
    var femCtl = ellipse(fh[0], fh[1], 0.019, 0.019, 40 * d2r, 270 * d2r, 7).concat([
      0.124, sb + 0.05, 0.143, sb + 0.054, 0.156, sb + 0.07, 0.156, sb + 0.1, 0.146, sb + 0.13,
      0.132, 0.24, 0.12, 0.36, 0.12, 0.405, 0.127, 0.433, 0.116, 0.45, 0.096, 0.447, 0.087, 0.437,
      0.076, 0.45, 0.058, 0.447, 0.052, 0.425, 0.064, 0.402, 0.098, 0.33, 0.112, 0.21, 0.118, sb + 0.14,
      0.112, sb + 0.118, 0.106, sb + 0.094
    ]);
    var femur = spline(femCtl, true, 4);
    // lower leg
    var tibia = spline([0.058, 0.466, 0.082, 0.46, 0.116, 0.468, 0.106, 0.505, 0.096, 0.6, 0.093, 0.75, 0.097, 0.83, 0.087, 0.844, 0.074, 0.84, 0.076, 0.75, 0.072, 0.6, 0.064, 0.505], true, 4);
    var fibula = spline([0.122, 0.49, 0.117, 0.6, 0.11, 0.75, 0.111, 0.84], false, 4);
    // thorax and upper limb (faint)
    var ribs = [];
    for (var r = 0; r < 7; r++) {
      var y0 = -0.582 + r * 0.04, wd = [0.085, 0.112, 0.124, 0.128, 0.126, 0.118, 0.104][r];
      ribs.push(spline([0.018, y0, wd * 0.55, y0 - 0.012, wd * 0.92, y0 + 0.01, wd, y0 + 0.045, wd * 0.9, y0 + 0.075], false, 4));
    }
    var clav = spline([0.012, -0.618, 0.07, -0.622, 0.13, -0.608, 0.19, -0.598], false, 5);
    var humHead = ellipse(0.214, -0.532, 0.017, 0.017, 0, Math.PI * 2, 10);
    var humerus = spline([0.228, -0.515, 0.24, -0.42, 0.258, -0.3, 0.278, -0.2], false, 5);
    var radius = spline([0.289, -0.185, 0.308, -0.08, 0.333, 0.035], false, 4);
    var ulna = spline([0.274, -0.19, 0.292, -0.08, 0.318, 0.04], false, 4);
    var handB = spline([0.336, 0.065, 0.348, 0.115, 0.354, 0.16], false, 4);
    var skull = ellipse(0, -0.835, 0.061, 0.086, 0, Math.PI * 2, 24);

    BODY = {
      silhouette: group([silhouette]),
      silR: region([silC]),
      head: region([ellipse(0, -0.835, 0.058, 0.082, 0, Math.PI * 2, 18)]),
      spine: region(spineBlocks),
      pelvisLine: group(both([hip, obtur]).concat([sacrum])),
      pelvisR: region(both([hip]), both([obtur])),
      femurLine: group(both([femur])),
      femurR: region(both([femur])),
      shin: group(both([tibia, fibula])),
      upper: group(both([clav, humHead, humerus, radius, ulna, handB])),
      ribs: group(both(ribs)),
      skull: group([skull]),
      T: [1, 0, -0.08, 0, 1, 0.0],
      sc: 1
    };
    return BODY;
  }
  function body(N, rnd) {
    var G = bodyGeom(), o = out(N);
    var k = lowK(N), f = 0.3 + 0.7 * k, s = 0.5 + 0.5 * k;
    var c = alloc([31, 9, 8, 8, 2 * f, 3 * f, 4 * s, 4 * s, 7 * s, 5 * s, 3 * f, 6 * f, 3 * k], N);
    onGroup(o, G.silhouette, c[0], rnd, 0.0035, 0.8, 0.98);
    inRegionFill(o, G.spine, c[1], rnd, 0.72, 0.98);
    onGroup(o, G.pelvisLine, c[2], rnd, 0.003, 0.72, 0.98);
    onGroup(o, G.femurLine, c[3], rnd, 0.003, 0.72, 0.98);
    inRegionFill(o, G.pelvisR, c[4], rnd, 0.4, 0.6);
    inRegionFill(o, G.femurR, c[5], rnd, 0.5, 0.7);
    onGroup(o, G.shin, c[6], rnd, 0.003, 0.42, 0.62);
    onGroup(o, G.upper, c[7], rnd, 0.003, 0.36, 0.56);
    onGroup(o, G.ribs, c[8], rnd, 0.003, 0.36, 0.56);
    onGroup(o, G.skull, c[9], rnd, 0.004, 0.45, 0.65);
    inRegionFill(o, G.head, c[10], rnd, 0.28, 0.42);
    inRegionFill(o, G.silR, c[11], rnd, 0.13, 0.26);
    onGroup(o, G.silhouette, c[12], rnd, 0.02, 0.1, 0.18);
    return finish(o, G.T);
  }

  R['dexa'] = [
    { name: 'femur', f: femur },
    { name: 'lumbar-spine', f: vertebrae },
    { name: 'body-composition', f: body }
  ];
})();
/* ---- wbmri ---- */
(function () {
  const R = (window.DBSHAPES = window.DBSHAPES || {});

  // ------------------------------------------------------------------
  // Small toolkit: curves -> arc-length polylines -> stratified stipple
  // ------------------------------------------------------------------
  function gauss(rnd) {
    return (rnd() + rnd() + rnd() + rnd() - 2) * 1.7320508;
  }

  // Catmull-Rom spline through flat control points [x0,y0,x1,y1,...]
  function spline(cp, closed, sub) {
    const n = cp.length / 2;
    const out = [];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const i0 = closed ? (i - 1 + n) % n : Math.max(i - 1, 0);
      const i2 = (i + 1) % n;
      const i3 = closed ? (i + 2) % n : Math.min(i + 2, n - 1);
      for (let s = 0; s < sub; s++) {
        const t = s / sub, t2 = t * t, t3 = t2 * t;
        for (let d = 0; d < 2; d++) {
          const p0 = cp[2 * i0 + d], p1 = cp[2 * i + d], p2 = cp[2 * i2 + d], p3 = cp[2 * i3 + d];
          out.push(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3));
        }
      }
    }
    if (closed) out.push(out[0], out[1]);
    else out.push(cp[2 * (n - 1)], cp[2 * (n - 1) + 1]);
    return out;
  }

  // cubic bezier (flat 8 numbers) -> flat polyline
  function bez(b, sub) {
    const out = [];
    for (let s = 0; s <= sub; s++) {
      const t = s / sub, u = 1 - t;
      const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
      out.push(w0 * b[0] + w1 * b[2] + w2 * b[4] + w3 * b[6], w0 * b[1] + w1 * b[3] + w2 * b[5] + w3 * b[7]);
    }
    return out;
  }

  // ellipse arc -> flat polyline
  function arc(cx, cy, rx, ry, a0, a1, sub) {
    const out = [];
    for (let s = 0; s <= sub; s++) {
      const t = a0 + (a1 - a0) * (s / sub);
      out.push(cx + rx * Math.cos(t), cy + ry * Math.sin(t));
    }
    return out;
  }

  function mirrorX(pts) {
    const o = pts.slice();
    for (let i = 0; i < o.length; i += 2) o[i] = -o[i];
    return o;
  }

  // polyline with cumulative arc length
  function pl(pts) {
    const m = pts.length / 2;
    const cum = new Float64Array(m);
    for (let i = 1; i < m; i++) {
      const dx = pts[2 * i] - pts[2 * i - 2], dy = pts[2 * i + 1] - pts[2 * i - 1];
      cum[i] = cum[i - 1] + Math.sqrt(dx * dx + dy * dy);
    }
    return { pts: pts, cum: cum, L: cum[m - 1] || 1e-6 };
  }

  function inPoly(pts, x, y) {
    let bb = pts._bb;
    if (!bb) {
      bb = pts._bb = [9, 9, -9, -9];
      for (let i = 0; i < pts.length; i += 2) {
        if (pts[i] < bb[0]) bb[0] = pts[i];
        if (pts[i] > bb[2]) bb[2] = pts[i];
        if (pts[i + 1] < bb[1]) bb[1] = pts[i + 1];
        if (pts[i + 1] > bb[3]) bb[3] = pts[i + 1];
      }
    }
    if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) return false;
    let c = false;
    const m = pts.length / 2;
    for (let i = 0, j = m - 1; i < m; j = i++) {
      const xi = pts[2 * i], yi = pts[2 * i + 1], xj = pts[2 * j], yj = pts[2 * j + 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  function Pen(N) {
    this.N = N;
    this.i = 0;
    this.p = new Float32Array(2 * N);
    this.a = new Float32Array(N);
  }
  Pen.prototype.put = function (x, y, a) {
    if (this.i >= this.N) return;
    if (this.xf) {
      x = x * this.xf[0] + this.xf[1];
      y = y * this.xf[0] + this.xf[2];
    }
    if (!(x === x)) x = 0;
    if (!(y === y)) y = 0;
    this.p[2 * this.i] = x < -1 ? -1 : x > 1 ? 1 : x;
    this.p[2 * this.i + 1] = y < -1 ? -1 : y > 1 ? 1 : y;
    this.a[this.i] = a < 0 ? 0 : a > 1 ? 1 : a;
    this.i++;
  };

  // A "part" = { w: weight, fn: function(pen, n, rnd) }.
  // Stratified stipple along a polyline.
  //   opt.a  base brightness, opt.av brightness variation
  //   opt.j  perpendicular gaussian jitter, opt.band uniform band half-width
  //   opt.wa/opt.wk  wavy perpendicular offset (amplitude, waves per unit length)
  //   opt.fade  taper brightness toward both ends (0..1)
  //   opt.hide  function(x,y) -> true to skip (dot re-placed elsewhere on the line)
  function line(pts, dens, opt) {
    const P = pl(pts);
    return {
      w: P.L * dens,
      sec: opt.a < 0.5,
      fn: function (pen, n, rnd) {
        const pp = P.pts, cum = P.cum, L = P.L;
        let j = 0;
        const a0 = opt.a, av = opt.av || 0, jt = opt.j || 0, band = opt.band || 0;
        const wa = opt.wa || 0, wk = opt.wk || 0, fade = opt.fade || 0, tail = opt.tail || 0, hide = opt.hide;
        for (let k = 0; k < n; k++) {
          let tries = 0;
          for (;;) {
            let s;
            if (tries === 0) s = ((k + 0.5 + (rnd() - 0.5) * 0.9) / n) * L;
            else s = rnd() * L;
            if (s < 0) s = 0;
            if (s > L) s = L;
            if (tries > 0) j = 0;
            while (j < cum.length - 2 && cum[j + 1] < s) j++;
            const seg = cum[j + 1] - cum[j] || 1e-9;
            const t = (s - cum[j]) / seg;
            const x0 = pp[2 * j], y0 = pp[2 * j + 1], x1 = pp[2 * j + 2], y1 = pp[2 * j + 3];
            let tx = x1 - x0, ty = y1 - y0;
            const tl = Math.sqrt(tx * tx + ty * ty) || 1;
            tx /= tl;
            ty /= tl;
            let off = jt * gauss(rnd);
            if (band) off += (rnd() * 2 - 1) * band;
            if (wa) off += wa * Math.sin(s * wk * 6.2831853);
            const x = x0 + (x1 - x0) * t - ty * off;
            const y = y0 + (y1 - y0) * t + tx * off;
            if (hide && hide(x, y) && tries < 12) {
              tries++;
              continue;
            }
            let a = a0 + (rnd() - 0.5) * av;
            if (fade) {
              const e = Math.min(s, L - s) / (L * 0.5);
              a *= 1 - fade * (1 - Math.min(1, e * 2.2));
            }
            if (tail) {
              const e = (L - s) / (L * tail);
              if (e < 1) a *= 0.2 + 0.8 * e;
            }
            pen.put(x, y, a);
            break;
          }
          if (tries > 0) j = 0;
        }
      },
    };
  }

  // Uniform stipple inside a polygon (plus optional exclusion test).
  function area(poly, w, opt) {
    let mnx = 9, mny = 9, mxx = -9, mxy = -9;
    for (let i = 0; i < poly.length; i += 2) {
      mnx = Math.min(mnx, poly[i]);
      mxx = Math.max(mxx, poly[i]);
      mny = Math.min(mny, poly[i + 1]);
      mxy = Math.max(mxy, poly[i + 1]);
    }
    return {
      w: w,
      sec: true,
      fn: function (pen, n, rnd) {
        const a0 = opt.a, av = opt.av || 0, ok = opt.ok;
        let lx = (mnx + mxx) / 2, ly = (mny + mxy) / 2;
        for (let k = 0; k < n; k++) {
          let x = lx, y = ly, t = 0;
          for (; t < 30; t++) {
            const cx = mnx + (mxx - mnx) * rnd(), cy = mny + (mxy - mny) * rnd();
            if (inPoly(poly, cx, cy) && (!ok || ok(cx, cy))) {
              x = cx;
              y = cy;
              lx = cx;
              ly = cy;
              break;
            }
          }
          pen.put(x, y, a0 + (rnd() - 0.5) * av);
        }
      },
    };
  }

  // Allocate N dots across parts by weight (largest remainder), then draw.
  function compose(N, rnd, parts, xf) {
    const pen = new Pen(N);
    if (xf) pen.xf = xf;
    // at low dot counts give the outlines priority over texture and faint detail
    const sec = Math.max(0.3, Math.min(1, N / 1100));
    const wt = function (q) {
      return q.sec ? q.w * sec : q.w;
    };
    let W = 0;
    for (let i = 0; i < parts.length; i++) W += wt(parts[i]);
    const cnt = new Array(parts.length);
    const rem = [];
    let used = 0;
    for (let i = 0; i < parts.length; i++) {
      const e = (wt(parts[i]) / W) * N;
      cnt[i] = Math.floor(e);
      used += cnt[i];
      rem.push([e - cnt[i], i]);
    }
    rem.sort(function (A, B) {
      return B[0] - A[0] || A[1] - B[1];
    });
    for (let r = 0; used < N; r++, used++) cnt[rem[r % rem.length][1]]++;
    for (let i = 0; i < parts.length; i++) if (cnt[i] > 0) parts[i].fn(pen, cnt[i], rnd);
    // safety: never leave a dot unplaced
    pen.xf = null;
    while (pen.i < N) {
      const s = pen.i > 0 ? Math.floor(rnd() * pen.i) : 0;
      pen.put(pen.p[2 * s] + gauss(rnd) * 0.01, pen.p[2 * s + 1] + gauss(rnd) * 0.01, pen.a[s] || 0.3);
    }
    return { p: pen.p, a: pen.a };
  }

  // ------------------------------------------------------------------
  // 1. Head in profile: sagittal MRI slice
  // ------------------------------------------------------------------
  function buildHead() {
    const S = 12;
    const skin = spline([
      0.40, 0.98, 0.38, 0.72, 0.43, 0.48, 0.58, 0.30, 0.71, 0.04, 0.74, -0.27, 0.65, -0.55,
      0.43, -0.76, 0.10, -0.86, -0.22, -0.83, -0.46, -0.67, -0.60, -0.43, -0.64, -0.22,
      -0.61, -0.12, -0.68, 0.0, -0.78, 0.13, -0.74, 0.19, -0.65, 0.21, -0.66, 0.29,
      -0.62, 0.34, -0.65, 0.39, -0.59, 0.46, -0.62, 0.55, -0.55, 0.64, -0.40, 0.68,
      -0.25, 0.70, -0.18, 0.78, -0.17, 0.98,
    ], false, S);
    const skull = spline([
      -0.52, -0.16, -0.54, -0.40, -0.42, -0.62, -0.20, -0.77, 0.10, -0.80, 0.39, -0.71,
      0.59, -0.53, 0.68, -0.27, 0.66, 0.0, 0.57, 0.21, 0.44, 0.34,
    ], false, S);
    const brain = spline([
      -0.46, -0.24, -0.47, -0.42, -0.37, -0.59, -0.18, -0.71, 0.10, -0.74, 0.35, -0.66,
      0.53, -0.49, 0.62, -0.27, 0.61, -0.06, 0.52, 0.04, 0.38, 0.02, 0.22, -0.01,
      0.10, 0.02, -0.02, 0.02, -0.14, -0.03, -0.28, -0.07, -0.41, -0.11,
    ], true, S);
    const cereb = spline([
      0.18, 0.10, 0.27, 0.05, 0.40, 0.05, 0.53, 0.10, 0.57, 0.18, 0.49, 0.27, 0.35, 0.30,
      0.22, 0.25, 0.17, 0.17,
    ], true, S);
    const cc = spline([
      -0.12, -0.14, -0.21, -0.18, -0.22, -0.29, -0.10, -0.38, 0.06, -0.40, 0.20, -0.35,
      0.28, -0.26, 0.26, -0.19,
    ], false, S);
    const cing = spline([
      -0.31, -0.16, -0.32, -0.38, -0.14, -0.52, 0.08, -0.55, 0.27, -0.48, 0.37, -0.38,
      0.40, -0.52, 0.36, -0.66,
    ], false, S);
    const sulci = [
      [0.13, -0.73, 0.10, -0.66, 0.06, -0.60, 0.03, -0.55],
      [-0.12, -0.71, -0.10, -0.64, -0.07, -0.58],
      [-0.33, -0.60, -0.28, -0.53, -0.21, -0.49],
      [-0.46, -0.36, -0.40, -0.31, -0.35, -0.27],
      [0.30, -0.66, 0.25, -0.60, 0.22, -0.53],
      [0.55, -0.42, 0.48, -0.37, 0.42, -0.30, 0.35, -0.22],
      [0.31, -0.18, 0.40, -0.16, 0.50, -0.14, 0.60, -0.10],
      [-0.42, -0.14, -0.33, -0.17, -0.25, -0.13],
    ];
    const folia = [
      [0.24, 0.16, 0.34, 0.11, 0.45, 0.09],
      [0.24, 0.16, 0.36, 0.16, 0.51, 0.17],
      [0.24, 0.16, 0.34, 0.21, 0.45, 0.25],
    ];
    const stemF = spline([
      0.03, 0.02, 0.0, 0.10, -0.02, 0.19, 0.03, 0.30, 0.10, 0.42, 0.15, 0.56, 0.18, 0.76, 0.19, 0.98,
    ], false, S);
    const stemB = spline([
      0.14, 0.02, 0.16, 0.12, 0.17, 0.22, 0.18, 0.34, 0.22, 0.46, 0.25, 0.58, 0.27, 0.76, 0.27, 0.98,
    ], false, S);
    const palate = spline([-0.63, 0.20, -0.45, 0.17, -0.25, 0.17, -0.12, 0.20], false, S);
    const tongue = spline([-0.57, 0.31, -0.45, 0.25, -0.28, 0.23, -0.14, 0.29, -0.08, 0.40, -0.10, 0.52], false, S);

    // closed region of the whole head (skin + straight line across the neck)
    const headPoly = skin;
    const brainPoly = brain;
    const inBrain = function (x, y) {
      return inPoly(brainPoly, x, y);
    };
    const inCereb = function (x, y) {
      return inPoly(cereb, x, y);
    };

    const parts = [
      line(skin, 62, { a: 0.95, av: 0.1, j: 0.007 }),
      line(skull, 26, { a: 0.42, av: 0.12, j: 0.006, band: 0.012 }),
      line(brain, 66, { a: 0.92, av: 0.1, j: 0.005, wa: 0.012, wk: 7 }),
      line(cc, 95, { a: 0.88, av: 0.12, j: 0.004, band: 0.022 }),
      line(cing, 38, { a: 0.7, av: 0.14, j: 0.005, wa: 0.008, wk: 5, fade: 0.5 }),
      line(cereb, 58, { a: 0.88, av: 0.1, j: 0.005 }),
      line(stemF, 36, { a: 0.72, av: 0.12, j: 0.005, tail: 0.45 }),
      line(stemB, 32, { a: 0.62, av: 0.12, j: 0.005, tail: 0.45 }),
      line(palate, 22, { a: 0.42, av: 0.12, j: 0.005, fade: 0.5 }),
      line(tongue, 20, { a: 0.36, av: 0.12, j: 0.006, fade: 0.6 }),
      area(brainPoly, 140, { a: 0.3, av: 0.14 }),
      area(cereb, 26, { a: 0.32, av: 0.14 }),
      area(headPoly, 70, {
        a: 0.17,
        av: 0.08,
        ok: function (x, y) {
          return !inBrain(x, y) && !inCereb(x, y);
        },
      }),
      line(skin, 10, { a: 0.14, av: 0.06, j: 0.035 }),
    ];
    for (let i = 0; i < sulci.length; i++)
      parts.push(line(spline(sulci[i], false, S), 40, { a: 0.72, av: 0.14, j: 0.004, fade: 0.6 }));
    // cervical vertebral bodies in front of the cord (faint)
    for (let v = 0; v < 4; v++) {
      const y0 = 0.5 + v * 0.115, y1 = y0 + 0.08, xr = 0.115 + v * 0.016, xl = xr - 0.12;
      parts.push(line([xl, y0, xr, y0, xr + 0.008, y0 + 0.04, xr, y1, xl, y1, xl - 0.006, y0 + 0.04, xl, y0], 26, { a: 0.36, av: 0.1, j: 0.004 }));
    }
    for (let i = 0; i < folia.length; i++)
      parts.push(line(spline(folia[i], false, S), 34, { a: 0.55, av: 0.15, j: 0.004, fade: 0.5 }));
    return parts;
  }
  let headParts = null;
  function head(N, rnd) {
    if (!headParts) headParts = buildHead();
    return compose(N, rnd, headParts, [1, -0.03, -0.01]);
  }

  // ------------------------------------------------------------------
  // 2. Chest from the front: sternum, ribs, clavicles, two lungs (CT chest)
  // ------------------------------------------------------------------
  function buildChest() {
    const S = 12;
    const parts = [];
    const W = [0.34, 0.5, 0.61, 0.69, 0.75, 0.78, 0.79, 0.78, 0.75, 0.7];
    const margin = spline([0.066, 0.1, 0.2, 0.22, 0.36, 0.31, 0.52, 0.4, 0.66, 0.46], false, S);
    const marginEnd = [[0.3, 0.27], [0.47, 0.37], [0.62, 0.445]];
    for (let side = -1; side <= 1; side += 2) {
      for (let k = 0; k < 10; k++) {
        const w = W[k], b = -0.74 + 0.088 * k, l = b + 0.12;
        // posterior arc: spine -> lateral (faint, seen through)
        let post = bez([0.05, b, 0.32 * w, b - 0.04, w, l - 0.6 * (l - b) - 0.02, w, l], 24);
        let ant, cart = null;
        if (k < 7) {
          const fx = k === 0 ? 0.1 : 0.072, fy = b + 0.18 + 0.025 * k;
          const low = fy + 0.012 + 0.012 * k, xl = fx + (0.42 - 0.02 * k) * (w - fx);
          // bony anterior rib: lateral -> costochondral junction (lowest point)
          ant = bez([w, l, w, l + 0.55 * (low - l), xl + 0.4 * (w - xl), low, xl, low], 26);
          // costal cartilage rising to the sternum
          cart = bez([xl, low, xl - 0.45 * (xl - fx), low, fx + 0.25 * (xl - fx), fy + 0.3 * (low - fy), fx, fy], 14);
        } else {
          const me = marginEnd[k - 7];
          ant = bez([w, l, w, l + 0.6 * (me[1] - l), me[0] + 0.4 * (w - me[0]), me[1] + 0.01, me[0], me[1]], 26);
        }
        if (side < 0) {
          post = mirrorX(post);
          ant = mirrorX(ant);
          if (cart) cart = mirrorX(cart);
        }
        parts.push(line(post, 14, { a: 0.32, av: 0.12, j: 0.006, fade: 0.4 }));
        parts.push(line(ant, 40, { a: 0.82, av: 0.12, j: 0.005, band: 0.006 }));
        if (cart) parts.push(line(cart, 30, { a: 0.55, av: 0.12, j: 0.004 }));
      }
      const mg = side < 0 ? mirrorX(margin) : margin;
      parts.push(line(mg, 40, { a: 0.72, av: 0.12, j: 0.005 }));
      // clavicle
      let clav = spline([0.11, -0.66, 0.28, -0.69, 0.47, -0.77, 0.66, -0.78, 0.76, -0.74], false, S);
      if (side < 0) clav = mirrorX(clav);
      parts.push(line(clav, 60, { a: 0.92, av: 0.1, j: 0.005, band: 0.012 }));
    }
    // sternum
    const stern = [
      -0.1, -0.66, -0.04, -0.63, 0.04, -0.63, 0.1, -0.66, 0.115, -0.56, 0.068, -0.46, 0.074, -0.2,
      0.066, 0.08, 0.032, 0.14, 0.0, 0.26, -0.032, 0.14, -0.066, 0.08, -0.074, -0.2, -0.068, -0.46,
      -0.115, -0.56, -0.1, -0.66,
    ];
    parts.push(line(stern, 70, { a: 0.95, av: 0.08, j: 0.004 }));
    parts.push(area(stern, 18, { a: 0.4, av: 0.15 }));
    // lungs: set inside the cage so their outline reads on its own
    const lungR = spline([
      -0.3, -0.77, -0.44, -0.65, -0.55, -0.46, -0.62, -0.21, -0.66, 0.05, -0.68, 0.27, -0.67, 0.39,
      -0.55, 0.28, -0.4, 0.22, -0.28, 0.24, -0.19, 0.28, -0.17, 0.08, -0.18, -0.12, -0.16, -0.35,
      -0.16, -0.58, -0.21, -0.73,
    ], true, S);
    const lungL = spline([
      0.3, -0.77, 0.44, -0.65, 0.55, -0.46, 0.62, -0.21, 0.66, 0.05, 0.68, 0.3, 0.67, 0.43,
      0.56, 0.33, 0.44, 0.28, 0.35, 0.32, 0.29, 0.25, 0.27, 0.08, 0.21, -0.06, 0.17, -0.3,
      0.16, -0.58, 0.21, -0.73,
    ], true, S);
    parts.push(line(lungR, 60, { a: 0.9, av: 0.1, j: 0.005 }));
    parts.push(line(lungL, 60, { a: 0.9, av: 0.1, j: 0.005 }));
    parts.push(area(lungR, 90, { a: 0.27, av: 0.12 }));
    parts.push(area(lungL, 86, { a: 0.27, av: 0.12 }));
    // a few bronchial branches from each hilum (faint)
    const br = [
      [-0.15, -0.3, -0.24, -0.42, -0.33, -0.56],
      [-0.15, -0.3, -0.3, -0.26, -0.45, -0.18],
      [-0.16, -0.28, -0.25, -0.1, -0.36, 0.08],
      [-0.25, -0.1, -0.44, 0.0],
    ];
    for (let i = 0; i < br.length; i++) {
      parts.push(line(spline(br[i], false, 8), 26, { a: 0.42, av: 0.12, j: 0.004, fade: 0.7 }));
      const m = mirrorX(br[i]);
      for (let q = 0; q < m.length; q += 2) m[q] = m[q] < 0.2 ? m[q] + 0.0 : m[q] + 0.03;
      parts.push(line(spline(m, false, 8), 26, { a: 0.42, av: 0.12, j: 0.004, fade: 0.7 }));
    }
    // lumbar-ish vertebrae below the sternum (faint)
    for (let j = 0; j < 4; j++) {
      const y0 = 0.31 + j * 0.088, y1 = y0 + 0.066, hw = 0.05 + 0.004 * j;
      parts.push(line([-hw, y0, hw, y0, hw + 0.006, y0 + 0.033, hw, y1, -hw, y1, -hw - 0.006, y0 + 0.033, -hw, y0], 30, { a: 0.34, av: 0.1, j: 0.004 }));
    }
    return parts;
  }
  let chestParts = null;
  function chest(N, rnd) {
    if (!chestParts) chestParts = buildChest();
    return compose(N, rnd, chestParts, [1.1, 0, -0.01]);
  }

  // ------------------------------------------------------------------
  // 3. MRI scanner: ring (bore) at an angle, patient table sliding in
  // ------------------------------------------------------------------
  // split a polyline into the runs whose vertices pass vis(x,y)
  function runs(pts, vis) {
    const out = [];
    let cur = null;
    for (let i = 0; i < pts.length; i += 2) {
      if (vis(pts[i], pts[i + 1])) {
        if (!cur) cur = [];
        cur.push(pts[i], pts[i + 1]);
      } else if (cur) {
        if (cur.length >= 4) out.push(cur);
        cur = null;
      }
    }
    if (cur && cur.length >= 4) out.push(cur);
    return out;
  }

  function hull(pts) {
    const P = [];
    for (let i = 0; i < pts.length; i += 2) P.push([pts[i], pts[i + 1]]);
    P.sort(function (a, b) {
      return a[0] - b[0] || a[1] - b[1];
    });
    const cr = function (o, a, b) {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    };
    const lo = [], up = [];
    for (let i = 0; i < P.length; i++) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P[i]) <= 0) lo.pop();
      lo.push(P[i]);
    }
    for (let i = P.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop();
      up.push(P[i]);
    }
    lo.pop();
    up.pop();
    const h = lo.concat(up), o = [];
    for (let i = 0; i < h.length; i++) o.push(h[i][0], h[i][1]);
    return o;
  }

  function buildScanner() {
    const th = -0.6, ph = 0.4;
    const st = Math.sin(th), ct = Math.cos(th), sp = Math.sin(ph), cp = Math.cos(ph);
    const C = [st * cp, sp, ct * cp], Rv = [ct, 0, -st], U = [-st * sp, cp, -ct * sp];
    const Ro = 1, Ri = 0.6, D = 0.95, yT = -0.3, Tw = 0.3, Th = 0.07, zb = -0.8, zf = 1.95;
    const pw = 0.19, pz0 = 0.6, pz1 = 1.5, yF = -1.0;
    // fit: projected key points -> unit box
    let mnx = 9, mny = 9, mxx = -9, mxy = -9;
    const key = function (x, y, z) {
      const sx = x * Rv[0] + z * Rv[2], sy = -(x * U[0] + y * U[1] + z * U[2]);
      mnx = Math.min(mnx, sx); mxx = Math.max(mxx, sx); mny = Math.min(mny, sy); mxy = Math.max(mxy, sy);
    };
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 6.2831853;
      key(Ro * Math.cos(t), Ro * Math.sin(t), 0);
      key(Ro * Math.cos(t), Ro * Math.sin(t), -D);
    }
    key(-Tw, yT, zf); key(Tw, yT, zf); key(-Tw, yT - Th, zf); key(Tw, yT - Th, zf);
    key(-pw, yF, pz1); key(pw, yF, pz1);
    const k = Math.min(1.86 / (mxx - mnx), 1.8 / (mxy - mny));
    const ox = -k * (mnx + mxx) / 2 - 0.02, oy = -k * (mny + mxy) / 2 - 0.01;
    const sx3 = function (x, y, z) {
      return k * (x * Rv[0] + z * Rv[2]) + ox;
    };
    const sy3 = function (x, y, z) {
      return -k * (x * U[0] + y * U[1] + z * U[2]) + oy;
    };
    const P = function (x, y, z, out) {
      out.push(sx3(x, y, z), sy3(x, y, z));
    };
    // screen -> world point on plane z = z0 (orthographic ray)
    const onZ = function (sx, sy, z0) {
      const rx = (sx - ox) / k, ry = -(sy - oy) / k;
      const d = (z0 - rx * Rv[2] - ry * U[2]) / C[2];
      return [rx * Rv[0] + ry * U[0] + d * C[0], rx * Rv[1] + ry * U[1] + d * C[1]];
    };
    const inBore = function (sx, sy) {
      const q = onZ(sx, sy, 0);
      return q[0] * q[0] + q[1] * q[1] < Ri * Ri * 0.99;
    };
    const box = function (x0, x1, y0, y1, z0, z1) {
      const o = [];
      P(x0, y0, z0, o); P(x1, y0, z0, o); P(x0, y1, z0, o); P(x1, y1, z0, o);
      P(x0, y0, z1, o); P(x1, y0, z1, o); P(x0, y1, z1, o); P(x1, y1, z1, o);
      return hull(o);
    };
    const slabFront = box(-Tw, Tw, yT - Th, yT, 0, zf);
    const slabAll = box(-Tw, Tw, yT - Th, yT, zb, zf);
    const ped = box(-pw, pw, yF, yT - Th, pz0, pz1);

    // patient under a sheet: width / height profiles along the table (z)
    const BZ = [-0.66, -0.6, -0.48, -0.36, -0.29, -0.2, 0.05, 0.4, 0.6, 0.8, 1.1, 1.35, 1.47, 1.54, 1.6];
    const BW = [0.04, 0.09, 0.105, 0.09, 0.07, 0.23, 0.245, 0.21, 0.23, 0.19, 0.155, 0.125, 0.115, 0.12, 0.05];
    const BH = [0.07, 0.16, 0.2, 0.18, 0.1, 0.17, 0.24, 0.2, 0.18, 0.15, 0.13, 0.1, 0.1, 0.22, 0.08];
    const prof = function (z, arr) {
      if (z <= BZ[0]) return arr[0];
      for (let i = 1; i < BZ.length; i++)
        if (z <= BZ[i]) {
          const t = (z - BZ[i - 1]) / (BZ[i] - BZ[i - 1]), s = t * t * (3 - 2 * t);
          return arr[i - 1] + (arr[i] - arr[i - 1]) * s;
        }
      return arr[arr.length - 1];
    };
    const zH = BZ[0], zFt = BZ[BZ.length - 1];
    // silhouette angle on the far side (where the sheet turns away from the camera)
    const silA = function (w, h) {
      return Math.atan2(-C[0] * h, C[1] * w);
    };
    const bodyPt = function (z, al) {
      const w = prof(z, BW), h = prof(z, BH);
      return [w * Math.cos(al), yT + h * Math.sin(al), z];
    };
    const bodyPoly = function (z0, z1) {
      const o = [];
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const z = z0 + (z1 - z0) * (i / n), w = prof(z, BW), h = prof(z, BH);
        const q = bodyPt(z, silA(w, h));
        P(q[0], q[1], q[2], o);
      }
      for (let i = n; i >= 0; i--) {
        const z = z0 + (z1 - z0) * (i / n);
        const q = bodyPt(z, Math.PI);
        P(q[0], q[1], q[2], o);
      }
      return o;
    };
    const bodyFront = bodyPoly(0, zFt);
    const bodyAll = bodyPoly(zH, zFt);

    const occFront = function (x, y) {
      return inPoly(slabFront, x, y) || inPoly(ped, x, y) || inPoly(bodyFront, x, y);
    };
    // visibility by 3D position + screen position
    const VIS = {
      face: function (x, y, z, sx, sy) {
        return !occFront(sx, sy);
      },
      bore: function (x, y, z, sx, sy) {
        return inBore(sx, sy) && !inPoly(slabAll, sx, sy) && !inPoly(bodyAll, sx, sy);
      },
      table: function (x, y, z, sx, sy) {
        return z >= 0 || inBore(sx, sy);
      },
      tableFar: function (x, y, z, sx, sy) {
        return (z >= 0 || inBore(sx, sy)) && !inPoly(bodyAll, sx, sy);
      },
      body: function (x, y, z, sx, sy) {
        return z >= 0 || inBore(sx, sy);
      },
    };
    const parts = [];
    // 3D path -> visible screen runs -> stipple lines
    const path = function (fn, sub, vis, dens, opt) {
      let cur = null;
      const flush = function () {
        if (cur && cur.length >= 4) parts.push(line(cur, dens, opt));
        cur = null;
      };
      for (let s = 0; s <= sub; s++) {
        const q = fn(s / sub);
        const X = sx3(q[0], q[1], q[2]), Y = sy3(q[0], q[1], q[2]);
        if (!vis || vis(q[0], q[1], q[2], X, Y)) {
          if (!cur) cur = [];
          cur.push(X, Y);
        } else flush();
      }
      flush();
    };
    const seg = function (a, b) {
      return function (t) {
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      };
    };
    const circ = function (r, z, a0, a1) {
      return function (t) {
        const u = a0 + (a1 - a0) * t;
        return [r * Math.cos(u), r * Math.sin(u), z];
      };
    };
    const TAU = 6.2831853, H = Math.PI / 2;
    const tc = Math.atan2(C[1], C[0]);

    // gantry front face: outer rim, bore rim, bevel
    path(circ(Ro, 0, 0, TAU), 200, VIS.face, 54, { a: 0.92, av: 0.1, j: 0.005 });
    path(circ(Ri, 0, 0, TAU), 160, VIS.face, 62, { a: 0.95, av: 0.08, j: 0.004 });
    path(circ(Ri + 0.09, 0, 0, TAU), 160, VIS.face, 20, { a: 0.42, av: 0.12, j: 0.004 });
    // housing depth: back rim (visible half) and silhouette generators
    path(circ(Ro, -D, tc - H, tc + H), 120, VIS.face, 32, { a: 0.6, av: 0.12, j: 0.005 });
    for (let s = -1; s <= 1; s += 2) {
      const t = tc + s * H, c = Math.cos(t), si = Math.sin(t);
      path(seg([Ro * c, Ro * si, 0], [Ro * c, Ro * si, -D]), 30, VIS.face, 40, { a: 0.7, av: 0.12, j: 0.005 });
      path(seg([Ri * c, Ri * si, 0], [Ri * c, Ri * si, -D]), 40, VIS.bore, 16, { a: 0.3, av: 0.1, j: 0.004, fade: 0.6 });
    }
    // far end of the bore, seen through the opening
    path(circ(Ri, -D, tc + H, tc + 3 * H), 120, VIS.bore, 46, { a: 0.7, av: 0.12, j: 0.004 });

    // patient table
    path(seg([-Tw, yT, zb], [-Tw, yT, zf]), 160, VIS.table, 46, { a: 0.9, av: 0.1, j: 0.004 });
    path(seg([Tw, yT, zb], [Tw, yT, zf]), 160, VIS.tableFar, 36, { a: 0.7, av: 0.1, j: 0.004 });
    path(seg([-Tw, yT, zb], [Tw, yT, zb]), 30, VIS.tableFar, 30, { a: 0.55, av: 0.1, j: 0.004 });
    path(seg([-Tw, yT, zf], [Tw, yT, zf]), 40, null, 50, { a: 0.92, av: 0.08, j: 0.004 });
    path(seg([-Tw, yT - Th, 0], [-Tw, yT - Th, zf]), 120, null, 28, { a: 0.55, av: 0.12, j: 0.004 });
    path(seg([-Tw, yT - Th, zf], [Tw, yT - Th, zf]), 40, null, 28, { a: 0.6, av: 0.12, j: 0.004 });
    path(seg([-Tw, yT, zf], [-Tw, yT - Th, zf]), 8, null, 40, { a: 0.7, av: 0.1, j: 0.003 });
    path(seg([Tw, yT, zf], [Tw, yT - Th, zf]), 8, null, 40, { a: 0.6, av: 0.1, j: 0.003 });
    // pedestal
    path(seg([-pw, yT - Th, pz1], [-pw, yF, pz1]), 40, null, 30, { a: 0.55, av: 0.12, j: 0.004 });
    path(seg([pw, yT - Th, pz1], [pw, yF, pz1]), 40, null, 26, { a: 0.45, av: 0.12, j: 0.004 });
    path(seg([-pw, yF, pz1], [pw, yF, pz1]), 30, null, 26, { a: 0.45, av: 0.12, j: 0.004 });
    path(seg([-pw, yF, pz0], [-pw, yF, pz1]), 40, null, 26, { a: 0.45, av: 0.12, j: 0.004 });
    path(seg([-pw, yT - Th, pz0], [-pw, yF, pz0]), 40, null, 20, { a: 0.35, av: 0.12, j: 0.004 });

    // patient: far silhouette (bright), near contact line, a few cross-contours
    path(function (t) {
      const z = zH + (zFt - zH) * t;
      return bodyPt(z, silA(prof(z, BW), prof(z, BH)));
    }, 160, VIS.body, 56, { a: 0.9, av: 0.08, j: 0.004 });
    const CZ = [-0.48, -0.16, 0.1, 0.38, 0.62, 0.9, 1.2];
    for (let i = 0; i < CZ.length; i++) {
      const z = CZ[i], a0 = silA(prof(z, BW), prof(z, BH));
      path(function (t) {
        return bodyPt(z, a0 + (Math.PI - a0) * t);
      }, 20, VIS.body, 28, { a: 0.45, av: 0.1, j: 0.004, fade: 0.4 });
    }

    // textures
    const surf = function (w, sample, vis, a, av) {
      parts.push({
        w: w,
        sec: true,
        fn: function (pen, n, rnd) {
          let lx = 0, ly = 0;
          for (let i = 0; i < n; i++) {
            let x = lx, y = ly;
            for (let t = 0; t < 30; t++) {
              const q = sample(rnd);
              const X = sx3(q[0], q[1], q[2]), Y = sy3(q[0], q[1], q[2]);
              if (!vis || vis(q[0], q[1], q[2], X, Y)) {
                x = X; y = Y; lx = x; ly = y;
                break;
              }
            }
            pen.put(x, y, a + (rnd() - 0.5) * av);
          }
        },
      });
    };
    // front face annulus
    surf(150, function (rnd) {
      const t = rnd() * TAU, r = Math.sqrt(Ri * Ri + (Ro * Ro - Ri * Ri) * rnd());
      return [r * Math.cos(t), r * Math.sin(t), 0];
    }, VIS.face, 0.26, 0.12);
    // outer housing side (visible half)
    surf(70, function (rnd) {
      const t = tc + (rnd() * 2 - 1) * H;
      return [Ro * Math.cos(t), Ro * Math.sin(t), -D * rnd()];
    }, VIS.face, 0.2, 0.1);
    // inner bore wall
    surf(50, function (rnd) {
      const t = tc + H + rnd() * 2 * H;
      return [Ri * Math.cos(t), Ri * Math.sin(t), -D * rnd()];
    }, VIS.bore, 0.22, 0.1);
    // table top
    surf(40, function (rnd) {
      return [(rnd() * 2 - 1) * Tw, yT, zb + (zf - zb) * rnd()];
    }, function (x, y, z, X, Y) {
      return VIS.table(x, y, z, X, Y) && !inPoly(bodyAll, X, Y);
    }, 0.24, 0.1);
    // sheet over the patient
    surf(70, function (rnd) {
      const z = zH + (zFt - zH) * rnd(), w = prof(z, BW), h = prof(z, BH), a0 = silA(w, h);
      return bodyPt(z, a0 + (Math.PI - a0) * rnd());
    }, VIS.body, 0.28, 0.12);
    // floor shadow
    surf(36, function (rnd) {
      return [gauss(rnd) * 0.4, yF, -0.45 + rnd() * 2.0];
    }, null, 0.13, 0.06);
    return parts;
  }

  let scannerParts = null;
  function scanner(N, rnd) {
    if (!scannerParts) scannerParts = buildScanner();
    return compose(N, rnd, scannerParts);
  }

  R['wbmri'] = [
    { name: 'mri-head', f: head },
    { name: 'ct-chest', f: chest },
    { name: 'mri-scanner', f: scanner },
  ];
})();
/* ---- consult ---- */
(function () {
  const R = (window.DBSHAPES = window.DBSHAPES || {});

  /* ------------------------------------------------------------------ *
   *  Geometry helpers. All curves are flat arrays [x0,y0,x1,y1,...].   *
   *  Unit box: x,y in [-1,1], y pointing down.                         *
   * ------------------------------------------------------------------ */

  // Catmull-Rom spline through control points P ([[x,y],...]).
  function spline(P, closed, k) {
    const n = P.length, out = [];
    const spans = closed ? n : n - 1;
    k = k || 8;
    for (let i = 0; i < spans; i++) {
      const p0 = P[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
      const p1 = P[i];
      const p2 = P[(i + 1) % n];
      const p3 = P[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      for (let s = 0; s < k; s++) {
        const t = s / k, t2 = t * t, t3 = t2 * t;
        out.push(
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)
        );
      }
    }
    if (!closed) out.push(P[n - 1][0], P[n - 1][1]);
    return out;
  }

  function ellipse(cx, cy, rx, ry, rot, n) {
    n = n || 48;
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0), out = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2, ex = Math.cos(t) * rx, ey = Math.sin(t) * ry;
      out.push(cx + ex * c - ey * s, cy + ex * s + ey * c);
    }
    return out;
  }

  function roundRect(x0, y0, x1, y1, r, k) {
    k = k || 6;
    const out = [];
    const cs = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i <= k; i++) {
        const t = cs[c][2] + (i / k) * (Math.PI / 2);
        out.push(cs[c][0] + Math.cos(t) * r, cs[c][1] + Math.sin(t) * r);
      }
    }
    return out;
  }

  function line(x0, y0, x1, y1) { return [x0, y0, x1, y1]; }

  // Offset a dense open centreline by +-w/2 (w may be a function of t in [0,1]).
  // Returns { l, r, poly, a: [x,y,nx,ny,w] at start, b: same at end }.
  function tube(C, w) {
    const n = C.length / 2, L = [], Rr = [];
    const wf = typeof w === 'function' ? w : function () { return w; };
    let ends = [];
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1);
      let tx = C[2 * i1] - C[2 * i0], ty = C[2 * i1 + 1] - C[2 * i0 + 1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const nx = -ty, ny = tx, hw = wf(i / (n - 1)) / 2;
      const x = C[2 * i], y = C[2 * i + 1];
      L.push(x + nx * hw, y + ny * hw);
      Rr.push(x - nx * hw, y - ny * hw);
      if (i === 0) ends[0] = [x, y, tx, ty, hw];
      if (i === n - 1) ends[1] = [x, y, tx, ty, hw];
    }
    const poly = L.slice();
    for (let i = n - 1; i >= 0; i--) poly.push(Rr[2 * i], Rr[2 * i + 1]);
    return { l: L, r: Rr, poly: poly, a: ends[0], b: ends[1] };
  }

  // Elliptical cut-end of a tube (vessel opening / tube cap).
  function capOf(e, depth) {
    const x = e[0], y = e[1], tx = e[2], ty = e[3], hw = e[4];
    return ellipse(x, y, hw * (depth || 0.32), hw, Math.atan2(ty, tx), 28);
  }

  /* ------------------------------ polygons ---------------------------- */

  function poly() {
    const rings = Array.prototype.slice.call(arguments);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, area = 0;
    for (const r of rings) {
      let a = 0;
      for (let i = 0, n = r.length / 2; i < n; i++) {
        const j = (i + 1) % n;
        a += r[2 * i] * r[2 * j + 1] - r[2 * j] * r[2 * i + 1];
        if (r[2 * i] < x0) x0 = r[2 * i];
        if (r[2 * i] > x1) x1 = r[2 * i];
        if (r[2 * i + 1] < y0) y0 = r[2 * i + 1];
        if (r[2 * i + 1] > y1) y1 = r[2 * i + 1];
      }
      area += Math.abs(a / 2);
    }
    return { r: rings, x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  function inside(P, x, y) {
    if (x < P.x0 || x > P.x1 || y < P.y0 || y > P.y1) return false;
    let c = false;
    for (const r of P.r) {
      const n = r.length / 2;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = r[2 * i + 1], yj = r[2 * j + 1];
        if ((yi > y) !== (yj > y)) {
          const xi = r[2 * i], xj = r[2 * j];
          if (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
      }
    }
    return c;
  }

  // Sorted x-crossings of a horizontal line with all rings of a polygon.
  function crossings(P, y) {
    const xs = [];
    if (y < P.y0 || y > P.y1) return xs;
    for (const r of P.r) {
      const n = r.length / 2;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = r[2 * i + 1], yj = r[2 * j + 1];
        if ((yi > y) !== (yj > y)) xs.push(((r[2 * j] - r[2 * i]) * (y - yi)) / (yj - yi) + r[2 * i]);
      }
    }
    return xs.sort(function (a, b) { return a - b; });
  }

  function parity(xs, x) {
    let c = 0;
    while (c < xs.length && xs[c] < x) c++;
    return (c & 1) === 1;
  }

  function hidden(list, x, y) {
    if (!list) return false;
    for (let i = 0; i < list.length; i++) if (inside(list[i], x, y)) return true;
    return false;
  }

  /* ------------------------------ renderer ---------------------------- *
   *  parts:                                                              *
   *   {s: flatPts, c: closed, w: dots per unit length, a:[lo,hi],        *
   *    j: jitter sigma, h: [polys hiding it]}                            *
   *   {f: poly, w: dots per unit area, a:[lo,hi], h, sh: shade(x,y)}     *
   *  prepare() does all geometry work that does not depend on N or rnd   *
   *  (visibility, areas, coverage rasters, fit). It runs once per shape. *
   * -------------------------------------------------------------------- */

  function prepare(parts, fit) {
    const STEP = 0.02, G = 32;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const q of parts) {
      if (q.s) {
        const P = q.s, n = P.length / 2, m = q.c ? n : n - 1;
        const xs = [], ys = [], dx = [], dy = [], nx = [], ny = [], cum = [];
        let Lt = 0;
        for (let i = 0; i < m; i++) {
          const j = (i + 1) % n;
          const x0 = P[2 * i], y0 = P[2 * i + 1];
          const ex = P[2 * j] - x0, ey = P[2 * j + 1] - y0;
          const len = Math.hypot(ex, ey);
          if (len < 1e-9) continue;
          const k = Math.max(1, Math.ceil(len / STEP));
          const sx = ex / k, sy = ey / k, sl = len / k;
          for (let s = 0; s < k; s++) {
            const ax = x0 + sx * s, ay = y0 + sy * s;
            if (q.h && hidden(q.h, ax + sx * 0.5, ay + sy * 0.5)) continue;
            xs.push(ax); ys.push(ay); dx.push(sx); dy.push(sy);
            nx.push(-ey / len); ny.push(ex / len);
            Lt += sl; cum.push(Lt);
            if (q.a[0] >= 0.2) {
              if (ax < bx0) bx0 = ax; if (ax > bx1) bx1 = ax;
              if (ay < by0) by0 = ay; if (ay > by1) by1 = ay;
            }
          }
        }
        q._ = { xs: xs, ys: ys, dx: dx, dy: dy, nx: nx, ny: ny, cum: cum, L: Lt, sl: [] };
        for (let i = 0; i < xs.length; i++) q._.sl.push(Math.hypot(dx[i], dy[i]));
        q.m = Lt * q.w;
      } else {
        // Coverage raster: 0 = out/hidden, 1 = fully visible, 2 = edge (exact test).
        const P = q.f, gw = (P.x1 - P.x0) / G, gh = (P.y1 - P.y0) / G;
        const cov = new Uint8Array(G * G);
        const vis = function (x, y) { return inside(P, x, y) && !hidden(q.h, x, y); };
        // Scanline visibility: one crossing list per row, then parity per x.
        const rowVis = function (y, x0, step, n, outArr, off) {
          const own = crossings(P, y), hs = [];
          if (q.h) for (const H of q.h) if (y >= H.y0 && y <= H.y1) hs.push(crossings(H, y));
          for (let i = 0; i < n; i++) {
            const x = x0 + i * step;
            let v = parity(own, x);
            for (let h = 0; v && h < hs.length; h++) if (parity(hs[h], x)) v = false;
            outArr[off + i] = v ? 1 : 0;
          }
        };
        const cg = new Uint8Array((G + 1) * (G + 1)), cc = new Uint8Array(G * G);
        for (let gy = 0; gy <= G; gy++) rowVis(P.y0 + gy * gh, P.x0, gw, G + 1, cg, gy * (G + 1));
        for (let gy = 0; gy < G; gy++) rowVis(P.y0 + (gy + 0.5) * gh, P.x0 + 0.5 * gw, gw, G, cc, gy * G);
        let area = 0;
        for (let gy = 0; gy < G; gy++) {
          for (let gx = 0; gx < G; gx++) {
            const cx = P.x0 + (gx + 0.5) * gw, cy = P.y0 + (gy + 0.5) * gh;
            const s = cg[gy * (G + 1) + gx] + cg[gy * (G + 1) + gx + 1] + cg[(gy + 1) * (G + 1) + gx] + cg[(gy + 1) * (G + 1) + gx + 1] + cc[gy * G + gx];
            cov[gy * G + gx] = s === 5 ? 1 : s === 0 ? 0 : 2;
            area += (s / 5) * gw * gh * (q.sh ? q.sh(cx, cy) : 1);
          }
        }
        q._ = { area: area, cov: cov, G: G, gw: gw, gh: gh, vis: vis };
        q.m = area * q.w;
      }
    }
    const pad = 0.008;
    bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad;
    return { parts: parts, sc: (2 * (fit || 0.9)) / Math.max(bx1 - bx0, by1 - by0), cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2 };
  }

  function sample(N, rnd, S) {
    const parts = S.parts;
    const out = { p: new Float32Array(2 * N), a: new Float32Array(N) };
    const gauss = function () { return (rnd() + rnd() + rnd() + rnd() - 2) * 1.732; };
    let total = 0;
    for (const q of parts) total += q.m;

    // Largest-remainder allocation so the counts add up to exactly N.
    const counts = [], rem = [];
    let used = 0;
    for (let i = 0; i < parts.length; i++) {
      const ex = total > 0 ? (parts[i].m / total) * N : 0;
      counts.push(Math.floor(ex)); rem.push([ex - Math.floor(ex), i]);
      used += counts[i];
    }
    rem.sort(function (u, v) { return v[0] - u[0] || u[1] - v[1]; });
    for (let i = 0; used < N; i = (i + 1) % rem.length) { counts[rem[i][1]]++; used++; }

    const sc = S.sc, ox = S.cx, oy = S.cy;
    let o = 0;
    const put = function (x, y, a) {
      x = (x - ox) * sc; y = (y - oy) * sc;
      out.p[2 * o] = x < -0.995 ? -0.995 : x > 0.995 ? 0.995 : x;
      out.p[2 * o + 1] = y < -0.995 ? -0.995 : y > 0.995 ? 0.995 : y;
      out.a[o] = a; o++;
    };

    for (let pi = 0; pi < parts.length; pi++) {
      const q = parts[pi], c = counts[pi], lo = q.a[0], hi = q.a[1];
      if (!c) continue;
      if (q.s) {
        const d = q._;
        if (!d.cum.length) { for (let i = 0; i < c; i++) put(q.s[0], q.s[1], lo); continue; }
        let k = 0;
        const last = d.cum.length - 1, jit = q.j || 0;
        for (let i = 0; i < c; i++) {
          const s = ((i + rnd()) / c) * d.L;
          while (k < last && d.cum[k] < s) k++;
          let f = 1 - (d.cum[k] - s) / d.sl[k];
          f = f < 0 ? 0 : f > 1 ? 1 : f;
          const g = gauss() * jit;
          put(d.xs[k] + d.dx[k] * f + d.nx[k] * g, d.ys[k] + d.dy[k] * f + d.ny[k] * g, lo + (hi - lo) * rnd());
        }
      } else {
        const P = q.f, d = q._, G = d.G;
        const ok = function (x, y) {
          const gx = Math.floor((x - P.x0) / d.gw), gy = Math.floor((y - P.y0) / d.gh);
          if (gx < 0 || gy < 0 || gx >= G || gy >= G) return false;
          const v = d.cov[gy * G + gx];
          return v === 1 || (v === 2 && d.vis(x, y));
        };
        // Jittered lattice for an even stipple, trimmed / topped up to c.
        const cell = Math.sqrt(Math.max(d.area, 1e-6) / c);
        const pts = [];
        if (d.area > 1e-6) {
          for (let y = P.y0 + cell * 0.5 * rnd(); y < P.y1; y += cell) {
            for (let x = P.x0 + cell * 0.5 * rnd(); x < P.x1; x += cell) {
              const px = x + (rnd() - 0.5) * cell * 0.9, py = y + (rnd() - 0.5) * cell * 0.9;
              if (!ok(px, py)) continue;
              if (q.sh && rnd() > q.sh(px, py)) continue;
              pts.push(px, py);
            }
          }
        }
        const have = pts.length / 2;
        let lastX = (P.x0 + P.x1) / 2, lastY = (P.y0 + P.y1) / 2;
        if (have) { lastX = pts[0]; lastY = pts[1]; }
        for (let i = 0; i < c; i++) {
          if (i < have) {
            const r = i + Math.floor(rnd() * (have - i)); // partial Fisher-Yates pick
            const tx = pts[2 * i], ty = pts[2 * i + 1];
            pts[2 * i] = pts[2 * r]; pts[2 * i + 1] = pts[2 * r + 1];
            pts[2 * r] = tx; pts[2 * r + 1] = ty;
            put(pts[2 * i], pts[2 * i + 1], lo + (hi - lo) * rnd());
          } else {
            let px = lastX, py = lastY;
            for (let t = 0; t < 40; t++) {
              const x = P.x0 + rnd() * (P.x1 - P.x0), y = P.y0 + rnd() * (P.y1 - P.y0);
              if (ok(x, y)) { px = x; py = y; break; }
            }
            put(px, py, lo + (hi - lo) * rnd());
          }
        }
      }
    }
    return out;
  }

  // Wrap a geometry builder: build + prepare once, then sample per call.
  function shape(build, fit) {
    let S = null;
    return function (N, rnd) {
      if (!S) S = prepare(build(), fit);
      return sample(Math.max(0, N | 0), rnd, S);
    };
  }

  const OUT = [0.86, 1.0];     // outline / membrane
  const MID = [0.55, 0.78];    // secondary structure lines
  const TEX = [0.25, 0.48];    // interior texture
  const HALO = [0.1, 0.17];    // faint halo

  /* =============================== HEART =============================== */
  const heart = shape(function () {
    const bodyC = spline([
      [-0.38, -0.20], [-0.56, -0.14], [-0.68, 0.02], [-0.70, 0.24], [-0.62, 0.44],
      [-0.44, 0.60], [-0.20, 0.75], [0.04, 0.86], [0.22, 0.93], [0.35, 0.87],
      [0.47, 0.70], [0.57, 0.46], [0.62, 0.22], [0.59, 0.02], [0.47, -0.10],
      [0.28, -0.14], [0.04, -0.12], [-0.18, -0.17]
    ], true, 8);
    const body = poly(bodyC);

    // Pulmonary trunk: rises from the right ventricle, swings right under the arch.
    const paC = spline([[0.12, 0.02], [0.16, -0.20], [0.25, -0.36], [0.42, -0.45], [0.60, -0.45], [0.72, -0.40]], false, 10);
    const pa = tube(paC, function (t) { return 0.19 - 0.06 * t; });
    const paP = poly(pa.poly);

    // Left auricle peeking between trunk and ventricle.
    const aurC = spline([[0.36, -0.15], [0.45, -0.22], [0.56, -0.24], [0.64, -0.18], [0.67, -0.08], [0.62, 0.00], [0.565, -0.035], [0.51, 0.005], [0.46, -0.05], [0.41, -0.07]], true, 6);
    const aur = poly(aurC);

    // Aorta: ascending, arch, start of the descending limb (goes behind the trunk).
    const aoC = spline([[-0.10, 0.00], [-0.16, -0.32], [-0.15, -0.58], [-0.04, -0.76], [0.15, -0.83], [0.33, -0.77], [0.44, -0.62], [0.48, -0.44]], false, 10);
    const ao = tube(aoC, 0.22);
    const aoP = poly(ao.poly);

    // Great vessels from the arch.
    const brs = [
      tube(spline([[-0.06, -0.70], [-0.10, -0.84], [-0.14, -0.97]], false, 8), 0.085),
      tube(spline([[0.10, -0.76], [0.10, -0.88], [0.10, -0.99]], false, 8), 0.065),
      tube(spline([[0.25, -0.72], [0.29, -0.86], [0.34, -0.96]], false, 8), 0.075)
    ];

    // Superior vena cava on the viewer's left.
    const svcC = spline([[-0.42, -0.08], [-0.43, -0.38], [-0.42, -0.68]], false, 8);
    const svc = tube(svcC, 0.15);
    const svcP = poly(svc.poly);

    const hBody = [paP, aur];
    const hAo = [paP, aur, body];
    const hBr = [aoP];
    const hSvc = [body, aoP];

    const light = function (x, y) { return Math.max(0.18, Math.min(1, 0.55 - 0.75 * (x * 0.55 + (y - 0.3) * 0.6))); };

    const parts = [
      // silhouettes
      { s: bodyC, c: true, w: 1, a: OUT, j: 0.005, h: hBody },
      { s: pa.l, w: 1, a: OUT, j: 0.004 }, { s: pa.r, w: 1, a: OUT, j: 0.004, h: [body] },
      { s: capOf(pa.b), c: true, w: 0.9, a: OUT, j: 0.003 },
      { s: aurC, c: true, w: 1, a: OUT, j: 0.004, h: [paP] },
      { s: ao.l, w: 1, a: OUT, j: 0.004, h: hAo }, { s: ao.r, w: 1, a: OUT, j: 0.004, h: hAo },
      { s: svc.l, w: 1, a: OUT, j: 0.004, h: hSvc }, { s: svc.r, w: 1, a: OUT, j: 0.004, h: hSvc },
      { s: capOf(svc.b), c: true, w: 0.9, a: OUT, j: 0.003 },
      // grooves: anterior interventricular and right coronary
      { s: spline([[0.30, -0.06], [0.27, 0.18], [0.22, 0.44], [0.21, 0.68], [0.25, 0.90]], false, 8), w: 0.75, a: MID, j: 0.007, h: hBody },
      { s: spline([[-0.30, -0.14], [-0.38, 0.06], [-0.43, 0.30], [-0.52, 0.52]], false, 8), w: 0.75, a: MID, j: 0.007, h: hBody },
      // a few fine coronary branches
      { s: spline([[0.255, 0.22], [0.33, 0.30], [0.42, 0.36], [0.50, 0.46]], false, 6), w: 0.5, a: [0.4, 0.6], j: 0.005 },
      { s: spline([[0.215, 0.50], [0.29, 0.58], [0.36, 0.70]], false, 6), w: 0.5, a: [0.4, 0.6], j: 0.005 },
      { s: spline([[-0.44, 0.34], [-0.36, 0.44], [-0.24, 0.52], [-0.14, 0.64]], false, 6), w: 0.5, a: [0.4, 0.6], j: 0.005 },
      // interiors
      { f: body, w: 4.4, a: TEX, h: hBody, sh: light },
      { f: paP, w: 2.4, a: TEX, h: [body] },
      { f: aur, w: 3.0, a: TEX, h: [paP] },
      { f: aoP, w: 2.2, a: TEX, h: hAo },
      { f: svcP, w: 2.0, a: TEX, h: hSvc },
      // halo
      { s: bodyC, c: true, w: 0.08, a: HALO, j: 0.05 }
    ];
    for (const b of brs) {
      parts.push({ s: b.l, w: 1, a: OUT, j: 0.003, h: hBr }, { s: b.r, w: 1, a: OUT, j: 0.003, h: hBr },
        { s: capOf(b.b, 0.4), c: true, w: 0.9, a: OUT, j: 0.002 });
    }
    return parts;
  }, 0.92);

  /* ============================ STETHOSCOPE ============================ */
  const stethoscope = shape(function () {
    const mir = function (P) { return P.map(function (p) { return [-0.82 - p[0], p[1]]; }); };
    const binL = [[-0.62, -0.87], [-0.70, -0.80], [-0.74, -0.64], [-0.72, -0.44], [-0.62, -0.24], [-0.50, -0.10], [-0.43, -0.02]];
    const bL = tube(spline(binL, false, 8), 0.038);
    const bR = tube(spline(mir(binL), false, 8), 0.038);

    const earL = ellipse(-0.575, -0.895, 0.07, 0.045, -0.35, 36);
    const earR = ellipse(-0.245, -0.895, 0.07, 0.045, 0.35, 36);
    const earLP = poly(earL), earRP = poly(earR);

    // Y-fitting where the binaurals meet the tubing.
    const yfit = roundRect(-0.455, -0.06, -0.365, 0.08, 0.03, 4);
    const yfitP = poly(yfit);

    const tubeC = spline([[-0.41, 0.08], [-0.42, 0.30], [-0.37, 0.53], [-0.22, 0.71], [0.00, 0.80], [0.22, 0.77], [0.38, 0.66], [0.45, 0.53]], false, 10);
    const tb = tube(tubeC, 0.075);
    const tbP = poly(tb.poly);

    // Chest piece.
    const cx = 0.46, cy = 0.17, rr = 0.27;
    const disc = ellipse(cx, cy, rr, rr, 0, 72);
    const rim = ellipse(cx, cy, rr * 0.8, rr * 0.8, 0, 64);
    const hub = ellipse(cx, cy, rr * 0.16, rr * 0.16, 0, 20);
    const discP = poly(disc), rimP = poly(rim);
    const stem = roundRect(cx - 0.035, cy + rr - 0.02, cx + 0.035, 0.56, 0.015, 3);
    const stemP = poly(stem);
    const collar = roundRect(cx - 0.05, 0.50, cx + 0.05, 0.56, 0.02, 3);

    const hBin = [yfitP, earLP, earRP];
    const discLight = function (x, y) { return Math.max(0.3, Math.min(1, 0.65 - 1.4 * ((x - cx) * 0.6 + (y - cy) * 0.8))); };

    const parts = [
      { s: bL.l, w: 1, a: OUT, j: 0.003, h: hBin }, { s: bL.r, w: 1, a: OUT, j: 0.003, h: hBin },
      { s: bR.l, w: 1, a: OUT, j: 0.003, h: hBin }, { s: bR.r, w: 1, a: OUT, j: 0.003, h: hBin },
      { s: earL, c: true, w: 1.1, a: OUT, j: 0.003 }, { s: earR, c: true, w: 1.1, a: OUT, j: 0.003 },
      { f: earLP, w: 6, a: [0.4, 0.62] }, { f: earRP, w: 6, a: [0.4, 0.62] },
      { s: yfit, c: true, w: 1, a: OUT, j: 0.003 }, { f: yfitP, w: 5, a: [0.4, 0.6] },
      { s: tb.l, w: 1, a: OUT, j: 0.004, h: [yfitP, stemP] }, { s: tb.r, w: 1, a: OUT, j: 0.004, h: [yfitP, stemP] },
      { f: tbP, w: 3.0, a: TEX, h: [yfitP, stemP] },
      { s: stem, c: true, w: 1, a: OUT, j: 0.002, h: [discP] },
      { s: collar, c: true, w: 0.9, a: OUT, j: 0.002 },
      { s: disc, c: true, w: 1.25, a: OUT, j: 0.004 },
      { s: rim, c: true, w: 0.9, a: MID, j: 0.004 },
      { s: hub, c: true, w: 0.7, a: MID, j: 0.002 },
      { f: poly(disc, rim), w: 4.5, a: [0.35, 0.6], sh: discLight },
      { f: rimP, w: 2.2, a: TEX, sh: discLight },
      { s: disc, c: true, w: 0.1, a: HALO, j: 0.05 },
      { s: tubeC, w: 0.06, a: HALO, j: 0.06 }
    ];
    return parts;
  }, 0.92);

  /* ============================= CLIPBOARD ============================= */
  const clipboard = shape(function () {
    const bx0 = -0.66, by0 = -0.80, bx1 = 0.62, by1 = 0.96;
    const board = roundRect(bx0, by0, bx1, by1, 0.08, 6);
    const px0 = -0.56, py0 = -0.66, px1 = 0.52, py1 = 0.86;
    const paper = [px0, py0, px1, py0, px1, py1, px0, py1];
    const boardP = poly(board), paperP = poly(paper);

    // Clip: base plate + handle with a hanging hole.
    const ccx = -0.02;
    const plate = roundRect(ccx - 0.28, -0.87, ccx + 0.28, -0.61, 0.05, 4);
    const handle = spline([[ccx - 0.17, -0.86], [ccx - 0.15, -0.93], [ccx - 0.08, -0.975], [ccx, -0.985], [ccx + 0.08, -0.975], [ccx + 0.15, -0.93], [ccx + 0.17, -0.86]], false, 6);
    const handleRing = handle.concat([ccx + 0.17, -0.86, ccx - 0.17, -0.86]);
    const hole = ellipse(ccx, -0.915, 0.055, 0.028, 0, 24);
    const plateP = poly(plate), handleP = poly(handleRing), holeP = poly(hole);
    const clipH = [plateP, handleP];

    const parts = [
      { s: board, c: true, w: 1.05, a: OUT, j: 0.004, h: clipH },
      { s: paper, c: true, w: 0.85, a: [0.66, 0.86], j: 0.003, h: clipH },
      { f: poly(board, paper), w: 4.2, a: [0.3, 0.52], h: clipH },
      { f: paperP, w: 0.55, a: [0.18, 0.3], h: clipH },
      { s: plate, c: true, w: 1, a: OUT, j: 0.003 },
      { s: handle, w: 1, a: OUT, j: 0.003 },
      { s: hole, c: true, w: 0.9, a: OUT, j: 0.002 },
      { f: plateP, w: 6, a: [0.4, 0.62] },
      { f: poly(handleRing, hole), w: 6, a: [0.4, 0.62], h: [plateP] },
      { s: board, c: true, w: 0.07, a: HALO, j: 0.05 }
    ];

    // Heading.
    parts.push({ s: line(-0.44, -0.48, 0.12, -0.48), w: 1, a: [0.78, 0.95], j: 0.002 });
    parts.push({ s: line(-0.44, -0.455, 0.12, -0.455), w: 1, a: [0.78, 0.95], j: 0.002 });

    // Checklist rows.
    const rows = [-0.24, 0.02, 0.28, 0.54];
    const lens = [0.38, 0.28, 0.40, 0.22];
    const sub = [0.18, 0.08, 0.22, 0.04];
    const ticked = [true, true, true, false];
    const bs = 0.15, bxa = -0.45;
    for (let i = 0; i < rows.length; i++) {
      const y = rows[i];
      parts.push({ s: [bxa, y - bs / 2, bxa + bs, y - bs / 2, bxa + bs, y + bs / 2, bxa, y + bs / 2], c: true, w: 1, a: OUT, j: 0.003 });
      parts.push({ s: line(-0.20, y - 0.025, lens[i], y - 0.025), w: 0.8, a: MID, j: 0.003 });
      parts.push({ s: line(-0.20, y + 0.045, sub[i], y + 0.045), w: 0.55, a: [0.35, 0.55], j: 0.003 });
      if (ticked[i]) {
        parts.push({ s: spline([[bxa + 0.025, y - 0.005], [bxa + 0.065, y + 0.045], [bxa + 0.12, y - 0.06], [bxa + 0.2, y - 0.14]], false, 6), w: 1.4, a: [0.92, 1], j: 0.003 });
      }
    }
    return parts;
  }, 0.92);

  R['consult'] = [
    { name: 'heart', f: heart },
    { name: 'stethoscope', f: stethoscope },
    { name: 'clipboard', f: clipboard }
  ];
})();
