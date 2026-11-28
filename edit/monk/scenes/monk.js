// Monk 1 style graphics layer. M.frame(t) draws everything for output time t:
// a full-screen pastel card when the current shot is a graphic (opaque),
// otherwise transparent overlays (section pill, captions, side lists, branding).
'use strict';

const PL = window.PLAN;
const shotAt = t => PL.shots.find(s => t >= s.t0 && t < s.t1) || PL.shots[PL.shots.length - 1];
const show = (e, on) => { e.style.display = on ? '' : 'none'; return on; };
const pop = (e, t, t0, o = {}) => {            // soft scale-up fade, Monk card entrance
  const p = P(t, t0, o.d || 0.45, E.outCubic);
  const q = o.out != null ? 1 - P(t, o.out, 0.3, E.inCubic) : 1;
  e.style.opacity = (p * q).toFixed(3);
  e.style.transform = `${o.base || ''} translateY(${((o.rise == null ? 24 : o.rise) * (1 - p)).toFixed(1)}px) scale(${(0.94 + 0.06 * p).toFixed(3)})`;
  e.style.filter = p < 0.98 ? `blur(${(8 * (1 - p)).toFixed(1)}px)` : 'none';
  return p;
};
const wordsIn = (e, t, t0, cps = 9) => {       // word-by-word reveal of a text element's words
  if (!e._w) { const ws = e.textContent.split(' '); e.innerHTML = ws.map(w => `<span class="w">${escapeHtml(w)}</span>`).join(' '); e._w = [...e.querySelectorAll('.w')]; }
  e._w.forEach((w, i) => { const p = P(t, t0 + i / cps, 0.18, E.outCubic); w.style.opacity = p; w.style.filter = p < 0.98 ? `blur(${6 * (1 - p)}px)` : 'none'; });
};

// ---------------------------------------------------------------- cards
const CARDS = {};
function card(name, bg, build) { CARDS[name] = { bg, build }; }

card('belt', 'bp', (r, s) => {
  const c = PL.cues[1];
  const k = el(r, 'kicker', 'Every day you don’t choose'); k.style.top = '300px';
  const b = el(r, 'big', 'the belt chooses for you.'); css(b, { top: '400px', fontSize: '110px' });
  const track = el(r, 'abs'); css(track, { left: '0', right: '0', top: '640px', height: '120px' });
  const items = [];
  for (let i = 0; i < 9; i++) { const d = el(track, 'abs'); css(d, { top: '20px', width: '150px', height: '80px', borderRadius: '18px', background: 'rgba(55,57,65,0.7)', border: '2px solid rgba(41,142,230,0.75)' }); items.push(d); }
  return t => { pop(k, t, s.t0 + 0.05); wordsIn(b, t, c[1] - 0.6, 7); b.style.opacity = 1;
    items.forEach((d, i) => { d.style.left = (((i * 230 + (t - s.t0) * 260) % 2070) - 150) + 'px'; }); };
});

card('decide', 'lp', (r, s) => {
  const c = PL.cues[4];
  const k = el(r, 'kicker', 'The word “decide”'); k.style.top = '210px';
  const w = el(r, 'big', 'de·cīdere'); css(w, { top: '300px', fontSize: '150px', fontStyle: 'italic' });
  const l = el(r, 'ppill', 'Latin: “to cut off”'); css(l, { left: '50%', top: '520px' });
  const i1 = el(r, 'big', 'in·cis·ion'); css(i1, { top: '680px', fontSize: '84px', color: 'rgba(255,255,255,0.92)' });
  const i2 = el(r, 'kicker', 'same root'); i2.style.top = '800px';
  return t => { pop(k, t, s.t0 + 0.05); pop(w, t, s.t0 + 0.25); pop(l, t, c[0], { base: 'translateX(-50%)' }); pop(i1, t, c[1]); pop(i2, t, c[1] + 0.3); };
});

card('days', 'bp', (r, s) => {
  const k = el(r, 'kicker', '15 years ≈'); k.style.top = '300px';
  const n = el(r, 'big', '0'); css(n, { top: '370px', fontSize: '230px' });
  const u = el(r, 'kicker', 'days on the belt'); u.style.top = '650px';
  return t => { pop(k, t, s.t0 + 0.05); pop(n, t, s.t0 + 0.2); pop(u, t, s.t0 + 0.6);
    n.textContent = fmt(Math.round(count(t, s.t0 + 0.2, 1.6, 5500) / 10) * 10); };
});

