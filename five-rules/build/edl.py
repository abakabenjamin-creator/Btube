"""Interleave presenter (P) and voiceover (V) pieces, snapped to Whisper word boundaries.
Writes build/edl.json: list of pieces with src in/out and timeline start, plus the words on each piece."""
import json, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W={'P':[w for s in json.load(open(f'{ROOT}/work/transcript.json')) for w in s['words']],
   'V':[w for s in json.load(open(f'{ROOT}/work/vo_transcript.json')) for w in s['words']]}
# (source, approx start, approx end, chapter) in source seconds, in playback order
ORDER=[('P',0.00,16.84,'hook'),('V',0.00,16.64,'hook'),('P',17.22,51.76,'hook'),('V',17.18,28.10,'r1'),
('P',52.14,62.18,'r1'),('V',28.16,32.44,'r1'),('P',62.50,70.12,'r1'),('V',32.76,43.06,'r1'),('P',70.92,78.66,'r1'),
('V',43.72,75.08,'r1'),('P',79.32,99.28,'r2'),('V',75.44,113.22,'r2'),('P',99.70,101.94,'r2'),('V',113.70,122.22,'r2'),
('P',102.50,132.10,'r3'),('V',122.90,136.10,'r3'),('P',132.50,139.68,'r3'),('V',136.64,158.40,'r3'),
('P',140.20,176.40,'r4'),('V',158.88,175.82,'r4'),('P',176.98,181.26,'r4'),('V',176.42,192.06,'r4'),
('P',181.96,200.30,'r5'),('V',192.68,221.26,'r5'),('P',200.78,208.50,'r5'),('V',221.70,235.90,'r5'),
('P',209.06,214.64,'r5'),('V',236.34,259.36,'r5'),('P',215.06,220.70,'r5'),('V',259.72,283.42,'r5'),
('P',221.32,234.42,'r5'),('V',283.42,310.44,'r5'),('P',235.18,247.18,'r5'),('V',310.90,329.42,'recap'),('P',247.64,262.84,'end')]
GAP={'PV':0.35,'VP':0.30}   # breath between speakers
dur={'P':263.12,'V':329.92}
out=[];t=0.0;prev=None
for src,a,b,ch in ORDER:
    ws=[w for w in W[src] if w[0]>=a-0.08 and w[1]<=b+0.08]
    allw=W[src]; i0=allw.index(ws[0]); i1=allw.index(ws[-1])
    before=allw[i0-1][1] if i0>0 else 0.0
    after=allw[i1+1][0] if i1+1<len(allw) else dur[src]
    sin=max(before+0.02, ws[0][0]-0.12); sout=min(after-0.02, ws[-1][1]+0.18)
    if prev: t+=GAP[prev+src] if prev!=src else 0
    out.append({'src':src,'in':round(sin,3),'out':round(sout,3),'start':round(t,3),'chapter':ch,
                'words':[[round(w[0]-sin+t,3),round(w[1]-sin+t,3),w[2].strip()] for w in ws]})
    t+=sout-sin; prev=src
json.dump({'duration':round(t+1.5,3),'pieces':out},open(f'{ROOT}/build/edl.json','w'),indent=1)
print(f"{len(out)} pieces, {t:.1f}s; P {sum(p['out']-p['in'] for p in out if p['src']=='P'):.1f}s, V {sum(p['out']-p['in'] for p in out if p['src']=='V'):.1f}s")
# sanity: every word used exactly once
for s in 'PV':
    used=sum(len(p['words']) for p in out if p['src']==s); print(s,'words used',used,'of',len(W[s]))
