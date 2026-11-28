"""Picture for the Monk-style edit.

Per output frame (30 fps): presenter shots come from the HeyGen clips (front
angle F, side angle S) with Monk-style framing (wide/medium alternating on
sentence boundaries, push-ins on key lines); voiceover shots are graded stock
B-roll with a slow push; graphic shots are the rendered pastel cards. The
graphics layer (section pill, captions, side lists, branding) goes on top.
Shot changes are hard cuts on presenter jump cuts and quick 6-frame dissolves
elsewhere, as in the reference.

usage: python3 composite.py <hg_dir> <broll_dir> <gfx_frames> <out_dir> [workers [first last]]
OUT_SCALE=2 -> 3840x2160 HEVC master (gfx rendered with render.js --dsf 2)
"""
import json
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
K = int(os.environ.get("OUT_SCALE", "1"))
SW, SH = 1920, 1080
W, H, FPS = SW * K, SH * K, 30
PLAN = json.load(open(os.path.join(HERE, "plan.json")))
SHOTS = PLAN["shots"]
FACE = {"F": (900.0, 330.0), "S": (900.0, 330.0)}
SRC = {"F": "steps.mp4", "S": "julia.mp4"}
XF = 6  # dissolve frames

E_inOut = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
E_out = lambda x: 1 - (1 - x) ** 3
clamp = lambda x, a=0.0, b=1.0: min(b, max(a, x))

# gentle warm grade so stock and avatar footage sit together
_x = np.arange(256, dtype=np.float32)
_b = 6 + _x * (248 - 6) / 255
LUT = np.stack([np.clip(_b * 0.985, 0, 255), _b, np.clip(_b * 1.02 + 1, 0, 255)], 1).astype(np.uint8).reshape(256, 1, 3)


