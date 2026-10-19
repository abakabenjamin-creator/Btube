"""Word-level timing for the narration.

Source of truth, in order of preference:
  1. HeyGen SRT sidecars (assets/part1.srt, assets/part2.srt) aligned to the script.
  2. A speech-rate estimate (used only for the preview render).
Writes build/words.json: [{"w": raw_word, "n": normalized, "t0": s, "t1": s}, ...]
"""
import difflib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(tok):
    tok = tok.lower().replace(",", "")
    return re.sub(r"[^a-z0-9$]", "", tok)


def tokens(text):
    raw = text.split()
    return [(r, norm(r)) for r in raw if norm(r)]


def est_duration(raw):
    d = 0.058 * len(re.sub(r"[^\w$]", "", raw)) + 0.11
    if re.search(r"\d", raw):
        d += 0.22  # numbers are spoken as several words
    if raw.endswith((".", "?", "!", ":")):
        d += 0.38
    elif raw.endswith((",", ";")):
        d += 0.16
    return d


def estimate(text, t_start=0.0):
    out, t = [], t_start
    for para in text.split("\n"):
        for raw, n in tokens(para):
            d = est_duration(raw)
            speak = min(d, 0.058 * len(n) + 0.12)
            out.append({"w": raw, "n": n, "t0": round(t, 3), "t1": round(t + speak, 3)})
            t += d
        t += 0.35 if para.strip() else 0
    return out, t


def parse_srt(path):
    segs = []
    for block in re.split(r"\n\s*\n", open(path, encoding="utf-8-sig").read().strip()):
        lines = block.strip().splitlines()
        tl = next((l for l in lines if "-->" in l), None)
        if not tl:
            continue
        a, b = [x.strip() for x in tl.split("-->")]
        f = lambda s: sum(float(x) * m for x, m in zip(re.split(r"[:,.]", s)[:3], (3600, 60, 1))) + int(re.split(r"[,.]", s)[1]) / 1000
        txt = " ".join(lines[lines.index(tl) + 1:])
        segs.append((f(a), f(b), txt))
    return segs


def from_srt(text, srt, offset):
    """Distribute each SRT segment's span over its words, then map onto script words."""
    sw = []
    for a, b, txt in parse_srt(srt):
        toks = tokens(txt)
        tot = sum(len(n) + 2 for _, n in toks) or 1
        t = a
        for raw, n in toks:
            d = (b - a) * (len(n) + 2) / tot
            sw.append((n, t + offset, t + d + offset))
            t += d
    script = tokens(text)
    sm = difflib.SequenceMatcher(None, [n for _, n in script], [s[0] for s in sw], autojunk=False)
    times = [None] * len(script)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = sw[j1 + k][1:]
        elif tag == "replace" and j2 > j1:  # e.g. "$20" vs "twenty dollars"
            a, b = sw[j1][1], sw[j2 - 1][2]
            for k in range(i2 - i1):
                times[i1 + k] = (a + (b - a) * k / (i2 - i1), a + (b - a) * (k + 1) / (i2 - i1))
    # interpolate any gaps
    for i, tm in enumerate(times):
        if tm is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), offset)
            nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), prev + 0.3)
            times[i] = (prev, max(prev + 0.05, min(nxt, prev + 0.4)))
    return [{"w": r, "n": n, "t0": round(t[0], 3), "t1": round(t[1], 3)} for (r, n), t in zip(script, times)]


def media_duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode())


def main():
    parts = [open(os.path.join(ROOT, f"script_part{i}.txt")).read() for i in (1, 2)]
    words, offset, mode = [], 0.0, "estimate"
    for i, text in enumerate(parts, 1):
        srt = os.path.join(ROOT, "assets", f"part{i}.srt")
        mp4 = os.path.join(ROOT, "assets", f"part{i}.mp4")
        if os.path.exists(srt) and os.path.exists(mp4):
            words += from_srt(text, srt, offset)
            offset += media_duration(mp4)
            mode = "srt"
        else:
            w, end = estimate(text, offset)
            words += w
            offset = end + 0.4
    json.dump({"mode": mode, "duration": round(offset, 3), "words": words}, open(os.path.join(ROOT, "build", "words.json"), "w"), indent=0)
    print(f"{mode}: {len(words)} words, {offset:.1f}s")


if __name__ == "__main__":
    main()
