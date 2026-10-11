/**
 * Front: a report file seen from its front face. The front page stands almost
 * face-on, turned a few degrees so its top edge climbs to the right while its
 * sides stay upright, and the next sheet stands behind it, up and to the
 * right. On the front page: a header rule, a picture block, and four section
 * lines, each with its bullet; the bare foot of the page is there to be
 * cropped. The pointer's height picks the section under it, which takes the
 * bright stroke; its x eases the front page to the left on a spring, and the
 * sheet behind a little the other way, so more of the next sheet, and the ends
 * of its own lines, come out. The slider is how far the front page can ease,
 * in page units (the page is 100 wide).
 *
 * The pattern: scrub and pick. One spring for where; for which, the pointer's
 * height on the front page's own plane, read in bands that never move, since
 * the page only ever slides along its lines.
 *
 * mount may be given { cover }: a picture laid on the front page's picture
 * block by the projection's own matrix, so it eases with the page.
 */
const {
  Cam, clamp, fit, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, place, pointer, put, register, solid,
} = HL;

const W = 100, H = 140, T = 1.2, R = 6, B = 1.4;            // a page: width, height, thickness, corner, crease inset
const DX = 12, DZ = 6, G = 3, PULL = 0.3, SLMAX = 20;        // the sheet behind: right, up and back; its share of the ease, the other way; the widest ease
const PIC = [12, 19, 88, 55], PR = 3;                       // the picture block, u0 v0 u1 v1 (v down from the top), and its corner
const HEAD = [12, 11.5, 50];                                // the header rule: u0, v, u1
const LINES = [[66, 80], [76, 62], [86, 49], [96, 71]];     // each section line: v, and where it ends; it starts at u 20, its bullet at u 14
const BACK = [[16, 70], [24, 86], [31, 82], [38, 56], [48, 88], [55, 79], [62, 85], [69, 50], [79, 84], [86, 76], [93, 87], [100, 52]];
const NAMES = ["cover", "overall health", "key findings", "attention", "next steps"];
const BANDS = [0, 61, 71, 81, 91, 103];                     // band i holds v from BANDS[i] to BANDS[i + 1]; below them, the bare page
const MARK = 3;                                             // the rest mark: the section that needs attention
const RING = rrect(0, 0, W, H, R, 8), INNER = rrect(B, B, W - B, H - B, R - B, 8), FR = rrect(PIC[0], PIC[1], PIC[2], PIC[3], PR, 4);

