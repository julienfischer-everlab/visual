/**
 * Tray: a shallow rounded tray holding a row of five pucks at uneven heights,
 * a results chart you could hold. The pointer is projected onto the ground and
 * read along the row; each puck takes its height from its distance to that
 * point, on its own spring, and the nearest takes the bright stroke. At rest
 * the row is an uneven profile and its tallest puck is bright. The near rim is
 * painted last, so it hides the pucks' feet. The slider is the radius, in pucks.
 */
const {
  Cam, clamp, extremes, facing, fit, open, poly, prism, proj, ringAt, rrect, run, unproj,
  spring, stepS, mk, pointer, put, register, disposer, solid,
} = HL;

const N = 5, DP = 13, GAP = 21, M = 8, T = 3, W = 32, L = 2 * M + DP + (N - 1) * GAP;
const FLOOR = -4, ZB = -7, HMAX = 48, HMIN = 4, CY = W / 2;
const REST = [17, 30, 22, 40, 12];
const MARK = REST.indexOf(Math.max(...REST));
const cx = (i) => M + DP / 2 + i * GAP;

/** The share of full height at u radii from the pointer: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.6);
  fit(C, [[0, 0, ZB], [L, 0, ZB], [0, W, ZB], [L, W, ZB],
    [cx(0) - 4, CY - 4, FLOOR + HMAX], [cx(N - 1) - 4, CY - 4, FLOOR + HMAX]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over = null;

  // The tray: its outline, the inner edge of the rim as its crease, and where
  // the far walls meet the floor.
  const g = mk("g", {}, svg);
  // Rounds past 20 units on screen show the sixteen sides of rings(): eight steps a corner here.
  const outer = rrect(0, 0, L, W, 8, 8), hole = rrect(T, T, L - T, W - T, 8 - T, 8);
  put(solid(g), { sil: prism(P, front, outer, outer, ZB, 0).sil, crease: poly(ringAt(P, hole, 0)) });
  mk("path", { class: "lo nf", d: open(ringAt(P, run(hole, (s) => !front(s)), FLOOR)) }, g);

  // The pucks, far to near along the row, standing on the floor.
  const pucks = REST.map((h0, i) => {
    const x0 = cx(i) - DP / 2, y0 = CY - DP / 2, r = DP / 2;
    const ring = rrect(x0, y0, x0 + DP, y0 + DP, r, 8), inner = rrect(x0 + 1, y0 + 1, x0 + DP - 1, y0 + DP - 1, r - 1, 8);
    return { h0, ring, inner, sp: spring(h0), el: solid(g), drawn: NaN };
  });

  // The near rim, painted over the pucks: a plate from the rim's inner edge down
  // to the foot, then its two lines again. The short cuts across the side rims stay unstroked.
  const lr = (pts) => (pts[0][0] > pts[pts.length - 1][0] ? pts.reverse() : pts);
  const at = (s, z) => ringAt(P, [s], z)[0];
  const [le, re] = extremes(P, outer);
  const lipTop = lr(ringAt(P, run(hole, front), 0));
  const lipFoot = [at(re, 0), at(re, ZB), ...lr(ringAt(P, run(outer, front), ZB)).reverse(), at(le, ZB), at(le, 0)];
  mk("path", { class: "fo", d: poly(lipTop.concat(lipFoot)) }, g);
  const lip = solid(g);
  put(lip, { sil: open(lipFoot), crease: open(lipTop) });
  lip.sil.classList.add("nf");

  // A puck whose spring hasn't moved keeps its paths.
  function drawPuck(p) {
    const h = clamp(p.sp.x, 1, HMAX);
    if (h === p.drawn) return;
    p.drawn = h;
    put(p.el, prism(P, front, p.ring, p.inner, FLOOR, FLOOR + h));
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const p of pucks) { if (stepS(p.sp, dt)) m = true; drawPuck(p); }
    return m;
  });
  bag.add(B.unregister);

  // Read along the row: x − y is the same on every plane under a screen point,
  // so a raised puck never hides the one it stands in front of.
  function retarget() {
    let k = MARK;
    if (over) {
      const xr = clamp(over[0] - over[1] + CY, cx(0), cx(N - 1));
      k = Math.round((xr - cx(0)) / GAP);
      pucks.forEach((p, i) => { p.sp.t = clamp(HMAX * falloff(Math.abs(cx(i) - xr) / (R * GAP)), HMIN, HMAX); });
      read.textContent = `item ${k + 1}`;
    } else {
      pucks.forEach((p) => { p.sp.t = p.h0; });
      read.textContent = "rest";
    }
    pucks.forEach((p, i) => p.el.sil.classList.toggle("hi", i === k));
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tray",
  means: "Pucks in a tray stand like a chart; the one nearest the pointer rises and its neighbours less, falling off with distance.",
  rules: [1, 3, 5, 6],
  range: [1.2, 2.2, 3.6],
  tour: [[123, 145], [200, 177], [277, 229], null],
  mount,
});
