// Glass UI motion engine: deterministic, frame-addressable scenes.
// Every scene is a pure function of absolute time t (seconds on the source
// timeline), so any frame can be rendered in any order by render.js.
'use strict';

const W = 1920, H = 1080;
const E = {
  linear: x => x,
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inCubic: x => x * x * x,
  // ~10% overshoot
  outBack: x => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, t0, d, e = E.outExpo) => e(clamp((t - t0) / d));
const lerp = (a, b, p) => a + (b - a) * p;
const bump = (t, tc, d) => { const x = (t - tc) / d; return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x); };
const fmt = (n, dec = 0) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function el(parent, cls, html, tag) {
  const e = document.createElement(tag || 'div');
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}
function css(e, o) { Object.assign(e.style, o); return e; }
function place(e, x, y, w, h) {
  css(e, { position: 'absolute', left: x + 'px', top: y + 'px' });
  if (w != null) e.style.width = w + 'px';
  if (h != null) e.style.height = h + 'px';
  return e;
}

// ------------------------------------------------------------------ registry
const SC = {};
let BEATS = {};
function scene(id, def) { SC[id] = def; }

// ------------------------------------------------------------- background
const ORB_COLORS = ['30,118,82', '72,72,48', '90,30,30', '48,72,96', '30,118,82'];
function voidBG(root, seed = 0, opts = {}) {
  const v = el(root, 'void');
  const orbs = [];
  const n = opts.orbs || 4;
  for (let i = 0; i < n; i++) {
    const o = el(v, 'orb');
    const size = 1000 + ((i * 337 + seed * 91) % 500);
    const c = ORB_COLORS[(i + seed) % ORB_COLORS.length];
    css(o, { width: size + 'px', height: size + 'px',
      background: `radial-gradient(circle at 50% 50%, rgba(${c},0.95) 0%, rgba(${c},0.5) 30%, rgba(${c},0.14) 56%, rgba(${c},0) 72%)` });
    orbs.push({ o, size, bx: [0.12, 0.82, 0.55, 0.2, 0.9][i] * W, by: [0.25, 0.2, 0.85, 0.82, 0.6][i] * H, ph: i * 1.7 + seed });
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'wave'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'rgba(110,235,200,0.16)'); path.setAttribute('stroke-width', '2');
  path.style.filter = 'drop-shadow(0 0 8px rgba(72,216,168,0.5))';
  svg.appendChild(path); v.appendChild(svg);
  el(v, 'vignette');
  return t => {
    for (const q of orbs) {
      const x = q.bx + 90 * Math.sin(t * 0.11 + q.ph) - q.size / 2;
      const y = q.by + 60 * Math.cos(t * 0.09 + q.ph * 1.3) - q.size / 2;
      q.o.style.transform = `translate(${x}px, ${y}px)`;
      q.o.style.opacity = 0.5;
    }
    if (opts.wave !== false) {
      let d = '';
      const yb = H * (opts.waveY || 0.62);
      for (let x = -20; x <= W + 20; x += 20) {
        const y = yb + 46 * Math.sin(x / 260 + t * 0.6) + 18 * Math.sin(x / 90 - t * 0.9);
        d += (x === -20 ? 'M' : 'L') + x + ' ' + y.toFixed(1);
      }
      path.setAttribute('d', d);
    }
  };
}

// ------------------------------------------------------------------ world
function world(root) {
  const w = el(root, 'world');
  const cam = el(w, 'cam');
  return { w, cam };
}
// Constant slow drift so the camera is never still.
function drift(cam, t, t0, t1, o = {}) {
  const p = clamp((t - t0) / Math.max(0.01, t1 - t0));
  const s = lerp(o.s0 || 1.0, o.s1 || 1.035, E.inOutCubic(p));
  const ry = lerp(o.ry0 == null ? -2.5 : o.ry0, o.ry1 == null ? 2.5 : o.ry1, E.inOutCubic(p));
  const rx = (o.rx == null ? 1.5 : o.rx) * Math.sin(p * Math.PI);
  const tx = (o.tx || 0), ty = (o.ty || 0);
  cam.style.transform = `translate(${tx}px, ${ty}px) scale(${s}) rotateY(${ry}deg) rotateX(${rx}deg)` + (o.extra || '');
}

