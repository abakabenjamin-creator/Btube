// Full-screen Glass UI segments (one per GLASS_UI beat). Word times are
// absolute seconds from transcript.json.
'use strict';

// Hero typing camera: slam onto the pill, track the caret as the text runs
// off frame, then a fast pull-back that reveals the whole line.
function typingCam(pill, tType, cps, tPull, o = {}) {
  const yC = pill.y + pill.h / 2;
  const n = t => clamp((t - tType) * cps, 0, pill.text.length);
  const caret = t => { const k = n(t), i = Math.floor(k), f = k - i; return lerp(pill.caretX(i), pill.caretX(i + 1), f); };
  const sBack = o.sBack || Math.min(0.62, 1700 / pill.w);
  const back = { x: pill.x + pill.w / 2 + (o.backDx || 0), y: yC + (o.backDy || 0), s: sBack };
  return t => {
    const S2 = o.zoom || 2.25;
    const track = { x: Math.max(pill.x + 960 / S2 - 40, caret(t) - 140), y: yC, s: S2 };
    if (o.pre && t < o.pre.t1) {
      const a = camKeys(o.pre.keys, t);
      if (t < o.pre.slam) return a;
      const q = E.outExpo(clamp((t - o.pre.slam) / (o.pre.t1 - o.pre.slam)));
      return { x: lerp(a.x, track.x, q), y: lerp(a.y, track.y, q), s: Math.exp(lerp(Math.log(a.s * 0.82), Math.log(S2), q)) };
    }
    if (t < tPull) return track;
    const q = E.outExpo(clamp((t - tPull) / 0.5));
    const k = { x: lerp(track.x, back.x, q), y: lerp(track.y, back.y, q), s: Math.exp(lerp(Math.log(S2), Math.log(back.s), q)) };
    if (o.after) { const a = o.after(t); if (a) return a; }
    return k;
  };
}

// The giant pill blurs away while the camera pulls back to the next layout.
function pillAway(pill, t, t0) {
  const q = P(t, t0, 0.45, E.inOutCubic);
  pill.p.style.opacity = (1 - q).toFixed(3);
  pill.p.style.filter = q > 0.01 ? `blur(${(18 * q).toFixed(1)}px)` : 'none';
}

// ============================================================ B03 disclaimer
glassScene('g_disclaimer', 'B03', 0, (S, cam, ui) => {
  S.card = objectCard(cam, 660, 330, 600, 420, { icon: 'shield', label: 'Quick note', title: 'Before we start', lines: 3 });
  S.pill = heroPill(cam, 2300, 330, 'This is for educational purposes only.');
  S.cur = cursor(cam, [{ t: 9.95, x: 1350, y: 930 }, { t: 10.45, x: 860, y: 405 }, { t: 10.75, x: 860, y: 405 }, { t: 11.0, x: 1500, y: 300 }]);
  S.cur.click(10.62, 860, 405);
  S.st.push(sticker(ui, 'NOT FINANCIAL\nADVICE', { shape: 'hex', x: 1330, y: 330, rot: -16, t0: 13.75, t1: 15.05 }));
  S.camf = typingCam(S.pill, 11.05, 20, 13.15, {
    pre: { keys: [{ t: 9.4, x: 960, y: 560, s: 1.02 }, { t: 10.9, x: 960, y: 540, s: 1.06 }], slam: 10.9, t1: 11.2 },
    sBack: 0.5, backDy: 60,
  });
  pushEv(S, 10.62, 'click'); pushEv(S, 10.92, 'whoosh'); pushEv(S, 11.05, 'keys', { n: 38, cps: 20 });
  pushEv(S, 13.15, 'whoosh'); pushEv(S, 13.75, 'pop');
}, (t, S) => {
  enter(S.card, t, 9.72, { dir: 1 });
  const pr = press(t, 10.62);
  S.card.style.transform += ` scale(${pr.s})`;
  S.card.classList.toggle('active-yellow', t > 10.62);
  typed(S.pill.span, S.pill.text, t, 11.05, 20);
  S.cur.update(t);
  camSet(S, t, S.camf, { ry0: -4, ry1: 2 });
});

// ============================================================ B08 inflation
glassScene('g_inflation', 'B08', 1, (S, cam, ui) => {
  const Q = 'Inflation in the U.S. was running at 3.4% in August.';
  S.pill = heroPill(cam, 300, 380, Q);
  // chat layout lives below/left of the pill in world space
  S.cx = 1500; S.cy = 1500;
  S.bubble = el(cam, 'bubble-user', 'Inflation in the U.S. · August'); place(S.bubble, S.cx - 40, S.cy - 360);
  S.dots = typingDots(cam, S.cx - 520, S.cy - 250);
  S.panel = el(cam, 'card pad active-mint'); place(S.panel, S.cx - 520, S.cy - 250, 900, null);
  S.panel.innerHTML = `<div class="eyebrow">Consumer prices · year over year</div>
    <div class="h1" style="margin-top:18px">Inflation in August <span class="reg gray">U.S.</span></div>
    <div style="font-size:150px;font-weight:700;letter-spacing:-0.03em;margin-top:6px"><span class="hl" id="hlv">3.4%</span><span class="cite" id="cite">1</span></div>
    <div class="body" style="margin-top:6px">Cash that sits still loses this much buying power each year.</div>`;
  S.hlv = S.panel.querySelector('#hlv'); S.cite = S.panel.querySelector('#cite');
  S.prev = previewCard(cam, S.cx + 470, S.cy - 300, { title: 'Consumer Price Index · August', body: 'U.S. annual inflation rate: 3.4%', badge: 'CPI', badgeColor: '#5b8def',
    spark: [[0, .3], [.15, .42], [.3, .38], [.45, .55], [.6, .5], [.75, .62], [.9, .7], [1, .72]] });
  S.cur = cursor(cam, [{ t: 44.75, x: S.cx + 600, y: S.cy + 300 }, { t: 45.15, x: S.cx - 70, y: S.cy - 35 }, { t: 45.4, x: S.cx - 70, y: S.cy - 35 }]);
  S.cur.click(45.25, S.cx - 70, S.cy - 35);
  S.st.push(sticker(ui, 'CHECKING SOURCES', { shape: 'pill', x: 1180, y: 130, rot: -18, t0: 45.35, t1: 46.9 }));
  S.camf = typingCam(S.pill, 40.85, 21, 43.45, {
    pre: { keys: [{ t: 40.4, x: 1300, y: 530, s: 1.4 }, { t: 40.9, x: 1250, y: 530, s: 1.6 }], slam: 40.5, t1: 40.9 },
    after: t => {
      if (t < 43.45) return null;
      const q = E.outExpo(clamp((t - 43.45) / 0.55));
      const s2 = 2.25;
      const a = { x: S.pill.caretX(Q.length) - 140, y: S.pill.y + S.pill.h / 2, s: s2 };
      const b = camKeys([{ t: 43.95, x: S.cx + 120, y: S.cy - 20, s: 1.22 }, { t: 45.4, x: S.cx + 160, y: S.cy - 20, s: 1.26 }, { t: 45.95, x: S.cx + 270, y: S.cy - 30, s: 1.1 }], t);
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    },
  });
  pushEv(S, 40.5, 'whoosh'); pushEv(S, 40.85, 'keys', { n: Q.length, cps: 21 }); pushEv(S, 43.45, 'whoosh');
  pushEv(S, 44.35, 'rise'); pushEv(S, 44.65, 'shimmer'); pushEv(S, 45.25, 'click'); pushEv(S, 45.35, 'pop'); pushEv(S, 45.55, 'whoosh', { soft: 1 });
}, (t, S) => {
  typed(S.pill.span, S.pill.text, t, 40.85, 21, { caretUntil: 43.6 });
  pillAway(S.pill, t, 43.5);
  fadeIn(S.bubble, t, 43.7, 0.4, { slide: 60, rise: 0 });
  S.dots.e.style.opacity = t > 43.85 && t < 44.35 ? 1 : 0; S.dots.update(t);
  enter(S.panel, t, 44.3, { from: 10, rest: 3, rise: 140, dir: -1 });
  reveal(S.panel, t, 44.3, 0.7);
  hl(S.hlv, t, 44.65, 0.5);
  S.cite.style.opacity = P(t, 44.95, 0.3);
  const pc = press(t, 45.25); S.cite.style.boxShadow = t > 45.2 ? '0 0 18px rgba(255,255,255,0.8)' : 'none'; S.cite.style.transform = `scale(${pc.s})`;
  enter(S.prev, t, 45.5, { from: -28, rest: -8, slide: 380, dir: 1 });
  S.cur.update(t);
  camSet(S, t, S.camf, { ry0: 3, ry1: -2 });
});

