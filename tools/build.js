#!/usr/bin/env node
// Builds dist/index.html from index.html: the same page, byte for byte in what
// it does, a quarter of the size in what it weighs. Every <style> block goes
// through csso and every <script> block through terser; the HTML between them
// keeps its comments stripped and nothing else touched. Nothing here changes a
// number the design landed on -- a minifier that did would be a bug, not a
// build step -- and the shaders live in template literals, which terser leaves
// alone.
//
//   cd tools && npm install && node build.js
//
// The source stays the file people read and edit; dist/ is what ships.
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const csso = require('csso');

const root = path.resolve(__dirname, '..');
let src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// the build's stamp in the toolbar (Sydney time), so a page a browser kept from before is told apart at a glance
src = src.replace('>dev build</span>', '>Build ' + new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + '</span>');

// Images live under assets/ so the source stays a file people can read and
// the dev page loads them over HTTP like any other page. dist/index.html has
// to be the whole thing in one file -- it is what the artifact publishes and
// what gets mailed around -- so every assets/ path in the source, in CSS or
// in a string, is replaced here by the file itself as a data URI.
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
               gif: 'image/gif', svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm',
               mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav' };
let assetIn = 0, assetOut = 0, assetN = 0;
// Each inlined picture or video keeps its name, as a parameter of its data:
// URI (data:image/webp;as=overview~avatar-dr.webp;base64,...): the Assets
// library page finds every copy of it by that name and puts a replacement in
// its place at run time, everywhere it shows. "~" stands for "/" (a MIME
// parameter value is a token). Sound is left untagged: it cannot be replaced.
const tagOf = ref => /\.(mp3|m4a|wav)$/i.test(ref) ? '' : ';as=' + ref.replace(/^(\.\.\/)?assets\//, '').replace(/\//g, '~');
src = src.replace(/assets\/[A-Za-z0-9_\-./]+?\.(webp|png|jpe?g|gif|svg|mp4|webm|mp3|m4a|wav)\b/g, ref => {
  const f = path.join(root, ref);
  if (!fs.existsSync(f)){ console.warn('missing asset, left as a path: ' + ref); return ref; }
  const buf = fs.readFileSync(f);
  const uri = 'data:' + MIME[ref.split('.').pop().toLowerCase()] + tagOf(ref) + ';base64,' + buf.toString('base64');
  assetIn += buf.length; assetOut += uri.length; assetN++;
  return uri;
});

// A build stamp, read in the Tweaks panel: which build a page in front of
// someone actually is. The source says "dev"; dist says when it was built and
// from which commit, so a stale copy in a viewer can be told from a fresh one.
{
  let hash = '';
  try { hash = require('child_process').execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) {}
  const d = new Date();
  const stamp = d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' + (hash ? ' · ' + hash : '');
  src = src.replace('id="tkBuild">dev<', 'id="tkBuild">' + stamp + '<');
}

(async () => {
  let out = '';
  let cssIn = 0, cssOut = 0, jsIn = 0, jsOut = 0, htmlIn = 0, htmlOut = 0;
  // Walk the document block by block: text, then a <style> or <script> element,
  // then text again. A regex over the whole file is fine here because neither
  // element nests and no string in the page contains a closing tag.
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>|<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let last = 0, m;
  const html = s => {
    htmlIn += s.length;
    // comments out, and runs of blank lines folded; indentation stays, since
    // whitespace inside inline text is not always collapsible
    const t = s.replace(/<!--[\s\S]*?-->/g, '').replace(/\n[ \t]*\n(?:[ \t]*\n)*/g, '\n');
    htmlOut += t.length;
    return t;
  };
  while ((m = re.exec(src))){
    out += html(src.slice(last, m.index));
    if (m[0].startsWith('<style')){
      cssIn += m[1].length;
      const css = csso.minify(m[1], { restructure: false, comments: false }).css;
      cssOut += css.length;
      out += '<style>' + css + '</style>';
    } else {
      const attrs = m[2] || '', code = m[3];
      const isJs = !/type\s*=/.test(attrs) || /type\s*=\s*["']?(text\/javascript|module)/.test(attrs);
      if (!isJs){ out += m[0]; }
      else {
        jsIn += code.length;
        const r = await minify(code, {
          ecma: 2020,
          compress: { passes: 2, pure_getters: false, unsafe: false, keep_infinity: true },
          mangle: { toplevel: false },
          format: { comments: false, ascii_only: false }
        });
        if (r.error) throw r.error;
        jsOut += r.code.length;
        out += '<script' + attrs + '>' + r.code + '</script>';
      }
    }
    last = m.index + m[0].length;
  }
  out += html(src.slice(last));
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist', 'index.html'), out);
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  if (assetN) console.log('asset ' + kb(assetIn) + ' -> ' + kb(assetOut) + '  (' + assetN + ' inlined)');
  console.log('html  ' + kb(htmlIn) + ' -> ' + kb(htmlOut));
  console.log('css   ' + kb(cssIn) + ' -> ' + kb(cssOut));
  console.log('js    ' + kb(jsIn) + ' -> ' + kb(jsOut));
  console.log('total ' + kb(src.length) + ' -> ' + kb(out.length) + '  (dist/index.html)');
  // the Concierge page (visuals/concierge.html), built beside it with its pictures inlined, as the prototype opens it: concierge.html
  // a page's pictures (assets/…, or ../assets/… from visuals/), inlined as data: URIs; how many
  const inline = txt => { let n = 0; const out = txt.replace(/(?:\.\.\/)?assets\/[A-Za-z0-9_\-./]+?\.(webp|png|jpe?g|gif|svg)\b/g, ref => { const f = path.join(root, ref.replace(/^\.\.\//, '')); if (!fs.existsSync(f)){ console.warn('missing asset, left as a path: ' + ref); return ref; } n++; return 'data:' + MIME[ref.split('.').pop().toLowerCase()] + tagOf(ref) + ';base64,' + fs.readFileSync(f).toString('base64'); }); return [out, n]; };
  // the Gift page (visuals/gift.html, the "Unwrap gift-FINAL" page, its pictures already inside it), the Clinic's Testing locations (visuals/clinic.html) and the Gift receipt (visuals/gift-receipt.html), beside it as the prototype opens them: gift.html, clinic.html, gift-receipt.html; and the Gift referral (visuals/referral.html): referral.html; and Marketing's Chat video builder (visuals/chat-video.html, React from cdnjs, no pictures of its own: its preview is concierge.html#stage): chat-video.html
  /* a page's Google Fonts (Geist, Newsreader, ...: open-licence faces only; the brand's own faces are never put in a page) inlined as data: URIs, latin and latin-ext only, so the page needs no font host and the top bar's Screenshot can draw its text in its own faces (a picture drawn from the page cannot fetch a font in the artifact). Fetched once with curl (the proxy's), kept in tools/.fontcache (not committed); no network and no cache: the link is left as it was */
  const fontCache = path.join(__dirname, '.fontcache'), UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  const getC = (url, bin) => { const f = path.join(fontCache, require('crypto').createHash('sha1').update(url).digest('hex') + (bin ? '.bin' : '.css')); if (fs.existsSync(f)) return fs.readFileSync(f);
    const out = require('child_process').execFileSync('curl', ['-sSfL', '--max-time', '20', '-A', UA, url], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 << 20 }); fs.mkdirSync(fontCache, { recursive: true }); fs.writeFileSync(f, out); return out; };
  const inlineFonts = txt => { let nf = 0; const t2 = txt.replace(/<link\b[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"[^>]*>/g, (tag, href) => { try {
      const css = getC(href.replace(/&amp;/g, '&')).toString('utf8'), keep = [];
      css.replace(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g, (m, sub, face) => { if (sub === 'latin' || sub === 'latin-ext') keep.push(face); return m; });
      if (!keep.length) return tag;
      const faces = keep.map(face => face.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (m, u) => { nf++; const ext = (u.split('.').pop() || 'woff2').toLowerCase(); return 'url(data:font/' + (ext === 'ttf' ? 'ttf' : ext === 'woff' ? 'woff' : 'woff2') + ';base64,' + getC(u, true).toString('base64') + ')'; }));
      return '<style>' + faces.join('\n') + '</style>'; } catch (e) { console.warn('fonts left as a link (' + (e.message || e).toString().slice(0, 60) + '): ' + href.slice(0, 80)); return tag; } });
    return [t2, nf]; };
  /* the Design system's masters, for a page of its own (an iframe, its own document): where it says <!--ev:master EvOverlap css--> and <!--ev:master EvOverlap js-->, the header overlap's
     own CSS and script, taken from index.html as they are on every build ("Documentation is the master": the Gift referral's hero runs the very code the Activity plan's does), never a copy kept by hand.
     Found by what they hold: the CSS from the Header overlap section's heading to the next section's, with the Overview bar's blur bands (.ovGround) the bar draws on; the script window.EvOverlap's IIFE */
  const masters = (() => { const ix = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), cut = (a, b, what) => { const i = ix.indexOf(a); if (i < 0) throw new Error('build: ' + what + ' not found in index.html'); const j = ix.indexOf(b, i + a.length); if (j < 0) throw new Error('build: the end of ' + what + ' not found'); return ix.slice(i, j); };
    const ovCss = cut('/* ---- Header overlap (EvOverlap;', '\n  /* ---- ', 'the header overlap CSS'), gnd = ix.match(/^[ \t]*\.ovGround(?:\{| i\{| i:nth-child\(\d+\)\{)[^\n]*$/gm) || [];
    if (gnd.length !== 12) throw new Error('build: the Overview bar blur bands (.ovGround: the ground, its bands, ten of them: 12 rules) not found, ' + gnd.length);
    const ovJs = cut('window.EvOverlap = (function () {', '\n})();', 'the EvOverlap script') + '\n})();';
    try { new Function(ovJs); } catch (e) { throw new Error('build: the EvOverlap script cut from index.html does not parse (cut short at an inner line-start IIFE end?): ' + e.message); }   /* a cut that ends early must fail the build, not the page */
    if (!/\bbind\s*[:=]/.test(ovJs) || !/\bmark\s*[:=]/.test(ovJs)) throw new Error('build: the EvOverlap script cut from index.html has no bind / mark');
    return { 'EvOverlap css': '<style data-master="EvOverlap">/* from index.html (tools/build.js): Design system -> General layout -> Header overlap, and the Overview bar blur bands it draws on */\n' + gnd.join('\n') + '\n  ' + ovCss + '\n</style>',
             'EvOverlap js': '<script data-master="EvOverlap">/* from index.html (tools/build.js): the header overlap master, its saved setup (everlab:hoMaster) applied on load */\n' + ovJs + '\n</script>',
             /* the phone's drawn keyboard (EvKbd), for the Chat page: the Overview's own keys, not a second keyboard ("Use same keyboard as the overview top chat field"); its CSS section "Phone keyboard" and the window.EvKbd IIFE */
             'EvKbd css': '<style data-master="EvKbd">/* from index.html (tools/build.js): Design system -> the phone keyboard */\n  ' + cut('/* ---- Phone keyboard (EvKbd;', '/* ---- end Phone keyboard ---- */', 'the phone keyboard CSS') + '\n</style>',
             'EvKbd js': (() => { const j = cut('window.EvKbd = (function () {', '\n})();', 'the EvKbd script') + '\n})();'; try { new Function(j); } catch (e) { throw new Error('build: the EvKbd script cut from index.html does not parse: ' + e.message); } if (!/\bhtml\s*:/.test(j) || !/\bwire\s*:/.test(j)) throw new Error('build: the EvKbd script cut from index.html has no html / wire'); return '<script data-master="EvKbd">/* from index.html (tools/build.js): the phone keyboard master */\n' + j + '\n</script>'; })() }; })();
  const withMasters = (txt, n) => txt.replace(/<!--ev:master ([A-Za-z]+ (?:css|js))-->/g, (m, k) => { if (!masters[k]) throw new Error('build: no master ' + k + ' for ' + n); return masters[k]; });
  /* the Concierge page, its pictures inlined and its masters put in (the phone keyboard, EvKbd: <!--ev:master EvKbd css--> / js) */
  { const [cc, n] = inline(withMasters(fs.readFileSync(path.join(root, 'visuals', 'concierge.html'), 'utf8'), 'concierge'));
    if (!cc.includes('data-master="EvKbd"')) throw new Error('build: the Concierge page did not get the EvKbd master');
    fs.writeFileSync(path.join(root, 'dist', 'concierge.html'), cc);
    console.log('concierge ' + kb(cc.length) + '  (' + n + ' pictures inlined, the EvKbd master put in, dist/concierge.html)'); }
  for (const n of ['gift', 'clinic', 'gift-receipt', 'referral', 'chat-video']){ const [t0, k] = inline(withMasters(fs.readFileSync(path.join(root, 'visuals', n + '.html'), 'utf8'), n)), [t, nf] = inlineFonts(t0);   // the Clinic's logos (assets/clinic/) inlined; the fonts too; a master where a page asks for one
    fs.writeFileSync(path.join(root, 'dist', n + '.html'), t);
    console.log(n + ' ' + kb(t.length) + '  (' + k + ' pictures, ' + nf + ' font files inlined, dist/' + n + '.html)'); }
  require('./build-hp.js');   // the Health profile on its own page, from the same source: every build makes both
})().catch(e => { console.error(e); process.exit(1); });