// Card entrance: fade + un-blur 20px->0, rotateY 20deg -> rest tilt, scale .9 -> 1.
function enter(e, t, t0, o = {}) {
  const d = o.d || 0.55;
  const p = P(t, t0, d, E.outExpo);
  const dir = o.dir || 1;
  let op = p, blur = 20 * (1 - p), sc = lerp(o.sFrom || 0.9, 1, p);
  const ry = dir * lerp(o.from == null ? 20 : o.from, o.rest == null ? 6 : o.rest, p);
  const rx = lerp(o.rxFrom == null ? 6 : o.rxFrom, o.rx == null ? 2 : o.rx, p);
  let tz = o.z || 0, ty = (o.rise || 0) * (1 - p), tx = (o.slide || 0) * (1 - p);
  if (o.exit != null) {
    const q = P(t, o.exit, o.ed || 0.35, E.inOutCubic);
    op *= 1 - q; blur += 14 * q; sc *= lerp(1, 0.94, q); ty -= 20 * q;
  }
  blur += o.dof || 0;
  e.style.opacity = op.toFixed(3);
  e.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : 'none';
  e.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${sc})` + (o.extra || '');
  return p;
}

// Simple fade/scale pop for flat elements.
function fadeIn(e, t, t0, d = 0.4, o = {}) {
  const p = P(t, t0, d, o.ease || E.outExpo);
  let op = p;
  if (o.exit != null) op *= 1 - P(t, o.exit, o.ed || 0.3, E.inOutCubic);
  e.style.opacity = op.toFixed(3);
  const y = (o.rise == null ? 18 : o.rise) * (1 - p);
  const x = (o.slide || 0) * (1 - p);
  const s = lerp(o.sFrom == null ? 1 : o.sFrom, 1, p);
  e.style.transform = `translate(${x}px, ${y}px) scale(${s})` + (o.extra || '');
  if (o.blur) e.style.filter = (1 - p) * o.blur > 0.25 ? `blur(${((1 - p) * o.blur).toFixed(2)}px)` : 'none';
  return p;
}

// ---------------------------------------------------------------- typing
function typed(e, text, t, t0, cps = 22, o = {}) {
  const n = clamp(Math.floor((t - t0) * cps), 0, text.length);
  const typing = t >= t0 && n < text.length;
  const showCaret = o.caret !== false && t >= t0 - 0.3 && (typing || Math.floor(t * 2.2) % 2 === 0) && (o.caretUntil == null || t < o.caretUntil);
  e.innerHTML = escapeHtml(text.slice(0, n)) + (showCaret ? '<span class="caret"></span>' : '<span class="caret" style="opacity:0"></span>');
  return n;
}
const typeDur = (text, cps = 22) => text.length / cps;
function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// ------------------------------------------------------------- highlight
function hl(span, t, t0, d = 0.5) {
  const p = P(t, t0, d, E.inOutCubic);
  span.style.backgroundSize = `${(p * 100).toFixed(1)}% 100%`;
  span.style.boxShadow = p > 0 ? `inset 0 0 0 1px rgba(127,159,224,${(0.9 * p).toFixed(2)})` : 'none';
  return p;
}

// --------------------------------------------------------------- sticker
function sticker(parent, text, o) {
  const s = el(parent, 'sticker');
  const shape = o.shape || 'pill';
  if (shape === 'pill') {
    el(s, 'pillshape', text);
  } else {
    const lines = text.split('\n');
    const longest = Math.max(...lines.map(l => l.length));
    const w = Math.max(180, 44 + longest * 17.5), h = 58 + lines.length * 29;
    const box = el(s, 'hexshape');
    css(box, { width: w + 'px', height: h + 'px' });
    const r = h / 2.2;
    box.innerHTML = `<svg width="${w}" height="${h}"><polygon points="${r},0 ${w - r},0 ${w},${h / 2} ${w - r},${h} ${r},${h} 0,${h / 2}"
      fill="#f0f048" stroke="#f0f048" stroke-width="26" stroke-linejoin="round"/></svg><span style="width:${w}px;height:${h}px">${lines.join('<br>')}</span>`;
  }
  place(s, o.x, o.y);
  const rot = o.rot == null ? -18 : o.rot;
  return {
    e: s,
    update(t) {
      const pin = P(t, o.t0, 0.25, E.outBack);
      const pout = o.t1 != null ? P(t, o.t1, 0.2, E.inCubic) : 0;
      const sc = Math.max(0, pin * (1 - pout));
      const bob = 4 * Math.sin((t - o.t0) * Math.PI);  // 2 s loop
      s.style.opacity = t < o.t0 ? 0 : 1;
      s.style.transform = `translateY(${bob.toFixed(2)}px) rotate(${rot}deg) scale(${sc.toFixed(3)})`;
    },
  };
}

// ---------------------------------------------------------------- cursor
const CURSOR_SVG = `<svg viewBox="0 0 46 56" width="46" height="56"><path d="M4 3 L4 44 L15 33 L23 51 L31 47.5 L23 30 L39 30 Z"
  fill="#8aa4f8" stroke="#dfe6ff" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