// ============================================================ B10 three paths
glassScene('g_three', 'B10', 2, (S, cam, ui) => {
  const Q = 'So where does the money actually go?';
  S.pill = heroPill(cam, 200, 300, Q);
  const y0 = 1150;
  S.cards = [
    objectCard(cam, 520, y0, 520, 400, { icon: 'house', label: 'Path 1', title: 'Real estate', lines: 2, grad: 'linear-gradient(135deg, rgba(232,224,112,0.4), rgba(90,30,30,0.5))' }),
    objectCard(cam, 1100, y0, 520, 400, { icon: 'chart', label: 'Path 2', title: 'Stocks', lines: 2 }),
    objectCard(cam, 1680, y0, 520, 400, { icon: 'brief', label: 'Path 3', title: 'Your own business', lines: 2, grad: 'linear-gradient(135deg, rgba(192,168,240,0.4), rgba(48,72,96,0.5))' }),
  ];
  S.times = [61.32, 62.22, 63.12];
  S.st.push(sticker(ui, 'THREE MAIN\nPLACES', { shape: 'hex', x: 150, y: 150, rot: -14, t0: 60.0, t1: 64.4 }));
  S.bubble = el(cam, 'bubble-user', 'So where does the money actually go?'); place(S.bubble, 1440, 980);
  S.camf = typingCam(S.pill, 57.65, 21, 59.45, {
    pre: { keys: [{ t: 57.2, x: 1000, y: 470, s: 1.5 }, { t: 57.55, x: 1000, y: 470, s: 1.7 }], slam: 57.3, t1: 57.62 },
    after: t => {
      if (t < 59.45) return null;
      const q = E.outExpo(clamp((t - 59.45) / 0.6));
      const a = { x: S.pill.caretX(Q.length) - 140, y: S.pill.y + S.pill.h / 2, s: 2.25 };
      const b = camKeys([{ t: 60.05, x: 1360, y: 1290, s: 1.0 }, { t: 64.6, x: 1400, y: 1330, s: 1.06 }], t);
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    },
  });
  pushEv(S, 57.3, 'whoosh'); pushEv(S, 57.65, 'keys', { n: Q.length, cps: 21 }); pushEv(S, 59.45, 'whoosh'); pushEv(S, 60.0, 'pop');
  S.times.forEach(tt => pushEv(S, tt, 'tick'));
}, (t, S) => {
  typed(S.pill.span, S.pill.text, t, 57.65, 21, { caretUntil: 59.6 });
  pillAway(S.pill, t, 59.5);
  fadeIn(S.bubble, t, 59.7, 0.4, { slide: 60, rise: 0 });
  S.cards.forEach((c, i) => {
    const active = i === S.cards.length - 1 ? t > S.times[i] + 0.3 : (t > S.times[i] + 0.3 && t < S.times[i + 1]);
    enter(c, t, S.times[i] - 0.05, { from: 26, rest: 8 - i * 4, z: -i * 60, rise: 120, dof: 0 });
    c.classList.toggle('active-yellow', active);
  });
  camSet(S, t, S.camf, { ry0: -3, ry1: 3 });
});

// ============================================================ B13 mortgage
glassScene('g_mortgage', 'B13', 3, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad');
  place(c, 360, 250, 1200, 600);
  c.innerHTML = `<div class="row"><div id="ic"></div><div class="eyebrow">Average 30-year mortgage</div></div>
    <div style="display:flex;gap:40px;margin-top:26px">
      <div style="width:520px"><div style="font-size:170px;font-weight:700;letter-spacing:-0.04em;line-height:1"><span class="hl" id="hlv"><span id="val">6.00</span>%</span><span class="cite" id="cite">1</span></div>
      <div class="chip" id="oct" style="position:relative;display:inline-block;margin-top:26px">October 1st</div>
      <div class="body" id="prev" style="margin-top:26px"><span class="white" style="font-weight:600">6.34%</span> &nbsp;a year earlier</div></div>
      <div id="chart" style="position:relative;width:540px;height:330px;margin-top:20px"></div>
    </div>`;
  iconTile(c.querySelector('#ic'), 'house', 64);
  S.val = c.querySelector('#val'); S.hlv = c.querySelector('#hlv'); S.cite = c.querySelector('#cite');
  S.oct = c.querySelector('#oct'); S.prevr = c.querySelector('#prev');
  S.chart = lineChart(c.querySelector('#chart'), [[0, .18], [.12, .24], [.25, .2], [.38, .33], [.5, .38], [.62, .36], [.75, .55], [.88, .7], [1, .86]], { w: 540, h: 330 });
  S.prev = previewCard(cam, 1640, 300, { title: 'Weekly mortgage rate survey', body: '30-year fixed: 7.28% (Oct 1) vs 6.34% a year earlier', badge: 'PDF', badgeColor: '#d9534f',
    spark: [[0, .2], [.2, .25], [.4, .35], [.6, .4], [.8, .62], [1, .85]] });
  S.st.push(sticker(ui, 'SAME HOUSE,\nMORE COST', { shape: 'hex', x: 160, y: 700, rot: -15, t0: 80.0, t1: 82.6 }));
  S.cur = cursor(cam, [{ t: 80.5, x: 1100, y: 760 }, { t: 80.95, x: 935, y: 395 }, { t: 81.4, x: 935, y: 395 }, { t: 81.9, x: 1300, y: 700 }]);
  S.cur.click(81.05, 935, 395);
  S.camk = [{ t: 71.0, x: 960, y: 560, s: 0.94 }, { t: 79.7, x: 1000, y: 560, s: 1.0 }, { t: 80.15, x: 640, y: 450, s: 2.3, e: 'expo' },
    { t: 80.9, x: 660, y: 450, s: 2.45 }, { t: 81.45, x: 1220, y: 560, s: 0.8, e: 'expo' }, { t: 82.8, x: 1260, y: 560, s: 0.83 }];
  pushEv(S, 71.3, 'rise'); pushEv(S, 73.35, 'count', { d: 1.25 }); pushEv(S, 75.2, 'tick'); pushEv(S, 76.5, 'rise', { soft: 1 });
  pushEv(S, 79.75, 'whoosh'); pushEv(S, 80.2, 'shimmer'); pushEv(S, 80.0, 'pop'); pushEv(S, 81.05, 'click'); pushEv(S, 81.4, 'whoosh');
}, (t, S) => {
  enter(S.card, t, 71.35, { from: 22, rest: 5 });
  S.val.textContent = count(t, 73.35, 1.25, 7.28, 6.0).toFixed(2);
  S.hlv.style.opacity = P(t, 73.3, 0.25);
  fadeIn(S.oct, t, 75.2, 0.4);
  fadeIn(S.prevr, t, 77.0, 0.4);
  S.chart.update(P(t, 76.5, 2.6, E.inOutCubic));
  hl(S.hlv, t, 80.2, 0.5);
  S.cite.style.opacity = P(t, 80.55, 0.3);
  S.cite.style.boxShadow = t > 81.0 ? '0 0 18px rgba(255,255,255,0.85)' : 'none';
  enter(S.prev, t, 81.35, { from: -28, rest: -8, slide: 420 });
  S.cur.update(t);
  camSet(S, t, S.camk, { ry0: -3, ry1: 2 });
});

// ============================================================ B15 leverage
glassScene('g_leverage', 'B15', 4, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad');
  place(c, 560, 180, 800, 720);
  c.innerHTML = `<div class="row"><div id="ic"></div><div class="eyebrow label-yellow">Leverage</div></div>
    <div class="h2" style="margin-top:20px">Borrowed money <span class="reg gray">multiplies</span></div>
    <div style="position:relative;height:440px;margin-top:20px">
      <div style="position:absolute;left:0;right:0;top:220px;height:2px;background:rgba(255,255,255,0.18)"></div>
      <div id="g" style="position:absolute;left:150px;width:170px;bottom:220px;height:0;border-radius:18px 18px 4px 4px;background:linear-gradient(180deg,#48d8a8,rgba(48,192,192,0.5));box-shadow:0 0 30px rgba(72,216,168,0.55)"></div>
      <div id="l" style="position:absolute;left:420px;width:170px;top:222px;height:0;border-radius:4px 4px 18px 18px;background:linear-gradient(0deg,#e0605a,rgba(90,30,30,0.6));box-shadow:0 0 30px rgba(224,96,90,0.5)"></div>
      <div id="gl" class="h3 mint" style="position:absolute;left:150px;top:228px;width:170px;text-align:center">Gains</div>
      <div id="ll" class="h3" style="position:absolute;left:420px;top:176px;width:170px;text-align:center;color:#ef8a85">Losses</div>
    </div>`;
  iconTile(c.querySelector('#ic'), 'bolt', 64, 'linear-gradient(135deg, rgba(232,224,112,0.45), rgba(90,30,30,0.5))');
  S.g = c.querySelector('#g'); S.l = c.querySelector('#l'); S.gl = c.querySelector('#gl'); S.ll = c.querySelector('#ll');
  S.st.push(sticker(ui, 'CUTS BOTH WAYS', { shape: 'pill', x: 1240, y: 160, rot: -18, t0: 99.35, t1: 100.75 }));
  pushEv(S, 95.5, 'rise'); pushEv(S, 96.1, 'rise', { soft: 1 }); pushEv(S, 98.66, 'fall'); pushEv(S, 99.35, 'pop');
}, (t, S) => {
  enter(S.card, t, 95.45, { from: -22, rest: -6, dir: 1 });
  S.g.style.height = (200 * P(t, 96.1, 0.9, E.outCubic)) + 'px';
  S.l.style.height = (200 * P(t, 98.66, 0.9, E.outCubic)) + 'px';
  S.gl.style.opacity = P(t, 96.3, 0.4); S.ll.style.opacity = P(t, 98.9, 0.4);
  camSet(S, t, [{ t: 95.1, x: 960, y: 540, s: 1.0 }, { t: 100.9, x: 960, y: 560, s: 1.12 }], { ry0: 4, ry1: -2 });
});

