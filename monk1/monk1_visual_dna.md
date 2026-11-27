# MONK1 Visual DNA

**Source studied:** `monk1_clean.mp4` (18:01, ads/UI removed), the cleaned version of "Learn These 7 Skills, Never Worry About Money Again" (Sandeep Swadia, "I started as a monk in training…").
**Method:** 541 frames (one every 2 s) + 337 scene-change frames (one per detected shot), Whisper transcript with word timings, shot-length stats, k-means colour sampling, loudness and spectrogram analysis.
**Timestamps** below are `mm:ss` in `monk1_clean.mp4`. `clip ###` = `clips/monk1_###_*.mp4` (see `clips/index.csv`).

> **Our palette replaces his.** Every graphic recipe below is written in *our* colours:
> **Red `#E10600`** primary · **White `#FFFFFF`** secondary · **Yellow `#FFD400`** one key word only · **Green `#00A651`** money/gains only · **Black `#0A0A0A`** backgrounds/backup.
> The full his→ours colour map is in [section 8](#8-colour-replacement-map-his--ours).

---

## At a glance

| Metric | Value |
|---|---|
| Runtime (clean) | 18:01 |
| Shots | 337 |
| Average shot length | **3.2 s** (18.7 cuts/min) |
| A-roll median shot | 3.2 s · cutaway median 2.0 s |
| Screen time split | **A-roll 60%** · motion graphics 18% · stock B-roll 16% · archival 4% · screen captures 2% |
| A-roll cameras | 2: **wide frontal** (123 shots) and **¾ side angle** (43 shots), ≈ 3 : 1 |
| A-roll with on-screen text | 26 of 166 A-roll shots (16%) |
| Cutaway library | 164 clips · 78 stock · 39 own motion graphics · 19 archival · 10 brand-ad footage · 10 screen captures · 6 his own photos/filming · 2 AI/CGI |
| Loudness (as captured) | −20.7 LUFS integrated, LRA 4.4 LU (heavily compressed voice) |

---

## 1) Editor / PM: structure, hook, segment length, cut rhythm

### Macro structure
The video is a **listicle wrapped in one big framework**: "high performance is three relationships". Each relationship holds two skills, and the video ends with one meta skill (hence "7 skills").

| # | Segment | Clean time | Length | Shots | Avg shot | Cuts/min | Framework used |
|---|---|---|---|---|---|---|---|
| 0 | **Hook / intro** | 00:00–00:47 | 48 s | 29 | 1.6 s | **36.6** | "6 things every high performer…" + credential cards |
| 1 | Self: Self-trust | 00:47–01:54 | 66 s* | 26 | 2.5 s | 23.6 | **The Proof Pyramid** (action / integrity / recovery) |
| 2 | Self: Failing | 01:54–06:36 | 283 s | 83 | 3.4 s | 17.6 | Story (getting fired) → **3 P's** (Seligman) → **3 cheat codes** |
| 3 | Others: Selling | 06:36–09:24 | 167 s | 57 | 2.9 s | 20.4 | **CARE** acronym |
| 4 | Others: Build others | 09:24–12:24 | 181 s | 61 | 3.0 s | 20.3 | Bill Campbell story → Google study → **give 3 things** |
| 5 | Reality: Financial literacy | 12:24–14:39 | 135 s | 23 | **5.9 s** | 10.2 | Buffett story → **3-question quiz** → 3 money realities |
| 6 | Reality: Judgment | 14:39–16:35 | 116 s | 42 | 2.8 s | 21.8 | **3 AI challenges** + gut-feeling rule |
| 7 | Meta skill: learning to learn | 16:35–17:22 | 47 s | 15 | 3.1 s | 19.1 | Metaphor ("restless chickens") |
| 8 | Close | 17:22–18:01 | 39 s | **1** | 39 s | 1.5 | One unbroken push-in, reflective |

\*The screen recording never captured the end of the hook or the start of Skill 1 (it began mid-sentence), so the real segment is longer.

### The hook (00:00–00:47), beat by beat
1. **Claim (0–4 s):** "These are six things every high performer needs to know how to do." Each caption word lands on a **new shot** (rowing → leaping athlete → dunk → baseball slide), so cuts run **0.3–0.8 s**. Clips 001–004.
2. **Contrast (4–12 s):** "You have to… ~~read about them~~, ~~watch videos~~… practice doing them." Strike-through captions over B-roll, then the payoff caption. Clips 005–007.
3. **Pain (12–17 s):** "No one teaches them". Classroom/office B-roll. Clips 008–009.
4. **Authority (17–30 s):** "I started as a **monk** … **CEO**, **board member**, **investor** in **tech & AI**…" One rounded photo card of *his own life* per title, 1–3 s each. Clips 010–014.
5. **Promise (30–47 s):** "In the age of AI these skills can bring you immense wealth and a sense of worth… self-reliant". Energetic fitness/run B-roll.
6. **Frame (47 s):** "High performance is not just one skill. It's three relationships…" sets up the whole map.

**Pattern to copy:** *Claim → kill the lazy alternative → pain → my credentials (with proof photos) → payoff promise → map of the video.* The hook cuts about 2× faster than the body.

### Segment recipe (repeats for almost every skill)
1. **Chapter-map transition** (1–12 s graphic) shows where we are in Self / Others / Reality: 01:53, 06:36, 09:23, 12:24, 14:39, 16:32.
2. **Personal story or famous example** (fired at a NYC tech company; Ed Sheeran; Bill Campbell; Buffett).
3. **Named framework**, built piece by piece on screen (pyramid, 3 P's, cheat codes, CARE, 3 gives, quiz, 3 AI challenges).
4. **Recap graphic** with all parts on one screen (clips 066, 100, 128, 155).
5. **One-line takeaway** spoken to camera, often with a kinetic quote caption.

Segment length ranges from **~1 to 4.7 minutes**. Skills that rely on story (Failing) run longest; data skills run short but hold graphics longer.

### Cut rhythm rules
- **Hard cuts** throughout. A-roll ↔ cutaway alternation is the engine.
- Cutaways are mostly **single inserts** (55 times), then pairs (14), then triples (10). **Montage bursts** of 7–11 cutaways in a row only happen at energy peaks:
  - Ed Sheeran rise (05:00–05:30, clips 054–062)
  - "They don't sell products, they sell feelings" (07:33–07:53, clips 079–091)
  - "Best universities / prestigious companies" (14:54–15:05, clips 139–148)
- **Slow down for data:** financial literacy averages 5.9 s per shot, and the quiz graphic holds for **22.8 s** (clip 135).
- **End on stillness:** the final 39 s is one take with a slow push-in, with no B-roll and no graphics.
- Camera angle switches (wide ↔ side) fall on sentence boundaries, at about one every 3–4 A-roll shots.

---

## 2) Motion graphics: text animations, titles, transitions

His graphics language is **soft 3D + glassmorphism on pastel gradients**. Ours is the same *motion vocabulary* re-skinned in **black / red / white**, with yellow and green as accents.

### Recurring graphic systems
| System | What he does | Examples | Our version |
|---|---|---|---|
| **Chapter pill** | Small frosted-glass pill, top-left, white label ("Self-Trust", "Failing", "Selling"…). On screen for the whole segment, over A-roll *and* B-roll | every shot | `#0A0A0A` @ 70% pill, 1 px `#FFFFFF` @ 25% stroke, white label, **4 px red `#E10600` dot** left of the text |
| **Chapter map** | Three gradient bubbles (Self / Others / Reality) on a dashed orbit. The camera pushes into the active bubble; skill names are stacked pills inside | clips 032, 069, 070, 103, 129, 137, 160 | Black field, bubbles = red `#E10600` → dark red radial; inactive bubbles `#FFFFFF` @ 10%; active skill pill white with black text |
| **Kinetic caption** | Word-by-word reveal. The incoming word starts smaller and dimmed, then settles to full white. Bottom-centre on A-roll, centre on B-roll | 01:01, 03:14, 07:52, 09:14, 11:42 | White `#FFFFFF` semibold; **exactly one key word per line in yellow `#FFD400`** (e.g. "they sell **feelings**") |
| **Hook caption** | ALL-CAPS, bold, tracked, centred; strike-through for rejected options | clips 001–007 | White caps; strike line in red `#E10600`; final payoff word yellow |
| **Framework build** | Object or list builds one part per spoken item: pyramid tiers, brain pills, CARE letters expanding into words | clips 025–028, 049–052, 092–100 | Tiers/pills in red on black; the active item full red, others white @ 30% |
| **Glass cards** | 3 frosted cards in a row ("Cheat code #1/#2/#3"); a blur/slide carousel brings each to focus; the section title glitches in | clips 053, 063, 064, 066 | Black frosted cards; active card has 2 px red border; title glitch-in white + red chromatic offset |
| **Icon trio** | Blue round 3D icons (attention / credit / ownership) slide in a carousel, then a recap row | clips 121, 123, 124, 128 | Red circle icons with white glyphs on black (or white glyph tiles on red) |
| **Lower-third** | Frosted glass rounded rectangle bottom-left: **Name** bold, role regular below | clips 048, 054–057, 101, 105, 130 | Black glass box, 4 px red left bar, white name, white @ 70% role |
| **Data callouts on A-roll** | Donut ring fills right of frame ("98% of his wealth" lime; "85% under 35" red); age counter 65→95; "$3 Billion → $160 Billion" pill | 12:38, 13:52, clip 131 | Money/gain stats **green `#00A651`**; failure/loss stats **red `#E10600`**; amounts in white with the key number green |
| **Quiz board** | Clipboard; questions type on; answers appear under each in light blue | clips 134–136 | Clipboard on black; question text black on white paper; **answers green** (money); "Mutual fund." as the single yellow keyword |
| **Particle quote** | Dark smoke/particle burst behind a centred quote | clip 156 | Keep it: white particles on black, quote white, one yellow word ("**feedback**") |
| **Logo orbit** | Company logos orbit a portrait ("COMPANIES BILL COACHED") | clip 107 | Black bg, logos white-monochrome, title white with red underline |

### Transitions
- **Between shots:** hard cut (≈ 99%). No flashy cut transitions on A-roll.
- **Inside graphics:** camera **push-in / zoom-through** (chapter map, brain callouts), **blur-to-focus** (glass cards), **horizontal slide** (icon carousel), **glitch/pixel** title reveal (clip 053), **type-on** (quiz, quotes).
- **Text timing:** each caption word appears as it is spoken, and captions clear on the next cut.

---

## 3) Researcher: types of B-roll, screenshots, data visuals

### What he uses (164 cutaway clips, 421 s total)
| Category | Clips | Seconds | Notes |
|---|---|---|---|
| Stock footage (people, offices, cities, emotions) | 78 | 149 | Cinematic, shallow focus, moody; mostly 1–3 s |
| Own motion graphics | 39 | 176 | Frameworks, chapter maps, quiz, icons |
| Archival / third-party (celebrities, interviews, photos) | 19 | 47 | Ed Sheeran ×9, Bill Campbell ×4, Buffett ×3, Jobs ×2, Seligman ×1 |
| Brand-commercial footage | 10 | 11 | Sports, motorcycle and outdoor-apparel ad look, used for "Nike, Harley, Patagonia sell feelings" |
| Screen captures | 10 | 25 | LinkedIn job search, Google re:Work article with **highlighter**, AI-app UIs, code editor |
| His own photos/filming | 6 | 12 | Credential cards (monk, CEO, board, investor, tech) and an office meeting |
| AI-generated / CGI | 2 | 1 | Hyper-stylised sports hero shots in the hook |

### How he picks B-roll
1. **Literal noun-matching.** The shot shows the exact thing said, even jokes:
   - "chief revenue officer in NYC" → Manhattan aerial (034)
   - "walked me to the elevator" → elevator button (036)
   - "train ride home" → subway (037)
   - "restless chickens" → actual chickens (161)
   - "fresh brew" → Chemex pour (164)
   - "firefighter" → fire POV (157–159)
2. **Emotion-matching for abstract lines.** "Makes you feel small" → slumped/head-in-hands shots (029–031); "self-trust" → desaturated portrait + quote (024).
3. **Proof shots for every claim:**
   - a person → archival clip + lower-third name/role
   - a study → screenshot of the actual source with a highlighter (115–117)
   - a number → animated data visual (131, 133)
   - a job hunt → real job-board screenshots (040–041)
4. **Famous-person case study** per skill: Ed Sheeran (failing), Steve Jobs (emotion), Bill Campbell (building others), Warren Buffett (compounding).
5. **Everyday-life montage** to make a claim universal: "Life is about selling" → interview, date, raising money, teen on Instagram (071–075).

### Data visuals in use
- Animated donut % (green for wealth, red for failure rate)
- Age + net-worth counter over a B&W portrait
- Exponential curve over a clock (time × compounding)
- Red crashing stock line (company decline)
- Paycheck macro for "financial safety"
- Clipboard quiz

**For us:** gains = **green**, losses/warnings = **red**, the one number that matters = **yellow** (max one per screen).

---

## 4) Screen editor: cuts, zooms, layouts, framing

### A-roll setup
- **Camera A, wide frontal (74% of A-roll shots):** subject centred, seated cross-legged on a chair, sofa behind, painting at top, plant left, plant right. Lots of headroom; full body visible.
- **Camera B, ¾ side (26%):** subject on the left third, angled body, darker background with plants and vases, rim light on the hair. Used for emphasis and to hide jump cuts.
- **Punch-ins:** the wide camera alternates between a full-body frame and a ~1.3× waist-up crop (e.g. 01:57 vs 02:03). This is a digital zoom on cuts, not a live zoom.
- **Close:** one 39 s take with a **slow push-in + slight drift right** (wide → tighter, re-centred).

### Layout grid (16:9)
| Element | Position |
|---|---|
| Chapter pill | top-left, ~3% from the left, ~4% from the top |
| Kinetic captions on A-roll | bottom-centre, lower 15% |
| Bullet lists on A-roll | right third, beside the subject ("Take risks but • Size them • Limit them • Diversify them") |
| Donut stats / icon chips | right third, mid-height (clear of the subject) |
| Lower-thirds | bottom-left, over B-roll/archival only (never over his own A-roll) |
| Photo cards | centred, ~85% width, rounded corners (≈ 2% of width), soft shadow, gradient behind |
| Screenshots | full-bleed, slow scroll / push-in, highlighter on the key sentence |
| Text on B-roll | centred, white over darker/desaturated plates |

### Cut patterns
- Insert B-roll **on the noun**, return to A-roll on the next sentence.
- A side-angle cut is often followed by a text-on-A-roll beat (a keyword appears beside him).
- Screen captures are always moving (scrolling or zooming), never static.

---

## 5) Sound designer: music style, SFX, timing, levels

*Measured from a phone screen-recording (mono AAC), so levels are relative and no stems are available.*

| Item | Finding |
|---|---|
| Voice | Close-mic, dry, warm; **heavily compressed** (loudness range 4.4 LU). Integrated −20.7 LUFS as captured |
| Music bed (body) | **Soft ambient/tonal pad.** The spectrogram shows sustained tones (~250 / 400 / 600 / 1,300 Hz) running through the gaps between words. It sits about **20 dB under the voice** (speech ≈ −21.5 dBFS, floor between words ≈ −42 dBFS). Felt rather than heard |
| Music bed (hook) | Denser and bassier (continuous energy < 100 Hz), noticeably louder (~10–12 dB under the voice) |
| SFX | Hook: **broadband whoosh/hit transients every ~2–3 s on the big visual changes**. Body: rises in the floor level around graphic-heavy stretches (CARE 08:00–09:00, quiz 13:30–14:30, fire 16:19) point to risers/whooshes under the graphics |
| Silence | No dead air. The longest pauses (~1.5–1.7 s) are deliberate, in the reflective close (17:20–18:00) |
| Ending | The music stays under the voice to the last line; no sting |

**Recipe for us:**
- Ambient pad ducked to about −20 dB under the voice in the body, and −10 to −12 dB in the hook.
- **No whoosh, swipe or "shhh" noise sounds on cuts or transitions.** This is an ABAKA SIKA channel rule that overrides the monk1 source. Cuts are clean, and the music bed carries them.
- Allowed: at most a soft, tonal low hit (pure sine, no noise burst) under one big reveal, plus a subtle click/pop as a framework item appears.
- Let the close breathe, with no SFX.

---

## 6) Finisher: colour grade, aspect ratio, export look

- **Aspect:** 16:9 landscape. The original master is likely 1080p/4K; our study copy is an upscale of an 860×484 capture, so **don't judge sharpness from it**.
- **A-roll grade: low-key warm/teal split.**
  - Shadows: deep, near black (5th-percentile luma ≈ 0.02).
  - Mid-tones sit low (median luma ≈ 0.28–0.30).
  - Highlights capped around 0.52–0.55, so nothing blows out.
  - Warm practicals and skin: amber/orange (`#CA855E`, `#5B2F08` cushions/lamp).
  - Background: cool teal/blue wash (`#214E7E`, `#356384`).
  - Shallow depth of field, soft backgrounds.
- **B-roll:** cinematic stock, slightly desaturated for emotional beats; B&W for Buffett's "wealth counter" (clip 131) and the quote portraits.
- **Graphics:** bright, clean, high-key. This deliberately contrasts with the dark A-roll, so every graphic feels like a "lights-on" moment.
- **Our finish:**
  - Keep the low-key, shallow-DOF A-roll, but **swap his teal background wash for a red `#E10600` practical/gel glow**. Keep the key light warm-neutral and the blacks at `#0A0A0A`.
  - Graphics on black instead of pastel, so our A-roll and graphics share one dark world, with red as the energy.
  - Export at 1080p/4K H.264, at −14 LUFS for YouTube.

---

## 7) Brand / style: recurring visual elements

1. **The set:** sofa, plants, art piece, warm lamp left, coloured glow right, him seated cross-legged (calm "monk" posture). Same wardrobe throughout (blue quarter-zip).
2. **The map:** three relationships (Self / Others / Reality) as bubbles. It returns 6 times as the video's spine.
3. **Named frameworks and acronyms:** Proof Pyramid, 3 P's, 3 Cheat Codes, CARE, Give 3 Things, 3 AI Challenges. Each is built on screen and then recapped.
4. **Persistent chapter pill**, top-left.
5. **Glass and 3D object language:** frosted pills, cards, lower-thirds; glossy 3D brain, pyramid, hand and icons.
6. **Word-by-word captions**, used sparingly (16% of A-roll), only on the quotable line.
7. **Celebrity proof plus his own credentials:** archival with lower-thirds; his own photos as rounded cards.
8. **Source receipts:** highlighted screenshots of the actual study or article.
9. **A reflective, slow ending** that mirrors the "monk" positioning.

**Our brand translation:** the same nine elements, rendered in our colours.
- Red is the brand energy: chapter pill dot, active items, bubbles, lower-third bar, strike-throughs.
- White carries text and inactive items.
- Yellow appears on one word per screen.
- Green appears only when money goes up.
- Black is every background.

---

## 8) Colour replacement map (his → ours)

| Where he uses it | His colour (sampled) | → Ours |
|---|---|---|
| Graphic backgrounds (pyramid, brain, quiz, cards) | pastel lilac/pink gradient `#EEB1FC` `#DDBAFC` `#BD95FC` `#F7C7FB` | **Black `#0A0A0A`** (optionally a subtle red radial glow at 15%) |
| Chapter-map background | blue gradient `#4A91FC` → `#50B2FC` | **Black `#0A0A0A`** |
| Chapter-map bubbles | pink-lilac `#D8B5FB` / `#EEBAF7` | **Red `#E10600`** (active) / White @ 10% (inactive) |
| Framework pills (Personal / Permanent / Pervasive) | purple `#A989D9` / `#BD95FC` | **Red `#E10600`** pill, white text |
| Icons (attention / credit / ownership) | blue `#2889F9` on white `#F4F4FC` | **Red `#E10600`** circle, white glyph, on black |
| CARE neon figure + letters | cyan `#0181C5` on navy `#011019` | **Red `#E10600`** neon on **black `#0A0A0A`**; letters white, the active word yellow |
| "What you have / what they want" | violet `#A08AFB` → `#8D9AFB` | Black bg, red tiles, white labels |
| AI-challenge list | white pills on pink `#FBA9F6` | White pills on black; the active pill red with white text |
| Glass cards | frosted lilac `#DCBEDC` | Frosted black `#0A0A0A` @ 70%; active card red border |
| Wealth donut "98% of his wealth" | lime `#ABDB44` | **Green `#00A651`** |
| "$3 Billion → $160 Billion" | grey glass pill | White text, number in **green `#00A651`** |
| Failure-rate donut "85% got one wrong" | red ring | **Red `#E10600`** |
| Crashing stock chart | red `#BB0103` on `#1F0205` | Red `#E10600` line on black `#0A0A0A` grid |
| Quiz answers | light blue `#90C6F1` | **Green `#00A651`** (money answers) |
| Kinetic captions | white, incoming word dimmed | White `#FFFFFF`; **one keyword `#FFD400`** |
| Strike-through captions | white line | **Red `#E10600`** line |
| Chapter pill / lower-thirds | grey frosted glass | Black glass `#0A0A0A` @ 70%, red accent bar/dot, white type |
| A-roll background wash | teal `#214E7E` / `#356384` | **Red `#E10600`** practical/gel (set dressing) |
| Brain object (3D) | pink-red `#F1726B` / `#AE4153` | Keep red, grade toward `#E10600` |

**Yellow rule:** max one yellow word per frame. **Green rule:** only money, gains or a positive financial outcome. Never use green for "good" in general.

---

## 9) Notes and limitations of this study

- The source was a **phone screen recording of YouTube playback** (video area 860×484). Everything is upscaled, and fine type details are approximate.
- The recording **missed part of the video** between the end of the hook ("…three relationships happening all at once") and Skill 1 ("What gets built is your self-trust").
- Brief YouTube overlays remain on real frames (kept by request):
  - 00:00–00:02.6: player controls
  - 00:38–00:41: player controls
  - 05:52–05:54 and 10:11–10:26: "We'll be right back" chip, bottom-right
  - 05:54–05:56: "My Ad Center" menu
  - throughout: a tiny recorder timecode bubble, bottom-centre
- Audio is mono AAC from the capture. Music and SFX were identified from spectrograms, not stems, so track names and exact levels are unknown.
- Stock vs own vs brand-ad attribution is a visual judgement (`clips/index.csv` → "stock or own filming"). None of the third-party footage should be reused in our videos. Use the library as a **reference for shot types**, not as assets.

---

## 10) ABAKA SIKA house rules (owner's notes, override everything above)

These come from the channel owner's notes on real edits ("Five Rules of Money", "The River"). Where they conflict with the monk1 study, **these win**.

**Typography and brand**
- Use **Inter** only: Bold/ExtraBold for captions, **Inter Black, all caps** for shocking or must-see moments.
- Keep the red **Subscribe** button top-right and the white **ABAKA SIKA** wordmark (stacked) bottom-right on **every frame**.
- The chapter/title pill stays **top-left**.
- **Disclaimer, every finance video:** when the presenter says it's education, not advice (or near the start if the script has no such line), show the **disclaimer tag**: a light grey frosted-glass box with rounded corners and a thin white outline (no red bar), lower right, clear of his face, reading **"Education, not financial advice"** (Inter Bold, white) with a smaller second line **"Talk to a licensed pro before you move real money."** (Inter Medium, white ~88%) for the length of that line. No chest caption sits under it.

**Captions**
- Each word **rises slowly from below** and settles beside the previous one.
- On the presenter, captions are **centred across his chest**, not to one side. Over stock they are centred low.
- **Exception, side-angle (off-camera) presenter:** captions and any text overlays always go on the **right side, the ABAKA SIKA side**, in the empty room beside him (centred around x≈1560, mid-height, above the wordmark). They never sit on his chest or face in this angle.
- Use one yellow key word per line.
- A caption must fully fade out **before** the next line rises, so lines never overlap.

**Presenter framing**
- **No overlay may ever touch or cover his face.**
- Show his **full torso** in every presenter shot.
- **No sharp zoom/punch-in cuts.** Use only a gentle slow push-in (about 3%, anchored bottom-centre), and use it sparingly.
- **Definition moments:** slide him to the side at full framing, with the heading and explanation on the right. No part of his body (no stray hand) may show on the emptied side.
- **The emptied side must be a clean continuation of the room, never a mirror.** Mirroring duplicates objects (e.g. a second lamp or a second set of photo frames). Build the strip from lamp-free parts of the set (blinds, window sill, plain wall), so every object appears only once.
- **Off-camera (3/4 side-angle) shots: side text is optional, not automatic.** Use it only on key lines worth reading; otherwise the off-camera shot plays normally with its chest caption.
  When you do use it, sequence it like this:
  1. **Start on the original camera framing** (untouched) for a few seconds, with any chest caption faded out before step 2.
  2. **Then smoothly push/slide him aside** (≈0.4 s ease, toward the side he is not facing), ideally during a natural pause.
  3. **Only after the push has settled, the words start coming in** on the empty side: heading first, then the body line timed to his speech.
  The freed strip continues the room (mirrored, softened set), with no body parts in it. Leave enough time after the push for the text to be read (≈2 s or more).
- Cut presenter shots **exactly on his words**, so there is no silent mouthing at joins.
- **Remove jewellery such as rings** from his fingers. Check every presenter frame and paint the ring out frame by frame. The watch can stay.

**Footage**
- Story sections are about **80% stock video, 20% graphs/financial explanation**.
- Every person mentioned gets a **real photo or clip** of that person.
- Match the **age** of anyone in a story (teen story = teenagers with visible faces). Use **no smoking** and nothing off-brand.
- For old/archival photos, use a split screen: photo on one half, matching stock clip on the other.
- Stock comes from licence-safe sources only (e.g. Mixkit: free, commercial use).
- When a famous person is named (e.g. Prince), show a **short real clip of them** (a few seconds, licence-safe such as CC BY on Wikimedia Commons) with a name card ("Prince (1958–2016)") and a small credit line. Blur any TV-show logo or watermark.

**Real sources on screen (receipts)**
- **Every claim that has data on the internet gets its real source shown on screen**, at the exact moment the line is spoken. This covers every number, statistic, limit, rate, survey, news event and famous-person fact.
- Show the **actual article, news story or official page**: a screenshot of the original page, zoomed in on the key line, with that line highlighted (yellow `#FFD400` mark, red `#E10600` outline). Hold it **2–3 s** with a slow push-in, then return to the card or footage.
- **News headlines are preferred** for stories (e.g. "FTC warns of record $3.5 billion losses to imposter scams"). Official pages (IRS, FDIC, CFPB, BLS) are used for limits and rates.
- Add a red "**Source: …**" pill at the bottom centre naming the outlet. If an official site blocks access, show a reputable news article that quotes it, and label it "citing BLS/FTC".
- Fact-check every number in at least two sources before the edit. Never change the script to match a source: flag differences to the owner instead, as with the 8% vs ~10% market return.
- Keep a research log (claim → source link → verdict) and put the source links and photo/clip credits in the YouTube description.

**Sound**
- **No whoosh / swipe / "shhh" noise SFX on transitions.**
- **Voiceover must sound like the presenter.** Match the voiceover's EQ to the presenter's own audio, band by band, within about 1 dB (typically less boxiness around 600–1,000 Hz and more treble above 4 kHz). Match the speech level too, and gate its hiss down to the presenter's noise floor. A viewer should not hear a change when the edit cuts between them.
- Use a soft ambient pad about 20 dB under the voice, and master to −14 LUFS.

**Delivery**
- **4K (3840×2160)** master, with graphics rendered natively at 4K, plus a **1080p** copy.
- Keep any file sent through the app comfortably under its upload limit (about 300 MB worked; 480 MB did not).
