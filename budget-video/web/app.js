/* Compositor for "Budgeting Magic Trick".
   Roles 3–5 live here: UI motion, camera/depth/transitions/avatar framing, kinetic type.
   Everything is a pure function of time t so frames can be rendered in any order. */
const W = 1920, H = 1080;
const SFX = [];                       // {t, k} — Role 6 builds the SFX stem from this
const sfx = (t, k, g = 1) => SFX.push({ t: +t.toFixed(3), k, g });
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // ease-in-out-cubic
const eoExpo = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);

function el(parent, cls, css = '', html = '') {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (css) d.style.cssText = css;
  if (html) d.innerHTML = html;
  parent.appendChild(d);
  return d;
}
const money = (n, dec = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/* ------------------------------------------------------------------ icons */
const ICON = {
  cursor: `<svg viewBox="0 0 46 46"><path d="M8 4 L8 36 L16 28 L22 42 L28 39 L22 26 L34 26 Z" fill="#8AA4F8" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`,
  jar: (fill = 0, c = '#48D8A8') => `<svg viewBox="0 0 100 120" width="100%" height="100%"><defs><clipPath id="jc${Math.random().toString(36).slice(2, 7)}"></clipPath></defs>
    <rect x="30" y="6" width="40" height="12" rx="4" fill="none" stroke="#F0F0F0" stroke-width="4"/>
    <path d="M26 20 h48 q8 0 8 10 v76 q0 10 -10 10 h-44 q-10 0 -10 -10 v-76 q0 -10 8 -10z" fill="rgba(255,255,255,.04)" stroke="#F0F0F0" stroke-width="4"/>
    <rect class="liquid" x="22" y="40" width="56" height="72" rx="6" fill="${c}" opacity=".85" style="transform-origin:50px 112px;transform:scaleY(${fill})"/></svg>`,
  veg: `<svg viewBox="0 0 80 80"><path d="M20 62 L52 30 Q60 22 64 26 Q68 30 58 38 Z" fill="none" stroke="#48D8A8" stroke-width="4" stroke-linejoin="round"/><path d="M58 26 q4-12 12-14 M60 30 q10-4 14 2" fill="none" stroke="#48D8A8" stroke-width="4" stroke-linecap="round"/></svg>`,
  sandwich: `<svg viewBox="0 0 80 80"><path d="M12 56 L40 16 L68 56 Z" fill="none" stroke="#F0F0F0" stroke-width="4" stroke-linejoin="round"/><path d="M20 48 h40" stroke="#48D8A8" stroke-width="5" stroke-linecap="round"/></svg>`,
  fruit: `<svg viewBox="0 0 80 80"><circle cx="40" cy="46" r="22" fill="none" stroke="#F0F0F0" stroke-width="4"/><path d="M40 24 q2-10 12-12" fill="none" stroke="#48D8A8" stroke-width="4" stroke-linecap="round"/></svg>`,
  treat: `<svg viewBox="0 0 80 80"><path d="M40 10 l8 18 20 2 -15 13 5 20 -18-11 -18 11 5-20 -15-13 20-2z" fill="none" stroke="#F0F060" stroke-width="4" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="rgba(255,255,255,.12)" stroke="#F0F0F0" stroke-width="2"/><path d="M24 18 L44 30 L24 42Z" fill="#F0F0F0"/></svg>`,
  down: `<svg viewBox="0 0 40 40"><path d="M20 6 v26 M8 22 l12 12 12-12" fill="none" stroke="#050505" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/* ------------------------------------------------------------------ motion helpers (Role 3) */
function enterCard(tl, node, at, o = {}) {
  tl.fromTo(node, { opacity: 0, filter: 'blur(20px)', rotationY: o.ry ?? 20, rotationX: 6, scale: .9, transformPerspective: 1600 },
    { opacity: 1, filter: 'blur(0px)', rotationY: o.rest ?? 6, rotationX: 2, scale: 1, duration: .55, ease: 'expo.out' }, at);
}
function sticker(tl, parent, beat, text, kind, css, at, out, rot = -18) {
  const s = el(parent, `sticker ${kind}`, css, text);
  tl.fromTo(s, { scale: 0, rotation: rot - 25, opacity: 0 }, { scale: 1, rotation: rot, opacity: 1, duration: .28, ease: 'back.out(2.6)' }, at);
  const bobs = Math.max(1, Math.floor((out - at - .3) / 1));
  tl.fromTo(s, { y: 0 }, { y: -4, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: bobs - 1 }, at + .3);
  tl.to(s, { scale: 0, opacity: 0, duration: .2, ease: 'power2.in' }, out);
  sfx(beat.t0 + at, 'pop');
  return s;
}
function makeCursor(parent) {
  const c = el(parent, 'cursor', 'opacity:0', ICON.cursor);
  return c;
}
function moveCursor(tl, c, x0, y0, x1, y1, at, dur = .7) {
  tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: .15 }, at);
  tl.fromTo(c, { x: x0 }, { x: x1, duration: dur, ease: 'power3.inOut' }, at);
  tl.fromTo(c, { y: y0 }, { y: y1, duration: dur, ease: 'sine.out' }, at);
}
function clickAt(tl, parent, beat, c, target, x, y, at) {
  const r = el(parent, 'ripple', `left:${x}px;top:${y}px`);
  tl.to(c, { scale: .85, duration: .08, yoyo: true, repeat: 1, transformOrigin: '8px 4px' }, at);
  if (target) tl.to(target, { scale: .95, filter: 'brightness(.85)', duration: .09, yoyo: true, repeat: 1 }, at);
  tl.fromTo(r, { scale: .2, opacity: .9 }, { scale: 1.6, opacity: 0, duration: .5, ease: 'power2.out' }, at);
  sfx(beat.t0 + at, 'click');
}
function typeText(tl, beat, node, text, at, cps = 22, caret = null) {
  node.textContent = '';
  const o = { n: 0 }, dur = text.length / cps;
  tl.to(o, { n: text.length, duration: dur, ease: 'none', onUpdate: () => { node.textContent = text.slice(0, Math.round(o.n)); } }, at);
  for (let i = 0; i < text.length; i += 2) if (text[i] !== ' ') sfx(beat.t0 + at + i / cps, 'key', .8);
  return dur;
}
function countUp(tl, node, to, at, dur, fmt) {
  const o = { v: 0 };
  tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { node.textContent = fmt(o.v); } }, at);
}
function setProp(tl, node, prop, val, at) {   // seek-safe text swap
  node._last = node._last || {};
  const prev = prop in node._last ? node._last[prop] : node[prop];
  node._last[prop] = val;
  const o = { p: 0 };
  tl.to(o, { p: 1, duration: .001, ease: 'none', onUpdate: () => { node[prop] = o.p >= 1 ? val : prev; } }, at);
}
function caretBlink(tl, caret, from, to) {
  const n = Math.max(1, Math.floor((to - from) / .5));
  tl.fromTo(caret, { opacity: 1 }, { opacity: 0, duration: .25, ease: 'steps(1)', yoyo: true, repeat: n }, from);
}
function wordsReveal(tl, beat, spans, from, to) {
  const step = spans.length > 1 ? (to - from) / (spans.length - 1) : 0;
  spans.forEach((s, i) => {
    tl.fromTo(s, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .22, ease: 'power2.out' }, from + i * step);
    sfx(beat.t0 + from + i * step, 'key', .6);
  });
}
function camDrift(tl, cam, dur, o = {}) {
  tl.fromTo(cam, { scale: o.s0 ?? 1, rotationY: o.r0 ?? -2.5, transformPerspective: 2000 },
    { scale: o.s1 ?? 1.05, rotationY: o.r1 ?? 2.5, duration: Math.max(.1, dur), ease: 'sine.inOut' }, 0);
}
function measure(text, font) {
  const c = measure.c || (measure.c = document.createElement('canvas').getContext('2d'));
  c.font = font;
  return c.measureText(text).width;
}

/* ------------------------------------------------------------------ scenes */
const SCENES = {};
const rel = (b, k) => b.cues_t[k] - b.t0;

/* ---------- MYTH_FLIP ---------- */
SCENES.MYTH_FLIP = (b, root, tl) => {
  root.style.background = 'radial-gradient(circle at 50% 52%, rgba(72,216,168,.19), rgba(72,216,168,.05) 35%, transparent 62%), #050505';
  const cam = el(root, 'cam');
  const D = b.t1 - b.t0;
  camDrift(tl, cam, D, { s1: 1.04, r0: 0, r1: 0 });
  const lab = el(cam, 'h-poppins', 'position:absolute;left:0;right:0;top:250px;text-align:center;color:#48D8A8;font-size:44px;letter-spacing:.02em', `Mix-up #${b.n}`);
  tl.fromTo(lab, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .4, ease: 'expo.out' }, .1);
  let fs = 92;
  while (measure(b.myth, `700 ${fs}px Poppins`) > 1640) fs -= 2;
  const myth = el(cam, 'h-poppins', `position:absolute;left:0;right:0;top:380px;text-align:center;font-size:${fs}px;color:#F0F0F0;white-space:nowrap`);
  const spans = b.myth.split(' ').map(w => el(myth, 'word', '', w));
  spans[spans.length - 1].style.marginRight = '0';
  const mythEnd = Math.min(b.myth_end - b.t0, D - 1.6);
  wordsReveal(tl, b, spans, .3, Math.max(.6, mythEnd - .25));
  const width = measure(b.myth, `700 ${fs}px Poppins`) + 20;
  const line = el(cam, 'strike-line', `left:${960 - width / 2}px;top:${380 + fs * .62}px;width:${width}px`);
  const tStrike = mythEnd + .15;
  tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: .4, ease: 'power3.inOut' }, tStrike);
  tl.to(myth, { color: '#606060', duration: .3 }, tStrike + .2);
  sfx(b.t0 + tStrike, 'strike');
  const truth = el(cam, 'h-poppins', 'position:absolute;left:210px;right:210px;top:600px;text-align:center;font-size:66px;line-height:1.22;color:#F0F0F0');
  const keys = b.key.toLowerCase().split(' ');
  const tsp = b.truth.split(' ').map(w => {
    const clean = w.toLowerCase().replace(/[^a-z$0-9]/g, '');
    return el(truth, 'word', keys.includes(clean) ? 'color:#F0F060' : '', w);
  });
  const t0 = tStrike + .4;
  wordsReveal(tl, b, tsp, t0, Math.min(t0 + .9, D - .9));
};

