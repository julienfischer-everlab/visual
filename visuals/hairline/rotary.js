/**
 * Rotary: a rotary card file. A drum turns on an axle between two knurled
 * knobs, held by two arched feet on a sled base; fourteen species cards
 * radiate from it, each clipped to the drum's rails by two slots at its foot,
 * with a heading rule and abundance dots. One card is presented at the top,
 * a gap either side that a hand widens. A hand moving across the wheel pushes
 * it, friction bleeds the spin, and a detent spring catches the card the push
 * aimed at, which has the bright edge and names its genus from the push on.
 * Paint order is each card's angle from the line of sight. The slider is the
 * coast, in ms. mount may take { cover }: a picture printed on card 0's face. */
const { Cam, circ, fillet, fit, hull, facing, open, poly, prism, proj, rad, rings, rrect, seg,
  spring, stepS, tween, tset, tval, tdone, disposer, mk, place, pointer, put, reflect, register, solid, reducedMotion } = HL;

const NAMES = ["Akkermansia", "Bacteroides", "Faecalibacterium", "Bifidobacterium", "Prevotella", "Roseburia", "Lactobacillus",
  "Ruminococcus", "Blautia", "Alistipes", "Eubacterium", "Coprococcus", "Parabacteroides", "Oscillibacter"];
const N = 14, STEP = 360 / N, ABU = [4, 5, 3, 2, 4, 1, 2, 3, 5, 2, 3, 1, 4, 2];
const JIT = [0, 2.5, 2.5, -3, -2.5, 1, -3, 2, -1, 3, 2.5, -2, -3, 2];  // the wheel's unevenness, in degrees: no card edge-on at rest or open
const W = 78, H = 36, R0 = 9, T = 0.9, ZB = 3, ZA = R0 + H + 8;       // a card along the axle and out from it; the drum; base top; axle
const RAIL = [16, 62], SW = 3.2, SD = 3.6;                            // the rails, as u on a card; the slots that clip onto them
const TOP = 118, GAP = 17, OPEN = 26, SIG = 7;                        // where a card is presented; the gap either side of it, wider under a hand
const XS = W / 2 + 3, TS = 3, KR = 12, XK = XS + TS + 8, YB = 31;      // the feet's inner face and thickness; the knobs; the base
const MAXW = 720, CATCH = 30, GRIP = R0 + H;                           // fastest spin and the detent's hold, deg/s; the tip the hand pushes
const PIC = [37, 4.5, W - 6, H - 4.5];                                 // the cover picture's corners on card 0's face, (u, v)

const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
/** A card's angle for its place on the drum: the gap opens round the top, the rest close up a little to make room. */
const warp = (d, gp) => d + gp * Math.tanh(d / SIG) - (gp * d) / 180;
const idx = (a) => ((Math.round(a / STEP) % N) + N) % N;
const cs = (t) => [Math.cos(rad(t)), Math.sin(rad(t))];

/** A card in its own plane, u along the axle, v out from the drum: two slots at its foot, rounded at the tip. */
const SHAPE = fillet(
  [[0, 0], ...RAIL.flatMap((a) => [[a - SW / 2, 0], [a - SW / 2, SD], [a + SW / 2, SD], [a + SW / 2, 0]]), [W, 0], [W, H], [0, H]],
  [1, 0.6, 1.5, 1.5, 0.6, 0.6, 1.5, 1.5, 0.6, 1, 3.2, 3.2],
);

/** A foot, in (y, z): two toes under an arch, tapering up to a round boss at the axle. */
const FOOT = (() => {
  const pts = [[-28, ZB], [-17, ZB]];
  for (let t = 160; t >= 20; t -= 35) pts.push([17 * cs(t)[0], ZB + 13 * cs(t)[1]]);
  pts.push([17, ZB], [28, ZB]);
  for (let t = -20; t <= 200; t += 20) pts.push([8 * cs(t)[0], ZA + 8 * cs(t)[1]]);
  return fillet(pts, pts.map((_, k) => (k < 2 || (k > 6 && k < 9) ? 1.5 : 1)));
})();

