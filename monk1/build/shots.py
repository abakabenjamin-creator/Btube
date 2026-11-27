# Shot detection + A-roll vs cutaway classification on the clean video.
import subprocess, json, sys, re, numpy as np
from PIL import Image
src=sys.argv[1]; out=sys.argv[2]
# 1) scene cuts (hard cuts) on low-res proxy
r=subprocess.run(["ffmpeg","-v","info","-i",src,"-vf","scale=320:180,select='gt(scene,0.22)',showinfo","-an","-f","null","-"],capture_output=True,text=True)
cuts=[float(m) for m in re.findall(r"pts_time:([0-9.]+)",r.stderr)]
dur=float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src],capture_output=True,text=True).stdout)
b=[0.0]+[c for c in cuts]+[dur]
shots=[]
for a,z in zip(b,b[1:]):
    if z-a<0.25 and shots: shots[-1]['end']=z; continue
    shots.append({'start':a,'end':z})
# 2) thumbnail of every 0.5s -> per-shot descriptor
raw=subprocess.run(["ffmpeg","-v","error","-i",src,"-vf","fps=2,scale=32:18","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
T=np.frombuffer(raw,np.uint8).reshape(-1,18,32,3).astype(np.float32)
for s in shots:
    i0=int(s['start']*2); i1=max(i0+1,int(s['end']*2)); s['thumb']=T[i0:i1].mean(0)
json.dump([{'start':round(s['start'],3),'end':round(s['end'],3)} for s in shots],open(out,'w'),indent=0)
np.save(out.replace('.json','_thumbs.npy'),np.stack([s['thumb'] for s in shots]))
print(len(shots),'shots')
