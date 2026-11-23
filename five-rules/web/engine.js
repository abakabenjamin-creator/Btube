// Five Rules of Money — graphics engine (Canvas 2D, deterministic: drawAt(t) paints frame t).
// Palette (brand): red primary, white secondary, yellow = one key word, green = money/gains, black = backgrounds.
const C = { red: '#E10600', white: '#FFFFFF', yellow: '#FFD400', green: '#00A651', black: '#0A0A0A',
  dim: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.14)', glass: 'rgba(10,10,10,0.72)' };
const W = 1920, H = 1080;
// Typeface: Google Sans (closest open match to the monk1 template's rounded geometric sans), tight tracking.
const F = { disp: '"Google Sans", sans-serif', body: '"Google Sans", sans-serif' };
let SHADOW = false;   // soft drop shadow for text that sits on footage (template look)

const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const G0 = cv.getContext('2d');
const oc = document.createElement('canvas'); oc.width = W; oc.height = H; const OG = oc.getContext('2d');
let g = G0;

// ---------- easing / helpers
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const prog = (t, a, d) => clamp((t - a) / d);
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function font(size, weight = 700, fam) {   // channel font: Inter, heavy weights; 900 = impact
  const w = weight === 900 ? 900 : weight >= 750 ? 800 : weight >= 650 ? 700 : 600;
  g.font = `${w} ${size}px "Inter", sans-serif`; g.letterSpacing = `${(-0.015 * size).toFixed(2)}px`; }
// Word entrance (template DNA): the next word rises slowly from below, small and dim, and settles into line beside the previous one.
const RISE = { dur: 0.6, dy: 0.6, s0: 0.72, a0: 0.2 };
function wordIn(p) { const q = ease(p); return { dy: (1 - q) * RISE.dy, sc: RISE.s0 + (1 - RISE.s0) * q, a: RISE.a0 + (1 - RISE.a0) * q * q }; }
function shadowOn(k = 1) { if (!SHADOW) return; g.shadowColor = `rgba(0,0,0,${0.5 * k})`; g.shadowBlur = 18; g.shadowOffsetY = 3; }
function shadowOff() { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }
// Frosted-glass capsule (template style): translucent white gradient, bright rim, soft top sheen. tint = optional accent glass
function glass(x, y, w, h, r, tint) {
  const gr = g.createLinearGradient(x, y, x + w, y + h);
  if (tint) { gr.addColorStop(0, hexA(tint, 0.55)); gr.addColorStop(1, hexA(tint, 0.85)); }
  else { gr.addColorStop(0, 'rgba(40,40,44,0.62)'); gr.addColorStop(0.5, 'rgba(120,120,126,0.48)'); gr.addColorStop(1, 'rgba(225,225,230,0.50)'); }
  rr(x, y, w, h, r); g.fillStyle = gr; g.fill();
  const sh = g.createLinearGradient(0, y, 0, y + h); sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.stroke();
}
function money(v, d = 0) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtNum(v, e) {
  if (e.fmt === 'money') return money(v, e.dec || 0);
  if (e.fmt === 'M') return '$' + (v / 1e6).toFixed(e.dec ?? 2) + 'M';
  if (e.fmt === 'k') return '$' + Math.round(v / 1000).toLocaleString('en-US') + 'k';
  return (e.prefix || '') + Number(v).toFixed(e.dec || 0) + (e.suffix || '');
}

// ---------- rich text: "plain *yellow* [green] {red} ~white~" markers color single words/phrases
function parseRich(s) {
  const out = []; const re = /(\*[^*]+\*|\[[^\]]+\]|\{[^}]+\}|~[^~]+~)/g; let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ s: s.slice(i, m.index), c: null });
    const k = m[0][0], body = m[0].slice(1, -1);
    out.push({ s: body, c: k === '*' ? C.yellow : k === '[' ? C.green : k === '{' ? C.red : C.white });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ s: s.slice(i), c: null });
  // split into words keeping color
  const words = [];
  for (const p of out) for (const w of p.s.split(/(\s+)/)) if (w.trim()) words.push({ w, c: p.c });
  return words;
}