card('weeks', 'lp', (r, s) => {
  const a = el(r, 'sphere', '<div class="t" style="font-size:70px">6<br><span style="font-size:34px">months</span></div>'); place(a, 470, 290, 400, 400);
  const eq = el(r, 'big', '≈'); css(eq, { top: '400px', fontSize: '120px' });
  const b = el(r, 'sphere blue', '<div class="t" style="font-size:70px">26<br><span style="font-size:34px">weeks</span></div>'); place(b, 1050, 290, 400, 400);
  const k = el(r, 'kicker', 'Long enough to change. Short enough to keep you honest.'); k.style.top = '780px';
  return t => { pop(a, t, s.t0 + 0.05); pop(eq, t, s.t0 + 0.35); pop(b, t, s.t0 + 0.55); pop(k, t, s.t0 + 1.6); };
});

card('pyramid', 'lp', (r, s) => {
  const c = PL.cues[9];
  const k = el(r, 'kicker', 'Three moves'); k.style.top = '120px';
  const tiers = [['Pay for it', 760, 210], ['Break it down', 560, 210], ['Define it', 360, 210]];
  const T = tiers.map(([lab, w, h], i) => {
    const d = el(r, 'tier'); const y = 820 - (i + 1) * 210;
    css(d, { top: y + 'px', width: w + 'px', height: h + 'px', marginLeft: (-w / 2) + 'px',
      clipPath: `polygon(${(100 * 100 / w).toFixed(1)}% 0, ${(100 - 100 * 100 / w).toFixed(1)}% 0, 100% 100%, 0 100%)`,
      background: ['linear-gradient(180deg,#051427,#0B2340)','linear-gradient(180deg,#062C4F,#074CA6)','linear-gradient(180deg,#1E6FD0,#298EE6)'][i], boxShadow: '0 10px 40px rgba(40,15,5,0.4)' });
    const t2 = el(r, 'big', lab); css(t2, { top: (y + 70) + 'px', fontSize: '50px' });
    return [d, t2];
  });
  // tiers land bottom-up in the spoken order define -> break down -> pay
  const order = [2, 1, 0];
  return t => { pop(k, t, s.t0 + 0.05); order.forEach((ti, j) => { pop(T[ti][0], t, c[j] - 0.1, { rise: 40 }); pop(T[ti][1], t, c[j]); }); };
});

card('questions', 'lp', (r, s) => {
  const c = PL.cues[11];
  const k = el(r, 'kicker', 'Break it down'); k.style.top = '140px';
  const qs = ['The smallest skill?', 'What does the move cost?', 'How much saved?'];
  const G = qs.map((q, i) => { const g = el(r, 'glass', `<div class="lab">Question #${i + 1}</div><div class="val" style="font-size:44px">${q}</div>`); place(g, 110 + i * 580, 330, 540, 380); return [g, g.querySelector('.val')]; });
  return t => { pop(k, t, s.t0 + 0.05); G.forEach(([g, v], i) => { pop(g, t, s.t0 + 0.2 + i * 0.15, { rise: 40 }); pop(v, t, c[i] - 0.05, { base: 'translateY(-50%)', rise: 10 }); }); };
});

card('fsi', 'bp', (r, s) => {
  const c = PL.cues[14];
  const k = el(r, 'kicker', 'U.S. State Department · Spanish'); k.style.top = '170px';
  const a = el(r, 'sphere', '<div class="t" style="font-size:80px">~24<br><span style="font-size:36px">weeks</span></div>'); place(a, 420, 300, 440, 440);
  const b = el(r, 'sphere blue', '<div class="t" style="font-size:80px">~600<br><span style="font-size:36px">hours of class</span></div>'); place(b, 1060, 300, 440, 440);
  const n = el(r, 'kicker', '≈ six months, full-time'); n.style.top = '820px';
  return t => { pop(k, t, s.t0 + 0.05); pop(a, t, s.t0 + 0.2); pop(b, t, c[0]); pop(n, t, c[1]); };
});

card('twelve', 'lp', (r, s) => {
  const c = PL.cues[19];
  const a = el(r, 'ppill', '1 real conversation a month'); css(a, { left: '50%', top: '330px' });
  const eq = el(r, 'big', '='); css(eq, { top: '420px', fontSize: '100px' });
  const b = el(r, 'big', '12 people a year'); css(b, { top: '560px', fontSize: '120px' });
  const k = el(r, 'kicker', 'who know your name'); k.style.top = '730px';
  return t => { pop(a, t, s.t0 + 0.05, { base: 'translateX(-50%)' }); pop(eq, t, c[1] - 0.2); pop(b, t, c[1]); pop(k, t, c[1] + 0.6); };
});

