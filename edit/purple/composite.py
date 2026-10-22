"""Stage 4 + 6 (picture): cut timeline, presenter framing, PiP, light leaks, grade.

For every output frame n (30 fps) the source time is timeline[n]. Presenter
beats: the source frame is framed (Wide / Medium / Tight, jump cuts at removed
pauses, face kept on the upper-third line), graded, and the graphics PNG is
laid over it. Web beats: the graphics JPEG plus the presenter in the PiP.
Card beats: the graphics JPEG. Section changes into a card get a violet
light-leak flash.

usage: python3 composite.py <source.mp4> <graphics_frames> <out_dir> [workers]
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
W, H, FPS, SRC_FPS = 1920, 1080, 30, 25
PLAN = json.load(open(os.path.join(HERE, "plan.json")))
TL = json.load(open(os.path.join(HERE, "timeline.json")))
BEATS = PLAN["beats"]
FACE = (915.0, 385.0)
PIP = PLAN["pip"]
PIP_CROP = (615, 100, 1215, 900)   # 3:4 portrait around the face, hands out of shot

E_inOut = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
clamp = lambda x, a=0.0, b=1.0: min(b, max(a, x))

# warm, slightly lifted blacks
_x = np.arange(256, dtype=np.float32)
_base = 10 + _x * (245 - 10) / 255
LUT = np.stack([np.clip(_base * 0.975, 0, 255), np.clip(_base * 1.0, 0, 255), np.clip(_base * 1.03 + 2, 0, 255)], 1).astype(np.uint8)


def grade(img):
    out = cv2.LUT(img, LUT.reshape(256, 1, 3))
    return cv2.GaussianBlur(out, (0, 0), 0.6)  # a touch soft


def beat_at(t):
    for b in BEATS:
        if b["t0"] <= t < b["t1"]:
            return b
    return BEATS[-1]


def scale_at(t):
    """Framing scale at source time t, plus a slow push-in drift (+0.17 %/s,
    capped at 1.2 %) that ramps up during holds and eases away during moves."""
    keys = PLAN["framing"]
    s, hold_from, drift = keys[0][1], 0.0, 0.0
    for (ta, sa, _), (tb, sb, e) in zip(keys, keys[1:]):
        moving = e != "cut" and abs(sb - sa) > 1e-6
        if t >= tb:
            s = sb
            hold_from = tb if (moving or e == "cut") else hold_from
            continue
        if ta <= t < tb:
            if e == "cut" or not moving:
                s = sa
                drift = min(0.012, 0.0017 * (t - hold_from))
            else:
                q = E_inOut((t - ta) / max(1e-3, tb - ta))
                s = math.exp(math.log(sa) + (math.log(sb) - math.log(sa)) * q)
                drift = min(0.012, 0.0017 * (ta - hold_from)) * (1 - q)
            return s * (1 + drift)
    return s * (1 + min(0.012, 0.0017 * (t - hold_from)))


class Source:
    def __init__(self, path, t_start):
        self.k0 = max(0, int(t_start * SRC_FPS) - 5)
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{self.k0 / SRC_FPS:.3f}", "-i", path, "-f", "rawvideo",
                                   "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, bufsize=10 ** 8)
        self.next, self.cur = self.k0, None

    def frame(self, t):
        k = max(self.k0, int(round(t * SRC_FPS)))
        while self.next <= k:
            b = self.p.stdout.read(W * H * 3)
            if len(b) < W * H * 3:
                break
            self.cur = np.frombuffer(b, np.uint8).reshape(H, W, 3)
            self.next += 1
        return self.cur


def presenter(f, t):
    s = scale_at(t)
    fx = FACE[0] + (960 - FACE[0]) * clamp((s - 1) / 0.32)   # reframe toward centre as we push in
    fy = FACE[1]                                             # eyes stay on the upper-third line
    M = np.float32([[s, 0, fx - s * FACE[0]], [0, s, fy - s * FACE[1]]])
    return grade(cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT))


def rounded(w, h, r):
    m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(m, (0, r), (w - 1, h - r - 1), 255, -1)
    for cx, cy in ((r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)):
        cv2.circle(m, (cx, cy), r, 255, -1, cv2.LINE_AA)
    return m.astype(np.float32)[..., None] / 255


PIP_MASK = rounded(PIP["w"], PIP["h"], 12)
_inner = rounded(PIP["w"] - 4, PIP["h"] - 4, 10)
PIP_LINE = PIP_MASK.copy()
PIP_LINE[2:-2, 2:-2] -= _inner
PIP_LINE = np.clip(PIP_LINE, 0, 1) * 0.85


def pip(base, f):
    x0, y0, x1, y1 = PIP_CROP
    clip = cv2.resize(grade(f[y0:y1, x0:x1]), (PIP["w"], PIP["h"]), interpolation=cv2.INTER_AREA).astype(np.float32)
    x, y = PIP["x"], PIP["y"]
    roi = base[y:y + PIP["h"], x:x + PIP["w"]].astype(np.float32)
    roi = clip * PIP_MASK + roi * (1 - PIP_MASK)
    roi = 255 * PIP_LINE + roi * (1 - PIP_LINE)   # thin white inner line
    base[y:y + PIP["h"], x:x + PIP["w"]] = roi.astype(np.uint8)
    return base


# violet light leak: a soft streak that sweeps across while the frame flashes violet
_xs = np.linspace(-1, 1, W, dtype=np.float32)
_ys = np.linspace(-1, 1, H, dtype=np.float32)[:, None]
VIOLET = np.array([248, 72, 240], np.float32)  # BGR of #F048F8


def light_leak(img, p):
    pos = -1.4 + 2.8 * p
    band = np.exp(-((_xs[None, :] + 0.35 * _ys - pos) ** 2) / 0.08)
    glow = np.exp(-(_xs[None, :] ** 2 + _ys ** 2) / 1.2) * 0.35
    k = (math.sin(math.pi * p) * (band * 0.9 + glow))[..., None]
    out = img.astype(np.float32)
    leak = VIOLET * k
    out = 255 - (255 - out) * (1 - leak / 255)          # screen blend
    return np.clip(out, 0, 255).astype(np.uint8)


# output frame indices where a card begins (section change)
CARD_STARTS = []
for b in BEATS:
    if b["layout"] == "CARD":
        CARD_STARTS.append(next(i for i, t in enumerate(TL) if t >= b["t0"] - 1e-6))


def render(src, gdir, n):
    t = TL[n]
    b = beat_at(t)
    png, jpg = os.path.join(gdir, f"{n:06d}.png"), os.path.join(gdir, f"{n:06d}.jpg")
    if b["layout"] == "P":
        img = presenter(src.frame(t), t)
        g = cv2.imread(png, cv2.IMREAD_UNCHANGED)
        a = g[..., 3:4].astype(np.float32) / 255
        img = (g[..., :3] * a + img * (1 - a)).astype(np.uint8)
    else:
        img = cv2.imread(jpg)
        if b["layout"] == "WEB":
            img = pip(img, src.frame(t))
    for c in CARD_STARTS:  # ~350 ms light leak centred on the cut into each card
        if c - 5 <= n < c + 6:
            img = light_leak(img, (n - (c - 5)) / 11)
    fade = min(1.0, n / 6, (len(TL) - 1 - n) / 15)
    if fade < 1:
        img = (img * max(0.0, fade)).astype(np.uint8)
    return img


def work(job):
    idx, n0, n1, src_path, gdir, out = job
    src = Source(src_path, TL[n0])
    path = os.path.join(out, f"chunk_{idx:02d}.mp4")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                            "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", path], stdin=subprocess.PIPE)
    for n in range(n0, n1):
        enc.stdin.write(render(src, gdir, n).tobytes())
        if (n - n0) % 500 == 0:
            print(f"chunk {idx}: {n - n0}/{n1 - n0}", flush=True)
    enc.stdin.close()
    enc.wait()
    src.p.kill()
    return path


def main():
    src, gdir, out = sys.argv[1:4]
    workers = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    os.makedirs(out, exist_ok=True)
    N = len(TL)
    step = math.ceil(N / workers)
    jobs = [(i, a, min(a + step, N), src, gdir, out) for i, a in enumerate(range(0, N, step))]
    with Pool(len(jobs)) as pool:
        paths = pool.map(work, jobs)
    with open(os.path.join(out, "chunks.txt"), "w") as f:
        f.writelines(f"file '{os.path.basename(p)}'\n" for p in paths)
    print("done")


if __name__ == "__main__":
    main()