function cursor(parent, keys) {
  // keys: [{t, x, y}] ; moves between consecutive keys on an eased curve.
  const c = el(parent, 'cursor', CURSOR_SVG);
  const clicks = [];
  const ripples = [];
  return {
    e: c,
    click(t, x, y) { clicks.push(t); const r = el(parent, 'ripple'); ripples.push({ r, t, x, y }); },
    update(t) {
      let x = keys[0].x, y = keys[0].y;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i], b = keys[i + 1];
        if (t >= a.t && t <= b.t) {
          const p = E.inOutCubic((t - a.t) / (b.t - a.t));
          const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.18, my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18;
          x = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * mx + p * p * b.x;
          y = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * my + p * p * b.y;
          break;
        }
        if (t > b.t) { x = b.x; y = b.y; }
      }
      let sc = 1;
      for (const tc of clicks) sc -= 0.12 * bump(t, tc - 0.05, 0.2);
      const vis = t >= keys[0].t - 0.01 && (keys.out == null || t < keys.out);
      const fadeIn = clamp((t - keys[0].t) / 0.15);
      c.style.opacity = vis ? fadeIn : 0;
      c.style.transform = `translate(${x - 4}px, ${y - 3}px) scale(${sc})`;
      for (const q of ripples) {
        const p = clamp((t - q.t) / 0.5);
        const size = 30 + 140 * E.outCubic(p);
        q.r.style.opacity = t < q.t || p >= 1 ? 0 : (0.75 * (1 - p)).toFixed(3);
        css(q.r, { width: size + 'px', height: size + 'px', left: (q.x - size / 2) + 'px', top: (q.y - size / 2) + 'px' });
      }
    },
  };
}
// Target press feedback: scale to ~0.95 and dim slightly at the click.
function press(t, tc) { const b = bump(t, tc - 0.04, 0.24); return { s: 1 - 0.05 * b, dim: 1 - 0.12 * b }; }

// ---------------------------------------------------------------- dots
function typingDots(parent, x, y) {
  const d = el(parent, 'dots');
  place(d, x, y);
  const is = [el(d, '', null, 'i'), el(d, '', null, 'i'), el(d, '', null, 'i')];
  return {
    e: d,
    update(t) {
      is.forEach((i, k) => {
        const ph = (t * 2.4 - k * 0.22) % 1;
        const a = Math.max(0, Math.sin(ph * Math.PI));
        i.style.background = `rgb(${120 + 100 * a},${120 + 100 * a},${120 + 100 * a})`;
        i.style.transform = `translateY(${-6 * a}px)`;
      });
    },
  };
}

// ---------------------------------------------------------------- charts
function svgEl(parent, tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}
function lineChart(parent, pts, o) {
  // pts in [0..1] space; drawn into w x h with draw progress update(p)
  const svg = svgEl(parent, 'svg', { width: o.w, height: o.h, style: 'position:absolute;left:' + (o.x || 0) + 'px;top:' + (o.y || 0) + 'px;overflow:visible' });
  const defs = svgEl(svg, 'defs', {});
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  const lg = svgEl(defs, 'linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
  svgEl(lg, 'stop', { offset: '0%', 'stop-color': o.color || '#48d8a8', 'stop-opacity': 0.35 });
  svgEl(lg, 'stop', { offset: '100%', 'stop-color': o.color || '#48d8a8', 'stop-opacity': 0 });
  for (let i = 0; i <= 4; i++) svgEl(svg, 'line', { x1: 0, x2: o.w, y1: (o.h * i) / 4, y2: (o.h * i) / 4, stroke: 'rgba(255,255,255,0.06)', 'stroke-width': 1 });
  const P2 = pts.map(([x, y]) => [x * o.w, (1 - y) * o.h]);
  let d = 'M' + P2.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const area = svgEl(svg, 'path', { d: d + ` L${o.w} ${o.h} L0 ${o.h} Z`, fill: `url(#${gid})`, opacity: 0 });
  const path = svgEl(svg, 'path', { d, fill: 'none', stroke: o.color || '#48d8a8', 'stroke-width': o.sw || 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  path.style.filter = `drop-shadow(0 0 10px ${o.glow || 'rgba(72,216,168,0.7)'})`;
  const len = path.getTotalLength();
  path.setAttribute('stroke-dasharray', len);
  const dot = svgEl(svg, 'circle', { r: 9, fill: '#fff' });
  dot.style.filter = `drop-shadow(0 0 10px ${o.glow || 'rgba(72,216,168,0.9)'})`;
  return {
    svg, path, len,
    update(p) {
      path.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
      area.setAttribute('opacity', (0.9 * p).toFixed(2));
      const pt = path.getPointAtLength(len * clamp(p));
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      dot.setAttribute('opacity', p > 0.01 ? 1 : 0);
      return pt;
    },
  };
}

// ------------------------------------------------------------ response panel
// Reveals children top to bottom with a moving mask.
function reveal(e, t, t0, d) {
  const p = P(t, t0, d, E.outCubic);
  e.style.clipPath = `inset(0 0 ${((1 - p) * 100).toFixed(1)}% 0 round 28px)`;
  return p;
}

// -------------------------------------------------------------- counters
function count(t, t0, d, v1, v0 = 0) { return lerp(v0, v1, P(t, t0, d, E.outCubic)); }

// ------------------------------------------------------------ public API
window.R = {
  list() { return Object.keys(SC); },
  setBeats(b) { BEATS = b; },
  info(id) { const d = SC[id]; return { alpha: !!d.alpha, t0: d.t0, t1: d.t1 }; },
  show(id) {
    const stage = document.getElementById('stage');
    stage.innerHTML = '';
    const def = SC[id];
    const S = { events: [] };
    def.build(stage, S);
    window.__cur = { def, S };
    return S.events;
  },
  frame(t) { const c = window.__cur; c.def.update(t, c.S); },
};
