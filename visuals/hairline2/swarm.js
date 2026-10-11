/* Particle reveal, by page: the shapes of each Everlab page (window.DBSHAPES, in shapes.js) as a
 * square grid of points that fills each shape, a slow wave running through it and a band of scatter
 * crossing it, flying from one shape to the next. Moved here from the report pop-up (Modal V8), for
 * the Hairline page ("all particles illustrations: put them in the Hairline page").
 * HLSwarm.mount(canvas, key) with key gut, path, dexa, wbmri or consult; the canvas's CSS colour is the ink.
 */
(function () {
  'use strict';
    // V8: the page's own subject in particles: a square grid of points filling each shape, a slow wave running through the sheet and a band of scatter crossing it, the points flying from one shape to the next ("a new modal similar to V6 but using particles that form shapes related to the current page: microbiome, microbiome shapes"; "similar to this": a rippling sheet of square dots)
    const SWK = k => /^gut/.test(k || '') ? 'gut' : /^(path|abrep)$/.test(k || '') ? 'path' : k === 'dexa' ? 'dexa' : k === 'wbmri' ? 'wbmri' : 'consult';
    const SWC = {}, SWG = 56;
    // a shape's points (window.DBSHAPES, drawn per page) read onto a SWG x SWG grid: a cell with points lights by their brightness, a cell inside a closed outline fills dim, the rest stays dark
    const swCells = key => { if (SWC[key]) return SWC[key]; const R = window.DBSHAPES || {}, set = R[key] || [], G = SWG, NP = 1600;
      return (SWC[key] = set.map(sh => { let sd = 20261113, r; const rnd = () => { sd = sd + 0x6D2B79F5 | 0; let q = Math.imul(sd ^ sd >>> 15, 1 | sd); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };   // mulberry32: the same shape every time
        try { r = sh.f(NP, rnd); } catch (e) { return null; } if (!r || !r.p) return null;
        const A = new Float32Array(G * G), C = new Uint16Array(G * G), out = new Uint8Array(G * G), st = [];
        for (let i = 0; i < NP; i++){ const x = Math.floor((r.p[2 * i] + 1) / 2 * G), y = Math.floor((r.p[2 * i + 1] + 1) / 2 * G); if (!(x >= 0 && y >= 0 && x < G && y < G)) continue; const k = y * G + x; A[k] += r.a ? r.a[i] : 1; }
        for (let k = 0; k < G * G; k++) C[k] = A[k] >= 0.3 ? 1 : 0;   // a cell lights by the sum of its points' brightness: a lone faint point (halo, stipple) doesn't light it
        for (let i = 0; i < G; i++) st.push(i, (G - 1) * G + i, i * G, i * G + G - 1);
        while (st.length){ const k = st.pop(); if (out[k] || C[k]) continue; out[k] = 1; const x = k % G, y = (k / G) | 0; if (x) st.push(k - 1); if (x < G - 1) st.push(k + 1); if (y) st.push(k - G); if (y < G - 1) st.push(k + G); }   // what the outside reaches is outside
        const cells = []; for (let k = 0; k < G * G; k++){ if (!C[k] && out[k]) continue; const x = k % G, y = (k / G) | 0; cells.push({ u: (x + .5) / G * 2 - 1, v: (y + .5) / G * 2 - 1, b: C[k] ? 0.32 + 0.68 * Math.min(1, A[k] / 1.6) : 0.17 }); }   // membranes and strands bright, insides a dim fill, so the cells of a cluster stay apart
        return cells.length ? { name: sh.name, cells } : null; }).filter(Boolean)); };
    const dbSwarm = (cv, key, card) => { const sets = swCells(SWK(key)); if (!sets.length) return null;
      const ctx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches, HOLD = 4.6, MORPH = 1.8, LV = 7;
      let raf = 0, gone = false, W = 0, H = 0, dpr = 1, si = 0, T0 = 0, t = 0, prev = 0, ink = '255,255,255', drawn = '', seen = true;
      const io = window.IntersectionObserver ? new IntersectionObserver(es => { seen = es[es.length - 1].isIntersecting; }) : null; if (io) io.observe(cv);   // offscreen: no drawing
      const N = Math.min(1700, Math.max.apply(null, sets.map(z => z.cells.length)));
      const P = Array.from({ length: N }, () => ({ x: (Math.random() * 2 - 1) * 1.3, y: (Math.random() * 2 - 1) * 1.3, b: 0, fx: 0, fy: 0, fb: 0, tu: 0, tv: 0, tb: 0, dl: 0, ph: Math.random() * 6.283, r: Math.random(), sw: Math.random() - .5 }));
      const ord = (u, v) => u * 0.62 + v * 0.78;   // points and places both read along the same diagonal, so the sheet sweeps across rather than tangling
      const aim = n => { const cs = sets[n].cells, m = cs.length, slots = [];
        for (let i = 0; i < N; i++){ const c = m >= N ? cs[Math.floor(i * m / N)] : i < m ? cs[i] : cs[(Math.random() * m) | 0]; slots.push({ u: c.u, v: c.v, b: m >= N || i < m ? c.b : 0 }); }   // more points than the shape needs: the rest land on it and fade
        slots.sort((a, b) => ord(a.u, a.v) - ord(b.u, b.v));
        P.map((q, i) => i).sort((a, b) => ord(P[a].x, P[a].y) - ord(P[b].x, P[b].y)).forEach((i, j) => { const q = P[i], z = slots[j]; q.fx = q.x; q.fy = q.y; q.fb = q.b; q.tu = z.u; q.tv = z.v; q.tb = z.b; q.dl = j / N * 0.6 + q.r * 0.25; }); };
      const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const size = () => { const R = cv.getBoundingClientRect(); if (!R.width || !R.height) return false; const d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(R.width * d), h = Math.round(R.height * d);
        if (w !== W || h !== H || d !== dpr){ W = w; H = h; dpr = d; cv.width = W; cv.height = H; const c = getComputedStyle(cv).color.match(/[\d.]+/g); if (c) ink = c.slice(0, 3).join(','); } return true; };
      const bins = Array.from({ length: LV }, () => []);
      const draw = () => { const S = card ? Math.min(W * 0.98, H * 1.1) : Math.min(W, H) * 0.84, cx = card ? W * 0.53 : W / 2, cy = card ? H * 0.52 : H / 2,   /* in the card: as tall as the frame and a little more, so it runs past its edges as V6's figure does */ el = t - T0, band = -1.8 + (t * 0.3) % 3.6;
        const q = Math.max(1.1, Math.min(2.3, S / dpr / SWG * 0.44)) * dpr;
        for (let k = 0; k < LV; k++) bins[k].length = 0;
        for (let i = 0; i < N; i++){ const p = P[i], e = still ? 1 : ease((el - p.dl) / MORPH), fly = Math.sin(Math.PI * e) * 0.22 * p.sw;
          let u = p.fx + (p.tu - p.fx) * e, v = p.fy + (p.tv - p.fy) * e, b = p.fb + (p.tb - p.fb) * e;
          u -= (p.tv - p.fy) * fly; v += (p.tu - p.fx) * fly; p.x = u; p.y = v; p.b = b;
          if (b < 0.03) continue;
          if (!still){ const a1 = 5.2 * (u * .8 + v * .6) - t * 1.3, a2 = 7.4 * (v * .9 - u * .45) - t * .9, w2 = Math.sin(a2);   // the sheet's wave, lit on its slopes
            u += 0.012 * w2; v += 0.03 * Math.sin(a1) + 0.012 * w2; b *= 0.8 + 0.2 * Math.cos(a1);
            const d = (u * .7 - v * .7) - band, m = Math.exp(-(d / .2) * (d / .2));   // the band of scatter
            if (m > 0.02){ u += m * 0.09 * Math.cos(p.ph + t * 2.3) * (0.4 + p.r); v += m * 0.09 * Math.sin(p.ph * 1.7 + t * 1.9) * (0.4 + p.r); b *= 1 + m * 0.9 * p.r; } }
          bins[Math.min(LV - 1, (Math.min(1, b) * LV) | 0)].push(cx + u * S / 2, cy + v * S / 2); }
        ctx.clearRect(0, 0, W, H);
        for (let k = 0; k < LV; k++){ const B = bins[k]; if (!B.length) continue; const z = k >= LV - 2 ? q * 1.18 : q; ctx.fillStyle = 'rgba(' + ink + ',' + ((k + 1) / LV).toFixed(3) + ')'; ctx.beginPath(); for (let j = 0; j < B.length; j += 2) ctx.rect(Math.round(B[j] - z / 2), Math.round(B[j + 1] - z / 2), z, z); ctx.fill(); } };
      const frame = now => { if (gone) return; if (!cv.isConnected){ gone = true; return; } raf = requestAnimationFrame(frame);
        const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0; prev = now;
        if (!seen || document.hidden || !size()) return;
        if (still){ const k = W + 'x' + H; if (drawn === k) return; drawn = k; draw(); return; }
        t += dt; if (t - T0 > MORPH + 0.85 + HOLD){ si = (si + 1) % sets.length; aim(si); T0 = t; }
        draw(); };
      aim(0); raf = requestAnimationFrame(frame);
      return { destroy(){ gone = true; cancelAnimationFrame(raf); if (io) io.disconnect(); } };
    };
  window.HLSwarm = { mount: (cv, key, card) => dbSwarm(cv, key, !!card), keys: ['gut', 'path', 'dexa', 'wbmri', 'consult'] };
})();
