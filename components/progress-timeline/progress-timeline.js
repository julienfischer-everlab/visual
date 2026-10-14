/*
 * ProgressTimeline: a responsive, horizontally scrolling step timeline.
 *
 *   const tl = new ProgressTimeline(parentElement, {
 *     steps: [{ id: 'details', label: 'Confirm your details' }, ...],
 *     current: 'clinic',          // id of the step in progress; null = not started
 *     complete: false,            // true = every step done
 *     minSegment: 128,            // px between neighbouring dots, never less
 *     onArrow: detail => {...},   // optional: an arrow scrolled the track one segment
 *     onInfo: detail => {...}     // optional: adds an info button to the compact caption
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
  const COMPACT_SPAN = 2;             // compact: segments across the safe area (previous, current and next dots)

  const DEFAULTS = {
    steps: [],
    current: null,
    complete: false,
    minSegment: 128,
    edge: 128,
    compactEdge: 64,        // the safe area each side once the labels go (compact)
    label: 'Progress',
    upNext: 'Up next',      // the compact caption: "Up next – <the next step>"
    infoLabel: 'See all the steps',
    arrowLabels: { start: 'Scroll to earlier steps', end: 'Scroll to later steps' },
    onArrow: null,          // optional: told after an arrow click scrolls the track
    onInfo: null,           // optional: an info button after the compact caption calls it
  };
  // Options with undefined values (a pass-through wrapper's) don't override the defaults.
  const defined = o => { const r = {}; if (o) for (const k of Object.keys(o)) if (o[k] !== undefined) r[k] = o[k]; return r; };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---- Layout: pure, from the measured width ------------------------------
  //
  // x of dot i on screen = pad + i * seg - offset, offset = the scroller's
  // scrollLeft, from 0 (beginning) to max (end).
  function computeLayout(width, count, opts) {
    const o = Object.assign({}, DEFAULTS, defined(opts));
    const W = Math.max(0, +width || 0);
    const N = Math.max(0, count | 0);
    const m = Math.max(MIN_SEGMENT_FLOOR, +o.minSegment || DEFAULTS.minSegment);
    const E0 = Number.isFinite(+o.edge) ? Math.max(0, +o.edge) : DEFAULTS.edge;
    const E = Math.min(E0, W / 2);                               // 128 each side (they meet below 256px)
    const usable = W - 2 * E;                                    // between the two edge areas
    const narrow = usable < 2 * m;                               // fewer than two minimum increments fit
    const col = seg => Math.min(seg, LABEL_MAX + 2 * GUTTER);
    if (N <= 1) {
      return { fit: true, narrow, compact: false, W, N, seg: 0, pad: W / 2, edge: E, col: Math.min(LABEL_MAX + 2 * GUTTER, W),
        content: W, max: 0, usable, minSegment: m };
    }
    const spread = usable / (N - 1);
    if (spread >= m - 1e-6) {                                    // all fit: stretch across the usable width
      return { fit: true, narrow, compact: false, W, N, seg: spread, pad: E, edge: E, col: col(spread), content: W, max: 0, usable, minSegment: m };
    }
    // Narrow and every column fits at the minimum: stretch the columns across
    // the card, no scrolling and no blank space.
    if (narrow && N * col(m) <= W + 1e-6) {
      const sg = W / N;
      return { fit: true, narrow, compact: false, W, N, seg: sg, pad: sg / 2, edge: E, col: col(sg), content: W, max: 0, usable, minSegment: m };
    }
    if (narrow) {
      // Compact: fewer than three labelled steps fit, so the labels go entirely
      // and the dots and line sit inside a 64px safe area each side. The
      // segment is what puts three dots across it (previous, current, next),
      // never more than the minimum; the track scrolls if the rest don't fit.
      const CE0 = Number.isFinite(+o.compactEdge) ? Math.max(0, +o.compactEdge) : DEFAULTS.compactEdge;
      const ce = Math.min(CE0, W / 4), cu = W - 2 * ce;
      const mc = Math.min(m, Math.max(MIN_SEGMENT_FLOOR, cu / COMPACT_SPAN));
      const cs = cu / (N - 1);
      if (cs >= mc - 1e-6) return { fit: true, narrow, compact: true, W, N, seg: cs, pad: ce, edge: ce, col: DOT, content: W, max: 0, usable: cu, minSegment: mc };
      const cc = 2 * ce + (N - 1) * mc;
      return { fit: false, narrow, compact: true, W, N, seg: mc, pad: ce, edge: ce, col: DOT, content: cc, max: Math.max(0, cc - W), usable: cu, minSegment: mc };
    }
    // Wide and scrolling, at exactly the minimum.
    const content = 2 * E + (N - 1) * m;
    return { fit: false, narrow, compact: false, W, N, seg: m, pad: E, edge: E, col: col(m), content, max: Math.max(0, content - W), usable, minSegment: m };
  }

  const labelHalf = L => Math.max(0, L.col / 2 - GUTTER);
  const dotX = (L, i, off) => L.pad + i * L.seg - off;

  // Which edges overflow at an offset, and whether the timeline itself (its
  // line, a dot or a step's label column: from the first column's left edge to
  // the last one's right edge) is under each arrow's centre. Never over blank
  // track past the ends.
  function edgeState(L, off) {
    const overflowStart = L.max > EPS && off > EPS;
    const overflowEnd = L.max > EPS && off < L.max - EPS;
    const under = cx => L.N >= 2 && L.seg > 0 && cx >= dotX(L, 0, off) - L.col / 2 - EPS && cx <= dotX(L, L.N - 1, off) + L.col / 2 + EPS;
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
    if (L.narrow) return clamp(clamp(c, 0, N - 1) * L.seg + L.pad - L.W / 2, 0, M);   // narrow (compact): the current dot at 50% as far as the track allows
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
  const INFO = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
    '<path d="M8 7.2v3.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5.1" r=".7" fill="currentColor"/></svg>';
  let uid = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  class ProgressTimeline {
    constructor(parent, options) {
      if (!parent || !parent.appendChild) throw new TypeError('ProgressTimeline: a parent element is required');
      this.parent = parent;
      this.opts = Object.assign({}, DEFAULTS, defined(options));
      this.id = 'pt' + (++uid);
      this._off = 0;              // the offset we last applied or saw
      this._browsed = false;      // the user moved the track since the last progress change
      this._pos = 0;              // their position, in segments, so it survives a resize
      this._prog = null;          // a scroll we started for automatic positioning: { to, until }
      this._navTo = null;         // where an arrow or key scroll is heading (quick presses add up)
      this._build();
      this._render(true);
      if (typeof ResizeObserver === 'function') {
        // Width from the observer's layout box (not the transformed on-screen size);
        // relaid out on the next frame so label re-wrapping can't loop the observer.
        this._ro = new ResizeObserver(es => {
          const w = es[0] && es[0].contentRect ? es[0].contentRect.width : this._measure();
          if (this.layout && Math.abs(w - this.layout.W) < 0.5) return;
          cancelAnimationFrame(this._roRaf);
          this._roRaf = requestAnimationFrame(() => this._relayout('resize'));
        });
        this._ro.observe(this.root);
      } else addEventListener('resize', this._onWinResize = () => this._relayout('resize'));
    }

    // Props in, view out. Same current: the user's browsing position is kept.
    update(options) {
      const prevKey = this._progressKey();
      Object.assign(this.opts, defined(options));
      const changed = this._progressKey() !== prevKey;
      if (changed) { this._browsed = false; this._navTo = null; }
      this._render(false, changed);
    }

    setCurrent(id) { this.update({ current: id, complete: false }); }

    // Back to the resting position for the current state.
    scrollToCurrent(smooth) { this._browsed = false; this._navTo = null; this._applyOffset(targetOffset(this.layout, this._currentIndex()), smooth); }

    getState() {
      const L = this.layout, off = this.scroller.scrollLeft, s = edgeState(L, off);
      return { fit: L.fit, narrow: L.narrow, compact: L.compact, width: L.W, segment: L.seg, edge: L.edge, offset: off, maxOffset: L.max,
        currentIndex: this._currentIndex(), browsed: this._browsed,
        overflowStart: s.overflowStart, overflowEnd: s.overflowEnd, startButton: s.startButton, endButton: s.endButton };
    }

    destroy() {
      if (this._ro) this._ro.disconnect(); else removeEventListener('resize', this._onWinResize);
      clearTimeout(this._navT);
      cancelAnimationFrame(this._raf);
      cancelAnimationFrame(this._roRaf);
      this._endDrag();
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

    // The card's layout width: unaffected by transforms (a modal's scale-in) or zoom on an ancestor.
    _measure() {
      const w = parseFloat(getComputedStyle(this.root).width);
      return Number.isFinite(w) ? w : this.root.clientWidth || 0;
    }

    _build() {
      const r = this.root = document.createElement('div');
      r.className = 'pt';
      r.tabIndex = -1;            // somewhere for focus to land if what had it goes away
      r.innerHTML =
        '<div class="pt-scroller"><ol class="pt-track"></ol></div>' +
        '<div class="pt-fade pt-fade--start" aria-hidden="true"></div>' +
        '<div class="pt-fade pt-fade--end" aria-hidden="true"></div>' +
        '<button class="pt-nav pt-nav--start" type="button" tabindex="-1" aria-hidden="true">' + CHEVRON('start') + '</button>' +
        '<button class="pt-nav pt-nav--end" type="button" tabindex="-1" aria-hidden="true">' + CHEVRON('end') + '</button>' +
        '<p class="pt-caption"></p>' +
        '<p class="pt-sr" aria-live="polite"></p>';
      this.scroller = r.querySelector('.pt-scroller');
      this.track = r.querySelector('.pt-track');
      this.btnStart = r.querySelector('.pt-nav--start');
      this.btnEnd = r.querySelector('.pt-nav--end');
      this.live = r.querySelector('.pt-sr[aria-live]');
      this.caption = r.querySelector('.pt-caption');
      this.parent.appendChild(r);

      const sc = this.scroller;
      sc.addEventListener('scroll', () => this._onScroll(), { passive: true });
      // The user taking over: whatever we were animating to no longer applies.
      const takeOver = () => { this._prog = null; this._navTo = null; };
      sc.addEventListener('touchmove', takeOver, { passive: true });
      sc.addEventListener('wheel', e => { if (e.deltaX || e.shiftKey) takeOver(); }, { passive: true });
      sc.addEventListener('keydown', e => this._onKey(e));
      sc.addEventListener('pointerdown', e => this._onDown(e));
      sc.addEventListener('pointermove', e => this._onMove(e));
      sc.addEventListener('dragstart', e => e.preventDefault());
      sc.addEventListener('click', e => { if (this._swallow) { this._swallow = false; e.preventDefault(); e.stopPropagation(); } }, true);
      this._winUp = e => this._onUp(e);
      // Arrows: one actual segment each click, smooth (instant with reduced
      // motion), clamped at the ends. Quick clicks add up rather than restart.
      const arrow = dir => {
        const L = this.layout, b = dir < 0 ? this.btnStart : this.btnEnd;
        if (!b.classList.contains('is-visible') || L.max <= EPS) return;
        const to = this._nav((this._navTo != null ? this._navTo : sc.scrollLeft) + dir * L.seg);
        const detail = { direction: dir < 0 ? 'start' : 'end', offset: to, currentIndex: this._currentIndex() };
        if (typeof this.opts.onArrow === 'function') this.opts.onArrow(detail);
        r.dispatchEvent(new CustomEvent('progress-timeline:arrow', { bubbles: true, detail }));
      };
      this.btnStart.addEventListener('click', () => arrow(-1));
      this.btnEnd.addEventListener('click', () => arrow(1));
      this.caption.addEventListener('click', e => {
        if (!e.target.closest('.pt-info')) return;
        const detail = { currentIndex: this._currentIndex() };
        if (typeof this.opts.onInfo === 'function') this.opts.onInfo(detail);
        r.dispatchEvent(new CustomEvent('progress-timeline:info', { bubbles: true, detail }));
      });
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
      const al = Object.assign({}, DEFAULTS.arrowLabels, defined(this.opts.arrowLabels));
      this.btnStart.setAttribute('aria-label', al.start);
      this.btnEnd.setAttribute('aria-label', al.end);
      if (!initial && progressChanged) this.live.textContent = t;
      // The compact caption: the next step by name (the first before starting);
      // nothing once the last step is in hand.
      const nx = c < 0 ? st[0] : c < N - 1 ? st[c + 1] : null;
      const cap = nx ? '<span class="pt-caption-text">' + esc(this.opts.upNext) + ' \u2013 ' + esc(nx.label) + '</span>' +
        (typeof this.opts.onInfo === 'function' ? '<button class="pt-info" type="button" aria-label="' + esc(this.opts.infoLabel) + '">' + INFO + '</button>' : '') : '';
      if (cap !== this._cap) { const hadFocus = this.caption.contains(document.activeElement); this.caption.innerHTML = cap; this._cap = cap; if (hadFocus) this._refocus(); }
      this.root.classList.toggle('has-caption', !!cap);
      this._lbl = lbl;
      this._relayout(initial ? 'initial' : progressChanged ? 'progress' : 'render');
    }

    // Measure, lay out, place the track. why: 'initial' | 'progress' | 'render' | 'resize'
    _relayout(why) {
      why = why || 'resize';
      const prev = this.layout, r = this.root, sc = this.scroller;
      const L = this.layout = computeLayout(this._measure(), this.opts.steps.length, this.opts);
      const same = prev && prev.compact === L.compact && ['W', 'N', 'seg', 'pad', 'col', 'edge', 'content'].every(k => Math.abs(prev[k] - L[k]) < 0.01);
      const focused = r.contains(document.activeElement) ? document.activeElement : null;
      r.dataset.layout = L.compact ? 'compact' : L.fit ? 'fit' : L.narrow ? 'narrow' : 'scroll';
      r.classList.toggle('is-compact', L.compact);
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

      if (why === 'render' && same) this._sync();   // an ordinary re-render: the track, and any scroll in flight, left alone
      else {
        let off;
        if (this._browsed && why !== 'progress') off = clamp(this._navTo != null ? this._navTo : this._pos * L.seg, 0, L.max);   // keep where they were, clamped
        else { this._navTo = null; off = targetOffset(L, this._currentIndex()); }
        if (this._navTo != null && Math.abs(off - this._navTo) > EPS) this._navTo = null;
        this._applyOffset(off, why === 'progress');
      }
      // focus never drops to <body>: the track if it can take it, else the card
      if (focused && !(focused.offsetParent && focused.tabIndex >= 0 && focused.getAttribute('aria-hidden') !== 'true')) this._refocus();
    }

    _refocus() {
      const t = this.scroller.tabIndex === 0 ? this.scroller : [this.btnStart, this.btnEnd].find(b => b.classList.contains('is-visible')) || this.root;
      t.focus({ preventScroll: true });
    }

    // Automatic positioning: a scroll of ours, so it isn't taken for browsing.
    _applyOffset(off, smooth) {
      const sc = this.scroller, anim = smooth && !reducedMotion() && typeof sc.scrollTo === 'function';
      this._off = off;
      this._prog = Math.abs(sc.scrollLeft - off) < 1 ? null : { to: off, until: performance.now() + (anim ? 1500 : 150) };
      if (anim) sc.scrollTo({ left: off, behavior: 'smooth' });
      else sc.scrollLeft = off;
      this._sync();
    }

    // Browsing by arrow or key: smooth (instant with reduced motion), clamped, and
    // quick presses add up. It's the user's own position from the start.
    _nav(to) {
      const L = this.layout, sc = this.scroller;
      to = clamp(to, 0, L.max);
      this._prog = null;
      this._navTo = to;
      this._browsed = true;
      if (L.seg > 0) this._pos = to / L.seg;
      clearTimeout(this._navT);
      this._navT = setTimeout(() => { this._navTo = null; this._sync(); }, 1500);   // a fallback; it clears on arrival
      sc.scrollTo({ left: to, behavior: reducedMotion() ? 'auto' : 'smooth' });
      this._sync();
      return to;
    }

    _onScroll() {
      const off = this.scroller.scrollLeft;
      if (this._prog && (Math.abs(off - this._prog.to) < 1 || performance.now() > this._prog.until)) this._prog = null;
      if (this._navTo != null && Math.abs(off - this._navTo) < 1) this._navTo = null;
      // Anything we didn't start is the user browsing: touch, trackpad, drag,
      // keys and arrows, but also assistive tech, focus and scrollIntoView. Not
      // the browser clamping the old track to a new width before the resize is
      // laid out (a short compact track in a card that just grew).
      if (!this._prog && Math.abs(this._measure() - this.layout.W) >= 0.5) { this._off = off; }
      else if (!this._prog) {
        if (Math.abs(off - this._off) > EPS) this._browsed = true;
        this._off = off;
        if (this.layout.seg > 0) this._pos = (this._navTo != null ? this._navTo : off) / this.layout.seg;
      }
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => this._sync());
    }

    // Fades from where the track actually is; arrows from where it will rest.
    _sync() {
      const sl = this.scroller.scrollLeft, s = edgeState(this.layout, sl), r = this.root;
      r.classList.toggle('is-overflow-start', s.overflowStart);
      r.classList.toggle('is-overflow-end', s.overflowEnd);
      if (this._navTo != null && Math.abs(sl - this._navTo) < 1) this._navTo = null;
      // While an arrow's or key's smooth scroll runs, the arrows go by where the
      // track will rest, so they don't blink mid-flight (and swallow the next click).
      const a = this._navTo != null ? edgeState(this.layout, this._navTo) : s;
      this._button(this.btnStart, a.startButton);
      this._button(this.btnEnd, a.endButton);
    }

    _button(b, on) {
      if (b.classList.contains('is-visible') === on) return;
      const hadFocus = document.activeElement === b;
      b.classList.toggle('is-visible', on);
      b.tabIndex = on ? 0 : -1;
      if (on) b.removeAttribute('aria-hidden'); else b.setAttribute('aria-hidden', 'true');
      if (hadFocus && !on) this._refocus();
    }

    _onKey(e) {
      const L = this.layout;
      if (L.max <= EPS || e.altKey || e.ctrlKey || e.metaKey) return;
      const base = this._navTo != null ? this._navTo : this.scroller.scrollLeft, step = L.seg, page = Math.max(step, L.W - 2 * L.edge);
      let to = null;
      if (e.key === 'ArrowRight') to = base + step;
      else if (e.key === 'ArrowLeft') to = base - step;
      else if (e.key === 'PageDown') to = base + page;
      else if (e.key === 'PageUp') to = base - page;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = L.max;
      if (to == null) return;
      e.preventDefault();
      this._nav(to);
    }

    // Mouse drag; touch and trackpads scroll natively. The release is heard on
    // the window, so a press that leaves the track can't stay armed.
    _onDown(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || this.layout.max <= EPS) return;
      this._endDrag();
      this._drag = { x: e.clientX, off: this.scroller.scrollLeft, id: e.pointerId, moved: false };
      addEventListener('pointerup', this._winUp, true);
      addEventListener('pointercancel', this._winUp, true);
    }
    _onMove(e) {
      const d = this._drag;
      if (!d || e.pointerId !== d.id) return;
      if (!(e.buttons & 1)) { this._endDrag(); return; }   // released somewhere we didn't hear
      const dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < 4) return;
        d.moved = true;
        this._prog = null; this._navTo = null;
        try { this.scroller.setPointerCapture(d.id); } catch (_) { /* already released */ }
        this.root.classList.add('is-dragging');
      }
      this.scroller.scrollLeft = d.off - dx;
      e.preventDefault();
    }
    _onUp(e) {
      const d = this._drag;
      if (!d || (e && e.pointerId !== d.id)) return;
      if (d.moved) { this._swallow = true; setTimeout(() => { this._swallow = false; }, 0); }   // the click this release makes, if any, is part of the drag
      this._endDrag();
    }
    _endDrag() {
      const d = this._drag;
      removeEventListener('pointerup', this._winUp, true);
      removeEventListener('pointercancel', this._winUp, true);
      if (!d) return;
      this.root.classList.remove('is-dragging');
      try { this.scroller.releasePointerCapture(d.id); } catch (_) { /* not captured */ }
      this._drag = null;
    }
  }

  ProgressTimeline.computeLayout = computeLayout;
  ProgressTimeline.targetOffset = targetOffset;
  ProgressTimeline.edgeState = edgeState;
  ProgressTimeline.constants = { DOT, GAP, DOT_ZONE, BTN, GUTTER, LABEL_MAX, ANCHOR, MIN_SEGMENT_FLOOR, COMPACT_SPAN };
  return ProgressTimeline;
}));
