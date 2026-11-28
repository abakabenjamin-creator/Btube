"""Edit plan for "7 Steps to Change Your Life" in the Monk 1 style.

Sources
  F  = HeyGen "7 Steps to Change Your Life" (front angle)
  S  = HeyGen "How Julia Changed Her Life at 49" (side angle)
  VO = generated voiceover (HeyGen voice "Benjamin Abaka -- 54"), vo_full.wav
runs.json holds the script in order, each run with its source and source times.

Output: plan.json + scenes/plan.js with
  items    : timeline pieces (source, audio in/out, output start/end)
  shots    : what is on screen when (presenter angle + framing, B-roll clip, graphic card)
  pills    : section label per time range
  caps     : sparse captions (word-by-word)
  sides    : text lists beside the presenter
Run: python3 plan.py
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
PAD_IN, PAD_OUT, GAP = 0.10, 0.16, 0.10
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

RUNS = json.load(open(os.path.join(HERE, "runs.json")))
TTS = [w for w in json.load(open(os.path.join(HERE, "vo_resp.json")))["original_words"] if norm(w["text"])]

# ------------------------------------------------------------------ visuals for voiceover runs
# (cue words that start the shot, visual). Visual: ("B", clip_id, in_point_s) or ("G", card)
VO_SHOTS = {
    1: [("Your life", ("B", "20770", 0.5)), ("It's on a conveyor", ("B", "22433", 0.0)), ("Every day you", ("G", "belt"))],
    4: [("The word", ("G", "decide")), ("So when you", ("B", "11711", 1.0)), ("Fifteen years", ("G", "days")),
        ("And the belt", ("B", "38501", 3.0))],
    6: [("Picture the guy", ("B", "4151", 2.0)), ("Or the mom", ("B", "26232", 1.0))],
    9: [("It's about twenty", ("G", "weeks")), ("It comes down", ("G", "pyramid")), ("Who's the new", ("B", "46559", 2.0)),
        ("Some people print", ("B", "21249", 3.0))],
    11: [("Break it down", ("G", "questions")), ("Then pay for", ("B", "48903", 2.0)), ("Book the language", ("B", "27691", 6.0))],
    14: [("The State Department", ("B", "13129", 2.0)), ("Around six hundred", ("G", "fsi")), ("A whole new", ("B", "46559", 12.0))],
    16: [("Think of the career", ("B", "17450", 1.0)), ("Or the guy", ("B", "39502", 2.0)), ("Or someone finally", ("B", "45527", 1.0))],
    19: [("Find a mentor", ("B", "15780", 1.0)), ("Watch how they", ("B", "6310", 3.0)), ("One real conversation", ("G", "twelve"))],
    23: [("If this doesn't", ("B", "27591", 3.0)), ("But close enough", ("B", "15853", 2.0))],
    26: [("Look at the", ("B", "6052", 2.0)), ("Or the person", ("B", "27401", 1.0)), ("Flop into what", ("G", "flop"))],
    29: [("You make the", ("B", "15182", 1.0)), ("Then the first", ("B", "42127", 0.5)), ("How long does", ("G", "habit"))],
    31: [("Think of the new", ("B", "47555", 6.0)), ("Or the new hire", ("B", "9061", 3.0)), ("Or the person who", ("B", "22149", 3.0))],
    35: [("There's a line", ("G", "quote")), ("Think about the gap", ("G", "ladder")), ("And twelve months", ("B", "31629", 4.0))],
    37: [("She's thirty-six", ("G", "julia_1948")), ("On the way", ("B", "4353", 1.0)), ("Oysters", ("B", "22518", 3.0)),
         ("Some wine", ("B", "15788", 2.0)), ("The next year", ("B", "39535", 2.0)), ("Oh, and this", ("B", "20235", 8.0)),
         ("She graduates", ("G", "julia_line"))],
    40: [("So, seven steps", ("G", "recap"))],
}

# sparse captions on voiceover B-roll (cue words -> caption text, Monk style)
VO_CAPS = {
    1: [("Every day you", "Every day you don't choose, the belt chooses for you.")],
    4: [("So when you", "You're cutting the other ones away.")],
    6: [("Picture the guy", "“Next January”"), ("Or the mom", "“When the kids are older”")],
    9: [("Who's the new", "Who's the new you?"), ("Some people print", "Write it down.")],
    11: [("Then pay for", "Pay for it, with money and with effort."), ("Book the language", "Buy the ticket.")],
    14: [("A whole new", "A whole new language, in six months.")],
    16: [("Think of the career", "Learning to code after the kids are in bed"), ("Or the guy", "A trade after twenty years at a desk"),
         ("Or someone finally", "Learning to sew properly")],
    19: [("Find a mentor", "Find a mentor if you can."), ("Watch how they", "Copy it until your own version shows up.")],
    23: [("If this doesn't", "You can walk back in.")],
    26: [("Look at the", "Did applying cost them the old job?")],
    29: [("You make the", "You make the jump."), ("Then the first", "The first few weeks hit.")],
    31: [("Think of the new", "Burns dinner three nights straight"), ("Or the new hire", "Follows half of the meeting"),
         ("Or the person who", "Still needs GPS to find the grocery store")],
    35: [("And twelve months", "You might not recognize your own life.")],
    37: [("On the way", "Paris, 1948"), ("Oysters", "Oysters. Sole meunière. Some wine."),
         ("The next year", "Le Cordon Bleu, 1949"), ("Oh, and this", "She failed her first exam.")],
}

# presenter extras: (run index, cue words) -> side list / caption
SIDES = [  # text lists beside the presenter, Monk "1. Self-trust 2. Failing" style
    (2, "So I packed", ["7 steps"]),
    (2, "Decide you want", ["1. Decide"]),
    (8, "The second step", ["1. Decide", "2. A six-month plan"]),
    (12, "Step three", ["2. A six-month plan", "3. Build the skill"]),
    (18, "Step four", ["3. Build the skill", "4. One connection"]),
    (22, "Step five", ["4. One connection", "5. The door stays open"]),
    (28, "Step six", ["5. Your floor is safe", "6. Move, and survive"]),
    (34, "Last one", ["6. Outlast the awkward", "7. Give it a full year"]),
]
P_CAPS = [  # principle captions on the presenter
    (5, "Cut the cord", "Cut the cord."),
    (12, "Put a date", "Put a date on it."),
    (15, "Every day", "Practice daily."),
    (20, "borrow their map", "Borrow their map."),
    (25, "your floor is safe", "Your floor is safe."),
    (30, "outlast the awkward", "Outlast the awkward."),
    (34, "Give it a full", "Give it a full year."),
    (24, "A few months", "A few months and some money."),
    (27, "falling off a cliff", "Falling off a cliff? It's stepping off a curb."),
    (32, "My one promise", "My one promise: working out."),
    (42, "Tell me in the", "Tell me in the comments."),
]
PILLS = [(0, "Intro"), (3, "Step 1 · Decide"), (8, "Step 2 · Plan"), (12, "Step 3 · Skill"), (18, "Step 4 · Connection"),
         (22, "Step 5 · The floor"), (28, "Step 6 · Move"), (34, "Step 7 · A full year"), (40, "Recap")]
# presenter emphasis push-ins (run index, cue words)
PUSH = [(0, "Does that picture"), (5, "Cut the cord"), (12, "Put a date"), (13, "That's the entry fee"), (20, "borrow their map"),
        (25, "your floor is safe"), (30, "outlast the awkward"), (34, "Give it a full"), (38, "Can you imagine"), (42, "Then go pick")]


def load_words(src):
    f = {"F": "steps.json", "S": "julia.json"}[src]
    return [dict(w=x["w"].strip(), s=x["s"], e=x["e"], n=norm(x["w"]))
            for seg in json.load(open(os.path.join(HERE, f))) for x in seg["words"]]


WORDS = {"F": load_words("F"), "S": load_words("S")}


def find_time(words, a, b, cue, key="s"):
    toks = [norm(t) for t in re.split(r"[\s\-]+", cue) if norm(t)]
    cand = [w for w in words if a - 0.3 <= w[key if key in w else "s"] <= b + 0.3] if key == "s" else words
    n = [w["n"] if "n" in w else norm(w["text"]) for w in cand]
    for i in range(len(n)):
        if n[i:i + len(toks)] == toks:
            return cand[i]["s"] if "s" in cand[i] else cand[i]["start_time"]
    raise KeyError(cue)


def vo_time(a, b, cue):
    toks = [norm(t) for t in re.split(r"[\s\-]+", cue) if norm(t)]
    ws = [w for w in TTS if a - 0.05 <= w["start_time"] <= b + 0.05]
    n = [norm(w["text"]) for w in ws]
    for i in range(len(n)):
        if n[i:i + len(toks)] == toks:
            return ws[i]["start_time"]
    raise KeyError(cue)


def main():
    items, t = [], 0.0
    for r in RUNS:
        if r["src"] == "VO":
            a0, a1 = r["vs"] - PAD_IN, r["ve"] + PAD_OUT
        else:
            a0 = r.get("cut_s", r["s"] - PAD_IN)        # adjacent pieces of one clip meet at a silence, never overlap
            a1 = r.get("cut_e", r["e"] + PAD_OUT)
        a0 = max(0.0, a0)
        d = a1 - a0
        items.append(dict(i=r["i"], src=r["src"], a0=round(a0, 3), a1=round(a1, 3), t0=round(t, 3), t1=round(t + d, 3), text=r["text"]))
        t += d + GAP
    total = t - GAP
    to_out = lambda it, src_t: it["t0"] + (src_t - it["a0"])
    byi = {it["i"]: it for it in items}

    shots, caps, sides, pills, pushes = [], [], [], [], []
    for it in items:
        if it["src"] == "VO":
            vis = VO_SHOTS[it["i"]]
            for k, (cue, v) in enumerate(vis):
                s = it["t0"] if k == 0 else to_out(it, vo_time(it["a0"], it["a1"], cue))
                e = it["t1"] if k == len(vis) - 1 else to_out(it, vo_time(it["a0"], it["a1"], vis[k + 1][0]))
                shots.append(dict(t0=round(s, 3), t1=round(e, 3), kind=v[0], ref=v[1], inp=v[2] if v[0] == "B" else 0))
            for cue, text in VO_CAPS.get(it["i"], []):
                s = to_out(it, vo_time(it["a0"], it["a1"], cue))
                nxt = [sh["t0"] for sh in shots if sh["t0"] > s + 0.3]
                e = min([it["t1"]] + nxt)
                caps.append(dict(t0=round(s, 3), t1=round(e - 0.05, 3), text=text, over="B"))
        else:
            # presenter: framing changes on sentence boundaries (Monk two-angle rhythm)
            shots.append(dict(t0=it["t0"], t1=it["t1"], kind="P", ref=it["src"], a0=it["a0"]))
    for ri, cue, lines in SIDES:
        it = byi[ri]
        s = to_out(it, find_time(WORDS[it["src"]], it["a0"], it["a1"], cue))
        sides.append(dict(t0=round(s, 3), t1=round(min(s + 4.2, it["t1"] - 0.1), 3), lines=lines))
    for ri, cue, text in P_CAPS:
        it = byi[ri]
        s = to_out(it, find_time(WORDS[it["src"]], it["a0"], it["a1"], cue))
        caps.append(dict(t0=round(s, 3), t1=round(min(s + 3.0, it["t1"] - 0.05), 3), text=text, over="P"))
    for ri, cue in PUSH:
        it = byi[ri]
        pushes.append(round(to_out(it, find_time(WORDS[it["src"]], it["a0"], it["a1"], cue)), 3))
    for k, (ri, label) in enumerate(PILLS):
        s = byi[ri]["t0"]
        e = byi[PILLS[k + 1][0]]["t0"] if k + 1 < len(PILLS) else total
        pills.append(dict(t0=s, t1=e, text=label))
    # Julia timeline beats, recap step beats (exact word times in the voiceover)
    it = byi[37]
    jt = {k: round(to_out(it, vo_time(it["a0"], it["a1"], k)), 3) for k in
          ["She's thirty-six", "It's 1948", "The next year", "She graduates", "Ten years later", "Mastering the", "Two years after", "You know her"]}
    it = byi[40]
    rt = [round(to_out(it, vo_time(it["a0"], it["a1"], k)), 3) for k in
          ["Decide and cut", "Make a six", "Build the skill", "Find one person", "Remember your floor", "Make the move", "And give it"]]
    cues = {}
    for ri, ks in {4: ["It means to", "same root as", "So when you"], 9: ["define it", "break it down", "pay for it"],
                   11: ["What's the smallest", "What does the move", "How much do you"], 14: ["Around six hundred", "That's six months"],
                   19: ["One real conversation", "is twelve people"], 29: ["How long does", "A 2009 study", "On average", "For some people", "For others"],
                   35: ["There's a line", "people overestimate", "and underestimate", "Think about the gap", "One month in", "Six months in", "And twelve months"],
                   1: ["Every day you", "the belt chooses"], 26: ["Flop into what", "The life they"]}.items():
        it = byi[ri]
        cues[ri] = [round(to_out(it, vo_time(it["a0"], it["a1"], k)), 3) for k in ks]
    data = dict(fps=FPS, total=round(total, 3), frames=int(total * FPS), items=items, shots=shots, caps=caps, sides=sides,
                pills=pills, pushes=pushes, julia=jt, recap=rt, cues=cues)
    json.dump(data, open(os.path.join(HERE, "plan.json"), "w"), indent=1)
    with open(os.path.join(HERE, "scenes", "plan.js"), "w") as f:
        f.write("window.PLAN = " + json.dumps(data) + ";\n")
    from collections import Counter
    print(f"{total:.1f}s, {len(items)} pieces, shots {Counter(s['kind'] for s in shots)}, {len(caps)} captions, {len(sides)} side lists")


if __name__ == "__main__":
    main()