function mount({ stage, svg, read, cover }, value) {
  const bag = disposer();
  let ex = value, act = -1, on = false, ux = 0;

  // Low and turned -16°: the face nearly square to the eye, the top edge climbing; fitted to both ends of the ease.
  const C = Cam(-16, 0.3, 1.9), box = [];
  for (const [x0, y0, z0] of [[0, 0, 0], [-SLMAX, 0, 0], [DX, -G, DZ], [DX + PULL * SLMAX, -G, DZ]]) {
    for (const [x, z] of [[0, 0], [W, 0], [0, H], [W, H]]) box.push([x0 + x, y0, z0 + z], [x0 + x, y0 - T, z0 + z]);
  }
  fit(C, box, 186, 160);
  const P = proj(C);
  // A page's own frame: u across, v down from its top, t through it from its back (0) to its face (T).
  const pageAt = (dx, y0, z0) => (u, v, t) => P(dx + u, y0 - T + t, z0 + H - v);
  // A rim sample faces the eye when its side shows: its normal, on screen, runs the way the back peeks out from the face.
  const L = pageAt(0, 0, 0), o = L(0, 0, T), bk = L(0, 0, 0), tx = bk[0] - o[0], ty = bk[1] - o[1];
  const front = (q) => { const n = L(q.nu, q.nv, T); return (n[0] - o[0]) * tx + (n[1] - o[1]) * ty > 0; };

  // Painted back to front: the sheet behind and its text, then the front page and its marks.
  const g = mk("g", {}, svg);
  const back = { el: solid(g), text: mk("path", { class: "nf lo" }, g), drawn: NaN };
  const fr = { el: solid(g), drawn: NaN };
  const head = mk("path", { class: "nf" }, g);
  let cg = null;
  if (cover) {
    cg = mk("g", {}, g);
    mk("image", { href: cover, x: PIC[0], y: PIC[1], width: PIC[2] - PIC[0], height: PIC[3] - PIC[1], preserveAspectRatio: "xMidYMid slice", "clip-path": "inset(0 round 3px)" }, cg);
  }
  const frame = mk("path", { class: "nf lo" }, g);
  const lines = LINES.map(() => mk("path", { class: "nf lo" }, g));
  const dots = LINES.map(() => mk("circle", { r: 2.6, class: "dot off" }, g));

  /** The sheet behind, at x offset dx; its lines run under the front page, and only their ends ever show. */
  function drawBack(dx) {
    if (dx === back.drawn) return;
    back.drawn = dx;
    const w = pageAt(dx, -G, DZ);
    put(back.el, prism(w, front, RING, INNER, 0, T));
    back.text.setAttribute("d", BACK.map(([v, u1]) => seg(w(12, v, T), w(u1, v, T))).join(""));
  }

  /** The front page, at x offset dx (it only ever eases left), with its marks and its picture. */
  function drawFront(dx) {
    if (dx === fr.drawn) return;
    fr.drawn = dx;
    const p = pageAt(dx, 0, 0), w = (u, v) => p(u, v, T);
    put(fr.el, prism(p, front, RING, INNER, 0, T));
    head.setAttribute("d", seg(w(HEAD[0], HEAD[1]), w(HEAD[2], HEAD[1])));
    frame.setAttribute("d", poly(FR.map((q) => w(q.u, q.v))));
    LINES.forEach(([v, u1], i) => { lines[i].setAttribute("d", seg(w(20, v), w(u1, v))); place(dots[i], w(14, v)); });
    if (cg) {
      const a = w(0, 0), ax = w(1, 0), ay = w(0, 1);
      cg.setAttribute("transform", `matrix(${[ax[0] - a[0], ax[1] - a[1], ay[0] - a[0], ay[1] - a[1], a[0], a[1]].map((n) => n.toFixed(4)).join(" ")})`);
    }
  }

  const sp = spring(0);
  const loop = register(stage, (dt) => {
    const m = stepS(sp, dt), s = clamp(sp.x, -SLMAX, 0);
    drawBack(DX - PULL * s);
    drawFront(s);
    return m;
  });
  bag.add(loop.unregister);

  // Which section is under the pointer: its height on the front page's face at rest, in bands that never move,
  // and only across the file: from the front page's left edge to the sheet behind's right edge in the target pose.
  const F = pageAt(0, 0, 0), f0 = F(0, 0, T), fu = F(1, 0, T), fv = F(0, 1, T);
  const au = [fu[0] - f0[0], fu[1] - f0[1]], av = [fv[0] - f0[0], fv[1] - f0[1]], det = au[0] * av[1] - au[1] * av[0];
  const XL = F(0, H / 2, T)[0], XR = pageAt(DX, -G, DZ)(W, H / 2, T)[0];
  function hit([x, y]) {
    if (x < XL || x > XR + PULL * ex * au[0]) return -1;
    const qx = x - f0[0], qy = y - f0[1], v = (au[0] * qy - au[1] * qx) / det;
    for (let i = 0; i < NAMES.length; i++) if (v >= BANDS[i] && v < BANDS[i + 1]) return i;
    return -1;
  }

  /** Retargets the ease from the pointer's x, moves the bright stroke to the section picked, names it. */
  function show() {
    sp.t = on ? -ex * ux : 0;
    const lit = act < 0 ? MARK : act;
    head.setAttribute("class", lit === 0 ? "nf hi" : "nf");
    frame.setAttribute("class", lit === 0 ? "nf hi" : "nf lo");
    lines.forEach((l, i) => l.setAttribute("class", lit === i + 1 ? "nf hi" : "nf lo"));
    dots.forEach((d, i) => d.setAttribute("class", lit === i + 1 ? "dot" : "dot off"));
    read.textContent = act < 0 ? "rest" : NAMES[act];
    loop.wake();
  }
  show();
  drawBack(DX);
  drawFront(0);   // drawn at rest now, so the picture never shows before its first frame

  bag.add(pointer(stage, {
    move: (p) => { on = true; ux = clamp((p[0] - XL) / (XR - XL), 0, 1); act = hit(p); show(); },
    leave: () => { on = false; act = -1; show(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { ex = v; show(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "front",
  means: "A report file from its front face: the pointer's height picks a section, and moving right eases the page aside to show the next sheet.",
  rules: [1, 4, 5, 8],
  range: [8, 14, 20],
  tour: [[140, 105], [200, 176], [285, 205], null],
  mount,
});