// ============================================================ B18 S&P record
glassScene('g_sp500', 'B18', 0, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad');
  place(c, 260, 200, 1400, 680);
  c.innerHTML = `<div class="row" style="justify-content:space-between"><div class="row"><div id="ic"></div><div class="eyebrow">S&amp;P 500 · close</div></div><div class="chip" id="d7" style="position:relative">October 7th</div></div>
    <div style="font-size:140px;font-weight:700;letter-spacing:-0.04em;line-height:1.05;margin-top:18px"><span class="hl" id="hlv"><span id="val">0.00</span></span><span class="cite" id="cite">1</span></div>
    <div id="chart" style="position:relative;width:1320px;height:300px;margin-top:22px"></div>`;
  iconTile(c.querySelector('#ic'), 'chart', 64);
  S.val = c.querySelector('#val'); S.hlv = c.querySelector('#hlv'); S.cite = c.querySelector('#cite'); S.d7 = c.querySelector('#d7');
  S.chart = lineChart(c.querySelector('#chart'), [[0, .1], [.08, .16], [.16, .13], [.24, .26], [.32, .3], [.4, .27], [.48, .42], [.56, .5], [.64, .46], [.72, .62], [.8, .7], [.88, .78], [.96, .9], [1, .95]], { w: 1320, h: 300 });
  S.rec = el(c, 'chip'); S.rec.innerHTML = 'New record'; css(S.rec, { left: '1180px', top: '330px', borderColor: '#e8e070', color: '#f0f060', boxShadow: '0 0 24px rgba(232,224,112,0.35)' });
  S.st.push(sticker(ui, 'NEW RECORD', { shape: 'hex', x: 1460, y: 110, rot: -14, t0: 118.1, t1: 119.1 }));
  pushEv(S, 110.4, 'rise'); pushEv(S, 113.2, 'count', { d: 1.8 }); pushEv(S, 115.95, 'tick'); pushEv(S, 117.7, 'shimmer'); pushEv(S, 118.1, 'pop');
}, (t, S) => {
  enter(S.card, t, 110.35, { from: 20, rest: 4 });
  S.val.textContent = fmt(count(t, 113.2, 1.8, 7801.77, 6500), 2);
  S.hlv.style.opacity = P(t, 113.15, 0.25);
  fadeIn(S.d7, t, 115.95, 0.4, { sFrom: 0.8 });
  S.chart.update(P(t, 111.0, 7.2, E.inOutCubic));
  fadeIn(S.rec, t, 117.7, 0.4, { sFrom: 0.7 });
  hl(S.hlv, t, 117.75, 0.5);
  S.cite.style.opacity = P(t, 118.2, 0.3);
  camSet(S, t, [{ t: 110.0, x: 960, y: 540, s: 0.96 }, { t: 116.5, x: 1000, y: 560, s: 1.05 }, { t: 118.0, x: 1150, y: 560, s: 1.12 }, { t: 119.3, x: 1170, y: 560, s: 1.15 }], { ry0: -3, ry1: 3 });
});

// ============================================================ B19 pullback
glassScene('g_pullback', 'B19', 3, (S, cam, ui) => {
  const p = S.panel = el(cam, 'card pad active-mint');
  place(p, 300, 140, 1000, null);
  p.innerHTML = `<div class="eyebrow">Same week</div>
    <div class="h1" style="margin-top:14px">Then it <span class="reg gray">slipped</span></div>
    <div class="row" id="r1" style="margin-top:34px;background:rgba(255,255,255,0.04);border:1px solid var(--hair);border-radius:20px;padding:20px 24px">
      <div class="badge" style="background:#c9a227">OIL</div><div class="h3" style="flex:1">Oil above <b>$100</b> a barrel</div><div class="spinner" id="sp1"></div></div>
    <div class="row" id="r2" style="margin-top:16px;background:rgba(255,255,255,0.04);border:1px solid var(--hair);border-radius:20px;padding:20px 24px">
      <div class="badge" style="background:#5b8def">10Y</div><div class="h3" style="flex:1">10-year Treasury yield past <b>5%</b></div><div class="spinner" id="sp2"></div></div>`;
  S.r1 = p.querySelector('#r1'); S.r2 = p.querySelector('#r2'); S.sp1 = p.querySelector('#sp1'); S.sp2 = p.querySelector('#sp2');
  const h = S.head = el(cam, 'card pad');
  place(h, 300, 760, 1000, null);
  h.innerHTML = `<div class="h2">A record high and <span class="hl" id="hl2">a pullback</span><span class="cite" id="cite">2</span> <span class="reg gray">in the same week.</span></div>`;
  S.hl2 = h.querySelector('#hl2'); S.cite = h.querySelector('#cite');
  const th = S.thumb = el(cam, 'card pad');
  place(th, 1380, 260, 420, 300);
  th.innerHTML = `<div class="eyebrow">S&amp;P 500 · week</div><div id="tc" style="position:relative;width:340px;height:170px;margin-top:20px"></div>`;
  S.tc = lineChart(th.querySelector('#tc'), [[0, .3], [.2, .5], [.4, .75], [.5, .92], [.62, .7], [.75, .52], [.88, .58], [1, .5]], { w: 340, h: 170, color: '#e8e070', glow: 'rgba(232,224,112,0.7)' });
  S.st.push(sticker(ui, 'CHECKING SOURCES', { shape: 'pill', x: 1330, y: 640, rot: -16, t0: 128.4, t1: 130.1 }));
  pushEv(S, 119.1, 'rise'); pushEv(S, 120.0, 'tick'); pushEv(S, 121.2, 'chime', { soft: 1 }); pushEv(S, 122.9, 'tick'); pushEv(S, 124.6, 'chime', { soft: 1 });
  pushEv(S, 126.0, 'whoosh', { soft: 1 }); pushEv(S, 127.9, 'shimmer'); pushEv(S, 128.4, 'pop');
}, (t, S) => {
  enter(S.panel, t, 119.05, { from: 14, rest: 4, rise: 160 });
  reveal(S.panel, t, 119.05, 0.6);
  fadeIn(S.r1, t, 120.0, 0.45, { slide: 40, rise: 0 }); fadeIn(S.r2, t, 122.9, 0.45, { slide: 40, rise: 0 });
  [[S.sp1, 120.0, 121.2], [S.sp2, 122.9, 124.6]].forEach(([sp, a, b]) => {
    if (t < b) { sp.style.transform = `rotate(${(t - a) * 540}deg)`; sp.innerHTML = ''; css(sp, { border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#48d8a8', background: 'none' }); }
    else { sp.style.transform = 'none'; css(sp, { border: '1.5px solid #48d8a8', background: 'rgba(72,216,168,0.16)' }); if (!sp.innerHTML) sp.innerHTML = IC.check('#48d8a8'); }
  });
  enter(S.thumb, t, 119.6, { from: -24, rest: -8, slide: 200 });
  S.tc.update(P(t, 119.8, 2.0, E.inOutCubic));
  enter(S.head, t, 126.0, { from: 16, rest: 3, rise: 80 });
  hl(S.hl2, t, 127.9, 0.5);
  S.cite.style.opacity = P(t, 128.3, 0.3);
  camSet(S, t, [{ t: 118.7, x: 960, y: 480, s: 0.92 }, { t: 125.8, x: 1000, y: 500, s: 0.98 }, { t: 126.6, x: 820, y: 820, s: 1.25 }, { t: 130.3, x: 840, y: 820, s: 1.32 }], { ry0: 3, ry1: -2 });
});

// ============================================================ B20 wobble
glassScene('g_wobble', 'B20', 1, (S, cam, ui) => {
  const pts = [[0, .35], [.08, .37], [.14, .36], [.2, .4], [.3, .55], [.4, .68], [.46, .6], [.5, .7], [.54, .58], [.58, .67], [.62, .6], [.7, .72], [.8, .8], [.9, .88], [1, .96]];
  S.wrap = el(cam, 'abs'); place(S.wrap, 200, 140);
  S.ch = lineChart(S.wrap, pts, { w: 3400, h: 760, sw: 9 });
  S.tags = [['That’s the market.', 130.06], ['climbs', 131.3], ['wobbles', 132.38], ['keeps going', 133.5]].map(([txt, tt]) => { const c = el(cam, 'chip', txt); return { c, tt }; });
  S.prog = t => { // path progress synced to the words
    if (t < 131.3) return lerp(0, 0.2, P(t, 130.0, 1.3, E.inOutCubic));
    if (t < 132.38) return lerp(0.2, 0.42, P(t, 131.3, 1.08, E.inOutCubic));
    if (t < 133.3) return lerp(0.42, 0.64, P(t, 132.38, 0.92, E.linear));
    return lerp(0.64, 1.0, P(t, 133.3, 1.3, E.inOutCubic));
  };
  pushEv(S, 131.3, 'tick'); pushEv(S, 132.38, 'tick'); pushEv(S, 133.5, 'rise', { soft: 1 });
}, (t, S) => {
  const pt = S.ch.update(S.prog(t));
  const tip = { x: 200 + pt.x, y: 140 + pt.y };
  S.tags.forEach(({ c, tt }, i) => {
    if (!c.dataset.x && t >= tt) { const q = S.ch.update(S.prog(tt)); c.dataset.x = 200 + q.x - 60; c.dataset.y = 140 + q.y - 110; }
    if (c.dataset.x) place(c, +c.dataset.x, +c.dataset.y);
    fadeIn(c, t, tt, 0.35, { sFrom: 0.7 });
  });
  S.ch.update(S.prog(t));
  camSet(S, t, tt => { const q = S.ch.update(S.prog(tt)); return { x: 200 + q.x - 260, y: 140 + q.y + 40, s: 1.05 }; }, { ry0: -4, ry1: 4 });
  S.ch.update(S.prog(t));
});

// Donut ring (share of ownership).
function ring(parent, size, color) {
  const r = size / 2 - 16, C = 2 * Math.PI * r;
  const w = el(parent, '');
  css(w, { width: size + 'px', height: size + 'px', position: 'relative' });
  w.innerHTML = `<svg width="${size}" height="${size}" style="transform:rotate(-90deg)"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="26"/>
    <circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="26" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="filter:drop-shadow(0 0 12px ${color})"/></svg>`;
  const arc = w.querySelector('.arc');
  return { w, set(p) { arc.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(1)); arc.style.opacity = p > 0.002 ? 1 : 0; } };
}

// ============================================================ B23 own the whole thing
glassScene('g_ownwhole', 'B23', 2, (S, cam, ui) => {
  const mk = (x, label, cap, color) => {
    const c = el(cam, 'card pad'); place(c, x, 190, 620, 700);
    const l = el(c, 'eyebrow label-yellow', label);
    const rw = el(c, ''); css(rw, { display: 'flex', justifyContent: 'center', marginTop: '36px' });
    const rg = ring(rw, 360, color);
    const cp = el(c, 'h3', cap); css(cp, { marginTop: '40px', textAlign: 'center' });
    return { c, rg, cp };
  };
  S.intro = el(cam, 'abs'); place(S.intro, 160, 470, 1600);
  S.intro.innerHTML = '<div style="text-align:center;font-size:96px;font-weight:700;letter-spacing:-0.03em">Think about it <span style="color:#f0f060">this way</span></div>';
  S.a = mk(300, 'With stocks', 'A tiny piece of someone else’s company', '#48d8a8');
  S.b = mk(1000, 'With your own business', 'You own the whole thing', '#e8e070');
  S.cur = cursor(cam, [{ t: 156.9, x: 1500, y: 980 }, { t: 157.45, x: 1330, y: 640 }, { t: 157.8, x: 1330, y: 640 }]);
  S.cur.click(157.62, 1330, 640);
  pushEv(S, 152.04, 'whoosh', { soft: 1 }); pushEv(S, 153.6, 'tick'); pushEv(S, 155.82, 'whoosh', { soft: 1 }); pushEv(S, 157.3, 'rise'); pushEv(S, 157.62, 'click');
}, (t, S) => {
  fadeIn(S.intro, t, 150.55, 0.5, { blur: 14, exit: 151.85, sFrom: 0.94 });
  enter(S.a.c, t, 152.0, { from: 24, rest: 9, dof: 6 * P(t, 155.9, 0.6, E.inOutCubic) });
  S.a.c.style.opacity = (+S.a.c.style.opacity * (1 - 0.45 * P(t, 155.9, 0.6))).toFixed(3);
  S.a.rg.set(0.035 * P(t, 153.6, 0.8, E.outCubic));
  fadeIn(S.a.cp, t, 153.6, 0.4);
  enter(S.b.c, t, 155.8, { from: -24, rest: -7, slide: 160 });
  S.b.rg.set(P(t, 157.26, 0.95, E.inOutCubic));
  fadeIn(S.b.cp, t, 157.3, 0.4);
  const pr = press(t, 157.62); S.b.c.style.transform += ` scale(${pr.s})`;
  S.b.c.classList.toggle('active-yellow', t > 157.62);
  S.cur.update(t);
  camSet(S, t, [{ t: 150.1, x: 760, y: 560, s: 1.15 }, { t: 151.4, x: 700, y: 560, s: 1.05 }, { t: 155.6, x: 760, y: 550, s: 1.08 }, { t: 156.3, x: 1250, y: 550, s: 1.02 }, { t: 159.1, x: 1300, y: 550, s: 1.1 }], { ry0: 4, ry1: -3 });
});

// ============================================================ B24 you decide
glassScene('g_decide', 'B24', 4, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 460, 220, 1000, 640);
  c.innerHTML = `<div class="eyebrow label-yellow">Your business</div><div class="h1" style="margin-top:14px">You decide</div>`;
  const items = [['The product', 159.66], ['The customers', 160.6], ['The pricing', 161.68], ['How fast it grows', 162.74]];
  S.chips = items.map(([txt, tt], i) => {
    const ch = el(c, 'chip dim'); ch.innerHTML = `<span class="ck" style="display:inline-block;width:26px;height:26px;vertical-align:-4px;margin-right:12px"></span>${txt}`;
    const x = 38 + (i % 2) * 470, y = 230 + Math.floor(i / 2) * 140;
    css(ch, { left: x + 'px', top: y + 'px', width: '440px', fontSize: '32px', padding: '26px 30px' });
    return { ch, tt, cx: 460 + x + 220, cy: 220 + y + 44 };
  });
  const keys = [{ t: 159.05, x: 1600, y: 1000 }];
  S.chips.forEach(q => { keys.push({ t: q.tt - 0.05, x: q.cx, y: q.cy }); keys.push({ t: q.tt + 0.25, x: q.cx, y: q.cy }); });
  S.cur = cursor(cam, keys);
  S.chips.forEach(q => { S.cur.click(q.tt, q.cx, q.cy); pushEv(S, q.tt, 'click'); });
}, (t, S) => {
  enter(S.card, t, 158.85, { from: 18, rest: 5 });
  S.chips.forEach(q => {
    const on = t > q.tt;
    q.ch.classList.toggle('dim', !on);
    q.ch.querySelector('.ck').innerHTML = on ? IC.check('#48d8a8') : '';
    const pr = press(t, q.tt); q.ch.style.transform = `scale(${pr.s})`;
  });
  S.cur.update(t);
  camSet(S, t, [{ t: 158.5, x: 960, y: 560, s: 1.0 }, { t: 164.2, x: 980, y: 580, s: 1.1 }], { ry0: -4, ry1: 3 });
});

