"""Role 4 + 7: assemble the final picture from the beat sheet.

Layers per output frame (30 fps, output time == source time):
  AVATAR_*        source presenter frame with the beat's camera keys (zoom
                  anchored on the face), side-slide for CALC / PHONE_DEMO,
                  plus the beat's transparent overlay frame on top.
  AVATAR_FRAMED   light grid board + framed portrait card on the right.
  GLASS_UI        pre-rendered scene frames (scenes/render.js).
  BROLL           graded B-roll frames (prep_broll.py) with a slow push-in.
Beat boundaries get the beat's transition (whip / focus / zoom / blur);
consecutive presenter beats share one continuous shot and need none.

usage: python3 composite.py <source.mp4> <scene_frames> <broll_frames> <out_dir> [workers] [t0 t1]
Writes video-only chunks to <out_dir>/chunk_XX.mp4 and a concat list.
"""
import json
import math
import os
import subprocess
import sys
from collections import OrderedDict
from multiprocessing import Pool

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, SRC_FPS = 1920, 1080, 30, 25
DATA = json.load(open(os.path.join(HERE, "beats.json")))
BEATS = DATA["beats"]
DUR = DATA["duration"]
FACE = DATA["face"]
AVATAR = {"AVATAR_TALK", "AVATAR_PUSH", "AVATAR_CALC", "AVATAR_PHONE_DEMO"}
SLIDE_X = 0.35 * W
TRANS_H = {"whip": 0.15, "focus": 0.25, "zoom": 0.25, "blur": 0.25}

E_outExpo = lambda x: 1.0 if x >= 1 else 1 - 2 ** (-10 * x)
E_inOut = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
clamp = lambda x, a=0.0, b=1.0: min(b, max(a, x))


def prog(t, t0, d, e=E_outExpo):
    return e(clamp((t - t0) / d))


def fast_blur(img, sigma):
    """Large gaussian blur via downscale -> blur -> upscale."""
    if sigma < 0.6:
        return img
    f = 4 if sigma > 6 else 2
    small = cv2.resize(img, (W // f, H // f), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / f)
    return cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)


def over(dst, rgba):
    a = rgba[..., 3:4].astype(np.float32) * (1 / 255.0)
    if not a.any():
        return dst
    return (rgba[..., :3].astype(np.float32) * a + dst.astype(np.float32) * (1 - a)).astype(np.uint8)


# ----------------------------------------------------------------- source
class Source:
    """Forward reader of the 25 fps presenter source with a small cache."""

    def __init__(self, path, t_start):
        self.path = path
        self.k0 = max(0, int(t_start * SRC_FPS) - 30)
        self.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{self.k0 / SRC_FPS:.3f}", "-i", path,
                                   "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, bufsize=10 ** 8)
        self.next = self.k0
        self.cache = OrderedDict()
        self.last = None

    def frame(self, t):
        k = max(self.k0, min(int(round(t * SRC_FPS)), int(DUR * SRC_FPS) - 1))
        while self.next <= k:
            b = self.p.stdout.read(W * H * 3)
            if len(b) < W * H * 3:
                break
            self.last = np.frombuffer(b, np.uint8).reshape(H, W, 3)
            self.cache[self.next] = self.last
            self.next += 1
            while len(self.cache) > 40:
                self.cache.popitem(last=False)
        return self.cache.get(k, self.last)


# ---------------------------------------------------------------- avatar
def cam_scale(b, t):
    keys = b["cam"]
    if t <= keys[0][0]:
        s = keys[0][1]
    elif t >= keys[-1][0]:
        s = keys[-1][1]
    else:
        for (ta, sa, _), (tb, sb, e) in zip(keys, keys[1:]):
            if ta <= t <= tb:
                q = (t - ta) / max(1e-3, tb - ta)
                q = E_outExpo(q) if e == "expo" else E_inOut(q)
                s = math.exp(math.log(sa) + (math.log(sb) - math.log(sa)) * q)
                break
    return s * (1 + 0.004 * math.sin(t * 0.7))  # never fully still


def slide_amount(b, t):
    if "slide" not in b:
        return 0.0
    a, z = b["slide"]
    return prog(t, a, 0.6, E_outExpo) * (1 - prog(t, z - 0.6, 0.6, E_inOut))


def backdrop(f):
    small = cv2.resize(f, (240, 135), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), 6)
    return (cv2.resize(small, (W, H)) * 0.55).astype(np.uint8)


EDGE = np.ones((H, W), np.float32)
for i in range(80):
    EDGE[:, i] *= i / 80
    EDGE[:, W - 1 - i] *= i / 80


def avatar(src, b, t):
    f = src.frame(t)
    q = slide_amount(b, t)
    s = cam_scale(b, t) * (1 - 0.06 * q)
    fx, fy = FACE
    dx = (SLIDE_X - fx) * q
    M = np.float32([[s, 0, fx - s * fx + dx], [0, s, fy - s * fy]])
    if q < 1e-3 and s >= 1:
        return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    out = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    m = cv2.warpAffine(EDGE, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)[..., None]
    return (out * m + backdrop(f) * (1 - m)).astype(np.uint8)


