"""Build word-highlight ASS captions from build/words.json (faster-whisper word timings)."""
import json, re, sys

words = json.load(open(sys.argv[1]))
out = sys.argv[2]

# Glue split tokens back together: "7" ",000" -> "7,000", "47" "%" -> "47%".
merged = []
for s, e, w in words:
    if merged and re.match(r"^[,%]", w):
        merged[-1][1] = e
        merged[-1][2] += w
    else:
        merged.append([s, e, w])

def is_num_marker(w):
    return re.fullmatch(r"[1-7]\.", w) is not None

# Chunk: number markers stand alone; break after sentence ends; max 3 words.
chunks, cur = [], []
for i, (s, e, w) in enumerate(merged):
    if is_num_marker(w):
        if cur: chunks.append(cur); cur = []
        chunks.append([[s, e, w]]); continue
    if cur and s - cur[-1][1] > 0.35:
        chunks.append(cur); cur = []
    cur.append([s, e, w])
    if len(cur) == 3 or w[-1] in ".?" or w in ("today", "steps", "sleep", "time", "about", "savings", "payday", "text", "call", "comments", "early.", "year", "versus"):
        chunks.append(cur); cur = []
if cur: chunks.append(cur)

def ts(t):
    t = max(0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"

def clean(w):
    return w.upper().rstrip(".")

ORANGE = r"&H001E6BFF&"   # BGR of #FF6B1E
WHITE = r"&H00FFFFFF&"
lines = []
for ci, ch in enumerate(chunks):
    start = ch[0][0]
    nxt = chunks[ci + 1][0][0] if ci + 1 < len(chunks) else ch[-1][1] + 0.6
    end = nxt if nxt - ch[-1][1] < 0.6 else ch[-1][1] + 0.3

    if is_num_marker(ch[0][2]):
        n = ch[0][2][0]
        tag = r"{\an5\pos(540,1330)\fscx40\fscy40\t(0,120,\fscx115\fscy115)\t(120,220,\fscx100\fscy100)}"
        lines.append(f"Dialogue: 1,{ts(start)},{ts(end)},Num,,0,0,0,,{tag}#{n}")
        continue

    for wi, (s, e, w) in enumerate(ch):
        ws = start if wi == 0 else s
        we = ch[wi + 1][0] if wi + 1 < len(ch) else end
        if we <= ws: continue
        parts = []
        for k, (_, _, x) in enumerate(ch):
            if k == wi:
                parts.append(r"{\c" + ORANGE + r"\fscx108\fscy108}" + clean(x) + r"{\c" + WHITE + r"\fscx100\fscy100}")
            else:
                parts.append(clean(x))
        pop = r"\fscx80\fscy80\t(0,90,\fscx100\fscy100)" if wi == 0 else ""
        lines.append(f"Dialogue: 0,{ts(ws)},{ts(we)},Cap,,0,0,0,,{{\\an5\\pos(540,1330){pop}}}" + " ".join(parts))

header = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Black,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,8,5,5,60,60,0,1
Style: Num,Inter Black,260,&H001E6BFF,&H001E6BFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,10,6,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(out, "w").write(header + "\n".join(lines) + "\n")
print(len(chunks), "chunks;", len(lines), "events")