// ============================================================ B26 census record
glassScene('g_census1', 'B26', 1, (S, cam, ui) => {
  // fanned stack of filings drifting past in depth
  S.stack = [0, 1, 2, 3, 4].map(i => {
    const c = el(cam, 'card pad'); place(c, 420 + i * 70, 240 + i * 26, 520, 330);
    c.innerHTML = `<div class="row"><div class="badge" style="background:${['#d9534f', '#5b8def', '#c9a227', '#5b8def', '#d9534f'][i]}">EIN</div><div class="h3">New business application</div></div>
      <div style="height:14px;border-radius:7px;background:rgba(255,255,255,0.07);margin-top:30px;width:88%"></div><div style="height:14px;border-radius:7px;background:rgba(255,255,255,0.07);margin-top:14px;width:64%"></div>`;
    return c;
  });
  const k = S.stat = el(cam, 'card pad active-mint'); place(k, 1500, 160, 1080, 700);
  k.innerHTML = `<div class="eyebrow">New business applications · July</div>
    <div style="font-size:190px;font-weight:700;letter-spacing:-0.045em;line-height:1.05;margin-top:14px" id="val">0</div>
    <div class="h3 gray" id="l1">new business applications <span class="chip" id="jul" style="position:relative;display:inline-block;margin-left:12px;font-size:26px;padding:10px 22px">in July</span></div>
    <div class="h3" id="l2" style="margin-top:34px;line-height:1.35"><span class="hl" id="hlx">The most since the Census Bureau started tracking in 2004</span><span class="cite" id="cite">1</span></div>`;
  S.val = k.querySelector('#val'); S.l1 = k.querySelector('#l1'); S.jul = k.querySelector('#jul'); S.l2 = k.querySelector('#l2'); S.hlx = k.querySelector('#hlx'); S.cite = k.querySelector('#cite');
  S.prev = previewCard(cam, 2620, 250, { title: 'Business Formation Statistics', body: 'Census Bureau · monthly business applications, July', badge: 'XLS', badgeColor: '#3f9b6b',
    spark: [[0, .2], [.2, .3], [.4, .28], [.6, .5], [.8, .62], [1, .9]] });
  S.cur = cursor(cam, [{ t: 182.6, x: 2500, y: 980 }, { t: 183.1, x: 2465, y: 735 }, { t: 183.5, x: 2465, y: 735 }]);
  S.cur.click(183.25, 2465, 735);
  S.st.push(sticker(ui, 'RECORD FILINGS', { shape: 'hex', x: 1430, y: 110, rot: -15, t0: 180.4, t1: 184.1 }));
  pushEv(S, 171.4, 'whoosh', { soft: 1 }); pushEv(S, 173.7, 'whoosh'); pushEv(S, 174.6, 'count', { d: 1.7 }); pushEv(S, 179.1, 'tick');
  pushEv(S, 180.05, 'shimmer'); pushEv(S, 180.4, 'pop'); pushEv(S, 183.25, 'click'); pushEv(S, 183.35, 'whoosh', { soft: 1 });
}, (t, S) => {
  S.stack.forEach((c, i) => enter(c, t, 171.3 + i * 0.22, { from: 28, rest: 14 - i * 3, z: -i * 90, rise: 90, dof: i === 4 ? 8 : Math.abs(i - 2) * 2.5 }));
  enter(S.stat, t, 173.6, { from: -20, rest: -5, slide: 300 });
  S.val.textContent = fmt(Math.round(count(t, 174.6, 1.7, 578926)));
  S.val.style.opacity = P(t, 174.55, 0.25);
  fadeIn(S.l1, t, 177.6, 0.4); fadeIn(S.jul, t, 179.05, 0.35, { sFrom: 0.8 });
  fadeIn(S.l2, t, 179.95, 0.4);
  hl(S.hlx, t, 180.1, 2.6);
  S.cite.style.opacity = P(t, 182.85, 0.3);
  S.cite.style.boxShadow = t > 183.2 ? '0 0 18px rgba(255,255,255,0.85)' : 'none';
  enter(S.prev, t, 183.35, { from: -28, rest: -8, slide: 380 });
  S.cur.update(t);
  camSet(S, t, [{ t: 170.9, x: 760, y: 470, s: 1.0 }, { t: 173.4, x: 820, y: 480, s: 1.06 }, { t: 174.1, x: 2040, y: 500, s: 1.0, e: 'expo' },
    { t: 176.6, x: 1960, y: 470, s: 1.32 }, { t: 179.8, x: 2040, y: 520, s: 1.0 }, { t: 182.9, x: 2060, y: 560, s: 1.04 }, { t: 183.6, x: 2420, y: 540, s: 0.86 }, { t: 184.3, x: 2440, y: 540, s: 0.88 }], { ry0: -3, ry1: 3 });
});