# ---------------------------------------------------------------- framed
CARD_W, CARD_H, CARD_R, BORDER = 461, 616, 40, 7
CARD_CX, CARD_CY = int(0.72 * W), H // 2
CROP = (615, 134, 1185, 894)  # x0, y0, x1, y1 in source: face in the upper third, no hands


def rounded_mask(w, h, r):
    m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(m, (0, r), (w - 1, h - r - 1), 255, -1)
    for cx, cy in ((r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)):
        cv2.circle(m, (cx, cy), r, 255, -1, lineType=cv2.LINE_AA)
    return m


def grid_board():
    g = np.full((H, W, 3), 0xED, np.uint8)
    for x in range(0, W, 60):
        cv2.line(g, (x, 0), (x, H), (250, 250, 250), 2)
    for y in range(0, H, 60):
        cv2.line(g, (0, y), (W, y), (250, 250, 250), 2)
    return g


GRID = grid_board()
OUTER = rounded_mask(CARD_W + 2 * BORDER, CARD_H + 2 * BORDER, CARD_R + BORDER)
INNER = rounded_mask(CARD_W, CARD_H, CARD_R)
SHADOW = cv2.GaussianBlur(np.pad(OUTER, 60).astype(np.float32) / 255, (0, 0), 17) * 0.23


def card_layer(src, b, t):
    """RGBA card (border + clip) at full frame size, plus shadow alpha."""
    f = src.frame(t)
    x0, y0, x1, y1 = CROP
    z = 1 + 0.04 * clamp((t - b["t0"]) / (b["t1"] - b["t0"]))
    cw, ch = (x1 - x0) / z, (y1 - y0) / z
    cx, cy = (x0 + x1) / 2, y0 + (y1 - y0) * 0.36
    sx0, sy0 = cx - cw / 2, cy - (cy - y0) / z
    M = np.float32([[CARD_W / cw, 0, -sx0 * CARD_W / cw], [0, CARD_H / ch, -sy0 * CARD_H / ch]])
    clip = cv2.warpAffine(f, M, (CARD_W, CARD_H), flags=cv2.INTER_AREA)
    ow, oh = OUTER.shape[1], OUTER.shape[0]
    card = np.full((oh, ow, 3), 255, np.uint8)
    inner = INNER[..., None].astype(np.float32) / 255
    region = card[BORDER:BORDER + CARD_H, BORDER:BORDER + CARD_W]
    card[BORDER:BORDER + CARD_H, BORDER:BORDER + CARD_W] = (clip * inner + region * (1 - inner)).astype(np.uint8)
    return card


def framed(src, b, t):
    out = GRID.copy()
    pin = prog(t, b["t0"], 0.5, E_outExpo)
    pout = prog(t, b["t1"] - 0.4, 0.4, E_inOut)
    sc = (0.92 + 0.08 * pin) * (1 - 0.05 * pout)
    op = pin * (1 - pout)
    card = card_layer(src, b, t)
    ow, oh = card.shape[1], card.shape[0]
    M = np.float32([[sc, 0, CARD_CX - sc * ow / 2], [0, sc, CARD_CY - sc * oh / 2]])
    c = cv2.warpAffine(card, M, (W, H), flags=cv2.INTER_LINEAR)
    a = cv2.warpAffine(OUTER.astype(np.float32) / 255, M, (W, H), flags=cv2.INTER_LINEAR)[..., None] * op
    Ms = np.float32([[sc, 0, CARD_CX - sc * (ow / 2 + 60)], [0, sc, CARD_CY + 12 - sc * (oh / 2 + 60)]])
    sh = cv2.warpAffine(SHADOW, Ms, (W, H), flags=cv2.INTER_LINEAR)[..., None] * op
    out = (out * (1 - sh)).astype(np.float32)
    return (c * a + out * (1 - a)).astype(np.uint8)


# ---------------------------------------------------------------- frames
_cache = {}


def seq_frame(d, n, alpha=False):
    """Frame n of a rendered sequence, clamped to the frames that exist."""
    if d not in _cache:
        fs = sorted(int(x[:6]) for x in os.listdir(d) if x[:6].isdigit())
        _cache[d] = (fs[0], fs[-1], ".png" if alpha else ".jpg")
    lo, hi, ext = _cache[d]
    n = min(max(n, lo), hi)
    return cv2.imread(os.path.join(d, f"{n:06d}{ext}"), cv2.IMREAD_UNCHANGED if alpha else cv2.IMREAD_COLOR)