function mount({ stage, svg, read, cover }, value) {
  const bag = disposer(), det = spring(0);
  let coast = value, psi = 0, om = 0, aim = 0, mode = "home", home = tween(0), inside = false, last = null, key = "", shown = "", gap = tween(GAP);
  // where the coast will end: friction gives up (ω − catch)·τ more degrees, and the detent takes the card nearest that, never the one passing now
  const land = () => { aim = Math.round((psi + ((om - Math.sign(om) * CATCH) * coast) / 1000) / STEP) * STEP; };

  // Fitted to the whole wheel, the knobs and the base: a turn never changes the box.
  const C = Cam(45, 0.5, 1.72), box = [];
  for (let t = 0; t < 360; t += 10) {
    const [c, s] = cs(t);
    for (const x of [-1, 1]) box.push([(x * W) / 2, (R0 + H) * c, ZA + (R0 + H) * s], [x * XK, KR * c, ZA + KR * s], [x * XK, x * YB, 0], [-x * XK, x * YB, 0]);
  }
  fit(C, box, 200, 166);
  const P = proj(C), front = facing(C);

  // the direction toward the viewer, and its angle in the plane across the axle (from +y toward +z)
  const p0 = P(0, 0, 0), [a, b, e] = [P(1, 0, 0), P(0, 1, 0), P(0, 0, 1)].map((p) => [p[0] - p0[0], p[1] - p0[1]]);
  const dy = e[0] * a[1] - a[0] * e[1], dz = a[0] * b[1] - b[0] * a[1], PHI = Math.atan2(dz * Math.sign(dz), dy * Math.sign(dz)) / rad(1);
  // the top card's tip at rest, on screen, per degree it turns: a hand's step along that fixed line is the turn it gives (the same in any direction)
  const sv = P(0, -cs(TOP)[1], cs(TOP)[0]), tv = [sv[0] - p0[0], sv[1] - p0[1]], TV = tv.map((v) => v / (tv[0] ** 2 + tv[1] ** 2) / GRIP / rad(1));

  const g = mk("g", {}, svg);
  const [bR, bI] = rings(-XK, -YB, XK, YB, 8, 1.6);
  reflect(svg, g, P, front, bR, 0, 14);
  put(solid(g), prism(P, front, bR, bI, 0, ZB));

  /** A round along the axle from x0 to x1: its silhouette, the crease of the end that faces us, and knurling on a knob. */
  const on = (r, x) => circ(r, 32).map((q) => P(x, q.u, ZA + q.v)), rim = (x, r, t) => P(x, r * cs(t)[0], ZA + r * cs(t)[1]);
  function round(x0, x1, r, knurl, parent = g) {
    const sd = solid(parent);
    put(sd, { sil: poly(hull(on(r, x0).concat(on(r, x1)))), crease: poly(on(r - 1.2, x1)) });
    const lines = knurl ? [-63, -42, -21, 0, 21, 42, 63].map((j) => seg(rim(x0 + 1.4, r, PHI + j), rim(x1 - 1.4, r, PHI + j))) : [];
    if (knurl) mk("path", { d: lines.join(""), class: "nf lo" }, sd.g);
    return sd;
  }
  /** A foot: a thin plate standing across the axle, its far face dim and its near face the silhouette. */
  const foot = (xb, xf) => [[xb, "lo"], [xf, "sil"]].forEach(([x, cls]) => mk("path", { d: poly(FOOT.map(([y, z]) => P(x, y, z))), class: cls }, g));

  // Back to front along the axle: the far knob and foot, the drum and its cards sorted by angle, the near foot and knob.
  round(-XK, -XS - TS, KR, true);
  foot(-XS - TS, -XS);
  const layer = mk("g", {}, g), hub = round(-W / 2 - 1, W / 2 + 1, R0, false, layer);
  // the wheel's envelope on screen: every card is inside it at any turn, so it never moves; only a hand over it pushes
  const env = hull(on(R0 + H, -W / 2).concat(on(R0 + H, W / 2)));
  const over = ([x, y]) => [1, -1].some((sg) => env.every((q, k) => { const r = env[(k + 1) % env.length]; return sg * ((r[0] - q[0]) * (y - q[1]) - (r[1] - q[1]) * (x - q[0])) >= 0; }));
  const arc = (x) => open(Array.from({ length: 23 }, (_, k) => rim(x, R0 + 1.4, PHI - 88 + k * 8)));
  mk("path", { d: RAIL.map((u) => arc(u - W / 2)).join(""), class: "nf" }, hub.g);

  const cards = NAMES.map((_, i) => {
    const grp = mk("g", {}, layer);
    const cd = { g: grp, th: NaN, back: mk("path", { class: "lo" }, grp), face: mk("path", { class: "sil" }, grp) };
    const marks = (cd.marks = mk("g", {}, grp));
    cd.head = mk("path", { class: "nf" }, marks);
    cd.dots = Array.from({ length: ABU[i] }, () => mk("circle", { r: 1.05, class: "dot off" }, marks));
    if (i || !cover) return cd;
    // the picture, printed on the face: sized in the card's own units, carried there by the face's matrix
    const [u0, v0, u1, v1] = PIC;
    mk("image",{ href: cover, x: u0, y: H - v1, width: u1 - u0, height: v1 - v0, preserveAspectRatio: "xMidYMid slice", "clip-path": "inset(0 round 2px)" }, (cd.pic = mk("g", {}, marks)));
    cd.frame = mk("path", { class: "nf lo" }, marks);
    return cd;
  });
  const all = cards.concat([{ g: hub.g, th: PHI + 90 }]);
  foot(XS, XS + TS);
  round(XS + TS, XK, KR, true);

  /** Card i at th degrees round the axle: its two faces, and its marks on the front face while that face is seen. */
  function draw(i, th) {
    const cd = cards[i];
    if (th === cd.th) return;
    cd.th = th;
    const [c, s] = cs(th), up = Math.sin(rad(th - PHI)) > 0, fo = up ? T / 2 : -T / 2;
    const w = (u, v, o) => P(u - W / 2, (R0 + v) * c + o * s, ZA + (R0 + v) * s - o * c), at = (u, v) => w(u, v, fo);
    cd.back.setAttribute("d", poly(SHAPE.map(([u, v]) => w(u, v, -fo))));
    cd.face.setAttribute("d", poly(SHAPE.map(([u, v]) => at(u, v))));
    cd.marks.setAttribute("visibility", up ? "visible" : "hidden");
    cd.head.setAttribute("d", seg(at(6, H - 7), at(31, H - 7)));
    cd.dots.forEach((el, k) => place(el, at(8 + k * 4.6, H - 13.5)));
    if (!cd.pic) return;
    const o = at(0, H), ex = at(1, H), ey = at(0, H - 1);
    cd.pic.setAttribute("transform", `matrix(${ex[0] - o[0]} ${ex[1] - o[1]} ${ey[0] - o[0]} ${ey[1] - o[1]} ${o[0]} ${o[1]})`);
    cd.frame.setAttribute("d", poly(rrect(...PIC, 2, 4).map((q) => at(q.u, q.v))));
  }

  /** The card presented: the one the push will stop on top (a target, never the drum as it passes), card 0 going home. */
  function show() {
    const p = mode === "home" ? 0 : idx(aim), nk = inside + ":" + p;
    if (nk === shown) return;
    shown = nk;
    cards.forEach((cd, i) => {
      const lit = inside && i === p;
      cd.face.classList.toggle("hi", lit);
      cd.head.classList.toggle("hi", lit || (!inside && !i));
      cd.dots.forEach((el) => el.setAttribute("class", lit ? "dot" : i === p ? "dot m" : "dot off"));
    });
    read.textContent = inside ? NAMES[p] : "rest";
  }

  /** Every card at its angle, then paint order: furthest in angle from the line of sight first, the drum at 90°; groups move only when it changes. */
  function pose(now) {
    const gp = tval(gap, now);
    cards.forEach((_, i) => { const dl = wrap(psi - i * STEP); draw(i, TOP + warp(dl, gp) + JIT[i] * Math.min(1, Math.abs(dl) / STEP)); });
    const far = (k) => Math.abs(wrap(all[k].th - PHI)), ord = all.map((_, k) => k).sort((x, y) => far(y) - far(x)), nk = ord.join();
    if (nk !== key) { key = nk; ord.forEach((k) => layer.append(all[k].g)); }
    show();
  }
  pose(performance.now());

  const B = register(stage, (dt, now) => {
    let moving = true;
    if (mode === "home") { psi = tval(home, now); moving = !tdone(home, now); }
    else if (mode === "coast") {
      if (reducedMotion()) { psi += (om * coast) / 1000; om = 0; }
      else { psi += om * dt; om *= Math.exp((-dt * 1000) / coast); }
      // slow enough: the detent spring takes the drum, with the speed it still has, to the card it was aimed at
      if (Math.abs(om) < CATCH) { Object.assign(det, { x: psi, v: om, t: aim }); mode = "catch"; }
    }
    if (mode === "catch") { moving = stepS(det, dt); psi = det.x; }
    pose(now);
    return moving || !tdone(gap, now);
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      // the push: the hand's speed, as the turn that keeps the top card's tip under it; a slow hand does not beat the detent
      const now = performance.now(), dt = last ? (now - last.t) / 1000 : 0;
      if (!inside) { tset(gap, OPEN, now, 0); B.wake(); }
      inside = true;
      if (last && dt < 0.012) return show();   // events closer than a frame carry no speed yet: measure over the next
      const lam = last && dt < 0.15 && over(p) ? ((p[0] - last.p[0]) * TV[0] + (p[1] - last.p[1]) * TV[1]) / dt : 0;
      const w = Math.max(-MAXW, Math.min(MAXW, lam));
      if (Math.abs(w) >= CATCH && (mode !== "coast" || Math.sign(w) !== Math.sign(om) || Math.abs(w) > Math.abs(om))) { om = w; mode = "coast"; land(); B.wake(); }
      last = { p: [p[0], p[1]], t: now };
      show();
    },
    leave: () => {
      // let go: the drum turns back to card 0 on the long ease-out, the shortest way round
      inside = false; last = null; om = 0; mode = "home"; home = tween(psi);
      tset(home, Math.round(psi / 360) * 360, performance.now(), 0); tset(gap, GAP, performance.now(), 0);
      show(); B.wake();
    },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { coast = v; if (mode === "coast") land(); }, destroy: bag.dispose };
}

hairline({
  name: "rotary",
  means: "A rotary file of species cards: the pointer pushes the drum round, friction slows it and a detent stops one card on top.",
  rules: [1, 5, 6, 8],
  range: [90, 180, 450],
  tour: [[92, 150], [272, 150], [205, 200], null],
  mount,
});
