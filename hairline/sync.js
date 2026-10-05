/**
 * Sync: a smartwatch lying on its strap beside a phone, and the readings it
 * sends travelling between them as beads along an arc, always. Hovering a bead
 * slows the stream on a spring so it can be read: the bead nearest the pointer
 * is bright and the read-out names its reading. At rest the watch is the bright
 * mark, the source. The slider is how slow the stream goes under the pointer.
 *
 * The held bead grows and drops a dashed guide to the ground.
 *
 * The pattern: dilate time. The stream is ambient, on the frame loop, and only
 * while the figure is on screen; the rate is a spring towards 1, or towards the
 * slider's value while a bead is held. Beads fade at the two ends of the arc,
 * where they leave the watch and land in the phone.
 */
const {
  Cam, clamp, facing, fit, lerp, open, poly, prism, proj, rings, ringAt, rrect,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const K = 7, SPEED = 0.16, ARC = 34, A = [0, 0, 9], Z = [76, 0, 4.2];
const READS = ["hr", "hrv", "sleep", "steps", "spo2", "vo2 max", "resting hr"];
const at = (u) => [lerp(A[0], Z[0], u), lerp(A[1], Z[1], u), lerp(A[2], Z[2], u) + 4 * ARC * u * (1 - u)];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let slow = value;

  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-9, -44, 0], [-9, 44, 0], [94, -30, 0], [94, 30, 0], [38, 0, 6.6 + ARC]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const slab = (x0, y0, x1, y1, r, b, z0, z1) => { const [o, i] = rings(x0, y0, x1, y1, r, b); const s = solid(g); put(s, prism(P, front, o, i, z0, z1)); return s; };

  // the watch: two strap halves, holes in one and a buckle on the other, then the case, its screen and crown
  slab(-7, -44, 7, -12, 3, 1, 0, 1.8);
  slab(-7, 12, 7, 44, 3, 1, 0, 1.8);
  for (let k = 0; k < 5; k++) place(flatDot(g, C, 0.8, "dot off"), P(0, 19 + k * 4.5, 1.8));
  mk("path", { d: poly(ringAt(P, rrect(-5, -40, 5, -33, 1.5, 3), 1.8)), class: "nf lo" }, g);
  const watch = slab(-10, -12.5, 10, 12.5, 6.5, 1.6, 1.8, 9);
  mk("path", { d: poly(ringAt(P, rrect(-7, -9.5, 7, 9.5, 4.5, 4), 9)), class: "nf lo" }, g);
  slab(10, -2.6, 12.4, 2.6, 1.2, 0.5, 4, 7);

  // the phone: a slab, its screen, the camera, and a few lines of the app
  slab(62, -30, 92, 30, 6, 1.4, 0, 4.2);
  mk("path", { d: poly(ringAt(P, rrect(64.5, -27.5, 89.5, 27.5, 4, 4), 4.2)), class: "nf lo" }, g);
  mk("path", { d: poly(ringAt(P, rrect(74, -26, 80, -24.5, 0.7, 2), 4.2)), class: "nf lo" }, g);
  mk("path", { d: [-14, -8, -2, 4].map((y) => open([P(70, y, 4.2), P(84, y, 4.2)])).join(""), class: "nf lo" }, g);

  // the arc the readings travel along, then the beads
  const guide = [];
  for (let k = 0; k <= 32; k++) guide.push(P(...at(k / 32)));
  mk("path", { d: open(guide), class: "nf dash" }, g);
  // the held reading's drop to the ground, and where it lands
  const drop = mk("path", { class: "nf dash" }, g), foot = mk("path", { class: "nf lo" }, g);
  const beads = [];
  for (let k = 0; k < K; k++) beads.push({ k, el: mk("circle", { r: 2.1, class: "dot m" }, g), q: [0, 0], cls: "dot m" });

  const rate = spring(1, { eps: 0.005 });
  let t = 0, over = null, held = -1;

  function frame() {
    let best = -1, bd = 16;
    for (const b of beads) {
      const v = (b.k / K + t) % 1;
      b.w = at(v);
      b.q = P(...b.w);
      b.v = v;
      b.n = (b.k + Math.floor(b.k / K + t)) % READS.length;
      place(b.el, b.q);
      if (over && v > 0.06 && v < 0.94) { const d = Math.hypot(b.q[0] - over[0], b.q[1] - over[1]); if (d < bd) { bd = d; best = b.k; } }
    }
    held = best;
    rate.t = held < 0 ? 1 : slow;
    for (const b of beads) {
      const cls = b.k === held ? "dot" : b.v < 0.06 || b.v > 0.94 ? "dot off" : "dot m";
      if (cls !== b.cls) { b.cls = cls; b.el.setAttribute("class", cls); b.el.setAttribute("r", b.k === held ? 3.4 : 2.1); }
    }
    const h = held < 0 ? null : beads[held].w;
    drop.setAttribute("d", h ? open([P(...h), P(h[0], h[1], 0)]) : "");
    foot.setAttribute("d", h ? poly(ringAt(P, rrect(h[0] - 3, h[1] - 3, h[0] + 3, h[1] + 3, 3, 3), 0)) : "");
    watch.sil.classList.toggle("hi", held < 0);
    read.textContent = held < 0 ? "rest" : READS[beads[held].n];
  }

  const B = register(stage, (dt) => {
    stepS(rate, dt);
    t += dt * SPEED * rate.x;
    frame();
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => { over = p; B.wake(); },
    leave: () => { over = null; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { slow = clamp(v, 0.01, 1); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "sync",
  means: "Your watch sends its readings to your phone as they happen; hover one to slow the stream and read what it is.",
  rules: [4, 7, 8, 10],
  range: [0.5, 0.2, 0.05],
  mount,
});