def layer(ctx, b, t):
    n = int(round(t * FPS))
    kind = b["type"]
    if kind in AVATAR:
        img = avatar(ctx["src"], b, t)
    elif kind == "AVATAR_FRAMED":
        img = framed(ctx["src"], b, t)
    elif kind == "GLASS_UI":
        return seq_frame(os.path.join(ctx["scenes"], b["scene"]), n)
    else:  # BROLL: slow push-in across the segment
        img = seq_frame(os.path.join(ctx["broll"], b["id"]), n)
        s = 1.0 + 0.06 * clamp((t - b["t0"] + 0.35) / (b["t1"] - b["t0"] + 0.7))
        M = np.float32([[s, 0, W / 2 * (1 - s)], [0, s, H / 2 * (1 - s)]])
        return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    if b.get("overlay"):
        d = os.path.join(ctx["scenes"], b["overlay"])
        lo = _cache.get(d)
        ov = seq_frame(d, n, alpha=True)
        lo, hi, _ = _cache[d]
        if lo <= n <= hi:
            img = over(img, ov)
    return img


def scale_about(img, s):
    M = np.float32([[s, 0, W / 2 * (1 - s)], [0, s, H / 2 * (1 - s)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def transition(kind, A, B, p):
    if kind == "whip":
        q = E_inOut(p)
        off = int(round(W * q))
        canvas = np.empty_like(A)
        canvas[:, :W - off] = A[:, off:]
        canvas[:, W - off:] = B[:, :off]
        k = 1 + int(260 * math.sin(math.pi * p))
        return cv2.blur(canvas, (k, 1)) if k > 2 else canvas
    q = p * p * (3 - 2 * p)
    bmp = math.sin(math.pi * p)
    if kind == "zoom":
        A = scale_about(A, 1 + 0.5 * E_inOut(p))
        B = scale_about(B, 0.82 + 0.18 * E_inOut(p))
        A, B = fast_blur(A, 12 * bmp), fast_blur(B, 12 * bmp)
    elif kind == "focus":
        A, B = fast_blur(A, 22 * min(1, 2 * p)), fast_blur(B, 22 * min(1, 2 * (1 - p)))
    else:  # blur dissolve
        A, B = fast_blur(A, 10 * bmp), fast_blur(B, 10 * bmp)
    return cv2.addWeighted(A, 1 - q, B, q, 0)


def boundary_kind(a, b):
    if a["type"] in AVATAR and b["type"] in AVATAR:
        return None  # one continuous presenter shot
    k = b.get("trans")
    return k if k in TRANS_H else "blur"


def render_frame(ctx, t):
    i = next(k for k, b in enumerate(BEATS) if b["t0"] <= t < b["t1"] or k == len(BEATS) - 1)
    b = BEATS[i]
    # transition into this beat
    if i > 0:
        kind = boundary_kind(BEATS[i - 1], b)
        if kind and t < b["t0"] + TRANS_H[kind]:
            h = TRANS_H[kind]
            return transition(kind, layer(ctx, BEATS[i - 1], t), layer(ctx, b, t), (t - (b["t0"] - h)) / (2 * h))
    if i < len(BEATS) - 1:
        nb = BEATS[i + 1]
        kind = boundary_kind(b, nb)
        if kind and t >= nb["t0"] - TRANS_H[kind]:
            h = TRANS_H[kind]
            return transition(kind, layer(ctx, b, t), layer(ctx, nb, t), (t - (nb["t0"] - h)) / (2 * h))
    img = layer(ctx, b, t)
    fade = min(prog(t, 0, 0.25, E_inOut), 1 - prog(t, 412.3, 0.8, E_inOut))
    if fade < 1:
        img = (img * fade).astype(np.uint8)
    return img


def work(job):
    idx, n0, n1, src_path, scenes, broll, out = job
    ctx = {"src": Source(src_path, n0 / FPS), "scenes": scenes, "broll": broll}
    path = os.path.join(out, f"chunk_{idx:02d}.mp4")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-vf", "noise=alls=3:allf=t,format=yuv420p",
                            "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-b:v", "18M",
                            "-maxrate", "22M", "-bufsize", "36M", "-g", "60", "-colorspace", "bt709",
                            "-color_primaries", "bt709", "-color_trc", "bt709", path], stdin=subprocess.PIPE)
    for n in range(n0, n1):
        enc.stdin.write(render_frame(ctx, n / FPS).tobytes())
        if (n - n0) % 300 == 0:
            print(f"chunk {idx}: {n - n0}/{n1 - n0}", flush=True)
    enc.stdin.close()
    enc.wait()
    ctx["src"].p.kill()
    return path


def main():
    src, scenes, broll, out = sys.argv[1:5]
    workers = int(sys.argv[5]) if len(sys.argv) > 5 else 4
    t0, t1 = (float(sys.argv[6]), float(sys.argv[7])) if len(sys.argv) > 7 else (0, DUR)
    os.makedirs(out, exist_ok=True)
    n0, n1 = int(round(t0 * FPS)), min(int(round(t1 * FPS)), int(DUR * FPS))
    step = math.ceil((n1 - n0) / workers)
    jobs = [(i, a, min(a + step, n1), src, scenes, broll, out) for i, a in enumerate(range(n0, n1, step))]
    with Pool(len(jobs)) as pool:
        paths = pool.map(work, jobs)
    with open(os.path.join(out, "chunks.txt"), "w") as f:
        f.writelines(f"file '{os.path.basename(p)}'\n" for p in paths)
    print("done", len(paths), "chunks")


if __name__ == "__main__":
    main()
