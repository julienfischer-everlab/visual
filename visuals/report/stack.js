/**
 * Stack: a report as four sheets in a stack, the cover on top, fanned a little
 * round the staple in its corner and sprung slightly apart. The pointer's x
 * scrubs the gaps, shut at the left and open at the right, one spring per gap;
 * its y picks the sheet under it, which takes the bright edge, and the gaps
 * nearest that sheet open the most. The cover is a board, thicker than the
 * sections and a little larger; each section is a few pages with a divider
 * tab down the right edge. The slider is the gap the pointer can add, in px.
 *
 * The pattern: scrub and pick. A spring per gap for where; for which, a hit
 * test on the rest pose, so a sheet moving out from under the pointer cannot
 * flip the choice.
 */
const {
  Cam, clamp, facing, fit, lerp, open, prism, proj, rad, ringAt, rings, run, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 60, H = 84, PX = 7.5, PY = 7.5;      // a page, and the staple it fans round
const TK = [4.6, 2.8, 2.8, 2.8];                // the cover is a board; each section is a few pages
const ANG = [0, 4, -3, 6.5];                    // the fan at rest, in degrees round the staple
const REST = [16, 9, 12], SHUT = 2.5, EXMAX = 18; // the gaps in px: uneven at rest, nearly shut at the far left
const TABS = [null, 10, 34, 58], TL = 14, TO = 6.5, LAP = 1.5;
const NAMES = ["cover", "sheet 2", "sheet 3", "sheet 4"];
/** A gap's share of the opening, by its distance from the sheet picked: 1 → .5 → .25. */
const near = (d) => (d <= 0.5 ? 1 : d <= 1.5 ? 0.5 : 0.25);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let ex = value, act = -1, ux = 0.5;
  const S = 2.05, ZPX = S * Math.sqrt(0.75);    // px per world unit of height, at k 0.5

  // Sheet i is fanned by ANG[i] round the staple: `at` places a page point, `spin` a whole ring.
  const turn = (i) => [Math.cos(rad(ANG[i])), Math.sin(rad(ANG[i]))];
  const at = (i, x, y) => { const [c, s] = turn(i); return [PX + (x - PX) * c - (y - PY) * s, PY + (x - PX) * s + (y - PY) * c]; };
  const spin = (i, ring) => {
    const [c, s] = turn(i);
    return ring.map((q) => { const [u, v] = at(i, q.u, q.v); return { u, v, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }; });
  };

  /** Each sheet's [bottom, top] for gaps in px, the stack centred on z = 0. */
  function zsOf(gaps) {
    let z = (TK.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0) / ZPX) / 2;
    return TK.map((t, i) => { const top = z; z -= t + (gaps[i] || 0) / ZPX; return [top - t, top]; });
  }

  const sh = TK.map((_, i) => {
    const o = i === 0 ? LAP : 0;
    const [r, n] = rings(-o, -o, W + o, H + o, 3, i === 0 ? 1.4 : 0.9);
    const tab = TABS[i] == null ? null : rings(W, TABS[i], W + TO, TABS[i] + TL, 2, 0.8).map((rg) => spin(i, rg));
    return { i, ring: spin(i, r), inner: spin(i, n), tab, drawn: NaN };
  });

  // The camera is fitted to the stack opened as far as the slider allows.
  const C = Cam(45, 0.5, S), far = zsOf(REST.map((g) => g + EXMAX));
  const box = [];
  sh.forEach((s) => [s.ring, ...(s.tab || [])].forEach((rg) => rg.forEach((q) => box.push([q.u, q.v, far[0][1]], [q.u, q.v, far[3][0]]))));
  fit(C, box, 200, 166);
  const P = proj(C), front = facing(C);

  // Painted from the bottom sheet up: each sheet, the line between its pages, then its tab, which stands in front of its edge.
  const g = mk("g", {}, svg);
  for (let i = 3; i >= 0; i--) {
    const s = sh[i];
    s.el = solid(g);
    if (i > 0) s.page = mk("path", { class: "nf lo" }, g);
    if (s.tab) s.tabEl = solid(g);
  }
  // The cover's own marks: a title rule, a block of dim rules under it, a date rule at the foot, and the staple across its corner.
  const title = mk("path", { class: "nf" }, g), lines = mk("path", { class: "nf lo" }, g), staple = mk("path", { class: "nf" }, g);
  const RULES = [[12, 25, 50], [12, 30, 46], [12, 35, 38], [12, 74, 26]];

  function draw(s, z0, z1) {
    if (z1 === s.drawn) return;
    s.drawn = z1;
    put(s.el, prism(P, front, s.ring, s.inner, z0, z1));
    if (s.page) s.page.setAttribute("d", open(ringAt(P, run(s.ring, front), (z0 + z1) / 2)));
    if (s.tab) put(s.tabEl, prism(P, front, s.tab[0], s.tab[1], z0, z1));
    if (s.i) return;
    const w = (x, y) => P(...at(0, x, y), z1);
    title.setAttribute("d", seg(w(12, 18), w(42, 18)));
    lines.setAttribute("d", RULES.map(([x0, y, x1]) => seg(w(x0, y), w(x1, y))).join(""));
    staple.setAttribute("d", seg(w(3.8, 11.2), w(11.2, 3.8)));
  }

  const sp = REST.map((r) => spring(r));
  const B = register(stage, (dt) => {
    let m = false;
    for (const q of sp) if (stepS(q, dt)) m = true;
    const z = zsOf(sp.map((q) => Math.max(SHUT, q.x)));
    sh.forEach((s, i) => draw(s, z[i][0], z[i][1]));
    return m;
  });
  bag.add(B.unregister);

  // Which sheet is under the pointer, read on the REST pose: the top sheet whose top or base holds it.
  const restZ = zsOf(REST);
  const mid = restZ.map((z, i) => P(...at(i, W / 2, H / 2), z[1])[1]);
  function inside(i, [wx, wy]) {
    const [c, s] = turn(i), dx = wx - PX, dy = wy - PY;
    const x = PX + dx * c + dy * s, y = PY - dx * s + dy * c, o = i === 0 ? LAP : 0;
    if (x >= -o && x <= W + o && y >= -o && y <= H + o) return true;
    return TABS[i] != null && x > W && x <= W + TO && y >= TABS[i] && y <= TABS[i] + TL;
  }
  function hit([x, y]) {
    for (let i = 0; i < 4; i++) if (restZ[i].some((z) => inside(i, unproj(C, x, y, z)))) return i;
    // off the stack: the sheet whose middle is nearest in height
    let b = 0;
    mid.forEach((m, i) => { if (Math.abs(m - y) < Math.abs(mid[b] - y)) b = i; });
    return b;
  }

  /** Retargets the gaps (shut to open along x, most round the sheet picked), moves the bright edge, names the sheet. */
  function show() {
    sp.forEach((q, j) => { q.t = act < 0 ? REST[j] : lerp(SHUT, REST[j] + ex * near(Math.abs(j + 0.5 - act)), ux); });
    const lit = act < 0 ? 0 : act;
    sh.forEach((s) => { s.el.sil.classList.toggle("hi", s.i === lit); if (s.tabEl) s.tabEl.sil.classList.toggle("hi", s.i === lit); });
    read.textContent = act < 0 ? "rest" : NAMES[act];
    B.wake();
  }
  show();

  bag.add(pointer(stage, {
    move: (p) => { ux = clamp((p[0] - 110) / 180, 0, 1); act = hit(p); show(); },
    leave: () => { act = -1; show(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { ex = v; if (act >= 0) show(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "stack",
  means: "A report as four sheets in a stack: the pointer's x springs the gaps shut or open, its y picks the sheet that takes the bright edge.",
  rules: [1, 3, 4, 8],
  range: [6, 12, 18],
  tour: [[150, 120], [250, 192], [300, 215], null],
  mount,
});
