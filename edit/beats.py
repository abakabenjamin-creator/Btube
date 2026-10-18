"""Beat sheet for "Best one mp4" in the Glass UI Explainer style.

Single source of truth for the renderer (scenes/*.js reads beats.json) and the
compositor (composite.py). Times are seconds on the source timeline: the
voice track is used untouched, so output time == source time.

Run `python3 beats.py` to regenerate beats.json and BEAT_SHEET.md.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
DURATION = 413.12

# Face anchor (eyes) of the locked-off presenter shot at 1920x1080.
FACE = (915, 385)

# Avatar camera keys: (abs_time, scale, ease). Ease applies to the move that
# ends at that key. "expo" = punch (ease-out-expo), "cubic" = ease-in-out-cubic.
B = []


def beat(id, title, t0, t1, kind, **kw):
    B.append(dict(id=id, title=title, t0=t0, t1=t1, type=kind, **kw))


# ---------------------------------------------------------------- 1. Hook
beat("B01", "Hear the hook", 0.00, 5.80, "AVATAR_PUSH",
     cam=[(0.0, 1.00, "cubic"), (4.20, 1.05, "cubic"), (4.60, 1.15, "expo"), (5.80, 1.15, "cubic")],
     overlay="ov_hook", trans="cut-in",
     screen="Right-side glass stack, three pills cross out as spoken: A stock / A house / Not even a business",
     sound="Suspense hook starts at 0; soft tick per pill strike; low hit on the punch-in")
beat("B02", "Stick around for the answer", 5.80, 9.70, "AVATAR_TALK",
     cam=[(5.80, 1.15, "cubic"), (6.60, 1.04, "cubic"), (9.70, 1.00, "cubic")],
     overlay="ov_stick",
     screen="Lavender sticker 'STICK AROUND' pops top-right above shoulder on 'stick around'",
     sound="Sticker pop")
beat("B03", "Read the fine print", 9.70, 15.10, "GLASS_UI", recipe="custom (A-open)",
     scene="g_disclaimer", trans="whip",
     screen="Object card with yellow label emerges from blur; giant pill types the disclaimer line; yellow hex sticker 'NOT FINANCIAL ADVICE'",
     sound="Whoosh in, click, key ticks, sticker pop")
# ------------------------------------------------------------- 2. Recap
beat("B04", "Recap part one", 15.10, 21.60, "AVATAR_TALK",
     cam=[(15.10, 1.00, "cubic"), (21.60, 1.07, "cubic")],
     overlay="ov_recap", trans="whip",
     screen="Side glass card 'PART 1 RECAP': 'Income doesn't make you a millionaire.' then 'Ownership does.' with blue highlight",
     sound="Whoosh, shimmer on highlight")
beat("B05", "Watch cash lose value", 21.60, 27.40, "BROLL",
     clips=[("20816", 1.5, 2.9), ("3673", 3.0, 2.9)], trans="blur",
     screen="Clean luxury B-roll: golden hourglass (inflation/time) -> macro watch gears turning (compounding)",
     sound="Airy whoosh in")
beat("B06", "Run the compounding math", 27.40, 36.60, "AVATAR_CALC",
     cam=[(27.40, 1.00, "cubic"), (36.60, 1.03, "cubic")],
     slide=(27.55, 35.95), overlay="ov_calc1", trans="blur",
     screen="Side-slide + phone calculator: 1,000 x 12 = 12,000/yr, then 12,000 x (1.08^27 - 1) / 0.08 = $1,048,209 (roughly a million); lavender sticker 'ILLUSTRATION ONLY'",
     sound="Tap per key, confirm tone on each result, sticker pop")
beat("B07", "See what's happening now", 36.60, 40.80, "AVATAR_PUSH",
     cam=[(36.60, 1.03, "cubic"), (39.70, 1.06, "cubic"), (40.05, 1.15, "expo"), (40.80, 1.15, "cubic")],
     screen="Punch-in on 'right now'", sound="Low hit")
# --------------------------------------------------------- 3. Inflation
beat("B08", "Check today's inflation", 40.80, 46.80, "GLASS_UI", recipe="B (Prove It)",
     scene="g_inflation", trans="whip",
     screen="Giant input pill types the line, pull back, response panel: '3.4%' highlighted, citation chip, cursor taps it, 'CHECKING SOURCES' sticker, source preview card slides in",
     sound="Key ticks, whoosh pull-back, shimmer, click, pop")
beat("B09", "Do the math on $20,000", 46.80, 57.60, "AVATAR_CALC",
     cam=[(46.80, 1.00, "cubic"), (55.60, 1.02, "cubic"), (56.30, 1.06, "cubic"), (56.55, 1.14, "expo"), (57.60, 1.14, "cubic")],
     slide=(46.90, 55.60), overlay="ov_calc2", trans="whip",
     screen="Phone calculator: 20,000 / 1.034^10 = $14,316 (about $14,300); exit, punch-in on 'tells the truth'",
     sound="Taps, confirm tone, low hit")
# ---------------------------------------------------- 4. Three places
beat("B10", "Pick your three paths", 57.60, 64.30, "GLASS_UI", recipe="A (Open & Add)",
     scene="g_three", trans="whip",
     screen="Camera slams on giant pill typing 'So where does the money actually go?', pull back, three object cards fan in: Real estate / Stocks / Your own business; sticker 'THREE MAIN PLACES'",
     sound="Key ticks, whoosh, pops")
beat("B11", "Start with real estate", 64.30, 68.50, "BROLL",
     clips=[("4196", 3.0, 4.2)], trans="whip",
     screen="Clean B-roll: slow glide through a luxury suite", sound="Whoosh")
beat("B12", "Look at borrowing costs", 68.50, 71.30, "AVATAR_PUSH",
     cam=[(68.50, 1.00, "cubic"), (70.00, 1.03, "cubic"), (70.30, 1.14, "expo"), (71.30, 1.14, "cubic")],
     trans="blur", screen="Punch-in on 'right now'", sound="Low hit")
beat("B13", "Check the mortgage rate", 71.30, 82.50, "GLASS_UI", recipe="B (Prove It)",
     scene="g_mortgage", trans="whip",
     screen="Rate card: 30-year mortgage 7.28% (Oct 1) vs 6.34% a year earlier, line chart draws upward, extreme push-in on 7.28% with highlight + citation chip, sticker 'SAME HOUSE, MORE COST'",
     sound="Whoosh, counter ticks, shimmer, pop")
beat("B14", "Count the hidden costs", 82.50, 95.40, "AVATAR_TALK",
     cam=[(82.50, 1.00, "cubic"), (89.60, 1.07, "cubic"), (93.10, 1.04, "cubic"), (95.40, 1.00, "cubic")],
     overlay="ov_costs", trans="whip",
     screen="Side checklist builds row by row on the words: Down payment / Repairs / Insurance / Taxes / Months with no tenant; yellow hex 'ANYTHING CAN BREAK'",
     sound="Soft tick per row, pop")
beat("B15", "Respect leverage", 95.40, 100.60, "GLASS_UI", recipe="custom",
     scene="g_leverage", trans="zoom",
     screen="Leverage object card: gains bar grows mint, then losses bar mirrors it in red; lavender sticker 'CUTS BOTH WAYS'",
     sound="Rise, pop")
# --------------------------------------------------------------- 5. Stocks
beat("B16", "Now, stocks", 100.60, 106.20, "BROLL",
     clips=[("4087", 1.5, 5.6)], trans="whip",
     screen="Clean B-roll: slow push across a lit skyline at night", sound="Whoosh")
beat("B17", "Know the risk", 106.20, 110.30, "AVATAR_PUSH",
     cam=[(106.20, 1.00, "cubic"), (106.90, 1.02, "cubic"), (107.20, 1.14, "expo"), (109.00, 1.14, "cubic"), (110.30, 1.06, "cubic")],
     trans="blur", screen="Punch-in on 'very risky'", sound="Low hit")
beat("B18", "Read this month's record", 110.30, 119.00, "GLASS_UI", recipe="B (Prove It)",
     scene="g_sp500", trans="whip",
     screen="Index card: line climbs to a record, value counts to 7,801.77, 'October 7th' chip, highlight + citation chip, sticker 'NEW RECORD'",
     sound="Rise, ticks, shimmer, pop")
beat("B19", "See the pullback", 119.00, 130.00, "GLASS_UI", recipe="B (Prove It)",
     scene="g_pullback", trans="whip",
     screen="Response panel rows reveal on the words: oil above $100 a barrel / 10-year Treasury yield past 5%; headline 'A record high and a pullback in the same week' with highlight; lavender 'CHECKING SOURCES'",
     sound="Typing dots, rise, shimmer, pop")
beat("B20", "Watch it wobble", 130.00, 134.60, "GLASS_UI", recipe="custom",
     scene="g_wobble", trans="focus",
     screen="Mint line draws in sync: climbs / wobbles / keeps going; camera tracks the line tip",
     sound="Soft whoosh")
beat("B21", "Don't time the market", 134.60, 143.50, "AVATAR_TALK",
     cam=[(134.60, 1.00, "cubic"), (136.90, 1.03, "cubic"), (137.20, 1.14, "expo"), (138.60, 1.14, "cubic"), (140.00, 1.06, "cubic"), (143.50, 1.00, "cubic")],
     overlay="ov_timeit", trans="whip",
     screen="Punch-in on 'losing game'; yellow hex 'DON'T TIME IT' on 'So don't try'",
     sound="Low hit, pop")
# ------------------------------------------------------------- 6. Business
beat("B22", "Build your own business", 143.50, 150.40, "BROLL",
     clips=[("241", 3.0, 3.5), ("13218", 2.0, 3.4)], trans="blur",
     screen="Clean B-roll: signing pen on a contract -> silhouetted executives at a glass wall",
     sound="Airy whoosh")
beat("B23", "Own the whole thing", 150.40, 158.80, "GLASS_UI", recipe="custom",
     scene="g_ownwhole", trans="whip",
     screen="Two object cards in 3D: 'With stocks' shows a tiny slice; 'With your own business' fills the whole ring and gets the yellow active border",
     sound="Whoosh, click, rise")
beat("B24", "Decide everything", 158.80, 163.90, "GLASS_UI", recipe="custom",
     scene="g_decide", trans="whip",
     screen="Cursor clicks four mint chips as spoken: The product / The customers / The pricing / How fast it grows",
     sound="Clicks with ripples")
beat("B25", "Earn beyond your day job", 163.90, 171.20, "AVATAR_FRAMED", ring=True,
     overlay="ov_framed_biz", trans="blur",
     screen="RING_DETECTED -> framed card right (white border, soft shadow, light grid); left: title + numbered rows 'Income outside your day job' / 'An asset you sell or pass down'",
     sound="Soft tick per row")
beat("B26", "See the business boom", 171.20, 184.00, "GLASS_UI", recipe="B (Prove It)",
     scene="g_census1", trans="blur",
     screen="Stat card counts up to 578,926 new business applications (July); 'the most since ... 2004' highlighted with citation chip; preview card of the source; sticker 'RECORD FILINGS'",
     sound="Counter ticks, shimmer, pop")
beat("B27", "Not every filing lasts", 184.00, 188.40, "AVATAR_TALK",
     cam=[(184.00, 1.00, "cubic"), (188.40, 1.06, "cubic")], trans="whip",
     screen="Slow zoom in", sound="")
beat("B28", "Separate starts from businesses", 188.40, 200.80, "GLASS_UI", recipe="custom",
     scene="g_census2", trans="whip",
     screen="Bars: 578,926 applications vs about 29,959 with payroll within a year; stickers 'STARTING IS EASY' then 'LASTING IS HARD'",
     sound="Rise, pops")
beat("B29", "Start lean", 200.80, 216.40, "AVATAR_TALK",
     cam=[(200.80, 1.00, "cubic"), (201.40, 1.02, "cubic"), (201.70, 1.12, "expo"), (202.60, 1.12, "cubic"), (208.40, 1.03, "cubic"), (216.40, 1.08, "cubic")],
     overlay="ov_lean", trans="whip",
     screen="Punch-in on 'sugarcoat'; side card: Businesses fail / It takes time / It takes money, then Start lean / Get paid early / Test the idea... / Never put in money you can't afford to lose",
     sound="Ticks per row")
# --------------------------------------------------------------- 7. You
beat("B30", "Here's the answer", 216.40, 218.50, "AVATAR_PUSH",
     cam=[(216.40, 1.00, "cubic"), (217.55, 1.13, "expo"), (218.50, 1.13, "cubic")],
     screen="Punch-in on 'promised you'", sound="Low hit, soft rise into reveal")
beat("B31", "Invest in yourself", 218.50, 224.90, "GLASS_UI", recipe="A (Open & Add)",
     scene="g_you", trans="zoom",
     screen="Hero pill types 'The best investment you'll ever make is you.' running off frame; pull back; four cards fan in: Your skills / Your knowledge / Your network / Your discipline",
     sound="Key ticks, whoosh, pops")
beat("B32", "Become a better you", 224.90, 232.00, "BROLL",
     clips=[("33029", 1.0, 3.6), ("28888", 1.3, 3.5)], trans="blur",
     screen="Clean B-roll: tailored suit, cufflink adjust -> fine watch on wrist (monochrome)",
     sound="Whoosh")
beat("B33", "Nothing can take it away", 232.00, 240.40, "AVATAR_TALK",
     cam=[(232.00, 1.08, "cubic"), (236.20, 1.03, "cubic"), (240.40, 1.00, "cubic")], trans="blur",
     screen="Slow zoom out (big-picture + topic change)", sound="")
# -------------------------------------------------------------- 8. Index
beat("B34", "Start with index funds", 240.40, 246.00, "GLASS_UI", recipe="custom",
     scene="g_indextype", trans="whip",
     screen="Giant pill types 'learn about low-cost index funds first.'; yellow hex 'DON'T PICK WINNERS' on 'Picking winners is a trap'",
     sound="Key ticks, pop")
beat("B35", "Remember yesterday's winner", 246.00, 255.60, "GLASS_UI", recipe="B (Prove It)",
     scene="g_winner", trans="whip",
     screen="Market-share card: line high ('They owned the phone market.'), drops when 'smartphones showed up'; headline highlight 'Yesterday's winner isn't automatically tomorrow's winner.' (no company logos)",
     sound="Whoosh, falling tone, shimmer")
beat("B36", "Own the whole market", 255.60, 264.40, "GLASS_UI", recipe="custom",
     scene="g_indexgrid", trans="zoom",
     screen="Index fund card fills with hundreds then thousands of tiles; sticker 'DIVERSIFICATION', then lavender 'STILL HAS RISK'",
     sound="Shimmer cascade, pops")
beat("B37", "Ride it out", 264.40, 270.00, "AVATAR_TALK",
     cam=[(264.40, 1.06, "cubic"), (270.00, 1.00, "cubic")], trans="whip",
     screen="Slow zoom out", sound="")
beat("B38", "Know what you own", 270.00, 277.40, "GLASS_UI", recipe="B (Prove It)",
     scene="g_lookfor", trans="whip",
     screen="Giant pill types 'What do you look for?'; user bubble + typing dots; response panel bullets reveal on the words: Broad diversification / Low fees / Know exactly what the fund actually owns",
     sound="Key ticks, dots, rise")
beat("B39", "Do your diligence", 277.40, 290.10, "AVATAR_TALK",
     cam=[(277.40, 1.00, "cubic"), (279.20, 1.03, "cubic"), (279.50, 1.13, "expo"), (281.00, 1.13, "cubic"), (284.80, 1.03, "cubic"), (290.10, 1.07, "cubic")],
     overlay="ov_hype", trans="whip",
     screen="Punch-in on 'influencer said so'; lavender sticker 'IGNORE THE HYPE'; yellow hex 'DO YOUR DILIGENCE' on the question",
     sound="Low hit, pops")
# ---------------------------------------------------------- 9. Foundation
beat("B40", "Fix your foundation", 290.10, 299.70, "GLASS_UI", recipe="custom",
     scene="g_foundation", trans="whip",
     screen="Section title 'Fix your foundation' (yellow accent) over the orbs; four numbered step pills; step 1 'High-interest debt' gets the mint border",
     sound="Rise, ticks, click")
beat("B41", "Clear high-interest debt", 299.70, 313.30, "AVATAR_CALC",
     cam=[(299.70, 1.00, "cubic"), (311.00, 1.02, "cubic"), (311.35, 1.12, "expo"), (313.30, 1.12, "cubic")],
     slide=(299.80, 310.75), overlay="ov_calc3", trans="whip",
     screen="Phone calculator: 5,000 x 20% = $1,000 a year; exit; punch-in on 'Pay that off first'",
     sound="Taps, confirm tone, low hit")
beat("B42", "Build an emergency fund", 313.30, 324.50, "GLASS_UI", recipe="custom",
     scene="g_emergency", trans="whip",
     screen="Step 2 card: months meter fills 3 -> 6 months of expenses, 'High-yield savings account' row with mint border; chip 'Not invested'; sticker 'SAFETY NET'",
     sound="Ticks, chime, pop")
beat("B43", "Plan for bad days", 324.50, 333.80, "AVATAR_TALK",
     cam=[(324.50, 1.00, "cubic"), (332.40, 1.05, "cubic"), (332.75, 1.14, "expo"), (333.80, 1.14, "cubic")],
     trans="whip", screen="Slow zoom in, punch-in on 'worst possible time'", sound="Low hit")
beat("B44", "Check your savings rate", 333.80, 343.70, "AVATAR_PHONE_DEMO",
     cam=[(333.80, 1.14, "cubic"), (334.40, 1.00, "cubic"), (343.70, 1.02, "cubic")],
     slide=(334.20, 343.25), overlay="ov_phone_save", trans="cut-in",
     screen="Side-slide + phone: original savings app; rate row highlights on 'paying today' (close to nothing); 'Move to high-yield savings' button tapped on 'Move everything'",
     sound="Taps, confirm chime")
beat("B45", "Grab your employer match", 343.70, 354.10, "GLASS_UI", recipe="C (Hear It)-style button",
     scene="g_match", trans="whip",
     screen="Step 3 card: 'Your contribution' + 'Employer match' coins stack; glowing gradient button; yellow hex 'FREE MONEY'; checklist: Check the match / Check the rules / Take it if you can",
     sound="Click, chime, pop, ticks")
beat("B46", "Put the plan to work", 354.10, 363.00, "GLASS_UI", recipe="custom",
     scene="g_automate", trans="whip",
     screen="Step 4 card: amount pill 'every month', cursor flips an 'Automate' toggle on 'automate it'; lavender sticker 'STOP CHECKING'",
     sound="Click, pop")
beat("B47", "Split the $20,000", 363.00, 380.00, "AVATAR_TALK",
     cam=[(363.00, 1.07, "cubic"), (371.00, 1.02, "cubic"), (375.60, 1.06, "cubic"), (380.00, 1.00, "cubic")],
     overlay="ov_split", trans="whip",
     screen="Side card: 'You don't have to invest all 20,000 at once' + rows: emergencies or things coming up soon / your skills or a business idea / built around your real life",
     sound="Ticks")
# --------------------------------------------------------------- 10. Outro
beat("B48", "Here's the catch", 380.00, 388.00, "AVATAR_PUSH",
     cam=[(380.00, 1.00, "cubic"), (382.75, 1.03, "cubic"), (383.10, 1.14, "expo"), (384.00, 1.14, "cubic"), (384.80, 1.05, "cubic"), (388.00, 1.08, "cubic")],
     screen="Punch-in on 'here's the catch'", sound="Low hit")
beat("B49", "Coming in part three", 388.00, 391.80, "GLASS_UI", recipe="custom",
     scene="g_part3", trans="zoom",
     screen="Section title card 'Part three' with yellow accent 'how to stop it'",
     sound="Rise")
beat("B50", "Tell me your path", 391.80, 399.50, "GLASS_UI", recipe="custom",
     scene="g_poll", trans="whip",
     screen="Comment poll card 'Which path are you leaning towards?'; cursor hovers each option as spoken: Real estate / Stocks / Building your own business (covers the visible ring at 392-399 s)",
     sound="Clicks")
beat("B51", "Get the blueprint", 399.50, 408.40, "AVATAR_TALK",
     cam=[(399.50, 1.00, "cubic"), (408.40, 1.07, "cubic")],
     overlay="ov_comment", trans="whip",
     screen="Side comment pill types W-E-A-L-T-H letter by letter on the spelling; yellow hex 'EXACT BLUEPRINT'",
     sound="Key ticks, pop")
beat("B52", "Subscribe and follow", 408.40, DURATION, "AVATAR_TALK",
     cam=[(408.40, 1.07, "cubic"), (412.20, 1.00, "cubic"), (DURATION, 1.00, "cubic")],
     overlay="ov_end",
     screen="Glass gradient 'Subscribe' button above shoulder, cursor clicks on 'Subscribe'; fade to black on 'blessings'",
     sound="Click, music tail")

# B-roll sources (Mixkit Stock Video Free License, mixkit.co).
BROLL_SOURCES = {
    "20816": "Hourglass with golden sand",
    "3673": "Machinery of a very close watch",
    "4196": "Luxury hotel room panning shot",
    "4087": "New York City view at night",
    "241": "Signing a contract",
    "13218": "Silhouette of business people talking by highrise window",
    "33029": "Business entrepreneur man putting on a watch",
    "28888": "Elegant man in suit checks the time on his luxurious watch",
}


def script_for(words, t0, t1):
    """Exact transcript words whose midpoint falls inside [t0, t1)."""
    out = [w["w"] for w in words if t0 <= (w["s"] + w["e"]) / 2 < t1]
    return "".join(out).strip()


def main():
    tr = json.load(open(os.path.join(HERE, "transcript.json")))
    words = [w for s in tr for w in s["words"]]
    for i, b in enumerate(B):
        b["script"] = script_for(words, b["t0"], b["t1"])
        if i:
            assert abs(B[i - 1]["t1"] - b["t0"]) < 1e-6, (B[i - 1]["id"], b["id"])
    assert B[0]["t0"] == 0 and B[-1]["t1"] == DURATION
    data = dict(fps=FPS, duration=DURATION, face=FACE, beats=B, broll_sources=BROLL_SOURCES)
    json.dump(data, open(os.path.join(HERE, "beats.json"), "w"), indent=1)
    with open(os.path.join(HERE, "scenes", "beats.js"), "w") as f:
        f.write("window.BEATS_JSON = " + json.dumps(data) + ";\n")

    lines = ["# Beat sheet — Best one mp4 (Glass UI Explainer)", "",
             f"{len(B)} beats · {DURATION:.1f} s · 1920x1080 · 30 fps", "",
             "| # | Time | Type | Title | Script (exact) | On screen | Sound |",
             "|---|---|---|---|---|---|---|"]
    for b in B:
        tt = f"{b['t0']:.2f}–{b['t1']:.2f}"
        kind = b["type"] + (f" ({b['recipe']})" if b.get("recipe") else "") + (" · RING_DETECTED" if b.get("ring") else "")
        lines.append(f"| {b['id']} | {tt} | {kind} | {b['title']} | {b['script'].replace('|', '/')} | "
                     f"{b.get('screen', '')} | {b.get('sound', '')} |")
    open(os.path.join(HERE, "BEAT_SHEET.md"), "w").write("\n".join(lines) + "\n")
    from collections import Counter
    c = Counter(b["type"] for b in B)
    print(len(B), "beats", dict(c))
    print("glass secs", round(sum(b["t1"] - b["t0"] for b in B if b["type"] == "GLASS_UI"), 1),
          "broll secs", round(sum(b["t1"] - b["t0"] for b in B if b["type"] == "BROLL"), 1))


if __name__ == "__main__":
    main()
