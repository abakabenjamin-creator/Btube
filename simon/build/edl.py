"""Align every script line to its source (P=front presenter 'simon_main', S=side presenter 'money_while_you_sleep',
V=DR. REP voiceover) by word matching, and lay them out in script order -> build/edl.json"""
import json, re, difflib
ROOT='/home/user/Btube/simon'
norm=lambda s: re.sub(r'[^a-z0-9]','',s.lower())
def toks(s): 
    s=s.replace('[pause]',' ').replace('-',' ').replace('%',' percent ')
    return [norm(x) for x in s.split() if norm(x)]
SRC={'P':json.load(open(f'{ROOT}/src/p2_words.json')),'S':json.load(open(f'{ROOT}/src/p1_words.json')),
     'V':[dict(w=w['text'],s=w['start_time'],e=w['end_time']) for w in json.load(open(f'{ROOT}/src/vo_words.json'))]}
for k,W in SRC.items():
    for w in W: w['n']=norm(w['w'].replace('%','percent'))
NUM={'fortyfive':'4','hundred':'','thousand':'','twenty':'20','percent':'percent'}
lines=open(f'{ROOT}/script.txt').read().strip().split('\n')
mp={i:s for i,s,_ in json.load(open(f'{ROOT}/work/linemap.json'))}
ptr={'P':0,'S':0,'V':0}; out=[]
for i,l in enumerate(lines):
    src={'VO':'V','P1':'S','P2?':'P'}[mp[i]]; W=SRC[src]; T=toks(l)
    if not T: continue
    best=None
    for st in range(ptr[src],min(len(W),ptr[src]+40)):
        for ln in range(max(1,len(T)-8),len(T)+8):
            seg=[w['n'] for w in W[st:st+ln]]
            r=difflib.SequenceMatcher(None,T,seg).ratio()
            if best is None or r>best[0]: best=(r,st,ln)
    r,st,ln=best; ws=W[st:st+ln]; ptr[src]=st+ln
    out.append(dict(i=i,src=src,start=ws[0]['s'],end=ws[-1]['e'],ratio=round(r,2),text=l,words=[dict(w=w['w'],s=w['s'],e=w['e']) for w in ws]))
    flag='' if r>0.8 else '  <<< CHECK'
    print(f"{i:2d} {src} {ws[0]['s']:7.2f}-{ws[-1]['e']:7.2f} r={r:.2f} | {' '.join(w['w'] for w in ws)[:70]}{flag}")
json.dump(out,open(f'{ROOT}/build/lines.json','w'),indent=0)
# ---- fixes the aligner can't see
for L in out:
    if L['i']==34:   # "Twelve hundred." (whisper wrote 1200.)
        W=SRC['S']; k=[j for j,w in enumerate(W) if w['w'].startswith('1200')][0]
        L['start']=W[k]['s']; L['words']=[dict(w='Twelve',s=W[k]['s'],e=W[k]['s']+0.4),dict(w='hundred.',s=W[k]['s']+0.4,e=W[k]['e'])]+L['words']
# ---- captions use the script's own words and punctuation, on the spoken timings
def respell(line, ws):
    toks=[x for x in line.replace('[pause]',' ').split() if norm(x.replace('%','percent'))]
    out=[]; j=0
    for tk in toks:
        target=norm(tk.replace('%','percent').replace('-',' ')); acc=''; grp=[]
        while j<len(ws) and len(acc)<len(target):
            acc+=norm(ws[j]['w'].replace('%','percent')); grp.append(ws[j]); j+=1
        if acc!=target or not grp: return fuzzy(toks, ws)
        out.append(dict(w=tk,s=grp[0]['s'],e=grp[-1]['e']))
    return out if j==len(ws) else fuzzy(toks, ws)
def fuzzy(toks, ws):
    # merge transcript splits like '4' ',500'; then map script tokens onto words with a diff
    m=[]
    for w in ws:
        if m and re.match(r'^[,.%]', w['w']) : m[-1]=dict(w=m[-1]['w']+w['w'],s=m[-1]['s'],e=w['e'])
        else: m.append(dict(w))
    a=[norm(x) for x in toks]; b=[norm(w['w']) for w in m]; out=[]
    for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if op=='equal' or (op=='replace' and i2-i1==j2-j1):
            out+= [dict(w=toks[i1+k],s=m[j1+k]['s'],e=m[j1+k]['e']) for k in range(j2-j1)]
        elif op=='replace' and j2>j1:   # different counts: spread the script words over the span
            s0,e0=m[j1]['s'],m[j2-1]['e']; n=i2-i1
            out+= [dict(w=toks[i1+k],s=s0+(e0-s0)*k/n,e=s0+(e0-s0)*(k+1)/n) for k in range(n)]
        elif op=='insert': out+=m[j1:j2]     # spoken but not in script: keep
        elif op=='delete':                  # in script, not caught: squeeze in next to its neighbour
            for k in range(i1,i2):
                if out: out.append(dict(w=toks[k],s=out[-1]['e'],e=out[-1]['e']+0.15))
                else: s0=m[j1]['s'] if j1<len(m) else 0; out.append(dict(w=toks[k],s=max(0,s0-0.3),e=s0))
    return out
fixed=0
for L in out:
    nw=respell(lines[L['i']],L['words'])
    if nw is not L['words']: fixed+=1
    L['words']=nw
print('respelled',fixed,'of',len(out))
# ---- lay out on the timeline: tiny head/tail pad, a breath between lines, longer where the script says [pause]
PAD=0.06; t=0.25; pieces=[]
for k,L in enumerate(out):
    pause_before='[pause]' in lines[L['i']].split(' ')[0] or (L['i']>0 and lines[L['i']-1].strip()=='[pause]')
    prev=pieces[-1] if pieces else None
    gap=0 if not prev else (0.30 if prev['src']==L['src'] else 0.40)
    if pause_before: gap+=0.9
    t+=gap
    a=max(0,L['start']-PAD); b=L['end']+PAD
    pieces.append(dict(i=L['i'],src=L['src'],in_=round(a,3),out=round(b,3),start=round(t,3),text=L['text'],
                       words=[dict(w=w['w'],t=round(t+(w['s']-a),3),e=round(t+(w['e']-a),3)) for w in L['words']]))
    t+=b-a
json.dump(dict(pieces=pieces,duration=round(t+0.3,3)),open(f'{ROOT}/build/edl.json','w'),indent=0)
from collections import Counter
dur=Counter(); 
for p in pieces: dur[p['src']]+=p['out']-p['in_']
print('timeline',round(t,1),'s; by source',{k:round(v,1) for k,v in dur.items()})
