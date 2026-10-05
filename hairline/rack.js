/**
 * Rack: eight capped blood tubes standing in a two-tier rack, each a panel of
 * a health check. The tube under the pointer slides up out of the rack; its
 * neighbours rise a little, staggered outwards on the 700ms lift curve. Each
 * tube holds a different volume, drawn as a dim line on the glass. The tube
 * picked at rest is the one already half out. The slider is the stagger, in ms.
 *
 * Tubes run along x, so ascending x is back to front. Each tube is cut where
 * the top plate covers it: its lower part is painted before the plate, its
 * upper part and cap after. The hit test uses static bands along the tubes'
 * rest axes, extended to the full lift, so a tube rising cannot flip the pick.
 */
const {
  Cam, facing, fit, open, prism, proj, rings, ringAt, run,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const N = 8, SP = 13, TR = 4.4, CR = 5.4, TL = 54, CAP = 9, LIFT = 26, BUMP = [LIFT, 8, 3];
const B0 = 0, B1 = 4, T0 = 17, T1 = 20.5;
const X0 = -9, X1 = (N - 1) * SP + 9, Y0 = -8.5, Y1 = 8.5;
const NAMES = ["lipids", "hba1c", "thyroid", "iron", "liver", "kidney", "vit d", "crp"];
const REST = [0, 4, 17, 4, 0, 1, 6, 0], FILL = [0.62, 0.48, 0.7, 0.55, 0.66, 0.44, 0.6, 0.52];
const PICK = 2, NONE = { sil: "", crease: "" };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 2.35);
  fit(C, [[X0, Y0, B0], [X1, Y1, B0], [X1, Y0, B0], [X0, Y1, B0], [X0, 0, B1 + TL + LIFT], [X1, 0, B1 + TL + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the rack: a base plate, two end posts, a top plate with a hole for each tube
  const plate = (z0, z1) => { const [r, i] = rings(X0, Y0, X1, Y1, 4, 1.2); put(solid(g), prism(P, front, r, i, z0, z1)); };
  const post = (x0, x1) => { const [r, i] = rings(x0, -6.5, x1, 6.5, 2.2, 0.8); put(solid(g), prism(P, front, r, i, B1, T0)); };
  plate(B0, B1);
  post(X0 + 1, X0 + 5);

  const tubes = [];
  const lower = mk("g", {}, g);
  for (let i = 0; i < N; i++) {
    const x = i * SP;
    const [ring, inner] = rings(x - TR, -TR, x + TR, TR, TR, 0.8);
    const [cring, cinner] = rings(x - CR, -CR, x + CR, CR, CR, 1);
    const lo = solid(lower), fLo = mk("path", { class: "nf lo" }, lower);
    tubes.push({ x, ring, inner, cring, cinner, vol: FILL[i], lo, fLo, z: tween(REST[i]), drawn: NaN });
  }
  post(X1 - 5, X1 - 1);
  plate(T0, T1);
  for (const t of tubes) {
    const [hr] = rings(t.x - CR, -CR, t.x + CR, CR, CR, 1);
    mk("path", { d: open(ringAt(P, hr, T1).concat([ringAt(P, hr, T1)[0]])), class: "nf lo" }, g);
  }
  for (const t of tubes) {
    t.up = solid(g); t.fUp = mk("path", { class: "nf lo" }, g);
    t.cap = solid(g); t.rib = mk("path", { class: "nf lo" }, g);
  }

  function draw(t, lift) {
    if (lift === t.drawn) return;
    t.drawn = lift;
    const zb = B1 + lift, zc = zb + TL - CAP, zf = zb + (TL - CAP) * t.vol;
    put(t.lo, zb < T0 ? prism(P, front, t.ring, t.inner, zb, T0) : NONE);
    put(t.up, prism(P, front, t.ring, t.inner, Math.max(zb, T1), zc));
    put(t.cap, prism(P, front, t.cring, t.cinner, zc, zb + TL));
    const fl = open(ringAt(P, run(t.ring, front), zf));
    t.fLo.setAttribute("d", zf > zb && zf < T0 ? fl : "");
    t.fUp.setAttribute("d", zf > T1 ? fl : "");
    t.rib.setAttribute("d", open(ringAt(P, run(t.cring, front), zc + 3)));
  }

  // hit bands: each tube's rest axis, from the base to its full lift. They never move.
  const axes = tubes.map((t) => [P(t.x, 0, B1), P(t.x, 0, B1 + TL + LIFT)]);
  function hit([px, py]) {
    let best = -1, bd = 11;
    axes.forEach(([a, b], i) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const s = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
      const d = Math.hypot(px - a[0] - s * dx, py - a[1] - s * dy);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const t of tubes) { draw(t, tval(t.z, now)); if (!tdone(t.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  const mark = (a) => tubes.forEach((t, i) => t.cap.sil.classList.toggle("hi", i === (a < 0 ? PICK : a)));
  /** Lifts tube a and its neighbours (-1 sets them all back). The stagger spreads from the tube picked, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    tubes.forEach((t, i) => {
      const d = Math.abs(i - a);
      tset(t.z, a < 0 ? REST[i] : d < BUMP.length ? BUMP[d] : 0, now, Math.abs(i - from) * stag);
    });
    mark(a);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }
  mark(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "rack",
  means: "Eight blood tubes in a rack: the panel under the pointer slides up, and its neighbours rise after it.",
  rules: [1, 2, 6, 10],
  range: [0, 40, 90],
  mount,
});
