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
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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
  console.log('html  ' + kb(htmlIn) + ' -> ' + kb(htmlOut));
  console.log('css   ' + kb(cssIn) + ' -> ' + kb(cssOut));
  console.log('js    ' + kb(jsIn) + ' -> ' + kb(jsOut));
  console.log('total ' + kb(src.length) + ' -> ' + kb(out.length) + '  (dist/index.html)');
})().catch(e => { console.error(e); process.exit(1); });