// ============================================================ B28 starts vs payroll
glassScene('g_census2', 'B28', 3, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 300, 220, 1320, 640);
  c.innerHTML = `<div class="eyebrow">The Census expects</div>
    <div class="row" style="margin-top:40px;justify-content:space-between"><div class="h3 gray">Applications</div><div class="h3">578,926</div></div>
    <div style="height:56px;border-radius:28px;background:rgba(255,255,255,0.06);margin-top:14px;overflow:hidden"><div style="height:100%;width:100%;border-radius:28px;background:linear-gradient(90deg,rgba(72,216,168,0.35),rgba(48,192,192,0.25))"></div></div>
    <div class="row" style="margin-top:46px;justify-content:space-between"><div class="h3" id="lb">Businesses with payroll within a year</div><div class="h3"><span class="gray reg" style="font-size:24px">only about&nbsp;</span><span class="hl" id="hlv"><span id="val">0</span></span></div></div>
    <div style="height:56px;border-radius:28px;background:rgba(255,255,255,0.06);margin-top:14px;position:relative"><div id="bar" style="height:100%;width:0;border-radius:28px;background:#e8e070;box-shadow:0 0 26px rgba(232,224,112,0.7)"></div></div>`;
  S.val = c.querySelector('#val'); S.bar = c.querySelector('#bar'); S.lb = c.querySelector('#lb'); S.hlv = c.querySelector('#hlv');
  S.st.push(sticker(ui, 'STARTING IS EASY', { shape: 'pill', x: 1280, y: 130, rot: -16, t0: 196.3, t1: 198.6 }));
  S.st.push(sticker(ui, 'LASTING\nIS HARD', { shape: 'hex', x: 1430, y: 760, rot: -18, t0: 198.9, t1: 200.9 }));
  pushEv(S, 188.5, 'rise', { soft: 1 }); pushEv(S, 190.4, 'count', { d: 1.0 }); pushEv(S, 192.5, 'tick'); pushEv(S, 191.4, 'shimmer'); pushEv(S, 196.3, 'pop'); pushEv(S, 198.9, 'pop');
}, (t, S) => {
  enter(S.card, t, 188.45, { from: 18, rest: 5 });
  const p = P(t, 190.4, 1.0, E.outCubic);
  S.val.textContent = fmt(Math.round(29959 * p));
  S.bar.style.width = (100 * 29959 / 578926 * p).toFixed(2) + '%';
  hl(S.hlv, t, 191.4, 0.45);
  S.lb.style.opacity = 0.35 + 0.65 * P(t, 192.5, 0.4);
  camSet(S, t, [{ t: 188.1, x: 960, y: 540, s: 0.98 }, { t: 190.2, x: 960, y: 560, s: 1.0 }, { t: 191.0, x: 1060, y: 630, s: 1.38 }, { t: 195.4, x: 1090, y: 630, s: 1.34 }, { t: 196.1, x: 960, y: 560, s: 1.0 }, { t: 201.1, x: 980, y: 560, s: 1.08 }], { ry0: 3, ry1: -3 });
});

// ============================================================ B31 the answer is you
glassScene('g_you', 'B31', 0, (S, cam, ui) => {
  const Q = 'The best investment you’ll ever make is you.';
  S.pill = heroPill(cam, 200, 300, Q);
  S.pill.span.style.whiteSpace = 'pre';
  const y0 = 1060;
  const items = [['Your skills', 'bulb', 221.44], ['Your knowledge', 'book', 222.44], ['Your network', 'net', 223.34], ['Your discipline', 'target', 224.24]];
  S.cards = items.map(([title, ic, tt], i) => ({ c: objectCard(cam, 420 + i * 470, y0 + (i % 2) * 50, 440, 340, { icon: ic, label: '0' + (i + 1), title, lines: 1 }), tt }));
  S.camf = typingCam(S.pill, 218.55, 22, 220.9, {
    after: t => {
      if (t < 220.9) return null;
      const q = E.outExpo(clamp((t - 220.9) / 0.55));
      const a = { x: S.pill.caretX(Q.length) - 140, y: S.pill.y + S.pill.h / 2, s: 2.25 };
      const b = camKeys([{ t: 221.45, x: 1345, y: 1250, s: 0.95 }, { t: 225.2, x: 1380, y: 1270, s: 1.0 }], t);
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    },
  });
  pushEv(S, 218.55, 'keys', { n: Q.length, cps: 22 }); pushEv(S, 220.9, 'whoosh');
  items.forEach(it => pushEv(S, it[2], 'pop', { soft: 1 }));
}, (t, S) => {
  const n = typed(S.pill.span, S.pill.text, t, 218.55, 22, { caretUntil: 221.0 });
  // last word "you." in accent yellow once typed
  pillAway(S.pill, t, 220.95);
  if (n >= S.pill.text.length - 3) S.pill.span.innerHTML = S.pill.span.innerHTML.replace(/is you\.?/, m => `is <span style="color:#f0f060">${m.slice(3)}</span>`);
  S.cards.forEach(({ c, tt }, i) => { enter(c, t, tt - 0.05, { from: 24, rest: 7 - i * 4, rise: 110, z: -(i % 2) * 60 }); c.classList.toggle('active-yellow', t > tt + 0.2 && (i === 3 || t < S.cards[i + 1].tt)); });
  camSet(S, t, S.camf, { ry0: -2, ry1: 3 });
});

// ============================================================ B34 index funds
glassScene('g_indextype', 'B34', 2, (S, cam, ui) => {
  const Q = 'learn about low-cost index funds first.';
  S.pill = heroPill(cam, 200, 300, Q);
  S.card = objectCard(cam, 1260, 900, 700, 360, { icon: 'chart', label: 'Low-cost', title: 'Index funds', body: 'Own the whole market, not one pick.' });
  S.st.push(sticker(ui, 'DON’T PICK\nWINNERS', { shape: 'hex', x: 1340, y: 140, rot: -15, t0: 244.5, t1: 246.1 }));
  S.camf = typingCam(S.pill, 240.45, 22, 242.4, {
    pre: { keys: [{ t: 240.0, x: 1000, y: 470, s: 1.5 }, { t: 240.35, x: 1000, y: 470, s: 1.7 }], slam: 240.1, t1: 240.42 },
    after: t => {
      if (t < 242.4) return null;
      const q = E.outExpo(clamp((t - 242.4) / 0.55));
      const a = { x: S.pill.caretX(Q.length) - 140, y: S.pill.y + S.pill.h / 2, s: 2.25 };
      const b = camKeys([{ t: 242.95, x: 1610, y: 1080, s: 1.12 }, { t: 246.3, x: 1630, y: 1090, s: 1.2 }], t);
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    },
  });
  pushEv(S, 240.1, 'whoosh'); pushEv(S, 240.45, 'keys', { n: Q.length, cps: 22 }); pushEv(S, 242.4, 'whoosh'); pushEv(S, 243.1, 'tick'); pushEv(S, 244.5, 'pop');
}, (t, S) => {
  typed(S.pill.span, S.pill.text, t, 240.45, 22, { caretUntil: 242.6 });
  pillAway(S.pill, t, 242.45);
  enter(S.card, t, 242.9, { from: 22, rest: 6, rise: 100 });
  S.card.classList.toggle('active-yellow', t > 243.3);
  camSet(S, t, S.camf, { ry0: -3, ry1: 3 });
});

// ============================================================ B35 yesterday's winner
glassScene('g_winner', 'B35', 4, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 300, 160, 1320, 560);
  c.innerHTML = `<div class="row" style="justify-content:space-between"><div class="row"><div id="ic"></div><div class="eyebrow">Phone market share · yesterday’s leader</div></div><div class="chip" id="own" style="position:relative">They owned the phone market.</div></div>
    <div id="chart" style="position:relative;width:1240px;height:330px;margin-top:40px"></div>`;
  iconTile(c.querySelector('#ic'), 'chart', 64, 'linear-gradient(135deg, rgba(224,96,90,0.45), rgba(48,72,96,0.5))');
  S.own = c.querySelector('#own');
  const chEl = c.querySelector('#chart');
  S.hi = lineChart(chEl, [[0, .82], [.1, .86], [.2, .88], [.3, .9], [.4, .91], [.45, .9]], { w: 1240, h: 330 });
  const lo = el(chEl, 'abs'); place(lo, 0, 0);
  S.lo = lineChart(lo, [[.45, .9], [.52, .84], [.6, .66], [.7, .45], [.8, .3], [.9, .2], [1, .14]], { w: 1240, h: 330, color: '#e0605a', glow: 'rgba(224,96,90,0.7)' });
  S.mark = el(chEl, 'abs'); css(S.mark, { left: '552px', top: '-20px', width: '2px', height: '370px', borderLeft: '2px dashed rgba(255,255,255,0.35)' });
  S.markL = el(chEl, 'chip dim', 'Then smartphones showed up'); css(S.markL, { left: '575px', top: '-6px', fontSize: '24px', padding: '10px 20px' });
  const h = S.head = el(cam, 'card pad'); place(h, 300, 770, 1320, null);
  h.innerHTML = `<div class="h2">Yesterday’s winner <span class="hl" id="hl2">isn’t automatically</span> <span class="reg gray">tomorrow’s winner.</span></div>`;
  S.hl2 = h.querySelector('#hl2');
  S.st.push(sticker(ui, 'WINNERS CHANGE', { shape: 'pill', x: 1330, y: 130, rot: -17, t0: 254.3, t1: 255.7 }));
  pushEv(S, 246.1, 'rise', { soft: 1 }); pushEv(S, 247.3, 'tick'); pushEv(S, 249.12, 'tick'); pushEv(S, 249.9, 'fall'); pushEv(S, 252.3, 'whoosh', { soft: 1 }); pushEv(S, 253.2, 'shimmer'); pushEv(S, 254.3, 'pop');
}, (t, S) => {
  enter(S.card, t, 246.05, { from: 20, rest: 5 });
  S.hi.update(P(t, 246.2, 2.4, E.inOutCubic));
  fadeIn(S.own, t, 247.3, 0.4, { sFrom: 0.85 });
  S.mark.style.opacity = P(t, 249.1, 0.3); fadeIn(S.markL, t, 249.15, 0.35);
  S.lo.update(P(t, 249.9, 1.5, E.inCubic));
  enter(S.head, t, 252.3, { from: 14, rest: 3, rise: 80 });
  hl(S.hl2, t, 253.2, 0.6);
  camSet(S, t, [{ t: 245.7, x: 960, y: 440, s: 1.0 }, { t: 249.0, x: 900, y: 430, s: 1.06 }, { t: 251.5, x: 1150, y: 470, s: 1.14 }, { t: 252.3, x: 960, y: 640, s: 1.0 }, { t: 255.9, x: 960, y: 700, s: 1.12 }], { ry0: 3, ry1: -3 });
});