// Draw a line of rich text, optionally word-by-word reveal. Returns width.
function richLine(e, t) {
  let size = (e.size || 64) * (e.impact ? 1.15 : 1); font(size, e.impact ? 900 : (e.weight || 700));
  const words = parseRich(e.str); let sp = g.measureText(' ').width;
  let widths = words.map(w => g.measureText(w.w).width);
  let total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  if (e.maxw && total > e.maxw) { size *= e.maxw / total; font(size, e.impact ? 900 : (e.weight || 700));
    sp = g.measureText(' ').width; widths = words.map(w => g.measureText(w.w).width); total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1); }
  let x = e.align === 'left' ? e.x : e.align === 'right' ? e.x - total : e.x - total / 2;
  const n = words.length, span = e.span ?? (e.words ? Math.min(1.2, 0.18 * n) : 0);
  g.textBaseline = 'alphabetic';
  words.forEach((w, i) => {
    const a0 = e.at + (n > 1 ? span * i / (n - 1) : 0);
    const p = prog(t, a0, RISE.dur);
    if (t >= a0) { const wi = wordIn(p);
      g.globalAlpha = wi.a * (e.alpha ?? 1) * fadeOut(e, t);
      g.fillStyle = w.c || e.color || C.white;
      const sc = wi.sc; g.save(); g.translate(x, e.y + wi.dy * size); g.scale(sc, sc);
      shadowOn(); g.fillText(w.w, 0, 0); shadowOff(); g.restore();
    }
    x += widths[i] + sp;
  });
  g.globalAlpha = 1;
  if (e.strike != null) {   // red strike-through drawn left→right
    const p = ease(prog(t, e.strike, 0.35));
    const x0 = e.align === 'left' ? e.x : e.align === 'right' ? e.x - total : e.x - total / 2;
    g.fillStyle = C.red; g.fillRect(x0 - 8, e.y - size * 0.33, (total + 16) * p, Math.max(6, size * 0.09));
  }
  return total;
}
function fadeOut(e, t) { return e.until != null ? 1 - ease(prog(t, e.until, 0.3)) : 1; }