card('flop', 'bp', (r, s) => {
  const c = PL.cues[26];
  const a = el(r, 'big', 'Flop into what?'); css(a, { top: '330px', fontSize: '120px' });
  const b = el(r, 'ppill', 'The life they already have.'); css(b, { left: '50%', top: '560px' });
  return t => { pop(a, t, c[0]); pop(b, t, c[1], { base: 'translateX(-50%)' }); };
});

card('habit', 'lp', (r, s) => {
  const c = PL.cues[29];
  const k = el(r, 'kicker', 'How long until a habit feels automatic?'); k.style.top = '150px';
  const src = el(r, 'ppill', 'University College London · 2009'); css(src, { left: '50%', top: '240px', fontSize: '32px' });
  const L = el(r, 'line'); place(L, 260, 640, 1400); L.style.transformOrigin = '0 50%';
  const x = d => 260 + 1400 * (d - 0) / 260;
  const marks = [[18, 'some people', c[3]], [66, 'average', c[2]], [250, 'others', c[4]]].map(([d, lab, tt]) => {
    const dt = el(r, 'dot'); place(dt, x(d) - 15, 625);
    const v = el(r, 'abs', `<div style="font-size:${d === 66 ? 120 : 70}px;font-weight:700;text-align:center;text-shadow:0 0 30px rgba(41,142,230,.6)">${d}</div><div style="font-size:28px;font-weight:600;text-align:center;opacity:.9">days · ${lab}</div>`);
    css(v, { left: (x(d) - 160) + 'px', width: '320px', top: d === 66 ? '400px' : '470px' });
    return [dt, v, tt];
  });
  return t => { pop(k, t, s.t0 + 0.05); pop(src, t, c[1], { base: 'translateX(-50%)' });
    L.style.transform = `scaleX(${P(t, c[1] + 0.3, 0.8, E.inOutCubic).toFixed(3)})`;
    marks.forEach(([dt, v, tt]) => { pop(dt, t, tt); pop(v, t, tt + 0.05); }); };
});

card('quote', 'ld', (r, s) => {
  const c = PL.cues[35];
  const q1 = el(r, 'big dark', 'People overestimate what they can do in one year'); css(q1, { top: '330px', fontSize: '62px' });
  const q2 = el(r, 'big dark', 'and underestimate what they can do in ten.'); css(q2, { top: '430px', fontSize: '62px', color: '#051427', textShadow: 'none' });
  const lo = el(r, 'lower', '<div class="n">Bill Gates</div><div class="r">often credited</div>'); place(lo, 830, 600);
  return t => { wordsIn(q1, t, c[1], 9); q1.style.opacity = 1; wordsIn(q2, t, c[2], 9); q2.style.opacity = 1; pop(lo, t, c[0] + 0.4); };
});

card('ladder', 'bp', (r, s) => {
  const c = PL.cues[35];
  const L = [['1 month', 'barely started', c[4]], ['6 months', 'real skills', c[5]], ['12 months', 'a new life', c[6]]];
  const S = L.map(([a, b, tt], i) => { const sp = el(r, 'sphere' + (i === 1 ? ' blue' : ''), `<div class="t" style="font-size:${56 + i * 8}px">${a}<br><span style="font-size:30px;font-weight:600">${b}</span></div>`);
    const d = 300 + i * 70; place(sp, 220 + i * 540 - (d - 300) / 2, 540 - d / 2, d, d); return [sp, tt]; });
  return t => S.forEach(([sp, tt]) => pop(sp, t, tt - 0.05));
});

card('julia_1948', 'lp', (r, s) => {
  const J = PL.julia;
  const y = el(r, 'big', '1948'); css(y, { top: '300px', fontSize: '200px' });
  const a = el(r, 'ppill', 'Age 36 · just arrived in France'); css(a, { left: '50%', top: '560px' });
  return t => { pop(a, t, s.t0 + 0.05, { base: 'translateX(-50%)' }); pop(y, t, J["It's 1948"] - 0.1); };
});

