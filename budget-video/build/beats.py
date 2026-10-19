"""Role 1 — beat sheet. Every beat is anchored to exact script phrases, so the whole
edit re-times itself when real HeyGen timings replace the estimate.
Writes build/timeline.json (consumed by the compositor) and beat_sheet.md."""
import json, os, re
from timing import norm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = json.load(open(os.path.join(ROOT, "build", "words.json")))
WORDS, DUR = W["words"], W["duration"]
NS = [w["n"] for w in WORDS]


def find(phrase, after=0.0, edge="start"):
    p = [norm(x) for x in phrase.split() if norm(x)]
    for i in range(len(NS) - len(p) + 1):
        if WORDS[i]["t0"] + 1e-6 >= after and NS[i:i + len(p)] == p:
            return WORDS[i]["t0"] if edge == "start" else WORDS[i + len(p) - 1]["t1"]
    raise SystemExit(f"phrase not found after {after:.1f}s: {phrase!r}")


# ---------------------------------------------------------------- layout track
# type, title (action phrase), start phrase, cues {name: phrase or "phrase|end"}, data
L = [
 dict(type="AVATAR_TALK", title="Open on the magician", start="My wallet does a magic trick", push=["magic trick"]),
 dict(type="GLASS_UI", title="Watch the $20 vanish", recipe="WALLET", start="I put $20 in on Monday",
      cues=dict(mon="I put $20", tada="Ta-da!", fri="By Friday", smoke="No smoke", rabbit="No rabbit", gone="Just gone")),
 dict(type="AVATAR_TALK", title="Admit you're the magician", start="The only problem?", push=["I'm the magician"]),
 dict(type="MYTH_FLIP", n=1, title="Fun gets its own spot", start="Mix-up number one",
      myth="A budget means no more fun.", truth="Fun just gets its own spot in the box.", key="spot", hold=2.6),
 dict(type="AVATAR_TALK", title="See why people never start", start="This is why most people never start"),
 dict(type="GRID_SLIDE", variant="LUNCHBOX", title="Pack the lunchbox", start="But think about a lunchbox",
      cues=dict(veg="only put in vegetables", sandwich="a sandwich", fruit="some fruit", treat="a little treat")),
 dict(type="GRID_SLIDE", variant="TREAT", title="Plan $2 for a treat", start="A budget works the same way",
      cues=dict(ten="Say you get $10", two="plan $2 of it", part="That $2 is part of the plan", follow="You're following them")),
 dict(type="AVATAR_TALK", title="Give fun its spot", start="Fun isn't banned"),
 dict(type="MYTH_FLIP", n=2, title="Every dollar matters more", start="Mix-up number two",
      myth="I don't have enough money to need a budget.", truth="The less money you have, the more every dollar matters.", key="every dollar", hold=2.4),
 dict(type="AVATAR_TALK", title="Flip it around", start="It's actually the other way around"),
 dict(type="GLASS_UI", title="Drop $2 from two wallets", recipe="TWO_WALLETS", start="Imagine two people",
      cues=dict(a="One has $100", b="The other has $10", drop="They both drop $2", first="For the first person", notice="They barely notice",
                second="For the second person", fifth="That's a fifth")),
 dict(type="AVATAR_TALK", title="Make every dollar count", start="So the less money you have", push=["every dollar matters"]),
 dict(type="BROLL", title="Stop the spills", start="If you have a big bucket of water", clip="b_water",
      prompt="Extreme slow-motion macro of a single water droplet falling into a crystal glass of water on polished black marble, dark moody studio light, warm rim highlights, glossy reflections, shallow depth of field, slow push-in, cinematic 4K. No text, no logos, no people."),
 dict(type="AVATAR_TALK", title="Know what you're working with", start="A budget is how you stop the spills"),
 dict(type="MYTH_FLIP", n=3, title="Write it down", start="Mix-up number three",
      myth="I can keep it all in my head.", truth="So write it down.", key="write", hold=2.4),
 dict(type="AVATAR_TALK", title="Spot the little spends", start="Your head is great at lots of things"),
 dict(type="AVATAR_CALC", title="Add up a $1 snack", start="Let's say you buy a $1 snack every day",
      steps=[dict(at="$1 a day is $7 a week", expr=["$1", "×", "7"], result="$7", label="per week"),
             dict(at="$7 a week is about $30 a month", expr=["$7/wk", "→", "month"], result="≈ $30", label="per month"),
             dict(at="And in one year", expr=["$1", "×", "365"], result="$365", label="per year")]),
 dict(type="BROLL", title="Grains make a beach", start="One grain of sand is nothing", clip="b_beach",
      prompt="Slow cinematic aerial drone glide over a pristine private white-sand beach at golden hour, turquoise water, a minimalist modern luxury villa at the edge of the sand, warm highlights, deep shadows, no people, no text, no logos."),
 dict(type="GLASS_UI", title="Write it down anywhere", recipe="NOTES", start="So write it down",
      cues=dict(paper="On paper", notes="in your notes app", anywhere="anywhere", see="you can see it")),
 dict(type="MYTH_FLIP", n=4, title="Little spends show what you care about", start="Mix-up number four",
      myth="Little spends don't matter.", truth="Little spends show you what you really care about.", key="care", hold=2.4),
 dict(type="AVATAR_TALK", title="Keep the big things big", start="Now, I'm not telling you", push=["matter much more"]),
 dict(type="AVATAR_CALC", title="Total the snack habit", start="Let's say you spend $20 a week",
      steps=[dict(at="That's $80 a month", expr=["$20", "×", "4"], result="$80", label="per month"),
             dict(at="And over a whole year", expr=["$20", "×", "52"], result="$1,040", label="per year")]),
 dict(type="GRID_SLIDE", variant="PILLS", title="Spend $1,040 on purpose", start="That could be a new bike",
      heading="What $1,040 could be", items=[("A new bike", "a new bike"), ("A family day out", "a family day out"), ("A big start on your savings", "a big start on your savings")]),
 dict(type="AVATAR_TALK", title="Find your $1,040", start="If the snacks make you happy"),
 dict(type="MYTH_FLIP", n=5, title="Tend it like a garden", start="Mix-up number five",
      myth="Once I make a budget, I'm done.", truth="It's more like a garden.", key="garden", hold=1.2),
 dict(type="BROLL", title="Tend the garden", start="A budget isn't a statue", clip="b_garden",
      prompt="Slow gimbal glide through a manicured formal garden of a modern luxury estate at dusk, sculpted hedges, a long reflecting pool, warm garden lights, glass villa softly lit in the background, cinematic shallow depth of field, no people, no text."),
 dict(type="AVATAR_TALK", title="Plan for the birthday", start="Here's an example"),
 dict(type="AVATAR_TALK", title="Check in once a month", start="That's what checking your budget does"),
 dict(type="MYTH_FLIP", n=6, title="Get back on the bike", start="Mix-up number six",
      myth="I messed up, so budgeting doesn't work for me.", truth="The only budget that truly fails is the one you stop using.", key="stop using", hold=2.4),
 dict(type="AVATAR_TALK", title="Expect to go over", start="You will go over"),
 dict(type="AVATAR_CALC", title="Fix a $5 overspend", start="Let's say you planned $30 for fun",
      steps=[dict(at="You went over by $5", expr=["$35", "−", "$30"], result="$5", label="over"),
             dict(at="Next month, you just plan $25", expr=["$30", "−", "$5"], result="$25", label="next month's fun")]),
 dict(type="BROLL", title="Wobble and get back on", start="It's like learning to ride a bike", clip="b_bike",
      prompt="Cinematic low tracking shot of a premium carbon road bicycle rolling along an empty coastal cliff road at golden hour, rider seen from behind, ocean below, shallow depth of field, warm highlights, deep rich blacks, no logos, no text."),
 dict(type="AVATAR_TALK", title="Keep using it", start="Nobody says", push=["stop using"]),
 dict(type="CHAPTER_CARD", title="Meet the three-jar plan", start="So what does it all come down to?", num="3", label="The Three-Jar Plan", hold=2.0),
 dict(type="GRID_SLIDE", variant="JARS", title="Fill the three jars", start="Take away all six mix-ups",
      cues=dict(j1="Jar number one", j2="Jar number two", j3="Jar number three")),
 dict(type="GRID_SLIDE", variant="PIE", title="Split it 50/30/20", start="A simple way to start",
      cues=dict(half="Half goes to needs", third="about a third to wants", fifth="a fifth to future you",
                ten="Let's try it with a $10 allowance", t5="$5 goes in the needs jar", t3="$3 goes in the wants jar", t2="$2 goes in the future-you jar",
                k="Now let's try it with a grown-up's", k5="$500 for needs", k3="$300 for wants", k2="$200 for future you")),
 dict(type="AVATAR_TALK", title="Be honest about rent", start="But here's the honest part"),
 dict(type="AVATAR_CALC", title="Adjust the jars for rent", start="Maybe $600 for needs",
      steps=[dict(at="Maybe $600 for needs", expr=["$600", "+", "$250", "+", "$150"], result="$1,000", label="still adds up", tapcues=["$600 for needs", "$250 for wants", "$150 for future you", "adds up"])]),
 dict(type="AVATAR_TALK", title="Always pay future you", start="The numbers are a starting point"),
 dict(type="GLASS_UI", title="Pay future you first", recipe="PAY_FIRST", start="And here's the trick that makes it easier",
      cues=dict(first="Pay future you first", arrives="The moment money arrives", away="put the future-you money away", grows="Watch how it grows")),
 dict(type="AVATAR_CALC", title="Watch the savings grow", start="If a child saves $2 a week",
      steps=[dict(at="If a child saves $2 a week", expr=["$2", "×", "4 wks"], result="$8", label="per month", resat="$8 a month"),
             dict(at="In one year, that's $104", expr=["$2", "×", "52 wks"], result="$104", label="per year"),
             dict(at="If a grown-up saves $200", expr=["$200", "×", "12"], result="$2,400", label="per year", resat="that's $2,400")]),
 dict(type="AVATAR_TALK", title="Start with future you", start="Same idea"),
 dict(type="BROLL", title="Skip the overnight myth", start="None of this makes you rich overnight", clip="b_skyline",
      prompt="Slow cinematic drone push toward a glass skyscraper skyline at dusk, city lights switching on, warm amber highlights against deep blue-black sky, glossy reflections, no text, no logos."),
 dict(type="BROLL", title="Make the exciting possible", start="But it's the boring thing", clip="b_car",
      prompt="Slow orbit around a sleek dark grey supercar parked in a minimalist concrete private garage, soft overhead light strips, glossy reflections, deep blacks, warm highlights, shallow depth of field, no badges, no license plate, no text."),
 dict(type="AVATAR_TALK", title="Check in every month", start="The hard part isn't the math"),
 dict(type="GLASS_UI", title="Grab the free workshop", recipe="WORKSHOP", start="That's why I made",
      cues=dict(steps="step by step", never="even if you've never", free="It's free", link="the link is in the description")),
 dict(type="AVATAR_TALK", title="Say yes on purpose", start="A budget isn't about saying no"),
 dict(type="END_SCREEN", title="Watch what's next", start="If you're ready, watch this video right here",
      cues=dict(card="watch this video right here", grow="once it starts to grow")),
]