// ---------- elements
const EL = {
  text: richLine,
  num(e, t) {   // count-up number
    const p = easeIO(prog(t, e.at, e.dur ?? 1.2)); if (t < e.at) return;
    const v = (e.from ?? 0) + ((e.to) - (e.from ?? 0)) * p;
    font(e.size || 120, e.impact === false ? 700 : 900); g.fillStyle = e.color || C.white;
    g.textAlign = e.align || 'center'; g.globalAlpha = ease(prog(t, e.at, 0.25)) * fadeOut(e, t);
    g.fillText(fmtNum(v, e), e.x, e.y); g.textAlign = 'left'; g.globalAlpha = 1;
  },
  pill(e, t) {   // rounded label box
    const p = ease(prog(t, e.at, 0.35)); if (p <= 0) return;
    font(e.size || 40, e.weight || 600, e.font || F.body);
    const tw = g.measureText(e.str).width, pw = e.w || tw + 64, ph = (e.size || 40) * 1.9;
    const x = e.align === 'left' ? e.x : e.x - pw / 2, y = e.y - ph / 2 + (1 - p) * 20;
    g.globalAlpha = p * fadeOut(e, t);
    glass(x, y, pw, ph, ph / 2, e.tint === undefined ? C.red : e.tint);
    g.fillStyle = e.color || C.white; g.textBaseline = 'middle'; SHADOW = true; shadowOn(0.8);
    g.fillText(e.str, x + (pw - tw) / 2, y + ph / 2 + 2); shadowOff(); g.textBaseline = 'alphabetic'; g.globalAlpha = 1;
  },
  rect(e, t) { const p = ease(prog(t, e.at, e.dur ?? 0.4)); if (p <= 0) return; g.globalAlpha = (e.alpha ?? 1) * fadeOut(e, t);
    g.fillStyle = e.color; const w = e.grow === 'x' ? e.w * p : e.w, h = e.grow === 'y' ? e.h * p : e.h;
    rr(e.x, e.grow === 'y' ? e.y + e.h - h : e.y, Math.max(w, 0.1), Math.max(h, 0.1), e.r ?? 10); g.fill(); g.globalAlpha = 1; },
  line(e, t) { const p = ease(prog(t, e.at, e.dur ?? 0.5)); if (p <= 0) return; g.strokeStyle = e.color || C.faint; g.lineWidth = e.lw || 3;
    g.globalAlpha = fadeOut(e, t); g.beginPath(); g.moveTo(e.x1, e.y1); g.lineTo(e.x1 + (e.x2 - e.x1) * p, e.y1 + (e.y2 - e.y1) * p); g.stroke(); g.globalAlpha = 1; },
  dot(e, t) { const p = ease(prog(t, e.at, 0.3)); if (p <= 0) return; g.globalAlpha = fadeOut(e, t); g.fillStyle = e.color || C.red;
    g.beginPath(); g.arc(e.x, e.y, (e.r || 12) * p, 0, 7); g.fill(); g.globalAlpha = 1; },
  lower(e, t) { const p = ease(prog(t, e.at, 0.4)); if (p <= 0) return; g.globalAlpha = p * fadeOut(e, t);
    glass(e.x, e.y - (1 - p) * 14, e.w, e.h, 30, null); g.globalAlpha = 1; },
  photo(e, t) { const im = IMG[e.src]; if (!im || t < e.at) return; const p = ease(prog(t, e.at, 0.6));
    const z = 1.04 + 0.06 * prog(t, e.at, e.dur ?? 8), iw = im.width, ih = im.height;
    const sc = Math.max(e.w / iw, e.h / ih) * z, dw = iw * sc, dh = ih * sc;
    const fx = e.fx ?? 0.5, fy = e.fy ?? 0.35;
    g.save(); g.globalAlpha = p * fadeOut(e, t); rr(e.x, e.y, e.w, e.h, e.r ?? 0); g.clip();
    if (e.gray) g.filter = 'grayscale(1) contrast(1.08)';
    g.drawImage(im, e.x + (e.w - dw) * fx, e.y + (e.h - dh) * fy, dw, dh); g.filter = 'none';
    if (e.fade === 'left') { const gr = g.createLinearGradient(e.x, 0, e.x + 260, 0); gr.addColorStop(0, C.black); gr.addColorStop(1, 'rgba(10,10,10,0)'); g.fillStyle = gr; g.fillRect(e.x, e.y, 260, e.h); }
    const gb = g.createLinearGradient(0, e.y + e.h - 220, 0, e.y + e.h); gb.addColorStop(0, 'rgba(10,10,10,0)'); gb.addColorStop(1, 'rgba(10,10,10,0.7)'); g.fillStyle = gb; g.fillRect(e.x, e.y + e.h - 220, e.w, 220);
    g.restore();
    if (e.credit) { g.globalAlpha = p * fadeOut(e, t); font(20, 600); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(e.credit, e.x + 280, e.y + e.h - 18); g.globalAlpha = 1; }
  },
  chart: drawChart, bars: drawBars, wave: drawWave, tree: drawTree, map: drawMap,
};

