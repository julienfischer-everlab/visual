/**
 * Planner: a desk planner as three thin calendar sheets standing one behind
 * another, fanned back a little from the foot with uneven gaps. The front
 * sheet is a month: a week grid of seven days by four weeks, a title rule in
 * its header, and two binding rings looped over its top edge. A raised
 * appointment token sits on one day, its rim the bright mark, and a hairline
 * strung with beads hangs from it to the desk. The pointer picks the day
 * under it, read on the front sheet's plane, which never moves; the token
 * travels there on the 700ms lift curve and its line follows, bead by bead,
 * staggered down from it. The slider is the gap between the sheets.
 *
 * The pattern: one of many, on a grid. A tween per coordinate for which day,
 * a stagger by distance down the line, a spring for the gap.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, rad, rings, rrect, seg,
  spring, stepS, tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const CW = 9.5, CH = 8.5, NC = 7, NR = 4, MX = 5.5, MB = 6, HB = 13;  // a day cell, the grid, the side and foot margins, the header band
const W = 2 * MX + NC * CW, H = MB + NR * CH + HB, R = 5, TK = 1.1;  // a sheet: its size, its round, its thickness
const LEAN = [-11, -6, -1.5];             // back to front: how far each sheet leans back, in degrees
const SHARE = [1.6, 1, 0];                // how many gaps each sheet stands behind the front one: uneven
const GMIN = 3, GMAX = 16;                // the gap, clamped
const RINGS = [W * 0.26, W * 0.74], RR = 3.2, RC = 1.3;  // the binding: where its rings sit, their radius, their centre under the top edge
const TU = 5.8, TV = 5.2, TT = 2.6, NK = 4, STEP = 45;      // the token's size and thickness; the points of its line, and the stagger down it
const REST = [3, 1];                      // thursday of the second week
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const OUT = rrect(0, 0, W, H, R, 6);
const [TR, TI] = rings(-TU / 2, -TV / 2, TU / 2, TV / 2, 2, 0.9);

/** Sheet i standing Y along the row: the world point at (u, v) on its face, o behind it. */
const sheet = (i, Y) => {
  const s = Math.sin(rad(LEAN[i])), c = Math.cos(rad(LEAN[i]));
  return (u, v, o = 0) => [u, Y + v * s - o * c, v * c + o * s];
};
/** The middle of day cell (col, row) on the face; row 0 is the first week, at the top. */
const cell = (col, row) => [MX + (col + 0.5) * CW, MB + (NR - row - 0.5) * CH];

/** The camera, fitted to the sheets spread as far as the slider allows, token and rings included. */
function frame() {
  const C = Cam(45, 0.5, 2.9), box = [];
  for (let i = 0; i < 3; i++) {
    const w = sheet(i, -SHARE[i] * GMAX);
    for (const u of [0, W]) for (const v of [0, H + RR - RC]) for (const o of [-TT, TK]) box.push(w(u, v, o));
  }
  fit(C, box, 200, 166);
  return { C, P: proj(C) };
}

