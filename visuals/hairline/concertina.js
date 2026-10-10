/**
 * Concertina: a report printed on one long fanfold strip of six panels. The
 * cover lies flat at the head, a window for its picture and a title rule on
 * it; the next four stand in two pleats, a small range of peaks; the last one
 * springs up at the tail. Every crease carries a dashed perforation, and every
 * panel a heading rule with its number in result dots and a band of short
 * reads, printed on one side only, so a panel shows them only while that side
 * faces the viewer. The pointer unfolds the strip up to the panel it reads:
 * the pleats behind open nearly flat, the one ahead eases, the rest stay
 * folded, staggered out from the panel on the 700ms lift curve, and that panel
 * takes the bright edge. The slider is how flat an opened crease lies, in degrees.
 *
 * The pattern: a front along one axis. The hit test reads each panel in the pose
 * its own choice asks for, then at rest, never the pose on screen, so the paper cannot
 * move out from under the choice; panels are painted head to tail, which is back to front
 * for a zigzag that never folds back in x. Given a cover, its picture is printed
 * in the cover's window by the camera's own matrix and moves with the cover.
 */
const {
  Cam, clamp, fillet, fit, lerp, open, poly, proj, rad, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register,
} = HL;

const L = 40, W = 60, H = W / 2, T = 1, N = 6, R = 4; // a panel's length along the strip and width across; paper; panels; the free ends' corners
const FOLD = 30, EASED = 0.35, TAIL = 30, STEP = 45; // a folded crease, in degrees; how eased the first pleat is at rest; the tail's lift; the stagger
const NAMES = ["cover", "overall", "diversity", "key findings", "attention", "next steps"];
/** For the panel being read: how open the first pleat, the second and the tail are; and the crease each one turns on. */
const AIMS = [[EASED, 0, 0], [0.85, 0, 0], [1, 0.2, 0], [1, 0.85, 0], [1, 1, 0.4], [1, 1, 1]];
const AT = [2, 4, 5];

/** The strip's side profile for openings a, b (the pleats) and t (the tail), opened creases at g degrees: each panel's start [x, z] and slope,
 *  centred on x = 0, and a, b: how far its upper surface's two ends move per unit of thickness, so the paper's two surfaces meet at each fold. */
function pose([a, b, t], g) {
  const e = (o) => rad((180 - lerp(FOLD, g, clamp(o, 0, 1))) / 2), mitre = (h0, h1) => Math.tan((h1 - h0) / 2);
  const th = [0, e(a), -e(a), e(b), -e(b), lerp(rad(TAIL), e(1), clamp(t, 0, 1))];
  let x = 0, z = 0;
  const out = th.map((h, k) => {
    const p = { x, z, c: Math.cos(h), s: Math.sin(h), a: k ? mitre(th[k - 1], h) : 0, b: k < N - 1 ? mitre(h, th[k + 1]) : 0 };
    x += L * p.c; z += L * p.s;
    return p;
  });
  return out.map((p) => ({ ...p, x: p.x - x / 2 }));
}

/** Panel k's outline in its own plane (u along the strip, v across), and its runs of cut edge: the creases are left to the perforations. */
function shape(k) {
  const end = k === 0 || k === N - 1, q = k ? [[0, -H], [L, -H], [L, H], [0, H]] : [[L, H], [0, H], [0, -H], [L, -H]];
  const pts = end ? fillet(q, [0, R, R, 0]) : q;
  return { pts, runs: end ? [pts] : [[q[0], q[1]], [q[2], q[3]]] };
}

/** Panel k's band of reads, [u, v0, v1]: four rows of short dashes, staggered like a pile-up, the same on every load. */
function reads(k) {
  let sd = k * 97 + 13;
  const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, out = [];
  for (let r = 0; r < 4; r++) for (let v = -H + 5 + rnd() * 8; v < H - 10; v += 2.5 + rnd() * 4) {
    const l = 4 + rnd() * 8;
    out.push([14 + r * 3.6, v, Math.min(H - 5, v + l)]);
    v += l;
  }
  return out;
}

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

