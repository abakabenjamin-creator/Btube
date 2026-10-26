// Overlays drawn over the presenter (transparent PNG frames). Everything sits
// high above shoulder level or beside him on the right; never over the face.
'use strict';

const SIDE_X = 1440;

// Rows that build in one at a time inside a side card.
function sideRows(card, rows, o = {}) {
  return rows.map(([html, tt], i) => {
    const r = el(card, 'row');
    css(r, { marginTop: i ? '18px' : (o.first || '24px'), alignItems: 'flex-start' });
    const ic = el(r, o.mark === 'x' ? '' : 'check');
    if (o.mark === 'x') { css(ic, { width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(224,96,90,0.16)', border: '1.5px solid #e0605a', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', padding: '6px' }); ic.innerHTML = IC.cross('#ef8a85'); }
    else ic.innerHTML = IC.check('#48d8a8');
    const tx = el(r, 'h3', html); css(tx, { fontSize: (o.size || 28) + 'px', lineHeight: 1.25 });
    return { r, tt };
  });
}

// ------------------------------------------------------------- B01 hook
overlayScene('ov_hook', 'B01', (S, ui) => {
  S.eb = el(ui, 'eyebrow', 'The best investment isn’t…'); place(S.eb, SIDE_X + 10, 150, 440); css(S.eb, { fontSize: '22px', color: '#d8d8d8' });
  S.items = [['A stock', 2.7], ['A house', 3.46], ['Not even a business', 4.7]].map(([txt, tt], i) => {
    const c = el(ui, 'chip'); c.innerHTML = txt; place(c, SIDE_X, 200 + i * 96); css(c, { fontSize: '34px', padding: '18px 32px' });
    const line = el(c, 'abs'); css(line, { left: '22px', right: '22px', top: '50%', height: '3px', background: '#e0605a', transformOrigin: '0 50%', boxShadow: '0 0 10px rgba(224,96,90,0.8)' });
    return { c, line, tt };
  });
  S.items.forEach(it => { pushEv(S, it.tt, 'tick'); pushEv(S, it.tt + 0.32, 'strike'); });
}, (t, S) => {
  fadeIn(S.eb, t, 2.12, 0.4, { exit: 5.45 });
  S.items.forEach(it => {
    fadeIn(it.c, t, it.tt, 0.35, { slide: 40, rise: 0, exit: 5.45 });
    const p = P(t, it.tt + 0.32, 0.3, E.outCubic);
    it.line.style.transform = `scaleX(${p})`;
    it.c.style.color = p > 0.5 ? '#8a8a8a' : '#f0f0f0';
    it.c.style.borderColor = p > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(72,216,168,0.85)';
    it.c.style.boxShadow = p > 0.5 ? 'none' : '0 0 22px rgba(72,216,168,0.22)';
  });
});

overlayScene('ov_stick', 'B02', (S, ui) => {
  S.st.push(sticker(ui, 'STICK AROUND', { shape: 'pill', x: 1460, y: 210, rot: -17, t0: 8.42, t1: 9.55 }));
  pushEv(S, 8.42, 'pop');
}, () => {});

// ------------------------------------------------------------ B04 recap
overlayScene('ov_recap', 'B04', (S, ui) => {
  const c = S.card = sideCard(ui, SIDE_X, 170, 440);
  c.innerHTML = `<div class="eyebrow label-yellow">Part 1 recap</div>
    <div class="h3" id="a" style="margin-top:20px;font-size:30px;line-height:1.25">Income doesn’t make you a millionaire.</div>
    <div class="h2" id="b" style="margin-top:22px;font-size:50px"><span class="hl" id="hl">Ownership does.</span></div>`;
  S.a = c.querySelector('#a'); S.b = c.querySelector('#b'); S.hl = c.querySelector('#hl');
  pushEv(S, 15.5, 'whoosh', { soft: 1 }); pushEv(S, 17.86, 'tick'); pushEv(S, 20.06, 'tick'); pushEv(S, 20.2, 'shimmer');
}, (t, S) => {
  enter(S.card, t, 15.45, { from: -18, rest: -4, slide: 60, exit: 21.25 });
  fadeIn(S.a, t, 17.86, 0.4); fadeIn(S.b, t, 20.06, 0.4, { sFrom: 0.9 });
  hl(S.hl, t, 20.2, 0.5);
});

// ------------------------------------------------------------ phone kit
const KEYS = [['AC', 'fn'], ['xʸ', 'fn'], ['%', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['0', '', 2], ['.'], ['=', 'op']];
// Phone on the right (centre ~72% of frame width), top edge visible.
function phone(ui, slide) {
  const ph = { slide };
  ph.grad = el(ui, 'abs');
  css(ph.grad, { left: '0', top: '0', width: '1920px', height: '1080px', background: 'linear-gradient(90deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 66%, rgba(0,0,0,0.82) 100%)' });
  ph.e = el(ui, 'phone'); place(ph.e, 1382 - 260, 40);
  el(ph.e, 'island');
  ph.scr = el(ph.e, 'screen');
  return ph;
}
function phoneUpdate(ph, t) {
  const [a, b] = ph.slide;
  const pin = P(t, a + 0.15, 0.5, E.outExpo);
  const pout = P(t, b - 0.45, 0.4, E.inOutCubic);
  ph.e.style.transform = `translate(${220 * (1 - pin) + 260 * pout}px, ${760 * (1 - pin) + 820 * pout}px) rotate(${4 * (1 - pin) + 5 * pout}deg)`;
  ph.e.style.opacity = t < a ? 0 : 1;
  const g = P(t, a, 0.6, E.inOutCubic) * (1 - P(t, b - 0.2, 0.5, E.inOutCubic));
  ph.grad.style.opacity = g.toFixed(3);
}

function calculator(ui, slide, spec) {
  const ph = phone(ui, slide);
  const d = el(ph.scr, 'abs'); css(d, { left: '30px', right: '30px', top: '86px', height: '300px', textAlign: 'right' });
  ph.hist = el(d, '', ''); css(ph.hist, { fontSize: '26px', color: '#606060', minHeight: '64px', lineHeight: 1.25 });
  ph.expr = el(d, '', ''); css(ph.expr, { fontSize: '40px', color: '#a8a8a8', marginTop: '18px', whiteSpace: 'nowrap', fontWeight: 500 });
  ph.res = el(d, '', ''); css(ph.res, { fontSize: '84px', color: '#48d8a8', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '6px', textShadow: '0 0 28px rgba(72,216,168,0.45)', whiteSpace: 'nowrap' });
  ph.sub = el(d, '', ''); css(ph.sub, { fontSize: '24px', color: '#d8d8d8', marginTop: '2px' });
  ph.keys = {};
  let col = 0, row = 0;
  for (const [k, cls, span] of KEYS) {
    const w = span === 2 ? 104 * 2 + 18 : 104;
    const e = el(ph.scr, 'key ' + (cls || '')); css(e, { left: 7 + col * 122 + 'px', top: 400 + row * 122 + 'px', width: w + 'px' });
    if (span === 2) css(e, { justifyContent: 'flex-start', paddingLeft: '40px' });
    e.textContent = k;
    const rp = el(e, 'abs'); css(rp, { borderRadius: '50%', background: 'rgba(255,255,255,0.35)', left: '50%', top: '50%', width: '10px', height: '10px', opacity: 0 });
    ph.keys[k] = { e, rp, cls };
    col += span || 1; if (col >= 4) { col = 0; row++; }
  }
  ph.spec = spec;
  return ph;
}
function calcUpdate(ph, t) {
  phoneUpdate(ph, t);
  const sp = ph.spec;
  for (const k in ph.keys) {
    const q = ph.keys[k];
    let b = 0;
    for (const tp of sp.taps) if (tp.key === k) b = Math.max(b, bump(t, tp.t - 0.02, 0.22));
    q.e.style.transform = `scale(${1 - 0.07 * b})`;
    q.e.style.filter = b > 0.01 ? `brightness(${1 + 0.9 * b})` : 'none';
    const last = sp.taps.filter(tp => tp.key === k && t >= tp.t).pop();
    if (last) { const p = clamp((t - last.t) / 0.4); const s = 10 + 150 * E.outCubic(p); css(q.rp, { width: s + 'px', height: s + 'px', marginLeft: -s / 2 + 'px', marginTop: -s / 2 + 'px', opacity: p < 1 ? (0.6 * (1 - p)).toFixed(2) : 0 }); }
  }
  let st = sp.states[0];
  for (const s of sp.states) if (t >= s.t) st = s;
  ph.hist.innerHTML = st.hist || '';
  ph.expr.innerHTML = st.expr || '';
  ph.expr.style.fontSize = Math.min(40, Math.floor(40 * 17 / Math.max(17, (st.expr || '').length))) + 'px';
  if (st.res) {
    const v = count(t, st.t, st.res.d || 0.8, st.res.v);
    ph.res.textContent = st.res.fmt(st.res.d === 0 ? st.res.v : v);
    const pr = P(t, st.t, 0.25);
    ph.res.style.opacity = pr;
  } else { ph.res.textContent = ''; }
  ph.sub.innerHTML = st.sub && t >= (st.subAt || st.t) ? st.sub : '';
  ph.sub.style.opacity = st.sub ? P(t, st.subAt || st.t, 0.35) : 0;
}
const money = v => '$' + fmt(Math.round(v));
function tapsToStates(taps) { return taps.filter(tp => tp.expr != null || tp.res).map(tp => ({ t: tp.t, expr: tp.expr, hist: tp.hist, res: tp.res, sub: tp.sub, subAt: tp.subAt })); }
function calcScene(id, beatId, taps, extra) {
  const b = BT(beatId);
  overlayScene(id, beatId, (S, ui) => {
    S.ph = calculator(ui, b.slide, { taps, states: [{ t: -1, expr: '' }].concat(tapsToStates(taps)) });
    taps.forEach(tp => pushEv(S, tp.t, tp.key === '=' ? 'confirm' : 'tap'));
    if (extra) extra.build(S, ui);
  }, (t, S) => { calcUpdate(S.ph, t); if (extra) extra.update(t, S); });
}

// B06: $1,000 a month at 8% for about 27 years (future value, yearly compounding)
(() => {
  const FV = 12000 * (Math.pow(1.08, 27) - 1) / 0.08; // 1,048,209
  const H1 = '1,000 × 12 = 12,000 / yr';
  calcScene('ov_calc1', 'B06', [
    { t: 27.95, key: '1', expr: '1' },
    { t: 28.4, key: '0', expr: '10' }, { t: 28.52, key: '0', expr: '100' }, { t: 28.64, key: '0', expr: '1,000' },
    { t: 29.0, key: '×', expr: '1,000 ×' }, { t: 29.13, key: '1', expr: '1,000 × 1' }, { t: 29.25, key: '2', expr: '1,000 × 12' },
    { t: 29.4, key: '=', expr: '1,000 × 12', res: { v: 12000, d: 0.5, fmt: v => fmt(Math.round(v)) }, sub: 'a month × 12 = per year' },
    { t: 29.62, key: '×', hist: H1, expr: '12,000 ×' }, { t: 29.74, key: '8', hist: H1, expr: '12,000 × 8' }, { t: 29.86, key: '%', hist: H1, expr: '12,000 × 8%' },
    { t: 32.3, key: '2', hist: H1, expr: '12,000 × 8% · 2' }, { t: 32.45, key: '7', hist: H1, expr: '12,000 × 8% · 27 yrs' },
    { t: 32.95, key: '=', hist: H1, expr: '12,000 × (1.08²⁷ − 1) ÷ 0.08', res: { v: FV, d: 0.9, fmt: money }, sub: 'roughly a million in about 27 years', subAt: 33.3 },
  ], {
    build(S, ui) { S.st.push(sticker(ui, 'ILLUSTRATION ONLY', { shape: 'pill', x: 860, y: 110, rot: -14, t0: 34.2, t1: 35.85 })); pushEv(S, 34.2, 'pop'); },
    update() {},
  });
})();

// B09: $20,000 sitting still for 10 years at 3.4% inflation
(() => {
  const PV = 20000 / Math.pow(1.034, 10); // 14,316
  calcScene('ov_calc2', 'B09', [
    { t: 47.3, key: '2', expr: '2' }, { t: 47.42, key: '0', expr: '20' }, { t: 47.52, key: '0', expr: '200' }, { t: 47.62, key: '0', expr: '2,000' }, { t: 47.72, key: '0', expr: '20,000' },
    { t: 48.4, key: '÷', expr: '20,000 ÷' },
    { t: 48.55, key: '1', expr: '20,000 ÷ 1' }, { t: 48.65, key: '.', expr: '20,000 ÷ 1.' }, { t: 48.75, key: '0', expr: '20,000 ÷ 1.0' }, { t: 48.85, key: '3', expr: '20,000 ÷ 1.03' }, { t: 48.95, key: '4', expr: '20,000 ÷ 1.034', sub: '3.4% inflation a year' },
    { t: 52.85, key: 'xʸ', expr: '20,000 ÷ 1.034^', sub: '3.4% inflation a year' },
    { t: 52.97, key: '1', expr: '20,000 ÷ 1.034¹', sub: '10 years from now' }, { t: 53.07, key: '0', expr: '20,000 ÷ 1.034¹⁰', sub: '10 years from now' },
    { t: 53.35, key: '=', expr: '20,000 ÷ 1.034¹⁰', res: { v: PV, d: 0.8, fmt: money }, sub: 'buys about what $14,300 buys today', subAt: 53.9 },
  ]);
})();

// B41: $5,000 on a card charging 20%
calcScene('ov_calc3', 'B41', [
  { t: 300.6, key: '5', expr: '5' }, { t: 300.97, key: '0', expr: '50' }, { t: 301.07, key: '0', expr: '500' }, { t: 301.17, key: '0', expr: '5,000' },
  { t: 301.9, key: '×', expr: '5,000 ×' }, { t: 302.25, key: '2', expr: '5,000 × 2' }, { t: 302.37, key: '0', expr: '5,000 × 20' }, { t: 302.5, key: '%', expr: '5,000 × 20%' },
  { t: 303.25, key: '=', expr: '5,000 × 20%', res: { v: 1000, d: 0.8, fmt: money }, sub: 'a year, gone, just in interest', subAt: 305.0 },
]);

// ------------------------------------------------------------ B14 costs
overlayScene('ov_costs', 'B14', (S, ui) => {
  const c = S.card = sideCard(ui, SIDE_X, 150, 440);
  el(c, 'eyebrow label-yellow', 'Then add');
  S.rows = sideRows(c, [['Down payment', 83.74], ['Repairs', 84.9], ['Insurance', 85.76], ['Taxes', 86.74], ['Months with no tenant', 87.78]]);
  S.st.push(sticker(ui, 'ANYTHING\nCAN BREAK', { shape: 'hex', x: 1330, y: 96, rot: -16, t0: 93.2, t1: 95.0 }));
  S.rows.forEach(r => pushEv(S, r.tt, 'tick')); pushEv(S, 82.7, 'whoosh', { soft: 1 }); pushEv(S, 93.2, 'pop');
}, (t, S) => {
  enter(S.card, t, 82.65, { from: -18, rest: -4, slide: 60, exit: 95.05 });
  S.rows.forEach(r => fadeIn(r.r, t, r.tt, 0.35, { slide: 30, rise: 0 }));
});

// ------------------------------------------------------------ B21 timing
overlayScene('ov_timeit', 'B21', (S, ui) => {
  const c = S.card = sideCard(ui, SIDE_X, 200, 440);
  c.innerHTML = `<div class="h2" style="font-size:44px">You can’t predict <span class="hl" id="hl">the wobble.</span></div>`;
  S.hl = c.querySelector('#hl');
  S.st.push(sticker(ui, 'DON’T\nTIME IT', { shape: 'hex', x: 1600, y: 120, rot: -15, t0: 140.06, t1: 143.3 }));
  pushEv(S, 138.0, 'whoosh', { soft: 1 }); pushEv(S, 138.92, 'shimmer'); pushEv(S, 140.06, 'pop');
}, (t, S) => {
  enter(S.card, t, 138.0, { from: -18, rest: -4, slide: 60, exit: 143.25 });
  hl(S.hl, t, 138.92, 0.5);
});

// ------------------------------------------------------------ B25 framed (ring) layout: left content
overlayScene('ov_framed_biz', 'B25', (S, ui) => {
  S.title = el(ui, 'framed-title', 'Your own<br>business can be…'); place(S.title, 130, 230, 980);
  S.rows = [['1', 'Income that has nothing to do with your day job', 164.58], ['2', 'An asset you sell or pass down', 168.92]].map(([n, txt, tt], i) => {
    const r = el(ui, 'framed-row'); place(r, 130, 480 + i * 122, 950);
    r.innerHTML = `<div class="tile">${n}</div><div class="txt">${txt}</div>`;
    return { r, tt };
  });
  pushEv(S, 164.0, 'whoosh', { soft: 1 }); S.rows.forEach(r => pushEv(S, r.tt, 'tick'));
}, (t, S) => {
  fadeIn(S.title, t, 164.0, 0.5, { rise: 24 });
  S.rows.forEach(r => { fadeIn(r.r, t, r.tt, 0.45, { slide: -40, rise: 0 }); r.r.style.background = t > r.tt + 0.2 ? '#d4d4d4' : '#e2e2e2'; });
});

// ------------------------------------------------------------ B29 start lean
overlayScene('ov_lean', 'B29', (S, ui) => {
  const c1 = S.c1 = sideCard(ui, SIDE_X - 20, 140, 460);
  el(c1, 'eyebrow', 'No sugarcoating');
  S.r1 = sideRows(c1, [['Businesses fail.', 202.64], ['It takes time.', 203.84], ['It takes money.', 204.92]], { mark: 'x' });
  const c2 = S.c2 = sideCard(ui, SIDE_X - 20, 140, 460);
  el(c2, 'eyebrow label-yellow', 'So');
  S.r2 = sideRows(c2, [['Start lean.', 208.56], ['Get paid early.', 209.56], ['Test the idea before you throw your savings at it.', 210.92], ['Never put in money you can’t afford to lose.', 213.7]], { size: 26 });
  S.r1.concat(S.r2).forEach(r => pushEv(S, r.tt, 'tick')); pushEv(S, 202.5, 'whoosh', { soft: 1 }); pushEv(S, 208.3, 'whoosh', { soft: 1 });
}, (t, S) => {
  enter(S.c1, t, 202.5, { from: -18, rest: -4, slide: 60, exit: 207.9 });
  S.r1.forEach(r => fadeIn(r.r, t, r.tt, 0.35, { slide: 30, rise: 0 }));
  enter(S.c2, t, 208.3, { from: -18, rest: -4, slide: 60, exit: 216.05 });
  S.r2.forEach(r => fadeIn(r.r, t, r.tt, 0.35, { slide: 30, rise: 0 }));
});

// ------------------------------------------------------------ B39 hype / diligence
overlayScene('ov_hype', 'B39', (S, ui) => {
  S.st.push(sticker(ui, 'IGNORE THE HYPE', { shape: 'pill', x: 1430, y: 200, rot: -16, t0: 279.6, t1: 284.6 }));
  S.st.push(sticker(ui, 'DO YOUR\nDILIGENCE', { shape: 'hex', x: 1460, y: 180, rot: -15, t0: 285.4, t1: 289.85 }));
  pushEv(S, 279.6, 'pop'); pushEv(S, 285.4, 'pop');
}, () => {});

// ------------------------------------------------------------ B44 savings app on phone
overlayScene('ov_phone_save', 'B44', (S, ui) => {
  const b = BT('B44');
  const ph = S.ph = phone(ui, b.slide);
  const s = ph.scr;
  s.innerHTML = `<div style="position:absolute;left:34px;right:34px;top:90px">
    <div class="eyebrow" style="font-size:18px">Account overview</div><div style="font-size:54px;font-weight:700;margin-top:6px">Savings</div>
    <div id="bal" style="margin-top:30px;border-radius:30px;background:linear-gradient(150deg,#2f3033,#242528);border:1px solid rgba(255,255,255,0.1);padding:28px">
      <div class="gray" style="font-size:22px">Savings account</div><div style="font-size:50px;font-weight:700;margin-top:8px;letter-spacing:0.08em">$ ••••••</div></div>
    <div id="rate" style="margin-top:22px;border-radius:26px;background:#1f2023;border:1.5px solid rgba(255,255,255,0.1);padding:26px 28px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:26px;font-weight:600">Interest rate</div><div class="gray" style="font-size:20px;margin-top:4px">What it’s paying today</div></div>
      <div id="rv" style="font-size:44px;font-weight:700">≈ 0%</div></div>
    <div id="tag" style="margin-top:14px;font-size:22px;color:#ef8a85;font-weight:600">Close to nothing</div>
    <div id="mv" class="btn" style="position:relative;display:block;text-align:center;margin-top:40px;font-size:28px;padding:26px 20px">Move to high-yield savings</div>
    <div id="ok" style="margin-top:22px;border-radius:26px;border:1.5px solid #48d8a8;background:rgba(72,216,168,0.12);padding:24px 26px;display:flex;gap:16px;align-items:center;box-shadow:0 0 24px rgba(72,216,168,0.3)">
      <div class="check">${IC.check('#48d8a8')}</div><div style="font-size:26px;font-weight:600">High-yield savings account</div></div>
  </div>`;
  S.rate = s.querySelector('#rate'); S.rv = s.querySelector('#rv'); S.tag = s.querySelector('#tag'); S.mv = s.querySelector('#mv'); S.ok = s.querySelector('#ok');
  S.rip = el(ui, 'ripple');
  pushEv(S, 336.9, 'shimmer'); pushEv(S, 338.6, 'tick'); pushEv(S, 340.85, 'tap'); pushEv(S, 341.35, 'confirm');
}, (t, S) => {
  phoneUpdate(S.ph, t);
  const on = t > 336.9;
  S.rate.style.borderColor = on ? '#48d8a8' : 'rgba(255,255,255,0.1)';
  S.rate.style.boxShadow = on ? '0 0 26px rgba(72,216,168,0.35)' : 'none';
  S.tag.style.opacity = P(t, 338.6, 0.35);
  S.rv.style.color = t > 338.6 ? '#ef8a85' : '#f0f0f0';
  const pr = press(t, 340.85); S.mv.style.transform = `scale(${pr.s})`;
  S.mv.style.boxShadow = `0 0 ${40 + 70 * bump(t, 340.85, 0.6)}px rgba(72,216,168,${0.55 + 0.4 * bump(t, 340.85, 0.6)})`;
  fadeIn(S.ok, t, 341.35, 0.4, { sFrom: 0.9 });
  // tap ripple on the button (screen coords follow the phone transform only once it has settled)
  const p = clamp((t - 340.85) / 0.45), size = 30 + 160 * E.outCubic(p);
  css(S.rip, { width: size + 'px', height: size + 'px', left: (1382 - size / 2) + 'px', top: (765 - size / 2) + 'px', opacity: t < 340.85 || p >= 1 ? 0 : (0.75 * (1 - p)).toFixed(2) });
});

// ------------------------------------------------------------ B47 split the 20,000
overlayScene('ov_split', 'B47', (S, ui) => {
  const c = S.card = sideCard(ui, SIDE_X - 30, 130, 470);
  c.innerHTML = `<div class="h3" style="font-size:32px;line-height:1.22">You don’t have to invest <span class="hl" id="hl">all 20,000</span> at once.</div>`;
  S.hl = c.querySelector('#hl');
  S.rows = sideRows(c, [['Emergencies or things coming up soon', 368.88], ['Building your skills or testing a business idea', 372.5], ['A plan around your real life', 375.74]], { size: 25, first: '26px' });
  pushEv(S, 363.7, 'whoosh', { soft: 1 }); pushEv(S, 364.8, 'shimmer'); S.rows.forEach(r => pushEv(S, r.tt, 'tick'));
}, (t, S) => {
  enter(S.card, t, 363.7, { from: -18, rest: -4, slide: 60, exit: 379.6 });
  hl(S.hl, t, 364.76, 0.6);
  S.rows.forEach(r => fadeIn(r.r, t, r.tt, 0.35, { slide: 30, rise: 0 }));
});

// ------------------------------------------------------------ B51 comment keyword
overlayScene('ov_comment', 'B51', (S, ui) => {
  const c = S.card = sideCard(ui, SIDE_X, 190, 440);
  c.innerHTML = `<div class="eyebrow">Comment</div>
    <div class="row" style="margin-top:18px;gap:14px"><div class="pill" style="position:relative;height:96px;flex:1;padding:0 30px;font-size:46px;font-weight:700;letter-spacing:0.08em"><span id="w"></span></div>
    <div id="send" style="width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#30c0c0,#48d8a8);display:flex;align-items:center;justify-content:center;flex:none"><svg width="38" height="38" viewBox="0 0 24 24"><path d="M3 11 L21 3 L13 21 L11 13 Z" fill="#0b1512"/></svg></div></div>`;
  S.w = c.querySelector('#w'); S.send = c.querySelector('#send');
  S.letters = [['W', 401.44], ['E', 401.7], ['A', 401.95], ['L', 402.2], ['T', 402.45], ['H', 402.7]];
  S.st.push(sticker(ui, 'EXACT\nBLUEPRINT', { shape: 'hex', x: 1330, y: 110, rot: -16, t0: 404.3, t1: 408.05 }));
  S.letters.forEach(l => pushEv(S, l[1], 'key')); pushEv(S, 400.9, 'whoosh', { soft: 1 }); pushEv(S, 403.0, 'click'); pushEv(S, 404.3, 'pop');
}, (t, S) => {
  enter(S.card, t, 400.9, { from: -18, rest: -4, slide: 60, exit: 408.05 });
  const n = S.letters.filter(l => t >= l[1]).length;
  S.w.innerHTML = S.letters.slice(0, n).map(l => l[0]).join('') + (t < 403.0 && Math.floor(t * 2.2) % 2 === 0 ? '<span class="caret"></span>' : '');
  S.send.style.boxShadow = `0 0 ${20 + 50 * bump(t, 403.0, 0.6)}px rgba(72,216,168,${0.4 + 0.5 * bump(t, 403.0, 0.6)})`;
  S.send.style.transform = `scale(${press(t, 403.0).s})`;
});

// ------------------------------------------------------------ B52 subscribe
overlayScene('ov_end', 'B52', (S, ui) => {
  S.btn = el(ui, 'btn', 'Subscribe'); place(S.btn, 1480, 230);
  S.chip = el(ui, 'chip', 'Follow for more'); place(S.chip, 1490, 360);
  S.cur = cursor(ui, [{ t: 408.45, x: 1820, y: 640 }, { t: 408.85, x: 1600, y: 275 }, { t: 409.4, x: 1600, y: 275 }, { t: 409.9, x: 1840, y: 520 }]);
  S.cur.click(408.95, 1600, 275);
  pushEv(S, 408.45, 'whoosh', { soft: 1 }); pushEv(S, 408.95, 'click'); pushEv(S, 409.05, 'chime', { soft: 1 }); pushEv(S, 409.14, 'tick');
}, (t, S) => {
  fadeIn(S.btn, t, 408.45, 0.45, { sFrom: 0.85, exit: 411.55 });
  S.btn.style.transform += ` scale(${press(t, 408.95).s})`;
  S.btn.textContent = t > 408.95 ? 'Subscribed ✓' : 'Subscribe';
  fadeIn(S.chip, t, 409.14, 0.4, { slide: 30, rise: 0, exit: 411.55 });
  S.cur.update(t);
});
