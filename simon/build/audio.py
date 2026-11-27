"""Soft ambient pad ~20 dB under the voice (a little louder on the end card); no whoosh/swipe SFX (channel rule).
dialog.wav + bed -> work/mix.wav"""
import json, numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d
from scipy.io import wavfile
ROOT='/home/user/Btube/simon'; SR=48000
S=json.load(open(f'{ROOT}/build/scenes.json')); DUR=S['duration']; N=int(DUR*SR)
sr,d=wavfile.read(f'{ROOT}/work/dialog.wav'); d=d.astype(float)/32768; d=np.pad(d,(0,max(0,N-len(d))))[:N]
hz=lambda m:440*2**((m-69)/12); chords=[[57,60,64,67],[53,57,60,64],[48,55,59,64],[55,59,62,64]]
pad=np.zeros(N); seg=8.0
for k in range(int(DUR/seg)+1):
    s0=int(k*seg*SR); s1=min(N,int((k+1.35)*seg*SR)); tt=np.arange(s1-s0)/SR; Lg=len(tt)/SR
    y=sum(np.sin(2*np.pi*hz(m)*(1+dt)*tt+dt*50) for m in chords[k%4] for dt in (-0.002,0,0.002))+0.7*np.sin(2*np.pi*hz(chords[k%4][0]-12)*tt)
    pad[s0:s1]+=y*np.minimum(1,tt/2.5)*np.minimum(1,(Lg-tt)/2.5)
pad=sosfilt(butter(4,1200,'lowpass',fs=SR,output='sos'),pad); pad/=np.abs(pad).max()
mavg=lambda x,n: uniform_filter1d(x,max(1,int(n)),mode='nearest')
act=mavg((np.sqrt(mavg(d**2,0.05*SR))>0.01).astype(float),0.5*SR); t=np.arange(N)/SR
base=np.where(t>S["end"]["t0"],-12,-20); db=lambda x:10**(x/20)
m=pad*mavg(db(base-4*act),0.4*SR)*np.minimum(1,t/1.5)*np.minimum(1,np.maximum(0,(DUR-t)/2.5))
mix=np.stack([d+m*0.92,d+m],1); mix/=max(1,np.abs(mix).max()/0.98)
wavfile.write(f'{ROOT}/work/mix.wav',SR,mix.astype(np.float32))
r=lambda x:20*np.log10(np.sqrt(np.mean(x**2))+1e-12); sp=act>0.9
print(f'voice {r(d[sp]):.1f} dBFS, bed {r(m[sp]):.1f} dBFS')