# ---------------------------------------------------------------- overlay track (A-roll only)
O = [
 dict(type="TEXT_ON_AROLL", pattern="contrast", start="The only problem?", a="The magician", b="No idea how it works", cueb="I have no idea", end="how the trick works.|end"),
 dict(type="DISCLAIMER_CARD", start="And trust me", end="more times than I can count.|end"),
 dict(type="HOOK_SPLIT_TITLE", start="Here are the six biggest", big_a="SIX", small_a="Biggest mix-ups", big_b="REALLY", small_b="Simple", strike="once they're gone", cueb="really simple", end="really simple.|end"),
 dict(type="TEXT_ON_AROLL", pattern="build", start="Fun isn't banned", words=["Fun", "gets", "its", "own", "spot"], key="spot", cue_words=["Fun", "just gets", "its", "own", "spot"], end="spot in the box.|end"),
 dict(type="TEXT_ON_AROLL", pattern="strike", start="Of course, a budget can't fix", a="Guessing", strikecue="so you're not guessing", end="so you're not guessing.|end"),
 dict(type="TEXT_ON_AROLL", pattern="double", start="Big things, like rent and debt", a="Rent & debt", b="Little spends", cueb="But little spends", end="really care about.|end"),
 dict(type="TEXT_ON_AROLL", pattern="build", start="If not, you just found", words=["You", "just", "found", "$1,040"], key="$1,040", cue_words=["you", "just", "found", "$1,040"], end="something you want more.|end"),
 dict(type="PROGRESS_TRACKER", start="Your friend's birthday is in three weeks", end="when the birthday comes.|end",
      stages=[("WEEK 1 · $5", "put away $5 a week"), ("WEEK 2 · $10", "for three weeks"), ("WEEK 3 · $15", "the money is ready"), ("BIRTHDAY", "when the birthday comes")],
      sticker=("$15 ALL AT ONCE", "you'll need $15 all at once")),
 dict(type="CHECKLIST_ON_AROLL", start="So look at it once a month", end="What's coming next?|end",
      items=[("Once a month · 10 min", "Ten minutes"), ("What worked?", "What worked?"), ("What didn't?", "What didn't?"), ("What's coming next?", "What's coming next?")]),
 dict(type="TEXT_ON_AROLL", pattern="contrast", start="You will go over", a="Over by $5", b="Back to even", cueb="you're back to even", end="you're back to even.|end", startcue="You went over by $5"),
 dict(type="TEXT_ON_AROLL", pattern="build", start="For lots of grown-ups, rent alone", words=["Rent", "$600", "of", "$1,000"], key="$600", cue_words=["rent alone", "$600", "out of", "$1,000"], end="That's okay.|end"),
 dict(type="TEXT_ON_AROLL", pattern="build", start="The only must is this", words=["Future", "you", "always", "gets", "something"], key="something", cue_words=["future you", "always", "always", "gets", "something"], end="even if it's small.|end"),
 dict(type="TEXT_ON_AROLL", pattern="strike2", start="A budget isn't about saying no", a="Saying no", b="Saying yes, on purpose", key="yes", cueb="saying yes", end="on purpose.|end"),
]

