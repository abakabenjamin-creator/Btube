// Shared builders for Glass UI scenes and presenter overlays.
'use strict';

const BT = id => window.BEATS_JSON.beats.find(b => b.id === id);
const HANDLE = 0.3;  // extra render time each side for transitions

// Full-screen Glass UI scene on the void background.
function glassScene(id, beatId, seed, build, update, o = {}) {
  const b = BT(beatId);
  scene(id, {
    t0: b.t0 - HANDLE, t1: b.t1 + HANDLE, alpha: false,
    build(root, S) {
      S.b = b;
      S.bg = voidBG(root, seed, o);
      const w = world(root);
      S.cam = w.cam;
      S.ui = el(root, 'abs'); css(S.ui, { inset: '0' });
      S.st = [];
      build(S, w.cam, S.ui);
    },
    update(t, S) { S.bg(t); update(t, S); for (const s of S.st) s.update(t); },
  });
}

// Transparent overlay drawn over the presenter.
function overlayScene(id, beatId, build, update, o = {}) {
  const b = BT(beatId);
  scene(id, {
    t0: (o.t0 != null ? o.t0 : b.t0) - HANDLE, t1: (o.t1 != null ? o.t1 : b.t1) + HANDLE, alpha: true,
    build(root, S) { S.b = b; S.ui = el(root, 'abs'); css(S.ui, { inset: '0' }); S.st = []; build(S, S.ui); },
    update(t, S) { update(t, S); for (const s of S.st) s.update(t); },
  });
}

// ------------------------------------------------------------- camera rig
function camKeys(keys, t) {
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y, s: keys[0].s };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const e = b.e === 'expo' ? E.outExpo : b.e === 'lin' ? E.linear : E.inOutCubic;
      const q = e((t - a.t) / Math.max(1e-3, b.t - a.t));
      return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), q)) };
    }
  }
  const k = keys[keys.length - 1];
  return { x: k.x, y: k.y, s: k.s };
}
// keys: [{t, x, y, s, e}] focus point (world px) + zoom. Adds the constant
// drift / tilt and motion blur proportional to camera speed.
function camSet(S, t, keys, o = {}) {
  const c = typeof keys === 'function' ? keys(t) : camKeys(keys, t);
  const c0 = typeof keys === 'function' ? keys(t - 1 / 30) : camKeys(keys, t - 1 / 30);
  const p = clamp((t - S.b.t0) / (S.b.t1 - S.b.t0));
  const s = c.s * (1 + 0.03 * E.inOutCubic(p));
  const ry = lerp(o.ry0 == null ? -3 : o.ry0, o.ry1 == null ? 3 : o.ry1, E.inOutCubic(p));
  const rx = (o.rx == null ? 1.5 : o.rx) * Math.sin(p * Math.PI);
  S.cam.style.transformOrigin = '0 0';
  S.cam.style.transform = `translate(${W / 2}px, ${H / 2}px) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-c.x).toFixed(1)}px, ${(-c.y).toFixed(1)}px)`;
  const v = Math.abs(Math.log(c.s / c0.s)) * 200 + Math.hypot(c.x - c0.x, c.y - c0.y) * c.s * 0.014;
  S.cam.style.filter = v > 2.2 ? `blur(${Math.min(18, v).toFixed(1)}px)` : 'none';
  return c;
}

// ------------------------------------------------------------- hero pill
// Giant input pill whose text may run off frame; returns caret positions.
function heroPill(parent, x, y, text, o = {}) {
  const p = el(parent, 'pill hero-pill');
  place(p, x, y);
  if (o.size) css(p, { fontSize: o.size + 'px', height: o.size * 1.8 + 'px', padding: `0 ${o.size * 0.55}px` });
  const span = el(p, '');
  const m = el(document.body, '');
  css(m, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', fontFamily: 'Inter', fontWeight: 500,
    fontSize: (o.size || 168) + 'px', letterSpacing: '-0.03em', left: '-9999px', top: 0 });
  const widths = [];
  for (let n = 0; n <= text.length; n++) { m.textContent = text.slice(0, n); widths.push(m.offsetWidth); }
  m.remove();
  const pad = (o.size || 168) * 0.55;
  const h = (o.size || 168) * 1.8;
  css(p, { width: widths[text.length] + pad * 2 + 70 + 'px' });
  return { p, span, widths, x, y, pad, h, text, w: widths[text.length] + pad * 2 + 70,
    caretX(n) { return x + pad + widths[clamp(n, 0, text.length)]; } };
}

