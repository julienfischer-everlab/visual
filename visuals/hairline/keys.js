/**
 * Keys: twelve services as keycaps in a shallow tray, four by three. A keycap
 * is a tapered solid, its foot wider than its top, with a dished top; it rides
 * a stem out of a socket in the tray's floor. At rest a few keys stand raised
 * to different heights, the ones ready, and the tallest is bright. The pointer
 * raises the keys near it on springs, the one under it highest, falling off
 * with distance to a floor; that key takes the bright. Each key measures the
 * pointer on the plane of its own rest top, so a raised key answers where it
 * is seen, and a key rising never slips out from under the pointer. The
 * slider is the reach of the falloff, in world units.
 */
const {
  Cam, clamp, extremes, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const NI = 4, NJ = 3, PITCH = 21, KF = 17, TAPER = 2.8, DISH = 1.3, CAPH = 7, ST = 11;  // the grid, a key's foot, its top's inset, its height, its stem
const T = 3, G = 1.5, L = 2 * (T + G) + NI * PITCH, W = 2 * (T + G) + NJ * PITCH;    // the tray: rim, gap, length, width
const ZB = -6, FLOOR = -3, HMAX = 16;                                               // the tray's foot and floor; the highest a key rises
// The rest, row by row: the ready ones stand up, uneven; the tallest is the mark.
const REST = [
  [0, 0, 0, 4],
  [7, 0, 11, 0],
  [0, 0, 0, 0],
];
const cx = (i) => T + G + (i + 0.5) * PITCH, cy = (j) => T + G + (j + 0.5) * PITCH;
const sq = (x, y, h, r) => rrect(x - h, y - h, x + h, y + h, r, 4);

/** The share of full height at u radii from the pointer: 1 → .5 at half the radius → .1 at the edge, and .1 beyond. */
const falloff = (u) => (u <= 0.5 ? 1 - u : u <= 1 ? 0.5 - (u - 0.5) * 0.8 : 0.1);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.5), ZT = FLOOR + HMAX + CAPH, e = KF / 2 - TAPER;
  // Fitted to the tray's foot and the far keys at full height.
  fit(C, [[0, 0, ZB], [L, 0, ZB], [0, W, ZB], [L, W, ZB],
    [cx(0) - e, cy(0) - e, ZT], [cx(NI - 1) + e, cy(0) - e, ZT], [cx(0) - e, cy(NJ - 1) + e, ZT]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over = null;

  // The tray: its outline, the rim's inner edge as its crease, and where the far walls meet the floor.
  const g = mk("g", {}, svg);
  const outer = rrect(0, 0, L, W, 7, 6), hole = rrect(T, T, L - T, W - T, 7 - T, 6);
  put(solid(g), { sil: prism(P, front, outer, outer, ZB, 0).sil, crease: poly(ringAt(P, hole, 0)) });
  mk("path", { class: "lo nf", d: open(ringAt(P, run(hole, (s) => !front(s)), FLOOR)) }, g);

  // The keys, diagonal by diagonal from the far corner: each one's socket on the floor, its stem, its cap.
  const keys = [];
  for (let s = 0; s <= NI + NJ - 2; s++) for (let i = 0; i < NI; i++) {
    const j = s - i;
    if (j < 0 || j >= NJ) continue;
    const x = cx(i), y = cy(j), h0 = REST[j][i];
    mk("path", { class: "lo nf", d: poly(ringAt(P, sq(x, y, KF / 2 + 0.6, 3.8), FLOOR)) }, g);
    const [sr, si] = rings(x - ST / 2, y - ST / 2, x + ST / 2, y + ST / 2, 2, 0.8);
    keys.push({
      i, j, h0, sr, si, foot: sq(x, y, KF / 2, 3.6), top: sq(x, y, e, 2.6), dish: sq(x, y, e - DISH, 1.6),
      stem: solid(g), cap: solid(g), sp: spring(h0, { eps: 0.04 }), drawn: NaN,
    });
  }
  const mark = keys.reduce((a, b) => (b.h0 > a.h0 ? b : a));

  // The near rim, painted over the keys' feet: a plate from the rim's inner edge down to the
  // tray's foot, then its two lines; the short cuts across the side rims stay unstroked.
  const lr = (pts) => (pts[0][0] > pts[pts.length - 1][0] ? pts.reverse() : pts);
  const at = (q, z) => ringAt(P, [q], z)[0];
  const [le, re] = extremes(P, outer);
  const lipTop = lr(ringAt(P, run(hole, front), 0));
  const lipFoot = [at(re, 0), at(re, ZB), ...lr(ringAt(P, run(outer, front), ZB)).reverse(), at(le, ZB), at(le, 0)];
  mk("path", { class: "fo", d: poly(lipTop.concat(lipFoot)) }, g);
  const lip = solid(g);
  put(lip, { sil: open(lipFoot), crease: open(lipTop) });
  lip.sil.classList.add("nf");

  // A key whose spring hasn't moved keeps its paths. The cap is the hull of its foot and its
  // smaller top (rule 09, a top smaller than its foot); its crease is the rim of the dish.
  function drawKey(k) {
    const h = clamp(k.sp.x, 0, HMAX);
    if (h === k.drawn) return;
    k.drawn = h;
    const z0 = FLOOR + h, z1 = z0 + CAPH;
    put(k.stem, prism(P, front, k.sr, k.si, FLOOR, Math.max(z0, FLOOR + 0.2)));
    put(k.cap, { sil: poly(hull(ringAt(P, k.foot, z0).concat(ringAt(P, k.top, z1)))), crease: poly(ringAt(P, k.dish, z1)) });
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const k of keys) { if (stepS(k.sp, dt)) m = true; drawKey(k); }
    return m;
  });
  bag.add(B.unregister);

  // Where the pointer falls on each key's REST top: the plane never moves, so neither does the answer.
  function measure([sx, sy]) {
    const d = keys.map((k) => { const [wx, wy] = unproj(C, sx, sy, FLOOR + k.h0 + CAPH); return [wx - cx(k.i), wy - cy(k.j)]; });
    const n = d.reduce((b, v, q) => (Math.hypot(...v) < Math.hypot(...d[b]) ? q : b), 0);
    // off the tray: further from the nearest key's middle than the rim
    return Math.max(...d[n].map(Math.abs)) > PITCH / 2 + G + T + 2 ? null : { k: keys[n], d: d.map((v) => Math.hypot(...v)) };
  }

  function retarget() {
    keys.forEach((k, q) => { k.sp.t = over ? HMAX * falloff(over.d[q] / R) : k.h0; });
    const on = over ? over.k : mark;
    keys.forEach((k) => k.cap.sil.classList.toggle("hi", k === on));
    read.textContent = over ? `key ${on.i + 1}·${on.j + 1}` : "rest";
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = measure(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "keys",
  means: "Twelve services as keycaps in a tray: a few stand ready, and the pointer raises the keys near it, the one under it highest.",
  rules: [1, 3, 5, 9],
  range: [24, 38, 56],
  tour: [[107, 155], [219, 136], [256, 192], null],
  mount,
});
