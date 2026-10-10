/**
 * Fan: a microbiome report as a swatch fan deck. Six long blades lie on the
 * desk, riveted together at one rounded end and fanned unevenly over 55°, the
 * cover board on top and the Akkermansia blade standing a little apart. The
 * pointer's angle round the rivet picks a blade: the blades above it swing one
 * way and the ones below it the other, staggered outwards from it, so its whole
 * face shows, a heading rule and a row of five level dots, the lit ones
 * bright. Each blade's tab sits in its own place across its tip. Nothing lifts,
 * so paint order is stack order at any angle. The slider is the swing, in °.
 *
 * mount may be given { cover }: a picture printed on the cover board's outer
 * end, laid on by the projection's own matrix, so it swings with the board.
 */
const {
  Cam, facing, fillet, fit, flatDot, hull, open, poly, prism, proj, rad, ringAt, rrect, run, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 6, L = 120, R0 = 9, HW = 15, TH = 4.5, TW = 6;  // a blade: rivet to tip, half-width at the rivet and at the tip, its tab
const NAMES = ["butyrate", "Akkermansia", "Firmicutes", "Bacteroidetes", "diversity", "cover"]; // bottom to top, the report's own markers
const ANG = [-129, -114, -100, -92, -83, -74];   // rest angles round the rivet: uneven, Akkermansia apart
const TK = [1.1, 1.1, 1.1, 1.1, 1.1, 2.4];       // thin strips, and the cover board on top
const LIT = [4, 1, 3, 2, 4, 0];                  // dots lit, of five: butyrate high, Akkermansia low, F/B 1.8, diversity good
const TAB = [-9, -6.6, -4.2, -1.8, 0.6, 3];      // where each tab starts across the tip, stepping with the stack
const AKK = 1, STEP = 45, SWMAX = 22;            // the rest mark (the low marker); stagger in ms; widest swing
const ZB = TK.map((_, i) => TK.slice(0, i).reduce((a, b) => a + b, 0)), TOP = ZB[N - 1] + TK[N - 1];
const hw = (u) => R0 + ((HW - R0) * (u + R0)) / (L + R0);
const CU0 = 47, CU1 = 114, CV = hw(CU0) - 2.5;    // the cover picture: along the board's outer end, inset from its edges

/**
 * A blade's outline in its own plane (u out from the rivet, v across): a round end, a taper, a rounded tip with its tab.
 * FN steps round each corner, so the round end is the first and the last FN + 1 points.
 */
const FN = 6;
const outline = (t0) => fillet(
  [[-R0, -R0], [L, -HW], [L, t0], [L + TH, t0], [L + TH, t0 + TW], [L, t0 + TW], [L, HW], [-R0, R0]],
  [R0, 3, 1.2, 1.8, 1.8, 1.2, 3, R0], FN,
);

function mount({ stage, svg, read, cover }, value) {
  const bag = disposer();
  let sw = value, act = -1;

  // Fitted to the fan opened as wide as the slider allows, both ways.
  const C = Cam(45, 0.5, 2.12), box = [];
  const at = (th, u, v) => { const c = Math.cos(rad(th)), s = Math.sin(rad(th)); return [u * c - v * s, u * s + v * c]; };
  ANG.forEach((a, i) => [a - SWMAX, a + SWMAX].forEach((th) => outline(TAB[i]).forEach(([u, v]) => box.push([...at(th, u, v), 0], [...at(th, u, v), TOP]))));
  fit(C, box, 200, 166);
  const P = proj(C), front = facing(C);

  // Painted from the bottom blade up: each its base outline, its face, its rule and its dots; the cover's rules and picture with it.
  const g = mk("g", {}, svg);
  const bl = ANG.map((_, i) => {
    const grp = mk("g", {}, g), b = { shape: outline(TAB[i]), tw: tween(0), drawn: NaN };
    b.back = mk("path", { class: "lo" }, grp);
    // the face is ground only; its outline is the edge that lights, and, under the cover, the round end apart,
    // which only ever shows as one line of the stack's side and so never lights
    b.face = mk("path", { class: "fo" }, grp);
    b.end = i < N - 1 ? mk("path", { class: "nf sil" }, grp) : null;
    b.edge = mk("path", { class: "nf sil" }, grp);
    b.rule = mk("path", { class: "nf" }, grp);
    b.dots = i < N - 1 ? [0, 1, 2, 3, 4].map(() => flatDot(grp, C, 1.5, "dot off")) : [];
    if (i === N - 1) {
      b.sub = mk("path", { class: "nf lo" }, grp);
      if (cover) {
        b.cg = mk("g", {}, grp);
        mk("image", { href: cover, x: CU0, y: -CV, width: CU1 - CU0, height: 2 * CV, preserveAspectRatio: "xMidYMid slice", "clip-path": "inset(0 round 2.5px)" }, b.cg);
        b.frame = mk("path", { class: "nf lo" }, grp);
      }
    }
    return b;
  });
  const FR = rrect(CU0, -CV, CU1, CV, 2.5, 4);

  // The rivet: a washer on the cover board, and a round head on it, standing through every blade.
  const disc = (r) => rrect(-r, -r, r, r, r, 12);
  put(solid(g), prism(P, front, disc(8), disc(6.9), TOP, TOP + 0.8));
  const foot = disc(5.2), crown = disc(3.4), ci = disc(2.5);
  put(solid(g), {
    sil: poly(hull(ringAt(P, foot, TOP + 0.8).concat(ringAt(P, crown, TOP + 3)))),
    crease: open(ringAt(P, run(ci, front), TOP + 3)),
  });

  function draw(b, i, th) {
    if (th === b.drawn) return;
    b.drawn = th;
    const z0 = ZB[i], z1 = z0 + TK[i], w = (u, v, z = z1) => P(...at(th, u, v), z);
    b.back.setAttribute("d", poly(b.shape.map(([u, v]) => w(u, v, z0))));
    const pts = b.shape.map(([u, v]) => w(u, v));
    b.face.setAttribute("d", poly(pts));
    b.edge.setAttribute("d", b.end ? open(pts.slice(FN, -FN)) : poly(pts));
    if (b.end) b.end.setAttribute("d", open(pts.slice(-FN - 1).concat(pts.slice(0, FN + 1))));
    if (b.sub) {
      b.rule.setAttribute("d", seg(w(16, -4), w(44, -4)));
      b.sub.setAttribute("d", seg(w(16, 1), w(34, 1)));
    } else {
      b.rule.setAttribute("d", seg(w(L - 46, 4 - hw(L - 46)), w(L - 12, 4 - hw(L - 12))));
      b.dots.forEach((d, k) => { const u = L - 46 + k * 7; place(d, w(u, 9 - hw(u))); });
    }
    if (b.cg) {
      const o = w(0, 0), ax = w(1, 0), ay = w(0, 1);
      b.cg.setAttribute("transform", `matrix(${[ax[0] - o[0], ax[1] - o[1], ay[0] - o[0], ay[1] - o[1], o[0], o[1]].map((n) => n.toFixed(4)).join(" ")})`);
      b.frame.setAttribute("d", poly(FR.map((q) => w(q.u, q.v))));
    }
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    bl.forEach((b, i) => { draw(b, i, ANG[i] + tval(b.tw, now)); if (!tdone(b.tw, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  /**
   * Each blade owns the band of angles round the rivet halfway to its neighbours' REST angles, read on its own
   * top plane, since the blades stand at different heights. From the top blade down, the first whose band holds
   * the pointer; -1 off the fan: inside the rivet, past the tips, or past the outer blades' edges.
   */
  function hit([x, y]) {
    for (let i = N - 1; i >= 0; i--) {
      const [wx, wy] = unproj(C, x, y, ZB[i] + TK[i]), r = Math.hypot(wx, wy), f = Math.atan2(wy, wx) / rad(1);
      if (r < R0 || r > L + TH + 8) continue;
      const m = Math.atan2(hw(r) + 4, r) / rad(1);
      if (f >= (i ? (ANG[i - 1] + ANG[i]) / 2 : ANG[0] - m) && f <= (i < N - 1 ? (ANG[i] + ANG[i + 1]) / 2 : ANG[i] + m)) return i;
    }
    return -1;
  }

  /** Picks blade a (-1 lets go): above it swing on, below it swing back, staggered out from it; it takes the bright edge. */
  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    bl.forEach((b, i) => {
      tset(b.tw, a < 0 || i === a ? 0 : i > a ? sw : -sw, now, from < 0 ? 0 : Math.abs(i - from) * STEP);
      b.edge.classList.toggle("hi", i === (a < 0 ? AKK : a));
      b.dots.forEach((d, k) => d.setAttribute("class", k >= LIT[i] ? "dot off" : i === a ? "dot" : "dot m"));
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }
  setActive(-1, true);
  bl.forEach((b, i) => draw(b, i, ANG[i]));   // drawn at rest now, so the cover's picture never shows before its first frame

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { sw = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "fan",
  means: "A report as six riveted blades fanned on the desk: the pointer's angle picks one, and the rest swing apart to show its face.",
  rules: [1, 2, 6, 10],
  range: [8, 14, 22],
  tour: [[180, 138], [250, 149], [288, 172], null],
  mount,
});
