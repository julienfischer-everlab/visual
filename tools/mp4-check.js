/* The Chat video builder's video export, end to end in headless Chromium (visuals/chat-video.html, ChatVideo.exportMp4; docs/chat-video.md). Each path makes a short
   composition, the dialog's Download is clicked, the file is saved and read by ffprobe: its codec, size, frame count and length must be the composition's.
     soft      the default here (this Chromium has no H.264 encoder): H.264 in software (h264-mp4-encoder) -> MP4, 1080 x 1920
     softWide  the same at 1920 x 1080, floating, light
     vp9mp4    WebCodecs -> mp4-muxer (prefer 'vp9-mp4': the MP4 path of a browser with H.264, run with VP9)
     webm      WebCodecs VP9 -> webm-muxer
     mr        MediaRecorder (no WebCodecs), paused between frames
     cancel    Esc during the frames: null, the dialog and the renderer gone
   The CDN libraries are served from the npm registry's copies of the same versions (kept in tools/.libcache, not committed), so it runs where the CDNs can't be reached.
   Serve the repo first (python3 -m http.server <port>), build dist/ for the dist page, then:
     NODE_PATH=<where playwright is> node tools/mp4-check.js [page url] [out dir] [paths...]
   Needs curl, tar and ffprobe. Exits 1 when a check fails. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const URL0 = process.argv[2] || 'http://127.0.0.1:9473/dist/chat-video.html';
const OUT = process.argv[3] || path.join(require('os').tmpdir(), 'mp4-check');
const ONLY = process.argv.slice(4);
const CACHE = path.join(__dirname, '.libcache');
const LIBS = [   /* [the page's CDN URL, npm package, version, file in the package] */
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/react\/18\.3\.1\/umd\/react\.production\.min\.js$/, 'react', '18.3.1', 'umd/react.production.min.js'],
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/react-dom\/18\.3\.1\/umd\/react-dom\.production\.min\.js$/, 'react-dom', '18.3.1', 'umd/react-dom.production.min.js'],
  [/cdn\.jsdelivr\.net\/npm\/htm@3\.1\.1\/dist\/htm\.umd\.js$/, 'htm', '3.1.1', 'dist/htm.umd.js'],
  [/cdn\.jsdelivr\.net\/npm\/mp4-muxer@5\.2\.2\/build\/mp4-muxer\.js$/, 'mp4-muxer', '5.2.2', 'build/mp4-muxer.js'],
  [/cdn\.jsdelivr\.net\/npm\/webm-muxer@5\.1\.4\/build\/webm-muxer\.js$/, 'webm-muxer', '5.1.4', 'build/webm-muxer.js'],
  [/cdn\.jsdelivr\.net\/npm\/h264-mp4-encoder@1\.0\.12\/embuild\/dist\/h264-mp4-encoder\.web\.js$/, 'h264-mp4-encoder', '1.0.12', 'embuild/dist/h264-mp4-encoder.web.js']
];
const libFile = (pkg, ver, file) => {   /* the package's tarball from the npm registry, unpacked once into its own folder */
  const dir = path.join(CACHE, pkg + '@' + ver), f = path.join(dir, 'package', file);
  if (fs.existsSync(f)) return f;
  fs.mkdirSync(dir, { recursive: true });
  const tgz = path.join(dir, 'pkg.tgz');
  cp.execFileSync('curl', ['-sSfL', '--max-time', '60', '-o', tgz, 'https://registry.npmjs.org/' + pkg + '/-/' + pkg + '-' + ver + '.tgz']);
  cp.execFileSync('tar', ['-xzf', tgz, '-C', dir]);
  if (!fs.existsSync(f)) throw new Error('mp4-check: ' + file + ' not in ' + pkg + '@' + ver);
  return f;
};
fs.mkdirSync(OUT, { recursive: true });
const SEQ = [
  { id: 'q1', type: 'user', text: 'Can you explain my latest blood results?', typing: 'none' },
  { id: 'a1', type: 'eva', text: 'There are a few markers worth looking at. Your LDL cholesterol is above the optimal range.', think: 600, hold: 900 },
  { id: 'w1', type: 'widget', widget: 'biomarker', hold: 700 }
];
const COMP = {
  phone: { v: 1, name: 'Check phone 9:16', format: { ratio: '9:16', w: 1080, h: 1920 }, background: { kind: 'color', color: '#1b1714' }, device: true, theme: 'dark', lead: 300, tail: 500, sequence: SEQ },
  wide: { v: 1, name: 'Check floating 16:9', format: { ratio: '16:9', w: 1920, h: 1080 }, background: { kind: 'color', color: '#f4f2ed' }, device: false, theme: 'light', lead: 300, tail: 500, sequence: SEQ }
};
const RUNS = {
  soft: { comp: 'phone', codec: 'h264', ext: 'mp4' },
  softWide: { comp: 'wide', codec: 'h264', ext: 'mp4' },
  vp9mp4: { comp: 'phone', prefer: 'vp9-mp4', codec: 'vp9', ext: 'mp4' },
  webm: { comp: 'wide', prefer: 'webm', codec: 'vp9', ext: 'webm' },
  mr: { comp: 'phone', prefer: 'mr', loose: true },
  cancel: { comp: 'phone', cancel: true }
};
const probe = f => JSON.parse(cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,profile,width,height:format=format_name,duration', '-of', 'json', f]).toString());
const count = f => +cp.execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f]).toString().trim();
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const files = LIBS.map(l => [l[0], libFile(l[1], l[2], l[3])]);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.route(u => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(u.href), route => {
    const m = files.find(x => x[0].test(route.request().url()));
    return m ? route.fulfill({ path: m[1], contentType: 'application/javascript; charset=utf-8', headers: { 'access-control-allow-origin': '*' } }) : route.abort();
  });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto(URL0);
  await p.waitForFunction(() => window.ChatVideo && window.ChatVideo.exportMp4 && window.ChatVideo.comp && document.querySelector('.cvb'), null, { timeout: 60000 });
  for (const k of (ONLY.length ? ONLY : Object.keys(RUNS))) {
    const r = RUNS[k], t0 = Date.now();
    await p.evaluate(([c, prefer]) => { window.__xp = window.ChatVideo.exportMp4({ comp: c, prefer }); }, [COMP[r.comp], r.prefer]);
    if (r.cancel) {
      await p.waitForFunction(() => { const b = document.querySelector('.xp .xpNum b'); return b && /^Frame [1-9]/.test(b.textContent); }, null, { timeout: 120000 });
      await p.keyboard.press('Escape');
      const res = await p.evaluate(() => window.__xp), gone = await p.evaluate(() => !document.querySelector('.xpBg') && !document.querySelector('iframe[title="MP4 renderer"]'));
      ok(res === null && gone, k + ': Esc cancels; the dialog and the renderer go (' + (Date.now() - t0) + ' ms)');
      continue;
    }
    await p.waitForSelector('.xp.ok, .xp.bad', { timeout: 600000 });
    const res = await p.evaluate(async () => { const x = await window.__xp; if (!x) return { fail: (document.querySelector('.xpNote') || {}).textContent }; const o = Object.assign({}, x); delete o.blob; return o; });
    if (res.fail != null) { ok(false, k + ': ' + res.fail); continue; }
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('.xp .dlgFt .btn.pri')]);
    const f = path.join(OUT, k + '-' + dl.suggestedFilename()); await dl.saveAs(f);
    await p.click('.xp .dlgFt .btn:not(.pri)');
    const pr = probe(f), st = pr.streams[0] || {}, fm = pr.format || {}, nf = count(f), d = +fm.duration;
    console.log('     ' + k + ': ' + (res.label || 'video') + ' / ' + res.container + ' by ' + res.encoder + ', ' + res.frames + ' frames, ' + (res.bytes / 1024).toFixed(0) + ' KB, made in ' + (res.renderMs / 1000).toFixed(1) + ' s');
    console.log('     ffprobe: ' + st.codec_name + ' ' + (st.profile || '') + ' ' + st.width + 'x' + st.height + ', ' + d + ' s, ' + nf + ' frames, ' + fm.format_name);
    const size = st.width === res.w && st.height === res.h && (r.loose ? Math.abs(nf - res.frames) <= 4 : nf === res.frames);   /* recorded as it plays: a frame or two may drop */
    if (r.loose) ok(size && Math.abs(d - res.duration / 1000) < .4, k + ': ' + path.basename(f) + ' is ' + st.codec_name + ' ' + st.width + 'x' + st.height + ', ' + d.toFixed(2) + ' s, ' + nf + ' frames (recorded as it plays; composition ' + (res.duration / 1000).toFixed(2) + ' s, ' + res.frames + ' frames)');
    else ok(size && st.codec_name === r.codec && path.extname(f) === '.' + r.ext && Math.abs(d - res.frames / 30) < .08 && Math.abs(res.frames / 30 - res.duration / 1000) <= 1 / 30,
      k + ': ' + path.basename(f) + ' is ' + st.codec_name + ' ' + st.width + 'x' + st.height + ', ' + d.toFixed(3) + ' s, ' + nf + ' frames (composition ' + (res.duration / 1000).toFixed(3) + ' s)');
  }
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 4).join(' / ') : ''));
  await b.close();
  console.log(fails ? fails + ' failed · files in ' + OUT : 'all passed · files in ' + OUT);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