class Reader:
    """Sequential reader of a clip from time a (seconds) at the clip's own fps."""

    def __init__(self, path, a, size=None):
        fps = eval(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=r_frame_rate",
                                   "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())
        self.fps = fps
        vf = "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1"
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{max(0, a):.3f}", "-i", path, "-vf", vf, "-f", "rawvideo",
                                   "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, bufsize=10 ** 8)
        self.a, self.k, self.cur = a, -1, None

    def at(self, t):  # t seconds after a
        want = int(t * self.fps + 1e-6)
        while self.k < want:
            b = self.p.stdout.read(SW * SH * 3)
            if len(b) < SW * SH * 3:
                break
            self.cur = np.frombuffer(b, np.uint8).reshape(SH, SW, 3)
            self.k += 1
        return self.cur

    def close(self):
        self.p.kill()


def framing(sh, t):
    """Presenter scale: alternate medium / tight per sentence (jump cut), push-in on key lines."""
    k = int((t - sh["t0"]) // 4.5)                 # change framing about every 4.5 s
    base = (1.0, 1.12, 1.05)[(k + int(sh["t0"])) % 3]
    s = base * (1 + 0.004 * ((t - sh["t0"]) % 4.5))   # slow drift inside each framing
    for p in PLAN["pushes"]:
        if p - 0.6 <= t <= p + 3.6:
            q = E_inOut(clamp((t - (p - 0.6)) / 0.6)) * (1 - E_inOut(clamp((t - (p + 3.0)) / 0.6)))
            s = s * (1 - q) + 1.22 * q
    return s


def presenter(img, s, src):
    fx, fy = FACE[src]
    M = np.float32([[s, 0, fx - s * fx], [0, s, fy - s * fy]]) * K
    flags = cv2.INTER_LANCZOS4 if K > 1 else cv2.INTER_LINEAR
    return cv2.LUT(cv2.warpAffine(img, M, (W, H), flags=flags, borderMode=cv2.BORDER_REFLECT), LUT)


def broll(img, sh, t):
    p = clamp((t - sh["t0"]) / max(0.1, sh["t1"] - sh["t0"]))
    s = 1.0 + 0.07 * p
    M = np.float32([[s, 0, SW / 2 * (1 - s)], [0, s, SH / 2 * (1 - s)]]) * K
    out = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    out = cv2.LUT(out, LUT)
    # slight darken at the bottom so captions read (Monk's b-roll captions sit low)
    return out


VIG = None


def lower_shade(img):
    global VIG
    if VIG is None:
        y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
        VIG = 1 - 0.38 * np.clip((y - 0.62) / 0.38, 0, 1) ** 1.6
    return (img * VIG).astype(np.uint8)


class Ctx:
    def __init__(self, hg, br, gfx):
        self.hg, self.br, self.gfx = hg, br, gfx
        self.readers = {}

    def shot_img(self, sh, t):
        key = id(sh)
        if sh["kind"] == "G":
            return None
        if key not in self.readers:
            for k in list(self.readers):
                if k != key and len(self.readers) > 2:
                    self.readers.pop(k)[0].close()
            if sh["kind"] == "P":
                r = Reader(os.path.join(self.hg, SRC[sh["ref"]]), sh["a0"] + (t - sh["t0"]))
                self.readers[key] = (r, t)
            else:
                r = Reader(os.path.join(self.br, sh["ref"] + ".mp4"), sh["inp"] + (t - sh["t0"]))
                self.readers[key] = (r, t)
        r, tstart = self.readers[key]
        img = r.at(t - tstart)
        if sh["kind"] == "P":
            return presenter(img, framing(sh, t), sh["ref"])
        return lower_shade(broll(img, sh, t))


def gfx(gdir, n):
    png, jpg = os.path.join(gdir, f"{n:06d}.png"), os.path.join(gdir, f"{n:06d}.jpg")
    if os.path.exists(png):
        return cv2.imread(png, cv2.IMREAD_UNCHANGED)
    return cv2.imread(jpg)


def compose(ctx, n):
    t = n / FPS
    i = next((k for k, s in enumerate(SHOTS) if s["t0"] <= t < s["t1"]), None)
    if i is None:  # in a gap between pieces: hold the previous shot
        i = max(k for k, s in enumerate(SHOTS) if s["t0"] <= t)
    sh = SHOTS[i]
    g = gfx(ctx.gfx, n)
    if sh["kind"] == "G":
        img = g[..., :3] if g.shape[2] == 4 else g
    else:
        img = ctx.shot_img(sh, t)
        if g is not None and g.shape[2] == 4:
            a = g[..., 3:4].astype(np.float32) / 255
            img = (g[..., :3] * a + img * (1 - a)).astype(np.uint8)
    # dissolve from the previous shot unless both are presenter (those are jump cuts)
    if i > 0:
        prev = SHOTS[i - 1]
        k = n - int(round(sh["t0"] * FPS))
        if 0 <= k < XF and not (prev["kind"] == "P" and sh["kind"] == "P"):
            pimg = ctx.last if ctx.last is not None else img
            q = (k + 1) / (XF + 1)
            img = cv2.addWeighted(pimg, 1 - q, img, q, 0)
            return img
    ctx.last = img
    fade = min(1.0, n / 8, (PLAN["frames"] - 1 - n) / 15)
    return img if fade >= 1 else (img * max(0.0, fade)).astype(np.uint8)


def work(job):
    idx, n0, n1, hg, br, gdir, out = job
    ctx = Ctx(hg, br, gdir)
    ctx.last = None
    path = os.path.join(out, f"chunk_{n0:06d}.mp4")
    vcodec = (["-c:v", "libx265", "-preset", "fast", "-b:v", os.environ.get("VBITRATE", "6800k"), "-tag:v", "hvc1",
               "-x265-params", "vbv-maxrate=10000:vbv-bufsize=20000:log-level=error"] if K > 1 else ["-c:v", "libx264", "-preset", "medium", "-crf", "18"])
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", *vcodec, "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", path], stdin=subprocess.PIPE)
    for n in range(n0, n1):
        enc.stdin.write(compose(ctx, n).tobytes())
        if (n - n0) % 600 == 0:
            print(f"chunk {idx}: {n - n0}/{n1 - n0}", flush=True)
    enc.stdin.close()
    enc.wait()
    for r, _ in ctx.readers.values():
        r.close()
    return path


def main():
    hg, br, gdir, out = sys.argv[1:5]
    workers = int(sys.argv[5]) if len(sys.argv) > 5 else 4
    first = int(sys.argv[6]) if len(sys.argv) > 7 else 0
    N = int(sys.argv[7]) if len(sys.argv) > 7 else PLAN["frames"]
    os.makedirs(out, exist_ok=True)
    step = math.ceil((N - first) / workers)
    jobs = [(i, a, min(a + step, N), hg, br, gdir, out) for i, a in enumerate(range(first, N, step))]
    with Pool(len(jobs)) as pool:
        pool.map(work, jobs)
    print("done")


if __name__ == "__main__":
    main()