/* ---------- CHAPTER_CARD ---------- */
SCENES.CHAPTER_CARD = (b, root, tl) => {
  root.style.background = 'radial-gradient(circle at 50% 50%, rgba(72,216,168,.2), transparent 55%), #050505';
  const D = b.t1 - b.t0;
  const g = el(root, '', 'position:absolute;left:0;right:0;top:420px;height:240px;display:flex;align-items:center;justify-content:center;gap:34px');
  const sq = el(g, 'glass', 'position:relative;width:240px;height:240px;display:flex;align-items:center;justify-content:center;border-radius:32px');
  el(sq, 'h-poppins', 'font-size:150px;color:#F0F060;line-height:1', b.num);
  const pill = el(g, 'pill h-poppins', 'position:relative;background:#48D8A8;color:#050505;font-size:76px;padding:34px 70px;box-shadow:0 0 50px rgba(72,216,168,.35)', b.label);
  tl.fromTo(g, { x: -320, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'expo.out' }, .05);
  tl.fromTo(pill, { scaleX: .6, transformOrigin: 'left center' }, { scaleX: 1, duration: .5, ease: 'expo.out' }, .15);
  tl.to(g, { scale: 1.18, opacity: 0, filter: 'blur(12px)', duration: .35, ease: 'power2.in' }, D - .35);
  sfx(b.t0 + .05, 'whoosh', .8); sfx(b.t0 + .2, 'shimmer');
};

/* ---------- BROLL ---------- */
SCENES.BROLL = (b, root, tl) => {
  const N = (window.BROLL || {})[b.clip] || 0;
  const D = b.t1 - b.t0;
  const shots = Math.max(1, Math.round(D / 3.4));
  b._broll = { N, shots, D, imgs: [] };
  if (!N) {   // preview stand-in until the licensed/generated clip is in assets/broll/
    root.style.background = 'radial-gradient(ellipse at 30% 40%, #3a2c1c 0%, #15110c 45%, #050505 80%)';
    const lt = el(root, '', 'position:absolute;width:900px;height:900px;border-radius:50%;left:500px;top:-200px;background:radial-gradient(circle, rgba(255,214,150,.22), transparent 60%)');
    tl.fromTo(lt, { x: -200 }, { x: 260, duration: D, ease: 'none' }, 0);
    el(root, '', 'position:absolute;left:60px;bottom:50px;font:600 22px Inter;color:rgba(255,255,255,.35);letter-spacing:.1em', `B-ROLL PREVIEW · ${b.clip.toUpperCase()}`);
    return;
  }
  for (let i = 0; i < 2; i++) b._broll.imgs.push(Object.assign(document.createElement('img'), { style: 'position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover;opacity:0' }));
  b._broll.imgs.forEach(i => root.appendChild(i));
};
function brollFrame(b, t) {   // returns per-image {src, opacity, transform}
  const { N, shots, D, imgs } = b._broll;
  if (!N) return;
  const lt = t - b.t0, len = D / shots, k = clamp(Math.floor(lt / len), 0, shots - 1);
  const XF = .3;
  const set = (img, shot, op) => {
    const st = lt - shot * len;                          // time inside shot
    const span = Math.floor(N / shots);
    const f = clamp(Math.floor(shot * span + st * 30 * (span / 30 >= len ? 1 : span / (len * 30))), 0, N - 1);
    const p = clamp(st / len, -.2, 1.2);
    const push = shot % 2 === 0 ? lerp(1.0, 1.06, p) : lerp(1.08, 1.03, p);
    const pan = (shot % 3 - 1) * 18 * p;
    img.src = `../assets/broll/${b.clip}/f_${String(f + 1).padStart(5, '0')}.jpg`;
    img.style.opacity = op;
    img.style.transform = `translateX(${pan}px) scale(${push})`;
    img.style.filter = `blur(${(1 - op) * 10}px)`;
  };
  const a = imgs[k % 2], o = imgs[(k + 1) % 2];
  set(a, k, 1);
  const into = lt - k * len;
  if (k > 0 && into < XF) { set(o, k - 1, 1 - into / XF); a.style.opacity = into / XF; } else o.style.opacity = 0;
}

