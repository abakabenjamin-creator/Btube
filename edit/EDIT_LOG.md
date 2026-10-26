# Edit log — "Best one mp4" → Glass UI Explainer

Source: Google Drive file **"Best one mp4"** (id `165WYBbZtm_3FVXUMRkNZbhY3DcA8yPGB`), 1920×1080, 25 fps, 6:53 (413.1 s), one locked-off presenter take.
Deliverable: `best_one_glass_ui_1080p.mp4`, 1920×1080, 30 fps, H.264 High, ~18 Mbps, AAC 320 kbps. Beat sheet: `BEAT_SHEET.md` / `beats.json`.

## Job restatement (Role 1)

- **Segments:** 52 beats, one idea each, titled with short action phrases.
- **Runtime:** 6:53.1. The voice track is untouched: same words, same timing.
- **Scene types:** 23 × `GLASS_UI` (186.9 s), 5 × `BROLL` (29.6 s), 13 × `AVATAR_TALK`, 6 × `AVATAR_PUSH`, 3 × `AVATAR_CALC`, 1 × `AVATAR_PHONE_DEMO`, 1 × `AVATAR_FRAMED`.
- **Glass UI recipes:**
  - Recipe A (Open & Add): B10 "Pick your three paths", B31 "Invest in yourself".
  - Recipe B (Prove It): B08 inflation, B13 mortgage, B18 S&P record, B19 pullback, B26 Census filings, B35 yesterday's winner, B38 "Know what you own".
  - Recipe C button pattern (Hear It): B45 employer match.
  - Custom, built on the same kit: B03, B15, B20, B23, B24, B28, B34, B36, B40, B42, B46, B49, B50.
- **Avatar scenes:**
  - `AVATAR_CALC` at B06 (27.4–36.6 s), B09 (46.8–57.6 s) and B41 (299.7–313.3 s).
  - `AVATAR_PHONE_DEMO` at B44 (333.8–343.7 s).
  - `AVATAR_FRAMED` at B25 (163.9–171.2 s).
  - Punch-ins on "isn't a stock or a house", "right now" (×2), "very risky", "losing game", "sugarcoat", "promised you", "worst possible time", "Pay that off first", "here's the catch".

## Tools actually used (substitutions noted)

| Role | Spec tool | Used | Why |
|---|---|---|---|
| 1 Director | Claude | Claude. Beat sheet as `beats.py` → `beats.json` / `BEAT_SHEET.md` | — |
| Transcript | — | faster-whisper `medium.en`, word timestamps | Needed exact words and timings to sync every beat |
| 2 UI rebuild | Chrome + Figma | Original HTML/CSS components (`scenes/engine.css`) | Figma isn't scriptable for frame-accurate motion. The kit is rebuilt in code in the same visual language, with no third-party UI copied |
| 2 B-roll | Artgrid / Storyblocks | Mixkit (free license), fetched with headless Chromium | No paid stock account available |
| 3/4/5 Motion, camera, type | HyperFrames + Tella | Custom deterministic HTML/JS engine (`scenes/*.js`) rendered by Playwright/Chromium, plus a Python/OpenCV compositor (`composite.py`) | HyperFrames' MCP `compose`/`render` are disabled for CLI agents and Tella needs sign-in. Same output: 3D cards, depth of field, eased camera, whips |
| 6 Sound | Epidemic Sound | Music from Mixkit. UI SFX synthesized in `sfx.py`. FFmpeg for the mix and two-pass `loudnorm` | No Epidemic account. Synthesized SFX are exactly timed and never cartoonish |
| Ring removal | Runway | None needed in the final cut (see below) | — |
| 7 Finish | FFmpeg | FFmpeg (x264 High, AAC 320k), OpenCV | — |

## Judgment calls

1. **Two Drive files matched.** "Best one mp4" and "best one.mp4" have identical size (414,855,381 bytes); you confirmed they're the same video. I used "Best one mp4".
2. **The script is the spoken audio.** No separate script file was supplied, so the voice track is the script. On-screen quotes use the transcript's exact words. Where Whisper's spelling and the speech differ, the on-screen text follows the speech:
   - **Flag: the comment keyword at 401.4–402.7 s.** Ben spells five letters. Three transcription passes (medium.en and small.en, with and without a "W-E-A-L-T-H" hint) all hear "W-E-L-F-…". The intended keyword is clearly WEALTH (the earlier take says "comment, wealth", and the line continues "the wealthiest families"), so the comment pill types WEALTH in sync with the letters. If the spoken spelling really is off, consider a pickup line for that sentence.
   - Lines that are hard to hear ("or not study", "dot be different", "really pretty") are never quoted on screen.
