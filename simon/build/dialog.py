"""Dialogue track: every script line from its source, placed on the timeline, each source level-matched
(-16 LUFS speech) so presenter and voiceover sit at the same loudness. -> work/dialog.wav (48k mono)"""
import json, subprocess, numpy as np
ROOT='/home/user/Btube/simon'; SR=48000
E=json.load(open(f'{ROOT}/build/edl.json')); N=int((E['duration']+1)*SR); out=np.zeros(N)
FILES={'P':'src/simon_main.mp4','S':'src/money_while_you_sleep.mp4','V':'src/vo_drrep.wav'}
GAIN={}
def load(f):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'{ROOT}/{f}','-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True).stdout,np.int16).astype(float)/32768
A={k:load(f) for k,f in FILES.items()}
def lufs(f): 
    r=subprocess.run(['ffmpeg','-nostats','-i',f'{ROOT}/{f}','-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
    return float([l for l in r.split('\n') if l.strip().startswith('I:')][-1].split()[1])
for k,f in FILES.items(): GAIN[k]=10**((-16-lufs(f))/20)
fade=int(0.012*SR)
for p in E['pieces']:
    a=int(p['in_']*SR); b=int(p['out']*SR); seg=A[p['src']][a:b]*GAIN[p['src']]
    r=np.ones(len(seg)); r[:fade]=np.linspace(0,1,fade); r[-fade:]=np.linspace(1,0,fade); seg=seg*r
    s=int(p['start']*SR); out[s:s+len(seg)]+=seg
from scipy.io import wavfile
out=np.clip(out,-0.99,0.99); wavfile.write(f'{ROOT}/work/dialog.wav',SR,(out*32767).astype(np.int16))
print('gains dB',{k:round(20*np.log10(v),1) for k,v in GAIN.items()}, 'len',round(len(out)/SR,1))
