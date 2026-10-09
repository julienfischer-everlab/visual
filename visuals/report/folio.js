/**
 * Folio: a report lying half open on its binding. Four section pages fan from
 * the spine between a thick back cover, with the rest of the pages stacked on
 * it, and a front cover thrown back. The page under the pointer stands up and
 * its neighbours part, staggered out from it on the 700ms lift curve. Each
 * section page has a tab on its fore-edge with its number punched in dots.
 * The slider is the angle the chosen page stands up to, in degrees.
 *
 * The pattern: discrete items hinged on one axis. Paint order follows each
 * plate's angle from the line of sight, and moves groups only when it changes;
 * the hit test reads the pages' resting outlines, so nothing lifts from under
 * the pointer.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, reflect, register, solid,
} = HL;

const L = 112, W = 80, T = 0.9, CT = 2.6, OV = 3;  // page length along the spine and width; page and cover thickness; cover overhang
const R = 5, ZH = 8, U0 = R - 0.4, TW = 20, TH = 8; // the binding rod: radius, and the height of its axis, the hinge; where plates leave it; the tabs
const REST = [140, 96, 62, 20, 5];                 // rest angles from the back cover: front cover, then pages 1 to 4
const STEP = 45, BACK = 28, OPEN = 34, MAX = 172;

/** Page i's outline in its own plane (u out from the spine, v along it), its tab further down the spine for each section. */
function page(i) {
  const t0 = 8 + i * (L - 16 - TW) / 3;
  const pts = fillet(
    [[U0, 0], [W, 0], [W, t0], [W + TH, t0], [W + TH, t0 + TW], [W, t0 + TW], [W, L], [U0, L]],
    [0.8, 3, 1.6, 2.4, 2.4, 1.6, 3, 0.8],
  );
  return { t0, pts };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, act = -1, key = "";

  // Fitted to the binding, the back cover and the front cover thrown back as far as it goes.
  const C = Cam(45, 0.5, 1.55);
  const ends = [];
  for (const th of [0, 90, MAX + 4]) for (const [u, v] of [[0, -OV], [W + OV, -OV], [W + OV, L + OV], [0, L + OV]]) {
    const c = Math.cos(rad(th)), s = Math.sin(rad(th));
    ends.push([u * c - CT * s, v, ZH + u * s + CT * c]);
  }
  fit(C, ends.concat([[-R, -OV - 2, 0], [W + OV, L + OV, -8]]), 200, 166);
  const P = proj(C), front = facing(C);

  // the direction toward the viewer, from P, and its angle in the plane across the spine
  const p0 = P(0, 0, 0), ax = [P(1, 0, 0), P(0, 1, 0), P(0, 0, 1)].map((p) => [p[0] - p0[0], p[1] - p0[1]]);
  let d = [ax[1][0] * ax[2][1] - ax[2][0] * ax[1][1], ax[2][0] * ax[0][1] - ax[0][0] * ax[2][1], ax[0][0] * ax[1][1] - ax[1][0] * ax[0][1]];
  if (d[2] < 0) d = d.map((x) => -x);
  const PHI = Math.atan2(d[2], d[0]) / rad(1);

  /** A plate hinged on the spine at th degrees: world points at (u, v), o off its plane, and whether its upper face is the one seen. */
  const hinge = (th) => {
    const c = Math.cos(rad(th)), s = Math.sin(rad(th));
    return { c, s, up: d[2] * c - d[0] * s > 0, w: (u, v, o) => P(u * c - o * s, v, ZH + u * s + o * c) };
  };

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, rrect(-R, -OV, W + OV, L + OV, 4, 6), 0, 14);

  // the back cover, under everything
  const [cR, cI] = rings(-R, -OV, W + OV, L + OV, 3.5, 1.4);
  put(solid(g), prism(P, front, cR, cI, 0, CT));

  // The rest is painted in one sorted layer: the binding rod lying along the spine, and the stack of pages on the back cover.
  const layer = mk("g", {}, g), rod = solid(layer), stack = solid(layer);
  const onRod = (ring, y) => ring.map((q) => P(q.u, y, ZH + q.v)), cap = circ(R, 24);
  put(rod, { sil: poly(hull(onRod(cap, -OV - 2).concat(onRod(cap, L + OV + 2)))), crease: poly(onRod(circ(R - 1.1, 24), L + OV + 2)) });
  const [sR, sI] = rings(R + 1, 1, W - 1, L - 1, 2, 1);
  put(stack, prism(P, front, sR, sI, CT, ZH - 1.6));
  mk("path", { d: open(run(sR, front).map((q) => P(q.u, q.v, (CT + ZH - 1.6) / 2))), class: "nf lo" }, stack.g);

  // the movers: the front cover, a slab, then the four section pages, thin plates
  const [fR, fI] = [rrect(U0, -OV, W + OV, L + OV, 3.5, 6), rrect(U0 + 1.4, -OV + 1.4, W + OV - 1.4, L + OV - 1.4, 2.1, 6)];
  const items = REST.map((r, k) => {
    const grp = mk("g", {}, layer), it = { g: grp, tw: tween(r), th: NaN };
    if (!k) return Object.assign(it, solid(grp));
    const { t0, pts } = page(k - 1);
    Object.assign(it, {
      t0, pts,
      back: mk("path", { class: "lo" }, grp), face: mk("path", { class: "sil" }, grp),
      head: mk("path", { class: "nf" }, grp), rules: mk("path", { class: "nf lo" }, grp),
      dots: Array.from({ length: k }, () => mk("circle", { r: 1.05, class: "dot off" }, grp)),
    });
    if (k === 1) it.mark = mk("path", { class: "nf hi" }, grp);
    return it;
  });

  function draw(k, th) {
    const it = items[k], { c, s, up, w } = hinge(th);
    it.th = th;
    if (!k) {
      const seen = (q) => q.nu * (c * d[0] + s * d[2]) + q.nv * d[1] > 0;
      const o = up ? CT : 0;
      it.sil.setAttribute("d", poly(hull(fR.map((q) => w(q.u, q.v, 0)).concat(fR.map((q) => w(q.u, q.v, CT))))));
      it.cr.setAttribute("d", open(run(fI, seen).map((q) => w(q.u, q.v, o))));
      return;
    }
    const fo = up ? T : 0, bo = T - fo, at = (u, v) => w(u, v, fo);
    it.back.setAttribute("d", poly(it.pts.map((p) => w(p[0], p[1], bo))));
    it.face.setAttribute("d", poly(it.pts.map((p) => at(p[0], p[1]))));
    it.head.setAttribute("d", seg(at(10, 12), at(W - 30, 12)));
    it.rules.setAttribute("d", [23, 30, 37].map((v) => seg(at(10, v), at(W - 12, v))).join(""));
    it.dots.forEach((el, j) => place(el, at(W + TH / 2, it.t0 + TW / 2 + (j - (k - 1) / 2) * 3.6)));
    if (it.mark) it.mark.setAttribute("d", act < 0 ? open(it.pts.slice(10, 30).map((p) => at(p[0], p[1]))) : "");
  }

  /**
   * Paint order: the plate furthest in angle from the line of sight first. A plate more than 90° from it is behind
   * the rod, the stack lies just in front of the rod, and the rest are in front of both. Groups move only when it changes.
   */
  const all = items.concat([{ g: rod.g, th: PHI + 90 }, { g: stack.g, th: PHI - 89.9 }]);
  function sort() {
    const ord = all.map((_, k) => k).sort((a, b) => Math.abs(all[b].th - PHI) - Math.abs(all[a].th - PHI));
    const nk = ord.join();
    if (nk !== key) { key = nk; ord.forEach((k) => layer.append(all[k].g)); }
  }

  items.forEach((_, k) => draw(k, REST[k]));
  sort();

  // hit areas: each page's RESTING outline on screen, nearest first. They never move, and nothing draws them.
  const hits = items.slice(1).map((it, i) => {
    const h = hinge(REST[i + 1]), fo = h.up ? T : 0;
    return { i, near: Math.abs(REST[i + 1] - PHI), hull: hull(it.pts.map((p) => h.w(p[0], p[1], fo))) };
  }).sort((a, b) => a.near - b.near);

  /** Whether [x, y] is inside the convex outline h, or within m of it. */
  function inside(h, [x, y], m) {
    let pos = 0, neg = 0, near = false;
    h.forEach((a, j) => {
      const b = h[(j + 1) % h.length], ex = b[0] - a[0], ey = b[1] - a[1];
      (ex * (y - a[1]) - ey * (x - a[0]) > 0) ? pos++ : neg++;
      const t = clamp(((x - a[0]) * ex + (y - a[1]) * ey) / (ex * ex + ey * ey || 1), 0, 1);
      if (Math.hypot(x - a[0] - t * ex, y - a[1] - t * ey) < m) near = true;
    });
    return !pos || !neg || near;
  }
  const hit = (p) => { const f = hits.find((q) => inside(q.hull, p, 3)); return f ? f.i : -1; };

  const B_ = register(stage, (_dt, now) => {
    let moving = false;
    items.forEach((it, k) => {
      const th = tval(it.tw, now);
      if (th !== it.th) draw(k, th);
      if (!tdone(it.tw, now)) moving = true;
    });
    sort();
    return moving;
  });
  bag.add(B_.unregister);

  /** Where each plate goes when page a stands up: behind it they fold down, before it they part back; -1 is rest. */
  function targets(a) {
    if (a < 0) return REST.slice();
    const ka = a + 1;
    return REST.map((r, k) => {
      const n = Math.abs(k - ka);
      if (k === ka) return lift;
      if (k > ka) return Math.max(2, Math.min(r - 8, BACK - 11 * (n - 1)));
      return Math.min(MAX, Math.max(r + 8, lift + OPEN + 14 * (n - 1)));
    });
  }

  /** Stands page a up (-1 lays them all back). The stagger spreads out from the page chosen, or the one let go. */
  function setActive(a, again) {
    if (a === act && !again) return;
    const now = performance.now(), from = (a >= 0 ? a : act) + 1, to = targets(a);
    act = a;
    items.forEach((it, k) => {
      tset(it.tw, to[k], now, Math.abs(k - from) * STEP);
      if (!k) return;
      it.face.classList.toggle("hi", k === a + 1);
      it.dots.forEach((el) => el.classList.toggle("off", k !== a + 1));
    });
    draw(1, items[1].th);
    read.textContent = a < 0 ? "rest" : "page " + (a + 1);
    B_.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "folio",
  means: "A report half open on its binding: the section under the pointer stands up, and the pages either side part from it in turn.",
  rules: [1, 2, 5, 6],
  range: [72, 90, 108],
  tour: [[199, 95], [252, 194], [263, 227], null],
  mount,
});
