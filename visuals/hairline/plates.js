/**
 * Plates: six services as thin rounded-square plates standing in a row, one
 * behind the other, leaning back a little and spaced unevenly, the front one
 * bright. The pointer picks a plate by its resting outline: the row opens
 * round it, the plates in front sliding forward and those behind sliding back,
 * staggered out from it on the 700ms lift curve, and the chosen one rises a
 * little and takes the bright rim. Each plate has a tab on its top edge, set
 * at its own place, and its number in dots at its foot. The slider is the gap
 * the row opens by, in world units.
 *
 * The pattern: discrete items on one axis. Tweens, a stagger by distance, and
 * a hit test on each plate's rest pose, front to back, so a plate sliding out
 * from under the pointer cannot flip the choice.
 */
const {
  Cam, fillet, fit, poly, proj, rad,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register,
} = HL;

const N = 6, W = 44, H = 44, R = 7, TK = 1.5, TW = 10, TH = 5, LIFT = 7, STEP = 45, GMAX = 22;
const GAPS = [12, 16, 11.5, 18, 13];         // the gaps at rest, back to front: uneven
const LEAN = [-10, -6.5, -8, -4, -6, -2.5];   // how far each plate leans back at rest, in degrees
const TABS = [27, 9, 22, 14, 29, 8];          // where each plate's tab starts along its top edge
const Y = GAPS.reduce((ys, g) => ys.concat(ys[ys.length - 1] + g), [0]);
/** The dot code at a plate's foot, by its right edge: up to six places, filled in pairs from the floor up. */
const DOTS = [[W - 5, 5], [W - 8.6, 5], [W - 5, 8.6], [W - 8.6, 8.6], [W - 5, 12.2], [W - 8.6, 12.2]];

/** Plate i's outline in its own plane (u along it, v up it): a rounded square with its tab. */
function outline(i) {
  const t = TABS[i];
  return fillet(
    [[0, 0], [W, 0], [W, H], [t + TW, H], [t + TW, H + TH], [t, H + TH], [t, H], [0, H]],
    [R, R, R, 1.6, 2.2, 2.2, 1.6, R], 6,
  );
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value, act = -1;

  /** Plate i slid dy along the row and lifted by z: the world point at (u, v) on its face, o behind it. */
  const world = (i, dy, z) => {
    const s = Math.sin(rad(LEAN[i])), c = Math.cos(rad(LEAN[i]));
    return (u, v, o = 0) => [u, Y[i] + dy + v * s - o * c, v * c + o * s + z];
  };

  // Fitted to the row opened as far as the slider allows, with any plate lifted.
  const C = Cam(45, 0.5, 2.35), box = [];
  for (const [i, dy] of [[0, -GMAX], [N - 1, GMAX]]) {
    for (const z of [0, LIFT]) for (const [u, v] of [[0, 0], [W, 0], [0, H + TH], [W, H + TH]]) box.push(world(i, dy, z)(u, v, TK));
  }
  fit(C, box, 200, 166);
  const P = proj(C);

  const g = mk("g", {}, svg);
  // Painted back to front: each plate's back edge, its face over it, then its dot code.
  const plates = [];
  for (let i = 0; i < N; i++) {
    const n = N - i, grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    const dots = DOTS.slice(0, n).map(() => mk("circle", { r: 1.15, class: "dot m" }, grp));
    plates.push({ shape: outline(i), back, face, dots, y: tween(0), z: tween(0), dy: NaN, dz: NaN });
  }

  function draw(i, dy, z) {
    const p = plates[i];
    if (dy === p.dy && z === p.dz) return;
    p.dy = dy; p.dz = z;
    const w0 = world(i, dy, z), w = (u, v, o) => P(...w0(u, v, o));
    p.back.setAttribute("d", poly(p.shape.map(([u, v]) => w(u, v, TK))));
    p.face.setAttribute("d", poly(p.shape.map(([u, v]) => w(u, v))));
    p.dots.forEach((el, k) => place(el, w(DOTS[k][0], DOTS[k][1])));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    plates.forEach((p, i) => {
      draw(i, tval(p.y, now), tval(p.z, now));
      if (!tdone(p.y, now) || !tdone(p.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  // Hit areas: each plate's RESTING outline, solved in its own plane, nearest plate first. They never move.
  const o = P(0, 0, 0), e = (x, y, z) => { const q = P(x, y, z); return [q[0] - o[0], q[1] - o[1]]; };
  const ex = e(1, 0, 0);
  function onPlate(i, [x, y]) {
    const s = Math.sin(rad(LEAN[i])), c = Math.cos(rad(LEAN[i]));
    const ev = e(0, s, c), b = e(0, Y[i], 0), qx = x - o[0] - b[0], qy = y - o[1] - b[1];
    const det = ex[0] * ev[1] - ex[1] * ev[0];
    const u = (qx * ev[1] - qy * ev[0]) / det, v = (ex[0] * qy - ex[1] * qx) / det;
    if (u < -2 || u > W + 2 || v < -2) return false;
    return v <= H + 2 || (u >= TABS[i] - 2 && u <= TABS[i] + TW + 2 && v <= H + TH + 2);
  }
  function hit(p) {
    for (let i = N - 1; i >= 0; i--) if (onPlate(i, p)) return i;
    return -1;
  }

  /** Opens the row round plate a (-1 closes it). The stagger spreads out from the plate chosen, or the one let go. */
  function setActive(a, again) {
    if (a === act && !again) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    plates.forEach((p, i) => {
      const delay = Math.abs(i - from) * STEP;
      tset(p.y, a < 0 || i === a ? 0 : i > a ? gap : -gap, now, delay);
      tset(p.z, i === a ? LIFT : 0, now, delay);
      const lit = i === (a < 0 ? N - 1 : a);
      p.face.classList.toggle("hi", lit);
      p.dots.forEach((el) => el.classList.toggle("m", !lit));
    });
    read.textContent = a < 0 ? "rest" : "plate " + (N - a);
    B.wake();
  }
  plates[N - 1].face.classList.add("hi");
  plates[N - 1].dots.forEach((el) => el.classList.remove("m"));
  read.textContent = "rest";

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gap = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "plates",
  means: "Six services as plates in a row: the row opens round the one under the pointer, and it rises to be added.",
  rules: [1, 2, 5, 10],
  range: [6, 14, 22],
  tour: [[134, 206], [195, 148], [282, 106], null],
  mount,
});
