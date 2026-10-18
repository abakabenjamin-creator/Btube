"""Grade Mixkit B-roll for each BROLL beat into a 30 fps frame sequence.

Clips are scaled to cover 1920x1080, graded to sit beside the Glass UI void
(deep blacks, warm highlights, restrained saturation, soft vignette) and
joined with a 0.4 s blur dissolve: no hard cuts inside a segment. Each
sequence carries a 0.35 s handle on both ends for the beat transitions.
usage: python3 prep_broll.py <broll_src_dir> <out_dir>
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
HANDLE = 0.35
XF = 0.4
GRADE = ("eq=contrast=1.08:saturation=0.82:brightness=-0.025,"
         "curves=all='0/0 0.12/0.06 0.5/0.47 0.86/0.88 1/0.97',"
         "colorbalance=rs=-0.02:bs=0.03:rh=0.05:gh=0.02:bh=-0.04,"
         "vignette=PI/5")


def main(src, out):
    beats = json.load(open(os.path.join(HERE, "beats.json")))["beats"]
    for b in beats:
        if b["type"] != "BROLL":
            continue
        d = os.path.join(out, b["id"])
        os.makedirs(d, exist_ok=True)
        clips = b["clips"]
        ins, chains = [], []
        for i, (cid, a, dur) in enumerate(clips):
            pre = HANDLE if i == 0 else XF / 2
            post = HANDLE if i == len(clips) - 1 else XF / 2
            ins += ["-ss", f"{a - pre:.3f}", "-t", f"{dur + pre + post:.3f}", "-i", os.path.join(src, cid + ".mp4")]
            chains.append(f"[{i}:v]fps=30,scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,"
                          f"crop=1920:1080,setsar=1,{GRADE},format=yuv420p,settb=1/30,setpts=PTS-STARTPTS[v{i}]")
        last, off = "v0", 0.0
        for i in range(1, len(clips)):
            prev = clips[i - 1]
            off += prev[2] + (HANDLE if i == 1 else XF / 2) + XF / 2 - XF
            chains.append(f"[{last}][v{i}]xfade=transition=hblur:duration={XF}:offset={off:.3f}[x{i}]")
            last = f"x{i}"
        n0 = round((b["t0"] - HANDLE) * 30)
        cmd = ["ffmpeg", "-v", "error", "-y"] + ins + ["-filter_complex", ";".join(chains), "-map", f"[{last}]",
               "-q:v", "2", "-start_number", str(n0), os.path.join(d, "%06d.jpg")]
        subprocess.run(cmd, check=True)
        print(b["id"], len(os.listdir(d)), "frames from", n0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
