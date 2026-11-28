# Glass UI Explainer edit pipeline

Turns a talking-head take into a finished "Glass UI Explainer" video: dark
glass UI inserts, luxury B-roll, presenter camera moves, calculator and phone
scenes, UI sound design and a broadcast-loudness mix. Everything is code, so
an edit can be re-rendered from the beat sheet.

| File | Role |
|---|---|
| `transcript.json` | Word-level transcript of the take (faster-whisper) |
| `beats.py` → `beats.json`, `BEAT_SHEET.md`, `scenes/beats.js` | Beat sheet: timing, scene type, camera keys, overlays, transitions |
| `scenes/engine.*`, `scenes/common.js` | Deterministic motion engine and Glass UI kit |
| `scenes/glass.js` | One full-screen scene per `GLASS_UI` beat |
| `scenes/overlays.js` | Presenter overlays: side cards, stickers, calculators, phone app, framed-layout content |
| `scenes/render.js` | Renders scenes to frame sequences with headless Chromium |
| `prep_broll.py` | Grades B-roll into frame sequences |
| `composite.py` | Assembles picture: avatar camera, slides, framed card, transitions, grain, H.264 |
| `sfx.py`, `mix.sh` | UI sound layer, music bed, voice cleanup, ducking, −14 LUFS |
| `EDIT_LOG.md` | Judgment calls, tools used, QC results |

Fonts: Inter and Poppins (SIL Open Font License) in `scenes/fonts/`.
