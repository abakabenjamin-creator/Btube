# monk1 clean cut — approved edit list

Source: `monk 1.mp4` (19:05, phone screen-recording of YouTube, 1080×2406, video area cropped at 860×484 @ x110,y960).
Output: `monk1_clean.mp4` — 18:01.29, 1920×1080, 30 fps, H.264 CRF 18 + AAC 192k.

## Removed (source timecodes)
| ID | From | To | Length | What |
|---|---|---|---|---|
| R1 | 0:00.00 | 0:07.95 | 7.95 s | Android home screen + YouTube watch page (video still in PiP) |
| R2 | 5:14.60 | 5:36.40 | 21.80 s | **AD — AdOutreach "19-page YT ads strategy"** + 7 s silence + replayed line |
| R3 | 10:08.80 | 10:19.60 | 10.80 s | **AD — "Meet Grok Bot" (xAI)** + sponsored bar + replayed line |
| R6 | 16:00.50 | 16:17.50 | 17.00 s | Creator's plug for his separate judgment video |
| R4 | 18:11.30 | 18:13.10 | 1.80 s | Player UI scrub back to start + silence |
| R5 | 19:00.60 | 19:05.46 | 4.86 s | "Stop sharing screen?" dialog / recording end |

## Kept, in output order
| # | Source in → out | Clean timeline | Content |
|---|---|---|---|
| 1 | 18:13.10 → 19:00.60 | 00:00.00 → 00:47.50 | Video's real intro/hook (moved to front) |
| 2 | 0:07.95 → 5:14.60 | 00:47.50 → 05:54.15 | Self-trust → Failing (up to ad 1) |
| 3 | 5:36.40 → 10:08.80 | 05:54.15 → 10:26.55 | Cheat code 3 → Selling → Build others |
| 4 | 10:19.60 → 16:00.50 | 10:26.55 → 16:07.45 | Build others → Financial literacy → Judgment |
| 5 | 16:17.50 → 18:11.30 | 16:07.45 → 18:01.29 | Gut feeling → meta skill → close |

## Known residue (kept by choice: real frames, no freezes)
- 00:00.0–00:02.6 and 00:38.5–00:41.0: YouTube player controls over intro footage.
- 05:52.1–05:54.1 and 10:11.5–10:26.5: YouTube "We'll be right back" chip (bottom-right).
- 05:54.2–05:55.6: "My Ad Center / Dismiss" menu over the Cheat-code #3 card.
- ~0.15 s of YouTube's pre-ad dim at 05:54 and 10:26 joins.
- Recorder timecode bubble (bottom-centre) throughout.
- Gap: the recording never captured the part between the hook's "three relationships…" and "What gets built is your self-trust".

Rebuild: `python3 build/export_clean.py build/edl.json "src/monk 1.mp4" monk1_clean.mp4`
