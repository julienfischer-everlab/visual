/**
 * Record: a person's check-ups as a stack of reports on a tray, one a year,
 * the oldest at the bottom. The pointer's height over the stack picks a year;
 * that report slides out towards the reader, showing its results, and its
 * neighbours slide a little after it, staggered outwards. At rest the newest
 * is half out. The read-out names the year. The slider is the stagger, in ms.
 *
 * Each report is a thin sheet with a heading, ruled lines and a column of
 * result dots, painted bottom to top so a sheet covers the ones under it.
 * The pick reads the pointer's height against the stack's rest pose, never
 * against a sheet on its way out.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, rings, ringAt, rrect, seg,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const N = 7, W = 64, H = 46, GZ = 7, TH = 1.4, Z0 = 6, OUT = 34, BUMP = [OUT, 9, 3];
const JIT = [[-2, 1], [1, -1.5], [-1, 2], [2, 0.5], [0, -2], [-1.5, 1.2], [1, -0.5]];
const REST = [0, 0, 0, 2, 0, 5, 16];
// each year's results: 2 columns of 5, 1 for a result to watch
const RES = ["0010000100", "0000010000", "0100000010", "0000000000", "0010001000", "0000100000", "0001000000"];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 2.45);
  fit(C, [[-6, -6, 0], [W + 6 + OUT, H + 6, 0], [W + 6 + OUT, -6, 0], [-6, H + 6, 0], [-6, -6, Z0 + N * GZ], [W + OUT, -4, Z0 + N * GZ]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the tray the reports sit in
  const [tr, ti] = rings(-6, -6, W + 6, H + 6, 6, 2);
  put(solid(g), prism(P, front, tr, ti, 0, Z0 - 1));
  mk("path", { d: poly(ringAt(P, rrect(-3, -3, W + 3, H + 3, 4, 4), Z0 - 1)), class: "nf lo" }, g);

  const sheets = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g), body = solid(grp), lines = mk("path", { class: "nf lo" }, grp), head = mk("path", { class: "nf" }, grp);
    const dots = [];
    for (let k = 0; k < 10; k++) dots.push(flatDot(grp, C, 1.1, RES[i][k] === "1" ? "dot m" : "dot off"));
    sheets.push({ z: Z0 + i * GZ, j: JIT[i], body, lines, head, dots, out: tween(REST[i]), drawn: NaN });
  }

  function draw(s, o) {
    if (o === s.drawn) return;
    s.drawn = o;
    const x0 = s.j[0] + o, y0 = s.j[1], z = s.z + TH;
    const [r, inr] = rings(x0, y0, x0 + W, y0 + H, 2.2, 1);
    put(s.body, prism(P, front, r, inr, s.z, z));
    // the heading, then ruled lines across the sheet, on its top
    s.head.setAttribute("d", seg(P(x0 + 6, y0 + 8, z), P(x0 + 6, y0 + 30, z)));
    let d = "";
    for (let k = 0; k < 6; k++) { const x = x0 + 14 + k * 7; d += seg(P(x, y0 + 6, z), P(x, y0 + 32, z)); }
    s.lines.setAttribute("d", d);
    s.dots.forEach((el, k) => place(el, P(x0 + 14 + (k % 5) * 7 + 3.5, y0 + 37 + Math.floor(k / 5) * 4.5, z)));
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const s of sheets) { draw(s, tval(s.out, now)); if (!tdone(s.out, now)) m = true; }
    return m;
  });
  bag.add(B.unregister);

  // the pick: the pointer's height over the stack's rest pose, in levels
  const base = P(W / 2, H / 2, Z0)[1], step = P(0, 0, 0)[1] - P(0, 0, GZ)[1];
  const [lx, rx] = [P(-6, H + 6, 0)[0], P(W + 6 + OUT, -6, 0)[0]];
  function hit([x, y]) {
    if (x < lx || x > rx) return -1;
    const lv = Math.round((base - y) / step);
    return lv < -2 || lv > N + 2 ? -1 : clamp(lv, 0, N - 1);
  }

  let act = -1;
  const mark = (a) => sheets.forEach((s, i) => s.body.sil.classList.toggle("hi", i === (a < 0 ? N - 1 : a)));
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    sheets.forEach((s, i) => {
      const d = Math.abs(i - a);
      tset(s.out, a < 0 ? REST[i] : d < BUMP.length ? BUMP[d] : 0, now, Math.abs(i - from) * stag);
    });
    mark(a);
    read.textContent = a < 0 ? "rest" : String(2019 + a);
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
  name: "record",
  means: "Your check-ups as a stack of reports, one a year: the year under the pointer slides out, and the years beside it follow.",
  rules: [1, 2, 5, 6],
  range: [0, 40, 90],
  mount,
});
