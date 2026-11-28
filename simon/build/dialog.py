"""Dialogue track: every script line from its source, placed on the timeline, each source level-matched
(-16 LUFS speech) so presenter and voiceover sit at the same loudness. -> work/dialog.wav (48k mono)"""
import json, subprocess, numpy as np
ROOT='/home/user/Btube/simon'; SR=48000
E=json.load(open(f'{ROOT}/build/edl.json')); N=int((E['duration']+1)*SR); out=np.zeros(N)
FILES={'P':'src/simon_main.mp4','S':'src/money_while_you_sleep.mp4','V':'src/vo_slow.wav'}
GAIN={}
def load(f):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'{ROOT}/{f}','-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True).stdout,np.int16).astype(float)/32768
A={k:load(f) for k,f in FILES.items()}
# voiceover -> presenter sound: matched EQ (less boxy, brighter) + gentle gate so its hiss sits at the presenter's floor
from scipy.signal import fftconvolve
from scipy.ndimage import uniform_filter1d
v=fftconvolve(A['V'],np.load(f'{ROOT}/work/vo_eq.npy'),'same')
env=np.sqrt(uniform_filter1d(v**2,int(0.02*SR)))+1e-9; db=20*np.log10(env)
g=np.clip((db+52)/8,0,1)            # below -60 dBFS fully gated by 8 dB, above -52 untouched
g=10**((-8*(1-g))/20); g=uniform_filter1d(g,int(0.03*SR))
A['V']=v*g
def crest(x):
    n=int(0.05*SR); fr=x[:len(x)//n*n].reshape(-1,n); e=np.sqrt((fr**2).mean(1)); a=e[e>np.percentile(e,30)]
    return 20*np.log10(np.percentile(np.abs(x),99.9)/np.sqrt(np.mean(a**2)))
def comp(x, ratio, thr_db):
    env=np.sqrt(uniform_filter1d(x**2,int(0.010*SR)))+1e-9; db=20*np.log10(env)
    over=np.maximum(0,db-thr_db); gr=-over*(1-1/ratio)
    gr=uniform_filter1d(gr,int(0.04*SR))          # smooth attack/release
    return x*10**(gr/20)
# voiceover dynamics -> the presenter's: compress until its crest factor matches
target=crest(A['P']); vr=A['V']; ref_db=20*np.log10(np.sqrt(np.mean(vr[np.abs(vr)>0.01]**2)))
for ratio in np.arange(1.2,6.01,0.2):
    y=comp(vr,ratio,ref_db+2)
    if crest(y)<=target+0.1: break
A['V']=y; print('VO compressor ratio %.1f, crest %.1f dB (presenter %.1f)'%(ratio,crest(y),target))
def act_rms(x):
    n=int(0.05*SR); fr=x[:len(x)//n*n].reshape(-1,n); e=np.sqrt((fr**2).mean(1)); return np.sqrt(np.mean(e[e>np.percentile(e,50)]**2))
def lufs(f): 
    r=subprocess.run(['ffmpeg','-nostats','-i',f'{ROOT}/{f}','-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
    return float([l for l in r.split('\n') if l.strip().startswith('I:')][-1].split()[1])
for k,f in FILES.items(): GAIN[k]=10**((-16-lufs(f))/20)
GAIN['V']=GAIN['P']*act_rms(A['P'])/act_rms(A['V'])   # same speech level as the presenter
P_=E['pieces']; F=int(0.06*SR)
SWORDS={'P':json.load(open(f'{ROOT}/src/p2_words.json')),'S':json.load(open(f'{ROOT}/src/p1_words.json')),
        'V':[dict(w=w['text'],s=w['start_time'],e=w['end_time']) for w in json.load(open(f'{ROOT}/src/vo_words_slow.json'))]}
pres=np.zeros(N)                                    # where the presenter's own audio (and room) is playing
def ramp(n,up): return np.linspace(0,1,n) if up else np.linspace(1,0,n)
for k,p in enumerate(P_):
    prev=P_[k-1] if k else None; nxt=P_[k+1] if k+1<len(P_) else None
    pend=lambda q: q['start']+q['out']-q['in_']
    cont_prev=prev is not None and prev['src']==p['src'] and abs(pend(prev)-p['start'])<1e-3 and abs(prev['out']-p['in_'])<1e-3
    cont_next=nxt is not None and nxt['src']==p['src'] and abs(pend(p)-nxt['start'])<1e-3 and abs(p['out']-nxt['in_'])<1e-3
    h0=h1=0.0
    if True:   # every source: real breath/room audio runs into the gaps beside the line (voiceover tails finish naturally)
        # voiceover lines own the whole pause after them (their last word rings on ~0.3 s); presenter lines yield it
        if prev is not None and not cont_prev:
            g=p['start']-pend(prev); h0=0 if prev['src']=='V' else (g/2 if p['src']!='V' else 0.08)
        if nxt is not None and not cont_next:
            g=nxt['start']-pend(p); h1=g if p['src']=='V' else (g/2 if nxt['src']!='V' else 0)
        h0=min(h0,p['in_']); h1=max(0.0,min(h1,len(A[p['src']])/SR-p['out']))
        SWd=SWORDS[p['src']]   # never let a handle reach into another line's words
        pe=[w['e'] for w in SWd if w['e']<=p['in_']+0.02]; ns=[w['s'] for w in SWd if w['s']>=p['out']-0.02]
        if pe: h0=max(0.0,min(h0,p['in_']-(pe[-1]+0.08)))
        if ns: h1=max(0.0,min(h1,(ns[0]-0.08)-p['out']))
    a=int((p['in_']-h0)*SR); b=int((p['out']+h1)*SR); seg=A[p['src']][a:b]*GAIN[p['src']]
    r=np.ones(len(seg))
    if not cont_prev: r[:F]=ramp(F,1)
    if not cont_next: r[-F:]=ramp(F,0)
    seg=seg*r; s0=int((p['start']-h0)*SR); out[s0:s0+len(seg)]+=seg
    if p['src']!='V': pres[s0:s0+len(seg)]=np.maximum(pres[s0:s0+len(seg)],r)
# continuous room tone from the presenter's own set, under everything he isn't speaking over (no dead-silent gaps)
x=A['P']; n=int(0.05*SR); fr=x[:len(x)//n*n].reshape(-1,n); e=np.sqrt((fr**2).mean(1))
quiet=[fr[i] for i in np.argsort(e) if e[i]>1e-5][:120]
L=len(quiet[0]); xf=int(0.02*SR); tone=quiet[0].copy()
for q in quiet[1:]:
    tone[-xf:]=tone[-xf:]*np.linspace(1,0,xf)+q[:xf]*np.linspace(0,1,xf); tone=np.concatenate([tone,q[xf:]])
tone=np.tile(tone,int(np.ceil(N/len(tone))))[:N]*GAIN['P']
mask=1-uniform_filter1d(pres,int(0.08*SR))
out+=tone*mask
print('room tone %.1f dBFS'%(20*np.log10(np.sqrt(np.mean(tone**2))+1e-12)))
from scipy.io import wavfile
out=np.clip(out,-0.99,0.99); wavfile.write(f'{ROOT}/work/dialog.wav',SR,(out*32767).astype(np.int16))
print('gains dB',{k:round(20*np.log10(v),1) for k,v in GAIN.items()}, 'len',round(len(out)/SR,1))
