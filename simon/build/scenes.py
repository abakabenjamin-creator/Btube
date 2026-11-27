"""All graphics for 'Why Simon Stayed Broke and Solomon Didn't' -> build/scenes.json (engine format)
and the stock-footage timeline -> build/broll.json. Every element is anchored to the spoken word."""
import json, re, sys
ROOT = '/home/user/Btube/simon'; sys.path.insert(0, f'{ROOT}/build')
from plan import BROLL, DIMBG, CHAPTERS, SIDES, KEY, IMPACT
E = json.load(open(f'{ROOT}/build/edl.json')); P = {p['i']: p for p in E['pieces']}
F = '"Inter", sans-serif'
def L(i): return P[i]
def t0(i): return P[i]['words'][0]['t']
def t1(i): return P[i]['words'][-1]['e']
def wt(i, word, nth=1):   # time a word is spoken in line i
    k = 0
    for w in P[i]['words']:
        if re.sub(r'[^a-z0-9]', '', w['w'].lower()).startswith(re.sub(r'[^a-z0-9]', '', word.lower())):
            k += 1
            if k == nth: return w['t']
    raise KeyError((i, word))
def sentences(i):
    out, cur = [], []
    for w in P[i]['words']:
        cur.append(w)
        if re.search(r'[.?!]$', w['w']): out.append(cur); cur = []
    if cur: out.append(cur)
    return out

cards, captions, sides, broll = [], [], [], []
def T(s, at, x, y, size=58, align='center', weight=700, **k): return dict(type='text', str=s, at=at, x=x, y=y, size=size, align=align, weight=weight, font=F, **k)
def card(lines, els, dim=False, black=False, a0=None):
    a = (a0 if a0 is not None else t0(lines[0])) - 0.15; b = t1(lines[-1]) + 0.25
    c = dict(t0=round(a, 2), t1=round(b, 2), els=els)
    if dim: c['dim'] = True
    cards.append(c)
    if dim:
        for i in lines: broll.append(dict(t0=P[i]['start'] - 0.2, t1=P[i]['start'] + P[i]['out'] - P[i]['in_'] + 0.2, id=DIMBG.get(lines[0])))
    return c

# ---------------- graph cards (about 20% of the voiceover) ----------------
i = 1   # hook: the two balances
card([1], [T('Ten years. Same paycheck.', t0(1), 960, 250, 56, weight=600, color='rgba(255,255,255,0.8)'),
           dict(type='bars', x=260, y=470, w=1400, h=90, gap=250, max=165000, rows=[
               dict(label='Simon', at=wt(1, 'Simon'), segs=[dict(v=1800, color='#E10600')], valueStr='under $2,000', vcolor='#E10600'),
               dict(label='Solomon', at=wt(1, 'Solomon'), segs=[dict(v=165000, color='#00A651')], valueStr='$165,000 invested', vcolor='#00A651')])])
card([5], [T('Three drains', t0(5) - 0.1, 960, 260, 70, weight=800),
           dict(type='pill', str='1  Prices that won\'t settle down', at=wt(5, 'Prices'), x=960, y=430, w=980, size=42, tint='#E10600'),
           dict(type='pill', str='2  Debt at 20-24%', at=wt(5, 'Debt'), x=960, y=560, w=980, size=42, tint='#E10600'),
           dict(type='pill', str='3  Scams that sound like family', at=wt(5, 'scams'), x=960, y=690, w=980, size=42, tint='#E10600')], dim=True)
