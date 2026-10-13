/*
 * ProgressTimeline: a responsive, horizontally scrolling step timeline.
 *
 *   const tl = new ProgressTimeline(parentElement, {
 *     steps: [{ id: 'details', label: 'Confirm your details' }, ...],
 *     current: 'clinic',          // id of the step in progress; null = not started
 *     complete: false,            // true = every step done
 *     minSegment: 128,            // px between neighbouring dots, never less
 *     onArrow: detail => {...}    // optional: an arrow scrolled the track one segment
 *   });
 *   tl.update({ current: 'slot' });
 *   tl.destroy();
 *
 * No dependencies. Pair with progress-timeline.css. Works as a classic script
 * (window.ProgressTimeline) or a CommonJS module. README.md explains the
 * sizing, positioning and overflow rules; the pure functions that implement
 * them (computeLayout, targetOffset, edgeState) are exported for testing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProgressTimeline = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- Fixed geometry (px). The CSS mirrors these numbers. ----------------
  const DOT = 14;                     // every dot, the current one included
  const GAP = 4;                      // between a dot and a connector
  const DOT_ZONE = DOT / 2 + GAP;     // a connector starts this far from a dot's centre
  const BTN = 28;                     // the edge buttons
  const GUTTER = 8;                   // each side of a label, inside its column
  const LABEL_MAX = 240;              // widest a label grows when there's room to spare
  const ANCHOR = 0.4;                 // where the current dot rests in a middle step, as a share of the width
  const MIN_SEGMENT_FLOOR = 2 * DOT_ZONE + 16;   // a connector of at least 16px
  const EPS = 0.5;

  const DEFAULTS = {
    steps: [],
    current: null,
    complete: false,
    minSegment: 128,
    edge: 128,
    label: 'Progress',
    onArrow: null,          // optional: told after an arrow click scrolls the track
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---- Layout: pure, from the measured width ------------------------------
  //
  // x of dot i on screen = pad + i * seg - offset, offset = the scroller's
  // scrollLeft, from 0 (beginning) to max (end).
  function computeLayout(width, count, opts) {
    const o = Object.assign({}, DEFAULTS, opts);
    const W = Math.max(0, width);
    const N = Math.max(0, count | 0);
    const m = Math.max(MIN_SEGMENT_FLOOR, +o.minSegment || DEFAULTS.minSegment);
    const E = Math.min(Math.max(0, +o.edge || 0), W / 2);       // 128 each side (they meet below 256px)
    const usable = W - 2 * E;                                    // between the two edge areas
    const narrow = usable < 2 * m;                               // fewer than two minimum increments fit
    const col = seg => Math.min(seg, LABEL_MAX + 2 * GUTTER);
    if (N <= 1) {
      return { fit: true, narrow, W, N, seg: 0, pad: W / 2, edge: E, col: Math.min(LABEL_MAX + 2 * GUTTER, W),
        content: W, max: 0, usable, minSegment: m };
    }
    const spread = usable / (N - 1);
    if (spread >= m - 1e-6) {                                    // all fit: stretch across the usable width
      return { fit: true, narrow, W, N, seg: spread, pad: E, edge: E, col: col(spread), content: W, max: 0, usable, minSegment: m };
    }
    // Scrolls, at exactly the minimum. Narrow: half the width of track before
    // the first dot and after the last, so any dot, an end one too, can centre.
    const pad = narrow ? W / 2 : E;
    const content = 2 * pad + (N - 1) * m;
    return { fit: false, narrow, W, N, seg: m, pad, edge: E, col: col(m), content, max: Math.max(0, content - W), usable, minSegment: m };
  }

  const labelHalf = L => Math.max(0, L.col / 2 - GUTTER);
  const dotX = (L, i, off) => L.pad + i * L.seg - off;

  // Which edges overflow at an offset, and whether a connector (not a dot,
  // not the 4px gaps, not empty track) passes under each button's centre.
  function edgeState(L, off) {
    const overflowStart = L.max > EPS && off > EPS;
    const overflowEnd = L.max > EPS && off < L.max - EPS;
    const under = cx => {
      if (L.N < 2 || L.seg <= 0) return false;
      const i = Math.floor((cx + off - L.pad) / L.seg);
      if (i < 0 || i >= L.N - 1) return false;
      const a = dotX(L, i, off), b = dotX(L, i + 1, off);
      return cx - a >= DOT_ZONE && b - cx >= DOT_ZONE;
    };
    const startX = L.edge / 2, endX = L.W - L.edge / 2;
    return {
      overflowStart, overflowEnd,
      startButton: overflowStart && under(startX),
      endButton: overflowEnd && under(endX),
      startX, endX,
    };
  }

  // Where the track rests for a progress state. c: index of the step in
  // progress, -1 before the first, N once all are done.
  function targetOffset(L, c) {
    const M = L.max, N = L.N;
    if (M <= EPS) return 0;                          // everything fits: nothing to place
    if (L.narrow) return clamp(clamp(c, 0, N - 1) * L.seg + L.pad - L.W / 2, 0, M);   // narrow: the current dot at 50%, every state
    if (c <= 0) return 0;                            // first step: its dot on the left safe line
    if (c >= N - 1) return M;                        // final step: its dot on the right safe line
    const s = L.seg, hl = labelHalf(L), E = L.edge, W = L.W;
    const x0 = L.pad + c * s;                        // the current dot's x at offset 0
    let off = x0 - ANCHOR * W;                       // current dot at 40% of the width
    const nextClear = x0 + s + hl - (W - E);         // below this the next label runs under the right fade
    off = Math.max(off, nextClear);                  // reveal the next step fully: slide on if needed
    const curFrom = x0 + hl - (W - E), curTo = x0 - hl - E;   // ...but keep the current label clear of both fades
    if (curFrom <= curTo) off = clamp(off, curFrom, curTo);
    return clamp(off, 0, M);                         // the track's own limits: never blank space
  }

  // ---- DOM ----------------------------------------------------------------
  const CHEVRON = d => '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="' +
    (d === 'start' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5') +
    '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let uid = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  class ProgressTimeline {
    constructor(parent, options) {
      if (!parent || !parent.appendChild) throw new TypeError('ProgressTimeline: a parent element is required');
      this.parent = parent;
      this.opts = Object.assign({}, DEFAULTS, options);
      this.id = 'pt' + (++uid);
      this._off = 0;              // the offset we last applied or saw
      this._browsed = false;      // the user moved the track since the last progress change
      this._pos = 0;              // their position, in segments, so it survives a resize
      this._userActive = false;
      this._build();
      this._render(true);
      this._ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this._relayout()) : null;
      if (this._ro) this._ro.observe(this.root); else addEventListener('resize', this._onWinResize = () => this._relayout());
    }

    // Props in, view out. Same current: the user's browsing position is kept.
    update(options) {
      const prevKey = this._progressKey();
      Object.assign(this.opts, options);
      const changed = this._progressKey() !== prevKey;
      if (changed) { this._browsed = false; this._userActive = false; clearTimeout(this._userT); }
      this._render(false, changed);
    }

    setCurrent(id) { this.update({ current: id, complete: false }); }

    // Back to the resting position for the current state.
    scrollToCurrent(smooth) { this._browsed = false; this._applyOffset(targetOffset(this.layout, this._currentIndex()), smooth); }

    getState() {
      const L = this.layout, off = this.scroller.scrollLeft, s = edgeState(L, off);
      return { fit: L.fit, narrow: L.narrow, width: L.W, segment: L.seg, edge: L.edge, offset: off, maxOffset: L.max,
        currentIndex: this._currentIndex(), browsed: this._browsed,
        overflowStart: s.overflowStart, overflowEnd: s.overflowEnd, startButton: s.startButton, endButton: s.endButton };
    }

    destroy() {
      if (this._ro) this._ro.disconnect(); else removeEventListener('resize', this._onWinResize);
      clearTimeout(this._userT);
      clearTimeout(this._arrowT);
      cancelAnimationFrame(this._raf);
      this.root.remove();
    }

    // ---- internals ----
    _progressKey() { return (this.opts.complete ? '#done' : String(this.opts.current)) + '|' + this.opts.steps.map(s => s.id).join(','); }

    _currentIndex() {
      const st = this.opts.steps;
      if (this.opts.complete) return st.length;
      if (this.opts.current == null) return -1;
      const i = st.findIndex(s => s.id === this.opts.current);
      return i;   // -1 for an unknown id: treated as not started
    }

    _build() {
      const r = this.root = document.createElement('div');
      r.className = 'pt';
      r.innerHTML =
        '<div class="pt-scroller"><ol class="pt-track"></ol></div>' +
        '<div class="pt-fade pt-fade--start" aria-hidden="true"></div>' +
        '<div class="pt-fade pt-fade--end" aria-hidden="true"></div>' +
        '<button class="pt-nav pt-nav--start" type="button" tabindex="-1" aria-hidden="true">' + CHEVRON('start') + '</button>' +
        '<button class="pt-nav pt-nav--end" type="button" tabindex="-1" aria-hidden="true">' + CHEVRON('end') + '</button>' +
        '<p class="pt-sr" aria-live="polite"></p>';
      this.scroller = r.querySelector('.pt-scroller');
      this.track = r.querySelector('.pt-track');
      this.btnStart = r.querySelector('.pt-nav--start');
      this.btnEnd = r.querySelector('.pt-nav--end');
      this.live = r.querySelector('.pt-sr[aria-live]');
      this.parent.appendChild(r);

      const sc = this.scroller;
      sc.addEventListener('scroll', () => this._onScroll(), { passive: true });
      // Anything the user does to move the track counts as browsing.
      const touch = () => this._markUser();
      sc.addEventListener('touchstart', touch, { passive: true });
      sc.addEventListener('wheel', e => { if (e.deltaX || e.shiftKey) this._markUser(); }, { passive: true });
      sc.addEventListener('keydown', e => this._onKey(e));
      sc.addEventListener('pointerdown', e => this._onDown(e));
      sc.addEventListener('pointermove', e => this._onMove(e));
      sc.addEventListener('pointerup', e => this._onUp(e));
      sc.addEventListener('pointercancel', e => this._onUp(e));
      sc.addEventListener('dragstart', e => e.preventDefault());
      sc.addEventListener('click', e => { if (this._swallow) { this._swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
      // Arrows: one actual segment each click, smooth (instant with reduced
      // motion), clamped at the ends. Quick clicks add up rather than restart.
      const arrow = dir => {
        const L = this.layout, b = dir < 0 ? this.btnStart : this.btnEnd;
        if (!b.classList.contains('is-visible') || L.max <= EPS) return;
        const from = this._arrowTo != null ? this._arrowTo : this.scroller.scrollLeft;
        const to = clamp(from + dir * L.seg, 0, L.max);
        this._arrowTo = to;
        clearTimeout(this._arrowT);
        this._arrowT = setTimeout(() => { this._arrowTo = null; }, 600);
        this._markUser();
        this.scroller.scrollTo({ left: to, behavior: reducedMotion() ? 'auto' : 'smooth' });
        const detail = { direction: dir < 0 ? 'start' : 'end', offset: to, currentIndex: this._currentIndex() };
        if (typeof this.opts.onArrow === 'function') this.opts.onArrow(detail);
        r.dispatchEvent(new CustomEvent('progress-timeline:arrow', { bubbles: true, detail }));
      };
      this.btnStart.addEventListener('click', () => arrow(-1));
      this.btnEnd.addEventListener('click', () => arrow(1));
    }

    _render(initial, progressChanged) {
      const st = this.opts.steps, N = st.length, c = this._currentIndex();
      const html = st.map((s, i) => {
        const state = i < c ? 'complete' : i === c ? 'current' : 'upcoming';
        const sr = state === 'complete' ? 'completed' : state === 'current' ? 'in progress' : 'not started';
        return '<li class="pt-step is-' + state + (i < c ? ' is-link-done' : '') + '"' + (i === c ? ' aria-current="step"' : '') + '>' +
          '<span class="pt-dot" aria-hidden="true"></span>' +
          '<span class="pt-label"><span class="pt-sr">Step ' + (i + 1) + ' of ' + N + ': </span>' + esc(s.label) +
          '<span class="pt-sr">, ' + sr + '</span></span></li>';
      }).join('');
      if (html !== this._html) { this.track.innerHTML = html; this._html = html; }
      const t = c >= N ? 'All ' + N + ' steps completed' : c >= 0 ? 'Step ' + (c + 1) + ' of ' + N + ': ' + (st[c].label || '') : N + ' steps, not started';
      const lbl = (this.opts.label ? this.opts.label + ', ' : '') + t;
      this.btnStart.setAttribute('aria-label', 'Scroll to earlier steps');
      this.btnEnd.setAttribute('aria-label', 'Scroll to later steps');
      if (!initial && progressChanged) this.live.textContent = t;
      this._lbl = lbl;
      this._relayout(initial ? 'initial' : progressChanged ? 'progress' : 'render');
    }

    // Measure, lay out, place the track. why: 'initial' | 'progress' | 'render' | 'resize'
    _relayout(why) {
      why = why || 'resize';
      const W = this.root.getBoundingClientRect().width;
      const L = this.layout = computeLayout(W, this.opts.steps.length, this.opts);
      const r = this.root, sc = this.scroller;
      r.dataset.layout = L.fit ? 'fit' : L.narrow ? 'narrow' : 'scroll';
      r.style.setProperty('--pt-seg', L.seg + 'px');
      r.style.setProperty('--pt-pad', L.pad + 'px');
      r.style.setProperty('--pt-col', L.col + 'px');
      r.style.setProperty('--pt-edge', L.edge + 'px');
      this.track.style.width = L.content + 'px';
      r.classList.toggle('is-scrollable', L.max > EPS);
      // Scrollable: the scroller is a focusable, named group (arrow keys browse) and
      // carries the name; otherwise the list does.
      if (L.max > EPS) { sc.tabIndex = 0; sc.setAttribute('role', 'group'); sc.setAttribute('aria-label', this._lbl + '. Use the arrow keys to browse.'); this.track.removeAttribute('aria-label'); }
      else { sc.removeAttribute('tabindex'); sc.removeAttribute('role'); sc.removeAttribute('aria-label'); this.track.setAttribute('aria-label', this._lbl); }

      let off;
      if (this._browsed && why !== 'progress') off = clamp(this._pos * L.seg, 0, L.max);   // keep where they were, clamped
      else off = targetOffset(L, this._currentIndex());
      this._applyOffset(off, why === 'progress');
    }

    _applyOffset(off, smooth) {
      const sc = this.scroller;
      this._off = off;
      this._lastProg = performance.now();
      if (smooth && !reducedMotion() && typeof sc.scrollTo === 'function') sc.scrollTo({ left: off, behavior: 'smooth' });
      else sc.scrollLeft = off;
      this._sync();
    }

    _markUser() {
      this._userActive = true;
      this._lastInput = performance.now();
      clearTimeout(this._userT);
      this._userT = setTimeout(() => { this._userActive = false; }, 1000);
    }

    _onScroll() {
      const off = this.scroller.scrollLeft;
      // the user's own scrolling: input since the last scroll we started
      if (this._drag || (this._userActive && (this._lastInput || 0) >= (this._lastProg || 0))) {
        if (Math.abs(off - this._off) > EPS) this._browsed = true;
        this._off = off;
        if (this.layout.seg > 0) this._pos = off / this.layout.seg;
        clearTimeout(this._userT);
        this._userT = setTimeout(() => { this._userActive = false; }, 250);   // momentum keeps it alive
      }
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => this._sync());
    }

    // Fades and buttons from where the track actually is.
    _sync() {
      const s = edgeState(this.layout, this.scroller.scrollLeft), r = this.root;
      r.classList.toggle('is-overflow-start', s.overflowStart);
      r.classList.toggle('is-overflow-end', s.overflowEnd);
      this._button(this.btnStart, s.startButton);
      this._button(this.btnEnd, s.endButton);
    }

    _button(b, on) {
      if (b.classList.contains('is-visible') === on) return;
      const hadFocus = document.activeElement === b;
      b.classList.toggle('is-visible', on);
      b.tabIndex = on ? 0 : -1;
      if (on) b.removeAttribute('aria-hidden'); else b.setAttribute('aria-hidden', 'true');
      if (hadFocus && !on) (this.scroller.tabIndex === 0 ? this.scroller : (this.btnStart.classList.contains('is-visible') ? this.btnStart : this.btnEnd)).focus({ preventScroll: true });
    }

    _onKey(e) {
      const L = this.layout;
      if (L.max <= EPS || e.altKey || e.ctrlKey || e.metaKey) return;
      const sc = this.scroller, step = L.seg, page = Math.max(step, L.W - 2 * L.edge);
      let to = null;
      if (e.key === 'ArrowRight') to = sc.scrollLeft + step;
      else if (e.key === 'ArrowLeft') to = sc.scrollLeft - step;
      else if (e.key === 'PageDown') to = sc.scrollLeft + page;
      else if (e.key === 'PageUp') to = sc.scrollLeft - page;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = L.max;
      if (to == null) return;
      e.preventDefault();
      this._markUser();
      sc.scrollTo({ left: clamp(to, 0, L.max), behavior: reducedMotion() ? 'auto' : 'smooth' });
    }

    // Mouse drag; touch and trackpads scroll natively.
    _onDown(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || this.layout.max <= EPS) return;
      this._drag = { x: e.clientX, off: this.scroller.scrollLeft, id: e.pointerId, moved: false };
    }
    _onMove(e) {
      const d = this._drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < 4) return;
        d.moved = true;
        try { this.scroller.setPointerCapture(d.id); } catch (_) { /* already released */ }
        this.root.classList.add('is-dragging');
        this._markUser();
      }
      this._markUser();
      this.scroller.scrollLeft = d.off - dx;
      e.preventDefault();
    }
    _onUp(e) {
      const d = this._drag;
      if (!d || e.pointerId !== d.id) return;
      if (d.moved) { this._swallow = true; setTimeout(() => { this._swallow = false; }, 0); }   // the click this release makes, if any, is part of the drag
      this.root.classList.remove('is-dragging');
      try { this.scroller.releasePointerCapture(d.id); } catch (_) { /* not captured */ }
      this._drag = null;
    }
  }

  ProgressTimeline.computeLayout = computeLayout;
  ProgressTimeline.targetOffset = targetOffset;
  ProgressTimeline.edgeState = edgeState;
  ProgressTimeline.constants = { DOT, GAP, DOT_ZONE, BTN, GUTTER, LABEL_MAX, ANCHOR, MIN_SEGMENT_FLOOR };
  return ProgressTimeline;
}));