/* ---------- GRID_SLIDE (shared frame) ---------- */
function gridFrame(b, root, tl, title) {
  root.style.background = '#050505';
  el(root, 'full', 'background:radial-gradient(circle at 75% 45%, rgba(72,216,168,.13), transparent 45%), radial-gradient(circle at 20% 80%, rgba(48,72,96,.25), transparent 50%)');
  el(root, 'full', `background-image:linear-gradient(rgba(240,240,240,.055) 1px, transparent 1px),linear-gradient(90deg, rgba(240,240,240,.055) 1px, transparent 1px);background-size:60px 60px`);
  const panel = el(root, 'glass', 'left:90px;top:110px;width:1200px;height:860px');
  const card = el(root, 'avcard', '', '<img class="av">');
  const t = el(root, 'h-poppins', 'position:absolute;left:90px;width:1062px;top:160px;text-align:center;font-size:58px;color:#F0F0F0', title);
  tl.fromTo(panel, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' }, 0);
  tl.fromTo(card, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' }, .1);
  tl.fromTo(card.querySelector('img'), { scale: 1 }, { scale: 1.04, duration: Math.max(.5, b.t1 - b.t0), ease: 'none', transformOrigin: '50% 30%' }, 0);
  tl.fromTo(t, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .4, ease: 'expo.out' }, .15);
  return { panel, title: t };
}
const tile = (parent, x, y, w, h, extra = '') => el(parent, 'glass', `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:24px;${extra}`);

SCENES.GRID_SLIDE = (b, root, tl) => VARIANTS[b.variant](b, root, tl);
const VARIANTS = {};

VARIANTS.LUNCHBOX = (b, root, tl) => {
  gridFrame(b, root, tl, 'Think about a lunchbox');
  const items = [['veg', 'Vegetables', ICON.veg], ['sandwich', 'A sandwich', ICON.sandwich], ['fruit', 'Some fruit', ICON.fruit], ['treat', 'A little treat', ICON.treat]];
  items.forEach(([k, label, icon], i) => {
    const x = 160 + (i % 2) * 470, y = 300 + Math.floor(i / 2) * 320;
    const tt = tile(root, x, y, 440, 280, 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px');
    el(tt, '', 'width:96px;height:96px', icon);
    el(tt, '', `font:700 40px Inter;color:${k === 'treat' ? '#F0F060' : '#F0F0F0'}`, label);
    const at = rel(b, k);
    tl.fromTo(tt, { opacity: 0, scale: .85, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(1.6)' }, at);
    sfx(b.t0 + at, 'pop', .7);
    if (k === 'treat') { tt.classList.add('yel'); }
  });
  sticker(tl, root, b, 'Fun has a spot', 'lav', 'left:700px;top:880px', rel(b, 'treat') + .6, b.t1 - b.t0 - .4, -12);
};

VARIANTS.TREAT = (b, root, tl) => {
  const { title } = gridFrame(b, root, tl, '$10 a week');
  const blocks = [];
  for (let i = 0; i < 10; i++) {
    const bl = el(root, '', `position:absolute;left:${170 + i * 92}px;top:430px;width:80px;height:170px;border-radius:16px;background:#48D8A8;box-shadow:0 0 18px rgba(72,216,168,.3)`);
    el(bl, '', 'position:absolute;bottom:14px;left:0;right:0;text-align:center;font:800 26px Inter;color:#06110D', '$1');
    blocks.push(bl);
    tl.fromTo(bl, { opacity: 0, y: 40, scaleY: .4 }, { opacity: 1, y: 0, scaleY: 1, duration: .35, ease: 'back.out(1.8)' }, rel(b, 'ten') + i * .06);
  }
  sfx(b.t0 + rel(b, 'ten'), 'shimmer');
  const at2 = rel(b, 'two');
  blocks.slice(8).forEach((bl, i) => tl.to(bl, { backgroundColor: '#F0F060', boxShadow: '0 0 24px rgba(240,240,96,.45)', y: -18, duration: .35, ease: 'back.out(2)' }, at2 + i * .08));
  const tag = el(root, '', 'position:absolute;left:906px;top:330px;width:172px;text-align:center;font:800 34px Inter;color:#F0F060', 'Treat $2');
  tl.fromTo(tag, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .3 }, at2 + .2);
  sfx(b.t0 + at2, 'pop');
  const brace = el(root, '', 'position:absolute;left:170px;top:640px;width:908px;height:6px;border-radius:3px;background:#48D8A8;transform-origin:left center');
  const plan = el(root, '', 'position:absolute;left:170px;top:675px;width:908px;text-align:center;font:700 40px Inter;color:#F0F0F0', '<span class="check">✓</span>&nbsp; Part of the plan');
  const ap = rel(b, 'part');
  tl.fromTo(brace, { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power3.inOut' }, ap);
  tl.fromTo(plan, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .35 }, ap + .25);
  sfx(b.t0 + ap, 'shimmer');
  sticker(tl, root, b, 'Following the plan', 'hex', 'left:380px;top:800px', rel(b, 'follow'), b.t1 - b.t0 - .4, -10);
};

VARIANTS.PILLS = (b, root, tl) => {
  gridFrame(b, root, tl, b.heading);
  b.items.forEach(([label], i) => {
    const p = el(root, 'glass mint pill', `left:170px;top:${330 + i * 170}px;width:900px;height:124px;display:flex;align-items:center;gap:30px;padding-left:26px`);
    el(p, '', 'width:76px;height:76px;border-radius:50%;background:#48D8A8;color:#050505;font:800 40px Inter;display:flex;align-items:center;justify-content:center', i + 1);
    el(p, '', 'font:700 44px Inter;color:#F0F0F0', label);
    const at = b.items_t[i] - b.t0;
    tl.fromTo(p, { opacity: 0, x: -60, scale: .9 }, { opacity: 1, x: 0, scale: 1, duration: .4, ease: 'back.out(1.7)' }, Math.max(.2, at));
    sfx(b.t0 + Math.max(.2, at), 'pop', .8);
  });
};

VARIANTS.JARS = (b, root, tl) => {
  gridFrame(b, root, tl, 'The Three-Jar Plan');
  const data = [['NEEDS', 'Home, food, bills,<br>getting to work or school'], ['WANTS', 'Candy, games, toys,<br>eating out'], ['FUTURE YOU', 'Savings, emergency fund,<br>debt, investing']];
  const cues = ['j1', 'j2', 'j3'];
  data.forEach(([kw, q], i) => {
    const x = 150 + i * 335;
    const bx = tile(root, x, 300, 290, 560, 'display:flex;flex-direction:column;align-items:center;padding-top:30px;gap:18px');
    const num = el(bx, '', 'width:64px;height:64px;border-radius:50%;background:#48D8A8;color:#050505;font:800 34px Inter;display:flex;align-items:center;justify-content:center', i + 1);
    const jar = el(bx, '', 'width:120px;height:144px', ICON.jar(0));
    const k = el(bx, '', 'font:800 38px Inter;color:#F0F0F0;letter-spacing:.02em;text-align:center', kw);
    const qq = el(bx, '', 'font:500 24px Inter;color:#A8A8A8;text-align:center;line-height:1.35;padding:0 16px', q);
    if (i < 2) {
      const ar = el(root, '', `position:absolute;left:${x + 293}px;top:570px;width:40px;height:20px`, '<svg viewBox="0 0 40 20"><path d="M2 10 H32 M24 3 L33 10 L24 17" fill="none" stroke="#48D8A8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      tl.fromTo(ar, { opacity: 0 }, { opacity: 1, duration: .3 }, .7 + i * .12);
    }
    tl.fromTo(bx, { opacity: 0, y: 30 }, { opacity: .55, y: 0, duration: .45, ease: 'expo.out' }, .45 + i * .12);
    [num, jar, k, qq].forEach(n => tl.set(n, { opacity: .25 }, 0));
    const at = rel(b, cues[i]);
    tl.to(bx, { opacity: 1, duration: .2 }, at);
    tl.call(() => {}, null, at);
    tl.to(bx, { borderColor: '#48D8A8', boxShadow: '0 0 0 1px rgba(72,216,168,.15), 0 0 28px rgba(72,216,168,.3), 0 30px 80px rgba(0,0,0,.55)', duration: .3 }, at);
    [num, jar, k, qq].forEach((n, j) => tl.to(n, { opacity: 1, duration: .3 }, at + j * .12));
    tl.fromTo(jar.querySelector('.liquid'), { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: 'power2.out' }, at + .2);
    sfx(b.t0 + at, 'pop'); sfx(b.t0 + at + .2, 'rise', .6);
  });
};

VARIANTS.PIE = (b, root, tl) => {
  gridFrame(b, root, tl, '');
  const pill = el(root, 'pill h-poppins', 'position:absolute;left:420px;top:150px;width:400px;height:84px;background:#48D8A8;color:#050505;font-size:40px;display:flex;align-items:center;justify-content:center', '50/30/20 RULE');
  tl.fromTo(pill, { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' }, .15);
  const cx = 420, cy = 580, r = 230;
  const C = 2 * Math.PI * (r / 2);
  const svg = el(root, '', `position:absolute;left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px`);
  const cats = [['NEEDS', 'Home, food, bills', .5, '#48D8A8', 'half'], ['WANTS', 'Candy, games, eating out', .3, '#30C0C0', 'third'], ['FUTURE YOU', 'Savings, debt, investing', .2, '#2E8F70', 'fifth']];
  let acc = 0, html = `<svg viewBox="0 0 ${2 * r} ${2 * r}" width="100%" height="100%" style="transform:rotate(-90deg)"><circle cx="${r}" cy="${r}" r="${r}" fill="#1A1B1D"/>`;
  cats.forEach(([, , f, c], i) => {
    html += `<circle class="sl" cx="${r}" cy="${r}" r="${r / 2}" fill="none" stroke="${c}" stroke-width="${r}" stroke-dasharray="0 ${C}" stroke-dashoffset="${-acc * C}"/>`;
    acc += f;
  });
  svg.innerHTML = html + '</svg>';
  const sls = svg.querySelectorAll('.sl');
  acc = 0;
  const pct = ['50%', '30%', '20%'];
  const valEls = [];
  cats.forEach(([name, desc, f, c, cue], i) => {
    const at = rel(b, cue);
    const o = { v: 0 };
    tl.to(o, { v: f, duration: .6, ease: 'power2.out', onUpdate: () => sls[i].setAttribute('stroke-dasharray', `${o.v * C} ${C}`) }, at);
    const mid = (acc + f / 2) * 2 * Math.PI - Math.PI / 2;
    acc += f;
    const lx = cx + Math.cos(mid) * r * .62, ly = cy + Math.sin(mid) * r * .62;
    const pl = el(root, '', `position:absolute;left:${lx - 60}px;top:${ly - 26}px;width:120px;text-align:center;font:800 42px Inter;color:#050505`, pct[i]);
    tl.fromTo(pl, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, at + .35);
    const y = 330 + i * 200;
    const blk = el(root, '', `position:absolute;left:740px;top:${y}px;width:380px`);
    const head = el(blk, '', `font:800 36px Inter;color:${c};letter-spacing:.03em`, name);
    el(blk, '', 'font:500 24px Inter;color:#A8A8A8;margin-top:6px', '• ' + desc);
    const val = el(blk, 'h-poppins', 'position:relative;font-size:52px;color:#F0F0F0;margin-top:4px;height:66px', '');
    valEls.push(val);
    const ar = el(root, '', `position:absolute;left:660px;top:${y + 10}px;width:70px;height:50px`, `<svg viewBox="0 0 70 50"><path d="M4 44 Q20 6 62 10 M52 3 L63 10 L54 19" fill="none" stroke="#F0F0F0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    tl.fromTo([blk, ar], { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: .4, ease: 'expo.out' }, at + .2);
    tl.call(() => {}, null, at);
    sfx(b.t0 + at, 'pop'); sfx(b.t0 + at + .3, 'shimmer', .5);
    const v = el(val, '', '', pct[i]); v.dataset.k = 'pct';
    tl.fromTo(v, { opacity: 0 }, { opacity: 1, duration: .3 }, at + .4);
  });
  // same layout, new numbers: $10 allowance then $1,000
  const rounds = [['$10 ALLOWANCE', 'ten', [['t5', 5], ['t3', 3], ['t2', 2]]], ["$1,000 · GROWN-UP", 'k', [['k5', 500], ['k3', 300], ['k2', 200]]]];
  rounds.forEach(([label, cue, vals]) => {
    const at = rel(b, cue);
    tl.to(pill, { opacity: 0, duration: .15 }, at);
    tl.call(() => {}, null, at);
    setProp(tl, pill, 'textContent', label, at + .15);
    tl.set(pill, { width: 520, left: 360 }, at + .15);
    tl.to(pill, { opacity: 1, duration: .2 }, at + .16);
    valEls.forEach(v => tl.to(v.children, { opacity: 0, duration: .2 }, at));
    sfx(b.t0 + at, 'whoosh', .5);
    vals.forEach(([vc, n], i) => {
      const s = el(valEls[i], '', 'position:absolute;left:0;top:0', '');
      const t = rel(b, vc);
      tl.fromTo(s, { opacity: 0 }, { opacity: 1, duration: .15 }, t);
      countUp(tl, s, n, t, .6, v => money(Math.round(v)));
      sfx(b.t0 + t, 'tap', .7);
    });
  });
};

/* ---------- AVATAR_CALC ---------- */
const KEYS = [['C', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '.', '$', '=']];
SCENES.AVATAR_CALC = (b, root, tl) => {
  const D = b.t1 - b.t0;
  const shade = el(root, 'full', 'background:linear-gradient(90deg, transparent 48%, rgba(0,0,0,.55) 62%, rgba(0,0,0,.82) 100%)');
  tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: .5 }, .1);
  tl.to(shade, { opacity: 0, duration: .4 }, D - .5);
  const phone = el(root, '', 'position:absolute;left:1122px;top:60px;width:520px;height:1100px;border-radius:76px;background:#0B0B0C;border:3px solid #2C2D30;box-shadow:0 40px 90px rgba(0,0,0,.7), inset 0 0 0 12px #0B0B0C');
  const scr = el(phone, '', 'position:absolute;left:14px;top:14px;right:14px;bottom:14px;border-radius:64px;background:linear-gradient(180deg,#121315,#0D0E0F);overflow:hidden');
  el(scr, '', 'position:absolute;left:50%;top:18px;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#000');
  const hist = el(scr, '', 'position:absolute;right:40px;left:30px;top:90px;text-align:right;font:500 30px Inter;color:#606060;line-height:1.5');
  const expr = el(scr, '', 'position:absolute;right:40px;left:20px;top:250px;text-align:right;font:500 54px Inter;color:#F0F0F0;white-space:nowrap');
  const res = el(scr, 'h-poppins', 'position:absolute;right:40px;left:20px;top:318px;text-align:right;font-size:100px;color:#48D8A8;white-space:nowrap');
  const lab = el(scr, '', 'position:absolute;right:42px;top:446px;font:600 26px Inter;color:#A8A8A8;text-align:right');
  const ul = el(scr, '', 'position:absolute;right:40px;top:440px;height:6px;width:260px;border-radius:3px;background:#F0F060;transform-origin:right center');
  const keyEls = {};
  KEYS.forEach((row, ri) => row.forEach((k, ci) => {
    const op = '÷×−+='.includes(k);
    const ke = el(scr, '', `position:absolute;left:${34 + ci * 112}px;top:${520 + ri * 104}px;width:94px;height:88px;border-radius:44px;display:flex;align-items:center;justify-content:center;font:600 40px Inter;` +
      (k === '=' ? 'background:#48D8A8;color:#06110D' : op ? 'background:#1E2A26;color:#48D8A8' : 'background:#232426;color:#F0F0F0'), k);
    keyEls[k] = ke;
  }));
  tl.fromTo(phone, { y: 900, x: 120, rotation: 6 }, { y: 0, x: 0, rotation: 0, duration: .55, ease: 'expo.out' }, .3);
  tl.to(phone, { y: 900, x: 160, rotation: 6, duration: .4, ease: 'power2.in' }, D - .55);
  sfx(b.t0 + .3, 'whoosh', .6);
  const tap = (k, at) => {
    const ke = keyEls[k];
    if (!ke) return;
    tl.fromTo(ke, { scale: 1, filter: 'brightness(1)' }, { scale: .9, filter: 'brightness(1.8)', duration: .09, yoyo: true, repeat: 1 }, at);
    sfx(b.t0 + at, 'tap');
  };
  let prevHist = '';
  b.steps.forEach((s, si) => {
    const st = Math.max(.9, s.t - b.t0);
    const toks = s.expr;
    const times = s.taps_t ? s.taps_t.map(x => Math.max(st, x - b.t0 - .1)) : toks.map((_, i) => st + .2 + i * .34);
    if (s.taps_t && times.length < toks.length) {   // spread operator taps between cue taps
      const full = [];
      let j = 0;
      toks.forEach((tk, i) => { if ('×−+÷→'.includes(tk)) full.push(null); else full.push(times[j++]); });
      for (let i = 0; i < full.length; i++) if (full[i] == null) full[i] = (full[i - 1] ?? st) + .25;
      times.length = 0; times.push(...full);
    }
    const resT = s.res_t ? Math.max(times[times.length - 1] + .3, s.res_t - b.t0) : (s.taps_t ? s.taps_t[s.taps_t.length - 1] - b.t0 : times[times.length - 1] + .45);
    // move previous line into history
    if (si > 0) {
      const h = prevHist;
      tl.call(() => {}, null, st - .01);
      setProp(tl, hist, 'innerHTML', h, st - .02);
      [expr, res, lab].forEach(n => setProp(tl, n, 'textContent', '', st - .02));
      tl.set(ul, { scaleX: 0 }, st - .02);
    }
    let txt = '';
    toks.forEach((tk, i) => {
      txt += (i ? ' ' : '') + tk;
      setProp(tl, expr, 'textContent', txt, times[i]);
      for (const ch of tk) tap(ch === '/' ? '÷' : ch, times[i] + 0.04 * [...tk].indexOf(ch));
    });
    tap('=', resT);
    const m = s.result.match(/^([^0-9]*)([0-9,]+)(.*)$/);
    const pre = m[1], num = +m[2].replace(/,/g, ''), suf = m[3];
    countUp(tl, res, num, resT + .05, .8, v => pre + Math.round(v).toLocaleString('en-US') + suf);
    tl.fromTo(res, { scale: .9, transformOrigin: 'right center' }, { scale: 1, duration: .5, ease: 'back.out(2)' }, resT + .05);
    setProp(tl, lab, 'textContent', s.label, resT + .05);
    tl.fromTo(lab, { opacity: 0 }, { opacity: 1, duration: .3 }, resT + .3);
    tl.fromTo(ul, { scaleX: 0 }, { scaleX: 1, duration: .35, ease: 'power3.out' }, resT + .85);
    tl.fromTo(phone, { scale: 1 }, { scale: 1.06, duration: 1.4, ease: 'sine.inOut', transformOrigin: '50% 30%' }, resT);
    tl.to(phone, { scale: 1, duration: .6, ease: 'sine.inOut' }, resT + 1.6);
    sfx(b.t0 + resT + .85, 'confirm');
    prevHist = (prevHist ? prevHist + '<br>' : '') + `${toks.join(' ')} = <span style="color:#48D8A8">${s.result}</span>`;
    prevHist = prevHist.split('<br>').slice(-2).join('<br>');
  });
};

/* ---------- END_SCREEN ---------- */
SCENES.END_SCREEN = (b, root, tl) => {
  const D = b.t1 - b.t0;
  const at = Math.max(.6, rel(b, 'card'));
  const tag = el(root, 'pill', 'position:absolute;left:1162px;top:250px;padding:10px 26px;border:1.5px solid #F0F060;color:#F0F060;font:700 28px Inter;letter-spacing:.06em', 'WATCH NEXT');
  const card = el(root, 'glass mint', 'left:1062px;top:320px;width:680px;height:470px;border-radius:30px;overflow:hidden');
  const th = el(card, '', 'position:absolute;left:0;top:0;right:0;height:340px;background:radial-gradient(circle at 30% 60%, rgba(72,216,168,.35), transparent 55%), linear-gradient(135deg,#1B1C1F,#0B0C0D)');
  el(th, '', 'position:absolute;left:70px;top:70px;width:170px;height:204px', ICON.jar(.7));
  el(th, '', 'position:absolute;left:300px;top:110px;width:90px;height:90px', ICON.play);
  el(th, 'h-poppins', 'position:absolute;left:300px;top:216px;font-size:34px;color:#F0F0F0;line-height:1.1', 'Grow your<br><span style="color:#F0F060">future-you</span> jar');
  el(card, '', 'position:absolute;left:30px;top:362px;right:30px;font:700 30px Inter;color:#F0F0F0', 'What to do with your future-you jar');
  const bar = el(card, '', 'position:absolute;left:30px;right:30px;top:420px;height:10px;border-radius:5px;background:rgba(255,255,255,.1)');
  const fill = el(bar, '', 'position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:5px;background:linear-gradient(90deg,#30C0C0,#48D8A8);transform-origin:left center');
  enterCard(tl, card, at, { ry: -20, rest: -4 });
  tl.fromTo(tag, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35 }, at + .2);
  tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: Math.max(.5, D - at - .5), ease: 'none' }, at + .3);
  sfx(b.t0 + at, 'rise');
};

/* ---------- GLASS_UI recipes ---------- */
SCENES.GLASS_UI = (b, root, tl) => {
  const cam = el(root, 'cam');
  camDrift(tl, cam, b.t1 - b.t0);
  RECIPES[b.recipe](b, cam, tl, root);
};
const RECIPES = {};

function bigPill(cam, tl, b, text, at, opt = {}) {   // giant typing pill, camera locked tight and tracking
  const wrap = el(cam, '', 'position:absolute;left:0;top:0;width:1920px;height:1080px');
  const pill = el(wrap, 'glass mint pill', 'left:150px;top:330px;height:420px;width:3600px;border-radius:210px;display:flex;align-items:center;padding-left:120px');
  const tx = el(pill, '', 'font:600 200px Inter;color:#F0F0F0;white-space:nowrap;letter-spacing:-.02em');
  const caret = el(pill, 'caret', 'height:200px');
  tl.fromTo(pill, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .4, ease: 'expo.out' }, Math.max(0, at - .3));
  const dur = typeText(tl, b, tx, text, at, opt.cps || 20);
  const w = measure(text, '600 200px Inter');
  const over = Math.max(0, 270 + w - 1700);
  tl.fromTo(wrap, { x: 0 }, { x: -over, duration: dur, ease: 'none' }, at);
  caretBlink(tl, caret, at + dur, at + dur + 1.2);
  return { wrap, pill, tx, dur };
}

RECIPES.WALLET = (b, cam, tl) => {
  const D = b.t1 - b.t0;
  const card = el(cam, 'glass mint', 'left:510px;top:200px;width:900px;height:600px;border-radius:32px');
  el(card, 'label-y', 'position:absolute;left:56px;top:46px;font-size:38px', 'My Wallet');
  el(card, '', 'position:absolute;right:56px;top:54px;font:500 26px Inter;color:#A8A8A8', 'This week');
  const bal = el(card, 'h-poppins', 'position:absolute;left:56px;top:120px;font-size:160px;color:#F0F0F0;line-height:1', '$0.00');
  const strike = el(card, 'strike-line', 'left:50px;top:205px;width:600px');
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d, i) =>
    el(card, 'pill', `position:absolute;left:${56 + i * 160}px;top:350px;width:140px;height:64px;border:1.5px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font:700 26px Inter;color:#A8A8A8;background:rgba(255,255,255,.03)`, d));
  const btn = el(card, 'btn', 'left:56px;top:470px;width:250px;height:76px;font-size:30px', 'Add $20');
  enterCard(tl, card, 0);
  const cur = makeCursor(cam);
  const mon = Math.max(.5, rel(b, 'mon'));
  moveCursor(tl, cur, 1700, 1000, 640, 500, .1, Math.max(.3, mon + .25));
  clickAt(tl, cam, b, cur, btn, 510 + 56 + 125, 200 + 470 + 38, mon + .4);
  tl.to(cur, { opacity: 0, duration: .3 }, mon + 1.0);
  const lit = d => ({ borderColor: '#48D8A8', color: '#F0F0F0', boxShadow: '0 0 18px rgba(72,216,168,.35)', duration: .2 });
  const dim = { borderColor: 'rgba(255,255,255,.12)', color: '#606060', boxShadow: 'none', duration: .2 };
  tl.to(days[0], lit(), mon + .4);
  countUp(tl, bal, 20, mon + .45, .5, v => money(v, 2));
  tl.fromTo(bal, { textShadow: '0 0 0 rgba(72,216,168,0)' }, { textShadow: '0 0 40px rgba(72,216,168,.8)', duration: .3, yoyo: true, repeat: 1 }, mon + .45);
  sfx(b.t0 + mon + .5, 'chime');
  const tada = rel(b, 'tada'), fri = rel(b, 'fri');
  sticker(tl, cam, b, 'Ta-da!', 'lav', 'left:1180px;top:150px', tada, rel(b, 'smoke') - .1, -16);
  const span = Math.max(.6, fri - tada + .2);
  for (let i = 1; i < 5; i++) { tl.to(days[i - 1], dim, tada + (i - 1) * span / 4 + .05); tl.to(days[i], lit(), tada + (i - 1) * span / 4 + .1); }
  const o = { v: 20 };
  tl.to(o, { v: 0, duration: span + .1, ease: 'power1.in', onUpdate: () => bal.textContent = money(o.v, 2) }, tada + .05);
  tl.to(bal, { color: '#606060', duration: .3 }, tada + span + .15);
  tl.fromTo(strike, { scaleX: 0 }, { scaleX: 1, duration: .35, ease: 'power3.inOut' }, tada + span + .15);
  sfx(b.t0 + tada + span + .15, 'strike');
  [['No smoke', 'smoke', 560], ['No rabbit', 'rabbit', 860]].forEach(([t, k, x]) => {
    const c = el(cam, 'glass pill', `left:${x}px;top:850px;padding:18px 36px;font:700 34px Inter;color:#A8A8A8;border-radius:999px`, t);
    tl.fromTo(c, { opacity: 0, y: 30, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .35, ease: 'back.out(2)' }, rel(b, k));
    sfx(b.t0 + rel(b, k), 'pop', .6);
  });
  sticker(tl, cam, b, 'Just gone', 'hex', 'left:1240px;top:760px', rel(b, 'gone'), D - .35, -14);
};

RECIPES.TWO_WALLETS = (b, cam, tl) => {
  const D = b.t1 - b.t0;
  const mk = (x, name, amt, frac) => {
    const c = el(cam, 'glass', `left:${x}px;top:270px;width:640px;height:520px;border-radius:32px`);
    el(c, '', 'position:absolute;left:50px;top:44px;font:600 32px Inter;color:#A8A8A8', name);
    el(c, 'h-poppins', 'position:absolute;left:50px;top:100px;font-size:140px;color:#F0F0F0;line-height:1', amt);
    const bar = el(c, '', 'position:absolute;left:50px;top:300px;width:540px;height:34px;border-radius:17px;background:rgba(255,255,255,.07);overflow:hidden');
    const fill = el(bar, '', 'position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:17px;background:linear-gradient(90deg,#30C0C0,#48D8A8);transform-origin:left center');
    const lost = el(bar, '', `position:absolute;top:0;bottom:0;right:0;width:${frac * 100}%;background:#5A1E1E;opacity:0`);
    const tag = el(c, '', 'position:absolute;right:50px;top:350px;font:800 32px Inter;color:#F0F060;opacity:0', '−$2');
    const cap = el(c, '', 'position:absolute;left:50px;top:410px;font:700 46px Inter;color:#F0F0F0');
    return { c, fill, lost, tag, cap };
  };
  const A = mk(250, 'Person one', '$100', .02), B = mk(1030, 'Person two', '$10', .2);
  enterCard(tl, A.c, rel(b, 'a'), { ry: 22, rest: 6 });
  enterCard(tl, B.c, rel(b, 'b'), { ry: -22, rest: -6 });
  sfx(b.t0 + rel(b, 'a'), 'whoosh', .5); sfx(b.t0 + rel(b, 'b'), 'whoosh', .5);
  const drop = rel(b, 'drop');
  [A, B].forEach((P, i) => {
    const coin = el(cam, 'pill', `left:${(i ? 1030 : 250) + 470}px;top:0;width:120px;height:120px;border-radius:50%;background:#1C1D20;border:3px solid #48D8A8;display:flex;align-items:center;justify-content:center;font:800 36px Inter;color:#48D8A8;box-shadow:0 0 30px rgba(72,216,168,.4)`, '$2');
    tl.fromTo(coin, { y: -160, opacity: 0 }, { y: 560, opacity: 1, duration: .6, ease: 'power2.in' }, drop + i * .12);
    tl.to(coin, { opacity: 0, scale: .6, duration: .2 }, drop + .6 + i * .12);
    tl.to(P.fill, { scaleX: 1 - (i ? .2 : .02), duration: .5, ease: 'power2.out' }, drop + .6 + i * .12);
    tl.to(P.lost, { opacity: 1, duration: .3 }, drop + .6 + i * .12);
    tl.to(P.tag, { opacity: 1, duration: .3 }, drop + .7 + i * .12);
    sfx(b.t0 + drop + .6 + i * .12, 'tap');
  });
  const first = rel(b, 'first'), second = rel(b, 'second');
  tl.to(cam, { x: 260, duration: .7, ease: 'power3.inOut' }, first - .1);
  tl.to(A.c, { borderColor: '#F0F060', boxShadow: '0 0 26px rgba(240,240,96,.25), 0 30px 80px rgba(0,0,0,.55)', duration: .3 }, first);
  tl.to(B.c, { filter: 'blur(4px) brightness(.6)', duration: .4 }, first);
  typeText(tl, b, A.cap, '2 out of 100', first + .9, 20);
  sticker(tl, cam, b, 'Barely noticed', 'lav', 'left:560px;top:180px', rel(b, 'notice'), second - .2, -14);
  tl.to(cam, { x: -300, duration: .7, ease: 'power3.inOut' }, second - .1);
  tl.to(A.c, { borderColor: 'rgba(255,255,255,.1)', boxShadow: '0 30px 80px rgba(0,0,0,.55)', filter: 'blur(4px) brightness(.6)', duration: .4 }, second);
  tl.to(B.c, { filter: 'blur(0px) brightness(1)', borderColor: '#F0F060', boxShadow: '0 0 26px rgba(240,240,96,.25), 0 30px 80px rgba(0,0,0,.55)', duration: .4 }, second);
  typeText(tl, b, B.cap, '2 out of 10', second + .9, 20);
  const fifth = rel(b, 'fifth');
  tl.fromTo(B.lost, { backgroundColor: '#5A1E1E' }, { backgroundColor: '#F0F060', duration: .3 }, fifth);
  sticker(tl, cam, b, 'A fifth gone', 'hex', 'left:1180px;top:860px', fifth, D - .35, -12);
  sfx(b.t0 + fifth, 'shimmer');
  sfx(b.t0 + first - .1, 'whoosh', .4); sfx(b.t0 + second - .1, 'whoosh', .4);
};

RECIPES.NOTES = (b, cam, tl) => {
  const D = b.t1 - b.t0;
  const P = bigPill(cam, tl, b, 'So write it down.', .15, { cps: 24 });
  const pb = Math.max(P.dur + .5, rel(b, 'paper') - .15);
  tl.to(P.wrap, { scale: .35, y: -420, opacity: 0, filter: 'blur(14px)', duration: .45, ease: 'power3.in' }, pb);
  sfx(b.t0 + pb, 'whoosh', .8);
  const card = el(cam, 'glass', 'left:460px;top:190px;width:1000px;height:680px;border-radius:32px');
  el(card, 'label-y', 'position:absolute;left:56px;top:44px;font-size:36px', 'Spending Notes');
  el(card, '', 'position:absolute;right:56px;top:52px;font:500 26px Inter;color:#A8A8A8', '3 places');
  enterCard(tl, card, pb + .2);
  const rows = [['paper', 'On paper', '#C0392B', 'PEN'], ['notes', 'In your notes app', '#2F6FD6', 'APP'], ['anywhere', 'Anywhere', '#C8A920', 'ANY']];
  rows.forEach(([k, label, col, bt], i) => {
    const r = el(card, '', `position:absolute;left:46px;right:46px;top:${140 + i * 120}px;height:100px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:26px;padding:0 26px`);
    el(r, 'badge', `background:${col}`, bt);
    el(r, '', 'flex:1;font:600 36px Inter;color:#F0F0F0', label);
    el(r, '', 'font:600 32px Inter;color:#A8A8A8', 'Snack · $1');
    const sp = el(r, 'spinner'), ck = el(r, 'check', 'font-size:36px;position:absolute;right:30px;opacity:0', '✓');
    sp.style.marginLeft = '10px';
    const at = Math.max(pb + .5, rel(b, k));
    tl.fromTo(r, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .35, ease: 'expo.out' }, at);
    tl.fromTo(sp, { rotation: 0 }, { rotation: 720, duration: .7, ease: 'none' }, at);
    tl.to(sp, { opacity: 0, duration: .1 }, at + .7);
    tl.to(ck, { opacity: 1, duration: .15 }, at + .7);
    sfx(b.t0 + at, 'pop', .6);
  });
  const see = Math.max(pb + 1.5, rel(b, 'see'));
  const tot = el(card, '', 'position:absolute;left:46px;top:520px;font:700 40px Inter;color:#F0F0F0', 'Every spend, where you can see it');
  const hl = el(card, 'hlbox', 'left:38px;top:512px;width:690px;height:64px');
  tl.fromTo(tot, { opacity: 0 }, { opacity: 1, duration: .3 }, see - .4);
  tl.fromTo(hl, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: 'power2.out' }, see);
  sfx(b.t0 + see, 'shimmer');
  sticker(tl, cam, b, 'Now you see it', 'lav', 'left:1250px;top:120px', see + .2, D - .3, -16);
};

RECIPES.PAY_FIRST = (b, cam, tl) => {
  const D = b.t1 - b.t0;
  const first = rel(b, 'first');
  const P = bigPill(cam, tl, b, 'Pay future you first.', Math.max(.3, first - .05), { cps: 20 });
  const arr = Math.max(first + P.dur + .4, rel(b, 'arrives') - .2);
  tl.to(P.wrap, { scale: .35, y: -420, opacity: 0, filter: 'blur(14px)', duration: .45, ease: 'power3.in' }, arr);
  sfx(b.t0 + arr, 'whoosh', .8);
  const note = el(cam, 'glass mint pill', 'left:610px;top:120px;width:700px;height:120px;display:flex;align-items:center;gap:24px;padding-left:30px');
  el(note, '', 'width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,#30C0C0,#48D8A8);display:flex;align-items:center;justify-content:center;font:800 36px Inter;color:#06110D', '$');
  el(note, '', 'font:700 40px Inter;color:#F0F0F0', 'Money arrives');
  el(note, '', 'font:600 30px Inter;color:#A8A8A8;margin-left:auto;margin-right:40px', 'Payday');
  tl.fromTo(note, { opacity: 0, y: -80 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out' }, arr + .35);
  sfx(b.t0 + arr + .4, 'chime');
  const mk = (x, name, mint) => {
    const c = el(cam, `glass${mint ? ' mint' : ''}`, `left:${x}px;top:330px;width:560px;height:520px;border-radius:30px`);
    el(c, '', `position:absolute;left:44px;top:40px;font:700 38px Inter;color:${mint ? '#F0F060' : '#A8A8A8'}`, name);
    return c;
  };
  const spend = mk(330, 'Spending', false), fut = mk(1030, 'Future you', true);
  enterCard(tl, spend, arr + .5, { ry: 18 }); enterCard(tl, fut, arr + .6, { ry: -18, rest: -6 });
  const jar = el(fut, '', 'position:absolute;left:44px;top:120px;width:150px;height:180px', ICON.jar(0));
  const away = Math.max(arr + 1.3, rel(b, 'away'));
  const btn = el(cam, 'btn', 'left:700px;top:900px;width:520px;height:90px;font-size:34px', 'Pay future you first');
  tl.fromTo(btn, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .4, ease: 'expo.out' }, away - .9);
  const cur = makeCursor(cam);
  moveCursor(tl, cur, 1600, 1080, 990, 950, away - .9, .7);
  clickAt(tl, cam, b, cur, btn, 960, 945, away - .1);
  tl.to(cur, { opacity: 0, duration: .3 }, away + .6);
  const chip = el(cam, 'pill', 'left:900px;top:140px;width:120px;height:80px;border-radius:40px;background:#48D8A8;display:flex;align-items:center;justify-content:center;font:800 34px Inter;color:#06110D;opacity:0', '$');
  tl.fromTo(chip, { opacity: 0, x: 0, y: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .15 }, away + .05);
  tl.to(chip, { x: 280, y: 420, scale: .7, duration: .6, ease: 'power2.inOut' }, away + .1);
  tl.to(chip, { opacity: 0, duration: .15 }, away + .7);
  tl.fromTo(jar.querySelector('.liquid'), { scaleY: 0 }, { scaleY: .45, duration: .6, ease: 'power2.out' }, away + .7);
  tl.to(fut, { boxShadow: '0 0 0 1px rgba(72,216,168,.3), 0 0 60px rgba(72,216,168,.55), 0 30px 80px rgba(0,0,0,.55)', duration: .3, yoyo: true, repeat: 1 }, away + .7);
  sfx(b.t0 + away + .7, 'chime');
  sticker(tl, cam, b, 'Future you first', 'hex', 'left:1180px;top:230px', away + .9, D - .3, -14);
  const grows = Math.max(away + 1.4, rel(b, 'grows'));
  const ch = el(fut, '', 'position:absolute;left:230px;top:130px;width:290px;height:340px');
  ch.innerHTML = `<svg viewBox="0 0 290 340" width="100%" height="100%"><path d="M0 330 H290" stroke="#606060" stroke-width="2"/><path class="ln" d="M6 320 C70 310 110 290 150 250 S230 120 284 30" fill="none" stroke="#48D8A8" stroke-width="7" stroke-linecap="round" style="filter:drop-shadow(0 0 10px rgba(72,216,168,.7))"/></svg>`;
  const ln = ch.querySelector('.ln'), L = 420;
  ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L;
  tl.to(ln, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, grows);
  tl.to(jar.querySelector('.liquid'), { scaleY: 1, duration: 1.4, ease: 'power2.inOut' }, grows);
  tl.fromTo(spend, { filter: 'blur(0px) brightness(1)' }, { filter: 'blur(4px) brightness(.6)', duration: .5 }, grows);
  tl.to(cam, { x: -260, scale: 1.12, duration: 1.2, ease: 'power3.inOut' }, grows);
  sfx(b.t0 + grows, 'rise');
};

RECIPES.WORKSHOP = (b, cam, tl) => {
  const D = b.t1 - b.t0;
  const card = el(cam, 'glass mint', 'left:470px;top:150px;width:980px;height:650px;border-radius:32px');
  el(card, 'label-y', 'position:absolute;left:56px;top:46px;font-size:36px', 'Three-Jar Workshop');
  el(card, 'h-poppins', 'position:absolute;left:56px;top:100px;font-size:56px;color:#F0F0F0', 'Set up your three jars');
  enterCard(tl, card, .1);
  sfx(b.t0 + .1, 'whoosh', .6);
  const steps = Math.max(1.2, rel(b, 'steps'));
  ['Needs', 'Wants', 'Future you'].forEach((n, i) => {
    const r = el(card, '', `position:absolute;left:46px;right:46px;top:${220 + i * 120}px;height:100px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:26px;padding:0 26px`);
    el(r, '', 'width:54px;height:64px', ICON.jar(i === 2 ? .6 : .9, ['#48D8A8', '#30C0C0', '#2E8F70'][i]));
    el(r, '', 'flex:1;font:600 38px Inter;color:#F0F0F0', `Step ${i + 1} · ${n}`);
    const sp = el(r, 'spinner'), ck = el(r, 'check', 'font-size:38px;position:absolute;right:30px;opacity:0', '✓');
    const at = .6 + i * .35;
    tl.fromTo(r, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .35, ease: 'expo.out' }, at);
    tl.fromTo(sp, { rotation: 0 }, { rotation: 900, duration: Math.max(.5, steps + i * .35 - at), ease: 'none' }, at);
    tl.to(sp, { opacity: 0, duration: .1 }, steps + i * .35);
    tl.to(ck, { opacity: 1, duration: .15 }, steps + i * .35);
    sfx(b.t0 + steps + i * .35, 'tap', .7);
  });
  sticker(tl, cam, b, 'Step by step', 'lav', 'left:1320px;top:110px', steps, D - .3, -16);
  const nev = el(card, 'pill', 'position:absolute;left:46px;top:580px;padding:10px 26px;border:1px solid rgba(255,255,255,.14);font:600 28px Inter;color:#A8A8A8', 'No budgeting experience needed');
  tl.fromTo(nev, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .35 }, rel(b, 'never'));
  sticker(tl, cam, b, "It's free", 'hex', 'left:330px;top:760px', rel(b, 'free'), D - .3, -12);
  const btn = el(cam, 'btn', 'left:700px;top:860px;width:520px;height:96px;font-size:36px', 'Get the free workshop');
  const link = Math.max(rel(b, 'free') + .5, rel(b, 'link'));
  tl.fromTo(btn, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .4, ease: 'expo.out' }, rel(b, 'free') - .2);
  const cur = makeCursor(cam);
  moveCursor(tl, cur, 1700, 1100, 1000, 920, link - .7, .65);
  clickAt(tl, cam, b, cur, btn, 975, 910, link);
  tl.to(cur, { opacity: 0, duration: .3 }, link + .8);
  const desc = el(cam, 'pill', 'left:1260px;top:870px;padding:18px 30px;background:#F0F060;color:#050505;font:800 28px Inter;display:flex;align-items:center;gap:12px', `Link in the description <span style="width:30px;height:30px;display:inline-block">${ICON.down}</span>`);
  tl.fromTo(desc, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: .35, ease: 'back.out(2)' }, link + .35);
  tl.to(cam, { y: -60, scale: 1.08, duration: 1.0, ease: 'power3.inOut' }, link - .3);
};

/* ------------------------------------------------------------------ overlays on A-roll (Role 5) */
const OVER = {};
OVER.TEXT_ON_AROLL = (o, root, tl) => {
  const box = el(root, '', 'position:absolute;left:84px;top:300px;width:560px');
  const line = (txt, fs = 66, extra = '') => el(box, 'aroll-text', `position:relative;font-size:${fs}px;margin-bottom:20px;${extra}`, txt);
  const arrow = (dbl) => {
    const a = el(box, '', 'position:relative;width:220px;height:50px;margin:6px 0 24px 0');
    a.innerHTML = `<svg viewBox="0 0 220 50" width="220" height="50" style="overflow:visible;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))"><path class="ar" d="M${dbl ? 14 : 4} 25 H206 M190 10 L208 25 L190 40${dbl ? ' M30 10 L12 25 L30 40' : ''}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const p = a.querySelector('.ar'); p.style.strokeDasharray = 320; p.style.strokeDashoffset = 320;
    return p;
  };
  const T = o.t1 - o.t0;
  if (o.pattern === 'contrast' || o.pattern === 'double') {
    const a = line(o.a), ar = arrow(o.pattern === 'double'), bb = line(o.b, 66);
    const t0 = o.startcue_t ? Math.max(0, o.startcue_t - o.t0) : .05;
    tl.fromTo(a, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .28, ease: 'power2.out' }, t0);
    const tb = Math.max(t0 + .7, o.cueb_t - o.t0);
    tl.to(ar, { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, tb - .45);
    tl.fromTo(bb, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .28, ease: 'power2.out' }, tb);
    sfx(o.t0 + t0, 'pop', .5); sfx(o.t0 + tb - .45, 'swish', .5);
  } else if (o.pattern === 'build') {
    const l = line('', 76);
    const spans = o.words.map(w => el(l, 'word' + (w === o.key ? ' ykey' : ''), '', w));
    spans.forEach((s, i) => { const t = Math.max(.02, o.words_t[i] - o.t0); tl.fromTo(s, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .25, ease: 'power2.out' }, t); sfx(o.t0 + t, 'key', .5); });
  } else if (o.pattern === 'strike' || o.pattern === 'strike2') {
    const a = line(o.a, 76, 'display:inline-block');
    const sl = el(a, 'strike-line', `left:-6px;top:52%;width:calc(100% + 12px);background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35)`);
    tl.fromTo(a, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .28 }, .05);
    const ts = Math.max(.6, (o.strikecue_t ?? o.cueb_t) - o.t0 - (o.pattern === 'strike2' ? .5 : 0));
    tl.fromTo(sl, { scaleX: 0 }, { scaleX: 1, duration: .35, ease: 'power3.inOut' }, ts);
    tl.to(a, { opacity: .55, duration: .3 }, ts + .3);
    sfx(o.t0 + ts, 'strike', .6);
    if (o.pattern === 'strike2') {
      const bb = line('', 72);
      o.b.split(' ').forEach(w => el(bb, 'word' + (w.replace(/[^a-z]/gi, '').toLowerCase() === o.key ? ' ykey' : ''), '', w));
      tl.fromTo(bb, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .28 }, o.cueb_t - o.t0);
    }
  }
  tl.to(box, { opacity: 0, y: -10, duration: .3 }, T - .3);
};
OVER.HOOK_SPLIT_TITLE = (o, root, tl) => {
  const T = o.t1 - o.t0;
  const blk = (x, big, small, col) => {
    const d = el(root, '', `position:absolute;left:${x}px;top:250px;width:520px;text-align:center`);
    const bg = el(d, 'aroll-text h-poppins', `position:relative;font-size:150px;color:${col}`, big);
    const sm = el(d, 'aroll-text', 'position:relative;font-size:46px;font-weight:700;margin-top:8px', small);
    return { d, bg, sm };
  };
  const A = blk(60, o.big_a, o.small_a, '#fff'), B = blk(1340, o.big_b, o.small_b, '#F0F060');
  tl.fromTo(A.bg, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, .35);
  tl.fromTo(A.sm, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .3 }, .8);
  sfx(o.t0 + .35, 'hit', .7);
  const sl = el(A.d, 'strike-line', 'left:40px;top:120px;width:440px;height:8px');
  const ts = o.strike_t - o.t0;
  tl.fromTo(sl, { scaleX: 0 }, { scaleX: 1, duration: .4, ease: 'power3.inOut' }, ts);
  tl.to([A.bg, A.sm], { opacity: .5, duration: .3 }, ts + .3);
  sfx(o.t0 + ts, 'strike');
  const tb = o.cueb_t - o.t0;
  tl.fromTo(B.bg, { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, tb);
  tl.fromTo(B.sm, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .3 }, tb + .25);
  sfx(o.t0 + tb, 'hit', .7);
  tl.to([A.d, B.d], { opacity: 0, duration: .3 }, T - .3);
};
OVER.DISCLAIMER_CARD = (o, root, tl) => {
  const T = o.t1 - o.t0;
  const d = el(root, 'glass', 'left:360px;top:850px;width:1200px;padding:26px 40px;border-radius:12px;border:1.5px solid #48D8A8;background:rgba(42,43,46,.94)');
  el(d, '', 'font:800 30px Inter;color:#fff;text-decoration:underline;text-underline-offset:6px;margin-bottom:10px', 'Disclaimer');
  el(d, '', 'font:500 24px Inter;color:#fff;line-height:1.4', 'This is general education, not personal investment advice. Investments can fall as well as rise in value, and past performance does not guarantee future results.');
  tl.fromTo(d, { opacity: 0 }, { opacity: 1, duration: .3 }, 0);
  tl.to(d, { opacity: 0, duration: .3 }, T - .3);
};
OVER.PROGRESS_TRACKER = (o, root, tl) => {
  const T = o.t1 - o.t0;
  const wrap = el(root, '', 'position:absolute;left:0;top:0;width:1920px;height:1080px');
  const x0 = 300, x1 = 1620, y = 1000;
  el(wrap, '', 'position:absolute;left:0;right:0;top:880px;height:200px;background:linear-gradient(transparent, rgba(0,0,0,.55))');
  el(wrap, '', `position:absolute;left:${x0}px;top:${y - 3}px;width:${x1 - x0}px;height:6px;border-radius:3px;background:#606060`);
  const fill = el(wrap, '', `position:absolute;left:${x0}px;top:${y - 3}px;width:${x1 - x0}px;height:6px;border-radius:3px;background:#48D8A8;box-shadow:0 0 14px rgba(72,216,168,.7);transform-origin:left center;transform:scaleX(0)`);
  const n = o.stages.length;
  tl.fromTo(wrap, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .35 }, 0);
  o.stages.forEach(([lab], i) => {
    const x = x0 + (x1 - x0) * i / (n - 1);
    const dot = el(wrap, '', `position:absolute;left:${x - 14}px;top:${y - 14}px;width:28px;height:28px;border-radius:50%;background:#606060;border:4px solid #050505`);
    const lb = el(wrap, 'aroll-text', `position:absolute;left:${x - 160}px;width:320px;text-align:center;top:${y - 70}px;font-size:32px;letter-spacing:.04em`, lab);
    const at = Math.max(.3, o.stages_t[i] - o.t0);
    tl.fromTo(lb, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3 }, at);
    tl.to(dot, { backgroundColor: '#48D8A8', boxShadow: '0 0 16px rgba(72,216,168,.8)', duration: .25 }, at + .2);
    tl.to(fill, { scaleX: i / (n - 1) || .001, duration: .45, ease: 'power2.inOut' }, at - .2);
    sfx(o.t0 + at, 'pop', .6);
  });
  const st = o.sticker_t - o.t0;
  sticker(tl, wrap, o, o.sticker[0], 'lav', 'left:110px;top:150px', st, Math.min(T - .4, o.stages_t[0] - o.t0), -14);
  tl.to(wrap, { opacity: 0, duration: .3 }, T - .3);
};
OVER.CHECKLIST_ON_AROLL = (o, root, tl) => {
  const T = o.t1 - o.t0;
  const box = el(root, '', 'position:absolute;left:84px;top:300px;width:600px');
  o.items.forEach(([lab], i) => {
    const r = el(box, '', 'position:relative;display:flex;align-items:center;gap:22px;margin-bottom:30px');
    const cb = el(r, '', 'width:50px;height:50px;border-radius:10px;border:4px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.35);flex:none');
    const ck = el(cb, '', 'font:900 38px Inter;color:#48D8A8;opacity:0', '✓');
    const tx = el(r, 'aroll-text', 'position:relative;font-size:46px;color:#A8A8A8', lab);
    const at = Math.max(.05, o.items_t[i] - o.t0);
    tl.fromTo(r, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: .25 }, Math.max(0, at - .35));
    tl.to(ck, { opacity: 1, duration: .15 }, at + .1);
    tl.fromTo(ck, { scale: .3 }, { scale: 1, duration: .25, ease: 'back.out(3)' }, at + .1);
    tl.to(tx, { color: '#F0F0F0', duration: .2 }, at + .1);
    sfx(o.t0 + at + .1, 'tap');
  });
  tl.to(box, { opacity: 0, duration: .3 }, T - .3);
};

/* ------------------------------------------------------------------ assembly */
let TL, master, segs = [], avImgs = [], sentenceStarts = [], cuts = [], pushes = [];
const AROLL = new Set(['AVATAR_TALK', 'AVATAR_CALC', 'END_SCREEN']);
const SIDE = new Set(['AVATAR_CALC', 'END_SCREEN']);

async function build(timeline, words, opts = {}) {
  TL = timeline;
  window.FACE = opts.face || { x: .5, y: .36 };
  window.AVSRC = opts.avsrc || null;            // fn(frameIndex) -> url
  window.BROLL = opts.broll || {};
  await document.fonts.ready;
  await Promise.all(['700 40px Poppins', '600 40px Poppins', '400 40px Inter', '500 40px Inter', '600 40px Inter', '700 40px Inter', '800 40px Inter'].map(f => document.fonts.load(f)));
  const stage = document.getElementById('stage');
  master = gsap.timeline({ paused: true });

  // sentence starts for jump-cut framing
  for (let i = 1; i < words.length; i++) if (/[.?!]$/.test(words[i - 1].w)) sentenceStarts.push(words[i].t0);

  // segments: consecutive A-roll beats share one visual layer
  const aroll = document.getElementById('aroll');
  const scenesLayer = document.getElementById('scenes');
  TL.layout.forEach((b, i) => {
    const grp = AROLL.has(b.type) ? 'aroll' : 'b' + i;
    const last = segs[segs.length - 1];
    if (last && last.grp === 'aroll' && grp === 'aroll') { last.t1 = b.t1; last.beats.push(b); }
    else segs.push({ grp, t0: b.t0, t1: b.t1, beats: [b], el: grp === 'aroll' ? null : null });
  });
  // the A-roll layer is reused by every aroll segment
  segs.forEach((s, i) => {
    s.el = s.grp === 'aroll' ? aroll : el(scenesLayer, 'layer', 'display:none');
    s.kindIn = i ? transKind(segs[i - 1], s) : null;
    s.kindOut = i < segs.length - 1 ? transKind(s, segs[i + 1]) : null;
    const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    f.id = 'mb' + i; f.setAttribute('x', '-20%'); f.setAttribute('width', '140%');
    f.innerHTML = '<feGaussianBlur stdDeviation="0 0"/>';
    document.getElementById('filters').appendChild(f);
    s.blur = f.firstChild; s.fid = 'mb' + i;
    if (s.kindIn) sfx(s.t0, s.kindIn === 'whip' ? 'whoosh' : 'swish', s.kindIn === 'whip' ? 1 : .7);
  });

  // per-beat content
  TL.layout.forEach(b => {
    const seg = segs.find(s => s.beats.includes(b));
    let root;
    if (seg.grp === 'aroll') { root = el(document.getElementById('arollBeats'), 'full', 'visibility:hidden'); b._root = root; }
    else root = seg.el;
    const tl = gsap.timeline();
    if (SCENES[b.type]) SCENES[b.type](b, root, tl);
    master.add(tl, b.t0);
  });
  TL.overlays.forEach(o => {
    const root = el(document.getElementById('overlays'), 'full', 'visibility:hidden');
    o._root = root;
    const tl = gsap.timeline();
    OVER[o.type](o, root, tl);
    master.add(tl, o.t0);
  });

  // A-roll framing plan: jump cuts alternate wide/tight; pushes on emphasis words
  TL.layout.filter(b => b.type === 'AVATAR_TALK').forEach(b => (b.push_t || []).forEach(tp => {
    const end = sentenceStarts.find(s => s > tp + .3) ?? b.t1;
    pushes.push({ t: tp - .15, end: Math.min(end, b.t1) });
  }));
  let lastCut = -99, tight = false;
  TL.layout.forEach((b, bi) => {
    if (b.type !== 'AVATAR_TALK') { lastCut = -99; return; }
    const prevAroll = bi > 0 && AROLL.has(TL.layout[bi - 1].type);
    if (!prevAroll) { tight = false; cuts.push({ t: b.t0, tight }); lastCut = b.t0; }
    sentenceStarts.filter(s => s > b.t0 + .5 && s < b.t1 - 1.2).forEach(s => {
      const nearPush = pushes.some(p => s > p.t - 1 && s < p.end + .3);
      if (s - lastCut >= 3.5 && !nearPush) { tight = !tight; cuts.push({ t: s - .05, tight }); lastCut = s; }
    });
  });
  avImgs = [...document.querySelectorAll('img.av')];
  sfxPush();
  window.SFX = SFX.sort((a, b) => a.t - b.t);
  window.SEGS = segs.map(s => ({ grp: s.grp, t0: s.t0, t1: s.t1, kindIn: s.kindIn }));
  return { sfx: window.SFX.length, segs: segs.length };
}
function sfxPush() { pushes.forEach(p => sfx(p.t, 'hit', .6)); }
function transKind(a, b) {
  const t = s => s.beats[0].type;
  return (['GLASS_UI', 'BROLL'].includes(t(a)) || ['GLASS_UI', 'BROLL'].includes(t(b))) ? 'whip' : 'push';
}
const TD = { whip: .32, push: .36 };

function avatarTransform(t) {
  // framing scale for A-roll talk
  let base = 1, cutT = 0;
  for (const c of cuts) { if (c.t <= t) { base = c.tight ? 1.15 : 1.0; cutT = c.t; } else break; }
  const since = t - cutT;
  let s = base * (1 + .022 * Math.min(since / 6, 1.3) * (base > 1 ? -1 : 1) + (base > 1 ? .022 : 0));
  for (const p of pushes) {
    if (t >= p.t && t < p.end + .7) {
      const kin = eoExpo(clamp((t - p.t) / .4));
      const kout = t > p.end ? eio(clamp((t - p.end) / .7)) : 0;
      s = lerp(s, 1.17, kin * (1 - kout));
    }
  }
  let x = 0;
  for (const b of TL.layout) if (SIDE.has(b.type) && t > b.t0 - .1 && t < b.t1 + .1) {
    const k = eio(clamp((t - b.t0) / .6)) * eio(clamp((b.t1 - t) / .6));
    const drift = 1 + .03 * clamp((t - b.t0) / (b.t1 - b.t0));
    s = lerp(s, .94 * drift, k); x = lerp(0, -288, k);
  }
  return { s: Math.min(s, 1.2), x };
}

function segOffset(s, i, t) {   // {visible, x, blur}
  const din = s.kindIn ? TD[s.kindIn] : 0, dout = s.kindOut ? TD[s.kindOut] : 0;
  if (t < s.t0 - din / 2 || t > s.t1 + dout / 2) return null;
  const B = k => k === 'whip' ? 46 : 14;
  if (s.kindIn && t < s.t0 + din / 2) { const p = (t - (s.t0 - din / 2)) / din; return { x: W * (1 - eio(p)), blur: Math.sin(Math.PI * p) * B(s.kindIn) }; }
  if (s.kindOut && t > s.t1 - dout / 2) { const p = (t - (s.t1 - dout / 2)) / dout; return { x: -W * eio(p), blur: Math.sin(Math.PI * p) * B(s.kindOut) }; }
  return { x: 0, blur: 0 };
}

function orbs(t) {
  const o = document.querySelectorAll('#bg .orb');
  o.forEach((e, i) => {
    const ph = i * 1.7;
    e.style.transform = `translate(${Math.sin(t * .07 + ph) * 140}px, ${Math.cos(t * .05 + ph) * 90}px)`;
  });
}

async function renderAt(t) {
  master.seek(t, false);
  orbs(t);
  let arollOn = false;
  segs.forEach((s, i) => {
    const o = segOffset(s, i, t);
    if (s.grp === 'aroll') { if (o) { arollOn = true; s._o = o; } return; }
    if (!o) { s.el.style.display = 'none'; return; }
    s.el.style.display = 'block';
    s.el.style.transform = `translateX(${o.x.toFixed(1)}px)`;
    s.blur.setAttribute('stdDeviation', `${o.blur.toFixed(1)} 0`);
    s.el.style.filter = o.blur > .5 ? `url(#${s.fid})` : 'none';
    s.beats.forEach(b => { if (b._broll) brollFrame(b, t); });
  });
  // A-roll layer (one layer, several segments)
  const ar = document.getElementById('aroll');
  const aseg = segs.filter(s => s.grp === 'aroll').map((s, j) => ({ s, o: segOffset(s, segs.indexOf(s), t) })).find(x => x.o);
  if (aseg) {
    ar.style.display = 'block';
    ar.style.transform = `translateX(${aseg.o.x.toFixed(1)}px)`;
    aseg.s.blur.setAttribute('stdDeviation', `${aseg.o.blur.toFixed(1)} 0`);
    ar.style.filter = aseg.o.blur > .5 ? `url(#${aseg.s.fid})` : 'none';
    const a = avatarTransform(t);
    const wrap = document.getElementById('avWrap');
    wrap.style.transformOrigin = `${FACE.x * 100}% ${FACE.y * 100}%`;
    wrap.style.transform = `translateX(${a.x.toFixed(1)}px) scale(${a.s.toFixed(4)})`;
    TL.layout.forEach(b => { if (b._root) b._root.style.visibility = (t >= b.t0 - .4 && t <= b.t1 + .4) ? 'visible' : 'hidden'; });
    TL.overlays.forEach(o => { o._root.style.visibility = (t >= o.t0 && t <= o.t1) ? 'visible' : 'hidden'; });
  } else ar.style.display = 'none';
  // avatar frames: every visible avatar <img> shows the frame for time t
  const fi = Math.floor(t * 30 + 1e-6);
  const src = AVSRC ? AVSRC(fi) : null;
  const waits = [];
  if (src) avImgs.forEach(img => {
    if (img.offsetParent === null && !(img.closest('#aroll') && aseg)) return;
    if (img.getAttribute('src') !== src) { img.setAttribute('src', src); waits.push(img.decode().catch(() => {})); }
  });
  document.querySelectorAll('#scenes img').forEach(img => { if (img.offsetParent && img.src && !img.complete) waits.push(img.decode().catch(() => {})); });
  await Promise.all(waits);
}
window.build = build; window.renderAt = renderAt;