// ---------------------------------------------------------------- icons
const IC = {
  house: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M8 22 L24 9 L40 22 V40 H29 V29 H19 V40 H8 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/></svg>`,
  chart: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M7 36 L17 25 L25 30 L40 13" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 13 H40 V21" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  brief: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><rect x="7" y="15" width="34" height="24" rx="5" fill="none" stroke="${c}" stroke-width="3"/><path d="M18 15 V11 H30 V15 M7 25 H41" fill="none" stroke="${c}" stroke-width="3"/></svg>`,
  bulb: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M17 30 C11 25 12 10 24 10 C36 10 37 25 31 30 V35 H17 Z M19 40 H29" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  book: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M8 12 C14 10 20 11 24 14 C28 11 34 10 40 12 V37 C34 35 28 36 24 39 C20 36 14 35 8 37 Z M24 14 V39" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/></svg>`,
  net: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="12" r="5" fill="none" stroke="${c}" stroke-width="3"/><circle cx="11" cy="35" r="5" fill="none" stroke="${c}" stroke-width="3"/><circle cx="37" cy="35" r="5" fill="none" stroke="${c}" stroke-width="3"/><path d="M21 16 L14 31 M27 16 L34 31 M16 35 H32" stroke="${c}" stroke-width="3"/></svg>`,
  target: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="24" r="15" fill="none" stroke="${c}" stroke-width="3"/><circle cx="24" cy="24" r="7" fill="none" stroke="${c}" stroke-width="3"/><circle cx="24" cy="24" r="2" fill="${c}"/></svg>`,
  shield: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M24 7 L39 13 V24 C39 33 32 39 24 42 C16 39 9 33 9 24 V13 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M17 24 L22 29 L31 19" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  coin: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><ellipse cx="24" cy="15" rx="14" ry="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M10 15 V33 C10 36.5 16 39 24 39 C32 39 38 36.5 38 33 V15 M10 24 C10 27.5 16 30 24 30 C32 30 38 27.5 38 24" fill="none" stroke="${c}" stroke-width="3"/></svg>`,
  check: c => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 12.5 L10 17 L19 7" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: c => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`,
  upload: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M24 32 V12 M15 20 L24 11 L33 20 M10 34 V38 H38 V34" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  eyeoff: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M5 24 C11 14 18 11 24 11 C30 11 37 14 43 24 C37 34 30 37 24 37 C18 37 11 34 5 24 Z" fill="none" stroke="${c}" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M9 41 L39 7" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  bolt: c => `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M27 6 L11 27 H23 L20 42 L37 20 H25 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/></svg>`,
};
function icon(parent, name, size, color, cls) {
  const i = el(parent, cls || '', IC[name](color || '#f0f0f0'));
  css(i, { width: size + 'px', height: size + 'px', flex: 'none' });
  return i;
}

// Icon tile with gradient glass background (feature pill icon).
function iconTile(parent, name, size, grad) {
  const t = el(parent, '');
  css(t, { width: size + 'px', height: size + 'px', borderRadius: size * 0.3 + 'px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: grad || 'linear-gradient(135deg, rgba(72,216,168,0.35), rgba(91,141,239,0.35))', border: '1px solid rgba(255,255,255,0.14)' });
  icon(t, name, size * 0.56, '#f0f0f0');
  return t;
}

// Object card: icon + yellow label + title, used in fanned stacks.
function objectCard(parent, x, y, w, h, o) {
  const c = el(parent, 'card pad');
  place(c, x, y, w, h);
  const top = el(c, 'row');
  iconTile(top, o.icon, 72, o.grad);
  if (o.label) { const l = el(top, 'eyebrow', o.label); css(l, { color: o.labelColor || 'var(--yellow-text)' }); }
  const t = el(c, 'h2', o.title);
  css(t, { marginTop: '28px' });
  if (o.body) { const b = el(c, 'body', o.body); css(b, { marginTop: '14px' }); }
  if (o.lines) {
    for (let i = 0; i < o.lines; i++) { const l = el(c, ''); css(l, { height: '14px', borderRadius: '7px', background: 'rgba(255,255,255,0.07)', marginTop: i ? '14px' : '30px', width: [92, 78, 85, 60][i % 4] + '%' }); }
  }
  return c;
}

// Source preview card: image + title + body + file badge (Prove It recipe).
function previewCard(parent, x, y, o) {
  const c = el(parent, 'card');
  place(c, x, y, 560, null);
  css(c, { overflow: 'hidden' });
  const img = el(c, '');
  css(img, { height: '230px', background: o.img || 'radial-gradient(circle at 30% 40%, rgba(72,216,168,0.55), rgba(48,72,96,0.6) 45%, #1d1e21 80%)', position: 'relative' });
  if (o.spark) {
    const ch = lineChart(img, o.spark, { w: 470, h: 120, x: 45, y: 60, sw: 4 });
    ch.update(1);
  }
  const body = el(c, 'pad');
  const r = el(body, 'row');
  const bd = el(r, 'badge', o.badge || 'DOC');
  css(bd, { background: o.badgeColor || '#d9534f', width: '44px', height: '52px' });
  const tt = el(r, 'h3', o.title);
  css(tt, { fontSize: '27px' });
  const b = el(body, 'body', o.body);
  css(b, { marginTop: '14px', fontSize: '21px' });
  return c;
}

// Side card used over the presenter (top-right, above shoulder level).
function sideCard(parent, x, y, w) {
  const c = el(parent, 'card pad');
  place(c, x, y, w || 430, null);
  css(c, { background: 'linear-gradient(160deg, rgba(50,51,54,0.94), rgba(38,39,42,0.94))' });
  return c;
}

function pushEv(S, t, type, extra) { S.events.push(Object.assign({ t: +t.toFixed(3), type }, extra || {})); }
