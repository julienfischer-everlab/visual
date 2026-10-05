/**
 * Plate: a 96-well sample plate on its skirt, the corner at H1 cut. The plate
 * is being read: columns 1–3 are done, well D4 is next, and the empty wells
 * at the far end hold no sample. The pointer moves the reader, an eight-channel
 * bar that rides along the plate on a spring: the well under the pointer is bright, and every loaded well it passes keeps a glow that
 * fades. The read-out names the well. The slider is the afterglow, in seconds.
 *
 * The pattern: paint and decay. The pointer is projected onto the plate's top,
 * which never moves; each well has a level that decays on the frame loop, and
 * a dot whose class is redrawn only when its level crosses a threshold.
 */
const {
  Cam, clamp, facing, fillet, fit, open, poly, prism, proj, rings, ringAt, rrect, run, unproj,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const COLS = 12, ROWS = 8, PITCH = 9, WR = 3.3, DR = 1.9, PT = 11, SK = 2.6;
const HZ = PT + 11, HH = 7, BW = 4.6, TIP = 1.7;
const EX = COLS * PITCH, EY = ROWS * PITCH, REACH = 1.6 * PITCH, NEXT = [3, 3];
const loaded = (c, r) => c < 8 || (c < 10 && r < 5) || (c === 10 && r < 2);
const base = (c, r) => (c < NEXT[0] ? "dot m" : "dot off");

/** A ring of samples from a closed convex polygon, normals pointing out: what prism needs. */
function ringOf(pts) {
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  return pts.map((p, i) => {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    let nu = b[1] - a[1], nv = a[0] - b[0];
    const l = Math.hypot(nu, nv) || 1;
    if (nu * (p[0] - cx) + nv * (p[1] - cy) < 0) { nu = -nu; nv = -nv; }
    return { u: p[0], v: p[1], nu: nu / l, nv: nv / l };
  });
}
/** The plate's outline, the corner nearest H1 (x small, y large) cut on a chamfer. */
function outline(x0, y0, x1, y1, ch, r) {
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0 + ch, y1], [x0, y1 - ch]];
  return ringOf(fillet(pts, [r, r, r, r * 0.6, r * 0.6], 6));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let glow = value;

  const C = Cam(45, 0.5, 1.92);
  fit(C, [[-9, -9, 0], [EX + 9, EY + 9, 0], [EX + 9, -9, 0], [-9, EY + 9, 0], [-9, -9, PT], [EX + 9, -9, PT], [-BW, -BW - 3, HZ + HH], [EX + BW, EY + BW + 3, HZ + HH]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the skirt the plate stands on, then the body, each cut at H1
  const skirt = outline(-9, -9, EX + 9, EY + 9, 13, 3), skIn = outline(-7.8, -7.8, EX + 7.8, EY + 7.8, 12, 2);
  put(solid(g), prism(P, front, skirt, skIn, 0, SK));
  const body = outline(-6.5, -6.5, EX + 6.5, EY + 6.5, 11.5, 3.5), bIn = outline(-5, -5, EX + 5, EY + 5, 10.4, 2.5);
  put(solid(g), prism(P, front, body, bIn, SK, PT));
  // the raised lip round the wells, and the wells' rims, as one dim path
  const [lip] = rings(-2.4, -2.4, EX + 2.4, EY + 2.4, 3, 1);
  mk("path", { d: poly(ringAt(P, lip, PT)), class: "nf lo" }, g);
  let rims = "";
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const x = (c + 0.5) * PITCH, y = (r + 0.5) * PITCH;
    rims += poly(ringAt(P, rrect(x - WR, y - WR, x + WR, y + WR, WR, 3), PT));
  }
  mk("path", { d: rims, class: "nf lo" }, g);

  // a dot of sample in each loaded well
  const wells = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    if (!loaded(c, r)) continue;
    const el = flatDot(g, C, DR, base(c, r));
    place(el, P((c + 0.5) * PITCH, (r + 0.5) * PITCH, PT));
    wells.push({ c, r, el, e: 0, cls: base(c, r) });
  }
  const at = new Map(wells.map((w) => [w.c + "," + w.r, w]));

  // the reader: an eight-channel bar riding over one column, a tip over each row; it rests over column 4
  const home = (NEXT[0] + 0.5) * PITCH, hx = spring(home, { eps: 0.02 });
  const tips = [], bar = solid(g);
  for (let r = 0; r < ROWS; r++) tips.push(solid(bar.g.parentNode.insertBefore(mk("g", {}), bar.g)));
  let drawn = NaN;
  function drawBar() {
    const x = hx.x;
    if (x === drawn) return;
    drawn = x;
    tips.forEach((t, r) => {
      const y = (r + 0.5) * PITCH, [tr, ti] = rings(x - TIP, y - TIP, x + TIP, y + TIP, TIP, 0.5);
      put(t, prism(P, front, tr, ti, PT + 1.2, HZ));
    });
    const [br, bi] = rings(x - BW, -BW - 3, x + BW, EY + BW + 3, 3, 1.3);
    put(bar, prism(P, front, br, bi, HZ, HZ + HH));
  }

  let over = null;
  /** Each dot's class: bright under the reader, or at rest the next well; medium while it glows; else its base. */
  function paint() {
    for (const w of wells) {
      const on = over ? over[0] === w.c && over[1] === w.r : w.c === NEXT[0] && w.r === NEXT[1];
      const cls = on ? "dot" : w.e > 0.12 ? "dot m" : base(w.c, w.r);
      if (cls !== w.cls) { w.cls = cls; w.el.setAttribute("class", cls); }
    }
  }

  const B = register(stage, (dt) => {
    let m = false;
    const k = Math.exp(-dt / glow);
    for (const w of wells) if (w.e > 0) { w.e = w.e * k < 0.01 ? 0 : w.e * k; if (w.e) m = true; }
    if (stepS(hx, dt)) m = true;
    paint();
    drawBar();
    return m;
  });
  bag.add(B.unregister);

  function move(p) {
    const [x, y] = unproj(C, p[0], p[1], PT);
    if (x < -2 || y < -2 || x > EX + 2 || y > EY + 2) return leave();
    hx.t = clamp(x, PITCH / 2, EX - PITCH / 2);
    over = [clamp(Math.floor(x / PITCH), 0, COLS - 1), clamp(Math.floor(y / PITCH), 0, ROWS - 1)];
    for (const w of wells) {
      const d = Math.hypot((w.c + 0.5) * PITCH - x, (w.r + 0.5) * PITCH - y);
      if (d < REACH) w.e = Math.max(w.e, 1 - d / REACH);
    }
    const w = at.get(over.join(","));
    read.textContent = "ABCDEFGH"[over[1]] + (over[0] + 1) + (w ? "" : " ·");
    B.wake();
  }
  function leave() { over = null; hx.t = home; read.textContent = "rest"; B.wake(); }

  paint();
  drawBar();
  bag.add(pointer(stage, { move, leave }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { glow = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "plate",
  means: "A 96-well sample plate: the reader under the pointer lights a well, and the wells it passes glow, then fade.",
  rules: [1, 4, 5, 7],
  range: [0.4, 1.2, 3],
  mount,
});
