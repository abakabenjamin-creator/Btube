"""Base layer: presenter (one continuous shot per section; occasional SLOW push-in; side framing for definitions),
Mixkit stock B-roll under the voiceover, black under graph cards.
Frame-accurate at 25 fps; writes work/base.mp4 (video only) and build/shots.json."""
import json, os, subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FPS=25
E=json.load(open(f'{ROOT}/build/edl.json')); SC=json.load(open(f'{ROOT}/build/scenes.json'))
DUR=SC['duration']; NF=round(DUR*FPS); SRC_DUR=263.12; LEAD=0.6
TIGHT='crop=1536:864:192:40,scale=1920:1080:flags=lanczos'
SHIFT=340   # definition moments: avatar slides left at full framing; right strip = mirrored, softened continuation of the room
SIDE=f'crop={1920-SHIFT}:1080:{SHIFT}:0,pad=1920:1080:0:0[f];movie={ROOT}/work/sideplate.png[p];[f][p]overlay=0:0:format=auto'   # clean room beyond his silhouette (no stray hands)
SIDES=[(d['t0'],d['t1']) for d in SC['sides']]
P=[p for p in E['pieces'] if p['src']=='P']
shots=[]; n_long=0
for k,p in enumerate(P):
    a=max(0, p['start']-(LEAD if k else 0)); pend=p['start']+p['out']-p['in']
    b=pend+LEAD if k<len(P)-1 else DUR
    z=0
    if b-a>=8: n_long+=1; z=3 if n_long%2==1 else 0     # slow push-in on every other long section only
    shots.append(dict(t0=a,t1=b,zoom=z,src_off=p['in']-p['start']))
# split shots at definition-moment edges; inside them use the SIDE framing
out=[]
for sh in shots:
    pts=sorted({sh['t0'],sh['t1'],*[x for a,b in SIDES for x in (a,b) if sh['t0']<x<sh['t1']]})
    for a,b in zip(pts,pts[1:]):
        inside=any(a>=s0-1e-6 and b<=s1+1e-6 for s0,s1 in SIDES)
        out.append(dict(sh,t0=a,t1=b,zoom=2 if inside else sh['zoom']))
shots=[x for x in out if x['t1']-x['t0']>0.02]
# frame-accurate ownership: black < stock b-roll < presenter
own=[None]*NF
for k,br in enumerate(SC['broll']):
    for f in range(round(br['t0']*FPS),min(NF,round(br['t1']*FPS))): own[f]=('broll',k)
for k,sh in enumerate(shots):
    for f in range(round(sh['t0']*FPS),min(NF,round(sh['t1']*FPS))): own[f]=('shot',k)
segs=[]; f=0
while f<NF:
    g=f
    while g<NF and own[g]==own[f]: g+=1
    o=own[f]; segs.append(('black',f,g) if o is None else (o[0],f,g,shots[o[1]] if o[0]=='shot' else SC['broll'][o[1]])); f=g
d=f'{ROOT}/work/base'; os.makedirs(d,exist_ok=True); lst=[]
for i,s in enumerate(segs):
    out=f'{d}/s{i:03d}.mp4'; n=s[2]-s[1]; lst.append(out)
    enc=['-c:v','libx264','-preset','fast','-crf','15','-pix_fmt','yuv420p','-r',str(FPS),'-an']
    if s[0]=='black':
        subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',f'color=c=0x0A0A0A:s=1920x1080:r={FPS}','-frames:v',str(n),*enc,out],check=True)
    elif s[0]=='broll':
        br=s[3]; D=max(1.0,br['t1']-br['t0']); off=(s[1]/FPS-br['t0'])+0.4      # continue the clip if a presenter cut-in split it
        Z=f"(1+0.06*(t+{off:.3f})/{D+0.5:.3f})"
        vf=(f"scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,fps=25,"
            f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'(iw-1920)/2':'(ih-1080)/2'")
        subprocess.run(['ffmpeg','-v','error','-y','-stream_loop','-1','-ss',f'{off:.3f}','-i',f"{ROOT}/assets/stock/clips/{br['id']}.mp4",'-vf',vf,'-frames:v',str(n),*enc,out],check=True)
    else:
        sh=s[3]; st=s[1]/FPS+sh['src_off']
        if sh['zoom']==3:   # slow push-in toward his face (cx 920, cy 330), 1.00 -> 1.06 over the whole section
            D=sh['t1']-sh['t0']; t_in=max(0.0,s[1]/FPS-sh['t0']); Z=f"(1+0.06*max(0\\,t+{t_in:.3f})/{D:.3f})"
            pre=f"scale=w='2*trunc(960*{Z})':h='2*trunc(540*{Z})':eval=frame:flags=lanczos,crop=1920:1080:'920*({Z}-1)':'330*({Z}-1)',"
        else: pre={0:'',2:SIDE+','}[sh['zoom']]
        vf=pre+'tpad=stop_mode=clone:stop_duration=10,fps=25'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{max(0,st):.3f}','-i',f'{ROOT}/src/aroll.mp4','-vf',vf,'-frames:v',str(n),*enc,out],check=True)
open(f'{d}/list.txt','w').write(''.join(f"file '{x}'\n" for x in lst))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',f'{d}/list.txt','-c','copy',f'{ROOT}/work/base.mp4'],check=True)
json.dump(shots,open(f'{ROOT}/build/shots.json','w'),indent=0)
L=[s['t1']-s['t0'] for s in shots]
print(f"{sum(1 for x in shots if x['zoom']==3)} slow push-ins; {len(shots)} presenter shots, avg {sum(L)/len(L):.1f}s, {len(segs)} segments, {NF} frames")
