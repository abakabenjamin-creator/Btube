// Render the graphics layer for every output frame (30 fps, cut timeline).
// Presenter frames -> PNG with alpha; card / web frames -> opaque JPEG.
// usage: node render.js <outDir> <workers> [first last] [--every N]
'use strict';
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const out = args[0], workers = +args[1] || 4;
const tl = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'timeline.json')));
const first = args[2] && !args[2].startsWith('--') ? +args[2] : 0;
const last = args[3] && !args[3].startsWith('--') ? +args[3] : tl.length - 1;
const every = args.includes('--every') ? +args[args.indexOf('--every') + 1] : 1;
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--allow-file-access-from-files'] });
  const frames = [];
  for (let n = first; n <= last; n += every) frames.push(n);
  const chunk = Math.ceil(frames.length / workers);
  let done = 0;
  const t0 = Date.now();
  const meta = {};
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const mine = frames.slice(w * chunk, (w + 1) * chunk);
    if (!mine.length) return;
    const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto('file://' + path.join(__dirname, 'index.html'));
    await p.evaluate(() => R2.ready());
    await p.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
    for (const n of mine) {
      const info = await p.evaluate(t => R2.frame(t), tl[n]);
      const file = path.join(out, String(n).padStart(6, '0') + (info.alpha ? '.png' : '.jpg'));
      await p.screenshot({ path: file, type: info.alpha ? 'png' : 'jpeg', quality: info.alpha ? undefined : 92, omitBackground: info.alpha });
      meta[n] = info;
      if (++done % 300 === 0) console.log(`${done}/${frames.length} ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    await p.close();
  }));
  fs.writeFileSync(path.join(out, `meta_${first}_${last}.json`), JSON.stringify(meta));
  await browser.close();
  console.log(`done ${done} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
