"""Stage 1: cut list, beat sheet and overlay plan for "Best one mp4" in the
Purple Creator-Explainer style.

All times in this file are SOURCE seconds (word timestamps from
../transcript.json). The cut list removes dead air and one flubbed retake;
`timeline` maps every output frame (30 fps) back to a source time, so the
renderer and compositor stay in sync with the words.

Run `python3 plan.py` -> plan.json, scenes/plan.js, BEAT_SHEET.md
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
SRC_END = 412.95
PAUSE_MAX = 0.6       # pauses longer than this are tightened
PAUSE_KEEP = 0.15     # breath kept on each side of a tightened pause
RETAKES = [(319.03, 320.62, 'flubbed "dot be different." before the corrected line')]

# ------------------------------------------------------------------ framing
WIDE, MED, NUDGE, TIGHT = 1.0, 1.15, 1.2075, 1.32   # source-relative scales (Wide = 0.87 x Medium)
PUSHES = [  # emphasis push-ins: land on the word, hold, ease back
    (4.26, "Not even a business"), (19.02, "millionaire"), (32.32, "27 years"), (39.84, "right now"),
    (56.06, "tells the truth"), (70.06, "right now"), (81.12, "way more expensive"), (93.70, "break down"),
    (107.14, "very risky"), (137.10, "losing game"), (158.10, "whole thing"), (186.88, "real company"),
    (201.66, "sugarcoat"), (217.70, "promised you"), (232.54, "market crash"), (245.30, "trap"),
    (263.42, "remove risk"), (278.90, "influencer"), (311.50, "Pay that off first"), (333.02, "worst possible time"),
    (349.10, "free money"), (361.06, "stop checking"), (383.22, "the catch"), (402.66, "W-E-..."),
]
REVEALS = [(15.16, "If you missed part one"), (59.94, "Three main places"), (150.60, "Think about it this way"),
           (236.74, "back to the market side"), (324.66, "Life doesn't care"), (380.12, "So now you've got")]

# ------------------------------------------------------------------ beats
# layout: P (presenter), WEB (live page in browser card + presenter PiP), CARD (full-screen card)
B = []


def beat(t0, t1, layout, title, **kw):
    B.append(dict(id=f"B{len(B) + 1:02d}", t0=t0, t1=t1, layout=layout, title=title, **kw))


beat(0.0, 40.80, "P", "Hook, disclaimer, part-one recap, the compounding math")
beat(40.80, 46.80, "WEB", "Check today's inflation", web="cpi_calc", url="usinflationcalculator.com/inflation/current-inflation-rates")
beat(46.80, 64.40, "P", "Do the math on $20,000, then the three places money goes")
beat(64.40, 68.60, "CARD", "Section 01: Real estate", card="menu", active=0)
beat(68.60, 71.40, "P", "Look at borrowing costs")
beat(71.40, 79.80, "WEB", "Prove the mortgage rate", web="mortgage", url="fred.stlouisfed.org/data/MORTGAGE30US.txt")
beat(79.80, 100.60, "P", "Count the hidden costs; leverage cuts both ways")
beat(100.60, 106.20, "CARD", "Section 02: Stocks", card="menu", active=1)
beat(106.20, 110.30, "P", "Know the risk")
beat(110.30, 119.00, "WEB", "Prove the S&P 500 record", web="sp500", url="fred.stlouisfed.org/data/SP500.txt")
beat(119.00, 143.50, "P", "Oil, yields, the wobble; don't time the market")
beat(143.50, 150.50, "CARD", "Section 03: Your own business", card="menu", active=2)
beat(150.50, 163.90, "P", "Own the whole thing; you decide")
beat(163.90, 171.30, "CARD", "Income beyond the day job (ring scene)", card="bizflow")
beat(171.30, 180.00, "P", "Record business applications")
beat(180.00, 184.00, "WEB", "Show the Census source", web="census", url="census.gov/econ/bfs/current/index.html")
beat(184.00, 216.40, "P", "Few become real businesses; start lean")
beat(216.40, 221.30, "CARD", "Section 04: You", card="menu", active=3)
beat(221.30, 236.30, "P", "Skills, knowledge, network, discipline")
beat(236.30, 243.30, "CARD", "Section 05: Index funds", card="menu", active=4)
beat(243.30, 290.20, "P", "Winners change; diversification; what to look for; ignore the hype")
beat(290.20, 299.70, "CARD", "Section 06: Fix your foundation", card="steps", active=0)
beat(299.70, 313.30, "P", "Step 1: high-interest debt math")
beat(313.30, 315.80, "CARD", "Step 2: emergency fund", card="steps", active=1)
beat(315.80, 333.90, "P", "Emergency fund; life doesn't care about your plan")
beat(333.90, 343.70, "WEB", "Check what savings accounts pay", web="fdic", url="fdic.gov/national-rates-and-rate-caps")
beat(343.70, 346.20, "CARD", "Step 3: employer match", card="steps", active=2)
beat(346.20, 354.10, "P", "Free money: check the match")
beat(354.10, 357.00, "CARD", "Step 4: put the plan to work", card="steps", active=3)
beat(357.00, 391.80, "P", "Automate it; split the 20,000; here's the catch")
beat(391.80, 399.60, "CARD", "Which path are you leaning towards? (ring scene)", card="poll")
beat(399.60, SRC_END, "P", "Comment CTA, subscribe and follow")

# ------------------------------------------------------------------ overlays on the presenter (lower third)
O = []
chip = lambda t0, t1, text: O.append(dict(kind="chip", t0=t0, t1=t1, text=text))
O.append(dict(kind="math", t0=27.40, t1=36.40, terms=[(27.48, "$1,000/MONTH"), (29.32, "× 8%"), (32.32, "× 27 YEARS")],
              result=(31.22, "≈ $1 MILLION"), note="12,000 a year at 8%, 27 years: $1,048,209"))
chip(33.86, 36.40, "ILLUSTRATION, NEVER A PROMISE")
chip(13.26, 15.05, "NOT FINANCIAL ADVICE")
chip(20.06, 21.60, "OWNERSHIP DOES")
O.append(dict(kind="math", t0=46.90, t1=53.95, terms=[(46.96, "$20,000"), (48.30, "SITTING STILL"), (52.90, "× 10 YEARS")],
              result=(50.54, "≈ $14,300 IN TODAY'S MONEY"), note="20,000 / 1.034^10 = 14,316"))
O.append(dict(kind="flow", t0=61.20, t1=64.40, tiles=[(61.32, "REAL ESTATE", "house"), (62.22, "STOCKS", "chart"), (63.12, "YOUR OWN BUSINESS", "brief")]))
O.append(dict(kind="flow", t0=83.60, t1=89.40, tiles=[(83.74, "DOWN PAYMENT", "coin"), (84.90, "REPAIRS", "wrench"), (85.76, "INSURANCE", "shield"),
                                                    (86.74, "TAXES", "doc"), (87.78, "NO TENANT", "house")]))
chip(95.54, 100.50, "LEVERAGE CUTS BOTH WAYS")
chip(120.00, 122.50, "OIL ABOVE $100 A BARREL")
chip(122.96, 125.90, "10-YEAR YIELD PAST 5%")
chip(126.00, 129.60, "RECORD HIGH + PULLBACK")
chip(137.34, 143.40, "DON'T TIME THE MARKET")
O.append(dict(kind="flow", t0=159.40, t1=163.90, tiles=[(159.66, "THE PRODUCT", "box"), (160.60, "THE CUSTOMERS", "people"),
                                                      (161.68, "THE PRICING", "tag"), (162.74, "HOW FAST IT GROWS", "chart")]))
O.append(dict(kind="math", t0=173.60, t1=180.00, terms=[(173.74, "578,926"), (177.64, "NEW BUSINESS APPLICATIONS"), (179.06, "IN JULY")],
              result=(180.00 - 0.6, "MOST SINCE 2004"), note="Census BFS, July (first print)"))
O.append(dict(kind="math", t0=188.40, t1=195.60, terms=[(188.84, "578,926 APPLICATIONS"), (190.40, "→ 29,959")],
              result=(194.48, "WITH PAYROLL WITHIN A YEAR"), note="29,959 / 578,926 = 5.2%"))
chip(195.62, 200.40, "STARTING IS EASY")
chip(202.64, 205.80, "BUSINESSES FAIL")
O.append(dict(kind="flow", t0=208.40, t1=213.60, tiles=[(208.56, "START LEAN", "leaf"), (209.56, "GET PAID EARLY", "coin"), (210.92, "TEST THE IDEA", "flask")]))
O.append(dict(kind="flow", t0=221.30, t1=225.60, tiles=[(221.60, "SKILLS", "bulb"), (222.58, "KNOWLEDGE", "book"), (223.46, "NETWORK", "people"), (224.38, "DISCIPLINE", "target")]))
chip(244.42, 246.00, "PICKING WINNERS IS A TRAP")
O.append(dict(kind="logos", t0=246.14, t1=251.80, logos=[(246.14, "NOKIA", "Owned the phone market")]))
chip(261.40, 264.30, "DIVERSIFICATION")
O.append(dict(kind="flow", t0=271.60, t1=277.40, tiles=[(271.82, "BROAD DIVERSIFICATION", "grid"), (273.38, "LOW FEES", "tag"), (274.70, "KNOW WHAT IT OWNS", "search")]))
chip(278.90, 284.40, "IGNORE THE HYPE")
chip(285.10, 289.90, "DO YOUR DUE DILIGENCE")
O.append(dict(kind="math", t0=300.00, t1=307.20, terms=[(300.38, "$5,000 CARD DEBT"), (301.88, "× 20%")],
              result=(304.06, "≈ $1,000 A YEAR IN INTEREST"), note="5,000 x 0.20 = 1,000"))
chip(311.50, 313.20, "PAY THAT OFF FIRST")
chip(324.66, 326.40, "LIFE DOESN'T CARE ABOUT YOUR PLAN")
chip(348.56, 350.00, "FREE MONEY")
O.append(dict(kind="flow", t0=350.00, t1=354.10, tiles=[(350.16, "CHECK THE MATCH", "search"), (351.16, "CHECK THE RULES", "doc"), (352.34, "TAKE IT", "check")]))
O.append(dict(kind="flow", t0=357.00, t1=363.00, tiles=[(357.00, "PICK AN AMOUNT", "coin"), (359.42, "AUTOMATE IT", "bolt"), (360.78, "STOP CHECKING", "eyeoff")]))
chip(375.74, 379.20, "BUILD IT AROUND YOUR REAL LIFE")
O.append(dict(kind="cta", t0=400.90, t1=408.30, word="WEALTH"))
O.append(dict(kind="platforms", t0=408.52, t1=412.30, items=["YouTube", "TikTok", "Instagram"]))

KEYWORDS = {"best", "investment", "millionaire", "ownership", "inflation", "compounding", "million", "theory",
            "grocery", "truth", "real", "estate", "stocks", "business", "wealth", "borrowing", "expensive",
            "leverage", "gains", "losses", "small", "record", "market", "wobble", "wobbles", "climbs", "time",
            "path", "whole", "income", "asset", "company", "easy", "hard", "lean", "savings", "you.",
            "skills", "network", "discipline", "dollar", "crash", "index", "funds", "winners", "trap", "diversification",
            "risk", "fees", "influencer", "foundation", "debt", "interest", "gamble", "emergency", "fund", "plan",
            "high-yield", "match", "free", "automate", "skills", "life", "catch", "blueprint", "legacy", "comments"}
NO_CAPTION = [(106.3, 108.6, "unclear words"), (205.9, 207.9, "unclear words"), (326.6, 329.1, "slip of tongue"),
              (285.0, 289.9, "chip covers it"), (399.5, 413.0, "CTA covers it")]


def load_words():
    tr = json.load(open(os.path.join(HERE, "..", "transcript.json")))
    out = []
    for x in (x for seg in tr for x in seg["words"]):
        w = x["w"].strip()
        # Whisper splits "$20,000" / "high-yield" / "3.4%" into pieces: glue them back
        if out and (w[:1] in "%-" or (w[:1] in ",." and w[1:2].isdigit() and out[-1]["w"][-1:].isdigit())):
            out[-1]["w"] += w
            out[-1]["e"] = x["e"]
            continue
        out.append(dict(w=w, s=x["s"], e=x["e"]))
    return out


def cut_list(words):
    cuts = []
    for a, b in zip(words, words[1:]):
        if b["s"] - a["e"] > PAUSE_MAX:
            cuts.append((round(a["e"] + PAUSE_KEEP, 3), round(b["s"] - PAUSE_KEEP, 3), "dead air"))
    cuts += RETAKES
    cuts.sort()
    keep, t = [], 0.0
    for c0, c1, _ in cuts:
        if c0 > t:
            keep.append((t, c0))
        t = max(t, c1)
    keep.append((t, SRC_END))
    return cuts, keep


def timeline(keep):
    """Source time for every output frame."""
    out = []
    for a, b in keep:
        n = int(round((b - a) * FPS))
        out += [round(a + i / FPS, 4) for i in range(n)]
    return out


def framing(keep):
    """Camera keys (src_time, scale, ease). 'cut' = instant jump at a removed pause."""
    keys = [(0.0, MED, "cut")]
    events = [(t, "push") for t, _ in PUSHES] + [(t, "reveal") for t, _ in REVEALS]
    cut_pts = [(keep[i][1] + keep[i + 1][0]) / 2 for i in range(len(keep) - 1)]
    events += [(t, "jump") for t in cut_pts]
    events.sort()
    last_change, base = 0.0, MED
    busy_until = 0.0
    for t, kind in events:
        if t < busy_until:
            continue
        if kind == "push":
            keys += [(t - 0.6, base, "cubic"), (t, TIGHT, "cubic"), (t + 3.4, TIGHT, "cubic"), (t + 4.0, MED, "cubic")]
            base, busy_until, last_change = MED, t + 4.0, t
        elif kind == "reveal":
            keys += [(t, base, "cubic"), (t + 1.3, WIDE, "cubic"), (t + 4.5, WIDE, "cubic"), (t + 5.3, MED, "cubic")]
            base, busy_until, last_change = MED, t + 5.3, t
        elif kind == "jump" and t - last_change > 4.0:
            new = NUDGE if base == MED else MED
            keys += [(t - 0.001, base, "cubic"), (t, new, "cut")]
            base, last_change = new, t
    return keys


def captions(words):
    blocked = [(o["t0"], o["t1"]) for o in O] + [(a, b) for a, b, _ in NO_CAPTION]
    blocked += [(b["t0"], b["t1"]) for b in B if b["layout"] != "P"]
    blocked += [(a, b) for a, b, _ in cut_list(words)[0]]
    free = lambda w: not any(a <= w["s"] < b for a, b in blocked)
    caps, cur = [], []
    ends = lambda w: w["w"][-1:] in ".?!"
    starts = {id(words[0])} | {id(b) for a, b in zip(words, words[1:]) if ends(a)}

    def flush():
        # caption whole sentences only: drop fragments clipped by an overlay
        if cur and (id(cur[0]) not in starts or not ends(cur[-1])):
            cur.clear()
        if cur:
            def split(ws, parts):
                """Split words into `parts` runs of roughly equal character length."""
                total = sum(len(x["w"]) + 1 for x in ws)
                runs, run, acc = [], [], 0
                for x in ws:
                    run.append(x)
                    acc += len(x["w"]) + 1
                    if len(runs) < parts - 1 and acc >= total * (len(runs) + 1) / parts:
                        runs.append(run)
                        run = []
                if run:
                    runs.append(run)
                return runs

            chars = sum(len(x["w"]) + 1 for x in cur)
            for block in split(cur, -(-chars // 68)):
                bchars = sum(len(x["w"]) + 1 for x in block)
                grp = split(block, 2) if bchars > 34 and len(block) > 1 else [block]
                caps.append(dict(t0=grp[0][0]["s"] - 0.1, t1=grp[-1][-1]["e"] + 0.35,
                                 lines=[[dict(w=x["w"], s=x["s"], k=x["w"].lower().strip(",.?!") in KEYWORDS or
                                              any(ch.isdigit() for ch in x["w"])) for x in ln] for ln in grp]))
            cur.clear()

    for w in words:
        if not free(w):
            flush()
            continue
        if cur and ends(cur[-1]):
            flush()
        cur.append(w)
    flush()
    for a, b in zip(caps, caps[1:]):
        a["t1"] = min(a["t1"], b["t0"] - 0.02)
    # at most two orchid keywords per line
    for c in caps:
        for ln in c["lines"]:
            n = 0
            for x in ln:
                if x["k"]:
                    n += 1
                    x["k"] = n <= 2
    return caps


def main():
    words = load_words()
    cuts, keep = cut_list(words)
    tl = timeline(keep)
    data = dict(fps=FPS, src_end=SRC_END, keep=keep, cuts=cuts, frames=len(tl), beats=B, overlays=O,
                framing=framing(keep), captions=captions(words), pip=dict(x=1490, y=520, w=330, h=440))
    json.dump(data, open(os.path.join(HERE, "plan.json"), "w"), indent=1)
    json.dump(tl, open(os.path.join(HERE, "timeline.json"), "w"))
    with open(os.path.join(HERE, "scenes", "plan.js"), "w") as f:
        f.write("window.PLAN = " + json.dumps(data) + ";\n")
    # beat sheet
    out_t = lambda ts: next((i / FPS for i, x in enumerate(tl) if x >= ts - 1e-6), len(tl) / FPS)
    script = lambda a, b: " ".join(w["w"] for w in words if a <= (w["s"] + w["e"]) / 2 < b)
    md = ["# Beat sheet — Best one mp4 (Purple Creator-Explainer)", "",
          f"{len(B)} beats · output {len(tl) / FPS:.1f} s (source {SRC_END:.1f} s, {SRC_END - len(tl) / FPS:.1f} s of dead air and retakes removed) · 1920x1080 · 30 fps", "",
          "| # | Output time | Source time | Framing / layout | Exact words | Overlays | Capture |", "|---|---|---|---|---|---|---|"]
    for b in B:
        ov = [o for o in O if b["t0"] <= o["t0"] < b["t1"]]
        ovs = "; ".join(f"{o['kind']}: " + (o.get("text") or " · ".join(x[1] for x in o.get("tiles", o.get("terms", []))) or o.get("word", "") or
                                             ", ".join(o.get("items", [])) or ", ".join(x[1] for x in o.get("logos", []))) for o in ov)
        lay = b["layout"] if b["layout"] != "P" else "Presenter: Medium base, Tight pushes, Wide reveals, jump cuts"
        if b["layout"] == "CARD":
            lay = f"Card: {b['card']}"
        cap = b.get("url", "")
        md.append(f"| {b['id']} | {out_t(b['t0']):.2f}–{out_t(b['t1']):.2f} | {b['t0']:.2f}–{b['t1']:.2f} | {lay} | "
                  f"{script(b['t0'], b['t1']).replace('|', '/')} | {ovs.replace('|', '/')} | {cap} |")
    md += ["", "## Cuts", ""] + [f"- {a:.2f}–{b:.2f} s: {why}" for a, b, why in cuts]
    open(os.path.join(HERE, "BEAT_SHEET.md"), "w").write("\n".join(md) + "\n")
    print(len(B), "beats,", len(O), "overlays,", len(data["captions"]), "captions,", len(cuts), "cuts ->",
          f"{len(tl) / FPS:.1f} s output, framing keys {len(data['framing'])}")


if __name__ == "__main__":
    main()
