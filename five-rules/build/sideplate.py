"""Clean-room plate for definition moments: everything right of his silhouette (+margin) is replaced
with the empty room (median plate), so no hand/arm can appear in the space he was pushed away from."""
import json, os, subprocess, numpy as np, cv2
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SH=int(os.environ.get('SHIFT',340))
raw=subprocess.run(['ffmpeg','-v','error','-i',f'{ROOT}/src/aroll.mp4','-vf','fps=1/2,format=rgb24','-f','rawvideo','-'],capture_output=True).stdout
P=np.median(np.frombuffer(raw,np.uint8).reshape(-1,1080,1920,3),0).astype(np.uint8)
S=cv2.cvtColor(P,cv2.COLOR_RGB2HSV)[...,1]/255
b=np.full(1080,1100.)
for y in range(1080):
    run=np.convolve((S[y,1100:]>0.22).astype(int),np.ones(25,int),'valid'); k=np.where(run==25)[0]; b[y]=1100+(k[0] if len(k) else 820)
b[:600]=np.maximum(b[:600],1210)                       # head leans up to x~1182
b=cv2.GaussianBlur(b.reshape(-1,1),(1,61),0).ravel()+25
V=1920-SH; rgb=np.zeros((1080,1920,3),np.uint8); rgb[:,:V]=P[:,SH:]
fill=np.concatenate([P[:,1680:1920][:,::-1],P[:,1680:1920]],1)[:,:SH]; rgb[:,V:]=cv2.GaussianBlur(fill,(0,0),6)
a=np.clip((np.arange(1920)[None,:]+SH-b[:,None])/30.,0,1); a[:,V:]=1
Image.fromarray(np.dstack([rgb,(a*255).astype(np.uint8)])).save(f'{ROOT}/work/sideplate.png')
json.dump(dict(shift=SH,edge=[int(x-SH) for x in b]),open(f'{ROOT}/build/sideplate.json','w'))
print('shift',SH,'clean from x(out) at y300/640/800/1000:',[int(b[y]-SH) for y in (300,640,800,1000)])
