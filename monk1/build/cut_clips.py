# Cut every catalogued cutaway from monk1_clean.mp4 into clips/ and write clips/index.csv
import json, csv, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from clip_catalog import CLIPS
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=json.load(open(f"{root}/build/shots_clean.json")); src=f"{root}/monk1_clean.mp4"; out=f"{root}/clips"; os.makedirs(out,exist_ok=True)
F=1/30  # trim one frame each side so no neighbouring shot flashes in
rows=[]
def tc(t): return f"{int(t//60):02d}:{t%60:06.3f}"
for n,(ids,slug,what,mood,roles,looks,typ) in enumerate(CLIPS,1):
    a=S[ids[0]]['start']+F; b=S[ids[-1]]['end']-F; d=b-a
    fn=f"monk1_{n:03d}_{slug}.mp4"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{a:.3f}","-i",src,"-t",f"{d:.3f}","-c:v","libx264","-preset","medium","-crf","18",
                    "-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart",f"{out}/{fn}"],check=True)
    rows.append({"file":fn,"start":tc(a),"end":tc(b),"length":f"{d:.2f}","what's in it":what,"mood":mood,"roles":roles,
                 "stock or own filming":looks,"type":typ})
with open(f"{out}/index.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
print(len(rows),"clips")