card('julia_line', 'lp', (r, s) => {
  const J = PL.julia;
  const ev = [['1949', 'Le Cordon Bleu', s.t0 + 0.05], ['1951', 'Graduates', J['She graduates']], ['1961', 'Her cookbook · age 49', J['Ten years later']], ['1963', 'On TV', J['Two years after']]];
  const L = el(r, 'line'); place(L, 240, 520, 1440); L.style.transformOrigin = '0 50%';
  const E2 = ev.map(([yr, lab, tt], i) => { const x = 240 + i * 480; const d = el(r, 'dot'); place(d, x - 15, 505);
    const v = el(r, 'abs', `<div style="font-size:64px;font-weight:700;text-align:center">${yr}</div><div style="font-size:28px;font-weight:600;text-align:center;opacity:.92">${lab}</div>`);
    css(v, { left: (x - 200) + 'px', width: '400px', top: i % 2 ? '560px' : '370px' }); return [d, v, tt]; });
  const name = el(r, 'lower', '<div class="n">Julia Child</div><div class="r">Chef, author, TV host</div>'); place(name, 820, 820);
  return t => { L.style.transform = `scaleX(${P(t, s.t0, 1.2, E.inOutCubic).toFixed(3)})`; E2.forEach(([d, v, tt]) => { pop(d, t, tt); pop(v, t, tt + 0.05); }); pop(name, t, J['You know her']); };
});

card('recap', 'lp', (r, s) => {
  const R = PL.recap;
  const k = el(r, 'kicker', 'Seven steps'); k.style.top = '90px';
  const steps = ['Decide, and cut the cord', 'A six-month plan with a date', 'Build the skill, practice daily', 'Find one person, borrow their map', 'Your floor is safe', 'Move, then outlast the awkward', 'Give it a full year'];
  const rows = steps.map((txt, i) => { const g = el(r, 'glass', `<div style="position:absolute;left:30px;top:50%;transform:translateY(-50%);font-size:40px;font-weight:700;color:#298EE6">${i + 1}</div><div style="position:absolute;left:90px;top:50%;transform:translateY(-50%);font-size:34px;font-weight:600;color:#FFFFFF">${txt}</div>`);
    place(g, i < 4 ? 140 : 990, 200 + (i % 4) * 190, 790, 150); return g; });
  return t => { pop(k, t, s.t0 + 0.05); rows.forEach((g, i) => pop(g, t, R[i] - 0.05, { rise: 30 })); };
});

// ---------------------------------------------------------------- overlays
const L = {};
function build() {
  const st = document.getElementById('stage');
  L.cards = PL.shots.filter(s => s.kind === 'G').map(s => {
    const root = el(st, 'abs'); css(root, { inset: '0' });
    el(root, 'bg-' + CARDS[s.ref].bg); el(root, 'noise');
    return { s, root, update: CARDS[s.ref].build(root, s) };
  });
  L.pill = el(st, 'secpill', '');
  L.caps = PL.caps.map(c => { const e = el(st, 'cap', escapeHtml(c.text)); e.style.top = c.over === 'B' ? '850px' : '880px'; return { c, e }; });
  L.sides = PL.sides.map(sd => { const e = el(st, 'side'); place(e, 1230, 300);
    sd.lines.forEach((ln, i) => el(e, 'ln' + (i < sd.lines.length - 1 ? ' dim' : ''), escapeHtml(ln))); return { sd, e }; });
  el(st, 'subbtn', '<svg viewBox="0 0 22 16"><rect x="0" y="0" width="22" height="16" rx="4" fill="#fff"/><path d="M9 4.5 L15 8 L9 11.5 Z" fill="#E21B1B"/></svg><span>Subscribe</span>');
  el(st, 'signame', 'Abaka<br>Sika');
}

function frame(t) {
  const sh = shotAt(t);
  L.cards.forEach(c => { if (show(c.root, c.s === sh)) c.update(t); });
  const pl = PL.pills.find(p => t >= p.t0 && t < p.t1);
  L.pill.textContent = pl ? pl.text : '';
  L.caps.forEach(({ c, e }) => { if (show(e, t >= c.t0 && t < c.t1 && sh.kind !== 'G')) { wordsIn(e, t, c.t0, 10); e.style.opacity = 1 - P(t, c.t1 - 0.2, 0.2); } });
  L.sides.forEach(({ sd, e }) => { if (show(e, t >= sd.t0 && t < sd.t1 && sh.kind === 'P')) pop(e, t, sd.t0, { out: sd.t1 - 0.3, rise: 16 }); });
  return { alpha: sh.kind !== 'G' };
}

window.R2 = { ready: () => document.fonts.ready, frame };
build();
