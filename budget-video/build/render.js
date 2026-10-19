// Role 7 helper: renders the compositor frame-by-frame.
//   node build/render.js stills 3.2,10,44.5 out/stills
//   node build/render.js video <startSec> <endSec> <out.mp4>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FPS = 30;

function opts() {
  const tl = JSON.parse(fs.readFileSync(`${ROOT}/build/timeline.json`));
  const words = JSON.parse(fs.readFileSync(`${ROOT}/build/words.json`)).words;
  const avDir = `${ROOT}/assets/avatar_frames`;
  const nAv = fs.existsSync(avDir) ? fs.readdirSync(avDir).filter(f => f.endsWith('.jpg')).length : 0;
  const broll = {};
  const bdir = `${ROOT}/assets/broll`;
  if (fs.existsSync(bdir)) for (const c of fs.readdirSync(bdir)) broll[c] = fs.readdirSync(`${bdir}/${c}`).filter(f => f.endsWith('.jpg')).length;
  const face = fs.existsSync(`${ROOT}/assets/face.json`) ? JSON.parse(fs.readFileSync(`${ROOT}/assets/face.json`)) : null;
  return { tl, words, nAv, broll, face };
}

async function page() {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--force-color-profile=srgb'] });
  const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('pageerror', e => console.error('PAGEERROR', e.message));
  await pg.goto('file://' + ROOT + '/web/index.html');
  const o = opts();
  const info = await pg.evaluate(async ({ tl, words, nAv, broll, face }) => {
    const avsrc = nAv ? (i => `../assets/avatar_frames/f_${String(Math.min(i, nAv - 1) + 1).padStart(6, '0')}.jpg`) : (() => '../assets/placeholder/av.jpg');
    return await build(tl, words, { avsrc, broll, face });
  }, o);
  return { browser, pg, info, o };
}

(async () => {
  const [mode, a, b, c] = process.argv.slice(2);
  const { browser, pg, info, o } = await page();
  console.error('built', JSON.stringify(info), 'avatar frames:', o.nAv);
  if (mode === 'stills') {
    fs.mkdirSync(b, { recursive: true });
    for (const t of a.split(',').map(Number)) {
      await pg.evaluate(t => renderAt(t), t);
      await pg.screenshot({ path: `${b}/t_${t.toFixed(2).padStart(7, '0')}.jpg`, type: 'jpeg', quality: 88 });
    }
  } else if (mode === 'video') {
    const t0 = +a, t1 = +b;
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), c], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS);
    const cdp = await pg.context().newCDPSession(pg);
    const start = Date.now();
    for (let f = f0; f < f1; f++) {
      await pg.evaluate(t => renderAt(t), f / FPS);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 300 === 0) console.error(`${c}: frame ${f - f0}/${f1 - f0} ${((Date.now() - start) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  } else if (mode === 'sfx') {
    fs.writeFileSync(a, JSON.stringify(await pg.evaluate(() => ({ sfx: window.SFX, segs: window.SEGS }))));
  }
  await browser.close();
})();