// ============================================================ B36 index grid
glassScene('g_indexgrid', 'B36', 1, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 360, 150, 1200, 780);
  c.innerHTML = `<div class="row"><div id="ic"></div><div><div class="eyebrow label-yellow">Index fund</div><div class="h3" style="margin-top:6px">A slice of <span id="cnt">hundreds</span> of companies at once</div></div></div>
    <div id="grid" style="position:relative;width:1120px;height:560px;margin-top:30px"></div>`;
  iconTile(c.querySelector('#ic'), 'coin', 64);
  S.cnt = c.querySelector('#cnt');
  const g = c.querySelector('#grid');
  S.big = []; S.small = [];
  const cols1 = 20, rows1 = 10, s1 = 1120 / cols1;
  for (let r = 0; r < rows1; r++) for (let q = 0; q < cols1; q++) {
    const d = el(g, 'abs'); css(d, { left: q * s1 + 4 + 'px', top: r * 56 + 4 + 'px', width: s1 - 8 + 'px', height: '48px', borderRadius: '10px',
      background: `rgba(72,216,168,${0.18 + 0.5 * (((r * 7 + q * 13) % 10) / 10)})` });
    S.big.push({ d, k: (r + q) / (rows1 + cols1) });
  }
  const cols2 = 56, rows2 = 28, s2 = 1120 / cols2;
  for (let r = 0; r < rows2; r++) for (let q = 0; q < cols2; q++) {
    const d = el(g, 'abs'); css(d, { left: q * s2 + 2 + 'px', top: r * 20 + 2 + 'px', width: s2 - 4 + 'px', height: '16px', borderRadius: '4px',
      background: `rgba(${((r * 3 + q) % 7) < 2 ? '232,224,112' : '72,216,168'},${0.2 + 0.55 * (((r * 11 + q * 5) % 10) / 10)})` });
    S.small.push({ d, k: (r + q) / (rows2 + cols2) });
  }
  S.st.push(sticker(ui, 'DIVERSIFICATION', { shape: 'hex', x: 1350, y: 120, rot: -14, t0: 261.5, t1: 264.5 }));
  S.st.push(sticker(ui, 'STILL HAS RISK', { shape: 'pill', x: 1300, y: 860, rot: -16, t0: 263.1, t1: 264.5 }));
  pushEv(S, 255.7, 'rise', { soft: 1 }); pushEv(S, 257.6, 'cascade', { d: 0.8 }); pushEv(S, 258.6, 'cascade', { d: 0.9 }); pushEv(S, 261.5, 'pop'); pushEv(S, 263.1, 'pop');
}, (t, S) => {
  enter(S.card, t, 255.65, { from: -20, rest: -5 });
  S.cnt.textContent = t > 258.5 ? 'thousands' : 'hundreds';
  const dip = 14 * P(t, 263.2, 0.6, E.inOutCubic);
  const fadeBig = P(t, 258.55, 0.5);
  S.big.forEach(({ d, k }) => { const p = P(t, 257.5 + k * 0.8, 0.3, E.outBack); d.style.opacity = (Math.max(p, 0.1) * (1 - fadeBig)).toFixed(3); d.style.transform = `scale(${0.6 + 0.4 * p})`; });
  S.small.forEach(({ d, k }) => { const p = P(t, 258.6 + k * 0.9, 0.3, E.outBack); d.style.opacity = (p * (1 - 0.35 * P(t, 263.2, 0.6))).toFixed(3); d.style.transform = `translateY(${dip}px) scale(${0.3 + 0.7 * p})`; });
  camSet(S, t, [{ t: 255.3, x: 960, y: 560, s: 0.96 }, { t: 257.4, x: 960, y: 560, s: 1.0 }, { t: 260.8, x: 900, y: 600, s: 1.18 }, { t: 264.7, x: 960, y: 560, s: 1.02 }], { ry0: -3, ry1: 3 });
});

// ============================================================ B38 what to look for
glassScene('g_lookfor', 'B38', 3, (S, cam, ui) => {
  const Q = 'What do you look for?';
  S.pill = heroPill(cam, 200, 300, Q);
  S.bubble = el(cam, 'bubble-user', 'What do you look for?'); place(S.bubble, 1560, 900);
  S.dots = typingDots(cam, 800, 1010);
  const p = S.panel = el(cam, 'card pad active-mint'); place(p, 800, 1010, 1100, null);
  const rows = [['Broad diversification', 271.82], ['Low fees', 273.38], ['Know exactly what the fund <span class="hl" id="hlo">actually owns</span>', 274.7]];
  p.innerHTML = `<div class="eyebrow">What to look for</div><div class="h2" style="margin-top:12px">Index fund <span class="reg gray">checklist</span></div>` +
    rows.map((r, i) => `<div class="row" id="r${i}" style="margin-top:${i ? 16 : 30}px;background:rgba(255,255,255,0.04);border:1px solid var(--hair);border-radius:20px;padding:20px 24px"><div class="check">${IC.check('#48d8a8')}</div><div class="h3">${r[0]}</div></div>`).join('');
  S.rows = rows.map((r, i) => ({ e: p.querySelector('#r' + i), tt: r[1] }));
  S.hlo = p.querySelector('#hlo');
  S.camf = typingCam(S.pill, 269.95, 24, 270.95, {
    pre: { keys: [{ t: 269.5, x: 1000, y: 470, s: 1.5 }, { t: 269.85, x: 1000, y: 470, s: 1.7 }], slam: 269.6, t1: 269.92 },
    after: t => {
      if (t < 270.95) return null;
      const q = E.outExpo(clamp((t - 270.95) / 0.55));
      const a = { x: S.pill.caretX(Q.length) - 140, y: S.pill.y + S.pill.h / 2, s: 2.25 };
      const b = camKeys([{ t: 271.5, x: 1350, y: 1230, s: 1.15 }, { t: 277.7, x: 1370, y: 1270, s: 1.22 }], t);
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    },
  });
  pushEv(S, 269.6, 'whoosh'); pushEv(S, 269.95, 'keys', { n: Q.length, cps: 24 }); pushEv(S, 270.95, 'whoosh'); pushEv(S, 271.55, 'rise');
  rows.forEach(r => pushEv(S, r[1], 'tick')); pushEv(S, 275.9, 'shimmer');
}, (t, S) => {
  typed(S.pill.span, S.pill.text, t, 269.95, 24, { caretUntil: 271.1 });
  pillAway(S.pill, t, 271.0);
  fadeIn(S.bubble, t, 271.05, 0.35, { slide: 60, rise: 0 });
  S.dots.e.style.opacity = t > 271.15 && t < 271.6 ? 1 : 0; S.dots.update(t);
  enter(S.panel, t, 271.55, { from: 10, rest: 3, rise: 140 });
  reveal(S.panel, t, 271.55, 0.5);
  S.rows.forEach(r => fadeIn(r.e, t, r.tt, 0.4, { slide: 40, rise: 0 }));
  hl(S.hlo, t, 275.9, 0.5);
  camSet(S, t, S.camf, { ry0: 2, ry1: -3 });
});

