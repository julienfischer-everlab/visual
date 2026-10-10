/**
 * Loupe: a report's results page on a clipboard, a spring clip with its lever
 * across the top and a hanging hole above it. The page is printed with a
 * diversity spread, five clusters of colonies, four phyla and Akkermansia, each
 * its own size and density, and a pen ring round the small one. A folding linen tester
 * stands on it: a square base frame with a reticle on the paper, a hinged leg,
 * and the lens frame held above. The loupe follows the pointer on a spring;
 * the colonies under its window are drawn again in the lens, magnified about
 * the window's centre, only those that land inside it. Over a cluster the lens
 * takes the bright edge and the ring gives it up. The slider is the
 * magnification. mount may take { cover }: a picture printed in the page's
 * header, carried by the page's own matrix.
 *
 * The pattern: a field read through a window. Two springs for where, a hit
 * test on the page plane against the loupe's target (off the page, rest), and
 * paint order fixed: the page and everything printed on it, the clip, the loupe.
 */
const {
  Cam, circ, clamp, facing, fit, flatDot, hull, open, place, poly, prism, proj, rings, rrect, run, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const BX = -6, BL = 150, BW = 112, BT = 3, PZ = 0.5;         // the board (x down the page, y across it), the page's plane
const PG = [19, 8, 144, 104], HB = [34, 16, 57, 96];          // the page; its header block, under the clip
const CL = [13, 28, 31, 84], CH = 3.4, HR = 2.2;              // the clip's body, its height, its rolled hinge
const BH = 15, WH = 11, FT = 1.3, LZ = 30, LT = 1.8, LW = 9;  // base half-width, window half-width, frame thickness; lens height; leg half-width
const TR = [79, 20, 131, 92], TICK = 3;                       // where the window's centre may go; the reticle's step
// name, centre, spread, colonies, seed: each its own size and density
const CLU = [
  ["Bacteroidetes", 94, 80, 12, 64, 1], ["Firmicutes", 99, 38, 14, 124, 2], ["Actinobacteria", 124, 62, 8, 20, 3],
  ["Akkermansia", 129, 92, 4.4, 16, 4], ["Proteobacteria", 128, 21, 7, 10, 5],
];
const PARK = [101, 40], RING = 3, RR = 8;                     // the loupe at rest; the cluster the pen ring marks, its radius

const hash = (k, s) => { const x = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
/** The colonies: a sunflower spiral per cluster, jittered, three sizes. */
const DOTS = CLU.flatMap(([, x, y, R, n, s]) => Array.from({ length: n }, (_, k) => {
  const a = k * 2.39996 + hash(k, s) * 0.9, d = R * Math.sqrt((k + 0.5) / n) * (0.82 + 0.36 * hash(k, s + 9));
  return { x: x + d * Math.cos(a), y: y + d * Math.sin(a), r: [0.42, 0.56, 0.74][Math.floor(hash(k, s + 17) * 3)] };
}));
/** A rounded square of half-width h at the origin, and its crease ring. */
const sq = (h, r, b) => rings(-h, -h, h, h, r, b);
const at0 = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));
const area = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);