# ---------------------------------------------------------------- resolve
LEAD = 0.12  # graphics land a hair before the word


def resolve_phrase(p, after):
    if p.endswith("|end"):
        return find(p[:-4], after, "end")
    return find(p, after) - LEAD


def resolve(track, is_layout):
    out, cursor = [], 0.0
    for b in track:
        b = dict(b)
        b["t0"] = max(0.0, find(b["start"], cursor) - (0.25 if is_layout else LEAD))
        if b["t0"] < 0.3:
            b["t0"] = 0.0
        cursor = b["t0"]
        for k in ("cueb", "strike", "strikecue", "startcue"):
            if k in b:
                b[k + "_t"] = resolve_phrase(b[k], cursor)
        if "cues" in b:
            b["cues_t"] = {k: resolve_phrase(v, cursor) for k, v in b["cues"].items()}
        if "push" in b:
            b["push_t"] = [find(p, cursor) for p in b["push"]]
        if "steps" in b:
            c = cursor
            for s in b["steps"]:
                s["t"] = find(s["at"], c) - LEAD
                c = s["t"]
                if "resat" in s:
                    s["res_t"] = find(s["resat"], c)
                if "tapcues" in s:
                    s["taps_t"] = [find(x, c) for x in s["tapcues"]]
        if "items" in b:
            b["items_t"] = [resolve_phrase(p, cursor) for _, p in b["items"]]
        if "stages" in b:
            b["stages_t"] = [resolve_phrase(p, cursor) for _, p in b["stages"]]
            b["sticker_t"] = resolve_phrase(b["sticker"][1], cursor)
        if "cue_words" in b:
            c = cursor
            b["words_t"] = []
            for p in b["cue_words"]:
                t = resolve_phrase(p, c)
                b["words_t"].append(t)
                c = t + LEAD
        if "end" in b:
            b["t1"] = resolve_phrase(b["end"], cursor) + 0.5
        if b["type"] == "MYTH_FLIP":
            b["myth_end"] = find(b["myth"].split()[-1], cursor, "end")
        out.append(b)
    if is_layout:
        for a, nxt in zip(out, out[1:] + [None]):
            a["t1"] = nxt["t0"] if nxt else DUR
        # myth cards hold until the truth has landed; the next beat starts later (voice continues under the card)
        for a, nxt in zip(out, out[1:]):
            want = 0
            if a["type"] == "MYTH_FLIP":
                want = a["myth_end"] + a.get("hold", 2.0)
            if a["type"] == "AVATAR_CALC":   # result must land and hold 1.5 s before the phone leaves
                last = a["steps"][-1]
                res = last.get("res_t") or (last["taps_t"][-1] if "taps_t" in last else last["t"] + .2 + len(last["expr"]) * .34 + .45)
                want = res + .9 + 1.5 + .55
            if want:
                if want > a["t1"] and nxt["t1"] - want > 2.0:
                    a["t1"] = nxt["t0"] = round(want, 3)
    return out


