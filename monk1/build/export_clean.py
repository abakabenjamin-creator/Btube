# Render each kept segment with frame-accurate seek, then losslessly concat.
import json, subprocess, sys, os
e=json.load(open(sys.argv[1])); src=sys.argv[2]; out=sys.argv[3]; tmp=os.path.join(os.path.dirname(out) or '.', 'work', 'segs'); os.makedirs(tmp,exist_ok=True)
parts=[]
for i,s in enumerate(e['segments']):
    d=s['out']-s['in']; p=f"{tmp}/seg{i}.mp4"; parts.append(p)
    subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{s['in']:.3f}","-i",src,"-t",f"{d:.3f}",
      "-vf",f"crop={e['crop']},scale=1920:1080:flags=lanczos,fps=30,setsar=1",
      "-af",f"afade=t=in:d=0.02,afade=t=out:st={d-0.03:.3f}:d=0.03",
      "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-ar","48000",p],check=True)
open(f"{tmp}/list.txt","w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in parts))
subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",f"{tmp}/list.txt","-c","copy","-movflags","+faststart",out],check=True)
