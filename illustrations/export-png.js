#!/usr/bin/env node
// Render SVG illustrations to transparent PNGs at 2x their view-box size.
//
//   node illustrations/export-png.js                 # every SVG under illustrations/
//   node illustrations/export-png.js a.svg b.svg     # just these
//
// Needs Playwright with a Chromium build (`npm i -D playwright`).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCALE = 2;

function findSvgs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findSvgs(p);
    return e.name.endsWith('.svg') ? [p] : [];
  });
}

(async () => {
  const files = process.argv.length > 2 ? process.argv.slice(2) : findSvgs(__dirname);
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: SCALE });
  for (const file of files) {
    const svg = fs.readFileSync(file, 'utf8');
    const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    await page.setViewportSize({ width: Math.ceil(+w), height: Math.ceil(+h) });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    const out = file.replace(/\.svg$/, '.png');
    await page.locator('svg').first().screenshot({ path: out, omitBackground: true });
    console.log(`wrote ${path.relative(process.cwd(), out)} (${w * SCALE}x${h * SCALE})`);
  }
  await browser.close();
})();
