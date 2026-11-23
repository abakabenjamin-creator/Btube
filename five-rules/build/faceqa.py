"""Verify no graphic touches the presenter's face: renders the graphics layer at 4 fps over presenter time
and measures alpha inside the face zone (measured face extent of the source, mapped through each shot's framing)."""
import json, os, subprocess, numpy as np
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=json.load(open(f'{ROOT}/build/scenes.json')); SH=json.load(open(f'{ROOT}/build/shots.json'))
F=dict(x0=658,x1=1182,y0=92,y1=564); PAD=30; SHIFT=json.load(open(f'{ROOT}/build/sideplate.json'))['shift']
def zone(z):
    x0,x1,y0,y1=F['x0']-PAD,F['x1']+PAD,F['y0']-PAD,F['y1']+PAD
    if z==1: return [(x0-192)*1.25,(x1-192)*1.25,(y0-40)*1.25,(y1-40)*1.25]
    if z==2: return [x0-SHIFT,x1-SHIFT,y0,y1]
    return [x0,x1,y0,y1]
cardt=lambda t: any(c['t0']<=t<c['t1'] for c in S['cards']) or t>=S['end']['t0']
ts=[]; 
for sh in SH:
    for t in np.arange(sh['t0']+0.05,sh['t1'],0.25):
        if not cardt(t): ts.append((round(float(t),2),sh['zoom']))
fps=None
out=subprocess.run(['node',f'{ROOT}/build/render.js','stills',','.join(str(t) for t,_ in ts),f'{ROOT}/work/qa_alpha'],capture_output=True,text=True)
from PIL import Image
bad=[]
for t,z in ts:
    a=np.array(Image.open(f"{ROOT}/work/qa_alpha/g_{t:.2f}".replace('g_','g_')[:0]+f"{ROOT}/work/qa_alpha/g_{t:07.2f}.png"))[...,3]
    x0,x1,y0,y1=[int(max(0,v)) for v in zone(z)]
    hit=(a[y0:y1,x0:x1]>20).sum()
    if hit>50: bad.append((t,z,int(hit)))
print(f'checked {len(ts)} presenter frames; face-zone hits: {len(bad)}')
for b in bad[:40]: print('  t=%.2f zoom=%d px=%d'%b)