function mount({ stage, svg, read, cover }, value) {
  const bag = disposer();
  let g = value, act = -1, key = "", hits = [];

  // Fitted to the strip at rest and opened to its full length, at both ends of the slider.
  const C = Cam(45, 0.5, 1.7), box = [];
  for (const [o, gg] of [[AIMS[0], 140], [AIMS[5], 140], [AIMS[0], 176], [AIMS[5], 176]]) {
    pose(o, gg).forEach((p) => { for (const u of [0, L]) for (const v of [-H, H]) box.push([p.x + u * p.c, v, p.z + u * p.s]); });
  }
  fit(C, box, 200, 166);
  const P = proj(C);
  // the direction toward the viewer, from P: a panel's printed side is seen when its normal leans that way
  const p0 = P(0, 0, 0), ax = [P(1, 0, 0), P(0, 1, 0), P(0, 0, 1)].map((p) => [p[0] - p0[0], p[1] - p0[1]]);
  let d = [ax[1][0] * ax[2][1] - ax[2][0] * ax[1][1], ax[2][0] * ax[0][1] - ax[0][0] * ax[2][1], ax[0][0] * ax[1][1] - ax[1][0] * ax[0][1]];
  if (d[2] < 0) d = d.map((x) => -x);

  // Head to tail, so appending is painting back to front; each crease's perforation goes with the panel after it.
  const root = mk("g", {}, svg);
  const panels = Array.from({ length: N }, (_, k) => {
    const grp = mk("g", {}, root), q = { k, ...shape(k) };
    q.back = mk("path", { class: "nf lo" }, grp);
    q.face = mk("path", { class: "fo" }, grp);
    if (!k) {
      // the cover's window, and the picture printed in it when there is one, carried by the cover's own matrix
      q.win = fillet([[4, -H + 6], [L - 15, -H + 6], [L - 15, H - 6], [4, H - 6]], [2.5, 2.5, 2.5, 2.5]);
      q.print = mk("g", {}, grp);
      if (cover) {
        mk("image", {
          href: cover, x: 4, y: -H + 6, width: L - 19, height: W - 12,
          preserveAspectRatio: "xMidYMid slice", "clip-path": "inset(0px round 2.5px)",
        }, q.print);
      }
      q.frame = mk("path", { class: "nf lo" }, grp);
      q.head = mk("path", { class: "nf" }, grp);
    } else {
      q.reads = reads(k);
      q.head = mk("path", { class: "nf" }, grp);
      q.rd = mk("path", { class: "nf lo" }, grp);
      q.dots = Array.from({ length: k }, () => mk("circle", { r: 1.1, class: "dot m" }, grp));
      q.perf = mk("path", { class: "nf dash" }, grp);
    }
    q.edge = mk("path", { class: "nf sil" }, grp);
    return q;
  });

  function drawPanel(q, p) {
    const up = p.c * d[2] - p.s * d[0] > 0, fo = up ? T : 0;
    // a point o off the paper's lower surface; on the outline (m), a fold's end moves to where the two surfaces meet
    const w = (u, v, o, m) => (m && (u === 0 || u === L) ? w(u ? L - o * p.b : o * p.a, v, o) : P(p.x + u * p.c - o * p.s, v, p.z + u * p.s + o * p.c));
    const at = ([u, v]) => w(u, v, fo), rim = ([u, v]) => w(u, v, fo, 1);
    q.back.setAttribute("d", q.runs.map((r) => open(r.map(([u, v]) => w(u, v, T - fo, 1)))).join(""));
    q.face.setAttribute("d", poly(q.pts.map(rim)));
    q.edge.setAttribute("d", q.runs.map((r) => open(r.map(rim))).join(""));
    if (!q.k) {
      const o = at([0, 0]), x = at([1, 0]), y = at([0, 1]);
      q.print.setAttribute("transform", `matrix(${[x[0] - o[0], x[1] - o[1], y[0] - o[0], y[1] - o[1], o[0], o[1]].map((n) => n.toFixed(4)).join(" ")})`);
      q.frame.setAttribute("d", poly(q.win.map(at)));
      q.head.setAttribute("d", seg(at([L - 9, -H + 6]), at([L - 9, 4])));
      return;
    }
    q.perf.setAttribute("d", seg(rim([0, -H]), rim([0, H])));
    // printed on one side: its marks show only while that side faces the viewer
    q.head.setAttribute("d", up ? seg(at([7, -H + 6]), at([7, 2])) : "");
    q.rd.setAttribute("d", up ? q.reads.map(([u, v0, v1]) => seg(at([u, v0]), at([u, v1]))).join("") : "");
    q.dots.forEach((el, j) => { el.setAttribute("r", up ? 1.1 : 0); place(el, at([7, H - 7 - j * 3.6])); });
  }

  const tws = AIMS[0].map((v) => tween(v));
  function draw(o) {
    const k = o.concat(g).join();
    if (k === key) return;
    key = k;
    const ps = pose(o, g);
    panels.forEach((q, i) => drawPanel(q, ps[i]));
  }

  /** Hit areas, which never move with the paper and which nothing draws: each panel's outline in the pose that reading it asks for;
   *  then, where none of those reaches (the tops of the standing pleats), each panel's outline at rest. */
  function measure() {
    const ring = (p) => [[0, -H], [L, -H], [L, H], [0, H]].map(([u, v]) => P(p.x + u * p.c, v, p.z + u * p.s));
    hits = [panels.map((q, k) => ring(pose(AIMS[k], g)[k])), pose(AIMS[0], g).map(ring)];
  }
  /** The panel being read: the last one, head to tail, whose hit area holds the point; -1 off the strip. */
  const hit = (p) => { for (const hs of hits) for (let k = N - 1; k >= 0; k--) if (inside(hs[k], p, 3)) return k; return -1; };

  const B = register(stage, (_dt, now) => {
    draw(tws.map((tw) => tval(tw, now)));
    return tws.some((tw) => !tdone(tw, now));
  });
  bag.add(B.unregister);

  /** Reads panel k (-1 lays the strip back to rest). The pleats move in turn, out from the panel read, or the one let go. */
  function setActive(k, again) {
    if (k === act && !again) return;
    const now = performance.now(), from = (k >= 0 ? k : Math.max(0, act)) + 0.5, to = AIMS[Math.max(0, k)];
    act = k;
    tws.forEach((tw, i) => tset(tw, to[i], now, Math.abs(AT[i] - from) * STEP));
    panels.forEach((q, i) => {
      q.edge.classList.toggle("hi", i === Math.max(0, k));
      if (q.dots) q.dots.forEach((el) => el.setAttribute("class", i === k ? "dot" : "dot m"));
    });
    read.textContent = k < 0 ? "rest" : NAMES[k];
    B.wake();
  }

  measure();
  setActive(-1, true);
  draw(AIMS[0]);
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { g = v; measure(); B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "concertina",
  means: "A report on one fanfold strip: the pointer unfolds it up to the panel it reads, pleat after pleat, and that panel takes the bright edge.",
  rules: [1, 2, 5, 6],
  range: [140, 160, 176],
  tour: [[168, 141], [228, 171], [319, 221], null],
  mount,
});
