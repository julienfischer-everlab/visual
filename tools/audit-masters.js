/* Master audit: every page, every breakpoint, any Card static / Card interactive instance whose padding or corner
   is not its size's (--kP, --kR), and any main page title off the Page header group master (--phgTFs, --phgTW), so a change to a master reaches every page without checking each one by hand.
   Structural cases that keep the size's padding inside (a Body with Body padding, carousel slides, list rows)
   are not overrides and are skipped. Run: node tools/audit-masters.js http://127.0.0.1:9092/index.html [m,xs]
   (needs a local server on the repo root and Playwright). Prints nothing but the summary when all is clean. */
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:9092/index.html', bps = (process.argv[3] || 'm,xs').split(',');
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  await p.goto(url); await p.waitForTimeout(3600);
  const sel = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]); await p.waitForTimeout(1300); };
  const pages = await p.evaluate(() => [...document.getElementById('versionSel').options].map(o => o.value).filter(v => v && !/^(doc|ds|archive)$/.test(v)));
  const out = {};
  for (const bp of bps) { await sel('stBp', bp);
    for (const v of pages) { await sel('versionSel', v);
      const r = await p.evaluate(() => { const vis = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden', R = [];
        const SPEC = { hpOvCard: ['kP', 'var(--t-space-xl)'] };   /* a master's own documented spec (the Primary card's 32 sides) */
        document.querySelectorAll('.evCard, .evCardI').forEach(e => { if (!vis(e) || e.closest('#docPage, .topbar, .tkPanel')) return;
          const cs = getComputedStyle(e), kP = cs.getPropertyValue('--kP').trim(), kR = cs.getPropertyValue('--kR').trim(); if (!kP) return;
          const pads = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
          const inner = [...e.children].some(c => { const s = getComputedStyle(c); return (s.paddingLeft === kP && s.paddingRight === kP) || s.paddingTop === kP || (s.position === 'absolute' && s.left === kP); });   /* its content inset by the size inside: a Body with Body padding, carousel slides, list rows, or a full-bleed visual with its words placed --kP in */
          const zero = pads.every(x => x === '0px') && inner, rows = pads[0] === '0px' && pads[1] === kP && inner;
          const spec = e.classList.contains('hpOvCard') && pads[0] === kP && pads[2] === kP && pads[1] === pads[3];
          const padOff = !(zero || rows || spec) && pads.some(x => x !== kP), radOff = kR && cs.borderTopLeftRadius !== kR && cs.borderTopLeftRadius !== '0px';
          if (padOff || radOff) R.push([...e.classList].filter(c => !/^evCard/.test(c)).slice(0, 3).join('.') + (padOff ? ' pad[' + pads.join(' ') + '] size ' + kP : '') + (radOff ? ' corner ' + cs.borderTopLeftRadius + ' size ' + kR : '')); });
        { const B = getComputedStyle(document.body), fs = B.getPropertyValue('--phgTFs').trim(), fw = B.getPropertyValue('--phgTW').trim();   /* the main pages' titles on the Page header group master (EvPageHg's --phgTFs, --phgTW) */
          if (fs) document.querySelectorAll('#dOver .dvH1, #dMain > h1, #dMkt .mkT, #dTl .tlH1, #dPlan.plDesk .plPgT .evTgT, #dAcc .acHead h1').forEach(h => { if (!vis(h)) return; const c = getComputedStyle(h); if (c.fontSize !== fs || (fw && c.fontWeight !== fw)) R.push('page title ' + (h.closest('[id^="d"]') || {}).id + ' ' + c.fontSize + ' w' + c.fontWeight + ' master ' + fs + ' w' + fw); }); }
        return [...new Set(R)]; });
      r.forEach(x => { (out[x] = out[x] || []).push(bp + ':' + v); }); } }
  const E = Object.entries(out); E.sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => console.log(k, '|', v.slice(0, 8).join(','), v.length > 8 ? '+' + (v.length - 8) : ''));
  console.log(E.length ? E.length + ' override(s) off a master' : 'clean: every card on its size', '·', pages.length, 'pages ×', bps.join(' '));
  await b.close(); })();
