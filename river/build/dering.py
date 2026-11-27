"""Remove the ring on his left ring finger in Part 1 (frames 47-55 = the 'with strength' shot).
Per frame: find the bright, low-saturation band near the tracked finger position, dilate, inpaint from the surrounding skin."""
import cv2, numpy as np, subprocess, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACK={47:(1147,1060),48:(1128,1058),49:(1108,1057),50:(1082,1055),51:(1055,1055),52:(1025,1055),53:(1000,1057),54:(980,1060),55:(970,1075),
       # 56-90: ring hidden by curled fingers (checked frame by frame). 91-103: hand-marked on full-res crops
       91:(1125,1063),92:(1115,1032),93:(1112,1007),94:(1120,969),95:(1128,944),96:(1140,931),97:(1162,933),98:(1182,938),99:(1195,973),
       100:(1205,995),101:(1207,1025),102:(1195,1040),103:(1180,1040),104:(1160,1029),105:(1150,1012),106:(1147,989),107:(1153,971),108:(1162,961),109:(1170,941)}
RAD={n:(22 if n>=91 else 34) for n in TRACK}   # tighter window near the watch
cap=cv2.VideoCapture(f'{ROOT}/src/part1.mp4'); frames=[]
while True:
    ok,f=cap.read()
    if not ok: break
    frames.append(f)
os.makedirs(f'{ROOT}/work/ring/fix',exist_ok=True)
for n,(cx,cy) in TRACK.items():
    f=frames[n]; R=RAD[n]; x0,y0=cx-R,cy-R; x1,y1=cx+R,min(1080,cy+R); y0=max(0,y0)
    roi=f[y0:y1,x0:x1]; hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV); V=hsv[...,2].astype(int); S=hsv[...,1].astype(int)
    skin=np.median(V); sS=np.median(S)
    m=(((V>skin+30)&(S<110))|((S<sS-40)&(V>40))).astype(np.uint8)   # bright metal + its grey, desaturated edge
    k=cv2.connectedComponentsWithStats(m)   # keep blobs near the centre (ring), drop stray highlights
    keep=np.zeros_like(m)
    for i in range(1,k[0]):
        bx,by,bw,bh,a=k[2][i]; ccx,ccy=k[3][i]
        if a>=4 and a<900 and abs(ccx-R)<R*0.65 and abs(ccy-R)<R*0.65: keep[k[1]==i]=1
    keep=cv2.dilate(keep,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
    mask=np.zeros(f.shape[:2],np.uint8); mask[y0:y1,x0:x1]=keep*255
    f2=cv2.inpaint(f,mask,9,cv2.INPAINT_TELEA)
    frames[n]=f2; print(n,'masked px',int(keep.sum()))
    cv2.imwrite(f'{ROOT}/work/ring/fix/{n}_before.png',cv2.resize(f[cy-70:min(1080,cy+70),cx-110:cx+110],(220,140))); cv2.imwrite(f'{ROOT}/work/ring/fix/{n}_after.png',cv2.resize(f2[cy-70:min(1080,cy+70),cx-110:cx+110],(220,140)))
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s','1920x1080','-r','25','-i','-','-i',f'{ROOT}/src/part1.mp4',
    '-map','0:v','-map','1:a','-c:v','libx264','-preset','slow','-crf','12','-pix_fmt','yuv420p','-c:a','copy',f'{ROOT}/src/part1_clean.mp4'],stdin=subprocess.PIPE)
for f in frames: p.stdin.write(f.tobytes())
p.stdin.close(); p.wait()