// ============================================================ B40 foundation
glassScene('g_foundation', 'B40', 2, (S, cam, ui) => {
  S.eb = el(cam, 'eyebrow', 'Before you put that 20,000 into anything'); place(S.eb, 260, 300, 1400); css(S.eb, { textAlign: 'center', fontSize: '34px' });
  S.title = el(cam, 'abs'); place(S.title, 160, 350, 1600);
  S.title.innerHTML = `<div style="text-align:center;font-size:140px;font-weight:800;letter-spacing:-0.035em">Fix your <span style="color:#f0f060">foundation</span></div>`;
  const steps = ['High-interest debt', 'Emergency fund', 'Employer match', 'Put the plan to work'];
  S.steps = steps.map((s, i) => {
    const c = el(cam, 'card'); place(c, 150 + i * 410, 660, 380, 150);
    css(c, { display: 'flex', alignItems: 'center', gap: '18px', padding: '0 26px', borderRadius: '30px' });
    c.innerHTML = `<div class="num">${i + 1}</div><div class="h3" style="font-size:27px">${s}</div>`;
    return c;
  });
  S.order = el(cam, 'chip dim', 'The order matters'); place(S.order, 830, 860);
  S.cur = cursor(cam, [{ t: 297.9, x: 700, y: 980 }, { t: 298.45, x: 330, y: 735 }, { t: 298.9, x: 330, y: 735 }]);
  S.cur.click(298.6, 330, 735);
  pushEv(S, 290.4, 'rise', { soft: 1 }); pushEv(S, 293.5, 'rise');
  [295.2, 295.45, 295.7, 295.95].forEach(tt => pushEv(S, tt, 'tick')); pushEv(S, 296.4, 'tick'); pushEv(S, 297.85, 'shimmer'); pushEv(S, 298.6, 'click');
}, (t, S) => {
  fadeIn(S.eb, t, 290.5, 0.5, { blur: 10 });
  fadeIn(S.title, t, 293.5, 0.6, { sFrom: 0.92, blur: 16, rise: 30 });
  S.steps.forEach((c, i) => { enter(c, t, 295.2 + i * 0.25, { from: 22, rest: 4 - i * 2.5, rise: 80 }); c.classList.toggle('active-mint', i === 0 && t > 297.85); c.style.filter = (c.style.filter === 'none' ? '' : c.style.filter) + (i > 0 && t > 297.85 ? ' blur(2px)' : ''); });
  fadeIn(S.order, t, 296.4, 0.4, { sFrom: 0.85 });
  S.cur.update(t);
  camSet(S, t, [{ t: 289.8, x: 960, y: 330, s: 1.5 }, { t: 293.2, x: 960, y: 340, s: 1.42 }, { t: 294.2, x: 960, y: 500, s: 1.04 }, { t: 294.8, x: 960, y: 520, s: 1.02 }, { t: 295.6, x: 960, y: 640, s: 0.98 }, { t: 297.7, x: 960, y: 640, s: 1.0 }, { t: 298.4, x: 700, y: 650, s: 1.25 }, { t: 300.0, x: 720, y: 650, s: 1.28 }], { ry0: -2, ry1: 3 });
});

// ============================================================ B42 emergency fund
glassScene('g_emergency', 'B42', 4, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 340, 200, 1240, null);
  c.innerHTML = `<div class="row"><div class="num">2</div><div><div class="eyebrow label-yellow">Step 2</div><div class="h1" style="margin-top:6px;font-size:58px">Build an emergency fund</div></div></div>
    <div class="row" style="margin-top:40px;justify-content:space-between"><div class="h3 gray"><span class="white" style="font-weight:700" id="mo">3</span> to 6 months of expenses</div><div class="chip" id="ni" style="position:relative">Not invested</div></div>
    <div style="display:flex;gap:14px;margin-top:20px" id="seg"></div>
    <div class="row" id="acct" style="margin-top:36px;background:rgba(255,255,255,0.04);border:1px solid var(--hair);border-radius:24px;padding:24px 26px">
      <div class="badge" style="background:#5b8def">HYSA</div><div class="h3" style="flex:1">High-yield savings account</div><div class="spinner" id="sp"></div></div>
    <div class="body" id="cap" style="margin-top:22px">Everybody’s situation can be different.</div>`;
  const seg = c.querySelector('#seg');
  S.segs = [0, 1, 2, 3, 4, 5].map(i => { const d = el(seg, ''); css(d, { flex: 1, height: '70px', borderRadius: '18px', background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' });
    const f = el(d, 'abs'); css(f, { left: 0, top: 0, bottom: 0, width: '0%', background: i < 3 ? 'linear-gradient(90deg,#30c0c0,#48d8a8)' : 'rgba(72,216,168,0.45)' }); return f; });
  S.mo = c.querySelector('#mo'); S.ni = c.querySelector('#ni'); S.acct = c.querySelector('#acct'); S.sp = c.querySelector('#sp'); S.cap = c.querySelector('#cap');
  S.st.push(sticker(ui, 'SAFETY NET', { shape: 'hex', x: 1420, y: 120, rot: -15, t0: 316.6, t1: 320.5 }));
  pushEv(S, 313.4, 'rise'); pushEv(S, 315.85, 'cascade', { d: 0.9 }); pushEv(S, 316.6, 'pop'); pushEv(S, 317.3, 'tick'); pushEv(S, 318.7, 'chime'); pushEv(S, 320.75, 'tick'); pushEv(S, 322.0, 'tick');
}, (t, S) => {
  enter(S.card, t, 313.35, { from: 20, rest: 5 });
  S.segs.forEach((f, i) => { f.style.width = (100 * P(t, 315.85 + i * 0.12, 0.3, E.outCubic)).toFixed(1) + '%'; });
  S.mo.textContent = t > 316.1 ? '3' : '3';
  fadeIn(S.acct, t, 317.3, 0.4, { slide: 40, rise: 0 });
  S.acct.style.borderColor = t > 318.7 ? '#48d8a8' : 'var(--hair)';
  S.acct.style.boxShadow = t > 318.7 ? '0 0 24px rgba(72,216,168,0.3)' : 'none';
  if (t < 318.7) { S.sp.style.transform = `rotate(${(t - 317.3) * 540}deg)`; S.sp.innerHTML = ''; } else { S.sp.style.transform = 'none'; css(S.sp, { border: '1.5px solid #48d8a8', background: 'rgba(72,216,168,0.16)' }); if (!S.sp.innerHTML) S.sp.innerHTML = IC.check('#48d8a8'); }
  fadeIn(S.ni, t, 320.75, 0.35, { sFrom: 0.8 });
  fadeIn(S.cap, t, 322.0, 0.4);
  camSet(S, t, [{ t: 313.0, x: 960, y: 540, s: 0.96 }, { t: 315.6, x: 960, y: 520, s: 1.0 }, { t: 316.8, x: 900, y: 470, s: 1.18 }, { t: 320.4, x: 960, y: 600, s: 1.06 }, { t: 324.8, x: 980, y: 620, s: 1.1 }], { ry0: 3, ry1: -3 });
});

// ============================================================ B45 employer match (Hear It style)
glassScene('g_match', 'B45', 1, (S, cam, ui) => {
  const fp = S.feat = el(cam, 'pill'); place(fp, 260, 260); css(fp, { height: '150px', padding: '0 50px 0 28px', gap: '28px', fontSize: '50px', fontWeight: 600 });
  iconTile(fp, 'coin', 100, 'linear-gradient(135deg, #30c0c0, #5b8def 60%, #c0a8f0)');
  el(fp, '', '<span class="eyebrow label-yellow" style="font-size:22px;display:block">Step 3</span>Grab your employer match');
  const c = S.card = el(cam, 'card pad'); place(c, 260, 500, 900, 470);
  c.innerHTML = `<div class="eyebrow">If your job matches your 401(k)</div>
    <div style="display:flex;gap:70px;align-items:flex-end;height:290px;margin-top:20px;padding-left:40px">
      <div style="text-align:center"><div id="cy" style="width:150px;height:0;border-radius:18px;background:linear-gradient(180deg,#5b8def,rgba(91,141,239,0.4))"></div><div class="h3" style="margin-top:12px;font-size:24px">You</div></div>
      <div style="text-align:center"><div id="ce" style="width:150px;height:0;border-radius:18px;background:linear-gradient(180deg,#48d8a8,rgba(72,216,168,0.4));box-shadow:0 0 30px rgba(72,216,168,0.5)"></div><div class="h3" style="margin-top:12px;font-size:24px">Employer match</div></div>
    </div>`;
  S.cy = c.querySelector('#cy'); S.ce = c.querySelector('#ce');
  S.btn = el(cam, 'btn', 'Grab your match'); place(S.btn, 1250, 290);
  const ck = S.ck = el(cam, 'card pad'); place(ck, 1250, 500, 560, null);
  const items = [['Check the match', 350.16], ['Check the rules', 351.16], ['Take it if you can', 352.34]];
  ck.innerHTML = items.map((r, i) => `<div class="row" id="k${i}" style="margin-top:${i ? 22 : 0}px"><div class="check">${IC.check('#48d8a8')}</div><div class="h3">${r[0]}</div></div>`).join('');
  S.items = items.map((r, i) => ({ e: ck.querySelector('#k' + i), tt: r[1] }));
  S.cur = cursor(cam, [{ t: 348.7, x: 1700, y: 900 }, { t: 349.2, x: 1500, y: 345 }, { t: 349.6, x: 1500, y: 345 }, { t: 350.2, x: 1900, y: 700 }]);
  S.cur.click(349.35, 1500, 345);
  S.st.push(sticker(ui, 'FREE MONEY', { shape: 'hex', x: 1320, y: 110, rot: -16, t0: 348.9, t1: 352.2 }));
  pushEv(S, 343.8, 'shimmer'); pushEv(S, 345.0, 'whoosh', { soft: 1 }); pushEv(S, 346.3, 'rise', { soft: 1 }); pushEv(S, 347.3, 'rise');
  pushEv(S, 348.9, 'pop'); pushEv(S, 349.35, 'click'); pushEv(S, 349.45, 'chime'); items.forEach(r => pushEv(S, r[1], 'tick'));
}, (t, S) => {
  const pf = P(t, 343.8, 0.9, E.outCubic);
  S.feat.style.opacity = pf; S.feat.style.filter = (1 - pf) * 22 > 0.3 ? `blur(${(1 - pf) * 22}px)` : 'none';
  enter(S.card, t, 346.2, { from: 18, rest: 5, rise: 80 });
  S.cy.style.height = (130 * P(t, 346.5, 0.8, E.outCubic)) + 'px';
  S.ce.style.height = (130 * P(t, 347.3, 0.8, E.outCubic)) + 'px';
  fadeIn(S.btn, t, 345.0, 0.5, { sFrom: 0.85, blur: 14 });
  const pr = press(t, 349.35); S.btn.style.transform += ` scale(${pr.s})`;
  S.btn.style.boxShadow = `0 0 ${40 + 80 * bump(t, 349.35, 0.6)}px rgba(72,216,168,${0.55 + 0.4 * bump(t, 349.35, 0.6)}), 0 0 90px rgba(48,192,192,0.25)`;
  enter(S.ck, t, 350.0, { from: -18, rest: -5, slide: 120 });
  S.items.forEach(r => fadeIn(r.e, t, r.tt, 0.35, { slide: 30, rise: 0 }));
  S.cur.update(t);
  camSet(S, t, [{ t: 343.4, x: 760, y: 335, s: 1.5 }, { t: 344.9, x: 820, y: 340, s: 1.42 }, { t: 345.9, x: 1060, y: 600, s: 1.12 }, { t: 349.9, x: 1060, y: 610, s: 1.14 }, { t: 354.4, x: 1080, y: 620, s: 1.18 }], { ry0: -3, ry1: 3 });
});

