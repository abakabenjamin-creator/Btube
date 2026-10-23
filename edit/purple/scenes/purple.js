// Purple Creator-Explainer graphics layer. Pure function of source time t:
// R2.frame(t) draws everything that is not the presenter's camera image and
// reports whether the frame needs alpha (presenter underneath) or is opaque.
'use strict';

const PL = window.PLAN;
const NEON = '#F048F8', ORCHID = '#E078F0';
const beatAt = t => PL.beats.find(b => t >= b.t0 && t < b.t1) || PL.beats[PL.beats.length - 1];

// ---------------------------------------------------------------- glyphs
const G = {
  house: '<path d="M8 22 L24 9 L40 22 V40 H29 V29 H19 V40 H8 Z"/>',
  chart: '<path d="M7 36 L17 25 L25 30 L40 13"/><path d="M32 13 H40 V21"/>',
  brief: '<rect x="7" y="15" width="34" height="24" rx="5"/><path d="M18 15 V11 H30 V15 M7 25 H41"/>',
  coin: '<ellipse cx="24" cy="15" rx="14" ry="6"/><path d="M10 15 V33 C10 36.5 16 39 24 39 C32 39 38 36.5 38 33 V15 M10 24 C10 27.5 16 30 24 30 C32 30 38 27.5 38 24"/>',
  wrench: '<path d="M30 8 A9 9 0 0 0 22 21 L8 35 L13 40 L27 26 A9 9 0 0 0 40 18 L34 22 L29 19 L28 13 Z"/>',
  shield: '<path d="M24 7 L39 13 V24 C39 33 32 39 24 42 C16 39 9 33 9 24 V13 Z"/>',
  doc: '<path d="M12 6 H30 L38 14 V42 H12 Z M30 6 V14 H38 M18 22 H32 M18 29 H32 M18 36 H27"/>',
  box: '<path d="M8 15 L24 7 L40 15 V33 L24 41 L8 33 Z M8 15 L24 23 L40 15 M24 23 V41"/>',
  people: '<circle cx="17" cy="16" r="6"/><circle cx="32" cy="18" r="5"/><path d="M6 38 C6 30 11 26 17 26 C23 26 28 30 28 38 M28 30 C30 27 33 26 36 27 C40 28 42 32 42 37"/>',
  tag: '<path d="M7 24 V9 H22 L41 28 L28 41 Z"/><circle cx="15" cy="17" r="3"/>',
  leaf: '<path d="M10 38 C10 18 22 9 40 8 C40 27 31 38 12 38 Z M10 38 L28 20"/>',
  flask: '<path d="M19 7 H29 M21 7 V19 L9 39 C8 41 9 42 11 42 H37 C39 42 40 41 39 39 L27 19 V7 M14 31 H34"/>',
  bulb: '<path d="M17 30 C11 25 12 10 24 10 C36 10 37 25 31 30 V35 H17 Z M19 40 H29"/>',
  book: '<path d="M8 12 C14 10 20 11 24 14 C28 11 34 10 40 12 V37 C34 35 28 36 24 39 C20 36 14 35 8 37 Z M24 14 V39"/>',
  target: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="24" r="1.5"/>',
  grid: '<rect x="8" y="8" width="13" height="13" rx="2"/><rect x="27" y="8" width="13" height="13" rx="2"/><rect x="8" y="27" width="13" height="13" rx="2"/><rect x="27" y="27" width="13" height="13" rx="2"/>',
  search: '<circle cx="21" cy="21" r="12"/><path d="M30 30 L41 41"/>',
  check: '<circle cx="24" cy="24" r="16"/><path d="M16 24.5 L22 30 L33 18"/>',
  bolt: '<path d="M27 6 L11 27 H23 L20 42 L37 20 H25 Z"/>',
  eyeoff: '<path d="M5 24 C11 14 18 11 24 11 C30 11 37 14 43 24 C37 34 30 37 24 37 C18 37 11 34 5 24 Z"/><circle cx="24" cy="24" r="6"/><path d="M9 41 L39 7"/>',
  key: '<circle cx="16" cy="24" r="8"/><path d="M24 24 H42 M36 24 V31 M41 24 V29"/>',
};
const glyph = (name, color, sw = 3) => `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" stroke="${color || NEON}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${G[name]}</svg>`;
const SPARK = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="filter:drop-shadow(0 0 12px rgba(240,72,248,0.85))"><path d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2 Z" fill="${NEON}"/></svg>`;
const ARROW = `<svg viewBox="0 0 54 40" width="100%" height="100%"><path d="M4 20 H46 M32 6 L48 20 L32 34" fill="none" stroke="${NEON}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CURSOR = '<svg viewBox="0 0 34 44" width="34" height="44"><path d="M3 2 L3 34 L11 26 L17 40 L23 37.5 L17 24 L29 24 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
const PLATFORM_ICON = {
  YouTube: '<svg viewBox="0 0 50 50"><rect x="3" y="10" width="44" height="30" rx="9" fill="#FF0033"/><path d="M21 18 L33 25 L21 32 Z" fill="#fff"/></svg>',
  TikTok: '<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="23" fill="#000"/><path d="M28 11 V31 A6 6 0 1 1 22 25" fill="none" stroke="#25F4EE" stroke-width="4" transform="translate(-1.5,-1)"/><path d="M28 11 V31 A6 6 0 1 1 22 25" fill="none" stroke="#FE2C55" stroke-width="4" transform="translate(1.5,1)"/><path d="M28 11 V31 A6 6 0 1 1 22 25 M28 11 C29 16 33 18 37 18" fill="none" stroke="#fff" stroke-width="4"/></svg>',
  Instagram: '<svg viewBox="0 0 50 50"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset="0.35" stop-color="#FA7E1E"/><stop offset="0.6" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect x="3" y="3" width="44" height="44" rx="13" fill="url(#ig)"/><rect x="13" y="13" width="24" height="24" rx="7" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="25" cy="25" r="5.5" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="34" cy="16" r="2" fill="#fff"/></svg>',
};

// ---------------------------------------------------------------- helpers
const show = (e, on) => { e.style.display = on ? '' : 'none'; return on; };
const inOut = (t, t0, t1, din = 0.25, dout = 0.2) => P(t, t0, din, E.outCubic) * (1 - P(t, t1 - dout, dout, E.inCubic));
const blurFade = (e, p, rise = 0) => {
  e.style.opacity = p.toFixed(3);
  e.style.filter = p < 0.99 ? `blur(${(8 * (1 - p)).toFixed(1)}px)` : 'none';
  if (rise) e.style.transform = `translateY(${(rise * (1 - p)).toFixed(1)}px)`;
};
const typeText = (str, t, t0, cps = 30) => str.slice(0, clamp(Math.floor((t - t0) * cps), 0, str.length));
const LOW = 0.84 * 1080;  // lower-third centre line (16:9: 72-88 % of frame height)

// ---------------------------------------------------------------- build
const L = {};
function build() {
  const st = document.getElementById('stage');
  L.bg = el(st, 'stagebg');
  L.low = el(st, 'lowgrad');

  // ---- web beats
  L.webs = PL.beats.filter(b => b.layout === 'WEB').map(b => {
    const spec = WEB[b.web];
    const w = el(st, 'win');
    place(w, 240, 110, 1440, 816);
    const chrome = el(w, 'chrome');
    el(chrome, 'd'); el(chrome, 'd'); el(chrome, 'd');
    const url = el(chrome, 'url');
    url.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M7 10 V7 A5 5 0 0 1 17 7 V10 M5 10 H19 V21 H5 Z" fill="none" stroke="#d8d0dc" stroke-width="2"/></svg><span></span><span class="caret" style="display:inline-block;width:2px;height:22px;background:#d8d0dc"></span>';
    const view = el(w, 'view'); place(view, 0, 56, 1440, 760); view.style.position = 'absolute';
    const pane = el(view, 'abs'); pane.style.transformOrigin = '0 0';
    const img = el(pane, '', null, 'img'); img.src = `../captures/${b.web}.png`; img.style.width = '1440px';
    const hls = spec.hl.map(h => { const d = el(pane, 'hlbox'); place(d, h.x / 2, h.y / 2, 0, h.h / 2); return { d, h }; });
    const cur = el(view, 'cursor', CURSOR);
    return { b, spec, w, url: url.children[1], caret: url.children[2], pane, hls, cur };
  });
  L.pip = el(st, 'pip'); place(L.pip, PL.pip.x, PL.pip.y, PL.pip.w, PL.pip.h);

  // ---- cards
  L.cards = PL.beats.filter(b => b.layout === 'CARD').map(b => buildCard(st, b));

  // ---- presenter overlays
  L.caps = PL.captions.map(c => {
    const e = el(st, 'cap');
    e.style.top = (c.lines.length > 1 ? LOW - 62 : LOW - 30) + 'px';
    const words = [];
    c.lines.forEach((ln, i) => {
      const d = el(e, 'ln');
      if (i === 0) el(d, 'dot', null, 'span');
      ln.forEach(x => { const s = el(d, 'w' + (x.k ? ' k' : ''), escapeHtml(x.w), 'span'); words.push({ s, t: x.s }); });
    });
    return { c, e, words };
  });
  L.ovs = PL.overlays.map(o => buildOverlay(st, o));
}

function buildOverlay(st, o) {
  const r = { o };
  if (o.kind === 'chip') {
    r.e = el(st, 'chip'); r.e.style.top = (LOW - 40) + 'px';
    r.sp = el(r.e, 'spark', SPARK); r.tx = el(r.e, 'txt', escapeHtml(o.text));
  } else if (o.kind === 'math') {
    r.e = el(st, 'math'); r.e.style.top = (LOW - 92) + 'px';
    r.l1 = el(r.e, 'l1'); r.l2 = el(r.e, 'l2', escapeHtml(o.result[1]));
  } else if (o.kind === 'flow') {
    r.e = el(st, 'flow'); r.e.style.top = (LOW - 110) + 'px';
    const n = o.tiles.length, w = n > 4 ? 236 : 270;
    r.items = o.tiles.map(([tt, lab, ic], i) => {
      const a = i ? el(r.e, 'arrow', ARROW) : null;
      const tile = el(r.e, 'tile glass');
      tile.style.width = w + 'px';
      el(tile, 'ico', glyph(ic)); el(tile, 'lab', escapeHtml(lab));
      return { tt, tile, a };
    });
  } else if (o.kind === 'logos') {
    r.e = el(st, 'logos'); r.e.style.top = (LOW - 160) + 'px';
    r.items = o.logos.map(([tt, name, lab]) => {
      const lg = el(r.e, 'logo');
      el(lg, 'badge', `<span style="font:800 46px 'Instrument Sans';letter-spacing:0.02em;color:#124191">${name}</span>`);
      el(lg, 'lab', escapeHtml(lab));
      return { tt, lg };
    });
  } else if (o.kind === 'cta') {
    r.e = el(st, 'cta'); r.e.style.top = (LOW - 50) + 'px';
    r.e.innerHTML = `Comment "<span class="accent">${o.word}</span>" down below!`;
  } else if (o.kind === 'platforms') {
    r.items = o.items.map((name, i) => { const p = el(st, 'plat', PLATFORM_ICON[name] + `<span>${name}</span>`); place(p, 1480, 110 + i * 92); return p; });
  }
  return r;
}

// ---------------------------------------------------------------- cards
const MENU = ['Real estate', 'Stocks', 'Your own business', 'You', 'Index funds', 'Your foundation'];
const MENU_ICONS = ['house', 'chart', 'brief', 'target', 'grid', 'shield'];
const STEPS = ['High-interest debt', 'Emergency fund', 'Employer match', 'Put the plan to work'];
const STEP_ICONS = ['coin', 'shield', 'people', 'bolt'];
const POLL = ['Real estate', 'Stocks', 'Building your own business'];

function buildCard(st, b) {
  const c = { b, e: el(st, 'abs') };
  css(c.e, { inset: '0' });
  let title, sub, names, icons;
  if (b.card === 'menu') { title = 'Where the money goes'; sub = '(three paths and the one that beats them all)'; names = MENU; icons = MENU_ICONS; }
  if (b.card === 'steps') { title = 'Fix your foundation'; sub = '(four steps, and the order matters)'; names = STEPS; icons = STEP_ICONS; }
  if (b.card === 'poll') { title = 'Which path are you leaning towards?'; sub = '(tell me in the comments)'; names = POLL; icons = ['house', 'chart', 'brief']; }
  if (b.card === 'bizflow') {
    c.title = el(c.e, 'menu-title', 'Your own business'); c.title.style.top = '170px';
    c.sub = el(c.e, 'menu-sub', '(what it can become)'); c.sub.style.top = '285px';
    c.flow = el(c.e, 'bigflow'); c.flow.style.top = '430px';
    c.items = [[164.58, 'Income outside your day job', 'coin'], [168.92, 'An asset you sell or pass down', 'key']].map(([tt, lab, ic], i) => {
      const a = i ? el(c.flow, 'arrow', ARROW) : null;
      const tile = el(c.flow, 'tile glass'); el(tile, 'ico', glyph(ic)); el(tile, 'lab', escapeHtml(lab));
      return { tt, tile, a };
    });
    return c;
  }
  c.title = el(c.e, 'menu-title', escapeHtml(title)); c.title.style.top = '78px';
  c.sub = el(c.e, 'menu-sub', escapeHtml(sub)); c.sub.style.top = '188px';
  c.rows = names.map((n, i) => {
    const r = el(c.e, 'row');
    const tab = el(r, 'tab', String(i + 1).padStart(2, '0'));
    const nm = el(r, 'name', '');
    const ri = el(r, 'ri', glyph(icons[i], ORCHID, 2.4));
    return { r, tab, nm, ri, text: n };
  });
  return c;
}

// Which row is active at time t, and since when.
function activeRow(b, t) {
  if (b.card === 'menu') return { i: b.active, at: b.t0 + 0.35 };
  if (b.card === 'steps') {
    if (b.t0 < 299) return t >= 297.82 ? { i: 0, at: 297.82 } : { i: -1, at: 0 };
    return { i: b.active, at: b.t0 + 0.3 };
  }
  const times = [396.36, 397.22, 398.06];
  let i = -1, at = 0;
  times.forEach((tt, k) => { if (t >= tt) { i = k; at = tt; } });
  return { i, at };
}

function cardFrame(c, t) {
  const b = c.b;
  const age = t - b.t0;
  if (b.card === 'bizflow') {
    blurFade(c.title, P(t, b.t0 + 0.1, 0.4), 20); blurFade(c.sub, P(t, b.t0 + 0.3, 0.4));
    c.items.forEach(it => { const p = P(t, it.tt, 0.3, E.outBack); it.tile.style.opacity = clamp(p); it.tile.style.transform = `scale(${0.8 + 0.2 * p})`; if (it.a) it.a.style.opacity = clamp(p); });
    return;
  }
  // first card of a kind cascades in from the top; later ones arrive mid-wheel
  const first = !PL.beats.some(x => x.layout === 'CARD' && x.card === b.card && x.t0 < b.t0);
  const titleT = b.t0 + 0.05;
  blurFade(c.title, P(t, titleT, 0.4), 20);
  if (c.title.dataset.full == null) c.title.dataset.full = c.title.textContent;
  c.title.textContent = typeText(c.title.dataset.full, t, titleT, 40);
  blurFade(c.sub, P(t, titleT + 0.3, 0.4));
  const act = activeRow(b, t);
  const rowsAt = b.card === 'steps' && first ? 295.18 : b.t0 + 0.05;
  // wheel position: previous row -> active row
  const prev = b.card === 'menu' ? Math.max(0, act.i - 1) : Math.max(0, act.i);
  const wheel = act.i < 0 ? (c.rows.length - 1) / 2 : lerp(prev, act.i, P(t, act.at - 0.25, 0.5, E.inOutCubic));
  const n = c.rows.length;
  c.rows.forEach((row, i) => {
    const drop = first ? P(t, rowsAt + i * 0.07, 0.4, E.outCubic) : P(t, b.t0, 0.3, E.outCubic);
    const off = i - wheel;
    const y = 640 + off * 124 - 50 - (1 - drop) * 220;
    const isAct = i === act.i && t >= act.at - 0.1;
    const sc = isAct ? 1 + 0.1 * P(t, act.at - 0.1, 0.35, E.outCubic) : 0.94;
    const ahead = act.i >= 0 && i > act.i;   // points not covered yet
    const dim = act.i < 0 ? 0.85 : isAct ? 1 : ahead ? 0.75 : 0.4;
    row.r.style.top = y + 'px';
    const clear = clamp((y - 200) / 90) * clamp((1010 - y) / 90);   // wheel: rows fade out before the title and the bottom edge
    row.r.style.opacity = (drop * dim * clear).toFixed(3);
    row.r.style.transform = `scale(${sc.toFixed(3)})`;
    // points already covered stay readable; points still to come keep their pill frame
    // but their number, name and icon are blurred so they can't be read yet
    const hide = ahead ? P(t, act.at - 0.25, 0.3, E.outCubic) : 0;
    const f = hide > 0.01 ? `blur(${(14 * hide).toFixed(1)}px)` : 'none';
    row.tab.style.filter = row.nm.style.filter = row.ri.style.filter = f;
    row.r.style.filter = 'none';
    row.r.style.boxShadow = isAct ? '0 0 30px rgba(240,72,248,0.45), 0 12px 30px rgba(0,0,0,0.45)' : '0 12px 30px rgba(0,0,0,0.45)';
    row.nm.textContent = isAct ? typeText(row.text, t, act.at, 32) : row.text;
    if (b.card === 'menu' && i > act.i && first) row.nm.textContent = row.text;
  });
  void n; void age;
}

// ---------------------------------------------------------------- web beats
// hl boxes and scroll/zoom keys in capture-image pixels (captures are 2880 px wide).
const WEB = {
  cpi_calc: { hl: [{ x: 440, y: 508, w: 275, h: 48, t: 42.96 }],
    keys: [{ t: 40.8, s: 0, z: 1 }, { t: 42.3, s: 0, z: 1 }, { t: 43.1, s: 0, z: 1.9, fx: 578, fy: 532 }, { t: 45.4, s: 0, z: 1.9, fx: 578, fy: 532 }, { t: 46.2, s: 0, z: 1 }] },
  mortgage: { hl: [{ x: 128, y: 5058, w: 360, h: 50, t: 73.4 }, { x: 128, y: 794, w: 360, h: 50, t: 77.04 }],
    keys: [{ t: 71.4, s: 4300, z: 1 }, { t: 72.6, s: 4300, z: 1 }, { t: 73.4, s: 4300, z: 1.8, fx: 330, fy: 5083 }, { t: 75.5, s: 4300, z: 1.8, fx: 330, fy: 5083 },
      { t: 76.1, s: 4300, z: 1 }, { t: 76.9, s: 0, z: 1 }, { t: 77.6, s: 0, z: 1.8, fx: 330, fy: 819 }, { t: 79.0, s: 0, z: 1.8, fx: 330, fy: 819 }, { t: 79.8, s: 0, z: 1 }] },
  sp500: { hl: [{ x: 128, y: 1076, w: 412, h: 50, t: 113.18 }, { x: 128, y: 994, w: 412, h: 50, t: 117.68 }],
    keys: [{ t: 110.3, s: 0, z: 1 }, { t: 112.3, s: 0, z: 1 }, { t: 113.1, s: 0, z: 1.8, fx: 340, fy: 1060 }, { t: 118.3, s: 0, z: 1.8, fx: 340, fy: 1060 }, { t: 119.0, s: 0, z: 1.2 }] },
  census: { hl: [{ x: 624, y: 414, w: 924, h: 70, t: 181.24 }],
    keys: [{ t: 180.0, s: 0, z: 1 }, { t: 180.4, s: 0, z: 1 }, { t: 181.2, s: 0, z: 1.6, fx: 1090, fy: 458 }, { t: 183.4, s: 0, z: 1.6, fx: 1090, fy: 458 }, { t: 184.0, s: 0, z: 1.2 }] },
  fdic: { hl: [{ x: 806, y: 690, w: 400, h: 62, t: 336.9 }],
    keys: [{ t: 333.9, s: 0, z: 1 }, { t: 334.8, s: 0, z: 1 }, { t: 335.6, s: 0, z: 1.9, fx: 1010, fy: 720 }, { t: 340.6, s: 0, z: 1.9, fx: 1010, fy: 720 }, { t: 341.4, s: 0, z: 1 }] },
};

function webKeys(keys, t) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
  if (t > keys[keys.length - 1].t) a = b;
  const q = a === b ? 0 : E.inOutCubic(clamp((t - a.t) / (b.t - a.t)));
  const fx = (b.fx != null ? b.fx : a.fx != null ? a.fx : 1440), fy = (b.fy != null ? b.fy : a.fy != null ? a.fy : a.s + 760);
  return { s: lerp(a.s, b.s, q), z: lerp(a.z, b.z, q), fx, fy };
}

function webFrame(w, t) {
  const b = w.b;
  // URL types in on arrival
  w.url.textContent = typeText(b.url, t, b.t0, 70);
  w.caret.style.opacity = (t - b.t0) * 70 < b.url.length + 6 && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0;
  const k = webKeys(w.spec.keys, t);
  // proof push-in happens INSIDE the browser window: the window frame never moves or grows
  const px = k.fx / 2, py = k.fy / 2;                        // detail, page css px
  const q = clamp((k.z - 1) / 0.9);
  const tx = lerp(px, 720, q), ty = lerp(py - k.s / 2, 380, q);  // detail drifts to the window centre as we zoom
  const ox = tx - k.z * px, oy = ty - k.z * py;
  w.pane.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${k.z.toFixed(4)})`;
  w.w.style.transform = 'none';
  // highlighter sweeps left to right in ~300 ms
  w.hls.forEach(({ d, h }) => { d.style.width = (h.w / 2 * P(t, h.t, 0.3, E.inOutCubic)).toFixed(1) + 'px'; });
  // cursor glides to the detail, then drags along it with the highlight
  const h = w.spec.hl.filter(x => t >= x.t - 1.0).pop() || w.spec.hl[0];
  const cx0 = 1200, cy0 = 620;
  const cx1 = ox + k.z * h.x / 2, cy1 = oy + k.z * (h.y / 2 + h.h / 4);   // through the zoom
  const pm = P(t, h.t - 0.9, 0.8, E.inOutCubic), pd = P(t, h.t, 0.3, E.inOutCubic);
  const cx = lerp(cx0, cx1, pm) + pd * k.z * h.w / 2, cy = lerp(cy0, cy1, pm);
  place(w.cur, cx, cy);
  w.cur.style.opacity = t > b.t0 + 0.6 ? 1 : 0;
}

