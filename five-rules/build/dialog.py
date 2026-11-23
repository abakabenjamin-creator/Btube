"""Assemble the dialogue track (48 kHz mono float WAV) from build/edl.json."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR=48000
E=json.load(open(f'{ROOT}/build/edl.json'))
def load(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-vn','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32)
SRC={'P':load(f'{ROOT}/src/aroll.mp4'),'V':load(f'{ROOT}/src/vo.wav')}
out=np.zeros(int(E['duration']*SR),np.float32); f=int(0.012*SR)
for p in E['pieces']:
    x=SRC[p['src']][int(p['in']*SR):int(p['out']*SR)].copy()
    x[:f]*=np.linspace(0,1,f); x[-f:]*=np.linspace(1,0,f)
    s=int(p['start']*SR); out[s:s+len(x)]+=x
os.makedirs(f'{ROOT}/work/mix',exist_ok=True)
wavfile.write(f'{ROOT}/work/mix/dialog.wav',SR,out)
print('dialog',len(out)/SR,'s')
