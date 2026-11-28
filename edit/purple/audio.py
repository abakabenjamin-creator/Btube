"""Stage 5: voice on the cut timeline + click layer. No music, by request.

The voice is cut with the same keep-list as the picture (8 ms fades at every
join, so no clicks). UI sounds are short, untuned ticks only: typing ticks on
typed text, soft taps when a chip, tile or menu row lands, a mouse click when
the highlighter drags. Then two-pass loudness to -14 LUFS / -1 dBTP.
Also writes SOUND_CUES.md.

usage: python3 audio.py <source.mp4> <out.wav>
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import sfx  # noqa: E402  (synth helpers from the glass edit)

SR = 48000
PLAN = json.load(open(os.path.join(HERE, "plan.json")))
KEEP = PLAN["keep"]
FADE = int(0.008 * SR)


def src2out(t):
    acc = 0.0
    for a, b in KEEP:
        if t < a:
            return acc
        if t <= b:
            return acc + t - a
        acc += b - a
    return acc


def voice(src):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2)
    parts = []
    ramp = np.linspace(0, 1, FADE, dtype=np.float32)[:, None]
    for a, b in KEEP:
        seg = x[int(round(a * SR)):int(round(b * SR))].copy()
        seg[:FADE] *= ramp
        seg[-FADE:] *= ramp[::-1]
        parts.append(seg)
    return np.concatenate(parts)


def cues():
    """(src_time, sound, note) for every UI event."""
    c = []
    for o in PLAN["overlays"]:
        k = o["kind"]
        if k == "chip":
            c.append((o["t0"], "tap", f"chip pops: {o['text']}"))
        elif k == "math":
            for tt, term in o["terms"]:
                c += [(tt + i / 40, "key", None) for i in range(len(term)) if term[i] != " "]
                c.append((tt, None, f"typing: {term}"))
            c.append((o["result"][0], "tap", f"result: {o['result'][1]}"))
        elif k in ("flow", "logos"):
            for it in o.get("tiles", o.get("logos", [])):
                c.append((it[0], "tap", f"{k} tile: {it[1]}"))
        elif k == "cta":
            c.append((o["t0"], "tap", "comment CTA"))
        elif k == "platforms":
            c += [(o["t0"] + i * 0.15, "tap", f"badge: {n}") for i, n in enumerate(o["items"])]
    web_hl = {"cpi_calc": [42.96], "mortgage": [73.4, 77.04], "sp500": [113.18, 117.68], "census": [181.24], "fdic": [336.9]}
    for b in PLAN["beats"]:
        if b["layout"] == "WEB":
            c += [(b["t0"] + i / 70, "key", None) for i in range(0, len(b["url"]), 2)]
            c.append((b["t0"], None, f"URL typed: {b['url']}"))
            c += [(t - 0.02, "click", "highlighter drag") for t in web_hl[b["web"]]]
        if b["layout"] == "CARD":
            c.append((b["t0"] + 0.05, "tap", f"card lands: {b['title']}"))
    return sorted(c, key=lambda x: x[0])


def main(src, out):
    v = voice(src)
    n = len(v)
    fx = np.zeros(n, np.float32)
    lib = {"key": sfx.s_key, "tap": sfx.s_tap, "click": sfx.s_click}
    rows = []
    for t, snd, note in cues():
        to = src2out(t)
        if snd:
            s = lib[snd]().astype(np.float32) * (0.7 if snd == "key" else 1.0)
            i = int(round(to * sfx.SR))
            j = min(n, i + len(s))
            if 0 <= i < n:
                fx[i:j] += s[:j - i]
        if note:
            rows.append(f"| {int(to // 60)}:{to % 60:05.2f} | {snd or 'key ticks'} | {note} |")
    mix = v + fx[:, None] * 0.9
    tmp = out + ".pre.wav"
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    import wave
    with wave.open(tmp, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    voice_chain = "highpass=f=75,lowpass=f=16000,acompressor=threshold=-21dB:ratio=2.5:attack=8:release=120:makeup=2dB"
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"{voice_chain},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                           "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"{voice_chain},{ln}", "-ar", str(SR), out], check=True)
    os.remove(tmp)
    md = ["# Sound cue sheet — Best one mp4 (Purple Creator-Explainer)", "",
          "No music bed and no whooshes or risers (removed at Ben's request). Voice at -14 LUFS integrated, -1.5 dBTP.",
          "UI ticks are synthesized (sfx.py): key = typing tick (~-27 dBFS), tap = soft pop (~-20 dBFS), click = mouse click (~-15 dBFS).", "",
          "| Output time | Sound | Event |", "|---|---|---|"] + rows
    open(os.path.join(HERE, "SOUND_CUES.md"), "w").write("\n".join(md) + "\n")
    print(f"{len(rows)} cues, {n / SR:.2f} s -> {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
