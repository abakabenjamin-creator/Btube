// Screenshot original source pages with the key line highlighted (yellow mark, red outline) -> assets/receipts/<name>.png (3840x2160)
const { chromium } = require('playwright'); const fs = require('fs');
const LIST = JSON.parse(fs.readFileSync(process.argv[2]));
(async () => {
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  fs.mkdirSync('assets/receipts', { recursive: true });
  for (const r of LIST) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
    const pg = await ctx.newPage();
    try {
      await pg.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await pg.waitForTimeout(4000);
      const ok = await pg.evaluate(([phrase, sel]) => {
        document.querySelectorAll('*').forEach(el => { const s = getComputedStyle(el); if ((s.position === 'fixed' || s.position === 'sticky') && el.tagName !== 'HTML') el.remove(); });
        document.querySelectorAll('[id*=cookie],[class*=cookie],[id*=consent],[class*=consent],[class*=modal],[id*=onetrust]').forEach(e => e.remove());
        document.body.style.overflow = 'auto';
        const roots = sel ? [...document.querySelectorAll(sel), document.body] : [document.body];
        for (const root of roots) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) { const i = n.nodeValue.indexOf(phrase); if (i < 0) continue; const el = n.parentElement; if (!el || el.offsetParent === null) continue;
          const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + phrase.length);
          const m = document.createElement('mark'); m.style.cssText = 'background:#FFD400;color:#000;outline:4px solid #E10600;outline-offset:3px;border-radius:3px;padding:0 3px';
          rg.surroundContents(m); m.scrollIntoView({ block: 'center' }); return true; } }
        return false; }, [r.phrase, r.sel || null]);
      await pg.waitForTimeout(800);
      await pg.screenshot({ path: `assets/receipts/${r.name}.png` });
      console.log(r.name, ok ? 'highlighted' : 'PHRASE NOT FOUND', (await pg.title()).slice(0, 70));
    } catch (e) { console.log(r.name, 'FAILED', e.message.slice(0, 120)); }
    await ctx.close();
  }
  await b.close();
})();
