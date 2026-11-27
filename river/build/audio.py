"""Sound: soft ambient pad (louder on the stock-footage hook and the end card, ~20 dB under the voice while he talks),
whooshes on the stock cuts, a low hit on the canyon reveal. Voice + bed -> work/mix.wav (48 kHz stereo)."""
import json, os, numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d
from scipy.io import wavfile
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR=48000
S=json.load(open(f'{ROOT}/build/scenes.json')); DUR=S['duration']; N=int(DUR*SR); rng=np.random.default_rng(5)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'bandpass',fs=SR,output='sos'),x)
def lp(x,f): return sosfilt(butter(4,f,'lowpass',fs=SR,output='sos'),x)
mavg=lambda x,n: uniform_filter1d(x.astype(float),max(1,int(n)),mode='nearest')
hz=lambda m: 440*2**((m-69)/12); t=np.arange(N)/SR
chords=[[50,57,60,65],[46,53,57,62],[43,50,55,58],[45,52,57,61]]   # Dm - Bb - Gm - A, slow and warm
pad=np.zeros(N); seg=5.0
for k in range(int(DUR/seg)+1):
    s0=int(k*seg*SR); s1=min(N,int((k+1.4)*seg*SR)); tt=np.arange(s1-s0)/SR; L=len(tt)/SR
    y=sum(np.sin(2*np.pi*hz(m)*(1+d)*tt+d*40) for m in chords[k%4] for d in (-0.002,0,0.002))
    y+=0.8*np.sin(2*np.pi*hz(chords[k%4][0]-12)*tt)
    pad[s0:s1]+=y*np.minimum(1,tt/1.5)*np.minimum(1,(L-tt)/1.5)
pad=lp(pad,1400); pad/=np.abs(pad).max()
def whoosh(d=.5):
    n=int(d*SR); x=rng.standard_normal(n); y=np.zeros(n)
    for i in range(0,n,1024): f=300+2800*np.sin(np.pi*i/n)**2; y[i:i+1024]=bp(x[max(0,i-2048):i+1024],f*.6,f*1.7)[-len(y[i:i+1024]):]
    return y*np.sin(np.pi*np.arange(n)/SR/d)**2
def hit():
    n=int(2.5*SR); tt=np.arange(n)/SR; return np.sin(2*np.pi*48*tt)*np.exp(-tt/0.7)+lp(rng.standard_normal(n),700)*np.exp(-tt/0.12)*0.5
sfx=np.zeros(N)
def put(x,at,gn):
    s=int(at*SR); e=min(N,s+len(x)); sfx[s:e]+=x[:e-s]*gn
for at in (2.80,4.02,7.47,11.10): put(whoosh(),at-0.25,0.30)
put(hit(),12.75,0.55); put(whoosh(.8),15.6,0.25)
sr,d=wavfile.read(f'{ROOT}/work/dialog.wav'); d=d.astype(float)/32768; d=np.pad(d,(0,max(0,N-len(d))))[:N]
act=mavg((np.sqrt(mavg(d**2,0.05*SR))>0.01).astype(float),0.4*SR)
db=lambda x:10**(x/20)
base=np.where(t>12.9,-12,-23)
gain=mavg(db(base-5*act),0.3*SR)*np.minimum(1,t/0.6)*np.minimum(1,np.maximum(0,(DUR-t)/2.0))
m=pad*gain
mix=np.stack([d+m*0.9+sfx*db(-12), d+m+sfx*db(-12)],1); mix/=max(1,np.abs(mix).max()/0.98)
wavfile.write(f'{ROOT}/work/mix.wav',SR,mix.astype(np.float32))
r=lambda x:20*np.log10(np.sqrt(np.mean(x**2))+1e-12); sp=act>0.9
print(f'voice {r(d[sp]):.1f} dBFS, bed under voice {r(m[sp]):.1f} dBFS')
