// Render scenes to frame sequences with headless Chromium.
// usage: node render.js <outDir> <workers> [sceneId ...|all] [--every N] [--only t1,t2]
'use strict';
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const args = process.argv.slice(2);
const out = args[0];
const workers = +args[1] || 4;
let ids = args.slice(2).filter(a => !a.startsWith('--') && !/^[\d.,]+$/.test(a));
const every = args.includes('--every') ? +args[args.indexOf('--every') + 1] : 1;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',').map(Number) : null;
const url = 'file://' + path.join(__dirname, 'engine.html');

(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--force-color-profile=srgb'] });
  const mk = async () => {
    const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await p.goto(url);
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
    return p;
  };
  const probe = await mk();
  const dur = await probe.evaluate(() => window.BEATS_JSON.duration);
  if (!ids.length || ids[0] === 'all') ids = await probe.evaluate(() => R.list());
  const jobs = [];
  for (const id of ids) {
    const info = await probe.evaluate(i => R.info(i), id);
    const dir = path.join(out, id);
    fs.mkdirSync(dir, { recursive: true });
    const ev = await probe.evaluate(i => R.show(i), id);
    fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(ev));
    fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify(info));
    let frames = [];
    if (only) frames = only.map(t => Math.round(t * FPS));
    else {
      const last = Math.floor(dur * FPS) - 1;
      for (let n = Math.max(0, Math.ceil(info.t0 * FPS)); n <= Math.min(last, Math.floor(info.t1 * FPS)); n += every) frames.push(n);
    }
    const chunk = Math.ceil(frames.length / workers);
    for (let i = 0; i < frames.length; i += chunk) jobs.push({ id, info, dir, frames: frames.slice(i, i + chunk) });
  }
  await probe.close();
  let done = 0, total = jobs.reduce((a, j) => a + j.frames.length, 0);
  const t0 = Date.now();
  const worker = async () => {
    const p = await mk();
    while (jobs.length) {
      const j = jobs.shift();
      await p.evaluate(i => R.show(i), j.id);
      for (const n of j.frames) {
        await p.evaluate(t => R.frame(t), n / FPS);
        const ext = j.info.alpha ? 'png' : 'jpg';
        const file = path.join(j.dir, String(n).padStart(6, '0') + '.' + ext);
        await p.screenshot({ path: file, type: j.info.alpha ? 'png' : 'jpeg', quality: j.info.alpha ? undefined : 93, omitBackground: j.info.alpha });
        done++;
        if (done % 200 === 0) console.log(`${done}/${total} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
      }
    }
    await p.close();
  };
  await Promise.all(Array.from({ length: workers }, worker));
  await browser.close();
  console.log(`done ${done} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
