# Cut stock-footage-only clips from monk1_clean.mp4 at exact shot boundaries -> stock_clips/ (+ review/)
import json, csv, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from stock_catalog import STOCK
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=json.load(open(f"{root}/build/shots_clean.json")); src=f"{root}/monk1_clean.mp4"
out=f"{root}/stock_clips"; os.makedirs(f"{out}/review",exist_ok=True)
F=1/30  # one frame inset each side so the neighbouring shot never flashes in
def tc(t): return f"{int(t//60):02d}:{t%60:06.3f}"
ordered=sorted(STOCK,key=lambda c:S[c[0][0]]['start'])
rows=[]; n=0
for ids,slug,what,mood,kw,folder,note in ordered:
    n+=1; a=S[ids[0]]['start']+F; b=S[ids[-1]]['end']-F; d=b-a
    fn=f"monk1_stock_{n:03d}_{slug}.mp4"; rel=fn if folder=="keep" else f"review/{fn}"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{a:.3f}","-i",src,"-t",f"{d:.3f}","-an","-c:v","libx264","-preset","medium",
                    "-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",f"{out}/{rel}"],check=True)
    rows.append({"file":rel,"start":tc(a),"end":tc(b),"length":f"{d:.2f}","what's in it":what,"mood":mood,
                 "search keywords":kw,"status":"saved" if folder=="keep" else "review","note":note})
with open(f"{out}/index.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
print(sum(r['status']=='saved' for r in rows),"saved,",sum(r['status']=='review' for r in rows),"review")