// ============================================================ B46 automate
glassScene('g_automate', 'B46', 3, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 380, 200, 1160, null);
  c.innerHTML = `<div class="row"><div class="num">4</div><div><div class="eyebrow label-yellow">Step 4</div><div class="h1" style="margin-top:6px;font-size:58px">Put the plan to work</div></div></div>
    <div class="row" id="amt" style="margin-top:44px;gap:22px"><div class="pill" style="position:relative;height:96px;padding:0 34px;font-size:32px;font-weight:600;color:var(--gray)">Pick an amount you can invest</div><div class="chip" style="position:relative">every month</div></div>
    <div class="row" id="auto" style="margin-top:34px;justify-content:space-between;background:rgba(255,255,255,0.04);border:1px solid var(--hair);border-radius:24px;padding:26px 30px">
      <div class="h2" style="font-size:40px">Automate it</div>
      <div id="tg" style="width:132px;height:72px;border-radius:36px;background:#3a3b3f;position:relative"><div id="kn" style="position:absolute;top:8px;left:8px;width:56px;height:56px;border-radius:50%;background:#e8e8e8"></div></div></div>
    <div class="row" id="mk" style="margin-top:30px;gap:20px;opacity:0.5"><div id="eye"></div><div id="mc" style="position:relative;width:700px;height:90px"></div></div>`;
  icon(c.querySelector('#eye'), 'eyeoff', 54, '#a8a8a8');
  S.mc = lineChart(c.querySelector('#mc'), [[0, .5], [.1, .7], [.2, .4], [.3, .65], [.4, .35], [.5, .6], [.6, .45], [.7, .7], [.8, .5], [.9, .62], [1, .55]], { w: 700, h: 90, color: '#808080', glow: 'rgba(0,0,0,0)', sw: 3 });
  S.amt = c.querySelector('#amt'); S.auto = c.querySelector('#auto'); S.tg = c.querySelector('#tg'); S.kn = c.querySelector('#kn'); S.mk = c.querySelector('#mk');
  S.cur = cursor(cam, [{ t: 358.8, x: 1700, y: 900 }, { t: 359.3, x: 1386, y: 585 }, { t: 359.75, x: 1386, y: 585 }, { t: 360.4, x: 1750, y: 980 }]);
  S.cur.click(359.45, 1386, 585);
  S.st.push(sticker(ui, 'STOP CHECKING', { shape: 'pill', x: 1250, y: 150, rot: -17, t0: 360.8, t1: 363.1 }));
  pushEv(S, 354.3, 'rise'); pushEv(S, 357.0, 'tick'); pushEv(S, 358.6, 'tick'); pushEv(S, 359.45, 'click'); pushEv(S, 359.6, 'chime', { soft: 1 }); pushEv(S, 360.8, 'pop');
}, (t, S) => {
  enter(S.card, t, 354.25, { from: -20, rest: -5 });
  fadeIn(S.amt, t, 357.0, 0.4, { slide: 40, rise: 0 });
  fadeIn(S.auto, t, 358.2, 0.4, { slide: 40, rise: 0 });
  const on = P(t, 359.45, 0.25, E.outCubic);
  S.kn.style.left = (8 + 60 * on) + 'px';
  S.tg.style.background = on > 0.5 ? 'linear-gradient(90deg,#30c0c0,#48d8a8)' : '#3a3b3f';
  S.tg.style.boxShadow = on > 0.5 ? '0 0 24px rgba(72,216,168,0.6)' : 'none';
  S.auto.style.borderColor = on > 0.5 ? '#48d8a8' : 'var(--hair)';
  S.mk.style.opacity = 0.5 * P(t, 360.7, 0.4);
  S.mc.update(P(t, 360.7, 2.0, E.linear));
  S.cur.update(t);
  camSet(S, t, [{ t: 353.8, x: 960, y: 540, s: 0.98 }, { t: 358.9, x: 980, y: 560, s: 1.06 }, { t: 359.6, x: 1200, y: 600, s: 1.3 }, { t: 360.6, x: 1000, y: 640, s: 1.06 }, { t: 363.3, x: 1000, y: 660, s: 1.1 }], { ry0: 3, ry1: -3 });
});

// ============================================================ B49 part three
glassScene('g_part3', 'B49', 2, (S, cam, ui) => {
  S.eb = el(cam, 'eyebrow', 'Coming next'); place(S.eb, 360, 330, 1200); css(S.eb, { textAlign: 'center', fontSize: '26px' });
  S.t1 = el(cam, 'abs'); place(S.t1, 160, 380, 1600);
  S.t1.innerHTML = `<div style="text-align:center;font-size:170px;font-weight:800;letter-spacing:-0.04em">Part three</div>`;
  S.t2 = el(cam, 'abs'); place(S.t2, 160, 600, 1600);
  S.t2.innerHTML = `<div style="text-align:center;font-size:64px;font-weight:600;color:#a8a8a8">Exactly how, and <span style="color:#f0f060">how to stop it</span></div>`;
  pushEv(S, 388.05, 'rise'); pushEv(S, 389.0, 'tick'); pushEv(S, 390.4, 'shimmer');
}, (t, S) => {
  fadeIn(S.eb, t, 388.05, 0.5, { blur: 10 });
  fadeIn(S.t1, t, 388.2, 0.6, { sFrom: 0.9, blur: 18, rise: 30 });
  fadeIn(S.t2, t, 389.0, 0.5, { blur: 10 });
  camSet(S, t, [{ t: 387.7, x: 960, y: 540, s: 1.0 }, { t: 392.1, x: 960, y: 540, s: 1.14 }], { ry0: -3, ry1: 3 });
});

// ============================================================ B50 poll
glassScene('g_poll', 'B50', 0, (S, cam, ui) => {
  const c = S.card = el(cam, 'card pad'); place(c, 460, 180, 1000, null);
  c.innerHTML = `<div class="eyebrow">Comments</div>
    <div class="pill" style="position:relative;height:110px;padding:0 36px;font-size:36px;font-weight:500;margin-top:24px"><span id="q"></span></div>`;
  S.q = c.querySelector('#q');
  const opts = [['Real estate', 'house', 396.36], ['Stocks', 'chart', 397.22], ['Building your own business', 'brief', 398.06]];
  S.opts = opts.map(([txt, ic, tt], i) => {
    const r = el(c, 'row'); css(r, { marginTop: i ? '18px' : '34px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hair)', borderRadius: '24px', padding: '22px 26px' });
    iconTile(r, ic, 64); const tx = el(r, 'h3', txt); css(tx, { flex: 1 });
    return { r, tt, cy: 180 + 34 + 24 + 110 + 34 + i * 126 + 54 };
  });
  const keys = [{ t: 395.9, x: 1500, y: 1000 }];
  S.opts.forEach(o => { keys.push({ t: o.tt - 0.05, x: 1180, y: o.cy }); keys.push({ t: o.tt + 0.3, x: 1180, y: o.cy }); });
  S.cur = cursor(cam, keys);
  S.opts.forEach(o => { S.cur.click(o.tt, 1180, o.cy); pushEv(S, o.tt, 'click'); });
  pushEv(S, 391.9, 'rise', { soft: 1 }); pushEv(S, 393.55, 'keys', { n: 35, cps: 18 });
}, (t, S) => {
  enter(S.card, t, 391.85, { from: 20, rest: 5 });
  typed(S.q, 'Which path are you leaning towards?', t, 393.55, 18, { caretUntil: 396.0 });
  S.opts.forEach((o, i) => {
    fadeIn(o.r, t, 395.5 + i * 0.12, 0.35, { slide: 40, rise: 0 });
    const on = t > o.tt;
    o.r.style.borderColor = on ? '#48d8a8' : 'var(--hair)';
    o.r.style.boxShadow = on ? '0 0 24px rgba(72,216,168,0.3)' : 'none';
    o.r.style.transform += ` scale(${press(t, o.tt).s})`;
  });
  S.cur.update(t);
  camSet(S, t, [{ t: 391.5, x: 960, y: 520, s: 1.0 }, { t: 395.5, x: 960, y: 560, s: 1.06 }, { t: 399.8, x: 980, y: 640, s: 1.12 }], { ry0: -3, ry1: 3 });
});
