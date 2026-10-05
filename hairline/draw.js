/**
 * Draw: a blood-collection syringe lying on its side, the needle away from the
 * reader. The pointer, moved along it, is the thumb on the plunger: the plunger
 * follows it out on a spring, the stopper's ring (the bright mark) travels down
 * the barrel, and the barrel behind it fills. The read-out is the volume drawn.
 * At rest a little has been drawn. The slider is the syringe's size, in ml.
 *
 * The engine's solids stand up; these lie down. `lie` makes one along x from a
 * cross-section: its silhouette is the hull of the two ends, and its crease is
 * the near end's outline where the hull does not already draw it. Parts are
 * painted needle first, so each nearer part covers the one behind it. The hit
 * test projects the pointer onto the plane of the axis, which never moves.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, rad, rrect, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const ZC = 6.2, BR = 6, X0 = 22, REST = 0.55, CAPMAX = 5, TV = Math.atan2(0.5, 0.612);
const len = (cap) => 26 + 9 * cap;
const disc = (r, n = 28) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI; return [r * Math.cos(a), r * Math.sin(a)]; });
const box = (hy, hz, r) => rrect(-hy, -hz, hy, hz, r, 4).map((q) => [q.u, q.v]);
const NEEDLE = disc(0.5, 12), HUB = disc(2.4), BARREL = disc(BR), FLANGE = box(13, 2.2, 2), ROD = box(1.8, 1.8, 0.8), PAD = disc(5.4);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let cap = value;

  const C = Cam(45, 0.5, 3.2);
  const LMAX = len(CAPMAX);
  fit(C, [[0, -13, 0], [0, 13, 2 * ZC], [2 * LMAX + X0 + 6, 13, 0], [2 * LMAX + X0 + 6, -13, 2 * ZC]], 200, 166);
  const P = proj(C);

  /** A solid lying along x from x0 to x1, with cross-section `sec` of [y, z] points round the axis. */
  function lie(x0, x1, sec) {
    const A = sec.map(([y, z]) => P(x0, y, ZC + z)), N = sec.map(([y, z]) => P(x1, y, ZC + z));
    const h = hull(A.concat(N)), on = new Set(h), n = N.length;
    let s = -1;
    for (let i = 0; i < n; i++) if (!on.has(N[i]) && on.has(N[(i + n - 1) % n])) { s = i; break; }
    const run = [];
    if (s >= 0) for (let k = -1; k < n; k++) { const q = N[(s + k + n) % n]; run.push(q); if (k >= 0 && on.has(q)) break; }
    return { sil: poly(h), crease: open(run) };
  }
  /** An arc round the barrel at x, from angle a to b off the side that faces the reader. */
  const arc = (x, a, b, r = BR) => {
    const pts = [];
    for (let k = 0; k <= 8; k++) { const t = TV + rad(a + ((b - a) * k) / 8); pts.push(P(x, r * Math.cos(t), ZC + r * Math.sin(t))); }
    return open(pts);
  };

  const g = mk("g", {}, svg);
  const needle = solid(g), hub = solid(g), barrel = solid(g);
  const fill = mk("path", { class: "nf lo" }, g), ticks = mk("path", { class: "nf lo" }, g), stopper = mk("path", { class: "nf hi" }, g);
  const flange = solid(g), rod = solid(g), pad = solid(g);
  put(needle, lie(0, 16, NEEDLE));
  put(hub, lie(16, X0, HUB));

  let BL = len(cap), lo = X0 + 2, hi = X0 + BL - 3;
  const sp = spring(lo + REST * (hi - lo), { eps: 0.02 });
  let drawn = "";

  function draw() {
    const xs = sp.x, key = xs.toFixed(2) + "," + BL;
    if (key === drawn) return;
    drawn = key;
    const xf = X0 + BL, thumb = xs + BL + 2;
    put(barrel, lie(X0, xf, BARREL));
    // what has been drawn: rings of blood from the needle end to the stopper
    let d = "";
    for (let x = lo + 2; x < xs - 1; x += 3.2) d += arc(x, -70, 20);
    fill.setAttribute("d", d);
    // the graduations: one a half millilitre, longer at each whole one
    let t = "";
    for (let k = 0; k <= 2 * cap; k++) t += arc(lo + ((hi - lo) * k) / (2 * cap), 38, k % 2 ? 50 : 62);
    ticks.setAttribute("d", t);
    stopper.setAttribute("d", arc(xs, -90, 90, BR - 0.3));
    put(flange, lie(xf, xf + 2, FLANGE));
    put(rod, lie(xf + 2, thumb, ROD));
    put(pad, lie(thumb, thumb + 2, PAD));
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);

  const ml = (x) => ((cap * (x - lo)) / (hi - lo)).toFixed(1) + " ml";
  function move(p) {
    const [x, y] = unproj(C, p[0], p[1], ZC);
    if (Math.abs(y) > 26 || x < -6 || x > 2 * LMAX + X0 + 10) return leave();
    sp.t = clamp(x - BL - 3, lo, hi);
    read.textContent = ml(sp.t);
    B.wake();
  }
  function leave() { sp.t = lo + REST * (hi - lo); read.textContent = "rest"; B.wake(); }

  bag.add(pointer(stage, { move, leave }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      const f = (sp.t - lo) / (hi - lo);
      cap = v; BL = len(cap); lo = X0 + 2; hi = X0 + BL - 3;
      sp.x = sp.t = lo + f * (hi - lo);
      if (read.textContent !== "rest") read.textContent = ml(sp.t);
      drawn = ""; B.wake();
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "draw",
  means: "A blood test, from your side of the needle: the pointer pulls the plunger, and the barrel fills to the volume drawn.",
  rules: [1, 3, 6, 9],
  range: [2, 3, 5],
  mount,
});
