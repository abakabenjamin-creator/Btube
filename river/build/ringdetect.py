"""Automatic ring finder for Part 1: small bright, desaturated metal blobs that are surrounded by skin
(the big watch and the white shirt stripes are rejected by size / surroundings). Writes per-frame masks."""
import cv2, numpy as np, sys, os, json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F0,F1=int(sys.argv[1]),int(sys.argv[2])
cap=cv2.VideoCapture(f'{ROOT}/src/part1.mp4'); frames=[]
while True:
    ok,f=cap.read()
    if not ok: break
    frames.append(f)
X0,Y0,X1,Y1=600,780,1500,1080
os.makedirs(f'{ROOT}/work/ring/det',exist_ok=True); masks={}
for n in range(F0,F1):
    roi=frames[n][Y0:Y1,X0:X1]; hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV).astype(int); H,S,V=hsv[...,0],hsv[...,1],hsv[...,2]
    skin=((H<=22)|(H>=170))&(S>70)&(V>35)&(V<175)
    metal=(V>125)&(S<95)
    num,lab,st,cen=cv2.connectedComponentsWithStats(metal.astype(np.uint8))
    m=np.zeros(V.shape,np.uint8)
    for i in range(1,num):
        x,y,w,h,a=st[i]
        if a<3 or a>260 or max(w,h)>34: continue
        blob=(lab==i).astype(np.uint8)
        ann=cv2.dilate(blob,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))-cv2.dilate(blob,np.ones((3,3),np.uint8))
        if skin[ann>0].mean()>0.6: m|=blob
    # grey, desaturated band edge next to a detected highlight
    if m.any():
        near=cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))>0
        m|=(near&(S<70)&(V>45)).astype(np.uint8)
        m=cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
    full=np.zeros(frames[n].shape[:2],np.uint8); full[Y0:Y1,X0:X1]=m*255; masks[n]=full
    vis=roi.copy(); cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); cv2.drawContours(vis,cs,-1,(0,255,0),2)
    cv2.putText(vis,str(n),(8,30),0,1,(0,255,255),2); cv2.imwrite(f'{ROOT}/work/ring/det/{n:03d}.png',cv2.resize(vis,(450,150)))
np.savez_compressed(f'{ROOT}/work/ring/masks_{F0}_{F1}.npz',**{str(k):v for k,v in masks.items()})
print('frames with detections:',[n for n,v in masks.items() if v.any()])
