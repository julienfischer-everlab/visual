/**
 * Folder: a file folder standing open, seen from its front corner, six files
 * filed in it with their index tabs staggered left to right. One file is out
 * a bit and carries the bright edge. The pointer runs along the tabs: the file
 * whose tab is nearest slides up out of the folder and takes the bright, the
 * one that was out slides back down, and the files beside it are dragged up a
 * touch, staggered out from it. The slider is how far a file comes out.
 *
 * The folder is one sheet: a section, back panel, rounded fold and leaning
 * front panel, swept along the folder's width and cut at its horizon. The back
 * half is painted before the files, the front half after them. The hit test
 * reads the tabs' resting centres along the screen's x, so a file rising
 * cannot change the choice, and a file hidden behind the one out stays in reach.
 */
const {
  Cam, clamp, fillet, fit, poly, proj, rad, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

const W = 104, D = 20, T = 1, RB = 6, RF = 7, FL = rad(18), HB = 70, LF = 35; // the folder: width, depth, sheet, fold radii, lean, back and front
const BT = [14, 46, 8];                                                           // the folder's own tab on the back panel: from, to, height
const N = 6, FX0 = 5, FX1 = W - 5, ZT = 60, TW = 14, TH = 6.5, TF = 0.6, GAP = 2.6, LEAN = 2.8; // the files, and the fan they stand in
const MAXOUT = 26, REST = 2, AT_REST = 0.75, DRAG = [1, 0.14, 0.05], STEP = 40;

// The folder's section: s runs from the top of the back panel down, round the fold, and up the front panel; o is the offset inwards.
const CY = D - (RF * (1 - Math.sin(FL))) / Math.cos(FL);
const S1 = HB - RB, S2 = S1 + (RB * Math.PI) / 2, S3 = S2 + CY - RB, S4 = S3 + RF * (Math.PI / 2 - FL), SE = S4 + LF;
function Q(o, s) {
  if (s <= S1) return [o, HB - s];
  if (s <= S2) { const a = Math.PI + (s - S1) / RB; return [RB + (RB - o) * Math.cos(a), RB + (RB - o) * Math.sin(a)]; }
  if (s <= S3) return [RB + s - S2, o];
  if (s <= S4) { const a = 1.5 * Math.PI + (s - S3) / RF; return [CY + (RF - o) * Math.cos(a), RF + (RF - o) * Math.sin(a)]; }
  const e = s - S4;
  return [CY + (RF - o) * Math.cos(FL) + e * Math.sin(FL), RF - (RF - o) * Math.sin(FL) + e * Math.cos(FL)];
}
/** The height of the folder's inner floor at depth y, where a file stands. */
const floorAt = (y) => (y < RB ? RB - Math.sqrt((RB - T) ** 2 - (RB - y) ** 2) : y > CY ? RF - Math.sqrt((RF - T) ** 2 - (y - CY) ** 2) : T);

/** File i, counted from the back: where it stands and leans, its tab, its outline in its own plane, and a map from that plane to the world. */
function file(i) {
  const k = N - 1 - i, yb = T + 2.2 + i * GAP, ph = rad(i * LEAN), fb = floorAt(yb) + 0.4;
  const h = (ZT - fb) / Math.cos(ph), t = FX0 + (k * (FX1 - FX0 - TW)) / (N - 1);
  // corners with their radii; the first and last tabs are cut flush with the file's edge, as a set of five-cut tabs is
  const c = [[FX0, 0, 1], [FX1, 0, 1], [FX1, h, 2.6], [t + TW + 1.6, h, 1.4], [t + TW, h + TH, 2.2], [t, h + TH, 2.2], [t - 1.6, h, 1.4], [FX0, h, 2.6]]
    .filter((_, j) => !(k === N - 1 && (j === 2 || j === 3)) && !(k === 0 && (j === 6 || j === 7)));
  const pts = fillet(c.map((q) => [q[0], q[1]]), c.map((q) => q[2]));
  // (u, v) in the file's plane, slid out along it by `lift`, `off` behind its face
  const at = (u, v, lift, off = 0) => [u, yb + (v + lift) * Math.sin(ph) - off * Math.cos(ph), fb + (v + lift) * Math.cos(ph) + off * Math.sin(ph)];
  return { h, t, pts, at };
}

/** The sheet's outline in (u, s): the back half from its top, tab and all, down to its horizon; the front half from its horizon up. */
const backOut = (sh) => fillet([[0, sh], [0, 0], [BT[0], 0], [BT[0] + 2, -BT[2]], [BT[1] - 2, -BT[2]], [BT[1], 0], [W, 0], [W, sh]], [0.01, 5, 2, 3, 3, 2, 5, 0.01]);
const frontOut = (sh) => fillet([[0, sh], [W, sh], [W, SE], [0, SE]], [0.01, 0.01, 5, 5]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let out = value, act = -1;

  const files = Array.from({ length: N }, (_, i) => file(i));

  // Fitted to the folder with any file out as far as the slider goes.
  const C = Cam(45, 0.5, 2.0), box = [[BT[0] + 2, ...Q(0, -BT[2])]];
  for (const s of [0, S1, S2, S3, S4, SE]) box.push([0, ...Q(0, s)], [W, ...Q(0, s)]);
  files.forEach((f) => box.push(f.at(FX0, f.h, MAXOUT), f.at(FX1, f.h, MAXOUT), f.at(f.t, f.h + TH, MAXOUT), f.at(f.t + TW, f.h + TH, MAXOUT)));
  fit(C, box, 200, 166);
  const P = proj(C);

  // the sheet at offset o, its outline sampled along s wherever s changes, so the fold comes out round
  function sheet(o, outline) {
    const pts = [];
    outline.forEach((a, j) => {
      const b = outline[(j + 1) % outline.length], n = Math.max(1, Math.ceil(Math.abs(b[1] - a[1]) / 1.5));
      for (let m = 0; m < n; m++) pts.push(P(a[0] + ((b[0] - a[0]) * m) / n, ...Q(o, a[1] + ((b[1] - a[1]) * m) / n)));
    });
    return poly(pts);
  }
  // the horizon: where the fold, swept along the width, is lowest across the sweep
  const p0 = P(0, 0, 0), p1 = P(1, 0, 0), nx = p0[1] - p1[1], ny = p1[0] - p0[0];
  function horizon(o) {
    let b = S2, bv = -Infinity;
    for (let s = S2; s < S4; s += 0.1) { const p = P(0, ...Q(o, s)), v = nx * p[0] + ny * p[1]; if (v > bv) { bv = v; b = s; } }
    return b;
  }
  const hB = horizon(T), hF = horizon(0);

  // Back to front: the back half (its outer face shows only at the rim), the files, then the front half and the score of its fold.
  const g = mk("g", {}, svg);
  mk("path", { d: sheet(0, backOut(hB)), class: "lo" }, g);
  mk("path", { d: sheet(T, backOut(hB)), class: "sil" }, g);
  files.forEach((f, i) => {
    const grp = mk("g", {}, g);
    f.back = mk("path", { class: "lo" }, grp);
    f.face = mk("path", { class: "sil" }, grp);
    f.tw = tween(i === REST ? out * AT_REST : 0);
    f.drawn = NaN;
  });
  mk("path", { d: sheet(T, frontOut(hF)), class: "lo" }, g);
  mk("path", { d: sheet(0, frontOut(hF)), class: "sil" }, g);
  mk("path", { d: seg(P(3, ...Q(0, S4 + 1.5)), P(W - 3, ...Q(0, S4 + 1.5))), class: "nf lo" }, g);

  /** A file whose lift has not changed keeps its paths. */
  function draw(f, lift) {
    if (lift === f.drawn) return;
    f.drawn = lift;
    f.back.setAttribute("d", poly(f.pts.map(([u, v]) => P(...f.at(u, v, lift, TF)))));
    f.face.setAttribute("d", poly(f.pts.map(([u, v]) => P(...f.at(u, v, lift)))));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    files.forEach((f) => { draw(f, tval(f.tw, now)); if (!tdone(f.tw, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // Hit test: the tabs make one row across the screen, so the file is the one whose RESTING tab centre is nearest the pointer's x,
  // inside the box the folder can fill. Nothing that moves is read, and a file hidden behind the one out is still reached by its tab.
  const cx = files.map((f) => P(...f.at(f.t + TW / 2, f.h, 0))[0]);
  const sb = box.map((q) => P(...q)), M = 6;
  const [x0, x1, y0, y1] = [Math.min(...sb.map((p) => p[0])) - M, Math.max(...sb.map((p) => p[0])) + M, Math.min(...sb.map((p) => p[1])) - M, Math.max(...sb.map((p) => p[1])) + M];
  function hit([x, y]) {
    if (x < x0 || x > x1 || y < y0 || y > y1) return -1;
    let b = 0;
    cx.forEach((c, i) => { if (Math.abs(c - x) < Math.abs(cx[b] - x)) b = i; });
    return b;
  }

  /** Pulls file a out (-1 leaves the one at rest out a little). The stagger spreads from the file pulled, or the one let go. */
  function setActive(a, again) {
    if (a === act && !again) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : REST, lit = a >= 0 ? a : REST;
    act = a;
    files.forEach((f, i) => {
      const to = a < 0 ? (i === REST ? out * AT_REST : 0) : out * (DRAG[Math.abs(i - a)] || 0);
      tset(f.tw, clamp(to, 0, MAXOUT), now, Math.abs(i - from) * STEP);
      f.face.classList.toggle("hi", i === lit);
    });
    read.textContent = a < 0 ? "rest" : "file " + (N - a);
    B.wake();
  }
  setActive(-1, true);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { out = v; setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "folder",
  means: "A folder of six files with one out a bit: the file whose tab is nearest the pointer slides up out of it, and the other goes back.",
  rules: [1, 4, 5, 6],
  range: [8, 16, 26],
  tour: [[123, 117], [184, 131], [276, 153], null],
  mount,
});
