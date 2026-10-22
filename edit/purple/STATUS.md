# Status report — Best one mp4, Purple Creator-Explainer edit

Spec: "AI Video Editor Prompt — Purple Creator-Explainer Style" (Ben's doc).
Deliverable: `best_one_purple_1080p.mp4`, 1920×1080, 30 fps, 6:32.5, H.264 CRF 18 yuv420p, AAC 192k, faststart.

## Six stages

- [x] **1. Transcribe:** word-level transcript (faster-whisper medium.en). 46 cuts: 45 dead-air pauses tightened to 0.15 s per side, plus 1 flubbed retake ("…savings account dot be different."). The source runs 6:53; the edit runs 6:32. Beat sheet: `BEAT_SHEET.md` (32 beats, output and source times).
- [x] **2. Research capture:** every number checked on primary sources and logged in `FACT_CHECK.md`. Five live pages captured (Retina, 2880 px wide) with highlight regions logged.
- [x] **3. Animation:** one shared `scenes/brand.css` holds every hex value from the Visual DNA, the font (Instrument Sans), radii and shadows. `scenes/purple.js` draws the captions, keyword chips, math lines, process flows, logo badge, numbered menus, live-page template, comment CTA and platform badges. 11,776 frames rendered, with alpha over the presenter.
- [x] **4. Cuts, zooms, layout:**
  - Medium is the base framing, with Tight push-ins on 24 emphasis words (0.6 s ease, 3.4 s hold, 0.6 s back) and Wide pull-outs on 6 reveals.
  - Jump cuts at removed pauses switch Medium ⇄ 1.05×, keeping at least 4 s between framing changes.
  - A slow drift adds +0.17 % per second during holds.
  - The face stays on the upper-third line and the top of the head is never cropped.
  - A violet light-leak (≈350 ms) marks every cut into a numbered card.
- [x] **5. Sound:** **no music, no whooshes or risers**, per Ben's instruction (this overrides the doc's music bed). Only typing ticks, soft taps and a mouse click on highlighter drags. Cue sheet: `SOUND_CUES.md`. −14.0 LUFS integrated, −1.5 dBTP.
- [x] **6. Finish:** FFmpeg assembly and encode. Commands are below.

## Tool substitutions

| Doc tool | Used instead | Why |
|---|---|---|
| HyperFrames | The same HTML/CSS-to-video approach run locally: headless Chromium (Playwright) renders `scenes/index.html` frame by frame | HyperFrames' MCP render is disabled for CLI agents |
| Tella | `composite.py` (OpenCV): cuts, Wide/Medium/Tight zooms, PiP, layouts | Tella needs a sign-in this session doesn't have |
| Perplexity / Google | Primary sources directly: FRED (BLS, Freddie Mac, S&P DJI data), census.gov, fdic.gov | Same goal, primary data |
| Screen recorder | Retina page captures animated in the browser card (typed URL, scroll, cursor, push-in, highlighter sweep) | Deterministic and frame-accurate |
| Epidemic Sound | Synthesized UI ticks; no music | Ben asked for zero music |

## Judgment calls

- **Format:** 16:9 long-form (1920×1080). The doc's default is vertical, but this is a 6½-minute landscape talking-head video.
- **Ring:** the presenter's ring is visible at 164–171 s and 392–399 s (source). Both moments are full-screen cards ("Your own business" flow; "Which path?" poll), so it never appears. The PiP crop is face-only.
- **Captions:** only on key lines, and only for complete sentences. They're dropped while a chip, math line, flow or CTA is on screen. They're also left off a few lines where the spoken words are unclear ("or not study", "really pretty", "loss your job"), so no misquote appears on screen.
- **Scorecard table and before/after cards:** not used. The script gives no Cost / Effort / Potential ratings, and making them up would put words in Ben's mouth.
- **Real-time web template for Nokia, 401(k) and index funds:** not used. The script names no specific site or product there; a Nokia badge marks the reference instead.
- **Comment keyword:** the CTA reads `Comment "WEALTH" down below!`. Ben's spoken spelling transcribes as "W-E-L-F-…", so it's worth a listen.

## Needs Ben's action

1. **Two Census numbers have been revised** since recording: July applications 578,926 → 576,264, projected formations 29,959 → 29,697. The on-screen text matches what he says. Re-record those two lines if exact current figures matter.
2. **Inflation:** 3.4 % (August) is correct, but September's 3.7 % is now the latest. Fine as phrased ("in August").
3. **Oil:** true for Brent; WTI was just under $100 on Oct 7.
4. **Comment keyword spelling** at ~6:24 in the edit (see above).

## Exact commands

```
python3 plan.py                                                   # cut list, beat sheet, captions, framing
node scenes/render.js <frames> 4                                  # graphics layer, 11,776 frames
python3 composite.py best_one.mp4 <frames> <chunks> 4             # picture (libx264 -preset medium -crf 18 -pix_fmt yuv420p)
python3 audio.py best_one.mp4 mix.wav                             # voice on cut timeline + clicks, 2-pass loudnorm I=-14 TP=-1.5
ffmpeg -f concat -i <chunks>/chunks.txt -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest best_one_purple_1080p.mp4
```
