"""Presenter base layer: wide / 1.25x punch-in cuts at sentence ends, black under voiceover cards.
Frame-accurate at 25 fps; writes work/base.mp4 (video only) and build/shots.json."""
import json, os, subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FPS=25
E=json.load(open(f'{ROOT}/build/edl.json')); SC=json.load(open(f'{ROOT}/build/scenes.json'))
DUR=SC['duration']; NF=round(DUR*FPS); SRC_DUR=263.12; LEAD=0.6
TIGHT='crop=1536:864:192:40,scale=1920:1080:flags=lanczos'
SHIFT=420   # definition moments: avatar slides left at full framing; right strip = mirrored, softened continuation of the room
SIDE=f'split=3[a][b][c];[a]crop={1920-SHIFT}:1080:{SHIFT}:0[l];[b]crop=240:1080:1680:0,hflip,gblur=sigma=6[m];[c]crop={SHIFT-240}:1080:1680:0,gblur=sigma=6[n];[l][m][n]hstack=3'
SIDES=[(d['t0'],d['t1']) for d in SC['sides']]
P=[p for p in E['pieces'] if p['src']=='P']
shots=[]; zoom=0
for k,p in enumerate(P):
    a=max(0, p['start']-(LEAD if k else 0)); pend=p['start']+p['out']-p['in']
    b=pend+LEAD if k<len(P)-1 else DUR
    mingap=1.6 if p['chapter']=='hook' else 2.6
    cuts=[a]
    for w in p['words']:
        if w[2][-1:] in '.?!' and w[1]-cuts[-1]>=mingap and pend-w[1]>=1.2: cuts.append(w[1]+0.04)
    cuts.append(b)
    for s,e in zip(cuts,cuts[1:]):
        shots.append(dict(t0=s,t1=e,zoom=zoom%2,src_off=p['in']-p['start'])); zoom+=1
# split shots at definition-moment edges; inside them use the SIDE framing
out=[]
for sh in shots:
    pts=sorted({sh['t0'],sh['t1'],*[x for a,b in SIDES for x in (a,b) if sh['t0']<x<sh['t1']]})
    for a,b in zip(pts,pts[1:]):
        inside=any(a>=s0-1e-6 and b<=s1+1e-6 for s0,s1 in SIDES)
        out.append(dict(sh,t0=a,t1=b,zoom=2 if inside else sh['zoom']))
shots=[x for x in out if x['t1']-x['t0']>0.02]
# frame-accurate segment list incl. black gaps
segs=[]; f=0
for sh in shots:
    f0,f1=round(sh['t0']*FPS),round(sh['t1']*FPS)
    if f0>f: segs.append(('black',f,f0))
    segs.append(('shot',f0,f1,sh)); f=f1
if f<NF: segs.append(('black',f,NF))
d=f'{ROOT}/work/base'; os.makedirs(d,exist_ok=True); lst=[]
for i,s in enumerate(segs):
    out=f'{d}/s{i:03d}.mp4'; n=s[2]-s[1]; lst.append(out)
    enc=['-c:v','libx264','-preset','fast','-crf','15','-pix_fmt','yuv420p','-r',str(FPS),'-an']
    if s[0]=='black':
        subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',f'color=c=0x0A0A0A:s=1920x1080:r={FPS}','-frames:v',str(n),*enc,out],check=True)
    else:
        sh=s[3]; st=s[1]/FPS+sh['src_off']
        vf={0:'',1:TIGHT+',',2:SIDE+','}[sh['zoom']]+'tpad=stop_mode=clone:stop_duration=10,fps=25'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{max(0,st):.3f}','-i',f'{ROOT}/src/aroll.mp4','-vf',vf,'-frames:v',str(n),*enc,out],check=True)
open(f'{d}/list.txt','w').write(''.join(f"file '{x}'\n" for x in lst))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',f'{d}/list.txt','-c','copy',f'{ROOT}/work/base.mp4'],check=True)
json.dump(shots,open(f'{ROOT}/build/shots.json','w'),indent=0)
L=[s['t1']-s['t0'] for s in shots]
print(f'{len(shots)} presenter shots, avg {sum(L)/len(L):.1f}s, {len(segs)} segments, {NF} frames')