/** Sheet i at Y, as path strings: its back edge, its face, its marks (the week grid on the front one only), and its rings' halves. */
function paths(P, i, Y) {
  const w = sheet(i, Y), at = (u, v, o) => P(...w(u, v, o));
  const marks = [seg(at(MX, H - HB / 2 - 0.8), at(MX + 2 * CW, H - HB / 2 - 0.8))];
  for (let k = 0; k <= NR && i === 2; k++) marks.push(seg(at(MX, MB + k * CH), at(W - MX, MB + k * CH)));
  for (let k = 0; k <= NC && i === 2; k++) marks.push(seg(at(MX + k * CW, MB), at(MX + k * CW, MB + NR * CH)));
  // a ring is a loop in the plane across the sheet: through a hole under the top edge, over it, and back
  const half = (side) => RINGS.map((u) => {
    const pts = [];
    for (let t = -90; t <= 90; t += 15) pts.push(at(u, H - RC + RR * Math.sin(rad(t)), side * RR * Math.cos(rad(t))));
    return open(pts);
  }).join("");
  return {
    ringB: half(1),
    back: poly(OUT.map((q) => at(q.u, q.v, TK))),
    face: poly(OUT.map((q) => at(q.u, q.v))),
    marks: marks.join(""),
    ringF: half(-1),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const { C, P } = frame(), face = sheet(2, 0);

  // Painted back to front: each sheet's rings behind it, its back edge, its face, its marks, its rings in front;
  // then, on the front sheet, the token, and the line hanging in front of the face from its front edge.
  const g = mk("g", {}, svg);
  const els = LEAN.map(() => ({
    ringB: mk("path", { class: "nf" }, g), back: mk("path", { class: "lo" }, g), face: mk("path", { class: "sil" }, g),
    marks: mk("path", { class: "nf lo" }, g), ringF: mk("path", { class: "nf" }, g),
  }));
  const tok = solid(g);
  tok.sil.classList.add("hi");
  const line = mk("path", { class: "nf" }, g);
  const foot = flatDot(g, C, 1.1, "dot m");
  const beads = [1, 2].map(() => mk("circle", { r: 1.25, class: "dot m" }, g));

  const drawn = [NaN, NaN, NaN];
  function drawSheet(i, Y) {
    if (Y === drawn[i]) return;
    drawn[i] = Y;
    const p = paths(P, i, Y);
    for (const k in p) els[i][k].setAttribute("d", p[k]);
  }

  // The front sheet's face, which never moves, under a screen point: the hit test reads it, and the token's offset comes from it.
  const o = P(0, 0, 0), e = (x, y, z) => { const q = P(x, y, z); return [q[0] - o[0], q[1] - o[1]]; };
  const eu = e(...face(1, 0)), ev = e(...face(0, 1)), det = eu[0] * ev[1] - eu[1] * ev[0];
  const onFace = ([x, y]) => { const qx = x - o[0], qy = y - o[1]; return [(qx * ev[1] - qy * ev[0]) / det, (eu[0] * qy - eu[1] * qx) / det]; };
  // the token stands proud of the face, so it is set this far up and right of its day's middle, to stand over it on screen
  const mid = P(...face(0, 0, -TT / 2)), [DX, DV] = onFace([2 * o[0] - mid[0], 2 * o[1] - mid[1]]);

  // The token and each point of its line keep their own (u, v) on the face, so the line can trail the token.
  const [u0, v0] = cell(...REST);
  const tu = [], tv = [];
  for (let k = 0; k < NK; k++) { tu.push(tween(u0)); tv.push(tween(v0)); }
  let last = "";
  function drawToken(now) {
    const uv = tu.map((t, k) => [tval(t, now), tval(tv[k], now)]);
    const key = uv.join();
    if (key === last) return;
    last = key;
    const [u, v] = uv[0], at = (q, d) => P(...face(u + DX + q.u, v + DV + q.v, d));
    put(tok, { sil: poly(hull(TR.map((q) => at(q, 0)).concat(TR.map((q) => at(q, -TT))))), crease: poly(TI.map((q) => at(q, -TT))) });
    // the line hangs plumb from the middle of the token's front edge, clear of the face, down to the desk
    const pts = uv.map(([pu, pv], k) => { const [x, y, z] = face(pu + DX, pv + DV - TV / 2, -TT); return P(x, y, z * (1 - k / (NK - 1))); });
    line.setAttribute("d", open(pts));
    beads.forEach((el, k) => place(el, pts[k + 1]));
    place(foot, pts[NK - 1]);
  }

  const sp = spring(clamp(value, GMIN, GMAX));
  drawSheet(2, 0);
  const B = register(stage, (dt, now) => {
    const m = stepS(sp, dt), gp = clamp(sp.x, GMIN, GMAX);
    for (let i = 0; i < 2; i++) drawSheet(i, -SHARE[i] * gp);
    drawToken(now);
    return m || tu.some((t, k) => !tdone(t, now) || !tdone(tv[k], now));
  });
  bag.add(B.unregister);

  // The day under the pointer, read on the front sheet's face, which never moves: the grid is the hit area.
  function hit(p) {
    const [u, v] = onFace(p);
    if (u < -2 || u > W + 2 || v < -2 || v > H + 2) return null;
    return [clamp(Math.floor((u - MX) / CW), 0, NC - 1), clamp(Math.floor((MB + NR * CH - v) / CH), 0, NR - 1)];
  }

  /** Sends the token to day a (null sends it home); the line's points follow, each STEP later than the one above. */
  let act = "";
  function choose(a) {
    const key = a ? a.join() : "";
    if (key === act) return;
    act = key;
    const [u, v] = cell(...(a || REST)), now = performance.now();
    tu.forEach((t, k) => { tset(t, u, now, k * STEP); tset(tv[k], v, now, k * STEP); });
    read.textContent = a ? `wk ${a[1] + 1} · ${DAYS[a[0]]}` : "rest";
    B.wake();
  }
  read.textContent = "rest";

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { sp.t = clamp(v, GMIN, GMAX); B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "planner",
  means: "A desk planner's month: the pointer picks a day and the appointment token travels there, its line following down to the desk.",
  rules: [1, 2, 6, 8],
  range: [4, 10, 16],
  tour: [[127, 184], [166, 160], [204, 245], null],
  mount,
});