layout, overlays = resolve(L, True), resolve(O, False)

# sanity: overlays must sit on A-roll beats only (never over full-screen inserts)
for o in overlays:
    host = [l for l in layout if l["t0"] <= o["t0"] < l["t1"]][0]
    if host["type"] not in ("AVATAR_TALK",):
        print(f"WARN overlay {o['type']} @ {o['t0']:.1f}s sits on {host['type']} ({host['title']})")

json.dump({"duration": DUR, "timing": W["mode"], "layout": layout, "overlays": overlays},
          open(os.path.join(ROOT, "build", "timeline.json"), "w"), indent=1)

# human-readable beat sheet
fmt = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
rows = ["| # | In | Out | Scene type | Segment | Script line (start) |", "|---|---|---|---|---|---|"]
for i, b in enumerate(layout, 1):
    rows.append(f"| {i} | {fmt(b['t0'])} | {fmt(b['t1'])} | `{b['type']}` | {b['title']} | “{b['start']}…” |")
ov = ["| In | Out | Overlay | Anchor |", "|---|---|---|---|"]
for o in overlays:
    ov.append(f"| {fmt(o['t0'])} | {fmt(o['t1'])} | `{o['type']}` {o.get('pattern', '')} | “{o['start']}…” |")
open(os.path.join(ROOT, "beat_sheet.md"), "w").write(
    f"# Beat sheet — Budgeting Magic Trick\n\nTiming source: **{W['mode']}** · runtime {fmt(DUR)} · {len(layout)} segments\n\n"
    + "\n".join(rows) + "\n\n## Overlays on A-roll\n\n" + "\n".join(ov) + "\n")
print(f"{len(layout)} layout beats, {len(overlays)} overlays, {DUR:.1f}s")
