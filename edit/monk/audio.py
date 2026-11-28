"""Audio for the Monk-style edit: presenter clips + generated voiceover on the
timeline, each piece loudness-matched, soft click/pop on cards and captions,
no music. Two-pass loudnorm to -14 LUFS / -1.5 dBTP.
usage: python3 audio.py <hg_dir> <vo_full.wav> <out.wav>
"""
import json, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import sfx  # noqa: E402
SR = 48000
PLAN = json.load(open(os.path.join(HERE, "plan.json")))
SRC = {"F": "steps.mp4", "S": "julia.mp4"}


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def rms_db(x):
    x = x[np.abs(x) > 1e-3]
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else -60


def main(hg, vo, out):
    srcs = {"F": load(os.path.join(hg, SRC["F"])), "S": load(os.path.join(hg, SRC["S"])), "VO": load(vo)}
    target = {k: rms_db(v) for k, v in srcs.items()}
    ref = target["F"]
    n = int((PLAN["total"] + 1) * SR)
    buf = np.zeros(n, np.float32)
    fade = int(0.012 * SR)
    ramp = np.linspace(0, 1, fade, dtype=np.float32)
    for it in PLAN["items"]:
        x = srcs[it["src"]][int(it["a0"] * SR):int(it["a1"] * SR)].copy()
        x *= 10 ** ((ref - target[it["src"]]) / 20)          # match loudness across sources
        x[:fade] *= ramp; x[-fade:] *= ramp[::-1]
        i = int(it["t0"] * SR); j = min(n, i + len(x)); buf[i:j] += x[:j - i]
    fx = np.zeros(n, np.float32)
    def put(t, s):
        i = int(t * SR); j = min(n, i + len(s)); fx[i:j] += s[:j - i].astype(np.float32)
    for sh in PLAN["shots"]:
        if sh["kind"] == "G":
            put(sh["t0"] + 0.05, sfx.s_pop() * 0.6)
    for c in PLAN["caps"]:
        put(c["t0"], sfx.s_tap() * 0.5)
    for sd in PLAN["sides"]:
        put(sd["t0"], sfx.s_tap() * 0.6)
    mix = np.clip(buf + fx, -1, 1)
    tmp = out + ".pre.wav"
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    chain = "highpass=f=70,acompressor=threshold=-20dB:ratio=2.2:attack=8:release=140:makeup=1.5dB"
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"{chain},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"{chain},{ln}", "-ac", "2", "-ar", str(SR), out], check=True)
    os.remove(tmp)
    print({k: round(v, 1) for k, v in target.items()}, "->", out)


if __name__ == "__main__":
    main(*sys.argv[1:4])