card([12, 13], [T('Checking account pays', t0(12), 560, 330, 44, weight=600), T('{< 0.1%}', wt(12, 'tenth'), 560, 470, 120, weight=900),
                T('Inflation (Sept)', wt(12, 'inflation'), 1360, 330, 44, weight=600), T('{3.7%}', wt(12, 'seven'), 1360, 470, 120, weight=900),
                T('On $10,000 you lose about', t0(13), 960, 680, 50, weight=600), T('{$400} of buying power a year', wt(13, 'four'), 960, 790, 64, weight=800),
                T('Source: BLS CPI, September 2026', t0(13), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], dim=True)
card([14, 15], [T('Payday: $4,500', t0(14), 960, 250, 64, weight=800),
                dict(type='bars', x=260, y=450, w=1400, h=90, gap=240, max=4500, rows=[
                    dict(label='Leaves first, automatically', at=wt(14, 'nine'), segs=[dict(v=900, color='#00A651')], valueStr='$900 (20%)', vcolor='#00A651'),
                    dict(label='Everything else has to fit here', at=wt(15, 'thirty'), segs=[dict(v=3600, color='#FFFFFF')], valueStr='$3,600')]),
                T('The future gets paid *first*', wt(15, 'decided'), 960, 950, 52, weight=700)], dim=True)
card([22], [T('Emergency fund: 3-6 months of basics', t0(22), 960, 250, 54, weight=700),
            dict(type='pill', str='High-yield savings', at=wt(22, 'high'), x=500, y=380, w=440, size=34, tint=None),
            dict(type='pill', str='Money market fund', at=wt(22, 'money'), x=960, y=380, w=440, size=34, tint=None),
            dict(type='pill', str='Short-term Treasuries', at=wt(22, 'Treasuries'), x=1420, y=380, w=440, size=34, tint=None),
            dict(type='bars', x=260, y=600, w=1400, h=80, gap=200, max=400, rows=[
                dict(label='$10,000 at about 4%', at=wt(22, 'four'), segs=[dict(v=400, color='#00A651')], valueStr='~$400 a year', vcolor='#00A651'),
                dict(label='$10,000 in checking', at=wt(22, 'seven'), segs=[dict(v=7, color='#E10600')], valueStr='~$7 a year', vcolor='#E10600')])], dim=True)
card([24], [T('The long game', t0(24), 960, 250, 70, weight=800),
            dict(type='pill', str='Index funds', at=wt(24, 'Index'), x=700, y=400, w=480, size=40, tint=None),
            dict(type='pill', str='Retirement accounts', at=wt(24, 'retirement'), x=1220, y=400, w=520, size=40, tint=None),
            T('2026 limits', wt(24, '2026'), 960, 580, 42, weight=600, color='rgba(255,255,255,0.8)'),
            T('IRA  [$7,500]', wt(24, 'IRA') - 0.3, 960, 690, 72, weight=800), T('401(k)  [$24,500]', wt(24, 'twenty'), 960, 800, 72, weight=800),
            T('Source: IRS', wt(24, 'twenty'), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], dim=True)
r, m = 0.08 / 12, 900
sol = [round(m * ((1 + r) ** (12 * y) - 1) / r) for y in range(11)]
card([25], [T('$900 a month at about 8%', t0(25), 960, 200, 56, weight=700),
            dict(type='chart', at=wt(25, 'eight'), dur=5.5, x=300, y=300, w=1250, h=560, years=10, max=180000, grid=[50000, 100000, 150000],
                 xticks=[[0, 'Now'], [5, 'Year 5'], [10, 'Year 10']], yfmt='k',
                 series=[dict(ys=sol, color='#00A651', label=True, fmt='money', lsize=56), dict(ys=[0] + [1800] * 10, color='#E10600', label=False)]),
            T('An average. Some years are ugly.', wt(25, 'average'), 960, 1000, 34, weight=600, color='rgba(255,255,255,0.75)')], black=True)
card([26], [T("Simon's ten years", t0(26), 960, 260, 66, weight=800),
            dict(type='num', at=wt(26, 'twenty'), from_=0, to=23000, x=960, y=440, size=110, suffix=' hours of work'),
            dict(type='num', at=wt(26, 'half'), to=540000, x=960, y=620, size=110, fmt='money', color='#FFFFFF'),
            T('in paychecks', wt(26, 'paychecks'), 960, 700, 44, weight=600),
            T('{Under $2,000 left}', wt(26, 'Under'), 960, 880, 84, weight=900)], black=True)
card([33], [T('New card offers average', t0(33), 960, 300, 50, weight=600), T('{~24%}', wt(33, 'average'), 960, 450, 140, weight=900),
            T('Carry [$5,000] at that rate', wt(33, 'Carry'), 960, 640, 60, weight=700),
            T('= {$1,200} a year just to owe it', wt(33, 'twelve'), 960, 760, 64, weight=800),
            T('Source: LendingTree', t0(33), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], dim=True)
card([38], [T('Buy now, pay later users who paid late', t0(38), 960, 300, 52, weight=600),
            dict(type='num', at=wt(38, 'forty'), to=47, x=960, y=600, size=260, suffix='%', color='#E10600'),
            T('Almost *half*', wt(38, 'Almost'), 960, 780, 70, weight=800),
            T('Source: LendingTree BNPL survey, 2026', t0(38), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], black=True)
card([42], [T('This weekend, on paper', t0(42) - 0.1, 960, 230, 62, weight=800),
            T('1. Each card', wt(42, 'card'), 560, 400, 52, align='left'), T('What you owe', wt(42, 'owe'), 1000, 400, 52, align='left', color='rgba(255,255,255,0.85)'),
            T('The rate', wt(42, 'rate'), 1400, 400, 52, align='left', color='#FFD400'),
            T('2. Each pay-in-4 plan', wt(42, 'Then'), 560, 540, 52, align='left'), T('The due date', wt(42, 'day'), 1150, 540, 52, align='left', color='#FFD400')], dim=True)
card([55], [T('Imposter scams, reported losses (2025)', t0(55), 960, 300, 50, weight=600),
            dict(type='num', at=wt(55, 'three'), to=3.5, dec=1, prefix='$', suffix=' billion', x=960, y=560, size=170, color='#E10600'),
            T('Source: FTC', t0(55), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], dim=True)
card([59], [T('Losses to AI scams alone', t0(59), 960, 300, 50, weight=600),
            dict(type='num', at=wt(59, 'nine'), to=900, prefix='~$', suffix=' million', x=960, y=560, size=170, color='#E10600'),
            T('Source: FBI IC3 2025 report', t0(59), 960, 930, 26, weight=500, color='rgba(255,255,255,0.6)')], dim=True)
card([61], [T('Freeze your credit: free, minutes each', t0(61), 960, 250, 54, weight=700),
            dict(type='pill', str='Equifax', at=wt(61, 'Equifax'), x=500, y=420, w=420, size=42, tint=None),
            dict(type='pill', str='Experian', at=wt(61, 'Experian'), x=960, y=420, w=420, size=42, tint=None),
            dict(type='pill', str='TransUnion', at=wt(61, 'TransUnion'), x=1420, y=420, w=420, size=42, tint=None),
            T('Authenticator app *instead of* text codes', wt(61, 'authenticator'), 960, 650, 56, weight=800)], dim=True)
card([63], [T('If you couldn\'t work for six months', t0(63) - 0.1, 960, 260, 52, weight=600),
            dict(type='pill', str='Term life', at=wt(63, 'Term'), x=500, y=440, w=420, size=44, tint=None),
            dict(type='pill', str='Disability', at=wt(63, 'disability'), x=960, y=440, w=420, size=44, tint=None),
            dict(type='pill', str='Umbrella policy', at=wt(63, 'umbrella'), x=1430, y=440, w=460, size=44, tint=None),
            T('One bad year shouldn\'t force a fire sale', wt(63, 'keeps'), 960, 660, 54, weight=800)], dim=True)
card([66], [T('Estate: about $500,000', t0(66), 960, 230, 62, weight=800),
            T('Family 1: a will, nothing else', wt(66, 'first'), 960, 390, 54, weight=700),
            T('Probate commonly eats  {3-7%}', wt(66, 'Probate'), 960, 520, 64, weight=800),
            T('= {$15,000 - $35,000}', wt(66, 'fifteen'), 960, 650, 84, weight=900),
            T('Months, sometimes a couple of years', wt(66, 'drag'), 960, 790, 50, weight=600, color='rgba(255,255,255,0.8)')], black=True)
card([69], a0=wt(69, 'It'), els=[dict(type='photo', src=f'file://{ROOT}/assets/people/prince_1986.jpg', at=t0(69), x=1060, y=0, w=860, h=1080, fade='left', fx=0.5, fy=0.2,
                 credit='Photo: Yves Lorson, CC BY 2.0'),
            T('Prince', t0(69), 140, 330, 110, align='left', weight=900),
            T('Died 2016. *No will.*', wt(69, 'will'), 140, 450, 56, align='left'),
            T('Over a year to name his heirs', wt(69, 'took'), 140, 560, 46, align='left', weight=600),
            T('6 years in court', wt(69, 'six'), 140, 660, 56, align='left', weight=800),
            T('Estate: [~$156 million]', wt(69, 'estate'), 140, 770, 56, align='left', weight=800)], black=True)
card([74], [T('Three drains. Three rules.', t0(74), 960, 240, 68, weight=800),
            dict(type='pill', str='1  Pay the future first', at=wt(74, 'Pay'), x=960, y=420, w=900, size=46, tint='#00A651'),
            dict(type='pill', str='2  Debt has to earn its keep', at=wt(74, 'Debt'), x=960, y=560, w=900, size=46, tint='#00A651'),
            dict(type='pill', str='3  Protect it all', at=wt(74, 'protect'), x=960, y=700, w=900, size=46, tint='#00A651'),
            T('Safeword · freeze · coverage · beneficiaries', wt(74, 'safe'), 960, 860, 44, weight=600)], dim=True)
for c in cards:   # 'num' uses from (python keyword) and fade out at the card end
    for e in c['els']:
        if 'from_' in e: e['from'] = e.pop('from_')
# ---------------- source receipts: the original page, key line highlighted (full frame, slow push) ----------------
RC = f'file://{ROOT}/assets/receipts/'
def proof(name, label, a, b):
    cards.insert(0, dict(t0=round(a, 2), t1=round(b, 2), nopill=True, els=[
        dict(type='photo', src=RC + name + '_z.png', at=a, x=0, y=0, w=1920, h=1080, fx=0.5, fy=0.5, dur=6),
        dict(type='pill', str='Source: ' + label, at=a + 0.15, x=960, y=1000, size=34, tint='#E10600')]))
proof('fdic', 'FDIC national rates', wt(12, 'Basically') - 0.15, wt(12, 'Basically') + 2.3)
proof('bls2', 'Kiplinger, citing BLS', wt(12, 'seven') + 0.35, wt(12, 'seven') + 2.9)
proof('irs', 'IRS.gov', t1(24) - 2.4, t1(24) + 0.25)
proof('lt_apr', 'LendingTree', t0(33) - 0.35, wt(33, 'New') - 0.05)
proof('lt_bnpl', 'LendingTree BNPL survey', t0(38) - 0.35, wt(38, 'forty') - 0.1)
proof('ftc2', 'CFP Board, citing FTC data', t0(55) - 0.35, wt(55, 'three') - 0.1)
proof('fbi', 'Malwarebytes, citing FBI IC3 report', t0(59) - 0.45, wt(59, 'nine') - 0.05)
proof('prince', 'NBC News', wt(69, 'estate') - 0.1, t1(69) + 0.25)
CARDED = {i for c in cards for i in P if c['t0'] - 0.01 <= t0(i) < c['t1']}

# ---------------- stock footage under the remaining voiceover ----------------
for i, ids in BROLL.items():
    ss = sentences(i); a0 = P[i]['start'] - 0.2
    for k, s in enumerate(ss):
        a = a0 if k == 0 else s[0]['t'] - 0.1; b = (ss[k + 1][0]['t'] - 0.1) if k + 1 < len(ss) else P[i]['start'] + P[i]['out'] - P[i]['in_'] + 0.25
        broll.append(dict(t0=round(a, 2), t1=round(b, 2), id=ids[k % len(ids)]))
# Prince: real performance footage (Arsenio Hall Show, CC BY 3.0) while his name lands
broll.append(dict(t0=round(P[69]['start'] - 0.2, 2), t1=round(wt(69, 'It') - 0.15, 2), id='prince'))
overlays_ = [dict(t0=round(t0(69), 2), t1=round(wt(69, 'It') - 0.25, 2), panel=[40, 180, 640, 150], els=[
    T('Prince  (1958-2016)', t0(69) + 0.1, 90, 255, 50, align='left', weight=800),
    T('Video: The Arsenio Hall Show, CC BY 3.0', t0(69) + 0.3, 90, 300, 22, align='left', weight=500, color='rgba(255,255,255,0.7)')])]
broll.sort(key=lambda x: x['t0'])
for x, y in zip(broll, broll[1:]):   # butt joins, no overlaps
    if y['t0'] < x['t1']: x['t1'] = y['t0']
broll = [x for x in broll if x['t1'] - x['t0'] > 0.3]

# ---------------- side layouts (rule moments) ----------------
SLIDE = []   # (slide start, slide end) for the base layer
for sd in SIDES:
    a, b = sd['lines']; s0 = t0(a) + 1.4; s1 = s0 + 0.45      # original framing first, then a 0.45 s slide during the line
    words = P[a]['words'] + P[b]['words']
    body = []; at = s1 + 0.25
    for k, line in enumerate(sd['body']):
        body.append(dict(str=line, at=round(max(at, s1 + 0.25 + 0.9 * k), 2)))
    # time later body lines to the words that introduce them where we can
    end = P[b]['start'] + P[b]['out'] - P[b]['in_']
    sides.append(dict(t0=round(s1, 2), t1=round(end, 2), heading=sd['heading'], body=body))
    SLIDE.append((round(s0, 2), round(s1, 2), round(end, 2)))
SIDE_LINES = {i for sd in SIDES for i in range(sd['lines'][0], sd['lines'][1] + 1)}
# body timing to speech for the rule lists
sides[0]['body'][1]['at'] = wt(17, 'emergency'); sides[0]['body'][2]['at'] = wt(17, 'down'); sides[0]['body'][3]['at'] = wt(17, 'car')
sides[1]['body'][1]['at'] = wt(41, 'Paper', 1)
sides[2]['body'][1]['at'] = wt(58, 'safe'); sides[2]['body'][2]['at'] = wt(58, 'No')

# ---------------- captions: presenter (chest) and stock (low); none under cards or side text ----------------
def chunks(words, n=6):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= n or re.search(r'[.?!,]$', w['w']) and len(cur) >= 3: out.append(cur); cur = []
    if cur:
        if out and len(cur) < 3: out[-1] += cur
        else: out.append(cur)
    return out
for i, p in sorted(P.items()):
    if i in CARDED: continue
    ws = list(p['words'])
    if i in SIDE_LINES:
        sl = [x for x in SLIDE if x[0] - 2 < t0(i) < x[2]]
        if not sl: continue
        ws = [w for w in ws if w['e'] < sl[0][0] - 0.3]     # caption only during the original framing
        if not ws: continue
    on_stock = p['src'] == 'V'
    for ch in chunks(ws):
        cap = dict(t0=round(ch[0]['t'], 2), t1=round(ch[-1]['e'] + 0.15, 2), upper=True, pos='c',
                   words=[dict(w=w['w'], t=round(w['t'], 2), key=KEY.get(w['w'].lower()) == 'y', gkey=KEY.get(w['w'].lower()) == 'g') for w in ch])
        if on_stock: cap.update(broll=True, size=66)
        if i in IMPACT: cap['impact'] = True
        captions.append(cap)
for a, b in zip(captions, captions[1:]): a['t1'] = min(a['t1'], b['t0'] - 0.3)   # a line fades out before the next rises
for s0, s1, e in SLIDE:   # chest captions gone before the slide begins
    for c in captions:
        if c['t0'] < s0 <= c['t1'] + 0.3: c['t1'] = min(c['t1'], s0 - 0.3)
captions = [c for c in captions if c['t1'] - c['t0'] > 0.25]

chapters = [dict(t=round(max(0.3, P[i]['start'] - 0.1), 2), label=lab) for i, lab in sorted(CHAPTERS.items())]
END0 = E['duration'] + 0.3
end = dict(t0=END0, els=[T('Which drain will you close first?', END0 + 0.3, 960, 380, 70, weight=800),
                         T('Tell me in the comments.', END0 + 0.8, 960, 480, 46, weight=600, color='rgba(255,255,255,0.85)'),
                         T('Next: track it all on *one simple page*', END0 + 1.4, 960, 640, 56, weight=700)])
S = dict(duration=round(END0 + 5.5, 2), broll=broll, images=[f'file://{ROOT}/assets/people/prince_1986.jpg'] + [RC + n + '_z.png' for n in ('fdic','bls2','irs','lt_apr','lt_bnpl','ftc2','fbi','prince')], cards=cards,
         overlays=overlays_, captions=captions, sides=sides, chapters=chapters, end=end)
json.dump(S, open(f'{ROOT}/build/scenes.json', 'w'), indent=0)
json.dump(dict(broll=broll, slide=SLIDE), open(f'{ROOT}/build/broll.json', 'w'), indent=0)
vo = sum(P[i]['out'] - P[i]['in_'] for i in P if P[i]['src'] == 'V')
cardt = sum(c['t1'] - c['t0'] for c in cards); dimt = sum(c['t1'] - c['t0'] for c in cards if c.get('dim'))
stock = sum(b['t1'] - b['t0'] for b in broll)
print(f'cards {len(cards)} ({cardt:.0f}s, {dimt:.0f}s of it over stock) | stock {stock:.0f}s | captions {len(captions)} | sides {len(sides)} | duration {S["duration"]}')
