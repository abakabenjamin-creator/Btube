// Render the graphics layer (transparent PNG frames) for 'Five Rules of Money'.
//   node build/render.js stills <t1,t2,...> <outdir>        -> PNG per time
//   node build/render.js pipe <t0> <t1> <fps>               -> PNG frames on stdout (for ffmpeg)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const [mode, a, b, c] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] });
  const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('pageerror', e => { console.error('PAGEERROR', e.message); process.exit(2); });
  await pg.goto('file://' + ROOT + '/web/index.html');
  await pg.evaluate(async () => { for (const w of [600, 700, 800, 900]) await document.fonts.load(`${w} 40px "Inter"`); await document.fonts.ready; });
  const scenes = JSON.parse(fs.readFileSync(`${ROOT}/build/scenes.json`));
  console.error('images', await pg.evaluate(l => loadImages(l), scenes.images || []));
  console.error('setup', JSON.stringify(await pg.evaluate(s => setup(s), scenes)));
  const grab = async t => Buffer.from((await pg.evaluate(t => { drawAt(t); return document.getElementById('c').toDataURL('image/png'); }, t)).split(',')[1], 'base64');
  if (mode === 'stills') {
    fs.mkdirSync(b, { recursive: true });
    for (const t of a.split(',').map(Number)) fs.writeFileSync(`${b}/g_${t.toFixed(2).padStart(7, '0')}.png`, await grab(t));
  } else if (mode === 'pipe') {
    const fps = +c, f0 = Math.round(+a * fps), f1 = Math.round(+b * fps), t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const buf = await grab(f / fps);
      if (!process.stdout.write(buf)) await new Promise(r => process.stdout.once('drain', r));
      if ((f - f0) % 500 === 0) console.error(`frames ${a}-${b}: ${f - f0}/${f1 - f0} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  await browser.close();
})();
