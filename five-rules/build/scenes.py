"""Author every graphic for 'Five Rules of Money' against build/edl.json word timings.
Writes build/scenes.json (cards = full-screen black graphics over VO; overlays + captions on presenter;
chapter pills). All money figures are computed here, not typed in."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Graphics are authored against the v1 piece structure (build/edl_v1.json) and anchored to WORDS;
# every word is re-timed onto the current edit (build/edl.json), so re-ordering the edit moves each graphic with its words.
NEW = json.load(open(f'{ROOT}/build/edl.json'))['pieces']
def remap(src, st, edge=False):
    cand = [q for q in NEW if q['src'] == src]
    q = min(cand, key=lambda q: 0 if q['in'] - 0.02 <= st <= q['out'] + 0.02 else min(abs(st - q['in']), abs(st - q['out'])))
    if not (q['in'] - 0.3 <= st <= q['out'] + 0.3): raise SystemExit(f'source time {src}:{st} not in the edit')
    return round(q['start'] + min(max(st, q['in']), q['out']) - q['in'], 3)
PC = []
for p in json.load(open(f'{ROOT}/build/edl_v1.json'))['pieces']:
    sh = p['in'] - p['start']   # old timeline -> source
    ws = [[remap(p['src'], w[0] + sh), remap(p['src'], w[1] + sh), w[2]] for w in p['words']]
    PC.append(dict(p, words=ws, start=remap(p['src'], p['in']), end=remap(p['src'], p['out'] - 0.001)))
R, Wt, Y, G = '#E10600', '#FFFFFF', '#FFD400', '#00A651'

# ---------- timing helpers -------------------------------------------------
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
def _find(i, phrase):
    ws = PC[i]['words']; cat = ''; starts = []
    for k, w in enumerate(ws):
        starts.append(len(cat)); cat += norm(w[2])
    j = cat.find(norm(phrase))
    if cat.count(norm(phrase)) > 1: print(f'  note: {phrase!r} occurs {cat.count(norm(phrase))}x in piece {i}; using first')
    if j < 0: raise SystemExit(f'phrase not found in piece {i}: {phrase!r}')
    k0 = max(k for k, s in enumerate(starts) if s <= j)
    end = j + len(norm(phrase)); k1 = max(k for k, s in enumerate(starts) if s < end)
    return ws[k0][0], ws[k1][1]
def T(i, ph): return round(_find(i, ph)[0], 3)
def TE(i, ph): return round(_find(i, ph)[1], 3)
def P0(i): return PC[i]['start']
def P1(i): return PC[i]['end']

FIX = {'Reed': 'Read', "Reed's": "Read's", 'Adeny': 'Adeney'}
CAPN = [0]
def cap(i, a, b, keys=(), gkeys=(), upper=False, pos=None):
    """Caption on presenter piece i from phrase a to phrase b (inclusive); keys = words shown yellow."""
    t0, t1 = T(i, a), TE(i, b); out = []
    for w in PC[i]['words']:
        if w[0] < t0 - 1e-3 or w[1] > t1 + 1e-3: continue
        s = FIX.get(w[2], w[2])
        if out and (s[0] in '.,%' or s in ('%',)): out[-1]['w'] += s; continue
        out.append({'w': s, 't': w[0], 'key': False})
    for o in out:
        if norm(o['w']) in {norm(k) for k in keys}: o['key'] = True
        if norm(o['w']) in {norm(k) for k in gkeys}: o['gkey'] = True
    CAPN[0] += 1
    return {'t0': t0, 't1': t1, 'words': out, 'upper': upper, 'pos': pos or ('bl' if CAPN[0] % 2 else 'bc')}

# ---------- maths ------------------------------------------------------------
def fv_monthly(pmt, rate, years):     # end-of-month deposits, monthly compounding
    r = rate / 12; n = years * 12; return pmt * ((1 + r) ** n - 1) / r
def path_monthly(pmt, rate, years): return [fv_monthly(pmt, rate, y) if y else 0 for y in range(years + 1)]
FV7 = fv_monthly(500, .07, 40); FV6 = fv_monthly(500, .06, 40); PUT = 500 * 12 * 40
LUMP = [10000 * 1.07 ** y for y in range(41)]
def saver(start_age, years_paying, rate=.07, pmt=5000, a0=25, a1=65):   # beginning-of-year deposits
    v = 0; ys = [0]
    for age in range(a0, a1):
        if start_age <= age < start_age + years_paying: v += pmt
        v *= 1 + rate; ys.append(v)
    return ys
SA, SB = saver(25, 10), saver(35, 30)
FACTS = {'fv7': FV7, 'fv6': FV6, 'fee_gap': FV7 - FV6, 'put_in': PUT, 'lump40': LUMP[-1], 'saverA': SA[-1], 'saverB': SB[-1],
         'r72_7': 72 / 7, 'r72_10': 72 / 10, 'r72_05': 72 / .5, 'r72_22': 72 / 22}

# ---------- element shorthands ---------------------------------------------
def tx(s, at, x=960, y=540, size=72, align='center', **k): return dict(type='text', str=s, at=at, x=x, y=y, size=size, align=align, **k)
def num(to, at, x=960, y=540, size=140, fmt='money', **k): return dict(type='num', to=to, at=at, x=x, y=y, size=size, fmt=fmt, **k)
def pill(s, at, x, y, fill=R, **k):   # template glass capsule; brand colour as glass tint (None = clear glass)
    k.pop('stroke', None); return dict(type='pill', str=s, at=at, x=x, y=y, tint=fill if fill in (R, G) else None, **k)
def card(i, els, t0=None, t1=None, **k): return dict(t0=round(P0(i) if t0 is None else t0, 3), t1=round(P1(i) if t1 is None else t1, 3), els=els, **k)

cards, overlays, captions = [], [], []
PEOPLE = f'{ROOT}/assets/people'
def photo(name, at, x, y, w, h, **k):
    src = f'{PEOPLE}/{name}'
    return dict(type='photo', src='file://' + src, at=at, x=x, y=y, w=w, h=h, **k) if os.path.exists(src) else None
def clean(els): return [e for e in els if e]

# ===== HOOK (pieces 0-2) =====================================================
captions += [cap(0, '500 bucks', "that's it", gkeys=['500'], upper=True, pos='bc'),
             dict(cap(0, 'Put that away', 'million dollars', keys=['40'], gkeys=['1.3', 'million'], upper=True, pos='bc'), impact=True)]
captions += [cap(0, 'Let that sit', 'school', keys=['school'])]
cards += [card(1, [
    tx('Where the $1.3 million comes from', T(1, 'crazy part'), y=230, size=58, weight=600, font='"Inter", sans-serif'),
    dict(type='bars', x=260, y=420, w=1400, h=90, gap=230, max=FV7, rows=[
        dict(label='What you put in', segs=[dict(v=PUT, color=Wt)], valueStr='$' + f'{PUT:,.0f}', at=T(1, 'only put in')),
        dict(label='What your money earned', segs=[dict(v=FV7 - PUT, color=G)], valueStr='$' + f'{FV7 - PUT:,.0f}', vcolor=G, at=T(1, 'other million'))]),
    tx("You didn't work for it. Your money did — *while you slept.*", T(1, "didn't work"), y=900, size=50, weight=600, font='"Inter", sans-serif', words=True, until=T(1, "That's compound")),
    ], t1=T(1, "That's compound"), cutOut=True),
    card(1, [dict(type='wave', at=T(1, "That's compound"), y0=1000, y1=520, dur=P1(1) - T(1, "That's compound")),
             tx('Compound interest', T(1, "That's compound"), y=330, size=96),
             tx('works like a *tide.*', T(1, 'like a tide'), y=440, size=96),
             tx("You don't see it moving.", T(1, "don't see it"), y=560, size=46, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.85)')],
         t0=T(1, "That's compound"), cutIn=True)]
captions += [cap(2, 'But a tide', 'pick sides', keys=['sides']),
             cap(2, 'most people', 'the flood', keys=['flood'])]
overlays += [dict(t0=T(2, 'The credit card'), t1=TE(2, 'told them about'), els=[
    pill('Credit card', T(2, 'The credit card'), 1560, 380, w=440),
    pill('Car loan', T(2, 'The car loan'), 1560, 500, w=440),
    pill('Hidden fees', T(2, 'Fees nobody'), 1560, 620, w=440)])]
cards += [card(2, [dict(type='map', at=T(2, 'walk you through'), active=0)], t0=T(2, 'walk you through'), t1=TE(2, 'any decade') + 0.3, nopill=True)]
overlays += [dict(t0=T(2, 'this is education'), t1=TE(2, 'talk to a pro'), nopanel=True, els=[
    dict(type='lower', at=T(2, 'this is education'), x=870, y=740, w=1000, h=170),
    tx('Education, not financial advice', T(2, 'this is education'), x=920, y=812, size=50, align='left', words=True),
    tx('Talk to a licensed pro before you move real money.', T(2, 'Before you move'), x=920, y=870, size=32, align='left', weight=600, words=True, color='rgba(255,255,255,0.85)')])]
cards += [card(2, [dict(type='map', at=T(2, 'first one'), active=1)], t0=T(2, 'first one'), t1=T(2, 'What actually') + 0.2, nopill=True)]
overlays += [dict(t0=T(2, 'usual answer'), t1=P1(2), els=[
    tx('How much you put in?', T(2, 'usual answer'), x=1500, y=470, size=56, strike=T(2, 'not really'))])]

# ===== RULE 1 — TIME IS THE MULTIPLIER (pieces 3-9) =========================
cards += [card(3, [
    tx('$10,000 at 7%. Untouched for 40 years.', P0(3) + .3, y=170, size=52, weight=600, font='"Inter", sans-serif'),
    dict(type='chart', at=T(3, "don't touch"), dur=TE(3, '150,000') - T(3, "don't touch") + .2, x=300, y=260, w=1250, h=560, years=40, max=160000,
         grid=[50000, 100000, 150000], xticks=[0, 10, 20, 30, 40], series=[dict(ys=LUMP, color=G, ldy=-24, lalign='right')]),
    tx('You added: *$0*', T(3, 'add a penny'), x=320, y=960, size=52, align='left', until=T(3, 'All you added')),
    tx('You added: *time.*', T(3, 'All you added'), x=320, y=960, size=52, align='left')])]
overlays += [dict(t0=T(4, 'A dollar'), t1=TE(4, 'got a job'), els=[
    tx('$1.00', T(4, 'A dollar'), x=1530, y=360, size=84),
    tx(f'10 yrs → ${1.07 ** 10:.2f}', T(4, 'Give it 10'), x=1530, y=500, size=64),
    tx(f'40 yrs → [${1.07 ** 40:.2f}]', T(4, 'Give it 40'), x=1530, y=640, size=64),
    tx('at 7% a year', T(4, 'A dollar'), x=1530, y=740, size=34, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.75)')])]
cards += [card(4, [tx('RULE 1', T(4, "That's rule one"), y=430, size=48, color=R), tx('Time is the *multiplier.*', T(4, 'Time is'), y=570, size=120)],
               t0=T(4, "That's rule one"), t1=TE(4, 'multiplier') + 0.6, nopill=True)]
cards += [card(5, [tx('Age 25', P0(5) + .1, y=330, size=46, color=R),
                   tx('“I’ll start when I’m making', T(5, 'start when'), y=520, size=86, words=True),
                   tx('*real money.*”', T(5, 'real money'), y=640, size=86)])]
captions += [cap(6, 'the one thing', 'the years', keys=['years'])]
cards += [card(7, [
    tx('Open it the day they’re born', P0(7) + .1, y=220, size=64),
    dict(type='rect', at=T(7, 'little deposits'), x=260, y=470, w=1400, h=36, color='rgba(255,255,255,0.12)', r=18),
    dict(type='rect', at=T(7, 'little deposits'), dur=1.8, grow='x', x=260, y=470, w=1400, h=36, color=G, r=18),
    tx('Birth', T(7, 'little deposits'), x=260, y=450, size=34, align='left', weight=600, font='"Inter", sans-serif'),
    tx('First job · age 18', T(7, 'head start'), x=1660, y=450, size=34, align='right', weight=600, font='"Inter", sans-serif'),
    tx('[18-year] head start', T(7, 'head start'), y=600, size=72),
    dict(type='tree', at=T(7, 'planting a tree'), x=960, y=1020, len=120, dur=2.6),
    tx('A tree you never have to *water.*', T(7, 'planting a tree'), y=700, size=52, weight=600, font='"Inter", sans-serif')])]
captions += [cap(8, "you're 45", 'way behind', keys=['45']), cap(8, "It just means", 'Monday', keys=['Monday'])]
fr = 9
cards += [card(fr, clean([
    photo('f_BenFranklinDuplessis.jpg', P0(fr), 1120, 0, 800, 1080, fade='left', fy=0.2, credit='Portrait after J.-S. Duplessis · public domain', until=T(fr, 'lent it out')),
    tx('Benjamin Franklin', T(fr, 'Benjamin Franklin'), x=180, y=300, size=96, align='left', until=T(fr, 'lent it out')),
    dict(type='line', at=T(fr, 'lent it out'), dur=1.2, x1=260, y1=520, x2=1660, y2=520, color='rgba(255,255,255,0.35)', lw=4),
    dict(type='dot', at=T(fr, 'lent it out'), x=260, y=520, r=16, color=Wt),
    tx('Died 1790', T(fr, 'When he died'), x=180, y=420, size=56, align='left', until=T(fr, 'lent it out')),
    tx('1790', T(fr, 'lent it out'), x=260, y=470, size=56),
    tx('£1,000 → Boston', T(fr, 'thousand pounds'), x=180, y=510, until=T(fr, 'lent it out'), size=40, align='left', weight=600, font='"Inter", sans-serif'),
    tx('£1,000 → Philadelphia', T(fr, 'thousand to Philadelphia'), x=180, y=570, until=T(fr, 'lent it out'), size=40, align='left', weight=600, font='"Inter", sans-serif'),
    tx('≈ $4,000 each', T(fr, 'Roughly'), x=180, y=640, until=T(fr, 'lent it out'), size=40, align='left', color=G),
    pill('Locked for 200 years', T(fr, 'catch'), 460, 780, w=560, until=T(fr, 'lent it out')),
    tx('200 years', T(fr, 'lent it out'), y=420, size=60, color=R),
    tx('Lent out. Interest piled up, generation after generation.', T(fr, 'lent it out'), y=880, size=40, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.85)', until=T(fr, 'by 1990')),
    dict(type='dot', at=T(fr, 'by 1990'), x=1660, y=520, r=16, color=G),
    tx('1990', T(fr, 'by 1990'), x=1660, y=470, size=56),
    num(6.5e6, T(fr, 'worth about'), x=1660, y=640, size=110, impact=True, fmt='M', dec=1, color=G, align='right', dur=1.0),
    tx('both funds together', T(fr, 'together'), x=1660, y=695, size=34, align='right', weight=500, font='"Inter", sans-serif'),
    tx('…even after Boston spent a big piece on a trade school', T(fr, 'even after'), y=880, size=38, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.8)')]))]

# ===== RULE 2 — KNOW WHEN YOU DOUBLE (pieces 10-13) =========================
captions += [cap(10, 'The money was small', 'rush it', keys=['rush'])]
cards += [card(10, [dict(type='map', at=T(10, 'second thing'), active=2)], t0=T(10, 'second thing'), t1=TE(10, '5 seconds') + .2, nopill=True)]
overlays += [dict(t0=T(10, 'percentages'), t1=TE(10, 'together, right'), els=[
    tx('7%', T(10, '7%'), x=1420, y=430, size=110, alpha=.55), tx('10%', T(10, '7%') + .35, x=1650, y=600, size=110, alpha=.4),
    tx('4%', T(10, 'blurs'), x=1450, y=740, size=90, alpha=.3)])]
cards += [card(10, [tx('RULE 2', T(10, 'So know when'), y=430, size=48, color=R), tx('Know when you *double.*', T(10, 'So know when'), y=570, size=120)],
               t0=T(10, 'So know when'), t1=P1(10), nopill=True)]
r72 = 11
cards += [card(r72, [
    tx('The Rule of 72', P0(r72) + .1, y=190, size=84),
    tx('72 ÷ interest rate ≈ *years to double*', T(r72, 'You take 72'), y=320, size=58, weight=600, font='"Inter", sans-serif'),
    dict(type='bars', x=260, y=470, w=1400, h=54, gap=150, max=144, rows=[
        dict(label='At 7%', segs=[dict(v=72 / 7, color=G)], valueStr=f'≈ {72 / 7:.0f} years', at=T(r72, 'At 7%')),
        dict(label='S&P 500, ~10% average since 1957', segs=[dict(v=7.2, color=G)], valueStr='≈ 7 years', at=T(r72, 'S&P 500')),
        dict(label='Savings account at 0.5%', segs=[dict(v=144, color=R)], valueStr='144 years', vcolor=R, at=T(r72, 'Your savings account'), dur=2.2)]),
    tx('No single year is promised — that’s a long-run average.', T(r72, 'No single year'), y=960, size=34, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.75)', until=T(r72, 'Your savings'))])]
captions += [dict(cap(12, 'Half a percent', 'parking', keys=['parking']), impact=True)]
cards += [card(13, [
    tx('Your 401(k)', P0(13) + .1, y=260, size=84),
    tx('Find your actual return  →  72 ÷ return', T(13, 'find your actual'), y=400, size=52, weight=600, font='"Inter", sans-serif'),
    tx('Retirement isn’t foggy.', T(13, 'All of a sudden'), y=600, size=72, color='rgba(255,255,255,0.85)'),
    tx('It’s a *countdown.*', T(13, 'countdown'), y=720, size=110)])]

# ===== RULE 3 — INTEREST ISN'T LOYAL (pieces 14-17) =========================
overlays += [dict(t0=T(14, 'Want a 100'), t1=TE(14, 'planning'), els=[
    tx('Goal: $100k by 50', T(14, 'Want a 100'), x=1520, y=420, size=58),
    tx('How many doubles?', T(14, 'How many doubles'), x=1520, y=540, size=58, color=Y),
    tx('Not hoping. *Planning.*', T(14, "you're not hoping"), x=1520, y=660, size=58)])]
cards += [card(14, [dict(type='map', at=T(14, 'This next one'), active=3)], t0=T(14, 'This next one'), t1=TE(14, 'upside down') + .2, nopill=True)]
captions += [cap(14, 'Same engine', 'reverse', keys=['reverse'])]
overlays += [dict(t0=T(14, 'Paying cash'), t1=P1(14), els=[
    pill('Paying cash · cheap', T(14, 'Paying cash'), 1500, 360, fill='rgba(255,255,255,0.12)', w=620),
    pill('Card paid off monthly · fine', T(14, 'Using a card'), 1500, 480, fill='rgba(255,255,255,0.12)', w=620),
    pill('Carrying a balance · costly', T(14, 'carrying that balance'), 1500, 600, w=620)])]
cards += [card(15, [
    num(22, P0(15) + .2, y=470, size=300, fmt='', suffix='%', color=R, dur=0.9),
    tx('average rate for people carrying a card balance', T(15, 'people who carry'), y=580, size=40, weight=500, font='"Inter", sans-serif'),
    tx('Source: Federal Reserve, Aug 2026 (as cited)', T(15, 'August'), y=640, size=26, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.6)'),
    tx(f'72 ÷ 22 ≈ {72 / 22:.1f} years', T(15, 'Run the rule'), y=800, size=80),
    tx('for an unpaid balance to *double.*', T(15, 'doubles'), y=890, size=52, weight=600, font='"Inter", sans-serif')])]
cards += [card(16, [tx('RULE 3', T(16, "Interest isn't loyal"), y=430, size=48, color=R), tx("Interest isn't *loyal.*", T(16, "Interest isn't loyal"), y=570, size=120)],
               t0=T(16, "Interest isn't loyal") - .15, t1=TE(16, 'holding the debt') + .25, nopill=True)]
cards += [card(17, [
    tx('The minimum payment', P0(17) + .1, y=210, size=72, until=T(17, 'little stuff')),
    dict(type='bars', x=260, y=430, w=1400, h=90, gap=200, max=100, rows=[
        dict(label='Where a minimum payment can go', segs=[dict(v=70, color=R), dict(v=30, color=Wt)], valueStr='', at=T(17, 'big chunk'))], until=T(17, 'little stuff')),
    tx('{Interest}', T(17, 'big chunk'), x=260, y=600, size=44, align='left', until=T(17, 'little stuff')),
    tx('Balance', T(17, 'big chunk') + .3, x=1660, y=600, size=44, align='right', until=T(17, 'little stuff')),
    tx('Like bailing out a boat with a *teacup.*', T(17, 'bailing out'), y=820, size=60, until=T(17, 'little stuff')),
    tx('Illustrative split', T(17, 'big chunk'), y=680, size=26, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.5)', until=T(17, 'little stuff')),
    tx('One pair of shoes on the card…', T(17, 'pair of shoes'), y=330, size=70),
    tx('$100', T(17, 'put it on the card'), x=640, y=560, size=130),
    tx('→', T(17, 'carry it'), y=560, size=110, color=R),
    tx('[$200]', T(17, 'basically bought two'), x=1280, y=560, size=130),
    tx('at 22%, carried ~3 years', T(17, 'carry it'), y=660, size=34, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.7)'),
    tx('You paid for *two.* You wore one.', T(17, 'basically bought two'), y=850, size=64)])]

# ===== RULE 4 — GUARD YOUR PERCENTAGE (pieces 18-21) ========================
overlays += [dict(t0=T(18, 'Pay off a 22'), t1=TE(18, 'your pocket anymore'), els=[
    tx('Pay off a 22% card', T(18, 'Pay off a 22'), x=1520, y=430, size=58),
    tx('= a [22%] return', T(18, 'locking in'), x=1520, y=540, size=72),
    tx('No stock does that reliably.', T(18, 'No stock'), x=1520, y=640, size=38, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.85)')])]
cards += [card(18, [dict(type='map', at=T(18, "Let's say"), active=4)], t0=T(18, "Let's say"), t1=TE(18, 'debt') + .1, nopill=True)]
cards += [card(18, [tx('*Fees.*', T(18, 'Fees.') - .05, y=600, size=220)], t0=T(18, 'Fees.') - .1, t1=TE(18, 'sound boring') + .1, nopill=True)]
overlays += [dict(t0=T(18, 'A tenth'), t1=P1(18), els=[
    tx('0.1%? Who cares.', T(18, 'A tenth'), x=1500, y=380, size=56, color='rgba(255,255,255,0.8)'),
    tx('1%? Stings a little.', T(18, 'One percent'), x=1500, y=490, size=56),
    tx('1% × 40 years = {a house}', T(18, 'But one percent'), x=1500, y=600, size=56)])]
cards += [card(19, [
    tx('Same $500 a month. Same 40 years.', T(19, 'Same 500'), y=170, size=52, weight=600, font='"Inter", sans-serif'),
    dict(type='chart', at=T(19, 'At 7%'), dur=2.2, x=300, y=260, w=1150, h=560, years=40, max=1.4e6, yfmt='M',
         grid=[500000, 1000000], xticks=[0, 10, 20, 30, 40], series=[
            dict(ys=path_monthly(500, .07, 40), color=G, fmt='money', ldy=0, lsize=46),
            ]),
    dict(type='chart', at=T(19, 'Drop that'), dur=2.2, x=300, y=260, w=1150, h=560, years=40, max=1.4e6, yfmt='M', grid=[], xticks=[], series=[
            dict(ys=path_monthly(500, .06, 40), color=R, fmt='money', ldy=44, lsize=46)]),
    tx('7% return', T(19, 'At 7%'), x=330, y=330, size=40, align='left', color=G),
    tx('6% (7% minus a 1% fee)', T(19, 'Drop that'), x=330, y=385, size=40, align='left', color=R),
    tx('The 1% fee cost', T(19, 'tiny percent'), x=1640, y=880, size=40, align='right', weight=600, font='"Inter", sans-serif'),
    num(FV7 - FV6, T(19, 'tiny percent'), x=1640, y=980, size=96, fmt='money', color=R, align='right', dur=1.0)])]
cards += [card(20, [tx('RULE 4', T(20, 'Guard'), y=430, size=48, color=R), tx('Guard your *percentage.*', T(20, 'Guard'), y=570, size=120)],
               t0=T(20, 'Guard') - .1, t1=TE(20, 'easy to ignore') + .1, nopill=True)]
captions += [cap(20, "It's not small", "It's not small", keys=['small'])]
cards += [card(21, [
    tx('Check your fees', P0(21) + .1, y=200, size=78),
    pill('Your fund’s expense ratio', T(21, 'expense ratio'), 960, 380, w=900, fill='rgba(255,255,255,0.10)', stroke=R),
    tx('Takes *five minutes.*', T(21, 'Takes five'), y=490, size=52, weight=600, font='"Inter", sans-serif'),
    tx('“Free” apps: look for', T(21, 'free apps'), y=650, size=52, weight=600, font='"Inter", sans-serif'),
    pill('Spreads', T(21, 'spreads'), 560, 770, w=420), pill('Subscription fees', T(21, 'subscription'), 960, 770, w=420),
    pill('Uninvested cash', T(21, 'cash just sitting'), 1360, 770, w=420)])]

# ===== RULE 5 — PATIENCE PAYS (pieces 22-32) ================================
overlays += [dict(t0=T(22, 'Just know what'), t1=TE(22, 'sounds tiny'), els=[
    tx('Know what you pay —', T(22, 'Just know what'), x=1500, y=480, size=56), tx('in *dollars.*', T(22, 'In dollars'), x=1500, y=580, size=72)])]
cards += [card(22, [dict(type='map', at=T(22, 'Last one'), active=5)], t0=T(22, 'Last one'), t1=TE(22, 'together') + .2, nopill=True)]
overlays += [dict(t0=T(22, 'two people'), t1=P1(22), els=[
    pill('Saver A', T(22, 'two people'), 1380, 440, fill=G, w=300), pill('Saver B', T(22, 'two people') + .3, 1720, 440, fill='rgba(255,255,255,0.18)', w=300),
    tx('Same 7%. Who ends up with more?', T(22, 'Same 7'), x=1550, y=580, size=44)])]
ages = [[0, '25'], [10, '35'], [20, '45'], [30, '55'], [40, '65']]
cards += [card(23, [
    tx('Saver A', T(23, 'Saver A starts'), x=300, y=180, size=56, align='left', color=G),
    tx('Age 25–35 · $5,000/yr, then stops', T(23, 'Saver A starts'), x=300, y=232, size=32, align='left', weight=500, font='"Inter", sans-serif'),
    tx('Put in: $50,000', T(23, 'Total put in $50'), x=300, y=278, size=32, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Saver B', T(23, 'Saver B waits'), x=1620, y=180, size=56, align='right'),
    tx('Age 35–65 · $5,000/yr', T(23, 'Saver B waits'), x=1620, y=232, size=32, align='right', weight=500, font='"Inter", sans-serif'),
    tx('Put in: $150,000', T(23, 'Total put in $150'), x=1620, y=278, size=32, align='right', weight=600, font='"Inter", sans-serif'),
    dict(type='chart', at=T(23, 'Saver A starts'), dur=T(23, 'Saver B waits') - T(23, 'Saver A starts'), x=300, y=300, w=1250, h=520, years=40, max=600000,
         grid=[250000, 500000], xticks=ages, series=[dict(ys=SA, color=G, fmt='k', label=False)]),
    dict(type='chart', at=T(23, 'Saver B waits'), dur=T(23, 'Saver A. About') - T(23, 'Saver B waits'), x=300, y=300, w=1250, h=520, years=40, max=600000,
         grid=[], xticks=[], series=[dict(ys=SB, color=Wt, fmt='k', label=False)]),
    num(SA[-1], T(23, 'Saver A. About'), x=1600, y=380, size=64, fmt='k', color=G, align='left', dur=.8),
    num(SB[-1], T(23, 'versus'), x=1600, y=520, size=64, fmt='k', align='left', dur=.8),
    tx('A put in *a third* of the money — and still came out ahead.', T(23, 'third of the money'), y=950, size=46, weight=600, font='"Inter", sans-serif')])]
captions += [cap(24, 'Those first 10', '30 more years', keys=['30'])]
cards += [card(25, clean([
    photo('buffett.jpg', P0(25), 1120, 0, 800, 1080, fade='left', fy=0.25, credit='Photo: U.S. International Trade Administration · public domain'),
    tx('Warren Buffett', P0(25) + .1, x=150, y=250, size=96, align='left'),
    tx('Started buying stock as a kid', T(25, 'started buying'), x=150, y=340, size=40, align='left', weight=600, color='rgba(255,255,255,0.8)'),
    dict(type='bars', x=150, y=520, w=860, h=100, gap=200, max=100, rows=[
        dict(label='Share of his wealth (rough estimates)', segs=[dict(v=5, color='rgba(255,255,255,0.5)'), dict(v=95, color=G)], valueStr='', at=T(25, 'by most estimates'), dur=1.6)]),
    tx('[~95%]', T(25, 'after he turned'), x=150, y=760, size=110, align='left', impact=True),
    tx('came after he turned 65', T(25, 'after he turned') + .3, x=150, y=830, size=44, align='left'),
    tx('Retire at 65 → you’d never know his *name.*', T(25, "If he'd retired"), x=150, y=960, size=44, align='left')]))]
captions += [cap(26, 'a guy who was not famous', 'At all', keys=['famous'])]
rd = 27
_rp = 'read.jpg' if os.path.exists(f'{PEOPLE}/read.jpg') else 'brattleboro.jpg'
cards += [dict(card(rd, clean([
    photo('read_old.jpg', T(rd, 'His name'), 1160, 0, 760, 1080, fade='left', fy=0.3),   # Ronald Read in later life (photo supplied by the channel)
    tx('Ronald Read', T(rd, 'His name'), x=150, y=400, size=96, align='left'),
    tx('Brattleboro, Vermont', T(rd, 'Brattleboro'), x=150, y=475, size=44, align='left', weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.75)'),
    tx('Hitchhiked ~4 miles to high school', T(rd, 'hitchhiked'), x=260, y=420, size=46, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Pumped gas · ~25 years', T(rd, 'pumped gas'), x=260, y=510, size=46, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Janitor at JCPenney · ~17 years', T(rd, 'janitor'), x=260, y=600, size=46, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Coat held together with *safety pins*', T(rd, 'safety pins'), x=260, y=690, size=46, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Cut his own firewood', T(rd, 'firewood'), x=260, y=780, size=46, align='left', weight=600, font='"Inter", sans-serif'),
    tx('The only hint: he read the Wall Street Journal', T(rd, 'only hint'), x=260, y=900, size=40, align='left', weight=500, font='"Inter", sans-serif', color=Y)])), clear=True)]
cards += [dict(t0=T(rd, 'As a teenager'), t1=T(rd, 'pumped gas'), clear=True, els=clean([   # young Ronald Read at the teenage line
    photo('read_young.jpg', T(rd, 'As a teenager'), 1160, 0, 760, 1080, fade='left', fy=0.3, gray=True),
    tx('Ronald Read, as a teenager', T(rd, 'As a teenager'), x=150, y=360, size=64, align='left'),
    tx('Hitchhiked ~4 miles', T(rd, 'hitchhiked'), x=150, y=500, size=56, align='left'),
    tx('just to get to *high school.*', T(rd, 'just to get'), x=150, y=580, size=56, align='left', impact=True)]))]
cards += [dict(t0=T(rd, 'safety pins'), t1=T(rd, 'firewood'), clear=True, els=clean([
    photo('read_old.jpg', T(rd, 'safety pins'), 1160, 0, 760, 1080, fade='left', fy=0.3),
    tx('Ronald Read', T(rd, 'safety pins'), x=150, y=360, size=84, align='left'),
    tx('His coat was held together', T(rd, 'safety pins') + .2, x=150, y=500, size=56, align='left'),
    tx('with *safety pins.*', T(rd, 'safety pins') + .5, x=150, y=580, size=56, align='left', impact=True)]))]
cards += [dict(t0=T(29, 'Companies he actually'), t1=T(29, 'local hospital'), clear=True, els=clean([
    photo('read_pair.jpg', T(29, 'Companies he actually'), 880, 250, 980, 510, r=24, fy=0.3, dur=6),
    tx('Same man. Same habit.', T(29, 'Companies he actually'), x=150, y=470, size=56, align='left'),
    tx('Held for *decades.*', T(29, 'for decades'), x=150, y=560, size=64, align='left', impact=True)]))]
captions += [cap(28, 'nobody had a clue', 'nobody had a clue', keys=['clue'])]
cards += [card(29, [
    tx('2014 · died at 92', P0(29) + .1, y=220, size=64),
    num(8e6, T(29, 'built almost'), y=490, size=230, fmt='M', dec=0, color=G, dur=1.4),
    tx('almost — mostly boring dividend stocks, held for decades', T(29, 'boring dividend'), y=560, size=38, weight=500, font='"Inter", sans-serif'),
    pill('$4.8M → local hospital', T(29, 'local hospital'), 640, 760, w=600, fill=G),
    pill('$1.2M → library', T(29, 'library'), 1280, 760, w=600, fill=G),
    tx('The biggest gifts either had ever received', T(29, 'biggest gifts'), y=900, size=40, weight=500, font='"Inter", sans-serif')])]
overlays += [dict(t0=T(30, 'A janitor'), t1=TE(30, 'left it alone'), els=[
    tx('No big salary', T(30, 'No big salary'), x=1520, y=380, size=50, strike=T(30, 'No big salary') + .4),
    tx('No inheritance', T(30, 'No inheritance'), x=1520, y=480, size=50, strike=T(30, 'No inheritance') + .4),
    tx('Small amounts', T(30, 'Small amounts'), x=1520, y=600, size=50, color=G),
    tx('Good companies', T(30, 'Good companies'), x=1520, y=690, size=50, color=G),
    tx('*Left it alone*', T(30, 'left it alone'), x=1520, y=780, size=50)])]
pt = 31
cards += [card(pt, clean([
    photo('pete.jpg', T(pt, 'Real name'), 1260, 0, 660, 1080, fade='left'),
    tx('Pete Adeney', T(pt, 'Real name'), x=260, y=210, size=96, align='left'),
    tx('“Mr. Money Mustache”', P0(pt) + .4, x=260, y=280, size=40, align='left', weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.75)'),
    tx('Two software engineers — good money, not crazy money', T(pt, 'software engineers'), x=260, y=420, size=44, align='left', weight=600, font='"Inter", sans-serif'),
    tx('Every raise → kept living small, invested the rest', T(pt, 'every time'), x=260, y=510, size=44, align='left', weight=600, font='"Inter", sans-serif'),
    dict(type='line', at=T(pt, 'About 10 years'), dur=1, x1=260, y1=700, x2=1660, y2=700, color='rgba(255,255,255,0.35)', lw=4),
    dict(type='dot', at=T(pt, 'About 10 years'), x=1660, y=700, r=16, color=G),
    tx('~10 years in · 2005', T(pt, 'About 10 years'), x=1660, y=660, size=44, align='right'),
    tx('Never needed a paycheck again', T(pt, 'never needed'), x=1660, y=780, size=40, align='right', weight=600, font='"Inter", sans-serif', color=G),
    tx('Pete was *30.*', T(pt, 'Pete was 30'), x=260, y=900, size=90, align='left', impact=True)]))]
captions += [cap(32, 'So he put in more', 'only difference', keys=['Earlier'])]

# ===== RECAP + CLOSE (33-34) ===============================================
rc = 33
cues = ['Time is the multiplier', 'Know when you double', 'Interest isn', 'Guard your percentage', 'patience pays']
subs = ['Start before you feel ready.', '72 ÷ your rate.', 'Kill high-interest debt first.', 'Fees compound too.', 'Whoever stays longest wins.']
els = [tx('Quick recap', P0(rc) + .05, x=260, y=170, size=64, align='left')]
from_scenes = __import__('builtins')
RULE_NAMES = ['Time is the multiplier', 'Know when you double', "Interest isn't loyal", 'Guard your percentage', 'Patience pays']
for k, (cue, name, sub) in enumerate(zip(cues, RULE_NAMES, subs)):
    y = 300 + k * 150; at = T(rc, cue)
    els += [pill(str(k + 1), at, 290, y - 18, w=84, size=40), tx(name, at, x=370, y=y, size=58, align='left'),
            tx(sub, at + .4, x=1660, y=y, size=36, align='right', weight=500, font='"Inter", sans-serif', color=G if k == 4 else 'rgba(255,255,255,0.8)')]
cards += [card(rc, els, nopill=True)]
captions += [cap(34, "don't need to be some genius", 'whole game', keys=['patient'])]
overlays += [dict(t0=T(34, 'Your income'), t1=TE(34, 'make it your own'), els=[
    pill('Your income', T(34, 'Your income'), 1560, 400, w=420), pill('Your goals', T(34, 'Your goals'), 1560, 520, w=420),
    pill('Your family', T(34, 'Your family'), 1560, 640, w=420)])]
END0 = round(P1(34) + 0.25, 3)
end = dict(t0=END0, els=[
    tx('Five Rules of Money', END0 + .2, y=250, size=96),
    *[tx(f'{k + 1}. {n}', END0 + .5 + .12 * k, x=600, y=380 + 80 * k, size=46, align='left', weight=600, font='"Inter", sans-serif') for k, n in enumerate(RULE_NAMES)],
    tx('What would you tell your *younger self* about money?', END0 + 1.2, y=880, size=48),
    tx('Tell me in the comments.', END0 + 1.5, y=950, size=36, weight=500, font='"Inter", sans-serif', color='rgba(255,255,255,0.8)')])
DUR = round(END0 + 6.0, 3)


# ===== DEFINITION MOMENTS (reference 2): avatar pushed right, heading + explanation on the left ==========
def side(t0, t1, heading, *body): return dict(t0=round(t0, 3), t1=round(t1, 3), heading=heading, body=[dict(str=b, at=round(a, 3)) for a, b in body])
sides = [
    side(P0(6), P1(6), 'Rule 1: Time is the multiplier',
         (T(6, 'But the math'), 'the math can only multiply what you hand it'), (T(6, 'the one thing'), 'and you can never buy back the *years*')),
    side(T(10, 'So know when') - .1, P1(10), 'Rule 2: Know when you double',
         (T(10, 'So know when') + .5, '72 ÷ your interest rate = years until your money *doubles*')),
    side(T(16, "Interest isn't loyal") - .15, P1(16), "Rule 3: Interest isn't loyal",
         (T(16, 'It works'), 'it works for whoever is holding the *debt*')),
    side(T(18, 'But flip it around') - .1, TE(18, 'your pocket anymore') + .2, 'Pay off the card first',
         (T(18, 'Pay off a 22'), 'paying off a 22% card is like locking in a [22%] return'), (T(18, 'No stock'), 'no stock does that *reliably*')),
    side(P0(20), P1(20), 'Rule 4: Guard your percentage',
         (T(20, 'It looks small'), "it looks small, so it's easy to ignore."), (T(20, "It's not small"), "it's not *small.*")),
    side(T(22, 'Just know what') - .1, TE(22, 'sounds tiny') + .2, 'Know what you pay',
         (T(22, 'In dollars'), 'in dollars, not some percentage that sounds *tiny*')),
    side(T(34, 'So if you take') - .1, TE(34, 'whole game') + .2, 'Rule 5: Patience pays',
         (T(34, "You don't need"), "you don't need to be a genius."), (T(34, 'You need to be patient'), 'you need to be *patient.*')),
]
def in_side(a, b): return any(a < sd['t1'] and b > sd['t0'] for sd in sides)
cards = [c for c in cards if not any(e['type'] == 'text' and str(e.get('str', '')).startswith('RULE ') and e.get('size') == 48 for e in c['els'])]
overlays = [o for o in overlays if not in_side(o['t0'], o['t1'])]
captions = [c for c in captions if not in_side(c['t0'], c['t1'])]
PX, PW = 1280, 590; PC_X = PX + PW / 2
for o in overlays:
    if o.get('nopanel'): continue
    ys = []
    for e in o['els']:
        if e['type'] in ('text', 'num'): e['x'] = PC_X; e['align'] = 'center'; e['maxw'] = PW - 70; ys += [e['y'] - e['size'] * 0.85, e['y'] + e['size'] * 0.25]
        elif e['type'] == 'pill': e['x'] = PC_X; e['w'] = min(e.get('w', 500), PW - 70); ys += [e['y'] - 40, e['y'] + 40]
        elif e['type'] == 'line': e['x1'], e['x2'] = PX + 60, PX + PW - 60; ys += [e['y1']]
    pass   # template: no panels — text floats over footage with a soft shadow
chapters = [dict(t=T(2, 'What actually') + .25, label='Time'),
            dict(t=TE(10, '5 seconds') + .2, label='Doubling'),
            dict(t=TE(14, 'upside down') + .2, label='Debt'),
            dict(t=TE(18, 'debt') + .1, label='Fees'),
            dict(t=TE(22, 'together') + .2, label='Patience'),
            dict(t=P0(rc), label='Recap')]
for o in overlays:   # an overlay never shares the screen with a caption
    nxt = [c['t0'] for c in captions if o['t0'] < c['t0'] < o['t1']]
    if nxt: o['t1'] = min(nxt) - 0.1
for c in cards:
    if c.get('nopill'): continue
    for e in c['els']:
        if e['type'] == 'text' and e['y'] < 330 and e.get('align') == 'left' and e['x'] < 460 and not any(x['type'] == 'chart' for x in c['els']):
            for x in c['els']:
                for k in ('y', 'y1', 'y2'):
                    if k in x: x[k] += 55
            break
        if e['type'] == 'text' and e['y'] < 330 and e.get('align') == 'left' and e['x'] < 460: e['y'] += 70
        if e['type'] == 'text' and e['y'] < 200 and e.get('align', 'center') == 'center': e['y'] += 30
SEG = [(q['src'], q['start'], q['start'] + q['out'] - q['in']) for q in NEW]
def seg_at(t): return min(SEG, key=lambda z: 0 if z[1] - 0.05 <= t < z[2] + 0.35 else min(abs(t - z[1]), abs(t - z[2])))
_c = []
for c in cards:   # split a card over the pieces of its own speaker only
    src = seg_at(c['t0'] + 0.05)[0]
    for z in SEG:
        if z[0] != src: continue
        a2, b2 = max(c['t0'], z[1] - (0.35 if src == 'V' else 0)), min(c['t1'], z[2] + 0.3)
        if b2 - a2 > 0.3: _c.append(dict(c, t0=round(a2, 3), t1=round(b2, 3)))
cards = [c for c in _c if c['t1'] - c['t0'] >= 1.0]
for L in (overlays, captions):
    for o in L:
        z = seg_at(o['t0'] + 0.05)
        if o['t1'] > z[2] + 0.3: o['t1'] = round(z[2] + 0.1, 3)
for sd in sides:
    z = seg_at(sd['t0'] + 0.05); sd['t1'] = min(sd['t1'], round(z[2] + 0.2, 3))
cards.sort(key=lambda c: c['t0'])
for a, b in zip(cards, cards[1:]):
    if a['t1'] > b['t0']: print(f"  clip card {a['t0']}: t1 {a['t1']} -> {b['t0']}"); a['t1'] = b['t0']
# ===== STOCK B-ROLL PASS: ~75% of voiceover time on stock footage, graphs only where a number must be seen =====
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from broll_plan import BROLL
VO = [i for i, p in enumerate(PC) if p['src'] == 'V']
KEEP = {1: [(P0(1), T(1, 'While you were'))], 3: [(P0(3), P1(3))], 9: [(P0(9), T(9, 'But there was a catch'))],
        11: [(P0(11), T(11, 'No single year'))], 15: [(P0(15), T(15, 'Run the rule'))], 19: [(P0(19), P1(19))],
        23: [(T(23, 'Saver B waits'), P1(23))], 25: [(P0(25), T(25, "If he'd retired"))], 27: [(P0(27), T(27, 'pumped gas'), 'clear'), (T(27, 'safety pins'), T(27, 'firewood'), 'clear')],
        29: [(T(29, 'built almost') - .1, T(29, 'boring dividend')), (T(29, 'Companies he actually'), T(29, 'local hospital'), 'clear')], 33: [(P0(33), P1(33))]}
DIM = {33}                                  # recap list sits over stock (dimmed), not on black
def piece_at(t):   # original piece of the speaker actually on air at time t
    on = [q for q in NEW if q['start'] - 0.36 <= t < q['start'] + q['out'] - q['in'] + 0.05]
    src = on[0]['src'] if on else None
    c = [i for i in range(len(PC)) if (src is None or PC[i]['src'] == src) and P0(i) - 0.36 <= t < P1(i) + 0.05]
    if c: return min(c, key=lambda i: P1(i) - P0(i))
    return min(range(len(PC)), key=lambda i: min(abs(t - P0(i)), abs(t - P1(i))))
newcards = []
for c in cards:
    i = piece_at(c['t0'] + 0.4)
    if PC[i]['src'] == 'P': newcards.append(c); continue
    for a, b, *fl in KEEP.get(i, []):
        a2, b2 = max(a, c['t0']), min(b, c['t1'])
        if b2 - a2 > 0.3:
            c2 = dict(c, t0=round(a2, 3), t1=round(b2, 3))
            if i in DIM: c2['dim'] = True
            if fl: c2['clear'] = True
            newcards.append(c2)
cards = sorted(newcards, key=lambda c: c['t0'])
# b-roll segments = VO time not covered by an opaque kept card
broll = []
cues = sorted([(T(i, ph), mid) for i, ph, mid in BROLL])
for i in VO:
    a, b = P0(i), P1(i)
    blocks = sorted([(x, y) for x, y, *fl in KEEP.get(i, []) if i not in DIM and not fl])
    free, cur = [], a
    for x, y in blocks:
        if x > cur + 0.05: free.append((cur, x))
        cur = max(cur, y)
    if b > cur + 0.05: free.append((cur, b))
    for fa, fb in free:
        inside = [(t, m) for t, m in cues if fa - 0.5 <= t < fb]
        prior = [(t, m) for t, m in cues if t < fa]
        if not inside or inside[0][0] > fa + 0.05:
            if prior or inside: inside = [(fa, (prior[-1] if prior else inside[0])[1])] + inside
        else: inside[0] = (fa, inside[0][1])
        for k, (t, m) in enumerate(inside):
            e = inside[k + 1][0] if k + 1 < len(inside) else fb
            if e - t > 0.2: broll.append(dict(t0=round(t, 3), t1=round(e, 3), id=m))
# tidy: merge slivers (<0.8 s) into the neighbour, merge contiguous pieces of the same clip
m = []
for x in broll:
    if m and abs(m[-1]['t1'] - x['t0']) < 0.02 and (m[-1]['id'] == x['id'] or x['t1'] - x['t0'] < 0.8): m[-1]['t1'] = x['t1']; continue
    if m and abs(m[-1]['t1'] - x['t0']) < 0.02 and m[-1]['t1'] - m[-1]['t0'] < 0.8: m[-1]['t1'] = x['t1']; m[-1]['id'] = x['id']; continue
    m.append(dict(x))
broll = m
VOI = [(q['start'], q['start'] + q['out'] - q['in']) for q in NEW if q['src'] == 'V']
sp = []
for x in broll:
    for a, b in VOI:
        a2, b2 = max(a, x['t0']), min(b + 0.3, x['t1'])
        if b2 - a2 > 0.3: sp.append(dict(x, t0=round(a2, 3), t1=round(b2, 3)))
broll = sp
# captions over b-roll: every spoken word, sentence chunks, centred low; $ amounts green, % yellow
for sg in broll:
    i = piece_at(sg['t0'] + 0.2)
    ws = [w for w in PC[i]['words'] if sg['t0'] - 0.05 <= w[0] < sg['t1'] - 0.05]
    if not ws: continue
    out = []
    for w in ws:
        x = FIX.get(w[2], w[2])
        if out and (x[0] in '.,%' ): out[-1]['w'] += x; continue
        out.append({'w': x, 't': w[0], 'key': False})
    for o in out:
        if '$' in o['w'] or re.search(r'\d', o['w']) and any(k in o['w'].lower() for k in ('million', '000')): o['gkey'] = True
        elif '%' in o['w']: o['key'] = True
    captions.append({'t0': ws[0][0], 't1': min(ws[-1][1], sg['t1'] - 0.05), 'words': out, 'upper': True, 'pos': 'c', 'broll': True, 'size': 66})
VO_T = sum(P1(i) - P0(i) for i in VO); BR_T = sum(x['t1'] - x['t0'] for x in broll)
print(f'b-roll {len(broll)} segments, {BR_T:.0f}s of {VO_T:.0f}s voiceover ({100 * BR_T / VO_T:.0f}%)')
images = sorted({e['src'] for c in cards for e in c['els'] if e['type'] == 'photo'})
json.dump(dict(broll=broll, images=images, duration=DUR, cards=cards, overlays=overlays, captions=captions, sides=sides, chapters=chapters, end=end, facts=FACTS),
          open(f'{ROOT}/build/scenes.json', 'w'))
print(f'{len(cards)} cards, {len(overlays)} overlays, {len(captions)} captions; duration {DUR}s')
print({k: round(v, 2) for k, v in FACTS.items()})
