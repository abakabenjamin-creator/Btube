"""Role 6: build the UI sound layer as one 48 kHz stem.

Every event comes from the scenes' events.json (written by render.js) or from
the beat sheet (transition whooshes, punch-in hits), so each sound lands on
its visual frame. Sounds are synthesized: quiet, short and tonal, no
cartoon or meme effects.
usage: python3 sfx.py <scene_frames> <out.wav>
"""
import glob
import json
import os
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
rng = np.random.default_rng(7)


def db(x):
    return 10 ** (x / 20)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def tone(f0, f1, dur, tau, phase=0.0):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase) * env_exp(n, tau)


def band_noise(dur, lo, hi):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    X[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def attack(x, ms=2):
    k = max(1, int(ms * SR / 1000))
    x[:k] *= np.linspace(0, 1, k)
    return x


def norm(x, peak_db):
    return x / (np.abs(x).max() + 1e-9) * db(peak_db)


def s_click():
    n = band_noise(0.012, 2000, 6000) * env_exp(int(0.012 * SR), 0.002)
    t = tone(1500, 1100, 0.04, 0.008)
    t[:len(n)] += n * 0.8
    return norm(attack(t, 1), -15)


def s_tick():
    return norm(attack(tone(2300, 2200, 0.05, 0.01), 1), -21)


def s_key():
    n = band_noise(0.03, 1200, 5000) * env_exp(int(0.03 * SR), 0.004)
    n += tone(rng.uniform(380, 520), 300, 0.03, 0.006) * 0.5
    return norm(attack(n, 0.5), -27 + rng.uniform(-2, 2))


def s_tap():
    n = band_noise(0.02, 1500, 6000) * env_exp(int(0.02 * SR), 0.003)
    t = tone(1800, 1700, 0.035, 0.007)
    t[:len(n)] += n * 0.6
    return norm(attack(t, 0.5), -20)


def s_pop():
    a = tone(950, 320, 0.09, 0.03)
    b = tone(1900, 640, 0.09, 0.012)
    return norm(attack(a + 0.3 * b, 1.5), -16)


def s_whoosh(dur=0.5, soft=False):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    hop, win = 512, 2048
    w = np.hanning(win)
    fr = np.fft.rfftfreq(win, 1 / SR)
    for i in range(0, n - win, hop):
        p = i / n
        c = 350 * (2500 / 350) ** np.sin(np.pi * p)  # sweep up then down
        g = np.exp(-0.5 * (np.log(fr / c + 1e-9) / 0.55) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[i:i + win] * w) * g, win)
        out[i:i + win] += seg * w
    out *= np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return norm(out, -22 if soft else -16)


def s_shimmer():
    dur = 0.7
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for f in (3100, 3900, 4700, 5600, 6300):
        out += np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(9, 15) * tt))
    out *= np.minimum(1, tt / 0.05) * np.exp(-tt / 0.25)
    return norm(out, -26)


def s_rise(soft=False):
    dur = 0.6
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.sin(2 * np.pi * np.cumsum(np.geomspace(220, 880, n)) / SR) * 0.5 + band_noise(dur, 300, 3000) * 0.5
    out *= (tt / dur) ** 2 * np.minimum(1, (dur - tt) / 0.04)
    return norm(out, -24 if soft else -20)


def s_hit():
    a = tone(85, 42, 0.6, 0.18)
    nz = band_noise(0.6, 40, 400) * env_exp(int(0.6 * SR), 0.05)
    return norm(attack(a + 0.35 * nz, 2), -13)


def s_chime(soft=False):
    dur = 1.2
    n = int(dur * SR)
    out = sum(np.sin(2 * np.pi * f * np.arange(n) / SR) * env_exp(n, tau) * g
              for f, tau, g in ((880, 0.5, 1), (1320, 0.35, 0.5), (2640, 0.2, 0.25)))
    return norm(attack(out, 2), -24 if soft else -20)


def s_confirm():
    a = s_chime()
    b = np.concatenate([np.zeros(int(0.09 * SR)),
                        sum(np.sin(2 * np.pi * f * np.arange(int(1.0 * SR)) / SR) * env_exp(int(1.0 * SR), tau) * g
                            for f, tau, g in ((1320, 0.45, 1), (1980, 0.3, 0.4)))])
    m = np.zeros(max(len(a), len(b)))
    m[:len(a)] += a
    m[:len(b)] += b * db(-21)
    return norm(m, -18)


def s_fall():
    return norm(attack(tone(620, 150, 0.6, 0.3), 3), -24)


def s_strike():
    x = band_noise(0.14, 2500, 9000) * np.sin(np.pi * np.linspace(0, 1, int(0.14 * SR))) ** 2
    return norm(x, -25)


def place(buf, t, snd):
    i = int(round(t * SR))
    if i < 0:
        snd, i = snd[-i:], 0
    j = min(len(buf), i + len(snd))
    if j > i:
        buf[i:j] += snd[:j - i]


def main(scenes, out):
    data = json.load(open(os.path.join(HERE, "beats.json")))
    dur = data["duration"]
    buf = np.zeros(int((dur + 2) * SR))
    lib = {"click": s_click, "tick": s_tick, "tap": s_tap, "pop": s_pop, "shimmer": s_shimmer, "hit": s_hit,
           "confirm": s_confirm, "fall": s_fall, "strike": s_strike, "key": s_key}
    count = 0
    for f in glob.glob(os.path.join(scenes, "*", "events.json")):
        for e in json.load(open(f)):
            t, k = e["t"], e["type"]
            soft = bool(e.get("soft"))
            if k == "keys":
                for i in range(e["n"]):
                    place(buf, t + i / e["cps"] + rng.uniform(-0.008, 0.008), s_key())
            elif k == "count":
                for tt in np.arange(t, t + e["d"], 0.06):
                    place(buf, tt, s_tick() * db(-8))
            elif k == "cascade":
                for tt in rng.uniform(t, t + e["d"], 22):
                    place(buf, tt, s_tick() * db(-11))
            elif k == "whoosh":
                place(buf, t - 0.2, s_whoosh(0.45, soft))
            elif k == "rise":
                place(buf, t - 0.5, s_rise(soft))
            elif k == "chime":
                place(buf, t, s_chime(soft))
            else:
                place(buf, t, lib[k]())
            count += 1
    beats = data["beats"]
    avatar = {"AVATAR_TALK", "AVATAR_PUSH", "AVATAR_CALC", "AVATAR_PHONE_DEMO"}
    for a, b in zip(beats, beats[1:]):
        if a["type"] in avatar and b["type"] in avatar:
            continue
        k = b.get("trans", "blur")
        if k == "whip":
            place(buf, b["t0"] - 0.25, s_whoosh(0.5))
        elif k == "zoom":
            place(buf, b["t0"] - 0.3, s_whoosh(0.6, True))
            place(buf, b["t0"] - 0.5, s_rise(True))
        else:
            place(buf, b["t0"] - 0.3, s_whoosh(0.6, True) * db(-3))
        count += 1
    for b in beats:  # punch-in hits land with the push
        for (ta, sa, _), (tb, sb, e) in zip(b.get("cam", []), b.get("cam", [])[1:]):
            if e == "expo" and sb / sa > 1.05:
                place(buf, ta, s_hit())
                count += 1
    buf = np.clip(buf, -1, 1)
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    print(count, "sound events ->", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