function mount({ stage, svg, read, cover }, value) {
  const bag = disposer();
  let M = value, lit = -1, drawn = "", last = null;

  const C = Cam(45, 0.5, 1.56);
  const box = [[BX, 0, -BT], [BL, 0, -BT], [BX, BW, -BT], [BL, BW, -BT], [BX, 0, 0], [5, 56, 17]];
  for (const [x, y] of [[TR[0], TR[1]], [TR[2], TR[1]], [TR[0], TR[3]], [TR[2], TR[3]]]) for (const [a, b] of [[-BH, -BH], [BH, -BH], [-BH, BH], [BH, BH]]) box.push([x + a, y + b, LZ + LT]);
  fit(C, box, 200, 166);
  const P = proj(C), front = facing(C), w = (x, y, z = PZ) => P(x, y, z), ringAt0 = (ring, cx, cy, z) => ring.map((q) => P(q.u + cx, q.v + cy, z));

  const g = mk("g", {}, svg);
  // the board, its hanging hole, and the page lying on it
  put(solid(g), prism(P, front, ...rings(BX, 0, BL, BW, 7, 2), -BT, 0));
  const hole = rrect(-2.2, 47, 2.6, 65, 2.4, 4);
  mk("path", { d: poly(hole.map((q) => P(q.u, q.v, 0))), class: "nf" }, g);
  mk("path", { d: open(run(hole, (q) => q.nu < 0 || q.nv < 0).map((q) => P(q.u, q.v, -BT + 0.6))), class: "nf lo" }, g);
  mk("path", { d: poly(rrect(...PG, 2, 4).map((q) => w(q.u, q.v))) }, g);

  // The header, in the page's reading frame (u from its left margin, v down from the clip), so the picture is printed
  // upright and unmirrored: laid on the page by that frame's own matrix, the title and its rules under it.
  const pg = (u, v) => w(v, HB[1] + HB[3] - u), head = mk("g", {}, g);
  const pic = cover ? mk("g", {}, head) : null, frame = cover ? mk("path", { class: "nf lo" }, head) : null;
  if (pic) mk("image", { href: cover, x: HB[1], y: HB[0], width: HB[3] - HB[1], height: HB[2] - HB[0], preserveAspectRatio: "xMidYMid slice", "clip-path": "inset(0 round 2.5px)" }, pic);
  const T0 = cover ? HB[2] + 5 : HB[0] + 6, RULES = cover ? [[T0 + 4, 50]] : [[T0 + 6, 72], [T0 + 10.5, 60], [T0 + 15, 40]];
  mk("path", { d: seg(pg(HB[1], T0), pg(66, T0)), class: "nf" }, head);
  mk("path", { d: RULES.map(([v, u1]) => seg(pg(HB[1], v), pg(u1, v))).join(""), class: "nf lo" }, head);
  // the page never moves, so its picture is laid once, at mount, before the first frame can paint
  if (pic) {
    const o = pg(0, 0), ax = pg(1, 0), ay = pg(0, 1);
    pic.setAttribute("transform", `matrix(${[ax[0] - o[0], ax[1] - o[1], ay[0] - o[0], ay[1] - o[1], o[0], o[1]].map((n) => n.toFixed(4)).join(" ")})`);
    frame.setAttribute("d", poly(rrect(HB[1], HB[0], HB[3], HB[2], 2.5, 4).map((q) => pg(q.u, q.v))));
  }

  // the colonies, the pen ring round one cluster: the page's rest mark
  const dg = mk("g", {}, g);
  DOTS.forEach((d) => place(flatDot(dg, C, d.r, "dot m"), w(d.x, d.y)));
  const ringPts = circ(RR, 40).map((q) => [CLU[RING][1] + q.u, CLU[RING][2] + q.v]);
  const ring = mk("path", { d: poly(ringPts.map(([x, y]) => w(x, y))), class: "nf hi" }, g);

  // The clip: its lever, a wire loop leaning back from the hinge over the hole, then the body and the rolled hinge over it.
  const AX = CL[0] + 2.8, AZ = PZ + CH + 0.4, lev = (u, s) => P(AX - s * 0.62, u, AZ + s * 0.78);
  mk("path", { d: open(run(rrect(38, -2, 74, 15, 4, 5), (q) => q.v > -0.5).map((q) => lev(q.u, q.v))), class: "nf sil" }, g);
  put(solid(g), prism(P, front, ...rings(...CL, 3, 1.2), PZ, PZ + CH));
  const roll = (y, r) => circ(r, 18).map((q) => P(AX + q.u, y, AZ + q.v));
  put(solid(g), { sil: poly(hull(roll(CL[1] + 2, HR).concat(roll(CL[3] - 2, HR)))), crease: poly(roll(CL[3] - 2, HR - 0.9)) });
  for (const y of [CL[1] + 7, CL[3] - 7]) place(flatDot(g, C, 0.7, "dot off"), P(CL[2] - 5, y, PZ + CH));

  // The loupe, back to front: base frame, its window and reticle, the leg, the lens frame and what the lens shows.
  const lg = mk("g", {}, g);
  const [bo, bi] = sq(BH, 2.6, 1), [bw] = sq(WH, 1.4, 0.5), legR = rrect(-LW, 0, LW, LZ - PZ - FT, 1, 3);
  const baseFill = mk("path", { class: "fo" }, lg), baseSil = mk("path", { class: "nf sil" }, lg);
  const baseCr = mk("path", { class: "nf lo" }, lg), baseWin = mk("path", { class: "nf" }, lg), ret = mk("path", { class: "nf lo" }, lg);
  const legBack = mk("path", { class: "lo" }, lg), legFace = mk("path", { class: "sil" }, lg);
  // the ring seen in the lens is bright only as part of the lit lens, when the page's own ring has given the bright up
  const lens = solid(lg), lensRet = mk("path", { class: "nf lo" }, lg), lensRing = mk("path", { class: "nf lo" }, lg);
  const tg = mk("g", {}, lg), lensWin = mk("path", { class: "nf" }, lg);
  let twins = [];
  function makeTwins() {
    twins.forEach((t) => t.el.remove());
    twins = DOTS.map((d) => ({ d, el: flatDot(tg, C, d.r * M, lit >= 0 ? "dot" : "dot m"), on: true }));
    drawn = "";
  }
  makeTwins();

  /** The reticle about (cx, cy) at height z, scaled m times, cut to the window: a cross with ticks. */
  function reticle(cx, cy, z, m) {
    let d = seg(P(cx - WH, cy, z), P(cx + WH, cy, z)) + seg(P(cx, cy - WH, z), P(cx, cy + WH, z));
    for (let k = -3; k <= 3; k++) {
      const t = k * TICK * m, l = k % 2 ? 0.6 : 1.1;
      if (!k || Math.abs(t) > WH - 0.4) continue;
      d += seg(P(cx + t, cy - l, z), P(cx + t, cy + l, z)) + seg(P(cx - l, cy + t, z), P(cx + l, cy + t, z));
    }
    return d;
  }

  function drawLoupe(cx, cy) {
    const z1 = PZ + FT, zt = LZ + LT, pb = prism(P, front, at0(bo, cx, cy), at0(bi, cx, cy), PZ, z1);
    let win = ringAt0(bw, cx, cy, z1);
    baseWin.setAttribute("d", poly(win));
    if (area(win) * area(hull(win)) > 0) win = win.slice().reverse();
    baseFill.setAttribute("d", pb.sil + poly(win));
    baseSil.setAttribute("d", pb.sil);
    baseCr.setAttribute("d", pb.crease);
    ret.setAttribute("d", reticle(cx, cy, z1, 1));
    legBack.setAttribute("d", poly(legR.map((q) => P(cx - BH, cy + q.u, z1 + q.v))));
    legFace.setAttribute("d", poly(legR.map((q) => P(cx - BH + FT, cy + q.u, z1 + q.v))));
    put(lens, prism(P, front, at0(bo, cx, cy), at0(bi, cx, cy), LZ, zt));
    lensWin.setAttribute("d", poly(ringAt0(bw, cx, cy, zt)));
    lensRet.setAttribute("d", reticle(cx, cy, zt, M));
    // what the lens shows: each colony at M times its offset from the window's centre, if it lands inside the lens
    for (const t of twins) {
      const lx = M * (t.d.x - cx), ly = M * (t.d.y - cy), lim = WH - t.d.r * M, on = Math.abs(lx) <= lim && Math.abs(ly) <= lim;
      if (on !== t.on) { t.on = on; t.el.setAttribute("display", on ? "inline" : "none"); }
      if (on) place(t.el, P(cx + lx, cy + ly, zt));
    }
    // and the pen ring, where it crosses the lens
    const runs = [];
    let cur = [];
    for (const [x, y] of ringPts.concat([ringPts[0]])) {
      const lx = M * (x - cx), ly = M * (y - cy);
      if (Math.abs(lx) <= WH && Math.abs(ly) <= WH) cur.push(P(cx + lx, cy + ly, zt));
      else if (cur.length) { runs.push(cur); cur = []; }
    }
    if (cur.length) runs.push(cur);
    lensRing.setAttribute("d", runs.filter((r) => r.length > 1).map(open).join(""));
  }

  const sx = spring(PARK[0]), sy = spring(PARK[1]);
  const redraw = () => { const key = sx.x.toFixed(3) + "," + sy.x.toFixed(3); if (key !== drawn) { drawn = key; drawLoupe(sx.x, sy.x); } };
  const B = register(stage, (dt) => { const m = stepS(sx, dt) | stepS(sy, dt); redraw(); return !!m; });
  bag.add(B.unregister);

  /** The cluster under the window's centre, read from the loupe's target, never from where it is now. A window that
   *  would show any of the pen ring picks the ringed cluster, so the ring is never bright on the page and in the lens. */
  const pick = (x, y) => {
    const i = CLU.findIndex(([, cx, cy, R]) => Math.hypot(x - cx, y - cy) <= R + 3);
    return i >= 0 || !ringPts.some(([px, py]) => Math.max(Math.abs(px - x), Math.abs(py - y)) * M <= WH) ? i : RING;
  };
  function show(over) {
    last = over;
    const t = over ? [clamp(over[0], TR[0], TR[2]), clamp(over[1], TR[1], TR[3])] : PARK;
    sx.t = t[0]; sy.t = t[1];
    const a = over ? pick(t[0], t[1]) : -1;
    if (a !== lit) {
      lit = a;
      lens.sil.classList.toggle("hi", a >= 0);
      ring.setAttribute("class", a >= 0 ? "nf lo" : "nf hi");
      lensRing.setAttribute("class", a === RING ? "nf hi" : "nf lo");
      twins.forEach((tw) => tw.el.classList.toggle("m", a < 0));
    }
    read.textContent = !over ? "rest" : a < 0 ? "page" : CLU[a][0];
    B.wake();
  }
  show(null); redraw(); // drawn at mount, so no frame ever shows the page without its loupe
  // off the page nothing is under the pointer: the loupe goes back to rest, never clamped onto a cluster it is not over
  const onPage = (q) => q[0] >= PG[0] && q[0] <= PG[2] && q[1] >= PG[1] && q[1] <= PG[3];
  bag.add(pointer(stage, { move: (p) => { const q = unproj(C, p[0], p[1], PZ); show(onPage(q) ? q : null); }, leave: () => show(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    // the pick depends on the magnification (what the lens can see), so it is read again for the pointer held where it is
    set: (v) => { M = v; makeTwins(); show(last); redraw(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "loupe",
  means: "A results page on a clipboard: a linen tester follows the pointer and its lens magnifies the colonies under it.",
  rules: [1, 3, 4, 6],
  range: [1.6, 2.2, 3],
  tour: [[198, 189], [250, 169], [223, 215], null],
  mount,
});