3. **Rings.** The presenter wears a band on his left ring finger. Frame-by-frame scans found it visible at:
   - 164.0–165.9 s and 168.6–169.6 s (inside B25);
   - ~392–399 s (inside B50).

   Handling:
   - B25 is flagged `RING_DETECTED` and uses the `AVATAR_FRAMED` layout.
   - Its portrait crop (source y 134–894) excludes every frame position the ring reaches (y ≥ 950), so the ring never appears.
   - B50 is a full-screen Glass UI insert, so the presenter isn't on screen there.
   - I prototyped tracked inpainting (OpenCV Telea/NS). It left visible smears on the moving hand, so I chose the clean reframe. No ring is visible anywhere in the final video.
4. **Calculations (all verified):**
   - **B06:** $1,000 × 12 = $12,000 a year. $12,000 × (1.08²⁷ − 1) ÷ 0.08 = **$1,048,209**, which matches "roughly a million in about 27 years". Yearly compounding was chosen because monthly compounding gives $1.14 M.
   - **B09:** $20,000 ÷ 1.034¹⁰ = **$14,316**, shown with "buys about what $14,300 buys today".
   - **B41:** 5,000 × 20% = **$1,000** a year.
   - **B28 bar:** 29,959 / 578,926 = 5.17 %, drawn to scale.
5. **Facts on screen** are only what the script says: 3.4 % (August), 7.28 % / 6.34 %, 7,801.77 on October 7th, oil above $100, 10-year yield past 5 %, 578,926 applications in July, 29,959 with payroll. Source preview cards use generic, unbranded titles ("Consumer Price Index", "Weekly mortgage rate survey", "Business Formation Statistics"). No logos.
6. **No borrowed branding.**
   - The "Nokia" line uses a generic "yesterday's leader" market-share chart, with no name or logo.
   - Calculator and savings app are original designs.
   - B-roll was checked frame by frame. Gold bars (stamped refiner marks), the NYC zoom-out (lit sign) and a watch movement with an engraved brand were rejected and replaced.
7. **B-roll clips used** (Mixkit Stock Video Free License): Hourglass with golden sand · Machinery of a very close watch · Luxury hotel room panning shot · New York City view at night · Signing a contract · Silhouette of business people by a high-rise window · Businessman putting on a watch · Man in suit checks his watch. All are graded (deep blacks, warm highlights, −18 % saturation, vignette) and joined with blur dissolves.
8. **Music (removed at Ben's request; final cut is voice + UI sounds only):**
   - Hook: Mixkit "Silent Descent" (0–17.5 s).
   - Bed: "Lo-Fi 04" → "Sleepy Cat" → "Day Dreamin' with U", with 4 s crossfades.
   - The bed sits about 13 dB under the voice before sidechain ducking.
   - I couldn't audition tracks by ear; they were picked by tag and by loudness and spectrum analysis. A swap is a one-line change in `mix.sh`.
9. **Captions** aren't burned in on presenter shots: no caption style was specified.
10. **Frame rate:** the 25 fps source is mapped to 30 fps by nearest frame, without motion interpolation, so lip sync stays exact.
11. **Grade:** temporal film grain ≈1.5 % on the whole master, to prevent banding. Glow comes from CSS on accent borders and orbs. No extra bloom pass.

## QC checklist (Role 7)

| Check | Result |
|---|---|
| Script audio word for word | Pass. The source voice is used unedited, start to finish |
| On-screen script text matches | Pass. Typed lines are the transcript's exact words |
| No hard cuts inside segments | Pass. Every Glass/B-roll boundary uses a whip, focus, zoom or blur dissolve. B-roll shots inside a beat use an hblur dissolve. Consecutive presenter beats are one continuous shot |
| Accent border on the focused element; depth of field | Pass. Mint for inputs and panels, yellow for selected object cards. Off-focus cards blurred |
| Nothing over the face | Pass. Overlays sit at x ≥ 1420 above shoulder height, or beside the slid-over presenter |
| No third-party logos | Pass (see 6) |
| B-roll clean and luxury | Pass. No overlays on any B-roll |
| Cursor smooth, clicks with ripple and sound | Pass |
| Calculations correct and matching the voice | Pass (see 4) |
| Avatar zoom ≤ 120 %, never static > 4 s | Pass. Max 115 %; constant micro-drift plus moves |
| Ring fully gone | Pass (see 3) |
| Loudness | −14.0 LUFS integrated, −1.5 dBTP true peak |

## Rebuild

```
python3 beats.py                                   # beat sheet -> beats.json, scenes/beats.js, BEAT_SHEET.md
node scenes/render.js <frames> 4 all               # Glass UI scenes + overlays (Playwright/Chromium)
python3 prep_broll.py <mixkit_clips> <broll>       # graded B-roll sequences
python3 composite.py best_one.mp4 <frames> <broll> <out> 4
python3 sfx.py <frames> sfx.wav && ./mix.sh best_one.mp4 sfx.wav <music> mix.wav
ffmpeg -f concat -i <out>/chunks.txt -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k final.mp4
```