// ---------------------------------------------------------------- overlays
function ovFrame(r, t) {
  const o = r.o;
  const on = t >= o.t0 - 0.05 && t < o.t1;
  if (o.kind === 'platforms') { r.items.forEach((p, i) => { const q = inOut(t, o.t0 + i * 0.15, o.t1, 0.3, 0.3); show(p, q > 0.001); p.style.opacity = q; p.style.transform = `translateX(${(40 * (1 - q)).toFixed(1)}px)`; }); return; }
  if (!show(r.e, on)) return;
  const fade = 1 - P(t, o.t1 - 0.2, 0.2, E.inCubic);
  r.e.style.opacity = fade;
  if (o.kind === 'chip') {
    const p = clamp((t - o.t0) / 0.25);
    const s = p < 0.7 ? 1.1 * E.outCubic(p / 0.7) : lerp(1.1, 1, (p - 0.7) / 0.3);
    r.sp.style.transform = `scale(${s.toFixed(3)}) rotate(${(20 * (1 - p)).toFixed(1)}deg)`;
    const q = P(t, o.t0 + 0.12, 0.3, E.outCubic);
    r.tx.style.opacity = q; r.tx.style.transform = `translateX(${(-30 * (1 - q)).toFixed(1)}px)`;
    r.tx.style.clipPath = `inset(0 ${(100 * (1 - q)).toFixed(1)}% 0 0)`;
  } else if (o.kind === 'math') {
    let s = '';
    o.terms.forEach(([tt, term]) => { if (t >= tt) s += (s ? ' ' : '') + typeText(term, t, tt, 40); });
    r.l1.textContent = s;
    const q = P(t, o.result[0], 0.35, E.outCubic);
    r.l2.style.opacity = q; r.l2.style.transform = `translateY(${(14 * (1 - q)).toFixed(1)}px)`;
  } else if (o.kind === 'flow') {
    r.items.forEach(it => { const p = P(t, it.tt, 0.28, E.outBack); it.tile.style.opacity = clamp(p); it.tile.style.transform = `scale(${(0.82 + 0.18 * p).toFixed(3)})`; if (it.a) it.a.style.opacity = clamp(p); });
  } else if (o.kind === 'logos') {
    r.items.forEach((it, i) => { const p = P(t, it.tt + i * 0.12, 0.35, E.outCubic); it.lg.style.opacity = p; it.lg.style.transform = `translateX(${(-30 * (1 - p)).toFixed(1)}px)`; });
  } else if (o.kind === 'cta') {
    const p = P(t, o.t0, 0.35, E.outCubic);
    r.e.style.opacity = p * fade; r.e.style.transform = `translateX(-50%) translateY(${(24 * (1 - p)).toFixed(1)}px)`;
  }
}

function capFrame(c, t) {
  if (!show(c.e, t >= c.c.t0 && t < c.c.t1)) return;
  c.e.style.opacity = 1 - P(t, c.c.t1 - 0.15, 0.15, E.inCubic);
  c.words.forEach(w => blurFade(w.s, P(t, w.t - 0.02, 0.12, E.outCubic)));
}

// ---------------------------------------------------------------- frame
function frame(t) {
  const b = beatAt(t);
  const pres = b.layout === 'P';
  show(L.bg, !pres);
  show(L.low, pres);
  show(L.pip, b.layout === 'WEB');
  L.webs.forEach(w => { if (show(w.w, w.b === b)) webFrame(w, t); });
  L.cards.forEach(c => { if (show(c.e, c.b === b)) cardFrame(c, t); });
  L.caps.forEach(c => { if (pres) capFrame(c, t); else show(c.e, false); });
  L.ovs.forEach(r => { if (pres) ovFrame(r, t); else { if (r.e) show(r.e, false); (r.o.kind === 'platforms') && r.items.forEach(p => show(p, false)); } });
  return { alpha: pres, layout: b.layout, beat: b.id };
}

window.R2 = {
  ready: () => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))]),
  frame,
};
build();
