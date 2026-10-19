"""Role 6 — UI sound layer (no background music, per Ben), synthesized (no stock library reachable from this machine).
Reads build/sfx.json (event list exported by the compositor) and build/timeline.json.
Writes out/sfx.wav (44.1 kHz stereo, float)."""
import json, os, sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
rng = np.random.default_rng(7)
TL = json.load(open(f"{ROOT}/build/timeline.json"))
EV = json.load(open(f"{ROOT}/build/sfx.json"))
DUR = TL["duration"] + 1.5
N = int(DUR * SR)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def tone(f, dur, a=.002, d=.2, harm=(1,), amps=(1,)):
    n = int(dur * SR); t = np.arange(n) / SR
    y = sum(am * np.sin(2 * np.pi * f * h * t) for h, am in zip(harm, amps))
    return y * env(n, a, d)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------------------------------------------------------- SFX kit
def k_click():  return hp(noise(.03), 2500) * env(int(.03 * SR), .0005, .006) * .7 + tone(2200, .03, d=.008) * .3
def k_key():    return bp(noise(.04), 1800, 6000) * env(int(.04 * SR), .0005, .008) * rng.uniform(.5, .9)
def k_tap():    return tone(1150, .05, d=.02) * .5 + bp(noise(.05), 1000, 4000) * env(int(.05 * SR), .0005, .01) * .5
def k_pop():
    n = int(.09 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (520 + 2600 * t) * t) * env(n, .002, .03)
def k_whoosh(dur=.45):
    n = int(dur * SR); x = noise(dur); t = np.arange(n) / SR
    y = np.zeros(n); seg = 1024
    for i in range(0, n, seg):       # sweeping band
        f = 300 + 3200 * np.sin(np.pi * i / n) ** 2
        y[i:i + seg] = bp(x[max(0, i - 2048):i + seg], f * .6, min(f * 1.6, 18000))[-len(y[i:i + seg]):]
    return y * np.sin(np.pi * t / dur) ** 2 * 1.4
def k_swish(): return k_whoosh(.3) * .6
def k_strike(): return hp(k_whoosh(.25), 1200) * .8
def k_shimmer():
    out = np.zeros(int(.8 * SR))
    for i, f in enumerate((2093, 2637, 3136, 4186)):
        s = tone(f, .8 - i * .06, d=.25, harm=(1, 2), amps=(1, .2)) * .25
        o = int(i * .05 * SR); out[o:o + len(s)] += s
    return out
def k_rise():
    n = int(.9 * SR); t = np.arange(n) / SR
    sw = np.sin(2 * np.pi * (200 * t + 500 * t ** 2)) * .3
    return (sw + bp(noise(.9), 800, 6000) * .4) * (t / .9) ** 2 * np.exp(-np.maximum(0, t - .8) * 30)
def k_chime(): return tone(880, 1.2, d=.45, harm=(1, 2.01, 3.03), amps=(1, .4, .2)) * .5 + tone(1320, 1.2, a=.01, d=.4) * .25
def k_confirm():
    a = tone(660, .18, d=.08); b = tone(990, .4, d=.18)
    out = np.zeros(int(.5 * SR)); out[:len(a)] += a; o = int(.09 * SR); out[o:o + len(b)] += b
    return out * .5
def k_hit():
    n = int(.5 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, .002, .15) + lp(noise(.5), 600) * env(n, .001, .05) * .3


KIT = dict(click=(k_click, -12), key=(k_key, -20), tap=(k_tap, -14), pop=(k_pop, -15), whoosh=(k_whoosh, -12), swish=(k_swish, -14),
           strike=(k_strike, -15), shimmer=(k_shimmer, -18), rise=(k_rise, -16), chime=(k_chime, -15), confirm=(k_confirm, -13), hit=(k_hit, -13))

sfx = np.zeros((N, 2))
for e in EV["sfx"]:
    fn, db = KIT[e["k"]]
    s = fn() * (10 ** (db / 20)) * e.get("g", 1)
    s = s / max(1e-9, np.abs(fn()).max()) if e["k"] in ("whoosh", "swish", "strike", "rise") else s
    s *= 10 ** (db / 20) / max(1e-9, np.abs(s).max()) * e.get("g", 1)
    i = int(e["t"] * SR)
    if i >= N: continue
    s = s[:N - i]
    pan = rng.uniform(-.25, .25)
    sfx[i:i + len(s), 0] += s * (1 - pan); sfx[i:i + len(s), 1] += s * (1 + pan)

os.makedirs(f"{ROOT}/out", exist_ok=True)
for name, x in (("sfx", sfx),):
    x = x / max(1e-9, np.abs(x).max()) * .89
    wavfile.write(f"{ROOT}/out/{name}.wav", SR, x.astype(np.float32))
print("audio ok", round(DUR, 1), "s,", len(EV["sfx"]), "sfx events")
