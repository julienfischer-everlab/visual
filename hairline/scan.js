/**
 * Scan: an MRI scanner on floor rails, and a patient lying on its table. The
 * pointer picks a place on the body; the gantry slides there on a spring, and
 * the region in the bore takes the bright stroke. At rest it is over the chest.
 * The read-out names the region. The slider is the bore's depth.
 *
 * The bore is honest by cutting, not by masking: the table and every body part
 * are cut at the gantry's two faces. The pieces behind it are painted first;
 * then the bore's visible inner wall (its front opening less its back one);
 * then the pieces inside, which lie on that wall; then the front face, with the
 * opening as its hole, which hides whatever of them it should; then the pieces
 * in front. The hit test projects onto the table top, which never moves, and
 * the region is read from the spring's target.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, rrect, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const L = 150, TW = 11, TZ = 24, Z1 = TZ + 3, PED = [118, 144];
const GY = 34, GH = 70, BZ = 35, BR = 21, XG0 = 12, XG1 = 102, HOME = 34, DMAX = 32;
// head to feet: [region, x0, x1, y0, y1, height, corner]
const PARTS = [
  ["head", 5, 20, -5.5, 5.5, 9, 4.5],
  ["chest", 22, 46, -10, 10, 10, 4],
  ["abdomen", 46.5, 70, -8.5, 8.5, 9, 3.5],
  ["thighs", 70.5, 97, -8, -1, 7, 3], ["thighs", 70.5, 97, 1, 8, 7, 3],
  ["legs", 97.5, 121, -7.5, -1.5, 6, 2.5], ["legs", 97.5, 121, 1.5, 7.5, 6, 2.5],
  ["feet", 121.5, 125, -7.5, -1.5, 13, 1.5], ["feet", 121.5, 125, 1.5, 7.5, 13, 1.5],
];
const NONE = { sil: "", crease: "" };

const area = (p) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0);
const orient = (p, s) => (Math.sign(area(p)) === s ? p : p.slice().reverse());
/** The part of convex polygon `sub` inside convex polygon `by`, both in screen points. */
function clip(sub, by) {
  const c = orient(by, 1);
  let out = sub;
  for (let i = 0; i < c.length && out.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length], inp = out, side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    out = [];
    inp.forEach((p, j) => {
      const q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    });
  }
  return out;
}
/** The region whose span holds x, else the nearest. */
const region = (x) => PARTS.reduce((a, p) => (Math.abs(x - (p[1] + p[2]) / 2) < Math.abs(x - (a[1] + a[2]) / 2) ? p : a))[0];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let D = value;

  const C = Cam(45, 0.5, 1.62);
  fit(C, [[XG0 - DMAX / 2, -GY, GH], [XG0 - DMAX / 2, GY, GH], [XG1 + DMAX / 2, GY, 0], [XG1 + DMAX / 2, -GY, 0],
    [L, TW, 0], [L, -TW, 0], [0, -TW, Z1], [0, TW, Z1]], 200, 166);
  const P = proj(C), front = facing(C);
  const OUT = rrect(-GY, 0, GY, GH, 16, 6), BORE = rrect(-BR, BZ - BR, BR, BZ + BR, BR, 12);

  // the floor rails the gantry rides on
  mk("path", { d: [-GY + 5, GY - 5].map((y) => open([P(-6, y, 0), P(XG1 + 20, y, 0)])).join(""), class: "nf lo" }, svg);
  const layer = () => mk("g", {}, svg);
  const behind = layer(), wall = layer(), inside = layer(), faceG = layer(), near = layer();
  const crFill = mk("path", { class: "fo" }, wall), crRim = mk("path", { class: "nf lo" }, wall);
  const faceFill = mk("path", { class: "fo" }, faceG), faceLo = mk("path", { class: "nf lo" }, faceG);
  const faceSil = mk("path", { class: "nf sil" }, faceG), boreEdge = mk("path", { class: "nf" }, faceG);
  const [pr, pi] = rings(PED[0], -8, PED[1], 8, 3, 1.2);
  put(solid(near), prism(P, front, pr, pi, 0, TZ));

  // the table, then the body, each as three pieces: behind, inside and in front of the gantry
  const items = [["table", 0, L, -TW, TW, 3, 3, TZ]].concat(PARTS.map((p) => p.concat([Z1])));
  const parts = items.map(([name, x0, x1, y0, y1, h, r, z0]) => ({ name, x0, x1, y0, y1, r, z0, z1: z0 + h, el: [behind, inside, near].map(solid) }));

  function piece(p, a, b) {
    a = Math.max(a, p.x0); b = Math.min(b, p.x1);
    if (b - a < 0.3) return NONE;
    const half = Math.min(b - a, p.y1 - p.y0) / 2, [ring, inner] = rings(a, p.y0, b, p.y1, Math.min(p.r, half), clamp(half - 0.1, 0.1, 1));
    return prism(P, front, ring, inner, p.z0, p.z1);
  }

  const gx = spring(HOME, { eps: 0.02 });
  let drawn = "";
  function draw() {
    const key = gx.x.toFixed(2) + "," + D;
    if (key === drawn) return;
    drawn = key;
    const xb = gx.x - D / 2, xf = gx.x + D / 2;
    for (const p of parts) {
      put(p.el[0], piece(p, -1e9, xb)); put(p.el[1], piece(p, xb, xf)); put(p.el[2], piece(p, xf, 1e9));
    }
    const at = (x, ring) => ring.map((q) => P(x, q.u, q.v));
    const oF = at(xf, OUT), oB = at(xb, OUT), bF = at(xf, BORE), bB = at(xb, BORE);
    const both = clip(bF, bB), sil = hull(oF.concat(oB));
    // the inner wall you can see: the front opening less the back one
    crFill.setAttribute("d", poly(orient(bF, 1)) + (both.length > 2 ? poly(orient(both, -1)) : ""));
    crRim.setAttribute("d", both.length > 2 ? poly(both) : "");
    // the face: the whole gantry, with the front opening as its hole
    faceFill.setAttribute("d", poly(orient(sil, 1)) + poly(orient(bF, -1)));
    faceLo.setAttribute("d", poly(oF));
    faceSil.setAttribute("d", poly(sil));
    boreEdge.setAttribute("d", poly(bF));
  }

  const mark = (name) => parts.forEach((p) => p.el.forEach((s) => s.sil.classList.toggle("hi", p.name === name)));
  const B = register(stage, (dt) => { const m = stepS(gx, dt); draw(); return m; });
  bag.add(B.unregister);

  function aim(x) {
    gx.t = x;
    mark(region(x));
    B.wake();
  }
  function move(p) {
    const [x, y] = unproj(C, p[0], p[1], Z1);
    if (x < -8 || x > L + 4 || Math.abs(y) > GY) return leave();
    aim(clamp(x, XG0, XG1));
    read.textContent = region(gx.t);
  }
  function leave() { aim(HOME); read.textContent = "rest"; }

  mark(region(HOME));
  bag.add(pointer(stage, { move, leave }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { D = v; B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "scan",
  means: "An MRI scanner over a patient: the gantry slides to the part of the body under the pointer, and the read-out names it.",
  rules: [1, 3, 6, 9],
  range: [14, 22, 32],
  mount,
});