// Growth chart: series = [{ys:[...per year], color, label, labelAt}] ; draws as the year sweeps
function drawChart(e, t) {
  if (t < e.at) return;
  const p = easeIO(prog(t, e.at, e.dur ?? 3)); const N = e.years;
  const max = e.max; const X = yr => e.x + e.w * yr / N, Y = v => e.y + e.h - e.h * v / max;
  g.globalAlpha = ease(prog(t, e.at, 0.4)) * fadeOut(e, t);
  // grid + axis labels
  font(26, 500, F.body); g.fillStyle = C.dim; g.strokeStyle = C.faint; g.lineWidth = 2;
  for (const gv of e.grid || []) { g.beginPath(); g.moveTo(e.x, Y(gv)); g.lineTo(e.x + e.w, Y(gv)); g.stroke();
    g.textAlign = 'right'; g.fillText(fmtNum(gv, { fmt: e.yfmt || 'k' }), e.x - 18, Y(gv) + 9); }
  g.textAlign = 'center';
  for (const tk of e.xticks || []) { const [yr, lab] = Array.isArray(tk) ? tk : [tk, `Yr ${tk}`]; g.fillText(lab, X(yr), e.y + e.h + 46); }
  g.textAlign = 'left';
  g.beginPath(); g.moveTo(e.x, e.y + e.h); g.lineTo(e.x + e.w, e.y + e.h); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
  const yrNow = N * p;
  for (const s of e.series) {
    const pts = []; for (let k = 0; k <= 200; k++) { const yr = N * k / 200; if (yr > yrNow + 1e-6) break; pts.push([yr, interp(s.ys, yr)]); }
    if (pts.length < 2) continue;
    // area
    g.beginPath(); g.moveTo(X(pts[0][0]), Y(0)); for (const [a, b] of pts) g.lineTo(X(a), Y(b)); g.lineTo(X(pts[pts.length - 1][0]), Y(0)); g.closePath();
    g.fillStyle = s.fill || hexA(s.color, 0.16); g.fill();
    g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)));
    g.strokeStyle = s.color; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke();
    const [la, lb] = pts[pts.length - 1];
    g.fillStyle = s.color; g.beginPath(); g.arc(X(la), Y(lb), 13, 0, 7); g.fill();
    if (s.label !== false) { font(s.lsize || 54, 700); g.fillStyle = s.lcolor || s.color; g.textAlign = s.lalign || 'left';
      g.fillText(fmtNum(lb, { fmt: s.fmt || 'money' }), X(la) + (s.lalign === 'right' ? -28 : 28), Y(lb) + (s.ldy ?? 18)); g.textAlign = 'left'; }
  }
  g.globalAlpha = 1;
}
function interp(ys, yr) { const i = Math.floor(yr), f = yr - i; if (i >= ys.length - 1) return ys[ys.length - 1]; return ys[i] + (ys[i + 1] - ys[i]) * f; }
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// Horizontal bars: rows [{label, value, color, at, valueStr}] scaled to e.max
function drawBars(e, t) {
  e.rows.forEach((r, i) => {
    const p = easeIO(prog(t, r.at, r.dur ?? 1.1)); if (t < r.at) return;
    const y = e.y + i * e.gap; g.globalAlpha = ease(prog(t, r.at, 0.3)) * fadeOut(e, t);
    font(38, 600, F.body); g.fillStyle = C.white; g.fillText(r.label, e.x, y - 22);
    rr(e.x, y, e.w, e.h, e.h / 2); g.fillStyle = C.faint; g.fill();
    let x = e.x; for (const s of r.segs) { const w = e.w * s.v / e.max * p; if (w > 1) { rr(x, y, w, e.h, Math.min(e.h / 2, w / 2)); g.fillStyle = s.color; g.fill(); } x += w; }
    font(46, 700); g.fillStyle = r.vcolor || C.white; g.textAlign = 'right';
    g.fillText(r.valueStr, e.x + e.w, y - 22); g.textAlign = 'left'; g.globalAlpha = 1;
  });
}
// Tide: a slowly rising red waterline with a gentle swell
function drawWave(e, t) {
  if (t < e.at) return; const p = easeIO(prog(t, e.at, e.dur ?? 6));
  const base = e.y0 + (e.y1 - e.y0) * p;
  g.globalAlpha = ease(prog(t, e.at, 0.6)) * fadeOut(e, t);
  for (let L = 0; L < 3; L++) {
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, base + L * 34 + Math.sin(x / 210 + t * 1.3 + L) * 14 + Math.sin(x / 90 - t * 0.9) * 5);
    g.lineTo(W, H); g.closePath(); g.fillStyle = hexA(C.red, 0.22 + L * 0.18); g.fill();
  }
  g.globalAlpha = 1;
}
// Tree that grows by itself (head-start card)
function drawTree(e, t) {
  if (t < e.at) return; const p = easeIO(prog(t, e.at, e.dur ?? 4)); g.globalAlpha = fadeOut(e, t);
  g.strokeStyle = C.white; g.lineCap = 'round';
  const br = (x, y, a, len, d) => {
    if (d > 7) return; const k = clamp(p * 8 - d); if (k <= 0) return;
    const x2 = x + Math.cos(a) * len * k, y2 = y - Math.sin(a) * len * k;
    g.lineWidth = Math.max(2, 18 - d * 2.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (k >= 1) { br(x2, y2, a + 0.42, len * 0.74, d + 1); br(x2, y2, a - 0.38, len * 0.72, d + 1); }
    else if (d >= 5) { g.fillStyle = C.green; g.beginPath(); g.arc(x2, y2, 9 * k, 0, 7); g.fill(); }
    if (d === 7 - 1 && k >= 1) { g.fillStyle = C.green; g.beginPath(); g.arc(x2, y2, 10, 0, 7); g.fill(); }
  };
  br(e.x, e.y, Math.PI / 2, e.len || 150, 0); g.globalAlpha = 1;
}
// 5-rule map: five pills, active one red; titles revealed for done/active rules
const RULES = ['Time is the multiplier', 'Know when you double', "Interest isn't loyal", 'Guard your percentage', 'Patience pays'];
const SHORT = [['Time is the', 'multiplier'], ['Know when', 'you double'], ['Interest', "isn't loyal"], ['Guard your', 'percentage'], ['Patience', 'pays']];
function drawMap(e, t) {
  const p0 = ease(prog(t, e.at, 0.5)); if (p0 <= 0) return;
  const cx = W / 2, cy = 590, R0 = 330, rad = 118;
  g.globalAlpha = p0 * fadeOut(e, t); font(46, 700); g.fillStyle = C.red; g.textAlign = 'center';
  g.fillText('5 RULES OF MONEY', cx, 130); g.textAlign = 'left';
  g.setLineDash([14, 14]); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.beginPath(); g.arc(cx, cy, R0, 0, Math.PI * 2 * p0); g.stroke(); g.setLineDash([]);
  RULES.forEach((name, i) => {
    const pi = ease(prog(t, e.at + 0.1 * i, 0.5)); if (pi <= 0) return;
    const ang = -Math.PI / 2 + i * 2 * Math.PI / 5, x = cx + R0 * Math.cos(ang), y = cy + R0 * Math.sin(ang);
    const active = i + 1 === e.active, done = i + 1 < e.active, show = done || active || e.reveal;
    const r = rad * (active ? 1.12 : 1) * (0.7 + 0.3 * pi);
    g.globalAlpha = pi * fadeOut(e, t) * (active ? 1 : done ? 0.8 : 0.6);
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    if (active) { gr.addColorStop(0, 'rgba(255,120,110,0.95)'); gr.addColorStop(1, hexA(C.red, 0.95)); }
    else { gr.addColorStop(0, 'rgba(255,255,255,0.30)'); gr.addColorStop(1, 'rgba(255,255,255,0.08)'); }
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke();
    g.textAlign = 'center'; g.fillStyle = C.white;
    font(30, 700); g.fillText(`RULE ${i + 1}`, x, y - (show ? 30 : -10));
    if (show) { font(31, 600); g.fillText(SHORT[i][0], x, y + 14); g.fillText(SHORT[i][1], x, y + 50); }
    g.textAlign = 'left'; g.globalAlpha = 1;
  });
}

// ---------- persistent overlays on presenter footage
function drawPill(label, t, a0, compact) {   // template chapter pill: frosted glass, top-left
  const p = ease(prog(t, a0, 0.45)); if (p <= 0) return;
  font(36, 800); const tw = g.measureText(label).width; SHADOW = true;
  const x = compact ? 36 : 60, y = (compact ? 40 : 96) - (1 - p) * 14, w = compact ? tw + 56 : 350, h = 62; g.globalAlpha = p;
  glass(x, y, w, h, h / 2, null);
  g.fillStyle = C.white; g.textBaseline = 'middle'; shadowOn(0.9); g.fillText(label, x + (w - tw) / 2, y + h / 2 + 2); shadowOff();
  g.textBaseline = 'alphabetic'; g.globalAlpha = 1;
}
// Caption (reference style): UPPERCASE heavy Inter, centred in the lower-middle; short phrases; words rise in as spoken
function drawCaption(cap, t) {
  if (t < cap.t0 - 0.05 || t > cap.t1 + 0.35) return;
  const out = 1 - ease(prog(t, cap.t1, 0.3)); SHADOW = true;
  const size = cap.impact ? 92 : (cap.size || 74); font(size, cap.impact ? 900 : 800);
  const up = w => w.toUpperCase(); const sp = g.measureText(' ').width; const maxw = 1450;
  const lines = [[]]; let lw = 0, prevEnd = false;
  for (const w of cap.words) { const ww = g.measureText(up(w.w)).width; const L = lines[lines.length - 1];
    if (L.length && (lw + ww > maxw || (prevEnd && lw > maxw * 0.25))) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; prevEnd = /[.?!,]$/.test(w.w); }
  let cur = 0; lines.forEach((ln, i) => { if (t >= ln[0].t - 0.06) cur = i; });
  const ln = lines[cur]; const tot = ln.reduce((a, w) => a + w.ww, 0) + sp * (ln.length - 1);
  let x = W / 2 - tot / 2; const y = cap.broll ? 930 : 730;   // presenter: centred across the chest (reference); b-roll: lower third
  for (const w of ln) {
    if (t >= w.t - 0.08) { const wi = wordIn(prog(t, w.t - 0.08, RISE.dur));
      g.globalAlpha = wi.a * out; g.fillStyle = w.key ? C.yellow : w.gkey ? C.green : '#FFFFFF';
      g.save(); g.translate(x, y + wi.dy * size); g.scale(wi.sc, wi.sc); shadowOn(); g.fillText(up(w.w), 0, 0); shadowOff(); g.restore(); }
    x += w.ww + sp;
  }
  g.globalAlpha = 1;
}
// Definition layout (reference 2): avatar pushed right (done in the base cut); heading + explanation on the left
function wrapWords(words, maxw) { const lines = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const w of words) { const ww = g.measureText(w.w).width; if (lw + ww > maxw && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ ...w, ww }); lw += ww + sp; } return { lines, sp }; }
function drawSide(sd, t) {
  if (t < sd.t0 || t >= sd.t1) return;   // gone before the framing cuts back (never over his face)
  const out = 1 - ease(prog(t, sd.t1 - 0.3, 0.3)), inn = ease(prog(t, sd.t0, 0.3));
  const gr = g.createLinearGradient(W, 0, 980, 0); gr.addColorStop(0, 'rgba(10,10,10,0.55)'); gr.addColorStop(1, 'rgba(10,10,10,0)');
  g.globalAlpha = inn * out; g.fillStyle = gr; g.fillRect(980, 0, W - 980, H); g.globalAlpha = 1; SHADOW = true;
  const X = 1130; let y = 300;
  // heading: uppercase, words rise in one after another
  let hs = 64; font(hs, 800, 'inter'); const hwid = g.measureText(sd.heading.toUpperCase()).width;
  if (hwid > 730) { hs = 64 * 730 / hwid; font(hs, 800, 'inter'); }
  const hw = sd.heading.toUpperCase().split(' ').map((w, i) => ({ w, t: sd.t0 + 0.12 * i }));
  let x = X; const sp = g.measureText(' ').width;
  for (const w of hw) { const ww = g.measureText(w.w).width;
    if (t >= w.t) { const wi = wordIn(prog(t, w.t, RISE.dur)); g.globalAlpha = wi.a * out; g.fillStyle = '#FFFFFF';
      g.save(); g.translate(x, y + wi.dy * hs); g.scale(wi.sc, wi.sc); shadowOn(); g.fillText(w.w, 0, 0); shadowOff(); g.restore(); }
    x += ww + sp; }
  // body: bold lowercase lines, each word rises in at its cue
  y += 130; font(62, 800, 'inter');
  for (const blk of sd.body) {
    const words = blk.str.split(' ').map((w, i, arr) => ({ w: w.replace(/[*\[\]]/g, ''), c: /^\*/.test(w) ? C.yellow : /^\[/.test(w) ? C.green : null,
      t: blk.at + (blk.span ?? Math.min(1.4, 0.2 * arr.length)) * i / Math.max(1, arr.length - 1) }));
    const { lines, sp: sp2 } = wrapWords(words, 700);
    for (const ln of lines) { let x2 = X;
      for (const w of ln) { if (t >= w.t) { const wi = wordIn(prog(t, w.t, RISE.dur)); g.globalAlpha = wi.a * out; g.fillStyle = w.c || '#FFFFFF';
          g.save(); g.translate(x2, y + wi.dy * 62); g.scale(wi.sc, wi.sc); shadowOn(); g.fillText(w.w, 0, 0); shadowOff(); g.restore(); }
        x2 += w.ww + sp2; }
      y += 74; }
    y += 26;
  }
  g.globalAlpha = 1;
}
// Channel furniture (reference): Subscribe button top-right, ABAKA SIKA wordmark bottom-right
function drawBrand(a) {
  g.globalAlpha = a; SHADOW = true;
  const bx = 1640, by = 40, bw = 244, bh = 62; rr(bx, by, bw, bh, bh / 2); g.fillStyle = C.red; g.fill();
  rr(bx + 20, by + 16, 42, 30, 9); g.fillStyle = '#FFFFFF'; g.fill();
  g.beginPath(); g.moveTo(bx + 36, by + 23); g.lineTo(bx + 36, by + 39); g.lineTo(bx + 50, by + 31); g.closePath(); g.fillStyle = C.red; g.fill();
  font(34, 700, 'inter'); g.fillStyle = '#FFFFFF'; g.textBaseline = 'middle'; g.fillText('Subscribe', bx + 74, by + bh / 2 + 1); g.textBaseline = 'alphabetic';
  font(46, 800, 'inter'); g.textAlign = 'right'; shadowOn(0.8); g.fillText('ABAKA', 1872, 990); g.fillText('SIKA', 1872, 1036); shadowOff(); g.textAlign = 'left';
  g.globalAlpha = 1;
}
// ---------- scene runner
let S = null; const IMG = {};
async function loadImages(list) { await Promise.all(list.map(src => new Promise(res => { const im = new Image(); im.onload = () => { IMG[src] = im; res(); }; im.onerror = () => res(); im.src = src; }))); return Object.keys(IMG).length; }
window.loadImages = loadImages;
function setup(scenes) { S = scenes; return { cards: scenes.cards.length, overlays: scenes.overlays.length, captions: scenes.captions.length }; }
function cardAt(t) { return S.cards.find(c => t >= c.t0 && t < c.t1); }
function drawAt(t) {
  g.clearRect(0, 0, W, H);
  const card = cardAt(t);
  if (card) {
    const p = ease(prog(t, card.t0, 0.28)), q = 1 - ease(prog(t, card.t1 - 0.22, 0.22));
    g = OG; SHADOW = !!card.dim; g.clearRect(0, 0, W, H);
    if (card.dim) { g.fillStyle = 'rgba(10,10,10,0.62)'; g.fillRect(0, 0, W, H); }   // list over stock footage
    else { g.fillStyle = C.black; g.fillRect(0, 0, W, H);
      const rg = g.createRadialGradient(W * 0.78, H * 0.2, 50, W * 0.78, H * 0.2, 1100);
      rg.addColorStop(0, hexA(C.red, 0.13)); rg.addColorStop(1, 'rgba(225,6,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
    g.save(); const s = 1 + 0.03 * (1 - p); g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2);
    for (const e of card.els) { g.save(); EL[e.type](e, t); g.restore(); }
    g.restore(); g = G0;
    g.globalAlpha = (card.cutIn ? 1 : p) * (card.cutOut ? 1 : q); g.drawImage(oc, 0, 0); g.globalAlpha = 1;
  } else {
    SHADOW = true;
    for (const o of S.overlays) if (t >= o.t0 - 0.3 && t < o.t1 + 0.4) {
      if (o.panel) { const [x, y, w, h] = o.panel; const a = ease(prog(t, o.t0 - 0.25, 0.3)) * (1 - ease(prog(t, o.t1 + 0.05, 0.3)));
        g.globalAlpha = a; rr(x, y, w, h, 28); g.fillStyle = C.glass; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.stroke();
        g.fillStyle = C.red; rr(x, y + 28, 8, h - 56, 4); g.fill(); g.globalAlpha = 1; }
      for (const e of o.els) { g.save(); EL[e.type]({ ...e, until: e.until ?? o.t1 }, t); g.restore(); } }
    for (const c of S.captions) drawCaption(c, t);
    for (const sd of S.sides) drawSide(sd, t);
  }
  SHADOW = false;
  const ch = S.chapters.filter(c => c.t <= t).pop();
  const inSide = S.sides.some(sd => t >= sd.t0 - 0.05 && t <= sd.t1 + 0.05);
  if (ch && !(card && card.nopill)) drawPill(ch.label, t, ch.t, inSide);
  if (S.end && t >= S.end.t0) drawEnd(t);
  drawBrand(1);
}
function drawEnd(t) {
  const p = ease(prog(t, S.end.t0, 0.6)); g.globalAlpha = p; g.fillStyle = C.black; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const els = S.end.els; for (const e of els) { g.save(); EL[e.type](e, t); g.restore(); }
}
window.setup = setup; window.drawAt = drawAt;
