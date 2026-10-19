# Edit log — "Budgeting Magic Trick" (Clean Finance + Glass UI)

## Job summary
- **Segments:** 48 (19 A-roll talk, 6 `MYTH_FLIP`, 5 `AVATAR_CALC`, 5 `GLASS_UI`, 6 `BROLL`, 5 `GRID_SLIDE`, 1 `CHAPTER_CARD`, 1 end screen) + 13 overlays on A-roll.
- **Runtime:** 6:57. That's HeyGen's actual speech length (148.3 s + 268.6 s). The beat sheet re-times itself from HeyGen's captions.
- **Recipe:** E, "Bust the Myths", used as the backbone, with recipe D, "Teach the Rule", for the three-jar section.
- **Glass UI recipes** (custom versions of A/B/C):
  - Watch the $20 vanish: object card + cursor click + stickers (A)
  - Drop $2 from two wallets: focus pull between cards + stickers (B)
  - Write it down anywhere: giant typing pill → pull back → source rows (A)
  - Pay future you first: giant typing pill → notification → button click → jar fills, line grows (A + C)
  - Grab the free workshop: object card, step rows, stickers, call-to-action click (C)
- **Avatar scene types:**
  - `AVATAR_TALK`: jump-cut punch framing alternating 100% and 115% at sentence starts, slow drift so the presenter is never static, and `AVATAR_PUSH` to 117% on "magic trick", "I'm the magician", "every dollar matters", "matter much more" and "stop using".
  - `AVATAR_CALC` ×5: $1 snack; $20 snacks; $5 overspend; rent jars; savings growth.
  - Framed card on the right inside every `GRID_SLIDE`.
  - Side-slide for the end screen.

## Judgment calls
| # | Call | Why |
|---|---|---|
| 1 | Dropped the bracketed line "[Your story in one line.]" from the narration. | It's an instruction to Ben, not a spoken line. Every other word of the script is used unchanged. |
| 2 | "[your free resource or workshop]" became **"the free Three-Jar Workshop"**. | A placeholder can't be spoken. The name ties back to the three-jar plan. If your resource has a different name, only that sentence needs re-rendering in HeyGen (part 2). |
| 3 | Narration split into two HeyGen renders (part 1 ends after Mix-up #3). | HeyGen's API caps a script at 5,000 characters. They're joined back to back with no gap. |
| 4 | Engine: **Avatar V** at 1080p, with your look's default voice. | Ben asked for Avatar V. It replaces the earlier Avatar III renders. Pushes are capped at 117–120%. |
| 5 | Mix-up cards are labelled "Mix-up #N", not "Misunderstanding #N". | Matches the script's wording. |
| 6 | Truth lines on myth cards use exact script fragments (e.g. "Fun just gets its own spot in the box."). | The script is sacred. |
| 7 | "$7 a week is about $30 a month" is shown as `$7/wk → month ≈ $30`, not as a multiplication. | Doing the sum would need ×52÷12, numbers that aren't spoken. |
| 8 | "$2 a week, that's $8 a month" is shown as `$2 × 4 wks = $8`. | Matches the spoken $8 (exact maths would be $8.67). The year figure `$2 × 52 wks = $104` is exact. |
| 9 | Disclaimer at 0:15.6–0:20.8 (re-timed from HeyGen's captions), low in frame, nothing else animating. | QC: money video, disclaimer in the first 60 s. Uses the default text, since no custom text was supplied. |
| 10 | **No background music.** Voice plus the UI sound layer only (clicks, keys, whooshes, pops, chimes, calculator taps). | Ben asked for no music. The SFX are synthesized because no stock library is reachable from here. |
| 11 | B-roll generated with HeyGen Video 1 (6 shots). | No stock site is reachable. Every prompt asks for no text, logos, badges or plates. Shots longer than 4 s are split into ~3.4 s sub-shots with blur dissolves. |
| 12 | No captions burned in. | Your caption style wasn't specified. HeyGen's SRT sidecars are in `assets/`. |
| 13 | Ring check (`AVATAR_FRAMED`): **passed**. | Frames from both A-roll parts were checked and show no ring-light reflection in the glasses, so no framed-card fallback or inpainting was needed. |

## Tools actually used
| Step | Tool |
|---|---|
| Beat sheet / planning (Role 1) | Claude → `build/beats.py`, `beat_sheet.md` |
| A-roll | HeyGen API (digital twin `98487b8a…`, Avatar V) |
| B-roll | HeyGen Video 1 text-to-video (instead of Artgrid/Storyblocks) |
| UI rebuilds, motion, type, camera (Roles 2–5) | HTML/CSS + GSAP 3.12.5, rendered frame by frame in headless Chromium (Playwright), instead of HyperFrames/Figma. HyperFrames' compose tool is disabled for CLI agents. |
| Sound (Role 6) | NumPy/SciPy SFX synthesis (no music); FFmpeg `loudnorm` (−14 LUFS, −1.5 dBTP) |
| Finish (Role 7) | FFmpeg: H.264 high profile at 18 Mbps, AAC 320 kbps, light grade, 1–2% grain |

## Final render
- `out/Budgeting_Magic_Trick_1080p.mp4` (not committed; `out/` is gitignored): 6:56.9, 1920×1080 at 30 fps, H.264 at 18 Mbps, AAC audio.
- Loudness: −14.0 LUFS integrated, −1.5 dBFS true peak, 1.7 LU range.
- 370 SFX events, no music.

## Files
- `script.txt`, `script_part1.txt`, `script_part2.txt`: narration exactly as sent to HeyGen.
- `beat_sheet.md`: timestamped beat sheet (regenerated from real timings at finish).
- `assets/heygen_manifest.json`: HeyGen IDs for the A-roll and B-roll.
- `build/finish.sh`: one-shot assembly once the HeyGen files are in `assets/`.
