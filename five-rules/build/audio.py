"""Sound layer for 'Five Rules of Money' (all synthesized, owned outright):
ambient pad bed (ducked under voice; louder in hook/end), whooshes into cards, risers into rule maps, pops on items.
Mixes with work/mix/dialog.wav -> work/mix/mix.wav (48 kHz stereo). Loudness normalised to -14 LUFS in finish step."""
import json, os, numpy as np
from functools import lru_cache
from scipy.ndimage import uniform_filter1d
def mavg(x,n): return uniform_filter1d(x.astype(np.float64),max(1,int(n)),mode='nearest')
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR=48000
S=json.load(open(f'{ROOT}/build/scenes.json')); DUR=S['duration']+0.5; N=int(DUR*SR)
rng=np.random.default_rng(11)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'bandpass',fs=SR,output='sos'),x)
def lp(x,f,o=2): return sosfilt(butter(o,f,'lowpass',fs=SR,output='sos'),x)
def hp(x,f): return sosfilt(butter(2,f,'highpass',fs=SR,output='sos'),x)
def env(n,a,d): t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
# ---------- pad: slow Am7 - Fmaj7 - Cmaj7 - G6 voicings, detuned soft saws, low-passed
chords=[[57,60,64,67],[53,57,60,64],[48,55,59,64],[55,59,62,64]]
hz=lambda m: 440*2**((m-69)/12)
seg=8.0; t=np.arange(int(seg*SR))/SR
def saw(f,t): return 2*((f*t)%1)-1
pad=np.zeros(N)
for k in range(int(DUR/seg)+1):
    ch=chords[k%4]; y=np.zeros(len(t))
    for m in ch:
        for det in (-0.06,0.0,0.06):
            y+=saw(hz(m)*(1+det/100*12),t+k*seg)*0.18
    y+=np.sin(2*np.pi*hz(ch[0]-12)*t)*0.6        # soft root
    a=np.minimum(1,t/2.2)*np.minimum(1,(seg-t)/2.2)+0.0
    s0=int(k*seg*SR); s1=min(N,s0+len(t)); pad[s0:s1]+=(y*a)[:s1-s0]
# overlap crossfade gives continuous bed; tame it
pad=lp(pad,1100,4); pad/=np.abs(pad).max()+1e-9
# ---------- sfx kit
@lru_cache(None)
def whoosh(d=.55):
    n=int(d*SR); x=rng.standard_normal(n); tt=np.arange(n)/SR; y=np.zeros(n); B=1024
    for i in range(0,n,B):
        f=250+3000*np.sin(np.pi*i/n)**2; y[i:i+B]=bp(x[max(0,i-2048):i+B],f*.6,min(f*1.7,16000))[-len(y[i:i+B]):]
    return y*np.sin(np.pi*tt/d)**2
@lru_cache(None)
def riser(d=1.4):
    n=int(d*SR); tt=np.arange(n)/SR; f=200+1800*(tt/d)**2
    return (hp(rng.standard_normal(n),1500)*0.5+np.sin(2*np.pi*np.cumsum(f)/SR)*0.3)*(tt/d)**2
@lru_cache(None)
def pop():
    n=int(.09*SR); tt=np.arange(n)/SR; return np.sin(2*np.pi*(500+2200*tt)*tt)*env(n,.002,.03)
@lru_cache(None)
def hit():
    n=int(1.2*SR); tt=np.arange(n)/SR
    return (np.sin(2*np.pi*55*tt)*env(n,.003,.35)*0.9+lp(rng.standard_normal(n),900)*env(n,.001,.08)*0.6)
sfx=np.zeros(N)
def put(x,t,g):
    s=int(t*SR); e=min(N,s+len(x)); 
    if s<N and s>=0: sfx[s:e]+=x[:e-s]*g
for c in S['cards']:
    kinds={e['type'] for e in c['els']}
    if 'map' in kinds: put(riser(),c['t0']-1.3,0.35); put(hit(),c['t0'],0.5)
    elif c.get('nopill'): put(hit(),c['t0'],0.45); put(whoosh(.5),c['t0']-0.25,0.35)   # rule title cards
    else: put(whoosh(),c['t0']-0.3,0.4)
    for e in c['els']:
        if e['type'] in ('pill','num','dot'): put(pop(),e['at'],0.22)
for o in S['overlays']:
    for e in o['els']:
        if e['type'] in ('pill','text') : put(pop(),e['at'],0.14)
for ch in S['chapters']: put(whoosh(.35),ch['t']-0.15,0.18)
put(hit(),S['end']['t0'],0.5)
# ---------- dialog + ducking
sr,dlg=wavfile.read(f'{ROOT}/work/mix/dialog.wav'); dlg=np.pad(dlg.astype(np.float64),(0,max(0,N-len(dlg))))[:N]
w=int(0.05*SR); e=np.sqrt(mavg(dlg**2,w))
act=mavg((e>0.01).astype(float),.4*SR)   # smoothed voice activity
db=lambda x: 10**(x/20)
tt=np.arange(N)/SR
hook=(tt<S['cards'][0]['t1']).astype(float)            # louder bed through the hook
endz=(tt>=S['end']['t0']).astype(float)
base=np.where(hook>0,-14,-21)+np.where(endz>0,8,0)     # pad level relative to full-scale pad (tuned to sit ~20 dB under voice in body)
gain=mavg(db(base-4*act),.3*SR)
fade=np.minimum(1,tt/1.5)*np.minimum(1,np.maximum(0,(DUR-tt)/2.5))
music=pad*gain*fade
mixL=dlg+music*0.9+sfx*db(-14); mixR=dlg+music*1.0+sfx*db(-14)
mix=np.stack([mixL,mixR],1); mix/=max(1.0,np.abs(mix).max()/0.98)
wavfile.write(f'{ROOT}/work/mix/mix.wav',SR,mix.astype(np.float32))
def rms(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-12)
body=(tt>40)&(tt<550); sp=body&(act>0.9)
print(f'voice {rms(dlg[sp]):.1f} dBFS, music under voice {rms(music[sp]):.1f} dBFS -> {rms(dlg[sp])-rms(music[sp]):.1f} dB below; hook music {rms(music[(tt>2)&(tt<16)]):.1f}')
